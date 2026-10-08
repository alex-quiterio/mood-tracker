This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Project constraints

- Personal Android mood tracker, sideloaded (no Play Store). See README.md for the spec.
- No backend and no API keys. All data stays on the device (AsyncStorage). Claude integration is a plain-text prompt sent through the share sheet.
- Keep dependencies minimal. Navigation is a four-tab horizontal pager (a paging `ScrollView`) in `App.tsx`, swiped or switched from the tab bar; do not add Expo Router or React Navigation unless the screen count grows.
- The Check-in tab is for today only. Past days (the last `EDITABLE_DAYS`) are edited inline in the History calendar.
- Check-in timestamps are shown in the `timeZone` setting (`src/domain/settings/timeZone.ts`): 'system' follows the phone. Entry dates stay local `YYYY-MM-DD`.
- Dates are local `YYYY-MM-DD` (see `src/domain/shared/dates.ts`), never UTC.
- The export file format (`src/domain/checkins/exportFormat.ts`) is versioned; keep old versions importable.
- Pure logic lives in plain `.ts` files and is covered by `npm test` (tests in `src/__tests__/`).
- All user-facing text lives in the presentation layer, one folder per language: `src/ui/foundation/i18n/locales/en/` and `pt/`, each with `messages.ts` (the app's text), `voices.ts` (each voice's words) and `index.ts` combining them (European Portuguese: telemóvel, ecrã, registo, tu). Both catalogues are typed as `Messages` (`src/ui/foundation/i18n/messages.types.ts`), so adding an English string without its Portuguese is a type error, and a test flags Portuguese left identical to English. The domain returns values (a verdict kind, a change in points, a milestone amount) and `ui/foundation/i18n` turns them into words; infrastructure adapters receive translated text as arguments. The UI gets `{ m, locale }` from `useLocale()`. Voices get their words from the locale and their emojis and bursts from `VOICE_STYLES` in `src/ui/foundation/voices/voices.ts` (`voiceFor(id, locale)`); quotes are never translated.
- Progress (`src/domain/progress/xp.ts`) is derived, never stored: XP only goes up, every check-in earns the same whatever the mood, and streaks forgive one missed day a week. Level titles are each voice's words (`levels` in `locales/*/voices.ts`).
- Bank statements (`src/domain/spending/`) are imported, never typed in: only card payments, cash withdrawals and fees count, each placed with the check-in of its part of the day. Real spending sits beside the habits' estimate (doses × price) as neutral numbers, never a verdict. Days a statement doesn't cover show no real spending rather than zero. Statements carry no categories, so real spending only counts toward a habit through merchants the user linked (`merchantHabits` in settings); unlinked spending is one total, never guessed.
- Habit kinds (to grow, to reduce, to balance) are defined once in `KIND_RULES` (`src/domain/habits/habits.ts`): how each is logged, its default points and what makes a day a win. Code that depends on the kind reads that table or uses a `Record<HabitKind, …>` (as the wording in `ui/foundation/i18n/habits.ts` does) rather than `kind === …` chains, so a new kind is a type error wherever it needs handling.
- Habits aim for good feedback loops: lead with wins (zeros, good habits, what you did instead), never let savings go negative, never use red or blame. Habit data only goes into the Claude prompt when `habitsInPrompt` is on.
- Voices are presentation only: never store voice-specific values in entries. Default quotes (`src/domain/voices/quotes.ts`) are verbatim, never from memory, and `QUOTES_LICENSE` says for each voice why they may be used: `public-domain` (translations from 1930 or earlier, with chapter and translator in `source`, or originals first published by 1930, quoted in their own language, like Caeiro's Portuguese) or `short-quotation` (brief lines from copyrighted books, only if Wikiquote lists them as sourced and they match a scan of the book; cite work, year and page).
- `modules/unlock-stats` is a local Expo module (Kotlin, Android only) that counts unlocks from `UsageStatsManager` `KEYGUARD_HIDDEN` events. JS loads it with `requireOptionalNativeModule`, so it must keep working when the module is missing (Expo Go, tests).
- `modules/step-counter` (Kotlin, Android only) reads steps from Google Play services' Recording API on mobile (`play-services-fitness`, `LocalRecordingClient`). Don't use the raw `TYPE_STEP_COUNTER` sensor: it only counts while an app keeps listening, which is why 1.2.0 always saved 0. Unlocks and steps share the window logic in `src/domain/signals/windowedCount.ts`. Same optional-module rule as above.
- `modules/home-widget` (Kotlin, Android only) is the home-screen widget, an `AppWidgetProvider` drawn with `RemoteViews`. It only draws: JS sends the whole state (words, emojis, colours, tap links) as JSON through `homeWidget.update`, built by `homeWidgetState` in `src/ui/features/widget/useHomeWidget.ts`. The state carries this week and next, tomorrow's quote and all three greetings, so the widget's 30-minute update moves on by itself; it shows the week and the quote only when it's tall enough. Taps open the app with a `moodtracker://widget/…` link (`src/domain/checkins/widget.ts`). The Android string resources are only for the widget picker and the first draw. Same optional-module rule as above.

## Project layout

Domain-driven, in three layers. Put new code in the right layer and area; don't add loose files to `src/`. `src/__tests__/architecture.test.ts` enforces the layer rules.

Import across areas with the path aliases `@domain/…`, `@infrastructure/…`, `@ui/…` and `@modules/…` (defined in `tsconfig.json`, mirrored in `jest.moduleNameMapper` in `package.json`; Metro reads tsconfig paths automatically). Use `./` only for files in the same folder; never `../`.

```
App.tsx                      composition root: providers, the four tabs, name prompt
modules/                     local native modules (Kotlin): unlock-stats, step-counter, home-widget
src/
  domain/                    the model and its rules; returns values, never sentences.
                             No React, React Native, Expo, storage, UI or i18n imports.
    checkins/                Entry, Mood, Slot; entries, stats, calendar, celebration rules, export format, migrations
    habits/                  habits, check-in habit logs, balance points and verdicts, savings, weekly insights
    signals/                 counting a signal over a check-in window
    voices/                  voice ids, default quotes and their licences, quote-of-the-day rules
    reminders/               reminder time windows
    practice/                breathing patterns and focus sessions
    progress/                XP and levels, worked out from saved check-ins and urges
    settings/                Settings model and parsing, theme modes, the language choice
    spending/                payments read from a bank statement (Revolut CSV), real spending vs the habits' estimate, merchants linked to habits
    shared/                  local dates, ids, maths
  infrastructure/            adapters to the outside world; never imports ui/. Text arrives already translated.
    storage/                 AsyncStorage repositories: entries (with migrations), settings, checkpoints
    signals/                 unlocks and steps: native modules + checkpoints wired into the domain counter
    notifications/           reminders, the practice bell, the notification handler
    backup/                  writing and reading export files
    spending/                picking a bank statement file
  ui/                        presentation, in tiers; each imports only the tiers above it in this list
    foundation/              used by everything
      i18n/                  the Messages type (messages.types.ts), one folder per language in locales/ (messages, voices), formatting, and formatters from domain values to words
      voices/                the Voice types (voices.types.ts), each voice's emojis and bursts, voiceFor()
      theme/                 palettes, per-voice tones, fonts (fonts.ts), radii and type scale, motion tokens (motion.ts), theme and voice contexts
    kit/                     plain reusable components that know no feature: Text and TextInput (always use these, never React Native's: they apply the fonts), Button, Card, Chip, RoundButton, Stepper, TabBar, PairedBarChart, and the motion pieces Appear, Pop, PressableScale
    state/                   app-wide state hooks: entries, settings
    features/                one folder per feature, with its own components and hooks:
                             checkin, history, habits, practice, progress, reflection (the Claude prompt),
                             lock, widget, spending (real vs estimated), settings (the settings sections, name prompt, auto backup)
    screens/                 one file per tab, composing features
  __tests__/                 Jest tests
```

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
