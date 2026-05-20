// region imports
import {
  sendResponse,
  STATUS_CODE,
  RESPONSE_STATUS,
  generateToken,
} from "../../utils/index.js";
import { User, TwoFAOtp, SignupProgress } from "../../models/index.js";
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
  send2FALoginEmail,
  sendBackupCodesEmail,
} from "../../services/email/twoFAEmailService.js";
import { getProfileQuery } from "../../queries/index.js";
// endregion

// region helpers
const create2FAOTP = async (email, method, purpose) => {
  await TwoFAOtp.deleteMany({ email, method, purpose });
  const code = generate2FAOTP();
  await TwoFAOtp.create({
    email,
    otp: code,
    method,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
// endregion

// region start 2FA setup
const start2FASetup = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;
    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    userDoc.TwoFA_Setup_Status = "IN_PROGRESS";
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "2FA setup started", {
      setupStatus: "IN_PROGRESS",
    });
  } catch (err) {
    console.error("Start 2FA setup error:", err);
    next(err);
  }
};
// endregion

// region setup phone 2FA
const setupPhone2FA = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;
    const { phone_number } = req.body || {};

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    if (!phone_number) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Phone number is required");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const otp = await create2FAOTP(userDoc.Email, "PHONE", "SETUP_2FA");

    try {
      await send2FASetupEmail(userDoc.Email, otp);
    } catch (emailErr) {
      console.error("[Setup Phone 2FA] Email delivery failed:", emailErr?.message);
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Failed to send verification code");
    }

    userDoc.TwoFA_Methods.phone.phone_number = phone_number;
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Verification code sent to your email", {
      method: "phone",
      phone_number: phone_number.replace(/\d(?=\d{4})/g, "*"),
    });
  } catch (err) {
    console.error("Setup phone 2FA error:", err);
    next(err);
  }
};
// endregion

// region verify phone 2FA
const verifyPhone2FA = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;
    const { otp } = req.body || {};

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    if (!otp) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "OTP is required");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const verification = await verify2FAOTP(userDoc.Email, otp, "PHONE", "SETUP_2FA");
    if (!verification.valid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, verification.message);
    }

    userDoc.TwoFA_Methods.phone.enabled = true;
    userDoc.TwoFA_Methods.phone.verified = true;
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Phone 2FA verified successfully", {
      method: "phone",
      enabled: true,
    });
  } catch (err) {
    console.error("Verify phone 2FA error:", err);
    next(err);
  }
};
// endregion

// region setup authenticator 2FA
const setupAuthenticator2FA = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const { secret, qrCode } = generateTOTPSecret(userDoc.Email);
    const qrCodeDataUrl = await generateQRCode(qrCode);

    userDoc.TwoFA_Methods.authenticator.secret = secret;
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Authenticator setup initiated", {
      method: "authenticator",
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (err) {
    console.error("Setup authenticator 2FA error:", err);
    next(err);
  }
};
// endregion

// region verify authenticator 2FA
const verifyAuthenticator2FA = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;
    const { token } = req.body || {};

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    if (!token) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Token is required");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const secret = userDoc.TwoFA_Methods.authenticator.secret;
    if (!secret) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Authenticator not set up");
    }

    const isValid = verifyTOTPToken(secret, token);
    if (!isValid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Invalid authenticator token");
    }

    userDoc.TwoFA_Methods.authenticator.enabled = true;
    userDoc.TwoFA_Methods.authenticator.verified = true;
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Authenticator verified successfully", {
      method: "authenticator",
      enabled: true,
    });
  } catch (err) {
    console.error("Verify authenticator 2FA error:", err);
    next(err);
  }
};
// endregion

// region generate backup codes
const generateBackupCodes2FA = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const codes = generateBackupCodes(10);

    userDoc.TwoFA_Methods.backup_codes.codes = codes;
    userDoc.TwoFA_Methods.backup_codes.enabled = true;
    await userDoc.save();

    try {
      const codeStrings = codes.map((c) => c.code);
      await sendBackupCodesEmail(userDoc.Email, codeStrings);
    } catch (emailErr) {
      console.error("[Generate Backup Codes] Email delivery failed:", emailErr?.message);
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Backup codes generated", {
      codes: codes.map((c) => c.code),
      message: "Backup codes have been sent to your email",
    });
  } catch (err) {
    console.error("Generate backup codes error:", err);
    next(err);
  }
};
// endregion

// region complete 2FA setup
const complete2FASetup = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    const hasPhone = userDoc.TwoFA_Methods.phone.enabled;
    const hasAuthenticator = userDoc.TwoFA_Methods.authenticator.enabled;
    const hasBackupCodes = userDoc.TwoFA_Methods.backup_codes.enabled;

    if (!hasPhone && !hasAuthenticator) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "At least one 2FA method must be enabled");
    }

    userDoc.TwoFA_Enabled = true;
    userDoc.TwoFA_Setup_Status = "COMPLETED";
    await userDoc.save();

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "2FA setup completed successfully", {
      twoFAEnabled: true,
      methods: {
        phone: hasPhone,
        authenticator: hasAuthenticator,
        backupCodes: hasBackupCodes,
      },
    });
  } catch (err) {
    console.error("Complete 2FA setup error:", err);
    next(err);
  }
};
// endregion

// region get 2FA status
const get2FAStatus = async (req = {}, res = {}, next) => {
  try {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, RESPONSE_STATUS.FAILURE, "Unauthorized");
    }

    const userDoc = await User.findById(user.User_Id);
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "2FA status retrieved", {
      twoFAEnabled: userDoc.TwoFA_Enabled,
      setupStatus: userDoc.TwoFA_Setup_Status,
      methods: {
        phone: {
          enabled: userDoc.TwoFA_Methods.phone.enabled,
          verified: userDoc.TwoFA_Methods.phone.verified,
          phone_number: userDoc.TwoFA_Methods.phone.phone_number
            ? userDoc.TwoFA_Methods.phone.phone_number.replace(/\d(?=\d{4})/g, "*")
            : null,
        },
        authenticator: {
          enabled: userDoc.TwoFA_Methods.authenticator.enabled,
          verified: userDoc.TwoFA_Methods.authenticator.verified,
        },
        backupCodes: {
          enabled: userDoc.TwoFA_Methods.backup_codes.enabled,
          count: userDoc.TwoFA_Methods.backup_codes.codes.filter((c) => !c.used).length,
        },
      },
    });
  } catch (err) {
    console.error("Get 2FA status error:", err);
    next(err);
  }
};
// endregion

// region verify 2FA login
const verify2FALogin = async (req = {}, res = {}, next) => {
  try {
    const { email, method, code } = req.body || {};

    if (!email || !method || !code) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email, method, and code are required");
    }

    const userDoc = await User.findOne({ Email: email.toLowerCase(), Is_Deleted: 0 });
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    if (!userDoc.TwoFA_Enabled) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "2FA is not enabled for this account");
    }

    let isValid = false;

    if (method === "phone" && userDoc.TwoFA_Methods.phone.enabled) {
      const verification = await verify2FAOTP(email, code, "PHONE", "LOGIN_2FA");
      isValid = verification.valid;
    } else if (method === "authenticator" && userDoc.TwoFA_Methods.authenticator.enabled) {
      isValid = verifyTOTPToken(userDoc.TwoFA_Methods.authenticator.secret, code);
    } else if (method === "backup_code" && userDoc.TwoFA_Methods.backup_codes.enabled) {
      const backupCode = verifyBackupCode(userDoc.TwoFA_Methods.backup_codes.codes, code);
      if (backupCode) {
        backupCode.used = true;
        backupCode.used_at = new Date();
        await userDoc.save();
        isValid = true;
      }
    }

    if (!isValid) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Invalid verification code");
    }

    // Generate token and set cookie
    const token = generateToken({ User_Id: userDoc?.User_Id, email: userDoc?.Email, role: userDoc?.Role });
    res?.cookie?.("token", token, {
      httpOnly: true,
      secure: process?.env?.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24,
    });

    const profile = await getProfileQuery(userDoc?.User_Id);

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "2FA verification successful", {
      verified: true,
      user: profile,
    });
  } catch (err) {
    console.error("Verify 2FA login error:", err);
    next(err);
  }
};
// endregion

// region send 2FA login code
const send2FALoginCode = async (req = {}, res = {}, next) => {
  try {
    const { email, method } = req.body || {};

    if (!email || !method) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Email and method are required");
    }

    const userDoc = await User.findOne({ Email: email.toLowerCase(), Is_Deleted: 0 });
    if (!userDoc) {
      return sendResponse(res, 404, RESPONSE_STATUS.FAILURE, "User not found");
    }

    if (!userDoc.TwoFA_Enabled) {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "2FA is not enabled for this account");
    }

    if (method === "phone" && userDoc.TwoFA_Methods.phone.enabled) {
      const otp = await create2FAOTP(email, "PHONE", "LOGIN_2FA");
      try {
        await send2FALoginEmail(email, otp);
      } catch (emailErr) {
        console.error("[Send 2FA Login Code] Email delivery failed:", emailErr?.message);
        return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Failed to send verification code");
      }
    } else {
      return sendResponse(res, 400, RESPONSE_STATUS.FAILURE, "Invalid 2FA method");
    }

    return sendResponse(res, 200, RESPONSE_STATUS.SUCCESS, "Verification code sent", {
      method,
    });
  } catch (err) {
    console.error("Send 2FA login code error:", err);
    next(err);
  }
};
// endregion

// region exports
export {
  start2FASetup,
  setupPhone2FA,
  verifyPhone2FA,
  setupAuthenticator2FA,
  verifyAuthenticator2FA,
  generateBackupCodes2FA,
  complete2FASetup,
  get2FAStatus,
  verify2FALogin,
  send2FALoginCode,
};
// endregion
