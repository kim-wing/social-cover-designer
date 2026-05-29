# YOUDESIGN 2026-05-29 change record

This file consolidates the 2026-05-29 build records and user-facing usage notes.

## Released: v1.0.7

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.7
```

Changes:

- Added image background removal controls to the right inspector.
- Added RMBG-1.4 lazy loading through Transformers.js:
  - first use requires network access
  - model is downloaded only when the user clicks smart background removal
  - image processing runs locally after the model is loaded
- Added mask refinement mode for selected images:
  - keep brush
  - erase brush
  - brush size
  - brush hardness
  - mask overlay toggle
  - undo last refinement stroke
  - finish refinement
- Added restore-original-image support for processed images.
- Extended image project data with mask/original-image fields while keeping runtime-only image objects out of saved project JSON.
- Bumped app version to `1.0.7`.

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig`

GitHub asset digests:

```text
latest.json: sha256:df2b2499f590e11e915c2b1cf12425ef773fd24441d5a8537ee0326a942401c7
YOUDESIGN-1.0.7-mac-x64.app.tar.gz: sha256:76a34edbbf452801f0934560dd497de1110886e8391a53d2cc31c9f95f7486c4
YOUDESIGN-1.0.7-mac-x64.app.tar.gz.sig: sha256:3c23736e0dd5ddd0c5a7f660bb442c029edd6fdfcf433667d7bff04cd16a44cb
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz: sha256:affbfdc4412e6af2a5c93f9b822e569cf5cfb18459c40196d25e7146e9c7ce78
YOUDESIGN-1.0.7-mac-arm64.app.tar.gz.sig: sha256:94d91857439a402cd5e661f195d628dad66c86efa62f7aef13365628ba0c4707
```

Build caveats:

- macOS bundles were ad-hoc signed with identity `-`.
- macOS notarization was skipped because Apple notarization environment variables are not configured.
- Windows x64 was attempted but not uploaded because local NSIS packaging failed: `makensis.exe` was unavailable, and Homebrew reported the current macOS version as unsupported.

## Released: v1.0.8

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.8
```

Changes:

- Fixed the background-removal refinement workflow.
- Added a visible `修边` button for selected image layers.
- Manual mask brush editing no longer depends on a successful smart background-removal run.
- If an image has no existing mask, entering `修边` creates a full-keep mask first:
  - use `擦除画笔` to remove unwanted areas
  - use `保留画笔` to restore removed areas
- Bumped app version to `1.0.8`.

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-arm64.app.tar.gz.sig`

GitHub asset digests:

```text
latest.json: sha256:45e90386a58242edab980b81a37d1f75e989df9de744caaccffe5ff7524a65de
YOUDESIGN-1.0.8-mac-x64.app.tar.gz: sha256:c8c35a2563d23dc32196070e27027939137c64d23c9475a95b46865a7345e07f
YOUDESIGN-1.0.8-mac-x64.app.tar.gz.sig: sha256:d1e526d6ae204727b71bf44f51a3cc8a30847bb399ecba03bca165bba707b0b5
YOUDESIGN-1.0.8-mac-arm64.app.tar.gz: sha256:eab54d2c3b6ff082788a4b5d88d0b6f9c4b350e44d448f7a5afc63b901c5d7f6
YOUDESIGN-1.0.8-mac-arm64.app.tar.gz.sig: sha256:f5626e427eac76d19161e77523662de576476ec7c44124bc4a763807a4c83bfc
```

## Released: v1.0.9

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.9
```

Changes:

- Added visible brush-size preview in mask refinement mode.
- Brush preview follows the pointer on the canvas.
- Preview radius reflects the current `画笔` slider value.
- Preview color reflects the active brush mode:
  - green for `保留画笔`
  - orange-red for `擦除画笔`
- Pointer leaving the canvas hides the preview.
- Bumped app version to `1.0.9`.

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.9-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.9-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.9-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.9-mac-arm64.app.tar.gz.sig`

GitHub asset digests:

```text
latest.json: sha256:429ab0f8c2840f5943a0a1d8159b8ada2536b129902ea6614e696bccc3096f1c
YOUDESIGN-1.0.9-mac-x64.app.tar.gz: sha256:06f6d62a8d2c44ae874bc35cd776f9e345ab685099a64b2584d93d71e691271a
YOUDESIGN-1.0.9-mac-x64.app.tar.gz.sig: sha256:55cc748aa17b22e2bdb7e3c962ae9a74e3fdee4ab00f21fe41ed16a6d1be1ea1
YOUDESIGN-1.0.9-mac-arm64.app.tar.gz: sha256:5be9e3765b4b56056d04d48767900dd0e18f0d67d88e5a89669f6ad7983eec75
YOUDESIGN-1.0.9-mac-arm64.app.tar.gz.sig: sha256:92f18a1408ca998974eb6a5a151ee00e1d761c01d7adeeaf6d6bc92cf9f9ef53
```

## Released: v1.0.10

Status:

- Packaged for macOS Intel and Apple Silicon.
- Ready for GitHub release upload.
- Windows installer was not uploaded because local NSIS packaging is still unavailable.

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.10
```

Changes:

- Changed desktop export behavior from automatically writing to the Downloads folder to opening a native system save dialog.
- Applies to both:
  - `导出图片`
  - `导出工程`
- The user can now choose the target folder and filename before saving.
- Canceling the save dialog returns an empty path and does not show a success alert.
- Browser fallback behavior is unchanged.
- Added `rfd = "0.15"` to `src-tauri/Cargo.toml`.
- Updated `save_export_file` in `src-tauri/src/lib.rs` to use `rfd::FileDialog::save_file()`.
- Added file type filters for:
  - PNG
  - JPG/JPEG
  - YOUDESIGN project files
- Removed the previous Downloads-directory path generation path from the Tauri command.
- Added support for pasting image data from the system clipboard directly into the canvas.
- Works when the focused element is not an input, textarea, select, or inline text editor.
- Clipboard image files are converted to data URLs and added through the same image object path as upload.
- The pasted image is centered on the canvas and selected immediately.
- Bumped app version to `1.0.10`.

Build results:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.10-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.10-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.10-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.10-mac-arm64.app.tar.gz.sig`

Local SHA256:

```text
latest.json: sha256:fe80a564fc35906845fc1cb42d559dbb25b5883f1074005e399ac462db0e3da8
YOUDESIGN-1.0.10-mac-x64.app.tar.gz: sha256:bbd7bf4f5eaf49b12eb41cecbd5cc9e507a6fb5407f894225c061f9264b3c103
YOUDESIGN-1.0.10-mac-x64.app.tar.gz.sig: sha256:566fe0675baaa7dbdc2931ca7300103ad1d04e04227420213c3d1368579d0a98
YOUDESIGN-1.0.10-mac-arm64.app.tar.gz: sha256:aa7d04aea980a6d20e4aa24fae24194a474598ce59fdaf3ecd4a0471f04504c4
YOUDESIGN-1.0.10-mac-arm64.app.tar.gz.sig: sha256:c8641731147bef10e09f95c8dfbc3b2534e90a3c86b6a4a9cf7a9236b35f5d60
```

Verification:

```text
inline script syntax check: passed
cargo check: passed
npm run build:mac: passed
npm run build:mac:arm: passed
npm run tauri:local-update-manifest: passed
```

## Software Features and Usage

YOUDESIGN is a local desktop cover-design tool for social-media visuals, especially travel and content-operation cover images. It supports platform presets, manual layout editing, AI image generation, local background removal, project import/export, and final PNG/JPG export.

Core workflow:

1. Choose a canvas size from the left size panel, or use custom width and height.
2. Add images by upload, clipboard paste, generated image output, built-in logos, or mascot assets.
3. Add text, badges, shapes, overlays, and decorative elements.
4. Select any object on the canvas to edit position, size, rotation, color, opacity, shadow, layer order, and alignment in the right inspector.
5. Export the final image as PNG or JPG at 1x or 2x scale.
6. Export a `.youdesign` project file when the design needs to be edited again later.

Main feature groups:

- Canvas presets: Xiaohongshu covers, WeChat/official-account style covers, Douyin/Video Account/Bilibili-oriented cover ratios, and custom canvas sizes.
- Image input: upload local images, paste copied images directly into the canvas, insert generated images, add built-in brand logos, and add mascot assets.
- AI prompt and image generation: fill travel/content fields, generate a structured prompt, copy it, or call OpenAI image generation with a locally stored API key.
- Background removal: selected image layers can use RMBG-1.4 smart background removal. First use requires network access to download the model; after the model is loaded, image processing runs locally.
- Manual mask refinement: use `修边` to enter mask editing, switch between `保留画笔` and `擦除画笔`, adjust brush size and hardness, preview the real brush size on the canvas, toggle mask overlay, undo the last stroke, finish refinement, or restore the original image.
- Text tools: add title, normal text, subtitle, big number, vertical text, pill tags, corner badges, and top-number badges; edit content, font, size, alignment, color, stroke, opacity, and shadow.
- Shape tools: add rectangle, circle, divider, and overlay elements; edit fill, stroke, rounded corners, opacity, shadow, and layer position.
- Editing controls: select, drag, resize, rotate, duplicate, delete, undo, redo, align left/center/right, move forward/backward, bring to front, send to back, and zoom the canvas.
- Export: desktop builds now open the system save dialog for `导出图片` and `导出工程`, so the user can choose the folder and filename instead of being forced into the Downloads folder.
- Updates: the desktop app can check for updates and install the downloaded update after restart.

Important notes:

- RMBG-1.4 background removal is optional. Users who do not need smart background removal do not need to download the model.
- The first RMBG-1.4 use requires network access because the model is fetched from Hugging Face through Transformers.js.
- OpenAI image generation requires the user's own OpenAI API key and network access.
- Most manual design operations, project editing, mask refinement after model load, and export operations run locally.
- macOS builds were ad-hoc signed. Apple notarization is not configured.
