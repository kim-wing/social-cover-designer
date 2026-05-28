const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const serverDir = path.join(root, "local-update-test", "server");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const releaseBaseUrl = process.env.UPDATE_RELEASE_BASE_URL
  || "https://github.com/kim-wing/social-cover-designer/releases/latest/download";

const releaseBase = releaseBaseUrl.replace(/\/$/, "");
const candidates = [
  {
    target: "darwin-x86_64",
    archiveName: `YOUDESIGN-${packageJson.version}-mac-x64.app.tar.gz`,
    sourceArchive: path.join(root, "src-tauri", "target", "release", "bundle", "macos", "YOUDESIGN.app.tar.gz")
  },
  {
    target: "darwin-aarch64",
    archiveName: `YOUDESIGN-${packageJson.version}-mac-arm64.app.tar.gz`,
    sourceArchive: path.join(root, "src-tauri", "target", "aarch64-apple-darwin", "release", "bundle", "macos", "YOUDESIGN.app.tar.gz")
  },
  {
    target: "windows-x86_64",
    archiveName: `YOUDESIGN-${packageJson.version}-win-x64-setup.exe`,
    sourceArchive: [
      path.join(root, "src-tauri", "target", "x86_64-pc-windows-gnullvm", "release", "bundle", "nsis", `YOUDESIGN_${packageJson.version}_x64-setup.exe`),
      path.join(root, "src-tauri", "target", "x86_64-pc-windows-gnu", "release", "bundle", "nsis", `YOUDESIGN_${packageJson.version}_x64-setup.exe`)
    ]
  }
];

const platforms = {};
const copied = [];

fs.mkdirSync(serverDir, { recursive: true });
for (const candidate of candidates) {
  const sourceArchive = Array.isArray(candidate.sourceArchive)
    ? candidate.sourceArchive.find(item => fs.existsSync(item) && fs.existsSync(`${item}.sig`))
    : candidate.sourceArchive;
  const sourceSignature = `${sourceArchive}.sig`;
  if (!sourceArchive || !fs.existsSync(sourceArchive) || !fs.existsSync(sourceSignature)) continue;

  fs.copyFileSync(sourceArchive, path.join(serverDir, candidate.archiveName));
  fs.copyFileSync(sourceSignature, path.join(serverDir, `${candidate.archiveName}.sig`));
  platforms[candidate.target] = {
    url: `${releaseBase}/${candidate.archiveName}`,
    signature: fs.readFileSync(sourceSignature, "utf8").trim()
  };
  copied.push(`${candidate.target}: ${candidate.archiveName}`);
}

if (!copied.length) {
  throw new Error("Missing updater archives or signatures. Run signed Tauri builds first.");
}

const manifest = {
  version: packageJson.version,
  notes: `YOUDESIGN ${packageJson.version} updater release.`,
  pub_date: new Date().toISOString(),
  platforms
};

fs.writeFileSync(path.join(serverDir, "latest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote local updater manifest for ${packageJson.version}`);
copied.forEach(item => console.log(`- ${item}`));
console.log(`Serve with: python3 -m http.server 17888 --directory local-update-test/server`);
