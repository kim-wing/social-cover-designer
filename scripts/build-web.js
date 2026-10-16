const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const hash = data => crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const entry of ['index.html', 'src', 'logo', '游小侠', 'build/icon.png']) {
  fs.cpSync(path.join(root, entry), path.join(dist, entry), {
    recursive: true, filter: source => path.basename(source) !== '.DS_Store'
  });
}
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
const vendorRoot = path.join(root, 'node_modules/@huggingface/transformers/dist');
const vendorFiles = ['transformers.min.js', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm'];
const vendorHash = hash(Buffer.concat(vendorFiles.map(name => fs.readFileSync(path.join(vendorRoot, name)))));
const vendorFolder = `transformers-${vendorHash}`;
fs.mkdirSync(path.join(dist, 'vendor', vendorFolder), { recursive: true });
for (const name of vendorFiles) fs.copyFileSync(path.join(vendorRoot, name), path.join(dist, 'vendor', vendorFolder, name));
const appPath = path.join(dist, 'src/app.js');
fs.writeFileSync(appPath, fs.readFileSync(appPath, 'utf8')
  .replace(/const APP_VERSION = .*?;/, `const APP_VERSION = ${JSON.stringify(version)};`)
  .replace('../vendor/transformers/', `../vendor/${vendorFolder}/`));
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
for (const name of fs.readdirSync(path.join(dist, 'src'))) {
  if (!/\.(js|css)$/.test(name)) continue;
  const content = fs.readFileSync(path.join(dist, 'src', name));
  const hashedName = name.replace(/\.(js|css)$/, `.${hash(content)}.$1`);
  fs.renameSync(path.join(dist, 'src', name), path.join(dist, 'src', hashedName));
  html = html.replace(new RegExp(`src/${name.replace('.', '\\.')}([?][^"']*)?`, 'g'), `src/${hashedName}`);
}
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: blob:; connect-src 'self' https://api.unsplash.com https://images.unsplash.com https://*.unsplash.com https://huggingface.co https://*.huggingface.co https://*.hf.co https://cdn.jsdelivr.net; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
/
  Cache-Control: public, max-age=0, must-revalidate
/index.html
  Cache-Control: public, max-age=0, must-revalidate
/version.json
  Cache-Control: public, max-age=0, must-revalidate
/src/*
  Cache-Control: public, max-age=31536000, immutable
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
`);
fs.writeFileSync(path.join(dist, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }));
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ version, builtAt: new Date().toISOString() }));
console.log(`Built YOUDESIGN ${version}; browser-only model runtime, hashed assets, API-only Function routes.`);
