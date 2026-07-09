# Grafana 精讲

> 学习目标：能启动 Grafana，连接 Prometheus 数据源，创建 dashboard，理解 data source、query、panel、visualization、field、transformation、variable、dashboard JSON、provisioning、alert rule，并能设计一个适合 AIOps 值班排障的仪表盘。

## 官方资料

- [Grafana Get started](https://grafana.com/docs/grafana/latest/getting-started/)
- [Get started with Grafana and Prometheus](https://grafana.com/docs/grafana/latest/fundamentals/getting-started/first-dashboards/get-started-grafana-prometheus/)
- [Data sources](https://grafana.com/docs/grafana/latest/datasources/)
- [Prometheus data source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Visualizations](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/)
- [Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Variables](https://grafana.com/docs/grafana/latest/dashboards/variables/)
- [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/)
- [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
- [Provision Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [HTTP API](https://grafana.com/docs/grafana/latest/developers/http_api/)

说明：本文基于 Grafana 官方文档和 AIOps 学习场景整理，保留官方链接，不复制官方全文。官方文档负责定义功能边界，本文负责把这些功能组织成小白能学会的路径。

## 场景开场

“Prometheus 里明明有数据，可值班时谁也不想临时写一堆 PromQL。”

故障现场最怕信息散：CPU 在一个页面，错误率在另一个页面，日志在另一个系统，发布记录在群消息里。Grafana 的价值不是把曲线画得花哨，而是把值班时最需要回答的问题放到同一块板子上：

- 现在有没有用户影响？
- 影响哪个服务、哪个实例、哪个环境？
- 是流量变化、错误率升高、延迟变慢，还是资源瓶颈？
- 问题从什么时候开始？
- 最近有没有发布、扩容、配置变更？

Prometheus 像指标仓库，Grafana 像值班工作台。仓库里有货，但工作台设计不好，故障时还是会乱。

## 一句话人话版

Grafana 是可观测性数据的展示和告警平台：它连接 Prometheus、Loki、Elasticsearch 等数据源，把查询结果组织成 dashboard，让人快速理解系统状态。

## 学习边界

这一篇重点讲 Grafana OSS 基础能力：

- Grafana 架构和数据流。
- data source、query、panel、visualization、dashboard。
- Prometheus 数据源连接和查询编辑。
- variable 变量和 dashboard 复用。
- field option、threshold、unit、legend。
- transformation 数据转换。
- dashboard JSON 导入导出。
- provisioning 文件化配置。
- Grafana Alerting 基础对象。
- 常见排障路径。

不在这一篇深入展开：

- Grafana Enterprise 权限和多租户细节。
- Grafana Cloud 的托管能力。
- Loki、Tempo、Mimir 的完整用法。
- 复杂告警通知路由策略。

这些后面可以单独成文。这里先把“一个小白怎样从 0 做出可解释的 AIOps dashboard”讲清。

## 官方知识地图

Grafana 官方资料可以按这张图理解：

```text
Grafana docs
  ├── Get started
  │   ├── install and sign in
  │   └── first dashboard
  ├── Data sources
  │   ├── Prometheus
  │   ├── Loki
  │   ├── Elasticsearch
  │   └── SQL data sources
  ├── Dashboards
  │   ├── dashboard
  │   ├── panel
  │   ├── rows
  │   ├── links
  │   └── JSON model
  ├── Panels and visualizations
  │   ├── time series
  │   ├── stat
  │   ├── gauge
  │   ├── table
  │   ├── heatmap
  │   └── logs
  ├── Query and transform data
  │   ├── query editor
  │   ├── field options
  │   ├── transformations
  │   └── overrides
  ├── Variables
  │   ├── query variables
  │   ├── custom variables
  │   ├── interval variables
  │   └── chained variables
  ├── Alerting
  │   ├── alert rules
  │   ├── contact points
  │   ├── notification policies
  │   └── silences
  ├── Administration
  │   ├── configuration
  │   ├── users and teams
  │   ├── provisioning
  │   └── plugins
  └── Developers
      └── HTTP API
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Grafana docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Get started</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  │   ├── install and sign in</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  │   └── first dashboard</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── Data sources</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  │   ├── Prometheus</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  │   ├── Loki</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  │   ├── Elasticsearch</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  │   └── SQL data sources</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  ├── Dashboards</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  │   ├── dashboard</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  │   ├── panel</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  │   ├── rows</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  │   ├── links</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  │   └── JSON model</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  ├── Panels and visualizations</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  │   ├── time series</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>  │   ├── stat</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>  │   ├── gauge</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 20 行 | <code>  │   ├── table</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 21 行 | <code>  │   ├── heatmap</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 22 行 | <code>  │   └── logs</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 23 行 | <code>  ├── Query and transform data</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 24 行 | <code>  │   ├── query editor</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 25 行 | <code>  │   ├── field options</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 26 行 | <code>  │   ├── transformations</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 27 行 | <code>  │   └── overrides</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 28 行 | <code>  ├── Variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 29 行 | <code>  │   ├── query variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 30 行 | <code>  │   ├── custom variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 31 行 | <code>  │   ├── interval variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 32 行 | <code>  │   └── chained variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 33 行 | <code>  ├── Alerting</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 34 行 | <code>  │   ├── alert rules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 35 行 | <code>  │   ├── contact points</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 36 行 | <code>  │   ├── notification policies</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 37 行 | <code>  │   └── silences</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 38 行 | <code>  ├── Administration</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 39 行 | <code>  │   ├── configuration</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 40 行 | <code>  │   ├── users and teams</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 41 行 | <code>  │   ├── provisioning</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 42 行 | <code>  │   └── plugins</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 43 行 | <code>  └── Developers</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 44 行 | <code>      └── HTTP API</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


本篇会覆盖入门阶段最重要的主干：数据源、dashboard、panel、变量、转换、告警、provisioning 和 API。

## Grafana 在 AIOps 链路中的位置

```text
Prometheus metrics
Loki logs
Elasticsearch logs
Tempo traces
SQL tables
        |
        v
Grafana data sources
        |
        v
queries
        |
        v
panels and dashboards
        |
        +--> on-call diagnosis
        +--> SLO review
        +--> anomaly validation
        +--> alert tuning
        +--> GitHub learning evidence
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus metrics</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Loki logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Elasticsearch logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Tempo traces</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>SQL tables</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>Grafana data sources</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>queries</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>panels and dashboards</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>        +--&gt; on-call diagnosis</code> | 这一行要理解这些英文词：`on-call diagnosis` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>        +--&gt; SLO review</code> | 这一行要理解这些英文词：`SLO review` 是slo=服务等级目标，review=复盘或评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>        +--&gt; anomaly validation</code> | 这一行要理解这些英文词：`anomaly validation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>        +--&gt; alert tuning</code> | 这一行要理解这些英文词：`alert tuning` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>        +--&gt; GitHub learning evidence</code> | 这一行要理解这些英文词：`GitHub learning evidence` 是github=代码托管平台，learning=学习沉淀，evidence=证据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Grafana 在 AIOps 中不是“数据生产者”，而是“理解和反馈入口”。

| AIOps 场景 | Grafana 的作用 |
|---|---|
| 值班排障 | 把可用性、错误率、延迟、资源、告警放在一个页面 |
| 告警治理 | 验证告警是否和真实用户影响一致 |
| SLO 复盘 | 展示 SLI、错误预算、趋势 |
| 异常检测 | 对比模型输出和真实指标曲线 |
| 项目展示 | 用 dashboard JSON 和截图证明你搭出了完整观测链路 |

## Grafana 是什么

Grafana 是一个可观测性数据可视化和告警平台。它通常不直接采集指标，而是连接已有数据源并展示查询结果。

一句话公式：

```text
Grafana = data sources + queries + panels + dashboards + alerting + provisioning
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Grafana = data sources + queries + panels + dashboards + alerting + provisioning</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见数据源：

| 数据源 | 数据类型 | 常见用途 |
|---|---|---|
| Prometheus | metrics | QPS、错误率、延迟、资源指标 |
| Loki | logs | 日志查询和日志上下文 |
| Elasticsearch / OpenSearch | logs/search | 日志检索、业务事件 |
| Tempo / Jaeger | traces | 链路追踪 |
| MySQL / PostgreSQL | table data | 业务表、发布记录、工单数据 |
| CloudWatch | cloud metrics/logs | 云资源监控 |

Grafana 自己会保存元数据，比如用户、组织、dashboard、数据源配置、告警规则等。它不等于 Prometheus，也不替代日志系统。

## Grafana 解决什么问题

Prometheus 能查指标，但它的 UI 更适合调试。Grafana 解决的是“把数据变成人能快速理解的页面”：

- 把多个查询结果放在同一个 dashboard。
- 用 Time series、Stat、Gauge、Table、Heatmap 等方式展示。
- 给数值设置单位、阈值、颜色和说明。
- 用 variable 让同一个 dashboard 支持选择环境、服务、实例。
- 导出 dashboard JSON，放进 GitHub，形成可复用资产。
- 用 provisioning 把数据源和 dashboard 文件化。
- 在同一平台里管理告警规则和通知。

一个好的 Grafana dashboard 不只是“有图”，而是能让值班人更快做判断。

## 架构和数据流

Grafana 的请求链路可以这样理解：

```text
browser
  |
  v
Grafana frontend
  |
  v
Grafana backend
  |
  v
data source plugin
  |
  v
Prometheus / Loki / Elasticsearch / SQL
  |
  v
query response
  |
  v
data frames
  |
  v
transformations
  |
  v
panel visualization
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>browser</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Grafana frontend</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>Grafana backend</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>data source plugin</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>Prometheus / Loki / Elasticsearch / SQL</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>query response</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>data frames</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 20 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 21 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 22 行 | <code>transformations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 23 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 24 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 25 行 | <code>panel visualization</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


关键点：

| 层 | 作用 |
|---|---|
| Browser | 用户操作 dashboard 和 panel |
| Grafana frontend | 渲染界面、图表、变量选择 |
| Grafana backend | 鉴权、保存配置、代理数据源查询 |
| Data source plugin | 把 Grafana 查询转换为目标系统查询 |
| Data frame | Grafana 内部用于表示查询结果的数据结构 |
| Panel | 把数据 frame 渲染成图表 |

这解释了一个常见现象：Grafana panel 没数据，不一定是 Prometheus 没数据。可能是数据源配置错、查询错、变量错、时间范围错、转换错或 panel 显示设置错。

## 安装与启动

### Docker 启动

```bash
docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


访问地址写成：

```text
localhost:3000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:3000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


首次登录常见默认账号：

```text
username: admin
password: admin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>username: admin</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>password: admin</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


首次登录后 Grafana 会要求修改密码。

### 持久化数据

学习时可以临时启动。想保留 dashboard、数据源和用户配置，就要挂载数据卷：

```bash
docker volume create grafana-data

docker run -d --name grafana \
  -p 3000:3000 \
  -v grafana-data:/var/lib/grafana \
  grafana/grafana:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker volume create grafana-data</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 3 行 | <code>docker run -d --name grafana \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>  -p 3000:3000 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -v grafana-data:/var/lib/grafana \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  grafana/grafana:latest</code> | 执行 `grafana/grafana:latest` 相关命令，后面的参数决定它具体操作什么对象。 |


如果不持久化，容器删除后 Grafana 的本地数据库也会丢。

### 常见目录

容器内常见路径：

| 路径 | 用途 |
|---|---|
| `/var/lib/grafana` | Grafana 数据目录，保存 SQLite 数据库、插件等 |
| `/etc/grafana/grafana.ini` | 主配置文件 |
| `/etc/grafana/provisioning` | provisioning 配置目录 |
| `/var/log/grafana` | 日志目录，容器里通常也输出到 stdout |

## 配置文件和环境变量

Grafana 主配置通常是 `grafana.ini`。Docker 场景也常用环境变量覆盖配置。

常用环境变量：

| 环境变量 | 含义 | 示例 |
|---|---|---|
| `GF_SECURITY_ADMIN_USER` | 初始管理员用户名 | `admin` |
| `GF_SECURITY_ADMIN_PASSWORD` | 初始管理员密码 | `admin123` |
| `GF_SERVER_ROOT_URL` | 外部访问根 URL | `https://grafana.example.com` |
| `GF_AUTH_ANONYMOUS_ENABLED` | 是否允许匿名访问 | `false` |
| `GF_USERS_ALLOW_SIGN_UP` | 是否允许用户注册 | `false` |
| `GF_INSTALL_PLUGINS` | 启动时安装插件 | `grafana-clock-panel` |

示例：

```bash
docker run -d --name grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin123 \
  -e GF_USERS_ALLOW_SIGN_UP=false \
  grafana/grafana:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name grafana \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 3000:3000 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -e GF_SECURITY_ADMIN_PASSWORD=admin123 \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -e GF_USERS_ALLOW_SIGN_UP=false \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  grafana/grafana:latest</code> | 执行 `grafana/grafana:latest` 相关命令，后面的参数决定它具体操作什么对象。 |


注意：不要把真实生产密码写进公开仓库。学习项目可以用明显的 demo 密码，并在 README 说明仅用于本地实验。

## 核心对象模型

Grafana 初学最重要的是这几个对象：

```text
organization
  └── folder
      └── dashboard
          ├── variables
          ├── panels
          │   ├── queries
          │   ├── transformations
          │   ├── field options
          │   └── visualization options
          └── links / annotations

data source
  └── query editor

alerting
  ├── alert rule
  ├── contact point
  ├── notification policy
  └── silence
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>organization</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  └── folder</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>      └── dashboard</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>          ├── variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>          ├── panels</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>          │   ├── queries</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>          │   ├── transformations</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>          │   ├── field options</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>          │   └── visualization options</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>          └── links / annotations</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 12 行 | <code>data source</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>  └── query editor</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 15 行 | <code>alerting</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>  ├── alert rule</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  ├── contact point</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>  ├── notification policy</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>  └── silence</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


下面逐个讲。

## Data Source

Data source 是 Grafana 要查询的数据系统。

连接 Prometheus 时，Grafana 至少需要知道：

- 数据源类型：Prometheus。
- URL：Prometheus 地址。
- 访问方式和认证方式。
- 是否作为默认数据源。

### 容器里的 URL 怎么写

如果 Grafana 和 Prometheus 都在宿主机上，可以填：

```text
localhost:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 Grafana 在容器里，Prometheus 在宿主机上，Docker Desktop 常用：

```text
host.docker.internal:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host.docker.internal:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 Grafana 和 Prometheus 在同一个 Docker Compose 网络里，Prometheus 服务名叫 `prometheus`，URL 应该填：

```text
prometheus:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


重点：Grafana 容器里的 `localhost` 是 Grafana 容器自己，不是 Prometheus 容器，也不是宿主机。

### Save & test 做了什么

点击 Save & test 时，Grafana 会尝试连接数据源并验证基本可用性。

它能证明：

- Grafana 能访问这个 URL。
- 数据源类型基本正确。
- 认证配置基本可用。

它不能证明：

- 你的每条 PromQL 都正确。
- 你的 dashboard 时间范围正确。
- 你的变量查询一定有结果。
- 数据源里一定有你想看的业务指标。

## Prometheus Data Source

Prometheus 数据源的核心是：Grafana 把 panel 里的查询交给 Prometheus HTTP API，再把返回结果画出来。

```text
panel query
  -> Grafana Prometheus data source plugin
  -> Prometheus HTTP API
  -> time series result
  -> Grafana data frame
  -> panel
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>panel query</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Grafana Prometheus data source plugin</code> | 这一行要理解这些英文词：`Grafana Prometheus data source plugin` 是prometheus=指标监控系统，data=数据，source=来源，plugin=插件。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Prometheus HTTP API</code> | 这一行要理解这些英文词：`Prometheus HTTP API` 是prometheus=指标监控系统，http=超文本传输协议，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; time series result</code> | 这一行要理解这些英文词：`time series result` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Grafana data frame</code> | 这一行要理解这些英文词：`Grafana data frame` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; panel</code> | 这一行要理解这些英文词：`panel` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


常用配置项：

| 配置 | 含义 |
|---|---|
| URL | Prometheus 访问地址 |
| Scrape interval | Prometheus 抓取间隔，用于辅助查询步长 |
| Query timeout | 查询超时 |
| HTTP method | GET 或 POST |
| Custom query parameters | 额外查询参数 |
| Exemplars | 是否配置 exemplar 链接 |

Prometheus 查询示例：

```text
up{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


请求速率：

```text
sum by (job) (rate(http_requests_total{job="$job"}[$__rate_interval]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (job) (rate(http_requests_total{job="$job"}[$__rate_interval]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这里的 `$__rate_interval` 是 Grafana 内置变量，常用于 Prometheus `rate()` 窗口。它会结合 dashboard 时间范围和数据源配置选择合适窗口，比手写固定 `[5m]` 更适合 dashboard。

## Dashboard

Dashboard 是一组 panels 和变量的集合，通常围绕一个系统、服务、业务域或值班场景组织。

好的 dashboard 有明确主题：

- `API 服务健康总览`
- `订单链路 SLO`
- `Kubernetes 节点资源`
- `Prometheus 自监控`
- `告警治理效果`

不好的 dashboard：

- 什么指标都塞进去。
- 没有阅读顺序。
- 面板标题含糊。
- 单位和阈值缺失。
- 没有变量，不能切换环境和服务。
- 只展示资源，不展示用户影响。

## Dashboard JSON

Grafana dashboard 可以导出为 JSON。JSON 是 dashboard as code 的基础。

它通常包含：

| 字段 | 含义 |
|---|---|
| `title` | dashboard 标题 |
| `uid` | dashboard 唯一 ID |
| `panels` | panel 列表 |
| `templating` | variables 配置 |
| `time` | 默认时间范围 |
| `timezone` | 时区 |
| `schemaVersion` | dashboard schema 版本 |
| `version` | dashboard 修改版本 |

学习阶段要做两件事：

1. 在 UI 里创建 dashboard。
2. 导出 JSON，放进 GitHub。

这样别人能看到你不是只截了一张图，而是有可复用的 dashboard 资产。

## Folder

Folder 用来组织 dashboards。

例子：

```text
AIOps Labs
  ├── Prometheus Health
  ├── Demo API Overview
  └── Alert Governance
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>AIOps Labs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Prometheus Health</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── Demo API Overview</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  └── Alert Governance</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


生产环境中 folder 还常用于权限管理。学习阶段先用它做分类，避免 dashboard 全堆在根目录。

## Panel

Panel 是 dashboard 中的一个图表或组件。

一个 panel 由几部分组成：

```text
panel
  ├── data source
  ├── query
  ├── transformations
  ├── visualization type
  ├── field options
  ├── overrides
  └── thresholds
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>panel</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── data source</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── query</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── transformations</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── visualization type</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  ├── field options</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  ├── overrides</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  └── thresholds</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


常见 panel 类型：

| Panel | 适合展示什么 |
|---|---|
| Time series | 随时间变化的指标，如 QPS、延迟、CPU |
| Stat | 当前单值，如可用实例数、当前错误率 |
| Gauge | 当前值和阈值关系，如 CPU 使用率 |
| Bar gauge | 多实例或多服务横向对比 |
| Table | 多字段明细，如实例状态表 |
| Heatmap | 延迟分布、请求分布密度 |
| Logs | 日志流 |
| Text | 说明、链接、值班提示 |

选择 panel 的原则：

- 看趋势用 Time series。
- 看当前状态用 Stat。
- 看阈值风险用 Gauge。
- 看多对象对比用 Table 或 Bar gauge。
- 看分布用 Heatmap。

## Query

Query 是 panel 背后的查询语句。

Prometheus 数据源使用 PromQL。例子：

```text
up{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


多查询 panel：

```text
A: sum(rate(http_requests_total{job="$job"}[$__rate_interval]))
B: sum(rate(http_requests_total{job="$job",status=~"5.."}[$__rate_interval]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>A: sum(rate(http_requests_total{job="$job"}[$__rate_interval]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>B: sum(rate(http_requests_total{job="$job",status=~"5.."}[$__rate_interval]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


错误率可以写成：

```text
sum(rate(http_requests_total{job="$job",status=~"5.."}[$__rate_interval]))
/
sum(rate(http_requests_total{job="$job"}[$__rate_interval]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum(rate(http_requests_total{job="$job",status=~"5.."}[$__rate_interval]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>sum(rate(http_requests_total{job="$job"}[$__rate_interval]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查询写完还要设置：

- Legend。
- Unit。
- Min/max。
- Threshold。
- Display name。

否则数据有了，人也不一定看得懂。

## Field Options

Field options 控制数据如何显示。

常用项：

| 选项 | 作用 | 例子 |
|---|---|---|
| Unit | 单位 | seconds、milliseconds、percent |
| Min / Max | 数值范围 | 0 到 1，0 到 100 |
| Decimals | 小数位 | 错误率保留 2 位 |
| Display name | 显示名 | `{{instance}}` |
| Color scheme | 颜色规则 | thresholds |
| No value | 无数据时显示 | `No data` |

AIOps dashboard 最常见问题之一是没有单位。比如 `0.23` 到底是秒、毫秒、百分比，还是核心数？如果不设置单位，值班人会误判。

## Thresholds

Thresholds 用颜色表达风险。

例子：错误率 panel。

| 范围 | 颜色 | 含义 |
|---|---|---|
| `< 1%` | green | 正常 |
| `1% - 5%` | yellow | 需要关注 |
| `> 5%` | red | 严重 |

阈值不是越多越好。阈值要和业务影响或 SLO 对齐，不能只凭感觉写。

## Overrides

Overrides 用来给某些字段单独设置显示规则。

例子：

- 给 `status="500"` 的线设置红色。
- 给某个实例单独显示成虚线。
- 给 P95 和 P99 设置不同 legend。

适合场景：

```text
同一个 panel 里有多条线，但某些线需要特别突出
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>同一个 panel 里有多条线，但某些线需要特别突出</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


不要滥用 overrides。颜色规则太复杂时，别人很难维护。

## Transformations

Transformation 是 Grafana 对查询结果做二次处理。

数据流：

```text
query result
  -> transformation
  -> panel visualization
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query result</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; transformation</code> | 这一行要理解这些英文词：`transformation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; panel visualization</code> | 这一行要理解这些英文词：`panel visualization` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


常见 transformation：

| Transformation | 用途 |
|---|---|
| Reduce | 把时间序列压缩成最后值、最大值、平均值 |
| Join | 按字段合并多个查询结果 |
| Filter fields | 只保留部分字段 |
| Organize fields | 重命名、排序、隐藏字段 |
| Add field from calculation | 根据字段计算新字段 |
| Labels to fields | 把 labels 转成表格字段 |

AIOps 例子：实例状态表。

查询：

```text
up{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


用 transformation 把每个 instance 的最后值变成表格：

| instance | status |
|---|---|
| api-1:8000 | 1 |
| api-2:8000 | 0 |

再用 value mapping 把 `1` 显示成 `UP`，`0` 显示成 `DOWN`。

## Variables

Variables 让 dashboard 可以复用。

没有变量时，你可能写死：

```text
up{job="demo-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="demo-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


有变量后：

```text
up{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


用户可以在 dashboard 顶部选择 job。

### Query Variable

Prometheus 常用变量：

```text
label_values(up, job)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>label_values(up, job)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


含义：从 `up` 指标中取所有 `job` label 的值。

实例变量：

```text
label_values(up{job="$job"}, instance)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>label_values(up{job="$job"}, instance)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这是 chained variable：`instance` 的候选值依赖当前 `job`。

### Custom Variable

适合固定选项：

```text
dev,staging,prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>dev,staging,prod</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### Interval Variable

适合选择查询窗口：

```text
1m,5m,15m,1h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1m,5m,15m,1h</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


在 PromQL 中使用：

```text
rate(http_requests_total[$interval])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rate(http_requests_total[$interval])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 内置变量

常用内置变量：

| 变量 | 含义 |
|---|---|
| `$__interval` | Grafana 根据时间范围和图宽计算的分组间隔 |
| `$__rate_interval` | Prometheus rate 推荐窗口 |
| `$__range` | 当前 dashboard 时间范围 |
| `$__from` | 开始时间 |
| `$__to` | 结束时间 |

Prometheus dashboard 里优先使用 `$__rate_interval` 写 `rate()` 窗口。

## Annotations

Annotations 用来在图上标记事件。

例子：

- 发布。
- 配置变更。
- 扩容缩容。
- 故障开始和恢复。
- 告警触发。

排障时，annotation 能回答“指标变化前发生了什么”。

```text
latency spike
    ^
    |
deployment annotation at 10:03
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>latency spike</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>    ^</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>deployment annotation at 10:03</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


AIOps dashboard 如果能把变更事件叠在指标曲线上，会比单纯曲线有用得多。

## Dashboard Links 和 Panel Links

Links 用来跳转到相关页面。

常见链接：

- 从服务总览跳到实例详情。
- 从错误率 panel 跳到日志查询。
- 从延迟 panel 跳到 tracing 页面。
- 从告警 panel 跳到 runbook 文档。

好的 dashboard 不是信息终点，而是排障入口。

## Provisioning

Provisioning 是用文件自动配置 Grafana。

它解决的问题：

- 手点 UI 难以复现。
- dashboard 改了没人知道。
- 新环境无法快速搭建。
- 配置不能 code review。

常见 provisioning：

| 类型 | 文件内容 |
|---|---|
| data sources | Prometheus、Loki 等数据源 |
| dashboards | dashboard JSON 文件加载路径 |
| alerting | 告警规则、contact point 等 |
| plugins | 插件安装和配置 |

### 数据源 provisioning

`provisioning/datasources/prometheus.yml`：

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: 1</code> | 设置 `apiVersion` 字段的值为 `1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>datasources:</code> | 定义 `datasources` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  - name: Prometheus</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    type: prometheus</code> | 设置 `type` 字段的值为 `prometheus`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    access: proxy</code> | 设置 `access` 字段的值为 `proxy`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    url: http://prometheus:9090</code> | 设置 `url` 字段的值为 `http://prometheus:9090`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    isDefault: true</code> | 设置 `isDefault` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    editable: true</code> | 设置 `editable` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `apiVersion` | provisioning 配置版本 |
| `name` | 数据源名称 |
| `type` | 数据源类型 |
| `access` | 查询访问方式，常见为 proxy |
| `url` | 数据源地址 |
| `isDefault` | 是否默认数据源 |
| `editable` | UI 中是否可编辑 |

### Dashboard provisioning

`provisioning/dashboards/dashboards.yml`：

```yaml
apiVersion: 1

providers:
  - name: aiops-labs
    type: file
    folder: AIOps Labs
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: 1</code> | 设置 `apiVersion` 字段的值为 `1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>providers:</code> | 定义 `providers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  - name: aiops-labs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    type: file</code> | 设置 `type` 字段的值为 `file`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    folder: AIOps Labs</code> | 设置 `folder` 字段的值为 `AIOps Labs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    updateIntervalSeconds: 30</code> | 设置 `updateIntervalSeconds` 字段的值为 `30`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    options:</code> | 定义 `options` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>      path: /var/lib/grafana/dashboards</code> | 设置 `path` 字段的值为 `/var/lib/grafana/dashboards`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


目录：

```text
grafana/
  provisioning/
    datasources/
      prometheus.yml
    dashboards/
      dashboards.yml
  dashboards/
    prometheus-health.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grafana/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  provisioning/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    datasources/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>      prometheus.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    dashboards/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      dashboards.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  dashboards/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    prometheus-health.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Docker 运行时挂载：

```bash
docker run -d --name grafana \
  -p 3000:3000 \
  -v "$PWD/grafana/provisioning:/etc/grafana/provisioning:ro" \
  -v "$PWD/grafana/dashboards:/var/lib/grafana/dashboards:ro" \
  grafana/grafana:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name grafana \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 3000:3000 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -v "$PWD/grafana/provisioning:/etc/grafana/provisioning:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -v "$PWD/grafana/dashboards:/var/lib/grafana/dashboards:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  grafana/grafana:latest</code> | 执行 `grafana/grafana:latest` 相关命令，后面的参数决定它具体操作什么对象。 |


## Grafana Alerting

Grafana Alerting 是 Grafana 的告警管理能力。

核心对象：

| 对象 | 含义 |
|---|---|
| Alert rule | 告警判断规则 |
| Evaluation group | 规则评估分组和频率 |
| Contact point | 通知渠道，如 email、webhook |
| Notification policy | 告警路由策略 |
| Silence | 临时静默 |
| Label | 告警标签，用于路由和分组 |
| Annotation | 给人看的说明 |

告警数据流：

```text
data source query
  -> alert rule evaluation
  -> alert instance
  -> notification policy
  -> contact point
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>data source query</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; alert rule evaluation</code> | 这一行要理解这些英文词：`alert rule evaluation` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; alert instance</code> | 这一行要理解这些英文词：`alert instance` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; notification policy</code> | 这一行要理解这些英文词：`notification policy` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; contact point</code> | 这一行要理解这些英文词：`contact point` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Grafana 告警和 Prometheus 告警怎么选？

| 场景 | 建议 |
|---|---|
| Prometheus 指标、基础 SRE 告警 | Prometheus alerting rules 或 Grafana Alerting 都可，团队要统一 |
| 多数据源组合告警 | Grafana Alerting 更方便 |
| 已有 Alertmanager 治理链路 | Prometheus + Alertmanager 更常见 |
| 学习 dashboard 告警 | Grafana Alerting 入门直观 |

注意：不要对同一个故障同时配置 Prometheus 告警和 Grafana 告警，除非你明确知道路由和去重方式。否则会制造告警噪音。

## HTTP API

Grafana HTTP API 可以管理 dashboard、data source、folder、user、alerting 等资源。

学习阶段常见用途：

- 导出 dashboard。
- 导入 dashboard。
- 查询数据源。
- 自动化创建 folder。
- CI/CD 发布 dashboard。

示例：查询 health。

```bash
curl localhost:3000/api/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl localhost:3000/api/health</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


示例：用 API token 查询数据源。

```bash
curl -H "Authorization: Bearer <token>" localhost:3000/api/datasources
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -H "Authorization: Bearer &lt;token&gt;" localhost:3000/api/datasources</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


注意：

- API token 不要提交 Git。
- 对外暴露 Grafana 时要使用 HTTPS 和访问控制。
- 学习项目里可以用本地 API 演示自动化思路。

## 命令 / 配置 / API 字典

### `docker run grafana/grafana`

| 项 | 内容 |
|---|---|
| 作用 | 启动 Grafana 容器 |
| 示例 | `docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest` |
| 关键字段 | `-p 3000:3000`、镜像名、容器名 |
| AIOps 场景 | 本地启动可视化平台 |
| 常见坑 | 不挂载数据卷时，删除容器会丢 dashboard |

### `GF_SECURITY_ADMIN_PASSWORD`

| 项 | 内容 |
|---|---|
| 作用 | 设置初始管理员密码 |
| 示例 | `-e GF_SECURITY_ADMIN_PASSWORD=admin123` |
| AIOps 场景 | 本地实验环境快速设置登录密码 |
| 常见坑 | 不要把生产密码写进公开配置 |

### Data source URL

| 项 | 内容 |
|---|---|
| 作用 | 告诉 Grafana 去哪里查询数据 |
| 示例 | `prometheus:9090`、`host.docker.internal:9090` |
| AIOps 场景 | 连接 Prometheus 指标源 |
| 常见坑 | 容器里的 `localhost` 指 Grafana 容器自己 |

### Prometheus query editor

| 项 | 内容 |
|---|---|
| 作用 | 在 panel 中写 PromQL |
| 示例 | `sum(rate(http_requests_total[$__rate_interval]))` |
| AIOps 场景 | 展示 QPS、错误率、延迟 |
| 常见坑 | PromQL 在 Prometheus 里能查到，再搬到 Grafana 中更稳 |

### `$__rate_interval`

| 项 | 内容 |
|---|---|
| 作用 | Grafana 为 Prometheus `rate()` 计算推荐的窗口变量 |
| 示例 | `rate(http_requests_total[$__rate_interval])` |
| AIOps 场景 | 让 dashboard 随时间范围自动调整查询窗口 |
| 常见坑 | 不要在所有 panel 中硬编码 `[1m]`，容易抖或无数据 |

### `label_values`

| 项 | 内容 |
|---|---|
| 作用 | Prometheus 变量查询中获取 label 值 |
| 示例 | `label_values(up, job)` |
| AIOps 场景 | 生成 job、instance、service 下拉框 |
| 常见坑 | 变量无值时，检查时间范围和指标是否存在 |

### Dashboard JSON

| 项 | 内容 |
|---|---|
| 作用 | 用 JSON 表示 dashboard |
| 关键字段 | `title`、`uid`、`panels`、`templating`、`time` |
| AIOps 场景 | 把 dashboard 放进 GitHub，复用和审计 |
| 常见坑 | 导入不同环境时 data source UID 可能不匹配 |

### Provisioning data source YAML

| 项 | 内容 |
|---|---|
| 作用 | Grafana 启动时自动加载数据源 |
| 路径 | `/etc/grafana/provisioning/datasources/*.yml` |
| AIOps 场景 | 实验环境一键复现 |
| 常见坑 | YAML 缩进错误或 URL 写错会导致数据源不可用 |

### Provisioning dashboard YAML

| 项 | 内容 |
|---|---|
| 作用 | Grafana 启动时自动从文件加载 dashboard |
| 路径 | `/etc/grafana/provisioning/dashboards/*.yml` |
| AIOps 场景 | dashboard as code |
| 常见坑 | provider path 要和容器内挂载路径一致 |

### `/api/health`

| 项 | 内容 |
|---|---|
| 作用 | 检查 Grafana API 是否可用 |
| 示例 | `curl localhost:3000/api/health` |
| AIOps 场景 | 自动化脚本确认 Grafana 已启动 |
| 常见坑 | Grafana 启动中时可能暂时不可用 |

### `/api/datasources`

| 项 | 内容 |
|---|---|
| 作用 | 查询 Grafana 数据源列表 |
| 示例 | `curl -H "Authorization: Bearer <token>" localhost:3000/api/datasources` |
| AIOps 场景 | 自动化检查数据源是否存在 |
| 常见坑 | 需要认证 token；不要泄露 token |

## AIOps dashboard 设计方法

一个值班 dashboard 应该按排障问题组织，而不是按工具堆图。

推荐四层：

```text
1. user impact
   availability, error rate, latency
2. traffic
   QPS, request distribution, status code
3. service internals
   instance up, queue, dependency error
4. resources and changes
   CPU, memory, disk, deployment annotation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. user impact</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 2 行 | <code>   availability, error rate, latency</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>2. traffic</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 4 行 | <code>   QPS, request distribution, status code</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>3. service internals</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>   instance up, queue, dependency error</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>4. resources and changes</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 8 行 | <code>   CPU, memory, disk, deployment annotation</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第一层：用户影响

优先放：

- 可用性。
- 错误率。
- P95/P99 延迟。
- 成功请求量。

原因：值班第一问不是“CPU 高不高”，而是“用户有没有受影响”。

### 第二层：流量

放：

- QPS。
- 请求状态码分布。
- Top endpoints。
- 入站/出站流量。

流量变化常常解释资源变化。CPU 高如果伴随 QPS 翻倍，含义和 CPU 高但 QPS 不变完全不同。

### 第三层：服务内部

放：

- 实例 UP/DOWN。
- 队列长度。
- 线程池。
- 依赖调用失败率。
- 缓存命中率。

这些指标帮助定位“服务内部哪里出问题”。

### 第四层：资源和变更

放：

- CPU。
- 内存。
- 磁盘。
- 网络。
- 发布 annotation。
- 配置变更 annotation。

资源指标是诊断证据，不应该永远占据 dashboard 最上方。

## 入门实验：Prometheus 健康 Dashboard

### 实验目标

最终你应该能做到：

- 启动 Grafana。
- 连接 Prometheus 数据源。
- 创建 dashboard。
- 添加 `Target Up`、`Scrape Duration`、`Query Samples` 之类 panel。
- 创建 job 变量。
- 导出 dashboard JSON。
- 可选：用 provisioning 自动加载数据源和 dashboard。

### 第 1 步：启动 Prometheus

假设你已经有 `prometheus.yml`，启动 Prometheus：

```bash
docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


确认：

```text
localhost:9090/targets
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090/targets</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 2 步：启动 Grafana

```bash
docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


打开：

```text
localhost:3000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:3000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 3 步：添加 Prometheus 数据源

进入 Connections 或 Data sources，选择 Prometheus。

如果 Grafana 容器访问宿主机上的 Prometheus，Docker Desktop 常用 URL：

```text
http://host.docker.internal:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://host.docker.internal:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 Grafana 和 Prometheus 在同一个 Compose 网络里，URL：

```text
http://prometheus:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://prometheus:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


点击 Save & test。

### 第 4 步：创建 job 变量

Dashboard settings 中添加变量：

| 字段 | 值 |
|---|---|
| Name | `job` |
| Type | Query |
| Data source | Prometheus |
| Query | `label_values(up, job)` |
| Multi-value | 可选 |
| Include All | 可选 |

变量可用后，dashboard 顶部会出现 job 下拉框。

### 第 5 步：创建 Target Up 面板

Panel 类型：Stat 或 Time series。

Query：

```text
up{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


设置：

| 项 | 值 |
|---|---|
| Title | `Target Up` |
| Unit | none |
| Threshold | 0 red，1 green |
| Legend | `{{instance}}` |

### 第 6 步：创建 Scrape Duration 面板

Query：

```text
scrape_duration_seconds{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scrape_duration_seconds{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


设置：

| 项 | 值 |
|---|---|
| Panel | Time series |
| Unit | seconds |
| Legend | `{{instance}}` |

这个面板能看 Prometheus 抓取某 target 花了多久。

### 第 7 步：创建 Samples Scraped 面板

Query：

```text
scrape_samples_scraped{job="$job"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scrape_samples_scraped{job="$job"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


设置：

| 项 | 值 |
|---|---|
| Panel | Time series |
| Unit | short |
| Legend | `{{instance}}` |

如果某个 target 样本数突然暴涨，可能是指标数量变多或高基数风险。

### 第 8 步：保存并导出 JSON

Dashboard 标题：

```text
AIOps Demo - Prometheus Health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>AIOps Demo - Prometheus Health</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


导出 JSON，保存到：

```text
labs/grafana/dashboards/prometheus-health.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labs/grafana/dashboards/prometheus-health.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 9 步：写 README

README 至少记录：

```markdown
# Grafana Prometheus Health Dashboard

## Start Prometheus

docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0

## Start Grafana

docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest

## Data source

Prometheus URL: host.docker.internal:9090

## Dashboard

Import labs/grafana/dashboards/prometheus-health.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Grafana Prometheus Health Dashboard</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## Start Prometheus</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## Start Grafana</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>docker run --rm --name grafana -p 3000:3000 grafana/grafana:latest</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## Data source</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>Prometheus URL: host.docker.internal:9090</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## Dashboard</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>Import labs/grafana/dashboards/prometheus-health.json</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 常见故障排查

### Save & test 失败

常见原因：

- Prometheus 没启动。
- URL 写错。
- 容器里写了错误的 `localhost`。
- 端口没有映射。
- Grafana 和 Prometheus 不在同一个 Docker 网络。
- Prometheus 被认证、代理或防火墙拦住。

检查：

```bash
docker ps
docker logs grafana
docker logs prometheus
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker logs grafana</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker logs prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


如果使用 Compose，进入 Grafana 容器测试：

```bash
docker compose exec grafana wget -qO- http://prometheus:9090/-/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose exec grafana wget -qO- http://prometheus:9090/-/ready</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


### Panel 没有数据

排查顺序：

1. Prometheus 自己的 UI 里能不能查到同一条 PromQL。
2. Grafana panel 选的数据源是否正确。
3. dashboard 时间范围是不是太短或太靠前。
4. 变量是否过滤掉了数据。
5. label 值是否匹配。
6. transformation 是否把字段过滤掉了。
7. panel 是否设置了错误单位、阈值或 reduce。

### 变量没有值

检查：

- 变量查询语句是否能在数据源中返回结果。
- 时间范围内是否有该指标。
- 变量是否依赖另一个变量，而上游变量为空。
- 是否启用了 Multi-value 或 Include All 后，查询写法没有适配。

### Dashboard 导入后数据源丢失

常见原因：

- dashboard JSON 里引用了旧环境的数据源 UID。
- 新环境数据源名字相同但 UID 不同。
- 导入时没有选择正确数据源。

处理：

- 导入时映射数据源。
- 用 provisioning 固定数据源 UID。
- 在 JSON 中避免绑定不可移植的环境细节。

### 图表能看但不好用

常见问题：

- 没有单位。
- 没有阈值。
- Legend 不清楚。
- 面板太多。
- 第一屏看不到用户影响。
- 查询窗口硬编码导致切换时间范围后失真。
- 颜色太随意，红色不一定代表危险。

改进：

- 给延迟设置 seconds 或 milliseconds。
- 给错误率设置 percent。
- Legend 用 `{{service}}`、`{{instance}}`、`{{status}}`。
- 首页控制在 6 到 10 个关键 panel。
- `rate()` 优先用 `$__rate_interval`。

### Grafana 容器重建后 dashboard 没了

原因：

- 没有挂载 `/var/lib/grafana`。
- 没有导出 dashboard JSON。
- 没有使用 provisioning。

处理：

- 学习环境：导出 JSON。
- 持久环境：挂载 volume。
- 可复现环境：使用 provisioning。

## 典型故障排查表

| 现象 | 常见原因 | 检查入口 | 处理方向 |
|---|---|---|---|
| 访问不了 Grafana | 容器没启动、端口没映射 | `docker ps`、`docker logs grafana` | 启动容器，确认 `-p 3000:3000` |
| 登录失败 | 密码改过、数据卷保留旧密码 | Grafana 日志、环境变量 | 使用正确密码，必要时重置 admin 密码 |
| 数据源 Save & test 失败 | URL、网络、认证错误 | Data source 页面、Grafana 日志 | 修 URL、网络、token |
| Panel 无数据 | PromQL、时间范围、变量、数据源错误 | Explore、Panel query inspector | 先在 Prometheus 验证查询 |
| 变量为空 | 指标不存在、label 错、时间范围无数据 | Variables preview | 修变量查询 |
| 导入 dashboard 后报数据源错误 | datasource UID 不匹配 | Dashboard settings、JSON | 重新映射或 provisioning 固定 UID |
| 图表数值看不懂 | 单位和 legend 缺失 | Panel options | 设置 unit、legend、description |
| 告警重复 | Grafana 和 Prometheus 同时告警 | Alerting 页面、Alertmanager | 统一告警来源或去重 |
| dashboard 丢失 | 容器无持久化 | Docker volume、导出文件 | 使用 volume 或 provisioning |

## AIOps dashboard 示例布局

一个 demo API dashboard 可以这样排：

```text
Row 1: User impact
  [Availability] [Error Rate] [P95 Latency] [Request Rate]

Row 2: Service health
  [Instance Up Table] [Status Code Rate] [Top Slow Endpoints]

Row 3: Resources
  [CPU] [Memory] [Network] [Disk]

Row 4: Context
  [Deploy Annotations] [Recent Alerts] [Runbook Links]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Row 1: User impact</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  [Availability] [Error Rate] [P95 Latency] [Request Rate]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>Row 2: Service health</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  [Instance Up Table] [Status Code Rate] [Top Slow Endpoints]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>Row 3: Resources</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  [CPU] [Memory] [Network] [Disk]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>Row 4: Context</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  [Deploy Annotations] [Recent Alerts] [Runbook Links]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


每个 panel 都要能回答一个明确问题：

| Panel | 回答的问题 |
|---|---|
| Availability | 服务现在是否可用 |
| Error Rate | 用户请求失败比例是否异常 |
| P95 Latency | 大多数用户是否变慢 |
| Request Rate | 是否流量突增或突降 |
| Instance Up Table | 哪个实例不可抓取 |
| Status Code Rate | 哪类错误在增加 |
| Deploy Annotations | 指标变化前是否有变更 |

## 学习路线

### 第 1 阶段：跑起来

- Docker 启动 Grafana。
- 登录 UI。
- 理解数据目录和持久化。

学习证据：Grafana 登录截图和启动命令。

### 第 2 阶段：连数据源

- 添加 Prometheus data source。
- 理解容器网络 URL。
- Save & test。

学习证据：Prometheus data source 配置截图。

### 第 3 阶段：做 dashboard

- 创建 dashboard。
- 添加 Time series、Stat、Table。
- 设置 unit、legend、threshold。

学习证据：`prometheus-health.json`。

### 第 4 阶段：做变量和转换

- job 变量。
- instance 变量。
- `$__rate_interval`。
- Reduce、Organize fields、Labels to fields。

学习证据：一个支持选择 job/instance 的 dashboard。

### 第 5 阶段：文件化

- 导出 JSON。
- provisioning data source。
- provisioning dashboard。
- README 记录运行方式。

学习证据：`grafana/provisioning` 和 `grafana/dashboards` 目录。

### 第 6 阶段：进入 AIOps

- 设计用户影响优先的值班 dashboard。
- 加 annotation 和 runbook link。
- 验证告警是否有效。
- 用 dashboard 对比异常检测结果。

学习证据：一篇 dashboard 设计说明和排障截图。

## 小白可能会问

### Grafana 自己存不存指标？

通常不存指标。Grafana 保存 dashboard、数据源、用户和告警等元数据。指标一般存在 Prometheus、Mimir、InfluxDB 等系统里。

### 有了 Prometheus 页面，为什么还要 Grafana？

Prometheus UI 适合调试 PromQL 和看 target。Grafana 适合把多个指标组织成值班视图，设置单位、阈值、变量、链接和 annotations。

### Dashboard 是不是越多越好？

不是。太多 dashboard 会让值班人找不到入口。更好的方式是少量核心总览，加按服务、实例、资源、日志的下钻页面。

### 做 AIOps 项目时，什么截图最能证明能力？

不是一堆 CPU 曲线，而是一个能说明排障思路的 dashboard：第一屏有可用性、错误率、延迟、QPS；下方有实例状态、资源、变更 annotation；旁边有 dashboard JSON 和运行说明。

### Grafana Alerting 和 Prometheus Alerting 怎么选？

学习阶段可以都了解。生产中要统一治理链路。如果团队已经用 Prometheus + Alertmanager，就不要在 Grafana 里重复发同类告警。Grafana 更适合跨数据源或和 dashboard 紧密结合的告警管理。

## 面试怎么讲

Grafana 主要负责可观测性数据展示和告警管理。它通常不直接采集指标，而是通过 data source 连接 Prometheus、Loki、Elasticsearch 等系统，把查询结果转成 panel 和 dashboard。设计 AIOps 值班视图时，我会先放用户影响指标，比如可用性、错误率、P95 延迟和 QPS，再放实例状态、资源指标和变更 annotation。排障 Grafana 时，我会按数据源连接、PromQL 查询、时间范围、变量、transformation、panel 显示设置这个顺序检查。为了让 dashboard 可复现，我会导出 JSON，并用 provisioning 文件化配置数据源和 dashboard。

## 面试题

1. Grafana 主要解决什么问题？
2. Grafana 和 Prometheus 的边界是什么？
3. Grafana 自己保存哪些数据？不保存哪些数据？
4. Data source、dashboard、panel、query、variable 分别是什么？
5. Grafana 查询 Prometheus 的数据流是什么？
6. 为什么 Grafana 容器里不能随便写 `localhost:9090`？
7. `Time series`、`Stat`、`Gauge`、`Table` 分别适合什么场景？
8. Field options 里的 unit、legend、threshold 为什么重要？
9. `$__rate_interval` 解决什么问题？
10. Query variable 和 custom variable 有什么区别？
11. Transformation 解决什么问题？
12. Dashboard JSON 为什么要提交到 GitHub？
13. Provisioning 解决什么问题？
14. Grafana Alerting 和 Prometheus Alerting 怎么取舍？
15. Panel 没有数据你会怎么排查？
16. Data source Save & test 失败怎么查？
17. Dashboard 导入后数据源丢失是什么原因？
18. 一个 AIOps 值班 dashboard 第一屏应该放什么？
19. 为什么只展示 CPU 和内存不是好的 dashboard？
20. 如何把 Grafana 用作 AIOps 项目展示证据？

## 学习检查清单

- [ ] 我能解释 Grafana 和 Prometheus 的区别。
- [ ] 我能启动 Grafana 并登录。
- [ ] 我能说明 Grafana 数据目录为什么要持久化。
- [ ] 我能添加 Prometheus data source。
- [ ] 我能解释容器中 `localhost` 的含义。
- [ ] 我能创建 dashboard 和 panel。
- [ ] 我能选择合适的 visualization 类型。
- [ ] 我能写 `up{job="$job"}` 这类变量化查询。
- [ ] 我能使用 `$__rate_interval`。
- [ ] 我能设置 unit、legend、threshold。
- [ ] 我能创建 query variable。
- [ ] 我能使用 transformation 做简单表格整理。
- [ ] 我能导出 dashboard JSON。
- [ ] 我能写 data source provisioning。
- [ ] 我能写 dashboard provisioning。
- [ ] 我能说明 Grafana Alerting 的核心对象。
- [ ] 我能排查 Save & test 失败、panel 无数据、变量为空、dashboard 丢失。
- [ ] 我能设计一个以用户影响为第一层的 AIOps dashboard。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/grafana/dashboards/prometheus-health.json`
- `labs/grafana/provisioning/datasources/prometheus.yml`
- `labs/grafana/provisioning/dashboards/dashboards.yml`
- 一张 Grafana dashboard 截图。
- 一张 Prometheus data source Save & test 成功截图。
- 一篇笔记：`一个好的 AIOps dashboard 应该如何分层.md`
- 一篇排障记录：`Grafana 容器里为什么访问不到 localhost:9090.md`
- README：写清 Grafana、Prometheus 启动命令、数据源 URL、dashboard 导入方式。

如果你能从 Prometheus 指标一路讲到 Grafana 数据源、变量、panel、dashboard JSON、provisioning 和排障路径，就说明你已经不是“会点页面操作”，而是真的理解了 Grafana 在 AIOps 里的作用。
