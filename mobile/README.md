# Ridewallah Android apps

Two Android apps built with [Capacitor](https://capacitorjs.com), each a native shell around part of the live site:

| App | Package | Opens |
|---|---|---|
| **Ridewallah** (customer) | `com.ridewallah.customer` | https://ridewallah.netlify.app/ |
| **Ridewallah Rider** | `com.ridewallah.rider` | https://ridewallah.netlify.app/rider |

Each has its own icon, splash screen and an offline screen (`www/offline.html`) shown when the site can't be reached.
Because the apps load the live site, web deploys reach the apps immediately — no new APK needed.

## Build

Needs JDK 21, the Android SDK (platform 36) and Node 22+ for the Capacitor CLI (`~/.local/node22` is used automatically if present).

```bash
cd mobile
npm install
npm run apk          # debug APKs → mobile/dist/
npm run icons        # regenerate icons/splash from app/customer/icon.svg and app/rider/icon.svg
```

`npm run apk -- release` builds unsigned release APKs. For the Play Store you'll need a signing key (keep it
and its password outside git, backed up — losing it means you can't update the app) and an AAB (`./gradlew bundleRelease`).

## Testing against a local dev server

Point `server.url` in `customer/capacitor.config.json` at `http://10.0.2.2:<port>/` (how the Android emulator
reaches this computer), add `"cleartext": true`, run `npm run apk`, and change it back afterwards.
`next.config.ts` allows the `10.0.2.2` origin in development for this.
