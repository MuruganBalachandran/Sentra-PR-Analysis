import express from "express";
import { auth } from "../../middleware/index.js";
import {
    getGitHubAuthUrl,
    handleGitHubCallback,
    getGitHubStatus,
    disconnectGitHub,
    connectGitHubWithPat,
    handleGitHubCallbackGet,
} from "../../controllers/auth/githubAuthController.js";

const router = express.Router();

/**
 * GET /api/auth/github/authorize
 * Get GitHub OAuth authorization URL
 * Requires authentication
 */
router.get("/authorize", auth(), getGitHubAuthUrl);

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback via browser redirect
 * Requires authentication
 * Query: { code: string }
 */
router.get("/callback", handleGitHubCallbackGet);

/**
 * POST /api/auth/github/callback
 * Handle GitHub OAuth callback (alternative method)
 * Requires authentication
 * Query: { code: string }
 */
router.post("/callback", auth(), handleGitHubCallback);

/**
 * POST /api/auth/github/pat
 * Connect GitHub account via Personal Access Token
 * Requires authentication
 * Body: { pat: string }
 */
router.post("/pat", auth(), connectGitHubWithPat);

/**
 * GET /api/auth/github/status
 * Get GitHub connection status
 * Requires authentication
 */
router.get("/status", auth(), getGitHubStatus);

/**
 * DELETE /api/auth/github
 * Disconnect GitHub account
 * Requires authentication
 */
router.delete("/", auth(), disconnectGitHub);

export { router as githubAuthRouter };
