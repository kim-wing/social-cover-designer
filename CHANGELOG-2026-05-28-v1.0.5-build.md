# YOUDESIGN v1.0.5 build record

Date: 2026-05-28

## UI changes

- Added an in-app unified dialog component in `index.html`.
- Replaced native `alert()` and `confirm()` calls with the unified dialog for:
  - export image failure
  - export project failure
  - import project overwrite confirmation
  - import project failure
  - preset canvas resize confirmation
  - custom canvas resize confirmation
  - new blank canvas confirmation
  - update available prompt
- Dialog styling follows the current YOUDESIGN yellow theme:
  - blurred overlay
  - rounded glass panel
  - consistent title/message/actions
  - danger/update visual states
  - keyboard handling for Enter/Escape

## Build script change

- Updated `scripts/create-local-update-manifest.js`.
- Windows updater asset lookup now prefers:
  - `src-tauri/target/x86_64-pc-windows-gnullvm/release/bundle/nsis/YOUDESIGN_1.0.5_x64-setup.exe`
- It falls back to the old GNU target path:
  - `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/YOUDESIGN_1.0.5_x64-setup.exe`
- Reason: on this macOS machine, the GNU target needed `libgcc/libgcc_eh`; the LLVM target builds cleanly with llvm-mingw.

## Build environment notes

- Default `/usr/local/bin/cargo` was old: `cargo 1.68.1`.
- Successful builds used rustup Cargo from:
  - `/Users/youxiake/.cargo/bin/cargo`
- macOS app bundling needs system `/usr/bin/xattr`; Python's `xattr` appeared earlier in PATH and does not support Tauri's recursive flags.
- Homebrew `mingw-w64` install failed because this Homebrew setup reports unsupported macOS `:dunno`.
- Windows cross build used llvm-mingw:
  - downloaded from `mstorsjo/llvm-mingw`
  - installed at `/Users/youxiake/.local/toolchains/llvm-mingw-20260519-ucrt-macos-universal`
- NSIS used the existing electron-builder cached macOS `makensis`:
  - `/Users/youxiake/Library/Caches/electron-builder/nsis/nsis-3.0.4.1-nsis-3.0.4.1/mac/makensis`

## Commands used

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
PATH=/Users/youxiake/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin \
rustup target add x86_64-pc-windows-gnullvm
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
gh release upload v1.0.5 \
  local-update-test/server/latest.json \
  local-update-test/server/YOUDESIGN-1.0.5-mac-x64.app.tar.gz \
  local-update-test/server/YOUDESIGN-1.0.5-mac-x64.app.tar.gz.sig \
  local-update-test/server/YOUDESIGN-1.0.5-mac-arm64.app.tar.gz \
  local-update-test/server/YOUDESIGN-1.0.5-mac-arm64.app.tar.gz.sig \
  local-update-test/server/YOUDESIGN-1.0.5-win-x64-setup.exe \
  local-update-test/server/YOUDESIGN-1.0.5-win-x64-setup.exe.sig \
  --clobber
```

## Local release assets

Generated updater assets:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.5-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.5-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.5-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.5-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.5-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.5-win-x64-setup.exe.sig`

SHA-256:

```text
555bebdfd48635fb179752d8d03ab1de605f2fce8d053eb6ca320653606a7644  YOUDESIGN-1.0.5-mac-x64.app.tar.gz
e0c177fda3ad2b0e16654be3b61bef54443e6ba613838dd47f76634f9bf89f11  YOUDESIGN-1.0.5-mac-arm64.app.tar.gz
f4de15d3bcd8a4980e32edebfcebeda5cda046f79daa72d89af93af0ae5c1f18  YOUDESIGN-1.0.5-win-x64-setup.exe
```

## GitHub release

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.5
```

Uploaded assets were verified with `gh release view v1.0.5 --json url,assets`.

GitHub asset digests after upload:

```text
latest.json: sha256:cbe71303ac1b0adae6027f6933f8e44120c71036731094d1997b7ce4dc89757a
YOUDESIGN-1.0.5-mac-x64.app.tar.gz: sha256:555bebdfd48635fb179752d8d03ab1de605f2fce8d053eb6ca320653606a7644
YOUDESIGN-1.0.5-mac-arm64.app.tar.gz: sha256:e0c177fda3ad2b0e16654be3b61bef54443e6ba613838dd47f76634f9bf89f11
YOUDESIGN-1.0.5-win-x64-setup.exe: sha256:f4de15d3bcd8a4980e32edebfcebeda5cda046f79daa72d89af93af0ae5c1f18
```

## Electron updater compatibility

The installed `1.0.4` mac Intel app is the Electron build. Its updater uses `electron-updater`, so it requests:

```text
https://github.com/kim-wing/social-cover-designer/releases/download/v1.0.5/latest-mac.yml
```

The first v1.0.5 upload only included Tauri updater assets (`latest.json`), so Electron 1.0.4 returned 404 when checking for updates.

Compatibility assets were generated and uploaded for Electron mac x64:

```bash
npm run electron:build:mac
gh release upload v1.0.5 \
  release/latest-mac.yml \
  release/YOUDESIGN-1.0.5-mac-x64.zip \
  release/YOUDESIGN-1.0.5-mac-x64.zip.blockmap \
  --clobber
```

Verified GitHub assets:

```text
latest-mac.yml: sha256:1586ade90a8418aa4c16a0767352b282753b9dfd6a4ae2bf8b9a01075e4974a9
YOUDESIGN-1.0.5-mac-x64.zip: sha256:a90c91adfae719d83f1df7348ad22c001544b27ee464746e8905b7526d93dcf9
YOUDESIGN-1.0.5-mac-x64.zip.blockmap: sha256:fa6cf5748c11c4a0babab80d050a11b9b9222f1acf5b7485c6841aa3dbda602a
```

## Platform direction

Decision recorded after the v1.0.5 release check:

- Electron is deprecated for future YOUDESIGN releases.
- Future packaging, updater testing, and release uploads should use Tauri only.
- Keep the Electron files and scripts only as a temporary fallback while existing `1.0.4` Electron users move to `1.0.5`.
- Do not generate new Electron release assets after this compatibility patch unless explicitly needed for migration support.
- The canonical updater manifest going forward is:

```text
https://github.com/kim-wing/social-cover-designer/releases/latest/download/latest.json
```

- The canonical release assets going forward are:

```text
YOUDESIGN-<version>-mac-x64.app.tar.gz
YOUDESIGN-<version>-mac-x64.app.tar.gz.sig
YOUDESIGN-<version>-mac-arm64.app.tar.gz
YOUDESIGN-<version>-mac-arm64.app.tar.gz.sig
YOUDESIGN-<version>-win-x64-setup.exe
YOUDESIGN-<version>-win-x64-setup.exe.sig
latest.json
```

## Remaining caveats

- macOS bundles were ad-hoc signed with identity `-`; notarization was skipped because Apple notarization environment variables were not configured.
- Windows installer code signing was skipped because signing is not configured for cross-host builds.
- Tauri printed a warning that Windows cross-platform compilation is experimental; for maximum confidence, rebuild the Windows installer on a Windows host or CI before a public production rollout.
