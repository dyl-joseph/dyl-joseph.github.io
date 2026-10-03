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
    assert.deepEqual([...new Set(stars.map(star => star.style.animationDuration))], ['3s', '3.5s', '4s', '4.5s', '5s']);
    for (const star of stars) {
        assert.equal(star.attributes.fill, '#fff');
        assert.ok(Number(star.attributes.cx) >= 0 && Number(star.attributes.cx) < 1440);
        assert.ok(Number(star.attributes.cy) >= 0 && Number(star.attributes.cy) < 1000);
        assert.ok(parseFloat(star.style.animationDelay) <= 0);
        assert.ok(Math.abs(parseFloat(star.style.animationDelay)) < parseFloat(star.style.animationDuration));
    }
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
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    assert.match(html, /id="starfield"[^>]*aria-hidden="true"/);
    assert.match(html, /id="portfolio"/);
    assert.match(html, /href="pdf\/Dylan_Resume.pdf"/);
});

// Baseline CSS from main at 7e3a640, with only the page backdrop changed to #000.
// This guards every existing panel color, shape, border, shadow, and hover rule.
test('original card and navigation appearance is unchanged', () => {
    const { createHash } = require('node:crypto');
    const css = fs.readFileSync('styles.css', 'utf8');
    for (const name of ['bg-secondary', 'nav-bg', 'sidebar-bg', 'card-bg']) {
        assert.match(css, new RegExp(`--${name}: #11111b;`));
    }
    const originalRules = css.split('/* One stable sky sits behind')[0].trim();
    assert.equal(createHash('sha256').update(originalRules).digest('hex'), '82295cc42201d1a4c45ee5fc090330732f04a3193025845579ffff1530dbf929');
});
