const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const entries = [
  "index.html",
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

console.log(`Prepared Tauri frontend assets in ${path.relative(root, dist)}`);
