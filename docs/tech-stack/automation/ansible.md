# Ansible

> 目标：能写 inventory 和 playbook，把重复运维动作变成可重复、可审计的自动化步骤。

## 官方资料

- [Ansible Community Documentation](https://docs.ansible.com/projects/ansible/latest/index.html)
- [Creating a playbook](https://docs.ansible.com/projects/ansible/latest/getting_started/get_started_playbook.html)
- [Ansible playbooks](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_intro.html)

说明：本文是基于 Ansible 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Ansible 是自动化配置管理和运维编排工具。它能批量执行命令、安装软件、修改配置、管理服务、部署应用。

## 核心原理

Ansible 通常从控制节点发起，通过 SSH 连接 Linux 主机，通过模块执行任务。被控节点通常不需要提前安装 agent。

```text
Control node
  -> inventory
  -> playbook
  -> modules
  -> SSH
  -> managed nodes
```

## 核心概念

- Inventory：主机清单。
- Playbook：自动化剧本。
- Play：针对一组主机的一组任务。
- Task：单个任务。
- Module：实际执行动作的模块。
- Role：可复用组织结构。
- Facts：Ansible 收集到的主机信息。

## 安装检查

```bash
ansible --version
ansible-playbook --version
```

Python 安装方式：

```bash
python -m pip install ansible
```

## Inventory

`inventory.ini`：

```ini
[web]
192.168.1.10 ansible_user=root
192.168.1.11 ansible_user=root

[db]
192.168.1.20 ansible_user=root
```

测试连通性：

```bash
ansible all -i inventory.ini -m ping
```

## Ad hoc 命令

```bash
ansible web -i inventory.ini -m command -a "uptime"
ansible web -i inventory.ini -m shell -a "df -h"
ansible web -i inventory.ini -m service -a "name=nginx state=started"
```

## Playbook

`check-nginx.yml`：

```yaml
- name: Check nginx service
  hosts: web
  become: true
  tasks:
    - name: Ensure nginx is installed
      ansible.builtin.package:
        name: nginx
        state: present

    - name: Ensure nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

执行：

```bash
ansible-playbook -i inventory.ini check-nginx.yml
```

预演：

```bash
ansible-playbook -i inventory.ini check-nginx.yml --check
```

## 幂等性

Ansible 重要思想是幂等：同一个 playbook 多次执行，系统最终状态相同，不应该每次都产生不必要变化。

例如 `state: present` 表示“确保存在”，不是每次都重新安装。

## 在 AIOps 中的作用

- 执行 runbook 的自动化动作。
- 批量采集主机状态。
- 修复配置漂移。
- 对告警事件执行低风险检查。
- 把手工操作变成版本化 YAML。

## 入门实验

先使用 localhost：

`inventory.ini`：

```ini
[local]
localhost ansible_connection=local
```

`local-check.yml`：

```yaml
- name: Local health check
  hosts: local
  tasks:
    - name: Check disk
      ansible.builtin.command: df -h
      register: disk
      changed_when: false

    - name: Print disk
      ansible.builtin.debug:
        var: disk.stdout_lines
```

执行：

```bash
ansible-playbook -i inventory.ini local-check.yml
```

## 排障清单

### SSH 连接失败

- IP 是否正确。
- 用户是否正确。
- SSH key 是否配置。
- 防火墙是否允许 22。

### playbook 语法失败

```bash
ansible-playbook --syntax-check playbook.yml
```

### 任务每次都 changed

- 检查是否使用了 `command`/`shell` 做非幂等动作。
- 增加 `changed_when: false`。
- 优先使用专用模块。

## 学习证据

- `ansible/inventory.ini`
- `ansible/local-check.yml`
- 一篇记录：为什么自动化要先支持 check mode 和人工确认
