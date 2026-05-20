# YOUDESIGN Desktop

## Development

```bash
npm install
npm start
```

## Build

```bash
npm run build:mac
npm run build:win
```

Build outputs are written to `release/`.

Current targets:

- macOS: `YOUDESIGN-<version>-mac-x64.zip`
- Windows: `release/win-unpacked/YOUDESIGN.exe`

The desktop icon source is `标准logo.png`. Generated icon assets live in `build/icon.png`, `build/icon.icns`, and `build/icon.ico`.

To distribute the Windows version as one file, zip the full `release/win-unpacked` folder. The app must keep the files in that folder together.

## Update Check

The app has a desktop menu item: `YOUDESIGN > 检查更新`.

Update checks use GitHub Releases. Before publishing, replace this placeholder in `index.html`:

```js
const UPDATE_API_URL = "https://api.github.com/repos/your-org/youdesign/releases/latest";
```

with your real repository, for example:

```js
const UPDATE_API_URL = "https://api.github.com/repos/youxiake/youdesign/releases/latest";
```

When a newer release tag is available, such as `v1.0.1`, the app prompts the user to open the release download page.

## Release Notes

The generated mac app is not Apple Developer ID signed yet. Unsigned mac builds may show a Gatekeeper warning on other machines. For public distribution, add an Apple Developer certificate and notarization.

The generated Windows directory build is unsigned. Windows may show SmartScreen warnings until you add a code signing certificate.
