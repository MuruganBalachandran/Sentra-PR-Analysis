import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import UsersClient from "./usersClient";

export default async function UsersPage() {
  const api = await serverAxios();
  let profile: any = null;
  try {
    const r = await api.get("/auth/profile");
    profile = r.data?.response || r.data;
  } catch {
    redirect("/login");
  }
  if (profile?.Role !== "ADMIN") redirect("/");
  const res = await api.get("/users");
  const users = res.data?.response || res.data || [];
  return <UsersClient initialUsers={users} />;
}

