import express from "express";
import { analyzePullRequest } from "../../controllers/pr/prController.js";
import { handleWebhook } from "../../controllers/webhooks/githubWebhookController.js";

const router = express.Router();

router.post("/pr", analyzePullRequest);

// Middleware to capture raw body for GitHub webhook signature verification
// CRITICAL: Must use express.raw() to get the exact bytes for signature verification
router.post("/", express.raw({ type: "application/json" }), (req, res, next) => {
    console.log("[githubRouter] Webhook received");
    console.log("[githubRouter] Headers:", {
        event: req?.headers?.["x-github-event"],
        signature: req?.headers?.["x-hub-signature-256"]?.substring(0, 20) + "...",
        delivery: req?.headers?.["x-github-delivery"],
    });
    
    // CRITICAL: Preserve the exact raw bytes for signature verification
    // GitHub signs the exact request body bytes, so we must not modify them
    if (!Buffer.isBuffer(req.body)) {
        console.error("[githubRouter] ERROR: req.body is not a Buffer! Type:", typeof req.body);
        req.rawBody = "";
    } else {
        req.rawBody = req.body.toString("utf8");
    }
    
    console.log("[githubRouter] Raw body length:", req.rawBody?.length);
    console.log("[githubRouter] Raw body preview:", req.rawBody?.substring(0, 100));
    console.log("[githubRouter] Raw body type:", typeof req.rawBody);
    
    try {
        const parsed = JSON.parse(req.rawBody || "{}");
        req.body = parsed;
        console.log("[githubRouter] Parsed body successfully");
    } catch (err) {
        console.error("[githubRouter] Failed to parse body:", err?.message);
        req.body = {};
    }
    return handleWebhook(req, res, next);
});

export default router;
