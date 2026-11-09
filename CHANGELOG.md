# Changelog

## 4.8.13 - 2026-11-09

### Fixed

- The speed suite sped up live streams. The default playback speed, a remembered per-channel speed and a playback profile's speed are meant to skip live streams, because a sped-up live stream races to the live edge and stalls. The live check looked for a `ytp-live` class on YouTube's player (`#movie_player`), which YouTube no longer sets, so every live stream counted as a normal video. Playback profiles had never checked for YouTube live streams at all, only Twitch ones. Both now ask YouTube's player API whether the video is live, and trust the answer only once the player is on the video in the address bar: after an in-page navigation the address changes about 150 ms before the player leaves the previous video, and until then the answer still describes that video. Without the player API they fall back to the `ytp-live` switch YouTube now sets on the player's time display, and wait out a preroll ad, which clears it. A profile that still can't tell after 3 seconds applies everything except its speed.
- The same check kept live streams out of the watched history, so with "Hide already-watched videos" on, a live stream was recorded as watched as soon as it played: it reports a finite duration and plays near its end (at 93% of it on the stream checked), past the 90% threshold. Only a video confirmed as not live is recorded now.

### Validation

- Seen live on 2026-11-09 on Lofi Girl's live stream: `#movie_player` had no `ytp-live` class (it now sits on `.ytp-time-display`, and not while a preroll ad plays), `getVideoData().isLive` was `true` (also during the ads), and the video reported a finite 50390 s duration with playback at about 46790 s. Sampling an in-page navigation from the stream to a normal video every 25 ms, the address showed the new video about 140 ms before the player's `video_id` changed; until then the player, its time display and its live badge all still described the live stream.
- Checked end to end the same day in a throwaway headless Firefox 147 profile with the add-on installed temporarily, on that live stream and normal videos reached from its sidebar by in-page navigation. Before the fix (the 4.8.12 YouTube code), a 1.75x playback profile played the live stream at 1.75x, and a 1.5x default speed played it at 1.5x after going back to it from a normal video. With the fix the live stream stayed at 1x in all four cases (opened directly or by going back, default speed or profile), while the normal videos still got 1.5x and 1.75x. The watched-history part was not reproduced live; it follows from the 93% position above and has its own regression.
- Seven new regressions, four in `tests/content-filter.test.js` and three in `tests/player-controls.test.js`, cover the default speed, a profile's speed and the watched history on a live stream, the player's stale answer after navigation in both directions, the fallback without the player API (including a preroll ad), and a profile whose answer never arrives. All seven fail against 4.8.12. Full suite passes 141/141.

## 4.8.12 - 2026-11-07

### Added

- A "Rate it on Firefox Add-ons" link beside the existing Ko-fi link in the popup, both settings pages and the welcome page. It opens the add-on's AMO page in a new tab, and nothing is sent unless you click it.

### Fixed

- Channel points auto-claim announced "Claimed channel points" every 5 seconds while nothing was being claimed. It clicked Twitch's "Claim Bonus" button even while Twitch had it disabled (the grey chest), and it reported success on every click. Twitch disables that button until its claim request settles, and a claim can stay unsettled indefinitely: with `k.twitchcdn.net` blocked (for example by a DNS blocklist), Twitch's anti-bot script never loads, every claim is answered "failed integrity check", and the page waits for a check it cannot pass until it eventually drops the bonus uncredited. A disabled button is now left alone, and each click is followed to its outcome: "Claimed channel points" once Twitch removes the bonus, "Twitch couldn't claim the channel points bonus" after Twitch's error state, and one "Twitch hasn't confirmed the channel points claim" if the button stays disabled for 30 seconds.

### Validation

- Found live on 2026-11-07 on a channel page: the claim component's state was `inProgress: true` with the button disabled, and every ClaimCommunityPoints request returned HTTP 200 with `IntegrityCheckFailed`. Twitch's anti-bot script (`k.twitchcdn.net/…/p.js`) failed to load because the local DNS resolver answered 0.0.0.0, while a public resolver returned real addresses. When the page finally gave up, the bonus disappeared and the balance rose only by the regular watch-time points. The claim flow (disabled until settled, success removes the bonus, an error turns the button red and removes the bonus 2 s later) was read from Twitch's component source in that page. Four new regressions in `tests/twitch.test.js` cover a disabled button, the success notice waiting for the bonus to go, a rejected claim, and a claim that never settles; all four fail against 4.8.11. Full suite passes 134/134.

## 4.8.11 - 2026-11-04

### Fixed

- Disliking a video didn't change the Return YouTube Dislike count on the button: it stayed at the number fetched when the page loaded (for example 11, with the dislike button pressed). This add-on only reads counts from RYD and never sends votes, so RYD's count can never include yours. The shown count now adds one while your dislike is pressed, the same local +1 the official RYD extension shows, and drops it again when you take the dislike back or like the video instead. It updates the moment the button's pressed state changes, including on a count an earlier add-on instance wrote before a reload.

### Performance

- The one-time move of hidden-video details and undo history out of `data` (4.8.7) now checks `data` first and reads those two large keys only when there is something to move. On Firefox it runs once per browser session; the Chromium build, whose service worker restarts often, needed this most.

### Validation

- Seen live on 2026-11-04: on a disliked video the dislike button had `aria-pressed="true"` while the add-on's count still read RYD's 11. Two new regressions in `tests/content-filter.test.js` cover pressing and un-pressing the button and a count left by an earlier instance; both fail against 4.8.10. Full suite passes 130/130. The live check after reloading the add-on is still to do.

## 4.8.10 - 2026-11-04

### Fixed

- Auto max quality could leave a video at YouTube's automatic quality, which follows the player's size (so 720p in a 671-pixel-tall player), for the whole video. It set the quality once, as soon as the player listed any levels, and then treated that video as done. After an in-page navigation (clicking a video, or autoplay moving on) the player already reports the new video with its streams, but about 100 ms later it resets its preference to "auto" while it loads that video's formats, which undid the one attempt. Each pass now re-applies the highest level until the video plays at it (or five seconds have passed), skips an ad's streams and a player still on the previous video, and afterwards corrects only a fall back to "auto", so a quality you pick by hand is kept.

### Validation

- Reproduced live on 2026-11-04 in a background tab: after clicking a sidebar video, the player reported the new video at 2160p after about 0.86 s, had no levels and an "auto" preference at 0.97 s, and kept "auto" with all nine levels listed; setting 2160p again then held for the rest of the check. Two new regressions in `tests/content-filter.test.js` replay that sequence, a hand-picked quality, an ad, and a player still on the previous video; both fail against 4.8.9. Full suite passes 128/128.

## 4.8.9 - 2026-11-01

### Fixed

- The previous video's title could stay under the player in front of the current one ("HW News - OpenAI Says You Waste RAM…Rings of Power Returns to…"). YouTube draws that title through ShadyDOM, which, when the next video loads, removes only the text node it inserted itself. Text written any other way stays beside every later title: the add-on's own DeArrow or title-repair write, one left by an add-on copy that was removed, reinstalled or updated mid-video, and the original title put back when DeArrow titles is switched off. The old clean-up ran only while DeArrow titles was on, and it recognised its own text by markers that switching DeArrow off, or a fresh install, clears. Now any title text that YouTube's ShadyDOM does not own is removed once YouTube has rendered its own, whatever the DeArrow setting, on every pass and in the same observer turn that YouTube inserts the new title. If YouTube owns no title text, nothing is removed.

### Validation

- Found live on 2026-11-01 in a tab left open across a reinstall of the add-on: the heading held two text nodes, the previous title with no ShadyDOM data and the current title with it, there were no add-on markers anywhere on the page, and DeArrow titles was off. An SPA navigation in a background tab confirmed that YouTube replaces its own node cleanly. The shipped functions, extracted from `content.js` and run in the affected tab, removed only the stale node. Four new regressions in `tests/content-filter.test.js` cover the state found live, switching DeArrow off mid-video, a new add-on instance cleaning up an earlier instance's write, and the cases that must be left alone; the first three fail against 4.8.8. Full suite passes 126/126.

## 4.8.8 - 2026-11-01

### Fixed

- "Block this Twitch category" answered "Couldn't work out which category that is" for much of the page, because it only understood a right-click on a category link or inside a stream card's `<article>`. It now resolves the card you right-clicked, wherever on the card you clicked: a Browse page category card's tag pill (the "IRL" pill is a sibling button, not inside a link), box art or padding; the featured stream at the top of the home page; and sidebar cards, whose category is plain text and is matched by name against a category link on the page.
- On a channel page, right-clicking a sidebar card for a different channel blocked the category of the stream being watched. A right-click on any card now means that card's category, or nothing, and never falls through to the page's category. When a sidebar card's category has no link on the page, the toast says to block it from the channel page.
- Home-page shelf headings such as "Just Chatting & IRL" link to a Twitch collection, a curated mix of categories that the page never lists, not to a category. Right-clicking one (or blank space on a collection page) now explains that and points at the streams in it, which block their own categories (that collection draws on `just-chatting` and `irl`).
- Categories blocked from a home-page category shelf card were saved with the card's whole text as their name ("Just ChattingIRL266K live viewersUse the Right Arrow Key…"). The name now comes from the card's title.

### Validation

- Every target type was resolved by the shipped functions, extracted from `twitch.js` and run against the live home, Browse and collection pages: the collection heading and "Show all" report a collection, the "IRL" pill resolves to its Just Chatting card, shelf, stream and carousel cards resolve to their own category with a clean name, and an unlinked sidebar category returns only its name. New regressions in `tests/twitch.test.js` cover each case plus the fail-closed rule for a container naming two categories; five of the six fail on 4.8.7. Full suite passes 122/122.

## 4.8.7 — 2026-10-29

### Performance

- The two largest records no longer travel with every save. Hidden-video details (title, channel and thumbnail for up to 2,000 videos) and the undo history (up to 50 entries, each holding before/after snapshots of up to 12 KB) moved out of the shared `data` record into their own keys, `ytbHiddenVideoMeta` and `ytbRecentActions`. Every save to `data` (a volume-wheel change, a hide, a toggled setting) is delivered to every open YouTube and Twitch tab and the background page, and each re-processes it, so all of those copies shrink. The settings pages still work with one joined record and rewrite a separate key only when they changed it. Copies left inside `data` are moved once at startup, and any writer of a separate key folds in a copy an older version left behind.
- No wheel listener is attached unless a wheel shortcut is configured (none are by default), and then only on the player. Before, a document-wide, non-passive wheel listener made the browser wait on the add-on before every scroll on both sites, and each wheel event measured layout to find the player.
- Captions no longer trigger a full filtering pass about once a second. Caption text re-renders inside the player constantly and never affects filtering (measured on a captioned video: 14 full passes in 15 seconds).
- A YouTube tab in the background no longer re-runs the full pass every time a video is watched in another tab. It catches up once when shown, like the other work it already deferred.

### Fixed

- The Twitch uptime chip no longer tries the page's LD+JSON block first. Twitch's structured data stopped carrying the stream start (it is now an `@graph` ProfilePage without `publication`, verified live 2026-10), so that lookup always fell through to the Apollo cache, which still works.
- README: removed the link to the missing `IMPLEMENTATION_PLAN.md`, split two bullets that had run together, added the missing blank lines before headings, and documented the separate storage keys.

### Validation

- New regression tests cover the joined record pages see (split on save, an unchanged key not rewritten, change events from either key), the startup migration, sync rewrites leaving no empty placeholders in `data`, hidden-video details written by the YouTube tab (including two saves in a row, which now run one at a time so neither drops the other's details), the wheel listener's scope, caption mutations, and hidden-tab deferral. Each fails against 4.8.6 and passes now. The Twitch sidebar and YouTube collection undo writers are covered only through the shared merge helpers. Full suite passes 116/116. Not yet checked in a running Firefox.

## 4.8.6 — 2026-10-29

### Fixed

- YouTube search left an empty "Shorts" heading and a "Show more" button where each Shorts shelf had been. Search results now group Shorts in a generic `grid-shelf-view-model`, and only the Shorts inside it were hidden. A grid shelf that holds Shorts is now hidden whole, both before it paints and in the maintenance pass; grid shelves without Shorts stay.
- Blocked keywords matched channel names, view counts and upload ages on watch-page sidebar videos. On the compact lockups there, the metadata container's own class contains `lockupMetadataViewModelTitle` and comes first in document order, so the title lookup read the whole block ("…Level1 TechsGamers Nexus912K views4 days ago"). A keyword like "nexus" hid every video from that channel, and saved hidden-video titles were polluted the same way. The title is now looked up in priority tiers (classic renderers, the lockup heading's `title`, the title link, then any heading), and DeArrow's title target uses the same tiers.
- Third-party Twitch emotes could take minutes to appear, because one provider that never answered held back all of them. During testing, api.frankerfacez.com accepted connections and then hung for over 45 seconds while BTTV answered in 63 ms. Each lookup now gives up after 8 seconds, all six run at once, and each provider's emotes appear as soon as it answers, including in chat lines that already show another provider's emotes. Channel emotes still win over same-named globals, now in a fixed BTTV, 7TV, FFZ order.
- The drops auto-claim tab could close before claiming anything. Its 6-second close timer started on the script's first pass, before Twitch had rendered the inventory, so on a slow load nothing was claimed and the stream tab waited 15 minutes to try again. The tab now closes 6 seconds after its last claim, or after 30 seconds with nothing to claim (60 seconds at most), and never closes a tab you have switched to.
- Drop auto-claim only worked with Twitch in English. The inventory's "Claim Now" button has no stable attributes, so it is matched by its label, which is now recognised in every language Twitch's UI offers, using the strings from Twitch's own locale bundles. Translations of the bare word "Claim" are left out on purpose: in several languages Twitch uses the same word for "Redeem" or "Download". A dead styled-components class selector was removed.
- Playback profiles re-applied on every save to the extension's data, undoing manual changes. Pressing **]** and then scrolling the volume wheel snapped the speed back to the profile's speed half a second later. Hiding a video in another tab, changing an unrelated option, or a Twitch diagnostics update did the same, and also flipped caption and compressor toggles back. Profiles now re-apply only when a profile, the active profile or a channel rule changes. A profile's YouTube volume boost, which had only survived those saves because of the re-apply, is now kept for the session on its own.
- "Remember speed per channel" had stopped recording new speeds since 4.8.0. The configurable shortcuts, on by default, replaced the old **[** / **]** / **\\** handler, which was the only code that saved the speed. The shortcut handler now reports each speed change, and it is saved for the channel as before.
- DeArrow could show a replacement title after the community had voted for the original. The lookup took the first non-original submission, while DeArrow itself uses only the top-ranked one and keeps the original when that is the original or was voted down. Titles and thumbnails now follow DeArrow's rule.
- Right-click menu entries were missing after disabling and re-enabling the add-on, until the next browser restart. They are now built whenever the background page starts.
- Firefox Sync could fail for block lists with non-Latin names. Chunks were cut at 6,000 characters, but Firefox's 8,192-byte item limit counts the UTF-8 bytes of the stored JSON, where quotes take two bytes and CJK characters three, and a cut could split an emoji in half. Chunks are now cut by that byte measure and never inside a character.

### Validation

- Live-checked 2026-10-28 on youtube.com and twitch.tv, signed out: the search Shorts shelf (`grid-shelf-view-model` inside `ytd-item-section-renderer`), the compact sidebar lockup classes, and the FFZ hang. The claim labels come from all 30 Twitch locale bundles, and a script confirmed the list in `twitch.js` matches them exactly. The drops inventory needs a signed-in account, so the claim timing and labels are covered by tests rather than a live claim.
- New `tests/twitch.test.js` and `tests/background.test.js`, plus `tests/mini-dom.js`, a small DOM with a real selector engine for tests that depend on document order. Each new regression test fails against 4.8.5 and passes now. Full suite passes 108/108.

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
