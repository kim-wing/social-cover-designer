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
