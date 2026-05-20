import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const api = await serverAxios();
  let profile: any = null;
  try {
    const r = await api.get("/auth/profile");
    profile = r.data?.response || r.data;
  } catch {
    redirect("/login");
  }
  if (!profile) redirect("/login");
  return <ProfileClient profile={profile} />;
}
