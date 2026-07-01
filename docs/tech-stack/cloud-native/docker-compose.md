# Docker Compose 精讲

> 学习目标：能用一个 `compose.yaml` 启动多容器实验环境，理解 service、network、volume、port、environment、depends_on，并能搭建 Prometheus + Grafana 本地可观测性实验室。

## 官方资料

- [Docker Compose overview](https://docs.docker.com/compose/)
- [Docker Compose Quickstart](https://docs.docker.com/compose/gettingstarted/)
- [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)

说明：本文基于 Docker 官方文档和 AIOps 学习场景整理，保留官方链接，不复制官方全文。

## 为什么要学 Docker Compose

学 AIOps 会遇到很多组件：Prometheus、Grafana、Loki、Elasticsearch、Kafka、Redis、MySQL、FastAPI demo。每个组件都手动启动，很快就会乱。

Docker Compose 解决的是“本地多服务实验环境如何一键启动”的问题。

你可以把一组容器写进一个 YAML 文件：

```text
demo-app
prometheus
grafana
redis
mysql
```

然后用一条命令启动：

```bash
docker compose up -d
```

这对学习 AIOps 很重要，因为你的 GitHub 仓库不应该只有笔记，还应该能让别人复现你的实验环境。

## Docker Compose 是什么

Docker Compose 是 Docker 官方提供的多容器应用定义和运行工具。它用一个 `compose.yaml` 描述应用由哪些服务组成，每个服务用什么镜像、开放什么端口、挂载什么配置文件、使用什么网络和环境变量。

一句话总结：

```text
Docker Compose = 用 YAML 管理一组相关容器
```

单独的 `docker run` 适合启动一个容器。Docker Compose 适合启动一套环境。

## 它解决什么问题

如果不用 Compose，你启动 Prometheus + Grafana 可能要写很多条命令：

```bash
docker network create aiops
docker run ...
docker run ...
docker run ...
```

问题是：

- 命令难记。
- 端口、卷、网络容易写错。
- 别人很难复现你的环境。
- 每次实验都要重新整理启动顺序。
- 配置无法很好纳入 Git 版本控制。

Compose 把这些内容放到一个文件里：

```text
compose.yaml
  -> services
  -> networks
  -> volumes
  -> configs
```

这样环境本身也变成了代码。

## 核心原理

Compose 读取 `compose.yaml` 后，会把每个 `service` 转换成一个或多个容器，并自动创建默认网络。

服务之间可以用服务名互相访问：

```text
grafana -> http://prometheus:9090
```

这里的 `prometheus` 不是公网域名，而是 Compose 网络里的服务名。Docker 会在内部 DNS 里解析它。

重要理解：

```text
宿主机 localhost
  != prometheus 容器 localhost
  != grafana 容器 localhost
```

每个容器都有自己的网络命名空间。Grafana 容器里的 `localhost:9090` 指向 Grafana 容器自己，不是 Prometheus 容器。

## 架构和数据流

用 Compose 搭一个可观测性实验室，可以这样理解：

```text
compose.yaml
  -> docker compose up
  -> create network
  -> start prometheus
  -> start grafana
  -> mount prometheus.yml
  -> browser visits localhost:3000
  -> Grafana queries http://prometheus:9090
```

Compose 管理的是容器生命周期和连接关系，不负责应用内部逻辑。Prometheus 怎么抓指标、Grafana 怎么展示，仍然由它们自己的配置决定。

## Compose 文件结构

一个最小例子：

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
```

常见字段：

| 字段 | 作用 |
|---|---|
| `services` | 定义服务列表 |
| `image` | 使用哪个镜像 |
| `build` | 从 Dockerfile 构建镜像 |
| `ports` | 宿主机端口和容器端口映射 |
| `volumes` | 挂载配置或数据 |
| `environment` | 设置环境变量 |
| `depends_on` | 声明启动依赖 |
| `networks` | 指定网络 |
| `restart` | 设置重启策略 |
| `command` | 覆盖默认启动命令 |

## 端口映射

端口写法：

```yaml
ports:
  - "3000:3000"
```

左边是宿主机端口，右边是容器端口。

```text
宿主机浏览器访问 localhost:3000
  -> Docker 转发到 Grafana 容器的 3000 端口
```

如果宿主机端口冲突，可以改左边：

```yaml
ports:
  - "3001:3000"
```

意思是宿主机访问 `localhost:3001`，容器内部仍然是 `3000`。

## 卷挂载

Prometheus 需要读取配置文件，可以把宿主机文件挂进容器：

```yaml
volumes:
  - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

左边是宿主机路径，右边是容器内路径。

这句话可以读成：

```text
把当前目录的 prometheus.yml 放到容器里的 /etc/prometheus/prometheus.yml
```

常见用途：

- 挂载配置文件。
- 保存数据库数据。
- 保存 Grafana dashboard。
- 保存日志或实验产物。

## 环境变量

很多镜像通过环境变量配置初始参数。

示例：

```yaml
environment:
  GF_SECURITY_ADMIN_USER: admin
  GF_SECURITY_ADMIN_PASSWORD: admin
```

这会设置 Grafana 的管理员账号密码。个人实验可以这样写，生产环境不要把真实密码明文提交到 GitHub。

## depends_on 的边界

`depends_on` 可以控制启动顺序：

```yaml
depends_on:
  - prometheus
```

但它不等于“等 Prometheus 完全可用”。它只能表达容器启动依赖。真正的可用性要靠健康检查、应用重试或脚本等待。

新手常见误解：

```text
depends_on 写了就不会连接失败
```

实际并不是。服务刚启动时可能还没 ready，客户端仍然要能重试。

## 常用命令

启动并在前台看日志：

```bash
docker compose up
```

后台启动：

```bash
docker compose up -d
```

查看容器：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs
docker compose logs -f prometheus
```

进入容器：

```bash
docker compose exec grafana sh
```

停止并删除容器：

```bash
docker compose down
```

停止并删除容器、网络和卷：

```bash
docker compose down -v
```

注意：`down -v` 会删除命名卷，数据库或 Grafana 持久化数据可能会丢失。

## 入门实验：Prometheus + Grafana

### 实验目标

最终你应该能：

- 用一条命令启动 Prometheus 和 Grafana。
- 访问 Prometheus：`http://localhost:9090`。
- 访问 Grafana：`http://localhost:3000`。
- 在 Grafana 中使用 `http://prometheus:9090` 连接 Prometheus。
- 解释为什么不是 `http://localhost:9090`。

### 第一步：准备目录

建议目录结构：

```text
labs/observability-compose/
  compose.yaml
  prometheus.yml
```

### 第二步：编写 Prometheus 配置

`prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

这里先让 Prometheus 抓取自己，目的是把最小闭环跑通。

### 第三步：编写 Compose 文件

`compose.yaml`：

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    depends_on:
      - prometheus
```

这个文件定义了两个服务：

- `prometheus`：读取当前目录的 `prometheus.yml`，对宿主机开放 `9090`。
- `grafana`：设置默认账号密码，对宿主机开放 `3000`，启动顺序依赖 Prometheus。

### 第四步：启动环境

```bash
docker compose up -d
```

查看状态：

```bash
docker compose ps
```

预期能看到两个服务都是 running。

### 第五步：验证 Prometheus

访问：

```text
http://localhost:9090/targets
```

预期看到 `prometheus` target 是 UP。

### 第六步：配置 Grafana 数据源

访问：

```text
http://localhost:3000
```

登录：

```text
admin / admin
```

添加 Prometheus 数据源，URL 写：

```text
http://prometheus:9090
```

原因是 Grafana 和 Prometheus 在 Compose 创建的同一个网络中，服务名 `prometheus` 可以被内部 DNS 解析。

### 第七步：创建第一个 panel

PromQL：

```text
up
```

如果能看到数据，就说明 Compose、Prometheus、Grafana 三者已经连通。

## 加入配置持久化

学习初期可以先不持久化 Grafana 数据。但如果你想让 dashboard 重启后还在，可以加一个命名卷：

```yaml
services:
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

`grafana-data` 是 Docker 管理的命名卷。只要不执行 `docker compose down -v`，数据通常会保留。

## 在 AIOps 中的作用

Docker Compose 在 AIOps 学习中的作用是实验环境编排。

```text
compose.yaml
  -> 一键启动实验环境
  -> 复现指标、日志、告警链路
  -> 保存配置到 GitHub
  -> 让项目可运行、可演示、可面试讲解
```

你后续可以用 Compose 组织这些实验：

- FastAPI demo + Prometheus + Grafana。
- Loki + Promtail + Grafana。
- Elasticsearch + Kibana / OpenSearch Dashboards。
- Kafka + Python 消费者 + 异常检测脚本。
- MySQL + exporter + dashboard。

## 常见故障排查

### 端口被占用

现象：

```text
Bind for 0.0.0.0:3000 failed: port is already allocated
```

解决方法：修改左侧宿主机端口。

```yaml
ports:
  - "3001:3000"
```

然后访问：

```text
http://localhost:3001
```

### Grafana 连不上 Prometheus

常见原因：

- URL 写成了 `http://localhost:9090`。
- Prometheus 服务名不是 `prometheus`。
- 两个服务不在同一个 Compose 项目网络。
- Prometheus 容器没有启动成功。

检查命令：

```bash
docker compose ps
docker compose logs prometheus
docker compose logs grafana
```

进入 Grafana 容器测试网络：

```bash
docker compose exec grafana sh
wget -qO- http://prometheus:9090/-/ready
```

### 修改配置后没有生效

原因可能是服务没有重启。

重启 Prometheus：

```bash
docker compose restart prometheus
```

如果修改了 `compose.yaml`，重新应用：

```bash
docker compose up -d
```

### volume 路径写错

现象：

- Prometheus 启动失败。
- 日志提示配置文件不存在。
- 容器里看到的是目录不是文件。

检查：

```bash
docker compose logs prometheus
```

确保宿主机当前目录真的有：

```text
prometheus.yml
```

## 学习检查清单

- [ ] 我能解释 Docker Compose 和 `docker run` 的区别。
- [ ] 我能写出最小 `compose.yaml`。
- [ ] 我能解释 `services`、`ports`、`volumes`、`environment`。
- [ ] 我能解释容器里的 `localhost` 为什么不是宿主机。
- [ ] 我能用服务名让 Grafana 访问 Prometheus。
- [ ] 我能用 `docker compose logs` 查看日志。
- [ ] 我能用 `docker compose down` 停止环境。
- [ ] 我能搭建 Prometheus + Grafana 本地实验室。
- [ ] 我能把实验环境配置提交到 GitHub。

## 面试题

1. Docker Compose 主要解决什么问题？
2. Compose 里的 service 和 container 是什么关系？
3. `ports: "3000:3000"` 左右两边分别是什么意思？
4. volume 挂载常用于哪些场景？
5. 为什么 Grafana 连接 Prometheus 时用 `http://prometheus:9090`？
6. `depends_on` 能保证服务完全 ready 吗？
7. `docker compose down` 和 `docker compose down -v` 有什么区别？
8. 本地 AIOps 实验为什么适合用 Compose？
9. 如何排查 Compose 服务之间网络不通？
10. 如何把 Compose 实验变成 GitHub 项目证据？

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/observability-compose/compose.yaml`
- `labs/observability-compose/prometheus.yml`
- 一张 `docker compose ps` 截图。
- 一张 Prometheus `/targets` 截图。
- 一张 Grafana `up` dashboard 截图。
- 一篇笔记：`Docker Compose 中 localhost、服务名和端口映射的区别.md`
