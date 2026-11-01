# Habit modules

Insight modules switch on by themselves for habits whose **id, name or "also called" tags** match one of their keywords. The core app records observations (moods, doses, urges, sleep, steps). A module reads them and says what they mean for that kind of habit.

This folder is a bounded context of its own:

- **It reads the core and never writes to it.** Habits don't know modules exist. Nothing here is stored on a habit, an entry or an urge.
- **It owns its preferences.** Which modules are switched off per habit, and each module's saved state, live in the `habitModules` setting (`preferences.ts`). They travel in backups with the other portable settings.
- **The domain returns values, never sentences.** Words come from `src/ui/foundation/i18n`. Charts come from `src/ui/features/habitModules`.

```
src/domain/habitModules/
  modules.ts          MODULE_IDS, the HabitModule contract, data sources, capabilities, ModuleInput
  registry.ts         MODULES: Record<ModuleId, HabitModule>
  matching.ts         keyword matching, matchModules / activeModules, urgeContextFor, keywordCollisions
  availability.ts     which data sources a habit has; what a module is missing
  preferences.ts      modules off per habit, each module's state
  <module>/           one folder per module: its definition, analysis and any saved state
src/domain/shared/statistics.ts      intervals, comparisons, correlation; reuse them
src/ui/features/habitModules/
  registry.ts         MODULE_VIEWS: Record<ModuleId, Component>, ModuleViewProps
  HabitModulesModal   the host: name, tagline, missing data, then the module's view
  <module>/           each module's view
```

## How a module switches on

`matchingKeyword(habit, module)` compares each keyword with the habit's id, name and each tag separately:

- **Case and accents don't matter:** "Café" matches `cafe`.
- **Whole words only:** `walk` doesn't match "sidewalk" or "walkway".
- **Plurals match:** `walk` matches "walks". Keywords of several words match as a phrase.
- **The habit's kind must be in `module.kinds`.**
- **Archived habits still match**, so their history can be read.

Several modules may match the same habit, and all of them switch on. The user can switch any of them off for one habit in Settings → Habits. A keyword shared by two modules is allowed but must be deliberate: `keywordCollisions()` lists them, and a test in `src/__tests__/habitModules.test.ts` pins that list.

## Adding a module

Say you're adding `sleep-debt` for a habit like "Late nights".

1. **Register the id.** Add `'sleep-debt'` to `MODULE_IDS` in `modules.ts`. From here the compiler lists every place still missing a piece.

2. **Write the definition** in `sleepDebt/definition.ts`:

   ```ts
   export const SLEEP_DEBT: HabitModule = {
     id: 'sleep-debt',
     keywords: ['late night', 'staying up', 'noitada'],
     kinds: ['reduce', 'balance'],
     data: { required: ['doses'], optional: ['sleep', 'moods'] },
     capabilities: ['beforeAfter'],
     parseState: () => ({}), // or a parser for your own saved state; must never throw
   };
   ```

   - **`data.required`:** without these, the host shows "This fills in once there are…" instead of your view.
   - **`data.optional`:** the host shows "Gets sharper with…" when any are missing. Your view must still work without them.
   - **`capabilities`:** pick from `MODULE_CAPABILITIES`, or add a new one there (with its words in both locales).
   - **`collects.urgeContext`:** optional. These are extra chips the urge flow asks for, only for habits this module is on for.
   - **`parseState`:** reads whatever was saved under your id and falls back to an empty state. Never trust stored data.

3. **List it** in `MODULES` in `registry.ts`.

4. **Write the analysis** as pure functions in your folder, taking a `ModuleInput` (`{ habit, entries, urges, today }`):
   - **Return values:** numbers, keys and `Interval` / `Comparison` / `Rate` / `Correlation` from `@domain/shared/statistics`. Never sentences.
   - **Let each part degrade on its own** (null or empty) when its data is missing.
   - **Show uncertainty:** any comparison carries its interval, n and `Evidence` (`tooFew`, `unclear`, `clear`), so the screen never overstates a few days of data.

5. **Test it** in `src/__tests__/`, with fixed dates and hand-checked numbers.

6. **Give it a view** in `src/ui/features/habitModules/sleepDebt/` and register it in `MODULE_VIEWS`. The view receives `{ input, state, onStateChange }` and nothing else: no app state, no storage. Parse `state` with your own `parseState` and send changes through `onStateChange`.
   - **One section at a time:** split anything long into sections with `Segmented`, overview first. The habit screens are already full.
   - **Use the kit's charts:** `IntervalChart`, `Heatmap`, `ScatterPlot`, `BarChart`, `PairedBarChart`. Give every chart an accessibility label, and write each number next to its mark so colour is never the only cue.
   - **Lead with wins.** Never use red or blame.

7. **Add its words** in `src/ui/foundation/i18n`:
   - **The frame:** `modules.names` and `modules.taglines` for your id.
   - **Your own section** in `messages.types.ts`, in both `locales/en/messages.ts` and `locales/pt/messages.ts` (European Portuguese: tu, ecrã, registo).
   - **Formatters:** turn your domain values into words in `i18n/habitModules.ts`.

8. **Run the checks:** `npx tsc --noEmit`, `npx expo lint` and `npm test`. The architecture test checks the layers, and the i18n test flags Portuguese left identical to English.

## A worked example

The modules already in `MODULES` are complete examples to copy from: definition, analysis with intervals, saved state with a parser, tests, a view in sections and words in both locales.
