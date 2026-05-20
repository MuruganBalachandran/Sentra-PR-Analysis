"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { CopyButton, DownloadButton } from "@/components/analyze/AnalyzeHelpers";
import { AIBrainLoader } from "@/components/ui/AIBrainLoader";
import { SEV } from "@/components/pr-analyses/SeverityHelpers";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

type AnalysisResult = { riskAnalysis: string; prComment: string; severity: string };
type ParsedURL = { owner: string; repo: string; prNumber: number; fullName: string } | null;

function parseGitHubURL(url: string): ParsedURL {
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/);
  if (m) return { owner: m[1], repo: m[2], prNumber: Number(m[3]), fullName: `${m[1]}/${m[2]}` };
  return null;
}

// ─── shared input classes ──────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400";
const textareaCls = `${inputCls} resize-y`;

export default function AnalyzePRClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<"url" | "manual">("url");

  // URL mode
  const [prUrl, setPrUrl] = useState("");
  const urlParsed = parseGitHubURL(prUrl);

  // Manual mode
  const [form, setForm] = useState({
    owner: "", repo: "", pr_number: "",
    pr_title: "", pr_description: "",
    repo_summary: "", critical_modules: "",
    changed_files: "", code_diff: "",
  });
  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url" && !urlParsed) { toast.error("Enter a valid GitHub PR URL"); return; }
    if (mode === "manual" && !form.code_diff.trim()) { toast.error("Paste the code diff to continue"); return; }

    setLoading(true); setResult(null);
    const toastId = toast.loading("Analyzing with Gemini AI… this may take 15–30s");
    try {
      let payload: Record<string, unknown>;
      if (mode === "url") {
        payload = {
          full_name: urlParsed!.fullName, pr_number: urlParsed!.prNumber,
          pr_title: `PR #${urlParsed!.prNumber} — ${urlParsed!.owner}/${urlParsed!.repo}`,
          pr_description: `GitHub PR: ${prUrl}`,
          repo_summary: `Repository: ${urlParsed!.owner}/${urlParsed!.repo}`,
          changed_files: [], code_diff: "", fragile_modules: [], ownership_map: {}, dependency_graph: {},
        };
      } else {
        payload = {
          full_name: form.owner && form.repo ? `${form.owner.trim()}/${form.repo.trim()}` : "",
          pr_number: Number(form.pr_number) || 0,
          pr_title: form.pr_title, pr_description: form.pr_description, repo_summary: form.repo_summary,
          critical_modules: form.critical_modules,
          changed_files: form.changed_files.split("\n").filter(Boolean),
          code_diff: form.code_diff,
          fragile_modules: [], ownership_map: {}, dependency_graph: {},
        };
      }
      const r = await axiosClient.post("/pr-analyses/analyze", payload);
      setResult(r.data?.response || r.data);
      toast.update(toastId, { render: "✅ Analysis complete!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err: any) {
      toast.update(toastId, { render: err?.response?.data?.message || "Analysis failed", type: "error", isLoading: false, autoClose: 5000 });
    } finally { setLoading(false); }
  };

  const sevKey = (result?.severity || "").toLowerCase();
  const sevData = SEV[sevKey];

  return (
    <div>
      <PageHeader
        title="Analyze a Pull Request"
        subtitle="Paste a GitHub PR link or code diff — Sentra will assess the risk using Gemini AI and save the result."
      />

      {/* ── FORM ── */}
      {!result && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            {(["url", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3.5 px-5 text-sm transition border-b-2 ${
                  mode === m ? "font-semibold text-indigo-600 border-indigo-500" : "font-normal text-gray-500 border-transparent hover:text-gray-800"
                }`}
              >
                {m === "url" ? "🔗  GitHub PR URL" : "📝  Paste Code Diff"}
              </button>
            ))}
          </div>

          <div className="p-5">
            <form onSubmit={handleAnalyze}>
              {/* URL MODE */}
              {mode === "url" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-gray-800">GitHub Pull Request URL</label>
                    <input className={`${inputCls} font-mono`} placeholder="https://github.com/owner/repo/pull/123" value={prUrl} onChange={(e) => setPrUrl(e.target.value)} autoFocus />
                    {prUrl && !urlParsed && (
                      <div className="flex items-center gap-1.5 text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ Expected: https://github.com/owner/repo/pull/number</div>
                    )}
                    {urlParsed && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">✓ Parsed</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">{urlParsed.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">PR #{urlParsed.prNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
                    <strong>Note:</strong> URL mode generates a general risk assessment. For deeper analysis with actual code changes, use the <strong>Paste Code Diff</strong> tab.
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition self-start min-w-[170px] justify-center" type="submit" disabled={loading || !urlParsed}>
                    {loading ? <><AIBrainLoader size="sm" /> Analyzing…</> : "🔍 Analyze PR"}
                  </button>
                </div>
              )}

              {/* MANUAL MODE */}
              {mode === "manual" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">Owner <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input className={inputCls} placeholder="acme-corp" value={form.owner} onChange={set("owner")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">Repository name</label>
                      <input className={inputCls} placeholder="payments-api" value={form.repo} onChange={set("repo")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">PR Number</label>
                      <input className={inputCls} type="number" placeholder="42" value={form.pr_number} onChange={set("pr_number")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">PR Title <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input className={inputCls} placeholder="Fix payment timeout" value={form.pr_title} onChange={set("pr_title")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">Repo Summary <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input className={inputCls} placeholder="E-commerce backend API" value={form.repo_summary} onChange={set("repo_summary")} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-gray-800">PR Description <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea className={textareaCls} rows={2} placeholder="What does this PR change?" value={form.pr_description} onChange={set("pr_description")} />
                  </div>
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: "220px 1fr" }}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">Changed Files <span className="text-gray-400 font-normal">(one per line)</span></label>
                      <textarea className={`${textareaCls} font-mono text-[12px]`} style={{ minHeight: 220 }} placeholder={"src/payments.js\nlib/auth.js"} value={form.changed_files} onChange={set("changed_files")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-gray-800">Code Diff <span className="text-red-500 text-[11px]">* required</span></label>
                      <textarea className={`${textareaCls} font-mono text-[12px]`} style={{ minHeight: 220 }}
                        placeholder={"--- a/src/payments.js\n+++ b/src/payments.js\n@@ -14,7 +14,6 @@\n-  if (!token) return res.status(401);\n+  // auth removed"}
                        value={form.code_diff} onChange={set("code_diff")} required />
                      <span className="text-[11px] text-gray-400">Run <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">git diff HEAD~1 HEAD</code> or copy from GitHub → Files Changed tab</span>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition self-start min-w-[170px] justify-center" type="submit" disabled={loading || !form.code_diff.trim()}>
                    {loading ? <><AIBrainLoader size="sm" /> Analyzing…</> : "🔍 Analyze PR"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl">✓</div>
              <div>
                <p className="font-bold text-base text-gray-900 flex items-center gap-2">
                  Analysis Complete
                  {sevData && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sevData.badgeCls}`}>{sevData.label}</span>}
                </p>
                <p className="text-[12px] text-gray-400">
                  {form.owner && form.repo ? `Saved to PR Analyses for ${form.owner}/${form.repo}` : urlParsed ? `Saved for ${urlParsed.fullName} · PR #${urlParsed.prNumber}` : "Result generated (not saved — owner/repo not provided)"}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => router.push("/pr-analyses")} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">View PR Analyses →</button>
              <button onClick={() => setResult(null)} className="px-3.5 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition">Analyze another</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { icon: "🔬", title: "Risk Analysis", content: result.riskAnalysis },
              { icon: "💬", title: "Generated PR Comment", content: result.prComment },
            ].map(({ icon, title, content }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
                style={{ borderLeft: sevKey === "high" ? "3px solid #ef4444" : sevKey === "medium" ? "3px solid #4f46e5" : sevKey === "low" ? "3px solid #059669" : "3px solid #e5e7eb" }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2"><span>{icon}</span><p className="text-[15px] font-semibold text-gray-900">{title}</p></div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={content} />
                    <DownloadButton text={content} filename={`${title.toLowerCase().replace(/\s+/g, "_")}.md`} />
                  </div>
                </div>
                <div className="px-5 pb-5 pt-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 max-h-[500px] overflow-y-auto">
                    <MarkdownRenderer content={content} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
