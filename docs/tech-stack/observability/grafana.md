# Grafana 精讲

> 学习目标：能启动 Grafana，连接 Prometheus 数据源，创建第一个 dashboard，理解 panel、query、variable、alert rule，并能设计一个适合 AIOps 值班排障的仪表盘。

## 官方资料

- [Grafana Get started](https://grafana.com/docs/grafana/latest/getting-started/)
- [Get started with Grafana and Prometheus](https://grafana.com/docs/grafana/latest/fundamentals/getting-started/first-dashboards/get-started-grafana-prometheus/)
- [Prometheus data source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Grafana dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)

说明：本文基于 Grafana 官方文档和 AIOps 学习场景整理，保留官方链接，不复制官方全文。

## 为什么要学 Grafana

Prometheus 负责采集和查询指标，但它的 Web UI 更像调试工具，不适合作为长期值班大屏。Grafana 的作用是把 Prometheus、Loki、Elasticsearch、MySQL 等数据源里的数据，用更清晰的方式展示出来。

运维和 AIOps 场景里，Grafana 常用于：

- 展示服务健康状态。
- 展示 SLI、SLO、错误率、延迟。
- 对比发布前后的指标变化。
- 观察告警发生前后的上下文。
- 给项目作品集提供可视化截图。

一个好 dashboard 的价值不是“好看”，而是让人更快回答问题：

```text
现在有没有故障？
故障影响哪个服务？
是流量问题、错误率问题、延迟问题，还是资源问题？
最近有没有发布、扩容、配置变更？
```

## Grafana 是什么

Grafana 是一个可观测性数据可视化平台。它通常不直接负责采集指标，而是连接不同数据源并展示查询结果。

一句话总结：

```text
Grafana = 数据源连接 + 查询编辑 + 仪表盘展示 + 告警管理
```

常见数据源：

- Prometheus：指标。
- Loki：日志。
- Elasticsearch / OpenSearch：日志和搜索。
- Tempo / Jaeger：链路追踪。
- MySQL / PostgreSQL：业务或运维表数据。
- CloudWatch、InfluxDB、VictoriaMetrics 等。

## 它解决什么问题

如果只有 Prometheus，你能查指标，但不方便长期观察多个指标之间的关系。

Grafana 解决的是这些问题：

- 把多个 PromQL 结果放到同一个页面。
- 用曲线、表格、单值、仪表、热力图展示数据。
- 通过变量按环境、服务、实例筛选。
- 把 dashboard JSON 保存到 GitHub，形成可复用资产。
- 在同一个平台里管理 dashboard 和告警。

## 核心概念

### Data source

数据源就是 Grafana 要查询的数据系统，比如 Prometheus。

连接 Prometheus 时，Grafana 需要知道 Prometheus 的 URL：

```text
http://localhost:9090
```

如果 Grafana 和 Prometheus 在同一个 Docker Compose 网络里，URL 通常不是 `localhost`，而是服务名：

```text
http://prometheus:9090
```

这点非常重要。容器里的 `localhost` 指向容器自己，不指向另一个容器。

### Dashboard

Dashboard 是仪表盘页面，通常围绕一个服务、一个系统、一个业务域或一个值班场景组织。

示例：

- `API 服务健康总览`
- `Kubernetes 节点资源`
- `订单链路 SLO`
- `告警治理效果`

### Panel

Panel 是 dashboard 里的一个图表或组件。

常见 panel 类型：

| Panel | 适合展示什么 |
|---|---|
| Time series | 随时间变化的指标曲线 |
| Stat | 单个核心数值 |
| Gauge | 当前值和阈值关系 |
| Table | 多实例、多服务对比 |
| Logs | 日志内容 |
| Heatmap | 延迟分布、密度分布 |

### Query

Query 是 panel 背后的查询。Prometheus 数据源通常使用 PromQL。

比如服务是否在线：

```text
up{job="demo-app"}
```

5 分钟请求速率：

```text
sum(rate(http_requests_total{job="demo-app"}[5m]))
```

错误率：

```text
sum(rate(http_requests_total{job="demo-app",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{job="demo-app"}[5m]))
```

### Variable

变量让 dashboard 可以动态筛选。比如选择环境、服务、实例。

Prometheus 常用变量查询：

```text
label_values(up, job)
```

如果变量名叫 `job`，panel 查询里可以这样用：

```text
up{job="$job"}
```

这样同一个 dashboard 可以复用给多个服务。

## 架构和数据流

Grafana 的数据流可以这样理解：

```text
Browser
  -> Grafana UI
  -> Grafana backend
  -> Data source plugin
  -> Prometheus / Loki / Elasticsearch
  -> query result
  -> panel rendering
```

Grafana 本身也有数据库，用来保存用户、组织、dashboard、数据源配置、告警规则等元数据。个人学习阶段可以直接用默认配置。生产环境一般会考虑持久化、备份、权限、HTTPS、统一认证。

## 安装与启动

最小 Docker 启动：

```bash
docker run --rm --name grafana -p 3000:3000 grafana/grafana
```

访问：

```text
http://localhost:3000
```

默认首次登录通常使用：

```text
用户名：admin
密码：admin
```

首次登录后会提示修改密码。

## 连接 Prometheus 数据源

### 手动配置

在 Grafana 页面中：

1. 进入 Connections 或 Data sources。
2. 选择 Prometheus。
3. URL 填写 Prometheus 地址。
4. 点击 Save & test。

如果 Grafana 和 Prometheus 都在宿主机上：

```text
http://localhost:9090
```

如果 Grafana 在 Docker Compose 中，Prometheus 服务名叫 `prometheus`：

```text
http://prometheus:9090
```

### Provisioning 思路

手动点页面适合学习。长期维护时，建议把数据源配置写成文件，放进 GitHub。

示例 `datasources.yml`：

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

这类配置叫 provisioning，可以让 Grafana 启动时自动加载数据源和 dashboard。它的好处是可复制、可审计、可回滚。

## 第一个 dashboard 应该放什么

不要一开始就堆几十张图。对一个 demo 服务，先放 6 个关键视图：

| 位置 | Panel | 目的 |
|---|---|---|
| 第一行 | 服务是否在线 | 判断是不是整体挂了 |
| 第一行 | QPS | 看流量是否变化 |
| 第一行 | 错误率 | 看用户影响 |
| 第二行 | P95/P99 延迟 | 看慢请求 |
| 第二行 | CPU / 内存 | 看资源瓶颈 |
| 第二行 | 最近告警或异常 | 看是否已有信号 |

一个基础服务 dashboard 的阅读顺序：

```text
先看在线状态
  -> 再看错误率和延迟
  -> 再看流量变化
  -> 再看资源指标
  -> 最后关联日志、发布和告警
```

## AIOps dashboard 设计方法

AIOps 的 dashboard 不应该只是“机器指标集合”。它应该帮助你把异常转成判断。

推荐按层次设计：

### 第一层：用户影响

- 可用性。
- 错误率。
- P95/P99 延迟。
- 成功请求量。

### 第二层：服务内部

- 实例数。
- 请求队列。
- 线程池。
- 依赖调用失败率。

### 第三层：基础资源

- CPU。
- 内存。
- 磁盘。
- 网络。

### 第四层：变更上下文

- 最近发布。
- 配置变更。
- 扩容缩容。
- 告警静默。

为什么要这样分层？因为排障时要先确认用户影响，再找内部原因。只盯着 CPU，很容易误判。

## Grafana Alerting

Grafana 也可以管理告警。常见概念：

| 概念 | 含义 |
|---|---|
| Alert rule | 告警判断规则 |
| Contact point | 通知渠道，比如邮件、Webhook |
| Notification policy | 告警路由策略 |
| Silence | 临时静默 |
| Evaluation group | 规则计算分组 |

学习阶段可以先理解：Grafana 告警和 Prometheus 告警都可以用，但不要重复对同一件事发两套告警。否则会制造噪音。

## 入门实验：做一个 Prometheus 健康 dashboard

### 实验目标

最终你应该能看到：

- Grafana 成功连接 Prometheus。
- Dashboard 中有一个 `up` 曲线或单值面板。
- Dashboard 中有一个 Prometheus 自身抓取耗时或样本数量图。
- 能导出 dashboard JSON 并保存到 GitHub。

### 第一步：启动 Grafana

```bash
docker run --rm --name grafana -p 3000:3000 grafana/grafana
```

### 第二步：确认 Prometheus 已启动

访问：

```text
http://localhost:9090/targets
```

确认至少有一个 target 是 UP。

### 第三步：添加 Prometheus 数据源

URL 填：

```text
http://host.docker.internal:9090
```

这里假设 Grafana 在容器中，Prometheus 暴露在宿主机 `9090` 端口。

如果你用 Docker Compose 同时启动两者，URL 应改成：

```text
http://prometheus:9090
```

### 第四步：创建 panel

新建 dashboard，添加一个 Time series panel。

PromQL：

```text
up
```

Panel 标题：

```text
Target Up
```

### 第五步：保存并导出 JSON

把 dashboard 保存为：

```text
AIOps Demo - Prometheus Health
```

导出 JSON 后，建议保存到：

```text
labs/grafana/dashboards/prometheus-health.json
```

## 常见故障排查

### Save & test 失败

常见原因：

- Prometheus 没启动。
- URL 写错。
- 容器里写了错误的 `localhost`。
- 端口没有映射。
- Grafana 和 Prometheus 不在同一个 Docker 网络。

检查方式：

```bash
docker ps
docker logs grafana
```

如果使用 Docker Compose，进入 Grafana 容器测试：

```bash
docker compose exec grafana wget -qO- http://prometheus:9090/-/ready
```

如果返回 `Prometheus Server is Ready.`，说明网络连通。

### Panel 没有数据

排查顺序：

1. Prometheus 里能不能查到这个 PromQL。
2. Grafana dashboard 时间范围是不是太短。
3. 变量是否过滤掉了数据。
4. Prometheus 数据源是不是选错了。
5. 指标名或标签是否写错。

### 图表能看但不好用

常见问题：

- 没有单位，别人不知道数值含义。
- 没有阈值，看不出危险程度。
- Legend 不清楚，多条线无法区分。
- 面板太多，排障时找不到重点。
- 只展示资源指标，没有用户影响指标。

改进方法：

- 给延迟设置 `seconds` 或 `milliseconds` 单位。
- 给错误率设置百分比单位。
- 给关键面板设置阈值颜色。
- Legend 使用服务名、实例名、状态码。
- 首页只放最关键的 6 到 10 个面板。

## 在 AIOps 中的作用

Grafana 是 AIOps 的可视化和反馈入口。

```text
指标 / 日志 / 链路
  -> Grafana dashboard
  -> 人理解系统状态
  -> 发现异常模式
  -> 设计告警规则
  -> 验证降噪和自动化效果
```

你做 AIOps 项目时，Grafana 截图非常重要。它能让面试官看到：你不是只写了脚本，而是能把系统状态、异常和治理结果展示出来。

## 学习检查清单

- [ ] 我能解释 Grafana 和 Prometheus 的区别。
- [ ] 我能启动 Grafana 并登录。
- [ ] 我能添加 Prometheus 数据源。
- [ ] 我能解释为什么容器中不能随便写 `localhost`。
- [ ] 我能创建一个 dashboard 和 panel。
- [ ] 我能写一个 `up` 查询面板。
- [ ] 我能创建一个变量并在 PromQL 中使用。
- [ ] 我能导出 dashboard JSON。
- [ ] 我能说出一个 AIOps dashboard 应该先看用户影响指标。

## 面试题

1. Grafana 主要解决什么问题？
2. Grafana 和 Prometheus 的关系是什么？
3. 为什么 Grafana 容器里访问 Prometheus 时常用服务名而不是 localhost？
4. Dashboard、panel、query、variable 分别是什么？
5. 一个服务健康 dashboard 应该包含哪些核心指标？
6. 为什么只展示 CPU 和内存不是好的 AIOps dashboard？
7. Grafana dashboard 为什么要导出 JSON 放到 GitHub？
8. Grafana Alerting 和 Prometheus Alerting 怎么选择？
9. Panel 没有数据时你会如何排查？
10. 如何让 dashboard 更适合值班排障？

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/grafana/dashboards/prometheus-health.json`
- 一张 Grafana dashboard 截图。
- 一篇笔记：`一个好的 AIOps dashboard 应该如何分层.md`
- 一条踩坑记录：`Grafana 容器里为什么访问不到 localhost:9090.md`
