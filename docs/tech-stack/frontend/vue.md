# Vue 技术栈深讲

> 学习目标：从零理解 Vue 3 的应用、单文件组件、模板、响应式、组件通信、生命周期和渲染更新；能用 TypeScript 构建有加载/空/错误/取消状态的 AIOps 事件看板；能排查响应丢失、请求竞态、重复监听、key 错位、水合、安全、性能和升级问题。

## 官方资料

- [Vue 官方介绍](https://vuejs.org/guide/introduction.html)
- [Vue 快速开始](https://vuejs.org/guide/quick-start.html)
- [响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [深入响应式系统](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [组件基础](https://vuejs.org/guide/essentials/component-basics.html)
- [生命周期](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue 与 TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Vue 测试](https://vuejs.org/guide/scaling-up/testing.html)
- [Vue 性能](https://vuejs.org/guide/best-practices/performance.html)
- [Vue 安全](https://vuejs.org/guide/best-practices/security.html)
- [Vue SSR](https://vuejs.org/guide/scaling-up/ssr.html)
- [Vue 发布周期](https://vuejs.org/about/releases.html)

本文以 Vue 3 为主。完整应用推荐 Composition API（组合式 API）与 SFC（Single-File Component，单文件组件）；渐进增强和简单无构建页面仍可使用 Options API。不要把 Vue 2 的响应式限制、生命周期和生态结论直接套到 Vue 3。

## 官方知识地图与边界

```text
createApp -> root component -> mount
  -> SFC compiler: template / script setup / style
  -> component tree: props / events / slots / provide-inject
  -> reactivity: ref / reactive / computed / watch
  -> render effect -> virtual DOM -> patch real DOM
  -> router / shared state / SSR when the application needs them
```

本文覆盖 Vue 3 核心与生产主线，不穷举 Vue Router、Pinia、Nuxt 和所有组件库。框架不能替代 HTML 语义、CSS 布局、JavaScript、HTTP、权限或后端可靠性。

## 学习顺序

```text
HTML/CSS/JavaScript -> createApp 和模板 -> ref/computed
  -> props/events/slots -> 生命周期和请求 cleanup
  -> TypeScript/测试 -> 性能/安全/SSR -> 两级实验和生产设计
```

## 场景开场

Vue 事件页第一次打开正常，切换路由五次后每条 WebSocket 消息出现五次；搜索 `db` 后又快速输入 `database`，旧请求最后回来覆盖了新结果；开发服务没有红字，但 CI 类型检查失败。

三个现象分别指向生命周期 cleanup、异步竞态和“Vite 转译不等于类型检查”。会写模板并不等于会维护生产 Vue 应用。

## 一句话人话版

Vue 是一个用声明式模板、组件和响应式状态构建用户界面的 JavaScript 框架：你描述“状态对应什么页面”，Vue 追踪依赖并更新需要变化的 DOM。

## 小白先问

### Vue 是不是把 HTML、CSS、JS 合成一种语言

不是。SFC 把三部分放在一个 `.vue` 文件便于组件维护，但 template、script 和 style 仍有各自规则，并由构建工具编译。

### `ref` 为什么要 `.value`

普通局部变量读写无法被 Vue直接拦截。`ref` 用对象 getter/setter 在 JavaScript 中追踪读取和触发更新；模板里通常会自动解包，所以模板常不写 `.value`。

### `computed` 和 `watch` 有什么区别

`computed` 描述从已有响应式状态得到的派生值，通常无副作用并缓存；`watch` 用于状态变化后同步外部系统或执行副作用，例如网络请求。能直接计算的值不要用 watch 复制成第二份状态。

### Vue 会自动防所有 XSS 吗

不会。普通模板插值会转义文本，但 `v-html`、不可信模板、URL/style、第三方组件、认证和 CSRF 仍有风险。服务端授权不能交给前端。

## 启动、SFC 与编译路径

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.errorHandler = (error, instance, info) => {
  reportFrontendError({ error, info, release: __APP_VERSION__ })
}

app.mount('#app')
```

```text
App.vue
  -> SFC parser splits template/script/style
  -> template compiler creates render function
  -> script is transformed/transpiled
  -> bundler builds module graph and assets
  -> browser runs createApp and mounts root
```

同一个 app 实例只 mount 一次。`mount` 容器已有内容会成为接管边界；SSR 已有服务端 HTML 时走 hydration，而不是把普通客户端挂载当水合。

## 模板、指令与 key

```vue
<template>
  <section aria-labelledby="incident-heading">
    <h2 id="incident-heading">事件列表</h2>
    <p v-if="status === 'loading'" role="status">加载中…</p>
    <p v-else-if="status === 'error'" role="alert">加载失败</p>
    <ul v-else>
      <li v-for="incident in filtered" :key="incident.id">
        <button type="button" @click="emit('select', incident.id)">
          {{ incident.id }} - {{ incident.service }}
        </button>
      </li>
    </ul>
  </section>
</template>
```

- `v-if` 创建/销毁分支；`v-show` 保留 DOM 只切换显示，按切换频率和生命周期选择。
- `v-for` 的 key 表示稳定身份。用索引作为可排序列表 key 会让组件本地状态跟错行。
- `{{ }}` 会把值作为转义文本，不等于执行 HTML。
- 事件修饰符能表达 prevent/stop 等行为，但先理解 DOM 事件语义。

## 响应式：track、trigger 与批处理

```ts
import { computed, ref } from 'vue'

interface Incident {
  id: string
  service: string
  severity: 'warning' | 'critical'
}

const query = ref('')
const incidents = ref<Incident[]>([])

const filtered = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  return incidents.value.filter((incident) =>
    incident.service.toLowerCase().includes(normalized)
  )
})
```

### `ref` 五件套

- **是什么**：持有 `.value` 的响应式容器，模板通常自动解包。
- **为什么需要**：通过 getter/setter 让 Vue 知道谁读了状态、何时状态变化。
- **怎么工作**：render/computed 读取时 track 依赖；赋值时 trigger；DOM 更新批处理到后续 tick。
- **怎么看/怎么用**：Vue DevTools 看组件状态，开发期可用 `onRenderTracked`/`onRenderTriggered` 观察依赖。
- **坏了怎么查**：确认读写的是 ref/proxy、computed 真正读取依赖、没有把普通值解构后断开，以及 DOM 是否尚未 `nextTick`。

### `reactive` 边界

`reactive(object)` 返回 Proxy。访问 Proxy 才能追踪；持有 raw 原对象、替换整个 reactive 变量或把基本属性直接解构，都可能丢失连接：

```ts
const state = reactive({ count: 0 })
const { count } = state // count 是当时的普通 number，不会继续响应
```

可保留 `state.count` 访问，或按场景使用 `toRefs`/`toRef`。大规模不可变数据可在测量后考虑 shallowRef，不能不加分析地把所有数据深度 reactive。

## 组件边界：props down，events up

```vue
<script setup lang="ts">
interface Props { incident: Readonly<Incident> }
const props = defineProps<Props>()
const emit = defineEmits<{ acknowledge: [id: string] }>()
</script>

<template>
  <article>
    <h3>{{ props.incident.id }}</h3>
    <button type="button" @click="emit('acknowledge', props.incident.id)">
      确认
    </button>
  </article>
</template>
```

props 是父组件输入，子组件不应直接篡改；event 表达子组件发生了什么，由父组件决定状态变化。slot 让父组件提供内容。provide/inject 适合跨层依赖，但要避免把所有状态隐蔽成不可追踪全局依赖。

组件拆分看业务变化和复用边界，不按每个 `div` 拆文件。一个好边界应有可描述的 props/events/slots、错误状态和测试方式。

## 生命周期和 cleanup

```ts
import { onMounted, onUnmounted } from 'vue'

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(refreshFreshness, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
```

hook 必须在 setup 同步阶段注册，让 Vue 知道归属哪个组件。订阅、定时器、Observer、全局监听和未完成请求都要在失效/卸载时释放。

`onUpdated` 可能频繁运行，不能无条件改状态形成循环。确需等待 Vue 把批量状态提交到 DOM 后再读取，使用 `await nextTick()`；它不是任意“等待一会儿”。

## watch、请求取消与竞态

```ts
watch(query, async (newQuery, _oldQuery, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort('query-changed'))

  status.value = 'loading'
  try {
    const result = await fetchIncidents(newQuery, controller.signal)
    incidents.value = result
    status.value = result.length ? 'success' : 'empty'
  } catch (error) {
    if (!controller.signal.aborted) status.value = 'error'
  }
})
```

watch 源要明确；副作用每次失效前 cleanup。没有取消时旧请求可能覆盖新状态，组件卸载后仍占带宽。取消不回滚服务端写入，危险动作继续需要幂等和审批。

把这段逻辑封装为 composable（组合式函数）可以复用“有状态逻辑”；每次调用通常得到独立状态。模块顶层 singleton composable 若用于 SSR，可能跨用户共享状态，必须按请求创建。

## 状态管理、路由与数据所有权

先问状态属于谁：

- 只在组件使用：本地 `ref`。
- 父子共享：状态提升到最近共同祖先，props/events 传递。
- URL 应表达搜索/分页：放路由 query，支持刷新和分享。
- 跨多页面且有业务动作：评估 Pinia 或领域 store。
- 服务端数据：还要解决缓存、新鲜度、取消、重试和失效，不等于普通全局变量。

不要一开始把所有东西放 store。全局状态增加生命周期、并发、SSR 和测试成本。

## TypeScript：Vite 通过不等于类型通过

Vue SFC 中用 `<script setup lang="ts">`，但 Vite 开发服务和生产构建默认以 transpilation（转译）为主，不保证完成完整类型检查。官方创建的 TypeScript 项目通常配合 `vue-tsc`：

```powershell
npm run type-check
npm run test:unit
npm run build
```

实际脚本以项目 `package.json` 为准。CI 要锁 Node、Vue、TypeScript、vue-tsc 和 lockfile。Vue minor 可能带来类型变化；TypeScript 用户可锁定当前 minor，评估升级后再放开。

## 测试策略

| 层 | 检查 | 不该替代什么 |
|---|---|---|
| 纯函数单元测试 | 筛选、状态转换、格式化 | 组件与浏览器行为 |
| 组件测试 | props/events/slot、用户操作、可访问输出 | 真实路由/网络/构建 |
| 端到端测试 | 关键用户流、路由、API、权限和回滚冒烟 | 所有边界组合 |
| 类型检查 | 静态契约和不可达状态 | 运行时 JSON 校验 |

测试用户看见的行为而不是 Vue 内部实现；不要只断言组件实例私有字段。

## 安全边界

- 不可信字符串用普通插值；不得让用户控制 Vue template。
- `v-html` 只接受可信且按明确策略清洗的 HTML；组件封装不能让不可信输入自动变可信。
- 动态 URL、style 和第三方组件同样需要验证；`javascript:` URL 等危险值不是模板转义能完全解决。
- 认证、租户、权限、审批和幂等都由服务端验证。
- SSR 不能把某用户状态存在模块级 singleton；序列化进 HTML 的状态要安全转义。
- 依赖与插件具有应用权限，要锁版本、审计供应链和最小化插件数量。

## 性能、容量与渲染架构

先选择适合的架构：只需给现有页面加小交互可渐进增强；复杂后台可 SPA；需要首屏/SEO/弱端设备可评估 SSR/SSG。不要因为会 Vue 就把所有页面都做客户端 SPA。

性能证据包括构建分析、Network、浏览器 Performance、Vue DevTools 和真实用户指标。常见方向：路由级代码拆分、稳定 props、减少不必要响应式、分页/虚拟化大列表、控制 watcher、副作用和组件层级。优化前后用同一数据/设备测量。

## SSR 与 hydration

SSR 在服务端把组件生成 HTML，浏览器再 hydration（把交互和状态接到现有 DOM）。首次服务端输出与客户端首次渲染必须确定性一致。

常见 mismatch：无效 HTML 被浏览器修正、随机数/时区不同、仅客户端数据、权限状态晚到。不要广泛忽略警告；统一输入、合法 DOM 和序列化状态。每个请求创建独立 store/app，避免跨请求污染。

## 可观测性

```ts
app.config.errorHandler = (error, instance, info) => {
  report({
    release: BUILD_ID,
    route: router.currentRoute.value.name,
    componentInfo: info,
    message: error instanceof Error ? error.message : String(error)
  })
}
```

错误处理器补组件上下文，仍需结合 `window.error`、`unhandledrejection`、API status/duration、Web Vitals 和后端 trace。日志不上传 Token、Cookie、完整表单和敏感事件。`app.config.performance` 可用于开发性能标记；生产真实用户指标与专用 profile 另行设计。

## 升级、发布与回滚

1. 盘点 Vue/core、router、store、编译插件、TypeScript、组件库和 Node 支持矩阵。
2. 读 release notes，先在独立变更升级 lockfile。
3. 类型检查、单元、组件、生产构建和关键浏览器 E2E 全过。
4. 检查 bundle、hydration、错误率、API 成功率和关键动作。
5. 灰度发布，HTML 与带哈希资源原子一致。
6. 保留上一完整制品/lockfile；回滚整套，不在线替换单个 JS。

Vue 2 到 3 属于迁移项目，需要逐项核对 API、生态包和行为，不能只改主版本号。

## 常用 API 字典

| API | 作用 | 预期 | 常见坑 |
|---|---|---|---|
| `ref` | 包装响应式值 | JS 用 `.value` | 解构/覆盖后误判响应 |
| `reactive` | 对象 Proxy | 属性访问可追踪 | raw/解构/整体替换断连接 |
| `computed` | 缓存派生值 | 依赖变才重算 | 在 getter 中做副作用 |
| `watch` | 精确监听并做副作用 | 可 cleanup | 复制派生状态、无取消请求 |
| `watchEffect` | 自动追踪同步读取依赖 | 快速外部同步 | 依赖隐含难审查 |
| `nextTick` | 等待本轮 DOM 提交 | 读取更新后 DOM | 当普通 sleep |
| `onMounted` | DOM 挂载后动作 | 访问浏览器对象 | SSR 逻辑放错阶段 |
| `onUnmounted` | 释放外部资源 | timer/listener 清理 | 忘记导致重复和泄漏 |
| `provide/inject` | 跨层依赖 | 避免层层传参 | 隐藏全局耦合 |

## 基础实验：Vue 3 + TypeScript 事件看板

无需先生成一套新脚手架也能复现：仓库已提供固定 Vue 3.5.42、TypeScript 6.0.3 和 vue-tsc 的 [frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)。执行 `cd examples/frontend-incident-lab`、`npm ci`、`npm run typecheck`、`npm test`、`npm run build`，再分别启动 API 与 dev，打开 `/vue.html`；预期类型检查通过、7 项测试通过并生成 Vue 入口。

### 前置与创建

使用官方 `create-vue` 脚手架，Node 版本以当日官方 Quick Start 为准：

```powershell
npm create vue@latest
```

项目名 `vue-incident-lab`，选择 TypeScript、Vitest 和端到端测试（若当前环境允许）；其余按学习目标选择。进入目录后按脚手架提示安装依赖。

`App.vue` 核心：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

interface Incident { id: string; service: string; severity: 'warning' | 'critical' }

const query = ref('')
const incidents = ref<Incident[]>([
  { id: 'INC-1024', service: 'database', severity: 'critical' },
  { id: 'INC-1025', service: 'gateway', severity: 'warning' }
])

const filtered = computed(() =>
  incidents.value.filter((item) => item.service.includes(query.value.trim()))
)
</script>

<template>
  <main>
    <h1>事件看板</h1>
    <label for="query">按服务搜索</label>
    <input id="query" v-model.trim="query">
    <p role="status">找到 {{ filtered.length }} 条</p>
    <ul><li v-for="item in filtered" :key="item.id">{{ item.id }} {{ item.service }}</li></ul>
  </main>
</template>
```

### 运行、预期和验证

执行脚手架 `package.json` 中的 dev、type-check、test 和 build 脚本。预期输入 `data` 只显示 database；类型检查和生产构建退出码 0。使用键盘、Vue DevTools 与移动视口验证状态、DOM 和无横向溢出。

### 失败先看与清理

- 模板空白：Console、root 容器和 import。
- 改值不更新：确认 ref `.value`/模板解包、没有解构 reactive 基本值。
- build 过但 type-check 失败：这是不同门禁，修类型而不是删脚本。
- 清理：Ctrl+C 停 dev server；`node_modules` 可按需删除，保留 lockfile、源码和证据。

## 故障实验：响应丢失、竞态与 cleanup

### 注入一：解构丢响应

创建 `reactive({ count: 0 })` 后直接 `const { count } = state`，更新 `state.count`，观察模板中普通 count 不变。修复为访问 `state.count` 或 `toRef(s)`，记录 Vue DevTools 状态与 DOM 差异。

### 注入二：旧请求覆盖

watch query 发一个 2 秒和一个 100 毫秒 mock 请求，不 cleanup，快速输入两个词。证明旧结果覆盖后，加 AbortController/onCleanup；验证旧请求取消且只显示最新词结果。

### 注入三：重复监听

onMounted 增加 window listener 或 timer，故意不在 onUnmounted 清理；反复切换组件，点击一次触发多次。补清理后用计数证明只有一个有效资源。

### 回滚与复盘

故障只在本地 mock 工程。恢复合法实现，重跑 type-check/test/build 和浏览器回归。复盘按“现象 -> Vue/Network/DOM 证据 -> 响应或生命周期机制 -> 最小修复 -> 影响面 -> 回滚”记录。

## AIOps 场景

- 用组件表达筛选、事件表、处置时间线和审批卡片；每个组件有明确错误边界与可访问状态。
- 用 ref/联合类型表达 idle/loading/success/empty/error/cancelled，不用一堆矛盾 boolean。
- composable 统一超时、取消、Trace ID、脱敏和错误映射。
- errorHandler、API 指标和 release 关联到服务端 trace，支持变更根因判断。
- 实时事件流要有背压/采样/暂停、大列表虚拟化和断线恢复，不能每条消息无上限推入 reactive 数组。

## 生产设计题：多团队 Vue 事件控制台

参考主线：按领域拆路由和组件；URL 保存可分享查询；局部状态、服务端缓存和 Pinia 各有边界；统一请求 composable 处理取消/认证/错误/观测；服务端最终授权；路由懒加载和大列表预算；全局错误处理配合局部恢复；SSR 每请求独立状态；组件/契约/E2E 门禁；按 release 灰度并能回滚完整制品。

## 事故题：切换路由后重复请求持续增长

先记录 release、路由次数、Network initiator、Vue 组件树、timer/listener/订阅数量；假设是组件未卸载、watch 多次创建或 cleanup 缺失。用最小路由复现验证，不先扩大超时。可临时关闭自动刷新缓解；永久修复绑定 effect scope/onCleanup/onUnmounted，增加“进入离开 10 次仍一条订阅”的测试；回滚引入问题的完整版本并观察请求率恢复。

## 高频排障

| 现象 | 先看 | 常见原因 | 修复方向 |
|---|---|---|---|
| 状态改了 DOM 不变 | DevTools/依赖访问 | reactive 解构、raw、异步 tick | 保留响应连接/nextTick |
| 重复请求 | Network initiator/组件生命周期 | watch/effect 无 cleanup | Abort + 生命周期清理 |
| 列表状态错行 | key 和排序前后数据 | index/random key | 稳定业务 ID |
| build 绿 type-check 红 | 实际 scripts/日志 | Vite 只转译 | 单独 vue-tsc 门禁 |
| 页面越来越慢 | Profiler/组件更新/数组规模 | 深响应、大列表、重复 watch | 测量后浅响应/虚拟化/边界 |
| hydration mismatch | 服务端/客户端 DOM 和输入 | 非确定性、无效 HTML、共享状态 | 同输入、合法 DOM、按请求状态 |
| v-html 安全告警 | 数据来源/净化策略 | 不可信富文本 | 文本插值或可信清洗 |
| 升级后类型爆炸 | lockfile/release notes | Vue/TS/工具声明变化 | 锁 minor、分批修复、回滚 |

## 面试表达

### 30 秒回答

Vue 3 用组件和声明式模板描述 UI，通过 ref/reactive 的依赖追踪，在 render effect 读取时 track、状态变化时 trigger，并批量 patch DOM。生产上我会明确 props/events 和状态所有权，副作用用 watch/生命周期 cleanup，单独运行 TypeScript 检查，并覆盖安全、性能、SSR 状态隔离、观测和回滚。

### 3 分钟回答主线

从 createApp/SFC/template 编译开始；解释 ref/reactive/computed/watch 和 track/trigger；画组件 props down/events up 与 virtual DOM patch；用请求说明 cleanup/竞态；再讲 Router/Pinia 的引入边界、Vite 与 type-check 差别、测试；最后讲 v-html、SSR hydration/跨请求状态、大列表、errorHandler、灰度升级和回滚。

### 连续追问

1. **ref 与 reactive？** ref 是常用响应容器，reactive 返回对象 Proxy；按状态形状、替换和 API 边界选择。
2. **computed 与 watch？** computed 负责无副作用派生，watch 同步外部系统。
3. **为什么解构可能丢响应？** 取出基本值后不再经过 Proxy getter，无法继续 track。
4. **nextTick 做什么？** 等待 Vue 当前批次 DOM 更新，不是通用延迟。
5. **SSR 最大风险？** 首次输出不一致和模块 singleton 跨请求污染；按请求建状态并保证确定性。

## 学习检查清单

- [ ] 能解释 Vue 3、SFC、Composition/Options API 边界。
- [ ] 能画 template -> render effect -> track/trigger -> patch。
- [ ] 能正确使用 ref/reactive/computed/watch/nextTick。
- [ ] 能设计 props/events/slots 和状态所有权。
- [ ] 能清理请求、timer、listener 和订阅。
- [ ] 能运行 type-check、测试、生产构建和浏览器验证。
- [ ] 能说明 v-html、SSR、性能、依赖和升级风险。
- [ ] 能完成三类故障注入并形成复盘。

## GitHub 学习证据

```text
vue-incident-lab/
  package.json
  package-lock.json
  src/
    App.vue
    components/
    composables/useIncidents.ts
  tests/
  evidence/
    type-check.txt
    build.txt
    network-cancel.md
    keyboard-mobile.md
  postmortem/
    reactivity-and-cleanup.md
```

提交源码、lockfile、测试和脱敏证据，不提交 node_modules、Token、真实告警、内部 URL 或公开生产 Source Map。

## 与 React 公平比较和下一步

Vue 的 SFC/template、细粒度响应追踪和官方渐进式路线，与 React 的 JSX、状态快照和 render/commit 心智模型不同。不要空泛比较“谁更快”；用团队经验、渲染架构、状态/路由复杂度、生态、性能预算、升级和交接成本选择。继续阅读 [React](./react.md) 做机制对照。
