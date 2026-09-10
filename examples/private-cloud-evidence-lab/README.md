# 私有云只读证据实验

这个实验用**合成数据**模拟 FusionSphere 与 Tencent TCE 的资产、管理面、容量和组件状态。它不会连接真实云，不会修改虚拟机、网络、存储、租户或集群。

学习目标：

1. 分清“平台在线”“管理面健康”“数据面容量”“业务可用”不是同一件事。
2. 用同一份输入生成可复核的 Markdown 报告。
3. 主动注入 VRM 单节点异常、TCE 组件副本不足和容量越线，走完证据化排障。

## 运行

在本目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\Invoke-PrivateCloudAudit.ps1 `
  -InputPath .\fixtures\healthy.json `
  -OutputPath .\evidence\healthy-report.md
```

预期：命令退出码为 `0`，报告摘要为 `PASS`。这只说明这份合成快照通过了脚本中的规则，不证明资产采集完整，也不证明真实业务健康。

输出文件必须尚不存在。重复运行时，请换一个新的报告名称，例如 `healthy-report-02.md`；脚本会以退出码 `1` 拒绝覆盖已有报告，原文件保持不变。不要为了重跑实验删除整个证据目录。

运行故障样本：

```powershell
powershell -ExecutionPolicy Bypass -File .\Invoke-PrivateCloudAudit.ps1 `
  -InputPath .\fixtures\degraded.json `
  -OutputPath .\evidence\degraded-report.md
```

预期：脚本仍安全生成报告，但退出码为 `2`，摘要为 `DEGRADED`，并列出：

- FusionSphere 管理节点主备不完整。
- 虚拟化内存分配率超过 85% 观察线。
- TCE 容器服务控制面副本未全部就绪。
- 对象存储使用率超过 85% 观察线。

## 自动验证

```powershell
powershell -ExecutionPolicy Bypass -File .\verify.ps1
```

预期输出：`private-cloud-evidence-lab verification passed`。验证覆盖正常、故障、拒绝覆盖旧报告，以及空平台列表、缺失容量、零总量、负使用量、字符串数值、零期望副本、非整数就绪副本、重复平台和无效时间这九种错误输入。

验证脚本每次创建独立的 `evidence-verification-<随机标识>` 临时目录，不清空已有的同名学习目录。结束时只清理本轮明确生成的四个文件，再非递归删除本轮目录；遇到意外文件或目录链接会停止清理，留给你检查，不会强行递归删除。

## 输入字段边界

| 字段 | 含义 | 不能证明什么 |
|---|---|---|
| `platform` | 平台类别 | 不能证明具体许可范围 |
| `version` / `patch` | 合成版本台账 | 不能代替现网控制台和原厂材料 |
| `managementNodes` | 管理节点状态 | 管理面正常不等于全部业务正常 |
| `capacity` | 合成资源容量 | 分配率不等于瞬时性能或可售容量 |
| `components` | TCE 组件副本摘要 | 不能替代每个产品自己的健康检查 |

真实现场使用时，应由只读 API、控制台导出或经审批的采集脚本生成脱敏输入。不得提交密码、Token、内网地址、租户名、真实资产编号、业务名称或原始日志。

输入校验失败会以退出码 `1` 结束，不生成 `PASS` 报告。时间必须带时区；平台、管理节点、容量项和组件列表不能缺失或为空；容量数值不能用字符串代替，使用量不能为负，总量必须大于零；副本数量必须是整数，期望副本必须大于零。相同平台标识、平台内相同管理角色、容量资源或组件标识不能重复。字段缺失不是“数值为零”，总量为零也不能算“使用率为零”。

使用量超过总量并不直接当作格式错误：它可能代表超分配，脚本会将其作为越线风险报告。反过来，语法和字段都正确也不能证明没有漏采；真实巡检还要比对控制台总数、导出范围和采集时间。

## 清理

只删除 `evidence/` 下你确认由本轮生成且不再需要的具体报告文件；输入 fixtures 是学习材料，不要删除。脚本会写本地报告，但不会连接或改变真实云资源。
