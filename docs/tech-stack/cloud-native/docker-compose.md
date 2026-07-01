# Docker Compose

> 鐩爣锛氳兘鐢ㄤ竴涓?YAML 鏂囦欢鍚姩澶氬鍣ㄥ疄楠岀幆澧冿紝渚嬪 demo app + Prometheus + Grafana銆?
## 瀹樻柟璧勬枡

- [Docker Compose overview](https://docs.docker.com/compose/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)

璇存槑锛氭湰鏂囨槸鍩轰簬 Docker 瀹樻柟 Compose 鏂囨。鐨勫師鍒涗腑鏂囧涔犳暀绋嬶紝涓嶅鍒跺畼鏂瑰叏鏂囥€?
## 鏄粈涔?
Docker Compose 鏄畾涔夊拰杩愯澶氬鍣ㄥ簲鐢ㄧ殑宸ュ叿銆備綘鐢?`compose.yaml` 鎻忚堪鏈嶅姟銆佺綉缁溿€佸嵎銆佺鍙ｃ€佺幆澧冨彉閲忥紝鐒跺悗鐢ㄤ竴鏉″懡浠ゅ惎鍔ㄦ暣濂楃幆澧冦€?
## 鏍稿績鍘熺悊

Compose 璇诲彇 YAML 鏂囦欢锛屾妸姣忎釜 service 杞垚瀹瑰櫒锛屽苟鑷姩鍒涘缓榛樿缃戠粶銆傛湇鍔′箣闂村彲浠ョ敤 service 鍚嶇О浜掔浉璁块棶銆?
```text
compose.yaml
  -> docker compose
  -> containers
  -> default network
  -> volumes
```

## 鏂囦欢缁撴瀯

```text
observability-lab/
  compose.yaml
  prometheus.yml
  app/
    Dockerfile
    app.py
```

## 鏈€灏忛厤缃?
```yaml
services:
  app:
    build: ./app
    ports:
      - "8000:8000"

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

## 鍏抽敭瀛楁

- `services`锛氭湇鍔″垪琛ㄣ€?- `image`锛氱洿鎺ヤ娇鐢ㄩ暅鍍忋€?- `build`锛氫粠 Dockerfile 鏋勫缓闀滃儚銆?- `ports`锛氬涓绘満鍜屽鍣ㄧ鍙ｆ槧灏勩€?- `volumes`锛氭寕杞介厤缃垨鏁版嵁銆?- `environment`锛氱幆澧冨彉閲忋€?- `depends_on`锛氬惎鍔ㄩ『搴忎緷璧栥€?- `networks`锛氳嚜瀹氫箟缃戠粶銆?
## 甯哥敤鍛戒护

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose logs -f app
docker compose restart app
docker compose down
docker compose down -v
```

## 鍦?AIOps 涓殑浣滅敤

- 涓€閿惎鍔ㄦ湰鍦板彲瑙傛祴鎬у疄楠屽銆?- 闄嶄綆鍒汉澶嶇幇椤圭洰鐨勬垚鏈€?- 鎶婂疄楠岄厤缃篃绾冲叆 Git 鐗堟湰鎺у埗銆?- 瀛?Kubernetes 鍓嶅厛鐞嗚В澶氭湇鍔¤繍琛屽叧绯汇€?
## 鍏ラ棬瀹為獙

鐩爣锛氬惎鍔?demo app 鍜?Prometheus銆?
`prometheus.yml`锛?
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "demo-app"
    static_configs:
      - targets: ["app:8000"]
```

娉ㄦ剰锛歅rometheus 鍦?Compose 缃戠粶閲岃闂?`app:8000`锛屼笉鏄?`localhost:8000`銆?
鍚姩锛?
```bash
docker compose up -d
docker compose ps
```

鎵撳紑锛?
```text
http://localhost:9090
```

鏌ヨ锛?
```text
up
```

## 鎺掗殰娓呭崟

### 鏈嶅姟涔嬮棿鏃犳硶璁块棶

- 妫€鏌?service 鍚嶇О銆?- 妫€鏌ュ鍣ㄥ唴绔彛锛屼笉鏄涓绘満绔彛銆?- 妫€鏌ュ簲鐢ㄦ槸鍚︾洃鍚?`0.0.0.0`銆?
### 閰嶇疆鏂囦欢娌＄敓鏁?
- 妫€鏌?volume 璺緞銆?- 淇敼閰嶇疆鍚庨噸鍚搴旀湇鍔°€?- 鐢?`docker compose exec` 杩涘叆瀹瑰櫒鏌ョ湅鏂囦欢銆?
### 绔彛鍐茬獊

瀹夸富鏈虹鍙ｈ鍗犵敤鏃讹紝鏀瑰乏渚х鍙ｏ細

```yaml
ports:
  - "9091:9090"
```

## 瀛︿範璇佹嵁

- `compose.yaml`
- 涓€寮犳湇鍔℃嫇鎵戝浘
- 涓€绡囪褰曪細涓轰粈涔堝鍣ㄩ棿璁块棶鐢?service 鍚嶇О

