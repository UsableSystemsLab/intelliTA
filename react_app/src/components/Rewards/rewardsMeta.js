// Shared presentation helpers for ledger event types and badge tiers.
// Used by the post-submit modal, points history, and badge cards.

export const EVENT_LABELS = {
  BASE: "Base completion",
  NO_HINT_BONUS: "No-hint bonus",
  HINT_PENALTY: "Hint penalty",
  STREAK_BONUS: "Streak bonus",
  BUG_HUNTER_AWARD: "Bug Hunter",
};

export function eventLabel(eventType) {
  return EVENT_LABELS[eventType] || eventType;
}

// Border / text accent per badge tier.
const TIER = {
  BRONZE: { ring: "border-amber-700/60", text: "text-amber-500", glow: "shadow-amber-900/30" },
  SILVER: { ring: "border-gray-400/60", text: "text-gray-300", glow: "shadow-gray-500/20" },
  GOLD: { ring: "border-yellow-500/60", text: "text-yellow-400", glow: "shadow-yellow-700/30" },
};

export function tierClasses(tier) {
  return TIER[tier] || TIER.BRONZE;
}
