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
    secure: false,
    auth: {
      user: env?.SMTP_USER,
      pass: env?.SMTP_PASS,
    },
  });

  return _transporter;
};
// endregion

// region HTML templates
const buildSetup2FAHtml = (otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">🔐 Sentra</div>
            <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">Two-Factor Authentication Setup</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Verify your phone number</p>
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
            Use the code below to verify your phone number and complete 2FA setup.
          </p>
          <div style="background:#f0f0ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">Verification Code</p>
            <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${otp}</p>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin:0 0 4px;">⏰ Expires in <strong>10 minutes</strong>.</p>
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

const buildLogin2FAHtml = (otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">🔐 Sentra</div>
            <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">Login Verification</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Verify your login</p>
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
            Use the code below to complete your login to Sentra.
          </p>
          <div style="background:#f0f0ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">Verification Code</p>
            <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${otp}</p>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin:0 0 4px;">⏰ Expires in <strong>10 minutes</strong>.</p>
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

const buildBackupCodesHtml = (codes) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">🔐 Sentra</div>
            <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">Backup Codes Generated</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Save your backup codes</p>
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
            Keep these codes in a safe place. You can use them to access your account if you lose access to your 2FA methods.
          </p>
          <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#92400e;">⚠️ Important</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">Each code can only be used once. Do not share these codes with anyone.</p>
          </div>
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px;font-family:monospace;font-size:12px;line-height:1.8;color:#374151;">
            ${codes.map((code) => `<div>${code}</div>`).join("")}
          </div>
          <p style="font-size:13px;color:#9ca3af;margin:0;">Store these codes securely. You can download them from your account settings.</p>
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

// region send 2FA setup email
const send2FASetupEmail = async (to = "", otp = "") => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject: "Verify your phone number - Sentra 2FA Setup",
    html: buildSetup2FAHtml(otp),
  });
};
// endregion

// region send 2FA login email
const send2FALoginEmail = async (to = "", otp = "") => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject: "Verify your login - Sentra",
    html: buildLogin2FAHtml(otp),
  });
};
// endregion

// region send backup codes email
const sendBackupCodesEmail = async (to = "", codes = []) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject: "Your Sentra backup codes",
    html: buildBackupCodesHtml(codes),
  });
};
// endregion

export { send2FASetupEmail, send2FALoginEmail, sendBackupCodesEmail };
