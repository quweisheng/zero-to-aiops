# TCE 数据与中间件语义实验

脚本用内存字典/队列模拟“数据库为权威账、缓存加速、消息通知、搜索索引消费”的最小数据流。它不安装或模拟 TDSQL、Redis、Kafka/Pulsar、Elasticsearch 的网络、持久化、集群和产品控制面。

```powershell
python examples/tce-data-middleware-lab/lab.py
python examples/tce-data-middleware-lab/lab.py --fault
```

正常场景预期 `handled=1 duplicates=0`；故障场景注入重复事件，预期 `handled=1 duplicates=1`，证明消费者用稳定 `eventId` 避免重复副作用。完整边界见 [TCE 数据与中间件技术地图](../../docs/tech-stack/data-ai/tce-data-middleware.md)。
