import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "MedLicense <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
  return resend.emails.send({
    from,
    to,
    subject: "Reset your MedLicense password",
    html: `<p>You requested a password reset.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>This link expires in one hour. If you did not request it, ignore this email.</p>`,
  });
}

export async function sendAutomationEmail(to: string, subject: string, heading: string, message: string, actionLabel: string, actionPath: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "MedLicense <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const actionUrl = `${appUrl}${actionPath}`;
  return resend.emails.send({
    from, to, subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#172033"><h2>${escapeHtml(heading)}</h2><p style="line-height:1.7;color:#526076">${escapeHtml(message)}</p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:12px;padding:12px 20px;border-radius:10px;background:#0f766e;color:white;text-decoration:none;font-weight:700">${escapeHtml(actionLabel)}</a><p style="margin-top:28px;font-size:12px;color:#8993a4">MedLicense · Professional medical licensing preparation</p></div>`,
  });
}
