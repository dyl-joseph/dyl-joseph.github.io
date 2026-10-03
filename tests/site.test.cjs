const assert = require('node:assert/strict');
const fs = require('node:fs');
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
test('sky matches the approved stable positions and five staggered durations', () => {
    const first = load();
    const stars = first.field.children[0].children;
    assert.equal(stars.length, 900);
    assert.deepEqual(stars.map(star => star.attributes), load().field.children[0].children.map(star => star.attributes));
    assert.deepEqual([...new Set(stars.map(star => star.style.animationDuration))], ['2s', '2.5s', '3s', '3.5s', '4s']);
    for (const star of stars) {
        assert.ok(Number(star.attributes.cx) >= 0 && Number(star.attributes.cx) < 1440);
        assert.ok(Number(star.attributes.cy) >= 0 && Number(star.attributes.cy) < 1000);
        assert.ok(parseFloat(star.style.animationDelay) <= 0);
        assert.ok(Math.abs(parseFloat(star.style.animationDelay)) < parseFloat(star.style.animationDuration));
    }
});
test('sky mixes blue, red and orange accents with mostly white stars', () => {
    const stars = load().field.children[0].children;
    const counts = {};
    for (const star of stars) {
        const color = star.attributes.fill;
        counts[color] = (counts[color] ?? 0) + 1;
    }
    assert.deepEqual(counts, { '#fff': 630, '#89b4fa': 90, '#ff8a80': 90, '#fab387': 90 });
});
test('every section starts with the same 900 stars', () => {
    const home = load('#home').field.children[0].children;
    const portfolio = load('#portfolio').field.children[0].children;
    assert.equal(home.length, 900);
    assert.equal(portfolio.length, 900);
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
    assert.match(html, /id="portfolio"/);
    assert.match(html, /href="pdf\/Dylan_Resume.pdf"/);
});
