# Pure-black starfield preview

The site currently has one HTML page with Home/Bio and Selected Projects sections. Blog is an external site. The Resume link points to `pdf/Dylan_Resume.pdf`, which is absent from the current repository; this change leaves that link untouched while awaiting the replacement file.

Full-page desktop/mobile previews are still required. No screenshot is represented by the background-only illustrations previously attached to this PR. Actual browser rendering is blocked in the current environment: Chromium cannot create its required socket, and the cloud browser blocks the local preview URL. Its documented API has no local-document import or writable page evaluation.

The implementation carries over the approved sky from [Grades-UNT #40](https://github.com/dyl-joseph/grades-unt/pull/40), updated to **900 stars throughout** as requested. Each star has a staggered 3, 3.5, 4, 4.5, or 5 second twinkle cycle. Positions remain stable across hash navigation. Reduced-motion keeps the stars visible and static.

The single shared SVG keeps the original visual shape without adding a framework or canvas repaint loop. Page content and all existing links are preserved. The script's references to absent theme/mobile controls have been replaced with the star initializer and an accessible mobile menu. The Portfolio anchor now points to Selected Projects.

## Verification

- `node --test tests/site.test.cjs`: four passing tests for deterministic star data, duration/delay ranges, consistent section density, menu interactions, and source-level accessibility/reduced-motion rules.
- `node --check script.js` and `git diff --check`: pass.
- Parsed before/after HTML confirms unchanged text and link destinations.
- Browser layout, animation playback, responsive rendering, and screenshots: pending, not claimed as verified.

For browser review, serve the repository with `python -m http.server 8765` and open `http://localhost:8765`. Check Home and Portfolio at desktop and mobile widths, Back/Forward navigation, repeated menu clicks, Escape/outside-click dismissal, and reduced motion. The browser should show a pure `rgb(0, 0, 0)` page background without horizontal overflow.
