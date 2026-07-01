# Grafana

> 鐩爣锛氳兘杩炴帴 Prometheus锛屽垱寤轰华琛ㄧ洏锛岄厤缃彉閲忓拰鍛婅锛屾妸鎸囨爣鍙樻垚鍊肩彮鏃惰兘鐪嬫噦鐨勮鍥俱€?
## 瀹樻柟璧勬枡

- [Grafana documentation](https://grafana.com/docs/)
- [Grafana dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Grafana data sources](https://grafana.com/docs/grafana/latest/datasources/)
- [Grafana alerting](https://grafana.com/docs/grafana/latest/alerting/)

璇存槑锛氭湰鏂囨槸鍩轰簬 Grafana 瀹樻柟鏂囨。鐨勫師鍒涗腑鏂囧涔犳暀绋嬶紝涓嶅鍒跺畼鏂瑰叏鏂囥€?
## 鏄粈涔?
Grafana 鏄彲瑙傛祴鎬у彲瑙嗗寲骞冲彴銆傚畠杩炴帴 Prometheus銆丩oki銆丒lasticsearch銆丮ySQL 绛夋暟鎹簮锛屾妸鏌ヨ缁撴灉灞曠ず涓哄浘琛ㄣ€佽〃鏍笺€佸憡璀﹀拰浠〃鐩樸€?
## 鏍稿績鍘熺悊

```text
Data source
  -> Query
  -> Panel
  -> Dashboard
  -> Alert rule
  -> Contact point
```

Grafana 鏈韩閫氬父涓嶈礋璐ｉ噰闆嗘暟鎹紝瀹冭礋璐ｆ煡璇㈠拰灞曠ず銆?
## 瀹夎鍚姩

Docker锛?
```bash
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

璁块棶锛?
```text
http://localhost:3000
```

榛樿璐﹀彿瀵嗙爜閫氬父鏄?`admin/admin`锛岄娆＄櫥褰曢渶瑕佷慨鏀广€?
## 閰嶇疆鏁版嵁婧?
娣诲姞 Prometheus锛?
```text
Connections -> Data sources -> Add data source -> Prometheus
URL: http://prometheus:9090
```

濡傛灉 Grafana 鍜?Prometheus 閮藉湪 Docker Compose 鍐咃紝URL 鐢ㄦ湇鍔″悕锛涘鏋?Grafana 鍦ㄥ涓绘満锛孶RL 鍙互鐢?`http://localhost:9090`銆?
## Dashboard 鏋舵瀯

```text
Dashboard
  -> Row
  -> Panel
       - Query
       - Visualization
       - Thresholds
       - Legend
       - Unit
  -> Variables
```

## 甯歌闈㈡澘

- Time series锛氭椂闂村簭鍒楁洸绾裤€?- Stat锛氬崟涓暟鍊笺€?- Gauge锛氫华琛ㄣ€?- Table锛氳〃鏍笺€?- Logs锛氭棩蹇椼€?- Heatmap锛氱儹鍔涘浘銆?
## AIOps 鍊肩彮浠〃鐩樿璁?
涓€涓湇鍔″仴搴蜂华琛ㄧ洏鑷冲皯鍖呭惈锛?
1. QPS銆?2. 閿欒鐜囥€?3. P95/P99 寤惰繜銆?4. 褰撳墠瀹炰緥鏁般€?5. CPU/鍐呭瓨銆?6. 鏈€杩戝憡璀︺€?7. 鏈€杩戝彂甯冩垨鍙樻洿閾炬帴銆?
## 鍙橀噺

鍙橀噺璁╀华琛ㄧ洏鍙寜鏈嶅姟銆佺幆澧冦€佸疄渚嬬瓫閫夈€?
Prometheus label values 绀轰緥锛?
```text
label_values(up, job)
```

闈㈡澘鏌ヨ閲屼娇鐢細

```text
sum by (instance) (rate(http_requests_total{job="$job"}[5m]))
```

## 鍛婅

Grafana Alerting 閫氬父鍖呭惈锛?
- Alert rule锛氬垽鏂潯浠躲€?- Contact point锛氶€氱煡娓犻亾銆?- Notification policy锛氳矾鐢辩瓥鐣ャ€?- Silence锛氶潤榛樸€?
## 鍦?AIOps 涓殑浣滅敤

- 璁╀汉蹇€熺悊瑙ｇ郴缁熺姸鎬併€?- 灞曠ず椤圭洰鎴愭灉銆?- 鏀拺 incident 鏈熼棿鐨勮瘖鏂€?- 缁欏憡璀︽不鐞嗘彁渚涘彲瑙嗗寲鍙嶉銆?
## 鍏ラ棬瀹為獙

1. 鍚姩 Prometheus 鍜?Grafana銆?2. Grafana 娣诲姞 Prometheus 鏁版嵁婧愩€?3. 鍒涘缓涓€涓?dashboard銆?4. 娣诲姞 `up` 闈㈡澘銆?5. 娣诲姞 QPS/閿欒鐜?寤惰繜闈㈡澘銆?6. 瀵煎嚭 dashboard JSON 淇濆瓨鍒?GitHub銆?
## 閰嶇疆鍗充唬鐮?
Grafana dashboard 鍙互瀵煎嚭 JSON锛屼繚瀛樺埌锛?
```text
grafana/dashboards/service-health.json
```

浠ュ悗鍙互瀛︿範 provisioning锛屾妸鏁版嵁婧愬拰 dashboard 鐢ㄦ枃浠惰嚜鍔ㄥ姞杞姐€?
## 鎺掗殰娓呭崟

### Data source 杩炴帴澶辫触

- URL 鏄惁浠?Grafana 瀹瑰櫒瑙嗚鍙闂€?- Prometheus 鏄惁鍚姩銆?- Docker Compose service 鍚嶇О鏄惁姝ｇ‘銆?
### 闈㈡澘鏃犳暟鎹?
- PromQL 鏄惁鑳藉湪 Prometheus 鏌ュ埌銆?- dashboard 鏃堕棿鑼冨洿鏄惁姝ｇ‘銆?- label 杩囨护鏄惁杩囩獎銆?
### 鍥捐〃鐪嬩笉鎳?
- 璁剧疆鍗曚綅銆?- 璁剧疆 legend銆?- 鍔?threshold銆?- 鎸夋湇鍔?瀹炰緥鍒嗙粍銆?
## 瀛︿範璇佹嵁

- 涓€涓?service health dashboard JSON銆?- 涓€寮犱华琛ㄧ洏鎴浘銆?- 涓€绡囪褰曪細涓€涓ソ浠〃鐩樺簲璇ユ湇鍔″€肩彮锛岃€屼笉鍙槸濂界湅銆?
