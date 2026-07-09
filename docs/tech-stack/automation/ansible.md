# Ansible

> 目标：能理解 Ansible 为什么适合配置管理和自动化运维，能讲清 control node、managed node、inventory、module、task、play、playbook、variables、facts、handlers、roles、collections、ansible.cfg、check/diff mode、Vault 和幂等性，能写一个最小 playbook，并能排查 SSH 连接失败、变量不生效、任务总是 changed、playbook 语法错误。

## 官方资料

- [Ansible Community Documentation](https://docs.ansible.com/projects/ansible/latest/index.html)
- [How to build your inventory](https://docs.ansible.com/projects/ansible/latest/inventory_guide/intro_inventory.html)
- [Connection methods and details](https://docs.ansible.com/projects/ansible/latest/inventory_guide/connection_details.html)
- [Introduction to ad hoc commands](https://docs.ansible.com/projects/ansible/latest/command_guide/intro_adhoc.html)
- [Working with playbooks](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks.html)
- [Ansible playbooks](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_intro.html)
- [Using variables](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_variables.html)
- [Roles](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_reuse_roles.html)
- [Check mode and diff mode](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html)
- [Ansible Configuration Settings](https://docs.ansible.com/projects/ansible/latest/reference_appendices/config.html)
- [Playbook Keywords](https://docs.ansible.com/projects/ansible/latest/reference_appendices/playbooks_keywords.html)
- [Ansible glossary](https://docs.ansible.com/projects/ansible/latest/reference_appendices/glossary.html)
- [Ansible builtin module index](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/)

说明：本文基于 Ansible 官方社区文档整理，是原创中文教程，不复制官方全文。Ansible 生态里有 ansible-core、collections、Automation Platform 等不同层次，本文聚焦初学者最常用的 ansible-core / community 文档概念。

## 场景开场

你有 30 台 Linux 服务器，需要做这些事：

- 安装 node_exporter。
- 创建 `/opt/aiops` 目录。
- 下发 systemd service。
- 重启服务。
- 确认端口监听。
- 后续如果配置没变，不要每次都重启。

新手最容易写一个 shell 循环：

```bash
for host in server1 server2 server3; do
  ssh "$host" "sudo apt install -y node-exporter"
done
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>for host in server1 server2 server3; do</code> | 执行 `for` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  ssh "$host" "sudo apt install -y node-exporter"</code> | 执行 `ssh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>done</code> | 执行 `done` 相关命令，后面的参数决定它具体操作什么对象。 |

这能跑，但很快会遇到问题：

- 哪些机器成功了，哪些失败了？
- 重跑会不会重复改坏？
- 不同环境变量怎么管理？
- SSH 用户、端口、密钥怎么配置？
- 配置文件变了才重启服务，怎么做？
- 任务执行前能不能先 dry run？
- 密码和 token 怎么加密？
- 怎么把这套自动化放进 Git 和 CI？

Ansible 解决的是“把对一组机器的配置、部署、巡检、修复动作写成可重复、可审计、尽量幂等的自动化说明书”。

## 一句话人话版

Ansible 是无 agent 的自动化工具：你在 control node 上写 inventory 和 playbook，Ansible 通过 SSH 等连接方式登录 managed nodes，调用模块把远端系统调整到你声明的状态，并用 changed/ok/failed 告诉你实际发生了什么。

## 学习边界

入门 Ansible 先抓住这条线：

```text
control node
  -> ansible.cfg
  -> inventory
  -> variables
  -> ad hoc command / playbook
  -> modules
  -> managed nodes
  -> result: ok / changed / failed / skipped
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>control node</code> | 这一行里的英文要这样读：`control node` 这个英文标识可以拆开理解为：控制端，节点。 |
| 第 2 行 | <code>  -&gt; ansible.cfg</code> | 这一行要理解这些英文词：`ansible.cfg` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; inventory</code> | 这一行要理解这些英文词：`inventory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; variables</code> | 这一行要理解这些英文词：`variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; ad hoc command / playbook</code> | 这一行要理解这些英文词：`ad hoc command` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`playbook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; modules</code> | 这一行要理解这些英文词：`modules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; managed nodes</code> | 这一行要理解这些英文词：`managed nodes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; result: ok / changed / failed / skipped</code> | 这一行要理解这些英文词：`result` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`ok` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`changed` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`failed` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`skipped` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

第一阶段必须掌握：

- control node 和 managed node。
- inventory、group、host variables。
- ad hoc command。
- playbook、play、task。
- module 和 plugin 的区别。
- 幂等性和 changed 状态。
- variables、facts、register。
- when、loop、tags。
- notify 和 handlers。
- templates。
- roles。
- check mode 和 diff mode。
- ansible.cfg。
- become。
- Ansible Vault。
- 常用命令：`ansible`、`ansible-playbook`、`ansible-inventory`、`ansible-doc`、`ansible-lint`、`ansible-vault`。

暂时可以先不深挖：

- 自己写复杂 module/plugin。
- Ansible Rulebook / Event-Driven Ansible 全体系。
- AWX / Automation Controller 生产运维。
- 大规模 dynamic inventory 插件开发。
- 网络设备自动化全套平台差异。
- Collections 发布流程。

## 官方知识地图

Ansible 官方文档可以按这些模块读：

```text
Installation and getting started
  -> install ansible-core
  -> control node requirements
  -> managed node connection

Inventory
  -> inventory sources
  -> groups
  -> host variables
  -> group variables
  -> patterns
  -> dynamic inventory
  -> connection variables

Command line tools
  -> ansible
  -> ansible-playbook
  -> ansible-inventory
  -> ansible-doc
  -> ansible-config
  -> ansible-vault

Playbooks
  -> plays
  -> tasks
  -> modules
  -> variables
  -> facts
  -> conditionals
  -> loops
  -> handlers
  -> templates
  -> tags
  -> blocks
  -> error handling

Reuse
  -> roles
  -> includes
  -> imports
  -> collections

Security and validation
  -> become
  -> vault
  -> check mode
  -> diff mode

Reference
  -> playbook keywords
  -> configuration settings
  -> module index
  -> plugin index
  -> precedence rules
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Installation and getting started</code> | 这一行里的英文要这样读：`Installation and getting started` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; install ansible-core</code> | 这一行要理解这些英文词：`install ansible-core` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; control node requirements</code> | 这一行要理解这些英文词：`control node requirements` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; managed node connection</code> | 这一行要理解这些英文词：`managed node connection` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>Inventory</code> | 这一行里的英文要这样读：`Inventory` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 7 行 | <code>  -&gt; inventory sources</code> | 这一行要理解这些英文词：`inventory sources` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; groups</code> | 这一行要理解这些英文词：`groups` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; host variables</code> | 这一行要理解这些英文词：`host variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; group variables</code> | 这一行要理解这些英文词：`group variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; patterns</code> | 这一行要理解这些英文词：`patterns` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; dynamic inventory</code> | 这一行要理解这些英文词：`dynamic inventory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; connection variables</code> | 这一行要理解这些英文词：`connection variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>Command line tools</code> | 这一行里的英文要这样读：`Command line tools` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 16 行 | <code>  -&gt; ansible</code> | 这一行要理解这些英文词：`ansible` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>  -&gt; ansible-playbook</code> | 这一行要理解这些英文词：`ansible-playbook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>  -&gt; ansible-inventory</code> | 这一行要理解这些英文词：`ansible-inventory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; ansible-doc</code> | 这一行要理解这些英文词：`ansible-doc` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; ansible-config</code> | 这一行要理解这些英文词：`ansible-config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; ansible-vault</code> | 这一行要理解这些英文词：`ansible-vault` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>Playbooks</code> | 这一行里的英文要这样读：`Playbooks` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 24 行 | <code>  -&gt; plays</code> | 这一行要理解这些英文词：`plays` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; tasks</code> | 这一行要理解这些英文词：`tasks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>  -&gt; modules</code> | 这一行要理解这些英文词：`modules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; variables</code> | 这一行要理解这些英文词：`variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; facts</code> | 这一行要理解这些英文词：`facts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; conditionals</code> | 这一行要理解这些英文词：`conditionals` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>  -&gt; loops</code> | 这一行要理解这些英文词：`loops` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; handlers</code> | 这一行要理解这些英文词：`handlers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; templates</code> | 这一行要理解这些英文词：`templates` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; tags</code> | 这一行要理解这些英文词：`tags` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; blocks</code> | 这一行要理解这些英文词：`blocks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>  -&gt; error handling</code> | 这一行要理解这些英文词：`error handling` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>Reuse</code> | 这一行里的英文要这样读：`Reuse` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 38 行 | <code>  -&gt; roles</code> | 这一行要理解这些英文词：`roles` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>  -&gt; includes</code> | 这一行要理解这些英文词：`includes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>  -&gt; imports</code> | 这一行要理解这些英文词：`imports` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>  -&gt; collections</code> | 这一行要理解这些英文词：`collections` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>Security and validation</code> | 这一行里的英文要这样读：`Security and validation` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 44 行 | <code>  -&gt; become</code> | 这一行要理解这些英文词：`become` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>  -&gt; vault</code> | 这一行要理解这些英文词：`vault` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>  -&gt; check mode</code> | 这一行要理解这些英文词：`check mode` 是mode=模式。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 47 行 | <code>  -&gt; diff mode</code> | 这一行要理解这些英文词：`diff mode` 是mode=模式。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 49 行 | <code>Reference</code> | 这一行里的英文要这样读：`Reference` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 50 行 | <code>  -&gt; playbook keywords</code> | 这一行要理解这些英文词：`playbook keywords` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 51 行 | <code>  -&gt; configuration settings</code> | 这一行要理解这些英文词：`configuration settings` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 52 行 | <code>  -&gt; module index</code> | 这一行要理解这些英文词：`module index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 53 行 | <code>  -&gt; plugin index</code> | 这一行要理解这些英文词：`plugin index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 54 行 | <code>  -&gt; precedence rules</code> | 这一行要理解这些英文词：`precedence rules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

学习顺序：

```text
先用 inventory 找到机器
  -> 用 ad hoc 命令验证连接和模块
  -> 写 playbook 表达重复动作
  -> 用 variables/facts/templates 适配环境差异
  -> 用 handlers 和 roles 组织工程
  -> 用 check/diff/vault 提升安全和可审计
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先用 inventory 找到机器</code> | 这一行里的英文要这样读：`inventory` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; 用 ad hoc 命令验证连接和模块</code> | 这一行要理解这些英文词：`ad hoc` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 写 playbook 表达重复动作</code> | 这一行要理解这些英文词：`playbook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 用 variables/facts/templates 适配环境差异</code> | 这一行要理解这些英文词：`variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`facts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`templates` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 用 handlers 和 roles 组织工程</code> | 这一行要理解这些英文词：`handlers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`roles` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 用 check/diff/vault 提升安全和可审计</code> | 这一行要理解这些英文词：`check` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`diff` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`vault` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Ansible 在 AIOps 链路中的位置

Ansible 在 AIOps 里常扮演“自动化执行器”和“配置收敛器”。

```text
Prometheus / Alertmanager / Loki / Elasticsearch
  -> 发现异常
  -> AIOps 诊断
  -> 选择 runbook
  -> Ansible playbook 执行检查或修复
  -> systemd / files / packages / services
  -> 验证指标恢复
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus / Alertmanager / Loki / Elasticsearch</code> | `Prometheus / Alertmanager / Loki / Elasticsearch` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; 发现异常</code> | 这一行表示上一级主题下的子项“发现异常”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; AIOps 诊断</code> | 这一行要理解这些英文词：`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 选择 runbook</code> | 这一行要理解这些英文词：`runbook` 是故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Ansible playbook 执行检查或修复</code> | 这一行要理解这些英文词：`Ansible playbook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; systemd / files / packages / services</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`files` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`packages` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`services` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; 验证指标恢复</code> | 这一行表示上一级主题下的子项“验证指标恢复”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

Ansible 适合做：

- 批量巡检。
- 下发配置。
- 安装 exporter。
- 管理 systemd 服务。
- 创建用户和目录。
- 收集故障证据。
- 执行低风险 runbook。
- 灰度修复。

不适合直接做：

- 高频实时控制。
- 毫秒级自动恢复。
- 复杂状态机编排。
- 长时间后台任务管理。

## Ansible 是什么

Ansible 是自动化工具，常用于：

- configuration management。
- application deployment。
- orchestration。
- provisioning。
- ad hoc operations。

它的典型特点：

| 特点 | 含义 |
|---|---|
| agentless | managed node 通常不用安装 agent |
| SSH-based | Linux 常用 SSH 连接 |
| declarative-ish | 多数模块描述目标状态 |
| idempotent | 支持重复执行后不重复改变 |
| YAML playbooks | 用 YAML 写自动化流程 |
| modules | 通过模块执行具体动作 |
| inventory | 管理目标主机和变量 |

基本模型：

```text
control node
  -> SSH
managed node
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>control node</code> | 这一行里的英文要这样读：`control node` 这个英文标识可以拆开理解为：控制端，节点。 |
| 第 2 行 | <code>  -&gt; SSH</code> | 这一行要理解这些英文词：`SSH` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>managed node</code> | 这一行里的英文要这样读：`managed node` 这个英文标识可以拆开理解为：节点。 |

Ansible 会把模块代码传到远端执行，拿回 JSON 结果，再显示 `ok`、`changed`、`failed` 等状态。

## Control node 和 managed node

### Control node

运行 Ansible 命令的机器。

这里有：

- `ansible`。
- `ansible-playbook`。
- inventory。
- playbooks。
- roles。
- SSH key。
- ansible.cfg。

### Managed node

被管理的机器。

常见要求：

- 能从 control node 连接。
- Linux 通常需要 SSH。
- 很多模块需要 Python。
- 需要对应权限执行任务。

测试：

```bash
ansible all -i inventory.ini -m ping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible all -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

注意：Ansible 的 `ping` 模块不是 ICMP ping，它是测试 Ansible 能否连接并执行 Python 模块。

## Inventory

Inventory 定义 Ansible 管哪些主机，以及这些主机属于哪些组、使用哪些连接变量。

INI 示例：

```text
[web]
web1 ansible_host=192.168.1.11
web2 ansible_host=192.168.1.12

[db]
db1 ansible_host=192.168.1.21

[prod:children]
web
db

[prod:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[web]</code> | 这一行里的英文要这样读：`web` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>web1 ansible_host=192.168.1.11</code> | `web1` 是主机、服务、告警或资源的示例名称；`ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.11` 表示IP 地址，表示一台机器或服务端点的位置。 |
| 第 3 行 | <code>web2 ansible_host=192.168.1.12</code> | `web2` 是主机、服务、告警或资源的示例名称；`ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.12` 表示IP 地址，表示一台机器或服务端点的位置。 |
| 第 5 行 | <code>[db]</code> | 这一行里的英文要这样读：`db` 是数据库。 |
| 第 6 行 | <code>db1 ansible_host=192.168.1.21</code> | `db1` 是主机、服务、告警或资源的示例名称；`ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.21` 表示IP 地址，表示一台机器或服务端点的位置。 |
| 第 8 行 | <code>[prod:children]</code> | 这一行里的英文要这样读：`prod` 是生产环境；`children` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 9 行 | <code>web</code> | 这一行里的英文要这样读：`web` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>db</code> | 这一行里的英文要这样读：`db` 是数据库。 |
| 第 12 行 | <code>[prod:vars]</code> | 这一行里的英文要这样读：`prod` 是生产环境；`vars` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 13 行 | <code>ansible_user=ubuntu</code> | `ansible_user` 是Ansible 登录用户字段，`ubuntu` 表示登录用户示例，真实环境要换成自己的服务器用户。 |
| 第 14 行 | <code>ansible_ssh_private_key_file=~/.ssh/id_rsa</code> | `ansible_ssh_private_key_file` 是Ansible SSH 私钥路径字段，`~/.ssh/id_rsa` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

YAML 示例：

```yaml
all:
  children:
    web:
      hosts:
        web1:
          ansible_host: 192.168.1.11
        web2:
          ansible_host: 192.168.1.12
    db:
      hosts:
        db1:
          ansible_host: 192.168.1.21
  vars:
    ansible_user: ubuntu
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>all:</code> | 定义 `all` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  children:</code> | 定义 `children` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    web:</code> | 定义 `web` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      hosts:</code> | 定义 `hosts` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        web1:</code> | 定义 `web1` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>          ansible_host: 192.168.1.11</code> | `ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.11` 表示IP 地址，表示一台机器或服务端点的位置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        web2:</code> | 定义 `web2` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>          ansible_host: 192.168.1.12</code> | `ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.12` 表示IP 地址，表示一台机器或服务端点的位置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    db:</code> | 定义 `db` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      hosts:</code> | 定义 `hosts` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>        db1:</code> | 定义 `db1` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>          ansible_host: 192.168.1.21</code> | `ansible_host` 是Ansible 要连接的目标主机地址字段，`192.168.1.21` 表示IP 地址，表示一台机器或服务端点的位置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  vars:</code> | 定义 `vars` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    ansible_user: ubuntu</code> | `ansible_user` 是Ansible 登录用户字段，`ubuntu` 表示登录用户示例，真实环境要换成自己的服务器用户；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

查看 inventory 解析结果：

```bash
ansible-inventory -i inventory.ini --list
ansible-inventory -i inventory.ini --graph
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-inventory -i inventory.ini --list</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>ansible-inventory -i inventory.ini --graph</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## Inventory 变量

常用连接变量：

| 变量 | 作用 |
|---|---|
| `ansible_host` | 实际连接地址 |
| `ansible_port` | SSH 端口 |
| `ansible_user` | 登录用户 |
| `ansible_password` | 登录密码，不推荐明文 |
| `ansible_ssh_private_key_file` | SSH 私钥 |
| `ansible_connection` | 连接类型，如 ssh/local/docker/network_cli |
| `ansible_become` | 是否提权 |
| `ansible_become_user` | 提权到哪个用户 |

例子：

```text
web1 ansible_host=10.0.1.10 ansible_user=ubuntu ansible_port=22
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>web1 ansible_host=10.0.1.10 ansible_user=ubuntu ansible_port=22</code> | `web1` 是主机、服务、告警或资源的示例名称；`ansible_host` 是Ansible 要连接的目标主机地址字段，`10.0.1.10` 表示IP 地址，表示一台机器或服务端点的位置；`ansible_user` 是Ansible 登录用户字段，`ubuntu` 表示登录用户示例，真实环境要换成自己的服务器用户；`ansible_port` 是Ansible SSH 端口字段，`22` 表示端口号，表示服务监听或连接入口。 |

排查连接失败时，先看 inventory 是否被正确解析：

```bash
ansible-inventory -i inventory.ini --host web1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-inventory -i inventory.ini --host web1</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## Patterns：选择目标

Ansible 用 pattern 选择主机。

```bash
ansible web -i inventory.ini -m ping
ansible prod -i inventory.ini -m ping
ansible 'web:&prod' -i inventory.ini -m ping
ansible 'all:!db' -i inventory.ini -m ping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |
| 第 2 行 | <code>ansible prod -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |
| 第 3 行 | <code>ansible 'web:&amp;prod' -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |
| 第 4 行 | <code>ansible 'all:!db' -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

常见：

| Pattern | 含义 |
|---|---|
| `all` | 所有主机 |
| `web` | web 组 |
| `web:db` | web 或 db |
| `web:&prod` | 同时属于 web 和 prod |
| `all:!db` | 所有但排除 db |

生产执行危险任务前，一定先：

```bash
ansible <pattern> -i inventory.ini --list-hosts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible &lt;pattern&gt; -i inventory.ini --list-hosts</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

确认目标机器。

## Ad hoc commands

Ad hoc command 是一次性命令，用 `ansible` 执行。

测试连接：

```bash
ansible all -i inventory.ini -m ping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible all -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

查看 uptime：

```bash
ansible web -i inventory.ini -m command -a "uptime"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -m command -a "uptime"</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

安装软件：

```bash
ansible web -i inventory.ini -b -m apt -a "name=nginx state=present update_cache=yes"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -b -m apt -a "name=nginx state=present update_cache=yes"</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

重启服务：

```bash
ansible web -i inventory.ini -b -m service -a "name=nginx state=restarted"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -b -m service -a "name=nginx state=restarted"</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

复制文件：

```bash
ansible web -i inventory.ini -m copy -a "src=./app.conf dest=/tmp/app.conf"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -m copy -a "src=./app.conf dest=/tmp/app.conf"</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

Ad hoc 适合：

- 快速检查。
- 一次性操作。
- 验证模块参数。

要重复执行、进 Git 审查、多人维护，就写 playbook。

## Module 是什么

Module 是 Ansible 执行具体动作的工具。

常用模块：

| 模块 | 作用 |
|---|---|
| `ping` | 测试 Ansible 连接 |
| `command` | 执行命令，不经过 shell |
| `shell` | 通过 shell 执行命令 |
| `copy` | 复制文件 |
| `template` | Jinja2 模板渲染文件 |
| `file` | 管理文件/目录/权限 |
| `lineinfile` | 管理文件中的一行 |
| `package` | 通用包管理 |
| `apt` | Debian/Ubuntu 包管理 |
| `yum` / `dnf` | RHEL 系包管理 |
| `service` | 管理服务 |
| `systemd_service` | 管理 systemd 服务 |
| `user` | 管理用户 |
| `group` | 管理组 |
| `uri` | HTTP 请求 |
| `debug` | 打印变量 |
| `set_fact` | 设置运行时变量 |
| `assert` | 断言条件 |

查模块文档：

```bash
ansible-doc ansible.builtin.copy
ansible-doc ansible.builtin.systemd_service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-doc ansible.builtin.copy</code> | 执行 `ansible-doc` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ansible-doc ansible.builtin.systemd_service</code> | 执行 `ansible-doc` 相关命令，后面的参数决定它具体操作什么对象。 |

不要把所有事情都写成 `shell`。优先用专用模块，因为专用模块更容易幂等、更能返回结构化结果。

## command 和 shell

`command` 不经过 shell。

```yaml
- name: Check uptime
  ansible.builtin.command: uptime
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Check uptime</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.command: uptime</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`uptime` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

`shell` 经过 shell，支持管道、重定向、变量展开。

```yaml
- name: Count error logs
  ansible.builtin.shell: "grep -c ERROR /var/log/app.log || true"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Count error logs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.shell: "grep -c ERROR /var/log/app.log &#124;&#124; true"</code> | `ansible.builtin.shell` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`grep -c ERROR /var/log/app.log || true` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

优先级：

```text
专用模块 > command > shell
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>专用模块 &gt; command &gt; shell</code> | 这一行里的英文要这样读：`command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`shell` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

如果必须用 command/shell，要考虑 changed 判断：

```yaml
- name: Check current service status
  ansible.builtin.command: systemctl is-active nginx
  register: nginx_status
  changed_when: false
  failed_when: nginx_status.rc not in [0, 3]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Check current service status</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.command: systemctl is-active nginx</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`systemctl is-active nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  register: nginx_status</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`nginx_status` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  failed_when: nginx_status.rc not in [0, 3]</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`nginx_status.rc not in [0, 3]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

否则检查命令可能每次都显示 changed 或 failed。

## Playbook、Play、Task

Playbook 是 YAML 文件，包含一个或多个 plays。

Play 选择一组 hosts，并在这些 hosts 上执行 tasks。

Task 调用一个 module。

结构：

```yaml
- name: Configure web servers
  hosts: web
  become: true
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Ensure nginx is running
      ansible.builtin.systemd_service:
        name: nginx
        state: started
        enabled: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Configure web servers</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  hosts: web</code> | `hosts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`web` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  become: true</code> | `become` 是是否提权执行的配置项，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  tasks:</code> | 定义 `tasks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    - name: Install nginx</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>      ansible.builtin.apt:</code> | 定义 `ansible.builtin.apt` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        name: nginx</code> | `name` 是名称字段，`nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        state: present</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`present` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    - name: Ensure nginx is running</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>      ansible.builtin.systemd_service:</code> | 定义 `ansible.builtin.systemd_service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>        name: nginx</code> | `name` 是名称字段，`nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>        state: started</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`started` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>        enabled: true</code> | `enabled` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

执行：

```bash
ansible-playbook -i inventory.ini site.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 |

输出状态：

| 状态 | 含义 |
|---|---|
| `ok` | 已经是目标状态，没有改变 |
| `changed` | 执行后改变了远端状态 |
| `failed` | 任务失败 |
| `skipped` | 条件不满足，跳过 |
| `unreachable` | 连接不到主机 |

## 幂等性

幂等性是 Ansible 核心概念。

意思：

```text
同一个 playbook 重复执行，如果目标已经符合要求，就不应该继续改变。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>同一个 playbook 重复执行，如果目标已经符合要求，就不应该继续改变。</code> | 这一行里的英文要这样读：`playbook` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

例子：

```yaml
- name: Ensure directory exists
  ansible.builtin.file:
    path: /opt/aiops
    state: directory
    owner: root
    group: root
    mode: "0755"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Ensure directory exists</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.file:</code> | 定义 `ansible.builtin.file` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    path: /opt/aiops</code> | `path` 是路径，`/opt/aiops` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    state: directory</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`directory` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    owner: root</code> | `owner` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`root` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    group: root</code> | `group` 是分组，`root` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    mode: "0755"</code> | `mode` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0755` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

第一次执行可能 `changed`，第二次执行应该 `ok`。

不幂等例子：

```yaml
- name: Append config
  ansible.builtin.shell: "echo 'PORT=8000' >> /etc/app.env"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Append config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.shell: "echo 'PORT=8000' &gt;&gt; /etc/app.env"</code> | `ansible.builtin.shell` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`echo 'PORT=8000' >> /etc/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

每次执行都会追加一行。

改成：

```yaml
- name: Ensure PORT line exists
  ansible.builtin.lineinfile:
    path: /etc/app.env
    regexp: '^PORT='
    line: 'PORT=8000'
    create: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Ensure PORT line exists</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.lineinfile:</code> | 定义 `ansible.builtin.lineinfile` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    path: /etc/app.env</code> | `path` 是路径，`/etc/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    regexp: '^PORT='</code> | `regexp` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`^PORT=` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    line: 'PORT=8000'</code> | `line` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`PORT=8000` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    create: true</code> | `create` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

## Variables

变量可以来自很多地方：

- inventory。
- group_vars。
- host_vars。
- playbook vars。
- role defaults。
- role vars。
- extra vars。
- facts。
- registered variables。

示例：

```yaml
app_name: aiops-api
app_port: 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app_name: aiops-api</code> | `app_name` 这个英文标识可以拆开理解为：应用或服务，名称字段，`aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>app_port: 8000</code> | `app_port` 这个英文标识可以拆开理解为：应用或服务，端口，`8000` 表示端口号，表示服务监听或连接入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

使用：

```yaml
- name: Render app config
  ansible.builtin.template:
    src: app.env.j2
    dest: "/etc/{{ app_name }}.env"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Render app config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    src: app.env.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app.env.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    dest: "/etc/{{ app_name }}.env"</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/{{ app_name }}.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

命令行传变量：

```bash
ansible-playbook -i inventory.ini site.yml -e app_port=9000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml -e app_port=9000</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 |

变量不生效时，要想到变量优先级。官方文档有完整 precedence rules。入门阶段至少记住：`-e` extra vars 优先级非常高，容易覆盖其他地方。

## group_vars 和 host_vars

推荐目录：

```text
inventory/
  prod.ini
group_vars/
  all.yml
  web.yml
host_vars/
  web1.yml
site.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inventory/</code> | `inventory/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  prod.ini</code> | `prod.ini` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>group_vars/</code> | `group_vars/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  all.yml</code> | `all.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  web.yml</code> | `web.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>host_vars/</code> | `host_vars/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>  web1.yml</code> | `web1.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>site.yml</code> | `site.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

`group_vars/web.yml`：

```yaml
app_port: 8000
log_level: info
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app_port: 8000</code> | `app_port` 这个英文标识可以拆开理解为：应用或服务，端口，`8000` 表示端口号，表示服务监听或连接入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>log_level: info</code> | `log_level` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`info` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

`host_vars/web1.yml`：

```yaml
app_port: 8001
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app_port: 8001</code> | `app_port` 这个英文标识可以拆开理解为：应用或服务，端口，`8001` 表示端口号，表示服务监听或连接入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

这样同一个 playbook 可以适配不同组和不同主机。

## Facts

Facts 是 Ansible 收集的远端主机信息。

例如：

- 操作系统。
- IP 地址。
- CPU。
- 内存。
- 主机名。
- Python 信息。

查看：

```bash
ansible web1 -i inventory.ini -m setup
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web1 -i inventory.ini -m setup</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

Playbook 默认会 gather facts：

```yaml
- hosts: web
  gather_facts: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- hosts: web</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  gather_facts: true</code> | `gather_facts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

使用：

```yaml
- name: Print OS
  ansible.builtin.debug:
    msg: "{{ ansible_distribution }} {{ ansible_distribution_version }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Print OS</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    msg: "{{ ansible_distribution }} {{ ansible_distribution_version }}"</code> | `msg` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`{{ ansible_distribution }} {{ ansible_distribution_version }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

如果任务不需要 facts，可以关闭提高速度：

```yaml
gather_facts: false
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gather_facts: false</code> | `gather_facts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

## register、when、loop

### register

保存任务结果：

```yaml
- name: Check service status
  ansible.builtin.command: systemctl is-active aiops-api
  register: service_status
  changed_when: false
  failed_when: false
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Check service status</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.command: systemctl is-active aiops-api</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`systemctl is-active aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  register: service_status</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_status` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  failed_when: false</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

使用结果：

```yaml
- name: Print status
  ansible.builtin.debug:
    var: service_status.stdout
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Print status</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    var: service_status.stdout</code> | `var` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_status.stdout` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### when

条件执行：

```yaml
- name: Restart service if inactive
  ansible.builtin.systemd_service:
    name: aiops-api
    state: restarted
  when: service_status.stdout != "active"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Restart service if inactive</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.systemd_service:</code> | 定义 `ansible.builtin.systemd_service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    name: aiops-api</code> | `name` 是名称字段，`aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    state: restarted</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`restarted` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  when: service_status.stdout != "active"</code> | `when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_status.stdout != "active` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### loop

循环：

```yaml
- name: Install packages
  ansible.builtin.apt:
    name: "{{ item }}"
    state: present
  loop:
    - curl
    - jq
    - vim
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Install packages</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.apt:</code> | 定义 `ansible.builtin.apt` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    name: "{{ item }}"</code> | `name` 是名称字段，`{{ item }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    state: present</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`present` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  loop:</code> | 定义 `loop` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    - curl</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <code>    - jq</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>    - vim</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

## Handlers 和 notify

Handler 是被通知后才执行的任务，常用于“配置变了才重启服务”。

```yaml
- name: Copy nginx config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Reload nginx

handlers:
  - name: Reload nginx
    ansible.builtin.systemd_service:
      name: nginx
      state: reloaded
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Copy nginx config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    src: nginx.conf.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`nginx.conf.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    dest: /etc/nginx/nginx.conf</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/nginx/nginx.conf` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  notify: Reload nginx</code> | `notify` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Reload nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>handlers:</code> | 定义 `handlers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  - name: Reload nginx</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>    ansible.builtin.systemd_service:</code> | 定义 `ansible.builtin.systemd_service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      name: nginx</code> | `name` 是名称字段，`nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>      state: reloaded</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`reloaded` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

如果模板没有变化，task 是 `ok`，handler 不执行。

如果模板变化，task 是 `changed`，handler 在 play 末尾执行。

这就是幂等和减少无谓重启的关键。

## Templates

Ansible template 使用 Jinja2。

模板 `app.env.j2`：

```text
APP_NAME={{ app_name }}
APP_PORT={{ app_port }}
LOG_LEVEL={{ log_level | default("info") }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>APP_NAME={{ app_name }}</code> | `APP_NAME` 这个英文标识可以拆开理解为：应用或服务，名称字段，`{{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>APP_PORT={{ app_port }}</code> | `APP_PORT` 这个英文标识可以拆开理解为：应用或服务，端口，`{{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 3 行 | <code>LOG_LEVEL={{ log_level &#124; default("info") }}</code> | `LOG_LEVEL` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`{{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

任务：

```yaml
- name: Render env file
  ansible.builtin.template:
    src: app.env.j2
    dest: /etc/aiops-api.env
    owner: root
    group: root
    mode: "0644"
  notify: Restart aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Render env file</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    src: app.env.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app.env.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    dest: /etc/aiops-api.env</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/aiops-api.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    owner: root</code> | `owner` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`root` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    group: root</code> | `group` 是分组，`root` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    mode: "0644"</code> | `mode` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0644` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  notify: Restart aiops-api</code> | `notify` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Restart aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

变量缺失时模板会失败。关键变量可以用 `assert` 提前检查。

## Become 提权

很多任务需要 root 权限。

Play 级别：

```yaml
- hosts: web
  become: true
  tasks:
    - name: Install package
      ansible.builtin.apt:
        name: nginx
        state: present
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- hosts: web</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  become: true</code> | `become` 是是否提权执行的配置项，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  tasks:</code> | 定义 `tasks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    - name: Install package</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>      ansible.builtin.apt:</code> | 定义 `ansible.builtin.apt` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>        name: nginx</code> | `name` 是名称字段，`nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        state: present</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`present` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

命令行：

```bash
ansible-playbook -i inventory.ini site.yml --become
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --become</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

如果 sudo 需要密码：

```bash
ansible-playbook -i inventory.ini site.yml --ask-become-pass
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --ask-become-pass</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

排查：

- 远端用户是否有 sudo 权限。
- 是否需要 tty。
- become_user 是否正确。
- sudoers 是否允许无密码。

## Check mode 和 diff mode

Check mode 是 dry run：

```bash
ansible-playbook -i inventory.ini site.yml --check
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --check</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

Diff mode 显示文件差异：

```bash
ansible-playbook -i inventory.ini site.yml --diff
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

一起用：

```bash
ansible-playbook -i inventory.ini site.yml --check --diff
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --check --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

注意：

- 不是所有模块都完整支持 check mode。
- 依赖前面任务结果的条件逻辑在 check mode 中可能不完全准确。
- 但配置文件变更前先 `--check --diff` 非常有价值。

## Tags

Tags 让你只跑 playbook 的一部分。

```yaml
- name: Install nginx
  ansible.builtin.apt:
    name: nginx
    state: present
  tags: [packages]

- name: Render config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  tags: [config]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Install nginx</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.apt:</code> | 定义 `ansible.builtin.apt` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    name: nginx</code> | `name` 是名称字段，`nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    state: present</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`present` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  tags: [packages]</code> | `tags` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[packages]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>- name: Render config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>  ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    src: nginx.conf.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`nginx.conf.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    dest: /etc/nginx/nginx.conf</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/nginx/nginx.conf` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>  tags: [config]</code> | `tags` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[config]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

只跑 config：

```bash
ansible-playbook -i inventory.ini site.yml --tags config
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --tags config</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

跳过：

```bash
ansible-playbook -i inventory.ini site.yml --skip-tags packages
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --skip-tags packages</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

不要滥用 tags 让 playbook 变成隐式流程迷宫。

## Blocks 和错误处理

Block 组织任务并处理错误：

```yaml
- name: Deploy app with rollback message
  block:
    - name: Copy config
      ansible.builtin.template:
        src: app.env.j2
        dest: /etc/app.env

    - name: Restart app
      ansible.builtin.systemd_service:
        name: aiops-api
        state: restarted

  rescue:
    - name: Print failure hint
      ansible.builtin.debug:
        msg: "Deployment failed, check journalctl -u aiops-api"

  always:
    - name: Collect status
      ansible.builtin.command: systemctl status aiops-api --no-pager
      register: app_status
      changed_when: false
      failed_when: false
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Deploy app with rollback message</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  block:</code> | 定义 `block` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - name: Copy config</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>      ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        src: app.env.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app.env.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        dest: /etc/app.env</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/etc/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    - name: Restart app</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      ansible.builtin.systemd_service:</code> | 定义 `ansible.builtin.systemd_service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>        name: aiops-api</code> | `name` 是名称字段，`aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>        state: restarted</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`restarted` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  rescue:</code> | 定义 `rescue` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    - name: Print failure hint</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 15 行 | <code>      ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>        msg: "Deployment failed, check journalctl -u aiops-api"</code> | `msg` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Deployment failed, check journalctl -u aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>  always:</code> | 定义 `always` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>    - name: Collect status</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>      ansible.builtin.command: systemctl status aiops-api --no-pager</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`systemctl status aiops-api --no-pager` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>      register: app_status</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app_status` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <code>      changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <code>      failed_when: false</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

## Roles

Role 用固定目录结构组织可复用自动化。

结构：

```text
roles/
  aiops_exporter/
    defaults/
      main.yml
    vars/
      main.yml
    tasks/
      main.yml
    handlers/
      main.yml
    templates/
      node_exporter.service.j2
    files/
    meta/
      main.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>roles/</code> | `roles/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  aiops_exporter/</code> | `aiops_exporter/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>    defaults/</code> | `defaults/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>      main.yml</code> | `main.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>    vars/</code> | `vars/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>      main.yml</code> | `main.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>    tasks/</code> | `tasks/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>      main.yml</code> | `main.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>    handlers/</code> | `handlers/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>      main.yml</code> | `main.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>    templates/</code> | `templates/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 12 行 | <code>      node_exporter.service.j2</code> | `node_exporter.service.j2` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 13 行 | <code>    files/</code> | `files/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 14 行 | <code>    meta/</code> | `meta/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 15 行 | <code>      main.yml</code> | `main.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

使用：

```yaml
- hosts: web
  become: true
  roles:
    - aiops_exporter
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- hosts: web</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  become: true</code> | `become` 是是否提权执行的配置项，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  roles:</code> | 定义 `roles` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    - aiops_exporter</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

Role 适合：

- 安装 exporter。
- 配置 nginx。
- 管理用户。
- 部署标准 agent。

不要一开始就把简单 playbook 拆成很多 role。等重复和复杂度出现，再抽 role。

## Collections

Collection 是 Ansible 内容分发单元，包含 modules、roles、plugins、docs 等。

安装：

```bash
ansible-galaxy collection install community.general
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-galaxy collection install community.general</code> | 执行 `ansible-galaxy` 相关命令，后面的参数决定它具体操作什么对象。 |

使用 fully qualified collection name：

```yaml
- name: Use builtin copy
  ansible.builtin.copy:
    src: file.txt
    dest: /tmp/file.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Use builtin copy</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.copy:</code> | 定义 `ansible.builtin.copy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    src: file.txt</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`file.txt` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    dest: /tmp/file.txt</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`/tmp/file.txt` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

推荐写 FQCN，比如 `ansible.builtin.copy`，这样可读性更强，也避免模块名冲突。

## Ansible Vault

Vault 用来加密敏感变量文件。

创建：

```bash
ansible-vault create group_vars/prod/vault.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-vault create group_vars/prod/vault.yml</code> | 执行 `ansible-vault` 相关命令，后面的参数决定它具体操作什么对象。 |

编辑：

```bash
ansible-vault edit group_vars/prod/vault.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-vault edit group_vars/prod/vault.yml</code> | 执行 `ansible-vault` 相关命令，后面的参数决定它具体操作什么对象。 |

执行：

```bash
ansible-playbook -i inventory/prod.ini site.yml --ask-vault-pass
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory/prod.ini site.yml --ask-vault-pass</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

或使用密码文件：

```bash
ansible-playbook -i inventory/prod.ini site.yml --vault-password-file .vault-pass
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory/prod.ini site.yml --vault-password-file .vault-pass</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

不要把 `.vault-pass` 提交到 Git。

Vault 保护的是文件内容，但自动化执行时变量会被解密进入内存和任务上下文。日志里仍要避免打印 secret。

## ansible.cfg

Ansible 行为可通过配置文件、环境变量、命令行、playbook keywords、变量等控制。

项目级 `ansible.cfg` 示例：

```text
[defaults]
inventory = inventory.ini
roles_path = roles
host_key_checking = True
retry_files_enabled = False
stdout_callback = yaml
timeout = 30

[privilege_escalation]
become = False
become_method = sudo
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[defaults]</code> | 这一行里的英文要这样读：`defaults` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>inventory = inventory.ini</code> | `inventory` 是主机、服务、告警或资源的示例名称；`inventory` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`inventory.ini` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 3 行 | <code>roles_path = roles</code> | `roles_path` 是主机、服务、告警或资源的示例名称；`roles_path` 这个英文标识可以拆开理解为：路径，`roles` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 4 行 | <code>host_key_checking = True</code> | `host_key_checking` 是主机、服务、告警或资源的示例名称；`host_key_checking` 是是否检查 SSH 主机指纹的配置项，`True` 表示开启这个配置。 |
| 第 5 行 | <code>retry_files_enabled = False</code> | `retry_files_enabled` 是主机、服务、告警或资源的示例名称；`retry_files_enabled` 是是否生成 Ansible 重试文件的配置项，`False` 表示关闭这个配置。 |
| 第 6 行 | <code>stdout_callback = yaml</code> | `stdout_callback` 是主机、服务、告警或资源的示例名称；`stdout_callback` 是Ansible 输出格式配置项，`yaml` 表示YAML 格式输出，便于阅读结构化结果。 |
| 第 7 行 | <code>timeout = 30</code> | `timeout` 是主机、服务、告警或资源的示例名称；`timeout` 是超时时间字段，`30` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 9 行 | <code>[privilege_escalation]</code> | 这一行里的英文要这样读：`privilege_escalation` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>become = False</code> | `become` 是主机、服务、告警或资源的示例名称；`become` 是是否提权执行的配置项，`False` 表示关闭这个配置。 |
| 第 11 行 | <code>become_method = sudo</code> | `become_method` 是主机、服务、告警或资源的示例名称；`become_method` 是提权方式配置项，`sudo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

查看当前配置：

```bash
ansible-config dump
ansible-config view
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-config dump</code> | 执行 `ansible-config` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ansible-config view</code> | 执行 `ansible-config` 相关命令，后面的参数决定它具体操作什么对象。 |

排查“为什么 Ansible 行为和我想的不一样”时，先看：

```bash
ansible --version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible --version</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

输出里会显示使用的 config file。

## 常用命令字典

### 查看版本

```bash
ansible --version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible --version</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

看 Ansible 版本、Python 版本、配置文件路径、module search path。

### 测试连接

```bash
ansible all -i inventory.ini -m ping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible all -i inventory.ini -m ping</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

### 列出目标主机

```bash
ansible web -i inventory.ini --list-hosts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini --list-hosts</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

执行危险操作前必做。

### 查看 inventory

```bash
ansible-inventory -i inventory.ini --list
ansible-inventory -i inventory.ini --graph
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-inventory -i inventory.ini --list</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>ansible-inventory -i inventory.ini --graph</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 执行 ad hoc

```bash
ansible web -i inventory.ini -m command -a "uptime"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini -m command -a "uptime"</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

### 执行 playbook

```bash
ansible-playbook -i inventory.ini site.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 |

### 语法检查

```bash
ansible-playbook -i inventory.ini site.yml --syntax-check
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --syntax-check</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### dry run

```bash
ansible-playbook -i inventory.ini site.yml --check
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --check</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 显示 diff

```bash
ansible-playbook -i inventory.ini site.yml --diff
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 限制主机

```bash
ansible-playbook -i inventory.ini site.yml --limit web1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --limit web1</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 从某个任务开始

```bash
ansible-playbook -i inventory.ini site.yml --start-at-task "Render config"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --start-at-task "Render config"</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 使用 tags

```bash
ansible-playbook -i inventory.ini site.yml --tags config
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --tags config</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 查看模块文档

```bash
ansible-doc ansible.builtin.copy
ansible-doc -l
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-doc ansible.builtin.copy</code> | 执行 `ansible-doc` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ansible-doc -l</code> | 执行 `ansible-doc` 相关命令，后面的参数决定它具体操作什么对象。 |

### 加密变量

```bash
ansible-vault create vault.yml
ansible-vault edit vault.yml
ansible-vault view vault.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-vault create vault.yml</code> | 执行 `ansible-vault` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ansible-vault edit vault.yml</code> | 执行 `ansible-vault` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ansible-vault view vault.yml</code> | 执行 `ansible-vault` 相关命令，后面的参数决定它具体操作什么对象。 |

### 查看配置

```bash
ansible-config dump
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-config dump</code> | 执行 `ansible-config` 相关命令，后面的参数决定它具体操作什么对象。 |

## AIOps 入门实验

目标：用 Ansible 管理本机或一台测试机，创建目录、渲染配置、安装 systemd service，并通过 handler 只在配置变化时重启。

### 1. Inventory

本机实验：

```text
[lab]
localhost ansible_connection=local
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[lab]</code> | 这一行里的英文要这样读：`lab` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>localhost ansible_connection=local</code> | `localhost` 是主机、服务、告警或资源的示例名称；`ansible_connection` 是Ansible 连接方式字段，`local` 表示本地连接，表示不通过 SSH 连接远程机器。 |

保存为 `inventory.ini`。

### 2. Playbook

`site.yml`：

```yaml
- name: Configure AIOps demo service
  hosts: lab
  become: false
  vars:
    app_name: aiops-demo
    app_dir: /tmp/aiops-demo
    app_port: 8000

  tasks:
    - name: Ensure app directory exists
      ansible.builtin.file:
        path: "{{ app_dir }}"
        state: directory
        mode: "0755"

    - name: Render app env file
      ansible.builtin.template:
        src: app.env.j2
        dest: "{{ app_dir }}/app.env"
        mode: "0644"
      notify: Print restart hint

    - name: Check rendered file
      ansible.builtin.command: "cat {{ app_dir }}/app.env"
      register: env_file
      changed_when: false

    - name: Show rendered file
      ansible.builtin.debug:
        var: env_file.stdout_lines

  handlers:
    - name: Print restart hint
      ansible.builtin.debug:
        msg: "Config changed; production playbook would restart {{ app_name }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Configure AIOps demo service</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  hosts: lab</code> | `hosts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`lab` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  become: false</code> | `become` 是是否提权执行的配置项，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  vars:</code> | 定义 `vars` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    app_name: aiops-demo</code> | `app_name` 这个英文标识可以拆开理解为：应用或服务，名称字段，`aiops-demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    app_dir: /tmp/aiops-demo</code> | `app_dir` 这个英文标识可以拆开理解为：应用或服务，`/tmp/aiops-demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    app_port: 8000</code> | `app_port` 这个英文标识可以拆开理解为：应用或服务，端口，`8000` 表示端口号，表示服务监听或连接入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  tasks:</code> | 定义 `tasks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>    - name: Ensure app directory exists</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>      ansible.builtin.file:</code> | 定义 `ansible.builtin.file` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>        path: "{{ app_dir }}"</code> | `path` 是路径，`{{ app_dir }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>        state: directory</code> | `state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`directory` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>        mode: "0755"</code> | `mode` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0755` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>    - name: Render app env file</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 17 行 | <code>      ansible.builtin.template:</code> | 定义 `ansible.builtin.template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>        src: app.env.j2</code> | `src` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app.env.j2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>        dest: "{{ app_dir }}/app.env"</code> | `dest` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`{{ app_dir }}/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>        mode: "0644"</code> | `mode` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0644` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>      notify: Print restart hint</code> | `notify` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Print restart hint` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <code>    - name: Check rendered file</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 24 行 | <code>      ansible.builtin.command: "cat {{ app_dir }}/app.env"</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`cat {{ app_dir }}/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <code>      register: env_file</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`env_file` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 26 行 | <code>      changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 28 行 | <code>    - name: Show rendered file</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 29 行 | <code>      ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 30 行 | <code>        var: env_file.stdout_lines</code> | `var` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`env_file.stdout_lines` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>  handlers:</code> | 定义 `handlers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 33 行 | <code>    - name: Print restart hint</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 34 行 | <code>      ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 35 行 | <code>        msg: "Config changed; production playbook would restart {{ app_name }}"</code> | `msg` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Config changed; production playbook would restart {{ app_name }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

模板 `app.env.j2`：

```text
APP_NAME={{ app_name }}
APP_PORT={{ app_port }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>APP_NAME={{ app_name }}</code> | `APP_NAME` 这个英文标识可以拆开理解为：应用或服务，名称字段，`{{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>APP_PORT={{ app_port }}</code> | `APP_PORT` 这个英文标识可以拆开理解为：应用或服务，端口，`{{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

### 3. 执行

```bash
ansible-playbook -i inventory.ini site.yml --check --diff
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini site.yml --check --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>ansible-playbook -i inventory.ini site.yml</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ansible-playbook -i inventory.ini site.yml</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 |

观察：

- 第一次执行目录和文件可能 changed。
- 第二次执行应大多 ok。
- 修改 `app_port` 后，template task changed，handler 执行。

### 4. 形成学习证据

记录：

```text
inventory:
第一次 recap:
第二次 recap:
哪个任务 changed:
为什么 handler 执行:
为什么 command 任务 changed_when=false:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inventory:</code> | `inventory` 是inventory 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 2 行 | <code>第一次 recap:</code> | 这一行里的英文要这样读：`recap` 是Ansible 执行结果汇总。 |
| 第 3 行 | <code>第二次 recap:</code> | 这一行里的英文要这样读：`recap` 是Ansible 执行结果汇总。 |
| 第 4 行 | <code>哪个任务 changed:</code> | 这一行里的英文要这样读：`changed` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>为什么 handler 执行:</code> | 这一行里的英文要这样读：`handler` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>为什么 command 任务 changed_when=false:</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false:` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| UNREACHABLE | `-vvv`、inventory | SSH 地址/用户/密钥错 | 查 `ansible_host`、`ansible_user`、key |
| ping 模块失败 | Python/连接 | 远端 Python 缺失或权限问题 | 安装 Python 或调整 interpreter |
| sudo 失败 | become | 用户无 sudo、需要密码 | `--ask-become-pass`、sudoers |
| 变量不生效 | inventory graph、debug | 变量优先级、组名错 | `debug` 打印变量，查 precedence |
| playbook 语法失败 | `--syntax-check` | YAML 缩进、冒号、列表 | 先 syntax-check |
| 任务每次 changed | 模块/changed_when | shell 不幂等、状态判断缺失 | 用专用模块或 changed_when |
| handler 不执行 | notify/task 状态 | task 没 changed、handler 名不匹配 | 看 task 结果和 handler 名 |
| 模板渲染失败 | error line | 变量缺失、Jinja 语法错 | `debug` 变量，检查模板 |
| check mode 不准 | 模块支持度 | 模块不支持 check 或依赖前序结果 | 看模块文档 |
| Vault 解不开 | vault password | 密码文件错、未传参数 | `--ask-vault-pass` |

## 排障流程：SSH 连接失败

先列目标：

```bash
ansible web -i inventory.ini --list-hosts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web -i inventory.ini --list-hosts</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

再看 inventory：

```bash
ansible-inventory -i inventory.ini --host web1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-inventory -i inventory.ini --host web1</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

用 SSH 手工验证：

```bash
ssh -i ~/.ssh/id_rsa ubuntu@192.168.1.11
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ssh -i ~/.ssh/id_rsa ubuntu@192.168.1.11</code> | 执行 `ssh` 相关命令，后面的参数决定它具体操作什么对象。 |

加详细日志：

```bash
ansible web1 -i inventory.ini -m ping -vvv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible web1 -i inventory.ini -m ping -vvv</code> | 执行 Ansible 自动化命令，用来批量检查或变更服务器。 |

检查：

- `ansible_host`。
- `ansible_user`。
- `ansible_port`。
- 私钥路径。
- known_hosts。
- 防火墙。
- 远端 Python。

## 排障流程：任务每次都 changed

先看任务是否真的改变了状态。

常见坏例子：

```yaml
- name: Append line
  ansible.builtin.shell: "echo PORT=8000 >> /etc/app.env"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Append line</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.shell: "echo PORT=8000 &gt;&gt; /etc/app.env"</code> | `ansible.builtin.shell` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`echo PORT=8000 >> /etc/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

改成：

```yaml
- name: Ensure line
  ansible.builtin.lineinfile:
    path: /etc/app.env
    regexp: '^PORT='
    line: 'PORT=8000'
    create: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Ensure line</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.lineinfile:</code> | 定义 `ansible.builtin.lineinfile` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    path: /etc/app.env</code> | `path` 是路径，`/etc/app.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    regexp: '^PORT='</code> | `regexp` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`^PORT=` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    line: 'PORT=8000'</code> | `line` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`PORT=8000` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    create: true</code> | `create` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

如果是检查命令：

```yaml
- name: Check service
  ansible.builtin.command: systemctl is-active nginx
  register: result
  changed_when: false
  failed_when: result.rc not in [0, 3]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Check service</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.command: systemctl is-active nginx</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`systemctl is-active nginx` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  register: result</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`result` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  failed_when: result.rc not in [0, 3]</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`result.rc not in [0, 3]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

原则：

```text
能用状态模块就不用 shell
检查任务用 changed_when=false
失败条件用 failed_when 明确表达
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>能用状态模块就不用 shell</code> | 这一行里的英文要这样读：`shell` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>检查任务用 changed_when=false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置。 |
| 第 3 行 | <code>失败条件用 failed_when 明确表达</code> | 这一行里的英文要这样读：`failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

## 排障流程：变量不生效

打印变量：

```yaml
- name: Show app_port
  ansible.builtin.debug:
    var: app_port
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Show app_port</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    var: app_port</code> | `var` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`app_port` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

查看 inventory：

```bash
ansible-inventory -i inventory.ini --host web1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-inventory -i inventory.ini --host web1</code> | 执行 `ansible-inventory` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

检查：

- group_vars 文件名是否等于组名。
- host_vars 文件名是否等于 inventory host 名。
- 是否被 `-e` extra vars 覆盖。
- role defaults 和 vars 优先级。
- 变量拼写是否一致。

## AIOps 自动化诊断脚本

Ansible 可以作为 runbook 执行器，下面是一个收集服务证据的 playbook。

```yaml
- name: Collect AIOps service evidence
  hosts: web
  become: true
  gather_facts: true
  vars:
    service_name: aiops-api

  tasks:
    - name: Get service status
      ansible.builtin.command: "systemctl status {{ service_name }} --no-pager"
      register: service_status
      changed_when: false
      failed_when: false

    - name: Get recent logs
      ansible.builtin.command: "journalctl -u {{ service_name }} -n 100 --no-pager"
      register: service_logs
      changed_when: false
      failed_when: false

    - name: Print evidence
      ansible.builtin.debug:
        msg:
          - "{{ service_status.stdout_lines }}"
          - "{{ service_logs.stdout_lines }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Collect AIOps service evidence</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  hosts: web</code> | `hosts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`web` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  become: true</code> | `become` 是是否提权执行的配置项，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  gather_facts: true</code> | `gather_facts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  vars:</code> | 定义 `vars` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    service_name: aiops-api</code> | `service_name` 是服务名称字段，`aiops-api` 是具体服务名，表示这条记录属于这个服务；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  tasks:</code> | 定义 `tasks` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    - name: Get service status</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>      ansible.builtin.command: "systemctl status {{ service_name }} --no-pager"</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`systemctl status {{ service_name }} --no-pager` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>      register: service_status</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_status` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>      changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>      failed_when: false</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>    - name: Get recent logs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>      ansible.builtin.command: "journalctl -u {{ service_name }} -n 100 --no-pager"</code> | `ansible.builtin.command` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`journalctl -u {{ service_name }} -n 100 --no-pager` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>      register: service_logs</code> | `register` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`service_logs` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>      changed_when: false</code> | `changed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>      failed_when: false</code> | `failed_when` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`false` 表示关闭这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>    - name: Print evidence</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>      ansible.builtin.debug:</code> | 定义 `ansible.builtin.debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>        msg:</code> | 定义 `msg` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 24 行 | <code>          - "{{ service_status.stdout_lines }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 25 行 | <code>          - "{{ service_logs.stdout_lines }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

生产化前要补：

- 输出到文件。
- 脱敏。
- 限制并发。
- 失败不扩散。
- 执行前确认。
- 执行后验证。

## 面试怎么讲

Ansible 是无 agent 的自动化工具，通常在 control node 上读取 inventory 和 playbook，通过 SSH 连接 managed nodes，并调用模块把远端系统调整到目标状态。Inventory 定义主机、分组和连接变量；playbook 由 plays 和 tasks 组成；task 调用 module；变量、facts、templates 让同一套 playbook 适配不同环境；handlers 让配置变化时才触发重启；roles 用固定结构复用任务；Vault 加密敏感变量；check/diff mode 用于变更前预览。排障时我会先确认 inventory 和连接，再用 `--syntax-check`、`--check --diff`、`-vvv`、`debug`、`register`、`changed_when` 定位问题。

## 小白可能会问

### Ansible 需要在每台机器安装 agent 吗？

通常不需要。Linux 场景主要通过 SSH 连接远端执行模块。

### `ansible -m ping` 是网络 ping 吗？

不是。它是 Ansible 的 ping 模块，用来测试能否连接远端并执行模块。

### 为什么任务每次都是 changed？

可能用了不幂等的 shell/command，或者没有正确设置 `changed_when`。优先使用专用模块。

### 为什么配置文件变了才重启服务？

用 `notify` 和 `handlers`。只有通知它的任务 changed，handler 才会执行。

### 变量到底从哪里来？

可能来自 inventory、group_vars、host_vars、play vars、role defaults、role vars、extra vars、facts 等。变量不对时先 debug 和查看 inventory 解析结果。

### check mode 可以完全相信吗？

不能绝对相信。它很有用，但取决于模块支持程度和任务逻辑。

## 学习路线

第一阶段：连接和 inventory

- inventory。
- SSH 连接变量。
- patterns。
- ad hoc commands。

第二阶段：playbook

- play。
- task。
- modules。
- become。
- register。
- when。
- loop。

第三阶段：幂等和配置

- file/copy/template/lineinfile。
- handlers。
- changed_when。
- failed_when。
- check/diff mode。

第四阶段：工程化

- group_vars/host_vars。
- roles。
- collections。
- ansible.cfg。
- vault。

第五阶段：AIOps

- 批量巡检。
- 证据采集。
- runbook 执行。
- 自动化修复。
- 执行审计。

## 学习检查清单

- [ ] 我能解释 control node 和 managed node。
- [ ] 我能写 INI 和 YAML inventory。
- [ ] 我能解释 `ansible_host`、`ansible_user`、`ansible_connection`。
- [ ] 我能用 ad hoc command 测试连接。
- [ ] 我能写一个最小 playbook。
- [ ] 我能解释 play、task、module。
- [ ] 我能解释幂等性和 changed。
- [ ] 我能使用 register、when、loop。
- [ ] 我能使用 template 和 handler。
- [ ] 我能解释 become。
- [ ] 我能使用 `--check --diff`。
- [ ] 我能解释 roles 的目录结构。
- [ ] 我能使用 ansible-vault。
- [ ] 我能排查 SSH 连接失败。
- [ ] 我能排查变量不生效和任务总是 changed。
- [ ] 我能把 Ansible playbook 接入 AIOps runbook。

## 面试题

1. Ansible 解决什么问题？
2. Ansible 为什么说是 agentless？
3. control node 和 managed node 分别是什么？
4. Inventory 是什么？host vars 和 group vars 有什么区别？
5. Ad hoc command 和 playbook 有什么区别？
6. Playbook、play、task、module 的关系是什么？
7. 什么是幂等性？
8. 为什么优先用专用模块而不是 shell？
9. `command` 和 `shell` 有什么区别？
10. `changed_when` 和 `failed_when` 有什么用？
11. register 和 facts 有什么区别？
12. handler 什么时候执行？
13. role 解决什么问题？
14. collection 是什么？
15. check mode 和 diff mode 有什么用？
16. Ansible Vault 解决什么问题？
17. SSH 连接失败如何排查？
18. 变量不生效如何排查？
19. 任务每次 changed 如何排查？
20. Ansible 在 AIOps 自动化中适合做什么？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `inventory.ini`。
- 一个 `site.yml`，包含 file、template、command、debug、handler。
- 一份 `--check --diff` 输出记录。
- 一份“任务第一次 changed、第二次 ok”的幂等性记录。
- 一份 SSH 连接失败或变量不生效排障笔记。
- 一个 AIOps 证据采集 playbook。
