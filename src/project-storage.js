/* Browser persistence and undo resources are independent of the canvas renderer. */
(function (root) {
  const assetFields = new Set(['src', 'originalSrc', 'maskSrc', 'svgText', 'svgContent']);
  function mapAssets(value, transform, key = '') {
    if (typeof value === 'string' && assetFields.has(key)) return transform(value);
    if (Array.isArray(value)) return value.map(item => mapAssets(item, transform));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, mapAssets(item, transform, name)]));
    }
    return value;
  }

  class HistoryResources {
    constructor() { this.assets = new Map(); this.ids = new Map(); this.nextId = 0; }
    capture(document) {
      const refs = new Set();
      const compact = mapAssets(document, value => {
        if (value.length < 1024) return value;
        let id = this.ids.get(value);
        if (!id) { id = `history:${++this.nextId}`; this.ids.set(value, id); this.assets.set(id, value); }
        refs.add(id);
        return { historyAsset: id };
      });
      const json = JSON.stringify(compact);
      return { json, refs: [...refs], bytes: json.length * 2 };
    }
    expand(entry) {
      return JSON.parse(entry.json, (_key, value) => {
        if (!value || typeof value !== 'object' || !value.historyAsset) return value;
        if (!this.assets.has(value.historyAsset)) throw new Error('撤销资源已失效');
        return this.assets.get(value.historyAsset);
      });
    }
    prune(entries) {
      const used = new Set(entries.flatMap(entry => entry.refs));
      for (const [id, value] of this.assets) {
        if (!used.has(id)) { this.assets.delete(id); this.ids.delete(value); }
      }
      return entries.reduce((sum, entry) => sum + entry.bytes, 0)
        + [...this.assets.values()].reduce((sum, value) => sum + value.length * 2, 0);
    }
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error || new Error('保存事务已取消'));
      transaction.onerror = () => {}; // onabort reports the final atomic transaction result.
    });
  }
  function dataUrlBlob(value) {
    const comma = value.indexOf(',');
    const header = value.slice(0, comma);
    const bytes = /;base64$/i.test(header) ? atob(value.slice(comma + 1)) : decodeURIComponent(value.slice(comma + 1));
    return new Blob([Uint8Array.from(bytes, char => char.charCodeAt(0))], {
      type: /^data:([^;]+)/.exec(header)?.[1] || 'application/octet-stream'
    });
  }
  function blobDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  class ProjectStore {
    constructor(name = 'youdesign-projects-v1') { this.name = name; this.database = null; this.sourceCache = new Map(); }
    async open() {
      if (!this.database) {
        this.database = new Promise((resolve, reject) => {
          const request = indexedDB.open(this.name, 1);
          request.onupgradeneeded = () => {
            request.result.createObjectStore('documents');
            request.result.createObjectStore('assets');
          };
          request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => { db.close(); this.database = null; };
            resolve(db);
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => reject(new Error('请关闭其他旧版编辑器标签页后重试'));
        }).catch(error => { this.database = null; throw error; });
      }
      return this.database;
    }
    async save(document) {
      // Freeze metadata before asynchronous hashing so later edits cannot mix revisions.
      document = mapAssets(document, value => value);
      const sources = new Map();
      mapAssets(document, value => { if (value.startsWith('data:')) sources.set(value, null); return value; });
      const assets = new Map();
      // Convert before opening a transaction: awaiting work inside a transaction can close it early.
      for (const source of sources.keys()) {
        let resource = this.sourceCache.get(source);
        if (!resource) {
          const blob = dataUrlBlob(source);
          const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
          const id = `${blob.type}:${Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')}`;
          resource = { id, blob };
          this.sourceCache.set(source, resource);
        }
        const { id, blob } = resource;
        sources.set(source, id);
        assets.set(id, blob);
      }
      for (const source of this.sourceCache.keys()) if (!sources.has(source)) this.sourceCache.delete(source);
      const compact = mapAssets(document, value => sources.has(value) ? { storedAsset: sources.get(value) } : value);
      const db = await this.open();
      const transaction = db.transaction(['documents', 'assets'], 'readwrite');
      const done = transactionDone(transaction);
      const store = transaction.objectStore('assets');
      const keys = store.getAllKeys();
      keys.onsuccess = () => {
        const existing = new Set(keys.result);
        for (const key of existing) if (!assets.has(key)) store.delete(key);
        for (const [key, blob] of assets) if (!existing.has(key)) store.put(blob, key);
        transaction.objectStore('documents').put(compact, 'current');
      };
      await done;
    }
    async load() {
      const db = await this.open();
      const transaction = db.transaction(['documents', 'assets'], 'readonly');
      const done = transactionDone(transaction);
      const [document, keys, values] = await Promise.all([
        requestResult(transaction.objectStore('documents').get('current')),
        requestResult(transaction.objectStore('assets').getAllKeys()),
        requestResult(transaction.objectStore('assets').getAll())
      ]);
      await done;
      if (!document) return null;
      const urls = new Map();
      for (let index = 0; index < keys.length; index++) urls.set(keys[index], await blobDataUrl(values[index]));
      return JSON.parse(JSON.stringify(document), (_key, value) => {
        if (!value || typeof value !== 'object' || !value.storedAsset) return value;
        if (!urls.has(value.storedAsset)) throw new Error('工程图片资源缺失');
        return urls.get(value.storedAsset);
      });
    }
  }
  root.YoudesignStorage = { HistoryResources, ProjectStore };
})(globalThis);
