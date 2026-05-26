import express from "express";
import { auth } from "../../middleware/index.js";
import {
    getAvailableRepositories,
    addMonitoredRepository,
    getMonitoredRepositories,
    removeMonitoredRepository,
    updateMonitoredRepositorySettings,
} from "../../controllers/repos/reposController.js";

const router = express.Router();

/**
 * GET /api/repos/available
 * Get all available repositories for the user to monitor
 * Requires authentication
 */
router.get("/available", auth(), getAvailableRepositories);

/**
 * GET /api/repos
 * Get all repositories currently monitored by the user
 * Requires authentication
 */
router.get("/", auth(), getMonitoredRepositories);

/**
 * POST /api/repos
 * Add a new repository to monitoring
 * Requires authentication
 * Body: { full_name, owner, repo, is_private, repository_url, github_repo_id }
 */
router.post("/", auth(), addMonitoredRepository);

/**
 * PUT /api/repos/:repoId
 * Update settings for a monitored repository
 * Requires authentication
 * Body: { settings: {...}, enabled: boolean }
 */
router.put("/:repoId", auth(), updateMonitoredRepositorySettings);

/**
 * DELETE /api/repos/:repoId
 * Remove a repository from monitoring
 * Requires authentication
 */
router.delete("/:repoId", auth(), removeMonitoredRepository);

export { router as reposRouter };
