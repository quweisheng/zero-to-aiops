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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>deployment.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>configmap.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>ingress.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Chart</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Chart.yaml 描述包</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; values.yaml 提供默认配置</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; templates/ 放 Kubernetes YAML 模板</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; helm template 本地渲染</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; helm install 安装成 release</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; helm upgrade 生成新 revision</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; helm rollback 回到旧 revision 的配置</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Intro</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Helm 是什么</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 安装 Helm</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Using Helm</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Cheat Sheet</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>Topics</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; Charts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Chart Hooks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; Chart Repository</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; Registries</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; Plugins</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Provenance and Integrity</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 15 行 | <code>Chart Template Guide</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>  -&gt; Getting Started</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>  -&gt; Built-in Objects</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>  -&gt; Values Files</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>  -&gt; Functions and Pipelines</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>  -&gt; Flow Control</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>  -&gt; Variables</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; Named Templates</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; Files</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>  -&gt; NOTES.txt</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>  -&gt; Subcharts and Global Values</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>  -&gt; Debugging Templates</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>  -&gt; YAML Techniques</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 29 行 | <code>Helm Commands</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 30 行 | <code>  -&gt; helm create</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>  -&gt; helm lint</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>  -&gt; helm template</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>  -&gt; helm install</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>  -&gt; helm upgrade</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>  -&gt; helm rollback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>  -&gt; helm status</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <code>  -&gt; helm history</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 38 行 | <code>  -&gt; helm get</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 39 行 | <code>  -&gt; helm uninstall</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <code>  -&gt; helm repo</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 41 行 | <code>  -&gt; helm dependency</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 42 行 | <code>  -&gt; helm package</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 43 行 | <code>  -&gt; helm show</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


新手学习顺序建议：

```text
先学 Chart 是什么
  -> 再学 values 怎么传入
  -> 再学 template 怎么渲染
  -> 再学 release 怎么安装和升级
  -> 最后学 dependency、hook、repository
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先学 Chart 是什么</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再学 values 怎么传入</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 再学 template 怎么渲染</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 再学 release 怎么安装和升级</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 最后学 dependency、hook、repository</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Git 仓库</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Helm Chart</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; values-dev.yaml / values-prod.yaml</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; CI/CD</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; helm lint</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; helm template</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; helm upgrade --install</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; Kubernetes Deployment / Service / ConfigMap / Ingress</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Prometheus / Grafana / Alertmanager 观测</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm history aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm get values aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 4 行 | <code>helm get manifest aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 5 行 | <code>kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 6 行 | <code>kubectl get events -n aiops --sort-by=.lastTimestamp</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Chart 像安装包</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>values 像安装参数</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Release 像一次安装出来的应用实例</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Revision 像这个应用实例的发布历史</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


同一个 Chart 可以安装多次，生成多个 release：

```bash
helm install api-dev ./aiops-api -n dev
helm install api-prod ./aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install api-dev ./aiops-api -n dev</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm install api-prod ./aiops-api -n prod</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


它们使用同一个 Chart，但 release 名、namespace、values 可以不同。

## Helm 和 kubectl 的区别

`kubectl` 直接操作 Kubernetes 对象。

```bash
kubectl apply -f deployment.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl apply -f deployment.yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


Helm 先渲染 Chart，再操作 Kubernetes 对象，并记录 release 历史。

```bash
helm upgrade --install aiops-api ./chart -n aiops -f values-prod.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./chart -n aiops -f values-prod.yaml</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./chart -f values-prod.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 读取 Chart.yaml</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 读取 values.yaml</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 合并用户 values</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 渲染 templates/</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; 生成 Kubernetes manifests</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; 发送给 kube-apiserver</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; 创建 Deployment / Service / ConfigMap ...</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; 记录 release revision 1</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


一次 upgrade：

```text
helm upgrade aiops-api ./chart -f values-prod.yaml
  -> 重新合并 values
  -> 重新渲染 manifests
  -> 对比并更新 Kubernetes 对象
  -> 记录 release revision 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-api ./chart -f values-prod.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 重新合并 values</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 重新渲染 manifests</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 对比并更新 Kubernetes 对象</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 记录 release revision 2</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


一次 rollback：

```text
helm rollback aiops-api 1
  -> 找到 revision 1 的配置和 manifest
  -> 应用回集群
  -> 产生新的 revision
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api 1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 找到 revision 1 的配置和 manifest</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 应用回集群</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 产生新的 revision</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-api/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  Chart.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  values.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  templates/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    deployment.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    service.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>    ingress.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    configmap.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>    _helpers.tpl</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>    NOTES.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  charts/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>  crds/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>  templates/tests/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>  .helmignore</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm create aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: v2</code> | 设置 `apiVersion` 字段的值为 `v2`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>name: aiops-api</code> | 设置 `name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>description: A Helm chart for the AIOps demo API</code> | 设置 `description` 字段的值为 `A Helm chart for the AIOps demo API`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>type: application</code> | 设置 `type` 字段的值为 `application`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>version: 0.1.0</code> | 设置 `version` 字段的值为 `0.1.0`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>appVersion: "1.0.0"</code> | 设置 `appVersion` 字段的值为 `"1.0.0"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>replicaCount: 2</code> | 设置 `replicaCount` 字段的值为 `2`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>image:</code> | 定义 `image` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  repository: nginx</code> | 设置 `repository` 字段的值为 `nginx`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  tag: "1.25"</code> | 设置 `tag` 字段的值为 `"1.25"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  pullPolicy: IfNotPresent</code> | 设置 `pullPolicy` 字段的值为 `IfNotPresent`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  type: ClusterIP</code> | 设置 `type` 字段的值为 `ClusterIP`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  port: 80</code> | 设置 `port` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 12 行 | <code>resources:</code> | 定义 `resources` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>  requests:</code> | 定义 `requests` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    cpu: 50m</code> | 设置 `cpu` 字段的值为 `50m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>    memory: 64Mi</code> | 设置 `memory` 字段的值为 `64Mi`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>  limits:</code> | 定义 `limits` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    cpu: 200m</code> | 设置 `cpu` 字段的值为 `200m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>    memory: 128Mi</code> | 设置 `memory` 字段的值为 `128Mi`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


模板里用：

```yaml
replicas: {{ .Values.replicaCount }}
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>replicas: {{ .Values.replicaCount }}</code> | 设置 `replicas` 字段的值为 `{{ .Values.replicaCount }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"</code> | 设置 `image` 字段的值为 `"{{ .Values.image.repository }}:{{ .Values.image.tag }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Chart 内 values.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 父 Chart values</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; helm install/upgrade -f my-values.yaml</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; --set key=value</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; --set-string key=value</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; --set-file key=path</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


越靠后的优先级越高。

示例：

```bash
helm install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --set image.tag=1.0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -f values-prod.yaml \</code> | 执行 `-f` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  --set image.tag=1.0.1</code> | 注释行，提前说明下面命令的目的或注意事项。 |


`image.tag` 会使用 `1.0.1`。

排查 values 不生效：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
helm template aiops-api ./aiops-api -f values-prod.yaml --set image.tag=1.0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get values aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm get values aiops-api -n aiops --all</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>helm template aiops-api ./aiops-api -f values-prod.yaml --set image.tag=1.0.1</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: apps/v1</code> | 设置 `apiVersion` 字段的值为 `apps/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Deployment</code> | 设置 `kind` 字段的值为 `Deployment`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: {{ include "aiops-api.fullname" . }}</code> | 设置 `name` 字段的值为 `{{ include "aiops-api.fullname" . }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    {{- include "aiops-api.labels" . &#124; nindent 4 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  replicas: {{ .Values.replicaCount }}</code> | 设置 `replicas` 字段的值为 `{{ .Values.replicaCount }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  selector:</code> | 定义 `selector` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>    matchLabels:</code> | 定义 `matchLabels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      {{- include "aiops-api.selectorLabels" . &#124; nindent 6 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 12 行 | <code>  template:</code> | 定义 `template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>    metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>        {{- include "aiops-api.selectorLabels" . &#124; nindent 8 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 16 行 | <code>    spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>      containers:</code> | 定义 `containers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>        - name: api</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 19 行 | <code>          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"</code> | 设置 `image` 字段的值为 `"{{ .Values.image.repository }}:{{ .Values.image.tag }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>          ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>            - name: http</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>              containerPort: {{ .Values.service.port }}</code> | 设置 `containerPort` 字段的值为 `{{ .Values.service.port }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


Helm 模板基于 Go template，加上 Sprig 和 Helm 自己的内置对象/函数。

模板不是最终 YAML。最终 YAML 要用：

```bash
helm template aiops-api ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm template aiops-api ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.Release.Name</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>.Release.Namespace</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>.Release.Revision</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>.Release.Service</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>.Release.IsInstall</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>.Release.IsUpgrade</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`.Chart` 常用：

```text
.Chart.Name
.Chart.Version
.Chart.AppVersion
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.Chart.Name</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>.Chart.Version</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>.Chart.AppVersion</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`.Capabilities` 常用于根据集群版本或 API 是否存在生成不同 YAML。

## 常用模板函数

### default

给默认值：

```yaml
replicas: {{ .Values.replicaCount | default 1 }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>replicas: {{ .Values.replicaCount &#124; default 1 }}</code> | 设置 `replicas` 字段的值为 `{{ .Values.replicaCount | default 1 }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### quote

加引号：

```yaml
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app.kubernetes.io/version: {{ .Chart.AppVersion &#124; quote }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


### required

要求必须传值：

```yaml
image: {{ required "image.repository is required" .Values.image.repository }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>image: {{ required "image.repository is required" .Values.image.repository }}</code> | 设置 `image` 字段的值为 `{{ required "image.repository is required" .Values.image.repository }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


缺失时渲染失败，适合关键配置。

### toYaml

把对象转成 YAML：

```yaml
resources:
  {{- toYaml .Values.resources | nindent 12 }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resources:</code> | 定义 `resources` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  {{- toYaml .Values.resources &#124; nindent 12 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


### nindent

换行并缩进：

```yaml
labels:
  {{- include "aiops-api.labels" . | nindent 2 }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  {{- include "aiops-api.labels" . &#124; nindent 2 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


Helm 模板最容易出错的是缩进。`toYaml` + `nindent` 是高频组合。

### include

调用命名模板并返回字符串：

```yaml
name: {{ include "aiops-api.fullname" . }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: {{ include "aiops-api.fullname" . }}</code> | 设置 `name` 字段的值为 `{{ include "aiops-api.fullname" . }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{- if .Values.ingress.enabled }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>apiVersion: networking.k8s.io/v1</code> | 设置 `apiVersion` 字段的值为 `networking.k8s.io/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>kind: Ingress</code> | 设置 `kind` 字段的值为 `Ingress`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>{{- end }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


### with

改变作用域：

```yaml
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{- with .Values.nodeSelector }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>nodeSelector:</code> | 定义 `nodeSelector` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>  {{- toYaml . &#124; nindent 2 }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 4 行 | <code>{{- end }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


在 `with` 内，`.` 变成 `.Values.nodeSelector`。

### range

循环：

```yaml
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{- range .Values.env }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>- name: {{ .name }}</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>  value: {{ .value &#124; quote }}</code> | 设置 `value` 字段的值为 `{{ .value | quote }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>{{- end }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


注意作用域变化。如果需要根对象，可以用 `$`：

```yaml
{{- range .Values.extraLabels }}
{{ .name }}: {{ $.Release.Name | quote }}
{{- end }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{- range .Values.extraLabels }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>{{ .name }}: {{ $.Release.Name &#124; quote }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 3 行 | <code>{{- end }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{- define "aiops-api.name" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>{{- default .Chart.Name .Values.nameOverride &#124; trunc 63 &#124; trimSuffix "-" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 3 行 | <code>{{- end -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>{{- define "aiops-api.fullname" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>{{- if .Values.fullnameOverride -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>{{- .Values.fullnameOverride &#124; trunc 63 &#124; trimSuffix "-" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 8 行 | <code>{{- else -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 9 行 | <code>{{- printf "%s-%s" .Release.Name (include "aiops-api.name" .) &#124; trunc 63 &#124; trimSuffix "-" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 10 行 | <code>{{- end -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 11 行 | <code>{{- end -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>{{- define "aiops-api.labels" -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 14 行 | <code>helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version &#124; replace "+" "_" }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 15 行 | <code>app.kubernetes.io/name: {{ include "aiops-api.name" . }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 16 行 | <code>app.kubernetes.io/instance: {{ .Release.Name }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 17 行 | <code>app.kubernetes.io/managed-by: {{ .Release.Service }}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 18 行 | <code>{{- end -}}</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app.kubernetes.io/name: aiops-api</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 2 行 | <code>app.kubernetes.io/instance: aiops-api-prod</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 3 行 | <code>app.kubernetes.io/version: "1.0.0"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 4 行 | <code>app.kubernetes.io/managed-by: Helm</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>helm.sh/chart: aiops-api-0.1.0</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get all -n aiops -l app.kubernetes.io/instance=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


## Release 和 Revision

安装 Chart：

```bash
helm install aiops-api ./aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


生成 release：

```text
release name: aiops-api
namespace: aiops
revision: 1
status: deployed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>release name: aiops-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>namespace: aiops</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>revision: 1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>status: deployed</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


升级：

```bash
helm upgrade aiops-api ./aiops-api -n aiops --set image.tag=1.0.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-api ./aiops-api -n aiops --set image.tag=1.0.1</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


生成 revision 2。

查看历史：

```bash
helm history aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm history aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


查看状态：

```bash
helm status aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


回滚：

```bash
helm rollback aiops-api 1 -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api 1 -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


回滚本身会产生新的 revision。也就是说，history 会继续增长。

## install、upgrade、upgrade --install

安装：

```bash
helm install aiops-api ./aiops-api -n aiops --create-namespace
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api -n aiops --create-namespace</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


升级：

```bash
helm upgrade aiops-api ./aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-api ./aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


如果没有就安装，有就升级：

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./aiops-api \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -f values-prod.yaml \</code> | 执行 `-f` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  --wait \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --timeout 5m \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 6 行 | <code>  --atomic</code> | 注释行，提前说明下面命令的目的或注意事项。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm lint ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


本地渲染：

```bash
helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


模拟安装并输出调试：

```bash
helm install aiops-api ./aiops-api \
  -n aiops \
  -f values-prod.yaml \
  --dry-run \
  --debug
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -f values-prod.yaml \</code> | 执行 `-f` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  --dry-run \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --debug</code> | 注释行，提前说明下面命令的目的或注意事项。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get all aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


查看 values：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get values aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm get values aiops-api -n aiops --all</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


查看 manifest：

```bash
helm get manifest aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get manifest aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


查看 hooks：

```bash
helm get hooks aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get hooks aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


查看 notes：

```bash
helm get notes aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get notes aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>dependencies:</code> | 定义 `dependencies` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: redis</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    version: 19.0.0</code> | 设置 `version` 字段的值为 `19.0.0`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    repository: https://charts.bitnami.com/bitnami</code> | 设置 `repository` 字段的值为 `https://charts.bitnami.com/bitnami`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    condition: redis.enabled</code> | 设置 `condition` 字段的值为 `redis.enabled`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


更新依赖：

```bash
helm dependency update ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm dependency update ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


构建依赖目录：

```bash
helm dependency build ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm dependency build ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


依赖会进入：

```text
charts/
Chart.lock
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>charts/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Chart.lock</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis:</code> | 定义 `redis` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  architecture: standalone</code> | 设置 `architecture` 字段的值为 `standalone`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  auth:</code> | 定义 `auth` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    enabled: false</code> | 设置 `enabled` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


`global` values 可被子 Chart 读取：

```yaml
global:
  imageRegistry: registry.example.com
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  imageRegistry: registry.example.com</code> | 设置 `imageRegistry` 字段的值为 `registry.example.com`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: batch/v1</code> | 设置 `apiVersion` 字段的值为 `batch/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Job</code> | 设置 `kind` 字段的值为 `Job`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: "{{ include "aiops-api.fullname" . }}-pre-upgrade"</code> | 设置 `name` 字段的值为 `"{{ include "aiops-api.fullname" . }}-pre-upgrade"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    "helm.sh/hook": pre-upgrade</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 8 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  template:</code> | 定义 `template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>    spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      restartPolicy: Never</code> | 设置 `restartPolicy` 字段的值为 `Never`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>      containers:</code> | 定义 `containers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>        - name: migrate</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 14 行 | <code>          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"</code> | 设置 `image` 字段的值为 `"{{ .Values.image.repository }}:{{ .Values.image.tag }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>          command: ["sh", "-c", "echo run migration"]</code> | 设置 `command` 字段的值为 `["sh", "-c", "echo run migration"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>AIOps API has been installed.</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 3 行 | <code>Release: {{ .Release.Name }}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Namespace: {{ .Release.Namespace }}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>Run:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查看：

```bash
helm get notes aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get notes aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "$schema": "https://json-schema.org/schema#",</code> | 设置 `$schema` 字段，值是 `"https://json-schema.org/schema#"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "type": "object",</code> | 设置 `type` 字段，值是 `"object"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "properties": {</code> | 设置 `properties` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    "replicaCount": {</code> | 设置 `replicaCount` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>      "type": "integer",</code> | 设置 `type` 字段，值是 `"integer"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      "minimum": 1</code> | 设置 `minimum` 字段，值是 `1`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 9 行 | <code>    "image": {</code> | 设置 `image` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>      "type": "object",</code> | 设置 `type` 字段，值是 `"object"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>      "required": ["repository", "tag"]</code> | 设置 `required` 字段，值是 `["repository", "tag"]`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 13 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 14 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm repo add bitnami https://charts.bitnami.com/bitnami</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm repo update</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm search repo bitnami/nginx</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


拉取：

```bash
helm pull bitnami/nginx --untar
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm pull bitnami/nginx --untar</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


Helm 也支持 OCI registry：

```bash
helm registry login registry.example.com
helm push aiops-api-0.1.0.tgz oci://registry.example.com/charts
helm pull oci://registry.example.com/charts/aiops-api --version 0.1.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm registry login registry.example.com</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm push aiops-api-0.1.0.tgz oci://registry.example.com/charts</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm pull oci://registry.example.com/charts/aiops-api --version 0.1.0</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


入门阶段先会使用 repository；企业内部再考虑 OCI、签名、供应链治理。

## 常用命令字典

### 查看版本

```bash
helm version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm version</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


确认 Helm 客户端版本。

### 创建 Chart

```bash
helm create aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm create aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


生成脚手架。

### 检查 Chart

```bash
helm lint ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm lint ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


检查 Chart 是否有明显问题。

### 渲染模板

```bash
helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm template aiops-api ./aiops-api -n aiops -f values-prod.yaml</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


看最终 Kubernetes YAML。

### 安装

```bash
helm install aiops-api ./aiops-api -n aiops --create-namespace
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api -n aiops --create-namespace</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


创建 release。

### 安装前模拟

```bash
helm install aiops-api ./aiops-api -n aiops --dry-run --debug
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api -n aiops --dry-run --debug</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


调试安装输出。

### 升级

```bash
helm upgrade aiops-api ./aiops-api -n aiops -f values-prod.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-api ./aiops-api -n aiops -f values-prod.yaml</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


生成新 revision。

### 安装或升级

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./aiops-api -n aiops --create-namespace</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


CI/CD 常用。

### 等待资源 ready

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --wait --timeout 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./aiops-api -n aiops --wait --timeout 5m</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


等待资源达到就绪条件。

### 失败自动回滚

```bash
helm upgrade --install aiops-api ./aiops-api -n aiops --atomic --timeout 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./aiops-api -n aiops --atomic --timeout 5m</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


失败时回滚。适合生产发布，但仍要保存失败证据。

### 查看 release

```bash
helm list -n aiops
helm list -A
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm list -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm list -A</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 查看状态

```bash
helm status aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 查看历史

```bash
helm history aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm history aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 回滚

```bash
helm rollback aiops-api 1 -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api 1 -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 查看 values

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get values aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm get values aiops-api -n aiops --all</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 查看 manifest

```bash
helm get manifest aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get manifest aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 查看 hooks

```bash
helm get hooks aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get hooks aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 查看 notes

```bash
helm get notes aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get notes aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 卸载

```bash
helm uninstall aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm uninstall aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


注意：卸载会删除 release 管理的资源。PVC、CRD、hook 资源等行为要看 Chart 设计和 Kubernetes 回收策略。

### 打包

```bash
helm package ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm package ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


生成 `.tgz` Chart 包。

### 管理 repo

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm repo add bitnami https://charts.bitnami.com/bitnami</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm repo update</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm search repo nginx</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


### 管理依赖

```bash
helm dependency list ./aiops-api
helm dependency update ./aiops-api
helm dependency build ./aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm dependency list ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm dependency update ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm dependency build ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm create aiops-web</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-web/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  Chart.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  values.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  templates/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    deployment.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    service.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>    _helpers.tpl</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    NOTES.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>replicaCount: 2</code> | 设置 `replicaCount` 字段的值为 `2`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>image:</code> | 定义 `image` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  repository: nginx</code> | 设置 `repository` 字段的值为 `nginx`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  tag: "1.25"</code> | 设置 `tag` 字段的值为 `"1.25"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  pullPolicy: IfNotPresent</code> | 设置 `pullPolicy` 字段的值为 `IfNotPresent`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  type: ClusterIP</code> | 设置 `type` 字段的值为 `ClusterIP`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  port: 80</code> | 设置 `port` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 12 行 | <code>resources:</code> | 定义 `resources` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>  requests:</code> | 定义 `requests` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    cpu: 50m</code> | 设置 `cpu` 字段的值为 `50m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>    memory: 64Mi</code> | 设置 `memory` 字段的值为 `64Mi`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>  limits:</code> | 定义 `limits` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    cpu: 200m</code> | 设置 `cpu` 字段的值为 `200m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>    memory: 128Mi</code> | 设置 `memory` 字段的值为 `128Mi`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 3. 渲染检查

```bash
helm lint ./aiops-web
helm template aiops-web ./aiops-web -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm lint ./aiops-web</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm template aiops-web ./aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-web ./aiops-web \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --create-namespace \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --wait \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --timeout 5m</code> | 注释行，提前说明下面命令的目的或注意事项。 |


查看：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-web
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm history aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-web</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 5. 升级

```bash
helm upgrade aiops-web ./aiops-web \
  -n aiops \
  --set image.tag=1.26 \
  --wait \
  --timeout 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-web ./aiops-web \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --set image.tag=1.26 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --wait \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --timeout 5m</code> | 注释行，提前说明下面命令的目的或注意事项。 |


查看：

```bash
helm history aiops-web -n aiops
helm get values aiops-web -n aiops
helm get manifest aiops-web -n aiops | rg "image:"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm history aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm get values aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm get manifest aiops-web -n aiops &#124; rg "image:"</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


### 6. 回滚

```bash
helm rollback aiops-web 1 -n aiops --wait --timeout 5m
helm history aiops-web -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-web 1 -n aiops --wait --timeout 5m</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>helm history aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade aiops-web ./aiops-web \</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --set image.tag=not-exist \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --wait \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --timeout 2m</code> | 注释行，提前说明下面命令的目的或注意事项。 |


排查：

```bash
helm status aiops-web -n aiops
helm history aiops-web -n aiops
kubectl get pods -n aiops -l app.kubernetes.io/instance=aiops-web
kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-web
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm history aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>kubectl get pods -n aiops -l app.kubernetes.io/instance=aiops-web</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 4 行 | <code>kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-web</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


你应该能看到 ImagePullBackOff 相关事件。

### 8. 清理

```bash
helm uninstall aiops-web -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm uninstall aiops-web -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>--set image.tag=1.0.1</code> | 注释行，提前说明下面命令的目的或注意事项。 |


但 Pod 仍然使用旧镜像。

按顺序查：

```bash
helm get values aiops-api -n aiops
helm get values aiops-api -n aiops --all
helm get manifest aiops-api -n aiops | rg "image:"
helm template aiops-api ./aiops-api -n aiops --set image.tag=1.0.1 | rg "image:"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm get values aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm get values aiops-api -n aiops --all</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>helm get manifest aiops-api -n aiops &#124; rg "image:"</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 4 行 | <code>helm template aiops-api ./aiops-api -n aiops --set image.tag=1.0.1 &#124; rg "image:"</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm install aiops-api ./aiops-api -n aiops --dry-run --debug</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>helm lint ./aiops-api</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm template aiops-api ./aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


如果本地渲染正常，再看集群：

```bash
helm status aiops-api -n aiops
kubectl get events -n aiops --sort-by=.lastTimestamp
kubectl get all -n aiops -l app.kubernetes.io/instance=aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>kubectl get events -n aiops --sort-by=.lastTimestamp</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>kubectl get all -n aiops -l app.kubernetes.io/instance=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm status aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 2 行 | <code>helm history aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |
| 第 3 行 | <code>helm get values aiops-api -n aiops --all</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>helm get manifest aiops-api -n aiops</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


再看 Kubernetes 维度：

```bash
kubectl rollout status deployment/aiops-api -n aiops
kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-api
kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-api
kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --tail=200
kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --previous --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout status deployment/aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl get deploy,rs,pod,svc -n aiops -l app.kubernetes.io/instance=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl describe pod -n aiops -l app.kubernetes.io/instance=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 4 行 | <code>kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 5 行 | <code>kubectl logs -n aiops -l app.kubernetes.io/instance=aiops-api --previous --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


如果要回滚：

```bash
helm rollback aiops-api <good-revision> -n aiops --wait --timeout 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api &lt;good-revision&gt; -n aiops --wait --timeout 5m</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>release="${1:-aiops-api}"</code> | 执行 `release="${1:-aiops-api}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>ns="${2:-aiops}"</code> | 执行 `ns="${2:-aiops}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo "== helm status =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>helm status "$release" -n "$ns" &#124;&#124; true</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 10 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>echo "== helm history =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 12 行 | <code>helm history "$release" -n "$ns" &#124;&#124; true</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 13 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 14 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>echo "== helm values all =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>helm get values "$release" -n "$ns" --all &#124;&#124; true</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 17 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 18 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 19 行 | <code>echo "== helm manifest =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 20 行 | <code>helm get manifest "$release" -n "$ns" &#124;&#124; true</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 21 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 22 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>echo "== kubernetes objects =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 24 行 | <code>kubectl get all -n "$ns" -l "app.kubernetes.io/instance=$release" -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 25 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 26 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 27 行 | <code>echo "== events =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 28 行 | <code>kubectl get events -n "$ns" --sort-by=.lastTimestamp &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


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
