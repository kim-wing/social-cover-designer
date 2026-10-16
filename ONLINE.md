# YOUDESIGN 线上版

线上版是静态前端加一个 Cloudflare Pages Function，不需要 Tauri，也不需要生成桌面安装包。

## 架构

```text
浏览器
  └─ POST /api/seedream（用户自己的火山方舟 Key）
       └─ Cloudflare Pages Function
            └─ POST https://ark.cn-beijing.volces.com/api/v3/images/generations
```

- 浏览器只请求本站同源的 `/api/seedream`，避免火山方舟响应缺少 CORS 头导致请求被浏览器拦截。
- 拆分请求使用 `response_format=url` 返回图层清单，随后通过 `/api/seedream-image` 逐张下载并保存到工程。下载代理只允许北京火山对象存储的 HTTPS 图片，拒绝重定向，不转发 API Key。
- 代理固定使用 `doubao-seedream-5-0-pro-260628` 和火山方舟北京端点；客户端不能修改模型或转发目标。
- 生成与编辑使用同一个接口。编辑请求比生成请求多一个 `image` 字段。
- 精准编辑使用居中弹窗工作台，支持整图、连续点选和连续框选。多个点与框可以混合使用，统一转换成 0–999 归一化坐标；每个编号保存独立编辑指令，并以“坐标 + 对应指令”的形式写入最终 Prompt。
- API Key 只在当前请求中转发，不写入服务端日志或缓存。前端默认不保存 Key；只有用户主动勾选时才写入该浏览器的本地存储。
- 代理拒绝跨站来源，避免其他网站借用该端点转发请求。

## 本地开发

```bash
npm install
npm run web:dev
```

`web:dev` 会生成 `dist/`，并用 Cloudflare Pages 本地运行时同时启动静态页面和 `/api/seedream`。

只运行静态服务器无法测试 AI 功能，因为普通静态服务器不会执行 `functions/`。

## 检查

```bash
npm run web:check
```

该命令会检查前端语法、运行 Seedream 代理测试并生成线上静态产物，不会打包桌面应用。

## Cloudflare Pages 配置

使用 Git 集成时配置：

- Root directory：仓库根目录
- Build command：`npm run web:build`
- Build output directory：`dist`
- Functions directory：仓库根目录下的 `functions/`（Pages 会自动识别）

旧桌面源码、安装包脚本和下载介绍页已移除。唯一生产部署目录为 `dist/`。

生产地址为 https://youdesign.pages.dev ，部署命令会先执行完整检查：

```bash
npm run web:build
npm run web:deploy
```

## 上线前检查

- 使用真实火山方舟 Key 完成一次文生图。
- 上传并选中一张图片，混合添加多个点选和框选定位，逐项填写不同指令，确认切换编号后内容不会串位；点击执行后确认编辑弹窗关闭、主画布出现持续等待提示，再完成一次精准编辑。
- 确认未勾选“保存 API Key 到本机”时，刷新页面后 Key 为空。
- 在 Cloudflare 响应头中确认 `/api/seedream` 为 `Cache-Control: no-store`。
- 构建自动生成 CSP、禁止嵌入与 MIME 嗅探的响应头。HTML 重新验证缓存，带内容哈希的脚本、样式和模型运行时长期缓存。
- `_routes.json` 只让 `/api/*` 进入 Function，静态资源直接由 Pages 提供。

## 数据与可靠性

- IndexedDB 使用一个原子事务更新工程与图片 Blob；失败保留旧存档。
- 图片按内容哈希去重，撤销记录引用共享资源，最多 60 步 / 96MB。
- 生图 POST 不自动重试；代理 165 秒、浏览器 180 秒超时。超时不能证明上游未生成，因此提示用户避免立即重复提交。
- 请求体读取阶段限制大小，支持无 Content-Length 的流式请求；超限返回 413。
- Node 22+；`npm ci` 后执行 `npm run check`。Wrangler 版本固定在 lockfile。
- 本地可用 `npm run dev`；静态构建不包含测试工程、桌面文件、源码映射或 Node 模型运行文件。
