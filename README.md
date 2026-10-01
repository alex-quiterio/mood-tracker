# Mood Tracker

A personal Android app that records your mood three times a day, shows weekly statistics, and lets Claude reflect on the week. No backend, no API keys, no cost beyond an existing Claude subscription.

Built with Expo (SDK 57), React Native and TypeScript. Sideloaded; not on the Play Store.

## Features

- **Check-in**: today's three slots (morning before 12:00, afternoon before 18:00, evening after). The slot for the current time opens by default. Pick a mood from 1–5 and optionally add a note. A day strip lets you fill in or edit any of the last 7 days.
- **This week**: mood per slot per day for the last 7 days, the average per slot, the overall average, and how many of the 21 possible check-ins you logged.
- **Reflect with Claude**: builds a plain-text prompt with the week's entries and asks for patterns plus one small suggestion. It opens Android's share sheet so you can send it to the Claude app.
- **Reminders**: optional local notifications at 09:00, 14:00 and 20:00.
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

Build an APK in the cloud with EAS (free tier), then download it on the phone and install it (allow "install unknown apps" for your browser):

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Or build locally with Android Studio installed: `npx expo run:android --variant release`.

## Out of scope for v1

Play Store release, accounts, sync across devices, in-app Claude responses, tags, monthly trends.
