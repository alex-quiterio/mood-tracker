# Mood Tracker

A personal Android app that records your mood three times a day, shows weekly statistics, and lets Claude reflect on the week. No backend, no API keys, no cost beyond an existing Claude subscription.

Built with Expo (SDK 57), React Native and TypeScript. Sideloaded; not on the Play Store.

## Features

- **Check-in**: today's three slots (morning before 12:00, afternoon before 18:00, evening after). The slot for the current time opens by default. Pick a mood from 1–5 and optionally add a note. A day strip lets you fill in or edit any of the last 7 days.
- **This week**: mood per slot per day for the last 7 days, the average per slot, the overall average, and how many of the 21 possible check-ins you logged.
- **Reflect with Claude**: builds a plain-text prompt with the week's entries and asks for patterns plus one small suggestion. It opens Android's share sheet so you can send it to the Claude app.
- **Reminders**: optional local notifications at 09:00, 14:00 and 20:00.
- **Theme**: Light, Dim or Dark, chosen in Settings.
- **Backup**: export all entries as a JSON file through the share sheet (save to Drive, email it, etc.) and import it on a new phone. Importing merges and keeps the newer entry for each date and slot.

## Data model

One entry per date and slot; saving the same date and slot again replaces it.

| field        | type                                   |
| ------------ | -------------------------------------- |
| `date`       | local date, `YYYY-MM-DD` (never UTC)   |
| `slot`       | `morning` \| `afternoon` \| `evening`  |
| `mood`       | 1–5                                    |
| `note`       | optional, up to 280 characters         |
| `recordedAt` | ISO timestamp                          |

Everything is stored on the device in AsyncStorage. **Uninstalling the app deletes your data**, so export a backup now and then.

## Development

```bash
npm install
npx expo start          # open in Expo Go on your phone, or press "a" for an emulator
npm test                # unit tests for dates, stats, prompt and export format
npm run typecheck
npm run lint
```

## Installing on your phone

The **Android APK** GitHub Action runs typecheck, lint and tests on every push. It only builds the APK when you publish a GitHub release, and then attaches the APK to that release.

To release:

1. Bump `expo.version` in `app.json` (and `expo.android.versionCode`) and push. The release tag must be `v` plus that version, or the build stops right away.
2. Publish a release: `gh release create v1.0.2 --generate-notes`, or use **Releases → Draft a new release** on GitHub.
3. After about 7 minutes, `mood-tracker-1.0.2.apk` appears on the release. Open it on your phone and allow "install unknown apps" when asked.

New builds install over old ones and keep your data, as long as the signing key stays the same. By default the APK uses the Expo template's debug key, which is fine for personal sideloading. For your own key, add these repo secrets and the workflow signs with it:

- `ANDROID_KEYSTORE_BASE64`: `base64 -i release.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`

Switching keys means uninstalling first, which deletes your data. Export a backup before you switch.

To build locally instead you need Android Studio: `npx expo run:android --variant release`.

## Out of scope for v1

Play Store release, accounts, sync across devices, in-app Claude responses, tags, monthly trends.
