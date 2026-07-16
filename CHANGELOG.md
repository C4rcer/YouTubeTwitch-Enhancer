# Changelog

## Unreleased

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
