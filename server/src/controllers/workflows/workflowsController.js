import {
    sendResponse,
    STATUS_CODE,
    RESPONSE_STATUS,
} from "../../utils/index.js";
import {
    listWorkflows,
    getWorkflowRuns,
    triggerWorkflow,
    createOrUpdateWorkflowFile,
    deleteWorkflowFile,
    getWorkflowFileContent,
    cancelWorkflowRun,
    rerunWorkflow,
} from "../../services/github/githubWorkflowService.js";
import {
    getTemplate,
    listTemplates,
} from "../../services/github/workflowTemplates.js";
import { User } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";

/**
 * Get all available workflow templates
 */
const getWorkflowTemplates = async (req = {}, res = {}) => {
    try {
        const templates = listTemplates();
        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow templates fetched successfully",
            { templates }
        );
    } catch (err) {
        console.error("[workflowsController] getWorkflowTemplates error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to fetch workflow templates"
        );
    }
};

/**
 * Get workflows for a repository
 */
const getRepositoryWorkflows = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner and repo are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        const workflows = await listWorkflows(owner, repo, userGithubToken);

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflows fetched successfully",
            { workflows }
        );
    } catch (err) {
        console.error("[workflowsController] getRepositoryWorkflows error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to fetch workflows"
        );
    }
};

/**
 * Get workflow runs for a specific workflow
 */
const getWorkflowRunsController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "", workflowId = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !workflowId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, and workflowId are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        const runs = await getWorkflowRuns(owner, repo, parseInt(workflowId), userGithubToken);

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow runs fetched successfully",
            { runs }
        );
    } catch (err) {
        console.error("[workflowsController] getWorkflowRunsController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to fetch workflow runs"
        );
    }
};

/**
 * Trigger a workflow dispatch
 */
const triggerWorkflowController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "", workflowId = "" } = req?.params || {};
        const { ref = "main", inputs = {} } = req?.body || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !workflowId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, and workflowId are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token Email");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        await triggerWorkflow(owner, repo, parseInt(workflowId), ref, inputs, userGithubToken);

        // Log activity
        try {
            await createActivityLog({
                Email: userDoc?.Email,
                Action: "POST",
                URL: `/api/workflows/${owner}/${repo}/${workflowId}/trigger`,
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Triggered workflow ${workflowId} for ${owner}/${repo}`,
            });
        } catch (logErr) {
            console.warn("[workflowsController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow triggered successfully"
        );
    } catch (err) {
        console.error("[workflowsController] triggerWorkflowController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to trigger workflow"
        );
    }
};

/**
 * Create or update a workflow file
 */
const createWorkflowController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "" } = req?.params || {};
        const {
            templateId = "",
            fileName = "",
            options = {},
            branch = "main",
            message = "",
        } = req?.body || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !templateId || !fileName) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, templateId, and fileName are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token Email");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        // Generate workflow content from template
        const workflowContent = getTemplate(templateId, options);
        const path = `.github/workflows/${fileName}`;

        const result = await createOrUpdateWorkflowFile(
            owner,
            repo,
            path,
            workflowContent,
            message || `Add workflow: ${fileName}`,
            branch,
            userGithubToken
        );

        // Log activity
        try {
            await createActivityLog({
                Email: userDoc?.Email,
                Action: "POST",
                URL: `/api/workflows/${owner}/${repo}`,
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Created workflow ${fileName} for ${owner}/${repo}`,
            });
        } catch (logErr) {
            console.warn("[workflowsController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow created successfully",
            { file: result }
        );
    } catch (err) {
        console.error("[workflowsController] createWorkflowController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to create workflow"
        );
    }
};

/**
 * Delete a workflow file
 */
const deleteWorkflowController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "" } = req?.params || {};
        const { path = "", branch = "main", message = "" } = req?.body || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !path) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, and path are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token Email");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        await deleteWorkflowFile(
            owner,
            repo,
            path,
            message || `Delete workflow: ${path}`,
            branch,
            userGithubToken
        );

        // Log activity
        try {
            await createActivityLog({
                Email: userDoc?.Email,
                Action: "DELETE",
                URL: `/api/workflows/${owner}/${repo}`,
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Deleted workflow ${path} from ${owner}/${repo}`,
            });
        } catch (logErr) {
            console.warn("[workflowsController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow deleted successfully"
        );
    } catch (err) {
        console.error("[workflowsController] deleteWorkflowController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to delete workflow"
        );
    }
};

/**
 * Cancel a workflow run
 */
const cancelWorkflowRunController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "", runId = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !runId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, and runId are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        await cancelWorkflowRun(owner, repo, parseInt(runId), userGithubToken);

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow run cancelled successfully"
        );
    } catch (err) {
        console.error("[workflowsController] cancelWorkflowRunController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to cancel workflow run"
        );
    }
};

/**
 * Re-run a workflow
 */
const rerunWorkflowController = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { owner = "", repo = "", runId = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!owner || !repo || !runId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Owner, repo, and runId are required"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected"
            );
        }

        await rerunWorkflow(owner, repo, parseInt(runId), userGithubToken);

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Workflow re-run triggered successfully"
        );
    } catch (err) {
        console.error("[workflowsController] rerunWorkflowController error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to re-run workflow"
        );
    }
};

export {
    getWorkflowTemplates,
    getRepositoryWorkflows,
    getWorkflowRunsController,
    triggerWorkflowController,
    createWorkflowController,
    deleteWorkflowController,
    cancelWorkflowRunController,
    rerunWorkflowController,
};
