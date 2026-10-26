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
  });
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

/** Sends the password-reset email through Gmail / Google SMTP. Never throws ΓÇö a delivery
 * failure must not leak whether the account exists or block the generic
 * "if an account exists" response, so failures are logged and swallowed. */
export async function sendPasswordResetEmail({ to, resetUrl }) {
  let { configured, from } = gmailAuth();
  if (!configured) {
    logger.warn(
      { to },
      `[email] GMAIL_USER / GMAIL_APP_PASSWORD not set ΓÇö skipping send. Reset link (dev only): ${resetUrl}`
    );
    return { skipped: true };
  }

  try {
    let info = await createTransporter().sendMail({
      from,
      to,
      subject: "Reset your Teamora password",
      html: passwordResetEmailHtml({ resetUrl }),
    });
    logger.info({ to, messageId: info.messageId }, "[email] Password reset email sent via Google/Gmail SMTP");
    return { skipped: false, ok: true };
  } catch (err) {
    logger.error(
      { err, to, code: err.code, response: err.response },
      "[email] Failed to send password reset email via Google/Gmail SMTP"
    );
    return { skipped: false, ok: false };
  }
}
