# YOUDESIGN v1.0.16 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.16
```

## Changes

- Added Unsplash free stock image search in the image tools panel.
  - Users provide their own Unsplash Access Key.
  - The Access Key is stored locally.
  - Search supports keyword results and loading more images.
  - Clicking a result downloads the image into the canvas.
  - Unsplash photographer attribution links are shown in the result card.
  - Unsplash download tracking is called when a photo is inserted into the canvas.
- Added an Unsplash key application helper.
  - The "申请 Key" button opens `https://unsplash.com/developers`.
  - Beginner-friendly steps explain where to create an application and copy the Access Key.
- Improved Unsplash free library UI.
  - Search input and search button now use aligned fixed heights.
  - The key guide title uses a custom clear arrow and centered layout.
- Fixed a quick-tool interaction issue.
  - Clicking the left-side image tool now only opens the image panel.
  - The file picker only opens from the upload card inside the image panel.

## Release Requirements

- Version bumped to `1.0.16`.
- Default canvas remains empty before packaging.
- Release must include auto-update assets for:
  - mac x64
  - mac Apple Silicon
  - Windows x64
  - `latest.json`
- GitHub updater reachability must be checked with redirects, including `release-assets.githubusercontent.com`.

## Verification

```text
inline script syntax check: pending
mac x64 build: pending
mac arm64 build: pending
win x64 build: pending
local update manifest: pending
GitHub release upload: pending
GitHub updater reachability: pending
auto-update test from older installed build: not run
```
