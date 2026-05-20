// region imports
import {
  sendResponse,
  RESPONSE_STATUS,
} from "../../utils/index.js";
import { verifyPassword, generateToken, hashPassword } from "../../utils/index.js";
import { User, Otp, SignupProgress, TwoFAOtp } from "../../models/index.js";
import { findUserByEmail, isEmailExists } from "../../queries/index.js";
import { sendOtpEmail } from "../../services/email/emailService.js";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  verifyBackupCode,
  generate2FAOTP,
} from "../../utils/twofa/twoFAUtils.js";
import {
  send2FASetupEmail,
  sendBackupCodesEmail,
} from "../../services/email/twoFAEmailService.js";
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

const create2FAOTP = async (email, method, purpose) => {
  await TwoFAOtp.deleteMany({ email, method, purpose });
  const code = generate2FAOTP();
  await TwoFAOtp.create({
    email,
    otp: code,
    method,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });
  return code;
};

const verify2FAOTP = async (email, otp, method, purpose) => {
  const otpRecord = await TwoFAOtp.findOne({
    email,
    method,
    purpose,
    used: false,
  });

  if (!otpRecord) {
    return { valid: false, message: "OTP not found or already used" };
  }

  if (new Date() > otpRecord.expiresAt) {
    return { valid: false, message: "OTP has expired" };
  }

  if (otpRecord.attempts >= otpRecord.max_attempts) {
    return { valid: false, message: "Maximum attempts exceeded" };
  }

  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return { valid: false, message: "Invalid OTP" };
  }

  otpRecord.used = true;
  otpRecord.used_at = new Date();
  await otpRecord.save();

  return { valid: true };
};

const getOrCreateSignupProgress = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  let progress = await SignupProgress.findOne({ Email: normalizedEmail, Is_Deleted: 0 });

  if (!progress) {
    progress = new SignupProgress({ Email: normalizedEmail });
    await progress.save();
  }

  return progress;
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 1: initiate signup with email
const initiateSignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Please enter a valid email address");
    }

    // Check if email already exists (including soft-deleted users)
    const existingUser = await User.findOne({ Email: email });
    if (existingUser && existingUser.Is_Deleted === 0) {
      return sendResponse(res, 409, RESPONSE_STATUS.FAILURE, "An account with this email already exists");
    }

    // Get or create signup progress
    const progress = await getOrCreateSignupProgress(email);

    // Generate and send OTP
    const code = await createOtp(email, "VERIFY_EMAIL");
    try {
      await sendOtpEmail(email, code, "VERIFY_EMAIL");
    } catch (emailErr) {
      console.error("[Initiate Signup] Email delivery failed:", emailErr?.message);
      const msg = emailErr?.message || "";
      const isConfigError = msg.includes("credentials") || msg.includes("535") || msg.includes("auth");

      return sendResponse(
        res,
        400,
        RESPONSE_STATUS.FAILURE,
        isConfigError
          ? "SMTP error: Invalid server email credentials. Please check your .env file."
          : "Could not deliver a verification email to that address. Please check the email and try again."
      );
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Verification code sent to your email", {
      email,
      stage: "EMAIL_VERIFICATION",
    });
  } catch (err) {
    console.error("Initiate signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 2: verify email OTP
const verifySignupEmail = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", otp = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !otp) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and OTP are required");
    }

    // Verify OTP
    const record = await Otp.findOne({ email, purpose: "VERIFY_EMAIL", used: false });
    if (!record) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "OTP not found or already used. Request a new one.");
    }
    if (new Date() > record.expiresAt) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "OTP has expired. Request a new one.");
    }
    if (record.otp !== otp.trim()) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Incorrect OTP");
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    // Update signup progress
    const progress = await SignupProgress.findOneAndUpdate(
      { Email: email, Is_Deleted: 0 },
      {
        $set: {
          Email_Verified: true,
          Email_Verified_At: new Date(),
          Stage: "PROFILE_SETUP",
        },
      },
      { new: true }
    );

    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Email verified successfully", {
      email,
      stage: "PROFILE_SETUP",
      message: "Now set up your profile",
    });
  } catch (err) {
    console.error("Verify signup email error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 3: setup profile (name, password)
const setupProfile = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", name = "", password = "", confirmPassword = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !name || !password || !confirmPassword) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email, name, password, and confirm password are required");
    }

    if (password.length < 6) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Passwords do not match");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    if (!progress.Email_Verified) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email must be verified first");
    }

    // Update progress with profile data
    progress.Profile_Data = { name, password };
    progress.Profile_Completed = true;
    progress.Profile_Completed_At = new Date();
    progress.Stage = "TWO_FA_SETUP";
    await progress.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Profile setup completed", {
      email,
      stage: "TWO_FA_SETUP",
      message: "Now set up 2FA",
    });
  } catch (err) {
    console.error("Setup profile error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 4: setup phone 2FA
const setupPhone2FASignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", phone_number = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !phone_number) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and phone number are required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    if (!progress.Profile_Completed) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Profile must be set up first");
    }

    // Generate OTP
    const otp = await create2FAOTP(email, "PHONE", "SETUP_2FA");

    // Send OTP via email
    try {
      await send2FASetupEmail(email, otp);
    } catch (emailErr) {
      console.error("[Setup Phone 2FA] Email delivery failed:", emailErr?.message);
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Failed to send verification code");
    }

    // Store phone number temporarily
    progress.TwoFA_Setup_Data.phone_number = phone_number;
    await progress.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Verification code sent to your email", {
      method: "phone",
      phone_number: phone_number.replace(/\d(?=\d{4})/g, "*"), // Mask phone
    });
  } catch (err) {
    console.error("Setup phone 2FA signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 5: verify phone 2FA
const verifyPhone2FASignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", otp = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !otp) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and OTP are required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    // Verify OTP using verify2FAOTP helper
    const verification = await verify2FAOTP(email, otp, "PHONE", "SETUP_2FA");
    if (!verification.valid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, verification.message);
    }

    // Update progress
    progress.TwoFA_Setup_Data.phone_verified = true;
    await progress.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Phone verified successfully", {
      method: "phone",
      verified: true,
    });
  } catch (err) {
    console.error("Verify phone 2FA signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 6: setup authenticator 2FA
const setupAuthenticator2FASignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    // Generate TOTP secret
    const { secret, qrCode } = generateTOTPSecret(email);
    const qrCodeDataUrl = await generateQRCode(qrCode);

    // Store secret temporarily
    progress.TwoFA_Setup_Data.authenticator_secret = secret;
    await progress.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Authenticator setup initiated", {
      method: "authenticator",
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (err) {
    console.error("Setup authenticator 2FA signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 7: verify authenticator 2FA
const verifyAuthenticator2FASignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "", token = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email || !token) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and token are required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    const secret = progress.TwoFA_Setup_Data.authenticator_secret;
    if (!secret) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Authenticator not set up");
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(secret, token);
    if (!isValid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Invalid authenticator token");
    }

    // Update progress
    progress.TwoFA_Setup_Data.authenticator_verified = true;
    await progress.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Authenticator verified successfully", {
      method: "authenticator",
      verified: true,
    });
  } catch (err) {
    console.error("Verify authenticator 2FA signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 8: generate backup codes
const generateBackupCodesSignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    // Generate backup codes
    const codes = generateBackupCodes(10);

    // Store backup codes
    progress.TwoFA_Setup_Data.backup_codes = codes;
    progress.TwoFA_Setup_Data.backup_codes_generated = true;
    await progress.save();

    // Send backup codes via email
    try {
      const codeStrings = codes.map((c) => c.code);
      await sendBackupCodesEmail(email, codeStrings);
    } catch (emailErr) {
      console.error("[Generate Backup Codes] Email delivery failed:", emailErr?.message);
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Backup codes generated", {
      codes: codes.map((c) => c.code),
      message: "Backup codes have been sent to your email",
    });
  } catch (err) {
    console.error("Generate backup codes signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region step 9: complete signup
const completeSignup = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Get signup progress
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    if (!progress.Email_Verified || !progress.Profile_Completed) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and profile must be verified first");
    }

    // Check if phone 2FA is verified (mandatory)
    const hasPhone = progress.TwoFA_Setup_Data.phone_verified;
    const hasAuthenticator = progress.TwoFA_Setup_Data.authenticator_verified;
    const hasBackupCodes = progress.TwoFA_Setup_Data.backup_codes_generated;

    if (!hasPhone) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Phone 2FA is required to complete signup");
    }

    // Create user account
    const { name, password } = progress.Profile_Data;
    const hashedPassword = await hashPassword(password);
    const user = new User({
      Name: name,
      Email: email,
      Password: hashedPassword,
      Role: "USER",
      Is_Verified: true,
      TwoFA_Enabled: true,
      TwoFA_Setup_Status: "COMPLETED",
      TwoFA_Methods: {
        phone: {
          enabled: hasPhone,
          phone_number: hasPhone ? progress.TwoFA_Setup_Data.phone_number : null,
          verified: hasPhone,
        },
        authenticator: {
          enabled: hasAuthenticator,
          secret: hasAuthenticator ? progress.TwoFA_Setup_Data.authenticator_secret : null,
          verified: hasAuthenticator,
        },
        backup_codes: {
          enabled: progress.TwoFA_Setup_Data.backup_codes_generated,
          codes: progress.TwoFA_Setup_Data.backup_codes_generated ? progress.TwoFA_Setup_Data.backup_codes : [],
        },
      },
    });

    await user.save();

    // Update signup progress
    progress.User_Id = user._id;
    progress.TwoFA_Completed = true;
    progress.TwoFA_Completed_At = new Date();
    progress.Stage = "COMPLETED";
    await progress.save();

    // Generate token and set cookie
    const token = generateToken({ User_Id: user.User_Id, email: user.Email, role: user.Role });
    setOtpCookie(res, token);

    return sendResponse(res, 201, RESPONSE_STATUS.SUCCESS, "Account created successfully! Welcome to Sentra 🎉", {
      user: {
        User_Id: user.User_Id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
      },
    });
  } catch (err) {
    console.error("Complete signup error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region get signup progress
const getSignupProgress = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Signup progress retrieved", {
      email,
      stage: progress.Stage,
      emailVerified: progress.Email_Verified,
      profileCompleted: progress.Profile_Completed,
      twoFACompleted: progress.TwoFA_Completed,
      twoFAMethods: {
        phone: progress.TwoFA_Setup_Data.phone_verified,
        authenticator: progress.TwoFA_Setup_Data.authenticator_verified,
        backupCodes: progress.TwoFA_Setup_Data.backup_codes_generated,
      },
    });
  } catch (err) {
    console.error("Get signup progress error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region resend email verification OTP
const resendEmailVerificationOtp = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Check if signup progress exists
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found. Please start over.");
    }

    // Generate and send new OTP
    const code = await createOtp(email, "VERIFY_EMAIL");
    try {
      await sendOtpEmail(email, code, "VERIFY_EMAIL");
    } catch (emailErr) {
      console.error("[Resend Email Verification OTP] Email delivery failed:", emailErr?.message);
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Failed to send verification code");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "New verification code sent to your email", {
      email,
      message: "Check your email for the new code",
    });
  } catch (err) {
    console.error("Resend email verification OTP error:", err);
    next(err);
  }
};
// endregion

// ─────────────────────────────────────────────────────────────────────────────
// region resend phone 2FA OTP
const resendPhone2FAOtp = async (req = {}, res = {}, next) => {
  try {
    const { email: rawEmail = "" } = req?.body || {};
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email is required");
    }

    // Check if signup progress exists
    const progress = await SignupProgress.findOne({ Email: email, Is_Deleted: 0 });
    if (!progress) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "Signup session not found");
    }

    if (progress.Stage !== "TWO_FA_SETUP") {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Invalid signup stage");
    }

    if (!progress.TwoFA_Setup_Data.phone_number) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Phone number not set up");
    }

    // Generate and send new OTP
    const otp = await create2FAOTP(email, "PHONE", "SETUP_2FA");
    try {
      await send2FASetupEmail(email, otp);
    } catch (emailErr) {
      console.error("[Resend Phone 2FA OTP] Email delivery failed:", emailErr?.message);
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Failed to send verification code");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "New verification code sent to your email", {
      method: "phone",
      message: "Check your email for the new code",
    });
  } catch (err) {
    console.error("Resend phone 2FA OTP error:", err);
    next(err);
  }
};
// endregion

// region exports
export {
  initiateSignup,
  verifySignupEmail,
  setupProfile,
  setupPhone2FASignup,
  verifyPhone2FASignup,
  setupAuthenticator2FASignup,
  verifyAuthenticator2FASignup,
  generateBackupCodesSignup,
  completeSignup,
  getSignupProgress,
  resendEmailVerificationOtp,
  resendPhone2FAOtp,
};
// endregion
