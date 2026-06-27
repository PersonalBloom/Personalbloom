import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function getStreakEmoji(streak: number) {
  if (streak >= 30) return '👑'
  if (streak >= 14) return '🔥'
  if (streak >= 7)  return '⚡'
  if (streak >= 3)  return '✨'
  return '🌱'
}

export function xpForLevel(level: number) {
  return level * 100
}

export function levelFromXP(xp: number) {
  return Math.floor(xp / 100)
}
