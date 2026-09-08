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
control node（控制节点）
  -> ansible.cfg（控制端配置文件）
  -> inventory（主机清单）
  -> variables（变量）
  -> ad hoc command（临时命令）/ playbook（任务剧本）
  -> modules（具体操作模块）
  -> managed nodes（被管理节点）
  -> result（执行结果）: ok（符合预期）/ changed（发生改变）/ failed（失败）/ skipped（跳过）
```

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
Installation and getting started（安装与起步）
  -> install ansible-core（安装核心执行工具）
  -> control node requirements（控制节点要求）
  -> managed node connection（连接被管理节点）

Inventory（主机清单）
  -> inventory sources（清单来源）
  -> groups（主机组）
  -> host variables（主机变量）
  -> group variables（组变量）
  -> patterns（选择目标的匹配表达式）
  -> dynamic inventory（动态清单）
  -> connection variables（连接参数）

Command line tools（命令行工具）
  -> ansible（临时执行）
  -> ansible-playbook（运行剧本）
  -> ansible-inventory（检查主机清单）
  -> ansible-doc（查看模块手册）
  -> ansible-config（查看配置）
  -> ansible-vault（加解密变量文件）

Playbooks（任务剧本）
  -> plays（一组目标主机的任务安排）
  -> tasks（任务）
  -> modules（操作模块）
  -> variables（变量）
  -> facts（采集到的主机事实）
  -> conditionals（条件判断）
  -> loops（循环）
  -> handlers（被变化通知触发的任务）
  -> templates（模板渲染）
  -> tags（标签选择）
  -> blocks（任务块）
  -> error handling（错误处理）

Reuse（复用）
  -> roles（结构化角色）
  -> includes（运行时包含）
  -> imports（静态导入）
  -> collections（内容集合）

Security and validation（安全与验证）
  -> become（切换执行身份）
  -> vault（加密敏感文件）
  -> check mode（预演模式）
  -> diff mode（差异展示）

Reference（参考手册）
  -> playbook keywords（剧本关键字）
  -> configuration settings（配置设置）
  -> module index（模块索引）
  -> plugin index（插件索引）
  -> precedence rules（覆盖优先级规则）
```

学习顺序：

```text
先用 inventory 找到机器
  -> 用 ad hoc 命令验证连接和模块
  -> 写 playbook 表达重复动作
  -> 用 variables/facts/templates 适配环境差异
  -> 用 handlers 和 roles 组织工程
  -> 用 check/diff/vault 提升安全和可审计
```

## Ansible 在 AIOps 链路中的位置

Ansible 在 AIOps 里常扮演“自动化执行器”和“配置收敛器”。

```text
Prometheus / Alertmanager / Loki / Elasticsearch（指标、告警管理、日志与检索系统）
  -> 发现异常
  -> AIOps 诊断
  -> 选择 runbook
  -> Ansible playbook 执行检查或修复
  -> systemd / files / packages / services（服务管理、文件、软件包与运行服务）
  -> 验证指标恢复
```

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
control node（控制节点）
  -> SSH（安全远程连接）
managed node（被管理节点）
```

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

查看 inventory 解析结果：

```bash
ansible-inventory -i inventory.ini --list
ansible-inventory -i inventory.ini --graph
```

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

排查连接失败时，先看 inventory 是否被正确解析：

```bash
ansible-inventory -i inventory.ini --host web1
```

## Patterns：选择目标

Ansible 用 pattern 选择主机。

```bash
ansible web -i inventory.ini -m ping
ansible prod -i inventory.ini -m ping
ansible 'web:&prod' -i inventory.ini -m ping
ansible 'all:!db' -i inventory.ini -m ping
```

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

确认目标机器。

## Ad hoc commands

Ad hoc command 是一次性命令，用 `ansible` 执行。

测试连接：

```bash
ansible all -i inventory.ini -m ping
```

查看 uptime：

```bash
ansible web -i inventory.ini -m command -a "uptime"
```

安装软件：

```bash
ansible web -i inventory.ini -b -m apt -a "name=nginx state=present update_cache=yes"
```

重启服务：

```bash
ansible web -i inventory.ini -b -m service -a "name=nginx state=restarted"
```

复制文件：

```bash
ansible web -i inventory.ini -m copy -a "src=./app.conf dest=/tmp/app.conf"
```

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

不要把所有事情都写成 `shell`。优先用专用模块，因为专用模块更容易幂等、更能返回结构化结果。

## command 和 shell

`command` 不经过 shell。

```yaml
- name: Check uptime
  ansible.builtin.command: uptime
```

`shell` 经过 shell，支持管道、重定向、变量展开。

```yaml
- name: Count error logs
  ansible.builtin.shell: "grep -c ERROR /var/log/app.log || true"
```

优先级：

```text
专用模块 > command > shell
```

如果必须用 command/shell，要考虑 changed 判断：

```yaml
- name: Check current service status
  ansible.builtin.command: systemctl is-active nginx
  register: nginx_status
  changed_when: false
  failed_when: nginx_status.rc not in [0, 3]
```

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

执行：

```bash
ansible-playbook -i inventory.ini site.yml
```

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

第一次执行可能 `changed`，第二次执行应该 `ok`。

不幂等例子：

```yaml
- name: Append config
  ansible.builtin.shell: "echo 'PORT=8000' >> /etc/app.env"
```

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

使用：

```yaml
- name: Render app config
  ansible.builtin.template:
    src: app.env.j2
    dest: "/etc/{{ app_name }}.env"
```

命令行传变量：

```bash
ansible-playbook -i inventory.ini site.yml -e app_port=9000
```

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

`group_vars/web.yml`：

```yaml
app_port: 8000
log_level: info
```

`host_vars/web1.yml`：

```yaml
app_port: 8001
```

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

Playbook 默认会 gather facts：

```yaml
- hosts: web
  gather_facts: true
```

使用：

```yaml
- name: Print OS
  ansible.builtin.debug:
    msg: "{{ ansible_distribution }} {{ ansible_distribution_version }}"
```

如果任务不需要 facts，可以关闭提高速度：

```yaml
gather_facts: false
```

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

使用结果：

```yaml
- name: Print status
  ansible.builtin.debug:
    var: service_status.stdout
```

### when

条件执行：

```yaml
- name: Restart service if inactive
  ansible.builtin.systemd_service:
    name: aiops-api
    state: restarted
  when: service_status.stdout != "active"
```

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

命令行：

```bash
ansible-playbook -i inventory.ini site.yml --become
```

如果 sudo 需要密码：

```bash
ansible-playbook -i inventory.ini site.yml --ask-become-pass
```

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

Diff mode 显示文件差异：

```bash
ansible-playbook -i inventory.ini site.yml --diff
```

一起用：

```bash
ansible-playbook -i inventory.ini site.yml --check --diff
```

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

只跑 config：

```bash
ansible-playbook -i inventory.ini site.yml --tags config
```

跳过：

```bash
ansible-playbook -i inventory.ini site.yml --skip-tags packages
```

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

使用：

```yaml
- hosts: web
  become: true
  roles:
    - aiops_exporter
```

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

使用 fully qualified collection name：

```yaml
- name: Use builtin copy
  ansible.builtin.copy:
    src: file.txt
    dest: /tmp/file.txt
```

推荐写 FQCN，比如 `ansible.builtin.copy`，这样可读性更强，也避免模块名冲突。

## Ansible Vault

Vault 用来加密敏感变量文件。

创建：

```bash
ansible-vault create group_vars/prod/vault.yml
```

编辑：

```bash
ansible-vault edit group_vars/prod/vault.yml
```

执行：

```bash
ansible-playbook -i inventory/prod.ini site.yml --ask-vault-pass
```

或使用密码文件：

```bash
ansible-playbook -i inventory/prod.ini site.yml --vault-password-file .vault-pass
```

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
stdout_callback = default
timeout = 30

[privilege_escalation]
become = False
become_method = sudo
```

查看当前配置：

```bash
ansible-config dump
ansible-config view
```

排查“为什么 Ansible 行为和我想的不一样”时，先看：

```bash
ansible --version
```

输出里会显示使用的 config file。

## 常用命令字典

### 查看版本

```bash
ansible --version
```

看 Ansible 版本、Python 版本、配置文件路径、module search path。

### 测试连接

```bash
ansible all -i inventory.ini -m ping
```

### 列出目标主机

```bash
ansible web -i inventory.ini --list-hosts
```

执行危险操作前必做。

### 查看 inventory

```bash
ansible-inventory -i inventory.ini --list
ansible-inventory -i inventory.ini --graph
```

### 执行 ad hoc

```bash
ansible web -i inventory.ini -m command -a "uptime"
```

### 执行 playbook

```bash
ansible-playbook -i inventory.ini site.yml
```

### 语法检查

```bash
ansible-playbook -i inventory.ini site.yml --syntax-check
```

### dry run

```bash
ansible-playbook -i inventory.ini site.yml --check
```

### 显示 diff

```bash
ansible-playbook -i inventory.ini site.yml --diff
```

### 限制主机

```bash
ansible-playbook -i inventory.ini site.yml --limit web1
```

### 从某个任务开始

```bash
ansible-playbook -i inventory.ini site.yml --start-at-task "Render config"
```

### 使用 tags

```bash
ansible-playbook -i inventory.ini site.yml --tags config
```

### 查看模块文档

```bash
ansible-doc ansible.builtin.copy
ansible-doc -l
```

### 加密变量

```bash
ansible-vault create vault.yml
ansible-vault edit vault.yml
ansible-vault view vault.yml
```

### 查看配置

```bash
ansible-config dump
```

## AIOps 入门实验

目标：用 Ansible 管理本机或一台测试机，创建目录、渲染配置，并通过 handler 观察“变化才通知”。本例 handler 仅打印提示，不安装 systemd service，也不实际重启服务。

### 1. Inventory

本机实验：

```text
[lab]
localhost ansible_connection=local
```

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

模板 `app.env.j2`：

```text
APP_NAME={{ app_name }}
APP_PORT={{ app_port }}
```

### 3. 执行

```bash
ansible-playbook -i inventory.ini site.yml --check --diff
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml
```

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

再看 inventory：

```bash
ansible-inventory -i inventory.ini --host web1
```

用 SSH 手工验证：

```bash
ssh -i ~/.ssh/id_rsa ubuntu@192.168.1.11
```

加详细日志：

```bash
ansible web1 -i inventory.ini -m ping -vvv
```

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

改成：

```yaml
- name: Ensure line
  ansible.builtin.lineinfile:
    path: /etc/app.env
    regexp: '^PORT='
    line: 'PORT=8000'
    create: true
```

如果是检查命令：

```yaml
- name: Check service
  ansible.builtin.command: systemctl is-active nginx
  register: result
  changed_when: false
  failed_when: result.rc not in [0, 3]
```

原则：

```text
能用状态模块就不用 shell
检查任务用 changed_when=false
失败条件用 failed_when 明确表达
```

## 排障流程：变量不生效

打印变量：

```yaml
- name: Show app_port
  ansible.builtin.debug:
    var: app_port
```

查看 inventory：

```bash
ansible-inventory -i inventory.ini --host web1
```

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

## 老师带你理解一次“配置收敛”

假设 30 台服务器的日志级别应该都是 `info`，其中两台被临时改为 `debug`。你希望恢复两台，另外 28 台保持原状。Ansible 的价值就在这里：先读你声明的目标，再由模块判断当前状态，必要时改变，最后返回结构化结果。这个过程叫收敛，就是让实际状态逐渐靠近期望状态。

学生问：“把 `changed_when: false` 加上，是不是就幂等了？”不是。它只改变报告的状态。若命令每次追加一行，副作用仍然重复发生，只是你把黄灯涂成了绿灯。判断幂等要看文件、服务或外部系统实际状态；报告必须忠实于事实，不能拿来装饰流水线。

再想一个问题：前 10 台成功，第 11 台失败，剩余机器怎么办？Ansible 不是跨机器数据库事务，不会自动把已修改的 10 台回滚。你需要控制批次、停止条件、健康验证和恢复步骤。`serial` 控制每批主机数量，`forks` 控制并行执行能力，二者不是同一个概念；提高并发可能压垮 SSH、包仓库或依赖服务。[执行策略说明](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_strategies.html)

### 变量、事实与任务结果：三类数据别混在一起

变量表达输入与配置，例如期望端口是 8000。Facts（事实）表达采集时观察到的主机信息，例如操作系统版本。`register` 保存某次任务的结果，例如 HTTP 检查返回 200。事实与结果都带时间性，不能把上周缓存的事实当作此刻健康证明。

排查模板值错误时，先确认目标主机，再检查清单合并和变量来源，最后只打印必要的非敏感字段。命令行 `-e` 的高优先级可能覆盖文件值；组名拼写错则可能根本没加载 `group_vars`。输出完整 inventory 可能含密钥或连接信息，交给模型或写入 Git 前先脱敏。

Handler 可以把多次配置变化合并成少量后续动作，但触发依赖任务报告 `changed`。中途失败时 handler 是否仍运行，还受失败处理和 `force_handlers` 等设置影响，不能仅凭模板任务成功就认定服务已经加载新配置。[错误处理说明](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_error_handling.html)

### 预演为什么不是一次无副作用的正式执行

Check mode（检查模式）由模块决定如何模拟。一个前置任务只是在预演里“预计创建文件”，后置读取命令可能看不到文件；依赖注册变量的条件也可能无法完整推演。因此第一次基础实验先跑语法检查，再了解 check mode 的限制，最终仍要在隔离目标正式执行和验证。

Diff mode（差异模式）会展示文件内容变化，配置里若有密码就可能泄漏。Vault 保护文件静态存储，解密后仍会进入内存、模块参数或日志。使用 `no_log` 减少敏感输出，并限制日志访问；它也不能替代可信模块、目标权限和密钥生命周期治理。

## 本地双层带练：验证参数，再修改文件

在 Linux 或 WSL 控制节点准备 Python 虚拟环境，按官方支持矩阵安装 ansible-core，记录 `ansible --version`。新建专用实验目录，将下面内容保存为 `classroom.yml`。它只连接 localhost，在剧本目录的 `classroom-output` 下写一个文件，不需要 SSH 或提权。

```yaml
- name: 课堂配置收敛实验
  hosts: localhost
  connection: local
  gather_facts: false
  vars:
    alert_threshold: 5
    lab_output: "{{ playbook_dir }}/classroom-output"
  tasks:
    - name: 先拒绝超出范围的输入
      ansible.builtin.assert:
        that:
          - alert_threshold | int >= 1
          - alert_threshold | int <= 100
        fail_msg: "阈值必须在 1 到 100 之间"
    - name: 创建实验目录
      ansible.builtin.file:
        path: "{{ lab_output }}"
        state: directory
        mode: "0700"
    - name: 写入目标配置
      ansible.builtin.copy:
        content: "threshold={{ alert_threshold | int }}\n"
        dest: "{{ lab_output }}/rule.conf"
        mode: "0600"
      notify: 记录配置变化
    - name: 读取真实文件
      ansible.builtin.slurp:
        src: "{{ lab_output }}/rule.conf"
      register: actual_rule
    - name: 验证真实内容
      ansible.builtin.assert:
        that:
          - "(actual_rule.content | b64decode | trim) == ('threshold=' ~ (alert_threshold | int | string))"
  handlers:
    - name: 记录配置变化
      ansible.builtin.debug:
        msg: "实验配置已变化；真实服务还需单独验证加载版本"
```

`slurp` 读取文件并以 Base64 编码返回，`b64decode` 解码回文本；编码不是加密。`assert` 是断言：条件不成立就让任务失败。它放在写入前，防止把明显错误输入发到目标。这个校验使用整型转换演示范围检查，业务中还应对输入类型与允许格式做更严格校验。

```bash
ansible-playbook -i localhost, classroom.yml --syntax-check
ansible-playbook -i localhost, classroom.yml
ansible-playbook -i localhost, classroom.yml
ansible-playbook -i localhost, classroom.yml -e alert_threshold=999
cat classroom-output/rule.conf
ansible-playbook -i localhost, classroom.yml -e alert_threshold=8
```

`localhost,` 末尾逗号表示直接给一项主机列表。基础实验预期第二次运行 `changed=0`；故障实验传入 999 应在第一任务失败，文件仍为 `threshold=5`；修复为 8 后文件变成 8，handler 出现一次。若第二次仍变化，查看文件内容、权限和其他进程是否改写；若 999 真被写入，核对是否运行了另一份剧本。

保存三次 recap（执行汇总）和配置对照。清理时确认 `classroom-output` 在本次实验目录内，手动删除该目录；保留剧本与脱敏日志作为证据。本实验不包含真实服务重启，不能据此声称已验证滚动发布。

## 生产与面试：把 30 台机器的风险讲清楚

一个实际服务配置变更可按“清单确认、备份当前配置、校验新文件、小批写入、重载、请求检查、再扩大批次”推进。备份只证明旧文件存在，回滚还要确认旧程序能读取、服务加载成功及健康恢复。`rescue` 中仅打印一句失败提示不是回滚实现。

把控制节点放到受控环境，使用专用执行身份、限制目标组和提权范围；生产与测试清单避免仅靠一个易输错的变量区分。大规模执行评估连接并发、包仓库负载、主机资源与任务时长，记录每台主机的版本和结果。多个控制器同时管理同一配置会相互覆盖，要用调度互斥或所有权划分解决。

升级 ansible-core、collection 或 Python 前锁定测试矩阵。核心版本兼容不代表所有 collection 都兼容；通过依赖清单固定内容版本，先在试验组验证模板、条件、返回结构和幂等性。AIOps 自动触发还需要告警去重、同目标互斥、执行时限和恢复验证，否则一阵重复告警可能变成重启风暴。

**30 秒回答。** Ansible 在控制节点解析清单和剧本，通过连接插件调用模块，使目标收敛到声明状态。可靠自动化需要真实幂等、参数校验、批次控制和执行后验证，状态显示成功不自动代表业务恢复。

**3 分钟回答。** 从一条日志级别配置出发，讲清主机选择、变量合并、模板、模块比较状态、文件写入、handler 和健康检查；再解释 check mode 的模拟边界、跨机器不是原子事务、失败后的局部状态；最后说明如何用串行小批、回滚文件、版本锁定、最小权限与审计，把剧本变成可控的 AIOps 执行器。

1. **任务每次 changed 怎么判断？** 比较实际前后状态；检查 command/shell 是否重复写入；优先状态模块，而非隐藏 changed。
2. **一批机器部分失败怎么办？** 保存每主机结果，停止扩大范围，读取已变更目标状态，再恢复或收敛；不能无差别重跑全部机器。
3. **设计 exporter 灰度升级？** 固定下载摘要和版本、先一台验证指标兼容、检查服务和采集状态，再扩批；恢复旧二进制与配置并再次确认采集。
4. **事故：文件更新但服务读旧值？** 检查 handler 是否触发、失败是否阻止执行、服务是否支持 reload、进程真实读取路径和加载版本，以证据区分模板层与运行层。

## 进阶带练：先看清 Ansible 的五个决定，再批量执行

### 第一个决定：到底选中了谁

老师先给你一个操作习惯：不要一拿到剧本就执行，先问清“清单中的名字代表什么”。Inventory（主机清单）里的 `web-a` 是 Ansible 用来组织目标的别名，不一定是能解析的域名；真正连接的地址可以来自 `ansible_host`。同一台机器若以两个别名出现，可能被执行两次；同名条目在多个清单中合并变量，也可能让你看到的配置与预想不同。

执行前用 `ansible-inventory -i inventory.ini --graph` 看分组，用 `ansible-playbook -i inventory.ini site.yml --list-hosts` 看这次剧本实际选中的目标，再把目标数量与变更单核对。前者回答组织结构，后者回答具体选择，不可互相替代。`--limit` 是在本次目标集合上进一步限制，不会把剧本完全没选中的主机变成目标。动态清单可能随云资源变化，正式变更应保存审批时的资源标识快照，执行前再核对变化，不能只保存一个可能持续扩大的标签。

学生问：“我用了测试组，为什么连到了生产地址？”先查别名解析后的 `ansible_host`、组成员和变量来源，而不是先重置 SSH 密钥。日志里要保留脱敏后的别名、环境和不可变资产标识。生产边界最好同时由账号权限、网络访问和独立清单限制；只靠命名中出现 `test`，不构成可靠隔离。

### 第二个决定：同一个变量最后取什么值

把变量想成不同来源送来的便签：清单变量、组变量、主机变量、角色默认值、剧本变量、命令行额外变量都可能写着相同名字。Ansible 根据规定的优先级决定结果，而不是按你最后打开哪个文件决定。不要强背整张优先级表后就自信上线；生产排查要在不泄露秘密的前提下打印最终的非敏感配置，并定位为什么它来自这一层。

例如 `alert_threshold` 在组中设为 5，执行命令又传 `-e alert_threshold=8`，排障时只查看 `group_vars` 就会误判。额外变量优先级很高，适合显式覆盖，却也容易绕过原本的默认值。将允许覆盖的字段做成白名单，检查类型和范围；对环境、目标路径、下载地址等高风险输入，不接受任意字符串直接拼接命令。

`register` 保存的是模块结果对象，不一定是字符串。`result.stdout` 是命令输出，`result.rc` 是退出码，`result.changed` 是模块报告的变更状态。循环任务会产生结果列表，不能再照搬没有循环时的访问路径。遇到变量未定义，先打印安全的结构或检查 `is defined`，分清任务被条件跳过、作用域不对、返回结构改变这三种原因，不要统一用空字符串兜底后继续危险操作。

Facts（主机事实）是采集时看到的系统信息，例如操作系统家族和网卡；它们不是实时监控流。长时间剧本中磁盘空间、进程状态可能早已变化。若事实被缓存，更要记录采集时间。涉及删除、重启和切流的关键前置条件，应在动作附近重新读取，而不是依赖几个小时前的缓存。

### 第三个决定：模块说 changed，究竟发生了什么

`ansible.builtin.copy` 这类完全限定名称把 collection（内容集合）和模块名一起写出来，减少同名插件冲突。模块通常会读取目标状态，比较期望值，再决定是否执行；这才是幂等的主要来源。`command` 只知道命令如何退出，不能凭空知道命令是否改变业务，所以执行一次外部程序经常会被报告为 changed。

`changed_when: false` 可以修正只读命令的报告，但不能把一个每次追加文件的命令变成幂等。老师会让你检查实际文件行数：第二次运行若又增加了一行，即使 recap 显示零变更，状态仍在变化。同样，`failed_when` 是重新定义失败条件，不是消除真实故障。合理使用是命令的某个非零状态有明确业务含义，并且能用后置检查证明；错误做法是无条件忽略退出码，只为让界面变绿。

Handler（变更通知处理器）适合把多次配置变更合并成一次重载。它不是一个独立常驻的事件总线，而是当前执行过程中被通知后再运行的任务。如果前面的任务失败，后续执行路径和 handler 是否运行会受到策略影响；强制运行 handler 也不一定安全，因为新配置可能尚未完整写入。正确顺序通常是先验证配置语法，再替换文件，再按服务能力重载，最后读取实际运行版本。

配置文件落盘与服务生效是两种证据。模板显示新端口，只证明目标路径的字节更新；服务可能读另一个路径、重载失败、或者需要重启才能应用该字段。因此后置验证至少包含进程状态、监听端口、健康请求和版本信息中的适用项。如果读到旧值，先定位哪一层未生效，不要每次都扩大为整机重启。

### 第四个决定：一次失败会挡住哪些机器

`forks` 控制控制端并行执行工作的大致上限，`serial` 将一个 play 的主机分批，`throttle` 可对特定任务进一步限并发，strategy（执行策略）决定任务如何推进。这几个开关回答不同问题，不是同一个“并发数”的四种写法。默认线性策略强调当前批次任务的推进次序；`free` 策略允许主机按自身速度向前走，适合互不依赖的任务，却可能不适合有严格全局屏障的发布。[执行策略与批次官方说明](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html)

假设 30 台服务组成三个机架，每次拿 10 台不等于安全：若恰好把一个分片的全部副本都放进同一批，会同时失去服务。先按故障域和副本关系设计批次，再选 serial。容量也要看摘除这一批后剩余实例能否承载流量；“一次只一台”对只有一台实例的系统依然意味着全停。

`run_once` 容易被误解为整次发布永远执行一次；结合分批执行时，它可能在各批次执行。数据库迁移、全局锁申请等工作应放入明确的独立阶段，并依靠外部幂等记录或锁约束，不要把全局一致性押在这个参数上。`delegate_to` 只是把任务放到另一个执行位置；多个目标同时委派到同一台机器写同一个文件，仍会竞争，必要时使用单独 play、串行任务或可靠外部存储。

### 一个只改本地文件的部分失败实验

前置条件是 Linux 或 WSL 中已安装与本文兼容的 Ansible，当前目录是新建的 `ansible-partial-lab`，不加载其他清单、不使用提权。用编辑器创建 `inventory.ini`，两条别名都指向本机，只是模拟两个独立目标，绝不是两台真实机器：

```ini
[lab]
lab_a ansible_connection=local allow_update=true
lab_b ansible_connection=local allow_update=false
```

再创建 `partial.yml`：

```yaml
- name: 观察部分成功，不操作真实服务
  hosts: lab
  gather_facts: false
  serial: 1
  tasks:
    - name: 验证本目标获准更新
      ansible.builtin.assert:
        that: allow_update | bool
        fail_msg: "实验主动拒绝此目标"
    - name: 写入每个别名自己的证据文件
      ansible.builtin.copy:
        dest: "{{ playbook_dir }}/{{ inventory_hostname }}.txt"
        content: "version=2\n"
        mode: '0600'
```

先运行 `ansible-playbook -i inventory.ini partial.yml --list-hosts`，应只看到两个实验别名；再执行 `ansible-playbook -i inventory.ini partial.yml`。预期第一个文件生成，第二个目标在断言处失败，整体命令非零。用 `ls -l lab_a.txt` 和 `test ! -e lab_b.txt` 验证：失败没有把已成功主机的文件自动撤销。这就是“跨主机不是事务”的可见证据。

修复时先把清单中 `lab_b` 的允许值改成 `true`，再用 `ansible-playbook -i inventory.ini partial.yml --limit lab_b` 只处理失败目标。预期第二个文件生成，随后完整重跑两个目标应不再有文件内容变化。若两个文件一开始就都生成，检查输入值是否被额外变量覆盖；若写错路径，核对 `playbook_dir` 和实际运行文件。保留初次失败、有限恢复与最终幂等三组结果，清理只删除本实验的两个 `.txt` 文件和清单、剧本；不要清理机器级目录。

### 第五个决定：失败后如何收敛，而不把事故放大

`block`、`rescue`、`always` 可以组织任务错误处理，但不是数据库事务。`rescue` 只对符合条件的任务失败触发；语法错误、连接不可达等情况不等于普通模块任务返回失败，不能假设全部都会走入同一恢复分支。`always` 也不是进程被强制终止后仍必定执行的魔法。需要关键审计时，把执行身份、目标和请求标识先写入受控外部记录，再进行动作。

失败后的第一步是建立每个目标的状态表：未开始、前置检查通过、已写文件、已重载、健康通过、回滚完成。不要只记最终成功或失败，因为同样一个失败状态可能对应“根本没连上”和“服务已经换版但验证超时”。只有知道动作走到哪里，才知道重新执行是安全重试、恢复旧配置还是需要人工确认。

一次 exporter 升级可把健康验证分为两层：本机接口返回指标，监控端确实重新采到该实例。前者验证进程，后者验证网络、采集配置和时间窗口。业务停止条件应写成可观察条件，比如新实例持续不可采、关键指标消失或其他副本容量不足；阈值来自业务目标与基线，不从教程里随意抄一个百分比。

最后，Windows 目标不是把 SSH 地址换一下就能复用所有 Linux 剧本。连接方式、PowerShell 运行环境、路径、权限与模块集合有差异，应选对应 Windows 模块并验证版本支持。把 Linux 的 `systemd` 模块发到 Windows，只会制造错误；把 Windows 路径拼进 Bash 也容易改变转义语义。平台自动化的抽象应统一业务意图，同时保留操作系统适配层，而不是强迫所有机器接受同一组命令。

## 参数与证据的最后一课

同学先看一个容易混淆的词：`--check` 叫检查模式，不等于所有模块都能完整预测结果，也不等于所有插件绝不会产生副作用。模块有各自的支持边界，依赖前序运行结果的后续任务在模拟时可能缺少真实输入。把它用于发现明显变更范围，再用测试环境与小批执行验证，才是合理定位；不得把检查输出当成生产实际验收。

`--diff` 展示变更内容很有帮助，也可能把密码、证书或业务配置写进日志。敏感任务按需禁止差异输出并采用受控日志策略；`no_log` 也不是任意秘密都可以传播的通行证。尽量使用秘密引用而不是把完整凭据放进额外变量、命令行历史或 Git 文件。对手册学习证据而言，字段结构与错误类别比真实密钥更有价值。

跨团队复用 Role（角色）时，把输入、默认值、支持系统、返回证据和可变更路径写清楚。一个叫“安装监控”的角色若顺便修改防火墙、重启数据库、删除旧目录，就超出了可理解的接口。把高风险动作拆开，要求显式启用和审批；角色版本升级也要测试输入兼容、幂等性与回滚行为。

最后做一次自查：你是否能从执行记录还原目标、版本、参数来源、每台机器完成到哪一步，以及哪些检查只做了模拟？如果不能，补证据比再加十个自动任务更重要。面试官问“你如何验证变更安全”，应回答可检查的步骤和局部失败恢复，而不是只展示一次全部绿色的 recap。

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `inventory.ini`。
- 一个 `site.yml`，包含 file、template、command、debug、handler。
- 一份 `--check --diff` 输出记录。
- 一份“任务第一次 changed、第二次 ok”的幂等性记录。
- 一份 SSH 连接失败或变量不生效排障笔记。
- 一个 AIOps 证据采集 playbook。
