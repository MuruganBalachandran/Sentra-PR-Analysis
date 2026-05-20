// region imports
import {
  sendResponse,
  STATUS_CODE,
  RESPONSE_STATUS,
} from "../../utils/index.js";
import { verifyPassword, generateToken, hashPassword } from "../../utils/index.js";
import { User, Otp, SignupProgress } from "../../models/index.js";
import { validateLogin } from "../../validations/index.js";
import { findUserByEmail, getProfileQuery, isEmailExists } from "../../queries/index.js";
import { sendOtpEmail } from "../../services/email/emailService.js";
// endregion

// region helpers
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const setOtpCookie = (res, token) => {
  res?.cookie?.("token", token, {
    httpOnly: true,
    secure: process?.env?.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 1000 * 60 * 60 * 24,
  });
};

/** Invalidate all previous OTPs for this email+purpose, then create a new one */
const createOtp = async (email, purpose) => {
  await Otp.deleteMany({ email, purpose });
  const code = generateOtp();
  await Otp.create({
    email,
    otp: code,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });
  return code;
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region legacy: signup (kept for backward compatibility, redirects to new flow)
const signup = async (req = {}, res = {}, next) => {
  // Redirect to initiateSignup
  return initiateSignup(req, res, next);
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region resend OTP
const resendOtp = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", purpose = "VERIFY_EMAIL" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "email is required");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "No account found with that email");
    }

    if (purpose === "VERIFY_EMAIL" && user.Is_Verified) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email already verified");
    }

    const code = await createOtp(email, purpose);
    await sendOtpEmail(email, code, purpose);

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "OTP sent — check your email");
  } catch (err) {
    console.error("Resend OTP error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region forgot password — sends reset OTP
const forgotPassword = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "email is required");
    }

    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Please enter a valid email address");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Return a clear 404 — the user explicitly asked to handle this case.
      // If you later need to prevent email enumeration, change this to a generic 200.
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE,
        "No account found with that email address. Please check and try again."
      );
    }

    const code = await createOtp(email, "RESET_PASSWORD");
    try {
      await sendOtpEmail(email, code, "RESET_PASSWORD");
    } catch (emailErr) {
      console.error("[ForgotPassword] Email delivery failed:", emailErr?.message);
      const msg = emailErr?.message || "";
      const isConfigError = msg.includes("credentials") || msg.includes("535") || msg.includes("auth");

      return sendResponse(res, 500, RESPONSE_STATUS.FAILURE,
        isConfigError
          ? "SMTP error: Invalid server email credentials. Please check your .env file."
          : "Could not send reset email. Please try again later."
      );
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Reset code sent — check your email.");
  } catch (err) {
    console.error("Forgot password error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region reset password — verify OTP then set new password
const resetPassword = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", otp = "", password = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !otp || !password) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "email, otp and password are required");
    }
    if (password.length < 6) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Password must be at least 6 characters");
    }

    const record = await Otp.findOne({ email, purpose: "RESET_PASSWORD", used: false });
    if (!record) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "OTP not found or already used. Request a new one.");
    }
    if (new Date() > record.expiresAt) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "OTP has expired. Request a new one.");
    }
    if (record.otp !== otp.trim()) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Incorrect OTP");
    }

    record.used = true;
    await record.save();

    const user = await User.findOneAndUpdate(
      { Email: email, Is_Deleted: 0 },
      { $set: { Password: await hashPassword(password) } },
      { new: true },
    );
    if (!user) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Password reset successfully. You can now sign in.");
  } catch (err) {
    console.error("Reset password error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region login
const login = async (req = {}, res = {}, next) => {
  try {
    const validation = validateLogin(req?.body || {});
    if (!validation?.isValid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, validation?.error || "Invalid input");
    }

    const { email = "", password = "" } = req?.body || {};
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmail(normalizedEmail);
    const isPasswordValid = user && (await verifyPassword(password, user?.Password || ""));

    if (!user || !isPasswordValid) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Invalid credentials");
    }

    // Block unverified users
    if (!user.Is_Verified) {
      return sendResponse(res, 403, RESPONSE_STATUS.FAILURE, "Please verify your email before logging in.", {
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    // Check if 2FA is enabled
    if (user.TwoFA_Enabled) {
      return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "2FA verification required", {
        requires2FA: true,
        email: normalizedEmail,
        availableMethods: {
          phone: user.TwoFA_Methods.phone.enabled,
          authenticator: user.TwoFA_Methods.authenticator.enabled,
          backupCode: user.TwoFA_Methods.backup_codes.enabled,
        },
      });
    }

    const profile = await getProfileQuery(user?.User_Id);
    const token = generateToken({ User_Id: user?.User_Id, email: user?.Email, role: user?.Role });
    setOtpCookie(res, token);

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Login successful", { user: profile });
  } catch (err) {
    console.error("Login error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region logout
const logout = async (req = {}, res = {}, next) => {
  try {
    res?.clearCookie?.("token", {
      httpOnly: true,
      secure: process?.env?.NODE_ENV === "production",
      sameSite: "Strict",
    });
    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Logout successful");
  } catch (err) {
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region get profile
const getProfile = async (req = {}, res = {}, next) => {
  try {
    const userId = req?.user?.User_Id || "";
    if (!userId) return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");

    const profile = await getProfileQuery(userId);
    if (!profile) return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Profile fetched successfully", profile);
  } catch (err) {
    console.error("Profile error:", err);
    next(err);
  }
};
// endregion

// region exports
export {
  login,
  logout,
  getProfile,
  signup,
  resendOtp,
  forgotPassword,
  resetPassword,
};
// endregion
