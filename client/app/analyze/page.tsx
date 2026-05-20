import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import AnalyzePRClient from "./AnalyzePRClient";

export default async function AnalyzePage() {
  // Auth check
  const api = await serverAxios();
  try {
    await api.get("/auth/profile");
  } catch {
    redirect("/login");
  }
  return <AnalyzePRClient />;
}
