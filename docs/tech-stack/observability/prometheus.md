# Prometheus

> 鐩爣锛氳兘閲囬泦鎸囨爣銆佹煡璇?PromQL銆侀厤缃憡璀﹁鍒欙紝骞剁悊瑙?Prometheus 鍦?AIOps 鏁版嵁閾捐矾閲岀殑浣嶇疆銆?
## 瀹樻柟璧勬枡

- [Prometheus overview](https://prometheus.io/docs/introduction/overview/)
- [Prometheus configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Prometheus querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

璇存槑锛氭湰鏂囨槸鍩轰簬 Prometheus 瀹樻柟鏂囨。鐨勫師鍒涗腑鏂囧涔犳暀绋嬶紝涓嶅鍒跺畼鏂瑰叏鏂囥€?
## 鏄粈涔?
Prometheus 鏄紑婧愮洃鎺у拰鍛婅绯荤粺锛屼富瑕佸鐞嗘椂闂村簭鍒楁寚鏍囥€傚畠閫傚悎閲囬泦绯荤粺銆佹湇鍔°€佷腑闂翠欢銆並ubernetes 绛夋寚鏍囥€?
## 鏍稿績鍘熺悊

Prometheus 榛樿浣跨敤 pull 妯″紡锛?
1. 鐩爣鏈嶅姟鏆撮湶 `/metrics`銆?2. Prometheus 鎸夐棿闅旀姄鍙栥€?3. 鎸囨爣浠ユ椂闂村簭鍒楀瓨鍌ㄣ€?4. 鐢?PromQL 鏌ヨ銆?5. 鍛婅瑙勫垯瑙﹀彂鍚庡彂閫佺粰 Alertmanager銆?
```text
Targets / Exporters
  -> scrape
  -> Prometheus TSDB
  -> PromQL
  -> dashboard / alert rules
  -> Alertmanager
```

## 鎸囨爣鏍煎紡

绀轰緥锛?
```text
http_requests_total{method="GET",status="200"} 1027
process_cpu_seconds_total 12.5
```

鎸囨爣鐢变笁閮ㄥ垎缁勬垚锛?
- metric name锛氭寚鏍囧悕銆?- labels锛氭爣绛撅紝鐢ㄦ潵鍖哄垎缁村害銆?- value锛氭暟鍊笺€?
## 鎸囨爣绫诲瀷

- Counter锛氬彧澧炰笉鍑忥紝渚嬪璇锋眰鎬绘暟銆?- Gauge锛氬彲澧炲彲鍑忥紝渚嬪鍐呭瓨浣跨敤閲忋€?- Histogram锛氭《缁熻锛屼緥濡傝姹傝€楁椂鍒嗗竷銆?- Summary锛氬鎴风璁＄畻鍒嗕綅鏁般€?
## 瀹夎鍜屽惎鍔?
Docker 鏂瑰紡锛?
```bash
docker run --name prometheus -p 9090:9090 prom/prometheus
```

浣跨敤閰嶇疆鏂囦欢锛?
```bash
docker run --name prometheus \
  -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" \
  prom/prometheus
```

## 鏍稿績閰嶇疆

`prometheus.yml`锛?
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

瀛楁璇存槑锛?
- `scrape_interval`锛氭姄鍙栭棿闅斻€?- `evaluation_interval`锛氳鍒欒绠楅棿闅斻€?- `scrape_configs`锛氭姄鍙栫洰鏍囥€?- `job_name`锛氫换鍔″悕绉般€?- `targets`锛氱洰鏍囧湴鍧€銆?
## PromQL 鍏ラ棬

鐩爣鏄惁鍦ㄧ嚎锛?
```text
up
```

5 鍒嗛挓璇锋眰閫熺巼锛?
```text
rate(http_requests_total[5m])
```

鎸夋湇鍔¤仛鍚堬細

```text
sum by (service) (rate(http_requests_total[5m]))
```

閿欒鐜囷細

```text
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

## 鍛婅瑙勫垯

```yaml
groups:
  - name: demo.rules
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Instance is down"
          description: "{{ $labels.instance }} has been down for 2 minutes"
```

## 鍦?AIOps 涓殑浣滅敤

- 鎻愪緵寮傚父妫€娴嬬殑鏁版嵁婧愩€?- 鎻愪緵 SLI/SLO 鎵€闇€鎸囨爣銆?- 鎻愪緵鍛婅闄嶅櫔鐨勫師濮嬪憡璀︺€?- 鍜?Grafana 缁勬垚鍙鍖栧叆鍙ｃ€?
## 鍏ラ棬瀹為獙

1. 鍚姩 Prometheus銆?2. 璁块棶 `http://localhost:9090/targets`銆?3. 鏌ヨ `up`銆?4. 淇敼閰嶇疆鎶撳彇涓€涓?demo app銆?5. 鍐欎竴鏉?`InstanceDown` 鍛婅銆?
## 鎺掗殰娓呭崟

### Target down

- 鐩爣鍦板潃鏄惁姝ｇ‘銆?- 缃戠粶鏄惁鑳借闂€?- `/metrics` 鏄惁杩斿洖 200銆?- 鏈嶅姟鏄惁鐩戝惉 `0.0.0.0`銆?
### PromQL 娌＄粨鏋?
- 鏃堕棿鑼冨洿鏄惁姝ｇ‘銆?- label 鏄惁鍐欓敊銆?- 鎸囨爣鍚嶆槸鍚﹀瓨鍦ㄣ€?- 鎶撳彇鏄惁鎴愬姛銆?
### 鎸囨爣澶

- 妫€鏌ラ珮鍩烘暟鏍囩锛屽 user_id銆乺equest_id銆?- 涓嶈鎶婃棤闄愬彉鍖栫殑鍊兼斁杩?label銆?
## 瀛︿範璇佹嵁

- `prometheus.yml`
- 涓€涓?PromQL 鏌ヨ绗旇
- 涓€涓憡璀﹁鍒欐枃浠?- 涓€绡囪褰曪細Counter 鍜?Gauge 鐨勫尯鍒?
