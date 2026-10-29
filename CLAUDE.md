# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Firefox-only Manifest V2 WebExtension (desktop and Android, `strict_min_version` 142) that filters and enhances YouTube and Twitch. Plain JavaScript loaded directly from `src/`: there is no build step, no bundler, no `package.json` and no npm dependencies. User-facing docs are in `README.md`, and release notes are in `CHANGELOG.md`.

## Commands

```sh
# Full regression suite (node:test, no dependencies; verified on Node 24)
node --test --test-isolation=none tests/*.test.js

# One file / one test by name
node --test tests/watched-db.test.js
node --test --test-name-pattern="abbreviated" tests/content-filter.test.js

# Release checks named in the README: syntax, manifest, whitespace
for f in src/*.js; do node --check "$f"; done
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
git diff --check
```

- Run in Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → `manifest.json`, then reload the YouTube/Twitch tab.
- Packages (`.zip`/`.xpi`) go to `web-ext-artifacts/` (gitignored) through Mozilla's `web-ext` (`web-ext build` / `web-ext sign`).
- A release bumps `manifest.json` `version` and adds a `CHANGELOG.md` entry (Fixed / Validation sections that cite live verification). The README points release verification at `IMPLEMENTATION_PLAN.md`, but that file is not in the repo.

## Architecture

### Script contexts and load order (see `manifest.json`)
- **YouTube content scripts** run in this order: `feature-core.js` → `watched-db.js` → `player-controls.js` → `content.js` → `youtube-workspace.js`.
- **Twitch content scripts** run in this order: `feature-core.js` → `player-controls.js` → `twitch-experience.js` → `twitch.js`.
- All run at `document_start` and share one content-script global scope per frame. Modules talk through globals (`YTBFeatures`, `YTBWatchedDB`, `YTBTW_TWITCH_EXPERIENCE`) and DOM `CustomEvent`s on `document` (`ytb-apply-playback-profile`, `ytb-speed-action`, `ytb-watched-db-change`, `ytb-workspace-action`, `ytbtw-experience-action`).
- **Playback profiles** are applied by `player-controls.js` on new media, navigation, and edits to the profile fields only (`playbackProfiles`, `activePlaybackProfiles`, `channelPlaybackProfiles`). Other writes to `data` must not re-run them, because that would undo the user's manual speed, caption and compressor changes. The speed hotkeys also run there by default, and they report each change through `ytb-speed-action` so `content.js` can keep the per-channel speed memory. A profile's YouTube volume boost is session-scoped (`profileVolumeBoost` in `content.js`): it survives storage reloads and is never saved.
- **Background** (persistent page): `feature-core.js` + `common.js` + `background.js`. It handles context menus, the onboarding tab, the Firefox Sync mirror, the drops-inventory tab, and it proxies all SponsorBlock / DeArrow / Return YouTube Dislike HTTP calls. Content scripts reach these with `runtime.sendMessage` actions such as `ytb-sb-segments`, `ytb-de-branding`, `ytb-ryd-votes`, `ytb-sb-submit`, `ytb-sb-vote`, `ytbtw-claim-drops` and `ytbtw-close-self`. BTTV/FFZ/7TV emote lists are fetched directly from `twitch.js` (host permissions).
- **Extension pages** (`popup`, `options`, `twitch-options`) load `feature-core.js` + `common.js` (the `YTB` global) before their own script. The two managers also load `settings-enhancements.js` last, and `options.html` loads `watched-db.js`. `onboarding.html` is static.
- Page-world access is Firefox-specific: `wrappedJSObject` for YouTube's `#movie_player` API (`getVideoData`, `setPlaybackQualityRange`, `_lact`) and for Twitch React fibers (Slate chat editor, `channelID`, Apollo cache), plus `exportFunction` for the anonymous-chat WebSocket shim. Chrome compatibility is not a goal.

### Storage model
- **One shared `data` key in `storage.local`.** It holds the block lists, `settings`, and the bounded feature models (profiles, bindings, collections, sidebar, presets, recent actions, hidden-video metadata). It is normalized by `YTB.normalize` (`common.js`) plus `YTBFeatures.normalizeFeatureData` (`feature-core.js`).
  - Content scripts keep their own narrower `normalize()` and write with load-merge-save of only the fields they own: `content.js` `saveOnly()`, `twitch.js` `persist()`, `twitch-experience.js` `mergeStorage()`.
  - Each listener compares a serialized snapshot (`lastSerialized`) to skip its own write echoes.
- **Watched history lives outside `data`**, in keys owned only by `watched-db.js`: `ytbWatchedEpoch`, `ytbWatchedMeta`, `ytbWatchedShard0..63`, `ytbWatchedOpsShard0..63`, `ytbWatchedChannels`, `ytbWatchedOps`.
  - It is epoch-tagged for distributed clears, uses timestamped remove/restore operations for cross-tab Undo, and has versioned one-time migrations (`STORAGE_VERSION`).
  - Never touch these keys from elsewhere.
- **Other keys:** `sbUserId`, `ytbSyncStatus`, `ytbDiagnostics`, `twClipIntentAt`, `twLastClip`. The Firefox Sync mirror (lists only, never settings) is chunked into `storage.sync` as `ytbSyncMeta` + `ytbSyncChunkN`.
- **Setting defaults are duplicated.** The canonical `DEFAULT_SETTINGS` is in `common.js`, and `content.js` and `twitch.js` each carry their own copy. A new setting needs all relevant copies plus the popup/options UI wiring.

### Instance takeover (in-place updates)
Firefox leaves the old content script's DOM listeners alive after an update. Every content module therefore does three things:
- It creates a per-load `INSTANCE_ID` and dispatches a takeover event (`ytb-instance-takeover`, `ytbtw-instance-takeover`, `ytb-player-controls-takeover`) before listening for one itself.
- It guards every listener with `retired`.
- It tags injected DOM with an owner id, and rebuilds anything owned by another instance.

New listeners, timers and injected UI must follow the same pattern and be torn down in `retireInstance()`.

### YouTube filtering pipeline (`content.js` + `content.css`)
- **Pre-paint gate:** `html[data-ytb-filter-boot]` and the `.ytb-filter-pending` class hide cards with `visibility` until settings and watched history load (3 s fail-open). The gate's element list in `content.css` mirrors `INNER_CONTAINERS`, `NON_VIDEO_CARDS` and the shelf entries of `LEGACY_MUTATION_CONTAINERS` in `content.js`, so keep them in sync.
- **Observers:** a body `MutationObserver` (childList plus `href`) classifies only dirty canonical tiles synchronously in the observer turn (`filterMutatedTiles`). A scoped `detailObserver` watches style/title/class/aria-label/src/text inside known cards and comments. Page-level work (`runAll`) runs on a 250 ms trailing debounce, a 10 s safety interval, `yt-navigate-*` events and a 500 ms URL poll.
- **Hide in place:** filtered tiles get the `.ytb-removed` class and `data-ytb-filter-reason` and are never removed from Polymer's DOM, because removal causes re-stamp storms and breaks audit mode and Undo.
- **Caching:** `tileCache` is a WeakMap keyed by canonical tile (`canonicalTile`: inner renderer → outer grid cell). Its version combines filter config, `WatchedDB.revision()`, path and channel identity, so recycled renderers get reclassified.
- **Channel attribution** for the "Watched N / total" badge is deliberately strict: confirmed page identity, the visible `ytd-browse`, and no carry-over cards. Read the 4.8.2–4.8.4 changelog entries before changing it.

### Twitch pipeline (`twitch.js` + `twitch-experience.js`)
- Cards are `article`, `a[data-a-target="tw-box-art-card-link"]` and `.side-nav-card`. The grid cell is the closest `.tw-tower > *`.
- Classification is identity-cached and incremental from mutation records, with a bounded recovery queue for incomplete shells and a full scan only on SPA navigation. A 2.5 s interval keeps claims working in background tabs.
- `twitch-experience.js` is UMD and exposes `createController(env)`, which owns player recovery, live edge, sidebar groups/favourites and the chat overlay.
- **Drop auto-claim:** the stream tab asks the background to open `/drops/inventory#ytbtw-autoclaim` in an inactive tab. That tab's instance clicks the claim controls and then sends `ytbtw-close-self`: 6 s after its last claim, or after 30 s with nothing to claim. It never closes a tab the user has switched to.
  - The claim button has no stable attributes, so it is matched by its exact label. `DROP_CLAIM_LABELS` was taken from Twitch's own locale bundles, under the key `[DropsCampaignInProgressRewardComponent] Claim Now`.
  - Those bundles are `core.locales.<lang>-<hash>.js`. The chunk map in the page HTML names them; download them from `assets.twitch.tv/assets/`.

## Tests

The tests are dependency-free and run the real sources inside `node:vm` contexts with hand-written fake DOMs.
- **UMD modules** are loaded with `require`: `feature-core.js`, `settings-enhancements.js`, `twitch-experience.js`, `youtube-workspace.js`.
- **`content.js`** is not exported. `tests/content-filter.test.js` regex-replaces the file's final `    init();\n})();` with a hook that reaches internal names (`filterMutatedTiles`, `processTiles`, `state`, `settings`, `hiddenSet`, `blockedIndex`, `keywordMatchers`, `tileCache`, `deCache`, `curChannelInfo`, …). Renaming those internals or changing the file's ending breaks the harness.
- **`twitch.js`** gets the same treatment in `tests/twitch.test.js`: its `init()` is never called, and `advance()` drives a fake clock.
- **`background.js`** is loaded after `feature-core.js` and `common.js`, as the manifest loads it, in `tests/background.test.js`.
- **`watched-db.js`, `player-controls.js` and `common.js`** are evaluated as source in a vm context.
- **`tests/mini-dom.js`** is a small real DOM with a selector engine (compound selectors, descendant and child combinators, attribute operators, `:not`, `:scope`). Use it when a test depends on document order or real selector matching. Unsupported selector syntax throws, so a test cannot pass by accident.
- **`tests/ui-accessibility.test.js`** regex-matches source and HTML text.

## Conventions

- **Selector choice:** prefer stable hooks (YouTube element names; Twitch `data-a-target` / `data-test-selector`, roles, URLs). Avoid styled-components class hashes (`Sc…-sc-xxxx`) and obfuscated class names.
- **Text fallbacks:** when one is unavoidable, keep the per-language lists (`MEMBERS_TEXTS`, `PAID_TEXTS`, `DNR_TEXTS`, …), scope it to the card or callout, and make it fail closed (item stays visible, nothing is clicked).
- **Live-DOM notes:** DOM assumptions are documented in comments as dated live verifications ("verified live 2026-07"). Keep that convention when changing selectors.
- **Selector order:** `querySelector` with a selector list returns the first match in document order, not selector order. Query in separate priority tiers when a broad pattern (e.g. `[class*="lockupMetadataViewModelTitle" i]`) can also match an ancestor.
