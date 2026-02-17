"use server"

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/* ── Update a boolean appearance preference ────────────────── */
export async function updateAppearanceToggle(
  field: string,
  value: boolean
) {
  const ALLOWED = [
    "dataSaver",
    "autoplayVideos",
    "reduceMotion",
    "highContrast",
    "screenReader",
  ] as const

  if (!(ALLOWED as readonly string[]).includes(field)) {
    return { error: "Invalid field" }
  }

  const session = await auth()
  if (!session?.user?.email) return { error: "Not authenticated" }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { [field]: value },
    })
    revalidatePath("/settings")
    return { success: "Updated" }
  } catch {
    return { error: "Could not update setting" }
  }
}

/* ── Update a string appearance preference ─────────────────── */
export async function updateAppearanceSelect(
  field: string,
  value: string
) {
  const ALLOWED: Record<string, string[]> = {
    theme: ["light", "dark", "system"],
    language: [
      "en", "es", "fr", "de", "pt", "it", "nl", "ru", "zh", "ja",
      "ko", "ar", "hi", "tr", "pl", "sv", "da", "fi", "no",
    ],
    fontSize: ["small", "medium", "large", "xlarge"],
  }

  if (!ALLOWED[field]) {
    return { error: "Invalid field" }
  }
  if (!ALLOWED[field].includes(value)) {
    return { error: "Invalid value" }
  }

  const session = await auth()
  if (!session?.user?.email) return { error: "Not authenticated" }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { [field]: value },
    })
    revalidatePath("/settings")
    return { success: "Updated" }
  } catch {
    return { error: "Could not update setting" }
  }
}
