import { env } from "../../config/index.js";
import { generateToken, verifyToken } from "../../utils/index.js";

/**
 * Generate GitHub OAuth authorization URL
 * @returns {string} Authorization URL
 */
const getAuthorizationUrl = (userId = "") => {
    const clientId = env?.GITHUB_OAUTH_CLIENT_ID || "";
    if (!clientId) {
        throw new Error("GITHUB_OAUTH_CLIENT_ID not configured");
    }

    const redirectUri = `${env?.BACKEND_URL || "http://localhost:3000"}/api/auth/github/callback`;
    // Request multiple scopes: repo for repository access, admin:repo_hook for webhook management, workflow for GitHub Actions
    const scope = "repo admin:repo_hook workflow";
    const state = generateToken({
        type: "github_oauth",
        User_Id: userId,
    });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange GitHub OAuth code for access token
 * @param {string} code - GitHub authorization code
 * @returns {Promise<{access_token: string, token_type: string}>} GitHub token response
 */
const exchangeCodeForToken = async (code = "") => {
    try {
        if (!code) {
            throw new Error("Authorization code is required");
        }

        const clientId = env?.GITHUB_OAUTH_CLIENT_ID || "";
        const clientSecret = env?.GITHUB_OAUTH_CLIENT_SECRET || "";

        if (!clientId || !clientSecret) {
            throw new Error("GitHub OAuth credentials not configured");
        }

        const redirectUri = `${env?.BACKEND_URL || "http://localhost:3000"}/api/auth/github/callback`;

        const res = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!res?.ok) {
            const text = await res?.text?.();
            throw new Error(`GitHub OAuth error: ${text}`);
        }

        const data = await res?.json?.();
        return data;
    } catch (err) {
        console.error("[githubAuthService] exchangeCodeForToken error:", err?.message);
        throw err;
    }
};

/**
 * Fetch GitHub user info using access token
 * @param {string} token - GitHub access token
 * @returns {Promise<{id: number, login: string, email: string, name: string}>} User data
 */
const fetchGitHubUserInfo = async (token = "") => {
    try {
        if (!token) {
            throw new Error("Access token is required");
        }

        // Determine auth format based on token type:
        // - OAuth tokens (gho_*): Use "Bearer"
        // - Fine-grained PATs (github_pat_*): Use "Bearer"  
        // - Classic PATs (ghp_*, ghc_*, ghs_*, ghr_*): Use "token"
        const isOAuthOrFineGrained = token.startsWith("gho_") || token.startsWith("github_pat_");
        const authPrefix = isOAuthOrFineGrained ? "Bearer" : "token";

        console.log(`[githubAuthService] Using auth prefix: ${authPrefix} for token starting with: ${token.substring(0, 4)}`);

        const res = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `${authPrefix} ${token}`,
                "User-Agent": "Sentra",
                Accept: "application/vnd.github+json",
            },
        });

        if (!res?.ok) {
            const text = await res?.text?.();
            throw new Error(`GitHub API error: ${text}`);
        }

        const data = await res?.json?.();
        return {
            id: data?.id,
            login: data?.login,
            email: data?.email,
            name: data?.name,
        };
    } catch (err) {
        console.error("[githubAuthService] fetchGitHubUserInfo error:", err?.message);
        throw err;
    }
};

/**
 * Verify GitHub token is still valid
 * @param {string} token - GitHub access token
 * @returns {Promise<boolean>} True if token is valid
 */
const verifyGitHubToken = async (token = "") => {
    try {
        if (!token) return false;

        // Determine auth format based on token type:
        // - OAuth tokens (gho_*): Use "Bearer"
        // - Fine-grained PATs (github_pat_*): Use "Bearer"  
        // - Classic PATs (ghp_*, ghc_*, ghs_*, ghr_*): Use "token"
        const isOAuthOrFineGrained = token.startsWith("gho_") || token.startsWith("github_pat_");
        const authPrefix = isOAuthOrFineGrained ? "Bearer" : "token";

        const res = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `${authPrefix} ${token}`,
                "User-Agent": "Sentra",
            },
        });

        return res?.ok || false;
    } catch (err) {
        console.warn("[githubAuthService] verifyGitHubToken error:", err?.message);
        return false;
    }
};

const verifyGitHubOAuthState = (state = "") => {
    const decoded = verifyToken(state);
    if (decoded?.type !== "github_oauth" || !decoded?.User_Id) {
        return null;
    }
    return decoded;
};

export {
    getAuthorizationUrl,
    exchangeCodeForToken,
    fetchGitHubUserInfo,
    verifyGitHubToken,
    verifyGitHubOAuthState,
};
