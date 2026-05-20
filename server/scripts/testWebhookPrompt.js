const url = "http://localhost:3000/api/webhooks/github/pr";
const body = {
  repo_summary: "Test repo",
  critical_modules: ["auth", "payments"],
  ownership_map: { auth: "security-team" },
  fragile_modules: ["payments"],
  dependency_graph: { auth: ["users"] },
  pr_title: "Update webhook handling",
  pr_description: "Fix signature validation",
  changed_files: ["server/src/controllers/webhooks/githubWebhookController.js"],
  code_diff: "diff --git a/file b/file",
};
(async () => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log("WEBHOOK PROMPT status:", res.status);
    console.log(text);
    process.exit(0);
  } catch (err) {
    console.error("WEBHOOK PROMPT error:", err?.message || err);
    process.exit(1);
  }
})();
