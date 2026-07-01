# Alertmanager

> 目标：理解告警的分组、去重、路由、静默和抑制，能写一份最小 Alertmanager 配置。

## 官方资料

- [Alertmanager overview](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Alertmanager configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

说明：本文是基于 Prometheus/Alertmanager 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Alertmanager 是 Prometheus 生态里的告警处理组件。Prometheus 负责判断“告警是否触发”，Alertmanager 负责处理“告警发给谁、怎么合并、什么时候静默、哪些告警互相抑制”。

## 核心原理

```text
Prometheus alert rules
  -> firing alerts
  -> Alertmanager
       grouping
       deduplication
       routing
       inhibition
       silences
  -> receivers
       email / webhook / chat / on-call
```

Alertmanager 主要靠告警 label 做匹配和路由。

## 架构和概念

- Route：路由树，决定告警去哪里。
- Receiver：接收器，例如 webhook、email。
- Grouping：分组，把相似告警合并。
- Inhibition：抑制，例如整机宕机时抑制单服务告警。
- Silence：静默，一段时间内不通知。
- Matcher：标签匹配条件。

## 最小配置

```yaml
route:
  receiver: "default"
  group_by: ["alertname", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: "default"
    webhook_configs:
      - url: "http://localhost:8080/alerts"
```

字段解释：

- `group_by`：哪些标签相同就分到一组。
- `group_wait`：首次通知前等待时间。
- `group_interval`：同一组新告警的通知间隔。
- `repeat_interval`：重复提醒间隔。

## 路由示例

```yaml
route:
  receiver: "default"
  routes:
    - matchers:
        - severity="critical"
      receiver: "critical-webhook"
    - matchers:
        - team="database"
      receiver: "db-webhook"

receivers:
  - name: "default"
    webhook_configs:
      - url: "http://localhost:8080/default"
  - name: "critical-webhook"
    webhook_configs:
      - url: "http://localhost:8080/critical"
  - name: "db-webhook"
    webhook_configs:
      - url: "http://localhost:8080/db"
```

## 抑制示例

```yaml
inhibit_rules:
  - source_matchers:
      - alertname="NodeDown"
    target_matchers:
      - severity="warning"
    equal: ["instance"]
```

含义：如果某个 instance 有 NodeDown 告警，就抑制同一个 instance 上的 warning 告警。

## 在 AIOps 中的作用

- 告警降噪第一层。
- 为事件聚合提供更干净输入。
- webhook 可以接入 Python/LLM 服务生成摘要。
- 静默和抑制规则能减少值班疲劳。

## 入门实验

1. 写 Prometheus 告警规则 `InstanceDown`。
2. 配置 Prometheus 发送到 Alertmanager。
3. 配置 Alertmanager webhook。
4. 用一个本地 FastAPI 服务接收告警。
5. 打印告警 JSON，观察 labels 和 annotations。

## 告警 JSON 里关注什么

- `status`：firing 或 resolved。
- `labels.alertname`
- `labels.severity`
- `labels.service`
- `labels.instance`
- `annotations.summary`
- `startsAt`
- `endsAt`

## 排障清单

### 没收到告警

- Prometheus 告警是否 firing。
- Prometheus 是否配置 alertmanagers。
- Alertmanager 地址是否可达。
- route 是否匹配。

### 告警太多

- 检查 `group_by` 是否过细。
- 检查重复提醒间隔。
- 增加抑制规则。
- 优先按 service、alertname 分组。

### 告警没发给预期接收器

- 检查 matcher。
- 检查 route 顺序。
- 检查标签是否存在。

## 学习证据

- `alertmanager.yml`
- 一个 webhook 接收脚本
- 一篇记录：group、route、silence、inhibit 的区别
