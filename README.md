# YouTube/Twitch Enhancer (Firefox add-on)

Take back your YouTube feed. Block whole channels, hide videos by title keyword,
remove Shorts, hide what you've already watched, and strip the clutter. Core
filtering and preferences stay in your browser; optional public integrations and
Firefox Sync are disclosed below.

From v4.0 the same add-on also cleans up **Twitch**: block channels and whole
categories, filter stream titles, auto-claim channel points, hide the
front-page carousel and chat, pin source quality, and clip/share with one
click. The popup shows a separate Twitch panel, and Twitch has its own
manager page.

**[♥ Support development on Ko-fi](https://ko-fi.com/carcer7378)**

## Features

- **Block entire channels.** Open a video's **⋮ menu** and click the injected
  **Block channel** item, right-click any video → **Block this YouTube channel**,
  or add channels by `@handle`, URL, `UC…` ID, or name in the popup/options.
  Every tile from a blocked channel disappears everywhere — home, search,
  sidebar, subscriptions, channel pages, end-screen suggestions.
- **Undo.** Misclicked? Every block/hide shows a toast with an **Undo** button.
- **Keyword / title blocking.** Hide any video whose title contains a word or
  phrase — or use `/regex/` patterns. Great for dodging spoilers, reaction
  content, or topics you're done with.
- **Black out blocked channels.** Landing on a blocked channel's page or video
  stops playback and covers the content with a black panel (recommendations
  stay, one-click unblock available) — best-effort at not registering a view.
- **Remove all Shorts** — sidebar entry, channel tabs, shelves, and
  `/shorts/<id>` URLs auto-redirect to the normal `/watch` player.
- **Hide already-watched videos** past a progress threshold (default 90%),
  scoped per surface: Home, Subscriptions, Search, Related, Channel pages,
  Playlists — each individually toggleable (playlists off by default so
  Watch Later keeps showing progress).
- **Reveal hidden (audit mode).** See everything the add-on filtered, dimmed
  with a red outline, instead of removed — so you can trust what it's doing
  and rescue anything. Toggle off for a pure cleaned page.
- **Master switch.** One toggle in the popup pauses the entire add-on
  instantly, no reload needed.
- **Hide individual videos** — right-click → **Hide this video**, or
  **Ctrl + right-click** for an instant hide (works on end-screen suggestions
  too).
- **Hide members-only videos** (optional, off by default). Videos badged
  "Members only" disappear from every page — home, search, channel pages,
  related. Leave it off if you're a member of some channels and want to see
  their members-only uploads.
- **Hide paid videos (v4.6, optional, off by default).** Videos badged
  "Pay to watch", "Buy or rent" or "Buy" are removed from home, search,
  channel and related feeds. Free-with-ads movies and shows stay visible,
  and age-rating badges are left untouched.
- **Clean-up extras** — ads/promos/nudges (on by default), plus optional
  hiding of Mixes, playlist tiles, news/topic shelves, the sidebar loading
  spinner, and end-screen/pause-screen suggestions.
- **Keyword-filter comments (v4.2).** A separate keyword list (same
  words/phrases/`/regex/` syntax) hides matching comments — a whole thread
  when the top comment matches, just the reply otherwise.
- **Auto max quality.** Each new video is set to the highest available
  resolution.
- **Playback speed suite (v4.2).** Set a default speed for every new video
  (live streams are skipped), step it with **[** / **]** (±0.25×, 0.1–8×) and
  reset with **\\**, and optionally remember the speed per channel so your
  podcast channels always open at 2× while music stays at 1×.
- **Audio compressor (v4.2).** A 🎚 button in the player controls runs the
  sound through a dynamics compressor (same idea as FrankerFaceZ's) — quiet
  dialogue comes up, sudden loud parts come down. Its state is remembered.
- **A-B loop (v4.2).** A 🔁 button: first click marks the start, second the
  end (loops that section), third clears it.
- **Screenshot (v4.2).** A 📷 button saves the current frame as a PNG named
  after the video and timestamp.
- **Never pause me (v4.2).** Dismisses the "Video paused. Continue watching?"
  idle prompt (and keeps YouTube's idle timer fresh so it rarely appears at
  all). On by default.
- **Keep autoplay off / auto-expand description (v4.2).** Two small optional
  toggles: force YouTube's up-next autoplay switch off, and open the "…more"
  description box automatically.
- **In-player volume boost.** A second slider appears next to YouTube's own
  volume control once volume sits at 100%, extending it to 500% via a Web
  Audio gain node; scrolling over the player adjusts volume/boost. The audio
  graph is only built when you actually boost, so default playback stays
  native.
- **Import / export / sync.** One-click JSON export/import (merge, no
  duplicates) and optional **Firefox Sync** so your block lists follow your
  Firefox account. Settings stay per-device.
- **Reduce flashing.** A pre-paint gate holds new cards invisible while keeping
  their layout space, then reveals only cards that survive local filtering.
  The gate fails open after three seconds if browser storage is unavailable.
  Continuation batches and later title/progress hydration are classified in the
  same mutation-observer turn, minimizing visible hide-after-render windows.

## Shared playback, YouTube workspace, and safer settings (v4.8)

Version 4.8 adds a local shared feature layer without a custom backend or new
host permissions:

- **Configurable player actions.** Map keyboard chords, auxiliary mouse buttons,
  and player-wheel gestures to play/pause, seeking, frame stepping, speed,
  volume, mute, screenshots, loop, cinema, captions, chapters, live edge, and
  Twitch chat overlay actions. The existing **[**, **]**, and **\** speed keys
  remain the defaults. Bindings are ignored while typing and conflicts or
  browser-reserved shortcuts are rejected in settings.
- **Playback profiles.** Named, duplicable profiles can set speed, volume boost,
  preferred quality, captions, compressor state, and site scope. Profiles can
  be global or assigned to a YouTube/Twitch channel; unavailable quality levels
  fall back to rendered/native choices. The active player chip explains whether
  the profile came from the global choice or a channel rule.
- **Transcript and chapter workspace.** YouTube watch pages gain a dock that
  reads the transcript already rendered by YouTube, searches cues, follows the
  active timestamp, seeks on selection, copies/exports timestamped text, and
  navigates chapters. It makes no transcript API request.
- **Local subscription collections.** Create, colour, order, duplicate, import,
  and export collections of channel identities already present in YouTube's
  rendered DOM. The Subscriptions feed can be filtered to a collection or to
  uncollected channels without changing native subscriptions.
- **Progressive settings and safety.** Both managers now have site navigation,
  search, a sticky contents bar, persisted collapsible sections, Basic/Advanced
  views, light/dark/system themes, named settings presets, redacted diagnostics,
  recent destructive actions with bounded undo, import preview with selective
  merge/replace, and an automatic backup before reset. Lists over 500 rows are
  sorted and paged instead of rendering without a bound.
## Community data integrations (v4.3, all off by default)

Three opt-in YouTube features backed by free community-run services, replacing
the separate SponsorBlock / DeArrow / Return YouTube Dislike extensions:

- **SponsorBlock: skip segments.** Auto-skips crowdsourced sponsor reads,
  self-promos, like/subscribe reminders and (optionally) intros, outros,
  previews, non-music sections and filler — each category has its own toggle.
  Every skip shows a notice with **Unskip** (jumps back and stops
  auto-skipping that segment) and **Report** (downvotes a bad segment)
  buttons. Lookups use SponsorBlock's
  k-anonymity endpoint: only a 4-character hash prefix of the video ID leaves
  your browser, so the service cannot tell which video you are watching.
- **SponsorBlock: create & vote (v4.4).** A shield button on every video's
  player (while SponsorBlock is on) opens a panel: mark a segment's start and
  end at the playhead (±0.5 s nudges, local test of the jump), pick a
  category and submit it to SponsorBlock; existing segments can be up- or
  down-voted. Submissions and votes carry a local SponsorBlock user ID,
  generated automatically — migrating from the official SponsorBlock
  extension? Paste your user ID into the options page and your reputation
  carries over.
- **SponsorBlock: whitelist channels & segment cues (v4.5).** Whitelist any
  channel (from the shield panel on the player, or the options page) so its
  segments still show on the bar but are never auto-skipped, handy for
  creators you want to support. Videos that already have community segments are
  flagged with a small green shield: on the player's shield button, and as a
  badge in the top-left of every thumbnail across YouTube (search, home,
  suggestions), matching the official extension.
- **DeArrow: community titles & thumbnails.** Replaces clickbait titles (and,
  via a separate heavier toggle, thumbnails) with community-submitted ones
  where they exist — on tiles and the watch page.
- **Return YouTube Dislike.** Shows the crowdsourced dislike count on the
  watch page's dislike button. Lookups are cached per video, far inside the
  service's rate limits.

All three are **off by default** and clearly separated in the options page
under "Community data", with the privacy notes repeated there.

**Data credits:** segment and title/thumbnail data by
[SponsorBlock](https://sponsor.ajay.app) and
[DeArrow](https://dearrow.ajay.app) (Ajay Ramachandran and contributors),
licensed [CC BY-NC-SA 4.0](https://github.com/ajayyy/SponsorBlock/wiki/Database-and-API-License);
dislike counts by [Return YouTube Dislike](https://returnyoutubedislike.com).
This add-on is a non-commercial consumer of those APIs and is not affiliated
with either project — please consider supporting them directly.

## Twitch features (v4.0)

All Twitch features have their own toggles: the popup's **Twitch** tab has the
quick switches, and **⚙ Twitch advanced…** opens a full Twitch-only manager
page (separate from the YouTube options).

- **Bounded player recovery and live controls.** Recoverable rendered player/media
  failures retry with exponential backoff, a visible attempt status, and a
  cancel button; retries stop at the configured limit. Repeated failures can
  step down through quality options that Twitch has already rendered. Live
  streams show a best-effort buffer delay and a live-edge action; VOD/clip seek
  steps are configurable from 1–60 seconds.
- **Local sidebar favourites, groups, and search.** Followed-channel entries can
  be pinned, searched, grouped, reordered, imported, and exported using channel
  logins already present in Twitch links. Native entries, live/offline metadata,
  and navigation remain owned by Twitch; recycled or duplicate rows are cleaned
  without deleting Twitch nodes.
- **Theater/fullscreen chat overlay.** Move the existing chat DOM into a
  reversible overlay with left/right placement, width, opacity, font scale,
  auto-hide, and click-through options. The message input stays unavailable in
  passive mode and is restored with the original chat layout when disabled.
- **Block Twitch channels.** Right-click any stream card → **Block this Twitch
  channel**, or add channels by name/URL in the popup or Twitch manager.
  Blocked channels vanish from the front page, directory grids, search, and
  the side nav (followed and recommended lists).
- **Block whole categories.** Right-click → **Block this Twitch category**, or
  add by name or directory URL. Every stream in that category is hidden
  wherever it appears, and the category disappears from the Browse grid. This
  is usually the effective way to clear out content you never want to see:
  block the category once instead of chasing individual channels.
- **Stream title keywords.** Same syntax as the YouTube side: plain substrings
  or `/regex/` patterns, managed on the Twitch page.
- **Block tags & hide reruns (v4.2).** Add tag names (as shown on stream
  cards) to hide every stream carrying them, and an optional toggle hides
  anything badged "Rerun".
- **Auto-claim channel points.** The bonus chest is clicked for you the moment
  it appears, including in background tabs, so points keep flowing while you
  watch something else.
- **Auto-claim drops and Moments (v4.1).** Twitch only lets a drop be claimed
  from the drops **inventory** page, not from the stream. So when a drop is
  ready, the add-on opens `twitch.tv/drops/inventory` in a **background
  (inactive) tab**, claims everything there, and closes the tab again — the
  stream you're watching is never interrupted (you may briefly see the tab
  appear and vanish). Collectible Moment badges are grabbed in place the
  instant their chat callout appears. If you're already on the inventory
  page, drops are claimed there directly.
- **Anonymous chat (v4.1, off by default).** Connects to chat as an anonymous
  user so you never appear in the viewer list. Chat becomes read-only while
  it's on; points still accrue and auto-claim still works. Applies on the
  next page load after toggling.
- **Third-party emotes (v4.1).** BetterTTV, FrankerFaceZ and 7TV emotes
  (global sets plus the current channel's) render in chat at native size,
  and a 😼 button next to Twitch's emote picker opens a searchable panel of
  them — click one to type its name into chat. Privacy note: with this
  toggle on, emote lists are fetched from those three services, which see
  the channel you're watching. Turn it off for zero third-party requests.
- **Chat performance tools (v4.1).** For busy chats: a line limit (cap how
  many messages stay on screen), message batching (reveal new messages in
  groups every N ms), and smooth scrolling (slide new messages in over N ms).
  All three default to off.
- **Chat filters (v4.2).** Highlight messages containing your keywords
  (tinted background + accent bar), and hide messages by word/phrase/`/regex/`
  or by user login — all managed on the Twitch page.
- **Alternating line shading & show deleted (v4.2, off by default).** Every
  second chat line gets a subtly different background, and moderator-deleted
  messages can stay readable struck-through (best-effort: only messages seen
  before deletion can be restored).
- **Emote tab-completion (v4.2).** Tab completes third-party emote names
  while typing (channel emotes first); Tab again cycles the matches. Twitch's
  own completion still handles native emotes and @mentions.
- **Clip download (v4.1).** Clip pages get a ⬇ Download button — clips are
  plain MP4s, so they save directly.
- **Hide the front-page carousel.** Removes the auto-playing featured stream
  at the top of twitch.tv and pauses its video so it stops using bandwidth.
- **Hide chat.** Visual-only: the column is hidden with CSS but stays in the
  DOM, so channel points keep accruing and auto-claim keeps working. Pop-out
  chat still works if you want chat in its own window.
- **Clip helper.** Create a clip with Twitch's own Clip button (or Alt+X)
  and publish it; the **➤ Share clip** button on the player then pastes the
  clip link into chat and sends it.
- **Pin source quality.** New streams start at the highest available quality
  instead of "Auto" (uses Twitch's own quality preference keys, so there is
  no flicker or menu clicking).
- **In-player volume boost (v4.1.2).** Same as the YouTube side: a 100–500%
  slider appears inline next to Twitch's volume control once volume sits at
  100%, boosting through a Web Audio gain node.
- **⚙ quick settings (v4.1.2).** A gear button on the player opens the
  extension's Twitch manager page directly.
- **Audio compressor (v4.2).** A 🎚 Comp button on the player levels out
  quiet talkers and loud game audio (FrankerFaceZ-style dynamics compressor).
  Its state is remembered.
- **Screenshot (v4.2).** A 📷 button on the player saves the current frame
  as a PNG.
- **Speed hotkeys on VODs & clips (v4.2).** **[** / **]** step the speed,
  **\\** resets. Live streams are never touched.
- **Stream uptime (v4.2).** A ⏱ chip next to the viewer count shows how long
  the stream has been live — read from the page itself, no extra requests
  (best-effort).
- **Sidebar hover previews (v4.2).** Hovering a live channel in the left
  sidebar shows its current stream thumbnail (one image from Twitch's own
  preview CDN per hover, nothing else).
- **Hide extension overlays.** Optionally removes streamer-installed extension
  panels, the overlay dock, and their notifications from the player.

- **Cinema mode (v4.1, both sites).** A ◐ button on the YouTube and Twitch
  players darkens everything around the video. Esc or clicking the dark area
  exits.

Twitch support covers desktop `www.twitch.tv` and, from v4.1, the block
lists and auto-claiming also run on the mobile site (`m.twitch.tv`) used by
Firefox for Android. Player tools (clip helper, cinema, quality pin) and the
chat engine are desktop-only, since the mobile site has a different player
and chat.

Works on desktop YouTube (`www.youtube.com`) and, from v3.9.0, on
**Firefox for Android** (`m.youtube.com`) from the same listing. On Android
there is no right-click: block channels from a video's **⋮ menu** (injected
**Block channel** item) or by hand in the popup/options; the Shorts tab in the
bottom bar, Shorts shelves, watched videos, and blocked channels are all
handled the same as on desktop. Desktop-only niceties (wheel volume,
Ctrl + right-click hide, context-menu entries) simply don't apply on mobile.

## Install

**[Get it on addons.mozilla.org](https://addons.mozilla.org/firefox/addon/youtube-twitch-enhancer/)**
(Firefox desktop and Android, same listing). For development:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and select [`manifest.json`](manifest.json).
3. Open (or reload) any YouTube tab.

Temporary add-ons are removed when Firefox restarts. For a permanent install,
sign via [addons.mozilla.org/developers](https://addons.mozilla.org/developers/)
(`web-ext sign`).

### Automated checks

The regression suite has no npm dependencies and runs on Node.js:

```sh
# PowerShell
$tests = Get-ChildItem tests -Filter *.test.js | ForEach-Object { $_.FullName }
node --test --test-isolation=none $tests

# bash/zsh
node --test --test-isolation=none tests/*.test.js
```

It exercises a synthetic 600-card channel, continuation appends, renderer
recycling and late hydration, every primary tile-filter reason, suppression of
redundant full scans (including legacy shelf insertion handling), identity-safe
DeArrow replacement across recycled tiles and watch-page SPA navigation,
watched-history and Undo-operation sharding, failed
reads/writes with autonomous recovery, simultaneous-tab convergence, distributed
clears and reset re-entry, stale loaders, late stale-generation writes, metadata
repair, live operation migration, and Undo against in-flight snapshots.

The added suites also cover chord parsing/conflicts/editable targets, profile
normalization and rule precedence, transcript/chapter parsing, collection
JSON/CSV round trips and filtering, Twitch recovery/quality/live-delay helpers,
600-card dirty-subtree processing and recycled sidebar identities, overlay and
diagnostics normalization, settings import/undo helpers, and popup ARIA/keyboard
relationships. JavaScript syntax, `manifest.json`, referenced assets, and
`git diff --check` are part of release verification in
[`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).
## Usage

### Block a channel

- **From the ⋮ menu (recommended):** open a video's three-dot menu and click
  the injected **Block channel** item.
- **From a video:** right-click any tile → **Block this YouTube channel**.
- **From a channel's page:** right-click anywhere → **Block this YouTube channel**.
- **By hand:** popup or **⚙ Advanced…** → type `@handle`, channel URL,
  `UC…` ID, or display name → **Block**.

### Hide a single video

Right-click the tile → **Hide this video**, or **Ctrl + right-click** to hide
instantly (also works on the in-player end-screen video wall).

### Keywords

Options page → **Blocked title keywords** → add words, phrases, or
`/patterns/` — matching titles are hidden wherever they appear.

### Import / export / sync

| Button / toggle | What it does |
| --- | --- |
| **Export to file** | Downloads `youtube-blocklist-YYYY-MM-DD.json`. |
| **Import from file** | Merges into your current list (no duplicates; settings only change if present in the file). |
| **Copy JSON** | Copies the whole block list to the clipboard. |
| **Clear everything** | Removes all blocked channels, hidden videos and keywords (keeps settings). |
| **Firefox Sync** | Mirrors the block lists (not settings) to your Firefox account. |

### Console helpers (on any YouTube page)

| Command | What it does |
| --- | --- |
| `ytsbListHidden()` | Array of hidden video IDs. |
| `ytsbListChannels()` | Array of blocked-channel records. |
| `ytsbUnhide("VIDEO_ID")` | Removes one video ID. |
| `ytsbResetHidden()` | Clears all hidden video IDs. |

## Privacy

Core filtering, lists, profiles, collections, bindings, diagnostics, and undo
history use extension storage and require no enhancer account. The project has
**no custom hosted backend**. Supported block lists use
`browser.storage.sync` only when Firefox Sync is explicitly enabled. The
manifest declares `data_collection_permissions: none`.

Network-backed features are labelled in the UI:

- The **third-party emotes** toggle (Twitch, on by default, easily turned
  off) fetches emote lists from the public BetterTTV, FrankerFaceZ and 7TV
  APIs and loads emote images from their CDNs — the add-on holds host
  permissions for those three API domains because Twitch's page security
  policy would otherwise block the requests. Those services see the numeric
  ID of the Twitch channel you're watching and your IP, the same as if you
  used their own extensions.
- The **community data** features (v4.3, all off by default) query
  SponsorBlock/DeArrow (sponsor.ajay.app) and Return YouTube Dislike.
  SponsorBlock lookups send only a hashed video-ID prefix (k-anonymity);
  DeArrow and RYD lookups send the video ID. These requests are made from
  the extension's background page, not the YouTube tab. Submitting or
  voting on a SponsorBlock segment (always a deliberate click) additionally
  sends the exact video ID, the segment timestamps and your local
  SponsorBlock user ID.
- **Sidebar hover previews** (Twitch, v4.2) load one thumbnail per hover
  from Twitch's own CDN.

The new transcript, collections, player recovery, sidebar groups, chat overlay,
profiles, input actions, diagnostics, presets, import/export, and undo features
make no external request. Normal media, navigation, chat, thumbnails, and other
YouTube/Twitch page traffic remains traffic to those sites. With the labelled
public integrations and Firefox Sync disabled, the enhancer adds no third-party
request.

## Local data, permissions, and DOM resilience

New data stays in the existing local `data` record:

- `inputBindings`, `playbackProfiles`, `activePlaybackProfiles`, and
  `channelPlaybackProfiles` hold shared controls and profile assignments.
- `ytCollections` and `twitchSidebar` hold bounded local organisation data.
- `settingsPresets`, `recentActions`, and `hiddenVideoMetadata` hold bounded
  settings snapshots, reversible list changes, and metadata for newly hidden
  videos. Old ID-only hidden-video records remain valid.
- `twitchPlayer`, `twitchChatOverlay`, and `twitchDiagnostics` contain bounded
  preferences and redacted recovery state. Diagnostics never contain URLs,
  channel/video identities, titles, transcript/chat text, or tokens.

Optional Firefox Sync remains quota-aware: collections/sidebar membership is
capped before it joins the existing supported list payload. Watched history,
profiles, settings, diagnostics, and recent actions are not synced by this
feature. JSON backups cover the new models; collections also support CSV.

No permission was added for these features. `storage` and `unlimitedStorage`
hold local configuration/history, `contextMenus` provides the existing page
menus, YouTube/Twitch host access runs the content scripts, and the BTTV/FFZ/7TV
hosts support the labelled third-party emote integration.

Twitch selectors prefer stable `data-a-target`, `data-test-selector`, roles,
media state, and channel/category URLs. A few old Twitch surfaces still expose
only text/class fallbacks: the English “Rerun” badge, legacy inventory “Claim”
links, older claim/moment/clip ARIA labels, and deleted-message notices. Each
fallback is scoped to the relevant card/callout/player/chat container. If Twitch
localises or removes it, that optional enhancement fails closed (the item stays
visible, is not clicked, or is not restored); native Twitch behaviour continues.
Player recovery itself does not classify errors by translated text.
## How it works

- **`src/content.js`** runs at `document_start`. A static startup gate keeps
  card geometry in place while settings and watched history load, with a
  three-second fail-open if initialization cannot finish. After boot, a
  page-level observer handles inserts and recycled `href`s; scoped card/comment
  observers handle relevant progress `style`, title, badge, thumbnail `src`, and
  text hydration. Each mutation batch is canonicalized and deduplicated before
  classification, while legacy shelf filters search only newly inserted
  subtrees, so tile-only work does not queue a second full-page scan. Unrelated
  page/player work uses a trailing debounce, and a 10 s pass remains as recovery.
  Cache
  entries include the filter generation, route, channel attribution, video ID,
  and last decision, so recycled renderers are re-evaluated and stripped managed
  classes can be repaired cheaply. Matches are hidden in place (CSS), rather
  than removed from Polymer's DOM, which keeps audit mode, layout, and Undo
  reliable. Optional SponsorBlock/DeArrow tile lookups use a persistent queue
  capped at six concurrent requests per service. Decorations are tied to video
  identity, so virtualized cards cannot keep the previous video's badge, title,
  or thumbnail; SponsorBlock category changes invalidate dependent badge results.
- **`src/watched-db.js`** keeps watched IDs and watched Undo operations in 64
  matching in-memory/storage shards for constant-time card lookups and bounded
  writes. Quiet-window batching, bounded write latency, write retry, autonomous
  startup-read backoff, and background flushes keep persistence outside the
  filtering hot path. Generation-tagged clears propagate across tabs;
  stale-generation key
  overwrites and stale counts are detected and repaired. Timestamped
  remove/restore operations make Undo deterministic across tabs, and the prior
  monolithic operation record migrates automatically.
- **`src/twitch.js`** runs at `document_start` and keeps card filtering on an
  identity-cached dirty-subtree path. Initial 600-card loads, continuation
  inserts, hydration, and recycled nodes are classified without a recurring
  full-page article scan; a bounded shell-recovery queue handles missed
  hydration. Claims/chat/player utilities keep their existing scoped passes.
- **`src/twitch-experience.js`** owns bounded recovery, live delay/edge, the
  local sidebar projection/manager, and reversible chat overlay. It reads only
  rendered Twitch state/media ranges and stores bounded local preferences and
  redacted recovery state.
- **`src/player-controls.js`** supplies the common input-action and playback
  profile runtime on both sites. **`src/youtube-workspace.js`** supplies the
  rendered-transcript/chapter dock and local subscription collections.- **`src/background.js`** registers the right-click menu, opens the onboarding
  page on first install, and mirrors block lists to Firefox Sync (chunked to
  fit `storage.sync` quotas) when enabled.
- **`src/popup.*`** and **`src/options.*`** share storage helpers in
  **`src/common.js`**; state lives under one `data` key and syncs across
  contexts via `storage.onChanged`.
- Content-script instances are tagged with a per-load id and hand over via a
  takeover event, so in-place add-on updates never leave orphaned handlers
  fighting the new version.

## Project layout

```
manifest.json
icons/icon.svg
src/
  content.js     content.css    — incremental on-page engine (YouTube)
  watched-db.js                 — sharded local watched-history store
  twitch.js      twitch.css     — the on-page engine (Twitch)
  background.js                 — context menus, onboarding, Firefox Sync
  common.js                     — shared storage/import/export helpers
  feature-core.js               — bounded shared models and pure helpers
  player-controls.js/.css       — common actions and playback profiles
  youtube-workspace.js/.css     — transcript/chapters and collections
  twitch-experience.js/.css     — recovery, sidebar tools, chat overlay
  settings-enhancements.js/.css — navigation, editors, safety and diagnostics
  popup.html     popup.js       — toolbar popup (YouTube + Twitch panels)
  options.html   options.js     — full manager (YouTube)
  twitch-options.html/.js       — full manager (Twitch)
  onboarding.html               — first-run guide
  ui.css                        — shared popup/options styling
tests/
  content-filter.test.js        — 600-card/incremental DOM regression harness
  watched-db.test.js            — storage, retry, and cross-tab regression tests
  feature-core.test.js           — controls/profiles/collections/schema helpers
  player-controls.test.js        — configurable action runtime
  youtube-workspace.test.js      — transcript/chapter/collection helpers
  twitch-experience.test.js      — recovery/sidebar/overlay/incremental helpers
  settings-enhancements.test.js  — search/import/rules/undo/privacy helpers
  ui-accessibility.test.js       — popup/settings/onboarding accessibility
```

## Troubleshooting

- **A feature stopped applying.** Check the master switch for that site in the
  popup, then the per-site feature toggles at the top of the settings page.
  In Basic view some sections are hidden; switch to Advanced or use the
  settings search, which always reveals matches.
- **Custom shortcuts do not fire.** Bindings are ignored while typing in any
  field, and the editor rejects conflicting or browser-reserved chords, so a
  binding that never saved never fires. Confirm "Enable custom actions" is on
  for that site. The legacy `[`, `]`, and `\` speed keys only take over while
  custom actions are disabled.
- **Twitch keeps retrying playback.** The retry counter button on the player
  cancels the current recovery run; attempts are always bounded. Turn off
  "Bounded player recovery" in Twitch settings to disable the feature.
- **The chat overlay vanished after navigating.** Twitch rebuilt the page, so
  the extension returned chat to its native place rather than risk breaking
  it. Toggle the overlay again from the player controls.
- **Controls look duplicated or orphaned after an update.** The newest
  extension instance retires the old one automatically; reload the tab if a
  leftover control persists.
- **Something looks wrong and you want to report it.** Copy the redacted
  diagnostics from the settings page (no URLs, titles, identities, or message
  text) and include them in the issue. Destructive list changes can be undone
  from the same section for seven days, and every reset offers a backup
  download first.

## Support

Enjoying it? [Buy me a coffee on Ko-fi](https://ko-fi.com/carcer7378) ♥

## License

[MIT](LICENSE)
