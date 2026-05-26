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
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      if (typeof window !== "undefined") {
        // Show toast notification
        toast.error("Session expired. Please log in again.", { autoClose: 3000 });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }
    }
    return Promise.reject(error);
  }
);

