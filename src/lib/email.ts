import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your RMDC Exam Prep account",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Verify your email</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your RMDC Exam Prep password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}
