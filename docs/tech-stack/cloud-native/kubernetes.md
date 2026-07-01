# Kubernetes

> 目标：能理解 Kubernetes 的控制平面、节点组件和核心资源对象，能部署一个服务、查看 Pod 状态、排查常见异常。

## 官方资料

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Kubernetes overview](https://kubernetes.io/docs/concepts/overview/)
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Workloads](https://kubernetes.io/docs/concepts/workloads/)
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)

说明：本文是基于 Kubernetes 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Kubernetes 是容器编排平台，用来自动化部署、扩缩容、服务发现、滚动发布、自愈和配置管理。它解决的问题是：当服务变多、实例变多、机器变多时，如何用声明式方式管理它们。

## 核心原理

Kubernetes 的核心思想是“期望状态”和“控制循环”。

你提交一个期望状态，例如“运行 3 个副本”。Kubernetes 控制器不断观察实际状态，如果实际只有 2 个副本，就创建新的 Pod，让系统回到期望状态。

```text
YAML desired state
  -> kube-apiserver
  -> stored in etcd
  -> controllers watch state
  -> scheduler chooses nodes
  -> kubelet starts Pods
  -> actual state converges
```

## 架构

### 控制平面

- kube-apiserver：集群 API 入口。
- etcd：保存集群状态。
- kube-scheduler：为 Pod 选择节点。
- kube-controller-manager：运行控制器。
- cloud-controller-manager：对接云厂商能力。

### 节点组件

- kubelet：节点代理，确保 Pod 按期望运行。
- kube-proxy：实现 Service 网络规则。
- container runtime：运行容器，例如 containerd。

```text
kubectl
  -> kube-apiserver
  -> etcd
  -> scheduler / controllers
  -> kubelet on worker nodes
  -> container runtime
  -> Pods
```

## 核心资源对象

### Pod

Pod 是 Kubernetes 最小调度单元。一个 Pod 可以包含一个或多个容器，共享网络和存储。

### Deployment

Deployment 管理无状态应用，负责副本数、滚动更新和回滚。

### ReplicaSet

ReplicaSet 保证指定数量的 Pod 副本运行。通常由 Deployment 自动管理。

### Service

Service 给一组 Pod 提供稳定访问入口。Pod 会变，Service 名称和虚拟 IP 稳定。

### ConfigMap

ConfigMap 保存非敏感配置。

### Secret

Secret 保存密码、token、证书等敏感数据。

### Namespace

Namespace 用来做资源隔离。

### Ingress

Ingress 管理 HTTP/HTTPS 外部访问规则。

## 安装选择

零基础建议本地选一种：

- Docker Desktop Kubernetes：适合 Windows 桌面。
- kind：用 Docker 容器模拟 Kubernetes 节点。
- minikube：适合本地单节点学习。

检查：

```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## 最小 Deployment

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
          image: nginx:1.27
          ports:
            - containerPort: 80
```

应用：

```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl get deploy
```

## 最小 Service

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
      targetPort: 80
```

访问：

```bash
kubectl apply -f service.yaml
kubectl port-forward svc/demo-app 8080:80
curl http://localhost:8080
```

## 常用命令

```bash
kubectl get pods -A
kubectl get deploy
kubectl get svc
kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs -f <pod>
kubectl exec -it <pod> -- sh
kubectl rollout status deploy/demo-app
kubectl rollout history deploy/demo-app
kubectl rollout undo deploy/demo-app
kubectl delete -f deployment.yaml
```

## 配置重点

### 资源请求和限制

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### 健康检查

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 环境变量

```yaml
env:
  - name: APP_ENV
    value: "dev"
```

## 在 AIOps 中的作用

- Pod 重启、调度失败、节点压力是常见告警来源。
- Kubernetes 事件是根因分析的重要线索。
- Deployment 发布记录可用于变更关联。
- Service/Ingress 问题会导致接口不可达。
- HPA 扩缩容数据可用于容量分析。

## 入门实验

1. 部署 nginx Deployment。
2. 创建 Service。
3. 使用 port-forward 访问。
4. 修改镜像为不存在的版本，观察 `ImagePullBackOff`。
5. 用 `kubectl describe pod` 找事件。
6. 写学习记录：Pod 为什么没起来？

## 排障清单

### Pod Pending

- 节点资源是否不足。
- PVC 是否未绑定。
- nodeSelector / affinity 是否过窄。

### CrashLoopBackOff

- 查看容器日志。
- 查看启动命令。
- 检查配置和环境变量。
- 检查健康检查是否过严。

### ImagePullBackOff

- 镜像名是否正确。
- tag 是否存在。
- 私有仓库 Secret 是否配置。
- 网络是否能访问 registry。

### Service 访问不到

- selector 是否匹配 Pod label。
- targetPort 是否正确。
- Pod 是否 Ready。

## 学习证据

- `k8s/deployment.yaml`
- `k8s/service.yaml`
- 一篇记录：`CrashLoopBackOff`、`ImagePullBackOff`、`Pending` 的区别
- 一张 Kubernetes 资源关系图
