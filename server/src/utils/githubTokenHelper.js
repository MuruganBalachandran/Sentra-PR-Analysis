/**
 * GitHub Token Helper Utilities
 * Handles different GitHub token types and their authentication formats
 */

/**
 * Determine the correct authorization header prefix for a GitHub token
 * 
 * GitHub Token Types:
 * - OAuth tokens (gho_*): Use "Bearer" prefix
 * - Fine-grained PATs (github_pat_*): Use "Bearer" prefix
 * - Classic PATs (ghp_*): Use "token" prefix
 * - GitHub App tokens (ghs_*): Use "token" prefix
 * - Refresh tokens (ghr_*): Use "token" prefix
 * - User-to-server tokens (ghu_*): Use "Bearer" prefix
 * 
 * @param {string} token - GitHub token
 * @returns {string} Authorization prefix ("Bearer" or "token")
 */
const getGitHubAuthPrefix = (token = "") => {
    if (!token) return "token";
    
    // OAuth and fine-grained tokens use Bearer
    const bearerPrefixes = ["gho_", "github_pat_", "ghu_"];
    const useBearer = bearerPrefixes.some(prefix => token.startsWith(prefix));
    
    return useBearer ? "Bearer" : "token";
};

/**
 * Get the full authorization header value for a GitHub token
 * 
 * @param {string} token - GitHub token
 * @returns {string} Full authorization header value (e.g., "Bearer ghp_xxx" or "token ghp_xxx")
 */
const getGitHubAuthHeader = (token = "") => {
    if (!token) return "";
    const prefix = getGitHubAuthPrefix(token);
    return `${prefix} ${token}`;
};

/**
 * Detect the type of GitHub token
 * 
 * @param {string} token - GitHub token
 * @returns {string} Token type description
 */
const detectGitHubTokenType = (token = "") => {
    if (!token) return "unknown";
    
    if (token.startsWith("gho_")) return "OAuth Token";
    if (token.startsWith("github_pat_")) return "Fine-grained Personal Access Token";
    if (token.startsWith("ghp_")) return "Classic Personal Access Token";
    if (token.startsWith("ghs_")) return "GitHub App Token";
    if (token.startsWith("ghr_")) return "Refresh Token";
    if (token.startsWith("ghu_")) return "User-to-Server Token";
    
    return "Unknown Token Type";
};

/**
 * Validate GitHub token format
 * 
 * @param {string} token - GitHub token
 * @returns {boolean} True if token format is valid
 */
const isValidGitHubTokenFormat = (token = "") => {
    if (!token || typeof token !== "string") return false;
    
    // GitHub tokens are typically 40+ characters
    if (token.length < 20) return false;
    
    // Check if it starts with a known prefix
    const knownPrefixes = ["gho_", "github_pat_", "ghp_", "ghs_", "ghr_", "ghu_"];
    const hasKnownPrefix = knownPrefixes.some(prefix => token.startsWith(prefix));
    
    // If it has a known prefix, it's likely valid
    // If not, it might be an old format token (still valid)
    return hasKnownPrefix || token.length >= 40;
};

/**
 * Create GitHub API headers with proper authentication
 * 
 * @param {string} token - GitHub token
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} Headers object for fetch
 */
const createGitHubHeaders = (token = "", additionalHeaders = {}) => {
    const headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Sentra",
        "X-GitHub-Api-Version": "2022-11-28",
        ...additionalHeaders,
    };
    
    if (token) {
        headers.Authorization = getGitHubAuthHeader(token);
    }
    
    return headers;
};

export {
    getGitHubAuthPrefix,
    getGitHubAuthHeader,
    detectGitHubTokenType,
    isValidGitHubTokenFormat,
    createGitHubHeaders,
};
