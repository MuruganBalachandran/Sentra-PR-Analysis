import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import ActivityLogClient from "./ActivityLogClient";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const api = await serverAxios();
  let profile: any = null;
  try {
    const r = await api.get("/auth/profile");
    profile = r.data?.response || r.data;
  } catch {
    redirect("/login");
  }
  if (profile?.Role !== "ADMIN") redirect("/");

  const limit = Number(searchParams?.limit || 20);
  const skip = Number(searchParams?.skip || 0);
  const search = typeof searchParams?.search === "string" ? searchParams.search : "";

  const res = await api.get(
    `/activity-log?limit=${limit}&skip=${skip}&search=${encodeURIComponent(search)}`
  );
  const data = res.data?.response || res.data || {};

  return (
    <ActivityLogClient
      initialLogs={data?.logs || []}
      filteredTotal={data?.filteredTotal ?? 0}
      overallTotal={data?.overallTotal ?? 0}
      currentPage={data?.currentPage ?? 1}
      totalPages={data?.totalPages ?? 1}
      limit={data?.limit ?? limit}
      skip={data?.skip ?? skip}
      search={search}
    />
  );
}
