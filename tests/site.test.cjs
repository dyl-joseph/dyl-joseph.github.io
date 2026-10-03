const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const vm = require('node:vm');
const { test } = require('node:test');

class Element {
    constructor() {
        this.attributes = {};
        this.children = [];
        this.events = {};
        const classes = new Set();
        this.classList = {
            add: value => classes.add(value),
            remove: value => classes.delete(value),
            contains: value => classes.has(value),
            toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value),
        };
        this.style = { setProperty: (name, value) => { this.style[name] = value; } };
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    appendChild(child) { this.children.push(child); }
    addEventListener(name, callback) { this.events[name] = callback; }
    focus() { this.focused = true; }
}
function load(hash = '') {
    const field = new Element();
    const button = new Element();
    button.setAttribute('aria-expanded', 'false');
    const menu = new Element();
    const links = Array.from({ length: 4 }, () => new Element());
    const documentEvents = {};
    const windowEvents = {};
    const context = {
        document: {
            getElementById: () => field,
            createElementNS: () => new Element(),
            querySelector: selector => selector === '.hamburger' ? button : menu,
            querySelectorAll: () => links,
            addEventListener: (name, callback) => { documentEvents[name] = callback; },
        },
        window: { addEventListener: (name, callback) => { windowEvents[name] = callback; } },
        location: { hash },
    };
    vm.runInNewContext(fs.readFileSync('script.js', 'utf8'), context);
    return { field, button, menu, links, context, documentEvents, windowEvents };
}
test('sky keeps stable positions and independently staggered 2–4 second flickers', () => {
    const first = load();
    const stars = first.field.children[0].children.filter(element => element.classList.contains('star'));
    assert.equal(stars.length, 950);
    assert.deepEqual(stars.map(star => star.attributes), load().field.children[0].children.filter(element => element.classList.contains('star')).map(star => star.attributes));
    assert.ok(new Set(stars.map(star => star.style.animationDuration)).size > 100);
    assert.ok(new Set(stars.map(star => star.style.animationDelay)).size > 100);
    for (const star of stars) {
        assert.ok(parseFloat(star.style.animationDuration) >= 2 && parseFloat(star.style.animationDuration) <= 4);
        assert.ok(Number(star.attributes.cx) >= 0 && Number(star.attributes.cx) < 1440);
        assert.ok(Number(star.attributes.cy) >= 0 && Number(star.attributes.cy) < 1000);
        assert.ok(parseFloat(star.style.animationDelay) <= 0);
        assert.ok(Math.abs(parseFloat(star.style.animationDelay)) < parseFloat(star.style.animationDuration));
    }
});
test('most stars have visible blue, red or yellow color', () => {
    const stars = load().field.children[0].children.filter(element => element.classList.contains('star'));
    const counts = {};
    for (const star of stars) {
        const color = star.attributes.fill;
        counts[color] = (counts[color] ?? 0) + 1;
    }
    assert.deepEqual(counts, { 'url(#star-white)': 360, 'url(#star-blue)': 180, 'url(#star-red)': 230, 'url(#star-yellow)': 180 });
});
test('colored stars retain visible color at their brightest cores and halos', () => {
    const sky = load().field.children[0];
    const gradients = sky.children[0].children;
    assert.deepEqual(gradients.map(gradient => gradient.attributes.id), ['star-white', 'star-blue', 'star-red', 'star-yellow']);
    assert.deepEqual(gradients.map(gradient => gradient.children[2].attributes['stop-color']), ['#ffffff', '#8fbdff', '#ff969e', '#ffe080']);
    for (const gradient of gradients) {
        const tint = gradient.children[2].attributes['stop-color'];
        assert.equal(gradient.children[0].attributes['stop-color'], tint);
        assert.equal(gradient.children[1].attributes['stop-color'], tint);
        if (gradient.attributes.id !== 'star-white') {
            const channels = tint.slice(1).match(/../g).map(channel => parseInt(channel, 16));
            assert.ok(Math.max(...channels) - Math.min(...channels) >= 100);
        }
        assert.equal(gradient.children[0].attributes['stop-opacity'], '1');
        assert.equal(gradient.children.at(-1).attributes['stop-opacity'], '0');
    }
    const brightness = sky.children.filter(element => element.classList.contains('star')).map(star => Number(star.attributes.opacity));
    assert.ok(brightness.every(opacity => opacity > 0 && opacity <= 1));
    assert.ok(brightness.some(opacity => opacity < 0.75));
    assert.ok(brightness.some(opacity => opacity > 0.9));
    const css = fs.readFileSync('styles.css', 'utf8');
    assert.match(css, /0%, 100% \{ opacity: calc\(var\(--star-opacity\) \* 0\.5\)/);
    assert.match(css, /45% \{ opacity: var\(--star-opacity\)/);
});
test('halo falloff is 25% narrower without shrinking star cores', () => {
    const gradients = load().field.children[0].children[0].children;
    for (const gradient of gradients) {
        const coreEdge = Number(gradient.children[1].attributes.offset);
        const midHalo = Number(gradient.children[2].attributes.offset);
        const haloEdge = Number(gradient.children[3].attributes.offset);
        assert.equal(coreEdge, 0.2);
        assert.ok(Math.abs((midHalo - coreEdge) / (0.45 - coreEdge) - 0.75) < 1e-12);
        assert.ok(Math.abs((haloEdge - coreEdge) / (1 - coreEdge) - 0.75) < 1e-12);
    }
});
test('each star is another 50% brighter than the previous 25% boost, capped at one', () => {
    let seed = 8128;
    const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const stars = load().field.children[0].children.filter(element => element.classList.contains('star'));
    for (const star of stars) {
        const x = random() * 1440;
        const y = random() * 1000;
        random(); // Radius draw in the existing seeded sky.
        const behindTitle = x > 300 && x < 1140 && y > 300 && y < 730;
        const previousOpacity = (0.35 + random() ** 2 * 0.65) * (behindTitle ? 0.65 : 1);
        const previousBoostedOpacity = Math.min(1, previousOpacity * 1.25);
        const expectedOpacity = Math.min(1, previousBoostedOpacity * 1.5);
        assert.ok(Math.abs(Number(star.attributes.opacity) - expectedOpacity) < 1e-12);
        assert.ok(Math.abs(star.style['--star-opacity'] - expectedOpacity) < 1e-12);
    }
    assert.ok(stars.some(star => star.attributes.opacity === '1'));
});
test('50 extra red stars remain and original geometry, brightness and timing stay unchanged', () => {
    const stars = load().field.children[0].children.filter(element => element.classList.contains('star'));
    const original = stars.slice(0, 900).map(star => {
        const { fill, ...attributes } = star.attributes;
        return { attributes, style: star.style };
    });
    // Snapshot of geometry, brightness and timing at 1e1f2f1, excluding the updated colors.
    assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'), '1bbf8ea30c9550f7f633f947dfb69f43fa17606bdd04e41721b8eaac9fbeb04e');
    assert.equal(stars.slice(900).length, 50);
    assert.ok(stars.slice(900).every(star => star.attributes.fill === 'url(#star-red)'));
});
test('home and portfolio share the same 950 colored stars', () => {
    const home = load('#home').field.children[0].children.filter(element => element.classList.contains('star'));
    const portfolio = load('#portfolio').field.children[0].children.filter(element => element.classList.contains('star'));
    assert.equal(home.length, 950);
    assert.equal(portfolio.length, 950);
    assert.deepEqual(home.map(star => star.attributes), portfolio.map(star => star.attributes));
});
test('mobile menu supports repeated toggles, links, Escape and outside clicks', () => {
    const site = load();
    const isOpen = () => site.button.getAttribute('aria-expanded') === 'true';
    site.button.events.click(); assert.equal(isOpen(), true);
    site.button.events.click(); assert.equal(isOpen(), false);
    site.button.events.click(); site.links[0].events.click(); assert.equal(isOpen(), false);
    site.button.events.click(); site.documentEvents.keydown({ key: 'Escape' });
    assert.equal(isOpen(), false); assert.equal(site.button.focused, true);
    site.button.events.click(); site.documentEvents.click({ target: { closest: () => null } });
    assert.equal(isOpen(), false);
});
test('black base, reduced motion and decorative-only field remain in source', () => {
    const css = fs.readFileSync('styles.css', 'utf8');
    const html = fs.readFileSync('index.html', 'utf8');
    assert.match(css, /--bg-color: #000;/);
    assert.match(css, /--sidebar-bg: transparent;/);
    assert.match(css, /--card-bg: transparent;/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    assert.match(html, /id="starfield"[^>]*aria-hidden="true"/);
    assert.equal((html.match(/id="starfield"/g) ?? []).length, 1);
    assert.equal((html.match(/src="script.js"/g) ?? []).length, 1);
    assert.match(html, /id="portfolio"/);
    assert.match(html, /href="pdf\/Dylan_Resume.pdf"/);
});
