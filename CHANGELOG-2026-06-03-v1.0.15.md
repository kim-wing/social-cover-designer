# YOUDESIGN v1.0.15 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.15
```

## Changes

- Added rounded-corner support for triangle shapes.
  - Triangle shapes now show the radius control in the right inspector.
  - Triangle radius is applied consistently on canvas rendering, boolean shape paths, and SVG export.
- Changed the default star shape style.
  - Newly added star shapes no longer include a default stroke.
- Fixed grouped layer resizing.
  - Drag/resize snapshots now deep-clone grouped children.
  - This prevents the group children from mutating the original start state during resize, which caused grouped text and shape layers to scale unpredictably.

## Release Requirements

- Version bumped to `1.0.15`.
- Default canvas remains empty before packaging.
- Release must include auto-update assets for:
  - mac x64
  - mac Apple Silicon
  - Windows x64
  - `latest.json`

## Verification

```text
inline script syntax check: passed
mac x64 build: passed
mac arm64 build: passed
win x64 build: passed through GitHub Actions Windows runner
local update manifest: passed
GitHub release upload: passed
auto-update test from older installed build: not run
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.15-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.15-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.15-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.15-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.15-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.15-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:72951d4375e30edd60c6f3ba2acac133ad0e1398273f7fd933a9057e7472c08d
YOUDESIGN-1.0.15-mac-x64.app.tar.gz: sha256:48e3fa0c5a3435b5ed58f43845712e22225a0c500d5b44a665125d4b1ebaa792
YOUDESIGN-1.0.15-mac-x64.app.tar.gz.sig: sha256:f40baaf91ce3e1938bb53c839faa8341a9cfed09e620e9a91ebf4343b1151f2c
YOUDESIGN-1.0.15-mac-arm64.app.tar.gz: sha256:37c8d09ab723bbc3aa81d037e12e8ce813c1bc1de85503068ab315643d89fc13
YOUDESIGN-1.0.15-mac-arm64.app.tar.gz.sig: sha256:5f2aada42f0573e36221536e3679ace032938d861aac58e971fdc17a263255fc
YOUDESIGN-1.0.15-win-x64-setup.exe: sha256:173101689fda2c930815c460501c2e6dcf0822a4512a4de660bf0009884a4143
YOUDESIGN-1.0.15-win-x64-setup.exe.sig: sha256:e62884c28ddfdcb96facfc61c0842801a6dc70e97f292149218a0b4d16f4159d
```

## Packaging Notes

- GitHub Actions run: `26870513123`.
- The first bulk `gh release create` upload stalled after creating a draft release and uploading small assets. Missing large assets were uploaded individually with `gh release upload`, then the draft was published as `latest`.
- The macOS build must run with `/usr/bin` before Python Framework paths in `PATH`; otherwise Tauri may pick `/Library/Frameworks/Python.framework/Versions/3.10/bin/xattr` and fail bundling.
