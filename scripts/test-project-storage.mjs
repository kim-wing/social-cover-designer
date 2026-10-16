import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import '../src/project-storage.js';
import '../src/image-import.js';
globalThis.indexedDB = indexedDB;
globalThis.FileReader = class {
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buffer => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onload();
    }).catch(error => { this.error = error; this.onerror(); });
  }
};
const { ProjectStore, HistoryResources } = globalThis.YoudesignStorage;
const source = `data:image/png;base64,${Buffer.alloc(3 * 1024 * 1024, 127).toString('base64')}`;
const document = { width: 1080, height: 1440, objects: [
  { id: 'a', type: 'image', name: 'test', src: source },
  { id: 'b', type: 'group', name: 'nested', children: [{ id: 'c', type: 'image', name: 'nested image', src: source, originalSrc: source }] }
] };
const store = new ProjectStore('storage-regression');
await store.save(document);
assert.deepEqual(await store.load(), document);
const db = await store.open();
const requestValue = request => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
assert.equal(await requestValue(db.transaction('assets').objectStore('assets').count()), 1, 'duplicate images stored once');
const compact = await requestValue(db.transaction('documents').objectStore('documents').get('current'));
assert.ok(JSON.stringify(compact).length < 2000, 'metadata does not embed image bytes');
const history = new HistoryResources();
const entries = Array.from({ length: 60 }, (_, index) => history.capture({ ...document, label: `Edit ${index}` }));
assert.equal(history.assets.size, 1);
assert.ok(history.prune(entries) < source.length * 2 + 100000, 'history retains one copy of image, not 60');
assert.equal(history.expand(entries[3]).objects[1].children[0].src, source);
history.prune([]);
assert.equal(history.assets.size, 0);

// Simulate a transaction abort; both previous metadata and previous blobs survive.
const realTransaction = db.transaction.bind(db);
db.transaction = (...args) => {
  const transaction = realTransaction(...args);
  if (args[1] === 'readwrite') queueMicrotask(() => transaction.abort());
  return transaction;
};
await assert.rejects(store.save({ width: 10, height: 10, objects: [] }));
db.transaction = realTransaction;
assert.deepEqual(await store.load(), document);
await store.save({ width: 10, height: 10, objects: [] });
assert.equal(await requestValue(db.transaction('assets').objectStore('assets').count()), 0, 'unused assets removed atomically');
db.close();

const images = globalThis.YoudesignImages;
const png = new Uint8Array(24);
const view = new DataView(png.buffer);
view.setUint32(0, 0x89504e47);
view.setUint32(16, 12000); view.setUint32(20, 12000);
await assert.rejects(images.inspect(new Blob([png])), /尺寸过大/);
view.setUint32(16, 6000); view.setUint32(20, 4000);
assert.equal((await images.inspect(new Blob([png]))).needsResize, true);
assert.deepEqual(images.resizedDimensions(6000, 4000), [4096, 2731]);
await assert.rejects(images.inspect({ size: 31 * 1024 * 1024, arrayBuffer() { throw new Error('should not read'); } }), /30MB/);
console.log('IndexedDB atomicity, asset deduplication, history memory and image limits passed');

const raceStore = new ProjectStore('save-revision-regression');
const mutable = { objects: [{ src: source, crop: { left: 0 } }] };
const saving = raceStore.save(mutable);
mutable.objects[0].crop.left = 42;
await saving;
assert.equal((await raceStore.load()).objects[0].crop.left, 0, 'metadata frozen before hashing');
(await raceStore.open()).close();
console.log('Save revision consistency passed');
