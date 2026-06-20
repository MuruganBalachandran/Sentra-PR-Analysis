import {
    sendResponse,
    STATUS_CODE,
    RESPONSE_STATUS,
} from "../../utils/index.js";
import {
    fetchUserRepositories,
    createWebhook,
    deleteWebhook,
    isWebhookActive,
    fetchUserOrganizations,
    fetchOrgRepositories,
} from "../../services/repos/reposService.js";
import { MonitoredRepository, Repository, User } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";
import { env } from "../../config/index.js";

/**
 * Get all available repositories for the user to monitor
 * Includes both personal and organization repositories
 */
const getAvailableRepositories = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected. Please connect your GitHub account first."
            );
        }

        let allRepos = [];

        // Fetch personal repositories
        const personalRepos = await fetchUserRepositories(userGithubToken);
        allRepos = allRepos?.concat?.(personalRepos) || [];

        // Fetch organization repositories if available
        try {
            const orgs = await fetchUserOrganizations(userGithubToken);
            for (const org of orgs || []) {
                const orgRepos = await fetchOrgRepositories(org?.login, userGithubToken);
                allRepos = allRepos?.concat?.(orgRepos) || [];
            }
        } catch (err) {
            console.warn(
                "[reposController] Failed to fetch org repos:",
                err?.message
            );
            // Continue with personal repos only
        }

        // Get already monitored repos for this user
        const monitoredRepos = await MonitoredRepository.find(
            { User_Id: userId },
            { full_name: 1 }
        ).lean();
        const monitoredNames = new Set(
            monitoredRepos?.map?.((m) => m?.full_name) || []
        );

        // Enrich repos with monitoring status
        const enrichedRepos = (allRepos || [])?.map?.((repo) => ({
            ...repo,
            isMonitored: monitoredNames?.has?.(repo?.full_name),
        }));

        // Remove duplicates based on full_name
        const uniqueRepos = Array.from(
            new Map((enrichedRepos || [])?.map?.((r) => [r?.full_name, r])).values()
        );

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Repositories fetched successfully",
            {
                total: uniqueRepos?.length || 0,
                repositories: uniqueRepos || [],
            }
        );
    } catch (err) {
        console.error("[reposController] getAvailableRepositories error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to fetch repositories"
        );
    }
};

/**
 * Add a repository to monitoring
 * Creates a GitHub webhook and stores the monitoring configuration
 */
const addMonitoredRepository = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const {
            full_name = "",
            owner = "",
            repo = "",
            is_private = false,
            repository_url = "",
            github_repo_id = null,
        } = req?.body || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!full_name || !owner || !repo) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Missing required fields: full_name, owner, repo"
            );
        }

        // Check if already monitoring
        const existingMonitor = await MonitoredRepository.findOne({
            User_Id: userId,
            full_name,
        });

        if (existingMonitor) {
            return sendResponse(
                res,
                STATUS_CODE?.CONFLICT || 409,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Repository is already being monitored"
            );
        }

        const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
        const userGithubToken = userDoc?.github_token || "";

        if (!userGithubToken) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "GitHub account not connected. Please connect your GitHub account first."
            );
        }

        // Create webhook — requires BACKEND_URL to be a publicly reachable URL
        let webhookId = null;
        let webhookError = null;

        const backendUrl = env?.BACKEND_URL || "";
        if (!backendUrl || backendUrl.includes("localhost")) {
            webhookError = "BACKEND_URL is not configured to a public URL. GitHub cannot reach localhost. Set BACKEND_URL to your ngrok/public domain in .env.";
            console.error("[reposController] " + webhookError);
        } else {
            try {
                const webhookUrl = `${backendUrl}/api/webhooks/github`;
                webhookId = await createWebhook(owner, repo, webhookUrl, userGithubToken);
            } catch (webhookErr) {
                webhookError = webhookErr?.message || "Webhook creation failed";
                console.error("[reposController] Webhook creation failed:", webhookError);
            }
        }

        // Create monitored repository record
        const monitoredRepo = await MonitoredRepository.create({
            User_Id: userId,
            github_repo_id: github_repo_id || null,
            owner,
            repo,
            full_name,
            github_webhook_id: webhookId || null,
            is_private,
            repository_url,
            enabled: true,
            settings: {
                post_comment: true,
                send_email: true,
                delete_comment_on_merge: true,
                severity_threshold: "low",
            },
        });

        // Log activity
        try {
            await createActivityLog({
                Email: req?.user?.Email || userId,
                Action: "POST",
                URL: "/api/repos",
                Status: STATUS_CODE?.CREATED || 201,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Added repository ${full_name} to monitoring`,
            });
        } catch (logErr) {
            console.warn("[reposController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.CREATED || 201,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            webhookError
                ? `Repository added, but webhook failed: ${webhookError}`
                : "Repository added to monitoring successfully",
            {
                repository: {
                    id: monitoredRepo?._id,
                    full_name: monitoredRepo?.full_name,
                    enabled: monitoredRepo?.enabled,
                    webhook_id: monitoredRepo?.github_webhook_id,
                    webhook_error: webhookError || null,
                },
            }
        );
    } catch (err) {
        console.error("[reposController] addMonitoredRepository error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to add repository"
        );
    }
};

/**
 * Get all repositories being monitored by the user
 */
const getMonitoredRepositories = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        const repos = await MonitoredRepository.find({ User_Id: userId })
            .select(
                "-__v -Created_At -Updated_At"
            )
            .sort({ Created_At: -1 })
            .lean();

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Monitored repositories fetched",
            {
                total: repos?.length || 0,
                repositories: repos || [],
            }
        );
    } catch (err) {
        console.error(
            "[reposController] getMonitoredRepositories error:",
            err?.message
        );
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to fetch monitored repositories"
        );
    }
};

/**
 * Remove a repository from monitoring
 * Deletes the GitHub webhook and monitoring record
 */
const removeMonitoredRepository = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { repoId = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!repoId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Repository ID is required"
            );
        }

        // Find and verify ownership
        const monitoredRepo = await MonitoredRepository.findById(repoId);

        if (!monitoredRepo) {
            return sendResponse(
                res,
                STATUS_CODE?.NOT_FOUND || 404,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Repository not found"
            );
        }

        if (String(monitoredRepo?.User_Id || "") !== String(userId || "")) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "You do not have permission to remove this repository"
            );
        }

        // Delete webhook if it exists
        if (monitoredRepo?.github_webhook_id) {
            try {
                const userDoc = await User.findOne({ User_Id: userId }).select("github_token");
                await deleteWebhook(
                    monitoredRepo?.owner,
                    monitoredRepo?.repo,
                    monitoredRepo?.github_webhook_id,
                    userDoc?.github_token || ""
                );
            } catch (webhookErr) {
                console.warn(
                    "[reposController] Webhook deletion failed:",
                    webhookErr?.message
                );
                // Continue with removing the record
            }
        }

        // Remove monitoring record
        await MonitoredRepository.findByIdAndDelete(repoId);

        // Log activity
        try {
            await createActivityLog({
                Email: req?.user?.Email || userId,
                Action: "DELETE",
                URL: "/api/repos/:repoId",
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Removed repository ${monitoredRepo?.full_name} from monitoring`,
            });
        } catch (logErr) {
            console.warn("[reposController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Repository removed from monitoring successfully"
        );
    } catch (err) {
        console.error(
            "[reposController] removeMonitoredRepository error:",
            err?.message
        );
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to remove repository"
        );
    }
};

/**
 * Update monitoring settings for a repository
 */
const updateMonitoredRepositorySettings = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { repoId = "" } = req?.params || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!repoId) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Repository ID is required"
            );
        }

        // Find and verify ownership
        const monitoredRepo = await MonitoredRepository.findById(repoId);

        if (!monitoredRepo) {
            return sendResponse(
                res,
                STATUS_CODE?.NOT_FOUND || 404,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Repository not found"
            );
        }

        if (String(monitoredRepo?.User_Id || "") !== String(userId || "")) {
            return sendResponse(
                res,
                STATUS_CODE?.FORBIDDEN || 403,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "You do not have permission to update this repository"
            );
        }

        // Accept settings fields either nested under "settings" key or flat at root
        // Frontend sends: { post_comment: true } or { enabled: false }
        const { enabled = null, ...rest } = req?.body || {};
        const settingsFields = rest?.settings ? rest.settings : rest;

        const updateData = {};

        // Use dot notation for nested settings fields so MongoDB patches only changed keys
        const VALID_SETTINGS = ["post_comment", "send_email", "delete_comment_on_merge", "severity_threshold"];
        for (const key of VALID_SETTINGS) {
            if (settingsFields[key] !== undefined) {
                updateData[`settings.${key}`] = settingsFields[key];
            }
        }

        if (enabled !== null && typeof enabled === "boolean") {
            updateData.enabled = enabled;
        }

        if (Object.keys(updateData).length === 0) {
            return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "No valid fields to update");
        }

        const updatedRepo = await MonitoredRepository.findByIdAndUpdate(
            repoId,
            { $set: updateData },
            { new: true }
        );

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Repository settings updated successfully",
            {
                repository: {
                    id: updatedRepo?._id,
                    full_name: updatedRepo?.full_name,
                    enabled: updatedRepo?.enabled,
                    settings: updatedRepo?.settings,
                },
            }
        );
    } catch (err) {
        console.error(
            "[reposController] updateMonitoredRepositorySettings error:",
            err?.message
        );
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to update repository settings"
        );
    }
};

export {
    getAvailableRepositories,
    addMonitoredRepository,
    getMonitoredRepositories,
    removeMonitoredRepository,
    updateMonitoredRepositorySettings,
};
