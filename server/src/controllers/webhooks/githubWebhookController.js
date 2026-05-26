import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { verifySignature, fetchPRDiff, postPRComment } from "../../services/github/githubService.js";
import { getRepoByFullName, getContextForRepo } from "../../services/context/contextService.js";
import { buildRiskAnalysisPrompt, buildPrCommentPrompt } from "../../services/sentra/promptBuilder.js";
import { generateText } from "../../services/llm/llmService.js";
import { PRAnalysis, Repository, MonitoredRepository, User } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";

const handleWebhook = async (req = {}, res = {}) => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("[WEBHOOK] ========== WEBHOOK RECEIVED ==========");
    console.log("=".repeat(80));
    
    const signature = req?.headers?.["x-hub-signature-256"] || "";
    const event = req?.headers?.["x-github-event"] || "";
    const delivery = req?.headers?.["x-github-delivery"] || "";
    const payloadRaw = req?.rawBody || JSON.stringify(req?.body || {});
    
    console.log(`[WEBHOOK] Event Type: ${event}`);
    console.log(`[WEBHOOK] Delivery ID: ${delivery}`);
    console.log(`[WEBHOOK] Signature: ${signature.substring(0, 20)}...`);
    console.log(`[WEBHOOK] Payload Size: ${payloadRaw.length} bytes`);
    
    const valid = verifySignature(signature, payloadRaw);
    console.log(`[WEBHOOK] Signature Valid: ${valid}`);
    
    if (!valid) {
      console.error("[WEBHOOK] ❌ SIGNATURE VERIFICATION FAILED");
      return sendResponse(res, STATUS_CODE?.UNAUTHORIZED || 401, RESPONSE_STATUS?.FAILURE || "FAILURE", "Invalid signature");
    }
    
    console.log("[WEBHOOK] ✅ Signature verified");
    
    if (event !== "pull_request") {
      console.log(`[WEBHOOK] ⏭️  Event type not pull_request, ignoring: ${event}`);
      return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Event ignored");
    }
    
    const action = req?.body?.action || "";
    console.log(`[WEBHOOK] PR Action: ${action}`);
    
    if (!["opened", "synchronize", "reopened"].includes(action)) {
      console.log(`[WEBHOOK] ⏭️  Action not in trigger list, ignoring: ${action}`);
      return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Action ignored");
    }
    
    console.log("[WEBHOOK] ✅ Action is triggerable");
    
    const pull = req?.body?.pull_request || {};
    const repository = req?.body?.repository || {};
    const owner = repository?.owner?.login || "";
    const repo = repository?.name || "";
    const fullName = repository?.full_name || "";
    const number = pull?.number || 0;
    const title = pull?.title || "";
    const description = pull?.body || "";

    console.log(`[WEBHOOK] PR Details:`);
    console.log(`  - Repository: ${fullName}`);
    console.log(`  - PR Number: #${number}`);
    console.log(`  - Title: ${title}`);
    console.log(`  - Owner: ${owner}`);
    console.log(`  - Repo: ${repo}`);

    console.log(`[WEBHOOK] Checking if repository is monitored...`);
    // Check if this repository is being monitored by any user
    const monitoredRepo = await MonitoredRepository.findOne({
      full_name: fullName,
      enabled: true,
    });

    if (!monitoredRepo) {
      console.log(`[WEBHOOK] ❌ Repository ${fullName} is NOT being monitored`);
      console.log(`[WEBHOOK] Searching for any monitored repos with this name...`);
      const allMonitored = await MonitoredRepository.find({ full_name: fullName });
      console.log(`[WEBHOOK] Found ${allMonitored.length} records for ${fullName}`);
      allMonitored.forEach((m, i) => {
        console.log(`  [${i}] User: ${m.User_Id}, Enabled: ${m.enabled}`);
      });
      return sendResponse(
        res,
        STATUS_CODE?.OK || 200,
        RESPONSE_STATUS?.SUCCESS || "SUCCESS",
        "Repository not monitored"
      );
    }

    console.log(`[WEBHOOK] ✅ Repository is monitored`);
    console.log(`[WEBHOOK] Monitored by User ID: ${monitoredRepo?.User_Id}`);
    console.log(`[WEBHOOK] Webhook ID: ${monitoredRepo?.github_webhook_id}`);

    console.log(`[WEBHOOK] Fetching user GitHub token...`);
    const monitoringUser = await User.findOne({ User_Id: monitoredRepo?.User_Id }).select("github_token");
    const userGithubToken = monitoringUser?.github_token || "";

    if (!userGithubToken) {
      console.error("[WEBHOOK] ❌ User GitHub token not found");
      console.error(`[WEBHOOK] User ID: ${monitoredRepo?.User_Id}`);
      console.error(`[WEBHOOK] User found: ${!!monitoringUser}`);
      return sendResponse(
        res,
        STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
        RESPONSE_STATUS?.FAILURE || "FAILURE",
        "User GitHub token not found"
      );
    }

    console.log(`[WEBHOOK] ✅ User GitHub token found`);
    console.log(`[WEBHOOK] Token type: ${userGithubToken.substring(0, 10)}...`);
    console.log(`[WEBHOOK] Starting PR analysis...`);

    try {
      // Repository is monitored, proceed with analysis
      console.log(`[WEBHOOK] Step 1: Fetching/Creating repository document...`);
      let repoDoc = await getRepoByFullName(fullName);
      if (!repoDoc) {
        console.log(`[WEBHOOK]   Creating new repository document for ${fullName}`);
        repoDoc = await Repository.create({
          owner,
          name: repo,
          full_name: fullName,
          github_id: repository?.id,
          default_branch: repository?.default_branch || "main",
          summary: "",
        });
        console.log(`[WEBHOOK]   ✅ Repository created with ID: ${repoDoc._id}`);
      } else {
        console.log(`[WEBHOOK]   ✅ Repository found with ID: ${repoDoc._id}`);
      }
      
      console.log(`[WEBHOOK] Step 2: Fetching repository context...`);
      const context = await getContextForRepo(repoDoc);
      console.log(`[WEBHOOK]   ✅ Context fetched`);
      console.log(`[WEBHOOK]   - Repo Summary: ${context?.repo_summary ? "yes" : "no"}`);
      console.log(`[WEBHOOK]   - Critical Modules: ${context?.critical_modules ? "yes" : "no"}`);
      
      console.log(`[WEBHOOK] Step 3: Fetching PR diff...`);
      let diff = "";
      try {
        diff = await fetchPRDiff(owner, repo, number, userGithubToken);
        console.log(`[WEBHOOK]   ✅ Diff fetched: ${diff.length} bytes`);
      } catch (diffErr) {
        console.warn(`[WEBHOOK]   ⚠️  Failed to fetch diff: ${diffErr?.message}`);
        diff = `PR #${number}: ${title}\n\n${description}`;
        console.log(`[WEBHOOK]   Using fallback diff: ${diff.length} bytes`);
      }
      
      console.log(`[WEBHOOK] Step 4: Building risk analysis prompt...`);
      const riskPrompt = buildRiskAnalysisPrompt({
        repoSummary: context?.repo_summary || `Repository: ${fullName}`,
        criticalModules: context?.critical_modules || "",
        ownershipMap: context?.ownership_map || {},
        fragileModules: context?.fragile_modules || [],
        dependencyGraph: context?.dependency_graph || {},
        prTitle: title,
        prDescription: description,
        changedFiles: [],
        codeDiff: diff,
      });
      console.log(`[WEBHOOK]   ✅ Prompt built: ${riskPrompt.length} chars`);
      
      console.log(`[WEBHOOK] Step 5: Calling Gemini AI for risk analysis...`);
      const riskAnalysis = await generateText(riskPrompt);
      console.log(`[WEBHOOK]   ✅ Risk analysis generated: ${riskAnalysis.length} chars`);
      console.log(`[WEBHOOK]   Preview: ${riskAnalysis.substring(0, 100)}...`);
      
      console.log(`[WEBHOOK] Step 6: Building PR comment prompt...`);
      const commentPrompt = buildPrCommentPrompt(riskAnalysis);
      console.log(`[WEBHOOK]   ✅ Comment prompt built: ${commentPrompt.length} chars`);
      
      console.log(`[WEBHOOK] Step 7: Calling Gemini AI for comment generation...`);
      const commentBody = await generateText(commentPrompt);
      console.log(`[WEBHOOK]   ✅ Comment generated: ${commentBody.length} chars`);
      console.log(`[WEBHOOK]   Preview: ${commentBody.substring(0, 100)}...`);
      
      // Detect severity
      const lower = riskAnalysis.toLowerCase();
      const severity = lower.includes("high") ? "High"
        : lower.includes("medium") ? "Medium"
          : lower.includes("low") ? "Low"
            : "Low";
      console.log(`[WEBHOOK]   Severity: ${severity}`);
      
      console.log(`[WEBHOOK] Step 8: Saving PR analysis to database...`);
      const savedAnalysis = await PRAnalysis.findOneAndUpdate(
        { Repo_Id: repoDoc._id, pr_number: number },
        {
          $set: {
            owner,
            repo,
            title,
            risk_analysis: riskAnalysis,
            pr_comment: commentBody,
            severity,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[WEBHOOK]   ✅ PR analysis saved with ID: ${savedAnalysis._id}`);
      
      console.log(`[WEBHOOK] Step 9: Posting comment to GitHub PR...`);
      try {
        await postPRComment(owner, repo, number, commentBody, userGithubToken);
        console.log(`[WEBHOOK]   ✅ Comment posted to PR #${number}`);
      } catch (commentErr) {
        console.warn(`[WEBHOOK]   ⚠️  Failed to post comment: ${commentErr?.message}`);
        console.warn(`[WEBHOOK]   Error details: ${commentErr?.toString()}`);
        // Continue - analysis is still saved
      }
    } catch (analysisErr) {
      console.error("[WEBHOOK] ❌ ANALYSIS ERROR");
      console.error(`[WEBHOOK] Error: ${analysisErr?.message}`);
      console.error(`[WEBHOOK] Stack: ${analysisErr?.stack}`);
      throw analysisErr;
    }

    // Update monitored repo stats
    console.log(`[WEBHOOK] Step 10: Updating monitored repository stats...`);
    await MonitoredRepository.findByIdAndUpdate(
      monitoredRepo?._id,
      {
        $set: {
          last_analysis_at: new Date(),
        },
        $inc: {
          pr_count: 1,
        },
      }
    );
    console.log(`[WEBHOOK]   ✅ Stats updated`);

    try {
      console.log(`[WEBHOOK] Step 11: Creating activity log...`);
      await createActivityLog({
        Email: req?.headers?.["x-github-delivery"] || "github",
        Action: "POST",
        URL: "/api/webhooks/github",
        Status: 200,
        IP: req?.ip || "",
        Duration: "",
        Activity: `Processed PR #${number} for ${fullName}`,
      });
      console.log(`[WEBHOOK]   ✅ Activity logged`);
    } catch (logErr) {
      console.warn(`[WEBHOOK]   ⚠️  Activity log failed: ${logErr?.message}`);
    }
    
    console.log(`[WEBHOOK] ✅ WEBHOOK PROCESSING COMPLETE`);
    console.log(`[WEBHOOK] Successfully processed PR #${number} for ${fullName}`);
    console.log("=".repeat(80) + "\n");
    
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Processed pull_request");
  } catch (err) {
    console.error("\n" + "=".repeat(80));
    console.error("[WEBHOOK] ❌ WEBHOOK HANDLER ERROR");
    console.error("=".repeat(80));
    console.error(`[WEBHOOK] Error Message: ${err?.message}`);
    console.error(`[WEBHOOK] Error Type: ${err?.constructor?.name}`);
    console.error(`[WEBHOOK] Stack Trace:`);
    console.error(err?.stack);
    console.error("=".repeat(80) + "\n");
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Webhook failed");
  }
};

export { handleWebhook };
