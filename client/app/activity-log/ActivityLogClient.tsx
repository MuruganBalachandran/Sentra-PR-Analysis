"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LogTable } from "@/components/activity-log/LogTable";

type Log = {
  _id: string; Log_Id: string; Email: string; URL: string;
  Status: number; IP: string; Duration: string; Activity: string;
  Created_At: string; Action?: string; Method?: string;
};

type Props = {
  initialLogs: Log[]; filteredTotal: number; overallTotal: number;
  currentPage: number; totalPages: number; limit: number; skip: number; search: string;
};

export default function ActivityLogClient({
  initialLogs, filteredTotal, overallTotal, currentPage, totalPages, limit, skip, search: initSearch,
}: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [search, setSearch] = useState(initSearch);
  const [isPending, startTransition] = useTransition();

  const navigate = (params: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    sp.set("limit", String(params.limit ?? limit));
    sp.set("skip", String(params.skip ?? 0));
    sp.set("search", String(params.search ?? search));
    startTransition(() => router.push(`/activity-log?${sp.toString()}`));
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/activity-log/${id}`);
      setLogs((prev) => prev.filter((l) => (l._id || l.Log_Id) !== id));
      toast.success("Log deleted");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to delete log"); }
  };

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle={<>Audit trail of all API activity. <span className="text-gray-400">{filteredTotal} of {overallTotal} total logs</span></>}
      />

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        {/* Header with search */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <p className="text-[15px] font-semibold text-gray-900">Log entries</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate({ skip: 0, search }); }} className="flex gap-2">
            <input
              className="w-60 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400"
              placeholder="Search URL, email, activity…" value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" disabled={isPending}
              className="px-3.5 py-2 border border-gray-200 bg-white text-[13px] font-medium rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-55 transition">
              Search
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(""); navigate({ skip: 0, search: "" }); }}
                className="px-3 py-2 text-[13px] font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition">
                Clear
              </button>
            )}
          </form>
        </div>

        {logs.length === 0 ? (
          <EmptyState icon="📋" title={`No logs found${search ? ` for "${search}"` : ""}`} />
        ) : (
          <>
            <LogTable logs={logs} onDelete={handleDelete} />
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-gray-400">Page {currentPage} of {totalPages}</span>
                <select
                  value={limit}
                  onChange={(e) => navigate({ limit: Number(e.target.value), skip: 0 })}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-[12px] text-gray-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => navigate({ skip: skip - limit })}
                >← Prev</button>
                <button
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  disabled={currentPage >= totalPages || isPending}
                  onClick={() => navigate({ skip: skip + limit })}
                >Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
