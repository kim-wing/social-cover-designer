import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
function load(start, end, globals) {
  const context = vm.createContext(globals);
  vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))), context);
  return context;
}

// A denied or full storage must preserve the most recent recoverable document.
for (const name of ['QuotaExceededError', 'SecurityError']) {
  let saved = 'last-good-document';
  let status;
  const context = load('function persist()', 'window.addEventListener("beforeunload"', {
    saveRevision: 0, savedRevision: 0, saveTimer: null, saveInFlight: null,
    setTimeout: () => 1, clearTimeout: () => {}, documentSnapshot: () => ({}),
    projectStore: { async save() { throw Object.assign(new Error(name), { name }); } },
    isStorageQuotaError: error => error.name === 'QuotaExceededError',
    setAutosaveStatus: (...args) => { status = args; }
  });
  context.persist();
  await context.flushAutosave();
  assert.equal(context.savedRevision, 0);
  assert.equal(status[1], true);
}

// Network failures may retry reads, never generation writes.
for (const [method, expected] of [['POST', 1], ['GET', 3]]) {
  let calls = 0;
  const context = load('async function fetchWithRetry(', 'async function requestJson(', {
    fetch: async () => { calls++; throw new Error('Failed to fetch'); },
    isRetryableNetworkError: () => true, wait: async () => {}
  });
  await assert.rejects(context.fetchWithRetry('/api/seedream', { method }));
  assert.equal(calls, expected);
}

const oldObjects = [{ id: 'old' }];
const state = { width: 100, objects: oldObjects, history: ['keep-history'] };
const noop = () => {};
const project = load('function validateProject(', 'function isStorageQuotaError(', {
  state, documentEpoch: 0, MAX_EXPORT_PIXELS: 64000000,
  hydrateObject: async obj => { if (obj.src === 'broken') throw new Error('image failed'); return obj; },
  stopMaskEdit: noop, stopStampEdit: noop, setSelection: noop, resizeCanvas: noop,
  syncPromptAspectToCanvas: noop, generateTourismPrompt: noop, renderAll: noop, syncUi: noop
});
const valid = { width: 1080, height: 1440, objects: [{ id: 'image', type: 'image', name: '<img onerror=alert(1)>', src: 'broken' }] };
await assert.rejects(project.restore(JSON.stringify(valid)));
assert.equal(state.width, 100);
assert.equal(state.objects, oldObjects);
for (const patch of [{ width: -1 }, { height: 20000 }, { objects: [{ id: 'x', type: 'unknown', name: 'x' }] }]) {
  assert.throws(() => project.validateProject({ ...valid, ...patch }));
}
await project.restore(JSON.stringify({ ...valid, objects: [], history: ['injected'], dragging: {} }));
assert.equal(state.width, 1080);
assert.deepEqual(state.history, ['keep-history']);
assert.equal(state.dragging, undefined);

// Many pointer events should schedule one paint and never rebuild side panels.
let callback;
let scheduled = 0;
let paints = 0;
const drag = load('let dragRenderFrame = null;', 'canvas.addEventListener("pointermove"', {
  requestAnimationFrame: fn => { callback = fn; scheduled++; return scheduled; },
  renderAll: () => paints++, selectedObjects: () => [], syncTransformInputs: noop
});
for (let i = 0; i < 100; i++) drag.scheduleDragRender();
assert.equal(scheduled, 1);
callback();
assert.equal(paints, 1);
drag.scheduleDragRender();
assert.equal(scheduled, 2);

// Detached targets must not receive late AI results or alter undo history.
const edit = load('async function replaceSelectedImageWithSource(', 'async function generateImageFromPrompt(', {
  state: { objects: [] }, loadImage: async () => ({}),
  saveHistory: () => { throw new Error('history unexpectedly modified'); }
});
await assert.rejects(edit.replaceSelectedImageWithSource({}, 'data:image/png;base64,AA=='), /目标图层/);
console.log('Web reliability tests passed');

// Untrusted layer labels remain text, never markup, even without a CSP.
const malicious = '<img src=x onerror=alert(1)>';
const box = { dataset: { dragBound: 'true' }, appendChild(node) { this.child = node; } };
const nameNode = {};
const typeNode = {};
const button = {
  dataset: {}, addEventListener: noop,
  querySelector: selector => selector === '.layer-name' ? nameNode : typeNode
};
const layers = load('function renderLayers()', 'function clearLayerDropMarkers()', {
  state: { objects: [{ id: 'x', name: malicious, type: 'image' }] },
  selectedObjects: () => [],
  document: { getElementById: () => box, createElement: () => button }
});
layers.renderLayers();
assert.equal(nameNode.textContent, malicious);
assert.equal(button.innerHTML.includes(malicious), false);

// Timeout covers the response body as well as receiving response headers.
let abort;
let cleared = false;
const timeout = load('async function requestJson(', 'function openExternalLink(', {
  AbortController,
  setTimeout: fn => { abort = fn; return 1; },
  clearTimeout: () => { cleared = true; },
  fetchWithRetry: async (_url, options) => ({
    json: () => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
      abort();
    })
  })
});
await assert.rejects(timeout.requestJson('/api/seedream'), /请求超时/);
assert.equal(cleared, true);
console.log('Layer injection and response timeout tests passed');
