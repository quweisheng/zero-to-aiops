# Runbook Automation

> 目标：能把人工处理手册变成可执行、可审计、可回滚的自动化流程，并知道哪些动作只能建议，不能直接自动执行。

## 官方资料

- [Google SRE: Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/)
- [Google SRE Book: Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [Google SRE Workbook: Incident Response](https://sre.google/workbook/incident-response/)
- [Ansible playbooks](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_intro.html)

说明：本文是基于 Google SRE 和 Ansible 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Runbook 是故障处理手册。Runbook Automation 是把手册中的检查、判断和处理动作转成可执行流程。

它不是一上来就让系统自动修生产，而是从低风险步骤开始：

1. 自动收集上下文。
2. 自动生成摘要。
3. 自动推荐 runbook。
4. 人工确认后执行低风险动作。
5. 验证结果并记录审计。

## 核心原理

```text
Alert / Event
  -> enrich context
  -> select runbook
  -> pre-check
  -> risk classification
  -> human approval
  -> execute action
  -> verify result
  -> audit log
  -> rollback if needed
```

## Runbook 结构

```md
# Runbook: 高错误率

## 适用场景
## 风险等级
## 输入参数
## 前置检查
## 判断逻辑
## 处理步骤
## 验证方式
## 回滚方式
## 禁止动作
## 审计记录
```

## 自动化分级

### L0：只记录

系统只生成事件记录，不做建议。

### L1：自动摘要

系统把指标、日志、变更、告警整理成摘要。

### L2：推荐 runbook

系统推荐处理手册，但不执行动作。

### L3：人工确认后执行

系统执行低风险动作，例如清理临时文件、重启非核心测试服务。

### L4：自动执行

只适合非常低风险、可验证、可回滚的场景。

## 架构

```text
Alertmanager webhook
  -> FastAPI runbook service
  -> context collectors
       Prometheus
       Loki / Elasticsearch
       GitHub deploy history
  -> rule/LLM selector
  -> Ansible / scripts
  -> audit log
```

## 示例：磁盘使用率高

````md
# Runbook: 磁盘使用率高

## 适用场景
磁盘使用率超过 85%，服务仍可用。

## 风险等级
中。

## 输入参数
- host
- mount_point
- usage_percent

## 前置检查
```bash
df -h
df -i
du -sh /var/log/*
```

## 建议动作
1. 找出增长最快目录。
2. 压缩旧日志。
3. 清理临时文件。
4. 如空间仍不足，扩容。

## 禁止动作
未确认前不得删除业务数据目录。

## 验证
执行 `df -h`，确认使用率下降。

## 回滚
删除前必须备份文件列表。
````

## 配置重点

每个自动化动作必须记录：

- 谁触发。
- 输入参数。
- 执行命令。
- 执行结果。
- 开始和结束时间。
- 是否人工确认。
- 验证结果。
- 回滚信息。

## 在 AIOps 中的作用

Runbook Automation 是 AIOps 从“看见问题”走到“处理问题”的桥梁。没有 runbook，模型只能聊天；有了 runbook，系统才能把建议落成可控动作。

## 入门实验

1. 写一个磁盘告警 runbook。
2. 写 Python 脚本读取一条模拟告警 JSON。
3. 根据 `alertname` 选择 runbook。
4. 输出 Markdown 事件摘要。
5. 不执行危险动作，只推荐下一步。

## 排障清单

### 推荐错 runbook

- alertname 是否规范。
- labels 是否完整。
- runbook metadata 是否清楚。
- 是否需要人工确认。

### 自动化动作失败

- 参数是否缺失。
- 权限是否不足。
- 目标主机是否可达。
- 前置检查是否通过。

### 自动化风险过高

- 降级为“只推荐”。
- 增加审批。
- 增加回滚。
- 增加验证。

## 学习证据

- `docs/runbooks/disk-high-usage.md`
- 一个 runbook selector 脚本。
- 一篇记录：哪些动作可以自动执行，哪些只能建议。
