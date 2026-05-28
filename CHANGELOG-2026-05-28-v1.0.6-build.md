# YOUDESIGN v1.0.6 build record

Date: 2026-05-28

## Changes

- Refined the editor UI in `index.html` toward a Figma-style workspace:
  - simplified top chrome
  - fixed left categorized tool rail
  - Figma-like center canvas surface
  - denser right inspector panel
  - removed the temporary bottom canvas toolbar
- Kept the left tool panel categorized by the side icons.
- Kept mascot and logo assets displayed as tiled grids inside their own categories.
- Changed the default title element to have no stroke:
  - previous: white stroke, width `6`
  - current: transparent stroke, width `0`
- Bumped app version to `1.0.6` in:
  - `package.json`
  - `package-lock.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/Cargo.lock`
  - `index.html`

## Build plan

Tauri-only release, following the v1.0.5 platform direction.

Expected updater assets:

```text
latest.json
YOUDESIGN-1.0.6-mac-x64.app.tar.gz
YOUDESIGN-1.0.6-mac-x64.app.tar.gz.sig
YOUDESIGN-1.0.6-mac-arm64.app.tar.gz
YOUDESIGN-1.0.6-mac-arm64.app.tar.gz.sig
YOUDESIGN-1.0.6-win-x64-setup.exe
YOUDESIGN-1.0.6-win-x64-setup.exe.sig
```

## Commands

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat /Users/youxiake/.tauri/youdesign-updater.key)" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
PATH=/Users/youxiake/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin \
npm run build:mac
```

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat /Users/youxiake/.tauri/youdesign-updater.key)" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
PATH=/Users/youxiake/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin \
npm run build:mac:arm
```

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat /Users/youxiake/.tauri/youdesign-updater.key)" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
PATH=/Users/youxiake/Library/Caches/electron-builder/nsis/nsis-3.0.4.1-nsis-3.0.4.1/mac:/Users/youxiake/.local/toolchains/llvm-mingw-20260519-ucrt-macos-universal/bin:/Users/youxiake/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin \
npx tauri build --target x86_64-pc-windows-gnullvm --bundles nsis
```

```bash
npm run tauri:local-update-manifest
```

```bash
gh release create v1.0.6 \
  local-update-test/server/latest.json \
  local-update-test/server/YOUDESIGN-1.0.6-mac-x64.app.tar.gz \
  local-update-test/server/YOUDESIGN-1.0.6-mac-x64.app.tar.gz.sig \
  local-update-test/server/YOUDESIGN-1.0.6-mac-arm64.app.tar.gz \
  local-update-test/server/YOUDESIGN-1.0.6-mac-arm64.app.tar.gz.sig \
  local-update-test/server/YOUDESIGN-1.0.6-win-x64-setup.exe \
  local-update-test/server/YOUDESIGN-1.0.6-win-x64-setup.exe.sig \
  --title "YOUDESIGN v1.0.6" \
  --notes-file CHANGELOG-2026-05-28-v1.0.6-build.md
```

## Build results

Generated updater assets:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.6-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.6-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.6-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.6-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.6-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.6-win-x64-setup.exe.sig`

SHA-256:

```text
e7bff62a90178367c3b897389e9b07c817a98d7ce2dfdb28a5e48c4cc4c867b1  latest.json
c76ca71127a59b9c3c2f16a008dbb0ddbc00d246693b828d6249f9e8fe0c8ff2  YOUDESIGN-1.0.6-mac-x64.app.tar.gz
be646a206a2d0c3e77a7470cf1b1c2eb5c1f5eac647a1e5bc26e347088cffb09  YOUDESIGN-1.0.6-mac-arm64.app.tar.gz
3c97eafca91e22dc45dcc8da818a3a0db09fb8eeda63a2a9498cd0167c140f77  YOUDESIGN-1.0.6-win-x64-setup.exe
```

Build caveats:

- macOS bundles were ad-hoc signed with identity `-`.
- macOS notarization was skipped because Apple notarization environment variables are not configured.
- Windows installer code signing was skipped because Tauri signing is only supported by default on Windows hosts.
- Tauri printed the existing warning that Windows cross-platform compilation is experimental.

## GitHub release

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.6
```

Uploaded assets were verified with `gh release view v1.0.6 --json url,assets`.

GitHub asset digests after upload:

```text
latest.json: sha256:e7bff62a90178367c3b897389e9b07c817a98d7ce2dfdb28a5e48c4cc4c867b1
YOUDESIGN-1.0.6-mac-x64.app.tar.gz: sha256:c76ca71127a59b9c3c2f16a008dbb0ddbc00d246693b828d6249f9e8fe0c8ff2
YOUDESIGN-1.0.6-mac-x64.app.tar.gz.sig: sha256:d327a9baa3aa0feeeb6ba1e697af39bf299ccba0c151858cc0f6c7b7ed202605
YOUDESIGN-1.0.6-mac-arm64.app.tar.gz: sha256:be646a206a2d0c3e77a7470cf1b1c2eb5c1f5eac647a1e5bc26e347088cffb09
YOUDESIGN-1.0.6-mac-arm64.app.tar.gz.sig: sha256:37c8c3ede9397f78731a0cd0a45603b206ef21b31579593c83561079c37fe470
YOUDESIGN-1.0.6-win-x64-setup.exe: sha256:3c97eafca91e22dc45dcc8da818a3a0db09fb8eeda63a2a9498cd0167c140f77
YOUDESIGN-1.0.6-win-x64-setup.exe.sig: sha256:92667c41ef9aa4efefa63f39d45eeb17f7314f97f1bbed4f03a0c29d55484c97
```
