# 项目 2：指标异常检测器

## 背景

传统阈值告警容易误报，也很难适应周期性业务流量。这个项目用历史指标训练一个简单异常检测器，输出异常时间段和解释。

## 输入

- 时间戳。
- QPS。
- 错误率。
- P95 延迟。
- CPU / 内存 / 磁盘 / 网络。

## 方法

第一版不要追求复杂：

1. 固定阈值作为 baseline。
2. 滑动窗口均值和标准差作为动态 baseline。
3. IsolationForest 作为模型版本。
4. 比较三种方法的误报、漏报和可解释性。

## 输出

```text
time                  signal       score   reason
2026-07-01 10:15:00   latency_p95  0.91    P95 latency above moving baseline
2026-07-01 10:16:00   error_rate   0.88    Error rate spike with QPS drop
```

## 验收

- 能读取 CSV 样例数据。
- 能输出异常时间段。
- 能生成一张图。
- 能解释为什么这个点异常。
- README 写清楚模型局限性。

## 简历表达草稿

基于 Python、pandas 和 IsolationForest 实现指标异常检测原型，对服务延迟、错误率和资源指标构造滑动窗口特征，并与固定阈值告警进行效果对比，输出异常时间段和可解释原因。
