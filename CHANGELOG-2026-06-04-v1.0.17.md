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
mac x64 release build: passed
mac arm64 release build: passed
win x64 release build: passed through GitHub Actions Windows runner
local update manifest: passed
GitHub release upload: passed
GitHub updater reachability: passed
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.17-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.17-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.17-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.17-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.17-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.17-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:1d32f7b297369019953fa2582314391f2ac350db5ce638813385f088f6073fcc
YOUDESIGN-1.0.17-mac-x64.app.tar.gz: sha256:9e4398e6b294a0f32e1ed81e0d914cbc046da31ebc5643d44b20aa8a18e573a1
YOUDESIGN-1.0.17-mac-x64.app.tar.gz.sig: sha256:7ee302eb01ad761c8fa4b82961913ee310fd760e32b9d5dca0e02705d2ad9821
YOUDESIGN-1.0.17-mac-arm64.app.tar.gz: sha256:b58ad66d84310c603eed410701cbf561d3730d795daef8e076d7e89d76c8c62f
YOUDESIGN-1.0.17-mac-arm64.app.tar.gz.sig: sha256:8f17b08395d4b775f99debadcc3d3919ee1a578e47f5d43196a087aabca0511b
YOUDESIGN-1.0.17-win-x64-setup.exe: sha256:252c5913a865176d0e414d431da3a53bf0bb56d17120b597ae4d1dd452c957a4
YOUDESIGN-1.0.17-win-x64-setup.exe.sig: sha256:b10bf8407593a29aadbee09c433d58fd8cbdf64e1fa2b7cb35ea4ba402fee90c
```

## Packaging Notes

- GitHub Actions run: `26927500876`.
- Windows artifact ID: `7402019236`.
- GitHub Release: `https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.17`
- Removed old local Electron/Windows/test product artifacts after upload.

## 2026-06-04 Smart Cutout Packaged-App Fix

Issue:

- After the technical upgrade, smart cutout worked from `index.html` but failed in the packaged Tauri app with a `loadfailed`-style model/runtime loading error.

Root cause:

- The packaged app was dynamically importing Transformers.js from a CDN.
- Tauri production CSP and WebView resource handling made that remote runtime path fragile.
- RMBG model downloads can also redirect from Hugging Face to XetHub-hosted assets, so the production app needs explicit support for those model download domains.

Fix:

- Added `@huggingface/transformers@3.5.2` as a project dependency.
- Updated `scripts/prepare-tauri-dist.js` to copy the Transformers.js runtime and ONNX WASM files into `dist/vendor/transformers`.
- Updated RMBG loading to prefer the packaged local Transformers.js runtime and only fall back to CDN if needed.
- Explicitly set `env.backends.onnx.wasm.wasmPaths` to the packaged vendor runtime directory.
- Expanded Tauri CSP for the cutout runtime path, including `blob:`, `data:`, remote model fetches, workers, and WASM execution.
- Improved RMBG load errors so future failures show the original runtime/fetch/CSP message.

Verification:

```text
index.html manual test: passed
packaged YOUDESIGN.app smart cutout manual test: passed
npm run check: passed
npm run build:mac: passed
```
