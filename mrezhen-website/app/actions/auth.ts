'use server'

import { signIn } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import crypto from "node:crypto"
import { sendPasswordResetEmail } from "@/lib/mailer"

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

function buildResetUrl(token: string) {
    const appUrl = process.env.APP_URL || "http://localhost:3000"
    return `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`
}

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

export async function register(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: "Missing fields" }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
        return { error: "Invalid email format" }
    }

    // Password strength: min 8 chars, must contain uppercase, lowercase, and number
    if (password.length < 8 || password.length > 128) {
        return { error: "Password must be 8-128 characters" }
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return { error: "Password must contain uppercase, lowercase, and a number" }
    }

    // Name length validation
    if (name.length > 100) {
        return { error: "Name is too long" }
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "Unable to create account. Please try a different email." }
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        await signIn("credentials", {
            email,
            password,
            redirectTo: "/community",
        })

        return { success: "User created!" }
    } catch (error) {
        if (error instanceof AuthError) {
             return { error: "Something went wrong during login" }
        }

        // If it's a redirect error (success), re-throw it so Next.js handles it
        throw error
    }
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/community",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        throw error
    }
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const rawEmail = (formData.get("email") as string | null) || ""
    const email = rawEmail.trim().toLowerCase()

    if (!email) {
        return { error: "Email is required" }
    }

    const successMessage = "If an account exists for this email, a reset link has been sent."

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })

        if (!user) {
            return { success: successMessage }
        }

        const plainToken = crypto.randomBytes(32).toString("hex")
        const tokenHash = hashToken(plainToken)
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

        await prisma.$transaction([
            prisma.passwordResetToken.updateMany({
                where: { userId: user.id, usedAt: null },
                data: { usedAt: new Date() },
            }),
            prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt,
                },
            }),
        ])

        await sendPasswordResetEmail(email, buildResetUrl(plainToken))
        return { success: successMessage }
    } catch (error) {
        console.error("requestPasswordReset failed", error)
        return { success: successMessage }
    }
}

export async function resetPassword(prevState: any, formData: FormData) {
    const token = ((formData.get("token") as string | null) || "").trim()
    const password = ((formData.get("password") as string | null) || "").trim()
    const confirmPassword = ((formData.get("confirmPassword") as string | null) || "").trim()

    if (!token) return { error: "Reset token is missing" }
    if (!password || password.length < 8) return { error: "Password must be at least 8 characters" }
    if (password !== confirmPassword) return { error: "Passwords do not match" }

    try {
        const tokenHash = hashToken(token)
        const now = new Date()

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            select: { id: true, userId: true, expiresAt: true, usedAt: true },
        })

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
            return { error: "Invalid or expired reset link" }
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: now },
            }),
            prisma.passwordResetToken.updateMany({
                where: { userId: resetToken.userId, usedAt: null },
                data: { usedAt: now },
            }),
        ])

        return { success: "Password reset successful. You can now sign in." }
    } catch (error) {
        console.error("resetPassword failed", error)
        return { error: "Could not reset password" }
    }
}