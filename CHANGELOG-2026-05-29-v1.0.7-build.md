# YOUDESIGN v1.0.7 build record

Date: 2026-05-29

## Changes

- Added image background removal controls to the right inspector.
- Added RMBG-1.4 lazy loading through Transformers.js:
  - first use requires network access
  - model is downloaded only when the user clicks smart background removal
  - image processing runs locally after the model is loaded
- Added mask refinement mode for selected images:
  - keep brush
  - erase brush
  - brush size
  - brush hardness
  - mask overlay toggle
  - undo last refinement stroke
  - finish refinement
- Added restore-original-image support for processed images.
- Extended image project data with mask/original-image fields while keeping runtime-only image objects out of saved project JSON.
- Bumped app version to `1.0.7` in:
  - `package.json`
  - `package-lock.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/Cargo.lock`
  - `index.html`

## Build plan

Tauri updater release.

Expected uploaded assets for this build:

```text
latest.json
YOUDESIGN-1.0.7-mac-x64.app.tar.gz
YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig
```

Windows x64 was attempted, but NSIS packaging failed because `makensis.exe` is not available in the current macOS build environment. Homebrew NSIS installation also failed on this machine because Homebrew reports the current macOS version as unsupported.

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
npm run tauri:local-update-manifest
```

## Build results

Generated updater assets:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig`

SHA-256:

```text
df2b2499f590e11e915c2b1cf12425ef773fd24441d5a8537ee0326a942401c7  latest.json
76a34edbbf452801f0934560dd497de1110886e8391a53d2cc31c9f95f7486c4  YOUDESIGN-1.0.7-mac-x64.app.tar.gz
3c23736e0dd5ddd0c5a7f660bb442c029edd6fdfcf433667d7bff04cd16a44cb  YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig
affbfdc4412e6af2a5c93f9b822e569cf5cfb18459c40196d25e7146e9c7ce78  YOUDESIGN-1.0.7-mac-arm64.app.tar.gz
94d91857439a402cd5e661f195d628dad66c86efa62f7aef13365628ba0c4707  YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig
```

Build caveats:

- macOS bundles were ad-hoc signed with identity `-`.
- macOS notarization was skipped because Apple notarization environment variables are not configured.
- Windows installer was not uploaded for v1.0.7 because local NSIS packaging failed.

## GitHub release

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.7
```

Uploaded assets will be verified with `gh release view v1.0.7 --json url,assets`.

GitHub asset digests after upload:

```text
latest.json: sha256:df2b2499f590e11e915c2b1cf12425ef773fd24441d5a8537ee0326a942401c7
YOUDESIGN-1.0.7-mac-x64.app.tar.gz: sha256:76a34edbbf452801f0934560dd497de1110886e8391a53d2cc31c9f95f7486c4
YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig: sha256:3c23736e0dd5ddd0c5a7f660bb442c029edd6fdfcf433667d7bff04cd16a44cb
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz: sha256:affbfdc4412e6af2a5c93f9b822e569cf5cfb18459c40196d25e7146e9c7ce78
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig: sha256:94d91857439a402cd5e661f195d628dad66c86efa62f7aef13365628ba0c4707
```
