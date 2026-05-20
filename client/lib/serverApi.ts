import axios from "axios";
import { headers } from "next/headers";
import { API_BASE } from "./axios";

export async function serverAxios() {
  const hdrs = await headers();
  const cookieHeader = hdrs?.get?.("cookie") || "";
  const forwarded = hdrs?.get?.("x-forwarded-for") || "";
  const xff = forwarded ? { "X-Forwarded-For": forwarded } : {};
  return axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...xff,
    },
  });
}
