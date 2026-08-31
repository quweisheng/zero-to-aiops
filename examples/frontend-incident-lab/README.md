# 前端事件看板：七篇技术栈的可运行实验

这是 HTML、CSS、JavaScript、Ajax、TypeScript、Vue、React 的共享本地实验。三个界面使用相同的合成事件 API，便于对照“DOM 手动更新、Vue 响应式、React 状态快照”的区别。

## 安全边界

- 仅合成事件，只读 GET，没有真实数据库、凭据、租户或生产操作。
- API 只监听 `127.0.0.1:4188`，页面只监听本机，不要改成 `0.0.0.0` 直接暴露。
- 这不是生产服务器，不提供真实认证、TLS、限流或审计。
- 页面 proxy 让开发请求保持同源，不能代替生产 CORS/认证设计。

## 前置条件与安装

需要 Node.js 22.12+ 和 npm；本文验证环境见末尾记录。先从仓库根目录进入实验目录：

```powershell
cd examples/frontend-incident-lab
npm ci
```

`npm ci` 按 lockfile 安装确定版本，首次需要网络。不要在真实业务项目覆盖文件。

## 启动：两个终端

终端一（保持运行）：

```powershell
npm run api
```

终端二（同一目录）：

```powershell
npm run dev
```

打开：

- 原生页面：`http://127.0.0.1:4187/`
- Vue：`http://127.0.0.1:4187/vue.html`
- React：`http://127.0.0.1:4187/react.html`

## 基础实验

1. 每个页面选择“正常”，搜索留空，点击查询，预期 3 条事件。
2. 搜索 `database`，预期只返回 INC-1024。
3. 选择“空结果”，预期“暂无事件，不是系统故障”。
4. 用 Tab 和 Enter 完成操作，状态文字应可感知；390px 宽度不横向滚动。
5. Network 应看到 GET、200、JSON、`Cache-Control: no-store` 和合成 request ID。

## 故障注入与预期

| 模式/操作 | 预期 | 证明什么 |
|---|---|---|
| HTTP 503 | 显示 `HTTP 503` | Fetch 必须检查 `response.ok` |
| 非法契约 | 显示数据不符合契约 | TS 不会验证网络 JSON |
| 慢响应 | 约 2 秒后超时 | 等待预算和取消清理 |
| 慢响应后立刻取消 | 显示已取消 | 用户取消不等于 HTTP 失败 |
| 慢请求未完再发正常查询 | 最终只显示新查询结果 | 旧请求不能覆盖新状态 |
| 查询后切换页面 | 旧界面不再更新 | 页面/组件生命周期清理 |

恢复方式：切回正常模式并查询。实验不写服务端数据，无需数据库回滚。

## 自动验证

```powershell
npm run typecheck
npm test
npm run build
```

预期：类型检查退出码 0；7 个客户端/契约测试通过；构建生成三个 HTML 入口。测试会自己启动临时本机端口，不要求手工 API 进程。

生产构建浏览：保持 API 运行，执行 `npm run preview`，访问 `http://127.0.0.1:4189/` 及 Vue/React 路径，再重复上述用户流程。preview 只用于本地验证，不能视为生产部署方案。

## 对照源码

- HTML：三个入口中的语义、label、表单和 live region。
- CSS：`src/style.css` 的流式尺寸、焦点和告警状态。
- JavaScript：`src/vanilla.ts` 的事件、DOM 更新和旧请求资格检查。
- Ajax：`src/api.ts` 的状态、JSON、超时和 AbortController。
- TypeScript：`src/contracts.ts` 的 unknown 校验、联合状态与 never。
- Vue：`src/VueBoard.vue` 的 ref/computed 与卸载清理。
- React：`src/ReactBoard.tsx` 的状态快照、事件请求和 Effect cleanup。

“原生页面”指不使用 Vue/React 组件框架；为共用类型和构建流程，它的脚本仍用 TypeScript 转译，输出在浏览器中运行的 JavaScript。

## 如果没成功先检查

1. 页面连接拒绝：第二终端是否运行，4187 是否被占用。
2. 查询失败/502：第一终端 API 是否运行在 4188。
3. npm 安装失败：保存 Node/npm 版本和网络错误，不先删除 lockfile。
4. 浏览器 MIME/模块错误：通过 HTTP 地址打开，不要双击 HTML。
5. 类型错误：运行项目本地 `npm run typecheck`，不要使用全局旧 tsc。
6. 慢请求最终回写：检查 controller 身份比较与取消是否被改坏。

## 清理与 GitHub 证据

两个终端按 Ctrl+C 停服务；保留源码、lockfile、测试输出和脱敏截图。`node_modules`、`dist` 和临时日志不用提交。不要把浏览器保存的 Cookie/Authorization 或真实业务响应加入证据。

建议记录：浏览器/Node/npm 版本、验证日期、每种模式截图、Network 状态、类型/测试/构建结果，以及一次“旧结果覆盖”的故障复盘。

## 验证记录

此处仅记录实际执行结果；代码静态存在、类型检查、自动测试、浏览器实跑和生产验证是不同层次。本地 mock 实验不能代表生产容量、安全或所有浏览器兼容性。

- 2026-08-31，Windows，Node.js 26.1.0，npm 11.13.0：`npm run typecheck` 通过；Vitest 1 个测试文件、7 项测试全部通过；Vite 8.1.3 生产构建通过，生成原生、Vue、React 三个 HTML 入口。
- 2026-08-31，Chromium 真浏览器：原生页面正常筛选与 HTTP 503/超时状态通过；Vue 搜索通过；React 非法契约状态通过；Vue/React 在 390px 视口的文档宽度均为 390px，无横向溢出。
