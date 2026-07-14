/* ==================================================================
 * YouTube/Twitch Enhancer — watched-video database
 *
 * A dedicated persistence layer for "have I watched this video?",
 * independent of YouTube's flaky thumbnail progress bar. The set is
 * cached in memory for O(1) lookups during DOM scans and written back
 * to browser.storage.local in debounced batches, so a full-page tile
 * scan never touches storage.
 *
 * Storage layout — all keys live OUTSIDE the shared "data" record, so the
 * Firefox-Sync mirror in background.js never tries to push this (it can be
 * enormous, sync has an 8KB/item quota):
 *   ytbWatchedMeta        { v, shards, count }   — lets the options page
 *                                                  show the count without
 *                                                  loading the whole set
 *   ytbWatchedShard0..N   arrays of 11-char video IDs, bucketed by a cheap
 *                         hash so adding one ID only rewrites one bucket —
 *                         keeps each write small even at millions of rows
 *   ytbWatchedChannels    { key: { name, handle, channelId, total, ids[] } }
 *                         per-channel watched records for the "Watched X/Y"
 *                         badge on channel pages
 *
 * Exposed as `YTBWatchedDB` on the shared content-script global (and on the
 * options page's window). All storage access is confined to this file — the
 * rest of the extension calls the API below and never touches these keys.
 * ================================================================== */
(function () {
    'use strict';

    const api = (typeof browser !== 'undefined') ? browser : chrome;

    // 64 buckets: at N watched videos each dirty write is ~N/64 of the data,
    // and loading reads all 64 keys in a single storage.get. More buckets =
    // smaller writes but a longer key list; 64 is a good middle ground.
    const SHARD_COUNT = 64;
    const META_KEY = 'ytbWatchedMeta';
    const SHARD_PREFIX = 'ytbWatchedShard';
    const CHANNELS_KEY = 'ytbWatchedChannels';
    const FLUSH_DELAY = 1500;              // coalesce bursts of marks into one write
    const MAX_CHANNEL_IDS = 200000;        // per-channel safety bound

    /* ---- in-memory state ---- */
    const shards = new Array(SHARD_COUNT); // Array<Set<string>>
    for (let i = 0; i < SHARD_COUNT; i++) shards[i] = new Set();
    let channels = {};                     // key -> { name, handle, channelId, total, ids:Set }
    let totalCount = 0;
    let loaded = false;
    let loadingPromise = null;
    const dirtyShards = new Set();
    let channelsDirty = false;
    let flushTimer = null;
    let selfWriting = false;               // ignore our own storage.onChanged echoes

    /* ---- helpers ---- */
    // djb2 string hash → bucket index. Cheap and well-distributed for IDs.
    function shardOf(id) {
        let h = 5381;
        for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
        return (h & 0x7fffffff) % SHARD_COUNT;
    }

    function shardKey(i) { return SHARD_PREFIX + i; }

    // Stable identity for a channel record. Prefers @handle, then UC id, then
    // display name — mirrors the content script's channelSpeedKey convention.
    function channelKey(info) {
        if (!info) return null;
        if (info.handle) return '@' + info.handle.toLowerCase();
        if (info.channelId) return info.channelId;
        if (info.name) return 'name:' + info.name.toLowerCase().trim();
        return null;
    }

    async function ensureLoaded() {
        if (loaded) return;
        if (loadingPromise) return loadingPromise;
        loadingPromise = (async () => {
            try {
                const keys = [META_KEY, CHANNELS_KEY];
                for (let i = 0; i < SHARD_COUNT; i++) keys.push(shardKey(i));
                const got = await api.storage.local.get(keys);
                totalCount = 0;
                for (let i = 0; i < SHARD_COUNT; i++) {
                    const arr = got[shardKey(i)];
                    if (!Array.isArray(arr)) continue;
                    const s = shards[i];
                    for (const id of arr) if (typeof id === 'string' && id) s.add(id);
                    totalCount += s.size;
                }
                const ch = got[CHANNELS_KEY];
                channels = {};
                if (ch && typeof ch === 'object') {
                    for (const k of Object.keys(ch)) {
                        const rec = ch[k] || {};
                        channels[k] = {
                            name: rec.name || '',
                            handle: rec.handle || '',
                            channelId: rec.channelId || '',
                            total: (typeof rec.total === 'number' && rec.total >= 0) ? rec.total : null,
                            ids: new Set(Array.isArray(rec.ids) ? rec.ids : []),
                            hidden: new Set(Array.isArray(rec.hidden) ? rec.hidden : [])
                        };
                    }
                }
            } catch (e) {
                /* start empty on any read error */
            }
            loaded = true;
        })();
        return loadingPromise;
    }

    function scheduleFlush() {
        if (flushTimer) return;
        flushTimer = setTimeout(() => { flushTimer = null; flush().catch(() => {}); }, FLUSH_DELAY);
    }

    async function flush() {
        if (!dirtyShards.size && !channelsDirty) return;
        const items = {};
        for (const i of dirtyShards) items[shardKey(i)] = [...shards[i]];
        dirtyShards.clear();
        if (channelsDirty) {
            const out = {};
            for (const k of Object.keys(channels)) {
                const rec = channels[k];
                out[k] = {
                    name: rec.name, handle: rec.handle, channelId: rec.channelId,
                    total: rec.total, ids: [...rec.ids], hidden: [...rec.hidden]
                };
            }
            items[CHANNELS_KEY] = out;
            channelsDirty = false;
        }
        items[META_KEY] = { v: 1, shards: SHARD_COUNT, count: totalCount };
        try {
            selfWriting = true;
            await api.storage.local.set(items);
        } finally {
            selfWriting = false;
        }
    }

    /* ================= public API: watched set ================= */
    function isWatched(id) {
        return !!id && shards[shardOf(id)].has(id);
    }

    // Returns true if the ID was newly added (false if already present).
    function markWatched(id) {
        if (!id || typeof id !== 'string') return false;
        const idx = shardOf(id);
        const s = shards[idx];
        if (s.has(id)) return false;
        s.add(id);
        totalCount++;
        dirtyShards.add(idx);
        scheduleFlush();
        return true;
    }

    function remove(id) {
        if (!id) return false;
        const idx = shardOf(id);
        if (!shards[idx].delete(id)) return false;
        totalCount--;
        dirtyShards.add(idx);
        for (const k of Object.keys(channels)) {
            if (channels[k].ids.delete(id)) channelsDirty = true;
        }
        scheduleFlush();
        return true;
    }

    function count() { return totalCount; }

    /* ================= public API: channel records ================= */
    function ensureChannelRec(info) {
        const key = channelKey(info);
        if (!key) return null;
        let rec = channels[key];
        if (!rec) {
            rec = channels[key] = {
                name: info.name || '', handle: info.handle || '',
                channelId: info.channelId || '', total: null, ids: new Set(), hidden: new Set()
            };
            channelsDirty = true;
        } else {
            // Learn identifiers we didn't have when the record was created.
            if (info.handle && !rec.handle) { rec.handle = info.handle; channelsDirty = true; }
            if (info.channelId && !rec.channelId) { rec.channelId = info.channelId; channelsDirty = true; }
            if (info.name && !rec.name) { rec.name = info.name; channelsDirty = true; }
        }
        return rec;
    }

    // Attribute a watched video to a channel (the numerator of the badge).
    function recordChannelVideo(info, id) {
        if (!id) return;
        const rec = ensureChannelRec(info);
        if (!rec || rec.ids.size >= MAX_CHANNEL_IDS || rec.ids.has(id)) return;
        rec.ids.add(id);
        channelsDirty = true;
        scheduleFlush();
    }

    // Attribute a manually-hidden video to a channel (the "Hidden N" counter).
    // Kept separate from the watched tally so the two are counted independently.
    function recordChannelHidden(info, id) {
        if (!id) return;
        const rec = ensureChannelRec(info);
        if (!rec || rec.hidden.size >= MAX_CHANNEL_IDS || rec.hidden.has(id)) return;
        rec.hidden.add(id);
        channelsDirty = true;
        scheduleFlush();
    }

    // Drop a video from every channel's hidden tally (used when a hide is undone).
    function removeHidden(id) {
        if (!id) return;
        let changed = false;
        for (const k of Object.keys(channels)) {
            if (channels[k].hidden.delete(id)) changed = true;
        }
        if (changed) { channelsDirty = true; scheduleFlush(); }
    }

    // Record the channel's total video count (scraped from the channel page).
    function setChannelTotal(info, total) {
        if (!(total >= 0)) return;
        const rec = ensureChannelRec(info);
        if (!rec || rec.total === total) return;
        rec.total = total;
        channelsDirty = true;
        scheduleFlush();
    }

    function getChannelStats(info) {
        const key = channelKey(info);
        if (!key) return null;
        const rec = channels[key];
        return rec
            ? { watched: rec.ids.size, total: rec.total, hidden: rec.hidden.size }
            : { watched: 0, total: null, hidden: 0 };
    }

    /* ================= public API: import / export / clear ================= */
    function exportData() {
        const ids = [];
        for (let i = 0; i < SHARD_COUNT; i++) for (const id of shards[i]) ids.push(id);
        const chOut = {};
        for (const k of Object.keys(channels)) {
            const rec = channels[k];
            chOut[k] = {
                name: rec.name, handle: rec.handle, channelId: rec.channelId,
                total: rec.total, ids: [...rec.ids], hidden: [...rec.hidden]
            };
        }
        return { type: 'ytb-watched', version: 1, count: ids.length, ids, channels: chOut };
    }

    // Merge watched IDs from a bare array, or from an object shaped like the
    // export ({ ids:[...], channels:{...} }) or { watched:[...] }. Duplicates
    // are ignored. Returns the number of newly-added video IDs.
    function importData(data) {
        let list = [];
        let chIn = null;
        if (Array.isArray(data)) {
            list = data;
        } else if (data && typeof data === 'object') {
            if (Array.isArray(data.ids)) list = data.ids;
            else if (Array.isArray(data.watched)) list = data.watched;
            if (data.channels && typeof data.channels === 'object') chIn = data.channels;
        }
        let added = 0;
        for (const id of list) if (typeof id === 'string' && id && markWatched(id)) added++;
        if (chIn) {
            for (const k of Object.keys(chIn)) {
                const rec = chIn[k] || {};
                const target = ensureChannelRec({
                    handle: rec.handle, channelId: rec.channelId, name: rec.name
                });
                if (!target) continue;
                if (rec.total >= 0 && (target.total == null || rec.total > target.total)) {
                    target.total = rec.total;
                    channelsDirty = true;
                }
                if (Array.isArray(rec.ids)) {
                    for (const id of rec.ids) {
                        if (typeof id === 'string' && id && !target.ids.has(id)) {
                            target.ids.add(id);
                            channelsDirty = true;
                        }
                    }
                }
                if (Array.isArray(rec.hidden)) {
                    for (const id of rec.hidden) {
                        if (typeof id === 'string' && id && !target.hidden.has(id)) {
                            target.hidden.add(id);
                            channelsDirty = true;
                        }
                    }
                }
            }
        }
        if (added || channelsDirty) scheduleFlush();
        return added;
    }

    async function clear() {
        for (let i = 0; i < SHARD_COUNT; i++) shards[i] = new Set();
        channels = {};
        totalCount = 0;
        dirtyShards.clear();
        channelsDirty = false;
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        const keys = [META_KEY, CHANNELS_KEY];
        for (let i = 0; i < SHARD_COUNT; i++) keys.push(shardKey(i));
        try {
            selfWriting = true;
            await api.storage.local.remove(keys);
        } finally {
            selfWriting = false;
        }
    }

    // Read just the persisted count without loading the whole set — used by
    // the options page so opening it doesn't pull millions of IDs into memory.
    async function getStoredCount() {
        try {
            const r = await api.storage.local.get(META_KEY);
            return (r[META_KEY] && r[META_KEY].count) || 0;
        } catch (e) {
            return 0;
        }
    }

    // Cross-tab convergence: union in whatever another tab persisted. This is
    // a cheap, idempotent merge (re-adding known IDs is a no-op); it ignores
    // removals, which are rare and not worth reconciling here.
    api.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || selfWriting || !loaded) return;
        for (let i = 0; i < SHARD_COUNT; i++) {
            const c = changes[shardKey(i)];
            if (!c || !Array.isArray(c.newValue)) continue;
            const s = shards[i];
            for (const id of c.newValue) if (typeof id === 'string' && id && !s.has(id)) { s.add(id); totalCount++; }
        }
        const cc = changes[CHANNELS_KEY];
        if (cc && cc.newValue && typeof cc.newValue === 'object') {
            for (const k of Object.keys(cc.newValue)) {
                const rec = cc.newValue[k] || {};
                const cur = channels[k];
                if (!cur) {
                    channels[k] = {
                        name: rec.name || '', handle: rec.handle || '',
                        channelId: rec.channelId || '',
                        total: (typeof rec.total === 'number' && rec.total >= 0) ? rec.total : null,
                        ids: new Set(Array.isArray(rec.ids) ? rec.ids : []),
                        hidden: new Set(Array.isArray(rec.hidden) ? rec.hidden : [])
                    };
                } else {
                    if (typeof rec.total === 'number' && rec.total >= 0) cur.total = rec.total;
                    if (Array.isArray(rec.ids)) for (const id of rec.ids) cur.ids.add(id);
                    if (Array.isArray(rec.hidden)) for (const id of rec.hidden) cur.hidden.add(id);
                }
            }
        }
    });

    const YTBWatchedDB = {
        whenReady: ensureLoaded,
        isWatched, markWatched, remove, count,
        recordChannelVideo, recordChannelHidden, removeHidden,
        setChannelTotal, getChannelStats,
        export: exportData, import: importData, clear,
        getStoredCount, flush
    };

    // Share on the content-script global (all content-script files for a frame
    // run in one scope) and on window (options page).
    const g = (typeof self !== 'undefined') ? self
        : (typeof window !== 'undefined') ? window : this;
    g.YTBWatchedDB = YTBWatchedDB;
})();
