import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import PRAnalysesClient from "./PRAnalysesClient";

export default async function PRAnalysesPage() {
  const api = await serverAxios();
  let profile: any = null;
  try {
    const r = await api.get("/auth/profile");
    profile = r.data?.response || r.data;
  } catch {
    redirect("/login");
  }

  const isAdmin = profile?.Role === "ADMIN";

  return <PRAnalysesClient isAdmin={isAdmin} />;
}
