# Changelog

## 4.8.5 — 2026-07-22

### Fixed

- Auto-claim drops silently stopped claiming on the drops inventory page. Twitch changed the inventory claim control from a styled link with the exact text "Claim" to a plain button labelled "Claim Now" with no stable data attributes, so the claim pass (which still ran every 2.5 seconds) never matched anything. The matcher now accepts "Claim Now" as well as "Claim"; all existing guards (stable-attribute match, disabled state, skipping the popover's link to the inventory page) are unchanged.

### Validation

- Verified against the live inventory DOM with two claimable rewards: enumerating every link and button in the page's main area whose text or stable attributes mention "claim" returned exactly the two "Claim Now" buttons, and the updated filter matches both and nothing else. Full suite passes 94/94.

## 4.8.4 — 2026-07-18

### Fixed

- A channel could show another channel's video total in the "Watched N / total" badge (e.g. Gamers Nexus, 3.2k videos, showing "/ 514" inherited from a previously visited channel). Two causes: pre-4.8.3 versions wrote the previous channel's scraped total into the new channel's record during the same stale-header windows, and the total parser could not read abbreviated counts ("3.2k videos"), so the wrong stored value never self-corrected on the channel's own page. The parser now handles abbreviated counts (3.2k, 1.5m, 3,2 mil, 1,2 Tsd., 1,2 тыс., 1.2万 and similar, with ',' or '.' before a multiplier read as a decimal point), refuses a header row that names a different @handle than the current channel, and, as a side effect of the same fix, Russian and Greek totals parse for the first time (the old word-boundary check never matched after Cyrillic or Greek words).
- Watched database v6: stored channel totals reset once, since pre-4.8.3 data may hold another channel's count. Watched attributions, hidden tallies, and the watched set are untouched; totals re-scrape on the next visit to each channel page, and the badge already falls back to the freshly scraped value, so the denominator reappears immediately.

### Validation

- The abbreviated parser was verified against the live Gamers Nexus header row ("@GamersNexus•2.63m subscribers•3.2k videos" parses to 3200, skipping the subscriber count). New regressions cover abbreviated formats across locales, the subscriber-count trap, and the foreign-handle rejection. Full suite passes 94/94.

## 4.8.3 — 2026-07-18

### Fixed

- The 4.8.2 watched-counter fix was incomplete: the per-channel "Watched" tally could still absorb other channels' videos on channel-to-channel navigation, which is why the counter jumped when moving between channel pages. Two remaining leaks, both verified live: the SPA keeps other channels' cached pages hidden in the DOM with their byline-less video grids intact, and the tile scanner visits them; and on a channel-to-channel navigation the reused page confirms its new header seconds before the grid restamps, so the previous channel's byline-less cards briefly sit inside the new channel's confirmed page (about 3 seconds in live sampling). Channel attribution of a byline-less card now requires all of: a confirmed page identity (rendered header matching the URL, canonical link for /channel/UC pages), the card living inside that channel's visible page, and the card not being a carry-over (a recycled element still holding the video it had under another page's context attributes nothing until it is restamped with the new channel's video). Hiding of watched videos is unaffected throughout, including while attribution is suspended.
- The "Watched N / total" badge and the scraped channel video total now wait for the confirmed header, so a mid-navigation header can no longer supply another channel's total or host the badge.
- Watched database v5: one more one-time reset of the per-channel watched attribution sets, since v4 data could be re-polluted within seconds of normal browsing. Totals, hidden tallies, and the watched set itself are preserved; nothing is un-hidden.

### Validation

- Live-verified the navigation timeline on youtube.com: the URL flips first, the header confirms roughly 300ms later, and the reused grid keeps the previous channel's cards for about 3 seconds under the new header. New regressions cover all three guards: unconfirmed identity attributes nothing, byline-less cards outside the confirmed visible page are ignored, and a carried-over card is not credited to the new channel until it is restamped. Full suite passes 92/92.

## 4.8.2 — 2026-07-18

### Fixed

- The channel page "Watched N / total" badge could exceed the channel's own video count (for example 596 / 514). YouTube's SPA keeps the previous channel page, header included, hidden in the DOM after navigation (verified live: on a watch page reached from a channel, the hidden `ytd-browse[page-subtype="channels"]`, its header h1, and even the channel's canonical link all remain readable). Channel-page detection therefore kept reporting the last visited channel on watch pages and feeds, and every watched video encountered there, including the entire related sidebar, was credited to that channel's tally. Channel identity is now derived from the URL and scraped only from the visible channel header, with a stale header that names a different handle contributing nothing.
- On a genuine channel page, a tile carrying a different channel's byline (channel home shelves and featured playlists can surface other channels' videos) is still hidden as watched but no longer credited to the page channel's "Watched" count.
- Since existing per-channel tallies may be inflated beyond repair, the watched database performs a one-time v4 migration that resets per-channel watched attributions; they rebuild from the channel's own pages and future watches. The watched-video set itself, channel video totals, and hidden tallies are untouched, so the migration never un-hides a video.
- The badge's video total and its insertion point are likewise read only from the visible channel header, so a hidden cached page can no longer supply a stale total or swallow the badge.

### Validation

- New regressions: a cached hidden channel browse leaks no identity onto watch, home, or subscription pages; watched tiles with a foreign byline are hidden without being attributed; the v4 migration drops inflated attributions while preserving the watched set, totals, and hidden tallies, and post-migration attributions survive a reload. Full suite passes 90/90.

## 4.8.1 — 2026-07-17

### Fixed

- Paid / rental badge hiding now recognises Japanese, Korean, Chinese, Russian, Turkish, Polish, and Arabic labels, and keeps localized "free with ads" badges visible, matching the members-only badge's language coverage. It also matches each language's bare "paid" badge ("Kostenpflichtig", 有料, and similar), which appears alongside the buy/rent wording; the German strings were verified against the live storefront.
- The desktop guide's Shorts entry is now also matched by its language-independent /shorts link, and the Japanese channel tab (ショート) is hidden like its English counterpart.
- The workspace's "Show transcript" lookup now matches localized button labels (Transkript, transcription, 文字起こし, and similar) instead of only the English wording.

## 4.8.0 — 2026-07-16

### Added

- Configurable keyboard, auxiliary-mouse, and player-wheel actions shared by YouTube and Twitch, retaining `[`, `]`, and `\` as defaults.
- Named playback profiles with channel rules, quality/caption/compressor preferences, active-profile feedback, and graceful native-quality fallback.
- A rendered-transcript/chapter workspace and local YouTube subscription collections with JSON/CSV transfer and quota-bounded optional Sync.
- Bounded Twitch player recovery, live-edge/delay controls, configurable seeking, local sidebar favourites/groups/search, and a reversible theater/fullscreen chat overlay.
- Collapsible Twitch sidebar groups: a manager toggle tucks a group's non-favourite members out of the default sidebar view, while search and the group's own view still reveal them.
- The Firefox Sync status line now appears with the sync control on both settings pages instead of YouTube only.
- Progressive shared settings navigation, search, Basic/Advanced views, persisted collapsible sections, themes, presets, privacy disclosure, redacted diagnostics, recent actions/undo, selective import merge/replace, and automatic pre-reset backups.
- Sorted 500-row manager paging, hidden-video metadata for new entries, and accessibility improvements for popup tabs, labels, focus, forced colours, reduced motion, and helper text.

### Changed

- Twitch card work now uses cached dirty-subtree processing with bounded hydration recovery instead of mutation-triggered or periodic full-page article scans.
- Twitch selectors prefer stable data attributes, URLs, roles, and media state; documented text fallbacks fail closed.
- Shared storage normalization, JSON backup/merge, and Firefox Sync payloads now preserve the new bounded local models without adding a host permission or custom backend.

### Fixed

- Release a reused watch heading whose text was last written by the extension for a previous video, so the old video's title can no longer persist under the next video after an end-screen or suggested-video navigation. The native-title repair now records its own write, letting later passes distinguish an unhydrated reused heading from a genuine hydration even when neither video has a DeArrow replacement.
- Remove the extension's own stale heading text node when YouTube's SPA hydration appends the new video's title beside it instead of replacing it, which rendered the previous and current titles together under the player (reproduced and verified live in Firefox).
- Keep the Twitch sidebar group manager's rename and collapse controls working after a save: handlers now resolve the group by ID at event time and the open manager re-renders on storage updates, so the asynchronous storage echo can no longer orphan the objects behind an open panel's rows.

### Validation

- Added dependency-free suites for the shared schema/runtime, YouTube workspace, Twitch experience, settings helpers, and static UI accessibility, plus regressions for watch-heading reuse, appended-duplicate heading pruning, the chat overlay move/restore lifecycle, chat-batch mutation bounds, and collapsed sidebar groups. Full automated verification currently passes 85/85 tests, and the DeArrow heading chain, sidebar groups/collapse, and chat overlay were verified live in Firefox on 2026-07-16; the remaining manual smoke checks stay tracked in `IMPLEMENTATION_PLAN.md`.
## 4.7.2 — 2026-07-14

### Fixed

- Reconcile DeArrow watch-page titles against the route, watch container, and player identity during YouTube SPA navigation so Firefox cannot retain or reapply the previous video's title.
- Recover the new video's native title from verified player data when Firefox reuses the old heading, including videos without a DeArrow replacement.
- Defer watch-title writes while YouTube's route, watch container, and player identities disagree, then reprocess on page-data and lookup completion.

### Validation

- Add two watch-page SPA regressions; the dependency-free suite now contains 35 tests.

## 4.7.1 — 2026-07-14

### Fixed

- Hold startup cards, shelves, and promo renderers behind a layout-preserving pre-paint gate until settings, watched history, and the first classification finish; fail open after three seconds if initialization stalls.
- Classify continuation batches plus relevant progress-width, title, link, badge, and text hydration in the mutation's observer turn.
- Re-evaluate virtualized/recycled renderers when their video URL changes, and never cache incomplete shells before identity, title, or channel metadata arrives.
- Repair managed filter classes stripped by YouTube and release route/settings-scoped reasons immediately when their filter is disabled.
- Keep detached internal card mutations on the incremental path instead of scheduling a redundant full-document pass.
- Hide late promo, news, and Shorts-shelf insertions before their debounced legacy maintenance pass can paint.
- Remove the prior 40-selector relational anti-flash stylesheet and permanent keep markers during same-DOM extension updates.
- Restore DeArrow titles and thumbnails when DeArrow or the YouTube master switch is disabled, and bind originals/replacements to the current video so recycled cards cannot restore or retain another video's metadata.
- Preserve dirty watched-history batches after failed writes while a failed initial read stays read-only.
- Make clear generation-tagged, mutation-barrier protected, and distributed across tabs; current-generation state repairs any older fixed-key write that lands afterward.
- Make watched and channel-hidden Undo operations deterministic across tabs, including against stale whole-shard snapshots.
- Re-read invalidated startup snapshots without consuming the storage-failure budget, retry transient startup failures with backoff, repair stale persisted counts, and prevent delayed loaders from publishing across a local clear.
- Complete the v2-to-v3 migration from the monolithic watched-operation record to sharded records, including records received from an older live tab.
- Keep distributed-clear notifications behind a mutation barrier so synchronous rescans cannot repopulate the history being cleared.
- Invalidate SponsorBlock badge results when categories change, remove badges from recycled cards immediately, and preserve the six-request cap across category generations.
- Report clear failures in the options page while retaining the existing durable history.

### Performance

- Replace the 200 ms whole-document mutation reaction with a synchronous dirty-card pass driven by MutationObserver records.
- Keep high-frequency style/text/thumbnail observation scoped to known cards and comments, and ignore unrelated style/class churn.
- Canonicalize nested YouTube renderers to one outer card and deduplicate every mutation batch.
- Search only newly inserted subtrees for legacy shelf/promo renderers instead of rescanning an existing large grid for every mutation record.
- Replace the 2-second recovery loop and 1.5-second global progress scan with event-driven filtering plus a 10-second safety pass.
- Stop physically moving Polymer grid nodes; CSS display-contents layout reflows rows while filtered nodes remain hidden in place.
- Use a true trailing debounce for unrelated page/player work.
- Persist and drain SponsorBlock/DeArrow card queues with at most six concurrent requests per service, including initial and duplicate cards.
- Batch watched-history writes after a scan goes quiet, with a 10-second maximum wait and a background/page-hide flush.
- Shard watched Undo operations alongside watched IDs so one remove/restore does not rewrite the complete operation history.
- Stop observers, queues, and recurring timers when a newer content-script instance takes over.

### Validation

- Add 33 dependency-free Node regressions covering a 600-card channel, incremental appends, bounded shelf scanning, hydration, incomplete/recycled renderers, DeArrow identity, filter precedence and route release, redundant-scan suppression, storage sharding/retry and autonomous read recovery, simultaneous tabs, distributed clear/re-entry, loader races and churn, stale-generation repair, metadata repair, load-time/live operation migration, and Undo convergence.
