import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { verifySignature, fetchPRDiff, postPRComment, deletePRComment } from "../../services/github/githubService.js";
import { getRepoByFullName, getContextForRepo } from "../../services/context/contextService.js";
import { buildRiskAnalysisPrompt, buildPrCommentPrompt } from "../../services/sentra/promptBuilder.js";
import { generateText } from "../../services/llm/llmService.js";
import { PRAnalysis, Repository, MonitoredRepository, User } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";
import { sendPRAnalysisEmail } from "../../services/email/emailService.js";

const SEVERITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 };

const meetsSeverityThreshold = (severity, threshold) => {
  const rank = SEVERITY_RANK[severity?.toLowerCase()] ?? 0;
  const minRank = SEVERITY_RANK[threshold?.toLowerCase()] ?? 0;
  return rank >= minRank;
};

// region handle PR merged — delete Sentra comment from GitHub
const handlePRMerged = async (owner, repo, fullName, number, userGithubToken) => {
  try {
    // Find the saved analysis to get the comment ID
    const repoDoc = await getRepoByFullName(fullName);
    if (!repoDoc) return;

    const analysis = await PRAnalysis.findOne({ Repo_Id: repoDoc._id, pr_number: number });
    if (!analysis?.github_comment_id) {
      console.log(`[WEBHOOK] No comment to delete for PR #${number}`);
      return;
    }

    await deletePRComment(owner, repo, analysis.github_comment_id, userGithubToken);
    console.log(`[WEBHOOK] ✅ Deleted Sentra comment ${analysis.github_comment_id} from PR #${number} (merged)`);

    // Clear the comment ID from DB
    await PRAnalysis.findByIdAndUpdate(analysis._id, { $set: { github_comment_id: null } });
  } catch (err) {
    console.warn(`[WEBHOOK] Failed to delete comment on merge: ${err?.message}`);
  }
};
// endregion

const handleWebhook = async (req = {}, res = {}) => {
  try {
    const signature = req?.headers?.["x-hub-signature-256"] || "";
    const event = req?.headers?.["x-github-event"] || "";
    const delivery = req?.headers?.["x-github-delivery"] || "";
    const payloadRaw = req?.rawBody || JSON.stringify(req?.body || {});

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[WEBHOOK] Event: ${event} | Delivery: ${delivery}`);

    const valid = verifySignature(signature, payloadRaw);
    if (!valid) {
      console.error("[WEBHOOK] ❌ Signature verification failed");
      return sendResponse(res, STATUS_CODE.UNAUTHORIZED, RESPONSE_STATUS.FAILURE, "Invalid signature");
    }
    console.log("[WEBHOOK] ✅ Signature verified");

    if (event !== "pull_request") {
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_STATUS.SUCCESS, "Event ignored");
    }

    const action = req?.body?.action || "";
    const pull = req?.body?.pull_request || {};
    const repository = req?.body?.repository || {};
    const owner = repository?.owner?.login || "";
    const repo = repository?.name || "";
    const fullName = repository?.full_name || "";
    const number = pull?.number || 0;
    const title = pull?.title || "";
    const description = pull?.body || "";
    const merged = pull?.merged === true;

    console.log(`[WEBHOOK] Action: ${action} | PR: ${fullName}#${number} | merged: ${merged}`);

    // Handle merged PR — delete the Sentra comment
    if (action === "closed" && merged) {
      const monitoredRepo = await MonitoredRepository.findOne({ full_name: fullName, enabled: true });
      if (monitoredRepo) {
        const monitoringUser = await User.findOne({ User_Id: monitoredRepo.User_Id }).select("github_token");
        if (monitoringUser?.github_token) {
          await handlePRMerged(owner, repo, fullName, number, monitoringUser.github_token);
        }
      }
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_STATUS.SUCCESS, "PR merged — comment cleaned up");
    }

    // Only analyze on opened / synchronize / reopened
    if (!["opened", "synchronize", "reopened"].includes(action)) {
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_STATUS.SUCCESS, "Action ignored");
    }

    // Check if monitored
    const monitoredRepo = await MonitoredRepository.findOne({ full_name: fullName, enabled: true });
    if (!monitoredRepo) {
      console.log(`[WEBHOOK] ${fullName} is not monitored`);
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_STATUS.SUCCESS, "Repository not monitored");
    }

    const settings = monitoredRepo.settings || {};
    const postComment   = settings.post_comment   !== false;
    const sendEmail     = settings.send_email     !== false;
    const threshold     = settings.severity_threshold || "low";

    // Get user + GitHub token + email
    const monitoringUser = await User.findOne({ User_Id: monitoredRepo.User_Id }).select("github_token Email");
    const userGithubToken = monitoringUser?.github_token || "";
    const userEmail = monitoringUser?.Email || "";

    if (!userGithubToken) {
      console.error("[WEBHOOK] ❌ User GitHub token not found");
      return sendResponse(res, STATUS_CODE.INTERNAL_SERVER_ERROR, RESPONSE_STATUS.FAILURE, "User GitHub token not found");
    }

    // Upsert repository document
    let repoDoc = await getRepoByFullName(fullName);
    if (!repoDoc) {
      repoDoc = await Repository.create({
        owner, name: repo, full_name: fullName,
        github_id: repository?.id,
        default_branch: repository?.default_branch || "main",
        summary: "",
      });
    }

    // Fetch context + diff
    const context = await getContextForRepo(repoDoc);
    let diff = "";
    try {
      diff = await fetchPRDiff(owner, repo, number, userGithubToken);
      console.log(`[WEBHOOK] Diff: ${diff.length} bytes`);
    } catch (diffErr) {
      console.warn(`[WEBHOOK] Diff fetch failed: ${diffErr?.message}`);
      diff = `PR #${number}: ${title}\n\n${description}`;
    }

    // Run AI analysis
    console.log("[WEBHOOK] Running AI analysis...");
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

    const riskAnalysis = await generateText(riskPrompt);
    const prComment = await generateText(buildPrCommentPrompt(riskAnalysis));

    // Detect severity
    const lower = riskAnalysis.toLowerCase();
    const severity = /\bcritical\b/.test(lower) ? "Critical"
      : /\bhigh\b/.test(lower) ? "High"
        : /\bmedium\b/.test(lower) ? "Medium"
          : "Low";

    console.log(`[WEBHOOK] Severity: ${severity}`);

    const aboveThreshold = meetsSeverityThreshold(severity, threshold);

    // Always save to Sentra DB
    await PRAnalysis.findOneAndUpdate(
      { Repo_Id: repoDoc._id, pr_number: number },
      {
        $set: {
          User_Id: monitoredRepo.User_Id,
          owner, repo, title,
          risk_analysis: riskAnalysis,
          pr_comment: prComment,
          severity,
          analysis_type: "webhook",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("[WEBHOOK] ✅ Analysis saved to Sentra");

    // Post comment and store its ID so we can delete it on merge
    if (postComment && aboveThreshold) {
      try {
        const commentData = await postPRComment(owner, repo, number, prComment, userGithubToken);
        const commentId = commentData?.id || null;
        if (commentId) {
          await PRAnalysis.findOneAndUpdate(
            { Repo_Id: repoDoc._id, pr_number: number },
            { $set: { github_comment_id: commentId } }
          );
          console.log(`[WEBHOOK] ✅ Comment posted (ID: ${commentId})`);
        }
      } catch (commentErr) {
        console.warn(`[WEBHOOK] Comment post failed: ${commentErr?.message}`);
      }
    } else if (!postComment) {
      console.log("[WEBHOOK] post_comment is OFF — skipping GitHub comment");
    } else {
      console.log(`[WEBHOOK] Severity ${severity} below threshold ${threshold} — skipping comment`);
    }

    // Send email if enabled and above threshold
    if (sendEmail && userEmail && aboveThreshold) {
      try {
        await sendPRAnalysisEmail(userEmail, {
          repoFullName: fullName,
          prNumber: number,
          prTitle: title,
          severity,
          riskSummary: riskAnalysis,
        });
        console.log(`[WEBHOOK] ✅ Email sent to ${userEmail}`);
      } catch (emailErr) {
        console.warn(`[WEBHOOK] Email failed: ${emailErr?.message}`);
      }
    }

    // Update monitored repo stats
    await MonitoredRepository.findByIdAndUpdate(monitoredRepo._id, {
      $set: { last_analysis_at: new Date() },
      $inc: { pr_count: 1 },
    });

    try {
      await createActivityLog({
        Email: userEmail || "github",
        Action: "POST",
        URL: "/api/webhooks/github",
        Status: 200,
        IP: req?.ip || "",
        Duration: "",
        Activity: `Analyzed PR #${number} for ${fullName} — ${severity}`,
      });
    } catch { /* non-fatal */ }

    console.log(`[WEBHOOK] ✅ Complete — PR #${number} ${fullName}`);
    console.log(`${"=".repeat(60)}\n`);

    return sendResponse(res, STATUS_CODE.OK, RESPONSE_STATUS.SUCCESS, "Processed pull_request");
  } catch (err) {
    console.error("[WEBHOOK] ❌ Error:", err?.message);
    console.error(err?.stack);
    return sendResponse(res, STATUS_CODE.INTERNAL_SERVER_ERROR, RESPONSE_STATUS.FAILURE, err?.message || "Webhook failed");
  }
};

export { handleWebhook };
