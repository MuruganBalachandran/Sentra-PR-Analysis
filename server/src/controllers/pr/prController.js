import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { buildRiskAnalysisPrompt, buildPrCommentPrompt } from "../../services/sentra/promptBuilder.js";
import { generateText } from "../../services/llm/llmService.js";
import { PRAnalysis, Repository } from "../../models/index.js";

const analyzePullRequest = async (req = {}, res = {}) => {
  try {
    const body = req?.body || {};

    // Repo identity — parse full_name OR construct from owner+repo
    let fullName = (body?.full_name || "").trim();
    let owner = (body?.owner || "").trim();
    let repo = (body?.repo || "").trim();

    // If full_name given but not owner/repo, parse them
    if (fullName && fullName.includes("/") && (!owner || !repo)) {
      [owner, repo] = fullName.split("/");
    }
    // If owner+repo given but not full_name, build it
    if (!fullName && owner && repo) {
      fullName = `${owner}/${repo}`;
    }
    // If still nothing, use a placeholder so the analysis is always saved
    if (!fullName) {
      owner = "manual";
      repo = "analysis";
      fullName = "manual/analysis";
    }

    let prNumber = Number(body?.pr_number) || 0;

    // If no pr_number provided, auto-assign next available for this repo
    // We'll resolve this after we have repoDoc below

    const ctx = {
      repoSummary: body?.repo_summary,
      criticalModules: body?.critical_modules,
      ownershipMap: body?.ownership_map,
      fragileModules: body?.fragile_modules,
      dependencyGraph: body?.dependency_graph,
      prTitle: body?.pr_title,
      prDescription: body?.pr_description,
      changedFiles: body?.changed_files,
      codeDiff: body?.code_diff,
    };

    // Build prompts & call LLM
    const riskAnalysisPrompt = buildRiskAnalysisPrompt(ctx);
    const riskAnalysis = await generateText(riskAnalysisPrompt);
    const prCommentPrompt = buildPrCommentPrompt(riskAnalysis);
    const prComment = await generateText(prCommentPrompt);

    // Detect severity from LLM text
    const lower = riskAnalysis.toLowerCase();
    const severity = lower.includes("high") ? "High"
      : lower.includes("medium") ? "Medium"
        : lower.includes("low") ? "Low"
          : "Low";

    // ── Save to DB ────────────────────────────────────────────────────────
    try {
      // Upsert repository
      let repoDoc = await Repository.findOne({ full_name: fullName }).lean();
      if (!repoDoc) {
        repoDoc = await Repository.create({
          owner,
          name: repo,
          full_name: fullName,
          summary: body?.repo_summary || "",
        });
        console.log(`[Sentra] Created repo: ${fullName}`);
      }

      const repoObjectId = repoDoc._id;

      // Auto-assign pr_number if not provided
      if (!prNumber) {
        const count = await PRAnalysis.countDocuments({ Repo_Id: repoObjectId });
        prNumber = count + 1;
      }

      // Upsert PRAnalysis
      await PRAnalysis.findOneAndUpdate(
        { Repo_Id: repoObjectId, pr_number: prNumber },
        {
          $set: {
            User_Id: req.user?.User_Id || "",
            owner,
            repo,
            title: body?.pr_title || `Analysis #${prNumber}`,
            risk_analysis: riskAnalysis,
            pr_comment: prComment,
            severity,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Sentra] Saved PR analysis: ${fullName}#${prNumber}`);
    } catch (dbErr) {
      console.error("[Sentra] DB save error:", dbErr?.message);
      // Non-fatal — still return the analysis
    }

    return sendResponse(
      res,
      STATUS_CODE?.OK || 200,
      RESPONSE_STATUS?.SUCCESS || "SUCCESS",
      "PR analysis complete",
      { riskAnalysis, prComment, severity, riskAnalysisPrompt, prCommentPrompt }
    );
  } catch (err) {
    console.error("PR analysis error:", err?.message);
    return sendResponse(
      res,
      STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
      RESPONSE_STATUS?.FAILURE || "FAILURE",
      err?.message || "Failed to analyze pull request"
    );
  }
};

export { analyzePullRequest };
