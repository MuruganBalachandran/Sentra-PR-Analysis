import { axiosClient } from "@/lib/axios";

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

/**
 * Fetch all available repositories for user to monitor
 * @returns List of repos with monitoring status
 */
export async function fetchAvailableRepositories() {
  try {
    const res = await axiosClient.get("/repos/available");
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchAvailableRepositories error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Fetch all repositories currently being monitored by user
 * @returns List of monitored repos
 */
export async function fetchMonitoredRepositories() {
  try {
    const res = await axiosClient.get("/repos");
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchMonitoredRepositories error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Add a repository to monitoring
 * @param repoData Repository data to add
 * @returns Created monitored repository
 */
export async function addMonitoredRepository(repoData: {
  full_name: string;
  owner: string;
  repo: string;
  is_private: boolean;
  repository_url: string;
  github_repo_id?: number;
}) {
  try {
    const res = await axiosClient.post("/repos", repoData);
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] addMonitoredRepository error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Remove a repository from monitoring
 * @param repoId Repository ID
 * @returns Success response
 */
export async function removeMonitoredRepository(repoId: string) {
  try {
    const res = await axiosClient.delete(`/repos/${repoId}`);
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] removeMonitoredRepository error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Update repository monitoring settings
 * @param repoId Repository ID
 * @param settings Settings to update
 * @returns Updated repository
 */
export async function updateMonitoredRepositorySettings(
  repoId: string,
  changes: {
    enabled?: boolean;
    post_comment?: boolean;
    send_email?: boolean;
    delete_comment_on_merge?: boolean;
    severity_threshold?: string;
  }
) {
  try {
    const res = await axiosClient.put(`/repos/${repoId}`, changes);
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] updateMonitoredRepositorySettings error:", getErrorMessage(err));
    throw err;
  }
}
