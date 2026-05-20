"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { AuthCard, FormField, FormInput, FormError, AuthLink } from "@/components/auth/AuthCard";

type Stage = "email" | "otp" | "newpwd";

// ── Standalone inline OTP input (captures value, passes to parent) ─────────
function OtpCapture({
  email, onVerified, onBack,
}: { email: string; onVerified: (otp: string) => void; onBack: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const otp = digits.join("");

  const onChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = ch; setDigits(next); setError("");
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return; e.preventDefault();
    const next = Array(6).fill("") as string[];
    text.split("").forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next); refs.current[Math.min(text.length, 5)]?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Enter all 6 digits"); return; }
    onVerified(otp);
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    try {
      await axiosClient.post("/auth/resend-otp", { email, purpose: "RESET_PASSWORD" });
      toast.info("New code sent to your email");
      setResendCooldown(60); setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
    } catch { toast.error("Failed to resend code"); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex gap-2.5 justify-center" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric"
            maxLength={1} value={d} onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)} autoFocus={i === 0}
            className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${d ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-white text-gray-900"} focus:border-indigo-500`}
          />
        ))}
      </div>
      {error && <div className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ {error}</div>}
      <button type="submit" disabled={otp.length < 6}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 transition">
        Verify & continue →
      </button>
      <div className="flex justify-between text-[13px] text-gray-500">
        <button type="button" onClick={onBack} className="hover:text-indigo-600 transition">← Go back</button>
        <button type="button" onClick={resend} disabled={resendCooldown > 0}
          className={`font-medium transition ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [capturedOtp, setCapturedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Stage 1
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await axiosClient.post("/auth/forgot-password", { email: email.trim() });
      toast.success("Reset code sent — check your email");
      setStage("otp");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send reset code");
    } finally { setLoading(false); }
  };

  // Stage 3
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setPwdLoading(true);
    try {
      await axiosClient.post("/auth/reset-password", {
        email: email.trim().toLowerCase(), otp: capturedOtp, password,
      });
      toast.success("Password reset! Sign in with your new password.");
      router.push("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Password reset failed";
      setError(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("expired")) {
        setStage("otp"); // send them back to re-enter if OTP issue
      }
    } finally { setPwdLoading(false); }
  };

  // ── Stage 1: Email ─────────────────────────────────────────────────────────
  if (stage === "email") return (
    <AuthCard heading="Forgot password?" sub="Enter your email and we'll send a 6-digit reset code."
      footer={<>Remembered it? <AuthLink href="/login">Sign in</AuthLink></>}>
      <form onSubmit={sendOtp} className="flex flex-col gap-4">
        <FormField label="Email address">
          <FormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required autoFocus />
        </FormField>
        {error && <FormError msg={error} />}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition">
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>
    </AuthCard>
  );

  // ── Stage 2: OTP ───────────────────────────────────────────────────────────
  if (stage === "otp") return (
    <AuthCard heading="Enter reset code"
      sub={<>We sent a 6-digit code to <strong>{email}</strong>. Enter it to continue.</>}
      footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}>
      <OtpCapture
        email={email.trim().toLowerCase()}
        onVerified={(otp) => { setCapturedOtp(otp); setStage("newpwd"); }}
        onBack={() => setStage("email")}
      />
    </AuthCard>
  );

  // ── Stage 3: New password ──────────────────────────────────────────────────
  return (
    <AuthCard heading="Set new password" sub="Choose a strong new password for your Sentra account."
      footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}>
      <form onSubmit={resetPassword} className="flex flex-col gap-4">
        <FormField label="New password">
          <div className="relative">
            <FormInput type={showPwd ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
              required style={{ paddingRight: 56 }} autoFocus />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              {showPwd ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </FormField>
        <FormField label="Confirm password">
          <div className="relative">
            <FormInput type={showConfirmPwd ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" required style={{ paddingRight: 56 }} />
            <button type="button" onClick={() => setShowConfirmPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              {showConfirmPwd ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          {password && confirm && (
            <span className={`text-[12px] mt-0.5 ${password === confirm ? "text-green-600" : "text-red-500"}`}>
              {password === confirm ? "✓ Passwords match" : "Passwords do not match"}
            </span>
          )}
        </FormField>
        {error && <FormError msg={error} />}
        <button type="submit" disabled={pwdLoading || !password || password !== confirm}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition">
          {pwdLoading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}
