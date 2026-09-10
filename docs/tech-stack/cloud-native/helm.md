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
- [Helm 4 overview](https://helm.sh/docs/overview/)
- [Helm 4.2.4 release](https://github.com/helm/helm/releases/tag/v4.2.4)
- [Helm 3 end of life](https://helm.sh/blog/helm-v3-end-of-life/)
- [Helm 与 Kubernetes 版本偏差](https://helm.sh/docs/topics/version_skew/)
- [Kubernetes API 弃用检查](https://helm.sh/docs/topics/kubernetes_apis/)

说明：本文是基于 Helm 官方文档整理的原创中文教程，不复制官方全文。截至 2026-08-14，当前主线为 Helm 4.2.4，官方 version skew 表覆盖 Kubernetes 1.33–1.36。Helm 3 仍可运行，但已进入退役时间表；真实环境先执行 `helm version`，再核对 Chart、plugin、post-renderer、SDK 和 CI wrapper 的兼容性。

## Helm 4 迁移红线

| 行为 | Helm 4 主线 | 小白最容易踩的坑 |
|---|---|---|
| Apply | 新 release 默认 Server-Side Apply | Helm 3 创建的 release 默认保留原方法，不会随 CLI 自动全量切换 |
| 失败回滚参数 | `--rollback-on-failure` | 旧教程常写 `--atomic`，迁移脚本要核对当前帮助 |
| 强制替换参数 | `--force-replace` | 强制替换可能造成资源短暂删除，不是通用修复 |
| 服务端预检 | `--dry-run=server` | 普通 `--dry-run` 不等于经过 apiserver、admission 和权限校验 |
| Chart API | 稳定生产 Chart 仍可用 `apiVersion: v2` | 不要因为 Helm 4 就把所有 Chart 盲改实验性 v3 |

Helm 4 对新 release 默认使用 Server-Side Apply（SSA，服务端应用），会记录 field ownership。若别的 controller 或人工也管理同一字段，升级可能产生 ownership conflict。迁移前要在测试集群检查 `managedFields`、插件、hooks、CRD 和数据库副作用。

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
Chart（可配置的 Kubernetes 应用包）
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
- `helm template`、`helm lint`、`helm install --dry-run=server --debug`。
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
Intro（入门）
  -> Helm 是什么
  -> 安装 Helm
  -> Using Helm（使用流程）
  -> Cheat Sheet（常用操作速查）

Topics（专题）
  -> Charts（应用包）
  -> Chart Hooks（生命周期任务）
  -> Chart Repository（包索引仓库）
  -> Registries（OCI 制品仓库）
  -> Plugins（插件）
  -> Provenance and Integrity（来源证明与完整性）

Chart Template Guide（模板编写指南）
  -> Getting Started（第一份模板）
  -> Built-in Objects（内置上下文对象）
  -> Values Files（配置输入文件）
  -> Functions and Pipelines（函数与管道）
  -> Flow Control（条件与循环）
  -> Variables（变量）
  -> Named Templates（命名模板）
  -> Files（读取包内文件）
  -> NOTES.txt（安装后提示）
  -> Subcharts and Global Values（子包与全局配置）
  -> Debugging Templates（调试模板）
  -> YAML Techniques（YAML 写法）

Helm Commands（命令：下文命令字典逐项解释）
  -> helm create（创建应用包骨架）
  -> helm lint（检查包结构与常见错误）
  -> helm template（本地渲染资源清单）
  -> helm install（安装发布实例）
  -> helm upgrade（更新发布实例）
  -> helm rollback（回到指定历史修订配置）
  -> helm status（查看发布状态）
  -> helm history（查看修订历史）
  -> helm get（查看已保存的发布内容）
  -> helm uninstall（卸载发布实例）
  -> helm repo（管理包索引仓库）
  -> helm dependency（管理依赖包）
  -> helm package（打包应用包）
  -> helm show（查看包信息）
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
  -> Helm Chart（应用包）
  -> values-dev.yaml / values-prod.yaml（开发与生产的差异配置）
  -> CI/CD（持续集成与交付流水线）
  -> helm lint（静态检查）
  -> helm template（渲染清单）
  -> helm upgrade --install（存在则更新，不存在则安装）
  -> Kubernetes Deployment / Service / ConfigMap / Ingress（部署、服务入口、配置、入口路由资源）
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
helm install aiops-api ./chart -f values-prod.yaml（按生产配置安装名为 aiops-api 的发布实例）
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
helm upgrade aiops-api ./chart -f values-prod.yaml（按生产配置更新该发布实例）
  -> 重新合并 values
  -> 重新渲染 manifests
  -> 对比并更新 Kubernetes 对象
  -> 记录 release revision 2
```

一次 rollback：

```text
helm rollback aiops-api 1（取历史修订 1 的配置执行回滚）
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
  -> helm install/upgrade -f my-values.yaml（用文件覆盖默认配置）
  -> --set key=value（命令行设值，会推断值类型）
  -> --set-string key=value（命令行设值，强制按字符串处理）
  -> --set-file key=path（把文件内容作为某个配置项的值）
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

`default` 把数字 `0`、布尔 `false` 等也视为空值。如果你需要支持 `replicaCount: 0` 来暂停实验工作负载，这种写法会把它改回 1。应通过默认 values 与 schema 明确允许范围，或显式检查键是否存在，不能把 `default` 当作只处理缺失字段的工具。

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

CI/CD 常用 `upgrade --install`，因为它能把“首次安装”和“后续升级”收敛到一条命令。它不等于严格幂等：Hook、随机模板值、可变镜像标签、CRD 和外部数据库变更都可能产生额外副作用。

常用安全参数：

```bash
helm upgrade --install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --wait \
  --timeout 5m \
  --rollback-on-failure
```

含义：

| 参数 | 含义 |
|---|---|
| `--wait` | 等待资源达到 ready 条件 |
| `--timeout` | 等待超时时间 |
| `--rollback-on-failure` | Helm 4 中升级失败时尝试回滚；回滚本身也可能失败，数据库等外部副作用不会自动撤销 |
| `--create-namespace` | namespace 不存在则创建 |
| `-f` | 使用 values 文件 |
| `--set` | 命令行覆盖 values |

注意：`--rollback-on-failure` 会改变失败现场。AIOps runbook 要在回滚前后保存 Helm 状态、Kubernetes Events、Pod 日志和业务探针结果。

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
  --dry-run=server \
  --debug
```

区别：

| 命令 | 是否连集群 | 主要用途 |
|---|---|---|
| `helm lint` | 不一定需要 | Chart 结构和常见问题检查 |
| `helm template` | 默认本地渲染 | 看最终 YAML |
| `helm install --dry-run=client --debug` | 不把资源提交给 API Server | 本地安装流程调试 |
| `helm install --dry-run=server --debug` | 连接 API Server 做服务端模拟，可暴露部分权限、Admission 和集群 API 问题 | 上线前预检；仍不会创建资源 |

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
helm install aiops-api ./aiops-api -n aiops --dry-run=server --debug
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
helm upgrade --install aiops-api ./aiops-api -n aiops --rollback-on-failure --timeout 5m
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

本实验只在新建的 `aiops-web` 目录操作。保留元数据文件，并用下面的完整最小模板替换脚手架示例；不要只替换 values 却留下引用旧字段的模板。最终只保留：

```text
aiops-web/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
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

`templates/deployment.yaml` 写为：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/instance: {{ .Release.Name }}
    spec:
      containers:
        - name: web
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - name: http
              containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: http
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

`templates/service.yaml` 写为：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
  labels:
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  selector:
    app.kubernetes.io/instance: {{ .Release.Name }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
```

模板直接使用 release 名命名，标签在 Service、Deployment 选择器和 Pod 中保持一致。这里只用两个模板，暂不依赖 helper，避免第一次实验就把命名函数与业务配置混在一起。确认 `templates/` 里没有脚手架残留的 Ingress、ServiceAccount、测试或其他模板。

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
| 自动回滚后现场变化 | `helm history`、events、Pod 日志 | `--rollback-on-failure` 已触发回滚 | 在回滚前后保存 CI 日志、release 状态和集群证据 |
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
helm install aiops-api ./aiops-api -n aiops --dry-run=server --debug
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
helm rollback aiops-api '<good-revision>' -n aiops --wait --timeout 5m
```

回滚前记录：

`<good-revision>` 不是可执行值；先从该 release 的 `helm history` 中选出已验证且数据兼容的目标修订号，再替换整个占位符并保留引号。不能把“上一版”自动视为安全回滚目标，写操作仍须遵守前面的审批与恢复边界。

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
- 谨慎使用 `--rollback-on-failure`，并在自动回滚前后保存失败证据。
- values key 不要过度抽象。
- 不要把真实 Secret 写进 values 文件提交 Git。
- 对关键 values 使用 `required` 或 `values.schema.json`。
- 依赖版本要锁定，提交 `Chart.lock`。
- helper 里统一生成 name 和 labels。
- 不要让 template 复杂到像程序，复杂逻辑应该往应用或上层工具移动。

## Release 状态模型与真实回滚边界

Helm 默认把每个 revision 的 release 记录存成 Kubernetes Secret。它记住“上一次渲染了什么”，但不是常驻控制器：资源可能被 HPA、Operator、admission 或人工修改，release record 与集群实际状态会漂移。

`helm rollback` 会创建新的 revision，并尝试把 Kubernetes manifest 恢复到旧版本；它不能自动撤销：

- 已执行的数据库迁移和业务数据写入；
- PVC/对象存储中的数据变化；
- CRD schema、storedVersion 和 Operator 状态迁移；
- hook 调用的外部系统副作用；
- 可变 tag 指向的新镜像。

因此生产回滚要把 Chart、镜像、数据库、CRD、配置、流量和外部依赖分别列出。能 `helm rollback` 不等于业务能恢复。

### HA、容量和安全

Helm 本身没有服务端 HA 问题，真正故障域在 Kubernetes API、release Secret、hook Job、CRD controller 和应用。大 release 会增加 Secret 大小与 API 压力；大量 hooks、等待条件和历史 revision 会增加超时与存储。敏感 values 可能进入 release Secret，kubeconfig/RBAC、plugin、post-renderer 都能执行高权限操作，必须纳入供应链与审计。

Kubernetes 升级前还要扫描旧 revision 中已经移除的 API。即使当前 Pod 正常，旧 manifest 里的 removed API 也可能让下一次 upgrade 或 rollback 失败。

## 故障注入实验：坏镜像与自动回滚

前置条件：一次性集群已安装本文 `aiops-web` Chart 的健康 revision，Helm 为 4.2.4，values 中使用 `image.repository` 与 `image.tag`。

先保存基线：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get deploy,pod -n aiops -o wide
```

注入不存在的镜像：

```bash
helm upgrade aiops-web ./aiops-web -n aiops \
  --set image.repository=registry.invalid/aiops-web \
  --set image.tag=broken \
  --rollback-on-failure --wait --timeout 2m
```

预期升级失败并触发回滚。保存证据：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get pods -n aiops
kubectl get events -n aiops --sort-by=.metadata.creationTimestamp
kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-web
```

验证健康 revision 的 Pod 与真实 HTTP 请求恢复。若没有自动恢复，检查 Chart selector/label、等待对象、hook、timeout 和回滚目标；不要立即删除 release，因为这会丢掉最有价值的 history 和 manifest 证据。

清理故障值：下一次正常升级显式传回固定的健康 image tag/digest。先卸载本次实验 release；只有确认 `aiops` 命名空间由本次实验创建且不含任何其他资源时，才执行下面第二条删除命令。共享命名空间保留，不因结束实验而删除。

```bash
helm uninstall aiops-web -n aiops
kubectl delete namespace aiops
```

### 生产事故题

题目：Helm 显示 `deployed`，但新版本接口 5xx，回滚后数据库仍报字段不存在。回答要点：release 状态只说明 Helm 操作结果，不证明业务；关联 history、manifest、Pod events/logs、真实请求和数据库 migration 记录。若 schema 不是向后兼容，代码回滚会失败。先按 runbook 限流/切流，执行经验证的 forward fix 或数据恢复，不反复 rollback；复盘采用 expand-contract schema 和 canary。

### 系统设计题

题目：设计企业级 Chart 发布平台。应覆盖 Chart/OCI digest、provenance、values schema、环境分层、Secret 外置、RBAC、server-side dry-run、policy/admission、diff、hooks/CRD/数据库门禁、发布锁、canary、真实业务探针、history、审计和分层回滚。还要说明 Helm 是发布客户端，不是 GitOps 持续调和器。

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
6. `helm template`、`--dry-run=client` 和 `--dry-run=server` 有什么区别？
7. `helm lint` 能发现哪些问题？
8. `version` 和 `appVersion` 有什么区别？
9. `.Values`、`.Release`、`.Chart` 分别是什么？
10. `toYaml | nindent` 为什么常一起用？
11. `include` 和命名模板有什么作用？
12. `helm upgrade --install` 为什么适合 CI/CD？
13. `--wait`、`--timeout`、`--rollback-on-failure` 分别做什么？Helm 3 的 `--atomic` 迁移到 Helm 4 时要检查什么？
14. `helm history` 和 `helm rollback` 怎么用？
15. 回滚后 revision 为什么会继续增加？
16. values 不生效时怎么排查？
17. 安装失败时怎么区分 Helm 模板错误和 Kubernetes API 错误？
18. Chart dependency 怎么管理？
19. Helm hooks 适合什么场景？有什么风险？
20. Helm 在 AIOps 发布诊断中能提供哪些证据？

## 老师带你沿四份配置追查一次“参数没生效”

先把配置分成四份：你写的 values、Helm 合并后的 values、模板渲染出的 manifest、集群实际对象。问题在任意相邻两份之间，都可能表现为“我明明改了，为什么没变”。

如果用户 values 已变、合并结果没变，查文件顺序和命令覆盖；合并结果已变、manifest 没变，查模板引用的键和条件分支；manifest 已变、集群没变，查 API 拒绝、字段所有权和发布状态；集群已变但应用没变，再查 Pod 发布、配置加载和实际请求。

这也是为什么 Helm 的 values 不宜过度抽象。把副本数改名为一个毫无对应关系的业务字段，会增加阅读和排障成本。`values.schema.json` 可以校验类型与必要字段，提早发现把数字写成字符串等错误，但不能验证真实数据库是否可达。

### 模板中的点为什么会变

`.` 是当前上下文，进入 `with` 或 `range` 后可能变成某个局部对象。`$` 常用于保留根上下文。比如循环环境变量时，`.` 是这一条变量，不再是包含 `.Release` 的全局对象；使用错上下文会让模板找不到字段。

`include` 返回一个字符串，`nindent` 先换行再加缩进，`toYaml` 把结构化值转换成 YAML。最终仍需满足 Kubernetes YAML 层级。模板看起来排得整齐，不代表去掉模板标记后的缩进正确，所以每次改动都先看渲染结果。

`required` 的作用是让缺少关键输入时尽早失败，错误信息最好说明字段含义和如何提供。不要用随机函数临时生成每次变化的业务配置，否则相同输入也可能触发意外更新，难以复现发布。

## Release 课堂：历史记录不等于持续自愈

Helm 通常保存每次发布的配置与结果，但命令结束后并不持续运行一个 Helm 服务来纠正所有漂移。HPA 修改副本、Operator 更新资源或人工修配置，都可能使实际对象与上一份 release manifest 不同。

因此同一个字段要有明确管理者。Helm 4 的 Server-Side Apply 会暴露字段所有权问题，强制抢占之前应明确另一个控制器为什么管理它。把冲突直接强制覆盖，可能让两个控制器持续互相改值。

Hook 是发布生命周期触发的任务，常用于迁移或初始化。它可能调用外部系统并产生副作用，超时后任务是否完成需要查询，不能假定再次运行一定无害。数据库迁移应有幂等或可恢复设计，并给出不可逆步骤的停止点。

CRD 定义资源类型，Operator 根据自定义对象执行控制。它们的升级与存量数据转换有自己的生命周期。Helm release 回滚到旧 manifest，不会自动把新格式的业务对象和数据库转换回旧格式。

## 三分钟面试课堂

**30 秒：**Helm 把 Kubernetes 资源组织为可配置的 Chart，渲染后安装成 Release，每次发布留下 Revision。排障先看输入与渲染，再看发布记录和实际对象，最后验证业务。

**3 分钟：**Chart 包含元数据、默认值、模板和依赖；用户配置按明确顺序合并，模板根据上下文生成 manifest。API 检查、权限和准入仍可能拒绝合法 YAML，因此本地渲染通过只是第一道门。Release 记录帮助追踪变更，但资源可能被其他控制器修改，字段管理应有边界。

生产交付固定 Chart、镜像与依赖版本，校验 values，做服务端预检和业务灰度。Hooks、CRD、数据库与外部云资源有各自副作用，回滚必须逐项说明能否恢复。失败实验中保存 history、事件和 Pod 状态，再证明恢复的实际 HTTP 请求；不能只展示一个 `deployed` 字样。

追问 values 数字 0 变成 1，解释 `default` 的空值语义；追问回滚后 revision 增大，解释回滚本身也是一次新操作；追问卸载为什么仍有数据，解释存储回收、CRD 与 Hook 的独立生命周期，并先检查资源身份而不是强删。

## 模板精讲：把“输入合同”写给下一位使用者

老师给你两个配置：`replicaCount: 2` 与 `replicaCount: "two"`。人能猜到第一个想跑两个副本，但模板不会自动把所有错误输入解释正确。Chart 的 values 就像函数参数，`values.schema.json` 是输入合同：哪些字段必填，类型是什么，取值范围是什么，哪些组合不允许。合同越清楚，失败越接近提交配置的人，而不是拖到集群调度后才暴露。

默认值用于未提供的场景，不能随便覆盖有业务含义的零值。副本数 0 可能表示主动停服务，布尔值 false 可能表示关闭功能；Go 模板的 `default` 会把它们视作空值，因此 `default 1 .Values.replicaCount` 可能把 0 又变为 1。应区分“键不存在”与“值为零”，用模式校验、显式条件或 `hasKey` 表达需求。变量名起对只是第一步，空值语义也必须和使用者达成一致。

Map（键值映射）和 List（列表）的覆盖也不同。多份 values 叠加时，不要想当然地认为列表按名字自动合并；常见行为是后面的列表替换前面的整个列表。因此把两个环境各写一条 `env` 列表，不一定得到两条环境变量。排查以合并后的 values 和渲染结果为准，团队设计输入结构时也应考虑覆盖成本。对顺序敏感的列表尤其要写示例，避免新成员只想改一个值却删除了其他配置。

### 无集群的可回收实验：让错误在发布前被挡住

使用前文新建的 `aiops-web` Chart 和 Helm CLI。确认该实验目录没有业务文件，在根目录新增 `values.schema.json`，内容如下：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["replicaCount"],
  "properties": {
    "replicaCount": {"type": "integer", "minimum": 0, "maximum": 5}
  }
}
```

`integer` 是整数，`minimum`/`maximum` 是上下界。这里最多五副本只是本地课堂约束，不是 Kubernetes 上限。没有设置 `additionalProperties: false`，所以原有 image、service、resources 字段仍允许存在。依次执行：

```bash
helm lint ./aiops-web
helm template aiops-web ./aiops-web --set replicaCount=2
helm template aiops-web ./aiops-web --set replicaCount=-1
helm template aiops-web ./aiops-web --set replicaCount=2
```

预期第一、第二条成功；第三条因副本数低于下界失败，不需要连接集群；第四条恢复成功，渲染的 Deployment 显示 `replicas: 2`。最后一条没有修改前面的文件，故障只通过命令行输入注入。若负数未被拒绝，先检查文件是否放在 Chart 根目录、是否真的叫 `values.schema.json`、JSON 是否有效、当前 Helm 是否支持对应校验；不要马上用跳过校验参数掩盖错误。

保留这个 schema 作为学习成果；若要恢复到原课堂文件集，只删除刚创建的这一个文件，不删除整个 Chart。把失败信息和恢复后的关键片段脱敏保存。再回答一道反问：校验通过能否证明节点有五副本容量？不能，schema 校验输入形式和约束，调度容量仍要到目标集群验证。

## 发布精讲：一份 Chart 怎样获得可复现性

Chart 版本、应用版本和镜像摘要是三种不同身份。`Chart.yaml` 的 `version` 描述包本身，`appVersion` 主要提供应用版本信息，不自动决定 Deployment 里拉取什么镜像；模板引用哪个字段，最终就使用哪个字段。Chart 包不变而传入 values 改变，部署结果可以改变；同一个镜像标签被覆盖，模板一字未改也可能启动不同内容。

真正可重现的交付记录至少包括 Chart 来源与校验、依赖锁定、用户 values 的脱敏快照、镜像内容摘要、目标 Kubernetes/API 能力、Helm 版本和渲染结果。`Chart.lock` 固定依赖解析结果，依赖包是否能从可信来源重新取得同样重要；CI 每次无条件更新依赖，会让一次应用小修改顺便引入无关变化。离线交付要保存经过审查的依赖包、镜像和许可证材料，而不是只留下一个会随时间变动的网址。

Chart 可以创建高权限对象，`tpl` 可以把 values 中的字符串再次作为模板求值，`lookup` 等能力在允许访问集群的渲染路径中还可能读取对象。不要把外部 Chart 当成无害文字文件。审查 RBAC、ServiceAccount、Secret 引用、宿主机挂载、网络访问、Hook 和 CRD，执行身份只给本次发布必需权限。模板输出可能含 Secret，即使 base64 编码也不是脱敏，调试日志和 CI Artifact 同样需要保护。

## 状态精讲：为什么一次发布不能有两个指挥员

两条流水线同时更新同一个 release，会竞争修订状态、资源字段和外部迁移任务。平台需要按集群、命名空间、release 建立串行或明确的排他策略，并保存操作者和任务编号。发现 `pending-upgrade` 时先确认原任务是否仍在运行、客户端是否丢失连接、Hook 是否仍有副作用，不直接删除 release 的记录 Secret 来“解锁”。那会毁掉发布证据，并可能让仍在执行的另一条任务失去协调信息。

集群对象也可能有多个字段管理者。HPA 管副本数、Operator 管其生成对象、Helm 管声明模板，并不意味着它们可以同时修改同一字段而永不冲突。你应在 Chart 中避免不必要的字段声明，或按明确流程交接管理权。Server-Side Apply 的 `managedFields` 是观察字段管理关系的线索，强制接管是变更决策，不是正常修复所有冲突的万能按钮。

配置更改何时影响程序，也要继续追问。ConfigMap 对象变了，环境变量注入的旧进程不会自动重启；挂载文件更新也不保证应用会重新读取。Chart 可以通过 Pod 模板校验和等设计触发滚动更新，但需说明它观察哪些输入。不能因为 `helm get manifest` 包含新配置，就跳过实际 Pod 版本与业务输出验证。

## 生命周期精讲：CRD、Hook 和数据库各自留下什么

`crds/` 目录有特殊处理，不能把它当普通模板目录。CRD 定义新的 API 类型，其实例包含独立数据；先有类型，API 才能识别实例。Helm 的特殊目录处理对升级与删除有保护边界，普通 dry-run 也不能在服务器真正安装一个新类型后继续验证所有实例。[官方 CRD 说明](https://helm.sh/docs/chart_best_practices/custom_resource_definitions/)给出了这些限制。把 CRD 单独治理能明确责任，但也增加版本协调工作。

Hook Job 通过生命周期事件执行任务。排序权重只是同一流程中安排执行顺序，不是跨流水线的分布式锁。Hook 创建的资源也不能一概依赖卸载 release 自动回收；需要符合业务保留要求的删除策略或 Job TTL，见 [官方 Hook 生命周期](https://helm.sh/docs/topics/charts_hooks/)。过早清理失败 Job 会丢失日志，长期不清理则堆积对象和敏感输出，两者都需要取舍。

假设 `pre-upgrade` 把旧数据库字段删除，而新 Pod 因镜像错误无法启动。自动回滚可以恢复旧 Deployment，却不能让已删除字段重新出现。这说明迁移需要分阶段：先扩展兼容字段，让新旧程序都能工作；观察并完成数据迁移；确认没有旧消费者后，另一次受控发布再收缩旧结构。自动回滚的收益是缩短可逆配置故障，前提是你没有在前面做不可逆数据破坏。

## 面试深追问：发布平台该以什么作为成功条件

如果面试官只让你选一个绿色状态，请先说明成功是分层的：模板合同通过、API 接受、资源达到所需就绪、业务探针通过、关键指标没有超出灰度门槛。`--wait` 的对象和版本语义要按 CLI 确认，它不理解所有业务规则。支付 API 返回 200 但没有正确记账，照样不能叫发布成功。

一次成熟发布应能回答：这次提交了什么，哪些对象受影响，谁批准，失败时在哪一步停住，上一可用版本在哪里，数据能否回退，自动化会不会重复外部动作。AIOps 可以自动整理 revision、镜像摘要、事件、日志时间线和变更前后指标，但不能仅因回滚命令退出零就关闭事故。学生的最终作业应是一个能解释失败和恢复的 Chart 项目，而不是二十条没有上下文的命令。

## 从零补一层：模板、对象与工作负载不是同一种东西

如果刚接触 Kubernetes，先把三层关系说清：YAML 是表达对象字段的文本格式；Deployment 是提交给集群的期望状态对象；Pod 是控制器据此维持的运行实例。Service 根据标签选取后端，标签不是注释，而是参与选择的键值对。Helm 只负责把输入变成这些对象并执行发布操作。因此修改模板文件不会直接修改已运行的进程，必须经过渲染、提交、控制器调和和应用加载几个阶段。

本文实验中的命名空间是隔离对象命名与权限的范围，不是独立 Kubernetes 集群；在同一个名字下仍可能有别人的资源。开始前读 `kubectl config current-context` 确认目标，再确认专用命名空间和 release 尚不存在。仅本地渲染时无需选择真实集群；实际安装时必须是自己的隔离实验环境。文中反斜杠续行属于 Bash，PowerShell 应使用对应续行方式或写成一行，不能把两种解释器规则混用。

### 一、输入值有类型，模板结果也有类型

设想业务环境变量叫 `FEATURE_ENABLED`。程序希望拿到字符串 `false`，但 values 中的布尔值在渲染后如果没有引号，Kubernetes 可能看到布尔值而不是字符串。相反，副本数要求整数，给它一律加引号又可能产生类型错误。因此 `quote` 不是所有字段的万能保险：字符串字段引用时适合明确字符串语义，整数、布尔与结构化字段应保留正确类型。模板检查不仅是看缩进，还要看字段最终交给谁消费。

再给你两个容易忽略的值：以零开头的业务编号、含逗号和等号的密码。前者要防止自动类型推断改变身份，后者可能被命令参数解析影响。简单非敏感字符串可以按当前 CLI 帮助使用 `--set-string`；复杂配置优先用受控 values 文件并查看渲染结果。秘密值不能为了方便调试直接放命令行或打印到 CI 日志。文件也不是天然安全，发布记录、备份、制品保存目录都可能保留它。

`required` 与 `default` 使用空值语义，要求一个布尔开关“必须显式提供”时，不能简单用 `required`，否则有意设置的 false 也可能被拒绝。可以让模式校验要求该键存在且类型为布尔，再直接使用。另一方面，模式中声明 `properties` 并不自动让所有属性必填，必须同时声明 `required`。这两种常见误解都应通过反例测试，而不是只用正常值跑一次。[模板函数清单](https://helm.sh/docs/chart_template_guide/function_list/)提供语义依据，页面若提示尚未完全适配 Helm 4，涉及版本差异的行为继续以所用版本实测为准。

### 二、模板测试要包含边界输入与不出现的对象

前面的 schema 实验已经验证负数被拒绝，再加一组独立练习：正常轮渲染副本数二，边界轮渲染零与五，错误轮渲染字符串与六，最后恢复二。预期零和五在该课堂合同内合法，字符串和六失败。检查时既看命令退出码，也看 Deployment 的最终数值，不能只因为输出文件存在就判成功，因为失败命令也可能留下空文件或旧文件。

有条件分支的 Chart 要测试关闭功能时对象真的消失。例如入口关闭时应不生成 Ingress，相关注解与 Secret 引用也不应残留到别的对象；入口开启时应核对域名和服务端口。环境列表为空时应仍生成合法结构，而不是出现只有键没有正确值的错误清单。模板中未进入的分支也属于交付内容，长期不测试，往往会在首次启用新环境时才暴露。

这里不需要新增生产资源。把每轮输入和预期写进学习记录，使用现有实验 Chart 本地渲染，复验时对照对象种类、对象名、标签、镜像与数值类型。清理仅移除自己生成的渲染输出与错误输入文件，保留 Chart 和测试记录；不执行卸载来“清理”一个从未安装的 release。若失败结果与预测不一致，先确认命令确实读了同一个目录与同一份 schema。

### 三、升级参数必须表达你要继承什么

一次升级不只有“新包覆盖旧包”，还涉及是否继承上一次用户配置、是否采用新 Chart 默认值以及本次覆盖值。当前 Helm 提供重置、复用及组合行为的参数，准确语义应读[升级命令帮助](https://helm.sh/docs/helm/helm_upgrade/)。不要不经分析固定使用复用旧值：旧字段可能已废弃，新默认值可能包含必须的安全修复；也不要每次无脑重置，把生产的数据库地址等环境输入丢掉。

老师建议把环境输入显式保存在受控配置源，每次发布前生成完整对照：旧用户输入、新用户输入、旧渲染结果、新渲染结果。先解释为什么某字段改变，再允许交付。假设旧版默认探针路径是 `/health`，新版应用改成 `/ready`；若模板和值的升级不同步，新 Pod 能启动却一直不就绪。此时错误不在 Kubernetes 不稳定，而在应用契约与包合同没有一起演进。

容量也会隐藏在一次小更新里。滚动更新可能暂时同时运行新旧副本，资源请求、命名空间配额、节点可调度容量和卷挂载限制必须容纳这个过渡状态。最终只需要两个 Pod，不代表发布期间只需要两个 Pod 的资源。停止条件要监控无法调度、就绪失败和业务探针，不能无限延长超时等一个永远不满足的约束。

### 四、发布记录如何成为可用的事故证据

把一次 release 身份写成集群、命名空间、名称与修订号的组合。两个集群都有 `aiops-web`，仅按名称聚合事件会把预生产失败误报成生产事故。时间线还要记录客户端开始、API 接受、首个新 Pod 就绪、业务探针通过与最终结束；这些时刻之间的差值分别帮助定位渲染、控制面、调度与应用启动延迟。

发现失败时，先保留可安全读取的状态摘要，再获取必要详情。`helm get values --all` 和 manifest 可能包含秘密，默认全量转发给模型或工单是不合适的。采集程序应白名单选取镜像、资源请求、对象状态、脱敏错误与配置版本，遇到不认识字段先标记待人工检查。采集权限不足时输出“证据未覆盖”，不要用空结果声称对象不存在。

最后的设计追问是：既然有 Helm，为什么还要业务探针和人工批准？回答要落到责任边界：包工具知道 Kubernetes 资源及发布记录，不知道订单是否正确结算，也不能代替业务决定数据库迁移是否可逆。AIOps 可以缩短整理证据和发现异常的时间，批准、停止条件与不可逆操作仍必须有清晰责任人。能把这些边界写进一份 Chart 的交付说明，才具备从使用者走向平台维护者的能力。

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `aiops-web` Helm Chart。
- 一份 `helm template` 渲染输出。
- 一份 values 覆盖实验记录。
- 一份 `helm history` 和 `helm rollback` 记录。
- 一份安装失败或 ImagePullBackOff 的 Helm + Kubernetes 联合排障笔记。
- 一个 Helm release 诊断脚本，能采集 status、history、values、manifest 和 Kubernetes events。

## 本文验证边界

此前修订记录了 Helm 4.2.4、Helm 3 退役、SSA、参数核对及本机 CLI v4.1.3；这是历史记录，不代表本轮重新确认了安装版本。本轮只补强文档与静态检查，没有连接 Kubernetes 实验集群，因此没有声称 Helm 3→4、SSA ownership、坏镜像回滚或 CRD/数据库迁移已实跑。目标 Chart、plugin、CI wrapper 和 Operator 必须逐个在预生产环境验证。
