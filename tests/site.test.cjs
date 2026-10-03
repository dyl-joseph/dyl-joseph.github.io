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
test('sky keeps stable positions and independently staggered 2–4 second flickers', () => {
    const first = load();
    const stars = first.field.children[0].children.filter(element => element.classList.contains('star'));
    assert.equal(stars.length, 900);
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
test('sky mixes pale blue, red and yellow accents with mostly white stars', () => {
    const stars = load().field.children[0].children.filter(element => element.classList.contains('star'));
    const counts = {};
    for (const star of stars) {
        const color = star.attributes.fill;
        counts[color] = (counts[color] ?? 0) + 1;
    }
    assert.deepEqual(counts, { 'url(#star-white)': 630, 'url(#star-blue)': 90, 'url(#star-red)': 90, 'url(#star-yellow)': 90 });
});
test('stars have white cores, pale halos and varied brightness', () => {
    const sky = load().field.children[0];
    const gradients = sky.children[0].children;
    assert.deepEqual(gradients.map(gradient => gradient.attributes.id), ['star-white', 'star-blue', 'star-red', 'star-yellow']);
    assert.deepEqual(gradients.map(gradient => gradient.children[2].attributes['stop-color']), ['#ffffff', '#dceaff', '#ffe0dd', '#fff3c4']);
    for (const gradient of gradients) {
        assert.equal(gradient.children[0].attributes['stop-color'], '#fff');
        assert.equal(gradient.children[0].attributes['stop-opacity'], '1');
        assert.equal(gradient.children.at(-1).attributes['stop-opacity'], '0');
    }
    const brightness = sky.children.filter(element => element.classList.contains('star')).map(star => Number(star.attributes.opacity));
    assert.ok(brightness.every(opacity => opacity > 0 && opacity <= 1));
    assert.ok(brightness.filter(opacity => opacity < 0.6).length > 450);
    assert.ok(brightness.some(opacity => opacity > 0.9));
    const css = fs.readFileSync('styles.css', 'utf8');
    assert.match(css, /0%, 100% \{ opacity: calc\(var\(--star-opacity\) \* 0\.5\)/);
    assert.match(css, /45% \{ opacity: var\(--star-opacity\)/);
});
test('every section starts with the same 900 stars', () => {
    const home = load('#home').field.children[0].children.filter(element => element.classList.contains('star'));
    const portfolio = load('#portfolio').field.children[0].children.filter(element => element.classList.contains('star'));
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
