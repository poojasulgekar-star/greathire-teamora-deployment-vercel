import nodemailer from "nodemailer";
import { logger } from "./logger.js";

function gmailAuth() {
  let user = (process.env.GMAIL_USER || "").trim();
  let pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  let from = (process.env.GMAIL_FROM_EMAIL || "").trim() || user;
  return { user, pass, from, configured: Boolean(user && pass) };
}

function createTransporter() {
  let { user, pass } = gmailAuth();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 7000,
  });
}

function parseSender(rawSender, fallbackEmail) {
  let sender = (rawSender || "").trim() || fallbackEmail;
  let match = sender.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ""), email: match[2].trim() };
  }
  return { name: "Teamora", email: sender };
}

function passwordResetEmailHtml({ resetUrl }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#111827;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;">Teamora</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">Password Reset Request</h1>
                <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#374151;">Hi,</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#374151;">
                  We received a request to reset your Teamora account password. Click the button below to create a new password.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#4f46e5;">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Reset Password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#6b7280;">
                  This link will expire in 30 minutes.
                </p>
                <p style="margin:16px 0 0;font-size:13px;line-height:20px;color:#6b7280;">
                  If you did not request this password reset, you can safely ignore this email ΓÇö your password will not be changed.
                </p>
                <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">
                  Teamora Security Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Sends the password-reset email.
 * Supports:
 *  1. Brevo REST API (HTTPS port 443 — works seamlessly in cloud & serverless, 300 free emails/day)
 *  2. Resend REST API (HTTPS port 443 — works in cloud & serverless)
 *  3. Gmail SMTP via Nodemailer (local dev or hosting where port 465 is unblocked)
 * Never throws — failures are logged so account existence is not leaked.
 */
export async function sendPasswordResetEmail({ to, resetUrl }) {
  let brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
  let resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  let { user, pass, from, configured: gmailConfigured } = gmailAuth();
  let html = passwordResetEmailHtml({ resetUrl });

  // 1. Try Brevo HTTPS API if key is present (ideal for cloud serverless — port 443 HTTPS)
  if (brevoApiKey) {
    try {
      let sender = parseSender(process.env.BREVO_FROM_EMAIL || from, user || "noreply@greathire.com");
      let res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: "Reset your Teamora password",
          htmlContent: html,
        }),
      });

      if (res.ok) {
        let data = await res.json().catch(() => ({}));
        logger.info({ to, messageId: data?.messageId }, "[email] Password reset email sent via Brevo HTTPS API");
        return { skipped: false, ok: true, provider: "brevo" };
      }

      let errText = await res.text().catch(() => "");
      logger.error({ status: res.status, body: errText }, "[email] Brevo HTTPS API request failed");
    } catch (err) {
      logger.error({ err }, "[email] Failed to send email via Brevo HTTPS API");
    }
  }

  // 2. Try Resend HTTPS API if key is present
  if (resendApiKey) {
    try {
      let fromEmail = (process.env.RESEND_FROM_EMAIL || from || "Teamora <onboarding@resend.dev>").trim();
      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: "Reset your Teamora password",
          html,
        }),
      });

      if (res.ok) {
        let data = await res.json().catch(() => ({}));
        logger.info({ to, id: data?.id }, "[email] Password reset email sent via Resend HTTPS API");
        return { skipped: false, ok: true, provider: "resend" };
      }

      let errText = await res.text().catch(() => "");
      logger.error({ status: res.status, body: errText }, "[email] Resend HTTPS API request failed");
    } catch (err) {
      logger.error({ err }, "[email] Failed to send email via Resend HTTPS API");
    }
  }

  // 3. Try Gmail SMTP if configured
  if (gmailConfigured) {
    try {
      let info = await createTransporter().sendMail({
        from,
        to,
        subject: "Reset your Teamora password",
        html,
      });
      logger.info({ to, messageId: info.messageId }, "[email] Password reset email sent via Google/Gmail SMTP");
      return { skipped: false, ok: true, provider: "gmail-smtp" };
    } catch (err) {
      let isBlockedOrTimeout = err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED" || err.command === "CONN";
      if (isBlockedOrTimeout) {
        logger.warn(
          { code: err.code, to },
          "[email] Gmail SMTP connection timed out or blocked. In serverless or restricted network environments, outbound SMTP ports (25, 465, 587) may be blocked. Use BREVO_API_KEY (HTTPS port 443, free 300 emails/day) or RESEND_API_KEY instead."
        );
      } else {
        logger.error(
          { err, to, code: err.code, response: err.response },
          "[email] Failed to send password reset email via Google/Gmail SMTP"
        );
      }
    }
  }

  // Fallback when sending was skipped or failed: log reset URL for testing/debugging
  logger.warn(
    { to },
    `[email] Password reset link (dev / testing fallback): ${resetUrl}`
  );
  return { skipped: true, ok: false };
}
