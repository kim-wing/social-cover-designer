const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const entries = [
  "index.html",
  "src",
  "logo",
  "游小侠"
];

function copyEntry(entry) {
  const from = path.join(root, entry);
  const to = path.join(dist, entry);
  if (!fs.existsSync(from)) {
    throw new Error(`Missing required asset: ${entry}`);
  }
  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    filter(source) {
      const name = path.basename(source);
      return name !== ".DS_Store";
    }
  });
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
entries.forEach(copyEntry);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const appJs = path.join(dist, "src", "app.js");
const appJsContent = fs.readFileSync(appJs, "utf8")
  .replace(
    /const APP_VERSION = .*?;/,
    `const APP_VERSION = ${JSON.stringify(packageJson.version)};`
  );
fs.writeFileSync(appJs, appJsContent);

console.log(`Prepared Tauri frontend assets in ${path.relative(root, dist)}`);
