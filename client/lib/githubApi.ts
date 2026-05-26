  import { axiosClient } from "@/lib/axios";

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

/**
 * Fetch GitHub connection status
 */
export async function fetchGitHubStatus() {
  try {
    const res = await axiosClient.get("/auth/github/status");
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchGitHubStatus error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Fetch GitHub OAuth authorization URL
 */
export async function getGitHubAuthorizeUrl() {
  try {
    const res = await axiosClient.get("/auth/github/authorize");
    const data = res?.data?.response || {};
    return {
      ...data,
      url: data?.url || data?.auth_url || "",
    };
  } catch (err: unknown) {
    console.error("[API] getGitHubAuthorizeUrl error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Connect GitHub account using a Personal Access Token (PAT)
 * @param pat The Personal Access Token
 */
export async function connectGitHubWithPat(pat: string) {
  try {
    const res = await axiosClient.post("/auth/github/pat", { pat });
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] connectGitHubWithPat error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Disconnect GitHub account
 */
export async function disconnectGitHub() {
  try {
    const res = await axiosClient.delete("/auth/github");
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] disconnectGitHub error:", getErrorMessage(err));
    throw err;
  }
}
