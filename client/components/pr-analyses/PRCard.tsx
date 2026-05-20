"use client";
import { useState } from "react";
import { SEV, SeverityBadge, SeverityBar, fmtDate } from "./SeverityHelpers";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { CopyButton, DownloadButton } from "@/components/analyze/AnalyzeHelpers";

type PRAnalysis = {
  _id: string; owner: string; repo: string; pr_number: number; title: string;
  risk_analysis: string; pr_comment: string; severity: string;
  Created_At: string; Updated_At: string;
};

export function PRCard({ item }: { item: PRAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const repoFull = `${item.owner || "?"}/${item.repo || "?"}`;
  const sev = (item.severity || "").toLowerCase();
  const sevData = SEV[sev];

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
      style={{ borderLeft: sevData ? `3px solid ${sevData.borderColor}` : "3px solid #e5e7eb" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-bold text-[14px] text-gray-900">{repoFull}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                PR #{item.pr_number}
              </span>
              {sevData && <SeverityBadge sev={sev} />}
            </div>
            {item.title && (
              <p className="text-[13px] text-gray-500 truncate max-w-[60ch]">{item.title}</p>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {sevData && <SeverityBar sev={sev} />}
            <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(item.Created_At)}</span>
            <span
              className="text-gray-400 transition-transform duration-200 inline-block"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            >⌃</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className={`grid ${item.pr_comment ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {item.risk_analysis && (
              <div className={`p-5 ${item.pr_comment ? "lg:border-r border-b lg:border-b-0 border-gray-100" : ""}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="font-semibold text-[13px] flex items-center gap-1.5">🔬 Risk Analysis</p>
                  <div className="flex items-center gap-2 hidden sm:flex">
                    <CopyButton text={item.risk_analysis} />
                    <DownloadButton text={item.risk_analysis} filename={`risk_analysis_pr_${item.pr_number}.md`} />
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <MarkdownRenderer content={item.risk_analysis} />
                </div>
              </div>
            )}
            {item.pr_comment && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="font-semibold text-[13px] flex items-center gap-1.5">💬 PR Review Comment</p>
                  <div className="flex items-center gap-2 hidden sm:flex">
                    <CopyButton text={item.pr_comment} />
                    <DownloadButton text={item.pr_comment} filename={`pr_comment_${item.pr_number}.md`} />
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <MarkdownRenderer content={item.pr_comment} />
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex gap-5 flex-wrap">
            <span className="text-[11px] text-gray-400"><strong>Repo:</strong> {repoFull}</span>
            <span className="text-[11px] text-gray-400"><strong>Created:</strong> {fmtDate(item.Created_At)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
