// Predefined goal/milestone categories
export const GOAL_CATEGORIES = [
  "health", "career", "education", "finance",
  "fitness", "relationships", "creativity", "personal",
  "travel", "technology", "other",
] as const

export type GoalCategory = (typeof GOAL_CATEGORIES)[number]

// Battle system constants
export const BATTLE_DURATION_DAYS = 7
export const BATTLE_DAILY_QUEST_XP = 50
export const BATTLE_WINNER_MULTIPLIER = 2

export const BATTLE_STATUSES = [
  "PENDING", "ACTIVE", "COMPLETED", "CANCELLED", "DECLINED",
] as const

export type BattleStatusType = (typeof BATTLE_STATUSES)[number]

export const VERIFICATION_STATUSES = [
  "PENDING", "APPROVED", "REJECTED",
] as const

export type VerificationStatusType = (typeof VERIFICATION_STATUSES)[number]
