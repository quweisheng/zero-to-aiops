# 04：自动化与 CI/CD 技术栈

AIOps 的“Ops”最终要落到动作上。动作可以是提醒、摘要、推荐，也可以是自动执行脚本、调整配置、回滚发布。自动化与 CI/CD 的学习目标不是炫技，而是让动作可重复、可审计、可回滚。

## Ansible

### 是什么

Ansible 是自动化配置管理和运维编排工具。它可以批量执行命令、安装软件、修改配置、管理服务。

### 原理

Ansible 通常通过 SSH 连接目标主机，不需要在被控节点上安装 agent。你用 inventory 定义主机，用 playbook 描述任务，Ansible 按模块执行任务。

### 架构

```text
Control node
  -> inventory
  -> playbook
  -> modules
  -> SSH / WinRM
  -> managed nodes
```

核心概念：

- Inventory：主机清单。
- Playbook：自动化剧本。
- Task：单个动作。
- Module：具体执行能力，例如 copy、service、package。
- Role：可复用任务结构。

### 在 AIOps 中的作用

- Runbook 自动化的执行层。
- 批量收集系统信息。
- 批量修复配置。
- 配合告警系统做半自动处理。

### 配置重点

最小 inventory：

```ini
[web]
192.168.1.10 ansible_user=root
192.168.1.11 ansible_user=root
```

最小 playbook：

```yaml
- name: Check web servers
  hosts: web
  tasks:
    - name: Ensure nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
```

常用命令：

```bash
ansible all -i inventory.ini -m ping
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml --check
```

### 入门练习

写一个 playbook：检查 NGINX 是否运行。如果没运行，先只输出提示，不自动重启。第二版再加人工确认后重启。

### 学习证据

- `ansible/inventory.ini`
- `ansible/check-nginx.yml`
- 一篇记录：为什么生产自动化要有 `--check` 和人工确认？

### 官方资料

- [Ansible documentation](https://docs.ansible.com/projects/ansible/latest/index.html)
- [Ansible playbooks](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_intro.html)

## Terraform

### 是什么

Terraform 是基础设施即代码工具。你用配置文件描述云资源、网络、数据库、Kubernetes 资源等，Terraform 负责创建、更新和删除。

### 原理

Terraform 读取 `.tf` 文件，通过 provider 调用目标平台 API。它维护 state，用来记录当前资源状态。`plan` 比较期望状态和实际状态，`apply` 执行变更。

### 架构

```text
*.tf configuration
  -> Terraform Core
  -> providers
  -> cloud / SaaS / Kubernetes APIs
  -> state file
```

核心概念：

- Provider：连接不同平台的插件。
- Resource：要管理的资源。
- Data source：读取外部已有资源信息。
- State：Terraform 记录的资源状态。
- Plan：变更预览。
- Apply：执行变更。

### 在 AIOps 中的作用

- 让基础设施变更可追踪。
- 为变更关联分析提供数据来源。
- 让实验环境可重复创建和销毁。
- 避免手工点击控制台造成“没人知道改了什么”。

### 配置重点

最小结构：

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

常用命令：

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
terraform destroy
```

### 入门练习

先不要碰云资源。用 `local_file` provider 创建一个本地文件，理解 `init -> plan -> apply -> state`。

### 学习证据

- `terraform/main.tf`
- `terraform/README.md`
- 一篇记录：Terraform state 为什么不能随便删？

### 官方资料

- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform providers](https://developer.hashicorp.com/terraform/language/providers)
- [Terraform state](https://developer.hashicorp.com/terraform/language/state)

## GitHub Actions

### 是什么

GitHub Actions 是 GitHub 自带的 CI/CD 和自动化平台。它可以在代码 push、PR、手动触发时运行 workflow。

### 原理

你把 workflow 写在 `.github/workflows/*.yml`。Workflow 由 event 触发，里面包含 jobs，job 运行在 runner 上，job 由 steps 组成。

### 架构

```text
GitHub event: push / pull_request / workflow_dispatch
  -> workflow
  -> jobs
  -> runner
  -> steps
  -> actions / shell commands
```

核心概念：

- Workflow：自动化流程。
- Event：触发条件。
- Job：一组步骤。
- Runner：执行环境。
- Step：一个动作或命令。
- Action：可复用步骤。

### 在 AIOps 中的作用

- 自动构建和发布学习文档。
- 自动运行测试。
- 自动检查配置格式。
- 为平台工程和自动化发布打基础。

### 配置重点

最小 workflow：

```yaml
name: Check docs

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run docs:build
```

### 入门练习

给 `zero-to-aiops` 仓库添加一个 workflow，push 后自动构建 VitePress 文档站。

### 学习证据

- `.github/workflows/docs.yml`
- GitHub Actions 成功截图或链接
- 一篇记录：workflow、job、step、runner 的区别

### 官方资料

- [GitHub Actions documentation](https://docs.github.com/actions)
- [Understanding GitHub Actions](https://docs.github.com/actions/learn-github-actions/understanding-github-actions)

## CI/CD

### 是什么

CI/CD 是持续集成和持续交付/部署。CI 关注自动构建、测试、检查；CD 关注把变更安全发布到环境。

### 原理

代码进入版本库后，流水线自动执行构建、测试、扫描、打包、发布等步骤。每一步都应该可重复、可追踪、失败可定位。

### 架构

```text
git push
  -> CI pipeline
  -> build
  -> test
  -> package
  -> deploy
  -> monitor
  -> rollback if needed
```

### 在 AIOps 中的作用

- 变更是故障的重要来源，AIOps 根因分析常常要关联“最近是否有发布”。
- CI/CD 日志和发布记录是 AIOps 的关键上下文。
- 自动回滚必须建立在可靠流水线之上。

### 配置重点

一个成熟流水线至少包含：

- checkout
- dependency install
- lint
- test
- build
- artifact
- deploy
- notify
- rollback strategy

### 入门练习

给一个 demo app 做 CI：每次 push 自动运行单元测试和 Docker build，但先不自动部署。

## Runbook Automation

### 是什么

Runbook Automation 是把人工处理手册转成可执行、可审计、可回滚的自动化流程。

### 原理

Runbook 把故障处理拆成输入、判断、动作、验证、回滚。自动化系统根据告警上下文填入参数，先生成建议，再逐步进入半自动或自动执行。

### 架构

```text
Alert / Event
  -> context enrichment
  -> runbook selection
  -> pre-check
  -> human approval
  -> action execution
  -> verification
  -> audit log
  -> rollback
```

### 在 AIOps 中的作用

这是 AIOps 从“发现问题”走向“解决问题”的关键桥梁。

### 配置重点

每个 runbook 至少记录：

- 适用场景
- 输入参数
- 前置检查
- 执行动作
- 验证方式
- 回滚方式
- 风险等级
- 审批要求

### 入门练习

写一个“磁盘使用率超过 85%” runbook，但第一版只做推荐动作：

```md
# Runbook: 磁盘使用率过高

## 适用场景
磁盘使用率超过 85%，但服务仍可用。

## 前置检查
- df -h
- du -sh /var/log/*
- 最近是否有日志暴增

## 建议动作
- 压缩旧日志
- 清理临时文件
- 扩容磁盘

## 禁止动作
- 未确认前删除业务数据

## 回滚
- 删除动作需要先备份路径
```

### 学习证据

- `docs/runbooks/disk-high-usage.md`
- 一篇记录：哪些动作只能建议，不能自动执行？
