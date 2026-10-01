# Mood Tracker

A personal Android app that records your mood three times a day, shows weekly statistics, and lets Claude reflect on the week. No backend, no API keys, no cost beyond an existing Claude subscription.

Built with Expo (SDK 57), React Native and TypeScript. Sideloaded; not on the Play Store.

## Features

- **Check-in**: today's three slots (morning before 12:00, afternoon before 18:00, evening after). The slot for the current time opens by default. Pick a mood from 1–5 and optionally add a note. A day strip lets you fill in or edit any of the last 7 days.
- **Your name**: asked once (skip it and it asks again next launch), then used in greetings and reminders. Change it in Settings.
- **This week**: mood per slot per day for the last 7 days, the average per slot, the overall average, and how many of the 21 possible check-ins you logged.
- **History**: a month calendar going back six months, each day tinted by its average mood. Tap a day to see its check-ins. Days from the last week can be opened for editing; older days are read-only.
- **Reflect with Claude**: builds a plain-text prompt with the week's entries and asks for patterns plus one small suggestion. Habits are only included if you turn that on. It opens Android's share sheet so you can send it to the Claude app.
- **Reminders**: optional daily notifications, one per slot, each adjustable in 15-minute steps within its window: morning 06:00–09:00, afternoon 12:00–15:00, evening 17:00–22:00.
- **Voices**: Plain, Lao Tzu, Marcus Aurelius, Seneca, Rumi, Kabir, Patanjali, Audre Lorde, Fritjof Capra, Jesus, Muhammad, Buddha or Shiva. A voice changes the mood names and emojis, the slot names, the question in the note field (Marcus asks for his evening review; Lao Tzu asks what you can leave undone), the small messages, and how the Claude prompt is framed. Each voice shows a quote of the day, a different one every day of the week (tap it for another), and you can replace a voice's quotes with your own. Entries are always stored as plain 1–5 moods, so switching voices never changes your data.
- **Quotes**: verbatim and sourced. Most come from public-domain translations (Legge, Long, Gummere, Nicholson, Tagore, Johnston, the King James Version, Pickthall, Müller). Audre Lorde's and Fritjof Capra's are short quotations from their books, each listed as sourced on Wikiquote and checked against a scan of the book.
- **Theme**: Light, Dim or Dark, chosen in Settings. Each voice has its own tones in every mode (ink and cinnabar for Lao Tzu, marble and Tyrian purple for Marcus, the moon's phases for Muhammad…), all checked for WCAG contrast.
- **Habits**: logged with each check-in, built for good feedback loops. Habits to reduce (🚬 cigarettes, 🌿 weed, 🍺 drinks) are counted in doses since the last check-in, with a "≈ roughly" toggle when you're going from memory, and a 0 shows as 🌱. Good habits (💧 water, 🚶 a walk, 🤝 connecting with a friend, 🛠️ time doing something: cooking, cleaning, carpentry, laundry, drawing, painting, dancing, listening to music) are ticked. A note says what you did instead. Wins add a sprout to the save burst, even on a low day. Everything (habits, options, prices, usual amounts, weights) is configurable in Settings.
- **Balance**: light points (good habits, zeros, doing something else instead) against heavy points (doses × weight), with a weekly score, a kind verdict, a comparison with last week and a light-up / heavy-down bar per day.
- **Savings jar**: money kept by having less than your usual, at Dutch 2026 prices by default (cigarette €0.55, joint €5, drink €3), filling toward milestones like "a dinner out 🍝". A heavier day never takes savings back.
- **Pause**: the greeting's sun or moon gently breathes; tap it to count breaths (Calm, Box or 4-7-8; 5, 10 or 21 breaths) or to rest your gaze on a candle, a dot or something near you for 1–10 minutes until a bell. The screen stays on and the bell rings even if the phone locks.
- **Little moments**: a greeting for the time of day with your check-in streak, a burst of emojis when you save a good mood, and an offer of three guided slow breaths after a low one.
- **Phone unlocks** (optional, off by default): counts how often you unlocked your phone since the previous check-in, and shows it as a live counter at the top of the check-in screen, on each check-in card, in every cell of the weekly table (with per-slot averages), and in the Claude prompt. It reads Android's usage event log, so it needs Android 9+ and the "Usage access" permission, which you switch on once in Android settings. Only check-ins saved for the current slot get a count, because the log only goes back about a week. Editing a check-in keeps its original count.
- **Steps** (optional, off by default): counts your steps since the previous check-in. Google Play services records them in the background (Recording API on mobile: on the phone, no account, kept for 10 days), and the app asks for the steps in each window when you check in. Shown next to unlocks everywhere unlocks appear. Needs the "Physical activity" permission; steps are counted from when you turn it on.
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
| `unlocks`    | optional, phone unlocks since the previous check-in |
| `unlocksFrom`| optional, ISO start of the `unlocks` window |
| `steps`      | optional, steps since the previous check-in |
| `stepsFrom`  | optional, ISO start of the `steps` window |

Everything is stored on the device in AsyncStorage. **Uninstalling the app deletes your data**, so export a backup now and then.

## Development

```bash
npm install
npx expo start          # open in Expo Go on your phone, or press "a" for an emulator (unlock counts need a real build)
npm test                # domain rules, voices and palettes, signals, architecture
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
