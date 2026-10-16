// Only download generated image assets from Volcano's Beijing object storage.
// Never forward API keys, follow redirects, or accept arbitrary proxy targets.
export async function onRequestPost({ request }) {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };
  const fail = (message, status) => new Response(JSON.stringify({ error: { message } }), { status, headers });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return fail("不允许跨站下载。", 403);
  if (Number(request.headers.get("Content-Length")) > 16384) return fail("图片地址过长。", 400);
  let url;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("缺少图片地址。", 400);
    const decoder = new TextDecoder();
    let input = "", size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) { await reader.cancel(); return fail("图片地址过长。", 400); }
        input += decoder.decode(value, { stream: true });
      }
      input += decoder.decode();
    } finally { reader.releaseLock(); }
    url = new URL(JSON.parse(input).url);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")
      || !url.hostname.endsWith(".tos-cn-beijing.volces.com")) throw new Error();
  } catch { return fail("图层下载地址不是支持的火山对象存储地址。", 400); }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 60000);
  try {
    const response = await fetch(url.href, { redirect: "manual", signal: abort.signal });
    if (!response.ok) { await response.body?.cancel(); return fail(`图层下载失败（HTTP ${response.status}）。`, 502); }
    const type = response.headers.get("Content-Type") || "";
    if (!/^image\/(png|jpeg|webp)(;|$)/i.test(type)) { await response.body?.cancel(); return fail("返回的内容不是图片。", 502); }
    let size = 0;
    const bounded = response.body?.pipeThrough(new TransformStream({ transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > 30 * 1024 * 1024) { controller.error(new Error("图层图片超过 30MB。")); return; }
      controller.enqueue(chunk);
    } }));
    return new Response(bounded, { headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return fail("图层下载中断，请稍后重试。", 502); }
  finally { clearTimeout(timer); }
}
