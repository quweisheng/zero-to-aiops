# Docker Compose 精讲

> 学习目标：能用一个 `compose.yaml` 启动多容器实验环境，理解 project、service、container、network、volume、config、secret、profile、healthcheck、depends_on、port、environment，并能搭建 Prometheus + Grafana + demo app 本地 AIOps 实验室。

## 官方资料

- [Docker Compose overview](https://docs.docker.com/compose/)
- [Docker Compose Quickstart](https://docs.docker.com/compose/gettingstarted/)
- [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Services reference](https://docs.docker.com/reference/compose-file/services/)
- [Networks reference](https://docs.docker.com/reference/compose-file/networks/)
- [Volumes reference](https://docs.docker.com/reference/compose-file/volumes/)
- [Configs reference](https://docs.docker.com/reference/compose-file/configs/)
- [Secrets reference](https://docs.docker.com/reference/compose-file/secrets/)
- [Docker Compose CLI reference](https://docs.docker.com/reference/cli/docker/compose/)

说明：本文基于 Docker 官方 Compose 文档和 AIOps 学习场景整理，保留官方链接，不复制官方全文。官方文档负责定义 Compose 模型和字段边界，本文负责把它讲成可学习、可复现、可放进 GitHub 的教程。

## 场景开场

“Prometheus 要一个容器，Grafana 要一个容器，demo 应用也要一个容器。Redis、MySQL、Loki 后面还要加。难道每次都手敲一堆 `docker run`？”

一两个容器时，手动启动还能忍。组件一多，问题就来了：

- 每个容器端口怎么映射？
- Prometheus 配置文件挂到哪里？
- Grafana 数据怎么持久化？
- Grafana 怎么访问 Prometheus？
- demo app 和 Prometheus 在不在同一个网络？
- 先启动哪个容器？
- 这套实验环境怎么交给别人复现？

Docker Compose 的意义，就是把这些“多容器环境规则”写进一个 `compose.yaml`。环境本身变成代码，能提交 GitHub，能 review，能一条命令启动。

## 一句话人话版

Docker Compose 是 Docker 官方的多容器应用定义和运行工具：你在 YAML 里声明服务、网络、卷、配置和依赖，再用 `docker compose up` 一键启动整套环境。

## 学习边界

这一篇重点讲 Docker Compose 单机和本地实验能力：

- Compose application model：project、service、network、volume、config、secret。
- `compose.yaml` 文件结构。
- service 常用字段：`image`、`build`、`ports`、`volumes`、`environment`、`env_file`、`depends_on`、`healthcheck`、`command`、`restart`、`profiles`。
- Compose 网络和服务名 DNS。
- volume、bind mount、config、secret 的区别。
- CLI 命令字典。
- Prometheus + Grafana + demo app 实验。
- 常见故障排查。

不在这一篇深入展开：

- Docker Swarm stack 部署。
- Kubernetes 编排。
- 生产级密钥管理。
- 多主机网络。

Compose 很适合学习、本地开发、实验环境和小规模部署。真正进入大规模集群编排时，后面会学习 Kubernetes。

## 官方知识地图

Docker Compose 官方资料可以按这棵树理解：

```text
Docker Compose docs
  ├── Overview
  │   └── Compose 是什么，适合什么
  ├── Quickstart
  │   └── 第一个 compose.yaml
  ├── Application model
  │   ├── project
  │   ├── services
  │   ├── networks
  │   ├── volumes
  │   ├── configs
  │   └── secrets
  ├── Compose file reference
  │   ├── services
  │   ├── networks
  │   ├── volumes
  │   ├── configs
  │   ├── secrets
  │   ├── fragments
  │   ├── merge
  │   ├── include
  │   └── profiles
  └── CLI reference
      ├── docker compose up
      ├── docker compose down
      ├── docker compose ps
      ├── docker compose logs
      ├── docker compose exec
      ├── docker compose config
      ├── docker compose build
      ├── docker compose pull
      ├── docker compose restart
      ├── docker compose watch
      └── docker compose wait
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Docker Compose docs</code> | 这一行里的英文要这样读：`Docker Compose docs` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  ├── Overview</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 3 行 | <code>  │   └── Compose 是什么，适合什么</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 4 行 | <code>  ├── Quickstart</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 5 行 | <code>  │   └── 第一个 compose.yaml</code> | `│   └── 第一个 compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  ├── Application model</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 7 行 | <code>  │   ├── project</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 8 行 | <code>  │   ├── services</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 9 行 | <code>  │   ├── networks</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 10 行 | <code>  │   ├── volumes</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 11 行 | <code>  │   ├── configs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 12 行 | <code>  │   └── secrets</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 13 行 | <code>  ├── Compose file reference</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 14 行 | <code>  │   ├── services</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 15 行 | <code>  │   ├── networks</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 16 行 | <code>  │   ├── volumes</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 17 行 | <code>  │   ├── configs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 18 行 | <code>  │   ├── secrets</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 19 行 | <code>  │   ├── fragments</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 20 行 | <code>  │   ├── merge</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 21 行 | <code>  │   ├── include</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 22 行 | <code>  │   └── profiles</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 23 行 | <code>  └── CLI reference</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 24 行 | <code>      ├── docker compose up</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 25 行 | <code>      ├── docker compose down</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 26 行 | <code>      ├── docker compose ps</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 27 行 | <code>      ├── docker compose logs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 28 行 | <code>      ├── docker compose exec</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 29 行 | <code>      ├── docker compose config</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 30 行 | <code>      ├── docker compose build</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 31 行 | <code>      ├── docker compose pull</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 32 行 | <code>      ├── docker compose restart</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 33 行 | <code>      ├── docker compose watch</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 34 行 | <code>      └── docker compose wait</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

本篇按这条线讲：先讲模型，再讲文件字段，再讲命令，最后用 AIOps 实验串起来。

## Docker Compose 在 AIOps 链路中的位置

```text
compose.yaml
  |
  v
local AIOps lab
  ├── demo app
  ├── Prometheus
  ├── Grafana
  ├── Loki
  ├── Redis / MySQL
  └── exporters
        |
        v
repeatable learning evidence
  ├── configuration files
  ├── dashboards
  ├── screenshots
  └── troubleshooting notes
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>compose.yaml</code> | `compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 4 行 | <code>local AIOps lab</code> | 这一行里的英文要这样读：`local AIOps lab` 这个英文标识可以拆开理解为：本地连接，表示不通过 SSH 连接远程机器。 |
| 第 5 行 | <code>  ├── demo app</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 6 行 | <code>  ├── Prometheus</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 7 行 | <code>  ├── Grafana</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 8 行 | <code>  ├── Loki</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 9 行 | <code>  ├── Redis / MySQL</code> | `├── Redis / MySQL` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>  └── exporters</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 11 行 | <code>        &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 12 行 | <code>        v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 13 行 | <code>repeatable learning evidence</code> | 这一行里的英文要这样读：`repeatable learning evidence` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 14 行 | <code>  ├── configuration files</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 15 行 | <code>  ├── dashboards</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 16 行 | <code>  ├── screenshots</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 17 行 | <code>  └── troubleshooting notes</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

AIOps 学习需要能反复搭环境。Compose 的价值是把“我电脑上手动跑起来了”变成“这个仓库里有一套别人也能跑的实验环境”。

| AIOps 场景 | Compose 的作用 |
|---|---|
| 可观测性实验 | 一键启动 demo app、Prometheus、Grafana |
| 日志实验 | 一键启动 Loki、Promtail、Grafana |
| 数据实验 | 一键启动 MySQL、Redis、Kafka |
| API 实验 | 一键启动 FastAPI、worker、依赖服务 |
| 项目展示 | `compose.yaml` 证明你的知识能落地运行 |

## Docker Compose 是什么

Docker Compose 是 Docker 官方提供的多容器应用定义和运行工具。它用一个 YAML 文件描述一组相关容器。

一句话公式：

```text
Docker Compose = Compose file + Docker Engine + docker compose CLI
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Docker Compose = Compose file + Docker Engine + docker compose CLI</code> | `Docker` 是主机、服务、告警或资源的示例名称；`Compose` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`Compose` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

对比单个 `docker run`：

| 场景 | `docker run` | Docker Compose |
|---|---|---|
| 启动一个 nginx | 很合适 | 也可以，但有点重 |
| 启动 Prometheus + Grafana + demo app | 命令多、难复现 | 很合适 |
| 保存配置到 Git | 只能写脚本或 README | `compose.yaml` 天然适合 |
| 服务间网络 | 手动建网络和连接 | 自动创建项目网络 |
| 卷和配置 | 每条命令都要写 | 文件里统一声明 |

Compose 不是 Docker 的替代品。它是 Docker 上的一层多容器编排工具。

## Application Model

Compose 官方应用模型包含这些对象：

```text
project
  ├── services
  │   └── containers
  ├── networks
  ├── volumes
  ├── configs
  └── secrets
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>project</code> | 这一行里的英文要这样读：`project` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  ├── services</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 3 行 | <code>  │   └── containers</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 4 行 | <code>  ├── networks</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 5 行 | <code>  ├── volumes</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 6 行 | <code>  ├── configs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 7 行 | <code>  └── secrets</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

### Project

Project 是一组 Compose 资源的命名空间。

如果目录名是：

```text
observability-compose
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>observability-compose</code> | 这一行里的英文要这样读：`observability-compose` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

Compose 默认 project name 可能就是这个目录名。创建出来的资源会带上 project 前缀，例如：

```text
observability-compose-prometheus-1
observability-compose_default
observability-compose_grafana-data
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>observability-compose-prometheus-1</code> | 这一行里的英文要这样读：`observability-compose-prometheus-1` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统。 |
| 第 2 行 | <code>observability-compose_default</code> | 这一行里的英文要这样读：`observability-compose_default` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>observability-compose_grafana-data</code> | 这一行里的英文要这样读：`observability-compose_grafana-data` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

你可以指定 project name：

```bash
docker compose -p aiops-lab up -d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose -p aiops-lab up -d</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

为什么需要 project？

- 避免不同实验环境资源重名。
- 同一份 compose 文件可以用不同 project name 启多套。
- `docker compose down` 只清理当前 project 的资源。

### Service

Service 是 Compose 文件里的服务定义。

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

`prometheus` 是 service name。Compose 会根据这个定义创建容器。

service 和 container 的关系：

```text
service definition
  -> one or more containers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service definition</code> | 这一行里的英文要这样读：`service definition` 这个英文标识可以拆开理解为：服务名称字段。 |
| 第 2 行 | <code>  -&gt; one or more containers</code> | 这一行要理解这些英文词：`one or more containers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

默认一个 service 一个容器。某些场景可以 scale：

```bash
docker compose up -d --scale worker=3
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose up -d --scale worker=3</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### Container

Container 是 service 运行后的实际容器。

Compose 管 service，Docker Engine 跑 container。

你平时查看：

```bash
docker compose ps
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

看到的就是这个 project 里的容器状态。

### Network

Network 是服务之间通信的网络。

Compose 默认会创建一个 default network。同一个 project 的 services 默认加入这个网络，可以通过 service name 互相访问：

```text
grafana -> prometheus:9090
prometheus -> demo-app:8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grafana -&gt; prometheus:9090</code> | 这一行要理解这些英文词：`grafana` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>prometheus -&gt; demo-app:8000</code> | 这一行要理解这些英文词：`prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`demo-app` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这里的 `prometheus` 和 `demo-app` 是 Compose 内部 DNS 名称。

### Volume

Volume 是持久化数据的存储对象。

Grafana 数据目录：

```yaml
volumes:
  grafana-data:

services:
  grafana:
    volumes:
      - grafana-data:/var/lib/grafana
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana-data:</code> | 定义 `grafana-data` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - grafana-data:/var/lib/grafana</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

只要不删除 volume，容器重建后 dashboard 和本地数据库仍然保留。

### Config

Config 用来把配置文件挂给 service。Compose 本地模式中，你也常用 bind mount 挂配置文件。Config 更像一种语义明确的“配置对象”。

例子：

```yaml
configs:
  prometheus_config:
    file: ./prometheus.yml

services:
  prometheus:
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus_config:</code> | 定义 `prometheus_config` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    file: ./prometheus.yml</code> | `file` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./prometheus.yml` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - source: prometheus_config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>        target: /etc/prometheus/prometheus.yml</code> | `target` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/prometheus/prometheus.yml` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### Secret

Secret 用来管理敏感数据，例如密码和 token。

例子：

```yaml
secrets:
  grafana_admin_password:
    file: ./secrets/grafana_admin_password.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>secrets:</code> | 定义 `secrets` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana_admin_password:</code> | 定义 `grafana_admin_password` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    file: ./secrets/grafana_admin_password.txt</code> | `file` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./secrets/grafana_admin_password.txt` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

学习阶段你可以先知道边界：不要把真实密码直接写进 `compose.yaml` 并提交到公开仓库。Compose 的 secrets 能改善文件组织，但不等于完整生产级密钥系统。

## Compose 文件结构

现代 Compose 文件常用名字：

```text
compose.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>compose.yaml</code> | `compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

也可能见到：

```text
compose.yml
docker-compose.yaml
docker-compose.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>compose.yml</code> | `compose.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>docker-compose.yaml</code> | `docker-compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>docker-compose.yml</code> | `docker-compose.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

官方现在更推荐 `compose.yaml`。旧教程里的顶层 `version` 字段在现代 Compose Specification 中通常不再需要。

一个常见结构：

```yaml
name: aiops-lab

services:
  demo-app:
    build: ./demo-app
    ports:
      - "8000:8000"

  prometheus:
    image: prom/prometheus:v3.5.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: aiops-lab</code> | `name` 是名称字段，`aiops-lab` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    build: ./demo-app</code> | `build` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./demo-app` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - "8000:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>      - "9090:9090"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    image: grafana/grafana:latest</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`grafana/grafana:latest` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>      - "3000:3000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>      - grafana-data:/var/lib/grafana</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>    depends_on:</code> | 定义 `depends_on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>      - prometheus</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 25 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>  grafana-data:</code> | 定义 `grafana-data` 配置段，下面缩进的内容都属于这个配置段。 |

顶层字段：

| 字段 | 含义 |
|---|---|
| `name` | project name |
| `services` | 服务定义 |
| `networks` | 网络定义 |
| `volumes` | 命名卷定义 |
| `configs` | 配置对象定义 |
| `secrets` | 密钥对象定义 |

## Services 字段详解

### `image`

| 项 | 内容 |
|---|---|
| 是什么 | service 使用的镜像 |
| 为什么需要 | 告诉 Compose 用哪个镜像创建容器 |
| 怎么用 | `image: prom/prometheus:v3.5.0` |
| 坏了怎么查 | 拉取失败看镜像名、tag、网络和 registry 认证 |

示例：

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

不要长期依赖裸 `latest`，学习实验可以，正式项目最好固定版本。

### `build`

| 项 | 内容 |
|---|---|
| 是什么 | 从 Dockerfile 构建镜像 |
| 为什么需要 | 本地 demo app 或自定义服务需要构建 |
| 怎么用 | `build: ./demo-app` |
| 坏了怎么查 | 看 build context、Dockerfile 路径、构建日志 |

简写：

```yaml
services:
  demo-app:
    build: ./demo-app
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    build: ./demo-app</code> | `build` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./demo-app` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

完整写法：

```yaml
services:
  demo-app:
    build:
      context: ./demo-app
      dockerfile: Dockerfile
    image: aiops-demo-app:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      context: ./demo-app</code> | `context` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./demo-app` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>      dockerfile: Dockerfile</code> | `dockerfile` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Dockerfile` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    image: aiops-demo-app:0.1</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`aiops-demo-app:0.1` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

`image` 和 `build` 可以一起用：Compose 构建后给镜像打上这个名字。

### `container_name`

| 项 | 内容 |
|---|---|
| 是什么 | 指定容器名字 |
| 为什么需要 | 让容器名固定 |
| 怎么用 | `container_name: prometheus` |
| 坏了怎么查 | 重名会导致启动失败 |

初学者不一定需要 `container_name`。Compose 默认生成带 project 的名字，能避免多套环境冲突。

如果你写死：

```yaml
container_name: prometheus
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>container_name: prometheus</code> | `container_name` 这个英文标识可以拆开理解为：名称字段，`prometheus` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

再启动第二套相同环境，就会容器名冲突。

### `ports`

| 项 | 内容 |
|---|---|
| 是什么 | 把容器端口发布到宿主机 |
| 为什么需要 | 浏览器或宿主机工具要访问容器服务 |
| 怎么用 | `"3000:3000"` |
| 坏了怎么查 | 端口占用、左右写反、防火墙 |

写法：

```yaml
ports:
  - "3000:3000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - "3000:3000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

含义：

```text
host:3000 -> container:3000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host:3000 -&gt; container:3000</code> | 这一行要理解这些英文词：`host` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`container` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

如果宿主机 3000 被占用：

```yaml
ports:
  - "3001:3000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - "3001:3000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

浏览器访问 `localhost:3001`，容器里 Grafana 仍然监听 3000。

### `expose`

| 项 | 内容 |
|---|---|
| 是什么 | 仅向 Compose 网络中的其他服务暴露端口提示 |
| 为什么需要 | 服务间通信，不需要发布到宿主机 |
| 怎么用 | `expose: ["8000"]` |
| 坏了怎么查 | 宿主机访问不到是正常的，因为没有 `ports` |

例子：

```yaml
services:
  demo-app:
    expose:
      - "8000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    expose:</code> | 定义 `expose` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - "8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

同一 Compose 网络里的 Prometheus 可以访问 `demo-app:8000`，但宿主机不能直接通过 `localhost:8000` 访问，除非配置 `ports`。

### `volumes`

| 项 | 内容 |
|---|---|
| 是什么 | 挂载 volume 或宿主机路径 |
| 为什么需要 | 持久化数据或注入配置 |
| 怎么用 | `grafana-data:/var/lib/grafana`、`./prometheus.yml:/etc/prometheus/prometheus.yml:ro` |
| 坏了怎么查 | 看路径、权限、容器内目标是否是文件还是目录 |

命名卷：

```yaml
services:
  grafana:
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - grafana-data:/var/lib/grafana</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  grafana-data:</code> | 定义 `grafana-data` 配置段，下面缩进的内容都属于这个配置段。 |

bind mount：

```yaml
services:
  prometheus:
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

`:ro` 表示只读挂载，配置文件建议只读。

### `environment`

| 项 | 内容 |
|---|---|
| 是什么 | 给容器设置环境变量 |
| 为什么需要 | 配置应用参数 |
| 怎么用 | `GF_SECURITY_ADMIN_PASSWORD: admin` |
| 坏了怎么查 | `docker compose exec SERVICE env` |

映射写法：

```yaml
environment:
  GF_SECURITY_ADMIN_USER: admin
  GF_SECURITY_ADMIN_PASSWORD: admin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  GF_SECURITY_ADMIN_USER: admin</code> | `GF_SECURITY_ADMIN_USER` 这个英文标识可以拆开理解为：用户，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  GF_SECURITY_ADMIN_PASSWORD: admin</code> | `GF_SECURITY_ADMIN_PASSWORD` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

列表写法：

```yaml
environment:
  - GF_SECURITY_ADMIN_USER=admin
  - GF_SECURITY_ADMIN_PASSWORD=admin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - GF_SECURITY_ADMIN_USER=admin</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>  - GF_SECURITY_ADMIN_PASSWORD=admin</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

不要把真实生产密码明文提交到 GitHub。

### `env_file`

| 项 | 内容 |
|---|---|
| 是什么 | 从文件加载环境变量 |
| 为什么需要 | 避免 compose 文件里堆太多环境变量 |
| 怎么用 | `env_file: .env` |
| 坏了怎么查 | 文件路径、变量名、是否提交了敏感信息 |

例子：

```yaml
services:
  grafana:
    env_file:
      - .env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    env_file:</code> | 定义 `env_file` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - .env</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

`.env`：

```text
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>GF_SECURITY_ADMIN_USER=admin</code> | `GF_SECURITY_ADMIN_USER` 这个英文标识可以拆开理解为：用户，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>GF_SECURITY_ADMIN_PASSWORD=admin</code> | `GF_SECURITY_ADMIN_PASSWORD` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

学习项目可以提交 `.env.example`，不要提交真实 `.env`。

### `command`

| 项 | 内容 |
|---|---|
| 是什么 | 覆盖镜像默认命令 |
| 为什么需要 | 给服务传启动参数 |
| 怎么用 | `command: ["--config.file=/etc/prometheus/prometheus.yml"]` |
| 坏了怎么查 | 命令写错会导致容器退出，看 logs |

Prometheus 示例：

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    command:</code> | 定义 `command` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - "--config.file=/etc/prometheus/prometheus.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>      - "--storage.tsdb.path=/prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

### `entrypoint`

| 项 | 内容 |
|---|---|
| 是什么 | 覆盖镜像入口 |
| 为什么需要 | 调试或把镜像变成特定启动流程 |
| 怎么用 | `entrypoint: ["sh", "-c"]` |
| 坏了怎么查 | 入口写错容器可能直接退出 |

初学阶段少用 `entrypoint`，优先用镜像默认入口和 `command`。

### `depends_on`

| 项 | 内容 |
|---|---|
| 是什么 | 声明服务启动依赖 |
| 为什么需要 | 让 Compose 按依赖顺序创建服务 |
| 怎么用 | `depends_on: ["prometheus"]` |
| 坏了怎么查 | 依赖启动了不代表应用 ready，要看 healthcheck |

简单写法：

```yaml
services:
  grafana:
    depends_on:
      - prometheus
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    depends_on:</code> | 定义 `depends_on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - prometheus</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

带健康条件的写法：

```yaml
services:
  grafana:
    depends_on:
      prometheus:
        condition: service_healthy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    depends_on:</code> | 定义 `depends_on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        condition: service_healthy</code> | `condition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_healthy` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

注意：`depends_on` 不是万能等待器。真正的应用仍然应该有重试能力。

### `healthcheck`

| 项 | 内容 |
|---|---|
| 是什么 | 定义容器健康检查 |
| 为什么需要 | 区分“容器进程在”和“服务可用” |
| 怎么用 | `test`、`interval`、`timeout`、`retries` |
| 坏了怎么查 | `docker compose ps`、`docker inspect`、logs |

示例：

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
    healthcheck:
      test: ["CMD", "wget", "-qO-", "localhost:9090/-/ready"]
      interval: 10s
      timeout: 3s
      retries: 5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    healthcheck:</code> | 定义 `healthcheck` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      test: ["CMD", "wget", "-qO-", "localhost:9090/-/ready"]</code> | `test` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CMD", "wget", "-qO-", "localhost:9090/-/ready"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      interval: 10s</code> | `interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`10s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>      timeout: 3s</code> | `timeout` 是超时时间字段，`3s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>      retries: 5</code> | `retries` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`5` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### `restart`

| 项 | 内容 |
|---|---|
| 是什么 | 容器退出后的重启策略 |
| 为什么需要 | 实验或服务异常退出后自动拉起 |
| 怎么用 | `restart: unless-stopped` |
| 坏了怎么查 | 如果反复重启，先看 logs，不要只靠 restart 掩盖问题 |

常见值：

| 值 | 含义 |
|---|---|
| `no` | 不自动重启 |
| `always` | 总是重启 |
| `unless-stopped` | 除非手动停止，否则重启 |
| `on-failure` | 失败退出时重启 |

### `networks`

| 项 | 内容 |
|---|---|
| 是什么 | 指定服务加入哪些网络 |
| 为什么需要 | 控制服务间通信边界 |
| 怎么用 | `networks: [observability]` |
| 坏了怎么查 | `docker network inspect`、服务是否在同一网络 |

示例：

```yaml
services:
  prometheus:
    networks:
      - observability

  grafana:
    networks:
      - observability

networks:
  observability:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - observability</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - observability</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>  observability:</code> | 定义 `observability` 配置段，下面缩进的内容都属于这个配置段。 |

### `profiles`

| 项 | 内容 |
|---|---|
| 是什么 | 按 profile 控制某些服务是否启用 |
| 为什么需要 | 同一份 compose 支持基础环境和可选组件 |
| 怎么用 | `profiles: ["logs"]` |
| 坏了怎么查 | 服务没启动时确认是否需要 `--profile` |

例子：

```yaml
services:
  loki:
    image: grafana/loki:latest
    profiles:
      - logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  loki:</code> | 定义 `loki` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: grafana/loki:latest</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`grafana/loki:latest` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    profiles:</code> | 定义 `profiles` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - logs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

默认不会启动 `loki`。启动时：

```bash
docker compose --profile logs up -d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose --profile logs up -d</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### `labels`

| 项 | 内容 |
|---|---|
| 是什么 | 给容器或服务加元数据 |
| 为什么需要 | 被代理、监控、自动化工具识别 |
| 怎么用 | `labels: ["aiops.role=metrics"]` |
| 坏了怎么查 | `docker inspect` 查看 labels |

例子：

```yaml
labels:
  aiops.stack: observability
  aiops.role: metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  aiops.stack: observability</code> | `aiops.stack` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`observability` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  aiops.role: metrics</code> | `aiops.role` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`metrics` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### `logging`

| 项 | 内容 |
|---|---|
| 是什么 | 配置容器日志驱动和选项 |
| 为什么需要 | 控制日志大小和输出方式 |
| 怎么用 | `driver`、`options` |
| 坏了怎么查 | `docker compose logs` 是否能看到日志 |

示例：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>logging:</code> | 定义 `logging` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  driver: "json-file"</code> | `driver` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`json-file` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  options:</code> | 定义 `options` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    max-size: "10m"</code> | `max-size` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`10m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    max-file: "3"</code> | `max-file` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`3` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

学习环境里不配置也可以，但要知道日志无限增长可能占磁盘。

## Networks 详解

Compose 默认网络：

```text
project_default
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>project_default</code> | 这一行里的英文要这样读：`project_default` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

同一 project 里的服务默认加入它，并获得服务名 DNS。

```text
grafana container
  -> DNS resolve prometheus
  -> prometheus container IP
  -> connect 9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grafana container</code> | 这一行里的英文要这样读：`grafana container` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; DNS resolve prometheus</code> | 这一行要理解这些英文词：`DNS resolve prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; prometheus container IP</code> | 这一行要理解这些英文词：`prometheus container IP` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; connect 9090</code> | 这一行要理解这些英文词：`connect` 是连接。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

自定义网络：

```yaml
networks:
  frontend:
  backend:

services:
  grafana:
    networks:
      - frontend
      - backend

  prometheus:
    networks:
      - backend
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  frontend:</code> | 定义 `frontend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>  backend:</code> | 定义 `backend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - frontend</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      - backend</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>      - backend</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

这样可以限制访问范围。比如浏览器只访问 Grafana，Prometheus 只在 backend 中给 Grafana 使用。

### 服务名和 localhost

这是 Compose 最重要的新手坑：

```text
host localhost
  != grafana container localhost
  != prometheus container localhost
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host localhost</code> | 这一行里的英文要这样读：`host localhost` 这个英文标识可以拆开理解为：主机，本机地址。 |
| 第 2 行 | <code>  != grafana container localhost</code> | 这一行里的英文要这样读：`grafana container localhost` 这个英文标识可以拆开理解为：本机地址。 |
| 第 3 行 | <code>  != prometheus container localhost</code> | 这一行里的英文要这样读：`prometheus container localhost` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统，本机地址。 |

Grafana 访问 Prometheus 应该写：

```text
prometheus:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus:9090</code> | `prometheus` 是指标采集和告警规则评估系统，冒号后面的 `9090` 是这个字段的示例内容或模板表达式。 |

而不是：

```text
localhost:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090</code> | `localhost` 是本机地址，冒号后面的 `9090` 是这个字段的示例内容或模板表达式。 |

除非 Prometheus 就运行在 Grafana 容器里，但这不是正常做法。

## Volumes 详解

Compose 中常见三类挂载：

| 类型 | 例子 | 适合 |
|---|---|---|
| named volume | `grafana-data:/var/lib/grafana` | 数据持久化 |
| bind mount | `./prometheus.yml:/etc/prometheus/prometheus.yml:ro` | 挂配置、开发代码 |
| anonymous volume | `/var/lib/mysql` | 少用，名字不直观 |

### named volume

```yaml
services:
  grafana:
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - grafana-data:/var/lib/grafana</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  grafana-data:</code> | 定义 `grafana-data` 配置段，下面缩进的内容都属于这个配置段。 |

优点：

- Docker 管理。
- 不依赖宿主机具体目录。
- 适合数据库、Grafana 数据、Prometheus 数据。

### bind mount

```yaml
volumes:
  - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

优点：

- 修改宿主机文件，容器能看到。
- 适合配置文件和本地开发。

风险：

- 路径写错时，可能在容器里变成目录。
- Windows/macOS 路径映射有平台差异。
- 容器可能修改宿主机文件，配置建议加 `:ro`。

## Configs 和 Secrets

### Configs

Configs 表达“这是一份配置”。

```yaml
configs:
  prometheus_config:
    file: ./prometheus.yml

services:
  prometheus:
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus_config:</code> | 定义 `prometheus_config` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    file: ./prometheus.yml</code> | `file` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./prometheus.yml` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - source: prometheus_config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>        target: /etc/prometheus/prometheus.yml</code> | `target` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/prometheus/prometheus.yml` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

学习阶段 bind mount 更常见，configs 更语义化。

### Secrets

Secrets 表达“这是一份敏感数据”。

```yaml
secrets:
  grafana_admin_password:
    file: ./secrets/grafana_admin_password.txt

services:
  grafana:
    secrets:
      - grafana_admin_password
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>secrets:</code> | 定义 `secrets` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  grafana_admin_password:</code> | 定义 `grafana_admin_password` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    file: ./secrets/grafana_admin_password.txt</code> | `file` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./secrets/grafana_admin_password.txt` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    secrets:</code> | 定义 `secrets` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - grafana_admin_password</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

很多镜像需要支持从文件读取 secret 才能发挥作用。不要误以为写了 `secrets` 就自动把应用密码配置好了，还要看镜像如何读取。

## Compose CLI 命令字典

### `docker compose version`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Compose 版本 |
| 示例 | `docker compose version` |
| AIOps 场景 | 排查本机 Compose 功能是否支持 |
| 常见坑 | 旧教程的 `docker-compose` 是 v1 时代命令，现代 Docker 使用 `docker compose` |

### `docker compose config`

| 项 | 内容 |
|---|---|
| 作用 | 解析并验证 Compose 文件，输出最终配置 |
| 示例 | `docker compose config` |
| AIOps 场景 | 提交前检查 YAML、变量替换、合并结果 |
| 常见坑 | 语法通过不代表服务一定能启动成功 |

### `docker compose up`

| 项 | 内容 |
|---|---|
| 作用 | 创建并启动 project 里的服务 |
| 示例 | `docker compose up -d` |
| 常用参数 | `-d` 后台运行，`--build` 启动前构建 |
| AIOps 场景 | 一键启动实验环境 |
| 常见坑 | 修改 Dockerfile 后可能需要 `--build` |

### `docker compose down`

| 项 | 内容 |
|---|---|
| 作用 | 停止并删除容器和默认网络 |
| 示例 | `docker compose down` |
| 常用参数 | `-v` 同时删除 volumes |
| AIOps 场景 | 清理实验环境 |
| 常见坑 | `down -v` 会删除数据卷，Grafana dashboard、数据库数据可能丢 |

### `docker compose ps`

| 项 | 内容 |
|---|---|
| 作用 | 查看当前 project 的容器状态 |
| 示例 | `docker compose ps` |
| 关键字段 | Name、Image、Command、Service、Status、Ports |
| AIOps 场景 | 判断 Prometheus、Grafana、demo app 是否运行 |
| 常见坑 | 只显示当前目录或指定 project 的服务 |

### `docker compose logs`

| 项 | 内容 |
|---|---|
| 作用 | 查看服务日志 |
| 示例 | `docker compose logs -f prometheus` |
| 常用参数 | `-f` 跟随，`--tail 100` 最近 100 行 |
| AIOps 场景 | 排查服务启动失败、配置错误、连接失败 |
| 常见坑 | 服务没有输出 stdout/stderr 时日志可能不完整 |

### `docker compose exec`

| 项 | 内容 |
|---|---|
| 作用 | 在运行中的服务容器里执行命令 |
| 示例 | `docker compose exec grafana sh` |
| AIOps 场景 | 进入 Grafana 容器测试能否访问 Prometheus |
| 常见坑 | 容器里不一定有 `bash`，可以用 `sh` |

### `docker compose run`

| 项 | 内容 |
|---|---|
| 作用 | 为某个服务运行一次性命令 |
| 示例 | `docker compose run --rm demo-app python script.py` |
| AIOps 场景 | 执行一次性数据初始化、测试脚本 |
| 常见坑 | `run` 和已经运行的长期服务容器不是同一个容器 |

### `docker compose build`

| 项 | 内容 |
|---|---|
| 作用 | 构建带 `build` 字段的服务镜像 |
| 示例 | `docker compose build demo-app` |
| AIOps 场景 | 构建 demo API、worker、exporter |
| 常见坑 | 修改依赖或 Dockerfile 后要重新 build |

### `docker compose pull`

| 项 | 内容 |
|---|---|
| 作用 | 拉取服务镜像 |
| 示例 | `docker compose pull` |
| AIOps 场景 | 更新 Prometheus、Grafana 镜像 |
| 常见坑 | 拉了新镜像后服务不一定自动重建，要 `up -d` |

### `docker compose restart`

| 项 | 内容 |
|---|---|
| 作用 | 重启服务 |
| 示例 | `docker compose restart prometheus` |
| AIOps 场景 | 修改 Prometheus 配置后重启 |
| 常见坑 | 只重启容器，不重新应用所有 compose 文件结构变化 |

### `docker compose top`

| 项 | 内容 |
|---|---|
| 作用 | 查看服务容器里的进程 |
| 示例 | `docker compose top` |
| AIOps 场景 | 确认容器主进程是否存在 |
| 常见坑 | 不等于应用健康，只是进程视角 |

### `docker compose stats`

| 项 | 内容 |
|---|---|
| 作用 | 查看服务资源使用 |
| 示例 | `docker compose stats` |
| AIOps 场景 | 看 Prometheus、Grafana、demo app CPU/内存 |
| 常见坑 | 是实时状态，不是历史监控 |

### `docker compose watch`

| 项 | 内容 |
|---|---|
| 作用 | 监听文件变化并同步或重建服务 |
| 示例 | `docker compose watch` |
| AIOps 场景 | 开发 demo app 时快速反馈 |
| 常见坑 | 不是所有项目都配置了 watch 行为 |

## AIOps 入门实验：Prometheus + Grafana + Demo App

### 实验目标

最终你应该能：

- 用一条命令启动 demo app、Prometheus、Grafana。
- Prometheus 抓取 demo app 和自己。
- Grafana 通过服务名访问 Prometheus。
- Grafana dashboard 能查询 `up`。
- 你能解释每个 service、network、volume、port、healthcheck 的作用。

### 第 1 步：准备目录

```text
labs/observability-compose/
  compose.yaml
  demo-app/
    Dockerfile
    app.py
    requirements.txt
  prometheus/
    prometheus.yml
  grafana/
    provisioning/
      datasources/
        prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labs/observability-compose/</code> | `labs/observability-compose/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  compose.yaml</code> | `compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  demo-app/</code> | `demo-app/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>    Dockerfile</code> | 这一行里的英文要这样读：`Dockerfile` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 5 行 | <code>    app.py</code> | `app.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>    requirements.txt</code> | `requirements.txt` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>  prometheus/</code> | `prometheus/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>    prometheus.yml</code> | `prometheus.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>  grafana/</code> | `grafana/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>    provisioning/</code> | `provisioning/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>      datasources/</code> | `datasources/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 12 行 | <code>        prometheus.yml</code> | `prometheus.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### 第 2 步：写 demo app

`demo-app/requirements.txt`：

```text
prometheus-client==0.20.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus-client==0.20.0</code> | `prometheus-client` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统，客户端，`=0.20.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

`demo-app/app.py`：

```python
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from prometheus_client import Counter, Histogram, generate_latest


REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["path", "status"],
)

LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["path"],
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        start = time.time()

        if self.path == "/metrics":
            body = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body)
            return

        status = 200 if self.path == "/health" else random.choice([200, 200, 500])
        time.sleep(random.uniform(0.01, 0.2))
        REQUESTS.labels(path=self.path, status=str(status)).inc()
        LATENCY.labels(path=self.path).observe(time.time() - start)

        self.send_response(status)
        self.end_headers()
        self.wfile.write(b"ok")


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import random</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import time</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from http.server import BaseHTTPRequestHandler, HTTPServer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from prometheus_client import Counter, Histogram, generate_latest</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 8 行 | <code>REQUESTS = Counter(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    "http_requests_total",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    "Total HTTP requests",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    ["path", "status"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>LATENCY = Histogram(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>    "http_request_duration_seconds",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>    "HTTP request latency",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    ["path"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>class Handler(BaseHTTPRequestHandler):</code> | 定义类，用来组织一组数据和行为。 |
| 第 22 行 | <code>    def do_GET(self):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 23 行 | <code>        start = time.time()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>        if self.path == "/metrics":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 26 行 | <code>            body = generate_latest()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 27 行 | <code>            self.send_response(200)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>            self.send_header("Content-Type", "text/plain; version=0.0.4")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>            self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>            self.wfile.write(body)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>            return</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>        status = 200 if self.path == "/health" else random.choice([200, 200, 500])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 34 行 | <code>        time.sleep(random.uniform(0.01, 0.2))</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>        REQUESTS.labels(path=self.path, status=str(status)).inc()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>        LATENCY.labels(path=self.path).observe(time.time() - start)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>        self.send_response(status)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <code>        self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>        self.wfile.write(b"ok")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>if __name__ == "__main__":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 44 行 | <code>    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

`demo-app/Dockerfile`：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 5 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 6 行 | <code>RUN python -m pip install --no-cache-dir -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 8 行 | <code>COPY app.py .</code> | 把宿主机项目文件复制进镜像。 |
| 第 10 行 | <code>EXPOSE 8000</code> | 声明容器应用监听的端口，方便读者知道服务入口。 |
| 第 12 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

### 第 3 步：写 Prometheus 配置

`prometheus/prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "demo-app"
    static_configs:
      - targets: ["demo-app:8000"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  scrape_interval: 15s</code> | `scrape_interval` 是Prometheus 抓取指标的时间间隔字段，`15s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  evaluation_interval: 15s</code> | `evaluation_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`15s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  - job_name: "prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - targets: ["localhost:9090"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>  - job_name: "demo-app"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>      - targets: ["demo-app:8000"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

关键点：`demo-app:8000` 是 Compose 网络里的服务名和端口，不是宿主机地址。

### 第 4 步：写 Grafana 数据源 provisioning

`grafana/provisioning/datasources/prometheus.yml`：

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: 1</code> | `apiVersion` 这个英文标识可以拆开理解为：应用程序接口，`1` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>datasources:</code> | 定义 `datasources` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  - name: Prometheus</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    type: prometheus</code> | `type` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prometheus` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    access: proxy</code> | `access` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`proxy` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    url: http://prometheus:9090</code> | `url` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`http://prometheus:9090` 表示URL 地址，表示页面、接口或文档入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    isDefault: true</code> | `isDefault` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

Grafana 容器访问 Prometheus 容器，要用 `prometheus:9090`。

### 第 5 步：写 compose.yaml

`compose.yaml`：

```yaml
name: aiops-observability-lab

services:
  demo-app:
    build:
      context: ./demo-app
    image: aiops-demo-app:0.1
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - observability

  prometheus:
    image: prom/prometheus:v3.5.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=7d"
    depends_on:
      demo-app:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "localhost:9090/-/ready"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - observability

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    depends_on:
      prometheus:
        condition: service_healthy
    networks:
      - observability

networks:
  observability:

volumes:
  prometheus-data:
  grafana-data:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: aiops-observability-lab</code> | `name` 是名称字段，`aiops-observability-lab` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      context: ./demo-app</code> | `context` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`./demo-app` 表示路径值，表示文件、目录或接口路径；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    image: aiops-demo-app:0.1</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`aiops-demo-app:0.1` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>      - "8000:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>    healthcheck:</code> | 定义 `healthcheck` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)"]</code> | `test` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>      interval: 10s</code> | `interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`10s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>      timeout: 3s</code> | `timeout` 是超时时间字段，`3s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>      retries: 5</code> | `retries` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`5` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>      - observability</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 18 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>    image: prom/prometheus:v3.5.0</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prom/prometheus:v3.5.0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>      - "9090:9090"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 24 行 | <code>      - prometheus-data:/prometheus</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 25 行 | <code>    command:</code> | 定义 `command` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>      - "--config.file=/etc/prometheus/prometheus.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 27 行 | <code>      - "--storage.tsdb.path=/prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 28 行 | <code>      - "--storage.tsdb.retention.time=7d"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 29 行 | <code>    depends_on:</code> | 定义 `depends_on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 30 行 | <code>      demo-app:</code> | 定义 `demo-app` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 31 行 | <code>        condition: service_healthy</code> | `condition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_healthy` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>    healthcheck:</code> | 定义 `healthcheck` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 33 行 | <code>      test: ["CMD", "wget", "-qO-", "localhost:9090/-/ready"]</code> | `test` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CMD", "wget", "-qO-", "localhost:9090/-/ready"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 34 行 | <code>      interval: 10s</code> | `interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`10s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 35 行 | <code>      timeout: 3s</code> | `timeout` 是超时时间字段，`3s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 36 行 | <code>      retries: 5</code> | `retries` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`5` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 37 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 38 行 | <code>      - observability</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 40 行 | <code>  grafana:</code> | 定义 `grafana` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 41 行 | <code>    image: grafana/grafana:latest</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`grafana/grafana:latest` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 42 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 43 行 | <code>      - "3000:3000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 44 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 45 行 | <code>      GF_SECURITY_ADMIN_USER: admin</code> | `GF_SECURITY_ADMIN_USER` 这个英文标识可以拆开理解为：用户，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 46 行 | <code>      GF_SECURITY_ADMIN_PASSWORD: admin</code> | `GF_SECURITY_ADMIN_PASSWORD` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`admin` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 47 行 | <code>      GF_USERS_ALLOW_SIGN_UP: "false"</code> | `GF_USERS_ALLOW_SIGN_UP` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 48 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 49 行 | <code>      - grafana-data:/var/lib/grafana</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 50 行 | <code>      - ./grafana/provisioning:/etc/grafana/provisioning:ro</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 51 行 | <code>    depends_on:</code> | 定义 `depends_on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 52 行 | <code>      prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 53 行 | <code>        condition: service_healthy</code> | `condition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_healthy` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 54 行 | <code>    networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 55 行 | <code>      - observability</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 57 行 | <code>networks:</code> | 定义 `networks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 58 行 | <code>  observability:</code> | 定义 `observability` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 60 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 61 行 | <code>  prometheus-data:</code> | 定义 `prometheus-data` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 62 行 | <code>  grafana-data:</code> | 定义 `grafana-data` 配置段，下面缩进的内容都属于这个配置段。 |

注意：healthcheck 里的 `localhost` 是容器内部自检，含义和 Grafana 访问 Prometheus 时不同。demo app 检查自己可以用 `localhost:8000`，Grafana 访问 Prometheus 要用 `prometheus:9090`。

### 第 6 步：检查配置

```bash
docker compose config
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose config</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

如果 YAML 缩进错误、字段明显错误，这一步通常会提示。

### 第 7 步：启动实验室

```bash
docker compose up -d --build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose up -d --build</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查看状态：

```bash
docker compose ps
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

预期：

- `demo-app` running 或 healthy。
- `prometheus` running 或 healthy。
- `grafana` running。

### 第 8 步：访问服务

访问 demo app：

```text
localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:8000/health</code> | `localhost` 是本机地址，冒号后面的 `8000/health` 是这个字段的示例内容或模板表达式。 |

访问 Prometheus targets：

```text
localhost:9090/targets
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090/targets</code> | `localhost` 是本机地址，冒号后面的 `9090/targets` 是这个字段的示例内容或模板表达式。 |

访问 Grafana：

```text
localhost:3000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:3000</code> | `localhost` 是本机地址，冒号后面的 `3000` 是这个字段的示例内容或模板表达式。 |

Grafana 登录：

```text
admin / admin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>admin / admin</code> | `admin / admin` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### 第 9 步：验证 Prometheus 查询

在 Prometheus 中查询：

```text
up
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up</code> | 这一行里的英文要这样读：`up` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

再查询 demo app 请求速率：

```text
sum(rate(http_requests_total{job="demo-app"}[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum(rate(http_requests_total{job="demo-app"}[5m]))</code> | `job` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`demo-app` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

如果没有请求，先访问几次：

```bash
curl localhost:8000/
curl localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl localhost:8000/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl localhost:8000/health</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

### 第 10 步：验证 Grafana 数据源

Grafana 已通过 provisioning 自动加载 Prometheus 数据源。

进入 Explore，选择 Prometheus，查询：

```text
up
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up</code> | 这一行里的英文要这样读：`up` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

如果能看到 `prometheus` 和 `demo-app`，说明 Compose 网络、Prometheus 抓取、Grafana 数据源都打通了。

## 实验排障

### `docker compose up` 失败

先检查配置：

```bash
docker compose config
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose config</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

再看具体服务日志：

```bash
docker compose logs demo-app
docker compose logs prometheus
docker compose logs grafana
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose logs demo-app</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker compose logs prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker compose logs grafana</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

常见原因：

- YAML 缩进错。
- 端口被占用。
- Dockerfile 构建失败。
- 配置文件路径写错。
- 镜像拉取失败。

### 端口被占用

现象：

```text
port is already allocated
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>port is already allocated</code> | 这一行里的英文要这样读：`port is already allocated` 这个英文标识可以拆开理解为：端口。 |

处理：改左侧宿主机端口。

```yaml
ports:
  - "3001:3000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - "3001:3000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

访问改成：

```text
localhost:3001
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:3001</code> | `localhost` 是本机地址，冒号后面的 `3001` 是这个字段的示例内容或模板表达式。 |

### Prometheus target DOWN

检查：

```bash
docker compose ps
docker compose logs prometheus
docker compose exec prometheus wget -qO- demo-app:8000/metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker compose logs prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker compose exec prometheus wget -qO- demo-app:8000/metrics</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

重点：

- `demo-app` 是否 running。
- Prometheus 和 demo app 是否在同一网络。
- `prometheus.yml` target 是否写成 `demo-app:8000`。
- demo app 是否监听 `0.0.0.0:8000`。

### Grafana 连不上 Prometheus

检查：

```bash
docker compose exec grafana wget -qO- prometheus:9090/-/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose exec grafana wget -qO- prometheus:9090/-/ready</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

如果失败：

- 确认服务名是 `prometheus`。
- 确认 Grafana 和 Prometheus 在同一个 network。
- 确认 Prometheus 容器健康。
- 不要在 Grafana 数据源 URL 写 `localhost:9090`。

### 修改配置后没有生效

修改 `prometheus.yml`：

```bash
docker compose restart prometheus
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose restart prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

修改 `compose.yaml`：

```bash
docker compose up -d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose up -d</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

修改 Dockerfile 或依赖：

```bash
docker compose up -d --build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose up -d --build</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 数据丢失

如果执行：

```bash
docker compose down -v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose down -v</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

会删除 volumes。Prometheus TSDB 和 Grafana 数据可能丢失。

学习环境清理前先确认：

```bash
docker volume ls
docker compose down
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker volume ls</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker compose down</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

不带 `-v` 通常会保留命名卷。

## 典型故障排查表

| 现象 | 常见原因 | 检查命令 | 处理方向 |
|---|---|---|---|
| YAML 报错 | 缩进、冒号、列表格式错 | `docker compose config` | 修 YAML |
| 端口冲突 | 宿主机端口被占用 | `docker compose ps`、错误日志 | 改 `ports` 左侧 |
| 镜像拉取失败 | 网络、tag、registry | `docker compose pull` | 检查镜像和网络 |
| 构建失败 | Dockerfile 或 context 错 | `docker compose build` | 修 build context |
| 服务反复重启 | 命令错、配置错、应用崩溃 | `docker compose logs SERVICE` | 看应用错误 |
| 服务间不能访问 | 不在同一网络、服务名错 | `docker compose exec SERVICE sh` | 用服务名测试 |
| Grafana 数据源失败 | URL 写 localhost、Prometheus 未 ready | `wget prometheus:9090/-/ready` | 改 URL，检查网络 |
| Prometheus target DOWN | target 地址错、demo 未监听 | `/targets`、logs | 修 target 和监听地址 |
| 配置文件没挂进去 | 路径错、文件不存在 | `docker compose exec SERVICE ls` | 修 volume 路径 |
| 数据丢失 | 执行了 `down -v` 或没挂 volume | `docker volume ls` | 使用命名卷 |

## Compose 和 Kubernetes 的关系

Compose 和 Kubernetes 都能描述多容器应用，但定位不同：

| 对比 | Docker Compose | Kubernetes |
|---|---|---|
| 主要场景 | 本地开发、学习、单机实验 | 集群编排、生产部署 |
| 文件对象 | services、networks、volumes | Pod、Service、Deployment、ConfigMap、Secret |
| 调度能力 | 单机为主 | 多节点调度 |
| 自愈能力 | 基础 restart | 控制器持续调谐 |
| 服务发现 | Compose 网络 DNS | Kubernetes Service DNS |
| 学习价值 | 理解多容器关系 | 理解云原生生产编排 |

学 Kubernetes 前，Compose 是非常好的中间台阶。你会先习惯把环境写成文件，再理解服务名、网络、卷和配置对象。

## AIOps 项目怎么组织 Compose

建议目录：

```text
labs/
  observability-compose/
    README.md
    compose.yaml
    demo-app/
      Dockerfile
      app.py
      requirements.txt
    prometheus/
      prometheus.yml
      rules/
        alerting.yml
    grafana/
      provisioning/
        datasources/
          prometheus.yml
        dashboards/
          dashboards.yml
      dashboards/
        demo-api-overview.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labs/</code> | `labs/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  observability-compose/</code> | `observability-compose/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>    README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>    compose.yaml</code> | `compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>    demo-app/</code> | `demo-app/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>      Dockerfile</code> | 这一行里的英文要这样读：`Dockerfile` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 7 行 | <code>      app.py</code> | `app.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>      requirements.txt</code> | `requirements.txt` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>    prometheus/</code> | `prometheus/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>      prometheus.yml</code> | `prometheus.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>      rules/</code> | `rules/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 12 行 | <code>        alerting.yml</code> | `alerting.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 13 行 | <code>    grafana/</code> | `grafana/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 14 行 | <code>      provisioning/</code> | `provisioning/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 15 行 | <code>        datasources/</code> | `datasources/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 16 行 | <code>          prometheus.yml</code> | `prometheus.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 17 行 | <code>        dashboards/</code> | `dashboards/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 18 行 | <code>          dashboards.yml</code> | `dashboards.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 19 行 | <code>      dashboards/</code> | `dashboards/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 20 行 | <code>        demo-api-overview.json</code> | `demo-api-overview.json` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

README 至少写：

- 环境要求。
- 启动命令。
- 访问地址。
- 默认账号密码。
- 如何验证 Prometheus targets。
- 如何验证 Grafana 数据源。
- 如何清理环境。
- 常见问题。

## 学习路线

### 第 1 阶段：从 `docker run` 过渡到 Compose

- 会启动单个容器。
- 会理解端口映射。
- 会理解 volume。
- 会读最小 `compose.yaml`。

学习证据：把一个 `docker run` 命令改写成 Compose service。

### 第 2 阶段：理解 application model

- project。
- service。
- container。
- network。
- volume。
- config。
- secret。

学习证据：画出 Prometheus + Grafana 的 Compose 对象关系图。

### 第 3 阶段：掌握服务字段

- `image`。
- `build`。
- `ports`。
- `volumes`。
- `environment`。
- `depends_on`。
- `healthcheck`。
- `restart`。
- `profiles`。

学习证据：写一个包含 demo app、Prometheus、Grafana 的 compose 文件。

### 第 4 阶段：会排障

- `docker compose config`。
- `docker compose ps`。
- `docker compose logs`。
- `docker compose exec`。
- 网络测试。
- volume 检查。

学习证据：写一篇“Grafana 连接 Prometheus 失败排障记录”。

### 第 5 阶段：沉淀到 GitHub

- `compose.yaml`。
- 配置文件。
- dashboard JSON。
- README。
- 截图。

学习证据：别人 clone 仓库后能按 README 一条命令启动环境。

## 小白可能会问

### 已经有 `docker run` 了，为什么还要 Compose？

`docker run` 适合一个容器。Compose 适合一组有关联的容器。AIOps 实验常常至少有 demo app、Prometheus、Grafana，多了以后手写命令很难复现。

### `services`、`networks`、`volumes` 分别管什么？

`services` 定义要跑哪些服务。`networks` 定义服务怎么互相通信。`volumes` 定义数据怎么持久化或文件怎么挂载。

### 为什么容器之间可以用服务名访问？

Compose 会为 project 创建网络，并在网络里提供服务名 DNS。Grafana 访问 `prometheus:9090` 时，Docker 会把 `prometheus` 解析到 Prometheus 容器。

### `depends_on` 能保证服务真的可用吗？

简单 `depends_on` 主要表达启动顺序，不保证应用已经 ready。要结合 `healthcheck` 和 `condition: service_healthy`，应用本身也要有重试机制。

### `docker compose down -v` 为什么危险？

因为 `-v` 会删除 volumes。数据库、Grafana dashboard、Prometheus 历史数据如果存在 volume 里，会一起被删。

## 面试怎么讲

Docker Compose 用来定义和运行多容器应用。它通过 `compose.yaml` 描述 project 下的 services、networks、volumes、configs 和 secrets，让 Prometheus、Grafana、demo app 这类 AIOps 实验环境可以一键启动和复现。Compose 会自动创建项目网络，服务之间可以用 service name 通信，所以 Grafana 访问 Prometheus 应该写 `prometheus:9090`，不是 `localhost:9090`。排障时我会先用 `docker compose config` 检查配置，再用 `ps` 看状态、`logs` 看日志、`exec` 进容器测试网络，并特别注意端口映射、volume 挂载和 `depends_on` 不等于 ready。

## 面试题

1. Docker Compose 解决什么问题？
2. Docker Compose 和 `docker run` 有什么区别？
3. Compose application model 里有哪些核心对象？
4. project name 有什么作用？
5. service 和 container 是什么关系？
6. `image` 和 `build` 有什么区别？
7. `ports: "3000:3000"` 左右两边分别是什么？
8. `ports` 和 `expose` 有什么区别？
9. named volume 和 bind mount 有什么区别？
10. 为什么 Grafana 连接 Prometheus 用 `prometheus:9090`？
11. 容器里的 `localhost` 指谁？
12. `depends_on` 能不能保证服务完全可用？
13. `healthcheck` 解决什么问题？
14. `env_file` 和 `environment` 怎么选？
15. `configs` 和 bind mount 有什么区别？
16. `secrets` 解决什么问题，有什么边界？
17. `docker compose config` 有什么用？
18. `docker compose down` 和 `down -v` 有什么区别？
19. 如何排查 Compose 服务之间网络不通？
20. 为什么 Compose 很适合 AIOps 学习项目？

## 学习检查清单

- [ ] 我能解释 Docker Compose 和 Docker 的关系。
- [ ] 我能解释 project、service、container、network、volume。
- [ ] 我能写现代 `compose.yaml`，不依赖旧 `version` 字段。
- [ ] 我能解释 `image`、`build`、`ports`、`volumes`、`environment`、`env_file`。
- [ ] 我能解释 `depends_on` 和 `healthcheck` 的边界。
- [ ] 我能解释 `ports` 和 `expose`。
- [ ] 我能解释 service name DNS 和容器里的 `localhost`。
- [ ] 我能用 named volume 持久化 Grafana 数据。
- [ ] 我能用 bind mount 挂载 Prometheus 配置。
- [ ] 我能使用 `docker compose config` 检查配置。
- [ ] 我能使用 `docker compose up -d --build` 启动环境。
- [ ] 我能使用 `docker compose logs` 排查服务。
- [ ] 我能进入容器测试服务间网络。
- [ ] 我能搭建 demo app + Prometheus + Grafana 实验室。
- [ ] 我能把 Compose 实验环境作为 GitHub 学习证据提交。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/observability-compose/compose.yaml`
- `labs/observability-compose/demo-app/Dockerfile`
- `labs/observability-compose/demo-app/app.py`
- `labs/observability-compose/prometheus/prometheus.yml`
- `labs/observability-compose/grafana/provisioning/datasources/prometheus.yml`
- 一张 `docker compose ps` 截图。
- 一张 Prometheus `/targets` 截图。
- 一张 Grafana Explore 查询 `up` 的截图。
- 一篇笔记：`Docker Compose 中 localhost、服务名和端口映射的区别.md`
- 一篇排障记录：`Grafana 连接 Prometheus 失败怎么查.md`

如果别人 clone 你的仓库后，能进入 `labs/observability-compose` 执行 `docker compose up -d --build`，并按照 README 打开 Prometheus 和 Grafana，你的 Compose 学习就不是停留在概念上，而是形成了可复现的 AIOps 实验环境。
