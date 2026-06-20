// region imports
import nodemailer from "nodemailer";
import { env } from "../../config/index.js";
// endregion

// region transporter factory (singleton)
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
    auth: { user: env?.SMTP_USER, pass: env?.SMTP_PASS },
  });
  return _transporter;
};
// endregion

// region OTP email template
const buildOtpHtml = (otp, isVerify) => `
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
            ${isVerify ? "Use the code below to verify your email address and activate your account." : "Use the code below to reset your Sentra account password."}
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

// region PR analysis email template
const SEVERITY_COLORS = {
  critical: { bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626", label: "🔴 Critical" },
  high:     { bg: "#fff7ed", border: "#fdba74", badge: "#ea580c", label: "🟠 High" },
  medium:   { bg: "#fffbeb", border: "#fcd34d", badge: "#d97706", label: "🟡 Medium" },
  low:      { bg: "#f0fdf4", border: "#86efac", badge: "#16a34a", label: "🟢 Low" },
};

const buildPRAnalysisHtml = ({ repoFullName, prNumber, prTitle, severity, riskSummary, appUrl }) => {
  const sev = SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.low;
  const viewUrl = `${appUrl || "http://localhost:5173"}/pr-analyses`;

  // Extract first ~400 chars of risk summary for the email preview
  const preview = (riskSummary || "")
    .replace(/#{1,6}\s/g, "")   // strip markdown headers
    .replace(/\*\*/g, "")        // strip bold
    .replace(/`/g, "")           // strip code ticks
    .trim()
    .substring(0, 400);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">&#x1F6E1;&#xFE0F; Sentra</div>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">PR Risk Analysis Complete</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 24px;">

          <!-- Severity badge -->
          <div style="display:inline-block;background:${sev.badge};color:#fff;font-size:13px;font-weight:700;padding:6px 16px;border-radius:999px;margin-bottom:20px;">
            ${sev.label}
          </div>

          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">New PR Analyzed</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Sentra has analyzed a pull request in one of your monitored repositories.</p>

          <!-- PR details card -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Repository</td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:600;color:#111827;padding-bottom:14px;">${repoFullName}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Pull Request</td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:600;color:#111827;">PR #${prNumber} — ${prTitle || "Untitled"}</td>
              </tr>
            </table>
          </div>

          <!-- Risk summary preview -->
          <div style="background:${sev.bg};border:1.5px solid ${sev.border};border-radius:10px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#374151;">Risk Summary Preview</p>
            <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${preview}${riskSummary?.length > 400 ? "…" : ""}</p>
          </div>

          <!-- CTA button -->
          <div style="text-align:center;margin-bottom:8px;">
            <a href="${viewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
              View Full Analysis →
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 40px 28px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sentra — Code Risk Intelligence &nbsp;|&nbsp; You're receiving this because you monitor <strong>${repoFullName}</strong></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
// endregion

// region send OTP email
const sendOtpEmail = async (to = "", otp = "", purpose = "VERIFY_EMAIL") => {
  const isVerify = purpose === "VERIFY_EMAIL";
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject: isVerify ? "Verify your Sentra account" : "Reset your Sentra password",
    html: buildOtpHtml(otp, isVerify),
  });
};
// endregion

// region send PR analysis notification email
const sendPRAnalysisEmail = async (to = "", data = {}) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env?.SMTP_FROM || `Sentra <${env?.SMTP_USER}>`,
    to,
    subject: `[Sentra] ${data.severity || "Risk"} risk detected in PR #${data.prNumber} — ${data.repoFullName}`,
    html: buildPRAnalysisHtml({
      ...data,
      appUrl: env?.APP_URL || "http://localhost:5173",
    }),
  });
};
// endregion

export { sendOtpEmail, sendPRAnalysisEmail };
