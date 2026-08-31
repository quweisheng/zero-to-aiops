# Apache Pulsar 本地消息链实验

这是官方 standalone 容器的教学用法，不安装 TCE，也不验证现场腾讯云消息产品、版本、鉴权、BookKeeper 或多机房复制。

```powershell
docker run --name pulsar-learning -d -p 127.0.0.1:16650:6650 -p 127.0.0.1:18080:8080 --mount source=pulsar-learning-data,target=/pulsar/data --mount source=pulsar-learning-conf,target=/pulsar/conf apachepulsar/pulsar:4.0.13 bin/pulsar standalone
docker exec pulsar-learning bin/pulsar-admin brokers healthcheck
docker exec pulsar-learning bin/pulsar-admin topics create persistent://public/default/incidents
docker exec pulsar-learning bin/pulsar-admin topics create-subscription -s incident-worker -m earliest persistent://public/default/incidents
docker exec pulsar-learning bin/pulsar-client produce persistent://public/default/incidents -m 'incident=INC-001;status=OPEN'
docker exec pulsar-learning bin/pulsar-client consume persistent://public/default/incidents -s incident-worker -n 1
docker exec pulsar-learning bin/pulsar-admin topics stats persistent://public/default/incidents
```

故障注入、恢复和字段解释在 [Apache Pulsar 深讲](../../docs/tech-stack/data-ai/apache-pulsar.md)。清理只删除本实验容器和两个命名卷：

```powershell
docker rm -f pulsar-learning
docker volume rm pulsar-learning-data pulsar-learning-conf
```
