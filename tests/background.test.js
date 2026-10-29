/* eslint-env node */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const read = name => fs.readFileSync(path.join(__dirname, '..', 'src', name), 'utf8');

// Loads the background page the way the manifest does (feature-core, common,
// background) against fake browser APIs. Nothing fires onInstalled/onStartup
// unless a test does, which is what a re-enabled add-on sees.
function loadBackground(options = {}) {
    const local = { data: options.data };
    const syncStore = {};
    const syncWrites = [];
    const menus = { removeAll: 0, created: [] };
    const listeners = { installed: [], startup: [], message: [] };
    const context = {
        console,
        URL,
        URLSearchParams,
        TextEncoder,
        Blob: global.Blob,
        crypto: globalThis.crypto,
        setTimeout: () => 0,
        clearTimeout() {},
        fetch: options.fetch || (async () => { throw new Error('offline'); }),
        browser: {
            runtime: {
                onInstalled: { addListener: fn => listeners.installed.push(fn) },
                onStartup: { addListener: fn => listeners.startup.push(fn) },
                onMessage: { addListener: fn => listeners.message.push(fn) },
                getManifest: () => ({ version: 'test' }),
                getURL: p => 'moz-extension://test/' + p,
                openOptionsPage() {}
            },
            contextMenus: {
                removeAll(callback) {
                    menus.removeAll++;
                    menus.created = [];
                    if (callback) callback();
                },
                create(item) { menus.created.push(item.id); },
                onClicked: { addListener() {} }
            },
            tabs: { create: async () => ({}), remove: async () => {}, sendMessage: async () => {} },
            storage: {
                local: {
                    async get(key) { return typeof key === 'string' ? { [key]: local[key] } : {}; },
                    async set(value) { Object.assign(local, value); }
                },
                sync: {
                    async get(keys) {
                        const list = typeof keys === 'string' ? [keys] : keys;
                        return Object.fromEntries(list.map(key => [key, syncStore[key]]));
                    },
                    async set(items) {
                        syncWrites.push(items);
                        Object.assign(syncStore, items);
                    },
                    async remove(keys) { [].concat(keys).forEach(key => delete syncStore[key]); }
                },
                onChanged: { addListener() {} }
            }
        }
    };
    context.chrome = context.browser;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(read('feature-core.js') + '\n' + read('common.js') + '\n' + read('background.js'), context);
    const message = msg => listeners.message[0](msg, {});
    return { menus, listeners, syncWrites, message };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('context menus exist as soon as the background page starts', () => {
    const bg = loadBackground();
    assert.equal(bg.menus.removeAll, 1);
    assert.ok(bg.menus.created.includes('ytb-block-channel'));
    assert.ok(bg.menus.created.includes('ytbtw-block-category'));
    assert.equal(bg.listeners.startup.length, 0, 'no second build on browser startup');
    bg.listeners.installed.forEach(fn => fn({ reason: 'update', previousVersion: '4.8.5' }));
    assert.equal(bg.menus.removeAll, 1, 'an update does not rebuild them twice');
});

test('DeArrow uses only the top-ranked submission, like DeArrow itself', async () => {
    const branding = {
        votedOriginal: {
            titles: [
                { title: 'Original title', original: true, votes: 4, locked: false },
                { title: 'Lower-ranked replacement', original: false, votes: 1, locked: false }
            ],
            thumbnails: [
                { timestamp: null, original: true, votes: 3, locked: false },
                { timestamp: 42, original: false, votes: 0, locked: false }
            ]
        },
        replaced: {
            titles: [{ title: 'Community >iPhone title', original: false, votes: 2, locked: false }],
            thumbnails: [{ timestamp: 12.5, original: false, votes: 0, locked: false }]
        },
        downvoted: {
            titles: [{ title: 'Downvoted', original: false, votes: -1, locked: false }],
            thumbnails: [{ timestamp: 3, original: false, votes: -2, locked: false }]
        },
        lockedDown: {
            titles: [{ title: 'Locked by a VIP', original: false, votes: -3, locked: true }],
            thumbnails: []
        }
    };
    const bg = loadBackground({
        fetch: async () => ({ ok: true, status: 200, json: async () => branding })
    });

    const votedOriginal = await bg.message({ action: 'ytb-de-branding', videoId: 'votedOriginal' });
    assert.equal(votedOriginal.title, null, 'the original title won the vote, so it stays');
    assert.equal(votedOriginal.thumbTime, null);

    const replaced = await bg.message({ action: 'ytb-de-branding', videoId: 'replaced' });
    assert.equal(replaced.title, 'Community iPhone title');
    assert.equal(replaced.thumbTime, 12.5);

    const downvoted = await bg.message({ action: 'ytb-de-branding', videoId: 'downvoted' });
    assert.equal(downvoted.title, null);
    assert.equal(downvoted.thumbTime, null);

    const lockedDown = await bg.message({ action: 'ytb-de-branding', videoId: 'lockedDown' });
    assert.equal(lockedDown.title, 'Locked by a VIP', 'a locked title wins regardless of votes');
});

// Firefox's per-item measure: key length + UTF-8 bytes of the JSON value.
const itemBytes = (key, value) => Buffer.byteLength(key) + Buffer.byteLength(JSON.stringify(value));

test('sync chunks stay inside the per-item quota for non-Latin lists', async () => {
    const channels = Array.from({ length: 300 }, (_, i) => ({
        name: 'ゲーム実況チャンネル「最強の" ' + i + '」🎮 公式アーカイブとライブ配信の記録',
        handle: 'gamech' + i,
        channelId: 'UC' + String(i).padStart(22, '0'),
        addedAt: 1700000000000
    }));
    const bg = loadBackground({
        data: {
            settings: { syncBlockLists: true },
            blockedChannels: channels,
            blockedKeywords: ['"quoted" \\ backslash', 'ключевое слово', '关键词']
        }
    });
    await flush();
    await flush();

    const write = bg.syncWrites.find(items => items.ytbSyncMeta);
    assert.ok(write, 'the startup merge pushed to sync');
    const keys = Object.keys(write).filter(key => key.startsWith('ytbSyncChunk'));
    assert.equal(keys.length, write.ytbSyncMeta.chunks);
    let joined = '';
    keys.forEach((key, i) => {
        const chunk = write['ytbSyncChunk' + i];
        assert.ok(itemBytes(key, chunk) <= 8192, key + ' is ' + itemBytes(key, chunk) + ' bytes');
        assert.ok(!/[\ud800-\udbff]$/.test(chunk), key + ' ends inside a surrogate pair');
        joined += chunk;
    });
    const lists = JSON.parse(joined);
    assert.equal(lists.blockedChannels.length, 300);
    assert.equal(lists.blockedChannels[7].name, channels[7].name);
});
