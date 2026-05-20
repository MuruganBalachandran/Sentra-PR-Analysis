"use client";
import { useEffect, useState } from "react";
import { axiosClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { SectionCard, ContextField, ContextInput, ContextTextarea, SaveButton } from "@/components/context/ContextComponents";

export default function ContextPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [summary, setSummary] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [ownership, setOwnership] = useState("{}");
  const [graph, setGraph] = useState("{}");
  const [fragile, setFragile] = useState("[]");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosClient.get("/auth/profile");
        const u = r.data?.response || r.data;
        if (u?.Role !== "ADMIN") router.push("/");
      } catch { router.push("/login"); }
    })();
  }, [router]);

  const save = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
      toast.success(`${action} saved`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally { setLoading(null); }
  };

  return (
    <div>
      <PageHeader title="Repository Context" subtitle="Configure repository metadata, ownership maps, and dependency information." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Repository */}
        <SectionCard title="Repository">
          <ContextField label="Repository (owner/repo)">
            <ContextInput placeholder="acme/backend-api" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </ContextField>
          <ContextField label="Default branch">
            <ContextInput placeholder="main" value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)} />
          </ContextField>
          <ContextField label="Summary">
            <ContextTextarea placeholder="Brief description of this repository…" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </ContextField>
          <SaveButton loading={loading === "Repository"} label="Save repository" loadingLabel="Saving…"
            onClick={() => save("Repository", () => axiosClient.post("/context/repository", { full_name: fullName, summary, default_branch: defaultBranch, is_active: true }))} />
        </SectionCard>

        {/* Ownership */}
        <SectionCard title="Ownership Map">
          <ContextField label="Ownership JSON">
            <ContextTextarea rows={8} placeholder={'{\n  "auth": "security-team",\n  "payments": "billing-team"\n}'} value={ownership} onChange={(e) => setOwnership(e.target.value)} style={{ fontSize: 13 }} />
          </ContextField>
          <SaveButton loading={loading === "Ownership"} label="Save ownership" loadingLabel="Saving…"
            onClick={() => save("Ownership", () => axiosClient.post("/context/ownership", { full_name: fullName, ownership_map: JSON.parse(ownership || "{}") }))} />
        </SectionCard>

        {/* Dependency Graph */}
        <SectionCard title="Dependency Graph">
          <ContextField label="Dependency JSON">
            <ContextTextarea rows={8} placeholder={'{\n  "api": ["db", "auth"],\n  "auth": ["db"]\n}'} value={graph} onChange={(e) => setGraph(e.target.value)} style={{ fontSize: 13 }} />
          </ContextField>
          <SaveButton loading={loading === "Dependency Graph"} label="Save graph" loadingLabel="Saving…"
            onClick={() => save("Dependency Graph", () => axiosClient.post("/context/dependency-graph", { full_name: fullName, dependency_graph: JSON.parse(graph || "{}") }))} />
        </SectionCard>

        {/* Fragile Modules */}
        <SectionCard title="Fragile Modules">
          <ContextField label="Module names (JSON array)">
            <ContextTextarea rows={6} placeholder={'["payments", "auth", "subscriptions"]'} value={fragile} onChange={(e) => setFragile(e.target.value)} style={{ fontSize: 13 }} />
          </ContextField>
          <ContextField label="Notes">
            <ContextInput placeholder="Reason these modules are fragile…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </ContextField>
          <SaveButton loading={loading === "Fragile Modules"} label="Save modules" loadingLabel="Saving…"
            onClick={() => save("Fragile Modules", () => axiosClient.post("/context/fragile-modules", { full_name: fullName, modules: JSON.parse(fragile || "[]"), notes }))} />
        </SectionCard>
      </div>
    </div>
  );
}
