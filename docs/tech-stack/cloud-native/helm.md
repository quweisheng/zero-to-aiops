# Helm

> 目标：能理解 Helm 为什么被称为 Kubernetes 的包管理器，能讲清 Chart、Release、Values、Template、Repository、Revision、Upgrade、Rollback 的关系，能写一个最小 Chart，能用 `helm template/lint/install/upgrade/rollback/get/status/history` 排查安装失败、values 不生效、升级后异常。

## 官方资料

- [Helm documentation](https://helm.sh/docs/)
- [Using Helm](https://helm.sh/docs/intro/using_helm/)
- [Helm Commands](https://helm.sh/docs/helm/)
- [Charts](https://helm.sh/docs/topics/charts/)
- [Chart Template Guide](https://helm.sh/docs/chart_template_guide/)
- [Built-in Objects](https://helm.sh/docs/chart_template_guide/builtin_objects/)
- [Values Files](https://helm.sh/docs/chart_template_guide/values_files/)
- [Template Functions and Pipelines](https://helm.sh/docs/chart_template_guide/functions_and_pipelines/)
- [Template Function List](https://helm.sh/docs/chart_template_guide/function_list/)
- [Flow Control](https://helm.sh/docs/chart_template_guide/control_structures/)
- [Named Templates](https://helm.sh/docs/chart_template_guide/named_templates/)
- [Chart Hooks](https://helm.sh/docs/topics/charts_hooks/)
- [Helm install](https://helm.sh/docs/helm/helm_install/)
- [Helm upgrade](https://helm.sh/docs/helm/helm_upgrade/)
- [Helm rollback](https://helm.sh/docs/helm/helm_rollback/)
- [Helm lint](https://helm.sh/docs/helm/helm_lint/)
- [Helm dependency](https://helm.sh/docs/helm/helm_dependency/)

说明：本文是基于 Helm 官方文档整理的原创中文教程，不复制官方全文。Helm 版本会演进，部分官方页面会同时提示 Helm 3/4 差异；真实环境请先执行 `helm version`，再以当前版本官方文档为准。

## 场景开场

你已经会写 Kubernetes YAML：

```text
deployment.yaml
service.yaml
configmap.yaml
ingress.yaml
```

一开始这很好。但项目稍微复杂一点，问题就来了：

- dev、staging、prod 三套环境只有镜像 tag、副本数、域名不同，要复制三份 YAML 吗？
- 每次发布都要 `kubectl apply` 一堆文件，怎么知道这次发布改了什么？
- 安装 Prometheus、Grafana、Ingress Controller 这种复杂组件，难道手写几千行 YAML？
- 升级失败后怎么回滚到上一个版本？
- values 改了但没生效，怎么知道 Helm 最终渲染出来的 Kubernetes YAML 是什么？
- Chart 依赖另一个 Chart，依赖版本怎么锁定？
- 安装前要跑数据库迁移 Job，怎么挂到生命周期里？

Helm 解决的就是“把一组 Kubernetes YAML 做成可配置、可安装、可升级、可回滚的软件包”。

## 一句话人话版

Helm 是 Kubernetes 的包管理器：Chart 是应用包，values 是配置输入，template 把 values 渲染成 Kubernetes YAML，install/upgrade 会把渲染结果提交到集群并记录成 release，release 有 revision，所以可以查看历史和回滚。

## 学习边界

入门 Helm 先抓住这条主线：

```text
Chart
  -> Chart.yaml 描述包
  -> values.yaml 提供默认配置
  -> templates/ 放 Kubernetes YAML 模板
  -> helm template 本地渲染
  -> helm install 安装成 release
  -> helm upgrade 生成新 revision
  -> helm rollback 回到旧 revision 的配置
```

第一阶段必须掌握：

- Chart、Release、Revision、Repository 的区别。
- Chart 目录结构。
- `Chart.yaml`、`values.yaml`、`templates/`、`_helpers.tpl`。
- `.Values`、`.Release`、`.Chart`、`.Capabilities`。
- `helm template`、`helm lint`、`helm install --dry-run --debug`。
- `helm install`、`helm upgrade --install`、`helm rollback`。
- values 覆盖优先级。
- 常用模板函数：`default`、`quote`、`toYaml`、`nindent`、`include`、`required`。
- 命名模板和 helper。
- hooks、dependencies、NOTES.txt 的基本作用。
- 安装失败、模板渲染失败、values 不生效、升级异常怎么排查。

暂时可以先不深挖：

- Helm 插件开发。
- OCI registry 细节。
- Chart provenance 和签名全流程。
- Library chart 复杂设计。
- 大型平台级 chart 的抽象治理。
- Operator 和 Helm 的混合生命周期边界。

## 官方知识地图

Helm 官方文档可以按这些模块读：

```text
Intro
  -> Helm 是什么
  -> 安装 Helm
  -> Using Helm
  -> Cheat Sheet

Topics
  -> Charts
  -> Chart Hooks
  -> Chart Repository
  -> Registries
  -> Plugins
  -> Provenance and Integrity

Chart Template Guide
  -> Getting Started
  -> Built-in Objects
  -> Values Files
  -> Functions and Pipelines
  -> Flow Control
  -> Variables
  -> Named Templates
  -> Files
  -> NOTES.txt
  -> Subcharts and Global Values
  -> Debugging Templates
  -> YAML Techniques

Helm Commands
  -> helm create
  -> helm lint
  -> helm template
  -> helm install
  -> helm upgrade
  -> helm rollback
  -> helm status
  -> helm history
  -> helm get
  -> helm uninstall
  -> helm repo
  -> helm dependency
  -> helm package
  -> helm show
```

新手学习顺序建议：

```text
先学 Chart 是什么
  -> 再学 values 怎么传入
  -> 再学 template 怎么渲染
  -> 再学 release 怎么安装和升级
  -> 最后学 dependency、hook、repository
```

不要一开始就沉迷 Go template 语法。Helm 的核心问题是：如何把 Kubernetes 对象变成可重复发布的软件包。

## Helm 在 AIOps 链路中的位置

Kubernetes 管运行状态，Helm 管“安装和发布状态”。

```text
Git 仓库
  -> Helm Chart
  -> values-dev.yaml / values-prod.yaml
  -> CI/CD
  -> helm lint
  -> helm template
  -> helm upgrade --install
  -> Kubernetes Deployment / Service / ConfigMap / Ingress
  -> Prometheus / Grafana / Alertmanager 观测
```

Helm 给 AIOps 提供的证据：

| 证据 | 命令 | 用途 |
|---|---|---|
| 当前 release 状态 | `helm status` | 判断安装/升级是否成功 |
| 发布历史 | `helm history` | 找到哪次 revision 引入问题 |
| 当前 values | `helm get values` | 判断配置是否符合预期 |
| 渲染后的 manifest | `helm get manifest` | 看最终提交给 Kubernetes 的 YAML |
| 安装说明 | `helm get notes` | 看 Chart 输出的使用说明 |
| 回滚动作 | `helm rollback` | 快速恢复上一版本 |
| 模板渲染 | `helm template` | 在进集群前发现 YAML 问题 |

AIOps runbook 里，Helm 排障常和 Kubernetes 排障连用：

```bash
helm status aiops-api -n aiops
helm history aiops-api -n aiops
helm get values aiops-api -n aiops
helm get manifest aiops-api -n aiops
kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-api
kubectl get events -n aiops --sort-by=.lastTimestamp
```

## Helm 是什么

Helm 是 Kubernetes 的包管理器。它把一组 Kubernetes manifests 组织成 Chart，并支持通过 values 参数化，最后安装到集群成为 release。

三个核心名词：

| 名词 | 含义 |
|---|---|
| Chart | 一个应用包，包含模板、默认值、元数据 |
| Release | Chart 安装到集群后的实例 |
| Revision | Release 每次 install/upgrade/rollback 形成的历史版本 |

类比：

```text
Chart 像安装包
values 像安装参数
Release 像一次安装出来的应用实例
Revision 像这个应用实例的发布历史
```

同一个 Chart 可以安装多次，生成多个 release：

```bash
helm install api-dev ./aiops-api -n dev
helm install api-prod ./aiops-api -n prod
```

它们使用同一个 Chart，但 release 名、namespace、values 可以不同。

## Helm 和 kubectl 的区别

`kubectl` 直接操作 Kubernetes 对象。

```bash
kubectl apply -f deployment.yaml
```

Helm 先渲染 Chart，再操作 Kubernetes 对象，并记录 release 历史。

```bash
helm upgrade --install aiops-api ./chart -n aiops -f values-prod.yaml
```

区别：

| 维度 | kubectl | Helm |
|---|---|---|
| 输入 | YAML manifest | Chart + values |
| 参数化 | 自己用脚本/Kustomize/模板 | 内置 values 和 template |
| 发布记录 | Kubernetes 对象自身 | release history |
| 回滚 | 依赖 Deployment rollout 或手工 YAML | `helm rollback` |
| 复杂应用安装 | 手工管理多个文件 | Chart 包 |
| 适合 | 直接调试、简单对象 | 可复用应用包和发布 |

Helm 不是 kubectl 的替代品。Helm 管发布包，kubectl 管 Kubernetes 对象现场。排障时两个都要会。

## Helm 工作流程

一次 install 大致流程：

```text
helm install aiops-api ./chart -f values-prod.yaml
  -> 读取 Chart.yaml
  -> 读取 values.yaml
  -> 合并用户 values
  -> 渲染 templates/
  -> 生成 Kubernetes manifests
  -> 发送给 kube-apiserver
  -> 创建 Deployment / Service / ConfigMap ...
  -> 记录 release revision 1
```

一次 upgrade：

```text
helm upgrade aiops-api ./chart -f values-prod.yaml
  -> 重新合并 values
  -> 重新渲染 manifests
  -> 对比并更新 Kubernetes 对象
  -> 记录 release revision 2
```

一次 rollback：

```text
helm rollback aiops-api 1
  -> 找到 revision 1 的配置和 manifest
  -> 应用回集群
  -> 产生新的 revision
```

注意：回滚到 revision 1 后，release 的最新 revision 不是 1，而是一个新的数字。这是正常的 release history 语义。

## Chart 目录结构

一个 Chart 常见结构：

```text
aiops-api/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
    _helpers.tpl
    NOTES.txt
  charts/
  crds/
  templates/tests/
  .helmignore
```

字段解释：

| 路径 | 作用 |
|---|---|
| `Chart.yaml` | Chart 元数据，名字、版本、依赖等 |
| `values.yaml` | 默认配置值 |
| `templates/` | Kubernetes YAML 模板 |
| `templates/_helpers.tpl` | 命名模板/helper |
| `templates/NOTES.txt` | 安装后输出说明 |
| `charts/` | 打包进来的子 chart 依赖 |
| `crds/` | CRD 文件 |
| `templates/tests/` | Helm test 使用的资源 |
| `.helmignore` | 打包时忽略文件 |

创建脚手架：

```bash
helm create aiops-api
```

脚手架适合学习，但生产 Chart 要清理不需要的模板，避免生成一堆你不理解的资源。

## Chart.yaml

`Chart.yaml` 描述 Chart 本身。

示例：

```yaml
apiVersion: v2
name: aiops-api
description: A Helm chart for the AIOps demo API
type: application
version: 0.1.0
appVersion: "1.0.0"
```

字段解释：

| 字段 | 含义 |
|---|---|
| `apiVersion` | Chart API 版本，Helm 3 常用 v2 |
| `name` | Chart 名称 |
| `description` | 描述 |
| `type` | `application` 或 `library` |
| `version` | Chart 包版本 |
| `appVersion` | 应用版本，通常对应镜像或业务版本 |
| `dependencies` | Chart 依赖 |

`version` 和 `appVersion` 不一样：

| 字段 | 谁的版本 | 例子 |
|---|---|---|
| `version` | Chart 自己 | `0.1.0` |
| `appVersion` | 应用 | `1.0.0` |

Chart 改模板、values schema、依赖，应该更新 `version`。应用镜像 tag 变化，通常更新 `appVersion` 或 values 中的 image tag。

## values.yaml

`values.yaml` 是默认配置输入。

示例：

```yaml
replicaCount: 2

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

模板里用：

```yaml
replicas: {{ .Values.replicaCount }}
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

好 values 设计应该：

- 有合理默认值。
- 命名清晰。
- 和 Kubernetes 概念对应。
- 不把所有 YAML 字段都暴露成 values。
- 不把敏感真实值提交进 Git。

## values 覆盖优先级

Helm values 可以来自多个地方。

常见来源：

```text
Chart 内 values.yaml
  -> 父 Chart values
  -> helm install/upgrade -f my-values.yaml
  -> --set key=value
  -> --set-string key=value
  -> --set-file key=path
```

越靠后的优先级越高。

示例：

```bash
helm install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --set image.tag=1.0.1
```

`image.tag` 会使用 `1.0.1`。

排查 values 不生效：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
helm template aiops-api ./aiops-api -f values-prod.yaml --set image.tag=1.0.1
```

区别：

| 命令 | 看什么 |
|---|---|
| `helm get values` | 用户提供的 values |
| `helm get values --all` | 合并后的全部 values |
| `helm template` | 渲染后的 Kubernetes YAML |

## templates 是什么

`templates/` 目录里放 Kubernetes YAML 模板。

示例 `templates/deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "aiops-api.fullname" . }}
  labels:
    {{- include "aiops-api.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "aiops-api.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "aiops-api.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
```

Helm 模板基于 Go template，加上 Sprig 和 Helm 自己的内置对象/函数。

模板不是最终 YAML。最终 YAML 要用：

```bash
helm template aiops-api ./aiops-api
```

看。

## 内置对象

Helm 模板里常用内置对象：

| 对象 | 含义 |
|---|---|
| `.Values` | values.yaml 和用户传入 values |
| `.Release` | release 信息 |
| `.Chart` | Chart.yaml 信息 |
| `.Capabilities` | 集群能力和 API 版本 |
| `.Template` | 当前模板文件信息 |
| `.Files` | 访问 Chart 内非模板文件 |

`.Release` 常用：

```text
.Release.Name
.Release.Namespace
.Release.Revision
.Release.Service
.Release.IsInstall
.Release.IsUpgrade
```

`.Chart` 常用：

```text
.Chart.Name
.Chart.Version
.Chart.AppVersion
```

`.Capabilities` 常用于根据集群版本或 API 是否存在生成不同 YAML。

## 常用模板函数

### default

给默认值：

```yaml
replicas: {{ .Values.replicaCount | default 1 }}
```

### quote

加引号：

```yaml
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
```

### required

要求必须传值：

```yaml
image: {{ required "image.repository is required" .Values.image.repository }}
```

缺失时渲染失败，适合关键配置。

### toYaml

把对象转成 YAML：

```yaml
resources:
  {{- toYaml .Values.resources | nindent 12 }}
```

### nindent

换行并缩进：

```yaml
labels:
  {{- include "aiops-api.labels" . | nindent 2 }}
```

Helm 模板最容易出错的是缩进。`toYaml` + `nindent` 是高频组合。

### include

调用命名模板并返回字符串：

```yaml
name: {{ include "aiops-api.fullname" . }}
```

比 `template` 更适合管道组合。

### tpl

把字符串再当模板渲染。

适合高级场景，但要谨慎，容易让 values 变得过于动态。

## Flow control：if、with、range

### if

按条件渲染：

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
{{- end }}
```

### with

改变作用域：

```yaml
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
```

在 `with` 内，`.` 变成 `.Values.nodeSelector`。

### range

循环：

```yaml
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
```

注意作用域变化。如果需要根对象，可以用 `$`：

```yaml
{{- range .Values.extraLabels }}
{{ .name }}: {{ $.Release.Name | quote }}
{{- end }}
```

## 命名模板和 _helpers.tpl

`_helpers.tpl` 通常放可复用模板片段。

示例：

```yaml
{{- define "aiops-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "aiops-api.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "aiops-api.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "aiops-api.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "aiops-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
```

为什么要用 helper？

- 保证对象命名一致。
- 保证 labels 一致。
- 避免每个模板复制粘贴。
- 方便 Service selector 和 Deployment labels 对齐。

## 标准 labels

Helm Chart 常使用 Kubernetes 推荐的 app labels：

```yaml
app.kubernetes.io/name: aiops-api
app.kubernetes.io/instance: aiops-api-prod
app.kubernetes.io/version: "1.0.0"
app.kubernetes.io/managed-by: Helm
helm.sh/chart: aiops-api-0.1.0
```

这些 label 对 AIOps 很有价值：

- 按 release 查资源。
- 按 app 查 Pod。
- Prometheus relabel。
- 事件和日志关联。
- 判断资源是否由 Helm 管理。

查询：

```bash
kubectl get all -n aiops -l app.kubernetes.io/instance=aiops-api
```

## Release 和 Revision

安装 Chart：

```bash
helm install aiops-api ./aiops-api -n aiops
```

生成 release：

```text
release name: aiops-api
namespace: aiops
revision: 1
status: deployed
```

升级：

```bash
helm upgrade aiops-api ./aiops-api -n aiops --set image.tag=1.0.1
```

生成 revision 2。

查看历史：

```bash
helm history aiops-api -n aiops
```

查看状态：

```bash
helm status aiops-api -n aiops
```

回滚：

```bash
helm rollback aiops-api 1 -n aiops
```

回滚本身会产生新的 revision。也就是说，history 会继续增长。

## install、upgrade、upgrade --install

安装：

```bash
helm install aiops-api ./aiops-api -n aiops --create-namespace
```

升级：

```bash
helm upgrade aiops-api ./aiops-api -n aiops
```

如果没有就安装，有就升级：

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace
```

CI/CD 常用 `upgrade --install`，因为它适合幂等发布。

常用安全参数：

```bash
helm upgrade --install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --wait \
  --timeout 5m \
  --atomic
```

含义：

| 参数 | 含义 |
|---|---|
| `--wait` | 等待资源达到 ready 条件 |
| `--timeout` | 等待超时时间 |
| `--atomic` | 失败时自动回滚，通常会启用 wait 语义 |
| `--create-namespace` | namespace 不存在则创建 |
| `-f` | 使用 values 文件 |
| `--set` | 命令行覆盖 values |

注意：`--atomic` 很有用，但也可能让失败现场变化。AIOps runbook 要保存 Helm 和 Kubernetes 事件证据。

## dry-run、debug、template、lint

安装前先检查：

```bash
helm lint ./aiops-api
```

本地渲染：

```bash
helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

模拟安装并输出调试：

```bash
helm install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --dry-run \
  --debug
```

区别：

| 命令 | 是否连集群 | 主要用途 |
|---|---|---|
| `helm lint` | 不一定需要 | Chart 结构和常见问题检查 |
| `helm template` | 默认本地渲染 | 看最终 YAML |
| `helm install --dry-run --debug` | 会考虑安装流程和调试输出 | 安装前调试 |

排查模板问题时，先让 Helm 把最终 YAML 打出来，不要凭模板猜。

## helm get：看已安装 release

查看 release 的信息：

```bash
helm get all aiops-api -n aiops
```

查看 values：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
```

查看 manifest：

```bash
helm get manifest aiops-api -n aiops
```

查看 hooks：

```bash
helm get hooks aiops-api -n aiops
```

查看 notes：

```bash
helm get notes aiops-api -n aiops
```

这些是事故排查时的关键证据。

## Chart dependencies

Chart 可以依赖其他 Chart。

`Chart.yaml`：

```yaml
dependencies:
  - name: redis
    version: 19.0.0
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

更新依赖：

```bash
helm dependency update ./aiops-api
```

构建依赖目录：

```bash
helm dependency build ./aiops-api
```

依赖会进入：

```text
charts/
Chart.lock
```

建议：

- 锁定依赖版本。
- 提交 `Chart.lock`。
- 不要每次发布都无意识升级依赖。
- 子 Chart values 要清楚放在哪个 key 下。

## Subcharts 和 global values

子 Chart 有自己的 values。

父 Chart 可以这样覆盖：

```yaml
redis:
  architecture: standalone
  auth:
    enabled: false
```

`global` values 可被子 Chart 读取：

```yaml
global:
  imageRegistry: registry.example.com
```

注意：

- 子 Chart 不能随意访问父 Chart 所有 values。
- global 要慎用，太多 global 会让配置来源变混乱。
- 依赖 Chart 的 values schema 要看依赖 Chart 文档。

## Hooks

Helm hooks 允许在 release 生命周期某些点运行资源。

常见 hook：

| Hook | 时机 |
|---|---|
| `pre-install` | 安装前 |
| `post-install` | 安装后 |
| `pre-upgrade` | 升级前 |
| `post-upgrade` | 升级后 |
| `pre-delete` | 删除前 |
| `post-delete` | 删除后 |
| `test` | `helm test` 时 |

示例 Job：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ include "aiops-api.fullname" . }}-pre-upgrade"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["sh", "-c", "echo run migration"]
```

Hooks 很强，也容易危险：

- hook 失败会影响 install/upgrade。
- hook 资源生命周期需要用 delete policy 管。
- 数据库迁移不可随便回滚。
- hook Job 日志要纳入排障。

## NOTES.txt

`templates/NOTES.txt` 会在安装后输出提示。

示例：

```text
AIOps API has been installed.

Release: {{ .Release.Name }}
Namespace: {{ .Release.Namespace }}

Run:
  kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}
```

查看：

```bash
helm get notes aiops-api -n aiops
```

好的 NOTES 应该告诉用户：

- 安装了什么。
- 怎么查看资源。
- 怎么访问服务。
- 下一步排障命令。

不要写一堆过时或无法执行的命令。

## values.schema.json

Chart 可以用 JSON Schema 校验 values。

示例：

```json
{
  "$schema": "https://json-schema.org/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"]
    }
  }
}
```

价值：

- 提前发现 values 类型错。
- 给 Chart 使用者明确契约。
- 防止生产 values 漏关键字段。

## Chart Repository 和 OCI Registry

传统 Chart repository 提供索引：

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo bitnami/nginx
```

拉取：

```bash
helm pull bitnami/nginx --untar
```

Helm 也支持 OCI registry：

```bash
helm registry login registry.example.com
helm push aiops-api-0.1.0.tgz oci://registry.example.com/charts
helm pull oci://registry.example.com/charts/aiops-api --version 0.1.0
```

入门阶段先会使用 repository；企业内部再考虑 OCI、签名、供应链治理。

## 常用命令字典

### 查看版本

```bash
helm version
```

确认 Helm 客户端版本。

### 创建 Chart

```bash
helm create aiops-api
```

生成脚手架。

### 检查 Chart

```bash
helm lint ./aiops-api
```

检查 Chart 是否有明显问题。

### 渲染模板

```bash
helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

看最终 Kubernetes YAML。

### 安装

```bash
helm install aiops-api ./aiops-api -n aiops --create-namespace
```

创建 release。

### 安装前模拟

```bash
helm install aiops-api ./aiops-api -n aiops --dry-run --debug
```

调试安装输出。

### 升级

```bash
helm upgrade aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

生成新 revision。

### 安装或升级

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace
```

CI/CD 常用。

### 等待资源 ready

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --wait --timeout 5m
```

等待资源达到就绪条件。

### 失败自动回滚

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --atomic --timeout 5m
```

失败时回滚。适合生产发布，但仍要保存失败证据。

### 查看 release

```bash
helm list -n aiops
helm list -A
```

### 查看状态

```bash
helm status aiops-api -n aiops
```

### 查看历史

```bash
helm history aiops-api -n aiops
```

### 回滚

```bash
helm rollback aiops-api 1 -n aiops
```

### 查看 values

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
```

### 查看 manifest

```bash
helm get manifest aiops-api -n aiops
```

### 查看 hooks

```bash
helm get hooks aiops-api -n aiops
```

### 查看 notes

```bash
helm get notes aiops-api -n aiops
```

### 卸载

```bash
helm uninstall aiops-api -n aiops
```

注意：卸载会删除 release 管理的资源。PVC、CRD、hook 资源等行为要看 Chart 设计和 Kubernetes 回收策略。

### 打包

```bash
helm package ./aiops-api
```

生成 `.tgz` Chart 包。

### 管理 repo

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx
```

### 管理依赖

```bash
helm dependency list ./aiops-api
helm dependency update ./aiops-api
helm dependency build ./aiops-api
```

## Chart 文件字典

| 文件 | 作用 | 排障问题 |
|---|---|---|
| `Chart.yaml` | Chart 元数据和依赖 | version、dependencies 写错 |
| `values.yaml` | 默认 values | 默认值不合理、类型错 |
| `values.schema.json` | values 校验 | 必填字段漏传 |
| `templates/*.yaml` | Kubernetes 模板 | 缩进、函数、API 版本错误 |
| `templates/_helpers.tpl` | helper 模板 | include 名称错、labels 不一致 |
| `templates/NOTES.txt` | 安装后说明 | 输出命令过期 |
| `templates/tests/*` | Helm test 资源 | 测试 Job 失败 |
| `charts/` | 子 Chart | 依赖版本不一致 |
| `Chart.lock` | 依赖锁定 | 未提交导致依赖漂移 |
| `crds/` | CRD | 安装/升级生命周期特殊 |
| `.helmignore` | 打包忽略 | 把敏感文件打进包 |

## AIOps 入门实验

目标：创建一个最小 Chart，渲染、安装、升级、查看历史、回滚，并观察最终 Kubernetes 对象。

### 1. 创建 Chart

```bash
helm create aiops-web
```

清理不需要的模板，只保留：

```text
aiops-web/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    _helpers.tpl
    NOTES.txt
```

### 2. 设置 values

`values.yaml`：

```yaml
replicaCount: 2

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

### 3. 渲染检查

```bash
helm lint ./aiops-web
helm template aiops-web ./aiops-web -n aiops
```

确认输出里有：

- Deployment。
- Service。
- labels 一致。
- image 是 `nginx:1.25`。
- replicas 是 2。

### 4. 安装

```bash
helm upgrade --install aiops-web ./aiops-web \
  -n aiops \
  --create-namespace \
  --wait \
  --timeout 5m
```

查看：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-web
```

### 5. 升级

```bash
helm upgrade aiops-web ./aiops-web \
  -n aiops \
  --set image.tag=1.26 \
  --wait \
  --timeout 5m
```

查看：

```bash
helm history aiops-web -n aiops
helm get values aiops-web -n aiops
helm get manifest aiops-web -n aiops | rg "image:"
```

### 6. 回滚

```bash
helm rollback aiops-web 1 -n aiops --wait --timeout 5m
helm history aiops-web -n aiops
```

观察：回滚会产生新的 revision。

### 7. 故意制造 values 错误

用不存在镜像：

```bash
helm upgrade aiops-web ./aiops-web \
  -n aiops \
  --set image.tag=not-exist \
  --wait \
  --timeout 2m
```

排查：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get pods -n aiops -l app.kubernetes.io/instance=aiops-web
kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-web
```

你应该能看到 ImagePullBackOff 相关事件。

### 8. 清理

```bash
helm uninstall aiops-web -n aiops
```

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| `helm lint` 失败 | lint 输出 | Chart 结构、模板语法、values 类型 | 修模板和 Chart 元数据 |
| `helm template` 失败 | 错误行 | Go template 语法、include 名称、required 缺值 | 本地渲染定位 |
| YAML 缩进错误 | `helm template` 输出 | `toYaml`/`nindent` 使用错 | 看最终 YAML，不猜模板 |
| install 失败 | `helm status`、events | RBAC、API 版本、资源冲突 | 看 release 和 Kubernetes events |
| values 不生效 | `helm get values --all`、manifest | 覆盖层级错、key 路径错、类型错 | 看合并 values 和渲染 manifest |
| upgrade 卡住 | `helm status`、`kubectl rollout` | Pod 不 ready、镜像拉取失败、探针失败 | 查 Deployment/Pod events |
| `--atomic` 后现场不见 | helm history、events | 失败后自动回滚 | 保存 CI 日志和 events |
| rollback 后 revision 变大 | `helm history` | Helm 回滚也创建新 revision | 正常现象 |
| uninstall 后资源还在 | `kubectl get` | PVC、CRD、hook 资源、finalizer | 看资源 owner 和回收策略 |
| 依赖没下载 | `helm dependency list` | 未 update/build、repo 未添加 | `helm dependency update` |
| hook 失败 | `helm get hooks`、Job logs | hook Job 错误、权限不足 | 查 hook 资源和日志 |

## 排障流程：values 不生效

假设你设置：

```bash
--set image.tag=1.0.1
```

但 Pod 仍然使用旧镜像。

按顺序查：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
helm get manifest aiops-api -n aiops | rg "image:"
helm template aiops-api ./aiops-api -n aiops --set image.tag=1.0.1 | rg "image:"
```

判断：

1. values 是否传进 release？
2. 合并后的 values 是否正确？
3. 模板是否真的引用 `.Values.image.tag`？
4. Deployment 是否触发 rollout？
5. Pod 是否仍是旧 ReplicaSet？

常见根因：

- values key 写成 `images.tag`，模板用 `image.tag`。
- 命令行 shell 把特殊字符处理了。
- 模板写死了 tag，没有引用 values。
- upgrade 没带正确 namespace。
- 看到的是旧 Pod。

## 排障流程：安装失败

```bash
helm install aiops-api ./aiops-api -n aiops --dry-run --debug
helm lint ./aiops-api
helm template aiops-api ./aiops-api -n aiops
```

如果本地渲染正常，再看集群：

```bash
helm status aiops-api -n aiops
kubectl get events -n aiops --sort-by=.lastTimestamp
kubectl get all -n aiops -l app.kubernetes.io/instance=aiops-api
```

判断：

- 是模板渲染失败，还是 Kubernetes API 拒绝？
- API 版本是否被当前集群支持？
- namespace 是否存在？
- RBAC 是否允许创建资源？
- 是否资源名冲突？
- CRD 是否先安装？

## 排障流程：升级后异常

先看 Helm 维度：

```bash
helm status aiops-api -n aiops
helm history aiops-api -n aiops
helm get values aiops-api -n aiops --all
helm get manifest aiops-api -n aiops
```

再看 Kubernetes 维度：

```bash
kubectl rollout status deployment/aiops-api -n aiops
kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-api
kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-api
kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --tail=200
kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --previous --tail=200
```

如果要回滚：

```bash
helm rollback aiops-api <good-revision> -n aiops --wait --timeout 5m
```

回滚前记录：

- 当前 revision。
- 当前 values。
- 当前 manifest。
- Pod events。
- 应用日志。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

release="${1:-aiops-api}"
ns="${2:-aiops}"

echo "== helm status =="
helm status "$release" -n "$ns" || true

echo
echo "== helm history =="
helm history "$release" -n "$ns" || true

echo
echo "== helm values all =="
helm get values "$release" -n "$ns" --all || true

echo
echo "== helm manifest =="
helm get manifest "$release" -n "$ns" || true

echo
echo "== kubernetes objects =="
kubectl get all -n "$ns" -l "app.kubernetes.io/instance=$release" -o wide || true

echo
echo "== events =="
kubectl get events -n "$ns" --sort-by=.lastTimestamp || true
```

生产化前要补：

- 输出目录。
- 敏感 values 脱敏。
- manifest 单独保存。
- 自动识别 Deployment/StatefulSet rollout。
- 和 CI/CD 发布编号关联。

## Helm 最佳实践入门

- Chart 名、release 名、labels 要稳定。
- 所有资源打上 `app.kubernetes.io/instance`。
- 用 `helm lint` 和 `helm template` 进 CI。
- 生产发布用 `helm upgrade --install --wait --timeout`。
- 慎用 `--atomic`，同时保存失败证据。
- values key 不要过度抽象。
- 不要把真实 Secret 写进 values 文件提交 Git。
- 对关键 values 使用 `required` 或 `values.schema.json`。
- 依赖版本要锁定，提交 `Chart.lock`。
- helper 里统一生成 name 和 labels。
- 不要让 template 复杂到像程序，复杂逻辑应该往应用或上层工具移动。

## 面试怎么讲

Helm 是 Kubernetes 的包管理器。Chart 是一组 Kubernetes 模板、默认 values 和元数据组成的软件包；values 提供环境差异配置；Helm 用 Go template 和内置对象把 Chart 渲染成 Kubernetes manifests；install 会把 Chart 安装到集群成为 release；upgrade 会产生新的 revision；history 可以查看发布历史；rollback 可以把 release 回到某个历史 revision。排障时我会先用 `helm lint` 和 `helm template` 确认模板，再用 `helm status/history/get values/get manifest` 看 release 当前状态，最后结合 `kubectl describe/logs/events` 判断 Kubernetes 层面的失败原因。

## 小白可能会问

### Helm 会替代 Kubernetes 吗？

不会。Helm 只是生成和管理 Kubernetes 对象的发布工具。最终运行的还是 Deployment、Service、ConfigMap、Secret 等 Kubernetes 资源。

### Chart 和 Release 有什么区别？

Chart 是包，Release 是这个包安装到某个 namespace 后形成的实例。同一个 Chart 可以安装出多个 release。

### values.yaml 是最终配置吗？

不是。它是默认输入。最终配置还会叠加用户 values、`--set` 等，并经过模板渲染成 Kubernetes YAML。

### 为什么要看 helm template？

因为模板不是最终 YAML。很多问题来自缩进、条件分支、values key 错。`helm template` 能看到最终会提交给 Kubernetes 的内容。

### Helm rollback 是不是把 revision 号变回去了？

不是。回滚会应用旧 revision 的内容，但会产生一个新的 revision。

### 为什么 Helm 卸载后 PVC 还在？

这可能和 Kubernetes 回收策略、Chart 设计、资源注解、finalizer 有关。持久数据通常不能随便跟应用一起删。

## 学习路线

第一阶段：会用

- `helm repo add/update/search`
- `helm install`
- `helm upgrade --install`
- `helm list/status/history`
- `helm rollback`
- `helm uninstall`

第二阶段：会看

- `Chart.yaml`
- `values.yaml`
- `templates/`
- `helm template`
- `helm get values`
- `helm get manifest`

第三阶段：会写

- Deployment 模板。
- Service 模板。
- `_helpers.tpl`。
- labels helper。
- `values.schema.json`。
- `NOTES.txt`。

第四阶段：会排障

- lint 失败。
- template 失败。
- values 不生效。
- install/upgrade 失败。
- rollback。
- hook Job 失败。

第五阶段：接入 AIOps

- CI 中保存渲染 manifest。
- 发布失败自动采集 Helm history/status/values/manifest。
- Kubernetes events 和 Helm revision 关联。
- 告警中带 release、chart、revision label。

## 学习检查清单

- [ ] 我能解释 Chart、Release、Revision 的区别。
- [ ] 我能画出 Helm install 的流程。
- [ ] 我能写出 Chart 目录结构。
- [ ] 我能解释 `Chart.yaml` 里的 `version` 和 `appVersion`。
- [ ] 我能解释 values 覆盖优先级。
- [ ] 我能使用 `.Values`、`.Release`、`.Chart`。
- [ ] 我能使用 `default`、`quote`、`toYaml`、`nindent`、`include`。
- [ ] 我能写一个 `_helpers.tpl` 生成 name 和 labels。
- [ ] 我能用 `helm lint` 检查 Chart。
- [ ] 我能用 `helm template` 看最终 YAML。
- [ ] 我能用 `helm upgrade --install` 发布。
- [ ] 我能用 `helm history` 找 revision。
- [ ] 我能用 `helm rollback` 回滚。
- [ ] 我能用 `helm get values --all` 排查 values。
- [ ] 我能用 `helm get manifest` 对比最终 Kubernetes 对象。
- [ ] 我能把 Helm 发布证据采集写进 AIOps runbook。

## 面试题

1. Helm 解决 Kubernetes YAML 管理中的什么问题？
2. Chart、Release、Revision 分别是什么？
3. Helm install 的大致流程是什么？
4. `values.yaml` 和用户传入 values 的关系是什么？
5. values 覆盖优先级是什么？
6. `helm template` 和 `helm install --dry-run --debug` 有什么区别？
7. `helm lint` 能发现哪些问题？
8. `version` 和 `appVersion` 有什么区别？
9. `.Values`、`.Release`、`.Chart` 分别是什么？
10. `toYaml | nindent` 为什么常一起用？
11. `include` 和命名模板有什么作用？
12. `helm upgrade --install` 为什么适合 CI/CD？
13. `--wait`、`--timeout`、`--atomic` 分别做什么？
14. `helm history` 和 `helm rollback` 怎么用？
15. 回滚后 revision 为什么会继续增加？
16. values 不生效时怎么排查？
17. 安装失败时怎么区分 Helm 模板错误和 Kubernetes API 错误？
18. Chart dependency 怎么管理？
19. Helm hooks 适合什么场景？有什么风险？
20. Helm 在 AIOps 发布诊断中能提供哪些证据？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `aiops-web` Helm Chart。
- 一份 `helm template` 渲染输出。
- 一份 values 覆盖实验记录。
- 一份 `helm history` 和 `helm rollback` 记录。
- 一份安装失败或 ImagePullBackOff 的 Helm + Kubernetes 联合排障笔记。
- 一个 Helm release 诊断脚本，能采集 status、history、values、manifest 和 Kubernetes events。
