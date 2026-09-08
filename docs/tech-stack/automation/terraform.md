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

说明：本文基于 HashiCorp Terraform 官方文档整理，是原创中文教程，不复制官方全文。Terraform 生态有 Terraform CLI、HCP Terraform、Terraform Enterprise、providers、modules 等不同层次；本文聚焦 Terraform CLI 和语言核心。授权条款与各版本差异应直接核对官方说明，不将所有版本笼统称为相同授权的开源软件。

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
.tf configuration（基础设施配置文件）
  -> terraform init 下载 provider
  -> terraform validate / fmt（语法校验与格式整理）
  -> terraform plan 读取 state 和真实资源
  -> execution plan（执行计划）
  -> terraform apply 调 provider API
  -> 创建/修改/删除真实资源
  -> 更新 terraform.tfstate 或 remote state
```

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
Terraform CLI（命令行工具）
  -> init（初始化）
  -> validate（配置校验）
  -> fmt（格式化）
  -> plan（生成变更计划）
  -> apply（执行计划）
  -> destroy（销毁受管资源）
  -> output（读取输出）
  -> show（展示计划或状态）
  -> state（管理资源映射状态）
  -> import（纳管现有资源）
  -> providers（提供者插件）
  -> workspace（工作空间）

Terraform Language（配置语言）
  -> configuration syntax（配置语法）
  -> terraform block（工具自身设置块）
  -> provider block（平台连接设置块）
  -> resource block（受管资源块）
  -> data block（只读查询块）
  -> variable block（输入变量块）
  -> output block（输出块）
  -> locals（内部计算值）
  -> modules（可复用模块）
  -> expressions（表达式）
  -> functions（函数）
  -> meta-arguments（资源控制元参数）

State（资源映射状态）
  -> state file（状态文件）
  -> resource addressing（资源寻址）
  -> state locking（状态锁）
  -> backends（状态存储后端）
  -> refresh（刷新观察）
  -> drift（外部变更造成的漂移）
  -> import（导入已有对象）

Providers（平台适配插件）
  -> provider source（来源）
  -> provider version（版本约束）
  -> provider configuration（连接配置）
  -> provider authentication（身份认证）
  -> provider registry docs（插件仓库文档）

Modules（可复用配置模块）
  -> root module（当前工作目录模块）
  -> child module（被调用子模块）
  -> module source（模块来源）
  -> inputs（输入）
  -> outputs（输出）
  -> versioning（版本管理）
```

学习顺序：

```text
先懂 resource 和 provider
  -> 再懂 state 和 plan
  -> 再懂 variables/outputs
  -> 再懂 modules
  -> 再懂 backend/locking
  -> 最后学 import、drift、lifecycle 和团队协作
```

## Terraform 在 AIOps 链路中的位置

Terraform 是 AIOps 的基础设施声明和变更治理工具。

```text
Git（本地版本控制工具）
  -> Terraform configuration（基础设施声明）
  -> CI plan（自动化生成计划）
  -> 人工审批
  -> terraform apply（应用已审阅的变更）
  -> 云资源 / Kubernetes / DNS / IAM / 监控资源
  -> Prometheus / Grafana / Alertmanager 观测
  -> drift detection / change correlation（漂移检测与变更关联）
```

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

## HCL 基础

Terraform 使用 HCL。

基本块结构：

```text
resource "local_file" "hello" {
  filename = "${path.module}/hello.txt"
  content  = "hello aiops"
}
```

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

注释：

```text
# 单行注释
// 单行注释
/*
多行注释
*/
```

格式化：

```bash
terraform fmt
```

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

云资源示意：

```text
resource "aws_s3_bucket" "logs" {
  bucket = "aiops-prod-logs"
}
```

Resource address：

```text
local_file.runbook
aws_s3_bucket.logs
```

Terraform state 用 address 映射真实资源。

如果你改了 resource local name：

```text
aws_s3_bucket.logs（旧资源地址） -> aws_s3_bucket.aiops_logs（新资源地址）
```

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

引用：

```text
data.aws_ami.ubuntu.id
```

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

使用：

```text
name = "aiops-${var.environment}"
```

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

使用：

```text
name = "${local.name_prefix}-logs"
```

locals 不用于外部传参，而是配置内部复用。

## Outputs

Output 输出 apply 后的重要值。

```text
output "runbook_file" {
  description = "Generated runbook file path"
  value       = local_file.runbook.filename
}
```

查看：

```bash
terraform output
terraform output runbook_file
terraform output -json
```

敏感输出：

```text
output "password" {
  value     = random_password.db.result
  sensitive = true
}
```

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

查看：

```bash
terraform show
terraform state list
terraform state show local_file.runbook
```

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

远程 backend 价值：

- 团队共享 state。
- 部分 backend 支持 locking，需要明确配置和验证。
- 减少 state 丢失。
- 便于审计和备份。

backend 配置变更后：

```bash
terraform init -migrate-state
```

## Plan 和 Apply

Plan 预览变更：

```bash
terraform plan
```

官方文档说明 `terraform plan` 会创建 execution plan，让你预览 Terraform 将对基础设施做的变更。

Apply 执行：

```bash
terraform apply
```

推荐生产流程：

```bash
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

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

`copy` 引用了 `config`，Terraform 知道依赖。

显式依赖：

```text
resource "null_resource" "reload" {
  depends_on = [local_file.config]
}
```

官方建议只在 Terraform 无法自动推断隐藏依赖时使用 `depends_on`。不要到处写，容易让 plan 变保守、依赖图混乱。

查看图：

```bash
terraform graph
```

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

地址：

```text
local_file.note[0]
local_file.note[1]
local_file.note[2]
```

### for_each

```text
resource "local_file" "service" {
  for_each = toset(["api", "worker", "scheduler"])

  filename = "${path.module}/${each.key}.txt"
  content  = each.key
}
```

地址：

```text
local_file.service["api"]
```

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

模块结构：

```text
modules/
  network/
    main.tf
    variables.tf
    outputs.tf
```

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

引用：

```text
terraform.workspace
```

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

导入：

```bash
terraform import aws_s3_bucket.logs existing-aiops-logs
```

导入后一定：

```bash
terraform plan
```

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

### 格式化

```bash
terraform fmt
terraform fmt -check
```

### 初始化

```bash
terraform init
```

下载 providers，初始化 backend 和 modules。

### 校验

```bash
terraform validate
```

检查配置语法和内部一致性。

### 计划

```bash
terraform plan
terraform plan -out=tfplan
```

预览变更。

### 查看 plan

```bash
terraform show tfplan
terraform show -json tfplan
```

### 执行

```bash
terraform apply
terraform apply tfplan
```

### 销毁

```bash
terraform destroy
```

生产慎用。

### 查看输出

```bash
terraform output
terraform output -json
```

### 查看 state

```bash
terraform state list
terraform state show <address>
```

### 移动 state 地址

```bash
terraform state mv old.address new.address
```

重命名资源时可能用到。执行前备份 state。

### 从 state 移除

```bash
terraform state rm <address>
```

只从 state 移除，不删除真实资源。非常危险，要确认目的。

### 导入

```bash
terraform import <address> <id>
```

### 替换资源

`terraform taint` 已被官方标记为 deprecated，推荐：

```bash
terraform apply -replace=<address>
```

### 工作区

```bash
terraform workspace list
terraform workspace new dev
terraform workspace select dev
```

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

`variables.tf`：

```text
variable "service_name" {
  type        = string
  description = "AIOps service name"
  default     = "aiops-api"
}
```

`main.tf`：

```text
resource "local_file" "runbook" {
  filename = "${path.module}/generated-runbook.txt"
  content  = "Runbook for ${var.service_name}"
}
```

`outputs.tf`：

```text
output "runbook_path" {
  value = local_file.runbook.filename
}
```

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

### 3. 观察 state

```bash
terraform show
```

记录：

```text
resource address:
resource id:
output:
文件真实内容:
```

### 4. 制造 drift

手工改 `generated-runbook.txt` 内容。

然后：

```bash
terraform plan
```

观察 Terraform 是否计划把内容改回配置声明的值。

### 5. 清理

```bash
terraform destroy
```

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

检查 backend：

```bash
terraform init
```

检查 state：

```bash
terraform state list
```

检查是否改了 resource address：

```text
aws_s3_bucket.logs
变成
aws_s3_bucket.aiops_logs
```

如果是重命名，要使用 moved block 或 state mv，而不是让 Terraform 删除重建。

检查是否换了 backend key、环境变量、账号、region。

## 排障流程：init 失败

```bash
terraform init
```

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

企业网络可能需要配置 provider mirror（插件镜像源）或代理。不要把 `init -upgrade` 当成通用网络修复，它会重新选择约束范围内的依赖版本；需要升级时才单独审查锁文件变化。

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

但这是危险操作。不要在不知道谁持锁时强制解锁。

## 排障流程：drift

查看 drift：

```bash
terraform plan
```

只同步 state：

```bash
terraform plan -refresh-only
```

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

## 老师带你看懂“三本账”：代码、state 和现实

你在代码里写“需要两台服务器”，控制台显示两台，state 也列出两个资源。这时三本账对得上。某位同事手工删了一台，代码没变，state 还保留原映射，而现实只剩一台。下一次 Terraform 读取平台时发现差异，再提出创建计划。这就是为什么只读配置文件无法知道现场状态。

学生问：“state 不就是缓存吗，删掉重建行不行？”不行。它还保存配置地址与真实资源 ID 的对应关系。没有这层映射，工具可能以为需要创建一套新资源，也可能再也找不到原有对象的管理关系。恢复 state、导入资源和重建资源是三种不同动作，影响范围不同。

学生再问：“plan 通过，apply 一定通过吗？”不保证。计划后配额可能变化，凭据可能过期，API 可能失败，某些值只能创建后才知道。计划是基于一次观察生成的预期操作，不是整个云平台为你保留好的全局事务。[plan 官方参考](https://developer.hashicorp.com/terraform/cli/commands/plan)

### 依赖图与部分失败

Terraform 通过资源引用构建有向依赖图。比如子网引用网络 ID，服务器引用子网 ID，网络应先存在。但两个互不依赖的资源可并行创建，文件里书写顺序不等于执行顺序。对真实平台尚未就绪的异步资源，provider 还可能轮询状态直到完成或超时。

如果网络创建成功而服务器失败，成功资源通常会保留，状态记录尽量反映已发生的变化。Terraform 不会自动把所有成功操作回滚。你的恢复流程应读取平台与 state，识别哪些操作成功、失败或结果未知，修正问题后重新 plan。盲目 destroy 可能连已经被其他系统使用的资源一起删除。

状态锁主要防止多个 Terraform 操作同时改同一份 state，不会阻止管理员手工改控制台，也不会自动协调两个不同 state 管同一个真实资源。是否支持锁取决于 backend；强制解锁前必须确认持锁任务已终止，否则可能让两次 apply 并发。[状态锁说明](https://developer.hashicorp.com/terraform/language/state/locking)

### 地址稳定、替换和安全边界

`for_each` 用稳定 key 表示“哪一个对象”，适合服务名这种有身份的集合。`count` 用序号表示实例，删除列表中间元素时可能让后续索引对应改变。先问资源有没有长期身份，再选择表达方式；这与数组和字典的区别类似。

某些属性能原地修改，另一些需要替换资源，具体由 provider 和平台 API 决定。计划中的 `-/+` 等替换提示要特别看数据、地址与可用性影响。`create_before_destroy` 需要新旧资源可并存的命名和配额；`prevent_destroy` 不是云平台删除保护，也不保证你把整段资源配置移除后仍受同样保护；`ignore_changes` 可能隐藏你本想发现的漂移。

生产 state、保存的 plan、JSON 展开结果都可能含敏感信息。`sensitive` 标记减少常规终端展示，不等于文件加密。后端应有访问控制、传输与静态加密、版本备份和审计，CI 产物的保留权限也要一起设计。

## 将本地文件实验补成可验收的故障课堂

先在一个新的专用目录中保存前面的四个 `.tf` 文件，安装官方 Terraform CLI，记录版本。实验只使用 `hashicorp/local` provider，不需要云账号，不会创建云收费资源。执行 `init` 后保留 `.terraform.lock.hcl`，它记录 provider 选择和校验信息；不要把 `.terraform` 缓存目录和 state 提交到学习仓库。

第一次 apply 后，核对三件事：`generated-runbook.txt` 存在，内容是 `Runbook for aiops-api`，`terraform state list` 显示 `local_file.runbook`。第二次 plan 应显示没有需要变更的内容。若没有文件，确认当前目录、输出路径以及 apply 是否真正执行；若 init 失败，先查网络和依赖来源，不先升级依赖。

故障注入使用编辑器把生成文件改为 `unexpected manual edit`，保存后运行 `terraform plan -out=repair.tfplan`。本地文件 provider 对内容变更的呈现可能表现为需重建文件，具体以锁定版本实际输出为准；学习目标是观察它要恢复声明内容，不能预先把所有 provider 的漂移都叫原地更新。

阅读 `terraform show repair.tfplan`，确认操作仅涉及这个实验文件，再 `terraform apply repair.tfplan`。预期文件恢复为声明文本，重新 plan 没有变化。这个过程完整体现“现象、读取现实、提出修复、审核、执行、再验证”。`-refresh-only` 则只更新 state 对现实的认识，不会替你恢复文件，应区别练习。

可追加一个错误路径实验：把 `filename` 改成一个不存在的父目录下、且 provider 无法写入的路径，先看 plan，再决定是否执行。初学阶段可以只记录计划，避免把试验路径写到系统目录。正式故障实验已经由内容漂移完成，不需要靠危险权限操作制造失败。

清理时先 `terraform plan -destroy -out=cleanup.tfplan`，确认只删除 `local_file.runbook`，再执行 `terraform apply cleanup.tfplan`。预期生成文件消失，state 资源列表为空。保留脱敏 plan 解读、配置与锁文件；包含环境信息的 state 与二进制 plan 留在本地或受控存储，不上传公共 GitHub。

## 生产设计课堂：把 state 边界当成故障边界

给一个 AIOps 平台建网络、集群、数据库和监控时，不宜把所有资源塞进无限大的单一 state。大 state 便于统一引用，却增大权限范围、执行时间和误操作影响；拆分可降低影响，但需要管理依赖输出、版本和跨层变更顺序。根据所有权、生命周期和故障影响划分，比机械“一服务一个 state”更可靠。

高可用分两个问题：Terraform 执行平台是否能恢复，Terraform 建出的应用是否高可用。执行器故障可通过共享受保护 state 和重新运行恢复；应用高可用仍需跨故障域副本、负载均衡、数据复制及容量余量。部署成功不说明这些设计存在。

容量与性能关注资源数量、provider API 限流、refresh 时间、并发和后端延迟。增大并发可能触发限流，减小并发可能超出变更窗口；用 plan/apply 阶段耗时和 API 错误测量决定。升级 CLI、provider 或模块分别进行，先保存约束与锁文件，在测试环境检查新计划是否出现意外替换，再评审迁移路径。

AIOps 可将计划中的资源地址、动作和提交时间关联告警，但“变更与告警同时发生”只是候选原因。还需核对依赖路径、受影响资源与回滚结果。让模型总结 plan 时要过滤敏感字段，并把最终执行交给具有目标范围、审批和审计的流程。

**30 秒回答。** Terraform 用配置描述期望，通过 provider 读取和改变平台，以 state 维护真实资源映射，先 plan 再 apply。可靠使用的关键是状态保护、资源身份稳定、明确的变更范围和对部分失败的处理。

**3 分钟回答。** 用代码、state、现实三本账解释漂移，再画引用依赖图和 provider API 路径；说明 plan 与 apply 之间的时间变化、状态锁的范围、失败后的局部完成。最后给出分环境权限、受保护远端 state、保存计划审阅、灰度升级与真实资源验证的方案，并区分资源回滚和数据恢复。

1. **锁能防止所有并发修改吗？** 只能覆盖相同 state 的受支持操作，控制台和其他 state 仍可能改同一对象。
2. **重命名代码为何想删重建？** 地址是映射身份的一部分，使用受支持的 moved 配置或明确迁移映射，先核对 plan，不能直接执行。
3. **事故：apply 一半失败？** 读取日志、state 和真实对象，确认哪些已完成、是否有结果未知操作，修正凭据/配额后重新计划，不假设自动全量回滚。
4. **设计生产数据库资源管理？** 独立权限和 state 边界、备份与平台删除保护、审阅替换操作、升级兼容验证；恢复数据能力必须实际演练，Terraform 配置不能替代备份。

## 进阶精讲：把一次 plan 当成待审阅的工程变更

### 计划不是把配置文件翻译成一串命令

老师带你拆一条资源的路径：解析 HCL 得到表达式，加载 provider 了解资源结构，读取 state 中的映射，通过 provider 获取现实属性，再比较期望与观察值，最后形成依赖图上的动作。文件中先写的资源不保证先创建；一个字段引用另一个资源输出，才形成工具能认识的依赖。业务上存在的隐含依赖如果没有体现在配置或接口状态里，工具不会靠猜测补全。

例如网络接口已经创建，不代表防火墙规则已完成传播；数据库实例存在，不代表初始化用户已准备好。Provider 通常按各资源的实现等待所需状态，但不能替代应用级验收。你需要明确基础设施完成与业务就绪之间的边界，用受控部署或健康检查接续，而不是在所有资源后盲目加一个固定等待时间。

计划中的 `known after apply` 表示当前尚不知道值，不是错误或字符串占位符。例如平台分配的地址要创建后才产生。Unknown（未知）也不同于 `null`（没有提供值或按语义省略）和空字符串（已经知道的空文本）。把三者混为一谈，容易导致模板生成错误，或者在数量、键等必须预先确定的位置无法构建计划。资源身份应尽量来自稳定配置键，不要依赖创建后才知道的临时属性。

### Provider、模块与锁文件各锁住了什么

Provider 是连接 Terraform 与外部 API 的插件；模块是可复用的一组 Terraform 配置。它们都可能有版本，但不是同一种东西。`.terraform.lock.hcl` 主要记录 provider 选择及校验信息，不替你固定任意 Git 模块分支的未来内容。远端模块也要使用明确版本或不可变引用，并记录审阅来源。

版本约束给出允许范围，锁文件记录本次选中的具体结果。`init` 在已有锁文件时通常遵循记录；`init -upgrade` 会按约束重新选择可用版本，因此是依赖变更动作，不应作为所有网络问题的通用修复命令。网络故障需要查代理、镜像、证书与认证；插件行为变化需要版本审查，两者的风险不同。

锁定插件也不代表云端行为永远相同。平台 API、配额、组织策略、默认镜像都可能改变。为了可重复性，还应固定关键数据源筛选、镜像标识、模块输入以及区域。`most_recent` 方便选最新镜像，却可能让没有改代码的下一次计划出现资源替换。是否接受这种自动漂移应由发布策略决定，而不是由默认示例悄悄决定。

### 保存计划的真正价值与安全边界

`terraform plan -out=review.tfplan` 保存供执行的计划，`terraform show review.tfplan` 便于人审阅，后续 `terraform apply review.tfplan` 执行这份计划。它的价值是减少“批准甲计划，执行时却临时算出乙计划”的偏差。它不等于预留云配额，也不能保证外部系统在审批后不变化；状态已经发生相关变化时，执行可能拒绝陈旧计划。

生产流水线应将计划与代码提交、工作目录、workspace、后端标识、变量输入和 provider 锁文件关联。批准记录应明确计划对象，而不是给某个分支永久通行证。一个小时后重跑生成了新计划，哪怕文件名仍叫 `review.tfplan`，也需要重新判断是否与批准内容相同。

计划文件和 `terraform show -json` 结果可能包含敏感信息，不能随意作为公开附件。`sensitive` 主要影响展示，真正的保护来自访问控制、保留周期、加密与日志脱敏。AIOps 总结计划时可以先抽取资源地址、动作类别、替换原因和数量，再交给模型，不应直接上传完整 state 或含凭据的计划。

读计划时按影响面排序：先看销毁和替换，再看权限、网络、数据库与存储，再看普通属性。替换可能导致地址变化、短暂不可用或数据丢失；一个只改“名字”的业务诉求，落到平台上也可能必须重建。因此审阅应解释为什么需要这项动作、有没有低风险迁移方式，以及替换后旧资源何时可以安全退役。

### 资源地址变化，不一定要重建现实对象

给学生一个类比：state 是带书架位置的借书登记册，真实资源是书本。你把配置中的 `logs` 改叫 `aiops_logs`，相当于改了登记位置；如果不说明迁移，工具可能把新位置当成需要新书，把旧位置当成应移除。`moved` 声明表达旧地址到新地址的关系，让配置重构与真实资源生命周期分开处理。

使用 moved 前先检查原地址确实存在于当前 state、新地址没有绑定别的对象、资源类型与变更是否受支持。随后审阅计划，目标是地址迁移而不是意外销毁。不要把一个本来应该新建的资源硬映射到旧对象上，只为让 plan 少显示变化。若团队仍使用手工 state 迁移命令，应有备份、互斥和精确地址审核，避免多个人同时修改映射。

Import（导入）同样是建立管理映射，不是复制服务器，也不意味着自动获得完全符合你意图的配置。导入后必须阅读计划：如果现有对象属性与配置不一致，下一次 apply 仍可能修改甚至替换。先“认领”，再“核对”，最后才决定是否收敛，是比一键导入后立即执行更稳妥的流程。

### 一个安全的重命名生产模拟

前置条件是前面的 local 文件实验已成功、没有待处理变更，当前目录只管理那个学习文件。先保存 `terraform state list`，确认地址为 `local_file.runbook`。在编辑器中把资源标签 `runbook` 改成 `runbook_v2`，并把输出引用同步改为 `local_file.runbook_v2.filename`；文件路径和内容保持不变。

第一次只运行 plan，不执行。观察工具把哪个地址看作旧对象、哪个看作新对象，记录有没有销毁和创建。然后加入如下声明，再重新计划：

```hcl
moved {
  from = local_file.runbook
  to   = local_file.runbook_v2
}
```

预期计划能够识别地址迁移，不再因为单纯标签改名而要求重建学习文件。保存计划，确认只有预期映射变化后再 apply；读取文件内容和新的 `state list`，证明地址更新且业务内容未变。若仍显示替换，先对照是否连文件内容、路径、provider 版本一起改了；若提示找不到源地址，检查 workspace 与实验当前状态。

恢复有两种合理选择：保留新标签和迁移声明，作为一次受审阅重构的证据；或者在明确新地址已经生效后，按同样流程设计反向迁移并审阅。不要直接复制旧 state 覆盖当前状态来“撤销”。最后清理仍使用 `plan -destroy` 后审核的方式，仅作用于本学习文件；保存不含秘密的配置差异和计划解读。实验验证的是资源地址管理，不宣称测试了任何云厂商迁移能力。

### 状态锁、工作区与权限不是同一个安全网

State lock（状态锁）避免受支持后端上的并发 Terraform 写操作互相覆盖，但它不锁住云控制台，也不保护其他 state 错误管理同一资源的情况。看到锁错误先查锁持有者、任务平台是否仍运行和进程日志；即使等待很久，也不能据此证明锁已经失效。强制解锁只适用于确认原操作不再活动的场景，并且需要核对准确锁标识。[锁机制说明](https://developer.hashicorp.com/terraform/language/state/locking)

Workspace（工作区）可以让同一配置使用不同状态，但不是自动建立独立账户和权限。若开发与生产工作区共用一个全权云密钥，输错工作区依然可能改生产。真正的边界应由后端访问权限、云账号或项目、执行身份和审批一起构成。执行前展示当前工作区和后端的脱敏标识，是为了让人核对，不是替代权限设计。

`prevent_destroy` 是配置层的保护，`create_before_destroy` 是操作排序要求，`ignore_changes` 是有选择地忽略差异。前者不能取代平台删除保护和备份；中者需要新旧对象可并存，可能受名称与配额限制；后者适用于明确把某些属性交给别的控制器管理，却可能掩盖安全漂移。请给每个忽略字段写上“谁负责它、怎么监控它”，而不是为了消除烦人的计划输出就全部忽略。[生命周期参数](https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle)

### 事故答辩：创建请求超时，但控制台出现了资源

这道题考的是未知结果，不是记忆命令。先保留失败日志、请求时间和可能的资源标识，读取 state 看是否已记录对象，再在平台只读查询真实状态。不要立刻再次创建同名对象，因为第一次请求可能已经成功，只是响应没回来。也不要直接删除控制台对象，因为它可能已被后续系统使用。

若对象存在但映射未建立，应依据 provider 的恢复说明和真实资源身份，评估导入或其他受支持的恢复方式；若对象仍在创建，应等待到明确状态并设置时限；若不存在，解决网络或权限问题后重新计划。整个过程保持一个执行者，避免旁边的人同时手工补资源，让三本账更难对齐。

最后说明为何“回滚代码”不等于“恢复数据”。旧配置可以重新描述旧规格，却未必恢复被销毁卷上的内容，也未必能把已升级的数据库格式降回旧版。可靠回滚必须包含数据保护、平台兼容性和应用验证。把这层边界讲清楚，比承诺 Terraform 可以撤销所有变更更符合生产面试要求。

## 学习证据

完成本篇后，建议留下这些证据：

- 一个包含 `versions.tf`、`main.tf`、`variables.tf`、`outputs.tf` 的本地实验。
- 一份 `terraform plan` 输出解读。
- 一份 `terraform state list/show` 记录。
- 一份 drift 实验记录。
- 一份“plan 要删除很多资源”的排障清单。
- 一个 Terraform 诊断脚本，能跑 fmt、validate、workspace、state list、plan。
