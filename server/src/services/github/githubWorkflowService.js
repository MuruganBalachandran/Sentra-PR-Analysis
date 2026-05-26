import { env } from "../../config/index.js";

/**
 * GitHub API fetch wrapper with authentication
 */
const ghFetch = async (url, init = {}, userToken = "") => {
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
            "X-GitHub-Api-Version": "2022-11-28",
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
 * List all workflows in a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<Array>} List of workflows
 */
const listWorkflows = async (owner = "", repo = "", userToken = "") => {
    try {
        if (!owner || !repo) {
            throw new Error("Owner and repo are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;
        const res = await ghFetch(url, {}, userToken);
        const data = await res?.json?.();
        
        return (data?.workflows || [])?.map?.((workflow) => ({
            id: workflow?.id,
            name: workflow?.name,
            path: workflow?.path,
            state: workflow?.state,
            created_at: workflow?.created_at,
            updated_at: workflow?.updated_at,
            badge_url: workflow?.badge_url,
        }));
    } catch (err) {
        console.error("[githubWorkflowService] listWorkflows error:", err?.message);
        throw err;
    }
};

/**
 * Get workflow runs for a specific workflow
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} workflowId - Workflow ID
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<Array>} List of workflow runs
 */
const getWorkflowRuns = async (owner = "", repo = "", workflowId = null, userToken = "") => {
    try {
        if (!owner || !repo || !workflowId) {
            throw new Error("Owner, repo, and workflowId are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=10`;
        const res = await ghFetch(url, {}, userToken);
        const data = await res?.json?.();
        
        return (data?.workflow_runs || [])?.map?.((run) => ({
            id: run?.id,
            name: run?.name,
            status: run?.status,
            conclusion: run?.conclusion,
            created_at: run?.created_at,
            updated_at: run?.updated_at,
            html_url: run?.html_url,
            head_branch: run?.head_branch,
            head_sha: run?.head_sha,
            run_number: run?.run_number,
        }));
    } catch (err) {
        console.error("[githubWorkflowService] getWorkflowRuns error:", err?.message);
        throw err;
    }
};

/**
 * Trigger a workflow dispatch event
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} workflowId - Workflow ID
 * @param {string} ref - Git reference (branch/tag)
 * @param {object} inputs - Workflow inputs
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<boolean>} Success status
 */
const triggerWorkflow = async (owner = "", repo = "", workflowId = null, ref = "main", inputs = {}, userToken = "") => {
    try {
        if (!owner || !repo || !workflowId) {
            throw new Error("Owner, repo, and workflowId are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
        await ghFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ref,
                inputs: inputs || {},
            }),
        }, userToken);
        
        return true;
    } catch (err) {
        console.error("[githubWorkflowService] triggerWorkflow error:", err?.message);
        throw err;
    }
};

/**
 * Create or update a workflow file in the repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path (e.g., .github/workflows/ci.yml)
 * @param {string} content - Workflow YAML content
 * @param {string} message - Commit message
 * @param {string} branch - Target branch
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<object>} Created/updated file info
 */
const createOrUpdateWorkflowFile = async (
    owner = "",
    repo = "",
    path = "",
    content = "",
    message = "",
    branch = "main",
    userToken = ""
) => {
    try {
        if (!owner || !repo || !path || !content) {
            throw new Error("Owner, repo, path, and content are required");
        }

        // Check if file exists to get SHA
        let sha = null;
        try {
            const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
            const checkRes = await ghFetch(checkUrl, {}, userToken);
            const checkData = await checkRes?.json?.();
            sha = checkData?.sha;
        } catch (err) {
            // File doesn't exist, that's okay
            console.log(`[githubWorkflowService] File ${path} doesn't exist, will create new`);
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const body = {
            message: message || `Add/Update workflow: ${path}`,
            content: Buffer.from(content).toString("base64"),
            branch,
        };

        if (sha) {
            body.sha = sha;
        }

        const res = await ghFetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }, userToken);
        
        const data = await res?.json?.();
        return {
            path: data?.content?.path,
            sha: data?.content?.sha,
            html_url: data?.content?.html_url,
        };
    } catch (err) {
        console.error("[githubWorkflowService] createOrUpdateWorkflowFile error:", err?.message);
        throw err;
    }
};

/**
 * Delete a workflow file from the repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} message - Commit message
 * @param {string} branch - Target branch
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<boolean>} Success status
 */
const deleteWorkflowFile = async (
    owner = "",
    repo = "",
    path = "",
    message = "",
    branch = "main",
    userToken = ""
) => {
    try {
        if (!owner || !repo || !path) {
            throw new Error("Owner, repo, and path are required");
        }

        // Get file SHA
        const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const checkRes = await ghFetch(checkUrl, {}, userToken);
        const checkData = await checkRes?.json?.();
        const sha = checkData?.sha;

        if (!sha) {
            throw new Error("File not found or SHA unavailable");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        await ghFetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message || `Delete workflow: ${path}`,
                sha,
                branch,
            }),
        }, userToken);
        
        return true;
    } catch (err) {
        console.error("[githubWorkflowService] deleteWorkflowFile error:", err?.message);
        throw err;
    }
};

/**
 * Get workflow file content
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} branch - Branch name
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<string>} File content
 */
const getWorkflowFileContent = async (
    owner = "",
    repo = "",
    path = "",
    branch = "main",
    userToken = ""
) => {
    try {
        if (!owner || !repo || !path) {
            throw new Error("Owner, repo, and path are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const res = await ghFetch(url, {}, userToken);
        const data = await res?.json?.();
        
        if (!data?.content) {
            throw new Error("File content not found");
        }

        return Buffer.from(data.content, "base64").toString("utf8");
    } catch (err) {
        console.error("[githubWorkflowService] getWorkflowFileContent error:", err?.message);
        throw err;
    }
};

/**
 * Cancel a workflow run
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} runId - Workflow run ID
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<boolean>} Success status
 */
const cancelWorkflowRun = async (owner = "", repo = "", runId = null, userToken = "") => {
    try {
        if (!owner || !repo || !runId) {
            throw new Error("Owner, repo, and runId are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`;
        await ghFetch(url, {
            method: "POST",
        }, userToken);
        
        return true;
    } catch (err) {
        console.error("[githubWorkflowService] cancelWorkflowRun error:", err?.message);
        throw err;
    }
};

/**
 * Re-run a workflow
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} runId - Workflow run ID
 * @param {string} userToken - User's GitHub token
 * @returns {Promise<boolean>} Success status
 */
const rerunWorkflow = async (owner = "", repo = "", runId = null, userToken = "") => {
    try {
        if (!owner || !repo || !runId) {
            throw new Error("Owner, repo, and runId are required");
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/rerun`;
        await ghFetch(url, {
            method: "POST",
        }, userToken);
        
        return true;
    } catch (err) {
        console.error("[githubWorkflowService] rerunWorkflow error:", err?.message);
        throw err;
    }
};

export {
    listWorkflows,
    getWorkflowRuns,
    triggerWorkflow,
    createOrUpdateWorkflowFile,
    deleteWorkflowFile,
    getWorkflowFileContent,
    cancelWorkflowRun,
    rerunWorkflow,
};
