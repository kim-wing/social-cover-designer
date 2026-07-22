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

不要把现有的 `website/` 当作线上编辑器输出目录；该目录是原来的下载介绍页。

也可以在确认项目名后手动部署：

```bash
npm run web:build
npx wrangler pages deploy dist --project-name <你的项目名>
```

## 上线前检查

- 使用真实火山方舟 Key 完成一次文生图。
- 上传并选中一张图片，混合添加多个点选和框选定位，逐项填写不同指令，确认切换编号后内容不会串位；点击执行后确认编辑弹窗关闭、主画布出现持续等待提示，再完成一次精准编辑。
- 确认未勾选“保存 API Key 到本机”时，刷新页面后 Key 为空。
- 在 Cloudflare 响应头中确认 `/api/seedream` 为 `Cache-Control: no-store`。
- 为正式域名配置 CSP、基础访问分析和告警。
