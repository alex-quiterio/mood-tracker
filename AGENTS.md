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
- Keep dependencies minimal. Navigation is a three-tab state switch in `App.tsx`; do not add Expo Router or React Navigation unless the screen count grows.
- Dates are local `YYYY-MM-DD` (see `src/domain/shared/dates.ts`), never UTC.
- The export file format (`src/domain/checkins/exportFormat.ts`) is versioned; keep old versions importable.
- Pure logic lives in plain `.ts` files and is covered by `npm test` (tests in `src/__tests__/`).
- All user-facing text lives in the presentation layer: `src/ui/i18n/locales/en.ts` and `pt.ts` (European Portuguese: telemóvel, ecrã, registo, tu). `pt` is typed as `Messages`, so adding an English string without its Portuguese is a type error, and a test flags Portuguese left identical to English. The domain returns values (a verdict kind, a change in points, a milestone amount) and `ui/i18n` turns them into words; infrastructure adapters receive translated text as arguments. The UI gets `{ m, locale }` from `useLocale()`. Voices' wording is in `src/ui/voices/` (English and `voices.pt.ts`); quotes are never translated.
- Habits aim for good feedback loops: lead with wins (zeros, good habits, what you did instead), never let savings go negative, never use red or blame. Habit data only goes into the Claude prompt when `habitsInPrompt` is on.
- Voices are presentation only: never store voice-specific values in entries. Default quotes (`src/domain/voices/quotes.ts`) are verbatim, never from memory, and `QUOTES_LICENSE` says for each voice why they may be used: `public-domain` (translations from 1930 or earlier, with chapter and translator in `source`) or `short-quotation` (brief lines from copyrighted books, only if Wikiquote lists them as sourced and they match a scan of the book; cite work, year and page).
- `modules/unlock-stats` is a local Expo module (Kotlin, Android only) that counts unlocks from `UsageStatsManager` `KEYGUARD_HIDDEN` events. JS loads it with `requireOptionalNativeModule`, so it must keep working when the module is missing (Expo Go, tests).
- `modules/step-counter` (Kotlin, Android only) reads steps from Google Play services' Recording API on mobile (`play-services-fitness`, `LocalRecordingClient`). Don't use the raw `TYPE_STEP_COUNTER` sensor: it only counts while an app keeps listening, which is why 1.2.0 always saved 0. Unlocks and steps share the window logic in `src/domain/signals/windowedCount.ts`. Same optional-module rule as above.

## Project layout

Domain-driven, in three layers. Put new code in the right layer and area; don't add loose files to `src/`. `src/__tests__/architecture.test.ts` enforces the layer rules.

Import across areas with the path aliases `@domain/…`, `@infrastructure/…`, `@ui/…` and `@modules/…` (defined in `tsconfig.json`, mirrored in `jest.moduleNameMapper` in `package.json`; Metro reads tsconfig paths automatically). Use `./` only for files in the same folder; never `../`.

```
App.tsx                      composition root: providers, tabs, name prompt
modules/                     local native modules (Kotlin): unlock-stats, step-counter
src/
  domain/                    the model and its rules; returns values, never sentences.
                             No React, React Native, Expo, storage, UI or i18n imports.
    checkins/                Entry, Mood, Slot; entries, stats, calendar, celebration rules, export format, migrations
    habits/                  habits, check-in habit logs, balance points and verdicts, savings, weekly insights
    signals/                 counting a signal over a check-in window
    voices/                  voice ids, default quotes and their licences, quote-of-the-day rules
    reminders/               reminder time windows
    practice/                breathing patterns and focus sessions
    settings/                Settings model and parsing, theme modes, the language choice
    shared/                  local dates, ids, maths
  infrastructure/            adapters to the outside world; never imports ui/. Text arrives already translated.
    storage/                 AsyncStorage repositories: entries (with migrations), settings, checkpoints
    signals/                 unlocks and steps: native modules + checkpoints wired into the domain counter
    notifications/           reminders, the practice bell, the notification handler
    backup/                  writing and reading export files
  ui/                        presentation
    i18n/                    catalogues (locales/en.ts, locales/pt.ts), formatting, and formatters from domain values to words
    voices/                  each voice's wording (English and voices.pt.ts), emojis and save bursts
    reflection/              the Claude prompt, a document written in the user's language
    theme/                   palettes, per-voice tones, theme and voice contexts
    hooks/                   state hooks (entries, settings, live previews)
    components/              reusable UI: Card, Chip, RoundButton, Stepper, Button, …
    checkin/ habits/ practice/  feature views
    screens/                 one file per tab; settings sections in screens/settings/
  __tests__/                 Jest tests
```

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
