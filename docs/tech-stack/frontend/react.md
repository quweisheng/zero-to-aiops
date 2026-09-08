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
createRoot（客户端创建根）/ hydrateRoot（接管服务端标记）
  -> component functions（组件函数）+ JSX（界面描述语法）+ props（组件输入）
  -> state snapshot（状态快照）/ events（事件）/ reducer（状态转换函数）/ context（跨层上下文）
  -> render phase creates UI description（渲染阶段计算界面描述）
  -> reconciliation uses type, position and key（协调阶段按类型、位置和键匹配身份）
  -> commit phase updates DOM and refs（提交阶段更新文档节点与引用）
  -> Effect synchronizes external systems after commit（提交后同步外部系统）

rendering architecture（渲染架构）
  -> client rendering（客户端渲染）/ SSR + hydration（服务端渲染与水合）/ framework + RSC（框架与服务端组件）
```

React 是 UI 库，不自带完整路由、数据层、认证、后端和部署方案。真实项目通常使用框架或构建工具；选型必须说明具体组合和版本。

## 学习顺序

```text
HTML/CSS/JavaScript -> JSX/组件/props -> state 与事件
  -> render/commit/key -> Effect cleanup -> reducer/context/hooks（渲染、提交与身份；副作用清理；状态归约、上下文与钩子）
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
trigger: initial render or state update（触发：初次渲染或状态更新）
  -> render: call components, produce next element tree (must be pure)（渲染：调用组件产生下一棵元素树，必须保持纯净）
  -> reconcile: compare type, position and key with previous tree（协调：与旧树比较类型、位置和键）
  -> commit: apply DOM changes and refs（提交：应用节点变更与引用）
  -> browser paint / passive Effects（浏览器绘制与副作用同步，具体先后取决于交互与调度，见正文）
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
    .then((data) => {
      if (!controller.signal.aborted) dispatch({ type: 'loaded', data })
    })
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

## 进阶层一：React element、组件实例与 DOM 的关系

JSX 会转换成 React element 描述。element 是不可变的普通描述对象，不是真实 DOM，也不是组件实例：

```tsx
const view = <IncidentRow incident={incident} />
```

函数组件被 React 调用后返回下一层 element tree。React 根据 type、位置和 key 把前后两次描述关联起来，再决定哪些宿主节点（例如 div、button）需要创建、更新或删除。

```text
JSX（用于描述界面的 JavaScript 语法扩展）
  -> React elements（界面元素描述对象）
  -> Fiber tree（React 内部工作单元/组件树表示）
  -> render/reconciliation 计算变化
  -> commit 更新 DOM、ref 和布局 effect
  -> 浏览器 style/layout/paint
  -> passive Effect 运行
```

不要把 Fiber 私有字段当业务 API。面试应理解它让 React 能把渲染工作拆分、标记优先级和保存组件状态关联，而不是背某个版本的内部源码字段。

## 进阶层二：render 可以被重做，commit 才改变外部世界

render 阶段计算下一棵 UI，应保持纯：同样 props/state/context 应得到同样结果，不修改外部系统。并发渲染下，React 可能开始、暂停、放弃或重新执行 render；只有 commit 的结果真正应用到 DOM。

因此下面行为不应放在组件函数里：

- 发起不可撤销写请求。
- 修改全局对象或 DOM。
- 启动 timer/listener。
- 生成必须只出现一次的审计记录。
- 依赖随机数/当前时间决定首次 SSR 内容。

用户动作放 event handler；与已提交 UI 同步外部系统放 Effect；服务端事务放受控 API。

### StrictMode 为什么暴露问题

开发 StrictMode 会额外调用部分 render、Effect setup/cleanup 等流程，帮助发现不纯渲染和清理不对称。这不是生产必然重复执行的承诺，也不能靠全局 `hasRun` 标志跳过。正确修复是让 setup/cleanup 可重入、让写操作绑定明确用户事件和幂等服务端。

## 进阶层三：Fiber 身份、key 与状态保留

React 将 state 与组件在渲染树中的身份关联。相同位置、相同 type、相同 key 通常保留 state；type/key 改变会重置对应子树。

```tsx
{incidents.map((incident) => (
  <IncidentEditor key={incident.id} incident={incident} />
))}
```

索引 key 在重排后会把编辑草稿、焦点或本地错误状态错误关联。随机 key 则每次重建所有行。key 只需要在当前兄弟集合唯一，不会自动作为 prop 传给组件。

有意重置表单时可以改变 key，但要明确用户草稿丢失和焦点行为，不把 key 当普通刷新按钮。

## 进阶层四：更新队列、批处理与函数式更新

每次 render 读取的是固定 state snapshot。setter 把 update 加入队列，并请求后续 render：

```tsx
setCount(count + 1)
setCount(count + 1) // 两次都基于当前快照，通常结果只加 1

setCount((current) => current + 1)
setCount((current) => current + 1) // updater 串行应用，结果加 2
```

updater 应保持纯，因为 React 可能在开发中额外调用验证。React 18+ 在更多异步边界自动批处理更新，减少无意义 commit；需要立即读取已提交 DOM 的极少数集成场景才考虑同步刷新，并评估性能。

### state 设计规则

1. 相关且一起变化的值可以合并。
2. 不互相矛盾的状态用联合或 reducer 表示。
3. 能从 props/state 计算的值不重复存。
4. 避免同一数据在多个组件复制并双向同步。
5. 对象和数组使用不可变更新，让引用变化表达新快照。

## 进阶层五：reconciliation 的取舍

任意两棵树的最优差异计算成本很高。React 使用启发式：不同 element type 通常替换子树；同类型继续比较 props/children；列表依赖 key 识别身份。

React 重新 render 组件不等于真实 DOM 全部重建。render 是计算，commit 才执行必要宿主更新。性能排查要用 Profiler 看哪些组件 render、哪些 commit 花时，再结合浏览器 Performance 看 DOM/layout/paint。

`memo` 只能根据 props 浅比较跳过部分 render；组件读取的 context 或自身 state 变化仍更新。若父组件每次创建新对象/函数，memo 可能无效。不要为追求“零 render”增加更大复杂度。

## 进阶层六：Effect 的生命周期与闭包

Effect 不是组件生命周期方法的简单替代，而是“当前已提交 UI 与某个外部系统之间的同步过程”。每次相关依赖变化：先清理旧同步，再建立新同步。

```text
commit with room=A（提交房间甲）
  -> setup subscription A（建立甲的订阅）
state changes to room=B（状态改为房间乙）
  -> cleanup subscription A（清理甲的订阅）
  -> setup subscription B（建立乙的订阅）
unmount（卸载）
  -> cleanup subscription B（清理乙的订阅）
```

Effect 回调捕获创建它的 render 快照。依赖遗漏会产生 stale closure（旧闭包）；无脑把对象/函数加入依赖又可能每次 render 重连。优先重构状态和逻辑边界，而不是禁用 lint。

### Effect Event、useEffectEvent 与边界

React 19 的 `useEffectEvent` 可把 Effect 中需要读取最新值、但不应触发重新同步的逻辑分离出来。它不是绕过依赖的通用工具，不能在普通事件或任意位置调用；按当前官方规则和 lint 版本使用。

### 数据请求为什么常不应散落在 Effect

手写 Effect 请求需要自己处理 SSR 不执行、瀑布、缓存、预加载、竞态、取消和重复。小型客户端页可以明确实现；复杂应用优先采用框架数据 API 或集中数据层，并保留运行时校验和错误状态。

## 进阶层七：ref、DOM 与 imperative escape hatch

`useRef` 在 render 间保留同一对象，修改 `.current` 不触发 render。适合 DOM ref、timer ID、与 UI 无关的可变句柄；不能把应该显示的业务状态藏进 ref。

访问 DOM 通常在事件或 Effect/布局 Effect。`useLayoutEffect` 在浏览器绘制前同步运行，会阻塞绘制，只用于需要测量并立即调整的少量场景。多数副作用使用普通 Effect。

组件暴露 imperative handle 时接口应小而稳定，例如 `focus()`，不要把整个内部 DOM 暴露给父组件形成强耦合。

## 进阶层八：Context、外部 store 与 tearing

Context 适合低频、跨层的配置/依赖，如主题、当前租户句柄、服务接口。Provider value 每次变更会让读取它的消费者重新 render；一个巨大且高频对象会扩大更新范围。

可拆分 context、稳定 value、把状态放近使用者。外部 store 与并发渲染集成应使用 `useSyncExternalStore`，提供一致 snapshot 和订阅协议，避免同一 render 树看到撕裂的不同状态。

Context 不是安全边界。前端 tenant context 只能帮助构造请求，服务端仍必须从可信身份授权。

## 进阶层九：Scheduler、lanes 与 transition 心智模型

React 会给更新分配优先级，内部以 lanes 等机制组织工作。用户输入等紧急更新应尽快反映；大列表筛选结果可标为 transition，让 React 优先保持输入响应。

```tsx
const [isPending, startTransition] = useTransition()

function handleChange(value: string) {
  setQuery(value) // 紧急：输入框立即显示
  startTransition(() => {
    setVisibleFilter(value) // 非紧急：昂贵列表可以稍后完成
  })
}
```

transition 不会让 CPU 计算本身变快，也不会自动减少网络请求。对巨大同步循环仍要优化算法、分页或移到 Worker；请求仍需取消与竞态保护。

## 进阶层十：Suspense、lazy 与错误边界协作

`lazy` 配合 Suspense 可在组件代码尚未加载时显示 fallback。数据 Suspense 的正式用法高度依赖框架/数据源支持，不能假设任意 Effect fetch 会自动进入 Suspense。

边界设计原则：

```text
route shell 保持可用
  -> 局部 Suspense 显示骨架
  -> 局部 Error Boundary 显示可恢复错误
  -> 已成功区域不因一个小组件失败而消失
```

懒加载 chunk 404 常是部署版本错配。错误边界要识别 release，保护草稿，提供一次受控刷新或回滚提示，避免无限 reload。

## 进阶层十一：SSR、streaming 与 hydration

SSR 基本路径：

```text
HTTP request（网络请求）
  -> 服务端读取授权数据
  -> render React tree to HTML/stream（把组件树渲染为页面标记或流）
  -> 浏览器逐步显示 HTML
  -> 下载 client bundle
  -> hydrateRoot 绑定事件并校验结构
```

Streaming SSR 可以让不同 Suspense 边界分段到达，但增加错误、缓存、代理缓冲和监控复杂度。服务端必须隔离每个请求状态，并安全序列化数据。

hydration mismatch 常来自 Date.now/Math.random、时区、本地存储分支、无效 HTML、服务端与客户端不同权限/数据。`suppressHydrationWarning` 只适合已理解且局部不可避免的差异，不应覆盖整棵树。

### useId 与稳定身份

需要 SSR/客户端一致的表单 id 时使用 `useId`，不要在 render 用随机数。useId 不用作列表 key；列表 key 来自业务数据身份。

## 进阶层十二：Server Components 与 Server Actions 边界

Server Component 在服务端执行，可直接靠近数据源并不把其组件代码发送给客户端；Client Component 承担状态、事件和浏览器 API。二者之间通过框架定义的序列化边界传递 props。

不要把 RSC 说成“更快的 SSR”：

- RSC 的输出是组件传输协议，不只是 HTML。
- SSR 负责初始 HTML，可渲染 Client/Server 组合的结果。
- Client Component 仍可能 SSR 后 hydration。
- 底层 RSC bundler API 的版本兼容需要锁定框架支持组合。

Server Action/服务端函数仍是网络入口，必须认证、授权、校验、CSRF 防护、限流、幂等和审计。把函数写在服务器文件里不会自动安全。

## 进阶层十三：React 性能模型和容量

一次慢交互可能分布在：事件处理、状态更新、React render、commit、浏览器 layout/paint 和网络。用 Profiler 的 commit 信息与浏览器 trace 对齐，不要只看到一个组件 render 就认定根因。

关键指标：

- 首屏 JS、route chunk、第三方依赖体积。
- 每次关键动作 render/commit 时间。
- INP、long task、LCP、CLS。
- 列表规模、DOM 数、内存、订阅和请求数。
- API 成功率、取消率、重复写、恢复时间。

列表虚拟化减少 DOM，但会改变屏幕阅读器、查找、焦点和滚动行为。大规模 AIOps 表格可能采用服务端分页 + 窗口化 + 可访问替代视图，并验证导出/复制需求。

## 进阶层十四：测试并发与用户行为

测试重点是可见行为和契约：

1. reducer/selector 的纯状态转换。
2. 组件通过 role/name 操作，验证 loading/empty/error/cancelled。
3. 使用真实 timer/受控 fake timer 验证 cleanup，避免测试泄漏。
4. StrictMode 下请求不会产生错误副作用。
5. E2E 验证真实构建、路由深链、chunk、权限、移动端和键盘。
6. 对 SSR 测 hydration warning 和跨请求状态隔离。

测试中的 `act` 用于把可能触发 React 更新的操作包在一个可观察单元；用户事件工具通常会帮助处理。不要用大量随意 waitFor 掩盖竞态。

## 进阶故障实验：状态身份、Effect 与发布

### 故障一：索引 key 让处置草稿串行

1. 每行 IncidentEditor 保存本地草稿，列表使用 index key。
2. 按严重级别排序，观察草稿跟到另一事件。
3. 改用稳定 incident.id，补排序/筛选组件测试。
4. 记录“组件位置身份”与“业务实体身份”的关系。

### 故障二：Effect 缺 cleanup 造成连接增长

1. 每次切事件都订阅合成 EventSource，故意不 close。
2. 切换 20 次，记录连接数和重复消息。
3. Effect 返回 cleanup，并验证依赖变更先关旧连接。
4. 在 StrictMode 和真实生产构建分别回归。

### 故障三：stale closure 覆盖新状态

1. Effect 内定时读取旧 query，遗漏依赖。
2. 快速输入后记录请求使用旧值。
3. 重构为事件参数、正确依赖或 Effect Event（适用时）。
4. 不通过禁用 lint 或把一切塞进 ref 掩盖。

### 故障四：旧标签页懒加载 chunk 404

1. 构建并部署合成 v1，保留打开的标签页。
2. 构建 v2 并删除 v1 chunk，让旧页导航。
3. 记录 resource URL、HTML release、404 和错误边界。
4. 实施旧哈希资源保留期、原子发布和受控恢复，验证草稿不丢。

### 故障五：hydration 不一致

1. SSR 首次 render 中直接使用当前时间或随机数。
2. 记录 onRecoverableError 和服务端/客户端输出。
3. 把稳定值从服务端序列化，或在 hydration 后再显示客户端专属信息。
4. 验证无警告、无布局跳变并保持可访问名称一致。

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

## 老师带你从“快照”理解 React，而不是记口诀

你在值班页面看到“已确认 0 条”，点击按钮。事件处理函数来自这一次 render，它读到的 count 是 0；调用 setter 后，React 安排后续计算，下一次 render 才得到 1。学生问：“为什么不用立刻改掉 count？”因为固定快照能让同一次渲染的计算保持一致，不会在函数运行一半时突然换成另一份数据。[状态快照官方解释](https://react.dev/learn/state-as-a-snapshot)

不要把它简单背成“setState 总是异步”。更准确地问：当前代码持有哪次 render 的值，setter 把什么更新排进队列，下一次 render 得到了什么。这个模型同时解释事件处理器、定时器闭包、批处理和 Effect 依赖。

### 完整课堂实验：同样三行为什么只加一

使用本文 React 本地项目，备份当前 App.tsx，把下面组件作为页面入口渲染。只用本地状态，不访问后端。

```tsx
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  function fromSnapshot() {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
  }
  function fromQueue() {
    setCount((n) => n + 1)
    setCount((n) => n + 1)
    setCount((n) => n + 1)
  }
  return <main>
    <h1>状态快照实验</h1>
    <p role="status">当前：{count}</p>
    <button onClick={fromSnapshot}>快照方式</button>
    <button onClick={fromQueue}>队列方式</button>
    <button onClick={() => setCount(0)}>归零</button>
  </main>
}
```

基础验证：点击队列方式一次，预期从 0 到 3。故障验证：归零后点击快照方式一次，预期只到 1。如果产品要求增加三次，这就是可复现错误。修复使用纯函数 updater（更新函数），让每一步接收队列中的前一值。

打开 DevTools 看状态，记录按钮动作和最终值。若一次出现 6，检查是否给按钮重复绑定或在 updater 中做了外部累加；updater 必须纯，开发工具可能额外调用来帮助验证。恢复原 App.tsx 后运行项目类型检查、测试和构建，停止 dev 服务。实验没有持久化数据，关闭页面即结束状态。

### key 是身份，不是消除警告的装饰

两张事件卡片各自有草稿：A 写“检查数据库”，B 写“检查网关”。列表排序以后，草稿应该跟事件走，而非跟第一行第二行走。key 让 React 把两次渲染中的同一个实体对起来；数组索引描述位置，事件 ID 描述业务身份。[状态保留与重置](https://react.dev/learn/preserving-and-resetting-state)

随机 key 每次变化会让 React 认为是新实体，输入、焦点、订阅和局部状态一起重建。主动改变 key 可以实现“切事件就清空草稿”，但必须是明确交互设计。老师让你把“我想保留什么、什么时候重置”先写成一句话，再选 key。

### Effect 是同步关系，cleanup 是断开旧关系

事件详情订阅 A 的日志，切到 B 时应先停止 A 再订阅 B。Effect 的依赖描述这条同步关系用到哪些响应值；cleanup 关闭旧连接。把依赖写成空数组并不意味着“更省性能”，它可能意味着永远订阅第一次的事件。

取消请求后也要防旧结果提交，尤其你的数据函数可能忽略 AbortSignal。将失效标记或编号与请求一起保存，在成功与失败分支都检查资格。Effect 相对浏览器绘制的时机还有交互相关例外，不能把“普通 Effect 永远在 paint 后”当绝对承诺；依照[useEffect 文档](https://react.dev/reference/react/useEffect)选择，必须在绘制前测量时才考虑 layout Effect。

### 你不需要用 Effect 保存所有派生值

例如筛选列表从 `incidents` 与 `query` 计算即可。额外存 `filtered` 并在 Effect 里同步，会先用旧派生值渲染，再触发第二次更新，还增加遗漏依赖的机会。计算真的很贵时再测量 memo，数据太多则先考虑分页和算法。缓存是性能工具，源数据和状态设计才决定正确性。

Context 负责把值传到深处，自定义 Hook 复用逻辑，reducer 集中状态转换，三者都不自动提供服务端一致性。确认事件成功与否仍由后端权威记录决定；前端乐观更新需要明确失败回滚、并发冲突和刷新后的再同步。

### 面试课堂：从解释机制走到设计系统

30 秒讲清“纯 render 计算、commit 修改 DOM、Effect 同步外部系统”；3 分钟用上面的加三实验和事件切换说明快照、队列、身份与清理。面试官继续问性能，就把 React render、commit、浏览器布局、网络等待分开测量，不把组件重新执行次数当唯一指标。

设计实时告警台时，先定每秒事件量、最大保留条数、断线补偿方式和用户暂停语义，再选状态层与列表窗口化。十万条消息无上限塞进 state，框架再快也会耗尽内存；收到同一事件的多次更新，可以按业务版本合并，保留审计顺序的部分则进入另一条存储链。

发生发布后白屏，先核对入口 HTML、chunk、运行版本、错误边界和接口契约。若某一图表失败，不应让确认事件的主体操作一起消失；局部恢复边界、整包回滚和按版本观测能减少影响。你的回答最终落到“用户还能完成什么、如何证明恢复”，就比只列 Hook 名字完整得多。

## React 工程课堂：减少需要同步的状态，增加可验证的边界

### 为什么少一个 state，反而少一类故障

设想看板保存 `incidents`、`query` 和 `filteredIncidents` 三个状态。第三个完全可以由前两个算出，却被 Effect 另存一份。每次查询变化，页面先用旧筛选结果渲染，再执行 Effect 更新，随后又渲染一次；如果条件不完整，还可能永远不同步。这里的问题不是 React 太慢，而是你维护了两份本应相同的事实。

老师让你先问：“这个值能不能直接从当前 props 和 state 推导？”能的话先在渲染中计算。确实昂贵再测量是否需要缓存；缓存是性能选择，不是维持业务正确性的条件。用户点击处置产生的请求应在事件处理器或明确的数据操作层中发出，不必先设置一个 `shouldSubmit` 状态再让 Effect 猜测何时提交。[不需要 Effect 的场景](https://react.dev/learn/you-might-not-need-an-effect)

### useMemo 与 memo 没有承诺业务只执行一次

`useMemo` 缓存计算结果，`memo` 可帮助组件在满足条件时跳过部分重新渲染，但它们都不适合承担一次性发送、审计或资源锁的职责。渲染必须能被重新执行而不产生危险副作用；即使某次优化减少了调用次数，也不能据此保证永远只运行一次。

比较依赖与 props 时，对象身份很重要。每次渲染新建的对象、数组或函数，即使内容看起来相同，也可能让相应浅比较认为变化。先缩小传递数据与组件职责，再有证据地稳定引用；不要为了“全部稳定”引入更多难读的缓存层。只有 Profiler 显示相关组件确实造成可感知成本时，优化才有明确目标。

### Context 解决传递，不自动解决所有更新成本

Context 让深层组件读取共享值，但一个经常变化的大对象可能使很多消费者需要更新。身份信息、主题、实时告警列表和每毫秒变化的计时器放在同一个值中，容易扩大影响范围。按变化频率和业务所有权拆分，或者使用适合需求的状态选择机制，比盲目给所有子组件套 memo 更有解释力。

外部 store 的订阅还需要正确的快照语义，避免一次界面更新中不同消费者看见不一致状态。React 提供相关订阅接口是为了解决与框架外可变状态同步的问题，不是鼓励随处修改全局对象。设计时明确谁发布变更、快照何时变化以及订阅何时释放；测试中加入并发更新与卸载路径。

### 错误边界和重试按钮也有职责范围

错误边界用于隔离子树的某类渲染错误，但不会替所有事件处理器和异步任务自动捕获失败。接口请求的错误仍需要进入明确的请求状态；用户事件里的异常需要适当捕获与上报。把整站只包一个边界，可能使一个图表错误让整个处置界面消失；过度拆分又会增加状态协调复杂度，要按业务可降级单元选择。

重试按钮应重试哪一层也要说清：重新加载懒加载模块、重新请求只读数据、重新执行带副作用的操作，是三种不同风险。前两者可以在有界条件下尝试，最后一种必须先查真实任务结果与幂等键。错误界面应该保留请求标识和可采取动作，但不显示内部堆栈、访问令牌或敏感业务载荷。

### 从一次组件测试走到发布可靠性

测试状态身份时，不只断言列表文本。先在某一行输入草稿，再排序或在前面插入新事件，检查草稿和焦点仍属于同一个事件 ID；这才能发现索引 key 的真实影响。测试 Effect 时，建立、更新依赖、卸载后分别检查订阅数量，而不是只统计组件函数运行了几次。

测试竞态时，让旧请求故意晚到，确认当前查询结果不被覆盖；再让旧请求失败，确认它也不能把当前成功界面改成错误态。成功与失败两条路径都必须检查。开发模式的额外检查有助于暴露清理问题，但生产验证还要看实际构建、路由、资源路径和服务端返回，不能把开发控制台全部安静当成上线证明。

最后，前端回滚需要保留旧入口与其引用的资源，并兼容正在使用旧页面的用户。新版 API 如果立即删除旧字段，即使站点可以切回旧 JavaScript，业务也未必恢复。发布记录应关联前端构建、API 契约和功能开关；监控同时观察白屏错误、资源加载失败、交互延迟与真实业务成功率。这样你讲的是一个可恢复系统，而不是只会组织组件树。

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
