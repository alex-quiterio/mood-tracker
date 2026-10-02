import { streakHistory } from '@domain/checkins/stats';
import { Entry, SLOTS } from '@domain/checkins/types';
import { isWin } from '@domain/habits/habits';
import { Urge } from '@domain/habits/urges';

/**
 * Experience points, worked out from what's already saved: nothing extra is stored,
 * and a backup carries progress with it. XP only goes up. Every check-in earns the
 * same whatever the mood, so an honest low day counts as much as a good one.
 */
export const XP = {
  checkIn: 10,
  note: 5,
  fullDay: 10,
  win: 5,
  urgePassed: 15,
  streakWeek: 25,
} as const;

export type XpSource = keyof typeof XP;

/** How many times each source earned XP. */
export type XpCounts = Record<XpSource, number>;

export function xpCounts(entries: Entry[], urges: Urge[], today: string): XpCounts {
  const slotsByDay = new Map<string, number>();
  for (const e of entries) slotsByDay.set(e.date, (slotsByDay.get(e.date) ?? 0) + 1);
  return {
    checkIn: entries.length,
    note: entries.filter((e) => e.note).length,
    fullDay: [...slotsByDay.values()].filter((n) => n >= SLOTS.length).length,
    win: entries.filter((e) => isWin(e.habits)).length,
    urgePassed: urges.filter((u) => u.outcome === 'passed').length,
    streakWeek: streakHistory(entries, today).weeks,
  };
}

export const totalXp = (counts: XpCounts): number =>
  (Object.keys(XP) as XpSource[]).reduce((sum, source) => sum + counts[source] * XP[source], 0);

/** XP needed to reach a level: 0, 100, 300, 600, 1000… each level asks a little more. */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export type Level = {
  level: number;
  xp: number;
  /** XP gained since reaching this level, and how much the next one needs from here. */
  intoLevel: number;
  levelSize: number;
};

export function levelFor(xp: number): Level {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const start = xpForLevel(level);
  return { level, xp, intoLevel: xp - start, levelSize: xpForLevel(level + 1) - start };
}

/** Each title covers two levels; past the last one, the last title stays. */
export const LEVELS_PER_TITLE = 2;
export const titleIndex = (level: number, titles: number): number =>
  Math.min(Math.floor((level - 1) / LEVELS_PER_TITLE), titles - 1);
