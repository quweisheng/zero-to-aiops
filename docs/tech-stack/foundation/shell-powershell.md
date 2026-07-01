# Shell / PowerShell

> 目标：能把常用排障命令串成脚本，形成可重复的检查流程。Linux 用 Shell，Windows 用 PowerShell。

## 官方资料

- [PowerShell documentation](https://learn.microsoft.com/powershell/)
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)

说明：本文是基于官方文档的原创中文学习教程，不复制官方全文。

## 是什么

Shell 和 PowerShell 都是命令行环境，也可以写脚本。运维工作里大量排查、采集、自动化都从命令行开始。

## 核心原理

Shell 更偏文本流处理；PowerShell 更偏对象管道。

Shell：

```text
command output text
  -> pipe
  -> grep / awk / sed
  -> text result
```

PowerShell：

```text
cmdlet output objects
  -> pipeline
  -> Where-Object / Select-Object
  -> objects / formatted output
```

## 官网学习路线

1. 执行单个命令。
2. 理解参数。
3. 理解管道。
4. 理解变量。
5. 理解条件判断。
6. 理解循环。
7. 读写文件。
8. 处理错误。
9. 封装函数。
10. 把排障步骤写成脚本。

## Shell 常用命令

```bash
pwd
ls -lah
cat app.log
tail -n 100 app.log
grep ERROR app.log
ps aux | grep nginx
df -h
free -h
curl -v http://localhost:8080/health
```

脚本示例：

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "== Disk =="
df -h

echo "== Memory =="
free -h

echo "== Listening ports =="
ss -tulnp
```

## PowerShell 常用命令

```powershell
Get-Location
Get-ChildItem
Get-Content .\\app.log -Tail 100
Select-String -Path .\\app.log -Pattern "ERROR"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Test-NetConnection github.com -Port 443
```

脚本示例：

```powershell
$Report = @()
$Report += "# Windows 基础体检"
$Report += ""
$Report += "## 进程 CPU Top 5"
$Report += Get-Process |
  Sort-Object CPU -Descending |
  Select-Object -First 5 Name, Id, CPU |
  Out-String

$Report | Set-Content -Path ".\\health-report.md" -Encoding UTF8
```

## 在 AIOps 中的作用

- 快速采集现场信息。
- 把人工排查步骤变成 runbook。
- 调用 API 触发告警或自动化。
- 生成学习记录和故障摘要。
- 在 CI/CD 中执行检查。

## 配置重点

PowerShell 执行策略：

```powershell
Get-ExecutionPolicy
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Shell 脚本权限：

```bash
chmod +x check.sh
./check.sh
```

环境变量：

```powershell
$env:GITHUB_TOKEN
```

```bash
echo "$GITHUB_TOKEN"
```

## 入门实验

写一个体检脚本，输出：

- 当前时间。
- 当前用户。
- CPU/进程信息。
- 内存。
- 磁盘。
- 网络连通性。

保存成：

```text
scripts/local-health-check.ps1
docs/learning-records/local-health-check.md
```

## 排障清单

### 脚本无法执行

PowerShell 检查执行策略；Linux 检查执行权限和 shebang。

### 命令输出乱码

PowerShell 写文件时使用：

```powershell
Set-Content -Encoding UTF8
```

### 管道结果不符合预期

PowerShell 先查看对象字段：

```powershell
Get-Process | Get-Member
```

## 学习证据

- 一个本地健康检查脚本。
- 一篇脚本输出报告。
- 一篇记录：管道如何让排障步骤可重复。
