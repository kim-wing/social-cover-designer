const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const websiteIndex = path.join(root, "website", "index.html");

const repo = process.env.GITHUB_REPOSITORY || "kim-wing/social-cover-designer";
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || "youdesign";
const branch = process.env.CLOUDFLARE_PAGES_BRANCH || "main";
const releaseBaseUrl = process.env.UPDATE_RELEASE_BASE_URL
  || `https://github.com/${repo}/releases/latest/download`;

const args = new Set(process.argv.slice(2));
const shouldDeploy = args.has("--deploy");
const shouldVerify = !args.has("--no-verify");

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
    }
  });
}

function getReleaseTag() {
  const explicitTag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
  if (explicitTag && /^v?\d+\.\d+\.\d+/.test(explicitTag)) {
    return explicitTag;
  }

  const release = JSON.parse(run("gh", [
    "release",
    "view",
    "--repo",
    repo,
    "--json",
    "tagName"
  ]));
  return release.tagName;
}

function getReleaseAssetNames(tagName) {
  const release = JSON.parse(run("gh", [
    "release",
    "view",
    tagName,
    "--repo",
    repo,
    "--json",
    "assets"
  ]));
  return release.assets.map(asset => asset.name);
}

function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    throw new Error(`Could not find ${label} in website/index.html`);
  }
  return content.replace(pattern, replacement);
}

function updateWebsite(version) {
  const releaseBase = releaseBaseUrl.replace(/\/$/, "");
  // Next macOS release should point website downloads to public DMG assets once they are generated and uploaded.
  const downloads = {
    "mac-arm": `${releaseBase}/YOUDESIGN-${version}-mac-arm64.app.tar.gz`,
    "mac-intel": `${releaseBase}/YOUDESIGN-${version}-mac-x64.app.tar.gz`,
    windows: `${releaseBase}/YOUDESIGN-${version}-win-x64-setup.exe`
  };

  let content = fs.readFileSync(websiteIndex, "utf8");
  content = replaceRequired(
    content,
    /<h2 id="download-title">下载 YOUDESIGN [^<]+<\/h2>/,
    `<h2 id="download-title">下载 YOUDESIGN ${version}</h2>`,
    "download title"
  );

  for (const [platform, url] of Object.entries(downloads)) {
    const pattern = new RegExp(
      `(<a class="download-row(?: recommended)?" data-platform="${platform}" href=")[^"]+(")`,
      "g"
    );
    content = replaceRequired(
      content,
      pattern,
      `$1${url}$2`,
      `${platform} download URL`
    );
  }

  fs.writeFileSync(websiteIndex, content);
  console.log(`Updated website downloads to YOUDESIGN ${version}`);
}

function assertReleaseAssets(version, assetNames) {
  const requiredAssets = [
    "latest.json",
    `YOUDESIGN-${version}-mac-arm64.app.tar.gz`,
    `YOUDESIGN-${version}-mac-x64.app.tar.gz`,
    `YOUDESIGN-${version}-win-x64-setup.exe`
  ];
  const missing = requiredAssets.filter(asset => !assetNames.includes(asset));
  if (missing.length) {
    throw new Error(`Release is missing required assets: ${missing.join(", ")}`);
  }
}

function deployWebsite() {
  if (process.env.GITHUB_ACTIONS && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID GitHub secret.");
  }

  console.log(`Deploying website/ to Cloudflare Pages project ${projectName}`);
  run("npx", [
    "wrangler",
    "pages",
    "deploy",
    "website",
    "--project-name",
    projectName,
    "--branch",
    branch,
    "--commit-dirty=true"
  ], { stdio: "inherit" });
}

const tagName = getReleaseTag();
const version = tagName.replace(/^v/, "");
const assetNames = getReleaseAssetNames(tagName);

if (shouldVerify) {
  assertReleaseAssets(version, assetNames);
}

updateWebsite(version);

if (shouldDeploy) {
  deployWebsite();
}
