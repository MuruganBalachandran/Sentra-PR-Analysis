import express from "express";
import { analyzePullRequest } from "../../controllers/pr/prController.js";
import { handleWebhook } from "../../controllers/webhooks/githubWebhookController.js";

const router = express.Router();

router.post("/pr", analyzePullRequest);

// Raw body is already captured as a Buffer by app.js middleware
// Extract it here and attach as req.rawBody for signature verification
router.post("/", (req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString("utf8");
    try {
      req.body = JSON.parse(req.rawBody);
    } catch {
      req.body = {};
    }
  } else if (typeof req.body === "string") {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.rawBody);
    } catch {
      req.body = {};
    }
  } else {
    // Fallback — body already parsed, stringify it back for signature (will fail verification)
    req.rawBody = JSON.stringify(req.body || {});
  }
  return handleWebhook(req, res, next);
});

export default router;
