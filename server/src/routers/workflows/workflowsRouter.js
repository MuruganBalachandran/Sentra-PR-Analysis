import express from "express";
import { auth } from "../../middleware/index.js";
import {
    getWorkflowTemplates,
    getRepositoryWorkflows,
    getWorkflowRunsController,
    triggerWorkflowController,
    createWorkflowController,
    deleteWorkflowController,
    cancelWorkflowRunController,
    rerunWorkflowController,
} from "../../controllers/workflows/workflowsController.js";

const router = express.Router();

/**
 * GET /api/workflows/templates
 * Get all available workflow templates
 * Requires authentication
 */
router.get("/templates", auth(), getWorkflowTemplates);

/**
 * GET /api/workflows/:owner/:repo
 * Get all workflows for a repository
 * Requires authentication
 */
router.get("/:owner/:repo", auth(), getRepositoryWorkflows);

/**
 * GET /api/workflows/:owner/:repo/:workflowId/runs
 * Get workflow runs for a specific workflow
 * Requires authentication
 */
router.get("/:owner/:repo/:workflowId/runs", auth(), getWorkflowRunsController);

/**
 * POST /api/workflows/:owner/:repo/:workflowId/trigger
 * Trigger a workflow dispatch
 * Requires authentication
 * Body: { ref: string, inputs: object }
 */
router.post("/:owner/:repo/:workflowId/trigger", auth(), triggerWorkflowController);

/**
 * POST /api/workflows/:owner/:repo
 * Create a new workflow from template
 * Requires authentication
 * Body: { templateId: string, fileName: string, options: object, branch: string, message: string }
 */
router.post("/:owner/:repo", auth(), createWorkflowController);

/**
 * DELETE /api/workflows/:owner/:repo
 * Delete a workflow file
 * Requires authentication
 * Body: { path: string, branch: string, message: string }
 */
router.delete("/:owner/:repo", auth(), deleteWorkflowController);

/**
 * POST /api/workflows/:owner/:repo/runs/:runId/cancel
 * Cancel a workflow run
 * Requires authentication
 */
router.post("/:owner/:repo/runs/:runId/cancel", auth(), cancelWorkflowRunController);

/**
 * POST /api/workflows/:owner/:repo/runs/:runId/rerun
 * Re-run a workflow
 * Requires authentication
 */
router.post("/:owner/:repo/runs/:runId/rerun", auth(), rerunWorkflowController);

export { router as workflowsRouter };
