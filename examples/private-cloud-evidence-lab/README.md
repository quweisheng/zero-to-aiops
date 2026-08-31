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

预期：命令退出码为 `0`，报告摘要为 `PASS`。

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

预期输出：`private-cloud-evidence-lab verification passed`。

## 输入字段边界

| 字段 | 含义 | 不能证明什么 |
|---|---|---|
| `platform` | 平台类别 | 不能证明具体许可范围 |
| `version` / `patch` | 合成版本台账 | 不能代替现网控制台和原厂材料 |
| `managementNodes` | 管理节点状态 | 管理面正常不等于全部业务正常 |
| `capacity` | 合成资源容量 | 分配率不等于瞬时性能或可售容量 |
| `components` | TCE 组件副本摘要 | 不能替代每个产品自己的健康检查 |

真实现场使用时，应由只读 API、控制台导出或经审批的采集脚本生成脱敏输入。不得提交密码、Token、内网地址、租户名、真实资产编号、业务名称或原始日志。

## 清理

删除 `evidence/` 下自己生成的报告即可；输入 fixtures 是学习材料，不要删除。脚本不会改变系统状态。
