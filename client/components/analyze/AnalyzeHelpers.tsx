"use client";
import { useState } from "react";

export function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/35 border-t-white shrink-0"
      style={{ animation: "spin 0.7s linear infinite" }}
    />
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
    </button>
  );
}

export function DownloadButton({ text, filename }: { text: string; filename: string }) {
  return (
    <button
      className="px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
      onClick={() => {
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </button>
  );
}
