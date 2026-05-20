// region imports
import nodemailer from "nodemailer";
import { env } from "../../config/index.js";
// endregion

// region transporter factory
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (!env?.SMTP_USER || !env?.SMTP_PASS) {
    throw new Error("SMTP credentials are not fully configured in the .env file.");
  }

  _transporter = nodemailer.createTransport({
    host: env?.SMTP_HOST || "smtp.gmail.com",
    port: Number(env?.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: env?.SMTP_USER,
      pass: env?.SMTP_PASS,
    },
  });

  return _transporter;
};
// endregion

// region HTML template
const buildHtml = (otp, isVerify) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">&#x1F6E1;&#xFE0F; Sentra</div>
            <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">${isVerify ? "Email Verification" : "Password Reset"}</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${isVerify ? "Verify your email" : "Reset your password"}</p>
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
            ${isVerify
    ? "Use the code below to verify your email address and activate your account."
    : "Use the code below to reset your Sentra account password."}
          </p>
          <div style="background:#f0f0ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">One-Time Code</p>
            <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${otp}</p>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin:0 0 4px;">&#x23F0; Expires in <strong>10 minutes</strong>.</p>
          <p style="font-size:13px;color:#9ca3af;margin:0;">If you did not request this, ignore this email.</p>
        </td></tr>
        <tr><td style="padding:16px 40px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sentra — Code Risk Intelligence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
// endregion

// region send OTP email
/**
 * @param {string} to
 * @param {string} otp
 * @param {"VERIFY_EMAIL"|"RESET_PASSWORD"} purpose
 */
const sendOtpEmail = async (to = "", otp = "", purpose = "VERIFY_EMAIL") => {
  const isVerify = purpose === "VERIFY_EMAIL";
  const subject = isVerify ? "Verify your Sentra account" : "Reset your Sentra password";

  const transporter = getTransporter();

  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject,
    html: buildHtml(otp, isVerify),
  });
};
// endregion

export { sendOtpEmail };
