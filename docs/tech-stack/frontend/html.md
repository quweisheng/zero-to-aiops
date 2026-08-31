# HTML 技术栈深讲

> 学习目标：从零理解浏览器如何把 HTML 文档变成可访问的页面结构；能正确使用语义标签、表单、表格、图片和元数据；能用开发者工具检查 DOM、网络和无障碍树；能完成一个无需框架的 AIOps 事件页面，并能排查结构、资源、表单、安全、性能和兼容性问题。

## 官方资料

- [WHATWG HTML Living Standard](https://html.spec.whatwg.org/)
- [WHATWG：HTML 开发者版本](https://html.spec.whatwg.org/dev/)
- [W3C：Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [MDN：HTML 指南](https://developer.mozilla.org/docs/Web/HTML)
- [MDN：HTML 元素参考](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements)
- [MDN：表单指南](https://developer.mozilla.org/docs/Learn_web_development/Extensions/Forms)

HTML 是持续演进的 Living Standard（活标准），不是“HTML5 学完后永不变化”的静态清单。本文按 2026-08-31 可用的官方资料组织，生产使用前仍要查询目标浏览器兼容性和团队支持矩阵。

## 官方知识地图与本文边界

```text
document
  -> metadata: title / meta / link / script
  -> sections: header / nav / main / article / section / footer
  -> text: headings / paragraph / list / code
  -> embedded content: img / picture / video / iframe
  -> data and interaction: table / form / details / dialog
  -> browser models: parsing / DOM / accessibility tree / navigation
```

本文覆盖页面结构、语义、DOM、表单、资源、安全、性能、可访问性和运维排障。CSS 视觉布局、JavaScript 行为、Ajax 请求、框架状态管理分别在本分类后续文章展开。

## 推荐学习顺序

```text
文档骨架 -> 语义与 DOM -> 文本和资源 -> 表单与校验
  -> 可访问性 -> 网络与安全 -> 两级实验 -> 生产排障与面试
```

## 场景开场

值班同事打开“事件详情”页面，只看到一大片红色文字。鼠标可以点“确认”，但键盘按 Tab 找不到按钮；页面标题仍叫 `Vite App`；接口失败后按钮看起来像成功；监控机器人也提取不到事件等级。

这不只是“页面不好看”。浏览器、搜索引擎、屏幕阅读器、自动化测试和观测工具首先读取的是 HTML 结构。结构错了，CSS 和 JavaScript 再多也很难补救。

## 一句话人话版

HTML（HyperText Markup Language，超文本标记语言）用标签说明“这段内容是什么”，让浏览器建立页面的文档结构，而不是负责业务计算或视觉美化。

## 小白先问

### HTML 是编程语言吗

通常不把它称为通用编程语言。HTML 描述文档结构，不提供 JavaScript 那样的变量、循环和业务控制流；但它有表单校验、媒体加载、对话框等浏览器原生行为。

### 标签和元素有什么区别

`<button>` 是开始标签，`</button>` 是结束标签，两者和中间内容共同组成一个元素。`<img>` 是 void element（空元素），没有结束标签和子内容。

### DOM 是 HTML 文件吗

不是。HTML 是输入文本，DOM（Document Object Model，文档对象模型）是浏览器解析后在内存里建立的对象树。JavaScript 可以继续修改 DOM，所以当前页面结构可能与最初下载的 HTML 不同。

### 用 `div` 能不能做所有东西

视觉上能拼出来，语义上通常不应该。原生 `button` 自带键盘、焦点、禁用和无障碍语义；把 `div` 假装成按钮，需要自己补齐许多容易遗漏的行为。

## HTML 解决什么问题

HTTP 只负责传输字节，HTML 给页面内容提供共同结构：标题是标题，导航是导航，表单控件有名字，表格有表头，图片有替代文本。这个共同结构让人、浏览器和工具都能理解页面。

HTML 不负责保证接口成功、权限正确或数据新鲜。页面展示的运维数据仍要经过服务端认证、授权、校验和审计。

## HTML、DOM、CSSOM 与渲染路径

```text
GET /incident/INC-1024
  -> response headers + HTML bytes
  -> HTML parser builds DOM
  -> CSS parser builds CSSOM
  -> DOM + CSSOM produce render tree
  -> layout computes size and position
  -> paint draws pixels
  -> compositor combines layers

screen reader
  <- accessibility tree derived from semantic DOM and ARIA
```

### DOM 五件套

- **是什么**：浏览器用节点对象表达文档的树。
- **为什么需要**：脚本和工具需要稳定接口读取、修改和监听页面。
- **怎么工作**：解析器按标记规则创建元素、文本和属性节点；错误标记会被浏览器按容错算法修复。
- **怎么看/怎么用**：开发者工具 Elements 面板看实时 DOM，Console 中用 `document.querySelector('main')` 查询。
- **坏了怎么查**：先看实时 DOM 是否被自动纠正或脚本改写，再看 Console 错误，不要只读源码文件。

## 最小且正确的文档骨架

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>事件控制台</title>
    <meta name="description" content="查看和跟踪 AIOps 事件">
  </head>
  <body>
    <header><h1>事件控制台</h1></header>
    <main id="main-content">
      <article aria-labelledby="incident-title">
        <h2 id="incident-title">INC-1024 数据库延迟</h2>
        <p>状态：调查中</p>
      </article>
    </main>
  </body>
</html>
```

关键字段像字典一样理解：

| 写法 | 作用 | 预期结果 | 常见坑 |
|---|---|---|---|
| `<!doctype html>` | 让浏览器采用标准模式 | 布局按现代标准计算 | 遗漏后可能进入怪异模式 |
| `lang="zh-CN"` | 声明主要语言 | 朗读和翻译更准确 | 把语言写在无关子节点 |
| `charset="utf-8"` | 声明字符编码 | 中文正常显示 | 声明太晚或服务端头不一致 |
| `viewport` | 控制移动视口 | 手机不再按桌面宽度缩小 | 禁止用户缩放会伤害可访问性 |
| `title` | 浏览器标签、历史与书签名称 | 能区分当前页面 | 所有路由都叫同一标题 |
| `description` | 页面摘要元数据 | 工具能读取摘要 | 把敏感事件内容放入公共摘要 |

## 语义结构：先说明“是什么”

| 元素 | 什么时候用 | 观察方法 | 错了的表现 |
|---|---|---|---|
| `header` | 页面或章节的引导区 | 无障碍树查看 landmark | 误以为只能出现一次 |
| `nav` | 主要导航链接组 | 屏幕阅读器可跳到导航 | 每组普通链接都包 `nav` |
| `main` | 页面独有主体 | 一页通常一个可见 `main` | 多个未区分的主体 |
| `article` | 可独立分发的完整内容 | 脱离页面仍能理解 | 任意卡片都叫 article |
| `section` | 有主题、通常带标题的分区 | 标题层级能说明结构 | 只为加样式而使用 |
| `button` | 触发当前页面动作 | Enter/Space 可操作 | 用链接或 `div` 假装按钮 |
| `a` | 导航到资源或位置 | 有真实 `href` | 用空链接执行危险动作 |

标题应形成结构，不要因为字体大小跳级：`h1 -> h2 -> h3`。CSS 可以改变外观，标题级别表达的是内容层次。

## 表单：一次提交怎样走

```text
label -> user input -> browser constraint validation
  -> submit event -> name/value pairs
  -> HTTP request -> server authentication and validation
  -> response -> success/error state -> focus and announcement
```

```html
<form method="post" action="/api/incidents/acknowledgements">
  <label for="incident-id">事件编号</label>
  <input id="incident-id" name="incident_id" required pattern="INC-[0-9]+">

  <label for="reason">确认说明</label>
  <textarea id="reason" name="reason" minlength="10" required></textarea>

  <button type="submit">确认收到</button>
  <p role="status" aria-live="polite" id="result"></p>
</form>
```

### 表单核心概念五件套

- **是什么**：表单把用户输入组织成有名字的字段并提交。
- **为什么需要**：统一焦点、输入法、浏览器校验、密码管理和提交语义。
- **怎么工作**：只有具备 `name` 且未禁用的成功控件通常会进入提交数据；服务端再次校验。
- **怎么看/怎么用**：Network 面板检查方法、URL、Content-Type、请求体和响应状态。
- **坏了怎么查**：字段没提交先查 `name`/`disabled`，按钮误提交先查 `type`，400 再对照服务端契约。

浏览器校验只改善体验，不能替代服务端校验。攻击者可以直接发请求；权限和高风险操作确认必须由服务端实施。

## 图片、表格和外部内容

### 图片

```html
<img
  src="latency-chart.webp"
  width="960"
  height="540"
  loading="lazy"
  alt="14:05 后订单接口 P95 延迟由 180 毫秒升至 2.4 秒">
```

明确宽高可减少布局跳动；`alt` 应传达图片承担的信息。纯装饰图片使用空 `alt=""`，不要把文件名当替代文本。

### 数据表格

```html
<table>
  <caption>当前受影响服务</caption>
  <thead><tr><th scope="col">服务</th><th scope="col">错误率</th></tr></thead>
  <tbody><tr><th scope="row">order-api</th><td>8.2%</td></tr></tbody>
</table>
```

表格用于二维数据关系，不用于页面布局。大表格还要考虑分页、固定表头、移动端和服务端导出。

### `iframe`

嵌入 Grafana 等外部页面时，先确认认证、`Content-Security-Policy`、`X-Frame-Options`、Cookie 的 SameSite 属性和跨域边界。能不用的权限不要写进 `sandbox`；不同源 iframe 的 DOM 不能被父页面任意读取，这是同源策略的一部分。

## 可访问性不是“额外功能”

1. 优先使用原生语义元素，再在确有缺口时使用 ARIA（Accessible Rich Internet Applications）。
2. 输入框必须有可感知名称，错误信息要与控件关联。
3. 所有操作可用键盘完成，焦点顺序与视觉顺序一致。
4. 弹窗打开后把焦点移入，关闭后还给触发按钮；Escape 行为要明确。
5. 动态状态通过 `role="status"` 或合适 live region 通知，不要只变颜色。
6. 自动化扫描只能发现部分问题，还要真实键盘和屏幕阅读器抽查。

## 安全、性能与生产边界

- 不把用户输入拼成 HTML；文本默认用 `textContent`，需要富文本时采用经过审计的白名单净化。
- 内联脚本、第三方资源和 CSP（Content Security Policy，内容安全策略）要一起设计。
- 外部链接新窗口配合 `rel="noopener"`，并让用户知道将打开新窗口。
- 关键 CSS/脚本避免无序阻塞首屏；脚本通常使用模块或 `defer`，但必须理解执行顺序。
- 资源提供正确 MIME type、缓存头和压缩；HTML 本身通常需要更短缓存或协商缓存。
- 页面不应把密钥、内部令牌和未授权数据放进隐藏字段或注释；下载到浏览器的内容都应视为用户可见。

## 进阶层一：浏览器到底怎样把字节变成页面

“服务器返回了一段 HTML”只是起点。浏览器至少经历下面几步：

```text
HTTP 响应字节
  -> 根据响应头和 meta 判断字符编码
  -> tokenizer 把字符识别成开始标签、结束标签、文本、注释等 token
  -> tree builder 按插入模式构建 DOM
  -> 遇到 CSS、图片、字体、脚本时发起子资源请求
  -> DOM + CSSOM 进入样式计算、布局、绘制和合成
  -> 同时从 DOM/样式派生可访问性树
```

`tokenizer` 可以理解为“分词员”，`tree builder` 是“组装员”。它们不是简单按缩进生成树，而是遵循 HTML Living Standard 的错误恢复规则。即使源码标签遗漏或嵌套错误，浏览器也可能继续显示页面，但最终 DOM 可能不是开发者想象的结构。

### 解析器状态与错误恢复

下面这个源码看似只是少了结束标签：

```html
<p>事件摘要
  <div>数据库连接池耗尽</div>
</p>
```

`div` 不能合法地留在 `p` 内。浏览器在构树时会提前关闭 `p`，Elements 面板中看到的 DOM 可能类似：

```html
<p>事件摘要</p>
<div>数据库连接池耗尽</div>
<p></p>
```

这会产生三个生产风险：

1. CSS 子代选择器失效，因为真实父子关系已经变化。
2. 服务端渲染框架水合时发现服务端字符串与客户端 DOM 不一致。
3. 自动化测试和无障碍树读取到意外结构。

排查时比较 `View Source` 与 `Elements`：前者是初始文本，后者是解析并被脚本修改后的实时 DOM。两者不一致不一定是“浏览器有 bug”，先检查无效标记与脚本变更。

### parser-blocking、defer、async 与 module

HTML 解析器遇到脚本时是否停下来，取决于脚本类型和属性：

| 写法 | 下载 | 执行时机 | 顺序 | 适合场景 | 常见故障 |
|---|---|---|---|---|---|
| `<script src="a.js">` | 解析时下载 | 下载后立即执行并阻塞解析 | 按文档顺序 | 极少数必须立刻改变后续解析的旧脚本 | 首屏变慢、DOM 尚未出现 |
| `<script defer src="a.js">` | 与解析并行 | DOM 构建完成后、`DOMContentLoaded` 前 | 保持文档顺序 | 普通非模块入口 | 依赖脚本顺序仍需正确 |
| `<script async src="a.js">` | 与解析并行 | 下载完成立刻执行 | 不保证 | 独立统计或无依赖脚本 | 多脚本竞态、偶发未定义 |
| `<script type="module" src="a.js">` | 与解析并行 | 默认类似 defer | 按模块依赖图 | 现代应用入口 | MIME、CORS、路径或旧浏览器问题 |

不要机械背“脚本放在 body 最下面”。更可靠的判断方式是：脚本是否依赖 DOM、是否依赖另一个脚本、是否允许无序执行、失败是否会阻塞核心任务。

### 文档生命周期不是只有 onload

```text
document.readyState = loading
  -> DOM 构建完成
  -> DOMContentLoaded
  -> 图片、字体、iframe 等资源继续完成
  -> load
  -> 用户导航离开时 pagehide / visibilitychange
```

`DOMContentLoaded` 说明 DOM 已构建并且 defer/module 脚本已执行，不保证所有图片都下载完成。`load` 更晚。单页应用切路由时通常不会重新触发整个文档的 `DOMContentLoaded`，因此组件清理不能依赖“页面卸载”侥幸发生。

## 进阶层二：DOM、渲染树和可访问性树不是一棵树

浏览器会从同一份文档派生不同视角：

| 模型 | 主要回答 | 怎样观察 | 典型误区 |
|---|---|---|---|
| DOM | 节点、属性和父子关系是什么 | Elements、JavaScript DOM API | 以为源码就是 DOM |
| CSSOM | 哪些 CSS 规则和计算值生效 | Styles、Computed | 只看写下的值，不看最终值 |
| render tree | 哪些盒子参加布局和绘制 | Layout、Rendering、Performance | DOM 存在就一定可见 |
| accessibility tree | 辅助技术看到的角色、名称、状态和关系 | Accessibility 面板、屏幕阅读器 | ARIA 能修复所有错误语义 |

`display: none` 通常让元素退出布局，也不再出现在可访问性树；`visibility: hidden` 保留布局空间但不可见；`opacity: 0` 只是透明，元素仍可能占位、接收焦点或点击。故障排查必须先问“它从哪棵树里消失了”。

### 可访问名称怎样算出来

输入框的“名称”不等于视觉上旁边有一段文字。浏览器会根据原生 `label`、元素内容、`aria-labelledby`、`aria-label` 等规则计算 accessible name。优先级不当时，ARIA 甚至会覆盖可见标签。

推荐顺序：

1. 能用 `<label for>` 就使用原生标签。
2. 多段可见文字共同命名时使用 `aria-labelledby`。
3. 只有图标且没有合适可见文本时再考虑 `aria-label`。
4. `placeholder` 只提示格式，不承担永久标签职责。

`aria-describedby` 用于补充说明或错误信息，不替代名称。动态错误出现后，还要把控件的 `aria-invalid` 和说明关系同步更新。

## 进阶层三：表单是一台状态机

一个“确认故障”表单包含的不只是输入框和按钮：

```text
初始
  -> 用户编辑（dirty）
  -> 浏览器约束校验
  -> submitting
  -> 服务端认证、授权、业务校验、幂等处理
  -> success / rejected / unknown
```

`unknown` 很重要：客户端超时不代表服务端没有执行。危险操作应带幂等键或业务唯一号，并提供结果查询，不能看到超时就直接重发。

### 成功提交控件规则

浏览器构造表单数据时，不是所有 DOM 控件都会提交：

- 没有 `name` 的控件不会形成字段。
- `disabled` 控件通常不提交；`readonly` 控件通常仍提交。
- 未选中的 checkbox/radio 不提交对应值。
- 只有触发提交的 submit button 才携带自己的 name/value。
- 文件上传需要正确的 `enctype="multipart/form-data"`。

因此“界面显示了值”不能证明请求体包含该值。用 Network 面板检查实际 payload，再与服务端审计记录对照。

### 原生约束校验的职责边界

`required`、`minlength`、`pattern`、`type="email"` 能提前阻止明显错误，改善体验；它们不能承担安全边界，因为攻击者可以绕过页面直接调用 API。服务端仍必须：

1. 认证调用者是谁。
2. 授权其是否可操作目标租户和事件。
3. 校验字段类型、长度、枚举和业务状态。
4. 防止重复执行并写审计日志。
5. 对输出编码，避免存储型 XSS。

## 进阶层四：导航、URL 与页面状态

URL 是可观测和可恢复的状态入口。一个事件页面宜把资源身份放在路径，把可分享的筛选放在查询参数：

```text
/incidents/INC-1024?tab=timeline&from=2026-08-31T00:00:00Z
```

不要把访问令牌、真实个人数据或内部密钥放在 URL。URL 会进入浏览器历史、代理日志、Referer、监控与截图。

普通 `<a href>` 提供浏览器原生导航、复制链接、新标签页和无脚本降级。用点击事件模拟链接时，很容易破坏这些能力。单页应用使用 History API 时，服务端仍需把未知前端路由回退到正确入口文档，否则刷新深层路由会 404。

### 导航故障证据链

```text
点击无反应
  -> 元素是不是 link/button
  -> 是否被透明层遮挡
  -> 默认行为是否被 preventDefault
  -> URL 是否真的变化
  -> document 请求还是客户端路由
  -> 服务端 fallback、base path、静态资源路径是否正确
```

GitHub Pages 这类子路径部署尤其要核对 `base`。本地 `/assets/app.js` 能加载，不代表部署到 `/zero-to-aiops/` 后仍正确。

## 进阶层五：HTML 层的安全模型

### XSS、Trusted Types 与输出位置

跨站脚本攻击（XSS）不是只有 `<script>`。事件处理属性、危险 URL、SVG、模板语法或错误的 DOM API 都可能形成执行入口。安全处理取决于输出位置：文本、属性、URL、CSS 和 JavaScript 上下文不能共用一种转义规则。

优先策略：

- 纯文本使用 `textContent` 或框架安全插值。
- URL 经过协议白名单和规范化，不允许不可信 `javascript:`。
- 必须显示富文本时使用经过评审的白名单净化器，并限制来源。
- 使用 CSP 限制脚本来源；条件允许时用 Trusted Types 约束危险 DOM sink。
- 不把“前端隐藏按钮”当权限控制，服务端独立鉴权。

### CSP、SRI 与第三方资源

`CSP`（Content Security Policy）通过响应头限制脚本、样式、图片、连接等来源。`SRI`（Subresource Integrity）用哈希验证跨站静态资源内容。它们解决的问题不同：CSP 控制“允许从哪里加载”，SRI 检查“加载内容是否与预期一致”。

第三方脚本与页面处在同一前端信任边界，通常能读 DOM、监听输入和发请求。引入前要评估必要性、权限、版本锁定、可用性、CSP、隐私、退出方案和故障降级。

### iframe 沙箱

嵌入不可信内容时，`iframe sandbox` 可以限制脚本、表单、弹窗、导航和同源能力。不要随意同时开放 `allow-scripts` 与 `allow-same-origin` 给同源不可信内容，否则可能削弱沙箱价值。还要配置 `allow` 权限策略、`referrerpolicy` 和来源校验的 `postMessage`。

## 进阶层六：首屏性能、缓存和容量

HTML 层决定了浏览器最早能发现哪些关键资源。排查慢首屏时按链路拆解：

```text
DNS / TCP / TLS
  -> TTFB（首字节等待）
  -> HTML 下载
  -> 解析时发现 CSS、字体、图片、脚本
  -> CSS/脚本阻塞
  -> LCP 元素呈现
  -> 用户交互与 INP
```

关键实践：

1. 服务端尽早返回正确状态码、编码与 Content-Type。
2. 不把几十 MB 初始数据内嵌在 HTML。
3. 给图片写 width/height 或 aspect-ratio，减少布局偏移。
4. 对真正关键资源谨慎使用 preload；滥用会抢带宽。
5. HTML 通常短缓存或协商缓存，内容哈希静态资源可长期 immutable。
6. 用构建版本、资源哈希和发布 ID 证明页面与资源是否同一制品。

容量不是“DOM 最多支持多少节点”的固定数字。要基于目标终端测量 DOM 数量、布局成本、可访问性树、内存和交互延迟。10 万行事件应采用服务端分页或经过验证的虚拟化，同时保留键盘和屏幕阅读器可用路径。

## 进阶故障实验：解析、焦点与缓存三联演练

### 前置与边界

只在本地实验目录操作，使用合成事件数据。保存一份正常版本，确保能一键恢复。不要在生产页面修改 CSP、缓存或表单行为。

### 故障一：DOM 被解析器修正

1. 在 `p` 内放入 `div`，保存源码截图。
2. 用 Elements 记录最终 DOM。
3. 写下源码树与 DOM 树差异，并恢复合法结构。
4. 回归 CSS 选择器、无障碍树和水合测试。

### 故障二：弹窗关闭后焦点丢失

1. 使用原生 `dialog` 打开事件详情。
2. 故意在关闭后删除触发按钮或不恢复焦点。
3. 只用键盘操作，记录焦点落到 body 的现象。
4. 修复为关闭后聚焦仍存在的触发点；验证 Escape、Tab 顺序和背景不可误操作。

### 故障三：入口 HTML 与哈希资源版本错配

1. 准备 `app-old.js`、`app-new.js` 和两份入口 HTML。
2. 故意让新 HTML 指向不存在或旧接口契约的资源。
3. 用 Network 记录 404/版本不一致，而不是笼统写“白屏”。
4. 恢复一个完整制品；验证 HTML 的 build ID 与脚本的 build ID 一致。

### 故障复盘模板

```text
用户影响：谁不能完成什么任务
开始/发现/缓解/恢复时间：使用同一时区
页面版本：HTML build ID + 资源哈希
证据：Document、DOM、Accessibility、Console、Network
直接原因：最靠近故障的技术原因
促成条件：为何测试、灰度或缓存策略未拦住
修复：最小恢复动作
回滚：恢复到哪个完整制品，怎样证明成功
行动项：负责人、期限、验收方法
```

## 常用检查字典

| 工具/操作 | 用途 | 正常结果 | 常见坑 |
|---|---|---|---|
| View Source | 看初始响应 HTML | 能找到服务端返回骨架 | 把它误当成实时 DOM |
| Elements | 看实时 DOM、属性和无障碍信息 | 语义和名称正确 | 只改面板不回写源码 |
| Network / Doc | 看文档请求与响应头 | 200、正确类型和编码 | Service Worker/缓存掩盖新版本 |
| Console | 看解析和脚本错误 | 无阻断错误 | 只看红字，不保存请求证据 |
| Tab / Shift+Tab | 人工键盘检查 | 焦点可见、顺序合理 | 只用鼠标测试 |
| HTML validator | 静态检查无效标记 | 无关键结构错误 | “通过”不等于语义和业务正确 |

## 基础实验：做一个无需框架的事件页面

仓库提供了已实际通过类型检查、7 项自动测试和生产构建的共享实验：[frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)。在仓库根目录执行 `cd examples/frontend-incident-lab`、`npm ci`，分别运行 `npm run api` 和 `npm run dev`，打开原生页面即可对照本篇的语义、表单和可访问状态；完整故障模式与清理方法见实验 README。

### 前置条件

只需要文本编辑器和现代浏览器。创建空目录 `html-incident-lab`，将下面代码保存为 `index.html`。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>INC-1024 | 事件详情</title>
</head>
<body>
  <a href="#main-content">跳到主体</a>
  <header><h1>事件详情</h1></header>
  <main id="main-content">
    <article>
      <h2>INC-1024 数据库延迟</h2>
      <dl>
        <dt>等级</dt><dd>严重</dd>
        <dt>状态</dt><dd>调查中</dd>
      </dl>
      <form>
        <label for="note">处置记录</label>
        <textarea id="note" name="note" required minlength="5"></textarea>
        <button type="submit">保存记录</button>
      </form>
    </article>
  </main>
</body>
</html>
```

### 操作和预期结果

1. 双击打开文件，标签标题应包含事件号。
2. 只用 Tab 移动，应依次到“跳到主体”、输入框和按钮。
3. 留空提交，应看到浏览器原生必填提示。
4. 打开开发者工具，Elements 中应只有一个 `main`，表单控件应有名称。
5. 保存截图、DOM 检查记录和一份“键盘是否可完成”的说明。

### 如果没成功先看

- 中文乱码：文件是否 UTF-8，`meta charset` 是否位于 `head` 前部。
- 必填不生效：按钮是否真在 `form` 内，是否意外写了 `novalidate`。
- Tab 不到按钮：控件是否 `disabled` 或被 CSS 隐藏。
- 双击打开行为不同：本实验没有服务端；涉及模块、Fetch 或路由时应通过本地 HTTP 服务打开。

### 清理

关闭页面即可；目录是学习证据，确认已提交后再按需删除。

## 故障实验：故意破坏表单并形成证据链

### 注入故障

把 `<label for="note">` 改成 `for="notes"`，把按钮改为 `<div>保存记录</div>`。

### 现象与假设

- 点击“处置记录”文字不再把焦点移到输入框。
- Tab 无法到达“保存记录”，Enter/Space 也不触发原生按钮行为。

### 验证与修复

1. 在 Elements 的 Accessibility 区域看输入框名称。
2. 只用键盘走一遍，记录焦点顺序。
3. 恢复匹配的 `for="note"`，把 `div` 恢复为 `button type="submit"`。
4. 再次验证鼠标、Tab、Enter/Space 和空值校验。

### 回滚、清理与复盘

本实验只改本地文件，回滚就是恢复两处标记。复盘中记录“现象 -> DOM/无障碍证据 -> 原因 -> 修复 -> 回归项”，不要只写“标签写错了”。

## AIOps 中 HTML 的位置

- 事件台用语义结构呈现等级、影响、时间线、证据和审批状态。
- 指标图需要文本摘要，避免颜色和图片成为唯一信息源。
- 动态告警状态要让自动化测试与辅助技术都能观察。
- 表单原生约束减少明显错误输入，服务端校验守住安全边界。
- 页面 `title`、路由、构建版本和 Trace ID 能帮助值班人员确认自己看到的是哪一环境、哪一事件、哪一版本。

## 生产设计：事件控制台怎样不成为新的事故源

设计一个多租户 AIOps 事件控制台时，回答：

1. 哪些内容服务端渲染，哪些客户端加载；首屏失败如何降级。
2. 租户和权限由服务端如何校验，HTML 缓存如何避免串租户。
3. 10 万条事件怎样分页/虚拟化，而不是把所有行塞进 DOM。
4. 危险操作如何显示影响、审批、幂等结果和审计号。
5. 键盘、屏幕阅读器、低带宽和脚本失败时仍能完成哪些核心任务。
6. 如何用真实用户监控、前端日志和服务端 Trace 关联一次失败。

## 事故场景：发布后部分用户看到旧页面

不要先让用户清缓存。按证据顺序：

1. 记录页面 URL、响应头、HTML 中构建版本和发生时间。
2. 比较 CDN、反向代理、浏览器和 Service Worker 各层缓存键与 TTL。
3. 检查 HTML 是否错误设置长期 immutable 缓存，静态带哈希资源是否反而没缓存。
4. 用带缓存绕过参数的只读请求比较多个节点响应。
5. 缓解时优先定向刷新错误对象；评估全量 purge 的影响。
6. 修复后从不同网络验证 HTML 与资源清单同属一个版本，并准备回滚到上一完整制品。

## 高频故障排查

| 现象 | 先收什么证据 | 常见原因 | 修复方向 |
|---|---|---|---|
| 中文乱码 | 响应头、源码编码、meta | 编码不一致 | 统一 UTF-8 与服务端头 |
| 图片不显示 | Network 状态/类型、最终 URL | 路径、权限、CSP、MIME | 修路径或策略，别只改 alt |
| 表单字段缺失 | 请求体与元素属性 | 没有 `name`、被禁用、在 form 外 | 修正控件和契约 |
| 页面跳动 | Performance、图片尺寸 | 资源无尺寸、字体/内容后到 | 预留空间并优化加载 |
| 键盘不可用 | 焦点顺序、无障碍树 | `div` 模拟控件、焦点被遮 | 换原生语义并回归 |
| 刷新后页面 404 | 文档请求和网关路由 | SPA fallback 配置缺失 | 服务端正确回退入口文档 |
| 新旧资源混用 | HTML/资源版本与缓存头 | 非原子发布或缓存策略错误 | 原子制品、哈希资源、可回滚发布 |

## 面试表达

### 30 秒回答

HTML 是浏览器页面的语义与文档结构层。浏览器把 HTML 解析成 DOM，并结合 CSSOM 形成渲染树，同时派生无障碍树。生产中我不会只追求“能显示”，还会关注语义、表单服务端校验、XSS/CSP、资源和缓存、可访问性、页面性能以及发布版本一致性。

### 3 分钟回答主线

先说明 HTML 与 CSS、JavaScript 的边界；再画出 HTML 响应到 DOM、CSSOM、布局和绘制；用表单解释浏览器约束与服务端安全边界；用语义和无障碍树解释原生元素价值；最后从缓存、资源、安全、性能、版本和观测讲生产交付，并用一次表单或旧缓存事故说明证据化排查。

### 递进追问

1. **HTML 与 DOM 有何区别？** HTML 是输入序列化文本，DOM 是解析并可能被脚本修改后的对象模型。
2. **为什么不用 `div` 模拟按钮？** 原生按钮已经实现焦点、键盘、禁用、表单和无障碍语义，模拟控件成本和缺陷概率更高。
3. **浏览器校验可靠吗？** 可用于体验，不能作为安全边界；服务端必须独立认证、授权、校验和审计。
4. **页面白屏怎么查？** 区分文档未到、资源未到、脚本异常、根节点未渲染和样式隐藏，按 Network -> Console -> DOM -> 性能/运行时证据排查。
5. **生产如何发布？** HTML 短缓存或协商缓存，带内容哈希资源长缓存；一个版本的入口与资源清单原子发布，配合 canary、真实用户指标和整包回滚。

## 学习检查清单

- [ ] 能解释 HTML、DOM、CSSOM、渲染树和无障碍树。
- [ ] 能写标准文档骨架并解释每个元数据字段。
- [ ] 能选择语义元素，不用 `div` 假装所有控件。
- [ ] 能写有 label、name、约束和状态提示的表单。
- [ ] 能用 Network、Elements、Console 和键盘形成排障证据。
- [ ] 能说明 XSS、CSP、同源和服务端校验边界。
- [ ] 能完成基础与故障实验并验证修复。
- [ ] 能回答缓存一致性和前端发布系统设计题。

## GitHub 学习证据

建议提交：

```text
html-incident-lab/
  index.html
  README.md
  evidence/
    keyboard-check.md
    accessibility-tree.png
    form-validation.png
  postmortem/
    broken-label-and-button.md
```

README 写清运行方式、预期结果、浏览器版本、验证时间和已知边界。截图可以证明现象，Markdown 复盘证明你能解释证据；两者都不要包含真实事件、账号、Token 或内部地址。

## 下一步

继续学习 [CSS](./css.md) 让语义结构变成可适配、可维护的视觉界面，再学习 [JavaScript](./javascript.md) 为页面加入受控行为。HTML 是两者的共同地基。
