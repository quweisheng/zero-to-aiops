# Terraform

> 目标：能理解 Terraform 为什么是基础设施即代码工具，能讲清 configuration、provider、resource、data source、variables、outputs、state、backend、workspace、plan、apply、destroy、modules、meta-arguments、lifecycle、drift 和 import，能写一个最小配置，并能排查 init 失败、plan 要删除资源、state 冲突、漂移和 provider 认证问题。

## 官方资料

- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform language documentation](https://developer.hashicorp.com/terraform/language)
- [Terraform CLI commands](https://developer.hashicorp.com/terraform/cli/commands)
- [Terraform state](https://developer.hashicorp.com/terraform/language/state)
- [Terraform backends](https://developer.hashicorp.com/terraform/language/backend)
- [Providers](https://developer.hashicorp.com/terraform/language/providers)
- [Resource block reference](https://developer.hashicorp.com/terraform/language/block/resource)
- [Data sources](https://developer.hashicorp.com/terraform/language/data-sources)
- [Meta-arguments](https://developer.hashicorp.com/terraform/language/meta-arguments)
- [depends_on reference](https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on)
- [Input variables](https://developer.hashicorp.com/terraform/language/values/variables)
- [Output values](https://developer.hashicorp.com/terraform/language/values/outputs)
- [Modules](https://developer.hashicorp.com/terraform/language/modules)
- [Style guide](https://developer.hashicorp.com/terraform/language/style)
- [terraform plan command](https://developer.hashicorp.com/terraform/cli/commands/plan)
- [Refresh-only mode](https://developer.hashicorp.com/terraform/tutorials/state/refresh)

说明：本文基于 HashiCorp Terraform 官方文档整理，是原创中文教程，不复制官方全文。Terraform 生态有 Terraform CLI、HCP Terraform、Terraform Enterprise、providers、modules 等不同层次；本文聚焦开源 Terraform CLI 和语言核心。

## 场景开场

你需要给 AIOps 平台创建这些基础设施：

- 一组云服务器。
- 一个安全组。
- 一个对象存储 bucket。
- 一个 Kubernetes 集群。
- 一组 DNS 记录。
- 一套监控告警资源。

手工点控制台可以创建一次，但很快会出问题：

- 谁知道现在云上真实配置是什么？
- staging 和 prod 差异在哪里？
- 改安全组会影响哪些资源？
- 这次变更会创建、修改、删除什么？
- 别人在控制台手动改了，代码怎么发现？
- state 文件丢了怎么办？
- 多个人同时 apply 怎么办？
- 生产误删资源怎么避免？

Terraform 解决的是“把基础设施目标状态写成代码，用 plan 预览差异，用 apply 执行变更，并用 state 记录 Terraform 管理的现实资源映射”。

## 一句话人话版

Terraform 是基础设施即代码工具：你用 HCL 写期望的云资源和配置，Terraform 通过 provider 调用云厂商/API，读取 state 和真实基础设施，生成 plan 告诉你要增删改什么，确认后 apply 执行，并更新 state。

## 学习边界

入门 Terraform 先抓这条链：

```text
.tf configuration
  -> terraform init 下载 provider
  -> terraform validate / fmt
  -> terraform plan 读取 state 和真实资源
  -> execution plan
  -> terraform apply 调 provider API
  -> 创建/修改/删除真实资源
  -> 更新 terraform.tfstate 或 remote state
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.tf configuration</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; terraform init 下载 provider</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; terraform validate / fmt</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; terraform plan 读取 state 和真实资源</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; execution plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; terraform apply 调 provider API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; 创建/修改/删除真实资源</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; 更新 terraform.tfstate 或 remote state</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


第一阶段必须掌握：

- HCL 基本语法。
- provider 是什么。
- resource 和 data source 的区别。
- variables、locals、outputs。
- state 为什么是核心。
- backend 和 state locking。
- plan/apply/destroy。
- dependency graph。
- `count`、`for_each`、`depends_on`、`lifecycle`。
- modules。
- workspaces 基本概念。
- import。
- drift 和 refresh-only。
- 常用命令：`init`、`fmt`、`validate`、`plan`、`apply`、`destroy`、`show`、`state`、`import`、`output`。

暂时可以先不深挖：

- Provider SDK 开发。
- Terraform Cloud/Enterprise policy sets。
- Sentinel/OPA 策略治理全套。
- 大规模 mono-repo/多账户平台工程。
- 复杂 module registry 发布。
- CDKTF。
- OpenTofu 分叉差异。

## 官方知识地图

Terraform 官方资料可按这些模块读：

```text
Terraform CLI
  -> init
  -> validate
  -> fmt
  -> plan
  -> apply
  -> destroy
  -> output
  -> show
  -> state
  -> import
  -> providers
  -> workspace

Terraform Language
  -> configuration syntax
  -> terraform block
  -> provider block
  -> resource block
  -> data block
  -> variable block
  -> output block
  -> locals
  -> modules
  -> expressions
  -> functions
  -> meta-arguments

State
  -> state file
  -> resource addressing
  -> state locking
  -> backends
  -> refresh
  -> drift
  -> import

Providers
  -> provider source
  -> provider version
  -> provider configuration
  -> provider authentication
  -> provider registry docs

Modules
  -> root module
  -> child module
  -> module source
  -> inputs
  -> outputs
  -> versioning
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Terraform CLI</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; init</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; validate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; fmt</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; apply</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; destroy</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; output</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; show</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; state</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; import</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; providers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; workspace</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 15 行 | <code>Terraform Language</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>  -&gt; configuration syntax</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>  -&gt; terraform block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>  -&gt; provider block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>  -&gt; resource block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>  -&gt; data block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>  -&gt; variable block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; output block</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; locals</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>  -&gt; modules</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>  -&gt; expressions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>  -&gt; functions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>  -&gt; meta-arguments</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 29 行 | <code>State</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 30 行 | <code>  -&gt; state file</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>  -&gt; resource addressing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>  -&gt; state locking</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>  -&gt; backends</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>  -&gt; refresh</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>  -&gt; drift</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>  -&gt; import</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 38 行 | <code>Providers</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 39 行 | <code>  -&gt; provider source</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <code>  -&gt; provider version</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 41 行 | <code>  -&gt; provider configuration</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 42 行 | <code>  -&gt; provider authentication</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 43 行 | <code>  -&gt; provider registry docs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 44 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 45 行 | <code>Modules</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 46 行 | <code>  -&gt; root module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 47 行 | <code>  -&gt; child module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 48 行 | <code>  -&gt; module source</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 49 行 | <code>  -&gt; inputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 50 行 | <code>  -&gt; outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 51 行 | <code>  -&gt; versioning</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


学习顺序：

```text
先懂 resource 和 provider
  -> 再懂 state 和 plan
  -> 再懂 variables/outputs
  -> 再懂 modules
  -> 再懂 backend/locking
  -> 最后学 import、drift、lifecycle 和团队协作
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先懂 resource 和 provider</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再懂 state 和 plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 再懂 variables/outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 再懂 modules</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 再懂 backend/locking</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; 最后学 import、drift、lifecycle 和团队协作</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## Terraform 在 AIOps 链路中的位置

Terraform 是 AIOps 的基础设施声明和变更治理工具。

```text
Git
  -> Terraform configuration
  -> CI plan
  -> 人工审批
  -> terraform apply
  -> 云资源 / Kubernetes / DNS / IAM / 监控资源
  -> Prometheus / Grafana / Alertmanager 观测
  -> drift detection / change correlation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Git</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Terraform configuration</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; CI plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 人工审批</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; terraform apply</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; 云资源 / Kubernetes / DNS / IAM / 监控资源</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Prometheus / Grafana / Alertmanager 观测</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; drift detection / change correlation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


在 AIOps 中，Terraform 常用于：

- 创建监控基础设施。
- 管理云资源。
- 管理安全组和网络。
- 管理 DNS。
- 管理 Grafana/Alertmanager/云告警资源。
- 记录基础设施变更历史。
- 把告警和变更关联起来。

重要原则：

```text
Terraform 适合声明基础设施期望状态
不适合做高频实时修复动作
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Terraform 适合声明基础设施期望状态</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>不适合做高频实时修复动作</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


比如“磁盘满了清理日志”更适合 Ansible/runbook；“为日志系统创建对象存储 bucket 和权限”适合 Terraform。

## Terraform 是什么

Terraform 是 Infrastructure as Code 工具。它使用配置文件描述基础设施资源，并通过 providers 管理外部平台。

核心词：

| 概念 | 含义 |
|---|---|
| configuration | `.tf` 文件里的期望状态 |
| provider | 对接外部 API 的插件 |
| resource | Terraform 管理的基础设施对象 |
| data source | 读取外部已有信息 |
| state | Terraform 记录资源映射和元数据的状态 |
| plan | 变更预览 |
| apply | 执行变更 |
| module | 可复用配置单元 |

Terraform 不是：

- 配置管理 agent。
- Shell 脚本执行器。
- 应用部署系统本身。
- 监控系统。
- 云资源真实状态的唯一来源。

它的核心是：

```text
配置 + 状态 + Provider API -> 差异计划 -> 执行并更新状态
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>配置 + 状态 + Provider API -&gt; 差异计划 -&gt; 执行并更新状态</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## HCL 基础

Terraform 使用 HCL。

基本块结构：

```text
resource "local_file" "hello" {
  filename = "${path.module}/hello.txt"
  content  = "hello aiops"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "hello" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  filename = "${path.module}/hello.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  content  = "hello aiops"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


解释：

| 部分 | 含义 |
|---|---|
| `resource` | block type |
| `"local_file"` | resource type |
| `"hello"` | local name |
| `{ ... }` | block body |
| `filename`、`content` | arguments |

引用：

```text
local_file.hello.filename
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>local_file.hello.filename</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


注释：

```text
# 单行注释
// 单行注释
/*
多行注释
*/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 单行注释</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>// 单行注释</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>/*</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>多行注释</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>*/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


格式化：

```bash
terraform fmt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform fmt</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## Terraform block

`terraform` block 配置 Terraform 自身要求。

```text
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  required_version = "&gt;= 1.6.0"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>  required_providers {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    local = {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      source  = "hashicorp/local"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>      version = "~&gt; 2.5"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


字段：

| 字段 | 含义 |
|---|---|
| `required_version` | Terraform CLI 版本约束 |
| `required_providers` | provider 来源和版本约束 |
| `backend` | state 后端配置 |

版本约束很重要。团队里不同 Terraform/provider 版本可能生成不同 plan。

## Providers

Provider 是 Terraform 对接外部系统的插件。

例如：

- `hashicorp/aws`。
- `hashicorp/azurerm`。
- `hashicorp/google`。
- `hashicorp/kubernetes`。
- `grafana/grafana`。
- `hashicorp/local`。

配置 provider：

```text
provider "aws" {
  region = "us-east-1"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>provider "aws" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  region = "us-east-1"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Provider 负责：

- 定义资源类型。
- 定义 data sources。
- 调用外部 API。
- 读取真实资源。
- 创建/更新/删除资源。

初始化下载 provider：

```bash
terraform init
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


Provider 认证通常通过：

- 环境变量。
- 配置文件。
- instance role。
- provider block。
- HCP Terraform variable。

不要把 access key 明文写进 `.tf` 提交 Git。

## Resources

Resource 是 Terraform 管理的对象。

本地文件示例：

```text
resource "local_file" "runbook" {
  filename = "${path.module}/runbook.txt"
  content  = "AIOps runbook"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "runbook" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  filename = "${path.module}/runbook.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  content  = "AIOps runbook"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


云资源示意：

```text
resource "aws_s3_bucket" "logs" {
  bucket = "aiops-prod-logs"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "aws_s3_bucket" "logs" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  bucket = "aiops-prod-logs"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Resource address：

```text
local_file.runbook
aws_s3_bucket.logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>local_file.runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>aws_s3_bucket.logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Terraform state 用 address 映射真实资源。

如果你改了 resource local name：

```text
aws_s3_bucket.logs -> aws_s3_bucket.aiops_logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aws_s3_bucket.logs -&gt; aws_s3_bucket.aiops_logs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


Terraform 可能认为旧资源删除、新资源创建。需要理解 moved blocks 或 state mv 等迁移方式。

## Data sources

Data source 读取外部已有信息，不创建资源。

示例：

```text
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  owners = ["099720109477"]
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>data "aws_ami" "ubuntu" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  most_recent = true</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>  filter {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    name   = "name"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 9 行 | <code>  owners = ["099720109477"]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


引用：

```text
data.aws_ami.ubuntu.id
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>data.aws_ami.ubuntu.id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


区别：

| 类型 | 是否管理生命周期 | 用途 |
|---|---|---|
| resource | 是 | 创建/修改/删除资源 |
| data source | 否 | 查询已有数据 |

不要用 data source 以为 Terraform 会管理那个对象。

## Variables

变量让配置可复用。

```text
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "instance_count" {
  type    = number
  default = 1
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>variable "environment" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  description = "Deployment environment"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  type        = string</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  default     = "dev"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>variable "instance_count" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  type    = number</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  default = 1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


使用：

```text
name = "aiops-${var.environment}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name = "aiops-${var.environment}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


传值方式：

- `terraform.tfvars`。
- `*.auto.tfvars`。
- `-var`。
- `-var-file`。
- 环境变量 `TF_VAR_name`。

示例：

```bash
terraform plan -var="environment=prod"
terraform plan -var-file="prod.tfvars"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan -var="environment=prod"</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform plan -var-file="prod.tfvars"</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## Locals

locals 用于在配置内定义计算值。

```text
locals {
  name_prefix = "aiops-${var.environment}"
  common_tags = {
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>locals {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  name_prefix = "aiops-${var.environment}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  common_tags = {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    ManagedBy   = "Terraform"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    Environment = var.environment</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


使用：

```text
name = "${local.name_prefix}-logs"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name = "${local.name_prefix}-logs"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


locals 不用于外部传参，而是配置内部复用。

## Outputs

Output 输出 apply 后的重要值。

```text
output "runbook_file" {
  description = "Generated runbook file path"
  value       = local_file.runbook.filename
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>output "runbook_file" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  description = "Generated runbook file path"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  value       = local_file.runbook.filename</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查看：

```bash
terraform output
terraform output runbook_file
terraform output -json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform output</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform output runbook_file</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform output -json</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


敏感输出：

```text
output "password" {
  value     = random_password.db.result
  sensitive = true
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>output "password" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  value     = random_password.db.result</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  sensitive = true</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


注意：sensitive 只是隐藏 CLI 输出，不代表 state 里没有。State 仍需安全保护。

## State 是什么

State 是 Terraform 的核心。

官方文档强调，Terraform 必须存储 state，用来把真实资源映射到配置、追踪元数据，并提升大规模基础设施性能。

State 记录：

- resource address。
- 真实资源 ID。
- 属性。
- 依赖元数据。
- provider 信息。

默认本地 state：

```text
terraform.tfstate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform.tfstate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查看：

```bash
terraform show
terraform state list
terraform state show local_file.runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform show</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform state list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform state show local_file.runbook</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


重要原则：

- 不要手工编辑 state。
- 不要把包含敏感信息的 state 随便提交 Git。
- 团队协作要用 remote backend 和 locking。
- state 丢失会让 Terraform 不知道哪些资源由它管理。

## Backend

Backend 决定 state 存在哪里。

本地默认：

```text
terraform.tfstate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform.tfstate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


远程 backend 示例：

```text
terraform {
  backend "s3" {
    bucket = "aiops-terraform-state"
    key    = "prod/network/terraform.tfstate"
    region = "us-east-1"
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  backend "s3" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    bucket = "aiops-terraform-state"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    key    = "prod/network/terraform.tfstate"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    region = "us-east-1"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


远程 backend 价值：

- 团队共享 state。
- 支持 locking。
- 减少 state 丢失。
- 便于审计和备份。

backend 配置变更后：

```bash
terraform init -migrate-state
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init -migrate-state</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## Plan 和 Apply

Plan 预览变更：

```bash
terraform plan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


官方文档说明 `terraform plan` 会创建 execution plan，让你预览 Terraform 将对基础设施做的变更。

Apply 执行：

```bash
terraform apply
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform apply</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


推荐生产流程：

```bash
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform fmt -check</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform validate</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform plan -out=tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 4 行 | <code>terraform show tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 5 行 | <code>terraform apply tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


不要无脑 `terraform apply -auto-approve`，除非在有审批和保护的自动化环境里。

## Dependency graph

Terraform 根据引用关系自动推断依赖。

```text
resource "local_file" "config" {
  filename = "${path.module}/config.txt"
  content  = "hello"
}

resource "local_file" "copy" {
  filename = "${path.module}/copy.txt"
  content  = local_file.config.content
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "config" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  filename = "${path.module}/config.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  content  = "hello"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>resource "local_file" "copy" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  filename = "${path.module}/copy.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  content  = local_file.config.content</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`copy` 引用了 `config`，Terraform 知道依赖。

显式依赖：

```text
resource "null_resource" "reload" {
  depends_on = [local_file.config]
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "null_resource" "reload" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  depends_on = [local_file.config]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


官方建议只在 Terraform 无法自动推断隐藏依赖时使用 `depends_on`。不要到处写，容易让 plan 变保守、依赖图混乱。

查看图：

```bash
terraform graph
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform graph</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## Meta-arguments

Meta-arguments 是 Terraform 语言内置控制资源行为的参数。

常见：

| meta-argument | 作用 |
|---|---|
| `depends_on` | 显式依赖 |
| `count` | 创建多个相似实例 |
| `for_each` | 按 map/set 创建多个实例 |
| `provider` | 指定 provider 配置 |
| `lifecycle` | 控制创建/销毁行为 |

### count

```text
resource "local_file" "note" {
  count    = 3
  filename = "${path.module}/note-${count.index}.txt"
  content  = "note ${count.index}"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "note" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  count    = 3</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  filename = "${path.module}/note-${count.index}.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  content  = "note ${count.index}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


地址：

```text
local_file.note[0]
local_file.note[1]
local_file.note[2]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>local_file.note[0]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>local_file.note[1]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>local_file.note[2]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### for_each

```text
resource "local_file" "service" {
  for_each = toset(["api", "worker", "scheduler"])

  filename = "${path.module}/${each.key}.txt"
  content  = each.key
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "service" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  for_each = toset(["api", "worker", "scheduler"])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>  filename = "${path.module}/${each.key}.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  content  = each.key</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


地址：

```text
local_file.service["api"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>local_file.service["api"]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


经验：资源集合有稳定 key 时，`for_each` 往往比 `count` 更稳。

## Lifecycle

`lifecycle` 控制资源生命周期行为。

```text
resource "aws_instance" "api" {
  ami           = var.ami
  instance_type = "t3.micro"

  lifecycle {
    prevent_destroy = true
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "aws_instance" "api" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ami           = var.ami</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  instance_type = "t3.micro"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 5 行 | <code>  lifecycle {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    prevent_destroy = true</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见：

| lifecycle | 作用 |
|---|---|
| `prevent_destroy` | 阻止销毁 |
| `create_before_destroy` | 先创建新资源再销毁旧资源 |
| `ignore_changes` | 忽略某些属性变化 |
| `replace_triggered_by` | 某变化触发替换 |

谨慎使用：

- `ignore_changes` 可能掩盖漂移。
- `prevent_destroy` 会阻止误删，但也可能阻塞合理变更。
- `create_before_destroy` 需要资源名/配额允许并存。

## Modules

Module 是 Terraform 配置的可复用单元。

Root module 是当前目录。

Child module：

```text
module "network" {
  source = "./modules/network"

  environment = var.environment
  cidr_block  = "10.0.0.0/16"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>module "network" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  source = "./modules/network"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>  environment = var.environment</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  cidr_block  = "10.0.0.0/16"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


模块结构：

```text
modules/
  network/
    main.tf
    variables.tf
    outputs.tf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>modules/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  network/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    main.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    variables.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    outputs.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


模块价值：

- 复用。
- 标准化。
- 降低重复。
- 隐藏复杂细节。

模块风险：

- 输入过多，变成黑盒。
- 不做版本管理。
- 输出不清晰。
- 在模块里硬编码环境。

## Workspaces

Terraform CLI workspaces 让同一配置有多个 state。

```bash
terraform workspace list
terraform workspace new dev
terraform workspace select prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform workspace list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform workspace new dev</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform workspace select prod</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


引用：

```text
terraform.workspace
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform.workspace</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


注意：CLI workspaces 不是所有环境隔离问题的万能答案。生产环境经常会使用目录隔离、backend key 隔离、不同账号/项目隔离等方式。

新手不要把 dev/prod 都混在一个配置里靠 workspace 魔法解决。先明确 state 边界和权限边界。

## Drift 漂移

Drift 是真实基础设施和 Terraform state/config 不一致。

原因：

- 人在控制台手动改了。
- 其他系统改了。
- Provider 默认值变化。
- 资源被外部删除。

Terraform plan/apply 会隐式 refresh 真实状态。也可以使用 refresh-only 模式同步 state 而不修改基础设施：

```bash
terraform plan -refresh-only
terraform apply -refresh-only
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan -refresh-only</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform apply -refresh-only</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


注意：

- refresh-only 是同步 state，不是修基础设施到配置。
- 看到 drift 后要判断：接受现实变化，还是用配置改回去。

## Import

Import 把已有资源纳入 Terraform state。

流程：

1. 先写 resource block。
2. 执行 import。
3. plan 对齐配置和真实资源。

示例：

```text
resource "aws_s3_bucket" "logs" {
  bucket = "existing-aiops-logs"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "aws_s3_bucket" "logs" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  bucket = "existing-aiops-logs"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


导入：

```bash
terraform import aws_s3_bucket.logs existing-aiops-logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform import aws_s3_bucket.logs existing-aiops-logs</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


导入后一定：

```bash
terraform plan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


看 Terraform 是否还想改资源。Import 只是建立 state 映射，不会自动帮你写完整配置。

## Provisioners

Terraform 有 provisioners，但官方和社区通常建议把它作为最后手段。

原因：

- 不容易幂等。
- 错误恢复复杂。
- 和资源生命周期耦合。
- 更适合配置管理工具的事情会被塞进 Terraform。

如果你想在服务器上安装包、改配置、重启服务，通常 Ansible 更合适。

Terraform 负责创建服务器，Ansible 负责配置服务器，是常见分工。

## 文件组织

小项目：

```text
main.tf
variables.tf
outputs.tf
versions.tf
terraform.tfvars
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>main.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>variables.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>outputs.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>versions.tf</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>terraform.tfvars</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见职责：

| 文件 | 作用 |
|---|---|
| `versions.tf` | Terraform/provider 版本 |
| `main.tf` | 主要资源 |
| `variables.tf` | 输入变量 |
| `outputs.tf` | 输出 |
| `providers.tf` | provider 配置 |
| `terraform.tfvars` | 默认变量值 |

不要把 secret 放进 tfvars 提交 Git。

## 常用命令字典

### 查看版本

```bash
terraform version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform version</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 格式化

```bash
terraform fmt
terraform fmt -check
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform fmt</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform fmt -check</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 初始化

```bash
terraform init
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


下载 providers，初始化 backend 和 modules。

### 校验

```bash
terraform validate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform validate</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


检查配置语法和内部一致性。

### 计划

```bash
terraform plan
terraform plan -out=tfplan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform plan -out=tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


预览变更。

### 查看 plan

```bash
terraform show tfplan
terraform show -json tfplan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform show tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform show -json tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 执行

```bash
terraform apply
terraform apply tfplan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform apply</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform apply tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 销毁

```bash
terraform destroy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform destroy</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


生产慎用。

### 查看输出

```bash
terraform output
terraform output -json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform output</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform output -json</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 查看 state

```bash
terraform state list
terraform state show <address>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform state list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform state show &lt;address&gt;</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 移动 state 地址

```bash
terraform state mv old.address new.address
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform state mv old.address new.address</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


重命名资源时可能用到。执行前备份 state。

### 从 state 移除

```bash
terraform state rm <address>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform state rm &lt;address&gt;</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


只从 state 移除，不删除真实资源。非常危险，要确认目的。

### 导入

```bash
terraform import <address> <id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform import &lt;address&gt; &lt;id&gt;</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 替换资源

`terraform taint` 已被官方标记为 deprecated，推荐：

```bash
terraform apply -replace=<address>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform apply -replace=&lt;address&gt;</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 工作区

```bash
terraform workspace list
terraform workspace new dev
terraform workspace select dev
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform workspace list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform workspace new dev</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform workspace select dev</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## AIOps 入门实验

目标：用 Terraform 创建本地文件，理解 init、plan、apply、state、output、drift。

### 1. 写配置

`versions.tf`：

```text
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  required_version = "&gt;= 1.6.0"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>  required_providers {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    local = {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      source  = "hashicorp/local"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>      version = "~&gt; 2.5"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`variables.tf`：

```text
variable "service_name" {
  type        = string
  description = "AIOps service name"
  default     = "aiops-api"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>variable "service_name" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  type        = string</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  description = "AIOps service name"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  default     = "aiops-api"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`main.tf`：

```text
resource "local_file" "runbook" {
  filename = "${path.module}/generated-runbook.txt"
  content  = "Runbook for ${var.service_name}"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource "local_file" "runbook" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  filename = "${path.module}/generated-runbook.txt"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  content  = "Runbook for ${var.service_name}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`outputs.tf`：

```text
output "runbook_path" {
  value = local_file.runbook.filename
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>output "runbook_path" {</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  value = local_file.runbook.filename</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 2. 执行

```bash
terraform init
terraform fmt
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
terraform output
terraform state list
terraform state show local_file.runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>terraform fmt</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 3 行 | <code>terraform validate</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 4 行 | <code>terraform plan -out=tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 5 行 | <code>terraform apply tfplan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 6 行 | <code>terraform output</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 7 行 | <code>terraform state list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 8 行 | <code>terraform state show local_file.runbook</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


### 3. 观察 state

```bash
terraform show
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform show</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


记录：

```text
resource address:
resource id:
output:
文件真实内容:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resource address:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>resource id:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>output:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>文件真实内容:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 4. 制造 drift

手工改 `generated-runbook.txt` 内容。

然后：

```bash
terraform plan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


观察 Terraform 是否计划把内容改回配置声明的值。

### 5. 清理

```bash
terraform destroy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform destroy</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| init 失败 | provider/backend 日志 | 网络、registry、版本约束、backend 认证 | 查 required_providers 和代理 |
| validate 失败 | 错误行 | HCL 语法、变量类型、引用错 | `terraform fmt` + validate |
| plan 要删除很多资源 | state/address | resource 重命名、backend 错、workspace 错 | 先停，查 state list 和 backend |
| apply 认证失败 | provider auth | 环境变量/role/key 错 | 查 provider 文档和 env |
| state lock | backend lock | 其他 apply 中断 | 确认后 unlock |
| drift | plan 输出 | 控制台手动改 | 决定接收还是改回 |
| import 后仍要改 | config 不完整 | 配置没匹配真实资源 | 补齐配置 |
| destroy 被阻止 | lifecycle | prevent_destroy | 确认风险后调整 |
| 循环创建不稳 | count | 列表顺序变化 | 用 for_each 稳定 key |
| secret 泄露 | state/tfvars | secret 写入 state | 保护 backend，不提交敏感文件 |

## 排障流程：plan 显示要删除很多资源

第一反应：不要 apply。

检查当前 workspace：

```bash
terraform workspace show
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform workspace show</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


检查 backend：

```bash
terraform init
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


检查 state：

```bash
terraform state list
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform state list</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


检查是否改了 resource address：

```text
aws_s3_bucket.logs
变成
aws_s3_bucket.aiops_logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aws_s3_bucket.logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>变成</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>aws_s3_bucket.aiops_logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果是重命名，要使用 moved block 或 state mv，而不是让 Terraform 删除重建。

检查是否换了 backend key、环境变量、账号、region。

## 排障流程：init 失败

```bash
terraform init -upgrade
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform init -upgrade</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


看错误：

- provider registry 无法访问。
- provider 版本约束冲突。
- backend 认证失败。
- backend bucket/key 不存在。
- 代理或证书问题。

检查：

```bash
terraform version
cat versions.tf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform version</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 2 行 | <code>cat versions.tf</code> | 打印文件内容，用来检查配置或日志片段。 |


企业网络可能需要配置 provider mirror 或代理。

## 排障流程：state 冲突和锁

远程 backend 通常有锁。

如果看到 lock：

1. 确认是否有人正在 apply。
2. 查 CI/CD 是否有运行中的 job。
3. 如果确认是残留锁，再按 backend 文档处理 unlock。

Terraform 有：

```bash
terraform force-unlock <LOCK_ID>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform force-unlock &lt;LOCK_ID&gt;</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


但这是危险操作。不要在不知道谁持锁时强制解锁。

## 排障流程：drift

查看 drift：

```bash
terraform plan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


只同步 state：

```bash
terraform plan -refresh-only
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan -refresh-only</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


判断：

- 手工改动是否应该纳入代码？
- 如果应该，修改 `.tf`。
- 如果不应该，apply 把资源改回代码期望。
- 如果资源已不该由 Terraform 管，考虑 state rm，但要谨慎。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "== version =="
terraform version

echo
echo "== fmt =="
terraform fmt -check -recursive

echo
echo "== validate =="
terraform validate

echo
echo "== workspace =="
terraform workspace show

echo
echo "== state list =="
terraform state list || true

echo
echo "== plan =="
terraform plan -no-color
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>echo "== version =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 5 行 | <code>terraform version</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>echo "== fmt =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 9 行 | <code>terraform fmt -check -recursive</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 10 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 11 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 12 行 | <code>echo "== validate =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 13 行 | <code>terraform validate</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 14 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 15 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>echo "== workspace =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 17 行 | <code>terraform workspace show</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 18 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 19 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 20 行 | <code>echo "== state list =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 21 行 | <code>terraform state list &#124;&#124; true</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 22 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 23 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 24 行 | <code>echo "== plan =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 25 行 | <code>terraform plan -no-color</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


生产化前要补：

- plan 文件保存。
- `terraform show -json` 输出。
- 敏感信息处理。
- 变更审批。
- drift 检测定时任务。
- 与告警时间线关联。

## 面试怎么讲

Terraform 是基础设施即代码工具。它用 HCL 描述期望资源，通过 provider 调用云厂商或平台 API，用 state 记录配置资源地址和真实资源 ID 的映射。执行时先 `init` 初始化 provider/backend，再 `plan` 刷新 state 并生成增删改执行计划，确认后 `apply` 执行并更新 state。State 是 Terraform 判断现实世界和配置差异的关键，因此团队协作要使用 remote backend 和 locking。排障时我会先看 workspace、backend、state list、plan 输出和 provider 认证，遇到大规模删除计划会立即停止并检查是否改错环境、改了资源地址或丢了 state。

## 小白可能会问

### Terraform 和 Ansible 有什么区别？

Terraform 更适合声明和管理基础设施资源，比如云服务器、网络、DNS、Kubernetes 集群；Ansible 更适合登录机器做配置、安装包、改文件、重启服务。

### 为什么 state 这么重要？

配置只说明你想要什么，state 记录 Terraform 管了哪些真实资源。没有 state，Terraform 不知道配置里的资源对应云上的哪个对象。

### plan 为什么要仔细看？

plan 是执行前的变更预览。它会告诉你要 create、update、replace、destroy 什么。生产误删通常是没认真看 plan。

### 手工改了云资源会怎样？

这叫 drift。下一次 plan 会发现真实状态和 state/config 不一致，并提出修正计划。

### 可以把 state 提交 Git 吗？

不建议。state 可能包含敏感信息，也容易多人冲突。团队应使用 remote backend。

### 为什么 count 有时危险？

如果用列表配合 count，列表顺序变化可能导致资源地址变化，引发不必要替换。稳定 key 的集合更适合 `for_each`。

## 学习路线

第一阶段：单资源

- HCL。
- provider。
- resource。
- init/plan/apply。
- state。

第二阶段：参数化

- variables。
- locals。
- outputs。
- tfvars。

第三阶段：依赖和复用

- dependency graph。
- depends_on。
- count。
- for_each。
- modules。

第四阶段：团队协作

- backend。
- state locking。
- workspaces。
- import。
- drift。

第五阶段：AIOps

- plan 审计。
- drift detection。
- 基础设施变更与告警关联。
- Terraform runbook。
- CI/CD 安全执行。

## 学习检查清单

- [ ] 我能解释 Terraform 是什么。
- [ ] 我能解释 provider、resource、data source。
- [ ] 我能写最小 Terraform 配置。
- [ ] 我能执行 init、fmt、validate、plan、apply。
- [ ] 我能解释 state 为什么重要。
- [ ] 我能解释 backend 和 locking。
- [ ] 我能使用 variables、locals、outputs。
- [ ] 我能解释 dependency graph。
- [ ] 我能解释 count 和 for_each 的区别。
- [ ] 我能解释 depends_on 什么时候需要。
- [ ] 我能解释 lifecycle 常见参数。
- [ ] 我能解释 modules。
- [ ] 我能解释 drift 和 refresh-only。
- [ ] 我能解释 import 的流程。
- [ ] 我能排查 plan 要删除很多资源。
- [ ] 我能把 Terraform plan 接入 AIOps 变更分析。

## 面试题

1. Terraform 解决什么问题？
2. Terraform 和 Ansible 的区别是什么？
3. Provider 是什么？
4. Resource 和 data source 有什么区别？
5. Terraform state 是什么？为什么重要？
6. Backend 是什么？为什么团队需要 remote backend？
7. `terraform init` 做什么？
8. `terraform plan` 做什么？
9. `terraform apply` 做什么？
10. 为什么生产要保存 plan 文件？
11. variables、locals、outputs 分别是什么？
12. Terraform 如何推断依赖？
13. 什么时候需要 `depends_on`？
14. count 和 for_each 有什么区别？
15. lifecycle 的 prevent_destroy 有什么用？
16. Module 解决什么问题？
17. Drift 是什么？怎么发现？
18. Import 做什么？导入后为什么还要 plan？
19. plan 显示要删除很多资源时怎么办？
20. Terraform 在 AIOps 中如何帮助变更治理？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个包含 `versions.tf`、`main.tf`、`variables.tf`、`outputs.tf` 的本地实验。
- 一份 `terraform plan` 输出解读。
- 一份 `terraform state list/show` 记录。
- 一份 drift 实验记录。
- 一份“plan 要删除很多资源”的排障清单。
- 一个 Terraform 诊断脚本，能跑 fmt、validate、workspace、state list、plan。
