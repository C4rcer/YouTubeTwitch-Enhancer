/* eslint-env node */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { NodeFilter, h, createDocument } = require('./mini-dom');

const TWITCH_PATH = path.join(__dirname, '..', 'src', 'twitch.js');

// Loads twitch.js without init(): no storage load, observers or intervals.
// Time is manual: advance() moves Date.now() and runs due timers.
function loadTwitch(options = {}) {
    const document = createDocument(...(options.body || []));
    document.hidden = options.hidden !== false;
    const sent = [];
    const clock = { now: 1700000000000 };
    const timers = new Map();
    let timerId = 0;
    const context = {
        console,
        URL,
        URLSearchParams,
        NodeFilter,
        document,
        location: {
            hostname: 'www.twitch.tv',
            pathname: options.pathname || '/drops/inventory',
            hash: '#ytbtw-autoclaim',
            search: '',
            href: 'https://www.twitch.tv' + (options.pathname || '/drops/inventory') + '#ytbtw-autoclaim'
        },
        browser: {
            runtime: {
                onMessage: { addListener() {} },
                sendMessage: async message => { sent.push(message); },
                getURL: p => 'moz-extension://test/' + p
            },
            storage: {
                local: { get: async () => ({}), set: async () => {} },
                onChanged: { addListener() {}, removeListener() {} }
            }
        },
        fetch: options.fetch || (() => new Promise(() => {})),
        CustomEvent: class CustomEvent {
            constructor(type, init) { this.type = type; this.detail = init && init.detail; }
        },
        MutationObserver: class MutationObserver { observe() {} disconnect() {} },
        Date: class FakeDate extends Date {
            static now() { return clock.now; }
        },
        setTimeout(fn, ms) {
            timers.set(++timerId, { fn, at: clock.now + (ms || 0) });
            return timerId;
        },
        clearTimeout(id) { timers.delete(id); },
        setInterval: () => 0,
        clearInterval() {},
        requestAnimationFrame() {}
    };
    context.window = context;
    context.self = context;

    let source = fs.readFileSync(TWITCH_PATH, 'utf8');
    const hook = `
    self.__YTBTW_TEST__ = {
        isDropClaimLabel,
        claimInventoryHere,
        autoClaimDrops,
        maybeFetchEmotes,
        configure(input) { settings = Object.assign({}, DEFAULT_SETTINGS, input); },
        // What init() does for a tab opened at #ytbtw-autoclaim.
        armInventoryClose() { inventoryArmedAt = Date.now(); },
        setChat(container) { chatContainer = container; },
        emotes() { return emoteMap; },
        emoteRound() { return { inFlight: emoteFetchInFlight, loaded: emoteGlobalsLoaded }; }
    };
`;
    const marker = /    init\(\);\r?\n\}\)\(\);\s*$/;
    assert.match(source, marker, 'twitch test hook marker must stay stable');
    source = source.replace(marker, hook + '})();');
    vm.createContext(context);
    vm.runInContext(source, context, { filename: TWITCH_PATH });

    function advance(ms) {
        const until = clock.now + ms;
        for (;;) {
            const due = [...timers].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
            if (!due) break;
            timers.delete(due[0]);
            clock.now = Math.max(clock.now, due[1].at);
            due[1].fn();
        }
        clock.now = until;
    }

    return Object.assign(context.__YTBTW_TEST__, { document, sent, advance });
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('drop claim labels cover Twitch UI languages and fail closed', () => {
    const tw = loadTwitch();
    for (const label of ['Claim Now', 'Claim', ' Claim\n  Now ', 'Jetzt abholen',
        'Reclamar ahora', '今すぐ入手', 'Kiváltás most!', 'Şimdi Al']) {
        assert.equal(tw.isDropClaimLabel(label), true, label);
    }
    // "Connect" sits beside "Claim Now" in the same reward component; bare
    // "Abholen"/"Riscatta" are also Twitch's "Redeem"/"Claim" elsewhere.
    for (const label of ['Connect', 'Verknüpfen', 'Abholen', 'Riscatta', 'Claimed',
        'Claim the previous reward to start earning progress toward this one', '']) {
        assert.equal(tw.isDropClaimLabel(label), false, label);
    }
});

test('the inventory pass clicks claim controls in main only', () => {
    const claim = h('button', {}, h('div', { 'data-a-target': 'tw-core-button-label-text' }, 'Jetzt abholen'));
    const connect = h('button', {}, 'Verknüpfen');
    const disabled = h('button', { disabled: true }, 'Jetzt abholen');
    const popoverLink = h('a', { href: '/drops/inventory' }, 'Claim');
    const outside = h('button', {}, 'Claim Now');
    const tw = loadTwitch({
        body: [h('nav', {}, outside), h('main', {}, claim, connect, disabled, popoverLink)]
    });

    assert.equal(tw.claimInventoryHere(), 1);
    assert.equal(claim.clicks, 1);
    assert.equal(connect.clicks + disabled.clicks + popoverLink.clicks + outside.clicks, 0);
});

test('an auto-claim tab waits for the inventory to render before closing', () => {
    const main = h('main', {});
    const tw = loadTwitch({ body: [main] });
    tw.configure({});
    tw.armInventoryClose();

    // The first passes run before Twitch has rendered the inventory.
    tw.autoClaimDrops();
    tw.advance(2500); tw.autoClaimDrops();
    tw.advance(2500); tw.autoClaimDrops();
    tw.advance(2500); tw.autoClaimDrops();
    assert.deepEqual(tw.sent, [], 'no close before anything could be claimed');

    const claim = h('button', {}, 'Claim Now');
    main.appendChild(claim);
    tw.advance(2500); tw.autoClaimDrops();
    assert.equal(claim.clicks, 1);
    claim.remove();   // Twitch swaps the button out once the claim lands

    tw.advance(2500); tw.autoClaimDrops();
    assert.deepEqual(tw.sent, [], 'the claim request gets time to go out');
    tw.advance(4000); tw.autoClaimDrops();
    assert.deepEqual(tw.sent.map(m => m.action), ['ytbtw-close-self']);
    tw.advance(10000); tw.autoClaimDrops();
    assert.equal(tw.sent.length, 1, 'asks to close once');
});

test('an auto-claim tab with nothing to claim gives up, unless the user is on it', () => {
    const idle = loadTwitch({ body: [h('main', {})] });
    idle.configure({});
    idle.armInventoryClose();
    for (let t = 0; t < 27500; t += 2500) { idle.autoClaimDrops(); idle.advance(2500); }
    idle.autoClaimDrops();
    assert.deepEqual(idle.sent, [], 'still waiting at 27.5 s');
    idle.advance(2500); idle.autoClaimDrops();
    assert.deepEqual(idle.sent.map(m => m.action), ['ytbtw-close-self']);

    const watched = loadTwitch({ body: [h('main', {})], hidden: false });
    watched.configure({});
    watched.armInventoryClose();
    watched.advance(31000); watched.autoClaimDrops();
    assert.deepEqual(watched.sent, [], 'a tab the user switched to stays open');
});

test('a hung emote provider holds back neither the others nor the round', async () => {
    let resolve7tv;
    const fetch = url => {
        // Accepts the connection and never answers.
        if (url.includes('frankerfacez')) return new Promise(() => {});
        if (url === 'https://api.betterttv.net/3/cached/emotes/global') {
            return Promise.resolve({ ok: true, json: async () => [{ id: 'b1', code: 'catJAM' }] });
        }
        if (url === 'https://7tv.io/v3/emote-sets/global') {
            return new Promise(resolve => {
                resolve7tv = () => resolve({
                    ok: true,
                    json: async () => ({ emotes: [{ name: 'KEKW', data: { host: { url: '//cdn.7tv.app/emote/k1' } } }] })
                });
            });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    };
    const text = h('span', { 'data-a-target': 'chat-message-text' }, 'catJAM hello KEKW');
    const container = h('div', { class: 'chat-scrollable-area__message-container' },
        h('div', { class: 'chat-line__message' }, text));
    const tw = loadTwitch({ pathname: '/somechannel', body: [container], fetch });
    tw.configure({});
    tw.setChat(container);

    tw.maybeFetchEmotes();
    await flush();
    assert.equal(tw.emotes().has('catJAM'), true, 'BTTV is published while FFZ hangs');
    assert.deepEqual(text.querySelectorAll('img.ytbtw-emote').map(img => img.alt), ['catJAM']);

    resolve7tv();
    await flush();
    assert.deepEqual(text.querySelectorAll('img.ytbtw-emote').map(img => img.alt), ['catJAM', 'KEKW'],
        'a later provider still renders into an already-rewritten message');
    assert.equal(text.textContent, ' hello ');
    assert.equal(tw.emoteRound().inFlight, true, 'FFZ is still pending');

    tw.advance(8000);
    await flush();
    assert.equal(tw.emoteRound().inFlight, false,
        'the timeout ends the round instead of waiting on FFZ forever');
    assert.equal(tw.emoteRound().loaded, true);
});
