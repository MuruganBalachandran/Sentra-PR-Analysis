"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginThunk } from "@/store/slices/authSlice";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { AuthCard, FormField, FormInput, FormError, AuthLink } from "@/components/auth/AuthCard";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import TwoFAVerifyForm from "@/components/auth/TwoFAVerifyForm";

type Stage = "login" | "email-verify" | "2fa-phone" | "2fa-authenticator" | "2fa-backup";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const [stage, setStage] = useState<Stage>("login");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [twoFAEmail, setTwoFAEmail] = useState("");
  const [availableMethods, setAvailableMethods] = useState<{
    phone: boolean;
    authenticator: boolean;
    backupCode: boolean;
  }>({ phone: false, authenticator: false, backupCode: false });
  const [selectedMethod, setSelectedMethod] = useState<"phone" | "authenticator" | "backup_code">("phone");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await dispatch(loginThunk({ email, password })) as any;
      if (res?.error) {
        // Check if unverified
        const data = res?.payload;
        if (data?.requiresVerification) {
          setUnverifiedEmail(data?.email || email);
          // Send a fresh OTP
          await axiosClient.post("/auth/resend-otp", { email: data?.email || email, purpose: "VERIFY_EMAIL" });
          toast.info("Please verify your email. A new OTP has been sent.");
          setStage("email-verify");
        } else if (data?.requires2FA) {
          // 2FA required
          setTwoFAEmail(data?.email || email);
          setAvailableMethods(data?.availableMethods || {});
          setSelectedMethod("phone");
          
          // Send 2FA code for phone method
          if (data?.availableMethods?.phone) {
            await axiosClient.post("/auth/twofa/login/send-code", {
              email: data?.email || email,
              method: "phone",
            });
            toast.info("Verification code sent to your email");
          }
          setStage("2fa-phone");
        } else {
          const errMessage = typeof res?.payload === "string" ? res.payload : "Invalid credentials";
          setError(errMessage);
          toast.error(errMessage);
        }
        return;
      }
      toast.success("Successfully logged in");
      router.push("/");
    } catch (err: any) {
      const errMessage = err?.message || "Login failed";
      setError(errMessage);
      toast.error(errMessage);
    }
  };

  // Email verification stage
  if (stage === "email-verify") {
    return (
      <AuthCard
        heading="Verify your email"
        sub={<>Your account needs email verification. We sent a 6-digit code to <strong>{unverifiedEmail}</strong>.</>}
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <OtpVerifyForm
          email={unverifiedEmail}
          purpose="VERIFY_EMAIL"
          onSuccess={() => {
            toast.success("Email verified! You are now signed in.");
            router.push("/");
          }}
          onBack={() => setStage("login")}
        />
      </AuthCard>
    );
  }

  // 2FA Phone stage
  if (stage === "2fa-phone") {
    return (
      <AuthCard
        heading="Verify with phone"
        sub="Enter the 6-digit code sent to your email"
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <TwoFAVerifyForm
            email={twoFAEmail}
            method="phone"
            isLogin={true}
            onSuccess={() => {
              toast.success("2FA verified! Logging you in...");
              router.push("/");
            }}
            onBack={() => setStage("login")}
          />
          
          {/* Show other available methods */}
          {(availableMethods.authenticator || availableMethods.backupCode) && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-600 mb-3">Or use another method:</p>
              <div className="flex gap-2">
                {availableMethods.authenticator && (
                  <button
                    type="button"
                    onClick={async () => {
                      setStage("2fa-authenticator");
                    }}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Authenticator
                  </button>
                )}
                {availableMethods.backupCode && (
                  <button
                    type="button"
                    onClick={() => setStage("2fa-backup")}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Backup Code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </AuthCard>
    );
  }

  // 2FA Authenticator stage
  if (stage === "2fa-authenticator") {
    return (
      <AuthCard
        heading="Verify with authenticator"
        sub="Enter the 6-digit code from your authenticator app"
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <TwoFAVerifyForm
            email={twoFAEmail}
            method="authenticator"
            isLogin={true}
            onSuccess={() => {
              toast.success("2FA verified! Logging you in...");
              router.push("/");
            }}
            onBack={() => setStage("2fa-phone")}
          />
          
          {/* Show other available methods */}
          {(availableMethods.phone || availableMethods.backupCode) && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-600 mb-3">Or use another method:</p>
              <div className="flex gap-2">
                {availableMethods.phone && (
                  <button
                    type="button"
                    onClick={() => setStage("2fa-phone")}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Phone
                  </button>
                )}
                {availableMethods.backupCode && (
                  <button
                    type="button"
                    onClick={() => setStage("2fa-backup")}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Backup Code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </AuthCard>
    );
  }

  // 2FA Backup Code stage
  if (stage === "2fa-backup") {
    const [backupCode, setBackupCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBackupCodeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axiosClient.post("/auth/twofa/login/verify", {
          email: twoFAEmail,
          method: "backup_code",
          code: backupCode,
        });
        toast.success("2FA verified! Logging you in...");
        router.push("/");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Invalid backup code");
      } finally {
        setLoading(false);
      }
    };

    return (
      <AuthCard
        heading="Verify with backup code"
        sub="Enter one of your backup codes"
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <form onSubmit={handleBackupCodeSubmit} className="flex flex-col gap-4">
          <FormField label="Backup code">
            <FormInput
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              required
              autoFocus
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>

          {/* Show other available methods */}
          {(availableMethods.phone || availableMethods.authenticator) && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-600 mb-3">Or use another method:</p>
              <div className="flex gap-2">
                {availableMethods.phone && (
                  <button
                    type="button"
                    onClick={() => setStage("2fa-phone")}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Phone
                  </button>
                )}
                {availableMethods.authenticator && (
                  <button
                    type="button"
                    onClick={() => setStage("2fa-authenticator")}
                    className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Authenticator
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Welcome back"
      sub="Sign in to your Sentra workspace"
      footer={<>Don&apos;t have an account? <AuthLink href="/signup">Create one</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label="Email address">
          <FormInput
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required autoFocus
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <FormInput
              type={showPwd ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ paddingRight: 56 }}
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700 transition">
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[12px] text-indigo-600 hover:underline mt-1">
              Forgot password?
            </Link>
          </div>
        </FormField>

        {error && <FormError msg={error} />}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition mt-1"
        >
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
