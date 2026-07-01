# Helm

> 目标：能理解 Helm Chart、values、release，能安装、升级、回滚 Kubernetes 应用。

## 官方资料

- [Helm documentation](https://helm.sh/docs/)
- [Helm charts](https://helm.sh/docs/topics/charts/)
- [Using Helm](https://helm.sh/docs/intro/using_helm/)
- [helm upgrade](https://helm.sh/docs/helm/helm_upgrade/)

说明：本文是基于 Helm 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Helm 是 Kubernetes 的包管理器。它把一组 Kubernetes YAML 模板、默认值和元数据打包成 Chart，并用 release 管理安装后的实例。

## 核心原理

Helm 把模板和 values 合并，渲染成 Kubernetes 资源清单，然后提交给 Kubernetes API。

```text
Chart templates
  + values.yaml
  + command line --set
  -> helm template/render
  -> Kubernetes manifests
  -> helm install/upgrade
  -> release
```

## 架构和概念

- Chart：一个应用包。
- Release：Chart 安装后的实例。
- Repository：Chart 仓库。
- values.yaml：默认配置。
- templates：Kubernetes YAML 模板。
- Chart.yaml：Chart 元数据。

典型目录：

```text
demo-chart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
```

## 安装检查

```bash
helm version
helm repo list
```

## 常用命令

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx
helm install demo bitnami/nginx
helm list
helm status demo
helm get values demo
helm upgrade demo bitnami/nginx -f values.yaml
helm rollback demo 1
helm uninstall demo
```

## 创建 Chart

```bash
helm create demo-chart
```

渲染模板但不安装：

```bash
helm template demo ./demo-chart
```

检查语法：

```bash
helm lint ./demo-chart
```

## values.yaml

values 是 Helm 学习重点，因为它决定模板渲染结果。

示例：

```yaml
replicaCount: 2

image:
  repository: nginx
  tag: "1.27"

service:
  type: ClusterIP
  port: 80
```

模板引用：

```yaml
replicas: {{ .Values.replicaCount }}
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

## 安装、升级、回滚

安装：

```bash
helm install demo ./demo-chart -f values.yaml
```

升级：

```bash
helm upgrade demo ./demo-chart -f values-prod.yaml
```

回滚：

```bash
helm history demo
helm rollback demo 1
```

## 在 AIOps 中的作用

- 安装 Prometheus、Grafana、Loki、OpenTelemetry Collector。
- 管理实验环境。
- 学习生产里“配置驱动部署”的方式。
- Chart values 是变更记录的重要来源。

## 入门实验

1. `helm create demo-chart`
2. 修改 `values.yaml` 的镜像和副本数。
3. `helm template` 查看渲染结果。
4. 安装到本地 Kubernetes。
5. 升级副本数。
6. 回滚到上一版本。

## 排障清单

### 安装失败

- `helm lint` 检查模板。
- `helm template` 查看实际 YAML。
- `kubectl describe` 查看资源事件。

### values 不生效

- 检查 values 路径。
- 检查模板是否引用了该值。
- `helm get values <release>` 查看实际值。

### 升级后异常

- `helm history` 查看版本。
- `helm rollback` 回滚。
- 对比两次 values。

## 学习证据

- 一个自定义 Chart。
- 一份 values-dev.yaml。
- 一份 values-prod.yaml。
- 一篇记录：Helm install、upgrade、rollback 分别做什么。
