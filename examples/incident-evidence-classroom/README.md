# 事故证据与运行手册课堂

这是合成数据和内存状态机练习，不连接云平台、集群、监控或业务，不读取凭据、不写文件。需要 Node.js 22 或更高版本，在仓库根目录运行：

```bash
node examples/incident-evidence-classroom/lab.mjs rca
node examples/incident-evidence-classroom/lab.mjs rca --missing
node examples/incident-evidence-classroom/lab.mjs runbook lost-response
node examples/incident-evidence-classroom/lab.mjs runbook lost-receipt
node examples/incident-evidence-classroom/lab.mjs runbook changed-plan
node examples/incident-evidence-classroom/lab.mjs runbook version-drift
node --test examples/incident-evidence-classroom/checks.mjs
```

RCA 正常组：整体请求失败率从 1.8% 升到 4.55%，但 east/west 两组各自下降；这是流量构成变化的课堂例子，不能据此判定发布导致故障。缺失组返回 `INSUFFICIENT_COVERAGE`（覆盖不足），不是零故障。输入是一窗一组的完整统计批次，去重不适用于任意业务请求日志。

Runbook 丢响应组：实际写入一次，通过操作回执核对后返回 `CONTROL_STATE_VERIFIED`（仅控制状态通过）。丢回执组停在 `WAIT_RECONCILIATION`（等待核对），即使副本数符合目标，也不盲目重试。计划或版本漂移返回 `REAPPROVAL_REQUIRED`（需要重新评估和审批），写入次数为零。

这些测试不证明真实持久化、网络分区一致性、身份鉴别、权限、生产并发或业务健康。JSON 复制只是模拟重启前后独立的状态视图；摘要不是签名；服务端原子更新和回执存储在模型中被假定为成功，真实系统必须另行测试。退出进程即清理，无需删除任何服务或数据。

完整讲解：[RCA](../../docs/tech-stack/sre-aiops/rca.md)、[Runbook](../../docs/tech-stack/sre-aiops/runbook.md)。
