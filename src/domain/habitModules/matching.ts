import type { Habit } from '@domain/habits/habits';
import { URGE_CONTEXTS, type UrgeContext } from '@domain/habits/urges';

import type { HabitModule, ModuleId } from './modules';
import { MODULES } from './registry';

/** Lower case, accents removed, split into words: "Canábis (joints)" → ["canabis", "joints"]. */
export function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** The word, or its plural: "joint" matches "joints", "cannabis" doesn't need to. */
const sameWord = (word: string, keyword: string) =>
  word === keyword || word === `${keyword}s` || word === `${keyword}es`;

/** Whether a keyword (one word or a phrase) appears whole in some text. */
export function containsKeyword(text: string, keyword: string): boolean {
  const haystack = words(text);
  const needle = words(keyword);
  if (needle.length === 0) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (
      needle.every((w, j) => (j === needle.length - 1 ? sameWord(haystack[i + j], w) : haystack[i + j] === w))
    )
      return true;
  }
  return false;
}

/** Each field a habit is known by, matched separately so a phrase never spans two. */
const namesOf = (habit: Habit) => [habit.id, habit.name, ...(habit.tags ?? [])];

/** The first of a module's keywords the habit matches, or null. */
export function matchingKeyword(habit: Habit, module: HabitModule): string | null {
  if (!module.kinds.includes(habit.kind)) return null;
  const names = namesOf(habit);
  return module.keywords.find((k) => names.some((n) => containsKeyword(n, k))) ?? null;
}

export type ModuleMatch = { module: HabitModule; keyword: string; on: boolean };

const ALL = (): readonly HabitModule[] => Object.values(MODULES);

/**
 * Every module whose keywords match the habit, in registry order, with the keyword
 * that matched and whether it's on (not in `off`, the modules switched off for this
 * habit, see `offFor`). Archived habits match too, so their history can still be read.
 */
export function matchModules(
  habit: Habit,
  off: readonly ModuleId[] = [],
  modules: readonly HabitModule[] = ALL(),
): ModuleMatch[] {
  return modules.flatMap((module) => {
    const keyword = matchingKeyword(habit, module);
    return keyword ? [{ module, keyword, on: !off.includes(module.id) }] : [];
  });
}

/** The modules on for a habit. */
export const activeModules = (
  habit: Habit,
  off: readonly ModuleId[] = [],
  modules?: readonly HabitModule[],
): HabitModule[] =>
  matchModules(habit, off, modules)
    .filter((m) => m.on)
    .map((m) => m.module);

/** What the urge flow should also ask for this habit: everything its active modules collect. */
export function urgeContextFor(
  habit: Habit,
  off: readonly ModuleId[] = [],
  modules?: readonly HabitModule[],
): UrgeContext[] {
  const wanted = new Set(activeModules(habit, off, modules).flatMap((m) => m.collects?.urgeContext ?? []));
  return URGE_CONTEXTS.filter((c) => wanted.has(c));
}

/**
 * Keywords claimed by more than one module, after normalising, with the modules that
 * share them. Sharing is allowed (all of them switch on); this makes it visible.
 */
export function keywordCollisions(modules: readonly HabitModule[] = ALL()): Record<string, ModuleId[]> {
  const owners = new Map<string, Set<ModuleId>>();
  for (const m of modules)
    for (const k of m.keywords) {
      const key = words(k).join(' ');
      owners.set(key, (owners.get(key) ?? new Set()).add(m.id));
    }
  return Object.fromEntries([...owners].filter(([, ids]) => ids.size > 1).map(([k, ids]) => [k, [...ids]]));
}
