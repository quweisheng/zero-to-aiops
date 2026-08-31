# TypeScript 技术栈深讲

> 学习目标：从零理解 TypeScript 如何在 JavaScript 之上提供静态类型检查；能使用基本类型、联合、收窄、接口、泛型、模块和严格配置；能为 API 边界做运行时校验、为状态建模、生成可追踪制品，并能排查类型声明、模块解析、构建兼容和渐进升级问题。

## 官方资料

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript 配置参考](https://www.typescriptlang.org/tsconfig/)
- [TypeScript 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
- [TypeScript 6.0 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [TypeScript 仓库](https://github.com/microsoft/TypeScript)

本文实验以本仓库已锁定的 TypeScript 6.0 工具链为验证基线。TypeScript、`@types/*`、编辑器和运行时生态持续变化；生产升级要以项目 lockfile、目标运行时、框架支持矩阵和官方发布说明为准。

## 官方知识地图与边界

```text
JavaScript syntax and runtime
  + TypeScript type system
      -> inference / annotation / narrowing
      -> union / intersection / object / function
      -> generics / keyof / indexed and conditional types
      -> declaration files / modules
  + compiler
      -> parse -> bind -> check -> transform -> emit
      -> tsconfig / module resolution / project references
  -> JavaScript artifact -> browser or Node runtime
```

TypeScript 的类型通常在编译后被擦除。它不能自动验证 HTTP 响应、数据库内容或用户输入；运行时仍是 JavaScript。本文覆盖工程主线，不穷举所有类型体操或编译器内部实现。

## 学习顺序

```text
先会 JavaScript -> 推断和基本标注 -> 联合与收窄
  -> 对象/函数/泛型 -> API 边界校验 -> tsconfig
  -> 构建/声明/升级 -> 两级实验 -> 生产设计
```

## 场景开场

后端把 `latency_ms` 从数字改成可空字符串，前端仍把它除以 1000；错误直到用户打开一个旧事件才发生。有人说：“我们用了 TypeScript，为什么还会类型错误？”

原因是开发者可能用 `as Incident` 告诉编译器“相信我”，但网络返回并没有经过运行时校验。静态类型只能证明它实际看到的程序，不会验证外部世界。

## 一句话人话版

TypeScript 是 JavaScript 的带类型语法与静态检查工具：它在运行前发现一部分错误，再输出给浏览器或 Node.js 执行的 JavaScript。

## 小白先问

### TypeScript 是另一门运行时语言吗

通常不是独立运行时。浏览器不能直接执行大多数 TypeScript 类型语法；`tsc` 或构建工具先检查并转换为 JavaScript。也有工具能直接运行/剥离部分 TS，但类型检查与运行仍要分清。

### 类型越多越安全吗

不一定。大量 `any`、不受证据约束的类型断言和复杂难读的类型会制造“看起来安全”。优先让编译器推断，在边界验证，给业务状态清晰建模。

### `interface` 和 `type` 选哪个

两者都能描述对象。interface 支持声明合并和面向公共扩展；type 还擅长联合、元组和类型运算。团队应按语义和扩展边界一致使用，而不是把它当面试口诀。

### TypeScript 会让程序运行更快吗

类型本身通常被擦除，不直接提高运行速度。它可能帮助重构和工具优化，但最终性能取决于输出 JavaScript、算法、网络、渲染和运行时。

## 类型推断、标注和 `unknown`

```ts
const serviceName = 'order-api' // 推断为字符串字面量或 string 上下文
let retryCount = 0              // 推断为 number

function formatLatency(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)}s`
}
```

不要给每个局部变量重复写显然类型。函数参数和公共返回值适当标注能稳定契约。

外部未知值用 `unknown` 而不是 `any`：

```ts
function isIncident(value: unknown): value is Incident {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string'
    && typeof candidate.latencyMs === 'number'
}
```

`unknown` 要求使用前收窄；`any` 基本关闭该值相关检查，并会传播到其他表达式。

## 联合类型、收窄与穷尽检查

把 UI 状态写成“可能同时 loading 和 success 的多个布尔值”容易产生非法组合。用 discriminated union（可辨识联合）建模：

```ts
type IncidentViewState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: string }
  | { status: 'success'; incidents: Incident[]; receivedAt: number }
  | { status: 'empty'; receivedAt: number }
  | { status: 'error'; traceId?: string; retryable: boolean }

function describe(state: IncidentViewState): string {
  switch (state.status) {
    case 'idle': return '尚未查询'
    case 'loading': return `查询中：${state.requestId}`
    case 'success': return `${state.incidents.length} 条事件`
    case 'empty': return '暂无事件'
    case 'error': return state.retryable ? '查询失败，可重试' : '查询失败'
    default: return assertNever(state)
  }
}

function assertNever(value: never): never {
  throw new Error(`unhandled state: ${JSON.stringify(value)}`)
}
```

### 状态建模五件套

- **是什么**：用联合的判别字段表示有限状态，每种状态携带自己必需的数据。
- **为什么需要**：非法状态难以构造，新增状态会触发未处理分支。
- **怎么工作**：控制流分析根据 `status` 收窄具体成员；穷尽分支后剩余应为 `never`。
- **怎么看/怎么用**：编辑器悬停类型，`tsc --noEmit` 做完整检查。
- **坏了怎么查**：先看数据是否在外部边界验证，再查断言、any 和未开启严格选项的位置。

## 对象、函数与只读边界

```ts
interface Incident {
  readonly id: string
  service: string
  severity: 'warning' | 'critical'
  latencyMs: number
}

type IncidentPredicate = (incident: Readonly<Incident>) => boolean
```

TypeScript 的结构类型意味着“形状兼容”即可赋值，不要求显式继承。`readonly` 是编译期浅层约束，不冻结运行时对象；跨信任边界可复制、冻结或采用不可变数据策略，但要评估性能。

函数参数在严格设置下涉及 variance（变型）和回调兼容，公共 API 不要用过宽回调偷偷接受更窄实现。

## 泛型：保留输入与输出关系

```ts
function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K
): Map<K, T[]> {
  const grouped = new Map<K, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  return grouped
}
```

泛型不是“把所有类型改成 T”。它用于表达多个位置之间的类型关系。没有关系时普通具体类型或联合更清晰；公共泛型要给合理约束，避免调用者得到无法操作的类型。

## 编译器做什么、不做什么

```text
.ts source
  -> parser builds syntax tree
  -> binder connects declarations and scopes
  -> checker evaluates assignability and control flow
  -> transformer removes/types downlevels selected syntax
  -> emit .js / .d.ts / source map depending on config
```

`target` 控制语法下转换基线；`lib` 控制编译期可见的标准 API 类型；它们不自动安装 polyfill。`module` 与 `moduleResolution` 必须符合 bundler/Node 运行方式。即使 `tsc` 通过，运行时仍可能缺少 API、模块路径或环境变量。

## 一份严格但要理解的 tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": false
  },
  "include": ["src/**/*.ts"]
}
```

| 字段 | 目的 | 预期结果 | 常见坑 |
|---|---|---|---|
| `strict` | 打开严格检查族 | null、函数等检查更严 | 迁移时一次打开无修复计划 |
| `noUncheckedIndexedAccess` | 索引访问加入 undefined | 查数组/Map 更谨慎 | 误以为下标一定存在 |
| `exactOptionalPropertyTypes` | 区分缺失与显式 undefined | PATCH 契约更准确 | 旧库声明不兼容 |
| `noEmit` | 只检查不产物 | 由 Vite 等负责构建 | 误以为已生成 JS |
| `moduleResolution` | 决定 import 查找规则 | 与 bundler/Node 对齐 | 编辑器能找、生产运行找不到 |
| `skipLibCheck` | 是否跳过 `.d.ts` 检查 | false 能暴露声明冲突 | 开启后掩盖依赖类型矛盾 |
| `types` | 限制全局类型包 | 避免测试/Node 污染浏览器 | 漏掉环境声明 |

严格设置不是“越多越好”的开关竞赛。先定义目标、评估依赖声明、按目录迁移、记录暂时例外并持续减少。

## 运行时校验：静态类型的信任边界

```ts
async function loadIncident(id: string): Promise<Incident> {
  const response = await fetch(`/api/incidents/${encodeURIComponent(id)}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const payload: unknown = await response.json()
  if (!isIncident(payload)) throw new TypeError('invalid Incident payload')
  return payload
}
```

`await response.json() as Incident` 不会校验任何字节。生产可选手写 type guard、JSON Schema/OpenAPI 生成校验器或成熟 Schema 库；关键是明确验证位置、错误语义、版本和性能成本。

## 声明文件、第三方库与模块

`.d.ts` 描述现有 JavaScript 的类型，不包含运行时实现。来源可能是包自带、`@types` 或项目补充声明。

常见失败：

- 包的 ESM/CJS 导出与声明不一致。
- 同一库安装多个不兼容版本，类型身份冲突。
- 全局 augmentation 污染整个项目。
- 用 `declare module '*'` 或 `any` 让错误消失，实际运行仍失败。

先用包管理器依赖树、`tsc --traceResolution`、实际 `package.json` exports 和运行时错误形成证据，再决定升级、锁版本、补精确声明或替换库。

## 构建、测试与可观测性

- 类型检查与打包可以分进程，但 CI 必须都执行并绑定同一 commit/lockfile。
- 单元测试验证运行时行为，类型测试验证公共契约；两者互不替代。
- Source Map 关联 TS 源码和生成 JS，上传到错误平台时按权限控制，不一定公开部署。
- 日志和错误上报包含发布版本、路由、浏览器和 trace ID，不提交敏感字段。
- 前端制品记录 TypeScript、构建器、依赖锁和环境配置摘要，支持复现与 SBOM。

## 容量、性能、安全和升级

TypeScript 检查大型单体项目可能耗时。用项目引用、增量检查、合理包边界和缓存改善，但 CI 仍应保留干净构建验证。复杂递归类型会拖慢编译器和编辑器，应以可读公共类型代替炫技。

类型不能防止 XSS、越权和密钥泄露；品牌类型也不能替代服务端授权。升级 TypeScript 时先读 breaking changes，检查废弃选项、DOM/Node 类型、框架插件、测试工具和生成器；小批提交、双版本验证、保留 lockfile 回滚。

## 进阶层一：结构类型与可赋值性

TypeScript 主要采用 structural typing（结构类型）：两个值是否兼容，主要看它们拥有的成员结构，而不是必须继承同一个显式类。

```ts
type IncidentRef = { id: string }

const full = { id: 'INC-1024', severity: 'critical' }
const ref: IncidentRef = full // 结构包含所需成员，所以可赋值
```

这让 JavaScript 生态组合更自然，但也会出现“形状相同、业务含义不同”的误混：

```ts
type UserId = string
type TenantId = string

function loadTenant(id: TenantId) {}
const userId: UserId = 'u-1'
loadTenant(userId) // 纯 string 别名无法阻止误用
```

可在关键边界使用 branded type（品牌类型）增强区分：

```ts
declare const tenantIdBrand: unique symbol
type TenantId = string & { readonly [tenantIdBrand]: true }

function parseTenantId(value: unknown): TenantId {
  if (typeof value !== 'string' || !/^tenant-[a-z0-9-]+$/.test(value)) {
    throw new TypeError('invalid tenant id')
  }
  return value as TenantId // 断言集中在已完成运行时校验的边界
}
```

品牌只帮助编译期防误传，不是权限。服务端仍要确认调用者是否有权访问该 tenant。

### excess property check 不是密封对象

对象字面量直接赋给目标类型时会有额外属性检查，但通过变量传递时结构兼容仍可能允许多余字段。TypeScript 对象类型默认不是“只有这些键”的运行时密封 schema。

```ts
type Filter = { severity: 'warning' | 'critical' }

const raw = { severity: 'critical' as const, tenant: 'tenant-a' }
const filter: Filter = raw // 允许，raw 至少包含所需结构
```

API 边界要用运行时 schema 决定是否拒绝未知字段，不能依赖 excess property check。

## 进阶层二：联合、交叉、never 与状态机

联合类型表示“可能是其中一种”，交叉类型表示“同时满足多种结构”。业务状态通常更适合可辨识联合，而不是很多互相独立的布尔值。

```ts
type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; incidents: readonly Incident[]; receivedAt: string }
  | { status: 'empty'; receivedAt: string }
  | { status: 'error'; message: string; retryable: boolean }
  | { status: 'cancelled'; reason: 'superseded' | 'navigation' | 'user' }
```

这样 `loading=true` 同时 `error=true` 的非法组合无法表示。处理分支时用 `never` 做穷尽检查：

```ts
function assertNever(value: never): never {
  throw new Error(`unhandled state: ${JSON.stringify(value)}`)
}

function renderState(state: RequestState): string {
  switch (state.status) {
    case 'idle': return '尚未查询'
    case 'loading': return '加载中'
    case 'success': return `${state.incidents.length} 条`
    case 'empty': return '没有结果'
    case 'error': return state.message
    case 'cancelled': return '已取消'
    default: return assertNever(state)
  }
}
```

新增状态后漏改 switch，类型检查会报错。这是“把状态设计进类型”，不是只给变量加注解。

### never、void 和 unknown 的区别

- `never`：理论上不会产生值，例如总是抛错或穷尽后的不可能分支。
- `void`：调用者不应依赖返回值，不代表函数绝不会实际返回某个值。
- `unknown`：存在某个值，但使用前必须证明类型。
- `any`：跳过大部分检查并向外传播风险。

## 进阶层三：控制流分析与类型谓词

TypeScript 会根据 `typeof`、`instanceof`、`in`、字面量判断、空值检查和提前 return 等控制流缩窄类型。

自定义 predicate 可以把运行时判断告诉编译器：

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIncident(value: unknown): value is Incident {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.severity === 'warning' || value.severity === 'critical')
}
```

predicate 是开发者的承诺。实现写错时，编译器会被误导。因此高风险 schema 要有正反例测试、深度/长度限制，并考虑使用可审计的 schema 库或生成器。

### assertion function

```ts
function assertIncident(value: unknown): asserts value is Incident {
  if (!isIncident(value)) throw new TypeError('invalid incident')
}
```

断言函数适合在失败就终止的入口统一收窄。不要写空实现只为让类型通过。

## 进阶层四：泛型是表达关系，不是把类型变复杂

泛型最有价值的地方是保留输入与输出关系：

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0]
}
```

如果返回写成 unknown，调用者丢失关系；写成 any 则失去检查。

### 约束和 keyof

```ts
function pick<T, K extends keyof T>(object: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, object[key]])) as Pick<T, K>
}
```

这里的断言来自 `Object.fromEntries` 标准库类型难以表达精确映射，应该集中、测试并说明，而不是把整个函数改成 any。

### 方差的实际含义

方差回答 `A` 是 `B` 的子类型时，容器或函数之间如何兼容。函数参数通常需要逆向考虑：能处理“任意事件”的函数可以放到只会收到“严重事件”的位置；反过来不安全。

`strictFunctionTypes` 有助于发现回调参数不安全，但方法和生态兼容仍有细节。面试不必背术语图，能用“消费者不能假装能处理更宽输入”解释即可。

## 进阶层五：映射类型、条件类型与模板字面量

映射类型遍历键生成新结构：

```ts
type Patch<T> = {
  readonly [K in keyof T]?: T[K]
}
```

条件类型根据类型关系选择分支：

```ts
type ApiResult<T> =
  T extends Error ? { ok: false; error: T } : { ok: true; data: T }
```

当条件类型的被检查参数是裸类型参数时，会对联合分发。复杂嵌套可能让错误难读并拖慢编译器。公共 API 类型应优先清晰、稳定，避免仅为了炫技构造递归迷宫。

模板字面量类型适合表达有限字符串协议：

```ts
type Severity = 'warning' | 'critical'
type MetricName = `incident_${Severity}_total`
```

它不能验证运行时字符串。来自配置或网络的数据仍要 parse。

## 进阶层六：类型推断、satisfies 与 literal widening

```ts
const config = {
  mode: 'readonly',
  timeoutMs: 2000
} satisfies { mode: 'readonly' | 'write'; timeoutMs: number }
```

`satisfies` 检查表达式满足目标，同时尽量保留表达式自己的精确类型；类型注解可能把变量直接视为较宽目标；断言则可能跳过不安全信息。三者职责不同。

`as const` 保留字面量并添加只读推断，但只发生在类型层，不会运行时冻结对象。运行时不变性要靠封装、复制或 Object.freeze（且它也只是浅层）。

## 进阶层七：编译管线与“类型检查通过”边界

```text
.ts/.tsx 源码
  -> parse AST
  -> bind symbols
  -> resolve modules and types
  -> check assignability/control flow
  -> emit JavaScript / declarations / source maps（若启用）
  -> bundler 转换、分包、压缩
  -> 浏览器/Node 运行
```

很多工具只做快速转译而不调用完整 type checker。Vite/esbuild/SWC 构建成功不代表 `tsc --noEmit` 或 `vue-tsc` 通过。因此 CI 至少分开显示 typecheck、test、build 三道门禁。

`target` 主要控制输出语言级别，`lib` 控制编译时可见的环境 API 类型。把 target 设低不会自动注入所有 polyfill；声明存在也不证明目标浏览器实现了 API。

### declaration emit 与公共 API

库项目的 `.d.ts` 是消费者看到的契约。发布前要检查：

1. public 类型是否意外引用内部路径。
2. exports 与 types 条件是否匹配 ESM/CJS。
3. 声明生成是否泄露私有实现或巨大类型。
4. 新版本是否造成 breaking type change。
5. `skipLibCheck` 是否让不兼容声明悄悄通过。

## 进阶层八：模块解析不是找同名文件那么简单

TypeScript 的 `moduleResolution` 要模拟目标运行时/打包器如何理解 imports、package exports、扩展名和条件导出。NodeNext、Bundler 等模式适用边界不同。

排查顺序：

```text
源码 import specifier
  -> tsconfig 的 baseUrl/paths/moduleResolution
  -> package.json exports/imports/types
  -> 实际解析到哪个 .ts/.d.ts/.js
  -> 构建器输出什么 specifier
  -> Node/浏览器运行时能否加载
```

`paths` 通常只帮助编译器理解别名，不保证运行时自动重写。打包器、测试工具和生产运行时必须配置一致。

## 进阶层九：大型仓库的项目引用与性能

Project References 把大型代码库拆成可独立构建的 TypeScript 项目，并用 `composite` 与声明输出形成边界：

```text
packages/contracts
  -> packages/api-client
  -> apps/incident-console
```

好处是增量构建和所有权更清晰；代价是配置、构建顺序、声明边界和编辑器工程复杂度。不要为几千行项目过早引入。

性能排查用 `--extendedDiagnostics`、`--generateTrace` 等证据，关注文件数、声明依赖、类型实例化和内存。常见改进：缩小 include、避免重复版本、拆公共接口、给复杂推断增加命名边界、减少巨大联合和递归条件类型。

## 进阶层十：契约生成与版本演进

前后端共享类型有三种常见路线：

1. 以 OpenAPI/JSON Schema/Protobuf 为源，生成客户端类型与运行时校验。
2. 以运行时 schema 为源，推导 TypeScript 类型。
3. 同一 monorepo 共享纯类型包，同时保留网络边界校验。

不论哪种，都要管理版本：字段新增是否可选、枚举扩展旧客户端会怎样、删除字段何时生效、服务端与多个前端版本并存多久、契约测试在哪一侧运行。

类型包同步成功不等于生产兼容。渐进发布时必须用真实请求/响应样本的脱敏契约测试验证旧客户端。

## 进阶故障实验：让类型系统暴露真实边界

### 故障一：any 污染链

1. 把网络响应声明为 any，访问不存在字段并调用方法。
2. 记录 typecheck 通过、运行时报错的反差。
3. 改为 unknown + schema 校验，并加入无效 payload 测试。
4. 搜索 any 进入了哪些下游函数，逐步收紧边界。

### 故障二：联合状态漏分支

1. 给 RequestState 增加 `cancelled`，故意不改 render switch。
2. 验证 assertNever 让 typecheck 失败。
3. 添加明确 UI 和观测字段，重新通过类型与行为测试。
4. 记录编译器如何把遗漏提前发现。

### 故障三：paths 本地通过、运行时失败

1. 在 tsconfig 增加 `@contracts/*` paths，但不配置运行时。
2. 让 tsc 通过后直接运行输出，记录 module not found。
3. 选择真实方案：相对路径、包 exports 或打包器一致别名。
4. 在 CI 增加生产制品运行烟测。

### 故障四：升级产生静默契约变化

1. 在独立分支锁定旧/新 TypeScript 与 DOM types。
2. 分别运行 showConfig、typecheck、test、build，分类差异。
3. 不用大范围 `skipLibCheck`/any 压错，逐项修复或记录有期限例外。
4. 保留 lockfile 和上一制品，灰度验证后再扩大。

## 常用工具字典

| 命令/操作 | 作用 | 预期 | 常见坑 |
|---|---|---|---|
| `npx tsc --version` | 确认实际编译器 | 输出项目版本 | 调到全局旧版本 |
| `npx tsc --noEmit` | 完整类型检查 | 退出码 0 | 构建器只转译未检查 |
| `npx tsc --showConfig` | 展开最终配置 | 看继承后的选项/files | 输出较大需定向搜索 |
| `npx tsc --traceResolution` | 追踪模块解析 | 看到候选与最终路径 | 日志很大，先缩小复现 |
| `npx tsc --extendedDiagnostics` | 分析检查性能 | 文件/内存/时间统计 | 单次冷启动直接下结论 |
| `satisfies` | 校验表达式满足类型并保留推断 | 配置字面量更精确 | 与类型断言混淆 |
| `as const` | 保留字面量并只读化 | 推断更窄 | 误以为运行时深冻结 |

## 基础实验：类型安全的告警聚合器

仓库共享实验 [frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab) 使用固定 TypeScript 6.0.3、严格配置、`unknown` 运行时校验、联合请求状态与 `never` 穷尽检查。执行 `cd examples/frontend-incident-lab`、`npm ci`、`npm run typecheck`、`npm test`、`npm run build`，预期类型检查退出码 0、7 项测试通过、三个 HTML 入口构建成功。

### 文件

创建 `src/index.ts`：

```ts
type Severity = 'warning' | 'critical'

interface Incident {
  id: string
  service: string
  severity: Severity
}

export function countBySeverity(
  incidents: readonly Incident[]
): Record<Severity, number> {
  const result: Record<Severity, number> = { warning: 0, critical: 0 }
  for (const incident of incidents) result[incident.severity] += 1
  return result
}

console.log(countBySeverity([
  { id: 'INC-1', service: 'order-api', severity: 'critical' }
]))
```

再创建上面的 `tsconfig.json`，但把 `moduleResolution` 按你的运行/构建器调整。运行：

```powershell
npx tsc --version
npx tsc --noEmit
```

预期版本与项目 lockfile 一致，类型检查退出码为 0。若要执行，请使用项目已选择的构建器/运行器产出 JavaScript；`tsc --noEmit` 只证明静态检查。

### 如果没成功与清理

- 找不到 `tsc`：确认已在含 TypeScript 的项目目录安装依赖。
- DOM/Node 全局冲突：检查 `lib` 和 `types`，不要直接 `skipLibCheck` 掩盖。
- import 找不到：对照运行时、module、moduleResolution 和扩展名。
- 完成后保留源码、配置和命令输出；移除 `node_modules` 前确保 lockfile 可复现。

## 故障实验：用 `any` 和断言制造“假安全”

### 注入

```ts
const raw: any = { id: 'INC-2', service: 'db', severity: 'fatal' }
const incident = raw as Incident
console.log(countBySeverity([incident]))
```

静态检查可能通过，但运行时会给不存在的 `result.fatal` 做运算，产生错误状态。证据说明“编译通过”不等于“数据有效”。

### 修复与验证

把 `raw` 改为 `unknown`，通过 `isIncident` 检查 `severity` 是否只在允许集合。添加三组用例：合法、未知等级、缺字段。重新运行类型检查和运行时测试；记录断言位置清单，逐步减少无证据断言。

### 回滚与复盘

删除故障代码。复盘写清信任边界、any 如何传播、运行时为何出错、为何类型断言不是转换，以及新增的 Schema/契约测试。不要在生产流量上注入非法告警。

## AIOps 场景

- 用可辨识联合建模事件查询、审批和自动化执行状态，避免非法组合。
- 为日志、指标、Trace、告警和 Runbook 定义共享契约，同时在入口运行时校验。
- 用生成的 OpenAPI 类型减少手工漂移，但生成结果仍要版本化并进行契约测试。
- 让高风险动作参数使用更窄类型和显式审批状态，但服务端策略继续作为最终边界。
- 前端错误堆栈通过受控 Source Map 还原，并带 commit、route、trace ID 进入事件证据。

## 生产系统设计：跨团队前端类型契约

参考答案应覆盖：API Schema 是事实来源还是消费者类型是事实来源；如何生成、审查和版本化；新增/删除字段兼容窗口；运行时校验位置与性能；多个前端包的项目引用和边界；类型检查、契约测试、制品和 Source Map 如何绑定同一 commit；灰度如何发现错误率；怎样一键回滚 lockfile、生成代码和服务端契约的完整组合。

## 事故题：升级 TypeScript 后 CI 通过但浏览器白屏

1. 比较本地、CI 的 Node、TypeScript、构建器、lockfile 和环境变量。
2. 确认 CI 是否只运行 `tsc --noEmit`，没有真正打包/浏览器测试。
3. 读取浏览器 Console/Network 与 Source Map，对照生成 JS 和模块 URL。
4. 检查 `target/lib/moduleResolution` 变化是否输出目标浏览器不支持语法/API。
5. 缓解采用上一完整 lockfile/制品回滚，不在线热改生成 JS。
6. 永久修复增加目标浏览器构建测试、兼容矩阵和升级 canary。

## 高频排障

| 现象 | 证据 | 常见原因 | 修复方向 |
|---|---|---|---|
| TS 通过仍运行错误 | 原始输入、断言/any | 外部数据未校验 | unknown + 运行时 Schema |
| 编辑器与 CI 不同 | 版本、showConfig | 全局编译器/配置路径不同 | 项目本地版本和锁定命令 |
| 模块找不到 | traceResolution/exports | 模式与运行时不匹配 | 对齐 Node/bundler 规则 |
| 类型突然重复/冲突 | 依赖树和 `.d.ts` | 多版本、全局声明 | 去重或隔离类型边界 |
| 类型检查很慢 | extendedDiagnostics | 巨型项目/复杂类型 | 项目引用、边界、简化类型 |
| 浏览器缺少 API | 输出 JS/兼容矩阵 | target/lib 误解 | polyfill/降级/调整目标 |
| 升级海量报错 | 发布说明和错误分类 | 严格项/声明变更 | 分批迁移、例外台账、可回滚 |

## 面试表达

### 30 秒回答

TypeScript 在 JavaScript 之上增加可擦除的类型语法和静态检查。编译器能通过推断、控制流收窄和结构类型发现很多开发期错误，但网络响应和用户输入仍需运行时校验。我会用 strict 配置、unknown、可辨识联合和契约测试提高可信度，同时管理模块解析、声明文件、构建制品、Source Map 和升级回滚。

### 3 分钟回答主线

先说明 TS/JS 运行时边界和编译流程；用 unknown 与 type guard 讲信任边界；用可辨识联合和 never 讲状态建模；用泛型表达关系；再解释 tsconfig 的 target/lib/moduleResolution/strict；最后讲声明依赖、编译性能、契约生成、浏览器兼容、CI 真实构建和升级回滚。

### 连续追问

1. **any 与 unknown？** any 关闭相关检查，unknown 必须收窄后使用。
2. **type assertion 会转换值吗？** 不会，通常只影响编译器看法。
3. **结构类型利弊？** 组合灵活，但不同领域相同形状可能误混，可用封装/品牌类型加强边界。
4. **target 与 lib？** target 影响输出语法，lib 影响可见 API 类型；两者都不自动保证运行时 API。
5. **如何安全升级？** 锁定环境、读发布说明、分类错误、双版本/构建/浏览器验证、灰度和完整回滚。

## 学习检查清单

- [ ] 能解释静态类型被擦除和运行时 JavaScript 边界。
- [ ] 能使用推断、unknown、联合、收窄、never 和泛型。
- [ ] 能用联合状态消除非法 UI 组合。
- [ ] 能为外部 API 做运行时验证。
- [ ] 能解释 strict、target、lib、moduleResolution 等配置。
- [ ] 能排查声明、模块、性能和编辑器/CI 差异。
- [ ] 能完成假安全故障实验并修复。
- [ ] 能设计契约版本、构建、灰度与回滚。

## GitHub 学习证据

```text
typescript-incident-contract/
  package.json
  package-lock.json
  tsconfig.json
  src/index.ts
  tests/contract.test.ts
  evidence/
    tsc-version.txt
    typecheck.txt
    invalid-payload.txt
  postmortem/
    assertion-is-not-validation.md
```

证据写清 TypeScript/Node 版本、执行命令和退出码。不要提交 `node_modules`、密钥、真实事件数据或公开 Source Map；lockfile 应提交以便复现。

## 下一步

继续学习 [Vue](./vue.md) 或 [React](./react.md)，观察框架如何把 TypeScript 契约、组件状态、异步请求和渲染生命周期组织成应用。
