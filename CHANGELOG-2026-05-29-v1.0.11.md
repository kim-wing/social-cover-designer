# YOUDESIGN v1.0.11 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.11
```

## Changes

- Added image crop mode for selected image layers.
  - The crop frame now changes the visible image bounds instead of stretching the image inside the original frame.
  - Crop can be adjusted by dragging crop handles on the canvas.
  - Crop can also be adjusted numerically from the right inspector.
  - Crop data is saved in project files and applied during image export.
- Simplified the top toolbar.
  - Removed visible copy and delete icon buttons.
  - Removed the always-visible image format dropdown.
  - Export format is now chosen when clicking `导出图片`.
- Added layer-wide selection controls.
  - Added top toolbar `全选图层`.
  - Added `Cmd/Ctrl + A` to select all canvas layers.
  - Existing multi-select by `Shift/Cmd/Ctrl` click remains available.
  - Multi-selected layers can be moved together and resized together from the shared selection bounds.
- Added spacebar canvas panning.
  - Hold `Space` to enter hand/pan mode.
  - Drag the stage while holding `Space` to move around the canvas viewport.
- Improved layer list ordering.
  - Layers in the right panel can be dragged to change their stacking order.
  - Drop position now distinguishes before/after placement.
- Improved divider/line component behavior.
  - New divider defaults to a true 1 px line instead of a thick rectangle.
  - Line layers expose line color, line width, opacity, shadow, and dashed style.
  - Line layers no longer show fill color controls.
- Added dashed line support for divider components.
- Added boolean operations for shape components.
  - Supports `并集`, `相减`, `相交`, and `异或`.
  - Works on selected shape layers, including rectangles, circles, lines, and generated compound shapes.
- Fixed the upload/paste image entry icon alignment.
  - The image icon is now centered inside the neutral gray background tile.
- Bumped app version to `1.0.11`.

## Verification

```text
inline script syntax check: passed
cargo check: passed
mac x64 build: passed
mac arm64 build: passed
win x64 build: passed through GitHub Actions Windows runner
local update manifest: passed
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.11-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.11-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:afb00615b7ac9fc6ea62f988a28de6df62f03abd502ec321c4850f2dba2a4c41
YOUDESIGN-1.0.11-mac-x64.app.tar.gz: sha256:28cf48293a04f80eab063846ba43c9e6082c283126cecff27bc5e049c3ddbe9c
YOUDESIGN-1.0.11-mac-x64.app.tar.gz.sig: sha256:cd536540063a36b48b0dda42e832899a95a08c65defa7bfad187a9c40e7521a2
YOUDESIGN-1.0.11-mac-arm64.app.tar.gz: sha256:151adba615403418cd0d48f0d0c4bc595a8181e50b4fced1239c37028ae4ae71
YOUDESIGN-1.0.11-mac-arm64.app.tar.gz.sig: sha256:b8d60ad07b83760aba7a4720253515951b675796e62a877687b3177d883a3160
YOUDESIGN-1.0.11-win-x64-setup.exe: sha256:d365be56c01d88f2cbdd4d98e083c553339e0de430c863e54e3694e4a5ada2fa
YOUDESIGN-1.0.11-win-x64-setup.exe.sig: sha256:295fb74a0c4713683dab342116cbcec4dc7a6b76d32c7c466c8a25c560be3bfc
```

## Notes

- macOS notarization is still skipped because Apple notarization environment variables are not configured.
- Windows x64 packaging was completed through GitHub Actions on `windows-latest`.
- Local macOS cross-compilation can build `youdesign.exe` after adding `llvm-mingw`, but local NSIS packaging still needs `makensis.exe`.
- A GitHub Actions workflow was added at `.github/workflows/windows-build.yml` so Windows packaging does not depend on this macOS machine's Homebrew/NSIS setup.

## Windows Packaging Method

Preferred method: GitHub Actions Windows runner.

1. Make sure the updater signing private key exists as a GitHub secret:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < /Users/youxiake/.tauri/youdesign-updater.key
```

2. Push the commit that contains `.github/workflows/windows-build.yml`.

3. Trigger the workflow:

```bash
gh workflow run windows-build.yml -f version=1.0.11 --ref main
```

4. Watch the run:

```bash
gh run list --workflow "Windows build"
gh run watch <run-id>
```

5. Download the artifact:

```bash
gh run download <run-id> -n YOUDESIGN-1.0.11-win-x64 -D /private/tmp/youdesign-win-1.0.11
```

6. Copy the generated files into `local-update-test/server` with release-friendly names:

```bash
cp /private/tmp/youdesign-win-1.0.11/*.exe local-update-test/server/YOUDESIGN-1.0.11-win-x64-setup.exe
cp /private/tmp/youdesign-win-1.0.11/*.sig local-update-test/server/YOUDESIGN-1.0.11-win-x64-setup.exe.sig
```

7. Regenerate `latest.json` so the Windows platform is included:

```bash
npm run tauri:local-update-manifest
```

Local fallback method on macOS:

1. Download a prebuilt `llvm-mingw` toolchain:

```bash
mkdir -p /private/tmp/llvm-mingw-youdesign
curl -L https://github.com/mstorsjo/llvm-mingw/releases/download/20260519/llvm-mingw-20260519-ucrt-macos-universal.tar.xz -o /private/tmp/llvm-mingw-youdesign/llvm-mingw.tar.xz
tar -xf /private/tmp/llvm-mingw-youdesign/llvm-mingw.tar.xz -C /private/tmp/llvm-mingw-youdesign
```

2. Build with the temporary toolchain on `PATH`:

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat /Users/youxiake/.tauri/youdesign-updater.key)" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
PATH=/private/tmp/llvm-mingw-youdesign/llvm-mingw-20260519-ucrt-macos-universal/bin:/Users/youxiake/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin \
npm run tauri -- build --target x86_64-pc-windows-gnullvm --bundles nsis
```

This local fallback compiles `youdesign.exe`, but it still needs NSIS `makensis.exe` to create the installer. On this machine, Homebrew NSIS installation is blocked because the installed Homebrew does not recognize the current macOS version (`unknown or unsupported macOS version: :dunno`). The v1.0.11 Windows installer was produced with the GitHub Actions method.
