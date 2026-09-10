# Shell / PowerShell

> 目标：能把常用排障命令串成脚本，形成可重复、可审计、可自动化的检查流程。Linux/macOS 重点学 Bash 和常见 GNU/Linux 工具，Windows 重点学 PowerShell 和对象管道。

## 官方资料

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [PowerShell documentation](https://learn.microsoft.com/powershell/)
- [What is PowerShell?](https://learn.microsoft.com/en-us/powershell/scripting/overview)
- [PowerShell 101: Discovering objects, properties, and methods](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/03-discovering-objects)
- [PowerShell 101: One-liners and the pipeline](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/04-pipelines)
- [about_Quoting_Rules](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules)
- [about_Redirection](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_redirection)
- [about_Execution_Policies](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies)

说明：本文基于 Bash、GNU Coreutils 和 Microsoft PowerShell 官方资料整理成原创中文教程，不复制官方全文。Shell 不是单一项目，本文会明确边界：Bash 是 shell，`ls`、`cat`、`cp` 等很多命令来自 coreutils 或其他用户态工具；PowerShell 是 shell、脚本语言和自动化平台，核心命令以 cmdlet 形式输出对象。

## 场景开场

“每次排障都手敲同一串命令：看进程、看端口、看磁盘、看日志、测接口。为什么不把它们变成一个检查脚本？”

很多 AIOps 自动化不是从模型开始的，而是从一段稳定的检查流程开始的：

1. 当前机器是谁？
2. 服务进程在不在？
3. 端口有没有监听？
4. 磁盘是不是满了？
5. 最近日志有没有 ERROR？
6. 健康检查接口通不通？
7. 输出能不能保存成报告？

Shell 和 PowerShell 的价值，就是把这些一次性的排障动作变成可重复执行的脚本。脚本能放进 runbook、CI/CD、计划任务、告警自愈流程，也能作为 AIOps 自动化的第一版原型。

## 一句话人话版

Shell / PowerShell 是把命令组织成自动化流程的工具：Shell 主要处理文本流，PowerShell 主要处理对象流，它们都能把人工排障步骤变成脚本。

## 学习边界

这一篇重点讲：

- Shell、terminal、Bash、GNU 工具、PowerShell 的区别。
- Bash 的命令执行、变量、引用、管道、重定向、退出码、脚本。
- PowerShell 的 cmdlet、对象、属性、管道、变量、错误、执行策略、脚本。
- 常用排障命令的 Bash / PowerShell 对照。
- 如何把排障步骤写成健康检查脚本。
- 脚本权限、编码、路径、引用、管道、错误处理怎么排查。

不在这一篇深入讲：

- `awk`、`sed` 的高级文本处理。
- 正则表达式完整语法。
- Windows 管理模块全量命令。
- Bash 和 PowerShell 的所有语言细节。

这篇的目标不是把两个语言全部讲完，而是让小白能安全、准确地写出 AIOps 入门脚本。

## 官方知识地图

### Bash / Shell 知识地图

GNU Bash Reference Manual 的主线大致是：

```text
Bash（常见类 Unix 命令解释器）
  ├── What is Bash / shell（命令解释器是什么）
  ├── Basic Shell Features（基本特性）
  │   ├── Shell syntax（语法）
  │   ├── Quoting（引用与转义）
  │   ├── Commands（命令）
  │   ├── Pipelines（管道）
  │   ├── Lists and compound commands（命令列表与复合命令）
  │   ├── Functions（函数）
  │   ├── Parameters and variables（参数与变量）
  │   ├── Expansions（变量等展开）
  │   ├── Redirections（输入输出重定向）
  │   ├── Execution environment（执行环境）
  │   ├── Exit status（退出状态）
  │   └── Shell scripts（脚本）
  ├── Shell Builtin Commands（解释器内建命令）
  ├── Shell Variables（解释器变量）
  ├── Bash Features（Bash 特有功能）
  ├── Job Control（前后台作业控制）
  ├── Command Line Editing（命令行编辑）
  └── History（历史记录）
```

Shell 学习不能只背 `ls`、`grep`。你要理解：

- shell 负责解析命令。
- 命令可能是 shell builtin，也可能是外部程序。
- 管道把一个命令的 stdout 传给下一个命令的 stdin。
- 引号和展开决定变量、空格、通配符怎么解释。
- 退出码决定脚本是否成功。

### GNU / Linux 工具边界

很多常用命令不属于 Bash 本身：

| 命令 | 常见来源 | 说明 |
|---|---|---|
| `cd` | shell builtin | 修改当前 shell 工作目录 |
| `echo` | shell builtin / coreutils | 输出文本 |
| `ls` | GNU coreutils | 列目录 |
| `cat` | GNU coreutils | 输出文件 |
| `cp`、`mv`、`rm` | GNU coreutils | 文件操作 |
| `grep` | GNU grep | 文本匹配 |
| `find` | GNU findutils | 查找文件 |
| `ps` | procps / 系统工具 | 查看进程 |
| `ss` | iproute2 | 查看 socket |
| `curl` | curl 项目 | HTTP 请求 |

所以不要说“Linux 一共有这些 Shell 命令”。更准确的说法是：AIOps 入门要掌握一组常见 shell builtin 和用户态工具命令。

### PowerShell 知识地图

Microsoft PowerShell 文档主线可以这样理解：

```text
PowerShell（以对象管道为特点的命令环境）
  ├── Shell and scripting language（解释器与脚本语言）
  ├── Cmdlets（命令单元）
  ├── Objects, properties, methods（对象、属性、方法）
  ├── Pipeline（对象管道）
  ├── Providers（提供文件系统等数据访问方式）
  ├── Variables（变量）
  ├── Quoting rules（引用规则）
  ├── Redirection and streams（重定向与输出流）
  ├── Scripts and functions（脚本与函数）
  ├── Execution policies（执行策略）
  ├── Modules（模块）
  ├── Remoting（远程执行）
  └── Help system（帮助系统）
```

PowerShell 的核心不是“Windows 版 Bash”。它的关键差异是：管道里传的是对象，不只是文本。

## Shell / PowerShell 在 AIOps 链路中的位置

```text
manual troubleshooting（手工排障）
  ├── check process（检查进程）
  ├── check ports（检查端口）
  ├── check disk（检查磁盘）
  ├── check logs（检查日志）
  └── test API（验证接口）
        |
        v
Shell / PowerShell scripts（命令行脚本）
        |
        +--> runbook automation（操作手册自动化）
        +--> CI/CD checks（持续集成与交付检查）
        +--> scheduled health reports（定期健康报告）
        +--> incident evidence collection（事故证据采集）
        +--> webhook or API calls（事件回调或接口调用）
```

在 AIOps 中，脚本是自动化闭环的第一步：

| 阶段 | 脚本做什么 |
|---|---|
| 数据采集 | 收集进程、端口、磁盘、日志、接口状态 |
| 排障辅助 | 一键执行标准检查 |
| Runbook | 把处理步骤写成可执行脚本 |
| CI/CD | 部署前后执行健康检查 |
| 告警联动 | 告警触发后自动收集证据 |
| 报告生成 | 输出 Markdown 或 JSON 报告 |

## Shell、Terminal、Bash、PowerShell 的区别

| 名词 | 是什么 | 例子 |
|---|---|---|
| Terminal | 终端窗口，显示输入输出 | Windows Terminal、GNOME Terminal |
| Shell | 命令解释器 | Bash、zsh、PowerShell |
| Bash | GNU 的 shell 和脚本语言 | Linux 常见默认 shell |
| PowerShell | shell、脚本语言和自动化平台 | Windows PowerShell、PowerShell 7 |
| Command | 被 shell 执行的命令 | `ls`、`Get-Process` |
| Script | 写在文件里的命令流程 | `check.sh`、`check.ps1` |

你打开的是 terminal，里面运行的是 shell。你输入的命令由 shell 解析，再调用 builtin 或外部程序。

## Bash 怎么执行命令

输入：

```bash
grep ERROR app.log | tail -n 20
```

大致过程：

```text
Bash reads command line（读取命令行）
  -> parses words, quotes, pipes and redirections（解析词、引号、管道和重定向）
  -> expands variables and globs（展开变量与通配符）
  -> finds command grep（寻找命令）
  -> starts process（启动进程）
  -> connects grep stdout to tail stdin（连接前者标准输出与后者标准输入）
  -> waits for pipeline（等待管道）
  -> returns exit status（返回退出状态）
```

这个过程里最容易出错的是：

- 引号。
- 变量展开。
- 通配符展开。
- 管道。
- 重定向。
- 退出码。

## PowerShell 怎么执行命令

输入：

```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, Id, CPU
```

大致过程：

```text
PowerShell parses command（解析命令）
  -> runs Get-Process（运行进程查询）
  -> outputs process objects（输出进程对象）
  -> Sort-Object sorts by CPU property（按处理器时间属性排序）
  -> Select-Object selects properties（选择属性）
  -> formatter displays table（格式化器显示表格）
```

关键点：`Get-Process` 输出的是对象。对象有属性，比如：

- `Name`
- `Id`
- `CPU`
- `WorkingSet`
- `StartTime`

所以 PowerShell 可以直接按属性排序和筛选，而不需要先用 `awk` 切列。

## 文本管道 vs 对象管道

### Bash 文本管道

```bash
ps aux | grep nginx
```

这里 `ps aux` 输出文本，`grep` 在文本里匹配 `nginx`。

优点：

- 简单直接。
- 适合日志、文本文件、命令输出。
- Unix 工具生态强。

风险：

- 输出格式变化会影响脚本。
- 空格切列容易错。
- 多语言和编码可能影响解析。

### PowerShell 对象管道

```powershell
Get-Process |
  Where-Object { $_.ProcessName -like "*nginx*" } |
  Select-Object ProcessName, Id, CPU
```

这里管道传的是进程对象。`Where-Object` 按对象属性过滤。

优点：

- 属性明确。
- 排序、筛选、导出结构化数据方便。
- 适合 Windows 管理和自动化。

风险：

- 新手看到屏幕输出，以为管道传的是文本。
- 对象最后显示时才格式化成表格。
- 和传统外部命令混用时要注意字符串转换。

## 命令发现和帮助

### Bash

查看命令路径：

```bash
type ls
type cd
command -v bash
```

可能输出：

```text
ls is /usr/bin/ls
cd is a shell builtin
```

查看帮助：

```bash
help cd
man ls
ls --help
```

区别：

| 命令 | 用途 |
|---|---|
| `help` | 查看 Bash builtin 帮助 |
| `man` | 查看系统 manual page |
| `--help` | 很多 GNU 命令支持的简短帮助 |

### PowerShell

发现命令：

```powershell
Get-Command Get-Process
Get-Command *Process*
```

查看帮助：

```powershell
Get-Help Get-Process
Get-Help Get-Process -Examples
Get-Help Get-Process -Full
```

查看对象结构：

```powershell
Get-Process | Get-Member
```

这一步非常重要。PowerShell 排障不是先猜列，而是先看对象有哪些属性和方法。

## 变量

### Bash 变量

定义：

```bash
service="demo-api"
port=8000
```

使用：

```bash
echo "$service"
echo "service=$service port=$port"
```

注意：等号两边不能有空格。

错误写法：

```bash
service = "demo-api"
```

这会被 Bash 解析成执行名为 `service` 的命令，并传参数。

### PowerShell 变量

定义：

```powershell
$Service = "demo-api"
$Port = 8000
```

使用：

```powershell
Write-Output $Service
Write-Output "service=$Service port=$Port"
```

PowerShell 变量以 `$` 开头。变量里可以放字符串、数字、对象、数组、哈希表。

## 环境变量

环境变量用于把配置传给进程。不要把 token 写死在脚本里，优先从环境变量读取。

### Bash

读取：

```bash
[[ -n "${GITHUB_TOKEN:-}" ]] && echo 'token is configured'
```

设置当前 shell：

```bash
export GITHUB_TOKEN="..."
```

脚本里判断：

```bash
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is required" >&2
  exit 1
fi
```

### PowerShell

读取：

```powershell
[bool]$env:GITHUB_TOKEN
```

设置当前进程：

```powershell
$env:GITHUB_TOKEN = "..."
```

脚本里判断：

```powershell
if (-not $env:GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN is required"
  exit 1
}
```

## 引号和转义

### Bash 引号

单引号：原样保留。

```bash
name="api"
echo '$name'
```

输出：

```text
$name
```

双引号：变量会展开。

```bash
name="api"
echo "$name"
```

输出：

```text
api
```

建议：Bash 中使用变量时，大多数情况加双引号。

```bash
cat "$log_file"
```

这样路径里有空格时不容易炸。

### PowerShell 引号

单引号：不展开变量。

```powershell
$Name = "api"
'service=$Name'
```

输出：

```text
service=$Name
```

双引号：展开变量。

```powershell
$Name = "api"
"service=$Name"
```

输出：

```text
service=api
```

表达式要用 `$()`：

```powershell
"Top process: $((Get-Process | Sort-Object CPU -Descending | Select-Object -First 1).ProcessName)"
```

## 通配符和路径

### Bash

```bash
ls *.log
rm *.tmp
```

`*.log` 会由 shell 展开为匹配的文件列表。

危险路径不能只靠加引号保护。先做只读检查：

```bash
printf 'candidate directory: %s\n' "${lab_dir:?必须先指定实验目录}"
```

上述检查只拒绝未设置或为空的变量，并不证明目标安全。任何递归清理前还要解析实际绝对路径，确认它属于本次创建的独立实验目录，且没有重要内容或符号链接越界；不允许把根目录、家目录或工作区根目录作为清理目标。本课不提供套上任意变量就递归删除的通用命令。

### PowerShell

```powershell
Get-ChildItem *.log
Remove-Item *.tmp
```

PowerShell 也支持通配符，但对象和 provider 模型更复杂。对路径操作，重要命令支持 `-LiteralPath`，用于不把 `[`、`]`、`*` 等当通配符。

```powershell
Get-Item -LiteralPath "file[1].log"
```

## 重定向和流

### Bash 重定向

| 写法 | 含义 |
|---|---|
| `>` | 覆盖 stdout 到文件 |
| `>>` | 追加 stdout 到文件 |
| `2>` | stderr 到文件 |
| `2>&1` | stderr 合并到 stdout |
| `<` | 从文件读 stdin |

例子：

```bash
./check.sh > report.txt 2> error.txt
```

合并输出：

```bash
./check.sh > report.txt 2>&1
```

### PowerShell 重定向

PowerShell 有多个输出流：

| 流 | 含义 |
|---|---|
| Success | 正常输出 |
| Error | 错误 |
| Warning | 警告 |
| Verbose | 详细信息 |
| Debug | 调试 |
| Information | 信息 |

常见写法：

```powershell
.\check.ps1 > report.txt
.\check.ps1 2> error.txt
.\check.ps1 *> all-output.txt
```

`*>` 会重定向所有流。

## 退出码和错误

### Bash

查看上一个命令退出码：

```bash
echo "$?"
```

约定：

```text
0     success
non-0 failure
```

脚本中退出：

```bash
exit 1
```

常见安全选项：

```bash
set -euo pipefail
```

含义：

| 选项 | 含义 |
|---|---|
| `-e` | 命令失败时退出 |
| `-u` | 使用未定义变量时报错 |
| `pipefail` | 管道中任一命令失败时让管道失败 |

注意：`set -e` 有细节陷阱，不是错误处理的全部。重要脚本仍要显式检查关键命令。

### PowerShell

查看外部命令退出码：

```powershell
$LASTEXITCODE
```

查看上一条 PowerShell 命令是否成功：

```powershell
$?
```

遇到错误停止：

```powershell
$ErrorActionPreference = "Stop"
```

捕获异常：

```powershell
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5 -ErrorAction Stop
} catch {
  Write-Error "health check failed: $_"
  exit 1
}
```

## 条件判断

### Bash

```bash
if [[ -f "app.log" ]]; then
  echo "log exists"
else
  echo "log missing"
fi
```

常见测试：

| 表达式 | 含义 |
|---|---|
| `-f file` | 普通文件存在 |
| `-d dir` | 目录存在 |
| `-z str` | 字符串为空 |
| `-n str` | 字符串非空 |
| `cmd` | 命令退出码为 0 |

### PowerShell

```powershell
if (Test-Path "app.log") {
  Write-Output "log exists"
} else {
  Write-Output "log missing"
}
```

比较：

| 操作符 | 含义 |
|---|---|
| `-eq` | 等于 |
| `-ne` | 不等于 |
| `-gt` | 大于 |
| `-lt` | 小于 |
| `-like` | 通配符匹配 |
| `-match` | 正则匹配 |

## 循环

### Bash

```bash
for service in prometheus grafana demo-api; do
  echo "checking $service"
done
```

逐行读文件：

```bash
while IFS= read -r line; do
  echo "$line"
done < app.log
```

### PowerShell

```powershell
foreach ($Service in "prometheus", "grafana", "demo-api") {
  Write-Output "checking $Service"
}
```

管道式：

```powershell
"prometheus", "grafana", "demo-api" | ForEach-Object {
  Write-Output "checking $_"
}
```

## 函数

### Bash

```bash
check_url() {
  local url="$1"
  if curl -fsS --connect-timeout 2 --max-time 5 "$url" > /dev/null; then
    echo "OK $url"
  else
    echo "FAIL $url"
    return 1
  fi
}

check_url "localhost:8000/health"
```

### PowerShell

```powershell
function Test-Url {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$Url
  )

  try {
    Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop | Out-Null
    Write-Verbose "OK $Url"
    return $true
  } catch {
    Write-Verbose "FAIL $Url"
    return $false
  }
}

Test-Url -Url "http://127.0.0.1:8000/health" -Verbose
```

## 脚本文件

### Bash 脚本

文件：`check.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "== Date =="
date

echo "== Disk =="
df -h
```

授权：

```bash
chmod +x check.sh
```

运行：

```bash
./check.sh
```

### PowerShell 脚本

文件：`check.ps1`

```powershell
$ErrorActionPreference = "Stop"

"== Date =="
Get-Date

"== Disk =="
Get-PSDrive -PSProvider FileSystem
```

运行：

```powershell
.\check.ps1
```

如果执行策略阻止，见后面的执行策略章节。

## PowerShell 执行策略

查看：

```powershell
Get-ExecutionPolicy
```

查看不同作用范围的策略来源：

```powershell
Get-ExecutionPolicy -List
```

执行策略不是完整安全边界，它主要防止无意运行脚本。公司电脑要遵守组织安全策略，不要随意绕过。

策略可以来自组织、进程、当前用户或本机等范围，优先级不同。不要把脚本被阻止自动转成绕过策略；先确认脚本来源、签名和设备管理要求。需要调整时按组织批准的方式实施，保留原值与恢复方法。本课的纯内存实验可以逐段在交互窗口学习，不要求降低长期执行策略。

## 常用命令对照字典

### 当前目录

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `pwd` | `Get-Location` |
| 作用 | 查看当前工作目录 | 查看当前工作目录 |
| 示例 | `pwd` | `Get-Location` |
| AIOps 场景 | 确认脚本相对路径基准 | 确认脚本相对路径基准 |
| 常见坑 | 运行目录不等于脚本所在目录 | 同左 |

### 列目录

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `ls -lah` | `Get-ChildItem -Force` |
| 作用 | 查看文件和目录 | 查看文件和目录对象 |
| 关键字段 | 权限、大小、时间、文件名 | Mode、LastWriteTime、Length、Name |
| AIOps 场景 | 确认配置文件、日志文件是否存在 | 同左 |
| 常见坑 | alias `ll` 不一定存在 | `ls` 是 alias，脚本中建议写完整 cmdlet |

### 切换目录

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `cd` | `Set-Location` |
| 示例 | `cd /var/log` | `Set-Location C:\Logs` |
| AIOps 场景 | 进入日志、配置、项目目录 | 同左 |
| 常见坑 | 路径有空格要加引号 | 路径特殊字符可用 `-LiteralPath` |

### 查看文件

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `cat`、`less` | `Get-Content` |
| 示例 | `cat app.log` | `Get-Content .\app.log` |
| AIOps 场景 | 看配置和日志 | 同左 |
| 常见坑 | 大文件不要直接 `cat` | 大文件用 `-Tail` 或 `-TotalCount` |

### 查看日志尾部

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `tail -n 100`、`tail -f` | `Get-Content -Tail 100`、`-Wait` |
| 示例 | `tail -n 100 app.log` | `Get-Content .\app.log -Tail 100 -Wait` |
| AIOps 场景 | 看最近错误和实时日志 | 同左 |
| 常见坑 | 日志轮转后 `tail -f` 行为要注意 | 编码不对可能乱码 |

### 搜索文本

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `grep` | `Select-String` |
| 示例 | `grep ERROR app.log` | `Select-String -Path .\app.log -Pattern "ERROR"` |
| AIOps 场景 | 找错误日志 | 同左 |
| 常见坑 | 正则特殊字符要转义 | 输出是 MatchInfo 对象 |

### 查找文件

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `find` | `Get-ChildItem -Recurse` |
| 示例 | `find . -name "*.log"` | `Get-ChildItem -Recurse -Filter *.log` |
| AIOps 场景 | 找日志、配置、证书 | 同左 |
| 常见坑 | 路径和权限问题 | 大目录递归可能慢 |

### 创建目录

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `mkdir -p` | `New-Item -ItemType Directory` |
| 示例 | `mkdir -p reports` | `New-Item -ItemType Directory -Path reports -Force` |
| AIOps 场景 | 创建报告目录 | 同左 |
| 常见坑 | 没有 `-p` 时父目录不存在会失败 | `-Force` 可避免已存在时报错 |

### 复制文件

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `cp` | `Copy-Item` |
| 示例 | `cp app.log reports/` | `Copy-Item .\app.log .\reports\` |
| AIOps 场景 | 保存现场证据 | 同左 |
| 常见坑 | 覆盖文件要谨慎 | 用 `-WhatIf` 预演 |

### 移动 / 重命名

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `mv` | `Move-Item`、`Rename-Item` |
| 示例 | `mv old.log app.log` | `Rename-Item old.log app.log` |
| AIOps 场景 | 整理报告和日志 | 同左 |
| 常见坑 | 覆盖风险 | 用 `-WhatIf` |

### 删除文件

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `rm` | `Remove-Item` |
| 示例 | `rm old.log` | `Remove-Item .\old.log` |
| AIOps 场景 | 清理临时文件 | 同左 |
| 常见坑 | `rm -rf` 破坏性强 | `Remove-Item -Recurse -Force` 前确认路径 |

### 查看进程

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `ps` | `Get-Process` |
| 示例 | `ps aux | grep nginx` | `Get-Process | Sort-Object CPU -Descending` |
| AIOps 场景 | 看服务是否运行、CPU 谁高 | 同左 |
| 常见坑 | `grep` 自己也可能出现在结果 | CPU 属性是累计 CPU 时间 |

### 结束进程

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `kill` | `Stop-Process` |
| 示例 | `kill 1234` | `Stop-Process -Id 1234` |
| AIOps 场景 | 停止卡死进程 | 同左 |
| 常见坑 | 不要误杀生产进程 | 可用 `-WhatIf` 预演 |

### 查看磁盘

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `df -h` | `Get-PSDrive -PSProvider FileSystem` |
| 示例 | `df -h` | `Get-PSDrive -PSProvider FileSystem` |
| AIOps 场景 | 排查磁盘满 | 同左 |
| 常见坑 | 容器内看到的是容器视角 | PSDrive 和物理磁盘不是完全等价 |

### 测试网络

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `curl` | `Invoke-WebRequest`、`Test-NetConnection` |
| 示例 | `curl -fsS localhost:8000/health` | `Test-NetConnection github.com -Port 443` |
| AIOps 场景 | 测健康检查、端口连通性 | 同左 |
| 常见坑 | PowerShell 中 `curl` 可能不是 curl.exe | 显式使用 cmdlet 或 `curl.exe` |

### 输出文件

| 项 | Bash | PowerShell |
|---|---|---|
| 命令 | `>`、`tee` | `Set-Content`、`Out-File`、`Tee-Object` |
| 示例 | `echo ok > report.txt` | `"ok" | Set-Content report.txt -Encoding UTF8` |
| AIOps 场景 | 生成报告 | 同左 |
| 常见坑 | 覆盖已有文件 | 编码要指定 UTF-8 |

## AIOps 入门实验

本实验先收集本地时间、磁盘、进程与日志，不会请求服务接口，也不会修改系统服务。前提是对应解释器可用；在全新个人练习目录中用编辑器建立 `scripts` 目录并保存下方脚本，不覆盖现有同名报告。Bash 版本按 GNU/Linux 的 `ps` 参数编写，macOS 需另核对工具参数。它对应 AIOps 里的一个基本动作：把人工巡检变成可重复、可记录、可接入告警系统的脚本。报告包含主机和用户名，公开提交前必须脱敏。

目标：写两个脚本，分别适配 Bash 和 PowerShell，输出 Markdown 健康报告。

### Bash 版本

文件：`scripts/local-health-check.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

report="docs/learning-records/local-health-check-linux.md"
mkdir -p "$(dirname "$report")"

{
  echo "# Local Health Check"
  echo
  echo "## Time"
  date
  echo
  echo "## User and Host"
  echo "user=$(whoami)"
  echo "host=$(hostname)"
  echo
  echo "## Disk"
  df -h
  echo
  echo "## Top Processes"
  ps aux --sort=-pcpu | sed -n '1,11p'
  echo
  echo "## Recent Errors"
  if [[ -f "app.log" ]]; then
    grep -n "ERROR" app.log | tail -n 20 || true
  else
    echo "app.log not found"
  fi
} > "$report"

echo "wrote $report"
```

运行：

```bash
chmod +x scripts/local-health-check.sh
./scripts/local-health-check.sh
```

### PowerShell 版本

文件：`scripts/local-health-check.ps1`

```powershell
$ErrorActionPreference = "Stop"

$ReportPath = "docs/learning-records/local-health-check-windows.md"
$ReportDir = Split-Path $ReportPath
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$Lines = @()
$Lines += "# Local Health Check"
$Lines += ""
$Lines += "## Time"
$Lines += (Get-Date | Out-String).Trim()
$Lines += ""
$Lines += "## User and Host"
$Lines += "user=$env:USERNAME"
$Lines += "computer=$env:COMPUTERNAME"
$Lines += ""
$Lines += "## Disk"
$Lines += (Get-PSDrive -PSProvider FileSystem | Out-String).Trim()
$Lines += ""
$Lines += "## Top Processes"
$Lines += (
  Get-Process |
    Sort-Object CPU -Descending |
    Select-Object -First 10 Name, Id, CPU, WorkingSet |
    Out-String
).Trim()
$Lines += ""
$Lines += "## Recent Errors"

if (Test-Path ".\app.log") {
  $ErrorMatches = Select-String -Path ".\app.log" -Pattern "ERROR" | Select-Object -Last 20
  if ($ErrorMatches) {
    $Lines += ($ErrorMatches | Out-String).Trim()
  } else {
    $Lines += "No ERROR lines found."
  }
} else {
  $Lines += "app.log not found"
}

$Lines | Set-Content -Path $ReportPath -Encoding UTF8
Write-Output "wrote $ReportPath"
```

运行：

```powershell
.\scripts\local-health-check.ps1
```

验收时确认报告存在，包含时间、磁盘和进程章节，并检查缺少 `app.log` 时是否明确显示未找到，而不是伪造无错误结论。运行失败先看工作目录、解释器、读取权限与首个错误。清理仅处理本次新建练习目录中的脚本和生成报告；需要保留证据时先脱敏，再手工移出，不能删除正式项目中的同名目录。

### 你应该学到什么

| 知识点 | Bash | PowerShell |
|---|---|---|
| 创建目录 | `mkdir -p` | `New-Item -Force` |
| 写文件 | `> "$report"` | `Set-Content -Encoding UTF8` |
| 进程排序 | `ps aux | sort` | `Get-Process | Sort-Object` |
| 文本搜索 | `grep` | `Select-String` |
| 错误处理 | `set -euo pipefail` | `$ErrorActionPreference = "Stop"` |
| 输出报告 | shell 重定向 | 字符串数组写文件 |

## 常见故障排查

### Bash 脚本无法执行

现象：

```text
Permission denied
```

处理：

```bash
chmod +x scripts/local-health-check.sh
./scripts/local-health-check.sh
```

如果提示找不到解释器，检查 shebang：

```bash
#!/usr/bin/env bash
```

### PowerShell 脚本无法执行

现象：

```text
running scripts is disabled on this system
```

检查：

```powershell
Get-ExecutionPolicy
```

继续核对策略来源，不直接改变当前用户策略：

```powershell
Get-ExecutionPolicy -List
```

公司设备先遵守组织策略。

### 路径包含空格导致失败

Bash 中变量加双引号：

```bash
cat "$log_file"
```

PowerShell 中路径加引号，必要时用 `-LiteralPath`：

```powershell
Get-Content -LiteralPath "C:\Logs\app log.txt"
```

### PowerShell 管道结果不是我想的文本

先看对象：

```powershell
Get-Process | Get-Member
```

选择字段：

```powershell
Get-Process | Select-Object Name, Id, CPU
```

需要变成文本时：

```powershell
Get-Process | Out-String
```

### 中文乱码

PowerShell 写文件：

```powershell
Set-Content -Path report.md -Value $Lines -Encoding UTF8
```

Bash 环境检查：

```bash
locale
```

确保终端和文件使用 UTF-8。

### 管道失败但脚本还继续

Bash 使用：

```bash
set -euo pipefail
```

并对允许失败的命令显式写：

```bash
grep ERROR app.log || true
```

PowerShell 使用：

```powershell
$ErrorActionPreference = "Stop"
```

对外部命令要检查 `$LASTEXITCODE`。

### `curl` 在 PowerShell 表现奇怪

Windows PowerShell 中，`curl` 可能是 `Invoke-WebRequest` 的别名。脚本里要明确：

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
```

如果你要调用真正的 curl：

```powershell
curl.exe localhost:8000/health
```

## 典型故障排查表

| 现象 | 常见原因 | 检查命令 | 处理 |
|---|---|---|---|
| Bash 脚本 Permission denied | 没执行权限 | `ls -l script.sh` | `chmod +x script.sh` |
| Bash 变量为空导致危险路径 | 未定义变量 | `set -u`、打印变量 | 检查变量和默认值 |
| PowerShell 脚本被阻止 | 执行策略、签名或组织限制 | `Get-ExecutionPolicy -List` | 核对来源与组织要求，不默认绕过 |
| 路径有空格失败 | 没加引号 | 打印路径 | Bash 双引号，PowerShell 引号或 `-LiteralPath` |
| 输出乱码 | 编码不一致 | 查看文件编码 | 使用 UTF-8 |
| 管道筛选不对 | 文本/对象理解错 | `Get-Member`、查看原始输出 | 按对象属性筛选 |
| HTTP 检查卡住 | 没超时 | 查看命令参数 | 加 timeout |
| 脚本误删文件 | 路径变量错、通配符过大 | 先 echo / `-WhatIf` | 破坏性操作前预演 |

## 学习路线

### 第 1 阶段：单命令

- 查看目录。
- 查看文件。
- 查看进程。
- 查看磁盘。
- 搜索日志。
- 测试网络。

学习证据：整理 Bash / PowerShell 命令对照表。

### 第 2 阶段：管道

- Bash 文本管道。
- PowerShell 对象管道。
- 排序。
- 筛选。
- 选择字段。

学习证据：写出 Top CPU 进程检查命令。

### 第 3 阶段：脚本

- 变量。
- 条件。
- 循环。
- 函数。
- 错误处理。
- 输出文件。

学习证据：本地健康检查脚本。

### 第 4 阶段：Runbook

- 把脚本写进 runbook。
- 写前置条件。
- 写风险。
- 写验证方式。
- 写回滚。

学习证据：`local-health-check.md` 报告和 runbook。

### 第 5 阶段：自动化

- CI/CD 中执行脚本。
- 告警后执行检查。
- 调用 HTTP API。
- 输出 Markdown 或 JSON 给后续系统。

学习证据：GitHub Actions 调用检查脚本。

## 小白可能会问

### Shell 和 PowerShell 最大区别是什么？

Shell，尤其 Bash，通常把命令输出当文本流处理。PowerShell 把很多命令输出成对象，管道里传对象，所以能按属性筛选和排序。

### 为什么脚本比手工命令更适合 runbook？

手工命令容易漏步骤、敲错、无法审计。脚本能版本控制、重复执行、输出报告，还能放进自动化流程。

### 管道到底在传什么？

Bash 管道主要传 stdout 文本。PowerShell 管道传 .NET 对象，直到最后显示时才格式化成文本。

### 什么排障动作适合脚本化？

重复、高频、风险低、步骤明确、输出可验证的动作适合先脚本化。例如健康检查、日志搜索、磁盘检查、接口连通性检查。

### 脚本里为什么不要明文 token？

脚本会提交 Git、发给别人或进入 CI 日志。token 泄露后别人可能访问你的仓库或系统。应从环境变量或安全的 secrets 管理中读取。

## 面试怎么讲

Shell 和 PowerShell 是把运维命令流程化的工具。Bash 更偏文本管道，适合 Linux 上组合 `grep`、`tail`、`ps`、`df`、`curl` 等工具；PowerShell 更偏对象管道，适合 Windows 和跨平台自动化，能用 `Get-Process`、`Where-Object`、`Select-Object` 按对象属性处理数据。在 AIOps 场景里，我会先把人工排障步骤写成健康检查脚本，输出 Markdown 或 JSON 报告，再接入 runbook、CI/CD、告警通知或自动化修复流程。脚本中我会注意引用、路径、退出码、错误处理、执行权限、编码和敏感信息。

## 面试题

1. Shell、Terminal、Bash、PowerShell 分别是什么？
2. Bash builtin 和外部命令有什么区别？
3. Bash 文本管道和 PowerShell 对象管道有什么区别？
4. PowerShell 为什么要用 `Get-Member`？
5. Bash 中单引号和双引号有什么区别？
6. PowerShell 中单引号和双引号有什么区别？
7. Bash 变量赋值为什么等号两边不能有空格？
8. `set -euo pipefail` 分别是什么意思？
9. `$?` 和 `$LASTEXITCODE` 在 PowerShell 中有什么区别？
10. PowerShell 执行策略解决什么问题？
11. 如何查看 Linux 日志最后 100 行？
12. 如何用 PowerShell 搜索日志中的 ERROR？
13. 如何测试某个 HTTP 健康检查接口？
14. 为什么脚本中路径变量要加引号？
15. 为什么脚本中不要明文写 token？
16. 如何把脚本输出保存成 Markdown 报告？
17. 如何排查 PowerShell 管道结果不符合预期？
18. `curl` 在 PowerShell 中有什么坑？
19. 一份健康检查脚本应该包含哪些信息？
20. Shell/PowerShell 如何进入 AIOps 自动化闭环？

## 学习检查清单

- [ ] 我能解释 Shell、Terminal、Bash、PowerShell 的区别。
- [ ] 我能解释 Bash 文本管道和 PowerShell 对象管道。
- [ ] 我能用 Bash 查看目录、文件、日志、进程、磁盘和接口。
- [ ] 我能用 PowerShell 查看目录、文件、日志、进程、磁盘和网络。
- [ ] 我能使用变量和环境变量。
- [ ] 我能正确使用单引号和双引号。
- [ ] 我能理解重定向和退出码。
- [ ] 我能写 Bash 脚本并处理执行权限。
- [ ] 我能写 PowerShell 脚本并处理执行策略。
- [ ] 我能把健康检查结果输出成 Markdown。
- [ ] 我能排查路径、编码、管道和错误处理问题。
- [ ] 我能把常见排障步骤转成 runbook。

## 老师带练：脚本输出“成功”，究竟成功了什么

我们把目标缩到一件事：值班人员想知道某个配置文件是否存在。手工看一次很简单，自动化却要处理“文件不存在、权限不足、输入路径错误、读取成功但内容不合法”四种不同结果。脚本的工作不是把这些都写成一行 `FAIL`，而是把证据和业务判定组织好，让下游知道是否应该重试、报警或交给人。

图中的 `stdin/stdout/stderr` 分别是标准输入、标准输出、标准错误；`parses` 是解析，`expands` 是展开，`globs` 是通配符，`exit status` 是退出状态。对象管道中的 `property` 是属性，`formatter` 是最后的显示格式化器。Bash 的管道在操作系统层面传字节流，常用工具把它解释成文本；它并非只能传文本。PowerShell cmdlet（命令单元）之间主要传对象，但接入外部程序后要重新考虑字符串与字节边界。

### 先讲明白四个会让自动化误报的细节

第一，屏幕上的红字不是退出码。Bash 中 `false | true` 默认得到最后一个命令的成功状态；`pipefail` 才会让前面的失败影响整个管道。`set -e` 在条件、逻辑组合和函数调用上下文有例外，所以“写了严格模式就不必检查错误”是误解。关键副作用必须显式判断成功条件。

第二，`grep` 没找到匹配一般返回 1，读取文件失败则是另一类非零状态。`grep ERROR file || true` 会把“没有 ERROR”和“文件根本读不了”一起抹掉。生产采集器应区分它们：无匹配可记录为正常空结果，读取失败要标记采集失败，否则没有证据反而被当成系统健康。

第三，PowerShell 函数中每一个未被接收的成功流输出都会成为返回结果。若函数先输出字符串 `FAIL` 再 `return $false`，调用者得到的是两个元素的数组，放到 `if` 里可能被当成真。上面的 `Test-Url` 因此只在成功流返回布尔值，把说明送到 `Write-Verbose`。这和很多语言“只有 return 后面才算返回值”不同。

第四，`$ErrorActionPreference = 'Stop'` 主要约束 PowerShell 错误处理，不能跨版本假定所有外部命令非零退出码自动抛异常。调用 `git`、`curl.exe`、编译工具后，应立即检查 `$LASTEXITCODE`，别被随后执行的另一个外部程序覆盖。命令没找到又是调用层错误，不该当成业务失败。[PowerShell 错误首选项](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_preference_variables)

### 不接触生产的失败实验：同样的失败，为什么被管道藏起来

前提：Bash 可用，或者已安装 PowerShell；下面两组任选，直接交互执行，不删除任何文件。它们只有子进程和少量内存对象。

在 Bash 执行：

```bash
bash -c 'false | true; printf "default=%s\n" "$?"'
bash -c 'set -o pipefail; false | true; printf "pipefail=%s\n" "$?"'
```

预期第一行 `default=0`，第二行 `pipefail=1`。`bash -c` 创建独立解释器，避免把选项永久改到当前终端；`false` 固定失败、`true` 固定成功，因此不用制造真实服务故障。这个实验中的子进程最后执行的是 `printf`，所以观察的是打印出的管道状态，而不是外层 shell 最终退出码。若要让 CI 失败，还需要把捕获的状态传给 `exit`。

PowerShell 版本观察“错误与业务失败”：

```powershell
$ProbeRows = @(
  [pscustomobject]@{ Service = 'payment'; Healthy = $true },
  [pscustomobject]@{ Service = 'search'; Healthy = $false }
)
$UnhealthyRows = @($ProbeRows | Where-Object { -not $_.Healthy })
"checked=$($ProbeRows.Count) unhealthy=$($UnhealthyRows.Count)"
$ProbeRows | ConvertTo-Json
```

预期 `checked=2 unhealthy=1`，JSON 中一条 `Healthy` 为 false。所有 PowerShell 命令本身都成功了，但业务健康判定不通过。把第二条改为 `$true` 再执行，预期 `unhealthy=0`。这就是有界故障注入：改变模拟输入，观察判断，再恢复输入，而不是停止真实服务。

继续尝试错误示例 `Format-Table` 后再导出 JSON：你会得到格式化对象，而非业务字段。因此正确顺序是“收集 → 过滤 → 选择属性 → 导出 JSON/CSV”，只在给人看的最后一步格式化。清理实验变量可用 `Remove-Variable ProbeRows,UnhealthyRows`；Bash 子进程已经自动退出。失败时先看当前 shell 是否正确、引号是否原样，再核对布尔值是不是字符串 `'false'`；非空字符串不是布尔假。

### 把脚本提升成可靠的 AIOps 采集器

一份结果至少包含 `schemaVersion`（字段格式版本）、采集时间及时区、对象标识、执行结果、业务结果、耗时和错误类别。机器读 JSON，人读摘要；不要让日志和 JSON 混在同一个标准输出流中。PowerShell 用对象加 `ConvertTo-Json`，并为复杂嵌套指定适当 `-Depth`；Bash 生成复杂 JSON 时采用可靠编码工具，不用字符串拼接假定日志没有双引号。

采集一百台机器时，每次连接都应有超时，并发要有上限；给整批设置截止时间，避免一台无响应让整个报表永远不完成。重试只对临时连接失败等明确类别，失败次数有限并加入间隔；认证失败通常不该快速重试。结果中保留“未知”，不能把没采到的机器算成健康。

变更脚本比采集脚本多一道门：先校验目标路径和对象范围，展示计划，要求适用的审批；同一对象避免并发重复执行；变更后验证业务状态。`-WhatIf` 是支持它的命令提供的预演，不保证每个命令、外部程序或脚本都自动支持。日志中打印一个目录，也不等于确认它不是根目录、符号链接或用户重要目录。关键删除应使用明确目标和包含关系验证，默认不递归。

环境变量也不是秘密保险箱：它可能被子进程继承、被诊断信息记录。前面的令牌示例只检查是否配置，不打印内容；实际值由凭据管理系统注入，避免写进命令历史。Windows PowerShell 5.1 和 PowerShell 7 的 UTF-8/BOM 默认行为有差异，交付时记录 `$PSVersionTable.PSVersion`、文件编码及下游程序要求，不用“UTF8 永远一样”解释乱码。

### 面试递进与生产场景

30 秒：Bash 组合字节/文本流，PowerShell 组合对象流；可靠脚本还需要输入验证、超时、错误分类、结构化结果和可审计的变更边界。

3 分钟：用管道隐藏失败和函数多输出两个例子解释机制，再讲健康检查的技术成功与业务成功，最后给出并发、重试、权限和回滚设计。追问“批量检查只回来了 90/100 台算成功吗”，答题先交代十台是超时、认证失败还是未执行，不把缺数据记为健康；追问“定时任务没问题但手工运行正常”，对照执行身份、工作目录、PATH、代理、交互凭据和环境变量；追问“重复运行安全怎么证明”，应说出实际幂等条件和中途失败状态，而不是只说“加 try/catch”。

## 脚本工程课堂：从能运行走到能放心重复运行

### 命令参数是数据，不是另一段代码

老师先强调一个原则：服务名、文件路径、用户输入应该作为参数传入命令，不要拼成新的命令字符串再求值。Bash 的引号决定空格、通配符和变量如何展开；PowerShell 的参数绑定与对象管道又是另一套规则。一个包含空格的目录在普通样例里不出问题，不代表真实路径也安全。

PowerShell 访问用户给出的精确路径时，优先考虑 `-LiteralPath`，避免把方括号、星号等解释为通配模式。外部命令的参数可用数组组织，再通过调用运算符执行；不要为了方便使用 `Invoke-Expression` 运行拼接文本。Bash 中同样避免用 `eval` 处理不可信输入。引号保护语法，但业务范围仍要校验，两层都不能少。

例如采集目录只允许 `logs/` 下的文件，参数被正确引用也仍可能是 `../secret.txt`。先解析规范化路径，再确认位于允许根目录内；若目录可被不可信用户写入，还要考虑符号链接和检查后替换的时间差。路径安全不是只排除几个特殊字符，而是明确允许访问哪个对象集合。

### PowerShell 有多条输出流，不是只有一串文本

成功输出、错误、警告、详细信息等流承担不同职责。函数里一个没有被接收或抑制的普通表达式，可能进入成功输出，成为调用者拿到的返回值。写了 `return $true` 不代表函数只会返回一个布尔值；前面若输出了日志字符串，调用者得到的可能是一个数组。

因此库函数返回结构化数据，进度说明用适当日志流，调试信息用 `Write-Verbose` 等机制。不要在数据管道中途 `Format-Table` 再继续按业务属性筛选，因为格式化命令产生的是显示用对象，不是原始进程或服务对象。正确顺序通常是先筛选、计算、导出，最后才格式化给人看。

`Select-Object` 选择属性与 `Select-Object -ExpandProperty` 提取属性值也不同：前者仍是包装对象，后者更接近直接取出该字段的内容。写 CSV 或 JSON 前明确每列类型，避免某个对象在输出里变成难以处理的格式化字符串。AIOps 采集脚本应提供稳定字段而不是让下游解析人类表格。

### 错误流、异常和退出码有不同的传播路径

PowerShell 的非终止错误不一定进入 `catch`。需要把某个 cmdlet 失败作为异常处理时，可以对相关命令使用 `-ErrorAction Stop`；这不表示所有外部程序的非零退出码都被自动转换成同一种异常。原生命令行为还受 PowerShell 版本与偏好设置影响，因此关键脚本要明确检查 `$LASTEXITCODE` 并记录运行环境。[偏好变量说明](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_preference_variables)

Bash 中 `set -e` 也不是一个完整错误处理框架；条件判断、管道、子 shell 等语境会影响行为。对关键步骤显式判断退出码或用清楚的失败分支，比依赖读者背下所有例外更容易维护。`pipefail` 可以帮助暴露前序管道失败，但仍要区分“没有匹配项”的业务状态与命令执行故障。

老师建议给脚本定义退出码契约：零表示本次任务完成且通过必要验证，其他明确值分别表示输入错误、依赖不可达、检测到异常等。调用方必须按契约解释，不能见到非零就无条件重试。例如扫描发现告警的非零状态可能是正常业务结果，网络读取失败才需要另一条处理路径。

### 一个完整的布尔返回故障实验

前置条件是自己的 PowerShell 窗口，不需要管理员权限，不访问网络。下面使用独立作用域，退出后不会留下全局函数：

```powershell
& {
  function Test-BrokenResult {
    '准备检查'
    return $false
  }
  function Test-CleanResult {
    [CmdletBinding()]
    param()
    Write-Verbose '准备检查'
    return $false
  }
  $broken = Test-BrokenResult
  $clean = Test-CleanResult -Verbose
  "错误返回项数：$(@($broken).Count)"
  "正确返回类型：$($clean.GetType().Name)"
  if ($broken) { '错误示例竟然进入成功分支' }
  if (-not $clean) { '正确示例保留失败结果' }
}
```

预期错误示例返回两项，并在条件中被当作真；正确示例返回 Boolean 且为假。故障来自日志污染数据流，不是布尔值本身改变。将错误函数里的普通字符串改成合适的详细日志输出后，再验证返回项数为一。若表现不同，检查是否把其他调试输出混入成功流。此实验只创建局部变量和函数，结束即清理，保留输出与原因说明即可。

### 超时、重试与清理必须有总预算

给每次网络调用设置五秒超时，不代表整个脚本最多五秒。它可能遍历一千台主机并重试三次，总时长远超维护窗口。容量预算要同时限制目标数、每次等待、最大尝试次数、并发与总截止时间。高风险操作超时后先查询真实结果，不把“我没收到响应”当成“目标没执行”。

清理逻辑应只处理本次创建的资源，并记录创建成功与否。脚本启动失败时直接清空一个变量指向的目录，变量为空或值错误就可能扩大范围。删除前验证解析后的绝对路径与预期工作目录关系，先展示候选再执行；涉及业务数据时还需要明确授权与恢复办法。

`finally` 或退出 trap 适合清理临时文件和连接，但进程被强制终止、机器断电时不保证有机会执行。关键状态放到可恢复记录里，下一次运行能识别未完成步骤。临时目录使用本次独立名称，避免两个脚本实例互删文件；对共享输出使用明确锁或原子替换策略。

### 并发不是把循环简单改成后台运行

并行采集可以缩短总等待，但也会让目标数据库、SSH 服务、网络和本机句柄承受压力。先设有限并发，保留每项的目标身份、开始结束时间与独立结果。输出不能仅按完成顺序拼接后假定它仍对应原清单顺序，应该用资源 ID 关联。

PowerShell 作业或并行机制涉及各自会话、变量传递和版本支持；Bash 后台进程也需要 wait 和退出码收集。一个子任务失败，不自动终止其他已启动操作。对于只读采集可以汇总部分结果并标注缺失；对于写操作要明确失败后是否停止新任务、如何等已启动任务收敛，以及是否需要补偿。

### 脚本接口要支持机器，也要帮助人判断

一个好的健康采集器可以输出 JSON，字段包含 schemaVersion、目标、检查时间、结果类别、耗时和证据摘要；人类说明从另一个日志通道展示。字段命名和单位稳定后，自动化平台才能做历史比较。CPU 用百分比还是比值、时间用秒还是毫秒，都要写进接口说明，不靠下游猜测。

敏感字段用引用或脱敏标识，不把完整认证头、环境变量和日志正文一股脑输出。调试模式也要控制范围与时效，避免一次排障把秘密永久留在公共流水线日志中。公开 GitHub 学习证据应使用虚构主机和样本，真实生产信息放在受控位置。

面试最后可以用一条证据采集链收束：输入校验选择目标，有限并发获取事实，明确超时与错误分类，结构化输出交给规则或模型分析，执行器只在授权条件下做变更，再验证业务结果。脚本越短不一定越可靠，最重要的是每一个输出、失败与副作用都能解释。

## 边界机制课堂：脚本的环境和输出也属于接口

### 重定向从左到右，顺序会改变日志去向

老师让你比较“先把正常输出送到文件，再把错误合到正常输出”和“先把错误合到当前正常输出，再把正常输出送到文件”。它们看起来用了相同符号，最终去向却不同。Bash 按从左到右处理重定向；复制描述符时保存的是当时的指向，不是创建一个以后一直跟随变化的关系。

因此 `command >report.txt 2>&1` 会把两条流都送到报告，而 `command 2>&1 >report.txt` 通常仍让错误走原来的正常输出位置。第二种并非无效，只是经常不是作者想要的效果。排障时先用固定正常与错误两条消息验证去向，再接入真实采集程序，避免执行结束才发现关键错误没有被保存。[Bash 重定向规则](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)

更进一步，重定向打开目标文件发生在命令真正执行之前。命令没有成功读取输入，不代表输出文件没有被截断。对重要报告不要直接覆盖唯一正式文件，应使用独立输出并在成功校验后切换；失败保留旧报告，但必须附上更新时间和此次失败状态。否则读者会把昨天的健康结论当作今天的检查结果。

### 子解释器里的变量，不能直接改变父解释器

Bash 管道的各段通常在各自执行环境中运行，具体还受最后管道段相关选项与作业控制影响。一个常见陷阱是把文本通过管道送给循环，循环内部计数增加了，循环外变量却没变。原因不是加法失效，而是修改发生在另一个环境，不能回写父环境。不要把某台机器上的特定选项行为当作所有 Bash 的默认保证。[Bash 管道](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)

简单文件处理可以将输入重定向给循环，让循环本身处于当前环境；也可以让子任务明确输出结构化结果，由父进程接收。两种方法都比隐式依赖变量穿透更清楚。观察时同时打印进程身份和循环前后计数，确认变量在哪个环境改变，但不要打印含凭据的完整环境变量表。

PowerShell 的调用作用域、点调用和作业也有类似的边界问题，但语义不能照抄 Bash。点调用会把脚本内容放进当前作用域，可能覆盖现有变量或函数；普通调用更容易把临时状态限制在调用范围。运行别人的脚本前先理解它是否依赖当前会话，不为解决一个变量找不到就盲目点调用整份脚本。

### 参数数组保存边界，不能代替目标校验

一个文件名包含空格，是一个参数；两个文件名才是两个参数。Bash 数组与正确引用可以保留这个边界，PowerShell 调用运算符配合参数数组也比拼接命令字符串更明确。不要把全部参数提前连接成一个字符串再传入，随后又希望解释器猜出哪些空格属于文件名。

但参数边界正确并不保证目标合理。一个以短横线开头的值可能被外部程序识别为选项，一个合法字符串也可能指向未授权资源。根据具体工具使用参数终止约定或显式命名参数，并执行业务白名单校验。跨平台原生命令的参数转换还受 PowerShell 版本和目标程序解析方式影响，必须用包含空格、引号、空字符串的样本做兼容测试。

这也是为何自动化脚本应固定工具入口并记录版本。当前目录里出现与常用命令同名的程序、会话里存在别名或函数，都可能让实际执行对象不同。用命令发现工具核对来源；高风险执行路径使用经过部署管理的明确可执行文件，而不是让任意输入决定运行哪个程序。

### PowerShell 的零个、一个、多个结果必须有明确合同

很多管道自然枚举对象，赋值结果可能随数量表现为无值、单个对象或数组。统计时用数组包装明确数量语义，可以避免“昨天有两条正常，今天只有一条就报错”。但包装只保证容器，不会自动验证每个元素的业务类型。调用方仍要区分没有结果、查询失败和真实空列表。

函数返回集合时，也要解释是枚举每个元素，还是把集合当作一个整体对象返回。普通 `return` 会结束函数执行，但此前成功流输出已经进入结果，不会被撤销。针对这些边界写三组测试：零条、一条和多条，分别检查类型、数量和字段。前面的布尔返回故障就是这个规则在健康判断中的具体体现。[PowerShell 返回规则](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_return?view=powershell-7.4)

导出为机器接口时，优先返回有稳定字段的外层对象，例如总数、数据数组和错误数组，而不让最外层结构随结果条数变化。接收方才能可靠识别“本次检查完成但没有匹配”与“完全没产生输出”。这项约定对后续日报、告警汇总和异常模型特征提取尤其重要。

### 编码不是给文件统一贴一个 UTF-8 标签

编码决定字符如何变成字节，换行决定行结束形式，字节顺序标记又是另一项文件特征。Windows PowerShell 与较新 PowerShell 的默认编码和部分输出行为不同；写了相同编码参数，不意味着所有版本生成完全相同字节。外部程序若严格检查首字节或只接受某种换行，差异就会变成运行故障。[PowerShell 字符编码](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding?view=powershell-7.4)

不要先大范围重写所有文件。选一个最小失败样本，记录原始字节、解释器版本、写入方法与读取程序要求，再确认转换是否解决问题。配置文件签名、摘要和审计记录可能依赖精确字节；自动“修乱码”会改变这些证据。文本报告可以容忍的格式差异，不一定适合二进制制品或签名配置。

### 设计题：同一检查同时被定时任务和告警触发

两个触发源同时运行，可能互相覆盖报告或重复执行修复。只读检查可为每次运行创建独立结果，再按目标和时间归并；有状态操作则需要互斥或幂等标识，并解释持有者崩溃后如何恢复。简单创建一个锁文件不自动解决陈旧锁、跨主机一致性和权限问题，要根据实际部署范围选择机制。

面试追问“脚本已经结束为何还占锁”，先区分正常退出清理没执行、强制终止、路径不一致和其他实例仍在运行。不能只看到锁文件就直接删掉，再让两个写任务一起执行。核对持有者身份、开始时间和任务状态，在授权范围内恢复；随后给失败退出、重复触发和进程中断补测试。脚本高可用不是让它无条件重复启动，而是让重复与中断都能安全收敛。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `scripts/local-health-check.sh`
- `scripts/local-health-check.ps1`
- `docs/learning-records/local-health-check-linux.md`
- `docs/learning-records/local-health-check-windows.md`
- 一篇笔记：`Bash 文本管道和 PowerShell 对象管道的区别.md`
- 一篇排障记录：`PowerShell 执行策略和脚本乱码怎么查.md`

如果你能把“手工敲命令排障”变成“脚本自动采集证据并生成报告”，你就已经迈过了 AIOps 自动化的第一道门。
