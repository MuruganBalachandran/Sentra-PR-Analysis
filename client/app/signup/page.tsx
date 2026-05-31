"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { AuthCard, FormField, FormInput, FormError, AuthLink } from "@/components/auth/AuthCard";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import TwoFAVerifyForm from "@/components/auth/TwoFAVerifyForm";

type Stage =
  | "email"
  | "email-verify"
  | "profile"
  | "2fa-phone"
  | "2fa-phone-verify"
  | "2fa-authenticator"
  | "2fa-authenticator-verify"
  | "2fa-options"
  | "2fa-backup"
  | "complete";

// ── Utility: Extract error message safely ────────────────────────────────────
function getErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  
  const error = err as Record<string, unknown>;
  const response = error.response as Record<string, unknown> | undefined;
  const data = response?.data as Record<string, unknown> | undefined;
  
  // Safely extract message and sanitize
  const message = data?.message || error.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  
  return fallback;
}

const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} title="Go back"
    className="p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  </button>
);

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const footer = <AuthLink href="/login">Sign in</AuthLink>;

export default function SignupPage() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // 2FA
  const [phoneNumber, setPhoneNumber] = useState("");
  const [twoFAMethods, setTwoFAMethods] = useState({ phone: false, authenticator: false, backupCodes: false });
  const [qrCode, setQrCode] = useState("");
  const [authenticatorSecret, setAuthenticatorSecret] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // First check if email already exists or has progress
      const progressRes = await axiosClient.post("/auth/signup/progress", { email }).catch(() => null);
      const progress = progressRes?.data?.response;

      if (progress) {
        // Email has existing signup progress
        if (progress.twoFACompleted) {
          // Account already fully created
          toast.error("This email is already registered. Please sign in instead.");
          router.push("/login");
          return;
        }

        // Navigate to the appropriate stage based on progress
        if (!progress.emailVerified) {
          setStage("email-verify");
          toast.info("Verification code sent to your email");
          return;
        } else if (!progress.profileCompleted) {
          setStage("profile");
          toast.info("Continue setting up your profile");
          return;
        } else if (!progress.twoFACompleted) {
          const hasPhone = progress.twoFAMethods?.phone;
          const hasAuthenticator = progress.twoFAMethods?.authenticator;
          setStage(!hasPhone && !hasAuthenticator ? "2fa-phone" : "2fa-options");
          toast.info("Continue setting up 2FA");
          return;
        }
      }

      // New signup - initiate signup process
      await axiosClient.post("/auth/signup/initiate", { email });
      setStage("email-verify");
      toast.info("Verification code sent to your email");
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to initiate signup");
      const status = (err as Record<string, unknown>)?.response?.status;

      // Handle existing account (409 Conflict)
      if (status === 409) {
        toast.error("This email is already registered. Please sign in instead.");
        router.push("/login");
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const handleEmailVerified = () => {
    setStage("profile");
    toast.success("Email verified! Now set up your profile.");
  };

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      await axiosClient.post("/auth/signup/setup-profile", { email, name, password, confirmPassword });
      setStage("2fa-phone");
      toast.success("Profile created! Now set up 2FA.");
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to setup profile");
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Step 4: Phone setup ────────────────────────────────────────────────────
  const handlePhoneSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await axiosClient.post("/auth/signup/setup-phone-2fa", { email, phone_number: phoneNumber });
      toast.info("Verification code sent to your email");
      setStage("2fa-phone-verify");
      setResendCooldown(0);
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to setup phone 2FA");
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Step 4b: Phone verified ────────────────────────────────────────────────
  const handlePhoneVerified = async () => {
    setTwoFAMethods((prev) => ({ ...prev, phone: true }));
    setStage("2fa-options");
  };

  const handleResendPhoneOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await axiosClient.post("/auth/signup/resend-phone-2fa-otp", { email });
      toast.success("New verification code sent to your email");
      setResendCooldown(60);
    } catch (err: unknown) {
      toast.error(getMsg(err, "Failed to resend OTP"));
    }
  };

  // ── Step 5: Authenticator ──────────────────────────────────────────────────
  const handleAuthenticatorSetup = async () => {
    setError(""); setLoading(true);
    try {
      const res = await axiosClient.post("/auth/signup/setup-authenticator-2fa", { email });
      setAuthenticatorSecret(res.data?.response?.secret);
      setQrCode(res.data?.response?.qrCode);
      toast.info("Scan the QR code with your authenticator app");
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to setup authenticator");
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleAuthenticatorVerified = async () => {
    setTwoFAMethods((prev) => ({ ...prev, authenticator: true }));
    setStage("2fa-options");
  };

  // ── Step 6: Backup codes ───────────────────────────────────────────────────
  const handleBackupCodes = async () => {
    setError(""); setLoading(true);
    try {
      await axiosClient.post("/auth/signup/generate-backup-codes", { email });
      setTwoFAMethods((prev) => ({ ...prev, backupCodes: true }));
      setStage("2fa-backup");
      toast.success("Backup codes generated and sent to your email");
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to generate backup codes");
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Step 7: Complete ───────────────────────────────────────────────────────
  const handleCompleteSignup = async () => {
    setError(""); setLoading(true);
    try {
      await axiosClient.post("/auth/signup/complete", { email });
      toast.success("Account created successfully! Welcome to Sentra 🎉");
      router.push("/");
    } catch (err: unknown) {
      const msg = getMsg(err, "Failed to complete signup");
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (stage === "email") return (
    <AuthCard heading="Create an account" sub="Get started with Sentra today"
      footer={<>Already have an account? {footer}</>}>
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        <FormField label="Email address">
          <FormInput type="email" value={email} onChange={(e) => {
            setEmail(e.target.value);
            setError(""); // Clear error on input change
          }}
            placeholder="you@company.com" required autoFocus />
        </FormField>
        {error && <FormError msg={error} />}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-1">
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </AuthCard>
  );

  if (stage === "email-verify") return (
    <AuthCard heading="Verify your email"
      sub={<>We sent a 6-digit code to <strong>{email}</strong>. Enter it below.</>}
      footer={<>Already have an account? {footer}</>}>
      <OtpVerifyForm email={email} purpose="VERIFY_EMAIL" isSignup={true}
        onSuccess={handleEmailVerified} onBack={() => setStage("email")} />
    </AuthCard>
  );

  if (stage === "profile") return (
    <AuthCard heading="Set up your profile" sub="Create your account details"
      footer={<>Already have an account? {footer}</>}>
      <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
        <FormField label="Full name">
          <FormInput value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith" required autoFocus />
        </FormField>
        <FormField label="Password">
          <div className="relative">
            <FormInput type={showPwd ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              required style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              <EyeIcon open={showPwd} />
            </button>
          </div>
        </FormField>
        <FormField label="Confirm password">
          <div className="relative">
            <FormInput type={showConfirmPwd ? "text" : "password"} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
              required style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowConfirmPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              <EyeIcon open={showConfirmPwd} />
            </button>
          </div>
        </FormField>
        {error && <FormError msg={error} />}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-1">
          {loading ? "Setting up…" : "Continue to 2FA"}
        </button>
      </form>
    </AuthCard>
  );

  if (stage === "2fa-phone") return (
    <AuthCard heading="Set up 2FA - Phone"
      sub="Add phone verification, or skip to use an authenticator app instead."
      footer={<>Already have an account? {footer}</>}>
      <form onSubmit={handlePhoneSetup} className="flex flex-col gap-4">
        <FormField label="Phone number">
          <FormInput type="tel" value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555 123 4567" required autoFocus />
        </FormField>
        {error && <FormError msg={error} />}
        <div className="flex gap-2">
          <BackBtn onClick={() => setStage("profile")} />
          <button type="button" onClick={() => setStage("2fa-authenticator")}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition">
            Skip
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition">
            {loading ? "Sending…" : "Verify Phone"}
          </button>
        </div>
      </form>
    </AuthCard>
  );

  if (stage === "2fa-phone-verify") return (
    <AuthCard heading="Verify phone"
      sub="Enter the 6-digit code sent to your email."
      footer={<>Already have an account? {footer}</>}>
      <div className="flex flex-col gap-4">
        <TwoFAVerifyForm email={email} method="phone"
          onSuccess={handlePhoneVerified} onBack={() => setStage("2fa-phone")} />
        <button onClick={handleResendPhoneOtp} disabled={resendCooldown > 0}
          className={`text-xs font-medium transition ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </AuthCard>
  );

  if (stage === "2fa-authenticator") return (
    <AuthCard heading="Set up 2FA - Authenticator"
      sub="Use an authenticator app for additional security."
      footer={<>Already have an account? {footer}</>}>
      <div className="flex flex-col gap-4">
        {!qrCode ? (
          <>
            <p className="text-sm text-gray-600">
              Scan the QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
            </p>
            {error && <FormError msg={error} />}
            <div className="flex gap-2">
              <BackBtn onClick={() => setStage("2fa-phone")} />
              <button type="button" onClick={handleAuthenticatorSetup} disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition">
                {loading ? "Generating…" : "Generate QR Code"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            {authenticatorSecret && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Manual entry key:</p>
                <p className="font-mono text-sm break-all">{authenticatorSecret}</p>
              </div>
            )}
            <button type="button" onClick={() => setStage("2fa-authenticator-verify")}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
              I have scanned the code
            </button>
          </>
        )}
      </div>
    </AuthCard>
  );

  if (stage === "2fa-authenticator-verify") return (
    <AuthCard heading="Verify authenticator"
      sub="Enter the 6-digit code from your authenticator app"
      footer={<>Already have an account? {footer}</>}>
      <TwoFAVerifyForm email={email} method="authenticator"
        onSuccess={handleAuthenticatorVerified} onBack={() => setStage("2fa-authenticator")} />
    </AuthCard>
  );

  if (stage === "2fa-options") {
    const hasPhone = twoFAMethods.phone;
    const hasAuthenticator = twoFAMethods.authenticator;
    const hasAny2FA = hasPhone || hasAuthenticator;

    return (
      <AuthCard heading="2FA Setup Options"
        sub={`You have set up ${hasPhone && hasAuthenticator ? "both phone and authenticator" : hasPhone ? "phone verification" : "authenticator app"}. What would you like to do?`}
        footer={<>Already have an account? {footer}</>}>
        <div className="flex flex-col gap-3">
          {!hasPhone && (
            <button type="button" onClick={() => setStage("2fa-phone")}
              className="w-full p-4 rounded-lg border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 transition text-left">
              <p className="font-semibold text-indigo-900">+ Add Phone Verification</p>
              <p className="text-sm text-indigo-700 mt-1">Receive OTP codes via email</p>
            </button>
          )}
          {!hasAuthenticator && (
            <button type="button" onClick={() => setStage("2fa-authenticator")}
              className="w-full p-4 rounded-lg border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 transition text-left">
              <p className="font-semibold text-indigo-900">+ Add Authenticator App</p>
              <p className="text-sm text-indigo-700 mt-1">Use Google Authenticator, Authy, or similar</p>
            </button>
          )}
          <button type="button" onClick={handleBackupCodes} disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-2">
            {loading ? "Generating codes…" : "Continue to Backup Codes"}
          </button>
        </div>
      </AuthCard>
    );
  }

  if (stage === "2fa-backup") {
    const hasAny2FA = twoFAMethods.phone || twoFAMethods.authenticator;

    const downloadBackupCodes = async () => {
      try {
        const res = await axiosClient.post("/auth/signup/generate-backup-codes", { email });
        const codes: string[] = res.data?.response?.codes || [];
        const blob = new Blob(["Backup Codes\n" + codes.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentra-backup-codes-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        toast.success("Backup codes downloaded!");
      } catch {
        toast.error("Failed to download backup codes");
      }
    };

    return (
      <AuthCard heading="Backup codes"
        sub="Save these codes in a safe place. You can use them if you lose access to your 2FA method."
        footer={<>Already have an account? {footer}</>}>
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Backup codes have been sent to your email. Download and save them in a secure location.
            </p>
          </div>
          {error && <FormError msg={error} />}
          <div className="flex gap-2">
            {!hasAny2FA && <BackBtn onClick={() => setStage("2fa-authenticator")} />}
            <button type="button" onClick={downloadBackupCodes}
              className="flex-1 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition">
              ⬇ Download Codes
            </button>
            <button type="button" onClick={handleCompleteSignup} disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition">
              {loading ? "Creating account…" : "Complete Signup"}
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return null;
}
