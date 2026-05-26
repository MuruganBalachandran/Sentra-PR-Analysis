import { env } from "../../config/index.js";

// Service for managing GitHub webhooks and repository monitoring
const ghFetch = async (url, init = {}, userToken = "") => {
    // Use user token if provided, otherwise fall back to service token
    const token = userToken || env?.GITHUB_TOKEN || "";
    
    // Determine auth format based on token type:
    // - OAuth tokens (gho_*): Use "Bearer"
    // - Fine-grained PATs (github_pat_*): Use "Bearer"  
    // - Classic PATs (ghp_*, ghc_*, ghs_*, ghr_*): Use "token"
    const isOAuthOrFineGrained = token.startsWith("gho_") || token.startsWith("github_pat_");
    const authPrefix = isOAuthOrFineGrained ? "Bearer" : "token";
    
    const headers = Object.assign(
        {
            Accept: "application/vnd.github+json",
            "User-Agent": "Sentra",
            Authorization: token ? `${authPrefix} ${token}` : "",
        },
        init?.headers || {}
    );
    const res = await fetch(url, { ...init, headers });
    if (!res?.ok) {
        const text = await res?.text?.();
        throw new Error(`GitHub API ${res?.status}: ${text}`);
    }
    return res;
};

/**
 * Fetch all repositories accessible by the authenticated user
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<Array>} List of repositories with id, name, owner, etc.
 */
const fetchUserRepositories = async (userToken = "") => {
    try {
        const url = "https://api.github.com/user/repos?per_page=100&sort=updated";
        const res = await ghFetch(url, {}, userToken);
        const repos = await res?.json?.();
        return repos?.map?.((repo) => ({
            id: repo?.id,
            name: repo?.name,
            owner: repo?.owner?.login,
            full_name: repo?.full_name,
            is_private: repo?.private,
            repository_url: repo?.html_url,
            default_branch: repo?.default_branch,
        })) || [];
    } catch (err) {
        console.error("[reposService] fetchUserRepositories error:", err?.message);
        throw err;
    }
};

/**
 * Create a webhook for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} webhookUrl - Full URL where GitHub will send events
 * @returns {Promise<number>} Webhook ID created by GitHub
 */
const createWebhook = async (owner = "", repo = "", webhookUrl = "", userToken = "") => {
    try {
        if (!owner || !repo || !webhookUrl) {
            throw new Error("Missing required parameters: owner, repo, or webhookUrl");
        }

        const webhookSecret = env?.GITHUB_WEBHOOK_SECRET || "";
        console.log(`[reposService] Creating webhook with secret: ${webhookSecret.substring(0, 10)}...`);
        
        if (!webhookSecret) {
            throw new Error("GITHUB_WEBHOOK_SECRET not configured");
        }

        // Use provided URL or construct from env
        const finalWebhookUrl = webhookUrl || `${env?.BACKEND_URL || "http://localhost:3000"}/api/webhooks/github`;

        console.log(`[reposService] Webhook URL: ${finalWebhookUrl}`);

        const url = `https://api.github.com/repos/${owner}/${repo}/hooks`;
        const webhookPayload = {
            name: "web",
            active: true,
            events: ["pull_request"],
            config: {
                url: finalWebhookUrl,
                content_type: "json",
                secret: webhookSecret,
            },
        };
        
        console.log(`[reposService] Webhook payload:`, JSON.stringify(webhookPayload, null, 2));
        
        const res = await ghFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
        }, userToken);
        
        const data = await res?.json?.();
        console.log(`[reposService] Webhook response:`, JSON.stringify(data, null, 2));
        
        const webhookId = data?.id || null;
        if (!webhookId) {
            throw new Error("Failed to create webhook: no ID returned");
        }
        console.log(`[reposService] Webhook created for ${owner}/${repo} with ID ${webhookId}`);
        return webhookId;
    } catch (err) {
        console.error("[reposService] createWebhook error:", err?.message);
        throw err;
    }
};

/**
 * Delete a webhook from a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} webhookId - GitHub webhook ID to delete
 * @returns {Promise<boolean>} True if deletion succeeded
 */
const deleteWebhook = async (owner = "", repo = "", webhookId = null, userToken = "") => {
    try {
        if (!owner || !repo || !webhookId) {
            throw new Error("Missing required parameters: owner, repo, or webhookId");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`;
        const res = await ghFetch(url, { method: "DELETE" }, userToken);
        console.log(
            `[reposService] Webhook ${webhookId} deleted for ${owner}/${repo}`
        );
        return res?.ok || false;
    } catch (err) {
        console.error("[reposService] deleteWebhook error:", err?.message);
        throw err;
    }
};

/**
 * Check if a webhook exists and is active
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} webhookId - GitHub webhook ID
 * @returns {Promise<boolean>} True if webhook exists and is active
 */
const isWebhookActive = async (owner = "", repo = "", webhookId = null, userToken = "") => {
    try {
        if (!owner || !repo || !webhookId) {
            return false;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`;
        const res = await ghFetch(url, {}, userToken);
        const data = await res?.json?.();
        return data?.active || false;
    } catch (err) {
        console.warn(`[reposService] isWebhookActive check failed:`, err?.message);
        return false;
    }
};

/**
 * Fetch organizations accessible by the authenticated user
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<Array>} List of organizations
 */
const fetchUserOrganizations = async (userToken = "") => {
    try {
        const url = "https://api.github.com/user/orgs?per_page=100";
        const res = await ghFetch(url, {}, userToken);
        const orgs = await res?.json?.();
        return orgs?.map?.((org) => ({
            login: org?.login,
            id: org?.id,
            avatar_url: org?.avatar_url,
        })) || [];
    } catch (err) {
        console.error("[reposService] fetchUserOrganizations error:", err?.message);
        throw err;
    }
};

/**
 * Fetch repositories from a specific organization
 * @param {string} org - Organization login name
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<Array>} List of organization repositories
 */
const fetchOrgRepositories = async (org = "", userToken = "") => {
    try {
        if (!org) {
            throw new Error("Organization name is required");
        }

        const url = `https://api.github.com/orgs/${org}/repos?per_page=100&sort=updated`;
        const res = await ghFetch(url, {}, userToken);
        const repos = await res?.json?.();
        return repos?.map?.((repo) => ({
            id: repo?.id,
            name: repo?.name,
            owner: repo?.owner?.login,
            full_name: repo?.full_name,
            is_private: repo?.private,
            repository_url: repo?.html_url,
            default_branch: repo?.default_branch,
        })) || [];
    } catch (err) {
        console.error(
            `[reposService] fetchOrgRepositories error for ${org}:`,
            err?.message
        );
        throw err;
    }
};

export {
    fetchUserRepositories,
    createWebhook,
    deleteWebhook,
    isWebhookActive,
    fetchUserOrganizations,
    fetchOrgRepositories,
};
