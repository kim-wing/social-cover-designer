# YOUDESIGN v1.0.14 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.14
```

## Changes

- Improved polygon shape controls.
  - Polygon shapes now support adjustable side count.
  - Polygon shapes now support rounded corners.
- Improved star shape controls.
  - Star shapes now support adjustable point count for multi-point stars.
  - Star shapes now support rounded corners.
- Rounded polygon/star rendering is applied consistently to the canvas, SVG export, and boolean operation paths.
- Added Tauri v2 updater capability permissions.
  - `src-tauri/capabilities/default.json` now grants `updater:default`.
  - Generated capabilities schema now includes updater permissions for the main window.
- Improved update failure visibility.
  - Automatic update checks no longer silently swallow errors.
  - Manual update checks and installs now display a concrete failure reason in the update status pill.
- Documented release rules.
  - Every public release must be auto-update capable for macOS and Windows.
  - Every release must clear the canvas before packaging.

## Verification

```text
inline script syntax check: pending
cargo check: pending
mac x64 build: pending
mac arm64 build: pending
win x64 build: pending through GitHub Actions Windows runner
local update manifest: pending
auto-update test from older installed build: pending
```

## Packaging Notes

- Do not finish a release unless `latest.json`, mac x64, mac arm64, Windows x64, and all signatures are uploaded.
- Test auto-update with an older installed app version. The installed version must be lower than the published version, otherwise Tauri correctly reports no update.
- Keep using the same updater signing key at `/Users/youxiake/.tauri/youdesign-updater.key`.
