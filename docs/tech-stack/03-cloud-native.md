# 03：云原生技术栈

云原生不是一个单独工具，而是一套围绕容器、自动调度、弹性伸缩、声明式配置和服务治理的工程体系。AIOps 很多场景都发生在云原生环境里：Pod 异常、服务延迟、发布失败、节点资源不足、Ingress 故障、HPA 扩缩容不符合预期。

## Docker

### 是什么

Docker 是开发、打包、分发、运行应用的平台。它把应用及其依赖打包成镜像，再用容器运行。

### 原理

Docker 使用 client-server 架构。`docker` 命令是客户端，`dockerd` 是守护进程。客户端把构建、运行、停止等请求发给 daemon，daemon 管理镜像、容器、网络和卷。

容器隔离主要依赖 Linux 内核能力：

- namespaces：隔离进程、网络、挂载点、用户等视图。
- cgroups：限制和统计 CPU、内存、IO 等资源。
- union filesystem：镜像分层，减少重复存储。

### 架构

```text
docker client
  -> Docker API
  -> dockerd
  -> images / containers / networks / volumes
  -> registry: Docker Hub or private registry
```

核心对象：

- Image：只读模板，包含运行应用需要的文件和指令。
- Container：镜像的运行实例。
- Dockerfile：构建镜像的步骤描述。
- Registry：镜像仓库。
- Volume：持久化数据。
- Network：容器网络。

### 在 AIOps 中的作用

- 把监控组件、demo 服务、数据处理脚本容器化。
- 用统一环境复现实验，减少“我电脑能跑”的问题。
- 为 Kubernetes 学习打基础。
- 采集容器指标，理解容器资源限制和异常。

### 配置重点

最小 `Dockerfile`：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

常用命令：

```bash
docker build -t demo-app:0.1 .
docker run --rm -p 8000:8000 demo-app:0.1
docker ps
docker logs <container>
docker exec -it <container> sh
docker inspect <container>
```

### 入门练习

把一个 Python HTTP 服务打成镜像，运行后通过 `curl localhost:8000/health` 检查健康状态。

### 学习证据

- `Dockerfile`
- `README.md` 里的构建和运行命令
- 一篇记录：镜像和容器有什么区别？

### 官方资料

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)

## Docker Compose

### 是什么

Docker Compose 是定义和运行多容器应用的工具。它用 `compose.yaml` 描述多个服务、网络、卷和环境变量。

### 原理

Compose 读取 YAML 文件，按服务定义创建容器、网络和卷。多个服务可以通过服务名互相访问。

### 架构

```text
compose.yaml
  -> docker compose
  -> service containers
  -> shared network
  -> volumes
```

### 在 AIOps 中的作用

- 快速启动 Prometheus + Grafana + demo app。
- 为可观测性实验室提供本地运行环境。
- 方便把项目交给别人复现。

### 配置重点

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

常用命令：

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

### 入门练习

用 Compose 启动 demo app 和 Prometheus，让 Prometheus 抓取 demo app 的指标。

## Kubernetes

### 是什么

Kubernetes 是容器编排平台，用来自动化部署、扩缩容、服务发现、滚动发布和自愈。

### 原理

Kubernetes 使用声明式 API。你提交期望状态，例如“我要 3 个副本”，控制器持续观察实际状态并把它调到期望状态。

### 架构

```text
kubectl / API clients
  -> kube-apiserver
  -> etcd
  -> controllers / scheduler
  -> kubelet on nodes
  -> container runtime
  -> Pods
```

控制平面：

- kube-apiserver：Kubernetes API 入口。
- etcd：保存集群状态。
- kube-scheduler：把 Pod 调度到节点。
- kube-controller-manager：运行各种控制器。

节点组件：

- kubelet：节点代理，确保 Pod 按期望运行。
- kube-proxy：服务网络转发。
- container runtime：运行容器。

核心对象：

- Pod：最小调度单元。
- Deployment：管理无状态应用副本和滚动更新。
- Service：给 Pod 提供稳定访问入口。
- ConfigMap：配置。
- Secret：敏感配置。
- Ingress：HTTP/HTTPS 入口。
- Namespace：资源隔离。
- HPA：自动水平扩缩容。

### 在 AIOps 中的作用

- 大量现代运维岗位要求能看懂 K8s 资源。
- AIOps 需要分析 Pod 重启、调度失败、节点压力、服务不可达等事件。
- 可观测性和告警会按 namespace、pod、deployment、node 等维度聚合。
- 自动化处理动作需要理解 K8s API 的风险边界。

### 配置重点

最小 Deployment：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
        - name: demo-app
          image: demo-app:0.1
          ports:
            - containerPort: 8000
```

最小 Service：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-app
spec:
  selector:
    app: demo-app
  ports:
    - port: 80
      targetPort: 8000
```

常用命令：

```bash
kubectl get pods
kubectl get deploy
kubectl describe pod <pod>
kubectl logs <pod>
kubectl apply -f k8s.yaml
kubectl rollout status deploy/demo-app
kubectl rollout undo deploy/demo-app
```

### 入门练习

把 demo app 部署到本地 Kubernetes，例如 Docker Desktop Kubernetes、kind 或 minikube。制造一次镜像错误，观察 Pod 状态和事件。

### 学习证据

- `k8s/deployment.yaml`
- `k8s/service.yaml`
- 一篇记录：Pod 为什么会 `CrashLoopBackOff`？

### 官方资料

- [Kubernetes overview](https://kubernetes.io/docs/concepts/overview/)
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Kubernetes workloads](https://kubernetes.io/docs/concepts/workloads/)

## Helm

### 是什么

Helm 是 Kubernetes 的包管理器。它把一组 Kubernetes YAML 模板、默认值和元数据打包成 Chart。

### 原理

Helm Chart 使用模板和 `values.yaml` 生成最终的 Kubernetes 资源清单。安装时 Helm 创建 release，升级时维护 release 历史。

### 架构

```text
Chart
  -> templates/*.yaml
  -> values.yaml
  -> helm install / upgrade
  -> Kubernetes resources
  -> release history
```

Chart 常见目录：

```text
my-chart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
```

### 在 AIOps 中的作用

- 安装 Prometheus、Grafana、Loki、OpenTelemetry Collector 等组件。
- 统一管理实验环境配置。
- 学习生产化部署方式。

### 配置重点

常用命令：

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install my-release grafana/grafana
helm upgrade my-release grafana/grafana -f values.yaml
helm uninstall my-release
```

`values.yaml` 是学习 Helm 的核心，因为它决定模板渲染结果。

### 入门练习

用 Helm 安装 Grafana，然后修改 `values.yaml` 配置 service 类型或管理员密码。

### 官方资料

- [Helm charts](https://helm.sh/docs/topics/charts/)

## NGINX / Ingress

### 是什么

NGINX 是常见 Web 服务器、反向代理和负载均衡器。在 Kubernetes 里，Ingress Controller 常用于把外部 HTTP/HTTPS 流量转发到 Service。

### 原理

反向代理接收客户端请求，再把请求转发给后端服务。负载均衡会按策略在多个后端实例之间分配流量。

### 架构

传统反向代理：

```text
Client
  -> NGINX
  -> upstream app servers
```

Kubernetes Ingress：

```text
Client
  -> Load Balancer
  -> Ingress Controller
  -> Service
  -> Pods
```

### 在 AIOps 中的作用

- 很多“接口慢、网站打不开、502/504”都和代理、上游服务、超时配置有关。
- NGINX 访问日志是分析 QPS、状态码、延迟的重要数据源。
- Ingress 事件和配置错误是 K8s 排障常见入口。

### 配置重点

NGINX 反向代理示例：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 3s;
        proxy_read_timeout 30s;
    }
}

upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
}
```

Kubernetes Ingress 示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-app
spec:
  rules:
    - host: demo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-app
                port:
                  number: 80
```

### 入门练习

让 NGINX 代理一个本地 demo 服务，观察访问日志里的状态码、请求时间和上游地址。

### 官方资料

- [NGINX reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
