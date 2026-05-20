import { Repository, ModuleOwnership, DependencyGraph, FragileModule } from "../../models/index.js";
import { fetchCommits, fetchCommitDetails, fetchPackageJson } from "../github/githubService.js";

const inferOwnership = (commits = []) => {
  const stats = {};
  for (const c of commits) {
    const author = c?.author?.login || c?.commit?.author?.name || "unknown";
    const files = c?.files || [];
    for (const f of files) {
      const path = f?.filename || "";
      const top = path.split("/")[0] || "";
      if (!top) continue;
      stats[top] = stats[top] || {};
      stats[top][author] = (stats[top][author] || 0) + 1;
    }
  }
  const map = {};
  for (const dir of Object.keys(stats)) {
    const counts = stats[dir];
    const owners = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    map[dir] = owners[0] || "unknown";
  }
  return map;
};

const detectFragileModules = (commits = [], threshold = 3) => {
  const score = {};
  for (const c of commits) {
    const msg = (c?.commit?.message || "").toLowerCase();
    const isFix = /fix|bug|hotfix|patch/.test(msg);
    const files = c?.files || [];
    for (const f of files) {
      const top = (f?.filename || "").split("/")[0] || "";
      if (!top) continue;
      const inc = isFix ? 2 : 1;
      score[top] = (score[top] || 0) + inc;
    }
  }
  return Object.keys(score).filter(k => score[k] >= threshold);
};

const generateDependencyGraph = (pkg = {}) => {
  const deps = Object.assign({}, pkg?.dependencies || {}, pkg?.devDependencies || {});
  const graph = {};
  graph["root"] = Object.keys(deps);
  return graph;
};

const runAutoBuildOnce = async () => {
  const repos = await Repository.find({ is_active: true }).lean();
  for (const r of repos) {
    const owner = r?.owner || "";
    const name = r?.name || "";
    const commits = await fetchCommits(owner, name, 20);
    const details = [];
    for (const c of commits || []) {
      const sha = c?.sha;
      if (!sha) continue;
      const d = await fetchCommitDetails(owner, name, sha);
      details.push(d);
    }
    const ownership = inferOwnership(details);
    const fragile = detectFragileModules(details);
    const pkg = await fetchPackageJson(owner, name, r?.default_branch || "main");
    const graph = generateDependencyGraph(pkg || {});
    await ModuleOwnership.findOneAndUpdate({ Repo_Id: r._id }, { $set: { ownership_map: ownership } }, { upsert: true });
    await FragileModule.findOneAndUpdate({ Repo_Id: r._id }, { $set: { modules: fragile } }, { upsert: true });
    await DependencyGraph.findOneAndUpdate({ Repo_Id: r._id }, { $set: { dependency_graph: graph } }, { upsert: true });
  }
};

let schedulerStarted = false;
const initAutoBuildScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const interval = Number(process?.env?.CONTEXT_JOB_INTERVAL_MS || 0) || 0;
  if (interval > 0) {
    setInterval(() => { runAutoBuildOnce().catch(() => {}); }, interval);
  }
};

export { runAutoBuildOnce, initAutoBuildScheduler };

