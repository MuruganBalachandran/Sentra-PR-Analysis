import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { Repository, ModuleOwnership, DependencyGraph, FragileModule } from "../../models/index.js";

const upsertRepository = async (req = {}, res = {}) => {
  try {
    const b = req?.body || {};
    const full = b?.full_name || "";
    if (!full.includes("/")) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "full_name required");
    }
    const [owner, name] = full.split("/");
    const doc = await Repository.findOneAndUpdate(
      { full_name: full },
      {
        $set: {
          owner,
          name,
          summary: b?.summary || "",
          default_branch: b?.default_branch || "main",
          is_active: b?.is_active !== false,
        },
      },
      { upsert: true, new: true }
    );
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Repository upserted", doc);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "failed");
  }
};

const upsertOwnership = async (req = {}, res = {}) => {
  try {
    const b = req?.body || {};
    const repo = await Repository.findOne({ full_name: b?.full_name || "" });
    if (!repo) return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "repo not found");
    const doc = await ModuleOwnership.findOneAndUpdate(
      { Repo_Id: repo._id },
      { $set: { ownership_map: b?.ownership_map || {} } },
      { upsert: true, new: true }
    );
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Ownership upserted", doc);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "failed");
  }
};

const upsertDependencyGraph = async (req = {}, res = {}) => {
  try {
    const b = req?.body || {};
    const repo = await Repository.findOne({ full_name: b?.full_name || "" });
    if (!repo) return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "repo not found");
    const doc = await DependencyGraph.findOneAndUpdate(
      { Repo_Id: repo._id },
      { $set: { dependency_graph: b?.dependency_graph || {} } },
      { upsert: true, new: true }
    );
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Dependency graph upserted", doc);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "failed");
  }
};

const upsertFragileModules = async (req = {}, res = {}) => {
  try {
    const b = req?.body || {};
    const repo = await Repository.findOne({ full_name: b?.full_name || "" });
    if (!repo) return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "repo not found");
    const doc = await FragileModule.findOneAndUpdate(
      { Repo_Id: repo._id },
      { $set: { modules: b?.modules || [], notes: b?.notes || "" } },
      { upsert: true, new: true }
    );
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Fragile modules upserted", doc);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "failed");
  }
};

export { upsertRepository, upsertOwnership, upsertDependencyGraph, upsertFragileModules };

