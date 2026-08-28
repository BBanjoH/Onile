# Onile Mobile (Expo)

A thin native wrapper around the Onile web app (`/web` in this repo). It
opens the deployed website inside a full-screen WebView, with:

- Android hardware back-button wired to in-page navigation
- Pull-to-refresh
- An offline/error screen with a retry button
- App icon, adaptive icon, and splash screen branded for Onile

This gets you a real, installable Android/iOS app for the MVP without
duplicating the web app's UI in native code. If the product grows past MVP,
the natural next step is a proper React Native UI hitting the same
`/api/*` routes — the backend already returns plain JSON, so that migration
doesn't require touching the API.

## 1. Point it at your deployed web app

The web app must be deployed and reachable over HTTPS before you build the
mobile app (WebView on a real device can't reach `localhost` on your laptop).
Deploy `/web` first (see the root README), then set the URL in **one** of:

- `app.json` → `expo.extra.appUrl`, or
- an `EXPO_PUBLIC_APP_URL` env var (also set per-profile in `eas.json`) — this
  takes precedence over `app.json` if both are set.

## 2. Run it locally in Expo Go (fastest way to see it working)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app (iOS/Android) on your phone. Because
Expo Go is a sandboxed runtime, this is the quickest way to sanity-check the
WebView wrapper before producing a standalone binary.

## 3. Produce a downloadable, installable APK (the MVP mobile file)

This uses [EAS Build](https://docs.expo.dev/build/introduction/), Expo's free
cloud build service — no local Android Studio/Xcode setup required.

```bash
npm install -g eas-cli
eas login          # free Expo account
cd mobile
eas build -p android --profile preview
```

When the build finishes, EAS prints a URL to a `.apk` file you (or anyone
you send the link to) can download straight to an Android phone and install
directly — that's the "downloadable MVP file" for mobile. `adb install
onile.apk` works too, if you'd rather sideload from a computer.

For an iOS build (`.ipa`) you'll additionally need an Apple Developer
account; run `eas build -p ios --profile preview` once that's set up.

For a Play Store submission later, use the `production` profile, which
builds an `.aab` app bundle instead of a raw APK:

```bash
eas build -p android --profile production
```

## Why a WebView wrapper for the MVP

Building a full native UI twice (web + mobile) before validating the core
idea — landlords and tenants dealing directly, with honest reviews — would
slow down getting real users. The WebView wrapper ships a genuine installable
app immediately, backed by the same database and API as the website, while
keeping all product logic in one codebase.
