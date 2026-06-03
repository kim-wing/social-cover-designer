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
inline script syntax check: pending
mac x64 build: pending
mac arm64 build: pending
win x64 build: pending
local update manifest: pending
GitHub release upload: pending
```
