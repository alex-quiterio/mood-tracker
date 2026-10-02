<p align="center"><img src="assets/icon.png" alt="Mood Tracker icon" width="128" /></p>

# Mood Tracker

A personal Android app for logging your mood three times a day, growing good habits, and reflecting on your week with Claude. No backend, no API keys; everything stays on the phone. Expo (SDK 57), React Native, TypeScript. English and European Portuguese.

## Features

- **Check-ins**: morning, afternoon and evening; mood 1–5 plus a note. The last 7 days are editable.
- **Sleep**: the morning check-in asks how you slept and for how long (in half hours). It's always part of the Claude reflection.
- **Habits**: doses of what you want less of (🚬 🌿 🍺, "≈ roughly" for estimates), good habits to tick (💧 🚶 🤝 🛠️), and what you did instead.
- **Balance and savings**: light vs heavy points per week, and money kept compared with your usual amount (Dutch prices by default).
- **This week and history**: weekly table and averages, plus a 6-month calendar.
- **Reflect with Claude**: shares a summary of the week to the Claude app. Habits are included only if you switch that on.
- **Voices**: 13 voices (Lao Tzu, Marcus Aurelius, Rumi, Buddha…) change the wording, emojis, colours and Claude prompt, and show a sourced quote of the day.
- **Pause**: counted breathing, or a focus timer that ends with a bell.
- **Optional**: reminders, phone unlock counts (needs Usage access), and steps (needs Physical activity).
- **App lock** (optional): fingerprint, face or phone PIN on opening and after a minute away. The app is hidden in recent apps while it's on.
- **Backup**: choose a folder on the phone once, then "Back up now" saves a dated JSON file there, and the weekly automatic backup saves one when you open the app and the last is a week old. Old backups are kept. You can still export through the share sheet or import a file. Uninstalling deletes the app's data but not the folder.

## Development

```bash
npm install
npx expo start      # Expo Go; unlocks and steps need a real build
npm test
npm run typecheck
npm run lint
npm run format
```

Code is organised in three layers, `domain/`, `infrastructure/` and `ui/`, imported via `@domain/…`, `@infrastructure/…`, `@ui/…` and `@modules/…`. Text lives in `src/ui/i18n/locales/{en,pt}`. See [AGENTS.md](AGENTS.md) for the conventions.

## Releasing

1. Bump `expo.version` and `expo.android.versionCode` in `app.json`, then push.
2. Run `gh release create v<version> --generate-notes`.
3. After about 5 minutes, the APK appears on the release. Install it on the phone and allow "install unknown apps".

CI runs the checks on every push and builds the APK only for releases. Updates keep your data as long as the signing key stays the same. To use your own key, set the `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_ALIAS` secrets.
