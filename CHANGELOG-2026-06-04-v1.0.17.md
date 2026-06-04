# YOUDESIGN v1.0.17 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.17
```

## Changes

- Improved mask brush smoothness.
  - Pointer move rendering is now batched through `requestAnimationFrame`.
  - Coalesced pointer events are processed for more continuous strokes.
  - Mask overlay rendering now reuses an offscreen cache.
  - Masked image compositing now reuses cached canvas output until the mask changes.
- Split the frontend source into maintainable files.
  - `index.html` keeps document structure.
  - `src/styles.css` contains UI styling.
  - `src/app.js` contains application logic.
- Added build-time app version injection for packaged frontend assets.
- Tightened Tauri desktop boundaries.
  - Added a Content Security Policy.
  - Added remote image request timeout, redirect, URL, and size checks.
  - Added export size guards for large image output.
- Removed the old Electron fallback product.
  - Deleted the old `desktop/` shell files.
  - Removed Electron scripts and dependencies from `package.json`.
- Split local development builds from signed updater release builds.
  - `npm run build` builds a local app without updater artifacts.
  - `npm run build:release` builds signed updater artifacts.

## Release Requirements

- Version bumped to `1.0.17`.
- Default canvas remains empty before packaging.
- Release should include signed updater assets for each shipped platform.
- GitHub updater reachability should be checked with redirects, including `release-assets.githubusercontent.com`.

## Verification

```text
node --check src/app.js: passed
npm run check: passed
npm run build: passed
release build: pending
GitHub release upload: pending
GitHub updater reachability: pending
```
