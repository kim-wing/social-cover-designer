# YOUDESIGN v1.0.12 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.12
```

## Changes

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
```

Build results will be filled after packaging:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.12-mac-arm64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe`
- `local-update-test/server/YOUDESIGN-1.0.12-win-x64-setup.exe.sig`

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
