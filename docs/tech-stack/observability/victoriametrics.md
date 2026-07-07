# VictoriaMetrics

> 学习目标：能理解 VictoriaMetrics 为什么适合作为 Prometheus 兼容的时序数据存储，能讲清单机版、集群版、vmagent、vmalert、MetricsQL、remote write、retention、cardinality 和 Grafana 查询链路，并能跑通一个最小指标写入和查询实验。

## 官方资料

优先读这些 VictoriaMetrics 官方资料：

- [VictoriaMetrics Quick start](https://docs.victoriametrics.com/victoriametrics/quick-start/)
- [Single-node VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/)
- [VictoriaMetrics Cluster](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/)
- [vmagent](https://docs.victoriametrics.com/victoriametrics/vmagent/)
- [vmalert](https://docs.victoriametrics.com/victoriametrics/vmalert/)
- [MetricsQL](https://docs.victoriametrics.com/victoriametrics/metricsql/)
- [VictoriaMetrics topologies](https://docs.victoriametrics.com/guides/vm-architectures/)
- [Grafana integration](https://docs.victoriametrics.com/victoriametrics/integrations/grafana/)

说明：本文按 VictoriaMetrics 官方资料结构整理，用 AIOps 指标存储、长期查询、告警规则和 Grafana 数据源场景重新讲解，不复制官方全文。

## 官方知识地图

VictoriaMetrics 官方资料可以按这张地图理解：

```text
VictoriaMetrics
  -> install
     -> single-node
     -> cluster
     -> cloud
     -> helm / operator
  -> write data
     -> Prometheus remote write
     -> vmagent scrape and remote write
     -> import APIs
  -> query data
     -> Prometheus-compatible API
     -> MetricsQL
     -> VMUI
     -> Grafana
  -> alerting
     -> vmalert
     -> recording rules
     -> alerting rules
     -> Alertmanager
  -> productionization
     -> retention
     -> capacity planning
     -> backups
     -> limits
     -> security
  -> cluster
     -> vminsert
     -> vmstorage
     -> vmselect
```

本文覆盖：

1. VictoriaMetrics 与 Prometheus 的关系。
2. 单机版和集群版的使用边界。
3. vmagent、vmalert、MetricsQL 和 Grafana 的位置。
4. 最小 Docker 实验：写入一条指标并查询。
5. 常见排障：写不进去、查不到、cardinality 过高、retention 配错。

## 场景开场

你已经用 Prometheus 采集指标，Grafana 也能看图。问题来了：

```text
Prometheus 本地磁盘越来越大。
历史数据只保留 15 天，不够做月度复盘。
多个集群各有 Prometheus，查询很分散。
PromQL 查询慢，指标标签越来越多。
```

这时候你需要思考：Prometheus 继续负责采集和规则，还是把长期时序数据写到一个更适合存储和查询的后端？

VictoriaMetrics 的位置就是这里：它常被用作 Prometheus 兼容的高性能时序数据库，也可以配合 vmagent、vmalert、Grafana 和 Alertmanager 组成一套完整的指标链路。

## 一句话人话版

VictoriaMetrics 是一个 Prometheus 兼容的时序数据库和监控组件集合：它接收指标数据，按时间序列存储，支持 MetricsQL / PromQL 风格查询，再给 Grafana、vmalert 和 AIOps 分析使用。

## 小白可能会问

- VictoriaMetrics 和 Prometheus 是替代关系还是配合关系？
- 单机版和集群版怎么选？
- vmagent、vmalert、vminsert、vmselect、vmstorage 分别是什么？
- MetricsQL 和 PromQL 有什么关系？
- remote write 是什么？
- retention 为什么很重要？
- label cardinality 为什么会把时序数据库拖垮？
- Grafana 怎么查 VictoriaMetrics？
- AIOps 里为什么需要长期指标数据？

## 为什么要学

AIOps 很依赖历史数据。只有最近几小时指标，你能定位当前故障；有几个月指标，你才能做容量趋势、发布影响分析、异常检测训练集和 SLO 复盘。

VictoriaMetrics 在 AIOps 中常用于：

- 长期保存 Prometheus 指标。
- 汇聚多集群、多环境指标。
- 支持 Grafana 查询和大盘。
- 用 vmalert 做 recording rules 和 alerting rules。
- 给 pandas、机器学习、RAG 事故分析提供历史指标证据。

## 是什么

VictoriaMetrics 可以先理解成：

```text
metrics receiver + time series storage + query API
```

它接收的数据通常长这样：

```text
http_requests_total{service="order-api",status="500"} 42 1710000000000
```

这条数据包含：

| 部分 | 含义 |
|---|---|
| `http_requests_total` | 指标名 |
| `service="order-api"` | 标签 |
| `status="500"` | 标签 |
| `42` | 当前样本值 |
| `1710000000000` | 时间戳 |

VictoriaMetrics 把这些样本按时间序列存储起来。查询时，你可以用 MetricsQL 或 PromQL 风格表达式取出它们。

## 它解决什么问题

### 问题 1：Prometheus 本地存储边界

Prometheus 非常适合采集、短期查询和告警，但当你要做长期、大规模、多集群指标存储时，需要考虑远程存储。

VictoriaMetrics 可以作为 remote write 目标：

```text
Prometheus / vmagent
  -> remote write
  -> VictoriaMetrics
  -> Grafana / vmalert / API
```

### 问题 2：指标查询需要集中入口

多个 Prometheus 分散在不同环境时，AIOps 分析很难统一查询。VictoriaMetrics 可以做集中存储或查询后端。

### 问题 3：需要历史指标做复盘和建模

异常检测、容量预测、SLO 复盘都需要历史窗口。retention 不能拍脑袋，要根据业务需求和磁盘容量设计。

## 核心原理

单机版数据流：

```text
scrape target / remote write
  -> VictoriaMetrics single-node
      ingest
      storage
      query
  -> Grafana / API / vmalert
```

集群版数据流：

```text
vmagent / Prometheus
  -> vminsert
  -> vmstorage
  -> vmselect
  -> Grafana / vmalert / API
```

### 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| time series | 指标名加标签组合形成的一条时间线 | 查询和存储的基本单位 |
| sample | 某个时间点的值 | 每次采集都会产生样本 |
| label | 指标维度 | 服务、实例、状态码、环境 |
| cardinality | 时间序列数量 | 过高会增加内存、磁盘和查询压力 |
| retention | 数据保留时间 | 决定历史查询和磁盘成本 |
| remote write | Prometheus 把指标写到远程后端 | 常用于长期存储 |
| MetricsQL | VictoriaMetrics 查询语言 | 兼容 PromQL 思路并有扩展 |
| vmagent | 指标采集和转发组件 | 可替代只做采集转发的 Prometheus |
| vmalert | 规则计算和告警组件 | 执行 recording / alerting rules |

## 核心知识树

### 单机版 VictoriaMetrics

是什么：一个 all-in-one 进程，负责写入、存储和查询。

为什么需要：学习、单机部署、中小规模场景启动简单。

怎么工作：

```text
write API
  -> local storage
  -> query API
```

怎么用：Docker 启动，挂载数据目录，配置 retention。

坏了怎么查：看进程是否启动、端口是否监听、数据目录是否可写、retention 是否过短。

### 集群版 VictoriaMetrics

是什么：把写入、存储和查询拆成多个组件。

为什么需要：水平扩展、复制、多租户和更大规模。

怎么工作：

```text
vminsert accepts writes
vmstorage stores data
vmselect handles queries
```

怎么用：生产上用 Helm、Operator 或官方拓扑建议规划。

坏了怎么查：看 vminsert 到 vmstorage 的连接、vmselect 的 `-storageNode` 配置、各组件指标和日志。

### vmagent

是什么：指标采集和 remote write 转发组件。

为什么需要：如果 Prometheus 只负责 scrape 和转发，vmagent 可以作为更轻量的采集器。

怎么工作：

```text
targets
  -> vmagent scrape
  -> relabel / filter / aggregate
  -> remote write
  -> VictoriaMetrics
```

怎么用：配置 scrape targets 和 remote write URL。

坏了怎么查：看 targets 是否 up、remote write 是否失败、relabel 是否误删指标。

### vmalert

是什么：规则计算组件。

为什么需要：查询 VictoriaMetrics 并执行 recording rules 和 alerting rules。

怎么工作：

```text
vmalert
  -> query VictoriaMetrics
  -> evaluate rules
  -> send alerts to Alertmanager
```

怎么用：配置 datasource URL、rule 文件、Alertmanager URL。

坏了怎么查：看规则语法、查询是否返回数据、Alertmanager 是否可达。

### MetricsQL

是什么：VictoriaMetrics 的查询语言，和 PromQL 思路相近。

为什么需要：查询指标、聚合、计算 rate、做 dashboard 和规则。

怎么工作：

```text
selector
  -> range function
  -> aggregation
  -> vector result
```

怎么用：

```text
rate(http_requests_total[5m])
sum by (service) (rate(http_requests_total[5m]))
```

坏了怎么查：先查原始指标是否存在，再查 label，再逐层加函数和聚合。

## 架构和数据流

入门架构：

```text
app / node_exporter
  -> Prometheus or vmagent scrape
  -> VictoriaMetrics single-node
  -> Grafana dashboard
  -> vmalert rules
  -> Alertmanager
```

生产集群架构：

```text
many clusters
  -> vmagent
  -> vminsert
  -> vmstorage
  -> vmselect
  -> Grafana / vmalert / API
```

AIOps 扩展：

```text
VictoriaMetrics query API
  -> Python / pandas
  -> machine learning anomaly score
  -> LangGraph / RAG summary
  -> incident evidence
```

## 安装与启动

使用 Docker 启动单机版：

```powershell
docker run -d --name victoriametrics `
  -p 8428:8428 `
  -v vmdata:/victoria-metrics-data `
  victoriametrics/victoria-metrics:latest `
  -retentionPeriod=30d
```

预期结果：

```text
容器处于 running 状态，浏览器访问 http://localhost:8428/vmui/ 可以打开 VMUI。
```

检查：

```powershell
docker ps --filter "name=victoriametrics"
Invoke-WebRequest http://localhost:8428/health
```

## 配置详解

常见启动参数：

| 参数 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `-retentionPeriod=30d` | 数据保留 30 天 | 默认保留期不符合复盘需求 |
| `-storageDataPath` | 数据目录 | 容器不挂卷，重建后数据丢失 |
| `-httpListenAddr=:8428` | HTTP 监听地址 | 端口没映射，外部访问不到 |
| `-promscrape.config` | 单机版内置 scrape 配置 | 学习阶段可用，生产多用 vmagent |
| `-search.maxQueryDuration` | 查询最长时间 | 大查询被提前终止 |

Prometheus remote write 示例：

```yaml
remote_write:
  - url: "http://victoriametrics:8428/api/v1/write"
```

## 常用命令

```powershell
docker logs victoriametrics
Invoke-WebRequest http://localhost:8428/health
Invoke-WebRequest "http://localhost:8428/api/v1/query?query=up"
docker stop victoriametrics
docker rm victoriametrics
```

每条命令在检查什么：

| 命令 | 作用 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `docker logs` | 看启动和错误日志 | 没有持续报错 | 参数、数据目录、端口 |
| `/health` | 健康检查 | HTTP 200 | 容器状态、端口映射 |
| `/api/v1/query` | 查询指标 | JSON result | 指标是否写入 |
| `docker stop/rm` | 清理实验容器 | 容器停止删除 | 是否还有进程占端口 |

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `/api/v1/write` | Prometheus remote write 入口 | Prometheus 配置 remote write | URL、网络 | 指标写入 | 网络不通、路径写错 |
| `/api/v1/import/prometheus` | 导入 Prometheus 文本格式 | POST 文本指标 | 指标名、labels、value | 可查询到数据 | 格式不对 |
| `/api/v1/query` | 即时查询 | `query=up` | MetricsQL 表达式 | JSON result | label 写错 |
| `/api/v1/query_range` | 范围查询 | `query=rate(...[5m])` | start/end/step | 时间序列结果 | step 太小 |
| `vmagent` | 采集和转发 | remote write 到 VictoriaMetrics | scrape config | targets 正常 | relabel 误删 |
| `vmalert` | 规则和告警 | query + rules + alertmanager | rule file | 触发告警 | datasource 配错 |

## 在 AIOps 中的作用

VictoriaMetrics 属于 AIOps 的指标存储层：

```text
metrics
  -> VictoriaMetrics
  -> query / dashboard / alert rules
  -> anomaly detection / RCA / capacity planning
```

它给 AIOps 提供：

- 更长时间窗口的指标证据。
- 多集群指标汇聚。
- SLO burn rate 和历史趋势查询。
- 异常检测训练数据。
- 事故复盘中的指标截图和查询结果。

## 入门实验

### 实验目标

手动写入一条 AIOps demo 指标，再用查询 API 查出来。

### 实验步骤

启动 VictoriaMetrics 后，写入一条 Prometheus 文本格式指标：

```powershell
$body = 'aiops_demo_requests_total{service="order-api",status="200"} 42'
Invoke-WebRequest `
  -Method Post `
  -Uri "http://localhost:8428/api/v1/import/prometheus" `
  -Body $body
```

查询：

```powershell
Invoke-RestMethod "http://localhost:8428/api/v1/query?query=aiops_demo_requests_total"
```

也可以打开：

```text
http://localhost:8428/vmui/
```

输入：

```text
aiops_demo_requests_total
```

### 验证结果

你应该能看到类似：

```json
{
  "metric": {
    "__name__": "aiops_demo_requests_total",
    "service": "order-api",
    "status": "200"
  },
  "value": [...]
}
```

这说明写入路径、存储路径和查询路径都通了。

### 如果没有成功

按顺序检查：

1. `docker ps` 是否看到 `victoriametrics`。
2. `http://localhost:8428/health` 是否返回 200。
3. 写入文本是否包含指标名和值。
4. 查询的指标名是否一致。
5. 是否把容器端口映射到本机 8428。

## 常见故障排查

### 写入后查不到

- 可能原因：写入端点错误、请求体格式错误、查询指标名不一致。
- 检查命令：`docker logs victoriametrics`，再查 `/api/v1/query`。
- 解决办法：先用 `/api/v1/import/prometheus` 写最小指标，确认链路。

### Grafana 连接失败

- 可能原因：URL 写错、容器网络不通、数据源类型不对。
- 检查方法：Grafana data source test，或者从 Grafana 容器里 curl VictoriaMetrics。
- 解决办法：同一个 compose 网络中使用服务名，例如 `http://victoriametrics:8428`。

### 查询很慢

- 可能原因：label cardinality 高、时间范围太大、step 太小、表达式太复杂。
- 检查方法：缩小时间范围，先查原始 selector，再逐步加聚合。
- 解决办法：优化 label 设计，限制高基数字段，增加 recording rules。

### 磁盘增长很快

- 可能原因：retention 太长、采集频率太高、指标数量太多。
- 检查方法：看数据目录大小、active series 数量、scrape 配置。
- 解决办法：调整 retention、降低无用指标、过滤高基数标签。

### vmalert 不发告警

- 可能原因：规则查询无结果、Alertmanager URL 错、规则时间窗口不合适。
- 检查方法：看 vmalert 日志、手动执行查询、检查 Alertmanager。
- 解决办法：先写简单 always-firing 规则确认链路，再调业务规则。

## 面试怎么讲

可以这样说：

```text
VictoriaMetrics 是 Prometheus 兼容的时序数据库和监控组件集合。我会把它放在 AIOps 指标存储层，用 Prometheus 或 vmagent 采集指标，通过 remote write 写入 VictoriaMetrics，再由 Grafana 查询展示、vmalert 执行规则、Python 或 AIOps 服务读取历史指标做异常检测和复盘。单机版适合学习和中小规模，集群版通过 vminsert、vmstorage、vmselect 分离写入、存储和查询，适合更大规模。使用时我会重点关注 retention、label cardinality、查询范围、备份和安全访问，不会把它当成万能监控平台。
```

## 学习检查清单

- [ ] 我能解释 VictoriaMetrics 和 Prometheus 的关系。
- [ ] 我能区分单机版和集群版。
- [ ] 我能说出 vmagent、vmalert、vminsert、vmselect、vmstorage 的作用。
- [ ] 我能写入一条 demo 指标并查询。
- [ ] 我能解释 remote write。
- [ ] 我能说明 retention 和 cardinality 的风险。
- [ ] 我能把 VictoriaMetrics 接到 Grafana 的位置讲清楚。
- [ ] 我能说明它在 AIOps 历史指标分析中的价值。

## 面试题

1. VictoriaMetrics 解决了 Prometheus 哪些边界问题？
2. 单机版 VictoriaMetrics 适合什么场景？
3. VictoriaMetrics 集群版的 vminsert、vmstorage、vmselect 分别做什么？
4. vmagent 和 Prometheus scrape 有什么关系？
5. vmalert 在告警链路里做什么？
6. MetricsQL 和 PromQL 有什么关系？
7. 什么是 label cardinality？为什么危险？
8. retention 应该怎么设计？
9. Grafana 查询 VictoriaMetrics 的链路是什么？
10. AIOps 为什么需要长期指标数据？

## 学习证据

学习完成后，把下面内容提交到 GitHub：

- `docker-compose.yaml` 或启动命令记录。
- 一张 VMUI 查询 `aiops_demo_requests_total` 的截图。
- 一份 `prometheus.yml` remote write 示例。
- 一份 `victoriametrics-notes.md`：说明 retention、cardinality、单机/集群边界。
- 一条排障记录：写入后查不到时如何定位。
