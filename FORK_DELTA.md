# juliefuller/codexa — fork delta vs thehijacker/codexa

Maintained list of changes in this fork that are **not** in upstream. Use during every upstream merge: take upstream first, then re-apply or verify each item.

**Last upstream merge base:** v2.3.0 (`33ea382`)  
**Last upstream fetched:** v2.3.3 (`17b47ae`, 2026-06-15)  
**Reader build (fork):** `br-v88` (uncommitted WIP on chapter-bar e-ink ticks)

---

## Fork-only features (re-apply after merge)

### BookOrbit / KOReader integration

| ID | Feature | Key files / symbols |
|----|---------|---------------------|
| F1 | **Reading stats sync** (`kosync_stats_enabled`) | `server/db.js`, `server/routes/settings.js`, `server/routes/kosync.js` (`POST /api/kosync/remote/stats`), `reader_v4.js`: `buildBookOrbitStatsPayload`, `pushRemoteStats`, `loadKosyncSettings` |
| F2 | **Custom device names** | `public/js/sync-device.js`, `getSyncDevice()` / `kosyncDeviceFields()` |
| F3 | **Device name prompt** | `public/js/device-name-prompt.js`, `public/js/app.js` |
| F4 | **“Synced ago” status bar slot** | `reader_v4.js`: `syncedAgo` in `SB_SLOT_DEFS`, `renderStatusBarValue`, `lastSyncedAt` / `markRemoteSynced` |

### Reader UX (fork-only)

| ID | Feature | Key files / symbols |
|----|---------|---------------------|
| F5 | **Chapter tick progress bar** | `readerv4.html` (`#sb-book-prog-*`), `reader.css` (`.sb-book-prog-*`), `reader_v4.js`: `bookProgressBar.chapterMarkers`, `buildBookProgressMarkers`, `applyProgressBarLayout` |
| F6 | **Mouse wheel page navigation** | `reader_v4.js`: `wheelNav` pref, wheel handler on iframe; `readerv4.html` settings toggle |

### Offline / deploy reliability

| ID | Feature | Key files / symbols |
|----|---------|---------------------|
| F7 | **Local JSZip + localforage** | `public/vendor/jszip.min.js`, `public/vendor/localforage.min.js`, `readerv4.html` script tags (not CDN) |
| F8 | **Network-first service worker** | `public/sw.js` fetch handler (network-first for shell); keep upstream Chrome 83 WebView bypasses |
| F9 | **Extended APP_SHELL precache** | `public/sw.js` APP_SHELL: flow/*, sync-device, device-name-prompt, vendor/* (upstream v2.3.3 trimmed this list) |
| F10 | **Android TWA asset links** | `public/.well-known/assetlinks.json` |

### Infra / docs

| ID | Feature | Key files |
|----|---------|-----------|
| F11 | **Dockerfile / entrypoint tweaks** | `Dockerfile`, `entrypoint.sh` |
| F12 | **Fork README** | `README.md` (upstream pointer + delta table) |
| F13 | **Locale cache sentinel** | `public/js/i18n.js`: `LOCALE_SENTINEL_KEY = 'reader.sb_synced_ago'` (bump `CACHE_VER` with upstream) |

---

## Upstream v2.3.3 additions (take theirs, do not regress)

These landed upstream since v2.3.0 — merge in fully, then layer fork items on top:

- Sleep timer (dim / close / screen always-on) + toolbar animation
- Copy selection to clipboard; search selected text in book
- Library grid density toggle
- Status bar: `online`, `chapterNum`, `chapterTitle` slots (keep **both** `online` and fork `syncedAgo`)
- Tab-based book info dialog; KOReader MD5 override + book redownload
- Footnote improvements; top-menu visibility toggle
- iOS app / icon / optimizations
- Old WebView (Chrome &lt; 90) guards: `_isLegacyWv`, `_legacyWebView`, inline SW skip in `index.html`
- KOReader push failure toasts (`_kosyncPushFailures`, `_trackKosyncFailure`) — **combine** with F2 device fields
- `reader_v4.js` init refactor (book load block moved — do not keep duplicate HEAD block at ~6600)

---

## Merge conflict cheat sheet (v2.3.0 → v2.3.3 test merge)

| File | Resolution |
|------|------------|
| `public/js/reader_v4.js` | Upstream base + keep `kosyncDeviceFields`, stats vars, `syncedAgo` **and** upstream `online` slot; merge `pushRemoteProgress` (device fields + failure tracking); drop duplicate book-load block (upstream); add `_isLegacyWv` from upstream; bump `READER_BUILD` |
| `public/readerv4.html` | Keep local vendor scripts (F7); upstream HTML for new UI; bump `?v=br-v…` |
| `public/sw.js` | Upstream `CACHE_VERSION` pattern or fork `br-v…`; keep network-first fetch (F8) + fork APP_SHELL entries (F9) + upstream new images |
| `public/js/i18n.js` | Take upstream `CACHE_VER`; keep `LOCALE_SENTINEL_KEY` (F13) |
| `public/index.html` | Prefer upstream inline SW guard for Chrome 83; keep `sw-register.js` on other pages or align with upstream pattern |
| `public/css/reader.css` | Upstream e-ink rules + fork `.sb-book-prog-*` chapter bar (F5) |

**No conflicts expected (fork-only files):** `sync-device.js`, `device-name-prompt.js`, `vendor/*`, `assetlinks.json`, `server/routes/kosync.js` stats bits, `server/db.js` column.

---

## Post-merge checklist

1. Bump `READER_BUILD`, `readerv4.html?v=`, `sw.js` `CACHE_VERSION`, `i18n.js` `CACHE_VER`
2. Re-apply uncommitted chapter-bar e-ink tick CSS (`br-v88`) if not committed pre-merge
3. Smoke test: open book on tablet (local JSZip), wheel nav, chapter tick bar, kosync push + synced-ago, stats push if enabled
4. Verify upstream: sleep timer, online status, grid density, MD5 override UI
5. Deploy + hard refresh / SW update on devices

---

## Suggested merge commands

```bash
cd /mnt/data/bookorbit/codexa_src
git stash push -m "wip before upstream v2.3.3"
git checkout -b merge/upstream-v2.3.3
git merge upstream/main
# resolve conflicts per table above
git stash pop   # re-apply chapter-bar WIP if needed
```
