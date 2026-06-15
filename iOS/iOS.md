# Codexa iOS — Setup Guide

There are two ways to get the app onto your iPhone:

| | Free Sideload | TestFlight / App Store |
|---|---|---|
| Apple Developer fee | None | $99/year |
| App expires | Every 7 days (re-install needed) | Never |
| Share with others | No | Yes |
| Setup time | 10 minutes | ~1 hour |
| Good for | Testing | Distribution |

**Start with the free sideload path.** If you like how the app works, pay the $99 later for permanent distribution.

---

## Path A — Free Testing via Sideload

### What you need
- A Windows PC (you already have this)
- [iTunes](https://www.apple.com/itunes/) installed on Windows (for USB drivers)
- [Sideloadly](https://sideloadly.io/) installed on Windows (free)
- A free Apple ID (your existing one is fine)
- A USB cable to connect your iPhone

### Step 1 — Trigger the build

1. Go to your GitHub repository → **Actions**
2. Click **"Build iOS IPA (Sideload / Free)"** in the left sidebar
3. Click **Run workflow** → optionally enter your bundle ID (or leave the default)
4. Click the green **Run workflow** button
5. Wait **30–40 minutes** for the build to finish

### Step 2 — Download the IPA

1. Click on the completed workflow run
2. Scroll down to the **Artifacts** section
3. Download **Codexa-sideload-N** — it's a ZIP containing `Codexa-sideload.ipa`
4. Extract the ZIP to get the `.ipa` file

### Step 3 — Install with Sideloadly

1. Open Sideloadly on your Windows PC
2. Connect your iPhone via USB — it should appear in Sideloadly
3. Drag the `Codexa-sideload.ipa` onto Sideloadly
4. Enter your Apple ID and password when prompted
5. Sideloadly signs and installs the app (takes ~1 minute)
6. On your iPhone: **Settings → General → VPN & Device Management** → trust your Apple ID developer certificate
7. Open Codexa from your home screen

### 7-day renewal

Free Apple ID certificates expire every 7 days. To renew:
- Repeat Step 3 (drag IPA onto Sideloadly again) — takes 1 minute
- OR install **AltStore** alongside Sideloadly — AltStore auto-refreshes apps in the background over WiFi when AltServer is running on your PC

The IPA artifact stays available for 30 days in GitHub Actions, so you don't need to rebuild to re-sign.

---

## Path B — TestFlight & App Store (paid, $99/year)

The `ios-build.yml` workflow handles this automatically. Follow the sections below once you decide to go this route.

---

## Prerequisites

| Requirement | Cost | Notes |
|---|---|---|
| Apple Developer Program | $99/year | developer.apple.com/enroll |
| iPhone or iPad for testing | — | Needed to install TestFlight build |
| GitHub account | Free | Already have this |

---

## Step 1 — Choose your bundle ID

Pick a reverse-domain identifier. It must be globally unique and can never be changed once the app is in the App Store.

Recommended format: `com.yourname.codexa`  
Example: `com.kralj.codexa`

Write it down — you will use it in several places below.

---

## Step 2 — Apple Developer setup (all done in a browser)

### 2a. Register the App ID

1. Go to [developer.apple.com/account/resources/identifiers/add/bundleId](https://developer.apple.com/account/resources/identifiers/add/bundleId)
2. Select **App IDs → App**
3. Description: `Codexa`
4. Bundle ID: **Explicit** → enter your bundle ID from Step 1
5. Capabilities: no special ones needed — leave defaults
6. Click **Continue → Register**

### 2b. Create the app in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → **+** → New App
3. Platform: **iOS**
4. Name: `Codexa`
5. Primary language: your language
6. Bundle ID: select the one you just registered
7. SKU: anything unique, e.g. `codexa-ios-001`
8. User Access: **Full Access**
9. Click **Create**

### 2c. Create an App Store Connect API key

This lets GitHub Actions authenticate with Apple without a password.

1. App Store Connect → Users and Access → **Integrations → App Store Connect API**
2. Click **+** to generate a new key
3. Name: `GitHub Actions`
4. Access: **Developer** (sufficient for TestFlight uploads)
5. Click **Generate**
6. **Download the `.p8` file immediately** — Apple only lets you download it once
7. Note the **Key ID** (e.g. `ABCD123456`) and the **Issuer ID** shown on the page

Convert the `.p8` file to base64 in PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\AuthKey_XXXX.p8")) | Set-Clipboard
```

The clipboard now contains the base64 string. You will paste it into the `ASC_PRIVATE_KEY` secret in Step 4.

---

## Step 3 — Certificate repository

Fastlane match stores your signing certificates encrypted in a private git repo.

1. On GitHub, create a **new private repository** — name it anything, e.g. `codexa-ios-certs`
   - No README, no .gitignore — completely empty
2. Create a **Personal Access Token** so match can write to that repo:
   - GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
   - Click **Generate new token (classic)**
   - Note: `fastlane match`
   - Expiration: No expiration (or 1 year — remember to renew)
   - Scope: tick **repo** (full control of private repositories)
   - Click **Generate token** and copy it immediately

---

## Step 4 — Add GitHub Secrets to this repository

Go to the Codexa repository → **Settings → Secrets and variables → Actions → New repository secret**

Add these 8 secrets:

| Secret name | Value |
|---|---|
| `BUNDLE_ID` | Your bundle ID, e.g. `com.kralj.codexa` |
| `ASC_KEY_ID` | Key ID from Step 2c, e.g. `ABCD123456` |
| `ASC_ISSUER_ID` | Issuer ID from Step 2c (UUID format) |
| `ASC_PRIVATE_KEY` | The base64 string from Step 2c |
| `MATCH_GIT_URL` | URL of the certs repo, e.g. `https://github.com/yourusername/codexa-ios-certs.git` |
| `MATCH_GIT_USER` | Your GitHub username |
| `MATCH_GIT_TOKEN` | The Personal Access Token from Step 3 |
| `MATCH_PASSWORD` | A password **you invent** to encrypt the certificates — store it somewhere safe, you will need it if you ever regenerate certs |

---

## Step 5 — Trigger the first build

Push any change to the `iOS/` folder (e.g. edit a whitespace in `iOS/www/index.html`) and push to `main`. Or go to **Actions → Build iOS & TestFlight → Run workflow**.

**What happens on the first build (takes 30–45 minutes):**

1. Installs Node and Ruby dependencies
2. Generates the Xcode project with Capacitor
3. Patches the app: keep-awake, hidden status bar, fullscreen
4. Runs `pod install` for CocoaPods
5. **Fastlane match creates a new distribution certificate and provisioning profile**, stores them encrypted in your `codexa-ios-certs` repo, and installs them on the build machine
6. Xcode builds the `.ipa`
7. Uploads to TestFlight

Subsequent builds skip certificate creation (uses the cached ones) and take about 20–25 minutes.

---

## Step 6 — Install on your iPhone via TestFlight

1. App Store Connect → Your App → **TestFlight**
2. Under **Internal Testing**, click **+** next to Testers
3. Add your Apple ID email as an internal tester
4. You will receive an email invitation — follow it to install TestFlight and then install Codexa
5. First launch: enter your Codexa server URL (e.g. `https://books.yourserver.com`) and tap **Connect**

---

## App behavior

- **Screen always on** — the app disables the iOS idle timer so the screen never sleeps while Codexa is open. The display will only turn off if you press the side button or the Codexa sleep timer triggers.
- **Fullscreen** — the status bar is hidden; content extends edge to edge.
- **Server URL** — stored in the app's local storage. To change it: on the 1.5-second "Connecting…" screen, tap **Change server** before the app navigates.
- **If you miss the window**: go to iOS **Settings → General → iPhone Storage → Codexa → Offload App** (or delete and reinstall). This resets the saved URL.

---

## Updating the app

Just push changes to `main` that touch any file inside `iOS/`. The workflow triggers automatically, builds a new version, and uploads it to TestFlight. TestFlight notifies your testers automatically.

Changes to other folders (the web app, Android, server) do **not** trigger an iOS build.

---

## Moving to the App Store (later)

When you are ready to release publicly:

1. App Store Connect → Your App → Distribution → **Submit for Review**
2. Fill in screenshots (you need iPhone 6.5" and 6.7" sizes), description, keywords
3. The same build already in TestFlight can be submitted — no re-build needed
4. Apple reviews in 1–3 days for first submission

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails at `pod install` | CocoaPods spec repo stale | Re-run the workflow — `--repo-update` should fix it |
| `match` fails: "certificate not found" | Wrong `BUNDLE_ID` or `MATCH_PASSWORD` | Verify secrets match exactly |
| `match` fails: "no access to repo" | Wrong `MATCH_GIT_TOKEN` or `MATCH_GIT_URL` | Check the token has `repo` scope and the URL ends in `.git` |
| Upload fails: "invalid credentials" | `ASC_KEY_ID` / `ASC_ISSUER_ID` mismatch | Copy them again from App Store Connect → Integrations |
| TestFlight shows "Missing Compliance" | Normal for first upload | Accept the encryption compliance question in App Store Connect |
| App opens but shows blank white screen | Server unreachable | Check the URL, ensure HTTPS, check your server is running |

---

## GitHub Actions minutes usage

macOS runners cost 10× the Linux rate.  
GitHub Free: 200 effective macOS minutes/month (~7 builds).  
GitHub Pro ($4/month): 300 effective macOS minutes/month (~12 builds).  

For a reader app that ships infrequently, Free tier is sufficient. Use `workflow_dispatch` (manual trigger) instead of push-triggered builds to conserve minutes.
