"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import Modal from "@/components/common/Modal";

type PRAnalysis = {
  _id: string;
  owner: string;
  repo: string;
  pr_number: number;
  title: string;
  risk_analysis: string;
  pr_comment: string;
  severity: string;
  Created_At: string;
  Updated_At: string;
};

type Props = {
  isAdmin: boolean;
};

const SEV: Record<string, { cls: string; label: string; bar: string; border: string }> = {
  high:   { cls: "badge badge-danger",  label: "🔴 High",   bar: "var(--danger)",   border: "#fca5a5" },
  medium: { cls: "badge badge-accent",  label: "🟡 Medium", bar: "var(--accent)",   border: "#c4b5fd" },
  low:    { cls: "badge badge-success", label: "🟢 Low",    bar: "#059669",         border: "#6ee7b7" },
};

function fmtDate(raw: string) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return raw; }
}

function SeverityBar({ sev }: { sev: string }) {
  const levels = ["low", "medium", "high"];
  const idx = levels.indexOf(sev);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {levels.map((l, i) => (
        <div key={l} style={{
          height: 5, width: 20, borderRadius: 3,
          background: i <= idx ? (SEV[l]?.bar || "var(--border)") : "var(--border)",
        }} />
      ))}
    </div>
  );
}

export default function PRAnalysesClient({ isAdmin }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [items, setItems] = useState<PRAnalysis[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Get params from URL
  const fullNameFilter = searchParams.get("full_name") || "";
  const searchFilter = searchParams.get("search") || "";
  const dateRange = searchParams.get("date_range") || "latest";
  const limit = Number(searchParams.get("limit") || 5);
  const skip = Number(searchParams.get("skip") || 0);

  // Form inputs
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [dateRangeInput, setDateRangeInput] = useState(dateRange);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  // Set default limit in URL if not present
  useEffect(() => {
    if (!searchParams.get("limit")) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("limit", "5");
      sp.set("skip", "0");
      router.replace(`/pr-analyses?${sp.toString()}`);
    }
  }, []);

  // Fetch data whenever URL params change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedIds(new Set()); // Clear selection on page change
      try {
        const query = new URLSearchParams();
        if (fullNameFilter) query.set("full_name", fullNameFilter);
        if (searchFilter) query.set("search", searchFilter);
        if (dateRange) query.set("date_range", dateRange);
        query.set("limit", String(limit));
        query.set("skip", String(skip));

        const res = await axiosClient.get(`/pr-analyses?${query.toString()}`);
        const data = res.data?.response || res.data;
        
        if (Array.isArray(data)) {
          setItems(data);
          setTotal(data.length);
        } else {
          setItems(data?.items || []);
          setTotal(data?.total ?? 0);
        }
      } catch (err) {
        console.error("Error fetching PR analyses:", err);
        toast.error("Failed to load PR analyses");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fullNameFilter, searchFilter, dateRange, limit, skip]);

  // Sync form inputs with URL params
  useEffect(() => {
    setSearchInput(searchFilter);
    setDateRangeInput(dateRange || "latest");
  }, [searchFilter, dateRange]);

  const navigate = (params: { full_name?: string; search?: string; date_range?: string; limit?: number; skip?: number }) => {
    const sp = new URLSearchParams();
    const fn = params.full_name !== undefined ? params.full_name : fullNameFilter;
    const sr = params.search !== undefined ? params.search : searchFilter;
    const dr = params.date_range !== undefined ? params.date_range : dateRange;
    const lm = params.limit !== undefined ? params.limit : limit;
    const sk = params.skip !== undefined ? params.skip : skip;
    
    if (fn) sp.set("full_name", fn);
    if (sr) sp.set("search", sr);
    if (dr && dr !== "latest") sp.set("date_range", dr);
    sp.set("limit", String(lm));
    sp.set("skip", String(sk));
    
    router.push(`/pr-analyses?${sp.toString()}`);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ 
      search: searchInput.trim(), 
      date_range: dateRangeInput,
      skip: 0 
    });
  };

  const handleClear = () => {
    setSearchInput("");
    setDateRangeInput("latest");
    navigate({ full_name: "", search: "", date_range: "latest", skip: 0 });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map(item => item._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const count = selectedIds.size;
    setDeleteModalOpen(false);
    
    setDeleting(true);
    try {
      // Delete all selected items
      await Promise.all(
        Array.from(selectedIds).map(id => axiosClient.delete(`/pr-analyses/${id}`))
      );
      
      toast.success(`${count} PR analysis${count > 1 ? 'es' : ''} deleted successfully`);
      
      // Calculate new total after deletion
      const newTotal = total - count;
      const remainingOnCurrentPage = items.length - count;
      
      // If current page is now empty and we're not on page 1, go to previous page
      let newSkip = skip;
      if (remainingOnCurrentPage === 0 && skip > 0) {
        // Go to last page with data
        const newTotalPages = Math.ceil(newTotal / limit);
        newSkip = Math.max(0, (newTotalPages - 1) * limit);
      }
      
      // Refetch data
      const query = new URLSearchParams();
      if (fullNameFilter) query.set("full_name", fullNameFilter);
      if (searchFilter) query.set("search", searchFilter);
      query.set("limit", String(limit));
      query.set("skip", String(newSkip));

      const res = await axiosClient.get(`/pr-analyses?${query.toString()}`);
      const data = res.data?.response || res.data;
      
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      } else {
        setItems(data?.items || []);
        setTotal(data?.total ?? 0);
      }
      
      // Update URL if skip changed
      if (newSkip !== skip) {
        navigate({ skip: newSkip });
      }
      
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete PR analyses");
    } finally {
      setDeleting(false);
    }
  };

  const hasFilter = !!(searchInput.trim() || (dateRangeInput && dateRangeInput !== "latest"));
  const hasActiveFilter = !!(searchFilter || (dateRange && dateRange !== "latest"));
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  if (loading) {
    return (
      <main>
        <div className="page-header">
          <h1 className="page-title">PR Analyses</h1>
          <p className="page-subtitle">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">PR Analyses</h1>
          <p className="page-subtitle">
            Intelligent risk assessments powered by Sentra × Gemini AI.
            {total > 0 && <> <strong>{total}</strong> result{total !== 1 ? "s" : ""}.</>}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleFilter} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-muted)", pointerEvents: "none" }} viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a4 4 0 100 8 4 4 0 000-8zM2 7a5 5 0 1110 0A5 5 0 012 7zm13.293 7.293a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414-1.414l1-1z" />
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search owner/repo, title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div style={{ position: "relative", flex: "0 1 140px", minWidth: 120 }}>
          <select
            className="form-input"
            value={dateRangeInput}
            onChange={(e) => setDateRangeInput(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="1d">Last 24 Hours</option>
            <option value="1w">Last Week</option>
            <option value="1m">Last Month</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          Apply
        </button>
        <button 
          className="btn btn-ghost" 
          type="button" 
          onClick={handleClear}
          disabled={!hasFilter}
          style={{ opacity: hasFilter ? 1 : 0.5, cursor: hasFilter ? "pointer" : "not-allowed" }}
        >
          Clear ✕
        </button>
      </form>

      {/* Selection toolbar - shows when items are selected */}
      {selectedIds.size > 0 && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "12px 16px", 
          marginBottom: 16, 
          background: "#eff6ff", 
          border: "1px solid #bfdbfe", 
          borderRadius: "8px",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1e40af" }}>
              {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="btn btn-sm"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              border: "1px solid #ef4444",
              background: "#ef4444",
              color: "white",
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {deleting ? "Deleting..." : `🗑️ Delete ${selectedIds.size > 1 ? `${selectedIds.size} items` : "1 item"}`}
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilter && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {searchFilter && <span className="badge badge-neutral">search: "{searchFilter}"</span>}
          {dateRange && dateRange !== "latest" && <span className="badge badge-neutral">date: {dateRange === "oldest" ? "oldest first" : dateRange === "1d" ? "last 24h" : dateRange === "1w" ? "last week" : dateRange === "1m" ? "last month" : "last year"}</span>}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card">
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)", margin: "0 0 6px" }}>
              {hasActiveFilter ? "No results match your filters" : "No PR analyses yet"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px", maxWidth: 380, marginInline: "auto" }}>
              {hasActiveFilter
                ? "Try clearing the filters or adjusting your search."
                : "Analyses appear here after you run the Analyze PR tool or when GitHub webhooks process pull requests."}
            </p>
          </div>
        </div>
      )}

      {/* Analysis cards */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((x) => {
            const isExp = expanded === x._id;
            const isSelected = selectedIds.has(x._id);
            const repoFull = `${x.owner || "?"}/${x.repo || "?"}`;
            const sev = (x.severity || "").toLowerCase();
            const sevData = SEV[sev];

            return (
              <div 
                key={x._id} 
                style={{ 
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12
                }}
              >
                {/* Checkbox outside card */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectItem(x._id, e.target.checked)}
                  style={{ 
                    width: 18, 
                    height: 18, 
                    marginTop: 16,
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
                
                {/* Card */}
                <div 
                  className="card" 
                  style={{ 
                    flex: 1,
                    borderLeft: sevData ? `3px solid ${sevData.border}` : "3px solid var(--border)", 
                    overflow: "hidden",
                    background: isSelected ? "#f0f9ff" : "white",
                    transition: "background 0.2s"
                  }}
                >
                  <button
                    onClick={() => setExpanded(isExp ? null : x._id)}
                    style={{ 
                      width: "100%",
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      padding: "14px 20px",
                      textAlign: "left"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{repoFull}</span>
                          <span className="badge badge-neutral">PR #{x.pr_number}</span>
                          {sevData && <span className={sevData.cls}>{sevData.label}</span>}
                        </div>
                        {x.title && (
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60ch" }}>
                            {x.title}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                        {sevData && <SeverityBar sev={sev} />}
                        <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(x.Created_At)}</span>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none", lineHeight: 1 }}>
                          ⌃
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExp && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: x.pr_comment ? "1fr 1fr" : "1fr", gap: 0 }}>
                        {x.risk_analysis && (
                          <div style={{ padding: 20, borderRight: x.pr_comment ? "1px solid var(--border)" : "none" }}>
                            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                              <span>🔬</span> Risk Analysis
                            </p>
                            <pre style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 12, fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, maxHeight: 380, overflowY: "auto", lineHeight: 1.75 }}>
                              {x.risk_analysis}
                            </pre>
                          </div>
                        )}
                        {x.pr_comment && (
                          <div style={{ padding: 20 }}>
                            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                              <span>💬</span> PR Review Comment
                            </p>
                            <pre style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 12, fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, maxHeight: 380, overflowY: "auto", lineHeight: 1.75 }}>
                              {x.pr_comment}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "8px 20px", background: "var(--surface-2)", borderTop: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}><strong>Repo:</strong> {repoFull}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}><strong>Created:</strong> {fmtDate(x.Created_At)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 24, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Showing {skip + 1}–{Math.min(skip + items.length, total)} of <strong>{total}</strong>
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>•</span>
            <select
              value={limit}
              onChange={(e) => navigate({ limit: Number(e.target.value), skip: 0 })}
              className="form-input"
              style={{ 
                padding: "4px 8px", 
                fontSize: "12px", 
                width: "auto",
                cursor: "pointer"
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage <= 1}
                onClick={() => navigate({ skip: skip - limit })}
                style={{ padding: "6px 10px", fontSize: "13px" }}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} style={{ padding: "0 8px", color: "var(--text-muted)", fontSize: "13px" }}>…</span>
                  ) : (
                    <button 
                      key={p} 
                      className={`btn btn-sm ${p === currentPage ? "btn-primary" : "btn-secondary"}`}
                      disabled={p === currentPage}
                      onClick={() => navigate({ skip: ((p as number) - 1) * limit })}
                      style={{ 
                        minWidth: "36px", 
                        padding: "6px 10px", 
                        fontSize: "13px",
                        fontWeight: p === currentPage ? "600" : "400"
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage >= totalPages}
                onClick={() => navigate({ skip: skip + limit })}
                style={{ padding: "6px 10px", fontSize: "13px" }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        title="Delete PR Analyses"
        message={`Are you sure you want to delete ${selectedIds.size} PR analysis${selectedIds.size > 1 ? 'es' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </main>
  );
}
