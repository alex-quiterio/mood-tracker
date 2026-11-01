import { MODULE_IDS, type ModuleId } from './modules';
import { MODULES, isModuleId } from './registry';

/**
 * What the user chose about habit modules, owned by this context rather than by the
 * habits: which modules are switched off for which habit (e.g. one of two sharing a
 * keyword), and each module's own state (e.g. experiments). Habits never reference it.
 */
export type ModulePreferences = {
  /** Per habit id, the modules switched off for it. */
  off: Record<string, ModuleId[]>;
  /** Each module's state, opaque here and parsed by the module itself. */
  state: Partial<Record<ModuleId, unknown>>;
};

export const EMPTY_PREFERENCES: ModulePreferences = { off: {}, state: {} };

/** Stored preferences; anything unknown or invalid is dropped. Never throws. */
export function parseModulePreferences(value: unknown): ModulePreferences {
  if (typeof value !== 'object' || value === null) return EMPTY_PREFERENCES;
  const v = value as { off?: unknown; state?: unknown };
  const off: Record<string, ModuleId[]> = {};
  if (typeof v.off === 'object' && v.off !== null)
    for (const [habitId, ids] of Object.entries(v.off)) {
      const known = Array.isArray(ids) ? MODULE_IDS.filter((id) => ids.includes(id)) : [];
      if (habitId && known.length > 0) off[habitId] = known;
    }
  const state: Partial<Record<ModuleId, unknown>> = {};
  if (typeof v.state === 'object' && v.state !== null)
    for (const [id, s] of Object.entries(v.state)) if (isModuleId(id)) state[id] = MODULES[id].parseState(s);
  return { off, state };
}

/** The modules switched off for a habit. */
export const offFor = (prefs: ModulePreferences, habitId: string): ModuleId[] => prefs.off[habitId] ?? [];

/** Switches a module off or back on for one habit. */
export function switchModule(
  prefs: ModulePreferences,
  habitId: string,
  id: ModuleId,
  on: boolean,
): ModulePreferences {
  const rest = offFor(prefs, habitId).filter((x) => x !== id);
  const next = on ? rest : [...rest, id];
  const off = { ...prefs.off };
  if (next.length > 0) off[habitId] = next;
  else delete off[habitId];
  return { ...prefs, off };
}

/** A module's state, parsed by the module (its empty state when nothing is saved). */
export const stateOf = (prefs: ModulePreferences, id: ModuleId): unknown =>
  MODULES[id].parseState(prefs.state[id]);

export const withState = (prefs: ModulePreferences, id: ModuleId, state: unknown): ModulePreferences => ({
  ...prefs,
  state: { ...prefs.state, [id]: state },
});
