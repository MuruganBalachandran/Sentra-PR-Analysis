import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { verifySignature, fetchPRDiff, postPRComment } from "../../services/github/githubService.js";
import { getRepoByFullName, getContextForRepo } from "../../services/context/contextService.js";
import { buildRiskAnalysisPrompt, buildPrCommentPrompt } from "../../services/sentra/promptBuilder.js";
import { generateText } from "../../services/llm/llmService.js";
import { PRAnalysis, Repository } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";

const handleWebhook = async (req = {}, res = {}) => {
  try {
    const signature = req?.headers?.["x-hub-signature-256"] || "";
    const event = req?.headers?.["x-github-event"] || "";
    const payloadRaw = req?.rawBody || JSON.stringify(req?.body || {});
    const valid = verifySignature(signature, payloadRaw);
    if (!valid) {
      return sendResponse(res, STATUS_CODE?.UNAUTHORIZED || 401, RESPONSE_STATUS?.FAILURE || "FAILURE", "Invalid signature");
    }
    if (event !== "pull_request") {
      return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Event ignored");
    }
    const action = req?.body?.action || "";
    if (!["opened", "synchronize", "reopened"].includes(action)) {
      return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Action ignored");
    }
    const pull = req?.body?.pull_request || {};
    const repository = req?.body?.repository || {};
    const owner = repository?.owner?.login || "";
    const repo = repository?.name || "";
    const fullName = repository?.full_name || "";
    const number = pull?.number || 0;
    const title = pull?.title || "";
    const description = pull?.body || "";
    let repoDoc = await getRepoByFullName(fullName);
    if (!repoDoc) {
      repoDoc = await Repository.create({
        owner,
        name: repo,
        full_name: fullName,
        github_id: repository?.id,
        default_branch: repository?.default_branch || "main",
        summary: "",
      });
    }
    const context = await getContextForRepo(repoDoc);
    const diff = await fetchPRDiff(owner, repo, number);
    const riskPrompt = buildRiskAnalysisPrompt({
      repoSummary: context?.repo_summary,
      criticalModules: context?.critical_modules,
      ownershipMap: context?.ownership_map,
      fragileModules: context?.fragile_modules,
      dependencyGraph: context?.dependency_graph,
      prTitle: title,
      prDescription: description,
      changedFiles: [],
      codeDiff: diff,
    });
    const riskAnalysis = await generateText(riskPrompt);
    const commentPrompt = buildPrCommentPrompt(riskAnalysis);
    const commentBody = await generateText(commentPrompt);
    await PRAnalysis.findOneAndUpdate(
      { Repo_Id: repoDoc._id, pr_number: number },
      {
        $set: {
          owner,
          repo,
          title,
          risk_analysis: riskAnalysis,
          pr_comment: commentBody,
        },
      },
      { upsert: true, new: true }
    );
    await postPRComment(owner, repo, number, commentBody);
    try {
      await createActivityLog({
        Email: req?.headers?.["x-github-delivery"] || "github",
        Action: "POST",
        URL: "/api/webhooks/github",
        Status: 200,
        IP: req?.ip || "",
        Duration: "",
        Activity: `Processed PR #${number} for ${fullName}`,
      });
    } catch { }
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Processed pull_request");
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Webhook failed");
  }
};

export { handleWebhook };
