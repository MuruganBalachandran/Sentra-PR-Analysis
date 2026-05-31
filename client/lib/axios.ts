import axios from "axios";
import { toast } from "react-toastify";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

export const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor to handle 401 errors
// Suppress session-expired toast on the login page itself (wrong password returns 401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isLoginPage = window.location.pathname === "/login";
        if (!isLoginPage) {
          toast.error("Session expired. Please log in again.", { autoClose: 3000 });
          setTimeout(() => { window.location.href = "/login"; }, 500);
        }
      }
    }
    return Promise.reject(error);
  }
);

