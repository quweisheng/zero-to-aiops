# React 技术栈深讲

> 学习目标：从零理解 React 19.2 的组件、JSX、props、状态快照、render/commit、key、Effect、Context 和 reducer；能用 TypeScript 完成有加载/空/错误/取消状态的 AIOps 事件看板；能排查旧闭包、重复副作用、key 错位、过度渲染、水合和安全问题，并能设计可测试、可观测、可灰度回滚的生产前端。

## 官方资料

- [React 官方学习文档](https://react.dev/learn)
- [React 版本页面](https://react.dev/versions)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [Managing State](https://react.dev/learn/managing-state)
- [Render and Commit](https://react.dev/learn/render-and-commit)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [StrictMode](https://react.dev/reference/react/StrictMode)
- [createRoot](https://react.dev/reference/react-dom/client/createRoot)
- [Profiler](https://react.dev/reference/react/Profiler)
- [Server Components](https://react.dev/reference/rsc/server-components)

本文按 react.dev 当前 React 19.2 文档组织，本仓库自身也锁定 React 19.2.x 作为已构建验证的客户端基线。React Server Components（RSC）对应用开发者已有稳定能力，但框架/打包器依赖的底层实现接口可能不遵循 minor 级语义兼容；不要脱离受支持框架自建后默认可随意升级。

## 官方知识地图与边界

```text
createRoot / hydrateRoot
  -> component functions + JSX + props
  -> state snapshot / events / reducer / context
  -> render phase creates UI description
  -> reconciliation uses type, position and key
  -> commit phase updates DOM and refs
  -> Effect synchronizes external systems after commit

rendering architecture
  -> client rendering / SSR + hydration / framework + RSC
```

React 是 UI 库，不自带完整路由、数据层、认证、后端和部署方案。真实项目通常使用框架或构建工具；选型必须说明具体组合和版本。

## 学习顺序

```text
HTML/CSS/JavaScript -> JSX/组件/props -> state 与事件
  -> render/commit/key -> Effect cleanup -> reducer/context/hooks
  -> TypeScript/测试 -> 性能/SSR/RSC/安全 -> 两级实验
```

## 场景开场

开发环境里 React 事件页请求两次，工程师删掉 StrictMode 后“好了”；列表排序后输入框内容跟到了另一事件；useEffect 的空依赖让定时器永远读取旧筛选条件。三个修法都不能只靠“多加 useMemo”。

React 的关键不是背 Hook 名称，而是理解每次 render 的状态快照、组件身份和外部同步生命周期。

## 一句话人话版

React 是一个用组件、props 和 state 声明界面的 JavaScript 库：每次状态变化都会请求新的 UI 计算，React 再把必要变化提交到真实 DOM。

## 小白先问

### JSX 是 HTML 吗

JSX 是 JavaScript 的语法扩展，用来描述元素树，通常由构建工具转换为 React 调用。它看起来像 HTML，但属性名、表达式、组件和运行机制不同；最终仍产生 React 元素描述。

### setState 为什么后面打印还是旧值

每次 render 得到一份状态快照。setter 请求下一次 render，不会改写当前事件处理器闭包里的值。需要基于前值连续更新时使用函数式更新。

### 所有异步操作都写 useEffect 吗

不是。用户点击引发的提交通常在 event handler；Effect 用于让组件与网络连接、订阅、DOM widget、计时器等外部系统保持同步。能在 render 直接计算的派生值不需要 Effect。

### StrictMode 为什么“运行两次”

开发期 StrictMode 会额外调用 render、Effect setup/cleanup 和 ref 回调，帮助暴露不纯计算和缺 cleanup。生产不按相同方式重复。删除 StrictMode 会隐藏缺陷，不是修复。

## 启动：createRoot 与 hydrateRoot

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('missing #root')

createRoot(container, {
  onUncaughtError(error, errorInfo) {
    reportFrontendError({ error, componentStack: errorInfo.componentStack })
  },
  onRecoverableError(error, errorInfo) {
    reportRecoverableError({ error, componentStack: errorInfo.componentStack })
  }
}).render(
  <StrictMode><App /></StrictMode>
)
```

`createRoot` 用于客户端接管空容器。如果容器已有 React 服务端生成 HTML，应使用 `hydrateRoot` 连接现有标记。混用可能丢 DOM/状态并造成水合问题。

## 组件、props 和纯 render

```tsx
interface IncidentRowProps {
  incident: Readonly<Incident>
  onAcknowledge(id: string): void
}

export function IncidentRow({ incident, onAcknowledge }: IncidentRowProps) {
  return (
    <li>
      <strong>{incident.id}</strong> {incident.service}
      <button type="button" onClick={() => onAcknowledge(incident.id)}>
        确认
      </button>
    </li>
  )
}
```

组件函数在 render 阶段应纯：相同 props/state/context 产生相同 UI 描述，不在 render 中改外部对象、发请求、随机写状态或订阅。React 可能因为 StrictMode、并发调度或父组件更新重新调用组件，render 不能等同于“只运行一次的初始化”。

props 是父组件输入，只读看待。子组件通过回调报告事件，由拥有状态的组件决定更新。

## 状态快照与批处理

```tsx
const [count, setCount] = useState(0)

function addThree() {
  setCount((current) => current + 1)
  setCount((current) => current + 1)
  setCount((current) => current + 1)
}
```

函数式更新按队列中的当前值计算。若三次都写 `setCount(count + 1)`，它们在同一事件快照中看到相同 count，结果通常只加 1。

### state 五件套

- **是什么**：与组件在 UI 树中某个身份位置关联的渲染数据。
- **为什么需要**：状态变化请求 React 重新计算相关 UI。
- **怎么工作**：setter 排队更新；React 批处理并触发新 render，每次 render 有独立快照。
- **怎么看/怎么用**：React DevTools 看组件 state，日志同时带 render/事件阶段，必要时用 Profiler。
- **坏了怎么查**：检查状态所有者、是否直接突变对象、是否读取旧闭包、组件 type/position/key 是否改变。

对象和数组状态要创建新引用，不直接修改：

```tsx
setIncidents((items) =>
  items.map((item) => item.id === id ? { ...item, acknowledged: true } : item)
)
```

## 状态设计：消除冗余和矛盾

不要同时保存 `incidents`、`filteredIncidents`、`isLoading`、`isError`、`isEmpty` 等可互相矛盾值。用一个请求联合状态，筛选结果在 render 派生：

```ts
type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: string }
  | { status: 'success'; data: Incident[] }
  | { status: 'error'; message: string; traceId?: string }
  | { status: 'cancelled' }
```

状态尽量靠近使用处；兄弟共享时提升到最近共同父组件。URL 可表达搜索/分页。复杂状态转换用 reducer；跨深层稳定依赖可用 Context，但每个频繁变化的全局值都放一个 Context 会扩大更新和耦合。

## render、reconciliation 与 commit

```text
trigger: initial render or state update
  -> render: call components, produce next element tree (must be pure)
  -> reconcile: compare type, position and key with previous tree
  -> commit: apply DOM changes and refs
  -> browser paint
  -> passive Effects run/synchronize
```

React 不承诺“逐个 DOM 差异算法的所有内部细节永远不变”。面试应讲稳定心智模型：type、树位置和 key 决定身份；render 可重做；commit 才改变 DOM。

## key 与组件身份

```tsx
{incidents.map((incident) => (
  <IncidentRow key={incident.id} incident={incident} onAcknowledge={acknowledge} />
))}
```

key 只需在同级列表中稳定唯一。数组索引在不会增删/排序的静态列表可勉强使用，但事件列表会插入和排序，索引 key 会让输入、焦点和本地 state 跟错行。随机 key 每次都变，会让组件反复卸载重建。

主动改变 key 可以重置子树状态，例如切换事件详情时清空草稿，但这是明确产品行为，不应靠偶然 key 变化。

## Effect：只同步外部系统

```tsx
useEffect(() => {
  const controller = new AbortController()

  loadIncidents(query, controller.signal)
    .then((data) => dispatch({ type: 'loaded', data }))
    .catch((error) => {
      if (!controller.signal.aborted) dispatch({ type: 'failed', error })
    })

  return () => controller.abort('query-changed-or-unmounted')
}, [query])
```

### Effect 五件套

- **是什么**：在 commit 后让组件与 React 外部系统同步的机制。
- **为什么需要**：连接、订阅、timer、请求不能在纯 render 中执行。
- **怎么工作**：依赖变化前先 cleanup 旧 effect，再 setup 新 effect；卸载时 cleanup；开发 StrictMode 做额外 setup-cleanup 压测。
- **怎么看/怎么用**：Network Initiator、Console 计数、React DevTools/Profiler 和资源句柄共同观察。
- **坏了怎么查**：先判断是否真的需要 Effect，再查依赖、对象/函数身份、旧闭包、cleanup、请求取消和重复订阅。

依赖不是自由选择的优化提示，而是 Effect 读取的响应值集合。不要为消除 lint 把依赖删空；重构代码或把非响应逻辑移出。

### 什么时候不需要 Effect

- 从 props/state 计算筛选结果：render 中计算。
- 用户点击提交：event handler 执行。
- state 变化时重置另一个 state：优先重构 state 结构或用 key。
- 昂贵纯计算：先测，必要时 `useMemo`；它是优化，不是正确性保证。

## Reducer、Context 与自定义 Hook

```tsx
function requestReducer(state: RequestState, action: Action): RequestState {
  switch (action.type) {
    case 'load': return { status: 'loading', requestId: action.requestId }
    case 'loaded': return { status: 'success', data: action.data }
    case 'failed': return { status: 'error', message: action.message }
    case 'cancel': return { status: 'cancelled' }
    default: return state
  }
}
```

reducer 集中描述事件到状态的转换，适合复杂状态机和测试。Context 负责把值送到深层，不自动提供缓存、持久化和业务动作。自定义 Hook 复用状态逻辑，每次调用默认拥有独立状态，不是共享单例。

Hook 必须在组件或自定义 Hook 顶层按稳定顺序调用，不能放条件、循环和普通回调里；React 依赖调用顺序关联 Hook 状态。

## 错误边界与错误分层

Error Boundary 可捕获其子树渲染、生命周期等错误并显示 fallback；它不自动捕获事件处理器、任意异步回调或边界自身错误。事件/请求仍局部 try/catch 并转换为用户可恢复状态。

React 19 root 的 `onCaughtError`、`onUncaughtError`、`onRecoverableError` 可接入生产错误平台并带 component stack。全局 `window.error`、`unhandledrejection`、API 指标和服务端 trace 仍需要分层采集。

fallback 不能只白屏或无限重载，应说明发生了什么、保留用户输入、提供重试/返回和 trace ID。

## 性能：先测再 memo

React DevTools Profiler 或 `<Profiler>` 能观察 commit 的 actualDuration/baseDuration 等。生产真实用户体验还要结合 Web Vitals、Network、长任务和业务动作成功率。

常见优化顺序：

1. 选择合适渲染架构与数据量，分页/虚拟化万条列表。
2. 避免状态放太高和 Effect 引发瀑布/循环。
3. 让 props 稳定且组件边界合理。
4. 路由/功能代码拆分，优化图片、字体和网络。
5. 量化昂贵 render 后，再用 memo/useMemo/useCallback。

`useMemo` 可能被 React丢弃缓存，不可把业务正确性建在缓存存在上。不要假设 React Compiler 已启用；以项目配置和构建输出为准。

## 安全边界

- JSX 普通字符串 children 会按文本转义；`dangerouslySetInnerHTML` 直接写原始 HTML，只用于可信、已清洗内容。
- 不可信 URL、style、第三方 widget 和 markdown renderer 仍需验证。
- 前端环境变量会进入可下载制品，不能放服务端密钥。
- 认证、租户、权限、审批、金额和幂等必须由服务端验证。
- Cookie/Token 方案要与 XSS、CSRF、CSP、SameSite 和威胁模型共同设计。
- npm 依赖锁定、审计、SBOM 和最小权限；构建插件能执行代码。

## 客户端、SSR 与 Server Components

| 模式 | 人话解释 | 适合 | 关键风险 |
|---|---|---|---|
| 客户端渲染 | 浏览器下载 JS 后创建 UI | 复杂登录后台 | 首屏、bundle、JS 失败 |
| SSR + hydration | 服务端先给 HTML，客户端接管交互 | 首屏/SEO/弱网需求 | 首次输出不一致、服务器容量 |
| SSG | 构建时生成 HTML | 内容稳定页面 | 数据新鲜度和重建 |
| RSC 框架 | 部分组件只在服务端执行并流式组合 | 支持框架中的服务端数据/UI | Server/Client 边界、缓存、版本锁定 |

RSC 不等于 SSR：Server Component 可参与服务端组件树和传输协议，SSR 是生成初始 HTML；实际框架可能组合两者。Server Component 不能使用只在客户端可用的交互 Hook。底层 bundler API 要锁具体 React 版本。

hydration 要求服务端和客户端首次渲染一致。时间、随机数、浏览器专有分支、无效 HTML 和不同数据都会 mismatch；不要用 `suppressHydrationWarning` 广泛掩盖。

## TypeScript、测试和工程门禁

TypeScript props/state 让非法组合更早暴露，但 API JSON 仍运行时校验。测试分层：

- 纯 reducer/selector 单元测试。
- 组件测试从用户角色、名称和行为操作，不测试内部 state。
- E2E 验证路由、认证、真实构建、加载/错误/取消/重复提交和可访问性。
- 类型检查、lint、生产 build 和目标浏览器冒烟都在 CI。

React StrictMode/测试中的额外执行应推动你修副作用，而不是写“只在第二次不执行”的全局标志。

## 可观测性和发布

前端事件字段建议：release/build ID、route template、operation、result、duration、status、cancel reason、粗粒度浏览器、trace ID 和组件栈。不能采 Token、Cookie、完整表单和真实业务 payload。

发布步骤：锁 Node/React/TypeScript/框架与 lockfile；可复现构建；单元/组件/E2E/类型/构建门禁；带哈希资源与入口原子发布；按 release 灰度；观察白屏、recoverable error、API 失败、关键动作、INP/LCP；保留上一整包制品和兼容 API，必要时回滚。

## 常用 API 字典

| API | 作用 | 预期 | 常见坑 |
|---|---|---|---|
| `useState` | 本地状态快照 | setter 请求新 render | 直接突变/立即读新值 |
| `useReducer` | 复杂事件状态转换 | reducer 纯、可测试 | reducer 内做请求 |
| `useContext` | 深层读取共享值 | 最近 Provider 生效 | 所有状态全局化/频繁更新 |
| `useEffect` | 同步外部系统 | setup/cleanup 对称 | 派生计算、漏依赖/清理 |
| `useRef` | 跨 render 保留可变值/DOM ref | 修改不触发 render | 把 UI 数据藏 ref |
| `useMemo` | 缓存昂贵纯计算 | 测量后降低成本 | 当正确性保证/全量使用 |
| `memo` | props 相同时跳过部分 render | 性能优化 | props 总是新对象导致无效 |
| `startTransition` | 标记非紧急状态更新 | 保持输入响应 | 代替网络取消或后端优化 |
| `useDeferredValue` | 延迟非紧急派生 UI | 输入先响应 | 以为自动减少网络请求 |

## 基础实验：React 19 + TypeScript 事件看板

仓库已提供固定 React 19.2.7、TypeScript 6.0.3 和 Vite 8.1.3 的 [frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)。执行 `cd examples/frontend-incident-lab`、`npm ci`、`npm run typecheck`、`npm test`、`npm run build`，再分别启动 API 与 dev，打开 `/react.html`；预期 StrictMode 下页面仍只有一个有效请求生命周期，7 项测试通过并生成 React 入口。

### 前置与创建

本仓库已经是 React 19.2 + TypeScript + Vite 项目，可直接阅读 `src/` 和执行现有门禁。独立练习可按 Vite 官方模板创建并锁定生成的 lockfile；以当日 React 与 Vite 官方要求为准。

核心组件：

```tsx
import { useMemo, useState } from 'react'

interface Incident { id: string; service: string; severity: 'warning' | 'critical' }

const initialIncidents: Incident[] = [
  { id: 'INC-1024', service: 'database', severity: 'critical' },
  { id: 'INC-1025', service: 'gateway', severity: 'warning' }
]

export function IncidentBoard() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => initialIncidents.filter((item) => item.service.includes(query.trim())),
    [query]
  )

  return (
    <main>
      <h1>事件看板</h1>
      <label htmlFor="query">按服务搜索</label>
      <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} />
      <p role="status">找到 {filtered.length} 条</p>
      <ul>{filtered.map((item) => <li key={item.id}>{item.id} {item.service}</li>)}</ul>
    </main>
  )
}
```

这个列表很小，`useMemo` 实际可能不需要；这里用来观察依赖。删除它直接计算也是正确实现，必须通过 profile 决定是否保留。

### 运行与验证

执行项目的 type-check/test/build 脚本并运行 dev server。预期输入 `data` 只剩 database；键盘 label/输入可用；React DevTools 显示 query；生产构建退出码 0；移动端无横向溢出。

### 失败先看和清理

- 空白：Console、Network、root 容器与 createRoot。
- 输入不更新：value/onChange 是否成对，事件是否正确读取。
- 列表警告：key 是否稳定唯一。
- 开发重复日志：检查 StrictMode 暴露的不纯/cleanup，别先删除 StrictMode。
- Ctrl+C 停 dev server；node_modules 可删除，保留 lockfile、源码和证据。

## 故障实验：缺 cleanup、key 错位与 hydration

### 注入一：Effect 泄漏

在 Effect 中创建 interval 或 mock fetch，不返回 cleanup。StrictMode 下观察 setup 重复，切换组件后资源仍存在。修复 `clearInterval`/AbortController，并验证 setup-cleanup-setup 后只有一个有效资源。

### 注入二：索引 key

为每行增加可编辑输入，使用 index key 后对列表排序。观察输入状态可能跟错事件；改用 `incident.id`，验证状态跟随业务身份。

### 注入三：水合不一致（只在本地 SSR 实验）

让服务端初始输出当前时间，客户端立即生成另一时间，观察 recoverable/hydration 警告。修复为服务端传递同一确定性值；不要广泛 suppress。没有 SSR 环境就只做前两项，不声称已验证水合。

### 回滚和复盘

实验只对本地合成页面。恢复 cleanup、稳定 key 和确定输入；重跑类型、测试、构建和浏览器回归。复盘保存 Network/Profiler/Console 证据、影响面和完整制品回滚点。

## AIOps 场景

- reducer 建模事件加载、确认、审批与失败状态，避免矛盾 boolean。
- 自定义 Hook 统一 Fetch 取消、Trace ID、错误映射和脱敏。
- Error Boundary 隔离单个图表/插件失败，核心处置路径仍可用。
- Profiler 与真实用户指标识别事件洪峰时的大列表和过度 render。
- root 错误回调、release 和后端 trace 形成“页面 -> API -> 服务”证据链。
- 高风险动作由服务端授权/幂等/审计，React 只展示依据和状态。

## 生产设计题：实时告警 React 控制台

参考主线：按领域拆组件和错误边界；URL 表达筛选；服务端数据缓存与本地交互状态分离；reducer 管有限状态；实时流有序号、断线续传、背压/暂停和窗口化；虚拟化大列表；权限服务端校验；Effect 资源 cleanup；SSR/客户端架构按首屏和交互选；测试类型/组件/E2E；release 观测、canary 和整包回滚。

## 事故题：React 发布后 API 请求翻倍

1. 先比较开发/生产、release、路由和真实 Network initiator，确认是否只在 StrictMode 开发出现。
2. 检查请求位于 render、Effect 还是事件处理器；Effect 是否依赖每次新建对象、是否 cleanup。
3. 保存服务端请求 ID，区分浏览器重复、重试、网关和后端内部调用。
4. 临时关闭问题自动刷新或回滚，不用删除 StrictMode 掩盖。
5. 将请求放到正确数据层/Effect，稳定依赖、取消旧请求并服务端幂等。
6. 增加 setup-cleanup、路由往返和生产构建 E2E，观察 QPS 恢复。

## 高频排障

| 现象 | 先看 | 常见原因 | 修复方向 |
|---|---|---|---|
| set 后仍旧值 | 当前 render/事件日志 | 状态快照 | 函数式更新/等新 render |
| 无限 render | 调用栈/组件 | render 中 set、Effect 循环 | 保持 render 纯、重构依赖 |
| 重复请求 | Network initiator/StrictMode | 缺 cleanup、依赖不稳 | 对称 cleanup/数据层 |
| 列表状态错位 | key/排序操作 | index/random key | 稳定业务 key |
| Effect 读旧数据 | deps/闭包 | 漏依赖、空数组 | 声明依赖/重构 Effect |
| 页面越来越慢 | Profiler/数据量 | 状态过高、大列表、Effect 瀑布 | 边界、虚拟化、测后 memo |
| Error Boundary 没抓到 | 错误发生阶段 | 事件/异步错误 | 局部处理+全局观测 |
| hydration 警告 | 服务端/客户端首树 | 时间、随机、无效 HTML | 确定输入和正确 hydrateRoot |
| 升级后 RSC 故障 | React/框架/打包版本 | 底层协议不兼容 | 锁具体组合、框架支持、回滚 |

## 面试表达

### 30 秒回答

React 用组件、props 和 state 描述 UI。状态更新触发新的 render 快照，React 按 type、位置和 key 协调元素树，再在 commit 阶段更新 DOM；Effect 只在提交后同步外部系统并必须 cleanup。生产中还要管理错误边界、性能测量、运行时契约、安全、SSR/RSC 边界、可观测和回滚。

### 3 分钟回答主线

从 JSX、组件和纯 render 讲起；解释 state snapshot、批处理和函数式更新；画 render/reconcile/commit、key 与身份；用请求讲 Effect 依赖和 cleanup；再讲 reducer/context/hook 的状态边界、Error Boundary、Profiler；最后讲 XSS、客户端/SSR/RSC 取舍、hydration、React 19 版本锁定、灰度和整包回滚。

### 连续追问

1. **setState 为什么不是立刻改变量？** 当前事件持有本次 render 快照，setter 排队下一次 render。
2. **key 有何作用？** 在同级树中帮助 React匹配身份，影响 state 保留/重置。
3. **何时不需要 Effect？** 纯派生值和用户事件逻辑不需要，用 render/event handler。
4. **Error Boundary 不抓什么？** 通常不自动抓事件处理器、任意异步回调和自身错误。
5. **SSR 与 RSC 区别？** SSR 生成初始 HTML并 hydration；RSC 让部分组件只在服务端执行，可与框架 SSR 组合，边界和协议不同。

## 学习检查清单

- [ ] 能解释 JSX、组件、props 和纯 render。
- [ ] 能解释 state 快照、批处理、函数式更新和不可变更新。
- [ ] 能画 render/reconcile/commit，并正确使用 key。
- [ ] 能判断何时需要 Effect，并实现 cleanup/取消。
- [ ] 能用 reducer/context/custom Hook 划清状态边界。
- [ ] 能设计 Error Boundary、性能和前后端观测。
- [ ] 能说明 XSS、SSR、hydration、RSC 和版本锁定。
- [ ] 能完成基础与故障实验，跑类型/测试/构建/浏览器回归。

## GitHub 学习证据

```text
react-incident-lab/
  package.json
  package-lock.json
  src/
    IncidentBoard.tsx
    requestReducer.ts
    useIncidents.ts
    ErrorBoundary.tsx
  tests/
  evidence/
    type-check.txt
    build.txt
    profiler-before-after.md
    network-cleanup.md
    keyboard-mobile.md
  postmortem/
    effect-key-hydration.md
```

提交源码、lockfile、测试和脱敏证据；不要提交 node_modules、Token、真实事件、内部 URL 或公开生产 Source Map。

## 与 Vue 公平比较和学习边界

React 的 JSX、状态快照和 render/commit 与 Vue 的 SFC/template、ref/reactive 依赖追踪不同。选择时比较团队能力、渲染架构、状态/路由/表单复杂度、生态、性能预算、升级和交接，不做“哪个必然更快”的空泛排名。

本文完成从零到生产主线与大厂连续追问的第一版，但不等于学完即可胜任完整前端岗位。还要在真实项目继续训练测试、网络、安全、可访问性、系统设计、代码评审和跨团队协作。可回到 [Vue](./vue.md) 做同一事件看板的机制对照。
