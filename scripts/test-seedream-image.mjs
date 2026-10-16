import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../functions/api/seedream-image.js', import.meta.url), 'utf8');
const { onRequestPost } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const call = (url, origin = 'https://example.com') => onRequestPost({ request: new Request('https://example.com/api/seedream-image', {
  method:'POST', headers:{'Content-Type':'application/json',Origin:origin,'X-Seedream-Api-Key':'must-not-forward'}, body:JSON.stringify({url})
}) });
const original = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, options) => {
  calls++;
  assert.equal(options.redirect, 'manual');
  assert.equal(options.headers, undefined);
  return new Response(new Uint8Array([137,80,78,71]), {headers:{'Content-Type':'image/png'}});
};
try {
  for (const url of ['http://127.0.0.1/image.png','https://example.com/image.png','https://foo.tos-cn-beijing.volces.com.evil.test/image.png','https://user:password@foo.tos-cn-beijing.volces.com/image.png']) {
    assert.equal((await call(url)).status,400);
  }
  assert.equal(calls,0);
  const url='https://test.tos-cn-beijing.volces.com/result.png?signature=test';
  assert.equal((await call(url,'https://other.test')).status,403);
  const response=await call(url);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal((await response.arrayBuffer()).byteLength,4);
  globalThis.fetch=async()=>new Response('',{status:302,headers:{Location:'http://127.0.0.1'}});
  assert.equal((await call(url)).status,502);
  globalThis.fetch=async()=>new Response('<html>error</html>',{headers:{'Content-Type':'text/html'}});
  assert.equal((await call(url)).status,502);
} finally {globalThis.fetch=original;}
console.log('Seedream layer download proxy: host validation, redirects, content type, credential isolation passed');
