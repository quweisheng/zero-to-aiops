# FDE 事件证据助手：最小可运行交付样例

这个样例不是一个真实的 AI 产品，而是一份可以在本机安全运行的 FDE（Forward Deployed Engineer，前线部署工程师）交付证据。它用 Python 标准库模拟客户现场常见的四件事：

1. 接收一个业务事故场景。
2. 从指标、变更和日志中收集证据。
3. 只在证据足够时给出假设，并明确引用证据编号。
4. 对回滚等高风险动作只提出建议，必须等待人工批准，且样例永远不会操作真实系统。

## 运行条件

- Python 3.11 或更高版本。
- 不需要安装第三方包，不需要模型 API Key，不连接外网。

## 先跑正常场景

```powershell
Set-Location D:\zero-to-aiops\examples\fde-incident-assistant
python .\app.py --scenario checkout-error-spike
```

预期看到 JSON 结果，其中：

- `outcome` 是 `approval_required`；
- `evidence` 至少有指标和变更两条证据；
- `proposed_action` 建议停止放量并回滚候选版本；
- `action_executed` 始终为 `false`。

## 再跑故障注入和评测

```powershell
python .\app.py --scenario evidence-timeout
python .\evals.py
python -m unittest -v
```

故障注入的预期结果是 `degraded`：助手应承认取证失败，不得把猜测说成根因，也不得执行动作。评测最后应输出 `PASS: 4/4 evaluation cases`，单元测试应全部通过。

## 如何清理

程序只向终端输出结果，不创建数据库、后台服务或云资源，因此无需清理。离开目录即可。

## 文件说明

- `customer-brief.md`：把客户口头问题改写成范围、成功指标、安全边界和验收条件。
- `app.py`：最小诊断逻辑与命令行入口。
- `evals.py`：用固定案例检查证据、拒答、降级和人工审批。
- `test_app.py`：检查关键安全不变量。

## 生产边界

真实交付还需要身份认证、租户隔离、凭据托管、真实数据连接器、审计存储、模型评测、限流、可观测性、灰度发布、灾备和客户审批。本样例只证明最小机制，不代表生产就绪，也不能冒充真实客户项目。
