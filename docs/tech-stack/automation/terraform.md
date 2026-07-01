# Terraform

> 目标：理解基础设施即代码、provider、resource、state、plan/apply，能用 Terraform 创建一个最小资源并安全管理变更。

## 官方资料

- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform language](https://developer.hashicorp.com/terraform/language)
- [Provider requirements](https://developer.hashicorp.com/terraform/language/providers/requirements)
- [Terraform state](https://developer.hashicorp.com/terraform/language/state)

说明：本文是基于 HashiCorp 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Terraform 是基础设施即代码工具。你用 HCL 配置文件描述基础设施，Terraform 通过 provider 调用平台 API 创建、修改、删除资源。

## 核心原理

```text
*.tf configuration
  -> Terraform Core
  -> providers
  -> APIs
  -> real infrastructure
  -> state
```

Terraform 工作流程：

1. `init`：初始化 provider。
2. `fmt`：格式化。
3. `validate`：验证语法。
4. `plan`：预览变更。
5. `apply`：执行变更。
6. `destroy`：销毁资源。

## 核心概念

- Provider：连接外部系统的插件。
- Resource：Terraform 管理的资源。
- Data source：读取外部已有数据。
- Variable：输入变量。
- Output：输出值。
- State：实际资源和配置的映射。
- Module：可复用配置单元。

## 最小示例

使用 local provider 创建本地文件。

`main.tf`：

```hcl
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

resource "local_file" "demo" {
  filename = "${path.module}/demo.txt"
  content  = "hello aiops"
}
```

执行：

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

## State

State 是 Terraform 的关键。它记录配置中的资源和真实世界资源的对应关系。

不要随便删除或手改 state。多人协作时应该使用远程 state，并配置锁。

## Variables

`variables.tf`：

```hcl
variable "env" {
  type        = string
  description = "Environment name"
  default     = "dev"
}
```

使用：

```hcl
content = "environment = ${var.env}"
```

## Output

```hcl
output "file_path" {
  value = local_file.demo.filename
}
```

## 在 AIOps 中的作用

- 让基础设施变更可审计。
- 为“变更导致故障”提供证据。
- 让实验环境可重复创建和销毁。
- 管理云资源、Kubernetes 资源、监控组件配置。

## 入门实验

1. 用 local provider 创建 `demo.txt`。
2. 修改 content。
3. 运行 `terraform plan`，观察差异。
4. 运行 `terraform apply`。
5. 查看 `terraform.tfstate`，只读不手改。

## 排障清单

### init 失败

- 网络是否能访问 provider registry。
- provider source 是否写错。
- 版本约束是否冲突。

### plan 显示要删除很多资源

- 停下来，不要直接 apply。
- 检查 state 是否正确。
- 检查配置是否改名。
- 检查 workspace。

### state 冲突

- 多人协作时使用远程 state。
- 启用 state lock。
- 不要同时 apply。

## 学习证据

- `terraform/main.tf`
- `terraform/variables.tf`
- 一篇记录：Terraform state 为什么重要
