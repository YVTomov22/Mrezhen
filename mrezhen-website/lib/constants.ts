/**
 * Predefined goal/milestone categories.
 * Shared between server actions, API routes, and client components.
 */
export const GOAL_CATEGORIES = [
  "health", "career", "education", "finance",
  "fitness", "relationships", "creativity", "personal",
  "travel", "technology", "other",
] as const

export type GoalCategory = (typeof GOAL_CATEGORIES)[number]
