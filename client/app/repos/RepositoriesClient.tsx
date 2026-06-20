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

type ApiError = Error & { response?: { status?: number; data?: { message?: string } } };

function getErrorMessage(err: unknown, fallback: string) {
  const e = err as ApiError;
  return e?.response?.data?.message || e?.message || fallback;
}
function getErrorStatus(err: unknown) {
  return (err as ApiError)?.response?.status;
}
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

export default function RepositoriesClient() {
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [monitoredRepos, setMonitoredRepos] = useState<MonitoredRepo[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showPatInput, setShowPatInput] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [connectingPat, setConnectingPat] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingMonitored, setLoadingMonitored] = useState(true);
  const [addingRepo, setAddingRepo] = useState<string | null>(null);
  const [removingRepoId, setRemovingRepoId] = useState<string | null>(null);
  const [expandedMonitoredId, setExpandedMonitoredId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [monitoredSearch, setMonitoredSearch] = useState("");
  const [draftSettings, setDraftSettings] = useState<Record<string, any>>({});
  const [savingSettingsId, setSavingSettingsId] = useState<string | null>(null);

  useEffect(() => {
    checkGitHubStatus();
    loadMonitoredRepos();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast.success("GitHub account connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      toast.error(`GitHub Connection Failed: ${decodeURIComponent(params.get("error") || "")}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkGitHubStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await fetchGitHubStatus();
      setGithubConnected(status?.connected || false);
      setGithubUsername(status?.username || "");
    } catch (err) {
      console.error("Failed to check GitHub status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadAvailableRepos = async () => {
    setLoadingAvailable(true);
    try {
      const data = await fetchAvailableRepositories();
      setAvailableRepos(data?.repositories || []);
    } catch (err) {
      if (getErrorStatus(err) !== 403) toast.error(getErrorMessage(err, "Failed to load repositories"));
    } finally {
      setLoadingAvailable(false);
    }
  };

  const loadMonitoredRepos = async () => {
    setLoadingMonitored(true);
    try {
      const data = await fetchMonitoredRepositories();
      setMonitoredRepos(data?.repositories || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load monitored repositories"));
    } finally {
      setLoadingMonitored(false);
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setModalSearch("");
    if (availableRepos.length === 0) await loadAvailableRepos();
  };

  const handleConnectOAuth = async () => {
    try {
      const data = await getGitHubAuthorizeUrl();
      if (data?.url) window.location.href = data.url;
      else toast.error("Could not generate GitHub authorization URL");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to initiate OAuth flow"));
    }
  };

  const handleConnectPat = async () => {
    if (!patToken.trim()) return;
    setConnectingPat(true);
    try {
      await connectGitHubWithPat(patToken.trim());
      toast.success("GitHub account connected successfully!");
      setPatToken(""); setShowPatInput(false);
      await checkGitHubStatus();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to verify or connect GitHub account"));
    } finally {
      setConnectingPat(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect your GitHub account? This will stop automated PR monitoring.")) return;
    try {
      await disconnectGitHub();
      toast.success("GitHub account disconnected");
      setGithubConnected(false); setGithubUsername(""); setAvailableRepos([]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to disconnect GitHub account"));
    }
  };

  const handleAddRepository = async (repo: Repository) => {
    setAddingRepo(repo.full_name);
    try {
      await addMonitoredRepository({ full_name: repo.full_name, owner: repo.owner, repo: repo.name, is_private: repo.is_private, repository_url: repo.repository_url, github_repo_id: repo.id });
      toast.success(`Added ${repo.full_name} to monitoring`);
      await loadAvailableRepos();
      await loadMonitoredRepos();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add repository"));
    } finally {
      setAddingRepo(null);
    }
  };

  const handleRemoveRepository = async (repoId: string, repoName: string) => {
    if (!window.confirm(`Remove ${repoName} from monitoring?`)) return;
    setRemovingRepoId(repoId);
    try {
      await removeMonitoredRepository(repoId);
      toast.success(`Removed ${repoName} from monitoring`);
      await loadMonitoredRepos();
      setAvailableRepos((prev) => prev.map((r) => r.full_name === repoName ? { ...r, isMonitored: false } : r));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove repository"));
    } finally {
      setRemovingRepoId(null);
    }
  };

  const getDraft = (repo: MonitoredRepo) => draftSettings[repo._id] ?? repo.settings;
  const setDraft = (repoId: string, key: string, value: any) =>
    setDraftSettings((prev) => ({ ...prev, [repoId]: { ...(prev[repoId] ?? {}), [key]: value } }));

  const handleSaveSettings = async (repo: MonitoredRepo) => {
    const draft = draftSettings[repo._id];
    if (!draft) return;
    setSavingSettingsId(repo._id);
    try {
      await updateMonitoredRepositorySettings(repo._id, draft);
      toast.success("Settings saved");
      setDraftSettings((prev) => { const n = { ...prev }; delete n[repo._id]; return n; });
      await loadMonitoredRepos();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setSavingSettingsId(null);
    }
  };

  const handleToggleEnabled = async (repoId: string, current: boolean) => {
    try {
      await updateMonitoredRepositorySettings(repoId, { enabled: !current });
      toast.success(!current ? "Monitoring enabled" : "Monitoring paused");
      await loadMonitoredRepos();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to toggle monitoring"));
    }
  };

  const filteredMonitored = monitoredRepos.filter((r) =>
    !monitoredSearch || r.full_name.toLowerCase().includes(monitoredSearch.toLowerCase())
  );

  const filteredAvailable = availableRepos.filter((r) => {
    if (showPrivateOnly && !r.is_private) return false;
    if (modalSearch && !r.full_name.toLowerCase().includes(modalSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">📦 Repository Monitoring</h1>
        <p className="text-gray-500 mt-1 text-sm">Automatically analyze pull requests with AI-powered risk insights.</p>
      </div>

      {/* GitHub Connection Panel */}
      <div className="rounded-2xl overflow-hidden border border-indigo-900/40 shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 shrink-0">
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">GitHub Integration</h2>
                <p className="text-slate-400 text-sm mt-1 max-w-md">
                  Connect your GitHub account to enable automated PR analysis via webhooks.
                </p>
              </div>
            </div>

            {loadingStatus ? (
              <span className="loading loading-spinner loading-md text-indigo-400 shrink-0"></span>
            ) : githubConnected ? (
              <div className="shrink-0 flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connected as</p>
                  <p className="text-white font-bold text-base flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    @{githubUsername}
                  </p>
                </div>
                <button onClick={handleDisconnect} className="btn btn-sm bg-rose-500 hover:bg-rose-600 border-none text-white">
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="shrink-0 flex flex-col sm:flex-row gap-2">
                <button onClick={handleConnectOAuth} className="btn btn-sm bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold">
                  Connect via OAuth
                </button>
                <button onClick={() => setShowPatInput(!showPatInput)} className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold">
                  {showPatInput ? "Hide PAT" : "Connect with PAT"}
                </button>
              </div>
            )}
          </div>

          {/* PAT input inline */}
          {showPatInput && !githubConnected && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-slate-400 text-xs mb-3">Needs <strong className="text-white">repo</strong> + <strong className="text-white">admin:repo_hook</strong> scopes.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your GitHub PAT..."
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  className="input input-sm input-bordered flex-1 bg-white/10 border-white/20 text-white placeholder-slate-500"
                />
                <button onClick={handleConnectPat} disabled={connectingPat || !patToken} className="btn btn-sm bg-indigo-500 hover:bg-indigo-600 border-none text-white">
                  {connectingPat ? <span className="loading loading-spinner loading-xs" /> : "Verify & Connect"}
                </button>
                <button onClick={() => { setShowPatInput(false); setPatToken(""); }} className="btn btn-sm btn-ghost text-slate-400">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monitored Repositories — TOP */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">✅ Monitored Repositories ({filteredMonitored.length})</h2>
            <p className="text-xs text-gray-500 mt-0.5">Repos being watched for new pull requests</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={monitoredSearch}
              onChange={(e) => setMonitoredSearch(e.target.value)}
              className="input input-sm input-bordered text-slate-800 bg-white w-40"
            />
            <button
              onClick={handleOpenAddModal}
              disabled={!githubConnected}
              className="btn btn-sm btn-primary gap-1"
              title={!githubConnected ? "Connect GitHub first" : ""}
            >
              + Add Repo
            </button>
          </div>
        </div>

        <div className="p-5">
          {loadingMonitored ? (
            <div className="flex justify-center py-10"><span className="loading loading-spinner loading-md" /></div>
          ) : filteredMonitored.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm font-semibold text-slate-700">No repositories monitored yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Connect GitHub and click + Add Repo to get started</p>
              {githubConnected && (
                <button onClick={handleOpenAddModal} className="btn btn-sm btn-primary">+ Add Repository</button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMonitored.map((repo) => (
                <div key={repo._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">{repo.full_name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{repo.pr_count} PR(s) analyzed • Last: {formatDate(repo.last_analysis_at)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className={`btn btn-xs ${repo.enabled ? "btn-success" : "btn-warning"}`}
                        onClick={() => handleToggleEnabled(repo._id, repo.enabled)}
                      >
                        {repo.enabled ? "🟢 Active" : "⏸ Paused"}
                      </button>
                      <button
                        className={`btn btn-xs ${expandedMonitoredId === repo._id ? "btn-neutral" : "btn-outline"}`}
                        onClick={() => setExpandedMonitoredId(expandedMonitoredId === repo._id ? null : repo._id)}
                      >
                        ⚙️ Settings
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => handleRemoveRepository(repo._id, repo.full_name)}
                        disabled={removingRepoId === repo._id}
                      >
                        {removingRepoId === repo._id ? <span className="loading loading-spinner loading-xs" /> : "Remove"}
                      </button>
                    </div>
                  </div>

                  <div>
                    {repo.github_webhook_id ? (
                      <span className="badge badge-xs badge-success">✓ Webhook active</span>
                    ) : (
                      <span className="badge badge-xs badge-warning">⚠ Webhook not created</span>
                    )}
                  </div>

                  {/* Settings panel */}
                  {expandedMonitoredId === repo._id && (
                    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notification Settings</p>

                      {[
                        { key: "post_comment", label: "💬 Post comment on PR", desc: "AI analysis posted as a comment on GitHub PR from your account" },
                        { key: "send_email", label: "📧 Send email notification", desc: "Email with risk summary when a PR is analyzed" },
                        { key: "delete_comment_on_merge", label: "⏭️ Delete comment when merged", desc: "Removes the Sentra comment automatically when PR is merged" },
                      ].map(({ key, label, desc }) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getDraft(repo)?.[key] !== false}
                            onChange={() => setDraft(repo._id, key, !(getDraft(repo)?.[key] !== false))}
                            className="checkbox checkbox-sm mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                        </label>
                      ))}

                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">🎚️ Minimum severity to notify</label>
                        <select
                          value={getDraft(repo)?.severity_threshold || "low"}
                          onChange={(e) => setDraft(repo._id, "severity_threshold", e.target.value)}
                          className="select select-bordered select-sm w-full max-w-xs text-slate-800"
                        >
                          <option value="low">Low — notify on everything</option>
                          <option value="medium">Medium — skip low risk</option>
                          <option value="high">High — only high & critical</option>
                          <option value="critical">Critical only</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSaveSettings(repo)}
                          disabled={savingSettingsId === repo._id || !draftSettings[repo._id]}
                        >
                          {savingSettingsId === repo._id ? <><span className="loading loading-spinner loading-xs" /> Saving…</> : "Save Settings"}
                        </button>
                        {draftSettings[repo._id] && (
                          <>
                            <button className="btn btn-sm btn-ghost text-gray-500" onClick={() => setDraftSettings((p) => { const n = { ...p }; delete n[repo._id]; return n; })}>
                              Discard
                            </button>
                            <span className="text-xs text-amber-600 font-medium">● Unsaved changes</span>
                          </>
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

      {/* Add Repository Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add Repository to Monitor</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a repository to start automated PR analysis</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-sm btn-ghost btn-circle text-gray-400">✕</button>
            </div>

            {/* Search + filters */}
            <div className="px-6 py-3 border-b border-gray-100 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Search repositories..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="input input-sm input-bordered flex-1 text-slate-800 bg-white"
                autoFocus
              />
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600 shrink-0">
                <input type="checkbox" checked={showPrivateOnly} onChange={(e) => setShowPrivateOnly(e.target.checked)} className="checkbox checkbox-xs" />
                Private only
              </label>
            </div>

            {/* Repo list */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {loadingAvailable ? (
                <div className="flex justify-center py-10"><span className="loading loading-spinner loading-md" /></div>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">No repositories found</p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className={`badge badge-xs ${repo.is_private ? "badge-warning" : "badge-info"}`}>
                          {repo.is_private ? "🔒 Private" : "🌐 Public"}
                        </span>
                        <a href={repo.repository_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-800 hover:text-indigo-600">
                          {repo.full_name}
                        </a>
                      </div>
                      {repo.isMonitored ? (
                        <span className="badge badge-sm badge-success">✓ Added</span>
                      ) : (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleAddRepository(repo)}
                          disabled={addingRepo === repo.full_name}
                        >
                          {addingRepo === repo.full_name ? <span className="loading loading-spinner loading-xs" /> : "+ Add"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn btn-sm btn-ghost text-gray-500">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
