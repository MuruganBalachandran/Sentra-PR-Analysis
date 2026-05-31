"use client";
import { useState } from "react";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { FormField, FormInput, FormError } from "./AuthCard";

interface TwoFAVerifyFormProps {
  email: string;
  method: "phone" | "authenticator";
  onSuccess: () => void;
  onBack: () => void;
  isLogin?: boolean;
}

export default function TwoFAVerifyForm({ email, method, onSuccess, onBack, isLogin = false }: TwoFAVerifyFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!code.trim()) {
        throw new Error("Code is required");
      }

      if (isLogin) {
        // Login 2FA verification
        await axiosClient.post("/2fa/login/verify", {
          email,
          method,
          code,
        });
      } else {
        // Signup 2FA verification
        const endpoint =
          method === "phone"
            ? "/auth/signup/verify-phone-2fa"
            : "/auth/signup/verify-authenticator-2fa";

        await axiosClient.post(endpoint, {
          email,
          otp: code,
          token: code, // For authenticator
        });
      }

      toast.success(`${method === "phone" ? "Phone" : "Authenticator"} verified successfully!`);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Verification failed";
      setError(msg);
      setAttempts((prev) => prev + 1);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={method === "phone" ? "Verification code" : "Authenticator code"}>
        <FormInput
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder={method === "phone" ? "000000" : "000000"}
          maxLength={6}
          required
          autoFocus
        />
      </FormField>

      {error && <FormError msg={error} />}

      {attempts > 2 && (
        <p className="text-xs text-amber-600">
          Too many attempts. Please try again later or use a different method.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          title="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={loading || attempts > 2}
          className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </div>
    </form>
  );
}
