import { Resend } from "resend";

export async function sendWelcomeEmail(to: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("[EMAIL] RESEND_API_KEY not set — skipping welcome email"); return; }

  const resend   = new Resend(apiKey);
  const FROM     = process.env.RESEND_FROM    ?? "MedLicense <onboarding@resend.dev>";
  const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://medlicense.rw";
  const firstName = name.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MedLicense</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">MedLicense</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Rwanda Medical Licensing Exam Prep</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:700;">Welcome, ${firstName}! 🎉</h2>
              <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">
                Your MedLicense account has been created. You now have access to Rwanda's premier medical licensing exam preparation platform.
              </p>

              <!-- Feature highlights -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                ${[
                  { icon: "📝", title: "Mock Exams", desc: "Practice with real-style licensing questions" },
                  { icon: "🇫🇷", title: "Bilingual",  desc: "Questions available in English and French" },
                  { icon: "📊", title: "Analytics",  desc: "Track your progress and identify weak areas" },
                ].map(({ icon, title, desc }) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;font-size:20px;vertical-align:middle;">${icon}</td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;color:#1a1a2e;font-size:14px;font-weight:600;">${title}</p>
                          <p style="margin:2px 0 0;color:#777;font-size:13px;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Go to My Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tips strip -->
          <tr>
            <td style="background:#f8f9ff;padding:24px 40px;border-top:1px solid #eef0f8;">
              <p style="margin:0 0 12px;color:#4f46e5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Quick Start Tips</p>
              <ul style="margin:0;padding:0 0 0 18px;color:#555;font-size:13px;line-height:1.8;">
                <li>Browse <strong>Free Trial Exams</strong> — no subscription needed</li>
                <li>Upgrade to <strong>Pro (4,000 RWF/month)</strong> for unlimited access</li>
                <li>Use the <strong>Smart Builder</strong> to create custom practice sets</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;">
                You received this email because you created an account on MedLicense.<br/>
                <a href="${APP_URL}" style="color:#4f46e5;text-decoration:none;">medlicense.rw</a> · Rwanda
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to MedLicense, ${firstName}!`,
    html,
  });
}
