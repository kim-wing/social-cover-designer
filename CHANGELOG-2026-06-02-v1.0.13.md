# YOUDESIGN v1.0.13 update record

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.13
```

## Changes

- Added Photoshop-style clone stamp editing for image layers.
  - Click `仿制图章` on a selected image to enter stamp mode.
  - Hold `Alt/Option` and click the image to set the sample source.
  - Release `Alt/Option`, then drag with the left mouse button to clone from the sampled source.
  - The canvas shows the active brush size and sampled source point while editing.
  - Supports brush size, hardness, single-stroke undo, and explicit finish.
- Added multi-layer grouping.
  - `Cmd/Ctrl + G` groups selected layers.
  - `Cmd/Ctrl + Shift + G` ungroups selected groups.
  - Grouped layers can be moved, scaled, serialized, imported, exported, and shown in the layer list.
- Improved multi-layer editing.
  - Multiple selected layers can now move together when dragging any already-selected layer.
  - Multiple selected layers can resize together through the selection handles.
  - Canvas sweep selection now shows a visible selection rectangle and selects layers passed by the pointer.
- Added common design shortcuts.
  - `Cmd/Ctrl + C` and `Cmd/Ctrl + V` copy and paste layers inside the project.
  - `Cmd/Ctrl + D`, `Cmd/Ctrl + [` / `]`, arrow-key nudging, delete, undo, redo, select-all, export, grouping, and ungrouping follow Figma/Photoshop-style expectations.
- Renamed `组件` to `形状` and expanded shape tools.
  - Added triangle, star, and polygon shapes.
  - Existing shape rendering, SVG export, and boolean operations now support the new shape types.
- Improved image editing tools.
  - Added manual crop controls and fixed the previous horizontal crop offset issue.
  - Kept mask brush and erase brush selected states visually clearer.
  - Optimized mask brush rendering to avoid recomposing image data on every pointer move.
- Updated usage documentation.
  - Added clone stamp usage instructions.
  - Added grouping, multi-select, shortcut, and new shape instructions.

## Verification

```text
inline script syntax check: pending final release build
mac x64 build: pending
mac arm64 build: pending
win x64 build: pending through GitHub Actions Windows runner
local update manifest: pending
```

## Packaging Notes

- Use system `xattr` when building on macOS. Put `/usr/bin:/bin:/usr/sbin:/sbin` before Python framework paths in `PATH`; otherwise Tauri may pick `/Library/Frameworks/Python.framework/.../bin/xattr`, which does not support `-r`.
- Use the updater signing key from `/Users/youxiake/.tauri/youdesign-updater.key` for macOS and Windows builds.
- macOS notarization is still skipped unless Apple notarization environment variables are configured.
- Windows x64 packaging should use the existing GitHub Actions `Windows build` workflow.

## Follow-up Optimization Notes

- Clone stamp is a manual clone tool, not content-aware fill. If needed later, add a separate AI/inpaint tool instead of overloading the stamp interaction.
- Consider adding a stamp source-alignment toggle if users need Photoshop's aligned/unaligned behavior.
- Consider adding keyboard shortcuts for brush size and hardness after validating current stamp workflow.
- Test clone stamp with heavily cropped and rotated images on both macOS and Windows after release.
