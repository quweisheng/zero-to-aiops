# JavaScript 技术栈深讲

> 学习目标：从零理解 JavaScript 的值、作用域、对象、函数、模块、异常和异步模型；能在浏览器与 Node.js 中运行代码，能读懂事件循环、Promise 和网络请求；能编写可测试、可观测、可取消的 AIOps 页面逻辑，并能排查闭包、类型转换、阻塞、竞态、内存和供应链问题。

## 官方资料

- [ECMA-262：ECMAScript Language Specification](https://tc39.es/ecma262/)
- [TC39：ECMAScript 提案流程](https://tc39.es/process-document/)
- [MDN：JavaScript 指南](https://developer.mozilla.org/docs/Web/JavaScript/Guide)
- [MDN：JavaScript 参考](https://developer.mozilla.org/docs/Web/JavaScript/Reference)
- [MDN：事件循环](https://developer.mozilla.org/docs/Web/JavaScript/Event_loop)
- [MDN：JavaScript 模块](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules)
- [Node.js 官方学习文档](https://nodejs.org/en/learn)

JavaScript 是语言的常用名称，ECMAScript 是 ECMA-262 定义的标准。浏览器的 DOM、Fetch、定时器不是 ECMAScript 语言本身；它们是宿主环境提供的 Web API。Node.js 又提供另一组文件、进程和网络 API。

## 官方知识地图与边界

```text
ECMAScript language（语言标准）
  -> values（值）/ types（类型）/ coercion（类型转换）/ equality（相等规则）
  -> scope（作用域）/ declaration（声明）/ closure（闭包）
  -> object（对象）/ prototype（原型）/ class（类语法）
  -> function（函数）/ this（调用接收者）/ iteration（迭代）
  -> exception（异常）/ module（模块）/ Promise（异步结果）

host environment（宿主环境）
  -> browser（浏览器）: DOM（文档对象）/ events（事件）/ fetch（请求）/ storage（存储）/ workers（后台工作线程）
  -> Node.js: process（进程）/ file（文件）/ server（服务）/ streams（流式数据）

production engineering（生产工程）
  -> package（依赖包）/ build（构建）/ test（测试）/ observability（可观测性）/ security（安全）/ rollout（渐进发布）
```

本文覆盖现代 JavaScript 共同基础和浏览器主线，不逐项讲完整 DOM 或 Node API，也不把 Babel、Vite、React 等工具等同于语言。

## 学习顺序

```text
值与类型 -> 变量和作用域 -> 函数/对象/原型 -> 模块
  -> 事件与异步 -> 错误和测试 -> 性能/安全 -> 两级实验
```

## 场景开场

事件列表输入 `database` 后，旧的慢请求晚于新请求返回，页面突然又显示旧结果；连续点三次“确认”产生三条记录；关闭页面后定时器还在运行。Console 没有明显红字，但系统行为已经错了。

学 JavaScript 不能停在“会写点击事件”。你必须理解状态由谁拥有、异步结果何时有效、失败怎样传播、任务怎样取消。

## 一句话人话版

JavaScript 是一门动态类型、基于原型、支持函数作为值的编程语言；浏览器用它响应事件、更新 DOM，并通过宿主 API 与网络和设备交互。

## 小白先问

### JavaScript 和 Java 有关系吗

不是同一种语言。JavaScript 常运行在浏览器或 Node.js，Java 通常编译为 JVM 字节码；类型、对象模型、并发和生态不同。

### 动态类型是不是没有类型

不是。值始终有运行时类型，只是变量声明通常不固定为一种类型。类型错误可能到运行时才暴露，TypeScript 可以在开发期增加静态检查。

### 单线程为什么还能同时请求多个接口

JavaScript 代码通常在一个事件循环线程执行，但浏览器/Node 可以在宿主层处理网络、计时和 I/O；完成后把回调任务放回队列。它是并发，不等于所有 JavaScript 代码并行。

### `async` 会自动变快吗

不会。它让等待 Promise 的代码更易组织，不会把 CPU 密集循环变成并行，也不会自动处理超时、取消、重试和竞态。

## 值、类型与相等

JavaScript 原始类型包括 `undefined`、`null`、boolean、number、bigint、string、symbol；对象是引用值，函数也是可调用对象。

```js
const incident = { id: 'INC-1024', severity: 'critical' }
const alias = incident
alias.severity = 'warning'
console.log(incident.severity) // warning：两个变量指向同一对象
```

### 类型系统五件套

- **是什么**：每个运行时值都有类型，运算可能触发显式或隐式转换。
- **为什么需要**：运算、比较、序列化和分支都依赖类型语义。
- **怎么工作**：例如 `+` 同时承担数值相加和字符串连接，操作数会按规范转换。
- **怎么看/怎么用**：`typeof`、`Array.isArray`、`Object.prototype.toString` 和输入边界校验各有用途。
- **坏了怎么查**：保留原始输入与类型，避免仅凭显示文本猜；API 边界先验证 Schema。

优先使用严格相等 `===`，因为 `==` 会进行类型转换；但 `NaN !== NaN`，判断 `NaN` 用 `Number.isNaN`。金额不能直接依赖二进制浮点精确表示，按业务选择整数最小单位或专用十进制方案。

## 变量、作用域和闭包

`const` 禁止重新绑定变量名，不代表对象深度不可变；`let` 用于确实需要重新赋值。避免新代码使用函数作用域且存在提升混淆的 `var`。

```js
function createIncidentFilter(tenantId) {
  return (incident) => incident.tenantId === tenantId
}

const onlyTenantA = createIncidentFilter('tenant-a')
```

闭包是函数与其创建时词法环境的组合。它让内部函数继续访问 `tenantId`，常用于封装和回调；也可能让大型对象、DOM 节点或密钥上下文长期被引用。

坏了怎么查：用 Memory heap snapshot 看 retaining path（保留路径），检查事件监听、定时器、缓存和闭包是否在组件销毁后仍引用对象。

## 对象、原型与 class

对象属性查找会沿原型链向上。`class` 提供更清晰语法，但底层仍建立在原型机制上。

```js
class IncidentStore {
  #items = new Map()

  add(incident) {
    if (!incident?.id) throw new TypeError('incident.id is required')
    this.#items.set(incident.id, structuredClone(incident))
  }

  get(id) {
    return this.#items.get(id)
  }
}
```

`this` 由调用方式决定，不是由函数写在哪里单独决定。把方法直接作为回调传递可能丢失接收者；箭头函数没有自己的 `this`。排查时打印调用点和接收者，不要只盯 class 定义。

## 函数、纯函数与状态所有权

函数是一等值，可以传参、返回和存入对象。AIOps 规则尽量把“计算”写成纯函数，把网络、时间、存储等副作用放在边界：

```js
export function classifyLatency(p95Ms, thresholdMs) {
  if (!Number.isFinite(p95Ms) || p95Ms < 0 || !Number.isFinite(thresholdMs) || thresholdMs <= 0) {
    throw new RangeError('invalid latency input')
  }
  return p95Ms >= thresholdMs ? 'critical' : 'normal'
}
```

纯函数同样输入得到同样输出，更容易测试和重放。真实系统仍需要副作用，关键是明确谁触发、是否幂等、失败如何恢复，而不是追求“所有代码纯函数”。

## 模块与依赖图

```js
// classifier.js
export function classify(value) { return value > 1000 ? 'slow' : 'ok' }

// main.js
import { classify } from './classifier.js'
console.log(classify(1200))
```

浏览器使用 `<script type="module" src="main.js"></script>`。模块默认严格模式、有独立作用域，静态 `import` 让工具分析依赖图。模块 URL、MIME type、CORS 和本地 `file://` 限制都可能导致加载失败，因此实验应通过 HTTP 服务打开。

## 事件循环：异步代码真正怎样排队

```text
call stack runs one job（调用栈执行当前工作）
  -> host handles timer/network/event（宿主处理计时、网络和事件）
  -> Promise reactions enter microtask queue（异步结果反应排入微任务）
  -> current stack ends（当前调用栈结束）
  -> drain microtasks（处理微任务检查点）
  -> browser may render（浏览器可能进行渲染）
  -> take next task（选取后续任务）
```

```js
console.log('A')
setTimeout(() => console.log('D'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('B')
// A, B, C, D
```

Promise 回调进入 microtask（微任务）；定时器回调通常是 task。不断产生微任务也会饿死渲染和后续任务。事件循环不是“每个异步函数一条线程”。

### 异步五件套

- **是什么**：把未来完成或失败的结果表示为 Promise，由事件循环调度后续反应。
- **为什么需要**：网络和 I/O 等待时不应阻塞页面主线程。
- **怎么工作**：Promise 有 pending/fulfilled/rejected 状态；状态落定后不再改变。
- **怎么看/怎么用**：Network 看请求时序，Performance 看长任务，Sources 异步调用栈定位来源。
- **坏了怎么查**：确认 Promise 是否被返回/await、rejection 是否处理、旧结果是否仍有资格更新当前状态。

## 超时、取消、竞态和有限重试

```js
let currentController

async function loadIncidents(query) {
  currentController?.abort('superseded')
  const controller = new AbortController()
  currentController = controller

  const timeoutId = setTimeout(() => controller.abort('timeout'), 5000)
  try {
    const response = await fetch(`/api/incidents?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json()
    if (controller !== currentController) return
    return payload
  } finally {
    clearTimeout(timeoutId)
  }
}
```

取消客户端等待不保证服务端事务自动撤销。写操作重试前必须分析幂等键、超时后的未知结果和服务端去重，不能把所有错误统一重试三次。

## 错误处理与可观测性

```js
try {
  await acknowledgeIncident(id)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  logger.error('incident_ack_failed', { incidentId: id, message, traceId })
  showRecoverableError('确认失败，请使用追踪号联系值班人员', traceId)
}
```

- 只在能补充上下文、恢复或转换错误的层捕获。
- 不把 Token、完整请求体和敏感告警内容写进前端日志。
- 用户错误、权限、网络、服务端失败和取消要分开呈现。
- `window.onerror` 和 `unhandledrejection` 是最后观测网，不是业务错误处理方案。
- Source Map 能还原压缩调用栈，但生产分发要控制访问，防止无意暴露源码或秘密。

## 内存、主线程和性能

JavaScript 垃圾回收只能回收不可达对象。全局集合、未解绑监听、未清定时器、缓存无上限、闭包和脱离 DOM 的节点都会延长生命周期。

CPU 密集规则、巨大 JSON 解析和一次渲染万条 DOM 会产生 long task（长任务），让输入和绘制卡顿。可采用分片、分页/虚拟化、Web Worker、后端聚合；优化前先用 Performance/Memory 证明瓶颈。

## 安全与供应链

- 外部输入默认不可信，展示文本用 `textContent`；不要把字符串交给 `eval`、`Function` 或不受控 `innerHTML`。
- Token 存储和 Cookie 方案要结合 XSS、CSRF、同源、SameSite、CSP 与业务威胁模型，不存在一个适合所有系统的“最安全位置”。
- 依赖要锁定、审计、生成 SBOM（软件物料清单）并缩小权限；安装脚本本身也可能执行代码。
- 浏览器里的前端代码和环境变量都可被用户查看，不能存放服务端秘密。
- 危险操作的授权、租户边界和参数校验必须在服务端重新执行。

## 进阶层一：执行上下文、词法环境与调用栈

JavaScript 执行一段代码时，会为全局、模块或函数建立 execution context（执行上下文）。上下文里至少要理解三件事：当前代码、变量/函数怎样解析、`this` 如何确定。

```text
调用函数
  -> 创建执行上下文
  -> 建立词法环境并连接外层环境
  -> 压入 call stack
  -> 执行语句
  -> 返回或抛错
  -> 弹出调用栈
```

词法作用域由源码位置决定，不由“从哪里调用”决定。闭包是函数和它创建时可访问的词法环境组合，因此回调在外层函数结束后仍能读取那些绑定。

```js
function createIncidentCounter() {
  let count = 0
  return () => ++count
}

const next = createIncidentCounter()
console.log(next()) // 1
console.log(next()) // 2
```

这里的 `count` 被返回函数保持可达。闭包不是内存泄漏；只有当闭包长期持有不再需要的大对象、DOM 节点或缓存，且入口仍可达时才形成问题。

### hoisting 到底是什么

“变量提升”是便于理解的说法，准确心智模型是：进入作用域时先创建绑定，再按规则初始化。

- 函数声明在执行前已有可调用绑定。
- `var` 绑定初始化为 `undefined`，作用域是函数/全局。
- `let`、`const` 绑定已创建但在声明执行前未初始化，处于 temporal dead zone（暂时性死区）。
- `class` 也有声明前不可访问的边界。

不要为了利用提升打乱代码顺序；生产代码应让定义和依赖关系容易阅读。

### this 的四类来源

`this` 不是函数定义处的外层变量。普通函数的 `this` 由调用形式决定：方法调用、显式 `call/apply/bind`、构造调用、普通调用。箭头函数没有自己的 `this`，它捕获外层词法 `this`。

把对象方法直接传给事件或定时器可能丢失接收者：

```js
const board = {
  name: 'incident-board',
  report() { console.log(this.name) }
}

setTimeout(board.report, 0) // this 不再是 board
setTimeout(() => board.report(), 0) // 明确保留调用形式
```

排查时看实际调用点，而不是只看函数定义。

## 进阶层二：值、对象身份与属性模型

原始值按值比较，对象按身份比较：

```js
({}) === ({}) // false，两次创建的是不同对象；括号避免被解释成语句块
const a = {}
const b = a
a === b // true，指向同一个对象
```

浅拷贝只复制第一层属性。展开运算符不会递归复制嵌套对象，也不会自动保留所有属性描述符、原型和内部槽。状态更新中误以为“展开就是深拷贝”，会让旧状态和新状态继续共享嵌套对象。

### property descriptor

对象属性不仅有值，还有 writable、enumerable、configurable，或 getter/setter：

```js
const incident = {}
Object.defineProperty(incident, 'id', {
  value: 'INC-1024',
  writable: false,
  enumerable: true,
  configurable: false
})
```

`Object.freeze()` 也是浅层的；它不能让嵌套对象深度不可变。Proxy、Vue 响应式和许多框架能力都建立在对象操作拦截之上，但 Proxy 也不能拦截所有语言内部槽行为。

### prototype chain 与 class

读取 `obj.key` 时，若对象自身没有该属性，会沿 prototype chain（原型链）查找。`class` 提供更熟悉的语法，但方法通常仍放在原型上。

```text
instance own properties（实例自身属性）
  -> Constructor.prototype（构造函数的原型对象）
  -> Object.prototype（普通对象原型链末端对象）
  -> null（原型链终点）
```

原型污染是安全风险：不可信键被递归合并到 `__proto__`、`constructor.prototype` 等位置时，可能改变许多对象的属性查找结果。边界处使用安全解析、键白名单、无原型字典或维护良好的合并库。

## 进阶层三：类型转换与相等为什么容易出事故

`===` 不执行常见的隐式类型转换，通常比 `==` 更容易推理。仍要理解这些边界：

- `NaN !== NaN`，用 `Number.isNaN` 判断。
- `Object.is(NaN, NaN)` 为 true，`Object.is(0, -0)` 为 false。
- `''`、`0`、`-0`、`0n`、`NaN`、`null`、`undefined`、`false` 是常见 falsy 值。
- `[]`、`{}`、字符串 `'0'` 都是 truthy。
- `??` 只对 null/undefined 回退，`||` 对所有 falsy 回退。

AIOps 阈值 `0` 是有效值，不能用 `value || defaultValue` 把它误判为缺失。对 URL、表单和 JSON 的字符串数字要显式解析并验证有限范围。

## 进阶层四：Promise 是状态机，不是线程

Promise 有 pending、fulfilled、rejected 三种状态；settled 后不能再次改变。`then` 返回新的 Promise，使错误和值沿链传播。

```text
pending（尚未完成）
  ├─ fulfilled(value)（成功，得到值）
  └─ rejected(reason)（失败，得到原因）
```

Promise executor 在创建 Promise 时同步执行；`then/catch/finally` 的反应作为 microtask（微任务）调度。

```js
console.log('A')
Promise.resolve().then(() => console.log('C'))
console.log('B')
// A B C
```

`async function` 总是返回 Promise。`await` 暂停当前 async 函数后续部分，不阻塞整个线程；await 的值完成后，继续执行也通过微任务恢复。

### 错误传播的常见断链

```js
async function load() {
  fetch('/api/incidents') // 忘记 return/await，外层无法等待或捕获
}
```

如果异步工作属于当前操作，明确 `return` 或 `await`。如果确实是 fire-and-forget，仍要有错误处理、取消、容量上限和生命周期所有者，不要用 `void` 掩盖无人负责的失败。

### Promise 并发工具的取舍

| API | 完成语义 | 适合 | 风险 |
|---|---|---|---|
| `Promise.all` | 任一拒绝就整体拒绝 | 所有结果缺一不可 | 不会自动取消剩余工作 |
| `Promise.allSettled` | 等全部结束并返回每项状态 | 面板允许部分失败 | 容易忽略失败比例 |
| `Promise.race` | 第一个 settled 决定 | 超时包装等 | 败者仍可能继续执行 |
| `Promise.any` | 第一个 fulfilled 决定 | 多副本择一成功 | 全失败得到 AggregateError |

真正的并发上限需要队列或 semaphore，不能对十万项直接 `Promise.all`。

## 进阶层五：事件循环、渲染与饥饿

浏览器主线程大致循环处理 task，清空 microtask，再获得渲染机会：

```text
取一个 task（点击、timer、网络回调等）
  -> 执行到调用栈清空
  -> 清空 microtask checkpoint
  -> 可能进行 style/layout/paint
  -> 进入下一轮
```

具体调度由 HTML 标准和浏览器实现共同决定，不能把它简化为固定两条队列。`setTimeout(fn, 0)` 也不是立即执行，还受嵌套节流、后台页策略和前面任务影响。

### 微任务饥饿

微任务中不断追加微任务，浏览器可能迟迟得不到渲染机会：

```js
let remaining = 10000 // 有界教学样例，避免无限阻塞页面
function starve() {
  if (--remaining > 0) queueMicrotask(starve)
}
starve()
```

真实应用中的无限 Promise 链也可能产生类似效果。用 Performance 观察长时间无绘制、主线程调用栈和任务边界；修复为有界批次并主动让出调度机会。

### requestAnimationFrame 与 requestIdleCallback

`requestAnimationFrame` 适合在下一次绘制前更新动画状态，不是网络重试计时器。`requestIdleCallback` 只适合可延迟且有超时/降级的低优先任务，繁忙或后台环境可能很久不执行。

## 进阶层六：模块图、循环依赖与构建边界

ES modules 使用静态 import/export，浏览器或构建器可以先解析依赖图。静态结构有利于 tree shaking，但“导出了却没使用”不等于一定能删：模块副作用、动态访问和打包器配置都会影响结果。

```text
entry module（入口模块）
  -> parse dependencies（解析依赖）
  -> link bindings（连接绑定）
  -> evaluate modules（求值执行模块）
```

ESM 导入是 live binding，不是简单复制值。循环依赖可能在初始化顺序上暴露暂时不可用的绑定。解决方式通常是重划模块职责、提取稳定接口或反转依赖，而不是随机调整 import 顺序。

### ESM、CommonJS 与运行时

浏览器原生 ESM、Node ESM、CommonJS 和构建器模拟规则并不完全相同。排查“本地能跑、生产模块找不到”时核对：

1. `package.json` 的 `type` 与 exports/imports。
2. 文件扩展名和大小写。
3. tsconfig/bundler 的 module 与 moduleResolution。
4. 浏览器 base URL、MIME type、CORS。
5. 测试运行器是否替换了真实环境行为。

## 进阶层七：垃圾回收、弱引用与内存泄漏

现代引擎使用可达性判断并结合分代、增量等策略。开发者不能要求某个时刻一定回收，也不应把 `WeakRef` 当缓存万能方案。

常见保留链：

```text
window / module singleton（全局窗口或模块单例）
  -> event listener（事件监听器）
  -> callback closure（回调闭包）
  -> detached DOM / large incident array（已脱离文档的节点或大型事件数组）
```

排查步骤：

1. 复现稳定操作序列，记录 heap 基线。
2. 重复打开/关闭或切路由多次。
3. 强制 GC 仅作为实验辅助，比较 retained size。
4. 从意外对象沿 retaining path 找到根。
5. 修复监听、timer、订阅、缓存上限或生命周期所有权。
6. 再跑同一序列，不以单次内存波动下结论。

`WeakMap` 适合把元数据关联到对象且不独立阻止 key 回收，但它不可枚举，不能替代需要盘点和容量控制的业务缓存。

## 进阶层八：主线程容量与 Worker

浏览器 UI、DOM、许多脚本和输入事件共享主线程。CPU 密集的聚合、正则、压缩或巨大 JSON 解析会推迟交互。

Web Worker 在独立线程运行 JavaScript，不能直接操作 DOM；数据通过 structured clone 或 transferable object 传递。Worker 不是免费：启动、复制、消息协议、错误与版本都要治理。

适合移入 Worker：

- 大批量合成告警聚合与排序。
- 可分离的日志解析和文本处理。
- 不依赖 DOM 的模型推理或压缩。

不适合只为几十条数据增加 Worker 复杂度。先设性能预算并测量主线程 long task、INP、序列化成本和内存。

## 进阶层九：生产状态、一致性与副作用

前端状态至少分四类：

| 状态 | 示例 | 所有者建议 | 一致性风险 |
|---|---|---|---|
| server state | 事件列表、确认结果 | 数据请求层/缓存层 | 新鲜度、重复、乱序、权限 |
| URL state | 筛选、分页、事件 ID | 路由/URL | 刷新和分享不一致 |
| local UI state | 弹窗、展开项、草稿 | 最近组件/模块 | 无故全局化 |
| derived state | 按等级统计 | 从源状态计算 | 重复存储后互相矛盾 |

不要把所有状态塞进一个全局对象。每个副作用都要回答：由谁启动、怎样取消、结果仍有资格提交吗、失败谁处理、离开页面怎样清理。

## 进阶故障实验：事件循环、内存与竞态

### 故障一：微任务淹没渲染

1. 本地按钮启动一个有上限的 50 万次 Promise/queueMicrotask 链。
2. 同时记录输入响应与 CSS loading 动画；主线程工作受阻会推迟输入，已在合成线程运行的动画未必一起停止，不能单凭动画判断主线程健康。
3. 用 Performance 找到微任务链，不要只看 CPU 百分比。
4. 改为分批处理并在批次间让出任务；比较 INP/long task。

### 故障二：监听器泄漏

1. 每次打开事件详情都给 window 添加 resize listener，故意不移除。
2. 打开关闭 20 次，记录一次 resize 触发次数和 heap retaining path。
3. 保存 handler 引用并在关闭时 removeEventListener，或使用 AbortSignal 管理生命周期。
4. 重复相同步骤，确认触发次数不再增长。

### 故障三：旧请求覆盖新请求

1. 搜索 A 的响应延迟 1500ms，搜索 B 延迟 100ms。
2. 快速输入 A 再 B，记录 B 先显示后被 A 覆盖。
3. 修复为 AbortController + 单调 request version；只有当前请求可提交状态。
4. 验证取消、后端仍执行、组件卸载和异常路径。

### 故障四：重复写与未知结果

1. 合成“确认事件”接口在服务端已写入后故意延迟响应。
2. 客户端超时后再次点击，观察是否产生重复审计记录。
3. 加业务幂等键和结果查询；客户端按钮防重复只作为体验层。
4. 记录服务端唯一约束、两次请求 ID 和最终业务状态。

## 常用语法/API 字典

| 项 | 作用 | 预期/观察 | 常见坑 |
|---|---|---|---|
| `const` / `let` | 块级绑定 | 作用域可预测 | 误以为 const 深度不可变 |
| `?.` / `??` | 可选链、空值回退 | 只对 null/undefined 回退 | 用 `||` 错把 0 当缺失 |
| `map/filter/reduce` | 转换、筛选、聚合数组 | 返回新数组/值 | 在回调里混入难追踪副作用 |
| `Map` / `Set` | 键值与唯一集合 | 明确 size/迭代 | 把对象键隐式转字符串 |
| `structuredClone` | 结构化深复制支持类型 | 不共享可克隆对象 | 函数/DOM 等不可随意克隆 |
| `Promise.all` | 全部成功或一项拒绝 | 并发等待结果 | 误以为失败会取消其他任务 |
| `Promise.allSettled` | 收集每项状态 | 适合部分失败界面 | 忽略失败仍标整体成功 |
| `AbortController` | 传播取消信号 | fetch 抛取消错误 | 以为服务端写入也被撤销 |
| `performance.now` | 单调高精度时长 | 适合相对耗时 | 用本地时间比较跨机事件 |

## 基础实验：可取消的事件筛选器

若希望先看浏览器中的完整行为，运行仓库共享实验 [frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)：`cd examples/frontend-incident-lab`、`npm ci`，两个终端分别执行 `npm run api` 与 `npm run dev`。原生页面展示事件监听、DOM 安全更新、状态机、旧请求资格检查和页面离开清理；`npm test` 会验证 7 个正常/故障用例。

### 前置条件

需要现代 Node.js。保存为 `incident-filter.mjs`：

```js
import { readFile } from 'node:fs/promises'

function normalize(raw) {
  if (!Array.isArray(raw)) throw new TypeError('root must be an array')
  return raw.map((item) => {
    if (typeof item?.id !== 'string' || typeof item?.latencyMs !== 'number') {
      throw new TypeError('invalid incident')
    }
    return { id: item.id, latencyMs: item.latencyMs }
  })
}

const data = JSON.parse(await readFile(process.argv[2], 'utf8'))
const slow = normalize(data).filter((item) => item.latencyMs >= 1000)
console.log(JSON.stringify({ slowCount: slow.length, incidents: slow }, null, 2))
```

创建 `incidents.json`：

```json
[
  { "id": "INC-1", "latencyMs": 120 },
  { "id": "INC-2", "latencyMs": 1400 }
]
```

运行 `node incident-filter.mjs incidents.json`，预期 `slowCount` 为 1，且只返回 INC-2。再用 `node --check incident-filter.mjs` 做语法检查。

### 验证、清理和失败检查

- 退出码应为 0，标准输出应是合法 JSON。
- 若提示文件不存在，检查当前目录和参数。
- 若 JSON 解析失败，先用编辑器定位原始文件，不要吞掉错误。
- 若字段非法，确认数值没有被写成字符串。
- 实验只读输入；关闭终端并保留代码作为证据即可。

## 故障实验：制造事件循环阻塞和脏数据

### 注入故障

把 `incidents.json` 的 `latencyMs` 改成字符串，再在脚本开头临时加入：

```js
const started = performance.now()
while (performance.now() - started < 3000) {}
```

### 现象 -> 证据 -> 假设

字段故障应被边界校验拒绝，而不是静默比较；在浏览器同类循环会让按钮和绘制约 3 秒无响应。用退出码/错误栈或 Performance 长任务证明，不凭感觉说“网络慢”。

### 修复、回滚与复盘

恢复数值，删除忙等循环。CPU 密集工作应改算法、分片、移到 Worker 或后端；输入继续在边界验证。重新运行语法检查、正常样例和坏数据样例，记录预期退出码。故障实验禁止放入生产页面。

## AIOps 场景

- 在浏览器聚合告警前先验证输入和租户边界。
- 用 Promise 组织多个只读证据源，同时显示部分失败而非假成功。
- 用 AbortController 取消过期搜索和页面离开后的请求。
- 用 Worker 处理较重的本地聚合，避免阻塞交互。
- 把前端错误、Web Vitals、发布版本、Trace ID 与后端 Trace 关联，支持根因分析。
- 自动化动作必须经过服务端策略、审批、幂等与审计；JavaScript 按钮不是安全边界。

## 生产设计题：事件搜索怎样避免竞态与雪崩

参考主线：输入防抖只减少请求，不代替取消；每次搜索有版本/AbortSignal，旧结果不能覆盖新状态；网关和服务端设查询预算、分页与限流；缓存键包含租户和权限语义；界面区分加载、空、部分失败、超时和过期；指标记录请求数、取消率、错误率、P95、结果新鲜度和发布版本；故障时能关闭新搜索能力或回滚完整制品。

## 事故题：重复确认事件

1. 保存前端点击、Network、trace ID、服务端审计和数据库唯一键证据。
2. 区分重复监听、双击、超时重试、页面重放和后端消费重复。
3. 立即禁用有问题的入口不等于最终修复；写入接口用业务幂等键和服务端唯一约束兜底。
4. 前端提交期间禁用并展示未知结果，但超时后先查询结果，不能盲重试。
5. 回归连续点击、超时、刷新和两个标签页，并准备回滚。

## 高频故障排查

| 现象 | 先看 | 常见原因 | 修复方向 |
|---|---|---|---|
| `undefined` 属性错误 | 原始输入、调用栈 | 契约漂移、异步初始态 | 边界校验和显式状态 |
| 页面假死 | Performance 长任务 | 循环、JSON、同步布局 | 分片/Worker/减少 DOM |
| 旧结果覆盖新结果 | 请求时间线与状态版本 | 竞态、未取消 | AbortSignal + 结果资格检查 |
| Promise 未捕获 | async 调用链 | 忘记 await/return/catch | 明确错误所有者 |
| 内存持续升高 | heap snapshot/detached DOM | 监听、定时器、无界缓存 | 生命周期清理与容量上限 |
| 本地能跑线上失败 | 制品、环境、Source Map | 兼容、缓存、环境配置 | 可复现构建和灰度回滚 |
| 依赖升级后异常 | lockfile/SBOM/变更 | 破坏性变更或供应链 | 锁定、测试、分批升级 |

## 面试表达

### 30 秒回答

JavaScript 是动态类型、基于原型并支持一等函数的 ECMAScript 实现语言；浏览器再提供 DOM、Fetch 等宿主 API。它通常通过事件循环执行任务，Promise 反应进入微任务队列。生产代码除了语法，还要处理边界校验、异步竞态、取消、错误传播、主线程性能、内存、安全和可回滚发布。

### 3 分钟回答主线

从语言类型/作用域/闭包和原型说起，解释模块与宿主边界；画事件循环、task/microtask、浏览器 API 的数据流；用搜索竞态说明取消和状态所有权；用重复写说明前端不能保证幂等；最后覆盖内存、长任务、XSS、依赖供应链、Source Map、版本观测和灰度回滚。

### 递进追问

1. **`const` 对象能修改吗？** 能修改对象内容，只是变量不能重新绑定；需要不变性要另行约束。
2. **闭包的价值与风险？** 封装状态和回调上下文；风险是长期保留不需要对象。
3. **Promise 与线程？** Promise 表示异步结果，不创建线程；宿主完成工作后调度反应。
4. **微任务为什么会卡页面？** 当前任务结束后通常要清空微任务；无限追加会推迟渲染和后续任务。
5. **生产如何处理重复写？** 服务端业务幂等键/唯一约束是底线，客户端控制只改善体验。

## 学习检查清单

- [ ] 能分清 ECMAScript、Web API、浏览器和 Node.js。
- [ ] 能解释值类型、转换、严格相等、作用域、闭包和原型。
- [ ] 能写模块化、边界校验和可测试纯函数。
- [ ] 能画出 task、microtask、Promise 和渲染关系。
- [ ] 能处理超时、取消、竞态、部分失败和幂等边界。
- [ ] 能用 Performance、Memory、Network 和调用栈收证据。
- [ ] 能说明 XSS、密钥和供应链风险。
- [ ] 能完成基础与故障实验并记录回归。

## 老师带你推理时间：为什么最后发出的请求未必最后返回

你先输入“数据库”，接着改成“数据库连接池”。第一次查询范围大，花 2 秒；第二次更精确，只花 100 毫秒。第二次先回来，第一次后回来。JavaScript 单线程只能说明同一时刻不会有两段普通主线程代码同时修改页面，不能保证网络结果按发送顺序排队。

学生问：“那我加防抖就好了吗？”防抖减少输入过程中的请求次数，却无法改变已发出请求的完成顺序。取消可减少无用等待，但网络和服务端工作可能已经发生；所以还要判断结果有没有资格写入当前状态。把每次请求编号，只有编号仍等于当前编号时才能更新页面，这就把“最新用户意图”编码成了规则。

### 不依赖网络的完整竞态实验

准备现代 Node.js，把下列代码保存为 `race-classroom.mjs`，运行 `node race-classroom.mjs`。它只使用定时器和合成数据，无外部服务，方便你观察因果。

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function lesson(guarded) {
  let latest = 0
  let visible = '尚未查询'
  async function search(label, ms) {
    const requestId = ++latest
    await delay(ms)
    if (guarded && requestId !== latest) return
    visible = label
  }
  await Promise.all([search('旧搜索', 80), search('新搜索', 10)])
  return visible
}

console.log('故障版:', await lesson(false)) // 预期旧搜索覆盖新搜索
console.log('修复版:', await lesson(true))  // 预期保持新搜索
```

基础验收先解释两个 Promise 都被等待了，故障与修复的唯一差别是资格检查；结果不是依赖“电脑够快”碰运气。若输出异常，检查是否修改了延迟、是否漏 await、是否给两次搜索错误地共用同一个固定编号。实验结束无进程常驻，保存代码和输出即可；删掉文件即可清理。

这个实验没有真正取消请求，也没有实现后端去重。下一步把资格判断与 `AbortController` 结合，职责仍要分开：取消降低无用开销，编号守住状态正确性，服务端幂等守住写入副作用。能讲清三层，你就不容易用一个按钮禁用状态代替完整可靠性设计。

### 闭包里的变量为什么会“过时”

闭包保留词法环境，不是自动替你选择“业务上最新的数据”。一个回调可能捕获某次调用里的局部值，也可能读共享的可变绑定。排查时问变量在哪里创建、何时赋值、哪个函数实例持有它，而不是笼统说“闭包会复制变量”。

例如每次打开事件详情都创建一个监听器，监听器捕获当时事件 ID；关闭时忘了移除，旧监听器仍收到消息，便可能把后续事件结果写到旧事件记录。修复需要明确监听器生命周期和解绑句柄，不是只把变量改成全局。全局变量会引入另一组共享状态问题。

### 错误也像数据一样沿调用链传递

`try/catch` 只捕获它实际等待或同步执行的错误。一个异步函数内部发请求，却不 return 或 await，外层可能已经报告成功，而请求后来失败。你要把“这个异步工作属于谁”写清楚：属于当前操作就等待并传递错误；属于后台任务就交给有取消、限流和错误记录的所有者。

Promise `.catch()` 如果只打印然后正常返回，会把链转换成成功结果。这有时是有意降级，比如次要统计不可用；若核心数据缺失还继续显示成功，就是错误被吞掉。AIOps 采集应记录“部分成功”及缺失证据源，不能把所有 Promise settled 都等同于业务完成。

### 一条主线程能够并发等待，仍然会被计算阻塞

事件循环的宿主调度细节见[HTML 标准](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。对初学者更重要的是区分等待与计算：`await fetch()` 等待网络时，其他任务有机会继续；`JSON.parse()` 解析巨量文本或正则长时间运行时，仍可能占住主线程。把函数前面加 `async` 不会自动把这些计算搬到工作线程。

性能修复先测输入规模与耗时，检查是下载、解析、聚合还是渲染慢。分页减少数据量，算法改进减少计算，Worker 分离线程工作，虚拟化减少 DOM，它们解决不同阶段的问题。选择方案要保留取消和错误路径，别把页面卡顿换成一个无上限 Worker 队列。

### 面试中的三个进一步追问

1. **单线程为何仍有竞态？** 异步完成顺序与发出顺序不同，逻辑状态会被过时结果覆盖；用资格检查实验举证。
2. **`Promise.all` 一项失败后其余任务停止吗？** 不会自动停止。整体等待结果拒绝，其他副作用仍可能继续；需要显式取消且理解外部操作边界。
3. **怎么设计长期运行的事件台？** 给请求、监听、计时器和缓存明确所有者、清理时机及容量上限；记录版本、错误、取消和新鲜度，用重复开关页面与切路由的稳定实验检查内存趋势。

## 工程进阶课堂：时间、身份与失败传播

### 防抖、节流和取消分别解决什么

搜索框里连续输入五个字符，Debounce（防抖）会等待一段安静时间再处理，减少中间输入造成的请求；Throttle（节流）限制一段时间内处理频率，适合滚动等连续事件；Abort（取消）尝试终止已经开始的可取消操作。三者针对不同阶段，不能因为写了防抖就认为旧请求不会覆盖新请求。

老师带你画时间线：输入甲开始请求，输入乙在防抖等待，甲此时返回。是否允许显示甲，取决于你的交互策略；乙已经成为当前条件时，甲通常不应更新结果。稳定做法是给查询条件一个版本或请求标识，在结果提交时检查它是否仍代表当前条件，而取消主要用于减少无效工作。

中文输入还需要关注输入法组合过程。用户正在拼字时，输入事件不一定代表一个已经确认的搜索词。依据产品需求观察组合事件或相关状态，避免每个拼音中间态都请求后端。防抖时间也不是越大越好：过大会让界面迟钝，过小则流量高；用输入到可见结果的延迟与每次搜索请求数共同评估。

### 同一个函数名，不代表同一个函数对象

移除事件监听需要匹配注册时的函数引用。注册时使用一个箭头函数，清理时再写一个内容相同的箭头函数，它们仍是两个对象。浏览器无法替你判断“这段代码看起来相同，所以应该移除旧监听”。长期存在的监听器可能继续引用闭包中的页面数据，导致离开路由后内存与请求不断增长。

可以在自己的本地实验页控制台执行这个有边界的验证：

```javascript
{
  const target = new EventTarget();
  let calls = 0;
  const handler = () => calls++;
  target.addEventListener('sample', handler);
  target.removeEventListener('sample', () => calls++); // 故意使用另一引用
  target.dispatchEvent(new Event('sample'));
  console.assert(calls === 1, '错误清理未移除监听');
  target.removeEventListener('sample', handler);
  target.dispatchEvent(new Event('sample'));
  console.assert(calls === 1, '正确清理后不应再增加');
  console.log('PASS：清理必须使用相同监听器引用');
}
```

预期只有第一次派发增加计数，第二次不增加；没有 DOM 修改、网络请求或定时器，关闭标签页即可清理。若第二次仍增加，检查是否把变量重新赋值成新函数，或实际页面另有监听器。本实验说明引用身份，真实资源还要检查定时器、观察器、WebSocket 和订阅各自的释放方法。

### Promise.all 失败了，其余工作不一定停止

`Promise.all` 在某个输入拒绝后可以尽快以失败结束，但不会自动取消其他已经启动的请求。假设三次调用中第一项失败，另外两项仍可能创建工单。你不能在 catch 里宣称“全部未执行”，也不能毫无防重地重跑全部三项。独立批处理可收集各项结果，副作用操作则需要业务标识、幂等和明确补偿。

`Promise.allSettled` 帮助获得每项成功或失败的结果，但也不会自动限制并发。一次对十万条告警直接 map 成十万个请求，会瞬间制造巨大在途工作。应使用有界工作池、分批与停止条件，并在遇到服务端限流时退避。并发数是容量参数，需要结合服务能力、单请求耗时与错误率调节，不从 CPU 核数随意推导网络并发。

`finally` 适合释放局部资源或结束加载状态，但其中抛错会改变后续可观察结果。若清理失败掩盖了最初的数据库错误，排障会沿错误线索走偏。可以分别记录主要操作错误与清理错误，并让调用方知道哪些资源仍未释放；不要在日志中只保留最后一次异常。

### 数值、时间和序列化决定数据能否被正确解释

`Number` 采用浮点表示，超过安全整数范围的计数标识不宜当作普通数字运算。很多后端把大整数 ID 作为字符串返回，前端应保留其身份含义，不为了排序方便先转数字。`BigInt` 可以表达大整数，但不能直接套用普通 JSON 序列化；跨接口表示仍要双方约定。

时间字符串同样要说明时区。一个没有时区的字符串可能被不同解析路径按不同本地语义解释，事故时间线就会错位。数据契约采用明确时区或时间戳，显示层再按用户时区格式化；持续时间与绝对时间分开。测量短操作耗时可使用适合单调时间测量的接口，不把系统时钟调整造成的跳变当作请求突然负耗时。

对象拷贝也会影响证据：展开运算符只复制一层，嵌套数组或对象仍可能共享；序列化再反序列化不是通用深拷贝，因为某些类型、特殊数值和循环引用有边界。生产状态应选择适合数据类型的复制与更新方式，并让日志在记录时生成明确快照，避免事后查看的是已经变化的同一引用。

### 面试收束：让解释回到可观察证据

遇到页面越来越慢，先区分单次计算慢、重复任务增多、队列积压和资源没有释放。录制同一操作的性能轨迹，记录事件监听与网络请求数量，比较进入离开页面前后的保留对象。修复一个原因后重复相同步骤，不以一次刷新后的暂时顺畅证明内存问题解决。

对 AIOps 而言，前端也需要可靠信号：错误类型、路由、构建版本、请求关联和用户动作类别，而非记录用户全部输入与访问令牌。把这些信号与后端链路关联，才能区分“服务已经成功、界面没显示”和“界面发了两次、服务执行两次”。这种因果拆解，比背事件循环输出顺序更接近真实工程能力。

## 深一层的课堂：把对象交给 Worker 后谁拥有它

老师给你一份大型日志字节缓冲，希望工作线程解析，主线程继续响应用户。普通结构化复制意味着接收者取得可复制的数据结构；转移则把某些资源的所有权交给接收者，原持有方的缓冲会被分离，不能再像原来那样读取。它减少的主要是可转移资源的复制成本，不会自动让整个复杂对象及所有业务逻辑零成本迁移。[可转移对象](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

`Uint8Array` 是缓冲的一种视图，真正可转移的通常是其底层 `ArrayBuffer`。多个视图若共享同一缓冲，转移后它们都会受到影响。因此发送前要明确还有谁需要读取，不能把共享缓存里的底层缓冲随手交出去，再把后续空数据误诊为解析器丢日志。生产消息协议应带任务编号、输入版本和取消资格，主线程只接受当前任务的结果。

### 无线程、无网络的所有权实验

前提是支持 `structuredClone` 的现代 Node.js 或现代浏览器控制台；只使用四个字节的合成缓冲，不接入真实日志。先预测原缓冲的长度，再逐行执行：

```javascript
{
  const source = new Uint8Array([1, 2, 3, 4]);
  const moved = structuredClone(source, { transfer: [source.buffer] });
  console.assert(source.buffer.byteLength === 0, '源缓冲应已分离');
  console.assert(moved[2] === 3, '接收侧应保留内容');
  console.log('PASS：所有权转移与数据保留');
}
```

预期两个断言均通过。它验证的是结构化复制接口的转移语义，没有启动 Worker，也不能证明线程性能收益。再删除转移选项运行，预期原缓冲仍有四字节，修改复制结果不会修改原数组。清理只需结束控制台或进程，没有文件和服务。若不支持接口，核对运行时版本；若代码继续访问分离缓冲报错，这是所有权变化的证据，不应捕获后伪装为成功。

### 排序会不会悄悄修改原始证据

转移还有恢复代价：接收方发生异常时，发送方已经没有原缓冲的所有权，不能假定直接重发旧对象就能恢复。可重放任务应保留允许重新获取的来源或另有受控快照，并给恢复操作设置大小与次数限制。对一次性输入，界面应明确解析失败及缺失范围，不生成看似完整的统计结果。取消也分两层：不再接受结果可以靠任务编号完成，但真正停止大量计算需要工作线程配合检查取消信号或采用明确终止策略。终止后如何释放消息句柄、如何重新创建工作者，仍需由拥有它的模块负责。这些成本决定是否值得使用线程，而不是“数据大就搬过去”的单一规则。

`Array.prototype.sort()` 会原地修改数组。事件台把服务端原始列表交给排序函数后，别的组件如果持有同一数组，也会看到顺序变化。默认排序还按字符串比较，不是数值大小；延迟值十、二和一百可能得到不符合预期的顺序。显式数值比较器解决比较规则，复制数组或采用受支持的非原地方法解决所有权问题，两者缺一不可。[数组排序语义](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

比较器本身要保持一致与纯净，不能在比较过程中更新统计计数、发请求或读取不停变化的阈值来决定顺序。相同事件时间还应有明确的次级排序键，保证分页和展示可解释。排序稳定不等于数据快照稳定：排序期间上游持续更新的列表仍需先确定本次处理的输入版本。否则一次截图里不同列可能来自不同批次，难以作为事故证据。

面试三十秒回答先讲原地修改与比较规则；三分钟再连接数组身份、浅复制、不可变状态、Worker 所有权和分页快照。事故追问“为什么排序后另一块看板也变化”，先检查共享引用和修改点，而不是立即怀疑框架渲染。把输入所有者、允许修改者和结果版本写进接口约定，能减少大量难以重放的界面异常。

## GitHub 学习证据

```text
javascript-incident-lab/
  incident-filter.mjs
  incidents.json
  README.md
  test-cases.md
  evidence/
    normal-output.json
    invalid-input.txt
    event-loop-profile.md
  postmortem/
    stale-result-or-duplicate-write.md
```

README 记录 Node/浏览器版本、命令、预期退出码和安全边界。只使用合成数据，不能提交真实租户、Cookie、Token、内部 URL 或 Source Map 私密制品。

## 下一步

先用 [Ajax](./ajax.md) 深入浏览器与 API 的异步请求，再学 [TypeScript](./typescript.md) 把许多数据形状错误提前到开发期发现。
