const starfield = document.getElementById('starfield');
const svgNamespace = 'http://www.w3.org/2000/svg';
const sky = document.createElementNS(svgNamespace, 'svg');
sky.setAttribute('viewBox', '0 0 1440 1000');
sky.setAttribute('preserveAspectRatio', 'xMidYMid slice');
sky.setAttribute('focusable', 'false');
sky.classList.add('starfield');

// Keep the same sky when navigating sections.
let seed = 8128;
function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
}
const starTints = { white: '#ffffff', blue: '#bcd6ff', red: '#ffc2bb', yellow: '#ffe79a' };
const definitions = document.createElementNS(svgNamespace, 'defs');
for (const [name, tint] of Object.entries(starTints)) {
    const gradient = document.createElementNS(svgNamespace, 'radialGradient');
    gradient.setAttribute('id', `star-${name}`);
    for (const [offset, color, opacity] of [[0, '#fff', 1], [0.2, '#fff', 0.95], [0.3875, tint, 0.45], [0.8, tint, 0]]) {
        const stop = document.createElementNS(svgNamespace, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        stop.setAttribute('stop-opacity', opacity);
        gradient.appendChild(stop);
    }
    definitions.appendChild(gradient);
}
sky.appendChild(definitions);
// Index-based tints leave the seeded star positions unchanged.
const starColors = ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'blue', 'red', 'yellow'];
for (let index = 0; index < 950; index += 1) {
    const x = random() * 1440;
    const y = random() * 1000;
    const radius = [0.6, 0.8, 1, 0.7, 1.3, 0.8, 1.8][Math.floor(random() * 7)];
    const behindTitle = x > 300 && x < 1140 && y > 300 && y < 730;
    const baseOpacity = (0.35 + random() ** 2 * 0.65) * (behindTitle ? 0.65 : 1);
    const opacity = Math.min(1, baseOpacity * 1.875);
    const duration = 2 + ((index * 73) % 201) / 100;
    const star = document.createElementNS(svgNamespace, 'circle');
    star.setAttribute('cx', x);
    star.setAttribute('cy', y);
    star.setAttribute('r', radius * 2.5);
    const color = index < 900 ? starColors[index % starColors.length] : 'red';
    star.setAttribute('fill', `url(#star-${color})`);
    star.setAttribute('opacity', opacity);
    star.classList.add('star');
    star.style.setProperty('--star-opacity', opacity);
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `-${(index * 7.919) % duration}s`;
    sky.appendChild(star);
}
starfield.appendChild(sky);
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
}
hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') !== 'true';
    hamburger.classList.toggle('active', expanded);
    navMenu.classList.toggle('active', expanded);
    hamburger.setAttribute('aria-expanded', String(expanded));
});
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        hamburger.focus();
    }
});
document.addEventListener('click', event => {
    if (!event.target.closest('.navbar')) closeMenu();
});
