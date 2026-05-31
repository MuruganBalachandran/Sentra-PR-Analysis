"use client";
import { useState, useRef, useEffect } from "react";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";

type Step = "idle" | "sent" | "verified";

// Inline OTP boxes (same pattern, no external dependency)
function OtpBoxes({ onVerified, email, onResend }: {
  email: string; onVerified: (otp: string) => void; onResend: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
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
    text.split("").forEach((c, k) => { if (k < 6) next[k] = c; });
    setDigits(next); refs.current[Math.min(text.length, 5)]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 justify-center" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric"
            maxLength={1} value={d} onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)} autoFocus={i === 0}
            className={`w-10 h-11 text-center text-lg font-bold border-2 rounded-lg outline-none transition-all ${d ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-white text-gray-900"} focus:border-indigo-500`}
          />
        ))}
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => { if (otp.length < 6) { setError("Enter all 6 digits"); return; } onVerified(otp); }}
          disabled={otp.length < 6}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 transition"
        >Verify OTP</button>
        <button onClick={onResend} className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 transition">
          Resend
        </button>
      </div>
    </div>
  );
}

type Props = {
  email: string;
  userId: string;
};

export function ChangePasswordViaEmail({ email, userId }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [capturedOtp, setCapturedOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setLoading(true);
    try {
      await axiosClient.post("/auth/forgot-password", { email });
      toast.success("Reset code sent to " + email);
      setStep("sent");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      await axiosClient.post("/auth/resend-otp", { email, purpose: "RESET_PASSWORD" });
      toast.info("New OTP sent");
    } catch { toast.error("Failed to resend"); }
  };

  const resetPwd = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Minimum 6 characters"); return; }
    setLoading(true);
    try {
      await axiosClient.post("/auth/reset-password", {
        email, otp: capturedOtp, password,
      });
      toast.success("Password changed successfully via email reset");
      setStep("idle"); setPassword(""); setConfirm(""); setCapturedOtp("");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed";
      setError(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("expired")) setStep("sent");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[15px] font-semibold text-gray-900">Change Password via Email</p>
        <p className="text-[12px] text-gray-400 mt-0.5">Receive a one-time code at <strong>{email}</strong> to set a new password.</p>
      </div>

      <div className="p-5">
        {step === "idle" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-[13px] text-blue-800">
              <span className="text-lg">📧</span>
              <p>Click below and we'll email a 6-digit code to <strong>{email}</strong>. Enter the code to set a new password.</p>
            </div>
            <button onClick={sendOtp} disabled={loading}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 transition self-start">
              {loading ? "Sending…" : "📧 Send reset code"}
            </button>
          </div>
        )}

        {step === "sent" && (
          <div className="flex flex-col gap-4">
            <div className="text-[13px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5">
              📬 Check <strong>{email}</strong> for your 6-digit code.
            </div>
            <OtpBoxes email={email} onVerified={(otp) => { setCapturedOtp(otp); setStep("verified"); }} onResend={resend} />
            <button onClick={() => setStep("idle")} className="text-[12px] text-gray-400 hover:text-gray-600 text-left transition">← Cancel</button>
          </div>
        )}

        {step === "verified" && (
          <form onSubmit={resetPwd} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[13px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ✓ OTP verified — now set your new password
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-800">New password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                  className={inputCls} style={{ paddingRight: 56 }} required />
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
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-800">Confirm password</label>
              <div className="relative">
                <input type={showConfirmPwd ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••" className={inputCls} required style={{ paddingRight: 56 }} />
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
                <span className={`text-[12px] ${password === confirm ? "text-green-600" : "text-red-500"}`}>
                  {password === confirm ? "✓ Match" : "Passwords do not match"}
                </span>
              )}
            </div>
            {error && <div className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ {error}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading || !password || password !== confirm}
                className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 transition">
                {loading ? "Saving…" : "Set new password"}
              </button>
              <button type="button" onClick={() => { setStep("idle"); setPassword(""); setConfirm(""); }}
                className="px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
