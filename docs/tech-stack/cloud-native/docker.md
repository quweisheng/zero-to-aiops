# Docker

> 目标：能把一个服务打包成镜像，用容器运行，并理解 Docker Engine、镜像、容器、Dockerfile、网络、卷、registry、日志和资源限制之间的关系。

## 官方资料

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Docker Engine](https://docs.docker.com/engine/)
- [Docker CLI reference](https://docs.docker.com/reference/cli/docker/)
- [Running containers](https://docs.docker.com/engine/containers/run/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Build with Docker](https://docs.docker.com/build/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker storage](https://docs.docker.com/engine/storage/)
- [Volumes](https://docs.docker.com/engine/storage/volumes/)
- [Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Docker networking](https://docs.docker.com/engine/network/)
- [Bridge network driver](https://docs.docker.com/engine/network/drivers/bridge/)
- [Docker daemon configuration](https://docs.docker.com/engine/daemon/)
- [Docker Engine security](https://docs.docker.com/engine/security/)

说明：本文是基于 Docker 官方文档写成的原创中文学习教程，不复制官方全文。官方文档负责给出 Docker 的对象、命令和配置边界，本文负责把这些知识组织成 AIOps 学习路径。

## 场景开场

“我电脑上明明能跑，为什么一到别人电脑就报错？”

这句话几乎每个学运维、开发、AIOps 的人都听过。原因可能很多：

- Python 版本不一样。
- 系统依赖没装。
- 环境变量漏了。
- 端口被占用。
- 配置文件路径不同。
- 数据库、Redis、Prometheus、Grafana 的安装方式不一致。

Docker 要解决的核心问题就是：把应用、运行依赖和启动方式尽量打包成一个标准化对象，让它在不同机器上用相似方式运行。

对 AIOps 学习来说，Docker 更重要。你不可能每次都手工安装 Prometheus、Grafana、Loki、OpenTelemetry Collector、MySQL、Redis、Kafka。Docker 能让你先把实验环境跑起来，再把精力放到指标、日志、告警、自动化和模型上。

## 一句话人话版

Docker 是一套把应用打包成镜像、再用容器运行起来的平台。镜像像安装包，容器像正在运行的进程环境。

## 学习边界

这一篇讲 Docker 单机基础，重点是：

- Docker Engine 怎么工作。
- 镜像和容器是什么关系。
- Dockerfile 怎么写。
- `docker build` 和 `docker run` 到底做了什么。
- 端口映射、网络、卷、日志、资源限制怎么理解。
- 容器坏了怎么查。
- Docker 在 AIOps 实验环境和服务交付中怎么用。

这一篇不会深入展开 Docker Compose、Kubernetes、Helm 和 Ingress。它们在后续文件中单独讲。你可以把 Docker 理解成云原生学习的底座：先懂容器，再懂多容器编排，再懂 Kubernetes。

## 官方知识地图

Docker 官方资料可以按这张表理解：

| 官方资料 | 负责回答的问题 | 本篇如何使用 |
|---|---|---|
| Docker overview | Docker 是什么，整体架构是什么 | 先建立 client、daemon、objects、registry 的全局图 |
| Docker Engine | Docker daemon、API、对象管理 | 理解镜像、容器、网络、卷是谁创建和管理的 |
| Docker CLI reference | 每个 `docker` 命令怎么用 | 建立命令字典，避免只背命令名 |
| Running containers | `docker run` 如何创建和启动容器 | 讲清镜像引用、容器命令、端口、环境变量、挂载 |
| Dockerfile reference | Dockerfile 有哪些指令 | 逐个解释 `FROM`、`RUN`、`COPY`、`CMD` 等 |
| Build with Docker | 构建上下文、缓存、BuildKit、多阶段构建 | 讲清镜像不是手工装出来的，而是构建出来的 |
| Storage | 容器写入层、volume、bind mount、tmpfs | 解释为什么删容器会丢数据，怎样持久化 |
| Networking | bridge、host、none、端口发布 | 解释容器之间、容器和宿主机之间怎么通信 |
| Daemon configuration | Docker daemon 数据目录和配置 | 了解 `/var/lib/docker`、日志和 daemon 配置边界 |
| Security | 容器安全、非 root 用户、隔离边界 | 说明容器不是虚拟机，也不是绝对安全沙箱 |

这张地图背后有一个学习顺序：

```text
先理解 Docker Engine 架构
  -> 再理解镜像和容器对象
  -> 再学习 Dockerfile 构建
  -> 再学习 docker run 运行参数
  -> 再学习网络和存储
  -> 再学习日志、资源、安全和排障
  -> 最后把 AIOps demo 容器化
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先理解 Docker Engine 架构</code> | 这一行里的英文要这样读：`Docker Engine` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; 再理解镜像和容器对象</code> | 这一行表示上一级主题下的子项“再理解镜像和容器对象”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 再学习 Dockerfile 构建</code> | 这一行要理解这些英文词：`Dockerfile` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 再学习 docker run 运行参数</code> | 这一行要理解这些英文词：`docker run` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 再学习网络和存储</code> | 这一行表示上一级主题下的子项“再学习网络和存储”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 再学习日志、资源、安全和排障</code> | 这一行表示上一级主题下的子项“再学习日志、资源、安全和排障”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>  -&gt; 最后把 AIOps demo 容器化</code> | 这一行要理解这些英文词：`AIOps demo` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Docker 在 AIOps 链路中的位置

```text
AIOps lab or platform
  ├── observability
  │   ├── Prometheus container
  │   ├── Grafana container
  │   ├── Loki container
  │   └── OpenTelemetry Collector container
  ├── data stores
  │   ├── MySQL container
  │   ├── Redis container
  │   └── Kafka container
  ├── automation and APIs
  │   ├── FastAPI container
  │   └── webhook worker container
  └── learning evidence
      ├── Dockerfile
      ├── run commands
      ├── logs
      └── troubleshooting notes
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>AIOps lab or platform</code> | 这一行里的英文要这样读：`AIOps lab or platform` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  ├── observability</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 3 行 | <code>  │   ├── Prometheus container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 4 行 | <code>  │   ├── Grafana container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 5 行 | <code>  │   ├── Loki container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 6 行 | <code>  │   └── OpenTelemetry Collector container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 7 行 | <code>  ├── data stores</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 8 行 | <code>  │   ├── MySQL container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 9 行 | <code>  │   ├── Redis container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 10 行 | <code>  │   └── Kafka container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 11 行 | <code>  ├── automation and APIs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 12 行 | <code>  │   ├── FastAPI container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 13 行 | <code>  │   └── webhook worker container</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 14 行 | <code>  └── learning evidence</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 15 行 | <code>      ├── Dockerfile</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 16 行 | <code>      ├── run commands</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 17 行 | <code>      ├── logs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 18 行 | <code>      └── troubleshooting notes</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

Docker 在 AIOps 中主要有四个用途：

| 用途 | 例子 | 你要掌握的点 |
|---|---|---|
| 搭实验环境 | 跑 Prometheus、Grafana、Redis | 拉镜像、端口映射、volume、网络 |
| 打包服务 | 容器化 FastAPI 异常检测服务 | Dockerfile、build、tag、run |
| 复现问题 | 用同一镜像复现线上版本 | tag、digest、日志、环境变量 |
| 理解 Kubernetes | Pod 里运行容器 | 镜像、端口、挂载、资源限制、健康检查 |

## Docker 是什么

Docker 是一个用于开发、分发和运行应用的平台。它的核心对象包括：

| 对象 | 一句话定义 | 类比 |
|---|---|---|
| Image | 镜像，包含应用和依赖的只读模板 | 安装包或系统快照 |
| Container | 容器，镜像运行起来后的实例 | 正在运行的进程环境 |
| Dockerfile | 构建镜像的文本说明书 | 自动化安装脚本 |
| Registry | 镜像仓库 | 软件包仓库 |
| Volume | Docker 管理的数据持久化目录 | 独立数据盘 |
| Network | 容器通信网络 | 虚拟交换机和端口规则 |

最容易混淆的是镜像和容器：

```text
image: nginx:1.27
  |
  | docker run
  v
container: web-1
container: web-2
container: web-3
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>image: nginx:1.27</code> | `image` 是image 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `nginx:1.27` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  &#124; docker run</code> | 这一行里的英文要这样读：`docker run` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 5 行 | <code>container: web-1</code> | `container` 是container 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `web-1` 是这个字段的示例内容或模板表达式。 |
| 第 6 行 | <code>container: web-2</code> | `container` 是container 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `web-2` 是这个字段的示例内容或模板表达式。 |
| 第 7 行 | <code>container: web-3</code> | `container` 是container 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `web-3` 是这个字段的示例内容或模板表达式。 |

一个镜像可以启动多个容器。删除容器不会自动删除镜像。删除镜像也不能删除正在使用它的容器。

## Docker Engine 架构

Docker 使用 client-server 架构。

```text
user
  |
  v
docker CLI
  |
  v
Docker API
  |
  v
Docker daemon
  |
  +--> images
  +--> containers
  +--> networks
  +--> volumes
  +--> registry pull / push
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user</code> | 这一行里的英文要这样读：`user` 是用户。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 4 行 | <code>docker CLI</code> | 这一行里的英文要这样读：`docker CLI` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 6 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 7 行 | <code>Docker API</code> | 这一行里的英文要这样读：`Docker API` 这个英文标识可以拆开理解为：应用程序接口。 |
| 第 8 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 9 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 10 行 | <code>Docker daemon</code> | 这一行里的英文要这样读：`Docker daemon` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 11 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 12 行 | <code>  +--&gt; images</code> | 这一行要理解这些英文词：`images` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  +--&gt; containers</code> | 这一行要理解这些英文词：`containers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  +--&gt; networks</code> | 这一行要理解这些英文词：`networks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  +--&gt; volumes</code> | 这一行要理解这些英文词：`volumes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>  +--&gt; registry pull / push</code> | 这一行要理解这些英文词：`registry pull` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`push` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

逐层解释：

| 组件 | 是什么 | 为什么需要 |
|---|---|---|
| Docker CLI | 你敲的 `docker` 命令 | 给人和脚本一个操作入口 |
| Docker API | CLI 和 daemon 通信的 API | 让 CLI、SDK、平台都能控制 Docker |
| Docker daemon | 后台服务，管理 Docker 对象 | 真正创建镜像、容器、网络、卷 |
| Registry | 镜像仓库 | 让镜像可以分发、下载、版本化 |

当你运行：

```bash
docker run -d --name web -p 8080:80 nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name web -p 8080:80 nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

背后大致发生：

```text
docker CLI receives command
  -> sends request to Docker daemon
  -> daemon checks whether nginx:1.27 exists locally
  -> if missing, daemon pulls image from registry
  -> daemon creates container filesystem and metadata
  -> daemon configures network and port publishing
  -> daemon starts container process
  -> CLI prints container ID
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker CLI receives command</code> | 这一行里的英文要这样读：`docker CLI receives command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; sends request to Docker daemon</code> | 这一行要理解这些英文词：`sends request to Docker daemon` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; daemon checks whether nginx:1.27 exists locally</code> | 这一行要理解这些英文词：`daemon checks whether nginx` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`exists locally` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; if missing, daemon pulls image from registry</code> | 这一行要理解这些英文词：`if missing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`daemon pulls image from registry` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; daemon creates container filesystem and metadata</code> | 这一行要理解这些英文词：`daemon creates container filesystem and metadata` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; daemon configures network and port publishing</code> | 这一行要理解这些英文词：`daemon configures network and port publishing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; daemon starts container process</code> | 这一行要理解这些英文词：`daemon starts container process` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; CLI prints container ID</code> | 这一行要理解这些英文词：`CLI prints container ID` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Docker 和虚拟机的区别

很多新手会问：Docker 是不是轻量虚拟机？

可以用这个图理解：

```text
Virtual machine
  host OS
  hypervisor
  guest OS
  app and dependencies

Container
  host OS kernel
  container runtime
  isolated process
  app and dependencies
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Virtual machine</code> | 这一行里的英文要这样读：`Virtual machine` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  host OS</code> | 这一行里的英文要这样读：`host OS` 这个英文标识可以拆开理解为：主机。 |
| 第 3 行 | <code>  hypervisor</code> | 这一行里的英文要这样读：`hypervisor` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  guest OS</code> | 这一行里的英文要这样读：`guest OS` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>  app and dependencies</code> | 这一行里的英文要这样读：`app and dependencies` 这个英文标识可以拆开理解为：应用或服务。 |
| 第 7 行 | <code>Container</code> | 这一行里的英文要这样读：`Container` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 8 行 | <code>  host OS kernel</code> | 这一行里的英文要这样读：`host OS kernel` 这个英文标识可以拆开理解为：主机。 |
| 第 9 行 | <code>  container runtime</code> | 这一行里的英文要这样读：`container runtime` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>  isolated process</code> | 这一行里的英文要这样读：`isolated process` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 11 行 | <code>  app and dependencies</code> | 这一行里的英文要这样读：`app and dependencies` 这个英文标识可以拆开理解为：应用或服务。 |

关键区别：

| 对比 | 虚拟机 | 容器 |
|---|---|---|
| 内核 | 每个虚拟机通常有自己的 guest OS kernel | 容器共享宿主机内核 |
| 启动速度 | 通常更慢 | 通常更快 |
| 隔离程度 | 更像完整机器 | 更像隔离后的进程 |
| 镜像大小 | 通常更大 | 通常更小 |
| 使用场景 | 强隔离、多 OS | 应用打包、快速部署、实验环境 |

容器不是虚拟机，也不是绝对安全边界。它依赖操作系统内核能力做隔离和限制。

## 容器底层机制

Docker 不只是一个命令行工具，它背后依赖 Linux 内核能力。

### namespaces

namespace 用来做隔离。你可以把它理解成“让进程看到属于自己的世界”。

常见隔离维度：

| namespace | 隔离什么 | 直观效果 |
|---|---|---|
| PID | 进程编号空间 | 容器里看到自己的进程树 |
| NET | 网络设备、IP、路由、端口 | 容器有自己的网络栈 |
| MNT | 挂载点 | 容器看到自己的文件系统 |
| UTS | hostname | 容器可以有自己的主机名 |
| IPC | 进程间通信 | 隔离共享内存等资源 |
| USER | 用户和组 ID 映射 | 容器内外用户身份可映射 |

### cgroups

cgroups 用来限制和统计资源。

它回答的问题是：

- 这个容器最多能用多少 CPU？
- 这个容器最多能用多少内存？
- 这个容器当前用了多少资源？
- 一个容器能不能拖垮整台机器？

Docker 运行时可以加资源限制：

```bash
docker run --memory 256m --cpus 0.5 nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --memory 256m --cpus 0.5 nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 分层文件系统

Docker 镜像是分层的。

```text
image: aiops-demo:0.1
  layer 4: CMD ["python", "app.py"]
  layer 3: COPY . .
  layer 2: RUN pip install ...
  layer 1: FROM python:3.12-slim
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>image: aiops-demo:0.1</code> | `image` 是image 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `aiops-demo:0.1` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>  layer 4: CMD ["python", "app.py"]</code> | `layer 4` 是layer 4 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `CMD ["python", "app.py"]` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>  layer 3: COPY . .</code> | `layer 3` 是layer 3 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `COPY . .` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>  layer 2: RUN pip install ...</code> | `layer 2` 是layer 2 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `RUN pip install ...` 是这个字段的示例内容或模板表达式。 |
| 第 5 行 | <code>  layer 1: FROM python:3.12-slim</code> | `layer 1` 是layer 1 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `FROM python:3.12-slim` 是这个字段的示例内容或模板表达式。 |

好处：

- 多个镜像可以复用基础层。
- 构建时可以利用缓存。
- 传输镜像时只需要传缺失的层。

容器启动时，会在只读镜像层上面加一个可写层：

```text
container writable layer
image read-only layer
image read-only layer
image read-only layer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>container writable layer</code> | 这一行里的英文要这样读：`container writable layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>image read-only layer</code> | 这一行里的英文要这样读：`image read-only layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>image read-only layer</code> | 这一行里的英文要这样读：`image read-only layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>image read-only layer</code> | 这一行里的英文要这样读：`image read-only layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

容器删除后，可写层通常也会被删除。所以数据库数据、Prometheus 数据、Grafana 配置不能只放在容器可写层里，应该用 volume 或 bind mount。

## Docker Desktop 和 Linux Docker Engine

在 Linux 上，Docker Engine 直接和 Linux 内核能力配合。

在 Windows 和 macOS 上，Docker Desktop 通常会通过一个轻量 Linux VM 来运行 Linux 容器。你在 Windows PowerShell 里敲 `docker`，CLI 会和 Docker Desktop 管理的后端通信。

这会影响几个点：

| 点 | 影响 |
|---|---|
| 文件挂载 | Windows 路径挂载到 Linux 容器时可能有路径转换 |
| 网络 | 容器网络经过 Docker Desktop 的虚拟化层 |
| 性能 | 大量小文件挂载可能比 Linux 原生慢 |
| localhost | Docker Desktop 做了额外转发，和 Linux 原生环境细节不同 |

学习时不需要一开始钻太深，但要知道：容器运行的是 Linux 容器时，它看到的是 Linux 用户空间和 Linux 文件路径。

## 镜像

镜像是只读模板，包含运行应用需要的文件系统、默认命令、环境变量、元数据。

镜像引用通常长这样：

```text
nginx:1.27
python:3.12-slim
redis:7.4
prom/prometheus:v2.55.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx:1.27</code> | `nginx` 是nginx 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `1.27` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>python:3.12-slim</code> | `python` 是python 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `3.12-slim` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>redis:7.4</code> | `redis` 是redis 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `7.4` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>prom/prometheus:v2.55.0</code> | `prom/prometheus:v2.55.0` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

结构：

```text
repository:tag
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>repository:tag</code> | `repository` 是repository 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `tag` 是这个字段的示例内容或模板表达式。 |

例如：

| 镜像引用 | repository | tag |
|---|---|---|
| `nginx:1.27` | `nginx` | `1.27` |
| `python:3.12-slim` | `python` | `3.12-slim` |
| `demo-api:0.1` | `demo-api` | `0.1` |

如果不写 tag，Docker 默认使用 `latest`。但是生产和学习记录里都不建议依赖 `latest`，因为它不是“最新稳定版”的保证，只是一个普通标签。

### tag 和 digest

tag 是人类可读的版本标签，digest 是内容哈希。

```text
nginx:1.27
nginx@sha256:...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx:1.27</code> | `nginx` 是nginx 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `1.27` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>nginx@sha256:...</code> | `nginx@sha256:...` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

tag 可能被重新指向别的内容，digest 指向具体镜像内容。做严格复现时，digest 更可靠。

## 容器

容器是镜像运行起来后的实例。

你可以用同一个镜像启动多个容器：

```bash
docker run -d --name web-a nginx:1.27
docker run -d --name web-b nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name web-a nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>docker run -d --name web-b nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

它们共享镜像层，但有各自的：

- 容器 ID。
- 名字。
- 进程。
- 网络命名空间。
- 可写层。
- 日志。
- 环境变量。

### 容器生命周期

常见状态：

```text
created -> running -> exited
             |           |
             v           v
           paused      removed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>created -&gt; running -&gt; exited</code> | 这一行要理解这些英文词：`created` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`running` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`exited` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>             &#124;           &#124;</code> | 这一行是符号、路径或状态片段，需要结合上下文确认它连接的是哪个组件、文件或排障证据。 |
| 第 3 行 | <code>             v           v</code> | 这一行里的英文要这样读：`v` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>           paused      removed</code> | 这一行里的英文要这样读：`paused` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`removed` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

常用命令：

```bash
docker create nginx:1.27
docker start <container>
docker stop <container>
docker restart <container>
docker rm <container>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker create nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker start &lt;container&gt;</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker stop &lt;container&gt;</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 4 行 | <code>docker restart &lt;container&gt;</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 5 行 | <code>docker rm &lt;container&gt;</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

`docker run` 可以理解成 `docker create` 加 `docker start` 的组合。

## Dockerfile

Dockerfile 是构建镜像的文本说明书。

一个最小 Python 服务镜像：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 5 行 | <code>COPY app.py .</code> | 把宿主机项目文件复制进镜像。 |
| 第 7 行 | <code>EXPOSE 8000</code> | 声明容器应用监听的端口，方便读者知道服务入口。 |
| 第 9 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

构建：

```bash
docker build -t aiops-demo:0.1 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t aiops-demo:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

最后的 `.` 是 build context，也就是发送给构建器的上下文目录。

## Dockerfile 指令详解

### `FROM`

| 项 | 内容 |
|---|---|
| 是什么 | 指定基础镜像 |
| 为什么需要 | 你的镜像通常基于已有系统或运行时，比如 Python、Node、nginx |
| 怎么工作 | 构建从基础镜像的层开始，再叠加后续指令生成的新层 |
| 怎么用 | `FROM python:3.12-slim` |
| 坏了怎么查 | 拉取失败看网络、镜像名、tag、registry 登录状态 |

示例：

```dockerfile
FROM python:3.12-slim
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |

常见坑：

- 不写 tag 会默认使用 `latest`。
- 基础镜像太大，会导致最终镜像很大。
- Alpine 镜像很小，但某些 Python 依赖编译会更麻烦。

### `WORKDIR`

| 项 | 内容 |
|---|---|
| 是什么 | 设置后续指令和容器启动时的工作目录 |
| 为什么需要 | 避免到处写绝对路径 |
| 怎么工作 | 如果目录不存在，Docker 会创建 |
| 怎么用 | `WORKDIR /app` |
| 坏了怎么查 | 进入容器后用 `pwd`、`ls` 看当前目录和文件 |

示例：

```dockerfile
WORKDIR /app
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |

### `COPY`

| 项 | 内容 |
|---|---|
| 是什么 | 把 build context 里的文件复制进镜像 |
| 为什么需要 | 把应用代码、配置、依赖声明放进镜像 |
| 怎么工作 | 源路径来自 build context，目标路径在镜像文件系统中 |
| 怎么用 | `COPY requirements.txt .`、`COPY . .` |
| 坏了怎么查 | 看 build context、`.dockerignore`、路径是否写错 |

示例：

```dockerfile
COPY requirements.txt .
COPY app.py .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 2 行 | <code>COPY app.py .</code> | 把宿主机项目文件复制进镜像。 |

常见坑：

- `COPY ../file .` 通常不行，因为超出了 build context。
- `COPY . .` 可能把 `.venv/`、日志、缓存也复制进去，要配合 `.dockerignore`。

### `ADD`

| 项 | 内容 |
|---|---|
| 是什么 | 类似 `COPY`，还支持本地 tar 自动解压和远程 URL |
| 为什么需要 | 某些构建场景需要解压归档 |
| 怎么工作 | 比 `COPY` 行为更多 |
| 怎么用 | 大多数普通文件复制优先用 `COPY` |
| 坏了怎么查 | 如果行为不符合预期，先换成更明确的 `COPY` |

初学者记住：除非你明确需要 `ADD` 的额外能力，否则用 `COPY`。

### `RUN`

| 项 | 内容 |
|---|---|
| 是什么 | 构建镜像时执行命令 |
| 为什么需要 | 安装系统包、安装 Python 依赖、生成构建产物 |
| 怎么工作 | 每条 `RUN` 通常生成一个新镜像层 |
| 怎么用 | `RUN python -m pip install -r requirements.txt` |
| 坏了怎么查 | 构建日志、网络、包名、基础镜像包管理器 |

示例：

```dockerfile
RUN python -m pip install --no-cache-dir -r requirements.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>RUN python -m pip install --no-cache-dir -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |

常见坑：

- 把运行时命令写进 `RUN`，导致构建时执行，容器启动时反而没执行。
- 安装包后不清理缓存，镜像变大。

### `CMD`

| 项 | 内容 |
|---|---|
| 是什么 | 容器启动时的默认命令 |
| 为什么需要 | 告诉容器默认跑什么进程 |
| 怎么工作 | `docker run IMAGE` 时执行；命令行指定新命令会覆盖它 |
| 怎么用 | `CMD ["python", "app.py"]` |
| 坏了怎么查 | `docker inspect` 看 Config.Cmd，`docker logs` 看启动错误 |

推荐 exec 形式：

```dockerfile
CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

不推荐初学者写成：

```dockerfile
CMD python app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CMD python app.py</code> | 设置容器启动时默认执行的命令。 |

exec 形式更清晰，也更利于信号处理。

### `ENTRYPOINT`

| 项 | 内容 |
|---|---|
| 是什么 | 容器入口命令 |
| 为什么需要 | 把镜像做成固定可执行工具 |
| 怎么工作 | 通常和 `CMD` 组合，`CMD` 提供默认参数 |
| 怎么用 | `ENTRYPOINT ["python", "worker.py"]` |
| 坏了怎么查 | 用 `--entrypoint` 临时覆盖，进入 shell 排查 |

例子：

```dockerfile
ENTRYPOINT ["python", "worker.py"]
CMD ["--help"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ENTRYPOINT ["python", "worker.py"]</code> | 设置容器启动时默认执行的命令。 |
| 第 2 行 | <code>CMD ["--help"]</code> | 设置容器启动时默认执行的命令。 |

初学判断：

- 服务镜像多数用 `CMD` 就够了。
- 命令行工具镜像更适合 `ENTRYPOINT`。

### `ENV`

| 项 | 内容 |
|---|---|
| 是什么 | 设置镜像和容器里的环境变量 |
| 为什么需要 | 配置运行参数，比如日志级别、端口、时区 |
| 怎么工作 | 构建后保存在镜像元数据中，运行时可被覆盖 |
| 怎么用 | `ENV APP_ENV=production` |
| 坏了怎么查 | `docker exec <container> env` 查看 |

示例：

```dockerfile
ENV PYTHONUNBUFFERED=1
ENV APP_PORT=8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ENV PYTHONUNBUFFERED=1</code> | 设置镜像或容器里的环境变量。 |
| 第 2 行 | <code>ENV APP_PORT=8000</code> | 设置镜像或容器里的环境变量。 |

不要把密码、token 写进 Dockerfile 的 `ENV`，因为它会进入镜像历史和元数据。

### `ARG`

| 项 | 内容 |
|---|---|
| 是什么 | 构建时变量 |
| 为什么需要 | 构建阶段传版本号、开关、下载地址 |
| 怎么工作 | 只在 build 阶段使用，不等同于运行时环境变量 |
| 怎么用 | `ARG APP_VERSION=dev` |
| 坏了怎么查 | 构建时加 `--build-arg` 并查看 build 输出 |

示例：

```dockerfile
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ARG APP_VERSION=dev</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |
| 第 2 行 | <code>ENV APP_VERSION=$APP_VERSION</code> | 设置镜像或容器里的环境变量。 |

构建：

```bash
docker build --build-arg APP_VERSION=0.1.0 -t demo-api:0.1 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build --build-arg APP_VERSION=0.1.0 -t demo-api:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### `EXPOSE`

| 项 | 内容 |
|---|---|
| 是什么 | 声明容器内服务使用的端口 |
| 为什么需要 | 给镜像使用者和工具一个端口提示 |
| 怎么工作 | 它不会自动把端口发布到宿主机 |
| 怎么用 | `EXPOSE 8000` |
| 坏了怎么查 | 如果宿主机访问不到，检查 `docker run -p` |

示例：

```dockerfile
EXPOSE 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EXPOSE 8000</code> | 声明容器应用监听的端口，方便读者知道服务入口。 |

重点：`EXPOSE 8000` 不等于 `-p 8000:8000`。前者只是声明，后者才是端口发布。

### `USER`

| 项 | 内容 |
|---|---|
| 是什么 | 指定后续指令或容器运行时的用户 |
| 为什么需要 | 避免容器内进程默认 root 运行 |
| 怎么工作 | 设置镜像元数据中的用户 |
| 怎么用 | `USER appuser` |
| 坏了怎么查 | 文件权限错误时，用 `id`、`ls -l` 检查 |

示例：

```dockerfile
RUN useradd --create-home appuser
USER appuser
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>RUN useradd --create-home appuser</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 2 行 | <code>USER appuser</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |

### `HEALTHCHECK`

| 项 | 内容 |
|---|---|
| 是什么 | 定义容器健康检查命令 |
| 为什么需要 | 区分“进程还在”和“服务真的可用” |
| 怎么工作 | Docker 定期执行命令，根据退出码判断健康状态 |
| 怎么用 | `HEALTHCHECK CMD curl -f localhost:8000/health || exit 1` |
| 坏了怎么查 | `docker inspect` 看 health 日志 |

示例：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import socket; s=socket.create_connection(('127.0.0.1', 8000), timeout=2); s.close()"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HEALTHCHECK --interval=30s --timeout=3s \</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |
| 第 2 行 | <code>  CMD python -c "import socket; s=socket.create_connection(('127.0.0.1', 8000), timeout=2); s.close()"</code> | 设置容器启动时默认执行的命令。 |

### `VOLUME`

| 项 | 内容 |
|---|---|
| 是什么 | 声明容器内某路径应该作为挂载点 |
| 为什么需要 | 提醒运行时这里是数据目录 |
| 怎么工作 | 运行容器时可能创建匿名卷 |
| 怎么用 | `VOLUME ["/data"]` |
| 坏了怎么查 | `docker inspect` 看 Mounts |

初学者写业务镜像时，可以先不急着用 `VOLUME`，而是在 `docker run --mount` 或 Compose 里明确挂载。

### `LABEL`

| 项 | 内容 |
|---|---|
| 是什么 | 给镜像添加元数据 |
| 为什么需要 | 记录维护者、版本、源码地址、构建信息 |
| 怎么工作 | 写入镜像 metadata |
| 怎么用 | `LABEL org.opencontainers.image.source="..."` |
| 坏了怎么查 | `docker image inspect` 查看 Labels |

示例：

```dockerfile
LABEL org.opencontainers.image.title="aiops-demo"
LABEL org.opencontainers.image.version="0.1.0"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LABEL org.opencontainers.image.title="aiops-demo"</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |
| 第 2 行 | <code>LABEL org.opencontainers.image.version="0.1.0"</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |

## build context 和 `.dockerignore`

执行：

```bash
docker build -t aiops-demo:0.1 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t aiops-demo:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

最后的 `.` 是 build context。Docker 会把这个目录下的内容作为构建上下文发送给构建器。Dockerfile 里的 `COPY` 只能复制 context 里的文件。

如果项目里有这些内容：

```text
.venv/
node_modules/
logs/
reports/
.git/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.venv/</code> | `.venv/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>node_modules/</code> | `node_modules/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>logs/</code> | `logs/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>reports/</code> | `reports/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>.git/</code> | `.git/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

又写了：

```dockerfile
COPY . .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>COPY . .</code> | 把宿主机项目文件复制进镜像。 |

镜像可能会变得很大，甚至把不该进镜像的文件带进去。所以需要 `.dockerignore`：

```text
.git
.venv
__pycache__
*.pyc
logs
reports
.env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.git</code> | `.git` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>.venv</code> | `.venv` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>__pycache__</code> | 这一行里的英文要这样读：`pycache__` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>*.pyc</code> | `*.pyc` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>logs</code> | 这一行里的英文要这样读：`logs` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>reports</code> | 这一行里的英文要这样读：`reports` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 7 行 | <code>.env</code> | `.env` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

`.dockerignore` 的作用类似 `.gitignore`，但它控制的是 Docker build context，不是 Git 提交。

## 镜像构建缓存

Docker 构建会利用缓存。Dockerfile 每条指令都可能形成一层。如果某层之前没有变化，后续构建可以复用缓存。

推荐写法：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 5 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 6 行 | <code>RUN python -m pip install --no-cache-dir -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 8 行 | <code>COPY . .</code> | 把宿主机项目文件复制进镜像。 |
| 第 10 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

为什么先复制 `requirements.txt`，再复制全部代码？

因为业务代码经常变，依赖文件不一定经常变。这样代码变了以后，依赖安装层还能复用缓存。

不推荐：

```dockerfile
COPY . .
RUN python -m pip install --no-cache-dir -r requirements.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>COPY . .</code> | 把宿主机项目文件复制进镜像。 |
| 第 2 行 | <code>RUN python -m pip install --no-cache-dir -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |

这种写法会导致任何代码改动都让依赖安装层失效。

## 多阶段构建

多阶段构建用于把“构建环境”和“运行环境”分开。

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN python -m pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN python -m pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt
COPY . .

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim AS builder</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 4 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 5 行 | <code>RUN python -m pip wheel --wheel-dir /wheels -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 7 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 9 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 10 行 | <code>COPY --from=builder /wheels /wheels</code> | 把宿主机项目文件复制进镜像。 |
| 第 11 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 12 行 | <code>RUN python -m pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 13 行 | <code>COPY . .</code> | 把宿主机项目文件复制进镜像。 |
| 第 15 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

多阶段构建的价值：

- 构建阶段可以安装编译工具。
- 运行阶段只保留运行需要的文件。
- 镜像更小，攻击面更少。

初学阶段不必每个镜像都写多阶段，但要知道它解决什么问题。

## 运行容器

最简单：

```bash
docker run nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

更常见：

```bash
docker run -d --name web -p 8080:80 nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name web -p 8080:80 nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

拆开看：

| 片段 | 含义 |
|---|---|
| `docker run` | 创建并启动容器 |
| `-d` | detached，后台运行 |
| `--name web` | 容器名叫 `web` |
| `-p 8080:80` | 宿主机 8080 转发到容器 80 |
| `nginx:1.27` | 使用的镜像 |

## 端口映射

容器里服务监听的是容器网络命名空间里的端口。宿主机要访问，需要发布端口。

```bash
docker run -d --name web -p 8080:80 nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name web -p 8080:80 nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：

```text
host:8080  ->  container:80
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host:8080  -&gt;  container:80</code> | 这一行要理解这些英文词：`host` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`container` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

访问：

```bash
curl http://localhost:8080
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://localhost:8080</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

常见误区：

| 误区 | 正确理解 |
|---|---|
| `EXPOSE 80` 会自动开放端口 | 不会，仍然要 `-p` |
| `-p 80:8080` 是容器 80 到宿主 8080 | 反了，左边宿主机，右边容器 |
| 容器里监听 `127.0.0.1` 也能被宿主访问 | 通常不行，服务应监听 `0.0.0.0` |

## 环境变量

运行时传环境变量：

```bash
docker run --rm -e APP_ENV=dev -e LOG_LEVEL=debug demo-api:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm -e APP_ENV=dev -e LOG_LEVEL=debug demo-api:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

使用 env 文件：

```bash
docker run --rm --env-file .env demo-api:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --env-file .env demo-api:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

`.env` 示例：

```text
APP_ENV=dev
LOG_LEVEL=debug
PROMETHEUS_URL=http://prometheus:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>APP_ENV=dev</code> | `APP_ENV` 这个英文标识可以拆开理解为：应用或服务，`dev` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>LOG_LEVEL=debug</code> | `LOG_LEVEL` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`debug` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 3 行 | <code>PROMETHEUS_URL=http://prometheus:9090</code> | `PROMETHEUS_URL` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统，`http://prometheus:9090` 表示URL 地址，表示页面、接口或文档入口。 |

注意：不要把 `.env` 里的密钥提交到 Git。

## 容器命令和 PID 1

容器通常只运行一个主进程。这个进程在容器里是 PID 1。

例如：

```dockerfile
CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

容器启动后，`python app.py` 是主进程。如果它退出，容器就退出。

这解释了一个常见现象：

```bash
docker run ubuntu:24.04
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run ubuntu:24.04</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

容器马上退出。因为没有长期运行的前台进程。

如果只是想进入 shell：

```bash
docker run --rm -it ubuntu:24.04 bash
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm -it ubuntu:24.04 bash</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## 存储

容器文件系统分三类：

```text
image read-only layers
container writable layer
external mounts
  ├── volume
  ├── bind mount
  └── tmpfs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>image read-only layers</code> | 这一行里的英文要这样读：`image read-only layers` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>container writable layer</code> | 这一行里的英文要这样读：`container writable layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>external mounts</code> | 这一行里的英文要这样读：`external mounts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  ├── volume</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 5 行 | <code>  ├── bind mount</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 6 行 | <code>  └── tmpfs</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

### 容器可写层

容器运行时写入的文件，默认进入容器可写层。

特点：

- 跟容器生命周期绑定。
- 删除容器后数据通常消失。
- 适合临时文件，不适合数据库和监控数据。

### volume

volume 是 Docker 管理的数据目录。

```bash
docker volume create prometheus-data
docker run -d --name prometheus \
  -v prometheus-data:/prometheus \
  prom/prometheus:v2.55.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker volume create prometheus-data</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker run -d --name prometheus \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>  -v prometheus-data:/prometheus \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  prom/prometheus:v2.55.0</code> | 执行 `prom/prometheus:v2.55.0` 相关命令，后面的参数决定它具体操作什么对象。 |

优点：

- 由 Docker 管理。
- 不依赖宿主机具体目录结构。
- 适合数据库、Prometheus、Grafana 这类持久数据。

### bind mount

bind mount 是把宿主机某个路径挂进容器。

```bash
docker run --rm \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v2.55.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  prom/prometheus:v2.55.0</code> | 执行 `prom/prometheus:v2.55.0` 相关命令，后面的参数决定它具体操作什么对象。 |

适合：

- 挂载配置文件。
- 开发时挂载代码目录。
- 学习时快速修改本地文件并让容器看到。

风险：

- 容器可以读写宿主机路径。
- 路径依赖宿主机系统。
- Windows/macOS 路径映射要注意 Docker Desktop 行为。

### tmpfs

tmpfs 把数据放在内存里，不写入磁盘。

```bash
docker run --rm --tmpfs /tmp nginx:1.27
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --tmpfs /tmp nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

适合临时敏感数据或临时缓存。容器停止后数据消失。

## 网络

Docker 网络负责容器之间、容器和宿主机之间的通信。

常见网络驱动：

| 驱动 | 含义 | 场景 |
|---|---|---|
| bridge | 单机默认桥接网络 | 本机多个容器互通 |
| host | 使用宿主机网络栈 | 网络监控工具、特殊性能需求 |
| none | 关闭网络 | 强隔离任务 |
| overlay | 跨主机网络 | Swarm 等多主机场景 |

### 默认 bridge 和自定义 bridge

默认情况下，容器连接到 `bridge` 网络。

查看：

```bash
docker network ls
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker network ls</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

创建自定义网络：

```bash
docker network create aiops-net
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker network create aiops-net</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

运行两个容器：

```bash
docker run -d --name web --network aiops-net nginx:1.27
docker run --rm --network aiops-net curlimages/curl:8.10.1 http://web
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name web --network aiops-net nginx:1.27</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>docker run --rm --network aiops-net curlimages/curl:8.10.1 http://web</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

在自定义 bridge 网络中，容器可以通过容器名互相解析。学习 Docker Compose 和 Kubernetes Service 时，这个概念很重要。

### 容器里的 localhost

容器里的 `localhost` 指容器自己，不是宿主机，也不是别的容器。

```text
inside container A:
  localhost -> container A

inside container B:
  localhost -> container B

on host:
  localhost -> host
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inside container A:</code> | `inside container A` 是inside container A 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 2 行 | <code>  localhost -&gt; container A</code> | 这一行要理解这些英文词：`localhost` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`container A` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>inside container B:</code> | `inside container B` 是inside container B 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 5 行 | <code>  localhost -&gt; container B</code> | 这一行要理解这些英文词：`localhost` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`container B` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>on host:</code> | `on host` 是on host 这个英文标识可以拆开理解为：主机，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 8 行 | <code>  localhost -&gt; host</code> | 这一行要理解这些英文词：`localhost` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`host` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

如果 `api` 容器要访问 `prometheus` 容器，不应该写：

```text
http://localhost:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://localhost:9090</code> | `http` 表示访问协议，`localhost:9090` 是域名或主机名，`/` 是具体接口路径；真实环境要换成自己的域名和路径。 |

而应该在同一个自定义网络里写：

```text
http://prometheus:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://prometheus:9090</code> | `http` 表示访问协议，`prometheus:9090` 是域名或主机名，`/` 是具体接口路径；真实环境要换成自己的域名和路径。 |

## Registry

Registry 是镜像仓库。常见有：

- Docker Hub。
- GitHub Container Registry。
- 云厂商镜像仓库。
- 公司私有 registry。

常见流程：

```text
docker build
  -> docker tag
  -> docker push
  -> another machine docker pull
  -> docker run
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build</code> | 这一行里的英文要这样读：`docker build` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; docker tag</code> | 这一行要理解这些英文词：`docker tag` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; docker push</code> | 这一行要理解这些英文词：`docker push` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; another machine docker pull</code> | 这一行要理解这些英文词：`another machine docker pull` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; docker run</code> | 这一行要理解这些英文词：`docker run` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

示例：

```bash
docker build -t demo-api:0.1 .
docker tag demo-api:0.1 registry.example.com/aiops/demo-api:0.1
docker push registry.example.com/aiops/demo-api:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t demo-api:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker tag demo-api:0.1 registry.example.com/aiops/demo-api:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker push registry.example.com/aiops/demo-api:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

拉取：

```bash
docker pull registry.example.com/aiops/demo-api:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker pull registry.example.com/aiops/demo-api:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

## 日志

容器最佳实践是把应用日志输出到 stdout/stderr。Docker 会捕获这些输出。

查看日志：

```bash
docker logs web
docker logs -f web
docker logs --tail 100 web
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker logs web</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker logs -f web</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker logs --tail 100 web</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

日志排障顺序：

1. 容器是否还在运行：`docker ps -a`
2. 启动日志：`docker logs <container>`
3. 退出码：`docker inspect <container>`
4. 应用是否监听正确地址和端口。
5. 环境变量和配置是否正确。

AIOps 场景下，容器日志可以被日志采集器收集，例如 Loki、Fluent Bit、Filebeat 或 OpenTelemetry Collector。

## 资源限制和观测

查看运行容器资源：

```bash
docker stats
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker stats</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

限制 CPU 和内存：

```bash
docker run -d --name api \
  --memory 256m \
  --cpus 0.5 \
  demo-api:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name api \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --memory 256m \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --cpus 0.5 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  demo-api:0.1</code> | 执行 `demo-api:0.1` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：

| 参数 | 含义 |
|---|---|
| `--memory 256m` | 限制容器最多使用约 256 MB 内存 |
| `--cpus 0.5` | 限制容器使用约半个 CPU |

排障时要关注：

- 容器是否 OOM 被杀。
- CPU 限制是否太低导致延迟升高。
- 内存限制是否太低导致应用频繁重启。
- 指标系统是否采集到容器资源数据。

## 安全边界

容器安全不是一句“容器隔离了”就结束。

基础原则：

| 原则 | 为什么 |
|---|---|
| 不要默认 root 运行应用 | 降低容器逃逸或误操作影响 |
| 不把密钥写进镜像 | 镜像可能被推送、缓存、扫描 |
| 不随便挂载宿主机敏感目录 | bind mount 会扩大权限影响 |
| 不随便用 `--privileged` | 它会大幅降低隔离 |
| 固定镜像版本 | 避免 `latest` 漂移 |
| 扫描镜像漏洞 | 了解基础镜像和依赖风险 |

示例：使用非 root 用户：

```dockerfile
FROM python:3.12-slim

RUN useradd --create-home appuser
WORKDIR /app
COPY app.py .
USER appuser

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>RUN useradd --create-home appuser</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 4 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 5 行 | <code>COPY app.py .</code> | 把宿主机项目文件复制进镜像。 |
| 第 6 行 | <code>USER appuser</code> | Dockerfile 构建指令，描述镜像构建或容器启动的一步。 |
| 第 8 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

## Docker 命令字典

### `docker version`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Docker client 和 server 版本 |
| 常用语法 | `docker version` |
| 关键字段 | Client、Server、Version、API version |
| AIOps 场景 | 排查 CLI 能否连接 daemon，确认版本差异 |
| 常见坑 | 只有 Client 没有 Server，通常表示 daemon 没启动或连不上 |

### `docker info`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Docker daemon、存储驱动、运行容器数、镜像数等信息 |
| 常用语法 | `docker info` |
| 关键字段 | Server Version、Storage Driver、Docker Root Dir、Operating System |
| AIOps 场景 | 排查 Docker 宿主机环境和存储位置 |
| 常见坑 | 输出很多，不要只看版本，要看 Docker Root Dir 和资源信息 |

### `docker pull`

| 项 | 内容 |
|---|---|
| 作用 | 从 registry 拉取镜像 |
| 常用语法 | `docker pull nginx:1.27` |
| 关键字段 | 镜像名、tag、digest、layer 下载状态 |
| AIOps 场景 | 拉取 Prometheus、Grafana、Redis 等实验镜像 |
| 常见坑 | 网络失败、镜像不存在、私有仓库未登录 |

### `docker images`

| 项 | 内容 |
|---|---|
| 作用 | 查看本地镜像 |
| 常用语法 | `docker images`、`docker image ls` |
| 关键字段 | REPOSITORY、TAG、IMAGE ID、CREATED、SIZE |
| AIOps 场景 | 确认本地是否已有指定版本镜像 |
| 常见坑 | 同一个 IMAGE ID 可能有多个 tag |

### `docker build`

| 项 | 内容 |
|---|---|
| 作用 | 根据 Dockerfile 构建镜像 |
| 常用语法 | `docker build -t demo-api:0.1 .` |
| 关键字段 | `-t` 指定 tag，`.` 指定 build context |
| AIOps 场景 | 把 Python 自动化服务打包成镜像 |
| 常见坑 | 忘记 `.dockerignore`，context 过大；路径超出 context |

### `docker run`

| 项 | 内容 |
|---|---|
| 作用 | 创建并启动容器 |
| 常用语法 | `docker run -d --name web -p 8080:80 nginx:1.27` |
| 关键字段 | `-d`、`--name`、`-p`、`-e`、`-v`、`--network` |
| AIOps 场景 | 启动实验组件或自己的 demo 服务 |
| 常见坑 | 容器主进程退出后容器也会退出 |

### `docker ps`

| 项 | 内容 |
|---|---|
| 作用 | 查看容器列表 |
| 常用语法 | `docker ps`、`docker ps -a` |
| 关键字段 | CONTAINER ID、IMAGE、COMMAND、STATUS、PORTS、NAMES |
| AIOps 场景 | 确认服务容器是否运行 |
| 常见坑 | `docker ps` 只显示运行中容器，退出的要用 `-a` |

### `docker logs`

| 项 | 内容 |
|---|---|
| 作用 | 查看容器 stdout/stderr 日志 |
| 常用语法 | `docker logs web`、`docker logs -f --tail 100 web` |
| 关键字段 | 应用启动日志、错误栈、监听端口 |
| AIOps 场景 | 容器启动失败或接口不可用时第一时间看日志 |
| 常见坑 | 应用如果写文件日志而不输出 stdout，`docker logs` 可能看不到 |

### `docker exec`

| 项 | 内容 |
|---|---|
| 作用 | 在运行中的容器里执行命令 |
| 常用语法 | `docker exec -it web sh` |
| 关键字段 | `-it` 交互终端，容器名，命令 |
| AIOps 场景 | 进入容器看文件、环境变量、网络连通性 |
| 常见坑 | 镜像里不一定有 `bash`，可以试 `sh` |

### `docker stop`

| 项 | 内容 |
|---|---|
| 作用 | 停止运行中的容器 |
| 常用语法 | `docker stop web` |
| 关键字段 | 容器名或 ID |
| AIOps 场景 | 停止实验组件 |
| 常见坑 | 停止不等于删除，容器还在 `docker ps -a` 里 |

### `docker rm`

| 项 | 内容 |
|---|---|
| 作用 | 删除容器 |
| 常用语法 | `docker rm web`、`docker rm -f web` |
| 关键字段 | `-f` 强制删除运行中容器 |
| AIOps 场景 | 清理实验容器 |
| 常见坑 | 删除容器会删除容器可写层，但不会删除命名 volume |

### `docker rmi`

| 项 | 内容 |
|---|---|
| 作用 | 删除本地镜像 |
| 常用语法 | `docker rmi demo-api:0.1` |
| 关键字段 | 镜像名、tag、IMAGE ID |
| AIOps 场景 | 清理旧版本镜像 |
| 常见坑 | 有容器使用该镜像时不能直接删除 |

### `docker inspect`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Docker 对象详细 JSON 信息 |
| 常用语法 | `docker inspect web` |
| 关键字段 | State、Config、NetworkSettings、Mounts、HostConfig |
| AIOps 场景 | 查退出码、端口映射、挂载、环境变量、健康检查 |
| 常见坑 | 输出很长，要学会定位字段 |

### `docker stats`

| 项 | 内容 |
|---|---|
| 作用 | 实时查看容器 CPU、内存、网络、IO 使用 |
| 常用语法 | `docker stats`、`docker stats web` |
| 关键字段 | CPU %、MEM USAGE / LIMIT、NET I/O、BLOCK I/O |
| AIOps 场景 | 排查容器资源瓶颈 |
| 常见坑 | 它是实时流，不是历史指标；历史要接监控系统 |

### `docker network ls`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Docker 网络 |
| 常用语法 | `docker network ls` |
| 关键字段 | NETWORK ID、NAME、DRIVER、SCOPE |
| AIOps 场景 | 确认容器是否在预期网络里 |
| 常见坑 | 默认 bridge 和自定义 bridge 行为不同 |

### `docker network create`

| 项 | 内容 |
|---|---|
| 作用 | 创建 Docker 网络 |
| 常用语法 | `docker network create aiops-net` |
| 关键字段 | 网络名、driver |
| AIOps 场景 | 让 Prometheus、demo API、Grafana 在同一网络中通信 |
| 常见坑 | 容器创建后不自动加入新网络，需 `--network` 或 `docker network connect` |

### `docker network inspect`

| 项 | 内容 |
|---|---|
| 作用 | 查看网络详情和连接的容器 |
| 常用语法 | `docker network inspect aiops-net` |
| 关键字段 | Driver、IPAM、Containers |
| AIOps 场景 | 排查容器间 DNS 和连通性 |
| 常见坑 | 容器不在同一自定义网络时，不能直接用容器名访问 |

### `docker volume ls`

| 项 | 内容 |
|---|---|
| 作用 | 查看 Docker volume |
| 常用语法 | `docker volume ls` |
| 关键字段 | DRIVER、VOLUME NAME |
| AIOps 场景 | 确认 Prometheus、Grafana 数据卷是否存在 |
| 常见坑 | 匿名 volume 名字不直观，清理前要确认用途 |

### `docker volume inspect`

| 项 | 内容 |
|---|---|
| 作用 | 查看 volume 详细信息 |
| 常用语法 | `docker volume inspect prometheus-data` |
| 关键字段 | Mountpoint、Driver、Labels |
| AIOps 场景 | 查数据实际存储位置 |
| 常见坑 | 不要直接随便改 Docker 管理目录里的文件 |

### `docker system df`

| 项 | 内容 |
|---|---|
| 作用 | 查看镜像、容器、volume、build cache 占用 |
| 常用语法 | `docker system df` |
| 关键字段 | Images、Containers、Local Volumes、Build Cache |
| AIOps 场景 | 排查 Docker 宿主机磁盘占满 |
| 常见坑 | 看到占用后不要立刻无脑 prune，要先确认是否有重要数据卷 |

### `docker system prune`

| 项 | 内容 |
|---|---|
| 作用 | 清理未使用对象 |
| 常用语法 | `docker system prune` |
| 关键字段 | stopped containers、unused networks、dangling images、build cache |
| AIOps 场景 | 清理学习环境垃圾对象 |
| 常见坑 | 带 `--volumes` 可能删除未使用 volume，数据可能丢失 |

## AIOps 入门实验：容器化健康检查服务

目标：写一个最小 HTTP 服务，打包成 Docker 镜像，运行容器，查看日志，验证端口映射，再挂载配置。

### 第 1 步：准备目录

```text
aiops-docker-demo/
  app.py
  Dockerfile
  .dockerignore
  README.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-docker-demo/</code> | `aiops-docker-demo/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  app.py</code> | `app.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  Dockerfile</code> | 这一行里的英文要这样读：`Dockerfile` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 4 行 | <code>  .dockerignore</code> | `.dockerignore` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### 第 2 步：创建 `app.py`

```python
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer


SERVICE_NAME = os.getenv("SERVICE_NAME", "aiops-demo")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            payload = {"service": SERVICE_NAME, "status": "ok"}
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    port = int(os.getenv("APP_PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"starting {SERVICE_NAME} on 0.0.0.0:{port}", flush=True)
    server.serve_forever()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from http.server import BaseHTTPRequestHandler, HTTPServer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>SERVICE_NAME = os.getenv("SERVICE_NAME", "aiops-demo")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>class Handler(BaseHTTPRequestHandler):</code> | 定义类，用来组织一组数据和行为。 |
| 第 10 行 | <code>    def do_GET(self):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 11 行 | <code>        if self.path == "/health":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 12 行 | <code>            self.send_response(200)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>            self.send_header("Content-Type", "application/json")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>            self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>            payload = {"service": SERVICE_NAME, "status": "ok"}</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <code>            self.wfile.write(json.dumps(payload).encode("utf-8"))</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>            return</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>        self.send_response(404)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>        self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>if __name__ == "__main__":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 24 行 | <code>    port = int(os.getenv("APP_PORT", "8000"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>    server = HTTPServer(("0.0.0.0", port), Handler)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 26 行 | <code>    print(f"starting {SERVICE_NAME} on 0.0.0.0:{port}", flush=True)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 27 行 | <code>    server.serve_forever()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

注意这里监听的是 `0.0.0.0`，不是 `127.0.0.1`。容器里只监听 `127.0.0.1` 时，宿主机通过端口映射访问常常会失败。

### 第 3 步：创建 Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY app.py .

ENV PYTHONUNBUFFERED=1
ENV APP_PORT=8000

EXPOSE 8000

CMD ["python", "app.py"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 5 行 | <code>COPY app.py .</code> | 把宿主机项目文件复制进镜像。 |
| 第 7 行 | <code>ENV PYTHONUNBUFFERED=1</code> | 设置镜像或容器里的环境变量。 |
| 第 8 行 | <code>ENV APP_PORT=8000</code> | 设置镜像或容器里的环境变量。 |
| 第 10 行 | <code>EXPOSE 8000</code> | 声明容器应用监听的端口，方便读者知道服务入口。 |
| 第 12 行 | <code>CMD ["python", "app.py"]</code> | 设置容器启动时默认执行的命令。 |

### 第 4 步：创建 `.dockerignore`

```text
.git
.venv
__pycache__
*.pyc
logs
reports
.env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.git</code> | `.git` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>.venv</code> | `.venv` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>__pycache__</code> | 这一行里的英文要这样读：`pycache__` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>*.pyc</code> | `*.pyc` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>logs</code> | 这一行里的英文要这样读：`logs` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>reports</code> | 这一行里的英文要这样读：`reports` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 7 行 | <code>.env</code> | `.env` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### 第 5 步：构建镜像

```bash
docker build -t aiops-health-demo:0.1 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t aiops-health-demo:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

预期看到：

```text
Successfully tagged aiops-health-demo:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Successfully tagged aiops-health-demo:0.1</code> | `Successfully tagged aiops-health-demo` 是Successfully tagged aiops-health-demo 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `0.1` 是这个字段的示例内容或模板表达式。 |

如果使用 BuildKit，输出格式可能不同，但应该能看到构建步骤完成。

### 第 6 步：运行容器

```bash
docker run -d --name aiops-health \
  -p 8000:8000 \
  -e SERVICE_NAME=health-demo \
  aiops-health-demo:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name aiops-health \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 8000:8000 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -e SERVICE_NAME=health-demo \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  aiops-health-demo:0.1</code> | 执行 `aiops-health-demo:0.1` 相关命令，后面的参数决定它具体操作什么对象。 |

检查容器：

```bash
docker ps
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

预期看到 `aiops-health` 状态为 Up，并且 PORTS 有类似：

```text
0.0.0.0:8000->8000/tcp
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>0.0.0.0:8000-&gt;8000/tcp</code> | 这一行要理解这些英文词：`tcp` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

### 第 7 步：访问服务

```bash
curl localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl localhost:8000/health</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

预期输出：

```json
{"service": "health-demo", "status": "ok"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"service": "health-demo", "status": "ok"}</code> | `service` 是服务名称字段，`health-demo` 是具体服务名，表示这条记录属于这个服务；`status` 是状态字段，`ok` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

### 第 8 步：查看日志

```bash
docker logs aiops-health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker logs aiops-health</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

预期看到：

```text
starting health-demo on 0.0.0.0:8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>starting health-demo on 0.0.0.0:8000</code> | `starting health-demo on 0.0.0.0` 是starting health-demo on 0.0.0.0 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `8000` 是这个字段的示例内容或模板表达式。 |

### 第 9 步：进入容器

```bash
docker exec -it aiops-health sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker exec -it aiops-health sh</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

在容器里：

```sh
pwd
ls -l
env | grep SERVICE_NAME
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pwd</code> | 执行 `pwd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ls -l</code> | 列出文件或目录，用来确认实验文件是否存在。 |
| 第 3 行 | <code>env &#124; grep SERVICE_NAME</code> | 执行 `env` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |

退出：

```sh
exit
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exit</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |

### 第 10 步：清理

```bash
docker stop aiops-health
docker rm aiops-health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker stop aiops-health</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker rm aiops-health</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

如果只是临时运行，也可以一开始用：

```bash
docker run --rm -p 8000:8000 aiops-health-demo:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm -p 8000:8000 aiops-health-demo:0.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

`--rm` 表示容器退出后自动删除容器对象。

## 实验排障

### 构建失败

先看错误在哪一步：

```bash
docker build --progress=plain -t aiops-health-demo:0.1 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build --progress=plain -t aiops-health-demo:0.1 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

检查：

- Dockerfile 是否在当前目录。
- `COPY app.py .` 的源文件是否存在。
- build context 是否正确。
- 基础镜像是否能拉取。

### 容器启动后立刻退出

查看：

```bash
docker ps -a
docker logs aiops-health
docker inspect aiops-health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker ps -a</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker logs aiops-health</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 3 行 | <code>docker inspect aiops-health</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

重点看：

- `STATUS` 是不是 `Exited`。
- 日志里有没有 Python 报错。
- `docker inspect` 的 `State.ExitCode`。

### 访问 `localhost:8000` 失败

检查顺序：

1. `docker ps` 看容器是否 Up。
2. `docker ps` 看 PORTS 是否有 `8000->8000`。
3. `docker logs aiops-health` 看应用是否启动。
4. 确认应用监听 `0.0.0.0`。
5. 确认宿主机没有防火墙或端口冲突。

### 修改代码后没有生效

如果代码已经 COPY 进镜像，修改宿主机文件后要重新构建：

```bash
docker build -t aiops-health-demo:0.2 .
docker run --rm -p 8000:8000 aiops-health-demo:0.2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t aiops-health-demo:0.2 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker run --rm -p 8000:8000 aiops-health-demo:0.2</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

开发阶段也可以用 bind mount：

```bash
docker run --rm -p 8000:8000 \
  -v "$PWD/app.py:/app/app.py:ro" \
  aiops-health-demo:0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm -p 8000:8000 \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -v "$PWD/app.py:/app/app.py:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  aiops-health-demo:0.1</code> | 执行 `aiops-health-demo:0.1` 相关命令，后面的参数决定它具体操作什么对象。 |

## 典型故障排查表

| 现象 | 常见原因 | 检查命令 | 处理方向 |
|---|---|---|---|
| `Cannot connect to the Docker daemon` | Docker daemon 没启动 | `docker version` | 启动 Docker Desktop 或 Docker 服务 |
| 拉镜像失败 | 网络、镜像名、tag、认证问题 | `docker pull IMAGE:TAG` | 检查网络、tag、registry 登录 |
| 容器 Exited | 主进程退出、配置错误 | `docker ps -a`、`docker logs` | 看日志和退出码 |
| 端口访问不了 | 没 `-p`、端口写反、服务监听错 | `docker ps`、`docker logs` | 确认 `host:container` 和 `0.0.0.0` |
| 容器间不能通信 | 不在同一网络、地址写成 localhost | `docker network inspect` | 使用自定义网络和容器名 |
| 数据丢失 | 数据写在容器可写层 | `docker inspect` Mounts | 使用 volume 或 bind mount |
| 磁盘占满 | 镜像、容器、volume、build cache 太多 | `docker system df` | 清理前确认 volume 是否有用 |
| 权限错误 | 容器用户无权限读写挂载路径 | `docker exec`、`ls -l` | 调整用户、目录权限或挂载方式 |
| 镜像很大 | 基础镜像大、复制了无关文件、缓存没清理 | `docker images` | 用 `.dockerignore`、slim、多阶段构建 |
| 配置没生效 | 环境变量没传、挂载路径错 | `docker inspect`、`env` | 检查 `-e`、`--env-file`、Mounts |

## 学习路线

### 第 1 阶段：理解对象

先能说清：

- Docker CLI、Docker daemon、registry 的关系。
- image 和 container 的区别。
- Dockerfile 是什么。
- volume 和 bind mount 的区别。
- bridge 网络和端口映射的区别。

学习证据：写一篇笔记解释 image、container、Dockerfile、volume、network。

### 第 2 阶段：能跑容器

掌握：

- `docker pull`
- `docker run`
- `docker ps`
- `docker logs`
- `docker exec`
- `docker stop`
- `docker rm`

学习证据：用 Docker 跑起 nginx、Redis 或 Prometheus，并记录访问方式。

### 第 3 阶段：能构建镜像

掌握：

- Dockerfile。
- `.dockerignore`。
- `docker build -t`。
- `COPY`、`RUN`、`CMD`、`EXPOSE`。
- 构建缓存。

学习证据：容器化一个 Python 健康检查服务。

### 第 4 阶段：能排障

掌握：

- `docker ps -a`
- `docker logs`
- `docker inspect`
- `docker stats`
- `docker network inspect`
- `docker volume inspect`

学习证据：写一篇“容器端口访问失败排障记录”。

### 第 5 阶段：进入 AIOps 实验环境

继续学习：

- Docker Compose。
- Prometheus + Grafana。
- Loki。
- OpenTelemetry Collector。
- FastAPI 容器化。
- Kubernetes Pod。

学习证据：用 Docker Compose 跑一个完整可观测性实验栈。

## 小白可能会问

### 镜像和容器到底是不是一回事？

不是。镜像是只读模板，容器是镜像运行后的实例。一个镜像可以启动多个容器。容器有自己的进程、网络、可写层和日志。

### 为什么删了容器，数据可能没了？

因为容器默认写入自己的可写层。容器删除后，这个可写层通常也被删除。需要长期保留的数据应该放到 volume 或 bind mount。

### 容器里的 `localhost` 是谁？

容器里的 `localhost` 是容器自己。宿主机的 `localhost` 是宿主机自己。另一个容器的 `localhost` 是另一个容器自己。容器间访问通常使用自定义网络里的容器名。

### 为什么服务要监听 `0.0.0.0`？

监听 `127.0.0.1` 只接受本网络命名空间里的本地访问。容器应用如果只监听 `127.0.0.1`，宿主机通过 `-p` 转发进来时可能访问不到。监听 `0.0.0.0` 表示接受该容器网络接口上的连接。

### `RUN` 和 `CMD` 有什么区别？

`RUN` 在构建镜像时执行，结果写入镜像层。`CMD` 是容器启动时默认执行的命令。安装依赖用 `RUN`，启动服务用 `CMD`。

### `-v` 和 `--mount` 有什么区别？

两者都能挂载 volume 或 bind mount。`--mount` 写法更结构化，字段更明确，适合严肃脚本和文档。`-v` 更短，学习和临时命令常见。

示例：

```bash
docker run --mount type=volume,source=prometheus-data,target=/prometheus prom/prometheus:v2.55.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --mount type=volume,source=prometheus-data,target=/prometheus prom/prometheus:v2.55.0</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### Docker 和 Kubernetes 什么关系？

Docker 负责构建镜像和运行容器的单机能力。Kubernetes 负责在集群里编排容器，包括调度、服务发现、滚动发布、健康检查、自动恢复等。学 Kubernetes 前，必须先理解镜像、容器、端口、挂载、日志和资源限制。

## 面试怎么讲

Docker 主要解决应用运行环境一致性和分发问题。它通过 Dockerfile 把应用和依赖构建成镜像，通过 registry 分发镜像，再由 Docker Engine 创建容器运行。容器不是虚拟机，它共享宿主机内核，依赖 namespaces 做隔离，依赖 cgroups 做资源限制，镜像使用分层文件系统复用和缓存。实际排障时我会先看 `docker ps -a`、`docker logs`、`docker inspect`，再检查端口映射、应用监听地址、环境变量、挂载和网络。在 AIOps 中，我会用 Docker 快速搭建 Prometheus、Grafana、Redis、MySQL 等实验组件，也会把 Python 自动化服务或异常检测 API 打包成镜像。

## 面试题

1. Docker 解决了什么问题？
2. Docker CLI、Docker API、Docker daemon 分别负责什么？
3. 镜像和容器有什么区别？
4. 容器和虚拟机有什么区别？
5. namespaces 和 cgroups 分别解决什么问题？
6. Docker 镜像为什么是分层的？
7. 容器可写层为什么不适合保存数据库数据？
8. Dockerfile 中 `FROM`、`RUN`、`COPY`、`CMD` 分别做什么？
9. `RUN` 和 `CMD` 的区别是什么？
10. `CMD` 和 `ENTRYPOINT` 的区别是什么？
11. build context 是什么？为什么需要 `.dockerignore`？
12. `docker build -t demo:0.1 .` 最后的 `.` 是什么意思？
13. `-p 8080:80` 左右两边分别是什么？
14. `EXPOSE` 和 `-p` 有什么区别？
15. 容器里的 `localhost` 指谁？
16. volume、bind mount、tmpfs 有什么区别？
17. 如何排查容器启动后马上退出？
18. 如何排查容器端口访问不了？
19. 如何查看容器资源使用情况？
20. Docker 在 AIOps 实验环境中有什么作用？

## 学习检查清单

- [ ] 我能画出 Docker CLI、daemon、registry、image、container 的关系。
- [ ] 我能解释容器和虚拟机的区别。
- [ ] 我能解释 namespaces、cgroups、分层文件系统的大概作用。
- [ ] 我能解释 image、container、Dockerfile、registry、volume、network。
- [ ] 我能写一个最小 Dockerfile。
- [ ] 我能解释 `FROM`、`WORKDIR`、`COPY`、`RUN`、`CMD`、`EXPOSE`。
- [ ] 我能用 `.dockerignore` 控制 build context。
- [ ] 我能用 `docker build -t` 构建镜像。
- [ ] 我能用 `docker run -d --name -p -e` 启动容器。
- [ ] 我能解释 `-p host_port:container_port`。
- [ ] 我能解释为什么服务应监听 `0.0.0.0`。
- [ ] 我能用 volume 持久化数据。
- [ ] 我能用 bind mount 挂载配置文件。
- [ ] 我能创建自定义 bridge 网络并让容器用名字通信。
- [ ] 我能用 `docker logs`、`docker inspect`、`docker exec` 排障。
- [ ] 我能用 `docker stats` 看容器资源。
- [ ] 我能说明 Docker 在 Prometheus、Grafana、FastAPI demo 中的作用。

## 学习证据

学完这一篇，建议把下面内容提交到 GitHub：

- 一个 `Dockerfile`。
- 一个 `.dockerignore`。
- 一个 `app.py` 健康检查服务。
- 一个 `README.md`，写清楚 build、run、curl、logs、cleanup 命令。
- 一篇排障记录：为什么容器端口映射后仍然访问不了。

README 至少包含：

```markdown
# AIOps Docker Health Demo

## Build

docker build -t aiops-health-demo:0.1 .

## Run

docker run -d --name aiops-health -p 8000:8000 -e SERVICE_NAME=health-demo aiops-health-demo:0.1

## Check

curl localhost:8000/health
docker logs aiops-health

## Debug

docker ps -a
docker inspect aiops-health
docker exec -it aiops-health sh

## Cleanup

docker stop aiops-health
docker rm aiops-health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># AIOps Docker Health Demo</code> | 这一行里的英文要这样读：`AIOps Docker Health Demo` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>## Build</code> | 这一行里的英文要这样读：`Build` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 5 行 | <code>docker build -t aiops-health-demo:0.1 .</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 7 行 | <code>## Run</code> | 这一行里的英文要这样读：`Run` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 9 行 | <code>docker run -d --name aiops-health -p 8000:8000 -e SERVICE_NAME=health-demo aiops-health-demo:0.1</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 11 行 | <code>## Check</code> | 这一行里的英文要这样读：`Check` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 13 行 | <code>curl localhost:8000/health</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 14 行 | <code>docker logs aiops-health</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 16 行 | <code>## Debug</code> | 这一行里的英文要这样读：`Debug` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 18 行 | <code>docker ps -a</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 19 行 | <code>docker inspect aiops-health</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 20 行 | <code>docker exec -it aiops-health sh</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 22 行 | <code>## Cleanup</code> | 这一行里的英文要这样读：`Cleanup` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 24 行 | <code>docker stop aiops-health</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 25 行 | <code>docker rm aiops-health</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |

如果你能解释这个 demo 从 Dockerfile 到镜像、从镜像到容器、从容器端口到宿主机访问、从日志到排障的完整链路，就说明你已经不是只会背 Docker 命令，而是真的理解了 Docker 的核心知识点。
