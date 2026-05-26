import {
    sendResponse,
    STATUS_CODE,
    RESPONSE_STATUS,
} from "../../utils/index.js";
import {
    getAuthorizationUrl,
    exchangeCodeForToken,
    fetchGitHubUserInfo,
    verifyGitHubToken,
    verifyGitHubOAuthState,
} from "../../services/github/githubAuthService.js";
import { User } from "../../models/index.js";
import { createActivityLog } from "../../queries/index.js";
import { env } from "../../config/index.js";

/**
 * Get GitHub OAuth authorization URL
 * Used to initiate the login flow
 */
const getGitHubAuthUrl = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const authUrl = getAuthorizationUrl(userId);
        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "Authorization URL generated",
            { auth_url: authUrl }
        );
    } catch (err) {
        console.error("[githubAuthController] getGitHubAuthUrl error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to generate authorization URL"
        );
    }
};

/**
 * Handle GitHub OAuth callback
 * Exchange code for token and update user profile
 */
const handleGitHubCallback = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const { code = "" } = req?.query || {};

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!code) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Authorization code is required"
            );
        }

        // Exchange code for token
        const tokenData = await exchangeCodeForToken(code);
        const accessToken = tokenData?.access_token || "";

        if (!accessToken) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Failed to obtain access token"
            );
        }

        // Fetch user info
        const userInfo = await fetchGitHubUserInfo(accessToken);

        // Update user with GitHub info using User_Id field
        const updatedUser = await User.findOneAndUpdate(
            { User_Id: userId },
            {
                $set: {
                    github_token: accessToken,
                    github_username: userInfo?.login,
                    github_id: userInfo?.id,
                    github_connected: true,
                    github_connected_at: new Date(),
                },
            },
            { new: true }
        ).select("-Password -Is_Deleted -github_token");

        // Log activity
        try {
            await createActivityLog({
                Email: updatedUser?.Email,
                Action: "POST",
                URL: "/api/auth/github/callback",
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Connected GitHub account (${userInfo?.login})`,
            });
        } catch (logErr) {
            console.warn("[githubAuthController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "GitHub account connected successfully",
            {
                user: updatedUser,
                github_username: userInfo?.login,
            }
        );
    } catch (err) {
        console.error("[githubAuthController] handleGitHubCallback error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to connect GitHub account"
        );
    }
};

/**
 * Get GitHub connection status
 */
const getGitHubStatus = async (req = {}, res = {}) => {
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

        console.log(`[githubAuthController] getGitHubStatus - Looking up user: ${userId}`);

        // Use User_Id field instead of _id
        const user = await User.findOne({ User_Id: userId }).select(
            "github_connected github_username github_id github_connected_at github_token"
        );

        if (!user) {
            console.error(`[githubAuthController] User not found with User_Id: ${userId}`);
            // Try to find user by email as fallback
            const userEmail = req?.user?.Email || "";
            if (userEmail) {
                console.log(`[githubAuthController] Trying to find user by email: ${userEmail}`);
                const userByEmail = await User.findOne({ Email: userEmail }).select(
                    "github_connected github_username github_id github_connected_at github_token"
                );
                if (userByEmail) {
                    console.log(`[githubAuthController] Found user by email`);
                    // Verify token is still valid if connected
                    let isValid = false;
                    if (userByEmail?.github_connected && userByEmail?.github_token) {
                        isValid = await verifyGitHubToken(userByEmail?.github_token);
                    }

                    return sendResponse(
                        res,
                        STATUS_CODE?.OK || 200,
                        RESPONSE_STATUS?.SUCCESS || "SUCCESS",
                        "GitHub status retrieved",
                        {
                            connected: userByEmail?.github_connected,
                            username: userByEmail?.github_username,
                            github_id: userByEmail?.github_id,
                            connected_at: userByEmail?.github_connected_at,
                            token_valid: isValid,
                        }
                    );
                }
            }
            
            return sendResponse(
                res,
                STATUS_CODE?.NOT_FOUND || 404,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not found"
            );
        }

        // Verify token is still valid if connected
        let isValid = false;
        if (user?.github_connected && user?.github_token) {
            isValid = await verifyGitHubToken(user?.github_token);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "GitHub status retrieved",
            {
                connected: user?.github_connected,
                username: user?.github_username,
                github_id: user?.github_id,
                connected_at: user?.github_connected_at,
                token_valid: isValid,
            }
        );
    } catch (err) {
        console.error("[githubAuthController] getGitHubStatus error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to get GitHub status"
        );
    }
};

/**
 * Disconnect GitHub account
 */
const disconnectGitHub = async (req = {}, res = {}) => {
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

        const user = await User.findOneAndUpdate(
            { User_Id: userId },
            {
                $set: {
                    github_token: null,
                    github_username: null,
                    github_id: null,
                    github_connected: false,
                    github_connected_at: null,
                },
            },
            { new: true }
        ).select("-Password -Is_Deleted -github_token");

        // Log activity
        try {
            await createActivityLog({
                Email: user?.Email,
                Action: "DELETE",
                URL: "/api/auth/github",
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: "Disconnected GitHub account",
            });
        } catch (logErr) {
            console.warn("[githubAuthController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "GitHub account disconnected successfully"
        );
    } catch (err) {
        console.error("[githubAuthController] disconnectGitHub error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to disconnect GitHub account"
        );
    }
};

/**
 * Connect GitHub account using Personal Access Token (PAT)
 */
const connectGitHubWithPat = async (req = {}, res = {}) => {
    try {
        const userId = req?.user?.User_Id || "";
        const userEmail = req?.user?.Email || "";
        const { pat = "" } = req?.body || {};

        console.log(`[githubAuthController] connectGitHubWithPat - User ID: ${userId}, Email: ${userEmail}`);

        if (!userId) {
            return sendResponse(
                res,
                STATUS_CODE?.UNAUTHORIZED || 401,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "User not authenticated"
            );
        }

        if (!pat) {
            return sendResponse(
                res,
                STATUS_CODE?.BAD_REQUEST || 400,
                RESPONSE_STATUS?.FAILURE || "FAILURE",
                "Personal Access Token is required"
            );
        }

        // Fetch user info to verify PAT
        const userInfo = await fetchGitHubUserInfo(pat);
        console.log(`[githubAuthController] GitHub user info retrieved: ${userInfo?.login}`);

        // Update user with GitHub info using User_Id field
        const updatedUser = await User.findOneAndUpdate(
            { User_Id: userId },
            {
                $set: {
                    github_token: pat,
                    github_username: userInfo?.login,
                    github_id: userInfo?.id,
                    github_connected: true,
                    github_connected_at: new Date(),
                },
            },
            { new: true }
        ).select("-Password -Is_Deleted -github_token");

        console.log(`[githubAuthController] User updated successfully: ${updatedUser?.User_Id}`);

        // Log activity
        try {
            await createActivityLog({
                Email: userEmail || userId,
                Action: "POST",
                URL: "/api/auth/github/pat",
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Connected GitHub account with PAT (${userInfo?.login})`,
            });
        } catch (logErr) {
            console.warn("[githubAuthController] Activity log failed:", logErr?.message);
        }

        return sendResponse(
            res,
            STATUS_CODE?.OK || 200,
            RESPONSE_STATUS?.SUCCESS || "SUCCESS",
            "GitHub account connected successfully",
            {
                user: updatedUser,
                github_username: userInfo?.login,
            }
        );
    } catch (err) {
        console.error("[githubAuthController] connectGitHubWithPat error:", err?.message);
        return sendResponse(
            res,
            STATUS_CODE?.BAD_REQUEST || 400,
            RESPONSE_STATUS?.FAILURE || "FAILURE",
            err?.message || "Failed to connect GitHub account using PAT"
        );
    }
};

/**
 * Handle GitHub OAuth callback via GET request from browser redirect
 */
const handleGitHubCallbackGet = async (req = {}, res = {}) => {
    try {
        const { code = "", state = "" } = req?.query || {};
        const decodedState = verifyGitHubOAuthState(state);
        const userId = decodedState?.User_Id || "";

        if (!userId) {
            return res.redirect(`${env?.APP_URL || "http://localhost:5173"}/login?error=unauthorized`);
        }

        if (!code) {
            return res.redirect(`${env?.APP_URL || "http://localhost:5173"}/repos?error=missing_code`);
        }

        // Exchange code for token
        const tokenData = await exchangeCodeForToken(code);
        const accessToken = tokenData?.access_token || "";

        if (!accessToken) {
            return res.redirect(`${env?.APP_URL || "http://localhost:5173"}/repos?error=token_exchange_failed`);
        }

        // Fetch user info
        const userInfo = await fetchGitHubUserInfo(accessToken);

        // Update user with GitHub info using User_Id field
        await User.findOneAndUpdate(
            { User_Id: userId },
            {
                $set: {
                    github_token: accessToken,
                    github_username: userInfo?.login,
                    github_id: userInfo?.id,
                    github_connected: true,
                    github_connected_at: new Date(),
                },
            }
        );

        // Log activity
        try {
            await createActivityLog({
                Email: userInfo?.email || userInfo?.login || userId,
                Action: "GET",
                URL: "/api/auth/github/callback",
                Status: STATUS_CODE?.OK || 200,
                IP: req?.ip || "",
                Duration: "",
                Activity: `Connected GitHub account via OAuth (${userInfo?.login})`,
            });
        } catch (logErr) {
            console.warn("[githubAuthController] Activity log failed:", logErr?.message);
        }

        return res.redirect(`${env?.APP_URL || "http://localhost:5173"}/repos?connected=true`);
    } catch (err) {
        console.error("[githubAuthController] handleGitHubCallbackGet error:", err?.message);
        return res.redirect(`${env?.APP_URL || "http://localhost:5173"}/repos?error=${encodeURIComponent(err?.message || "connection_failed")}`);
    }
};

export {
    getGitHubAuthUrl,
    handleGitHubCallback,
    getGitHubStatus,
    disconnectGitHub,
    connectGitHubWithPat,
    handleGitHubCallbackGet,
};
