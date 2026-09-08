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
createApp（创建应用）-> root component（根组件）-> mount（挂载）
  -> SFC compiler（单文件组件编译器）: template（模板）/ script setup（组合逻辑）/ style（样式）
  -> component tree（组件树）: props（输入）/ events（事件）/ slots（插槽）/ provide-inject（跨层依赖）
  -> reactivity（响应式）: ref（值容器）/ reactive（对象代理）/ computed（派生计算）/ watch（监听副作用）
  -> render effect（渲染响应任务）-> virtual DOM（虚拟节点树）-> patch real DOM（更新真实文档）
  -> router（路由）/ shared state（共享状态）/ SSR（服务端渲染），按应用需要引入
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
App.vue（应用根组件文件）
  -> SFC parser splits template/script/style（单文件组件解析器拆出模板、脚本和样式）
  -> template compiler creates render function（模板编译器生成渲染函数）
  -> script is transformed/transpiled（脚本转换与转译）
  -> bundler builds module graph and assets（打包器构建模块依赖图与资源）
  -> browser runs createApp and mounts root（浏览器创建应用并挂载根组件）
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
    if (controller.signal.aborted) return // 即使底层忽略取消，过期结果也不能更新状态
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

## 进阶层一：从 SFC 到浏览器 DOM 的编译路径

Vue Single-File Component（SFC，单文件组件）通常包含 template、script 和 style。它不是浏览器原生格式，构建工具会分别处理：

```text
Component.vue（单文件组件）
  -> SFC parser 拆分 block
  -> template compiler 生成 render function
  -> script/TypeScript 转译
  -> style 处理 scoped/CSS modules/preprocessor
  -> bundler 建依赖图、分包、压缩
  -> 浏览器加载 JavaScript
  -> createApp 创建组件树
  -> render effect 生成 vnode
  -> patch DOM（把差异应用到页面节点）
```

模板编译器能在构建期分析静态节点、动态绑定和事件，并生成 patch flag（补丁标志）等优化提示。运行时不必盲目比较整棵树的每个属性。

### 编译时与运行时版本必须匹配

`@vue/compiler-sfc` 与 `vue` 核心版本不匹配，可能出现模板转换、宏类型或 HMR 问题。脚手架通常锁定相容组合，升级时要同时核对 Vue、compiler-sfc、Vite 插件、vue-tsc 和 TypeScript。

运行时编译版可以在浏览器把模板字符串编译为 render function，体积与安全边界更大。生产应用通常预编译 SFC，不允许用户输入成为模板。

## 进阶层二：响应式依赖图怎样建立

可以用下面的简化模型理解 Vue 3 响应式：

```text
reactive target（被跟踪的响应式对象）
  -> key（属性键）
  -> dependent effects set（依赖该属性的响应作用集合）

effect 执行并读取属性
  -> track(target, key, activeEffect)（记录当前作用对对象属性的依赖）

属性写入
  -> trigger(target, key)（属性变化时通知相应依赖）
  -> scheduler 把 effect 放入队列
  -> 批量执行并 patch DOM
```

实际实现还有 WeakMap、Set、Proxy handler、computed dirty flag、effect scope 等细节。面试不必伪装背源码，但要能解释“谁读过哪个响应式属性，变更时只通知相关 effect”。

### ref 与 reactive 的边界

`ref` 用一个稳定容器表示可替换值；对象 ref 的内部值也会深度响应式转换。`reactive` 返回 Proxy，响应性依赖通过该 Proxy 访问。

```ts
const state = reactive({ count: 0 })
let { count } = state
count++ // 只是局部 number，不再经过 state Proxy
```

要保留属性级响应性可使用 `toRef/toRefs`，但不要把所有对象机械转成一堆 ref。先设计状态所有权和 API 形状。

### computed 的缓存和脏标记

computed 本质上是带缓存的响应式派生：依赖没变化时多次读取复用结果；依赖触发后先标记 dirty，下次读取再求值。getter 应保持无副作用，否则求值时机变化会让行为难以预测。

### watch 的来源与 flush 时机

watch source 可以是 ref、reactive object、getter 或数组。默认回调在父组件更新后、当前组件 DOM 更新前附近执行；根据需求可选 `flush:'post'` 读取已更新 DOM，或极少数场景使用 sync。

同步多次修改会被批处理。`flush:'sync'` 会失去批处理保护，对数组循环修改尤其危险。使用前必须说明为何不能等待队列。

## 进阶层三：调度队列与 nextTick

状态变更通常不会每次立即 patch DOM，而是把更新任务去重后放到当前 tick 的队列。这样多次同步更新可以合并。

```ts
count.value++
count.value++
console.log(element.textContent) // 可能仍是旧 DOM
await nextTick()
console.log(element.textContent) // 本轮 Vue DOM 更新已提交
```

`nextTick` 只等待 Vue 当前批次更新，不保证图片加载、网络完成或浏览器一定已绘制到屏幕。需要测绘制时机时结合 requestAnimationFrame 和 Performance，而不是叠加多个 nextTick。

## 进阶层四：组件实例、渲染与 patch

首次挂载：

```text
创建组件实例
  -> setup 建立状态和依赖
  -> render 读取响应式值
  -> 生成 vnode 子树
  -> mount 真实 DOM
  -> mounted hooks（挂载完成钩子）
```

更新：

```text
响应式 trigger
  -> scheduler 去重
  -> 重新运行组件 render effect
  -> 新旧 vnode patch
  -> 更新必要 DOM
  -> updated hooks（更新完成钩子）
```

组件边界不是越细越好。每个组件实例、响应式依赖和更新都有成本；超大组件又难复用、测试和局部更新。按业务职责、状态所有权和稳定接口拆分。

### key 与身份

列表 diff 使用 key 识别同一业务实体。索引 key 在插入、排序、过滤时会把旧组件状态错误复用给另一个事件。

```vue
<IncidentRow
  v-for="incident in incidents"
  :key="incident.id"
  :incident="incident"
/>
```

key 必须在兄弟范围稳定且唯一，不要每次 render 生成随机值；随机 key 会强制卸载和重建，丢失输入、焦点和缓存。

## 进阶层五：props、emits、slots 与 v-model 契约

`props down, events up` 是默认数据流：父组件拥有状态，通过 props 传入；子组件通过 emit 描述发生了什么，而不是偷偷修改父状态。

```vue
<script setup lang="ts">
const props = defineProps<{ incident: Incident; busy: boolean }>()
const emit = defineEmits<{
  acknowledge: [id: string]
  retry: []
}>()
</script>
```

props 在子组件侧是只读的，但对象内部仍可能被间接修改。关键领域对象可用 readonly 类型、不可变更新和组件 API 约束。

slot 让父组件提供结构，子组件控制布局位置；scoped slot 会把数据暴露给父模板。slot contract 也要版本化，避免组件库升级后静默破坏。

`v-model` 是 prop + update event 的语法协议。自定义组件要明确值、事件和修饰符，不把复杂副作用塞进 setter。

## 进阶层六：生命周期、Effect Scope 与资源所有权

组件生命周期不只是 mounted/unmounted。setup 在实例创建期执行；渲染 effect 和 watcher 归属某个 effect scope；卸载时同步创建且归属组件的 effect 会停止。

但这些资源需要显式清理：

- window/document 事件监听。
- setInterval、外部计时器。
- WebSocket/SSE/第三方订阅。
- Fetch 请求和 Worker。
- 手工创建且脱离组件 scope 的 watcher。

```ts
watch(query, async (value, _old, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort('superseded'))
  try {
    const result = await search(value, controller.signal)
    if (!controller.signal.aborted) incidents.value = result
  } catch (error) {
    if (!controller.signal.aborted) console.error('查询失败，请记录脱敏错误类型')
  }
})
```

cleanup 在下一次 watcher 执行或停止前运行。取消客户端等待不保证服务端写入回滚。

## 进阶层七：状态管理与服务端状态

不是所有共享值都需要 Pinia。判断顺序：

1. 只在一个组件使用：local ref。
2. 父子共享：props/emits 或受控 v-model。
3. 一棵子树共享稳定依赖：provide/inject。
4. 多路由、跨域业务状态且需要 DevTools/插件：Pinia。
5. 服务端数据缓存：明确新鲜度、失效、重试和权限，不要与纯客户端状态混为一谈。

store 中也要避免存派生重复数据和浏览器不可序列化对象。SSR 时每个请求创建独立 store，不能共享模块级单例状态。

### Pinia action 的一致性

action 可以封装业务动作，但不能让客户端成为权威事务。确认事件仍需服务端授权、幂等和审计。前端 optimistic update 必须定义失败回滚、并发修改和刷新后的权威同步。

## 进阶层八：Router 完整导航链路

```text
用户点击 router-link / 调用 push
  -> 解析目标 location
  -> 匹配 route records
  -> 运行离开/全局/路由/组件守卫
  -> 异步组件与数据准备
  -> 确认导航
  -> 更新 currentRoute
  -> 渲染 RouterView
  -> afterEach / 可观测记录
```

守卫适合导航规则，不适合承担所有数据获取。权限不能只在前端守卫；用户可以直接请求 API。路由失败要区分取消、重定向、重复导航、懒加载 chunk 失败和服务端深链 404。

滚动行为、焦点移动和页面标题也属于导航完成。无障碍用户切路由后若焦点仍停在已消失按钮，会迷失上下文。

## 进阶层九：错误边界、Suspense 与异步组件

Vue 可用 `errorCaptured` 或 `app.config.errorHandler` 收集渲染、事件、生命周期等错误，但错误分类和恢复 UI 仍需设计。局部错误边界应显示可操作降级，不要让整个控制台白屏。

异步组件支持加载与错误组件、延迟和超时。动态 import 的 chunk 404 常来自旧 HTML/新资源错配、CDN 缓存或 base path。重试前先识别 release，避免无限刷新。

`Suspense` 可协调异步依赖的 fallback，但需要理解当前 Vue/框架支持边界，不应把所有请求都包进一个全页 fallback。局部内容允许部分成功时要保留已加载区域。

## 进阶层十：SSR、hydration 与跨请求隔离

SSR 完整路径：

```text
HTTP request（网络请求）
  -> 每请求创建 app/router/store
  -> router 跳到目标
  -> 获取授权后的数据
  -> renderToString（将组件渲染成字符串的服务端接口）
  -> 安全序列化初始状态
  -> HTML 返回
  -> 浏览器加载客户端 bundle
  -> hydrate 复用已有 DOM
```

高风险点：

- 模块级 store 让 A 用户状态泄露给 B 用户。
- 初始状态序列化未转义形成 XSS。
- 服务端和客户端时区、随机数、窗口尺寸不同。
- 无效 HTML 被浏览器修正。
- 只在客户端判断权限造成敏感 HTML 已发送。

hydration warning 是状态/标记不一致证据，不要全局 suppress。对确实只在客户端存在的内容，使用框架提供的客户端边界并给稳定占位。

## 进阶层十一：性能证据与优化顺序

先建立性能预算：首屏 JS、LCP、INP、路由切换、列表规模、组件更新时间和内存。再用构建分析、浏览器 Performance 与 Vue DevTools 找瓶颈。

常见优化按收益验证：

1. 路由级动态 import，减少首屏无关代码。
2. 稳定 props，避免父层每次创建无意义新对象。
3. 大型只读对象使用 shallowRef/markRaw 等减少深追踪，但明确更新协议。
4. 列表分页/虚拟化；验证键盘与读屏。
5. `v-once`/`v-memo` 只用于有证据的稳定子树。
6. 避免深度 watcher 扫描巨大对象。
7. 控制第三方组件、图表和 polyfill 体积。

优化不能改变业务状态语义。性能很好但显示旧租户数据是更严重的事故。

## 进阶层十二：生产架构与微前端边界

大型 Vue 控制台可按领域模块组织：

```text
app shell（应用外壳）
  -> identity/tenant context（身份与租户上下文）
  -> router（路由器）
  -> shared design system（共享设计系统）
  -> incident domain（事件业务域）
  -> topology domain（拓扑业务域）
  -> automation domain（自动化业务域）
  -> API client + runtime schemas（接口客户端与运行时结构校验）
  -> observability adapter（可观测适配器）
```

微前端只有在独立团队、独立发布和组织边界足够强时才可能值得。它会增加运行时隔离、共享依赖、路由、样式、认证、可观测和版本协调成本。模块化单体常是更好的第一步。

## 进阶故障实验：响应式、路由、SSR 与性能

### 故障一：深度 watch 引发卡顿

1. 创建一万条嵌套事件，对整个对象设置 deep watch。
2. 每次输入触发小改动，记录 watcher 与组件更新时间。
3. 改为监听必要字段、规范化状态或 shallow 边界。
4. 对比同一设备和数据下的 profile。

### 故障二：列表索引 key 造成草稿错位

1. 每行有本地草稿输入，使用数组索引作 key。
2. 排序列表，观察草稿跟到错误事件。
3. 改为 incident.id 并加入排序回归测试。
4. 记录组件身份与业务身份为何必须一致。

### 故障三：懒加载 chunk 发布后 404

1. 构建 v1 并保留旧页面，再构建 v2 删除旧 chunk。
2. 让旧标签页导航到尚未加载的路由，记录 404 和 release。
3. 发布时保留一段时间旧哈希资源，或提供受控刷新/回滚策略。
4. 验证错误 UI 不会无限 reload 且草稿得到保护。

### 故障四：SSR 跨请求状态污染

1. 本地 SSR 实验故意复用模块级 store。
2. 用两个合成租户并发请求，记录串数据。
3. 改为每请求创建 app/router/store，加入并发隔离测试。
4. 清理所有输出，不保留真实身份或数据。

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

## 老师带你从一张事件卡片看懂 Vue

我们先做两件事：把事件显示出来，点击按钮后改变状态。原生 JavaScript 可以自己找 DOM、改文本、切 class；组件变多时，你要记住许多“状态改变后还要改哪里”。Vue 让你先声明状态对应的页面，框架负责追踪依赖和提交更新。

学生问：“是不是 Vue 每次把整个页面重画？”不是。模板编译与运行时会定位动态部分并复用节点，最终只做必要的 DOM 操作；浏览器还要完成自己的样式、布局和绘制。组件 render 重新执行，不等于每个 DOM 都被删除重建，更不等于每个像素都重新绘制。

### 响应式像登记读者：读了才知道通知谁

你可以把每个响应式字段看成一本会登记借阅人的资料。当 computed 或渲染过程读取它，Vue 记住依赖；字段变化时，相关计算收到更新通知。这是帮助理解的模型，真实实现细节随版本演进，稳定理解应放在读取追踪、写入触发与调度上。[深入响应式](https://vuejs.org/guide/extras/reactivity-in-depth.html)

`const snapshot = state.count` 相当于抄下当时一个数字，以后修改原字段不会让这张纸自动变化。`toRef(state, 'count')` 则保留访问原属性的联系。注意这里讨论普通 reactive 对象属性；Vue 某些编译器宏有专门的响应式解构转换，不能把一个场景的限制套到所有语法上。

### 可运行的解构故障实验

使用本文已经创建的 Vue 项目，先备份 App.vue，再把组件内容替换成下例。运行项目 dev 脚本，在本机页面操作；不连接真实告警 API。

```vue
<script setup>
import { reactive, toRef } from 'vue'
const state = reactive({ count: 0 })
const snapshot = state.count
const linked = toRef(state, 'count')
</script>

<template>
  <main>
    <h1>响应连接实验</h1>
    <button @click="state.count++">增加一次</button>
    <p>原对象：{{ state.count }}</p>
    <p>普通快照：{{ snapshot }}</p>
    <p>保持连接：{{ linked }}</p>
  </main>
</template>
```

初始三项都是 0。点击三次后，预期原对象和保持连接都为 3，普通快照仍为 0。这里“故障”不是 Vue 不更新，而是程序主动选择了快照。修复业务代码时保留 state 属性访问或 toRef；不要靠刷新页面获取新快照。

用 DevTools 同时观察 state 与 DOM，把数据变化和视图变化对上。若点击无效，先看控制台与脚本 import；若三个数都变化，核对是否误把 snapshot 也写成 ref。实验结束恢复备份 App.vue，运行类型检查和构建，再停止 dev 服务；保留截图和原因说明。

### computed 与 watch：计算结果和做事要分开

过滤事件、统计严重数量是从现有状态推导的新值，适合 computed。发 HTTP 请求、同步订阅或把状态保存到外部系统是副作用，适合有明确触发源和清理逻辑的 watch。把过滤结果通过 watch 再写到另一个 ref，就多出第二份需要保持一致的状态。

watch 的异步回调尤其需要失效判断。底层请求若不支持 AbortSignal，controller.abort 只是改变信号，并不会让你的自定义 Promise 消失；返回后检查失效标记或请求编号才能避免旧结果覆盖。清理要在合适时机注册，细节见[watchers 官方说明](https://vuejs.org/guide/essentials/watchers.html)。

### 组件边界里的“谁说了算”

事件行展示 props，点击后 emit 事件意图，父层或领域逻辑决定发送请求并接收权威状态。这个方向让数据来源容易找。若子组件直接修改传入对象的深层属性，技术上可能生效，却让父层难以知道变化是谁发起的，也让取消编辑和失败恢复更难。

`v-model` 提供双向绑定协议，不等于任意共享可变对象。把草稿与服务端已保存值分开，用户取消时丢弃草稿，保存成功后才更新权威视图。高级状态管理工具不会自动替你定义这些业务含义。

### 从开发调试到生产面试

问“为什么切路由越多请求越多”，先数订阅与监听，核对组件有没有真正卸载、是否被 KeepAlive 缓存、资源是否在停用阶段仍该暂停。`onUnmounted` 适合销毁清理；缓存组件的激活与停用可能需要对应生命周期策略。先画组件生命周期，再决定关闭哪类资源。

问“Vue 怎么支持高可用”，要回答前端静态资源/CDN、SSR 进程与后端 API 各自的可用性。Vue 本身不是跨服务器复制系统；页面可降级展示已有数据并标记新鲜度，写操作仍依赖服务端状态和审计。SSR 多实例必须按请求隔离用户数据，缓存也要包含身份语义。

最后把一个完整讲述练熟：状态由谁拥有，谁读取依赖，何时触发更新，旧异步工作怎样失效，DOM 何时可观察，失败怎样恢复。你能沿这条链解释自己的事件看板，就从“会拼组件”走到了“能分析运行机制”。

## Vue 项目答辩课堂：从一个组件走到可维护的系统

### watchEffect 为什么可能漏掉 await 后的依赖

先把依赖跟踪想成老师在同步讲课时记录谁举过手：同步执行阶段读到的响应式值，才有机会被这一轮自动跟踪。异步函数遇到第一个 `await` 后，后面的读取不属于同一段同步依赖收集。如果你只在等待结束后读取租户，租户变化未必按你想的方式重新执行。

因此重要查询条件适合用 `watch` 明确列出来源，例如租户、时间范围和筛选项；或者在等待之前读取所需依赖并保存本次快照。不要为了方便把整个巨大状态对象都深度监听，那会增加遍历成本，也使触发原因难以理解。观察时记录来源的新旧值与请求标识，区分“没有跟踪到”与“触发了但旧结果覆盖”。[Vue 侦听器说明](https://vuejs.org/guide/essentials/watchers.html)

`deep` 不会自动给你一个修改前的深拷贝。嵌套对象原地变化时，新旧参数可能仍指向同一个对象。要审计具体修改，可以在业务动作入口记录字段差异、使用不可变快照，或单独监听真正关心的字段。把一个共享对象引用保存到日志数组里，随后它继续变化，回头看历史记录可能全部像最终值。

### nextTick 等待的是 Vue 更新，不是世界全部就绪

当你给 `ref` 赋新值，JavaScript 中的状态已改变，但 DOM 更新可能还在批处理队列里。`nextTick` 用于等待相关 DOM 更新完成，适合之后测量元素或聚焦新出现的输入框。它不保证图片已经下载、字体已加载、网络请求已完成，也不意味着浏览器已经完成最终绘制。

例如展开图表面板后计算尺寸，应先等 Vue 放入节点，再使用图表库要求的更新流程；图表依赖容器尺寸变化时，可借助适当的尺寸观察机制。不要反复加多个 nextTick 和固定延迟直到“看起来好了”，那只是在猜执行时序。把需要等待的具体条件说出来，才能找到正确的 API 和失败时限。

### 本地草稿、全局身份、服务端数据不能混成一团

组件里的编辑草稿属于当前交互，切换事件时要决定保存、提示还是丢弃；登录身份与租户上下文属于全局会话；告警状态属于服务端权威数据，需要刷新与版本控制。把三者都放进一个全局 store，可能让不同页面互相污染；全部放本地，又会造成多个组件重复请求与状态不一致。

老师会先画所有权，而不是先选状态库：谁创建、谁更新、谁负责清理、何时失效。一个 composable 每次调用可创建独立状态，也可能返回模块级共享状态；使用者必须看实现契约，不能仅凭函数以 `use` 开头就判断其生命周期。服务端渲染中尤其不能把用户数据放进跨请求共享的可变单例。

异步 action 也不会天然按发起顺序提交结果。切租户后，旧租户的请求晚到，若直接写共享 store 就可能串数据。用租户与条件构成查询身份，切换时失效旧请求，提交结果前再次核对当前身份；服务端还要独立授权。前端防止误显示，后端防止越权读取，两层职责不能互相替代。

### computed 应该像计算题，不像操作按钮

computed 适合从已有状态求值，例如按级别筛选事件、计算可见数量。它的缓存依据依赖而不是“这个函数运行很贵”的主观判断。不要在 getter 里提交工单、修改源数组或发请求，因为读取计算值的时机由渲染和依赖决定，不是一个明确获准执行副作用的用户动作。

如果排序时调用原数组的原地 `sort`，可能在计算过程中改变共享状态，导致其他消费者看到不同顺序。根据数据模型使用副本排序或适合环境的非修改方法，并保持身份稳定。渲染优化可以减少不必要更新，却不能修复业务数据被原地改写的问题。

### 组件库与业务组件的边界怎么设计

通用按钮负责外观、禁用、焦点和触发事件，不应直接知道哪个生产服务可以重启；业务处置组件负责目标、权限提示和审批状态；API 层负责协议、错误和关联标识。这样样式升级不会顺带改变发布权限，接口演进也不要求所有按钮改实现。

`v-model` 方便双向协作，但本质仍是值与更新事件的契约。输入组件可以发送用户的新值，父层决定如何保存与验证；子组件悄悄修改嵌套 prop，会绕过这条数据路径。故障时应沿事件记录检查“子组件是否发出、父组件是否接收、权威状态是否更新、渲染是否读取正确对象”，而不是立即给所有对象加深度监听。

### 一道实际面试追问：路由离开后请求数仍增长

先复现固定次数的进入与离开，统计每轮活跃请求、定时器和订阅数量。检查组件是卸载还是被 KeepAlive 暂存；被暂存不意味着业务资源自动停止。再查 watcher 创建时机、全局事件、定时器和外部订阅的所有者。如果只是旧请求完成后的响应，不等于持续泄漏；如果每进入一次多一个周期性请求，才更像重复建立未清理的资源。

修复后重复原操作，证明资源数量回到稳定基线，并验证返回页面后能正确恢复订阅。把初始、峰值、离开后与再次进入的数据放进证据，配上实际版本和提交；不要只说“加了 onUnmounted，所以好了”。能把生命周期、响应式依赖和网络状态串起来，你就具备了分析真实 Vue 控制台故障的能力。

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
