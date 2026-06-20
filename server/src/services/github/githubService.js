import crypto from "crypto";
import { env } from "../../config/index.js";

const verifySignature = (signature, payload) => {
  const secret = env?.GITHUB_WEBHOOK_SECRET || "";
  console.log(`[githubService] Verifying signature...`);
  console.log(`[githubService] Secret length: ${secret.length}`);
  console.log(`[githubService] Secret from env: ${secret.substring(0, 10)}...`);
  console.log(`[githubService] Signature from header: ${signature.substring(0, 20)}...`);
  console.log(`[githubService] Payload type: ${typeof payload}`);
  console.log(`[githubService] Payload length: ${payload?.length || 0}`);
  
  if (!secret || !signature) {
    console.warn(`[githubService] Missing secret or signature`);
    console.warn(`[githubService] Secret exists: ${!!secret}, Signature exists: ${!!signature}`);
    return false;
  }
  
  // CRITICAL: Payload MUST be a string for signature verification
  // GitHub signs the exact request body bytes
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  
  console.log(`[githubService] Payload string length: ${payloadStr.length}`);
  console.log(`[githubService] Payload string preview: ${payloadStr.substring(0, 100)}`);
  
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payloadStr).digest("hex");
  console.log(`[githubService] Calculated digest: ${digest.substring(0, 20)}...`);
  console.log(`[githubService] Expected signature: ${signature.substring(0, 20)}...`);
  console.log(`[githubService] Full calculated digest: ${digest}`);
  console.log(`[githubService] Full expected signature: ${signature}`);
  
  try {
    const result = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    console.log(`[githubService] Signature valid: ${result}`);
    return result;
  } catch (err) {
    console.warn(`[githubService] Signature comparison failed:`, err?.message);
    console.warn(`[githubService] Signature length: ${signature.length}, Digest length: ${digest.length}`);
    console.warn(`[githubService] Signature: ${signature}`);
    console.warn(`[githubService] Digest: ${digest}`);
    return false;
  }
};

const ghFetch = async (url, init = {}, userToken = "") => {
    const token = userToken || env?.GITHUB_TOKEN || "";
    
    // Determine auth format based on token type:
    // - OAuth tokens (gho_*): Use "Bearer"
    // - Fine-grained PATs (github_pat_*): Use "Bearer"  
    // - Classic PATs (ghp_*, ghc_*, ghs_*, ghr_*): Use "token"
    const isOAuthOrFineGrained = token.startsWith("gho_") || token.startsWith("github_pat_");
    const authPrefix = isOAuthOrFineGrained ? "Bearer" : "token";
    
    const headers = Object.assign(
        {
            Accept: "application/vnd.github+json",
            "User-Agent": "Sentra",
            Authorization: token ? `${authPrefix} ${token}` : "",
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

const fetchPRDiff = async (owner, repo, number, userToken = "") => {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
  const res = await ghFetch(url, { headers: { Accept: "application/vnd.github.v3.diff" } }, userToken);
  return await res.text();
};

const postPRComment = async (owner, repo, number, body, userToken = "") => {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`;
  const res = await ghFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  }, userToken);
  return await res.json();
};

const deletePRComment = async (owner, repo, commentId, userToken = "") => {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`;
  await ghFetch(url, { method: "DELETE" }, userToken);
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

export { verifySignature, fetchPRDiff, postPRComment, deletePRComment, fetchCommits, fetchCommitDetails, fetchPackageJson };
