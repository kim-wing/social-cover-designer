# YOUDESIGN AI Image Module Draft Record

Date: 2026-06-04

Status: packaged and prepared for v1.0.17 release overwrite.

## Scope

- Integrated QuickRouter image generation API for `gpt-image-2`.
- Integrated QuickRouter image edit API for selected canvas images.
- Added multi-step editing flow:
  - Generate an image from the AI image module.
  - Select the generated image on the canvas.
  - Enter a new edit instruction.
  - Replace the selected image with the edited result.
  - Repeat edits on the latest selected image.
- Renamed the left toolbar module from `Prompt` to `AI生图`.
- Reworked the AI image module layout into three user-facing sections:
  - `账号`: QuickRouter API Key and API application entry.
  - `生成新图`: travel business fields, model, quality, prompt output, copy, and generate.
  - `二次编辑`: selected-image edit prompt and edit action.
- Hid the Image API Base field from users.
- Added the QuickRouter API application link:

```text
https://api.quickrouter.ai/register?aff=roL9WF
```

## Files Changed

- `index.html`
  - Renamed module labels.
  - Reorganized the AI image panel layout.
  - Added QuickRouter API Key application entry.
  - Kept Image API Base hidden.
- `src/app.js`
  - Added QuickRouter API base handling with default `https://api.quickrouter.ai/v1`.
  - Added image generation request support.
  - Added image edit request support.
  - Added selected-image replacement after edit.
  - Added repeated edit support by reading the current selected image source.
- `src-tauri/src/lib.rs`
  - Added desktop-side image generation endpoint support.
  - Added desktop-side image edit endpoint support.
  - Added API base support for QuickRouter-compatible routes.
  - Added shared image response parsing.
- `src/styles.css`
  - Added AI image module grouping styles.
  - Improved button placement for generate and selected-image edit tasks.

## Verification

```text
node --check src/app.js: passed
npm run check: passed
npm run dev: Tauri dev app started successfully
```

## Packaging Status

Packaged for release overwrite.

## Follow-up Changes Before Release Upload

- Added `业务 Prompt / 自定义 Prompt` mode switching in the AI image generator.
- Kept the original business prompt workflow intact:
  - Business fields still auto-generate the tourism prompt.
  - The generated prompt output remains visible in business mode.
  - `复制 Prompt` remains available in business mode.
- Added custom prompt generation:
  - Custom mode shows a single custom prompt input.
  - Custom mode directly uses that input for image generation.
  - Custom mode hides the generated business prompt output and copy action.
- Fixed QuickRouter `gpt-image-2` image edit requests:
  - Desktop Tauri requests now use `multipart/form-data`.
  - Browser fallback requests now use `FormData`.
  - `reqwest` enables the `multipart` feature.
- Added a shared AI request in-flight lock:
  - Prevents duplicate generation/edit requests from repeated clicks.
  - Avoids a successful edit being visually overwritten by a later duplicate quota failure.
- Changed API Key persistence:
  - API Key is no longer saved by default.
  - Added an explicit `保存 API Key 到本机` opt-in checkbox.
  - When the option is off, old locally saved image API keys are cleared.

## Verification Before Upload

```text
node --check src/app.js: passed
cargo check --manifest-path src-tauri/Cargo.toml: passed
npm run build: passed during local app checks
```

## Release Overwrite Build Results

Commit:

```text
bbc1fd7 Improve AI image prompt and edit flow
```

Windows workflow:

```text
https://github.com/kim-wing/social-cover-designer/actions/runs/26938593465
Artifact ID: 7406098758
```

Generated release assets:

```text
latest.json: sha256:45c5e79668b97d16d40b2342503b6989b59161f77662b81a5d4e62dcd4c985f1
YOUDESIGN-1.0.17-mac-x64.app.tar.gz: sha256:d3b679e52fde34c5e2efe49f2d9018e5db6c9044804e007672a379c265d2a29b
YOUDESIGN-1.0.17-mac-x64.app.tar.gz.sig: sha256:10a22443cd748f18d9f67aacf03fdd53c490878524290be796a10ac984ce39db
YOUDESIGN-1.0.17-mac-arm64.app.tar.gz: sha256:8720bbb327d765ebe2c5d19916cc93f7abe65b8d4c2c1484c95f951b78946b91
YOUDESIGN-1.0.17-mac-arm64.app.tar.gz.sig: sha256:9bdfe29806af4037b812aefeaa6c1d1f40a461edbfb543e598a10c09756666d2
YOUDESIGN-1.0.17-win-x64-setup.exe: sha256:0bf4a0ba108b494a2f000d67fd97fa2d900c837985bafbe1fc8a790c1f76263d
YOUDESIGN-1.0.17-win-x64-setup.exe.sig: sha256:7dfd51923846cc0dea0005ef6500c2fefc6e59d579e2508726b4fdfeeafed7fc
```

GitHub release upload target:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.17
```
