import express from "express";
import { analyzePullRequest } from "../../controllers/pr/prController.js";
import { handleWebhook } from "../../controllers/webhooks/githubWebhookController.js";

const router = express.Router();

router.post("/pr", analyzePullRequest);
router.post("/", express.raw({ type: "*/*" }), (req, res, next) => {
    req.rawBody = req.body?.length ? req.body.toString() : "";
    try {
        const parsed = JSON.parse(req.rawBody || "{}");
        req.body = parsed;
    } catch {
        req.body = {};
    }
    return handleWebhook(req, res, next);
});

export default router;
