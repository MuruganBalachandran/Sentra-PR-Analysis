"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { AuthCard, FormField, FormInput, FormError, AuthLink } from "@/components/auth/AuthCard";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import TwoFAVerifyForm from "@/components/auth/TwoFAVerifyForm";

type Stage = "email" | "email-verify" | "profile" | "2fa-phone" | "2fa-phone-verify" | "2fa-authenticator" | "2fa-authenticator-verify" | "2fa-backup" | "complete";

export default function SignupPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile setup
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // 2FA setup
  const [phoneNumber, setPhoneNumber] = useState("");
  const [twoFAMethods, setTwoFAMethods] = useState({
    phone: false,
    authenticator: false,
    backupCodes: false,
  });
  const [qrCode, setQrCode] = useState("");
  const [authenticatorSecret, setAuthenticatorSecret] = useState("");

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Validate stage on mount and when email changes
  useEffect(() => {
    if (!email) return;
    validateAndSetStage();
  }, [email]);

  const validateAndSetStage = async () => {
    try {
      const res = await axiosClient.post("/auth/signup/progress", { email });
      const progress = res.data?.response;
      
      if (!progress) return;

      // Navigate to appropriate stage based on database state
      if (!progress.emailVerified) {
        setStage("email-verify");
      } else if (!progress.profileCompleted) {
        setStage("profile");
      } else if (!progress.twoFACompleted) {
        if (!progress.twoFAMethods.phone && !progress.twoFAMethods.authenticator) {
          setStage("2fa-phone");
        } else if (progress.twoFAMethods.phone && !progress.twoFAMethods.authenticator) {
          setStage("2fa-authenticator");
        } else {
          setStage("2fa-backup");
        }
      } else {
        setStage("complete");
      }
    } catch (err) {
      // Signup session not found, stay on current stage
    }
  };

  // Step 1: Initiate signup with email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axiosClient.post("/auth/signup/initiate", { email });
      setStage("email-verify");
      toast.info("Verification code sent to your email");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to initiate signup";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify email (handled by OtpVerifyForm)
  const handleEmailVerified = async () => {
    setStage("profile");
    toast.success("Email verified! Now set up your profile.");
  };

  // Resend email OTP
  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await axiosClient.post("/auth/signup/resend-email-otp", { email });
      toast.success("New verification code sent to your email");
      setResendCooldown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      setError(msg);
      toast.error(msg);
    }
  };

  // Step 3: Setup profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await axiosClient.post("/auth/signup/setup-profile", {
        email,
        name,
        password,
        confirmPassword,
      });
      setStage("2fa-phone");
      toast.success("Profile created! Now set up 2FA.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to setup profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Setup phone 2FA
  const handlePhoneSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axiosClient.post("/auth/signup/setup-phone-2fa", {
        email,
        phone_number: phoneNumber,
      });
      toast.info("Verification code sent to your email");
      setStage("2fa-phone-verify");
      setResendCooldown(0);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to setup phone 2FA";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 4b: Phone 2FA verified
  const handlePhoneVerified = async () => {
    setTwoFAMethods((prev) => ({ ...prev, phone: true }));
    // Skip authenticator and go directly to backup codes
    await handleBackupCodes();
  };

  // Resend phone 2FA OTP
  const handleResendPhone2FAOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await axiosClient.post("/auth/signup/resend-phone-2fa-otp", { email });
      toast.success("New verification code sent to your email");
      setResendCooldown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      setError(msg);
      toast.error(msg);
    }
  };

  // Step 5: Setup authenticator 2FA
  const handleAuthenticatorSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/signup/setup-authenticator-2fa", { email });
      setAuthenticatorSecret(res.data?.response?.secret);
      setQrCode(res.data?.response?.qrCode);
      setStage("2fa-authenticator-verify");
      toast.info("Scan the QR code with your authenticator app");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to setup authenticator";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 5b: Authenticator 2FA verified
  const handleAuthenticatorVerified = async () => {
    setTwoFAMethods((prev) => ({ ...prev, authenticator: true }));
    await handleBackupCodes();
  };

  // Step 6: Generate backup codes
  const handleBackupCodes = async () => {
    setError("");
    setLoading(true);
    try {
      await axiosClient.post("/auth/signup/generate-backup-codes", { email });
      setTwoFAMethods((prev) => ({ ...prev, backupCodes: true }));
      setStage("2fa-backup");
      toast.success("Backup codes generated and sent to your email");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to generate backup codes";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 7: Complete signup
  const handleCompleteSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/signup/complete", { email });
      toast.success("Account created successfully! Welcome to Sentra 🎉");
      router.push("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to complete signup";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Stage: Email
  if (stage === "email") {
    return (
      <AuthCard
        heading="Create an account"
        sub="Get started with Sentra today"
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <FormField label="Email address">
            <FormInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </FormField>
          {error && <FormError msg={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-1"
          >
            {loading ? "Sending code…" : "Continue"}
          </button>
        </form>
      </AuthCard>
    );
  }

  // Stage: Email Verification
  if (stage === "email-verify") {
    return (
      <AuthCard
        heading="Verify your email"
        sub={<>We sent a 6-digit code to <strong>{email}</strong>. Enter it below.</>}
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <OtpVerifyForm
            email={email}
            purpose="VERIFY_EMAIL"
            isSignup={true}
            onSuccess={handleEmailVerified}
            onBack={() => setStage("email")}
          />
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <button
              onClick={() => setStage("email")}
              className="hover:text-indigo-600 transition"
            >
              ← Change email
            </button>
            <button
              onClick={handleResendEmailOtp}
              disabled={resendCooldown > 0}
              className={`font-medium transition ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  // Stage: Profile Setup
  if (stage === "profile") {
    return (
      <AuthCard
        heading="Set up your profile"
        sub="Create your account details"
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <FormField label="Full name">
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Password">
            <div className="relative">
              <FormInput
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 56 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
              >
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
              <FormInput
                type={showConfirmPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 56 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
              >
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
          </FormField>

          {error && <FormError msg={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-1"
          >
            {loading ? "Setting up…" : "Continue to 2FA"}
          </button>
        </form>
      </AuthCard>
    );
  }

  // Stage: 2FA Phone Setup
  if (stage === "2fa-phone") {
    return (
      <AuthCard
        heading="Set up 2FA - Phone"
        sub="Add an extra layer of security with phone verification"
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <form onSubmit={handlePhoneSetup} className="flex flex-col gap-4">
          <FormField label="Phone number">
            <FormInput
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              autoFocus
            />
          </FormField>

          {error && <FormError msg={error} />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("2fa-authenticator")}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
            >
              {loading ? "Sending…" : "Verify Phone"}
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  // Stage: 2FA Phone Verification
  if (stage === "2fa-phone-verify") {
    return (
      <AuthCard
        heading="Verify phone"
        sub={<>Enter the 6-digit code sent to your email</>}
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <TwoFAVerifyForm
            email={email}
            method="phone"
            onSuccess={handlePhoneVerified}
            onBack={() => setStage("2fa-phone")}
          />
          <button
            onClick={handleResendPhone2FAOtp}
            disabled={resendCooldown > 0}
            className={`text-xs font-medium transition ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>
      </AuthCard>
    );
  }

  // Stage: 2FA Authenticator Setup
  if (stage === "2fa-authenticator") {
    return (
      <AuthCard
        heading="Set up 2FA - Authenticator"
        sub="Use an authenticator app for additional security"
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          {!qrCode ? (
            <>
              <p className="text-sm text-gray-600">
                Scan the QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
              {error && <FormError msg={error} />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStage("2fa-backup")}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleAuthenticatorSetup}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
                >
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

              <button
                type="button"
                onClick={() => setStage("2fa-authenticator-verify")}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                I've scanned the code
              </button>
            </>
          )}
        </div>
      </AuthCard>
    );
  }

  // Stage: 2FA Authenticator Verification
  if (stage === "2fa-authenticator-verify") {
    return (
      <AuthCard
        heading="Verify authenticator"
        sub="Enter the 6-digit code from your authenticator app"
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <TwoFAVerifyForm
          email={email}
          method="authenticator"
          onSuccess={handleAuthenticatorVerified}
          onBack={() => setStage("2fa-authenticator")}
        />
      </AuthCard>
    );
  }

  // Stage: 2FA Backup Codes
  if (stage === "2fa-backup") {
    const downloadBackupCodes = async () => {
      try {
        const res = await axiosClient.post("/auth/signup/generate-backup-codes", { email });
        const codes = res.data?.response?.codes || [];
        
        // Create CSV content
        const csvContent = "Backup Codes\n" + codes.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentra-backup-codes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Backup codes downloaded!");
      } catch (err: any) {
        toast.error("Failed to download backup codes");
      }
    };

    return (
      <AuthCard
        heading="Backup codes"
        sub="Save these codes in a safe place. You can use them if you lose access to your phone."
        footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Backup codes have been sent to your email. Download and save them in a secure location.
            </p>
          </div>

          {error && <FormError msg={error} />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadBackupCodes}
              className="flex-1 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition"
            >
              ⬇ Download Codes
            </button>
            <button
              type="button"
              onClick={handleCompleteSignup}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
            >
              {loading ? "Creating account…" : "Complete Signup"}
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return null;
}
