# Prometheus 精讲

> 学习目标：能启动 Prometheus，读懂 `prometheus.yml`，理解指标、标签、抓取、PromQL、告警规则，并知道它在 AIOps 数据链路里的位置。

## 官方资料

- [Prometheus Overview](https://prometheus.io/docs/introduction/overview/)
- [Prometheus Getting Started](https://prometheus.io/docs/prometheus/latest/getting_started/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

说明：本文基于 Prometheus 官方文档和运维学习场景整理，保留官方链接，不复制官方全文。

## 为什么要学

AIOps 不是一上来就训练模型。真正的顺序是：先有数据，再有规则，再有分析，再有自动化。

Prometheus 解决的是“指标数据从哪里来、怎么存、怎么查、怎么触发告警”的问题。没有指标数据，后面的异常检测、容量预测、SLO 计算、告警降噪都没有输入。

对运维来说，Prometheus 能把这些问题数字化：

- 服务是不是还活着？
- CPU、内存、磁盘、网络有没有异常？
- 请求量是不是突然上涨？
- 错误率是不是超过阈值？
- P95 延迟是不是变慢？
- 某个实例是不是经常抖动？

对 AIOps 来说，Prometheus 是常见的时序数据源。你以后做异常检测时，可能就是从 Prometheus 查询一段指标，再用 Python 或机器学习方法判断它是否异常。

## Prometheus 是什么

Prometheus 是一个开源的监控和告警系统，核心处理对象是时间序列指标。

时间序列可以理解成“一组随时间变化的数字”。比如：

```text
2026-07-01 10:00:00 cpu_usage 20
2026-07-01 10:00:15 cpu_usage 35
2026-07-01 10:00:30 cpu_usage 80
```

Prometheus 不擅长保存日志全文，也不适合保存业务订单明细。它擅长保存数值指标，比如 CPU 使用率、请求数、错误数、延迟、队列长度、连接数。

一句话总结：

```text
Prometheus = 指标采集 + 时序存储 + PromQL 查询 + 告警规则
```

## 它解决什么问题

传统运维经常靠登录机器、执行命令、查看日志来判断问题。这种方式有几个缺点：

- 只能看到当下，难以回看历史趋势。
- 靠人工判断，无法稳定触发告警。
- 服务多了以后，逐台登录效率很低。
- 指标散落在不同机器上，不方便统一查询。

Prometheus 把这些指标集中起来：

```text
应用 / 主机 / 中间件
  -> 暴露指标
  -> Prometheus 定时抓取
  -> 本地时序数据库保存
  -> PromQL 查询
  -> Grafana 展示 / Alertmanager 告警 / AIOps 分析
```

## 核心原理

### Pull 抓取模型

Prometheus 默认采用 pull 模式。也就是 Prometheus 主动访问目标服务，而不是目标服务主动把数据推给 Prometheus。

流程是：

1. 应用或 exporter 暴露一个 HTTP 接口，通常是 `/metrics`。
2. Prometheus 按照配置里的时间间隔访问这个接口。
3. 目标返回纯文本格式的指标。
4. Prometheus 给样本加上时间戳并写入本地时序数据库。
5. 用户用 PromQL 查询，或者用规则触发告警。

示例指标：

```text
http_requests_total{method="GET",status="200"} 1027
process_cpu_seconds_total 12.5
```

第一行可以读成：

```text
名为 http_requests_total 的指标，在 method=GET、status=200 这个维度组合下，当前值是 1027。
```

### 指标名和标签

Prometheus 的一条时间序列由指标名和标签共同决定。

```text
http_requests_total{method="GET",status="200",instance="app:8000"}
http_requests_total{method="POST",status="500",instance="app:8000"}
```

这两条是不同的时间序列，因为标签不同。

标签很强大，但也容易出问题。不要把无限变化的值放到标签里，比如：

- `user_id`
- `request_id`
- `trace_id`
- 完整 URL 参数

这些会造成高基数问题，也就是时间序列数量爆炸。Prometheus 会变慢，内存会升高，磁盘也会增长很快。

### 四种指标类型

Prometheus 客户端库常见四类指标：

| 类型 | 适合记录什么 | 例子 |
|---|---|---|
| Counter | 只增不减的累计值 | 请求总数、错误总数、任务执行次数 |
| Gauge | 可增可减的瞬时值 | CPU 使用率、内存占用、队列长度 |
| Histogram | 分桶统计分布 | 请求耗时分布、响应大小分布 |
| Summary | 客户端计算分位数 | 客户端侧延迟分位数 |

新手最容易混淆 Counter 和 Gauge。

Counter 像汽车总里程，只会增加。想看每秒请求数，要用 `rate()` 算增长速度。

Gauge 像温度计，会上升也会下降。内存使用量、当前连接数通常用 Gauge。

## 架构和数据流

一个简化的 Prometheus 架构如下：

```text
Application / Exporter
  -> /metrics
  -> Prometheus scrape manager
  -> Prometheus TSDB
  -> PromQL engine
  -> Grafana / API / Alert rules
  -> Alertmanager
  -> Email / Webhook / IM
```

核心组件：

- Prometheus server：负责抓取、存储、查询、规则计算。
- Exporter：把系统或中间件状态转换成 Prometheus 指标格式。
- Client library：应用程序埋点时使用的客户端库。
- PromQL：Prometheus 的查询语言。
- Alertmanager：接收 Prometheus 告警，做分组、抑制、静默和通知。
- Grafana：常用可视化工具，连接 Prometheus 展示 dashboard。

## 安装与启动

最小 Docker 启动方式：

```bash
docker run --name prometheus -p 9090:9090 prom/prometheus
```

访问：

```text
http://localhost:9090
```

如果需要加载自己的配置文件：

```bash
docker run --name prometheus `
  -p 9090:9090 `
  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml `
  prom/prometheus
```

Windows PowerShell 使用反引号换行；Linux/macOS shell 使用反斜杠换行。

## 配置文件详解

最小 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

逐项解释：

| 配置项 | 含义 |
|---|---|
| `global` | 全局默认配置 |
| `scrape_interval` | 默认每隔多久抓取一次指标 |
| `evaluation_interval` | 默认每隔多久计算一次规则 |
| `scrape_configs` | 抓取任务列表 |
| `job_name` | 抓取任务名称，会成为 `job` 标签 |
| `static_configs` | 静态目标配置 |
| `targets` | 被抓取目标地址 |

如果你有一个 demo 应用在 `localhost:8000` 暴露 `/metrics`，可以这样配置：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "demo-app"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["host.docker.internal:8000"]
```

注意：如果 Prometheus 运行在 Docker 容器里，容器里的 `localhost` 指的是 Prometheus 容器自己，不是你的宿主机。Windows 和 macOS Docker Desktop 通常可以用 `host.docker.internal` 访问宿主机。

## 常用页面

启动后常看这些页面：

| 页面 | 用途 |
|---|---|
| `/targets` | 查看抓取目标是否 UP |
| `/graph` | 执行 PromQL 查询 |
| `/alerts` | 查看告警规则状态 |
| `/rules` | 查看 recording rules 和 alerting rules |
| `/status/config` | 查看当前加载的配置 |

最常用的是 `/targets`。如果 target 是 DOWN，先不要急着写 PromQL，先把抓取打通。

## PromQL 入门

PromQL 是 Prometheus Query Language，用来查询和计算指标。

### 查询服务是否在线

```text
up
```

`up` 是 Prometheus 自动生成的指标：

- `1` 表示抓取成功。
- `0` 表示抓取失败。

按 job 查看：

```text
up{job="demo-app"}
```

### 查询 5 分钟请求速率

Counter 不能直接看当前值判断 QPS，要用 `rate()`：

```text
rate(http_requests_total[5m])
```

按状态码聚合：

```text
sum by (status) (rate(http_requests_total[5m]))
```

### 查询错误率

假设 `status` 标签保存 HTTP 状态码：

```text
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

这个表达式可以读成：

```text
最近 5 分钟 5xx 请求速率 / 最近 5 分钟全部请求速率
```

### 查询 P95 延迟

如果应用使用 Histogram 暴露了 `http_request_duration_seconds_bucket`：

```text
histogram_quantile(
  0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

含义是：基于最近 5 分钟的耗时分桶，估算 95% 请求不超过多少秒。

## 告警规则

Prometheus 告警规则通常写在单独文件里，比如 `alert_rules.yml`：

```yaml
groups:
  - name: demo-app.rules
    rules:
      - alert: InstanceDown
        expr: up{job="demo-app"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "demo-app instance is down"
          description: "Prometheus cannot scrape demo-app for more than 2 minutes."
```

配置 Prometheus 加载规则：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: "demo-app"
    static_configs:
      - targets: ["host.docker.internal:8000"]
```

字段解释：

| 字段 | 含义 |
|---|---|
| `alert` | 告警名称 |
| `expr` | 触发条件 |
| `for` | 条件持续多久才触发 |
| `labels` | 告警标签，常用于等级和路由 |
| `annotations` | 告警说明，给人看的信息 |

真正生产环境里，不建议只写“CPU 大于 80%”这种粗糙告警。更好的告警应该和用户影响相关，比如错误率、延迟、可用性、队列积压、SLO 消耗速度。

## 在 AIOps 中的作用

Prometheus 处在 AIOps 链路的指标采集层和查询层。

```text
Prometheus 指标
  -> Grafana 可视化
  -> Alertmanager 告警
  -> Python 拉取历史数据
  -> 异常检测 / 容量预测 / 告警降噪
  -> Runbook 自动化
```

典型 AIOps 用法：

- 异常检测：查询 CPU、QPS、错误率、延迟等时间序列，判断是否偏离历史规律。
- 告警降噪：分析同一时间窗口内多个告警之间的关联，合并重复告警。
- 根因分析：把服务指标、主机指标、Kubernetes 指标放在同一时间线上对比。
- SLO 管理：用 PromQL 计算可用性、错误预算消耗、延迟达标率。
- 自动化修复：告警触发后，调用 runbook 或自动化脚本执行诊断。

## 入门实验：监控一个 demo 应用

### 实验目标

最终你应该能看到：

- Prometheus 的 `/targets` 页面里 `demo-app` 是 UP。
- 在 Prometheus 里能查询 `up{job="demo-app"}`。
- 能写出一条 `InstanceDown` 告警规则。
- 能解释 `localhost` 和 `host.docker.internal` 的区别。

### 第一步：准备配置文件

创建 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

### 第二步：启动 Prometheus

PowerShell：

```powershell
docker run --rm --name prometheus `
  -p 9090:9090 `
  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml `
  prom/prometheus
```

### 第三步：打开 targets 页面

浏览器访问：

```text
http://localhost:9090/targets
```

你应该能看到 `prometheus` 这个 target 是 UP。

### 第四步：执行 PromQL

打开：

```text
http://localhost:9090/graph
```

输入：

```text
up
```

如果返回 `1`，说明 Prometheus 至少能抓取自己。

## 常见故障排查

### target 一直 DOWN

先看 `/targets` 页面的错误信息。

常见原因：

- 目标地址写错。
- 目标服务没有启动。
- 目标服务没有暴露 `/metrics`。
- 容器网络里写了错误的 `localhost`。
- 防火墙或端口映射不通。

检查命令：

```bash
docker ps
docker logs prometheus
```

如果目标在宿主机上，Prometheus 在容器里，优先尝试：

```yaml
targets: ["host.docker.internal:8000"]
```

### PromQL 查不到数据

排查顺序：

1. `/targets` 是否 UP。
2. 指标名是否真的存在。
3. 查询时间范围是否太短。
4. 标签是否写错。
5. 是否被 relabel 或 metric relabel 改名。

可以先输入指标名前缀，看 Prometheus 是否自动补全。

### Prometheus 内存越来越高

常见原因是高基数标签。

检查思路：

- 是否把 `user_id`、`request_id` 放到了 label。
- 是否把完整 URL 放到了 label。
- 是否每次请求都会产生新的标签值。
- 是否抓取了过多 target 或过多指标。

解决思路：

- 删除无意义高基数标签。
- 用模板化路径代替完整 URL。
- 降低抓取频率。
- 设置采样和保留策略。
- 对长期存储需求使用远程存储方案。

## 学习检查清单

- [ ] 我能解释 Prometheus 是什么。
- [ ] 我能说清楚 pull 模式。
- [ ] 我能解释指标名、标签、样本、时间序列的关系。
- [ ] 我能区分 Counter 和 Gauge。
- [ ] 我能启动 Prometheus 并访问 `/targets`。
- [ ] 我能写一个最小 `prometheus.yml`。
- [ ] 我能用 `up` 和 `rate()` 写基础 PromQL。
- [ ] 我能写一个 `InstanceDown` 告警规则。
- [ ] 我能说明 Prometheus 在 AIOps 中的数据入口作用。

## 面试题

1. Prometheus 为什么默认使用 pull 模式？
2. Counter 和 Gauge 有什么区别？
3. 为什么 `http_requests_total` 不能直接当 QPS 看？
4. 什么是高基数标签？它会带来什么问题？
5. `scrape_interval` 和 `evaluation_interval` 分别控制什么？
6. Prometheus 和 Grafana 的关系是什么？
7. 如果 target 是 DOWN，你会按什么顺序排查？
8. Prometheus 适合做日志系统吗？为什么？
9. 在 AIOps 异常检测里，Prometheus 可以提供什么数据？
10. 一个好的告警规则应该关注资源指标还是用户影响？

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/prometheus/prometheus.yml`
- `labs/prometheus/alert_rules.yml`
- 一张 `/targets` 页面截图。
- 一篇笔记：`Counter、Gauge、Histogram 的区别.md`
- 一篇排障记录：`Prometheus 容器里为什么不能用 localhost 访问宿主机服务.md`
