"use client";
import { useState, useRef, useEffect } from "react";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { AuthCard, FormError, AuthLink } from "@/components/auth/AuthCard";

type Props = {
  email: string;
  purpose: "VERIFY_EMAIL" | "RESET_PASSWORD";
  onSuccess?: () => void;
  onBack?: () => void;
  isSignup?: boolean;
};

export default function OtpVerifyForm({ email, purpose, onSuccess, onBack, isSignup = false }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const otp = digits.join("");

  const handleChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setError("");
    if (ch && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    text.split("").forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      if (purpose === "VERIFY_EMAIL") {
        const endpoint = isSignup ? "/auth/signup/verify-email" : "/auth/verify-email";
        await axiosClient.post(endpoint, { email, otp });
        toast.success("Email verified!");
      } else {
        // for reset password, parent handles password submission separately
        toast.success("OTP verified!");
      }
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Verification failed";
      setError(msg);
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    try {
      await axiosClient.post("/auth/resend-otp", { email, purpose });
      toast.success("New OTP sent to your email");
      setResendCooldown(60);
      setDigits(Array(6).fill(""));
      setError("");
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* OTP digit boxes */}
      <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
              ${d ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-white text-gray-900"}
              focus:border-indigo-500 focus:bg-indigo-50`}
          />
        ))}
      </div>

      {error && <FormError msg={error} />}

      <button
        onClick={verify}
        disabled={loading || otp.length < 6}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
      >
        {loading ? "Verifying…" : "Verify OTP"}
      </button>

      <div className="flex items-center justify-between text-[13px] text-gray-500">
        {onBack && (
          <button onClick={onBack} className="hover:text-indigo-600 transition">
            ← Go back
          </button>
        )}
        <button
          onClick={resend}
          disabled={resendCooldown > 0}
          className={`ml-auto font-medium transition ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
