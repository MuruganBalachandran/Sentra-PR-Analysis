import crypto from "crypto";
import { env } from "../../config/index.js";

const verifySignature = (signature, payload) => {
  const secret = env?.GITHUB_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
};

const ghFetch = async (url, init = {}) => {
  const token = env?.GITHUB_TOKEN || "";
  const headers = Object.assign(
    {
      Accept: "application/vnd.github+json",
      "User-Agent": "Sentra",
      Authorization: token ? `Bearer ${token}` : "",
    },
    init.headers || {}
  );
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res;
};

const fetchPRDiff = async (owner, repo, number) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
  const res = await ghFetch(url, { headers: { Accept: "application/vnd.github.v3.diff" } });
  return await res.text();
};

const postPRComment = async (owner, repo, number, body) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`;
  const res = await ghFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return await res.json();
};

const fetchCommits = async (owner, repo, perPage = 50) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}`;
  const res = await ghFetch(url);
  return await res.json();
};

const fetchCommitDetails = async (owner, repo, sha) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const res = await ghFetch(url);
  return await res.json();
};

const fetchPackageJson = async (owner, repo, branch = "main") => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${branch}`;
  const res = await ghFetch(url);
  const data = await res.json();
  const content = data?.content ? Buffer.from(data.content, "base64").toString("utf8") : "";
  return content ? JSON.parse(content) : null;
};

export { verifySignature, fetchPRDiff, postPRComment, fetchCommits, fetchCommitDetails, fetchPackageJson };
