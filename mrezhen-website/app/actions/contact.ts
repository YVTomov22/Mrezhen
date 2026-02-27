"use server"

import { prisma } from "@/lib/prisma"
import { sendContactEmail } from "@/lib/mailer"

// ─── Simple in-memory rate limiter ──────────────────────────
// In production swap for Redis or an edge rate-limiter.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 * 15 // 15 minutes
const RATE_LIMIT_MAX = 3 // max 3 submissions per window

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// ─── Validation ─────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 5000

// ─── Submit Contact Form ────────────────────────────────────
/**
 * Server action for the /contact form.
 *  - Validates inputs
 *  - Rate-limits by email address (as a proxy for IP in server actions)
 *  - Stores message in the database
 *  - Sends notification email to the platform
 */
export async function submitContactForm(
  _prevState: unknown,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const message = (formData.get("message") as string)?.trim()

  // ─── Validate ────────────────────────────────────────
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { error: "Please provide a valid name (max 100 characters)." }
  }
  if (!email || !EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return { error: "Please provide a valid email address." }
  }
  if (!message || message.length < 10 || message.length > MAX_MESSAGE_LENGTH) {
    return { error: "Message must be between 10 and 5,000 characters." }
  }

  // ─── Rate limit (keyed by sender email) ──────────────
  if (isRateLimited(email)) {
    return { error: "Too many messages. Please try again later." }
  }

  try {
    // ─── Persist to database ─────────────────────────────
    await prisma.contactMessage.create({
      data: { name, email, message },
    })

    // ─── Send notification email (best-effort) ───────────
    try {
      await sendContactEmail(name, email, message)
    } catch {
      // Email delivery failure should not block the form
      console.error("[contact] Email notification failed – message was saved to DB")
    }

    return { success: "Message sent! We'll get back to you soon." }
  } catch {
    return { error: "Something went wrong. Please try again later." }
  }
}
