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
win x64 build: failed, blocked by missing x86_64-w64-mingw32-windres
local update manifest: passed
```

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.11-mac-arm64.app.tar.gz.sig`

Local SHA256:

```text
latest.json: sha256:31151b5b48e8d2b9c388c80d01d2e80b1c11f517cbffe25d2c64959dee249a66
YOUDESIGN-1.0.11-mac-x64.app.tar.gz: sha256:28cf48293a04f80eab063846ba43c9e6082c283126cecff27bc5e049c3ddbe9c
YOUDESIGN-1.0.11-mac-x64.app.tar.gz.sig: sha256:cd536540063a36b48b0dda42e832899a95a08c65defa7bfad187a9c40e7521a2
YOUDESIGN-1.0.11-mac-arm64.app.tar.gz: sha256:151adba615403418cd0d48f0d0c4bc595a8181e50b4fced1239c37028ae4ae71
YOUDESIGN-1.0.11-mac-arm64.app.tar.gz.sig: sha256:b8d60ad07b83760aba7a4720253515951b675796e62a877687b3177d883a3160
```

## Notes

- macOS notarization is still skipped because Apple notarization environment variables are not configured.
- Windows x64 packaging was attempted with `x86_64-pc-windows-gnullvm`, but the local machine does not have `x86_64-w64-mingw32-windres`.
- Installing `mingw-w64` through Homebrew is currently blocked by local `/usr/local` permissions and sudo password input, so no Windows installer was uploaded for v1.0.11.
