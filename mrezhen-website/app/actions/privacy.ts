"use server"

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/* Update a single privacy toggle */
export async function updatePrivacyToggle(
  field: string,
  value: boolean
) {
  const ALLOWED_BOOL = [
    "isPrivate",
    "allowResharing",
    "findableByEmail",
    "findableByPhone",
    "searchEngineIndexing",
  ] as const

  if (!(ALLOWED_BOOL as readonly string[]).includes(field)) {
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

/* Update a "who can …" select */
export async function updatePrivacySelect(
  field: string,
  value: string
) {
  const ALLOWED_SELECT = [
    "whoCanSeePosts",
    "whoCanSeeFollowers",
    "whoCanComment",
    "whoCanRemix",
    "whoCanTagMe",
    "whoCanMessage",
  ] as const

  const VALID_VALUES = ["everyone", "followers", "nobody"]

  if (!(ALLOWED_SELECT as readonly string[]).includes(field)) {
    return { error: "Invalid field" }
  }
  if (!VALID_VALUES.includes(value)) {
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

/* Update story hidden list / close friends */
export async function updatePrivacyList(
  field: "hiddenFromStory" | "closeFriends",
  userIds: string[]
) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Not authenticated" }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { [field]: userIds },
    })
    revalidatePath("/settings")
    return { success: "Updated" }
  } catch {
    return { error: "Could not update list" }
  }
}
