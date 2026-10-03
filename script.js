const starfield = document.getElementById('starfield');
const svgNamespace = 'http://www.w3.org/2000/svg';
const sky = document.createElementNS(svgNamespace, 'svg');
sky.setAttribute('viewBox', '0 0 1440 1000');
sky.setAttribute('preserveAspectRatio', 'xMidYMid slice');
sky.setAttribute('focusable', 'false');
sky.classList.add('starfield');

// Match the approved Grades sky without moving stars when navigating sections.
let seed = 8128;
function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
}
// Keep most stars white; indexing preserves the seeded positions and twinkle timing.
const starColors = ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#89b4fa', '#ff8a80', '#fab387'];
for (let index = 0; index < 900; index += 1) {
    const x = random() * 1440;
    const y = random() * 1000;
    const radius = [0.6, 0.8, 1, 0.7, 1.3, 0.8, 1.8][Math.floor(random() * 7)];
    const behindTitle = x > 300 && x < 1140 && y > 300 && y < 730;
    const opacity = Math.min(1, 1.5 * (0.5 + random() * 0.45) * (behindTitle ? 0.65 : 1));
    const duration = 2 + (index % 5) * 0.5;
    const star = document.createElementNS(svgNamespace, 'circle');
    star.setAttribute('cx', x);
    star.setAttribute('cy', y);
    star.setAttribute('r', radius);
    star.setAttribute('fill', starColors[index % starColors.length]);
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
