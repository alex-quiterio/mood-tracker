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
- Dates are local `YYYY-MM-DD` (see `src/data/dates.ts`), never UTC.
- The export file format (`src/data/backup.ts`) is versioned; keep old versions importable.
- Pure logic lives in plain `.ts` files and is covered by `npm test` (tests in `src/__tests__/`).
- Voices (`src/voices/voices.ts`) are presentation only: never store voice-specific values in entries. Default quotes (`src/voices/quotes.ts`) must be verbatim from public-domain translations, with chapter and translator in `source`; never add quotes from memory.
- `modules/unlock-stats` is a local Expo module (Kotlin, Android only) that counts unlocks from `UsageStatsManager` `KEYGUARD_HIDDEN` events. JS loads it with `requireOptionalNativeModule`, so it must keep working when the module is missing (Expo Go, tests).
- `modules/step-counter` (Kotlin, Android only) reads steps from Google Play services' Recording API on mobile (`play-services-fitness`, `LocalRecordingClient`). Don't use the raw `TYPE_STEP_COUNTER` sensor: it only counts while an app keeps listening, which is why 1.2.0 always saved 0. Unlocks and steps share the window logic in `src/signals/windowedCount.ts`. Same optional-module rule as above.

## Project layout

Put new code in the folder for its area; don't add loose files to `src/`.

```
App.tsx               tabs, providers, name prompt
modules/              local native modules (Kotlin): unlock-stats, step-counter
src/
  data/               entries, dates, stats, storage + migrations, backup format
  signals/            phone signals counted per check-in window (unlocks, steps)
  voices/             voices, their default quotes, the Claude reflection prompt
  theme/              palettes, per-voice tones, theme context
  reminders/          notification scheduling and reminder time windows
  checkin/            greeting, streak and save-moment logic
  hooks/              React state hooks (entries, settings, live previews)
  components/         reusable UI
  screens/            one file per tab; settings sections in screens/settings/
  __tests__/          Jest tests for the pure logic
```

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
