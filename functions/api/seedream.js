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
  const prompt = typeof input?.prompt === "string" ? input.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt 不能为空且不能超过 ${MAX_PROMPT_LENGTH} 个字符。`);
  }
  if (!validateSize(input?.size)) {
    throw new Error("输出尺寸不符合 Seedream 5.0 Pro 要求。");
  }
  const optimizeMode = input?.optimizeMode || "standard";
  if (!new Set(["standard", "fast"]).has(optimizeMode)) {
    throw new Error("生成模式只支持 standard 或 fast。");
  }
  if (input?.image != null && !validateImage(input.image)) {
    throw new Error("参考图必须是有效的图片 URL 或不超过 30MB 的 Base64 Data URL。");
  }

  return {
    model: SEEDREAM_MODEL,
    prompt,
    size: input.size,
    ...(input.image ? { image: input.image } : {}),
    response_format: "b64_json",
    output_format: "png",
    watermark: false,
    optimize_prompt_options: {
      mode: optimizeMode
    }
  };
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
    body = seedreamBody(await context.request.json());
  } catch (error) {
    return jsonResponse({ error: { message: error?.message || "请求参数不正确。" } }, 400);
  }

  try {
    const upstream = await fetch(SEEDREAM_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return jsonResponse({
      error: {
        message: `连接火山方舟失败：${error?.message || "网络错误"}`
      }
    }, 502);
  }
}
