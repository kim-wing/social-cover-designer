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
inline script syntax check: passed
cargo check: passed
mac x64 build: passed
mac arm64 build: passed
win x64 build: passed through GitHub Actions Windows runner
local update manifest: passed
auto-update test from older installed build: pending
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.14-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.14-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.14-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.14-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.14-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.14-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:04f134fa084da0aed40133b8f10754d31ec23eb79ab98ac45d19ab214d952e9f
YOUDESIGN-1.0.14-mac-x64.app.tar.gz: sha256:d76b6de7169ded23ee121c79319696388da1b0a86e55246e9d3fd2a53f6a2afd
YOUDESIGN-1.0.14-mac-x64.app.tar.gz.sig: sha256:f5a73230fa73931610a057a389f206b646d0ecba0fa7f0543d19a2046ee1c88a
YOUDESIGN-1.0.14-mac-arm64.app.tar.gz: sha256:0ec10783d90300045aa77b05666e38264a0ce147e8017ec4fbc55adb4b3367cb
YOUDESIGN-1.0.14-mac-arm64.app.tar.gz.sig: sha256:94618023a2267979e69ca10e9a3afa62721b57454aa7c3a3aa4c8845a110fb3f
YOUDESIGN-1.0.14-win-x64-setup.exe: sha256:8aed9449e5cbc53f9f298319dc23c2bb7f7498567bedc4a1285dd7a4fc6d7d96
YOUDESIGN-1.0.14-win-x64-setup.exe.sig: sha256:4cae48d1ee14335443af47226ab9ae5f11fc603674ec69229d1ed7946169c6cd
```

## Packaging Notes

- Do not finish a release unless `latest.json`, mac x64, mac arm64, Windows x64, and all signatures are uploaded.
- Test auto-update with an older installed app version. The installed version must be lower than the published version, otherwise Tauri correctly reports no update.
- Keep using the same updater signing key at `/Users/youxiake/.tauri/youdesign-updater.key`.
