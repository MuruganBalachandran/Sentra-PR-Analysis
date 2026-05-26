import { axiosClient } from "@/lib/axios";

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

/**
 * Fetch all available workflow templates
 */
export async function fetchWorkflowTemplates() {
  try {
    const res = await axiosClient.get("/workflows/templates");
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchWorkflowTemplates error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Fetch workflows for a repository
 * @param owner Repository owner
 * @param repo Repository name
 */
export async function fetchRepositoryWorkflows(owner: string, repo: string) {
  try {
    const res = await axiosClient.get(`/workflows/${owner}/${repo}`);
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchRepositoryWorkflows error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Fetch workflow runs for a specific workflow
 * @param owner Repository owner
 * @param repo Repository name
 * @param workflowId Workflow ID
 */
export async function fetchWorkflowRuns(
  owner: string,
  repo: string,
  workflowId: number
) {
  try {
    const res = await axiosClient.get(
      `/workflows/${owner}/${repo}/${workflowId}/runs`
    );
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] fetchWorkflowRuns error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Trigger a workflow dispatch
 * @param owner Repository owner
 * @param repo Repository name
 * @param workflowId Workflow ID
 * @param ref Git reference (branch/tag)
 * @param inputs Workflow inputs
 */
export async function triggerWorkflow(
  owner: string,
  repo: string,
  workflowId: number,
  ref: string = "main",
  inputs: Record<string, any> = {}
) {
  try {
    const res = await axiosClient.post(
      `/workflows/${owner}/${repo}/${workflowId}/trigger`,
      { ref, inputs }
    );
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] triggerWorkflow error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Create a new workflow from template
 * @param owner Repository owner
 * @param repo Repository name
 * @param templateId Template ID
 * @param fileName Workflow file name
 * @param options Template options
 * @param branch Target branch
 * @param message Commit message
 */
export async function createWorkflow(
  owner: string,
  repo: string,
  templateId: string,
  fileName: string,
  options: Record<string, any> = {},
  branch: string = "main",
  message: string = ""
) {
  try {
    const res = await axiosClient.post(`/workflows/${owner}/${repo}`, {
      templateId,
      fileName,
      options,
      branch,
      message,
    });
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] createWorkflow error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Delete a workflow file
 * @param owner Repository owner
 * @param repo Repository name
 * @param path Workflow file path
 * @param branch Target branch
 * @param message Commit message
 */
export async function deleteWorkflow(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main",
  message: string = ""
) {
  try {
    const res = await axiosClient.delete(`/workflows/${owner}/${repo}`, {
      data: { path, branch, message },
    });
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] deleteWorkflow error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Cancel a workflow run
 * @param owner Repository owner
 * @param repo Repository name
 * @param runId Workflow run ID
 */
export async function cancelWorkflowRun(
  owner: string,
  repo: string,
  runId: number
) {
  try {
    const res = await axiosClient.post(
      `/workflows/${owner}/${repo}/runs/${runId}/cancel`
    );
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] cancelWorkflowRun error:", getErrorMessage(err));
    throw err;
  }
}

/**
 * Re-run a workflow
 * @param owner Repository owner
 * @param repo Repository name
 * @param runId Workflow run ID
 */
export async function rerunWorkflow(
  owner: string,
  repo: string,
  runId: number
) {
  try {
    const res = await axiosClient.post(
      `/workflows/${owner}/${repo}/runs/${runId}/rerun`
    );
    return res?.data?.response || {};
  } catch (err: unknown) {
    console.error("[API] rerunWorkflow error:", getErrorMessage(err));
    throw err;
  }
}
