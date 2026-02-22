'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Difficulty } from "@/lib/generated/prisma/enums"
import { resolveQuestDeadline } from "@/lib/deadline"

// --- MILESTONES ---
export async function createMilestone(title: string, description: string, category?: string, dueDate?: Date | null) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }
  const milestone = await prisma.milestone.create({
    data: {
      title,
      description,
      category: category?.toLowerCase().trim() || null,
      dueDate: dueDate ?? null,
      user: { connect: { email: session.user.email } },
    }
  })
  revalidatePath("/dashboard")
  revalidatePath("/goals")
  return { success: true, data: milestone }
}

export async function updateMilestone(id: string, title: string, description: string, category?: string, dueDate?: Date | null) {
  await prisma.milestone.update({
    where: { id },
    data: { title, description, category: category?.toLowerCase().trim() || null, dueDate: dueDate ?? null },
  })
  revalidatePath("/dashboard")
  revalidatePath("/goals")
}

/**
 * Server-side milestone filtering by category.
 * Supports case-insensitive, single or multiple categories.
 */
export async function getFilteredMilestones(categories?: string[]) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized", data: [] }

  const where: Record<string, unknown> = {
    user: { email: session.user.email },
  }

  if (categories && categories.length > 0) {
    const cleaned = categories.map(c => c.toLowerCase().trim()).filter(Boolean)
    if (cleaned.length === 1) {
      where.category = { equals: cleaned[0], mode: "insensitive" }
    } else if (cleaned.length > 1) {
      where.category = { in: cleaned, mode: "insensitive" }
    }
  }

  const milestones = await prisma.milestone.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      quests: {
        orderBy: { createdAt: "desc" },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
      },
    },
  })

  return { data: milestones }
}

export async function deleteMilestone(id: string) {
  await prisma.milestone.delete({ where: { id } })
  revalidatePath("/dashboard")
}

// --- QUESTS ---
export async function createQuest(
  milestoneId: string, 
  title: string, 
  description: string,
  difficulty: Difficulty, 
  tasks: string[] = [],
  deadline?: Date | null,
) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }
  
  let completionPoints = 50
  if (difficulty === 'EASY') completionPoints = 20
  if (difficulty === 'HARD') completionPoints = 100
  if (difficulty === 'EPIC') completionPoints = 500

  // Fetch the parent milestone's dueDate for deadline resolution
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { dueDate: true },
  })

  const createdAt = new Date()
  const resolvedDeadline = resolveQuestDeadline({
    explicit: deadline,
    milestoneDueDate: milestone?.dueDate ?? null,
    createdAt,
  })

  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      difficulty,
      completionPoints,
      status: "IN_PROGRESS",
      deadline: resolvedDeadline,
      milestone: { connect: { id: milestoneId } },
      user: { connect: { email: session.user.email } },
      tasks: {
        create: tasks.map(t => ({ content: t, points: 10 }))
      }
    }
  })
  revalidatePath("/dashboard")
  return { success: true, data: quest }
}

export async function updateQuest(
  id: string, 
  title: string, 
  description: string, // <--- ADDED
  difficulty: Difficulty
) {
  await prisma.quest.update({ 
    where: { id }, 
    data: { title, description, difficulty } // <--- ADDED description
  })
  revalidatePath("/dashboard")
}

export async function deleteQuest(id: string) {
  await prisma.quest.delete({ where: { id } })
  revalidatePath("/dashboard")
}

// --- TASKS ---
export async function createTask(questId: string, content: string) {
  await prisma.task.create({
    data: { content, points: 10, quest: { connect: { id: questId } } }
  })
  revalidatePath("/dashboard")
}

export async function updateTask(id: string, content: string) {
  await prisma.task.update({ where: { id }, data: { content } })
  revalidatePath("/dashboard")
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } })
  revalidatePath("/dashboard")
}

export async function toggleTask(taskId: string, isCompleted: boolean) {
  await prisma.task.update({ where: { id: taskId }, data: { isCompleted } })
  revalidatePath("/dashboard")
}

export async function completeTaskAndAwardXP(taskId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { quest: true } // Include quest to check permissions if needed
  })

  if (!task) return { error: "Task not found" }
  if (task.isCompleted) return { success: true, message: "Already completed" }

  const pointsToAward = task.points || 10 // Default to 10 if null

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark task as completed
      await tx.task.update({
        where: { id: taskId },
        data: { isCompleted: true }
      })

      // 2. Update User Score immediately
      const user = await tx.user.findUnique({
        where: { email: session.user!.email! }
      })

      if (user) {
        const newScore = user.score + pointsToAward
        const newLevel = Math.floor(newScore / 1000) + 1

        await tx.user.update({
          where: { email: session.user!.email! },
          data: {
            score: newScore,
            level: newLevel,
            activityLogs: {
              create: {
                action: "TASK_COMPLETE",
                xpGained: pointsToAward
              }
            }
          }
        })
      }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to complete task:", error)
    return { error: "Failed to update progress" }
  }
}

export async function completeQuest(questId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { tasks: true }
  })

  if (!quest) return { error: "Quest not found" }
  if (quest.status === "COMPLETED") return { error: "Already completed" }

  const allTasksDone = quest.tasks.every(t => t.isCompleted)
  if (!allTasksDone) return { error: "Complete all tasks first" }

  // CHANGE: We now only award the 'completionPoints' (the bonus),
  // because the task points were already awarded in completeTaskAndAwardXP
  const totalPoints = quest.completionPoints 

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quest.update({
        where: { id: questId },
        data: { status: "COMPLETED" }
      })

      const user = await tx.user.findUnique({
        where: { email: session.user!.email! }
      })

      if (!user) throw new Error("User not found")

      const newScore = user.score + totalPoints
      const newLevel = Math.floor(newScore / 1000) + 1

      await tx.user.update({
        where: { email: session.user!.email! },
        data: {
          score: newScore,
          level: newLevel,
          activityLogs: {
            create: {
              action: "QUEST_COMPLETE",
              xpGained: totalPoints
            }
          }
        }
      })
    })

    revalidatePath("/dashboard")
    return { success: true, pointsGained: totalPoints }
  } catch (error) {
    return { error: "Failed to complete quest" }
  }
}