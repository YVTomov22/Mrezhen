import nodemailer from "nodemailer"

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function getTransporter() {
  const host = getRequiredEnv("SMTP_HOST")
  const port = Number(process.env.SMTP_PORT || "587")
  const user = getRequiredEnv("SMTP_USER")
  const pass = getRequiredEnv("SMTP_PASS")
  const secure = process.env.SMTP_SECURE === "true"

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM || "Mrezhen <no-reply@mrezhen.local>"
  const transporter = getTransporter()

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Mrezhen password",
    text: `We received a request to reset your password.\n\nReset it here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:560px;margin:0 auto;padding:16px;">
        <h2 style="margin:0 0 12px 0;">Reset your Mrezhen password</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">
            Reset Password
          </a>
        </p>
        <p style="word-break:break-all;font-size:12px;color:#6b7280;">If the button does not work, use this link:<br/>${resetUrl}</p>
        <p style="font-size:12px;color:#6b7280;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })
}

/**
 * Send a notification email when someone submits the /contact form.
 * Goes to the platform admin address (SMTP_USER by default).
 */
export async function sendContactEmail(
  senderName: string,
  senderEmail: string,
  message: string
) {
  const from = process.env.SMTP_FROM || "Mrezhen <no-reply@mrezhen.local>"
  const adminEmail = process.env.SMTP_USER || from
  const transporter = getTransporter()

  await transporter.sendMail({
    from,
    to: adminEmail,
    replyTo: senderEmail,
    subject: `[Mrezhen Contact] New message from ${senderName}`,
    text: `Name: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:560px;margin:0 auto;padding:16px;">
        <h2 style="margin:0 0 12px 0;">New Contact Form Message</h2>
        <p><strong>Name:</strong> ${senderName}</p>
        <p><strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="white-space:pre-wrap;">${message}</p>
      </div>
    `,
  })
}
