# YOUDESIGN v1.0.12 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.12
```

## Changes

- Local changes prepared for the next release:
  - Added a Photoshop-style clone stamp tool for image layers.
  - Interaction matches the familiar clone stamp flow: hold `Alt/Option` and click an image area to sample, then drag with the left mouse button to paint from the sampled source.
  - The canvas now shows the stamp brush size and sampled source point while editing.
  - Stamp editing supports brush size, hardness, single-stroke undo, and explicit finish.
  - Added image crop, grouping, multi-layer shortcuts, internal object copy/paste, and extra shape tools in the current local working tree.
- Improved direct text editing on the canvas.
  - Fixed the multiline inline editor getting stuck after entering multiple lines.
  - Matched the inline editor with the canvas text style.
  - Fixed the duplicate/ghost text effect while editing by temporarily hiding the canvas-rendered text layer during inline editing.
- Reworked the app icon rendering style.
  - Centralized icon rendering through `basiconsIcon()`.
  - Switched UI icons to a consistent line-icon style for toolbar, component cards, dialogs, crop actions, and boolean actions.
- Added SVG export.
  - Export format dialog now supports `JPG`, `PNG`, and `SVG`.
  - SVG export preserves text, simple shapes, lines, images, and image crop data.
  - Compound boolean shapes are embedded as raster fallback inside the SVG to preserve visual accuracy.
- Added swipe selection on the canvas.
  - Drag from an empty canvas area to select layers that the pointer passes over.
  - Hold `Shift`, `Cmd`, or `Ctrl` while swiping to add to the existing selection.
  - Swipe selection now shows a translucent selection box so the active state is visible.
- Improved multi-layer movement.
  - When multiple layers are selected, dragging any already-selected layer now moves the whole selected group instead of collapsing to a single layer.
- Bumped app version to `1.0.12`.

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
- `local-update-test/server/YOUDESIGN-1.0.12-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe.sig`

Local SHA256:

```text
latest.json: sha256:2d6527708d8443cde38a44004a691ede5c353c0278dcd55b4bada9f2d94550a3
YOUDESIGN-1.0.12-mac-x64.app.tar.gz: sha256:200563eef46e2a4255625ce7ef651ea39d065c0ef4291a30d60aac017f7b851b
YOUDESIGN-1.0.12-mac-x64.app.tar.gz.sig: sha256:a7fe2c5cc67beeab72187b8ae128de320f9e6e7b1c885cc844bffcbf8d88d404
YOUDESIGN-1.0.12-mac-arm64.app.tar.gz: sha256:a0b8edba6be37936967c03a6f41672b10dc7c0842d3f5c666cb3377e30672fd4
YOUDESIGN-1.0.12-mac-arm64.app.tar.gz.sig: sha256:b65d9904b8e31ed77f11fb7b12f994f012a9237fb2b0368779f350214c9f62b3
YOUDESIGN-1.0.12-win-x64-setup.exe: sha256:67dd3f523b84f643739008b421fe5ccfa51cb9903d67809d8eec7600cf50dc12
YOUDESIGN-1.0.12-win-x64-setup.exe.sig: sha256:df9d8ac0d017900202689c95797d4dc26e1c749e771763349ac95f07d16665e0
```

## Notes

- macOS notarization is still skipped because Apple notarization environment variables are not configured.
- Windows x64 packaging should use the existing GitHub Actions `Windows build` workflow if local NSIS packaging is unavailable.

## Windows Packaging Method

Preferred method: GitHub Actions Windows runner.

```bash
gh workflow run windows-build.yml -f version=1.0.12 --ref main
gh run list --workflow "Windows build"
gh run watch <run-id>
gh run download <run-id> -n YOUDESIGN-1.0.12-win-x64 -D /private/tmp/youdesign-win-1.0.12
```

After downloading the artifact:

```bash
cp /private/tmp/youdesign-win-1.0.12/*.exe local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe
cp /private/tmp/youdesign-win-1.0.12/*.sig local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe.sig
npm run tauri:local-update-manifest
```
