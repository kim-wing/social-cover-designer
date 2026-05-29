# YOUDESIGN v1.0.8 build record

Date: 2026-05-29

## Changes

- Fixed the background-removal refinement workflow.
- Added a visible `修边` button for selected image layers.
- Manual mask brush editing no longer depends on a successful smart background-removal run.
- If an image has no existing mask, entering `修边` creates a full-keep mask first:
  - use `擦除画笔` to remove unwanted areas
  - use `保留画笔` to restore removed areas
- Bumped app version to `1.0.8`.

## Build results

Generated updater assets:

- `local-update-test/server/latest.json`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-x64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-x64.app.tar.gz.sig`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-arm64.app.tar.gz`
- `local-update-test/server/YOUDESIGN-1.0.8-mac-arm64.app.tar.gz.sig`

SHA-256:

```text
45e90386a58242edab980b81a37d1f75e989df9de744caaccffe5ff7524a65de  latest.json
c8c35a2563d23dc32196070e27027939137c64d23c9475a95b46865a7345e07f  YOUDESIGN-1.0.8-mac-x64.app.tar.gz
d1e526d6ae204727b71bf44f51a3cc8a30847bb399ecba03bca165bba707b0b5  YOUDESIGN-1.0.8-mac-x64.app.tar.gz.sig
eab54d2c3b6ff082788a4b5d88d0b6f9c4b350e44d448f7a5afc63b901c5d7f6  YOUDESIGN-1.0.8-mac-arm64.app.tar.gz
f5626e427eac76d19161e77523662de576476ec7c44124bc4a763807a4c83bfc  YOUDESIGN-1.0.8-mac-arm64.app.tar.gz.sig
```

## GitHub release

Release:

```text
https://github.com/kim-wing/social-cover-designer/releases/tag/v1.0.8
```

GitHub asset digests after upload:

```text
latest.json: sha256:45e90386a58242edab980b81a37d1f75e989df9de744caaccffe5ff7524a65de
YOUDESIGN-1.0.8-mac-x64.app.tar.gz: sha256:c8c35a2563d23dc32196070e27027939137c64d23c9475a95b46865a7345e07f
YOUDESIGN-1.0.8-mac-x64.app.tar.gz.sig: sha256:d1e526d6ae204727b71bf44f51a3cc8a30847bb399ecba03bca165bba707b0b5
YOUDESIGN-1.0.8-mac-arm64.app.tar.gz: sha256:eab54d2c3b6ff082788a4b5d88d0b6f9c4b350e44d448f7a5afc63b901c5d7f6
YOUDESIGN-1.0.8-mac-arm64.app.tar.gz.sig: sha256:f5626e427eac76d19161e77523662de576476ec7c44124bc4a763807a4c83bfc
```
