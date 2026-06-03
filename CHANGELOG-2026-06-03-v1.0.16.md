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
inline script syntax check: passed
mac x64 build: passed
mac arm64 build: passed
win x64 build: passed through GitHub Actions Windows runner
local update manifest: passed
GitHub release upload: passed
GitHub updater reachability: passed
auto-update test from older installed build: not run
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.16-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.16-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.16-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.16-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.16-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.16-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:d55ef8a7b5cc83c869536d34beacc6d9fb96166b0a216812716c371f1b06f59e
YOUDESIGN-1.0.16-mac-x64.app.tar.gz: sha256:fcf521298698599f6713668d6239002c8483b961e43eb604d7c658bd6ce6fce4
YOUDESIGN-1.0.16-mac-x64.app.tar.gz.sig: sha256:b7bd8fa4480b4505cf362978429f75f45d6067b82e7f6b51391891d616860626
YOUDESIGN-1.0.16-mac-arm64.app.tar.gz: sha256:c65846edcde986994988a5dc187686cad352e434cfc0b18fcf6201aeec260219
YOUDESIGN-1.0.16-mac-arm64.app.tar.gz.sig: sha256:7cab32059b2eacb0bb8cc4233b475c6c474fdb86b248332591223b19e81784f0
YOUDESIGN-1.0.16-win-x64-setup.exe: sha256:52b10d8891761fe03b149703713e3b8aa56d377166c4c229fb31e39056dc707e
YOUDESIGN-1.0.16-win-x64-setup.exe.sig: sha256:17764a3e8f5cafa635b9ebaaf22c8522f86a241cc6aeb26f44d900186dd4ae6b
```

## Packaging Notes

- GitHub Actions run: `26873969822`.
- Windows artifact download through `gh run download` stalled twice; the artifact was downloaded through `gh api repos/kim-wing/social-cover-designer/actions/artifacts/7380038133/zip` instead.
- GitHub updater reachability check passed through redirects:
  - `releases/latest/download/latest.json`
  - `releases/download/v1.0.16/latest.json`
  - final `release-assets.githubusercontent.com` URL
