"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchWorkflowTemplates,
  fetchRepositoryWorkflows,
  fetchWorkflowRuns,
  triggerWorkflow,
  createWorkflow,
  deleteWorkflow,
  cancelWorkflowRun,
  rerunWorkflow,
} from "@/lib/workflowsApi";
import { fetchMonitoredRepositories } from "@/lib/reposApi";
import { fetchGitHubStatus } from "@/lib/githubApi";

type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  options: Array<{
    name: string;
    type: string;
    default?: string;
    required?: boolean;
    description: string;
  }>;
};

type Workflow = {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  badge_url: string;
};

type WorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
};

type MonitoredRepo = {
  _id: string;
  full_name: string;
  owner: string;
  repo: string;
};


export default function WorkflowsClient() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  const [monitoredRepos, setMonitoredRepos] = useState<MonitoredRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<MonitoredRepo | null>(null);
  
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [workflowFileName, setWorkflowFileName] = useState("");
  const [templateOptions, setTemplateOptions] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkGitHubStatus();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (githubConnected) {
      loadMonitoredRepos();
    }
  }, [githubConnected]);

  useEffect(() => {
    if (selectedRepo) {
      loadWorkflows();
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedWorkflow && selectedRepo) {
      loadWorkflowRuns();
    }
  }, [selectedWorkflow, selectedRepo]);

  const checkGitHubStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await fetchGitHubStatus();
      setGithubConnected(status?.connected || false);
    } catch (err) {
      console.error("Failed to check GitHub status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadMonitoredRepos = async () => {
    try {
      const data = await fetchMonitoredRepositories();
      setMonitoredRepos(data?.repositories || []);
      if (data?.repositories?.length > 0) {
        setSelectedRepo(data.repositories[0]);
      }
    } catch (err) {
      toast.error("Failed to load repositories");
    }
  };


  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await fetchWorkflowTemplates();
      setTemplates(data?.templates || []);
    } catch (err) {
      toast.error("Failed to load workflow templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadWorkflows = async () => {
    if (!selectedRepo) return;
    setLoadingWorkflows(true);
    try {
      const data = await fetchRepositoryWorkflows(
        selectedRepo.owner,
        selectedRepo.repo
      );
      setWorkflows(data?.workflows || []);
    } catch (err) {
      toast.error("Failed to load workflows");
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const loadWorkflowRuns = async () => {
    if (!selectedRepo || !selectedWorkflow) return;
    setLoadingRuns(true);
    try {
      const data = await fetchWorkflowRuns(
        selectedRepo.owner,
        selectedRepo.repo,
        selectedWorkflow.id
      );
      setWorkflowRuns(data?.runs || []);
    } catch (err) {
      toast.error("Failed to load workflow runs");
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedRepo || !selectedTemplate || !workflowFileName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      await createWorkflow(
        selectedRepo.owner,
        selectedRepo.repo,
        selectedTemplate.id,
        workflowFileName,
        templateOptions
      );
      toast.success("Workflow created successfully!");
      setShowCreateModal(false);
      setWorkflowFileName("");
      setTemplateOptions({});
      setSelectedTemplate(null);
      await loadWorkflows();
    } catch (err) {
      toast.error("Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  const handleTriggerWorkflow = async (workflowId: number) => {
    if (!selectedRepo) return;
    try {
      await triggerWorkflow(selectedRepo.owner, selectedRepo.repo, workflowId);
      toast.success("Workflow triggered successfully!");
      setTimeout(() => loadWorkflowRuns(), 2000);
    } catch (err) {
      toast.error("Failed to trigger workflow");
    }
  };

  const handleCancelRun = async (runId: number) => {
    if (!selectedRepo) return;
    try {
      await cancelWorkflowRun(selectedRepo.owner, selectedRepo.repo, runId);
      toast.success("Workflow run cancelled");
      await loadWorkflowRuns();
    } catch (err) {
      toast.error("Failed to cancel workflow run");
    }
  };

  const handleRerunWorkflow = async (runId: number) => {
    if (!selectedRepo) return;
    try {
      await rerunWorkflow(selectedRepo.owner, selectedRepo.repo, runId);
      toast.success("Workflow re-run triggered");
      setTimeout(() => loadWorkflowRuns(), 2000);
    } catch (err) {
      toast.error("Failed to re-run workflow");
    }
  };


  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!githubConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">GitHub Workflows</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Please connect your GitHub account to manage workflows.
            </p>
            <a
              href="/repos"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Connect GitHub
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">GitHub Workflows</h1>
        <p className="text-gray-600">
          Manage automated CI/CD workflows for your repositories
        </p>
      </div>

      {/* Repository Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Repository
        </label>
        <select
          value={selectedRepo?.full_name || ""}
          onChange={(e) => {
            const repo = monitoredRepos.find((r) => r.full_name === e.target.value);
            setSelectedRepo(repo || null);
            setSelectedWorkflow(null);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a repository...</option>
          {monitoredRepos.map((repo) => (
            <option key={repo._id} value={repo.full_name}>
              {repo.full_name}
            </option>
          ))}
        </select>
      </div>

      {selectedRepo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflows List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Workflows</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  + New
                </button>
              </div>

              {loadingWorkflows ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : workflows.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No workflows found
                </p>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? "bg-blue-50 border-blue-500"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium text-sm">{workflow.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {workflow.path}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            workflow.state === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {workflow.state}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* Workflow Runs */}
          <div className="lg:col-span-2">
            {selectedWorkflow ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedWorkflow.name} - Runs
                  </h2>
                  <button
                    onClick={() => handleTriggerWorkflow(selectedWorkflow.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    ▶ Trigger
                  </button>
                </div>

                {loadingRuns ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : workflowRuns.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No workflow runs yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {workflowRuns.map((run) => (
                      <div
                        key={run.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  run.status === "completed"
                                    ? run.conclusion === "success"
                                      ? "bg-green-100 text-green-800"
                                      : run.conclusion === "failure"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                    : run.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {run.status === "completed"
                                  ? run.conclusion || "completed"
                                  : run.status}
                              </span>
                              <span className="text-sm text-gray-600">
                                #{run.run_number}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              {run.head_branch}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(run.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={run.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </a>
                            {run.status === "in_progress" && (
                              <button
                                onClick={() => handleCancelRun(run.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Cancel
                              </button>
                            )}
                            {run.status === "completed" && (
                              <button
                                onClick={() => handleRerunWorkflow(run.id)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Re-run
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center py-8">
                  Select a workflow to view runs
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Workflow</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Template
                  </label>
                  <select
                    value={selectedTemplate?.id || ""}
                    onChange={(e) => {
                      const template = templates.find((t) => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                      setTemplateOptions({});
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workflow File Name
                      </label>
                      <input
                        type="text"
                        value={workflowFileName}
                        onChange={(e) => setWorkflowFileName(e.target.value)}
                        placeholder="e.g., ci.yml"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {selectedTemplate.options.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Template Options
                        </h3>
                        <div className="space-y-3">
                          {selectedTemplate.options.map((option) => (
                            <div key={option.name}>
                              <label className="block text-sm text-gray-600 mb-1">
                                {option.description}
                                {option.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                value={templateOptions[option.name] || option.default || ""}
                                onChange={(e) =>
                                  setTemplateOptions({
                                    ...templateOptions,
                                    [option.name]: e.target.value,
                                  })
                                }
                                placeholder={option.default}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                    setWorkflowFileName("");
                    setTemplateOptions({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!selectedTemplate || !workflowFileName || creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Workflow"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
