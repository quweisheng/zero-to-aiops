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
CSS syntax
  -> selectors / declarations / values / units
  -> cascade / specificity / inheritance / custom properties
  -> box model / normal flow / formatting contexts
  -> flex / grid / position / stacking context
  -> responsive / container and media queries
  -> typography / color / states / motion
  -> rendering performance / accessibility / architecture
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
CSS text -> parser -> CSSOM
DOM element -> selector matching -> cascade winner
  -> computed value -> used value -> actual value
  -> layout -> paint -> compositing
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
- **怎么工作**：先比较来源与重要性、级联层和作用域，再比较 specificity（选择器优先级）与源码顺序。
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
margin
  border
    padding
      content
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
  -> style recalculation
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

## GitHub 学习证据

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
