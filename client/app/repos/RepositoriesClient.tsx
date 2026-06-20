"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchAvailableRepositories,
  fetchMonitoredRepositories,
  addMonitoredRepository,
  removeMonitoredRepository,
  updateMonitoredRepositorySettings,
} from "@/lib/reposApi";
import {
  fetchGitHubStatus,
  getGitHubAuthorizeUrl,
  connectGitHubWithPat,
  disconnectGitHub,
} from "@/lib/githubApi";

type Repository = {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  is_private: boolean;
  repository_url: string;
  default_branch?: string;
  isMonitored?: boolean;
};

type MonitoredRepo = {
  _id: string;
  full_name: string;
  owner: string;
  repo: string;
  enabled: boolean;
  github_webhook_id: number | null;
  settings: {
    post_comment: boolean;
    send_email: boolean;
    delete_comment_on_merge: boolean;
    severity_threshold: string;
  };
  pr_count: number;
  last_analysis_at: string | null;
  Created_At: string;
};

type ApiError = Error & {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

function getErrorMessage(err: unknown, fallback: string) {
  const apiError = err as ApiError;
  return apiError?.response?.data?.message || apiError?.message || fallback;
}

function getErrorStatus(err: unknown) {
  return (err as ApiError)?.response?.status;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function RepositoriesClient() {
  // State for available repos
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [monitoredRepos, setMonitoredRepos] = useState<MonitoredRepo[]>([]);

  // GitHub connection status
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showPatInput, setShowPatInput] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [connectingPat, setConnectingPat] = useState(false);

  // UI State
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingMonitored, setLoadingMonitored] = useState(true);
  const [addingRepo, setAddingRepo] = useState(false);
  const [removingRepoId, setRemovingRepoId] = useState<string | null>(null);
  const [expandedMonitoredId, setExpandedMonitoredId] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [showMonitoredOnly, setShowMonitoredOnly] = useState(false);

  // Load GitHub status and monitored repos on mount
  useEffect(() => {
    checkGitHubStatus();
    loadMonitoredRepos();

    // Check for success/error redirect parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast.success("GitHub account connected successfully!");
      // Clean URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      toast.error(`GitHub Connection Failed: ${decodeURIComponent(params.get("error") || "")}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // Initial page load only; the loader functions manage follow-up refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkGitHubStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await fetchGitHubStatus();
      const connected = status?.connected || false;
      setGithubConnected(connected);
      setGithubUsername(status?.username || "");
      if (connected) {
        await loadAvailableRepos();
      } else {
        setLoadingAvailable(false);
        setAvailableRepos([]);
      }
    } catch (err: unknown) {
      console.error("Failed to check GitHub connection status", err);
      setLoadingAvailable(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleConnectOAuth = async () => {
    try {
      const data = await getGitHubAuthorizeUrl();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not generate GitHub authorization URL");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to initiate OAuth flow"));
    }
  };

  const handleConnectPat = async () => {
    if (!patToken.trim()) return;
    setConnectingPat(true);
    try {
      await connectGitHubWithPat(patToken.trim());
      toast.success("GitHub account connected successfully!");
      setPatToken("");
      setShowPatInput(false);
      await checkGitHubStatus();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to verify or connect GitHub account"));
    } finally {
      setConnectingPat(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account? This will stop automated PR monitoring.")) {
      return;
    }
    try {
      await disconnectGitHub();
      toast.success("GitHub account disconnected");
      setGithubConnected(false);
      setGithubUsername("");
      setAvailableRepos([]);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to disconnect GitHub account"));
    }
  };

  const loadAvailableRepos = async () => {
    setLoadingAvailable(true);
    try {
      const data = await fetchAvailableRepositories();
      setAvailableRepos(data?.repositories || []);
    } catch (err: unknown) {
      if (getErrorStatus(err) !== 403) {
        toast.error(getErrorMessage(err, "Failed to load repositories"));
      }
    } finally {
      setLoadingAvailable(false);
    }
  };

  const loadMonitoredRepos = async () => {
    setLoadingMonitored(true);
    try {
      const data = await fetchMonitoredRepositories();
      setMonitoredRepos(data?.repositories || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load monitored repositories"));
    } finally {
      setLoadingMonitored(false);
    }
  };

  const handleAddRepository = async (repo: Repository) => {
    setAddingRepo(true);
    try {
      await addMonitoredRepository({
        full_name: repo?.full_name,
        owner: repo?.owner,
        repo: repo?.name,
        is_private: repo?.is_private,
        repository_url: repo?.repository_url,
        github_repo_id: repo?.id,
      });
      toast.success(`Added ${repo?.full_name} to monitoring`);
      await loadAvailableRepos();
      await loadMonitoredRepos();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to add repository"));
    } finally {
      setAddingRepo(false);
    }
  };

  const handleRemoveRepository = async (repoId: string, repoName: string) => {
    if (!window.confirm(`Remove ${repoName} from monitoring?`)) {
      return;
    }
    setRemovingRepoId(repoId);
    try {
      await removeMonitoredRepository(repoId);
      toast.success(`Removed ${repoName} from monitoring`);
      await loadMonitoredRepos();
      await loadAvailableRepos();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove repository"));
    } finally {
      setRemovingRepoId(null);
    }
  };

  // Local draft settings per repo — keyed by repoId
  const [draftSettings, setDraftSettings] = useState<Record<string, any>>({});
  const [savingSettingsId, setSavingSettingsId] = useState<string | null>(null);

  const getDraft = (repo: MonitoredRepo) =>
    draftSettings[repo._id] ?? repo.settings;

  const setDraft = (repoId: string, key: string, value: any) =>
    setDraftSettings((prev) => ({
      ...prev,
      [repoId]: { ...(prev[repoId] ?? {}), [key]: value },
    }));

  const handleSaveSettings = async (repo: MonitoredRepo) => {
    const draft = draftSettings[repo._id];
    if (!draft) return;
    setSavingSettingsId(repo._id);
    try {
      await updateMonitoredRepositorySettings(repo._id, draft);
      toast.success("Settings saved");
      // Clear draft and reload
      setDraftSettings((prev) => { const n = { ...prev }; delete n[repo._id]; return n; });
      await loadMonitoredRepos();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setSavingSettingsId(null);
    }
  };

  const handleToggleEnabled = async (repoId: string, currentEnabled: boolean) => {
    try {
      await updateMonitoredRepositorySettings(repoId, {
        enabled: !currentEnabled,
      });
      toast.success(
        !currentEnabled ? "Repository monitoring enabled" : "Repository monitoring disabled"
      );
      await loadMonitoredRepos();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to toggle monitoring"));
    }
  };

  // Filter available repos
  const filteredAvailable = (availableRepos || [])?.filter?.((repo) => {
    if (showMonitoredOnly && !repo?.isMonitored) return false;
    if (showPrivateOnly && !repo?.is_private) return false;
    if (
      searchQuery &&
      !repo?.full_name?.toLowerCase()?.includes?.(searchQuery?.toLowerCase?.())
    ) {
      return false;
    }
    return true;
  });

  // Filter monitored repos
  const filteredMonitored = (monitoredRepos || [])?.filter?.((repo) => {
    if (
      searchQuery &&
      !repo?.full_name?.toLowerCase()?.includes?.(searchQuery?.toLowerCase?.())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">📦 Repository Monitoring</h1>
        <p className="text-gray-600 mt-2">
          Select repositories to automatically analyze pull requests with AI-powered insights.
        </p>
      </div>

      {/* GitHub Connection Panel */}
      <div className="card bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden rounded-2xl border border-indigo-900/50">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="card-body p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">GitHub Integration</h2>
                <p className="text-indigo-200/80 text-sm mt-1 max-w-xl">
                  Connect your GitHub account to enable GitAgent auto-workflows. Sentra will analyze pull requests, add risk labels, and write detailed architectural reviews automatically.
                </p>
              </div>
            </div>

            {loadingStatus ? (
              <div className="shrink-0 flex items-center justify-center py-2 px-6">
                <span className="loading loading-spinner loading-md text-indigo-400"></span>
              </div>
            ) : githubConnected ? (
              <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                  <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Connected Account</div>
                  <div className="font-bold text-lg text-white flex items-center gap-2 mt-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    @{githubUsername}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="btn btn-sm bg-rose-500 hover:bg-rose-600 border-none text-white font-medium transition duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConnectOAuth}
                  className="btn btn-sm bg-white text-indigo-950 hover:bg-indigo-100 border-none font-semibold shadow-md transition duration-200"
                >
                  Connect via OAuth
                </button>
                <button
                  onClick={() => setShowPatInput(!showPatInput)}
                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold transition duration-200"
                >
                  {showPatInput ? "Hide PAT Field" : "Connect with PAT"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAT Input Card */}
      {showPatInput && !githubConnected && (
        <div className="card bg-base-100 border border-indigo-200/50 shadow-md p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🔑 Connect with Personal Access Token
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Provide a Personal Access Token (classic or fine-grained) with <strong>repo</strong> and <strong>admin:repo_hook</strong> scopes. This token is securely stored and used to query repositories and manage PR hook status.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              placeholder="Paste your GitHub PAT here..."
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              className="input input-bordered flex-1 text-slate-800 bg-white"
            />
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleConnectPat}
                disabled={connectingPat || !patToken}
                className="btn btn-primary"
              >
                {connectingPat ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Verify & Connect"
                )}
              </button>
              <button
                onClick={() => {
                  setShowPatInput(false);
                  setPatToken("");
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value || "")}
            className="input input-bordered w-full text-slate-800 bg-white"
          />
          <div className="mt-3 flex gap-2">
            <label className="checkbox-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrivateOnly}
                onChange={(e) => setShowPrivateOnly(e?.target?.checked || false)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm text-slate-700">Private only</span>
            </label>
            <label className="checkbox-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMonitoredOnly}
                onChange={(e) => setShowMonitoredOnly(e?.target?.checked || false)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm text-slate-700">Already monitoring</span>
            </label>
          </div>
        </div>
      </div>

      {/* Available Repositories */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-xl text-slate-800">🔍 Available Repositories</h2>
          {loadingAvailable ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : !githubConnected ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <svg className="mx-auto h-12 w-12 text-slate-400 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-slate-800">No GitHub Connection</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                Connect your GitHub account using the integration panel above to browse and monitor your repositories.
              </p>
            </div>
          ) : (filteredAvailable || [])?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No repositories found. Try adjusting your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredAvailable || [])?.map?.((repo) => (
                    <tr key={repo?.id}>
                      <td>
                        <div>
                          <a
                            href={repo?.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-500 hover:underline"
                          >
                            {repo?.full_name}
                          </a>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            repo?.is_private ? "badge-warning" : "badge-info"
                          }`}
                        >
                          {repo?.is_private ? "🔒 Private" : "🌐 Public"}
                        </span>
                      </td>
                      <td>
                        {repo?.isMonitored ? (
                          <span className="badge badge-success">✓ Monitored</span>
                        ) : (
                          <span className="badge badge-ghost">Not monitored</span>
                        )}
                      </td>
                      <td>
                        {repo?.isMonitored ? (
                          <button className="btn btn-sm btn-disabled">Added</button>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAddRepository(repo)}
                            disabled={addingRepo}
                          >
                            {addingRepo ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                              "Add +"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Monitored Repositories */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-xl">
            ✅ Monitored Repositories ({(filteredMonitored || [])?.length})
          </h2>
          {loadingMonitored ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (filteredMonitored || [])?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No monitored repositories yet. Add one from the list above.
            </div>
          ) : (
            <div className="space-y-3">
              {(filteredMonitored || [])?.map?.((repo) => (
                <div
                  key={repo?._id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{repo?.full_name}</h3>
                      <p className="text-sm text-gray-600">
                        {repo?.pr_count} PR(s) analyzed •{" "}
                        {formatDate(repo?.last_analysis_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={`btn btn-sm ${repo?.enabled ? "btn-success" : "btn-warning"}`}
                        onClick={() => handleToggleEnabled(repo?._id, repo?.enabled)}
                      >
                        {repo?.enabled ? "🔴 Active" : "⚪ Paused"}
                      </button>
                      <button
                        className={`btn btn-sm ${expandedMonitoredId === repo?._id ? "btn-neutral" : "btn-outline"}`}
                        onClick={() =>
                          setExpandedMonitoredId(
                            expandedMonitoredId === repo?._id ? null : repo?._id
                          )
                        }
                      >
                        ⚙️ Settings
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleRemoveRepository(repo?._id, repo?.full_name)}
                        disabled={removingRepoId === repo?._id}
                      >
                        {removingRepoId === repo?._id ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          "Remove"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Webhook Status */}
                  <div className="mb-3 text-sm">
                    {repo?.github_webhook_id ? (
                      <span className="badge badge-sm badge-success">
                        ✓ Webhook active (ID: {repo?.github_webhook_id})
                      </span>
                    ) : (
                      <span className="badge badge-sm badge-warning">
                        ⚠ Webhook not created
                      </span>
                    )}
                  </div>

                  {/* Expandable Settings */}
                  {expandedMonitoredId === repo?._id && (
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-4 mt-2">
                      <h4 className="font-semibold text-sm text-gray-700">⚙️ Notification Settings</h4>

                      {/* Post PR comment */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={getDraft(repo)?.post_comment !== false}
                          onChange={() => setDraft(repo._id, "post_comment", !(getDraft(repo)?.post_comment !== false))}
                          className="checkbox checkbox-sm mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">💬 Post comment on PR</p>
                          <p className="text-xs text-gray-500">AI analysis will be posted as a comment on the pull request from your GitHub account</p>
                        </div>
                      </label>

                      {/* Send email */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={getDraft(repo)?.send_email !== false}
                          onChange={() => setDraft(repo._id, "send_email", !(getDraft(repo)?.send_email !== false))}
                          className="checkbox checkbox-sm mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">📧 Send email notification</p>
                          <p className="text-xs text-gray-500">Receive an email with the risk summary and severity when a PR is analyzed</p>
                        </div>
                      </label>

                      {/* Delete comment on merge */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={getDraft(repo)?.delete_comment_on_merge !== false}
                          onChange={() => setDraft(repo._id, "delete_comment_on_merge", !(getDraft(repo)?.delete_comment_on_merge !== false))}
                          className="checkbox checkbox-sm mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">⏭️ Delete comment when PR is merged</p>
                          <p className="text-xs text-gray-500">Automatically removes the Sentra analysis comment from GitHub once the PR is merged</p>
                        </div>
                      </label>

                      {/* Severity threshold */}
                      <div>
                        <label className="text-sm font-medium block mb-1">🎚️ Minimum severity to notify</label>
                        <p className="text-xs text-gray-500 mb-2">Only post comment and send email if severity meets or exceeds this level</p>
                        <select
                          value={getDraft(repo)?.severity_threshold || "low"}
                          onChange={(e) => setDraft(repo._id, "severity_threshold", e.target.value)}
                          className="select select-bordered select-sm w-full max-w-xs"
                        >
                          <option value="low">Low — notify on everything</option>
                          <option value="medium">Medium — skip low risk</option>
                          <option value="high">High — only high & critical</option>
                          <option value="critical">Critical only</option>
                        </select>
                      </div>

                      {/* Save button */}
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSaveSettings(repo)}
                          disabled={savingSettingsId === repo._id || !draftSettings[repo._id]}
                        >
                          {savingSettingsId === repo._id ? (
                            <><span className="loading loading-spinner loading-xs"></span> Saving…</>
                          ) : "Save Settings"}
                        </button>
                        {draftSettings[repo._id] && (
                          <button
                            className="btn btn-sm btn-ghost text-gray-500"
                            onClick={() => setDraftSettings((prev) => { const n = { ...prev }; delete n[repo._id]; return n; })}
                          >
                            Discard
                          </button>
                        )}
                        {draftSettings[repo._id] && (
                          <span className="text-xs text-amber-600 font-medium">● Unsaved changes</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
