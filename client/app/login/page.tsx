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

function getMsg(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const res = e.response as Record<string, unknown> | undefined;
    const data = res?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof e.message === "string") return e.message;
  }
  return fallback;
}

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);

  const onLoginSuccess = () => {
    toast.success("Successfully logged in");
    router.push("/");
  };

  const on2FASuccess = () => {
    toast.success("2FA verified! Logging you in...");
    router.push("/");
  };

  const sendPhoneCode = async (emailAddr: string) => {
    await axiosClient.post("/2fa/login/send-code", { email: emailAddr, method: "phone" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await dispatch(loginThunk({ email, password })) as Record<string, unknown>;

      if (res?.error) {
        const data = res?.payload as Record<string, unknown> | undefined;

        if (data?.requiresVerification) {
          setUnverifiedEmail((data?.email as string) || email);
          await axiosClient.post("/auth/resend-otp", { email: (data?.email as string) || email, purpose: "VERIFY_EMAIL" });
          toast.info("Please verify your email. A new OTP has been sent.");
          setStage("email-verify");
          return;
        }

        if (data?.requires2FA) {
          const methods = (data?.availableMethods as { phone: boolean; authenticator: boolean; backupCode: boolean }) || {};
          setTwoFAEmail((data?.email as string) || email);
          setAvailableMethods(methods);

          if (methods.phone) {
            await sendPhoneCode((data?.email as string) || email);
            toast.info("Verification code sent to your phone/email");
            setStage("2fa-phone");
          } else if (methods.authenticator) {
            setStage("2fa-authenticator");
          } else if (methods.backupCode) {
            setStage("2fa-backup");
          }
          return;
        }

        const errMessage = typeof data === "string" ? data : (data?.message as string) || "Invalid credentials";
        setError(errMessage);
        toast.error(errMessage);
        return;
      }

      onLoginSuccess();
    } catch (err: unknown) {
      const errMessage = getMsg(err, "Login failed");
      setError(errMessage);
      toast.error(errMessage);
    }
  };

  const switchTo = async (method: "phone" | "authenticator" | "backup") => {
    if (method === "phone") {
      try {
        await sendPhoneCode(twoFAEmail);
        toast.info("Verification code sent");
      } catch {
        toast.error("Failed to send code");
        return;
      }
      setStage("2fa-phone");
    } else if (method === "authenticator") {
      setStage("2fa-authenticator");
    } else {
      setStage("2fa-backup");
    }
  };

  const OtherMethods = ({ current }: { current: "phone" | "authenticator" | "backup" }) => {
    const others = [
      { key: "phone" as const, label: "Phone", show: availableMethods.phone && current !== "phone" },
      { key: "authenticator" as const, label: "Authenticator app", show: availableMethods.authenticator && current !== "authenticator" },
      { key: "backup" as const, label: "Backup code", show: availableMethods.backupCode && current !== "backup" },
    ].filter((m) => m.show);

    if (!others.length) return null;

    return (
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-gray-500 mb-2">Or use another method:</p>
        <div className="flex gap-2">
          {others.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => switchTo(m.key)}
              className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    );
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
        sub="Enter the 6-digit code sent to your phone or email."
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <TwoFAVerifyForm
            email={twoFAEmail}
            method="phone"
            isLogin={true}
            onSuccess={on2FASuccess}
            onBack={() => setStage("login")}
          />
          <OtherMethods current="phone" />
        </div>
      </AuthCard>
    );
  }

  // 2FA Authenticator stage
  if (stage === "2fa-authenticator") {
    return (
      <AuthCard
        heading="Verify with authenticator"
        sub="Enter the 6-digit code from your authenticator app."
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <TwoFAVerifyForm
            email={twoFAEmail}
            method="authenticator"
            isLogin={true}
            onSuccess={on2FASuccess}
            onBack={() => setStage("login")}
          />
          <OtherMethods current="authenticator" />
        </div>
      </AuthCard>
    );
  }

  // 2FA Backup Code stage
  if (stage === "2fa-backup") {
    const handleBackupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBackupLoading(true);
      try {
        await axiosClient.post("/auth/twofa/login/verify", {
          email: twoFAEmail,
          method: "backup_code",
          code: backupCode,
        });
        on2FASuccess();
      } catch (err: unknown) {
        toast.error(getMsg(err, "Invalid backup code"));
      } finally {
        setBackupLoading(false);
      }
    };

    return (
      <AuthCard
        heading="Verify with backup code"
        sub="Enter one of your saved backup codes."
        footer={<>Back to <AuthLink href="/login">Sign in</AuthLink></>}
      >
        <div className="flex flex-col gap-4">
          <form onSubmit={handleBackupSubmit} className="flex flex-col gap-4">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStage("login")}
                className="p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Go back"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              </button>
              <button
                type="submit"
                disabled={backupLoading}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition"
              >
                {backupLoading ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
          <OtherMethods current="backup" />
        </div>
      </AuthCard>
    );
  }

  // Login stage
  return (
    <AuthCard
      heading="Welcome back"
      sub="Sign in to your Sentra workspace"
      footer={<>Don&apos;t have an account? <AuthLink href="/signup">Create one</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

        <FormField label="Password">
          <div className="relative">
            <FormInput
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
            >
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
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
