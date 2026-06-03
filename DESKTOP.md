# YOUDESIGN Desktop

YOUDESIGN now uses Tauri as the default desktop shell. The previous Electron shell is still kept under `desktop/` and can be run with the `electron:*` npm scripts if a fallback is needed.

## Requirements

Tauri 2 requires a current Rust toolchain. If `cargo --version` still shows the old system Rust, load rustup first:

```bash
. "$HOME/.cargo/env"
```

When building behind Clash/FlClash on port `7890`, run the build with proxy environment variables:

```bash
HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890 ALL_PROXY=socks5://127.0.0.1:7890 npm run build
```

## Development

```bash
npm install
npm start
```

`npm start` runs `tauri dev`. Before Tauri starts, `npm run tauri:prepare` copies the static frontend assets into `dist/`.

## Build

```bash
npm run build:mac
npm run build:mac:arm
npm run build:win
```

Tauri build outputs are written under `src-tauri/target/`. The generated packages should be much smaller than the previous Electron packages because they use the system WebView instead of bundling Chromium.

On this Intel mac, the signed updater artifacts currently generated are:

- mac x64: `local-update-test/server/YOUDESIGN-<version>-mac-x64.app.tar.gz`
- mac Apple Silicon: `local-update-test/server/YOUDESIGN-<version>-mac-arm64.app.tar.gz`

Windows updater artifacts must be generated from a Windows environment or CI. When the Windows NSIS updater archive exists, `scripts/create-local-update-manifest.js` will add it to `latest.json` as `windows-x86_64`.

## Frontend Assets

The source frontend remains:

- `index.html`
- `logo/`
- `游小侠/`

The packaged frontend is generated into `dist/` by `scripts/prepare-tauri-dist.js`. Do not edit files in `dist/` directly.

## Electron Fallback

```bash
npm run electron:start
npm run electron:build:mac
npm run electron:build:win
```

The Electron fallback still uses `desktop/main.js` and `desktop/preload.js`, but it is no longer the default build path.

## Updates

The Tauri app uses signed updater artifacts. Keep the updater private key safe; installed apps can only update to packages signed with the matching key.

## Auto-Update Release Rule

Every public release must support automatic updates for both macOS and Windows. A release is not complete until the updater can detect the new version and install the matching package.

Hard requirements for every release:

- Increment the app version before building. Tauri only reports an update when the release version is greater than the installed app version.
- Clear the canvas before packaging. Do not build a release while the app is showing test layers, sample images, or temporary design drafts.
- Build signed updater artifacts with the same updater private key:
  - mac x64: `darwin-x86_64`
  - mac Apple Silicon: `darwin-aarch64`
  - Windows x64: `windows-x86_64`
- Generate `latest.json` after all macOS and Windows artifacts exist.
- Upload all required assets to the GitHub Release:
  - `latest.json`
  - mac x64 `.app.tar.gz` and `.sig`
  - mac arm64 `.app.tar.gz` and `.sig`
  - Windows x64 installer `.exe` and `.sig`
- Verify `latest.json` contains all three platform keys and points to the GitHub Release download URLs.
- Verify the GitHub Release is marked as `Latest`.
- Verify the uploaded asset digests match local SHA256 values.
- Verify the updater endpoint can be fetched with redirects from the same network users are likely to use:
  - `https://github.com/kim-wing/social-cover-designer/releases/latest/download/latest.json`
  - the redirected `https://github.com/.../releases/download/v<version>/latest.json`
  - the final `https://release-assets.githubusercontent.com/...` asset URL
- Treat `error sending request for url` as a network/update-source reachability issue first, not as a package-signature issue. GitHub Release downloads depend on both `github.com` and `release-assets.githubusercontent.com`.
- If users cannot reliably reach GitHub Release assets, mirror the same `latest.json` and all updater packages to a reliable CDN before shipping the next release, then add that CDN as an additional updater endpoint in `src-tauri/tauri.conf.json`.
- Verify an older installed app can check the GitHub endpoint and see the newer version.

Do not treat a release as finished if any platform package, signature, or `latest.json` entry is missing. If Windows packaging is delayed, hold the release instead of publishing a macOS-only update.

The updater endpoint is:

```text
https://github.com/kim-wing/social-cover-designer/releases/latest/download/latest.json
```

GitHub Release is the current update source. If users cannot reach GitHub or `release-assets.githubusercontent.com`, the updater may fail even when the package is correct. In that case, a previously shipped build cannot be fixed remotely if its only endpoint is GitHub; users must install the newer build manually once. Future builds should include a mirrored CDN endpoint so automatic updates can fall back when GitHub Release redirects are blocked.

For local update testing:

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/youdesign-updater.key)" TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" npm run build
UPDATE_RELEASE_BASE_URL=http://127.0.0.1:17888 npm run tauri:local-update-manifest
python3 -m http.server 17888 --directory local-update-test/server
```

For GitHub Releases, upload these assets to the latest release:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-<version>-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-<version>-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-<version>-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-<version>-mac-arm64.app.tar.gz.sig`
- Windows updater archive and `.sig`, after building on Windows

The updater endpoint is configured as:

```text
https://github.com/kim-wing/social-cover-designer/releases/latest/download/latest.json
```

For public releases, generate `latest.json` without `UPDATE_RELEASE_BASE_URL` so the package URL points to GitHub Releases.
