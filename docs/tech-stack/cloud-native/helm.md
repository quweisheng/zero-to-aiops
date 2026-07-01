# Helm

> 目标：能理解 Helm Chart、values、release，能安装、升级、回滚 Kubernetes 应用。

## 官方资料

- [Helm documentation](https://helm.sh/docs/)
- [Helm charts](https://helm.sh/docs/topics/charts/)
- [Using Helm](https://helm.sh/docs/intro/using_helm/)
- [helm upgrade](https://helm.sh/docs/helm/helm_upgrade/)

说明：本文是基于 Helm 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

Kubernetes YAML 多了以后，手工复制和修改很容易出错。Helm 把一组 YAML 模板、配置值和版本记录打包成 Chart，让应用安装、升级、回滚更像“包管理”。

在 AIOps 学习里，很多可观测性组件都常用 Helm 安装，比如 kube-prometheus-stack、Grafana、Loki、OpenTelemetry Collector。掌握 Helm，能让你更接近真实生产环境的部署方式。

## 是什么

Helm 是 Kubernetes 的包管理器。它把一组 Kubernetes YAML 模板、默认值和元数据打包成 Chart，并用 release 管理安装后的实例。

## 它解决什么问题

- 管理一组相关 Kubernetes YAML。
- 用 values 区分 dev、test、prod 配置。
- 支持安装、升级、回滚和卸载。
- 复用社区 Chart 快速搭建实验环境。
- 把部署配置纳入 Git 版本控制。
- 记录 release 历史，方便变更追踪。

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

## 学习检查清单

- [ ] 我能解释 Chart、Release、Repository、values 的关系。
- [ ] 我能用 `helm repo add/update/search` 查找 Chart。
- [ ] 我能用 `helm install` 安装应用。
- [ ] 我能用 `helm template` 查看渲染后的 YAML。
- [ ] 我能用 `helm lint` 检查 Chart。
- [ ] 我能用 values 文件覆盖默认配置。
- [ ] 我能用 `helm upgrade` 和 `helm rollback` 管理版本。
- [ ] 我能把自定义 Chart 和 values 文件提交到 GitHub。

## 面试题

1. Helm 解决了 Kubernetes YAML 管理中的什么问题？
2. Chart 和 Release 有什么区别？
3. `values.yaml` 的作用是什么？
4. `helm template` 为什么适合排障？
5. `helm install` 和 `helm upgrade` 有什么区别？
6. 升级失败后如何回滚？
7. 为什么生产环境 values 文件要纳入版本控制？
8. Helm 和 Kustomize 的思路有什么不同？
9. 安装 kube-prometheus-stack 这类组件为什么常用 Helm？
10. Helm release 历史如何帮助 AIOps 做变更关联？

## 学习证据

- 一个自定义 Chart。
- 一份 values-dev.yaml。
- 一份 values-prod.yaml。
- 一篇记录：Helm install、upgrade、rollback 分别做什么。
