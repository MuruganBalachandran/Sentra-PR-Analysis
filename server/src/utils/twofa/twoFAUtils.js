// region imports
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
// endregion

// region generate TOTP secret
export const generateTOTPSecret = (email, appName = "Sentra") => {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    issuer: appName,
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
  };
};
// endregion

// region generate QR code
export const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    return qrCode;
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
};
// endregion

// region verify TOTP token
export const verifyTOTPToken = (secret, token) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time windows (±30 seconds)
    });

    return verified;
  } catch (error) {
    return false;
  }
};
// endregion

// region generate backup codes
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push({
      code: `${code.slice(0, 4)}-${code.slice(4)}`,
      used: false,
      used_at: null,
    });
  }
  return codes;
};
// endregion

// region verify backup code
export const verifyBackupCode = (backupCodes, code) => {
  const normalizedCode = code.replace(/\s|-/g, "").toUpperCase();
  const codeEntry = backupCodes.find(
    (c) => c.code.replace(/\s|-/g, "").toUpperCase() === normalizedCode && !c.used
  );

  return codeEntry || null;
};
// endregion

// region generate 2FA OTP
export const generate2FAOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// endregion

// region exports
export default {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  verifyBackupCode,
  generate2FAOTP,
};
// endregion
