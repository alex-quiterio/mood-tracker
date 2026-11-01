import { DATA_SOURCES, type DataSource, type HabitModule, type ModuleInput } from './modules';

/** Which observations exist for this habit, so a module can say what it's missing instead of failing. */
export function availableData({ habit, entries, urges }: ModuleInput): Record<DataSource, boolean> {
  const own = urges.filter((u) => u.habitId === habit.id);
  const present: Record<DataSource, () => boolean> = {
    doses: () => entries.some((e) => e.habits?.doses[habit.id] !== undefined),
    moods: () => entries.length > 0,
    urges: () => own.length > 0,
    feelings: () => own.some((u) => (u.feelings?.length ?? 0) > 0),
    context: () => own.some((u) => (u.context?.length ?? 0) > 0),
    sleep: () => entries.some((e) => e.sleep?.hours !== undefined),
    steps: () => entries.some((e) => e.steps !== undefined),
  };
  return Object.fromEntries(DATA_SOURCES.map((s) => [s, present[s]()])) as Record<DataSource, boolean>;
}

export type MissingData = { required: DataSource[]; optional: DataSource[] };

/** The module's data sources that have nothing yet. With any required ones missing, it can't run. */
export function missingData(module: HabitModule, input: ModuleInput): MissingData {
  const have = availableData(input);
  return {
    required: module.data.required.filter((s) => !have[s]),
    optional: module.data.optional.filter((s) => !have[s]),
  };
}
