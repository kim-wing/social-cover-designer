import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../functions/api/seedream.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { onRequestPost } = await import(moduleUrl);

function request(body, apiKey = "test-key") {
  return new Request("https://example.com/api/seedream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://example.com",
      ...(apiKey ? { "X-Seedream-Api-Key": apiKey } : {})
    },
    body: JSON.stringify(body)
  });
}

const originalFetch = globalThis.fetch;
let forwardedRequest;
globalThis.fetch = async (url, options) => {
  forwardedRequest = { url, options };
  return Response.json({
    data: [{ b64_json: "aGVsbG8=", output_format: "png" }]
  });
};

try {
  const decompositionResponse = await onRequestPost({ request: request({ image: "data:image/png;base64,aGVsbG8=", layer_decomposition: true, size: "auto" }) });
  assert.equal(decompositionResponse.status, 200);
  const decompositionBody = JSON.parse(forwardedRequest.options.body);
  assert.equal(decompositionBody.layer_decomposition, true);
  assert.equal(decompositionBody.prompt, undefined);
  assert.equal(decompositionBody.size, "auto");
  assert.equal((await decompositionResponse.json()).data[0].b64_json, "aGVsbG8=");
  assert.equal((await onRequestPost({ request: request({ layer_decomposition: true, size: "auto" }) })).status, 400);
  assert.equal((await onRequestPost({ request: request({ image: "data:image/png;base64,aGVsbG8=", layer_decomposition: true, size: "1024x1024" }) })).status, 400);
  const generationResponse = await onRequestPost({
    request: request({
      prompt: "生成一张旅游海报",
      size: "1080x1440",
      optimizeMode: "standard",
      model: "attacker-controlled-model"
    })
  });
  assert.equal(generationResponse.status, 200);
  assert.equal(forwardedRequest.url, "https://ark.cn-beijing.volces.com/api/v3/images/generations");
  assert.equal(forwardedRequest.options.headers.Authorization, "Bearer test-key");
  const forwardedBody = JSON.parse(forwardedRequest.options.body);
  assert.equal(forwardedBody.model, "doubao-seedream-5-0-pro-260628");
  assert.equal(forwardedBody.response_format, "b64_json");
  assert.equal(forwardedBody.output_format, "png");
  assert.equal(forwardedBody.watermark, false);
  assert.equal(forwardedBody.optimize_prompt_options.mode, "standard");
  assert.equal(forwardedBody.stream, undefined);
  assert.equal(forwardedBody.n, undefined);

  const image = "data:image/png;base64,aGVsbG8=";
  const editPrompt = "编辑 Image 1 中 <bbox>120 180 640 760</bbox> 区域内的目标：替换为花园";
  await onRequestPost({
    request: request({ prompt: editPrompt, size: "1080x1440", image, optimizeMode: "fast" })
  });
  const forwardedEditBody = JSON.parse(forwardedRequest.options.body);
  assert.equal(forwardedEditBody.image, image);
  assert.equal(forwardedEditBody.prompt, editPrompt);

  const missingKeyResponse = await onRequestPost({
    request: request({ prompt: "test", size: "1024x1024" }, "")
  });
  assert.equal(missingKeyResponse.status, 401);

  const invalidModeResponse = await onRequestPost({
    request: request({ prompt: "test", size: "1024x1024", optimizeMode: "turbo" })
  });
  assert.equal(invalidModeResponse.status, 400);

  const crossSiteResponse = await onRequestPost({
    request: new Request("https://example.com/api/seedream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://attacker.example",
        "X-Seedream-Api-Key": "test-key"
      },
      body: JSON.stringify({ prompt: "test", size: "1024x1024" })
    })
  });
  assert.equal(crossSiteResponse.status, 403);

  console.log("Seedream Pages Function tests passed");
} finally {
  globalThis.fetch = originalFetch;
}

// Reject declared and streamed oversize requests before calling the upstream.
const previousFetch = globalThis.fetch;
let upstreamCalls = 0;
globalThis.fetch = async () => { upstreamCalls++; throw new Error('must not forward'); };
try {
  const oversized = await onRequestPost({ request: new Request('https://example.com/api/seedream', {
    method: 'POST', headers: { 'X-Seedream-Api-Key': 'test', 'Content-Length': '999999999' }, body: '{}'
  }) });
  assert.equal(oversized.status, 413);
  let canceled = false;
  const streamed = await onRequestPost({ request: new Request('https://example.com/api/seedream', {
    method: 'POST', headers: { 'X-Seedream-Api-Key': 'test' }, duplex: 'half',
    body: new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
      cancel() { canceled = true; }
    })
  }) });
  assert.equal(streamed.status, 413);
  assert.equal(canceled, true);
  assert.equal(upstreamCalls, 0);
} finally { globalThis.fetch = previousFetch; }
console.log('Seedream request-size limits passed');

// Large layer responses must be forwarded without buffering the full payload.
const savedFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => {
    const response = Response.json({ data: [{ b64_json: "streamed-layer" }] });
    response.text = () => { throw new Error("upstream response must not be buffered"); };
    return response;
  };
  const response = await onRequestPost({ request: request({
    image: "data:image/png;base64,aGVsbG8=", layer_decomposition: true, size: "auto"
  }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data[0].b64_json, "streamed-layer");
} finally { globalThis.fetch = savedFetch; }
console.log('Seedream multi-layer response streaming passed');
