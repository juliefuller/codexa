# Codexa (juliefuller fork)

This repository is a personal fork of **[Codexa](https://github.com/thehijacker/codexa)** by Andrej Kralj.

For the full project overview, screenshots, feature list, KOReader setup, OPDS, dictionary lookup, keyboard shortcuts, and self-hosting guide, see the **[upstream README](https://github.com/thehijacker/codexa/blob/main/README.md)**.

**Upstream base:** [thehijacker/codexa](https://github.com/thehijacker/codexa) **v2.3.0** (merged into this fork, June 2026).  
**Reader build:** `br-v85`

---

## Why this fork exists

This fork tracks upstream closely and adds a small set of changes for a **BookOrbit + multi-device** reading setup (Samsung tablet, desktop browser, KOReader sync) and a few reader UX tweaks.

If you do not need the items below, use **[thehijacker/codexa](https://github.com/thehijacker/codexa)** instead.

---

## Differences from upstream

### BookOrbit / KOReader integration

| Change | Details |
|---|---|
| **Reading stats sync** | Optional `kosync_stats_enabled` setting. When on, Codexa pushes reading time and page sessions to `POST /stats` on your external KOReader server (e.g. BookOrbit with stats ingest). Silently skipped if the server does not support it. |
| **Custom device names** | Per-browser/device name in **Settings → KOReader Sync** (`sync-device.js`). Sent with sync payloads so BookOrbit can show which device last synced each book (instead of generic `web`, `Codexa (Linux)`, etc.). |
| **Device name prompt** | One-time prompt when opening the reader on a new device if no name is set. |
| **“Synced ago” status bar** | New status-bar slot showing how long since the last successful remote sync (`syncedAgo`). |

### Reader UX

| Change | Details |
|---|---|
| **Chapter tick progress bar** | **Settings → Status → Chapter tick marks**: whole-book horizontal line with vertical ticks at chapter boundaries, accent caret at current position, and a thin read-progress fill. Positioned above the bottom status text. Colors are scoped to the progress bar only — status-bar text is unchanged. |
| **Mouse wheel navigation** | **Settings → Device → Mouse wheel navigation** (on by default): scroll down = next page, scroll up = previous. Wheel events are forwarded from the EPUB iframe so paging works when the cursor is over the text. |

### Offline / mobile reliability

| Change | Details |
|---|---|
| **Local JSZip & localforage** | Bundled under `/vendor/` instead of loading from a CDN. Fixes Samsung WebView/APK hangs on “Loading book…”. |
| **Network-first service worker** | App shell (HTML/JS/CSS) is fetched from the network first when online, with cache as offline fallback only. Upstream uses cache-first, which can serve stale reader JS after a deploy until the cache is cleared. |
| **Android TWA asset links** | `public/.well-known/assetlinks.json` for trusted web activity / APK installs. |

### Other

| Change | Details |
|---|---|
| **Database** | `user_settings.kosync_stats_enabled` column (auto-migrated on startup). |
| **API** | `POST /api/kosync/remote/stats` proxy route. |

---

## Quick start (this fork)

Same as upstream — see the [upstream Quick Start](https://github.com/thehijacker/codexa#quick-start-with-docker).

```bash
git clone https://github.com/juliefuller/codexa.git
cd codexa
cp docker-compose.sample.yaml docker-compose.yaml
# Set JWT_SECRET in docker-compose.yaml
docker compose up -d
```

To track upstream:

```bash
git remote add upstream https://github.com/thehijacker/codexa.git
git fetch upstream
```

---

## Syncing with upstream

This fork is periodically merged with `upstream/main`. After merging, re-apply or verify the differences listed above still behave as expected.

---

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) © Andrej Kralj (original author).

This fork is a derivative work. If you distribute a modified version (including over a network), you must release the source under the same licence.
