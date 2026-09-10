# CSS 技术栈深讲

> 学习目标：从零理解 CSS 如何选中元素、参与层叠、计算尺寸并完成布局和绘制；能使用盒模型、Flexbox、Grid、响应式、变量、状态和动画构建 AIOps 控制台；能用开发者工具定位覆盖失败、溢出、抖动、性能和可访问性问题，并能回答生产架构与连续面试追问。

## 官方资料

- [W3C：CSS Snapshot 2026](https://www.w3.org/TR/css-2026/)
- [CSS Working Group 规范索引](https://www.w3.org/Style/CSS/current-work)
- [MDN：CSS 指南](https://developer.mozilla.org/docs/Web/CSS)
- [MDN：层叠、优先级与继承](https://developer.mozilla.org/docs/Web/CSS/CSS_cascade)
- [MDN：盒模型](https://developer.mozilla.org/docs/Learn_web_development/Core/Styling_basics/Box_model)
- [MDN：Flexbox](https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout)
- [MDN：Grid](https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

CSS 由多个模块规范组成，没有一个“CSS 3 全部属性”单页清单。生产使用新能力前，要查目标浏览器支持、回退方案和实际设备表现。

## 官方知识地图与本文边界

```text
CSS syntax（样式语法）
  -> selectors（选择器）/ declarations（声明）/ values（值）/ units（单位）
  -> cascade（层叠）/ specificity（特异性）/ inheritance（继承）/ custom properties（自定义属性）
  -> box model（盒模型）/ normal flow（正常流）/ formatting contexts（格式化上下文）
  -> flex（弹性布局）/ grid（网格布局）/ position（定位）/ stacking context（堆叠上下文）
  -> responsive（响应式）/ container and media queries（容器与媒体查询）
  -> typography（文字排版）/ color（颜色）/ states（状态）/ motion（动效）
  -> rendering performance（渲染性能）/ accessibility（可访问性）/ architecture（样式架构）
```

本文重点是现代 Web 应用的样式系统和生产排障，不穷举每个属性，也不把某个 UI 组件库等同于 CSS 本身。

## 学习顺序

```text
选择器和声明 -> 层叠 -> 盒模型 -> 正常流
  -> Flex/Grid -> 响应式 -> 设计令牌 -> 性能/可访问性 -> 故障实验
```

## 场景开场

事件控制台在开发者笔记本上看起来正常，上线后却出现三件事：手机横向滚动、严重告警颜色在深色模式下看不清、一个“紧急覆盖”样式只能靠不断加 `!important` 才生效。

这些不是三个孤立的“美工问题”。它们分别暴露了尺寸约束、可访问性和层叠架构没有被设计。

## 一句话人话版

CSS（Cascading Style Sheets，层叠样式表）是一套根据选择器和层叠规则，把颜色、尺寸、间距和布局等样式应用到文档元素上的语言。

## 小白先问

### 为什么叫“层叠”

同一元素的同一属性可能来自浏览器默认、用户偏好、外部样式、组件规则、状态规则和行内样式。浏览器按来源、层、重要性、作用域、优先级和出现顺序决定最终值，这个竞争过程就是 cascade。

### CSS 从上到下执行吗

源码顺序只是层叠的最后一部分。更具体的选择器可能战胜后写的低优先级规则；继承、`@layer`、`!important` 和行内样式也会影响结果。

### Flex 和 Grid 选哪个

Flexbox 更适合一维主轴排列，例如工具栏；Grid 更适合同时控制行列，例如仪表盘卡片。两者经常嵌套使用，不是互相替代。

### CSS 会导致页面卡顿吗

会。复杂选择器、巨量 DOM、频繁布局、昂贵阴影/滤镜、大图、字体加载和动画都可能增加 style、layout、paint 或 composite 成本。

## 一条样式怎样生效

```text
CSS text（样式文本）-> parser（解析器）-> CSSOM（样式对象模型）
DOM element（文档元素）-> selector matching（选择器匹配）-> cascade winner（层叠获胜声明）
  -> computed value（计算值）-> used value（布局使用值）-> actual value（实际实现值）
  -> layout（布局）-> paint（绘制）-> compositing（合成）
```

```css
.incident-card[data-severity="critical"] {
  border-inline-start: 0.4rem solid var(--severity-critical);
  padding: 1rem;
}
```

- `.incident-card[...]` 是选择器，确定规则候选对象。
- 大括号内是声明块；属性和值组成声明。
- `var(...)` 读取自定义属性；如果变量未定义且没有回退，该声明可能无效。
- `border-inline-start` 是逻辑属性，会随书写方向映射到正确边。

## 核心概念一：层叠、优先级和继承

- **是什么**：多个候选声明竞争最终计算值的规则。
- **为什么需要**：浏览器默认、基础样式、组件、主题和临时状态需要共存。
- **怎么工作**：先比较来源与重要性、级联层，再比较 specificity（选择器特异性），适用时比较作用域接近程度，最后比较源码顺序。
- **怎么看/怎么用**：Elements 的 Styles 看被划掉规则，Computed 看最终值和来源。
- **坏了怎么查**：不要先加 `!important`；先确认选择器是否匹配、声明是否有效、层级和加载顺序。

优先级可大致理解为：ID > 类/属性/伪类 > 元素/伪元素。`#app .card` 比 `.card` 更难覆盖，但“数字越大永远赢”仍不完整，因为层和来源可能先决定胜负。

```css
@layer reset, base, components, utilities;

@layer base {
  button { font: inherit; }
}

@layer components {
  .action-button { background: var(--action-bg); }
}
```

`@layer` 明确层顺序，能降低靠选择器军备竞赛维护系统的成本。

## 核心概念二：盒模型与尺寸

```text
margin（外边距）
  border（边框）
    padding（内边距）
      content（内容区）
```

默认 `content-box` 下，声明的 `width` 只控制内容宽；padding 和 border 会继续增加外部尺寸。应用通常统一：

```css
*, *::before, *::after { box-sizing: border-box; }
```

- **是什么**：浏览器将元素计算为内容、内边距、边框和外边距区域。
- **为什么需要**：布局必须有可预测尺寸。
- **怎么工作**：宽高、min/max、内在尺寸、可用空间和溢出共同决定最终 used size。
- **怎么看/怎么用**：Elements 的 Box Model 面板看每层像素值。
- **坏了怎么查**：横向滚动先找超宽元素、固定宽、长字符串、负外边距和 `100vw` 的滚动条差值。

对可变内容优先使用 `min-width: 0`、`max-width: 100%`、`overflow-wrap: anywhere` 等明确约束，不能假设事件名永远很短。

## 核心概念三：正常流、定位和堆叠上下文

没有特殊布局时，块元素按文档流垂直排列，行内内容在行盒内流动。`position: absolute` 会脱离正常流；`fixed` 常相对视口；`sticky` 在滚动容器边界内吸附。

`z-index: 999999` 仍可能盖不住弹窗，因为 `transform`、`opacity`、定位和其他属性可能建立新的 stacking context（堆叠上下文）。子元素无法跳出父堆叠上下文与外部任意比较。

排查遮挡顺序：

1. 找出两个元素各自所在堆叠上下文。
2. 检查祖先的 `transform`、`opacity`、`isolation`、定位和 `z-index`。
3. 检查是否被 `overflow: hidden` 裁剪。
4. 只在设计系统定义的层级令牌中调整，不无限增大数字。

## Flexbox 与 Grid

### Flexbox：一维分配

```css
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toolbar__search {
  flex: 1 1 18rem;
  min-width: 0;
}
```

`flex: 1 1 18rem` 依次表示允许增长、允许收缩、基础尺寸约 18rem。实际值还受内容内在尺寸和容器空间影响。

### Grid：二维轨道

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  gap: 1rem;
}
```

这会根据可用宽度自动排卡片；单列最小值不会超过容器。Grid 中 `fr` 分配剩余空间，不等于固定百分比。

## 响应式：不要只背几个设备宽度

```css
.incident-layout {
  container-type: inline-size;
}

@container (min-width: 48rem) {
  .incident-layout__content {
    display: grid;
    grid-template-columns: 2fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
  }
}
```

Media query 关注视口或设备偏好；container query 关注组件容器。响应式还包括放大 200%、长中文/英文、横竖屏、键盘弹出、深色模式、减少动画和高对比偏好。

## 变量、设计令牌与主题

```css
:root {
  --space-2: 0.5rem;
  --space-4: 1rem;
  --surface: #ffffff;
  --text: #172033;
  --severity-critical: #b42318;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface: #111827;
    --text: #f3f4f6;
    --severity-critical: #ff8a80;
  }
}
```

自定义属性参与层叠并在使用处解析，因此可以随主题和局部容器变化。生产令牌应表达语义（`--text-muted`），避免把实现颜色（`--gray-500`）直接散落在业务组件。

## 状态与可访问性

一个交互控件至少设计 default、hover、focus-visible、active、disabled、loading、error 和 success。不要只靠颜色区分严重等级，配合文字、图标和结构。

```css
.action-button:focus-visible {
  outline: 0.2rem solid #2563eb;
  outline-offset: 0.2rem;
}

.action-button[aria-busy="true"] {
  cursor: progress;
}
```

不要用 `outline: none` 后不提供替代焦点。视觉隐藏文本也要采用经过验证的 visually-hidden 模式，不能用 `display: none` 指望屏幕阅读器继续读取。

## 动画与渲染性能

多数情况下，动画 `transform` 和 `opacity` 比动画 `width`、`height`、`top` 更容易只触发合成，但不是“永远免费”。大量图层会消耗 GPU 内存，滤镜和巨型阴影仍可能重绘。

性能证据顺序：

1. 用 Performance 记录真实操作。
2. 看 Style、Layout、Paint、Composite 各占多少。
3. 定位触发者和受影响节点数。
4. 一次只改一个假设，比较前后记录。
5. 在低端设备、缩放和真实数据量下回归。

## CSS 架构与变更安全

- 采用一致命名与边界：全局 reset/base、令牌、布局、组件、工具类各自职责清楚。
- 避免深层 DOM 选择器把样式绑死在结构上。
- 组件对外暴露变体/状态，不允许业务页面穿透修改内部任意节点。
- 关键页面建立视觉回归、键盘回归和多视口检查。
- 发布使用带哈希 CSS 文件，HTML 与资源清单作为同一制品；回滚整包，不手工覆盖某个线上样式。
- 第三方 CSS 要锁版本、评估许可和全局污染范围。

## 进阶层一：级联不是只比较选择器分数

当多个声明竞争同一属性时，浏览器大致按下面顺序裁决：

```text
相关性（选择器是否匹配、条件规则是否成立）
  -> 来源与重要性（浏览器、用户、作者、动画、过渡、!important）
  -> cascade layer（级联层）
  -> specificity（特异性）
  -> scoping proximity（作用域接近程度，适用时）
  -> 源码顺序
```

所以“选择器分数更高就一定赢”是不完整的。不同来源、`!important`、级联层和动画/过渡都可能先决定结果。

### 级联层怎样控制大型项目

```css
@layer reset, base, components, utilities, overrides;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
}

@layer components {
  .incident-card { border-inline-start: 0.25rem solid var(--severity-color); }
}

@layer utilities {
  .visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; }
}
```

层顺序在团队设计时就明确，组件不必用更深选择器与工具类“军备竞赛”。注意：普通声明中后声明的层优先；`!important` 的层顺序会反转，以保护低层重要规则。实际排查应直接看 DevTools 显示的 layer，不要凭记忆猜。

### specificity 的实用心智模型

可以把特异性看成三栏：ID；类/属性/伪类；元素/伪元素。内联样式、`!important` 和来源不属于这个三栏比较，必须先在更高层级处理。

```css
#app .card p        { color: red; }   /* 1-1-1 */
.card[data-state] p { color: blue; }  /* 0-2-1 */
:where(.card) p     { color: green; } /* 0-0-1，:where 本身为零 */
```

`:where()` 适合提供容易覆盖的默认值；`:is()`、`:not()` 的特异性来自参数中最强选择器。复杂选择器能匹配不等于易维护，优先设计边界而不是算分获胜。

### 值从声明到像素经历哪些阶段

一个属性的值会经历 declared、cascaded、specified、computed、used、actual 等阶段。`width: 50%` 的 computed value 可能仍是百分比，到了布局阶段才根据包含块得到 used value。字体栅格化或设备像素还可能让 actual value 与理论值略有差异。

这解释了为什么只看源码中的 `width` 不够：排障要同时看获胜规则、Computed 和实际盒模型尺寸。

## 进阶层二：格式化上下文决定布局规则

CSS 不只有“块元素和行内元素”。不同 formatting context（格式化上下文）有不同的子项布局算法：

| 上下文 | 常见创建方式 | 主要规则 | 高频故障 |
|---|---|---|---|
| block formatting context | 根元素、`flow-root`、部分 overflow/position 场景 | 块沿块轴排列，涉及外边距折叠 | 浮动包不住、margin 穿透 |
| inline formatting context | 文本和行内容 | 行盒、基线、换行 | 图标文字不齐、长词溢出 |
| flex formatting context | `display:flex` | 主轴分配、交叉轴对齐 | `min-width:auto` 导致不收缩 |
| grid formatting context | `display:grid` | 行列轨道与网格区域 | 隐式轨道意外变大 |
| table formatting context | 原生表格/对应 display | 表格算法协商列宽 | 巨长字段撑宽整表 |

### containing block：绝对定位到底相对谁

百分比尺寸和 positioned 元素常依赖 containing block（包含块）。它不一定是视觉上最近的父元素。定位、transform、contain 等属性都可能改变参照系。

排查绝对定位错位：

1. 在 Elements 中逐级检查祖先的 `position`、`transform`、`filter`、`contain`。
2. 确认 top/right/bottom/left 或 inset 百分比相对哪个尺寸。
3. 检查滚动容器和裁剪边界。
4. 不要靠增加随机偏移修补错误参照系。

### margin collapsing 与 flow-root

普通块流中，相邻垂直 margin 可能折叠；父元素没有边框、内边距或行内内容时，首/末子项 margin 也可能与父元素折叠。Flex/Grid 子项的 margin 不按同样规则折叠。

`display: flow-root` 可以创建新的块格式化上下文，常用于包住浮动和隔离外部布局，但应理解原因，避免把 `overflow: hidden` 当万能清除方案并意外裁剪内容。

## 进阶层三：内在尺寸与“为什么 min-width:0 能救命”

浏览器布局会考虑内容的内在尺寸：

- `min-content`：在允许换行处尽量收窄后的最小尺寸。
- `max-content`：不主动换行时内容希望占用的尺寸。
- `fit-content`：在可用空间和内在边界之间取值。

Flex 子项默认 `min-width: auto`，常以内容最小尺寸为下限。一个很长的 request ID 会让子项拒绝继续缩小，最终撑破容器。

```css
.toolbar__main {
  min-inline-size: 0; /* 允许 flex 子项小于内容的自动最小宽度 */
}

.request-id {
  overflow-wrap: anywhere; /* 极长不可断字符串也允许换行 */
}
```

这不是“背一个神奇修复”。证据应包括：哪个 flex item 的 min-size 限制了收缩、内容的 min-content 是什么、修复后是否影响可读性。

## 进阶层四：Flexbox 分配算法与常见误判

`flex: 1` 通常展开为 `flex-grow:1; flex-shrink:1; flex-basis:0%`，不等同于“宽度就是一份”。分配过程会考虑 flex basis、可用空间、最小/最大尺寸、冻结项和舍入。

| 属性 | 控制什么 | 新手误区 |
|---|---|---|
| `flex-basis` | 分配空间前的基础尺寸 | 以为永远等于 width |
| `flex-grow` | 有剩余空间时怎样分 | 以为值就是百分比 |
| `flex-shrink` | 空间不足时怎样收缩 | 忽略基础尺寸和 min-size |
| `align-items` | 单行内交叉轴对齐 | 与 `align-content` 混淆 |
| `gap` | 项之间稳定间距 | 用子项 margin 导致边缘额外间距 |

故障案例：左右布局中左侧固定、右侧 `flex:1` 仍溢出。先检查右侧 `min-inline-size`、长内容和后代固定宽度，再看父容器是否有可用空间。

## 进阶层五：Grid 轨道算法与响应式组件

```css
.incident-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  gap: var(--space-4);
}
```

这里不是简单的“自动几列”：

- `minmax()` 给轨道最小和最大边界。
- `auto-fit` 会折叠空轨道，让已有卡片扩展。
- `min(18rem, 100%)` 防止容器比 18rem 更窄时仍溢出。
- `1fr` 分配的是扣除固定轨道、gap 等之后的剩余空间。

`auto-fill` 会保留可放置的空轨道，`auto-fit` 会折叠空轨道。选择取决于希望空位保留还是卡片拉伸，而不是谁“更高级”。

容器查询适合可复用组件：同一个事件卡片放在主区和窄侧栏时按自身容器变化，不依赖整个 viewport。

```css
.panel { container-type: inline-size; }

@container (min-width: 42rem) {
  .incident-card { grid-template-columns: 10rem 1fr auto; }
}
```

## 进阶层六：堆叠上下文与弹层事故

`z-index: 999999` 仍可能盖不过另一个元素，因为比较首先发生在各自祖先的 stacking context（堆叠上下文）中。常见创建条件包括 positioned + 非 auto z-index、opacity 小于 1、transform、filter、isolation、contain 等。

排查顺序：

```text
弹层被遮挡
  -> 找弹层所在堆叠上下文
  -> 找遮挡元素所在堆叠上下文
  -> 比较两个上下文在共同祖先中的顺序
  -> 检查 overflow / clip 是否直接裁剪
  -> 决定使用顶层 top layer、portal 或调整上下文
```

原生 `dialog.showModal()` 和 Popover API 可进入浏览器 top layer，避免部分 z-index 竞赛；但仍需设计焦点、关闭、背景交互和兼容性降级。

## 进阶层七：style、layout、paint、composite

浏览器一次视觉更新可能经过：

```text
JavaScript 改状态或 DOM
  -> style recalculation（重新计算样式）
  -> layout（几何尺寸和位置）
  -> paint（生成绘制记录/位图）
  -> composite（合成图层）
```

并非每次都走完全部阶段。改变 `color` 常需 paint，不一定 layout；改变几何属性通常需要 layout；适当条件下 transform/opacity 可主要在 composite 处理。但图层提升有内存成本，`will-change` 不能全站乱加。

### 强制同步布局与布局抖动

如果代码交替写样式、读布局，浏览器可能被迫立即完成尚未执行的布局：

```js
for (const row of rows) {
  row.style.width = `${target}px`;
  console.log(row.offsetWidth); // 写后立刻读，可能重复触发布局
}
```

改进方向是批量读取、批量写入，减少受影响节点，并用 Performance 证明确实降低 Layout 时间。不要只依据“某属性理论上快”。

### Core Web Vitals 的 CSS 责任

- LCP：关键内容样式和字体阻塞、LCP 图片布局会影响时间。
- CLS：图片无尺寸、字体替换、异步插入内容会造成布局偏移。
- INP：巨量样式计算、布局与绘制会拉长交互响应。

前端指标要携带 route、release、设备类别和网络信息，但避免把用户输入、Token 和敏感 URL 作为标签造成泄露与高基数。

## 进阶层八：CSS 工程治理与发布

一套可维护的层次可以是：

```text
reset：统一浏览器差异
  -> base：元素基础语义样式
  -> tokens：颜色、字号、间距、层级、动效语义
  -> layout：页面级布局原语
  -> components：组件内部规则和状态
  -> utilities：单一职责工具
  -> overrides：受控、带退出计划的临时覆盖
```

生产门禁至少覆盖：

1. 关键页面多视口截图差异。
2. 200%/400% 缩放与长中文、长英文、长 URL。
3. 键盘焦点、深色模式、高对比和 reduced motion。
4. 未使用 CSS 与首屏阻塞预算。
5. 主流目标浏览器的兼容性和 `@supports` 降级。
6. 入口 HTML 与带哈希 CSS 的原子制品发布。

## 进阶故障实验：从 computed style 找到根因

### 故障一：级联层覆盖错误

1. 在 `overrides` 层故意把 critical 卡片颜色改成普通灰色。
2. 在 Styles 中找到获胜声明、层和来源文件。
3. 不使用更高特异性硬压，删除过期 override 或修正层职责。
4. 回归 light/dark/high-contrast 和截图测试。

### 故障二：Flex 长内容横向溢出

1. 把 request ID 改成 200 个连续字符。
2. 在 390px 视口记录 `innerWidth`、`scrollWidth` 和溢出节点。
3. 检查 flex item 的自动最小尺寸，应用 `min-inline-size:0` 与安全换行。
4. 验证文本仍可选择、复制和完整查看。

### 故障三：弹窗被 transform 祖先困住

1. 给页面容器加 `transform: translateZ(0)`，让 fixed 弹层行为改变。
2. 记录 stacking context、containing block 与裁剪祖先。
3. 将模态层放入合适的顶层/portal，或移除不必要的上下文。
4. 回归滚动、缩放、键盘焦点和屏幕阅读器。

### 故障四：布局抖动

1. 移除卡片图片尺寸并延迟加载图片。
2. 用 Performance/布局偏移高亮记录发生变化的节点。
3. 恢复尺寸或 aspect-ratio，并比较前后 CLS 证据。
4. 保存实验环境、视口、网络条件和两次记录，避免只保存结论。

## 常用属性/工具字典

| 项 | 作用 | 怎么观察 | 常见坑 |
|---|---|---|---|
| `display` | 选择布局参与方式 | Computed/Layout 面板 | 以为设了 `flex` 子孙都自动 flex |
| `box-sizing` | 决定宽高包含哪些盒层 | Box Model | 组件和全局规则不一致 |
| `min/max-*` | 限制可伸缩边界 | 改窗口与长内容 | 只写固定 width |
| `overflow` | 控制溢出、滚动和裁剪 | 查 scroll container | `hidden` 顺手裁掉焦点/弹层 |
| `position` | 改定位上下文 | 查 containing block | absolute 没有合适定位祖先 |
| `z-index` | 同一堆叠规则内排序 | 查 stacking context | 盲目加大数字 |
| `clamp()` | 在最小/首选/最大间取值 | 多视口测量 | 单位和可访问放大没验证 |
| `var()` | 读取自定义属性 | Computed 展开变量 | 变量未定义且无 fallback |
| `@media` | 按环境条件应用规则 | DevTools 模拟偏好 | 只按设备品牌断点 |
| `@container` | 按容器尺寸适配组件 | Layout 面板 | 祖先没设置容器类型 |

## 基础实验：自适应事件卡片

仓库提供了共用样式和三个可运行界面：[frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)。在仓库根目录执行 `cd examples/frontend-incident-lab`、`npm ci`，分别运行 `npm run api` 与 `npm run dev`；用 390px、200% 缩放和键盘检查原生/Vue/React 三个页面，再改 `src/style.css` 注入本篇故障。

### 前置与文件

在 [HTML 深讲](./html.md) 的实验目录新增 `styles.css`，并在 HTML `head` 加 `<link rel="stylesheet" href="styles.css">`。

```css
*, *::before, *::after { box-sizing: border-box; }

:root {
  color-scheme: light dark;
  --surface: Canvas;
  --text: CanvasText;
  --critical: #b42318;
}

body {
  margin: 0;
  font: 1rem/1.6 system-ui, sans-serif;
  color: var(--text);
  background: var(--surface);
}

main {
  width: min(70rem, 100% - 2rem);
  margin-inline: auto;
}

.incident-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  gap: 1rem;
}

.incident-card {
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-inline-start: 0.4rem solid var(--critical);
  border-radius: 0.75rem;
  padding: 1rem;
  overflow-wrap: anywhere;
}

button:focus-visible {
  outline: 0.2rem solid #2563eb;
  outline-offset: 0.2rem;
}
```

把三个 `article class="incident-card"` 放入 `div class="incident-grid"`。其中一个标题故意使用超长无空格字符串。

### 验证

1. 在 1440、768、390 像素宽度下，页面不应横向滚动。
2. 放大 200%，文字不应被裁切，按钮焦点仍可见。
3. 系统切换深色模式，文字与背景仍可读。
4. Elements 的 Layout 面板应显示 Grid；Computed 中能追到令牌来源。

### 如果没成功

- CSS 404：检查 `link` 相对路径和 Network 的 MIME type。
- Grid 不生效：检查类名、声明是否被划掉、浏览器支持。
- 仍横向滚动：用 Console 比较 `document.documentElement.scrollWidth` 和 `innerWidth`，逐个隐藏可疑元素。
- 深色模式失真：检查硬编码背景/文字是否绕过语义令牌。

### 清理

实验文件可作为证据保留；不再需要时删除整个本地实验目录，不影响系统配置。

## 故障实验：制造横向溢出与样式覆盖失败

### 注入

```css
.incident-card { width: 600px; }
#app main .incident-card { color: #888 !important; }
```

前置检查：确保实验副本的 `main` 外面确实有 `id="app"` 的祖先，例如给 `body` 添加该 ID；没有这个祖先，第二条选择器不匹配，实验不会产生预期覆盖。只在个人实验副本添加，清理时同时移除本课新增的 ID。

在 390 像素视口观察横向滚动，再尝试用 `.incident-card { color: red; }` 覆盖颜色。

### 证据、假设与验证

1. 记录 `scrollWidth` 与 `innerWidth`，在 Elements 看卡片盒模型。
2. Styles 面板确认新颜色规则被划掉，找到 `!important` 和更具体选择器。
3. 假设分别是固定宽超出可用空间、层叠规则不可控。
4. 删除故障规则，恢复流式 Grid；把颜色放入组件层或语义令牌，不追加另一个 `!important`。
5. 在三种视口、深色模式和键盘焦点下回归。

### 回滚与复盘

回滚就是删除两条故障规则。复盘记录溢出节点、最终计算值来源、为何旧修法风险更高，以及加入的视口/层叠回归项。

## AIOps 场景

- 告警等级、确认状态和数据新鲜度要用语义令牌统一表达，避免不同页面颜色含义冲突。
- 大屏和事件台需要容器适配，而不是为每种屏幕复制页面。
- 加载、超时、部分失败、无权限和只读模式都应有稳定视觉状态。
- 真实用户监控可关联 CLS（布局偏移）、LCP（主要内容呈现）、INP（交互响应）与发布版本。
- 前端异常检测可以发现某版本的横向溢出、交互退化或关键 CSS 加载失败，但修复必须回到可复现的布局/资源证据。

## 生产设计题：多团队仪表盘 CSS 怎样治理

参考主线：

1. 设计分层令牌、基础样式、布局原语和组件边界。
2. 用 `@layer` 或构建顺序显式控制覆盖关系。
3. 允许产品主题变化，但禁止业务页面直接依赖底层颜色实现。
4. 建立可访问性、关键视口、视觉快照和性能预算。
5. CSS/字体/图片都进入同一可追踪制品，采用哈希缓存、灰度和整包回滚。
6. 监控真实用户的核心 Web 指标、资源失败和版本分布。

## 事故题：发布后弹窗被图表遮住

先保存页面版本、DOM 截图和最小复现；再检查弹窗与图表的堆叠上下文、祖先 transform 和 overflow，而不是直接把 `z-index` 改成极大值。缓解可回滚引入新上下文的变更；永久修复把 overlay 挂到受控顶层 portal、定义层级令牌，并补图表页面回归。评估影响时还要检查下拉框、提示气泡和键盘焦点是否一起受影响。

## 高频排障表

| 现象 | 证据顺序 | 常见原因 | 修复方向 |
|---|---|---|---|
| 规则不生效 | 匹配 -> 语法 -> 层叠 -> computed | 选择器错、属性无效、被覆盖 | 修边界，不堆 `!important` |
| 横向滚动 | scrollWidth -> 超宽节点 -> box | 固定宽、长词、100vw、负 margin | 流式约束与长内容回归 |
| 高度塌陷 | DOM/布局上下文 | 绝对定位、浮动、错误容器 | 恢复正常流或明确布局 |
| sticky 失效 | 滚动祖先和 inset | 祖先 overflow、无 `top`、空间不足 | 明确滚动容器和边界 |
| z-index 失效 | 堆叠上下文树 | transform/opacity/裁剪 | 调整上下文架构 |
| 页面抖动 | Performance/布局偏移 | 图片无尺寸、字体、异步内容 | 预留空间、字体策略 |
| 颜色不可读 | 对比度与状态含义 | 主题令牌缺失、只靠颜色 | 语义令牌+文字/图标 |
| 动画卡顿 | Performance 的 layout/paint | 动画尺寸、节点过多、滤镜 | 减少工作并尊重 reduced-motion |

## 面试表达

### 30 秒回答

CSS 通过选择器匹配元素，再由来源、级联层、优先级和顺序决定最终计算值；这些值进入盒模型、布局、绘制和合成。工程上我重点控制层叠边界、响应式和令牌体系，并用 Computed、Layout、Performance 和可访问性检查排查，而不是靠增加 `!important` 和 z-index。

### 3 分钟回答主线

先解释 CSSOM 与浏览器渲染路径；再讲层叠、继承、盒模型和格式化上下文；用 Flex/Grid/container query 说明布局选择；用令牌与级联层说明多人维护；最后讲焦点/对比度、layout/paint 性能、带哈希资源发布、真实用户指标和整包回滚。

### 连续追问

1. **优先级如何计算？** 先说明它只是层叠中的一步，再讲 ID、类/属性/伪类、元素/伪元素和源码顺序。
2. **为什么 `z-index` 无效？** 元素可能处于不同堆叠上下文，必须先比较祖先上下文。
3. **Flex 与 Grid 取舍？** 一维内容分配优先 Flex，二维轨道优先 Grid，以内容和布局约束选择。
4. **为什么页面布局抖？** 资源或异步内容在初始布局后改变尺寸；用布局偏移证据定位，预留空间并验证字体/图片。
5. **大规模如何治理？** 语义令牌、分层、低耦合组件、视觉/可访问回归、性能预算、版本制品和渐进发布。

## 学习检查清单

- [ ] 能解释层叠、优先级、继承和自定义属性。
- [ ] 能从 Box Model 定位尺寸和溢出。
- [ ] 能选择正常流、Flex、Grid、定位，而不是试错堆属性。
- [ ] 能找到堆叠上下文和滚动容器。
- [ ] 能设计多视口、深色、放大和减少动画状态。
- [ ] 能用开发者工具比较 style/layout/paint/composite。
- [ ] 能完成故障注入并留下前后证据。
- [ ] 能设计多人维护、灰度和回滚方案。

## 老师带你用“约束”思考布局

先画一条工具栏：左边搜索框，右边刷新按钮。你希望宽屏一行，窄屏换行，长事件编号不能把页面撑破。这三句话是约束，比“搜索框宽 600px”更接近需求。CSS 的学习从这里开始：给出可伸缩范围、换行规则和最小可读尺寸，让浏览器在当前空间里求解。

学生问：“`width:100%` 为什么还超出父元素？”老师让你打开 Box Model，看看这 100% 是内容宽还是包含内边距和边框；再看祖先宽度、margin、后代不可断字符串和滚动条。一次只验证一个尺寸来源，别一口气改五个属性，否则你不知道哪一步真的解决问题。

### Flex 收缩不是把所有盒子等比例压扁

`flex-basis` 是分配前的基础尺寸，`grow` 决定剩余空间怎么分，`shrink` 参与不足空间的分摊，还要满足最小和最大尺寸。学生常问：“都写 `flex:1`，为什么一块更宽？”因为内容最小尺寸、内边距、边框或其他限制还在参与布局。

给搜索框容器加 `min-inline-size:0`，是在允许它突破自动最小尺寸下限，不是强制它变成零宽。对于一段长 request ID，再用合适的换行或省略策略处理内容，二者职责不同。你可以直接读[Flex 自动最小尺寸规则](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)，把 min-content 理解为内容在允许换行位置下仍需要的最小空间。

### 从“规则被覆盖”到“规则没参与竞争”

样式没生效至少有三类原因。第一，文件没加载或语法无效；第二，选择器/媒体条件不匹配；第三，匹配了却在层叠中输掉。老师要求你按这个顺序查，因为给未加载的文件再加十个 `!important` 也没用。

Scoped proximity（作用域接近程度）在适用的 `@scope` 情况下参与后续裁决，特异性、来源和层级的优先次序要分清。普通声明中，未分层的作者规则通常优先于已分层规则；把旧 CSS 一部分放进 layer 后，被未分层旧规则覆盖就是典型迁移问题。对照[层叠规范](https://www.w3.org/TR/css-cascade-6/)，在 DevTools 查看获胜来源，比只记“后写赢”更可靠。

### 一个十分钟的测量练习

使用本文卡片实验，前提是已通过本地 HTTP 打开并加载 `styles.css`。在浏览器开发者工具将视口调为 390px，把卡片内编号改成 200 个连续英文字母。基础验证先记录 `document.documentElement.scrollWidth` 和 `document.documentElement.clientWidth`，无横向溢出时二者应相等。

只给卡片加 `min-width:600px`，预期前一个值大于后一个值。不要马上加 `body {overflow-x:hidden}`，这只是藏住内容。用 Elements 点击卡片，找出限制它收缩的规则，取消该条声明，再比较两个数值。恢复后检查编号能否完整复制、按钮是否仍可聚焦。这个实验把故障、尺寸证据、因果验证和功能回归连在一起。

若数值没变化，确认规则确实生效，或者父层已经裁剪了超宽内容；若取消规则仍溢出，找其他固定宽子项。最后从源码删除故障声明，刷新确认修复真实落盘；开发者工具临时修改不会自动保存到你的文件。截图注明视口、缩放和浏览器，之后才有可比较的基线。

### “颜色正确”也需要语义和状态

严重告警不能只靠红色，因为色觉差异、黑白打印、主题和显示环境都会改变可识别性。把颜色与文字等级、图标、边框或结构配合；令牌命名表达 `critical`（严重）或 `warning`（警告）语义，业务代码不需要知道底层色号。

加载状态同样不能只让按钮变灰。文字说明在加载什么，焦点仍要可预测，失败后允许重新操作。禁用与繁忙不是一个状态：一个按钮可能需要保留焦点并说明正在执行，而完全 disabled 会改变键盘交互。这里 CSS 表现、HTML 属性和 JavaScript 状态必须一致。

### 性能课堂：先解释一帧里做了什么

你每隔几十毫秒改一次 1000 张卡片的宽度，浏览器可能反复做布局；同样频率只改变一个小状态提示，成本不同。一个动画是否卡顿，要结合节点数、变更属性、图层面积、设备和同时发生的业务脚本判断。不要把“GPU 加速”当免费午餐，图层也占内存。

生产预算应覆盖核心任务，比如打开事件列表、筛选、弹窗和长列表滚动；对比交互延迟、布局时间和资源失败，并按发布版本、设备类别聚合。AIOps 异常模型发现某版本慢，只是定位起点；最终仍要回到 Performance 中的具体工作，验证优化前后是否减少了那部分成本。

### 面试追问练习

当面试官问“手机横向滚动怎么办”，30 秒先讲测量视口与内容宽度、定位超宽节点和约束；3 分钟再展开盒模型、自动最小尺寸、长字符串、包含块和裁剪。最后说明为什么藏滚动条不能证明内容可用，以及如何在放大、键盘、深色模式下回归。

当问题变成“几十个团队共用仪表盘怎么设计”，回答令牌和层级还不够。继续说明公共组件契约、第三方 CSS 隔离、迁移时旧规则的退出计划、带版本的视觉基线及发布回滚。你的设计应让团队能知道样式为什么生效，而不是只能记住谁最后覆盖了谁。

## 布局进阶课堂：用测量解释，而不是不断加 !important

### 元素滚动、页面滚动和视口不是一回事

你看到列表在滚动时，先问谁是滚动容器。可能是整个文档，也可能是一个设置了固定高度和 `overflow:auto` 的面板。`position:sticky` 的参考环境会受到最近相关滚动祖先影响；面板没有可滚动空间、祖先裁剪或尺寸约束不对，都会让“粘住表头”看起来失效。不要只盯着 sticky 那一行。

老师会让你在开发者工具中依次选择列表、外层面板、页面根元素，比较 `clientHeight`、`scrollHeight` 与实际滚动位置。前者近似表示可见内部高度，后者表示完整内容高度；只有内容超过可见区域才有滚动需求。嵌套滚动会让键盘、触屏和弹窗体验复杂化，设计时尽量明确主滚动区域，而不是每层都设置一个 overflow。

用户缩放、地址栏展开、软键盘弹出都会改变可用空间。固定写死一个桌面高度，可能在手机上把确认按钮挡到屏幕外。视口单位与动态视口单位有不同目的，选用时要在目标浏览器实测；不要把某个单位当作所有移动端问题的通用补丁。重要操作应在小高度窗口下仍然可到达，必要时允许内容区域滚动而固定清晰的操作栏。

### 长文本不是异常输入，而是正常容量场景

服务名、链路标识和错误摘要经常没有空格。Flex 或 Grid 子项的默认最小尺寸可能使它坚持保留内在宽度，导致父容器被撑开；这时 `min-width:0` 允许子项在适当布局中收缩，文本如何换行或省略仍需另行定义。只加 `overflow:hidden` 可能把真正需要的信息和焦点轮廓一起剪掉。

省略号适合不必立即完整阅读的摘要，但告警处置原因、错误路径和审批条款可能必须完整可见。可以提供可展开详情或复制原文，而不是让所有长内容永远只剩三个点。测试数据应包含中文、英文长串、数字、空值和多行文本；使用几条长度相同的漂亮演示数据，很容易错过真实布局问题。

Grid 中 `1fr` 是剩余空间分配规则，不是绝对保证列永不溢出。内容最小尺寸仍可能参与计算，`minmax(0, 1fr)` 是明确允许轨道更小的一种表达。选择时问的是“这列应如何处理过长内容”，不是背一个能消除横向滚动的咒语。修复后仍要确认内容没有被悄悄丢失。

### 双向文字与中文页面也需要方向意识

`margin-left` 描述物理左侧，`margin-inline-start` 描述行内开始侧。逻辑属性更适合需要跟随文字方向变化的组件；不是所有地方都必须替换，例如地图坐标或图表物理位置有自己的方向含义。先确定语义，再选择属性，避免为了统一写法改变业务含义。

中文排版还涉及行高、字重、数字对齐、断行与字体回退。某个字体在开发机存在，生产用户设备没有，回退后字符宽度可能变化并引发布局偏移。关键区域预留合理空间，数字监控可评估等宽数字特性，长单位与数值尽量保持关联；同时在默认系统字体和字体加载失败情况下验证可读性。

### 一次有限的焦点可见性实验

前置条件是前面的本地事件卡片页面，至少有一个真实链接和一个按钮。先不用鼠标，按 Tab 依次移动焦点，记录当前焦点能否清晰看见。然后只在开发者工具的临时样式面板加入 `button:focus { outline:none; }`，再用键盘进入按钮，观察是否失去可见提示。这个更改不写回源码、关闭标签页即可回收。

恢复临时修改后，在源码的实验副本中为 `:focus-visible` 定义清晰轮廓，并确保轮廓与背景有足够对比，不被父元素裁剪。再次用 Tab、Shift+Tab 验证前后移动，再用鼠标点击确认交互没有被破坏。预期键盘位置始终可辨；若依然不可见，查看真实焦点是否在另一个内部控件、样式是否被覆盖及祖先是否裁剪。保存前后截图时注明键盘操作顺序，不把截图存在等同于无障碍测试全部通过。

这里的故障不是“按钮不能用”，而是用户无法知道自己将操作哪一项。在批量处置页面，焦点不清可能导致误确认；因此可访问性也是变更安全的一部分。不能因为功能测试能调用点击接口，就忽略键盘用户实际路径。

### 面试加深：合成层、动画与性能预算

改变 `transform` 或 `opacity` 在很多场景中有机会避免逐帧重新布局，但不意味着所有动画自动免费。大型图层占用显存与合成资源，层数过多、透明叠加和滤镜仍可能造成负担。`will-change` 是提示浏览器预先准备，不应长期施加到所有卡片；是否有收益要通过性能工具验证。

若看板滚动卡顿，先录制一段可复现操作，分清是样式计算、布局、绘制、脚本还是数据量过大。只看到 CSS 文件就改动画属性，可能完全绕过真正的 JavaScript 长任务。一次优化只改变一个主要因素，比较相同设备、相同数据和相同操作下的帧时间、长任务与用户体验，再决定保留。

发布前为样式建立状态矩阵：窄屏、长内容、加载、空数据、错误、禁用、键盘焦点、深色主题和减少动画偏好。它比只保留一张桌面成功态截图更能代表组件质量。最终学习证据应包含具体视口、输入样本、测量结果和修复原因，让面试官能顺着你的判断继续追问。

## 最后一堂机制课：变量存在，声明为什么仍然失效

先预测下面的颜色。老师给父元素设置蓝色，子元素先声明绿色，接着声明 `color: var(--label, red)`，而 `--label` 的值是 `20px`。很多学生猜红色，因为有回退；也有人猜绿色，因为前面写过。实际上变量存在，替换后得到的却不是合法颜色，这属于计算值阶段无效。对于这里可继承的 `color`，结果回到继承行为，而不是重新找此前输掉层叠的绿色声明。

这解释了为什么变量回退不是通用类型检查。`var()` 的回退用于变量缺失等特定情况，不会自动发现任意值不适合目标属性。自定义属性的普通双短横线声明可以保存许多符号序列，真正放进颜色、长度等属性时才可能暴露问题。样式面板中看到变量有值，只能证明找到了值，不证明使用点接受它。排查时同时展开变量来源和最终计算值。[自定义属性的无效值](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)

### 可清理的变量故障实验

变量名区分大小写，排查时还要核对拼写；看似相同的两个名字可能完全不是同一个令牌。

前提是现代浏览器和一个个人空白 HTML 实验文件，不依赖服务器，不接触生产页面。将下面片段放入该文件并打开，先预测，后查看开发者工具的计算样式。

```html
<style>
  .parent { color: blue; }
  .child { color: green; --label: 20px; color: var(--label, red); }
</style>
<p class="parent"><span class="child">合成告警标签</span></p>
```

预期文字为蓝色，计算颜色通常显示对应的 RGB 值。故障修复第一轮把 `--label` 改为 `purple`，应得到紫色；第二轮删除 `--label` 声明，应得到回退红色。这三个结果分别证明错误类型、合法替换和变量缺失，不能只看其中一个。验证完关闭文件，删除自己新建的实验文件即可；若颜色不符，检查浏览器扩展、用户样式、是否还有其他匹配规则以及是否误改了父元素颜色。

生产中可以把令牌分成颜色、间距、字号等类型，并在构建或受支持的属性注册机制中约束它们。但兼容性与继承变化也要审核，不能一次注册所有属性却忘记局部主题原本依赖继承。设计令牌升级更像接口升级：给旧名到新名的迁移期，搜索使用点，检查第三方主题，而不是全局字符串替换之后只看首页。

### 支持语法不等于满足功能质量

`@supports` 回答浏览器是否接受某项 CSS 能力的测试条件，可以把增强样式包在条件里。它不能证明复杂页面没有浏览器缺陷，也不能验证对比度、键盘操作或设备性能。正确的渐进增强是先有可读的基础布局，再给支持者更丰富的布局；不要让核心确认按钮只出现在增强分支中，而旧环境没有任何替代入口。[特性查询](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@supports)

例如卡片基础为垂直排列，支持网格时变成多列，这通常保持阅读顺序。反过来若通过视觉排序把“确认”按钮移到另一张卡旁边，DOM 顺序、键盘顺序和屏幕阅读器顺序可能仍与视觉不一致。样式变更不是只有像素结果，还会影响操作关系。事故复盘应检查用户实际按键序列，不只比较截图。

三分钟面试回答可以由这份实验展开：声明先参与层叠，变量再在计算过程中解析，因此错误出现阶段不同，回退行为也不同；架构上用类型清晰的令牌与迁移约束降低风险；测试上同时检查计算样式、主题、放大和真实交互。遇到“加了回退仍没生效”的追问，先要求看变量实际值，避免再次堆叠无关的优先级规则。

## GitHub 学习证据清单

值班台还有一种容易漏测的状态：用户开启高对比或强制颜色后，浏览器可能替换作者指定的颜色。把等级只编码为背景色，替换后就失去区别；用文字和结构表达等级，仍可保留含义。不要为了保住设计稿随意禁止用户颜色调整，先检查关键状态能否在该环境被辨认。这个验证与深色主题不同，应分别记录。若模型用截图识别告警等级，也应说明主题和辅助设置会改变视觉输入，优先读取可信结构化状态，不把某个红色色号当成业务事实的唯一来源。

```text
css-incident-dashboard/
  index.html
  styles.css
  README.md
  evidence/
    390px.png
    200-percent-zoom.png
    computed-style.md
    performance-before-after.md
  postmortem/
    overflow-and-cascade.md
```

证据注明浏览器、视口、缩放、主题和验证日期，不包含真实告警数据。代码、截图和复盘一起提交，比只放一张“页面很好看”的图片更能证明工程能力。

## 下一步

继续学习 [JavaScript](./javascript.md)，让静态结构和视觉状态响应真实数据；随后学习 [Ajax](./ajax.md)，把页面与后端 API 安全连接起来。
