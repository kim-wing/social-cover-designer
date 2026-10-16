const SEEDREAM_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const SEEDREAM_MODEL = "doubao-seedream-5-0-pro-260628";
const MAX_PROMPT_LENGTH = 8000;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validateSize(size) {
  if (size === "1K" || size === "2K") return true;
  const match = /^(\d+)x(\d+)$/.exec(String(size || ""));
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const pixels = width * height;
  return width > 0
    && height > 0
    && pixels >= 512 * 512
    && pixels <= 2048 * 2048
    && width <= height * 16
    && height <= width * 16;
}

function validateImage(image) {
  if (typeof image !== "string") return false;
  if (/^https?:\/\//.test(image)) return true;
  const match = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match) return false;
  return Math.floor(match[1].length * 3 / 4) <= MAX_INPUT_BYTES;
}

function seedreamBody(input) {
  const decomposition = input?.layer_decomposition === true;
  const prompt = typeof input?.prompt === "string" ? input.prompt.trim() : "";
  if ((!prompt && !decomposition) || prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt 不能为空且不能超过 ${MAX_PROMPT_LENGTH} 个字符。`);
  }
  if (decomposition ? !["auto", "1K", "1.5K", "2K"].includes(input?.size) : !validateSize(input?.size)) {
    throw new Error("输出尺寸不符合 Seedream 5.0 Pro 要求。");
  }
  const optimizeMode = input?.optimizeMode || "standard";
  if (!new Set(["standard", "fast"]).has(optimizeMode)) {
    throw new Error("生成模式只支持 standard 或 fast。");
  }
  if (input?.image != null && !validateImage(input.image)) {
    throw new Error("参考图必须是有效的图片 URL 或不超过 30MB 的 Base64 Data URL。");
  }
  if (decomposition && !validateImage(input?.image)) throw new Error("图层拆分需要一张有效图片。");

  return {
    model: SEEDREAM_MODEL,
    ...(prompt ? { prompt } : {}),
    ...(decomposition ? { layer_decomposition: true } : {}),
    size: input.size,
    ...(input.image ? { image: input.image } : {}),
    response_format: decomposition ? "url" : "b64_json",
    output_format: "png",
    watermark: false,
    optimize_prompt_options: {
      mode: optimizeMode
    }
  };
}

const MAX_REQUEST_BYTES = Math.ceil(MAX_INPUT_BYTES * 4 / 3) + 128 * 1024;

async function readBoundedJson(request) {
  const tooLarge = () => Object.assign(new Error("请求内容过大，参考图片不能超过 30MB。"), { status: 413 });
  if (Number(request.headers.get("Content-Length")) > MAX_REQUEST_BYTES) throw tooLarge();
  if (!request.body) throw new Error("请求内容不能为空。");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) { await reader.cancel(); throw tooLarge(); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

function decompositionResponse(body, apiKey) {
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 165000);
  let heartbeat;
  let reader;
  let initialized = false;
  let canceled = false;
  const cleanup = () => { clearTimeout(timeout); clearInterval(heartbeat); };
  // Start the single upstream request immediately; never retry a billed write.
  const pending = fetch(SEEDREAM_ENDPOINT, {
    signal: abort.signal,
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(response => ({ response }), error => ({ error }));
  const stream = new ReadableStream({
    start(controller) {
      // JSON permits whitespace before its value. Send headers and small keepalive
      // chunks while the model works, rather than leaving the connection silent.
      controller.enqueue(encoder.encode(" \n"));
      heartbeat = setInterval(() => {
        if (!initialized && !canceled && controller.desiredSize > 0) controller.enqueue(encoder.encode(" \n"));
      }, 10000);
    },
    async pull(controller) {
      try {
        if (!initialized) {
          const { response, error } = await pending;
          if (canceled) { await response?.body?.cancel(); return; }
          initialized = true;
          clearInterval(heartbeat);
          if (error || !response.ok) {
            let message;
            if (error) message = abort.signal.aborted
              ? "图层拆分请求超时，结果尚未确认，请勿立即重复提交。"
              : "连接火山方舟失败，结果尚未确认，请勿立即重复提交。";
            else {
              const payload = await response.json().catch(() => ({}));
              message = payload.error?.message || (response.status === 524
                ? `图片服务等待上游超时（524，已等待 ${Math.round((Date.now() - startedAt) / 1000)} 秒）。结果尚未确认，请勿立即重复提交。`
                : `火山方舟返回 HTTP ${response.status}。`);
            }
            controller.enqueue(encoder.encode(JSON.stringify({ error: { message } })));
            controller.close(); cleanup(); return;
          }
          if (!response.body) throw new Error("图片服务没有返回响应内容。");
          reader = response.body.getReader();
        }
        const { value, done } = await reader.read();
        if (canceled) return;
        if (done) { controller.close(); cleanup(); }
        else controller.enqueue(value);
      } catch (error) {
        cleanup();
        if (!canceled) controller.error(error);
      }
    },
    async cancel() {
      canceled = true;
      cleanup(); abort.abort();
      await reader?.cancel();
    }
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, no-transform", "Content-Encoding": "identity" }
  });
}

export async function onRequestPost(context) {
  const requestOrigin = context.request.headers.get("Origin");
  const expectedOrigin = new URL(context.request.url).origin;
  if (requestOrigin && requestOrigin !== expectedOrigin) {
    return jsonResponse({ error: { message: "不允许跨站调用 Seedream 代理。" } }, 403);
  }
  const apiKey = context.request.headers.get("X-Seedream-Api-Key")?.trim();
  if (!apiKey) {
    return jsonResponse({ error: { message: "请填写火山方舟 API Key。" } }, 401);
  }

  let body;
  try {
    body = seedreamBody(await readBoundedJson(context.request));
  } catch (error) {
    return jsonResponse({ error: { message: error?.message || "请求参数不正确。" } }, error?.status || 400);
  }

  if (body.layer_decomposition) return decompositionResponse(body, apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 165000);
  try {
    const upstream = await fetch(SEEDREAM_ENDPOINT, {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    // Forward image data as a stream: a decomposition response can contain 17
    // Base64 images and must not be duplicated into a Worker-sized string.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return jsonResponse({
      error: {
        message: controller.signal.aborted
          ? "生成请求超时，结果尚未确认，请勿立即重复提交。"
          : `连接火山方舟失败：${error?.message || "网络错误"}`
      }
    }, controller.signal.aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
