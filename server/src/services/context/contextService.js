import { Repository, ModuleOwnership, DependencyGraph, FragileModule } from "../../models/index.js";

const getRepoByFullName = async (fullName = "") => {
  if (!fullName.includes("/")) return null;
  return await Repository.findOne({ full_name: fullName, is_active: true }).lean();
};

const getContextForRepo = async (repoDoc = {}) => {
  if (!repoDoc?._id) return null;
  const [ownership, graph, fragile] = await Promise.all([
    ModuleOwnership.findOne({ Repo_Id: repoDoc._id }).lean(),
    DependencyGraph.findOne({ Repo_Id: repoDoc._id }).lean(),
    FragileModule.findOne({ Repo_Id: repoDoc._id }).lean(),
  ]);
  return {
    repo_summary: repoDoc?.summary || "",
    critical_modules: [],
    ownership_map: ownership?.ownership_map || {},
    fragile_modules: fragile?.modules || [],
    dependency_graph: graph?.dependency_graph || {},
  };
};

export { getRepoByFullName, getContextForRepo };

