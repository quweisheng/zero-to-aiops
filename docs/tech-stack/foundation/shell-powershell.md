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
Bash
  ├── What is Bash / What is a shell
  ├── Basic Shell Features
  │   ├── Shell syntax
  │   ├── Quoting
  │   ├── Commands
  │   ├── Pipelines
  │   ├── Lists and compound commands
  │   ├── Functions
  │   ├── Parameters and variables
  │   ├── Expansions
  │   ├── Redirections
  │   ├── Execution environment
  │   ├── Exit status
  │   └── Shell scripts
  ├── Shell Builtin Commands
  ├── Shell Variables
  ├── Bash Features
  ├── Job Control
  ├── Command Line Editing
  └── History
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Bash</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── What is Bash / What is a shell</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── Basic Shell Features</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  │   ├── Shell syntax</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  │   ├── Quoting</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  │   ├── Commands</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  │   ├── Pipelines</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  │   ├── Lists and compound commands</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  │   ├── Functions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  │   ├── Parameters and variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  │   ├── Expansions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  │   ├── Redirections</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  │   ├── Execution environment</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  │   ├── Exit status</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  │   └── Shell scripts</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  ├── Shell Builtin Commands</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  ├── Shell Variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>  ├── Bash Features</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>  ├── Job Control</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 20 行 | <code>  ├── Command Line Editing</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 21 行 | <code>  └── History</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


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
PowerShell
  ├── Shell and scripting language
  ├── Cmdlets
  ├── Objects, properties, methods
  ├── Pipeline
  ├── Providers
  ├── Variables
  ├── Quoting rules
  ├── Redirection and streams
  ├── Scripts and functions
  ├── Execution policies
  ├── Modules
  ├── Remoting
  └── Help system
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PowerShell</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Shell and scripting language</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── Cmdlets</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── Objects, properties, methods</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── Pipeline</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  ├── Providers</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  ├── Variables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  ├── Quoting rules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  ├── Redirection and streams</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  ├── Scripts and functions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  ├── Execution policies</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  ├── Modules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  ├── Remoting</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  └── Help system</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


PowerShell 的核心不是“Windows 版 Bash”。它的关键差异是：管道里传的是对象，不只是文本。

## Shell / PowerShell 在 AIOps 链路中的位置

```text
manual troubleshooting
  ├── check process
  ├── check ports
  ├── check disk
  ├── check logs
  └── test API
        |
        v
Shell / PowerShell scripts
        |
        +--> runbook automation
        +--> CI/CD checks
        +--> scheduled health reports
        +--> incident evidence collection
        +--> webhook or API calls
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>manual troubleshooting</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── check process</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── check ports</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── check disk</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── check logs</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  └── test API</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>Shell / PowerShell scripts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>        +--&gt; runbook automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>        +--&gt; CI/CD checks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>        +--&gt; scheduled health reports</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>        +--&gt; incident evidence collection</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>        +--&gt; webhook or API calls</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grep ERROR app.log &#124; tail -n 20</code> | 执行 `grep` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


大致过程：

```text
Bash reads command line
  -> parses words, quotes, pipes and redirections
  -> expands variables and globs
  -> finds command grep
  -> starts process
  -> connects grep stdout to tail stdin
  -> waits for pipeline
  -> returns exit status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Bash reads command line</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; parses words, quotes, pipes and redirections</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; expands variables and globs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; finds command grep</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; starts process</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; connects grep stdout to tail stdin</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; waits for pipeline</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; returns exit status</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124; Sort-Object CPU -Descending &#124; Select-Object -First 5 Name, Id, CPU</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


大致过程：

```text
PowerShell parses command
  -> runs Get-Process
  -> outputs process objects
  -> Sort-Object sorts by CPU property
  -> Select-Object selects properties
  -> formatter displays table
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PowerShell parses command</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; runs Get-Process</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; outputs process objects</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Sort-Object sorts by CPU property</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Select-Object selects properties</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; formatter displays table</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ps aux &#124; grep nginx</code> | 查看进程快照，用来确认目标服务或脚本是否正在运行。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124;</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 2 行 | <code>  Where-Object { $_.ProcessName -like "*nginx*" } &#124;</code> | 执行 `where-object` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 3 行 | <code>  Select-Object ProcessName, Id, CPU</code> | 执行 `select-object` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>type ls</code> | 执行 `type` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>type cd</code> | 执行 `type` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>command -v bash</code> | 执行 `command` 相关命令，后面的参数决定它具体操作什么对象。 |


可能输出：

```text
ls is /usr/bin/ls
cd is a shell builtin
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ls is /usr/bin/ls</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>cd is a shell builtin</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查看帮助：

```bash
help cd
man ls
ls --help
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>help cd</code> | 执行 `help` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>man ls</code> | 执行 `man` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ls --help</code> | 列出文件或目录，用来确认实验文件是否存在。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Command Get-Process</code> | 执行 `get-command` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>Get-Command *Process*</code> | 执行 `get-command` 相关命令，后面的参数决定它具体操作什么对象。 |


查看帮助：

```powershell
Get-Help Get-Process
Get-Help Get-Process -Examples
Get-Help Get-Process -Full
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Help Get-Process</code> | 执行 `get-help` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>Get-Help Get-Process -Examples</code> | 执行 `get-help` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>Get-Help Get-Process -Full</code> | 执行 `get-help` 相关命令，后面的参数决定它具体操作什么对象。 |


查看对象结构：

```powershell
Get-Process | Get-Member
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124; Get-Member</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


这一步非常重要。PowerShell 排障不是先猜列，而是先看对象有哪些属性和方法。

## 变量

### Bash 变量

定义：

```bash
service="demo-api"
port=8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service="demo-api"</code> | 执行 `service="demo-api"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>port=8000</code> | 执行 `port=8000` 相关命令，后面的参数决定它具体操作什么对象。 |


使用：

```bash
echo "$service"
echo "service=$service port=$port"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>echo "$service"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 2 行 | <code>echo "service=$service port=$port"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


注意：等号两边不能有空格。

错误写法：

```bash
service = "demo-api"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service = "demo-api"</code> | 执行 `service` 相关命令，后面的参数决定它具体操作什么对象。 |


这会被 Bash 解析成执行名为 `service` 的命令，并传参数。

### PowerShell 变量

定义：

```powershell
$Service = "demo-api"
$Port = 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$Service = "demo-api"</code> | 执行 `$service` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>$Port = 8000</code> | 执行 `$port` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


使用：

```powershell
Write-Output $Service
Write-Output "service=$Service port=$Port"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Write-Output $Service</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>Write-Output "service=$Service port=$Port"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


PowerShell 变量以 `$` 开头。变量里可以放字符串、数字、对象、数组、哈希表。

## 环境变量

环境变量用于把配置传给进程。不要把 token 写死在脚本里，优先从环境变量读取。

### Bash

读取：

```bash
echo "$GITHUB_TOKEN"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>echo "$GITHUB_TOKEN"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


设置当前 shell：

```bash
export GITHUB_TOKEN="..."
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export GITHUB_TOKEN="..."</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


脚本里判断：

```bash
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is required" >&2
  exit 1
fi
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if [[ -z "${GITHUB_TOKEN:-}" ]]; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  echo "GITHUB_TOKEN is required" &gt;&amp;2</code> | 输出一段文本，常用于写入测试内容或验证变量。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 3 行 | <code>  exit 1</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |


### PowerShell

读取：

```powershell
$env:GITHUB_TOKEN
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$env:GITHUB_TOKEN</code> | 执行 `$env:github_token` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


设置当前进程：

```powershell
$env:GITHUB_TOKEN = "..."
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$env:GITHUB_TOKEN = "..."</code> | 执行 `$env:github_token` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


脚本里判断：

```powershell
if (-not $env:GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN is required"
  exit 1
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if (-not $env:GITHUB_TOKEN) {</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>  Write-Error "GITHUB_TOKEN is required"</code> | 执行 `write-error` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  exit 1</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |


## 引号和转义

### Bash 引号

单引号：原样保留。

```bash
name="api"
echo '$name'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name="api"</code> | 执行 `name="api"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>echo '$name'</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


输出：

```text
$name
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$name</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


双引号：变量会展开。

```bash
name="api"
echo "$name"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name="api"</code> | 执行 `name="api"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>echo "$name"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


输出：

```text
api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


建议：Bash 中使用变量时，大多数情况加双引号。

```bash
cat "$log_file"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>cat "$log_file"</code> | 打印文件内容，用来检查配置或日志片段。 |


这样路径里有空格时不容易炸。

### PowerShell 引号

单引号：不展开变量。

```powershell
$Name = "api"
'service=$Name'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$Name = "api"</code> | 执行 `$name` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>'service=$Name'</code> | 执行 `'service=$name'` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


输出：

```text
service=$Name
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service=$Name</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


双引号：展开变量。

```powershell
$Name = "api"
"service=$Name"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$Name = "api"</code> | 执行 `$name` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>"service=$Name"</code> | 执行 `"service=$name"` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


输出：

```text
service=api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service=api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


表达式要用 `$()`：

```powershell
"Top process: $((Get-Process | Sort-Object CPU -Descending | Select-Object -First 1).ProcessName)"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"Top process: $((Get-Process &#124; Sort-Object CPU -Descending &#124; Select-Object -First 1).ProcessName)"</code> | 执行 `"top` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


## 通配符和路径

### Bash

```bash
ls *.log
rm *.tmp
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ls *.log</code> | 列出文件或目录，用来确认实验文件是否存在。 |
| 第 2 行 | <code>rm *.tmp</code> | 执行 `rm` 相关命令，后面的参数决定它具体操作什么对象。 |


`*.log` 会由 shell 展开为匹配的文件列表。

风险：如果你写：

```bash
rm -rf "$dir"/*
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rm -rf "$dir"/*</code> | 执行 `rm` 相关命令，后面的参数决定它具体操作什么对象。 |


要确保 `$dir` 不为空、不指向错误路径。破坏性命令前先打印变量：

```bash
echo "dir=$dir"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>echo "dir=$dir"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


### PowerShell

```powershell
Get-ChildItem *.log
Remove-Item *.tmp
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-ChildItem *.log</code> | PowerShell 列出文件、目录或匹配项，用来检查本地环境。 |
| 第 2 行 | <code>Remove-Item *.tmp</code> | PowerShell 删除文件或目录，执行前要确认路径正确。 |


PowerShell 也支持通配符，但对象和 provider 模型更复杂。对路径操作，重要命令支持 `-LiteralPath`，用于不把 `[`、`]`、`*` 等当通配符。

```powershell
Get-Item -LiteralPath "file[1].log"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Item -LiteralPath "file[1].log"</code> | 执行 `get-item` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>./check.sh &gt; report.txt 2&gt; error.txt</code> | 执行 `./check.sh` 相关命令，后面的参数决定它具体操作什么对象。 |


合并输出：

```bash
./check.sh > report.txt 2>&1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>./check.sh &gt; report.txt 2&gt;&amp;1</code> | 执行 `./check.sh` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.\check.ps1 &gt; report.txt</code> | 执行 `.\check.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>.\check.ps1 2&gt; error.txt</code> | 执行 `.\check.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>.\check.ps1 *&gt; all-output.txt</code> | 执行 `.\check.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |


`*>` 会重定向所有流。

## 退出码和错误

### Bash

查看上一个命令退出码：

```bash
echo "$?"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>echo "$?"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


约定：

```text
0     success
non-0 failure
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>0     success</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>non-0 failure</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


脚本中退出：

```bash
exit 1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exit 1</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |


常见安全选项：

```bash
set -euo pipefail
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$LASTEXITCODE</code> | 执行 `$lastexitcode` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


查看上一条 PowerShell 命令是否成功：

```powershell
$?
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$?</code> | 执行 `$?` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


遇到错误停止：

```powershell
$ErrorActionPreference = "Stop"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$ErrorActionPreference = "Stop"</code> | 执行 `$erroractionpreference` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


捕获异常：

```powershell
try {
  Invoke-WebRequest -Uri "localhost:8000/health" -TimeoutSec 5
} catch {
  Write-Error "health check failed: $_"
  exit 1
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>try {</code> | 执行 `try` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  Invoke-WebRequest -Uri "localhost:8000/health" -TimeoutSec 5</code> | PowerShell 发起 Web 请求，用来验证页面、接口或下载文件。 |
| 第 3 行 | <code>} catch {</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  Write-Error "health check failed: $_"</code> | 执行 `write-error` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 5 行 | <code>  exit 1</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |


## 条件判断

### Bash

```bash
if [[ -f "app.log" ]]; then
  echo "log exists"
else
  echo "log missing"
fi
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if [[ -f "app.log" ]]; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  echo "log exists"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 3 行 | <code>else</code> | 执行 `else` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  echo "log missing"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 5 行 | <code>fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if (Test-Path "app.log") {</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  Write-Output "log exists"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>} else {</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  Write-Output "log missing"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>for service in prometheus grafana demo-api; do</code> | 执行 `for` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  echo "checking $service"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 3 行 | <code>done</code> | 执行 `done` 相关命令，后面的参数决定它具体操作什么对象。 |


逐行读文件：

```bash
while IFS= read -r line; do
  echo "$line"
done < app.log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>while IFS= read -r line; do</code> | 执行 `while` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  echo "$line"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 3 行 | <code>done &lt; app.log</code> | 执行 `done` 相关命令，后面的参数决定它具体操作什么对象。 |


### PowerShell

```powershell
foreach ($Service in "prometheus", "grafana", "demo-api") {
  Write-Output "checking $Service"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>foreach ($Service in "prometheus", "grafana", "demo-api") {</code> | 执行 `foreach` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <code>  Write-Output "checking $Service"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 3 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |


管道式：

```powershell
"prometheus", "grafana", "demo-api" | ForEach-Object {
  Write-Output "checking $_"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"prometheus", "grafana", "demo-api" &#124; ForEach-Object {</code> | 执行 `"prometheus",` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 2 行 | <code>  Write-Output "checking $_"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 3 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |


## 函数

### Bash

```bash
check_url() {
  local url="$1"
  if curl -fsS "$url" > /dev/null; then
    echo "OK $url"
  else
    echo "FAIL $url"
    return 1
  fi
}

check_url "localhost:8000/health"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>check_url() {</code> | 执行 `check_url()` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  local url="$1"</code> | 执行 `local` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  if curl -fsS "$url" &gt; /dev/null; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    echo "OK $url"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 5 行 | <code>  else</code> | 执行 `else` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    echo "FAIL $url"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 7 行 | <code>    return 1</code> | 执行 `return` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 11 行 | <code>check_url "localhost:8000/health"</code> | 执行 `check_url` 相关命令，后面的参数决定它具体操作什么对象。 |


### PowerShell

```powershell
function Test-Url {
  param(
    [Parameter(Mandatory)]
    [string]$Url
  )

  try {
    Invoke-WebRequest -Uri $Url -TimeoutSec 5 | Out-Null
    "OK $Url"
  } catch {
    "FAIL $Url"
    return $false
  }
}

Test-Url -Url "localhost:8000/health"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>function Test-Url {</code> | 执行 `function` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  param(</code> | 执行 `param(` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>    [Parameter(Mandatory)]</code> | 执行 `[parameter(mandatory)]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    [string]$Url</code> | 执行 `[string]$url` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 5 行 | <code>  )</code> | 执行 `)` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>  try {</code> | 执行 `try` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    Invoke-WebRequest -Uri $Url -TimeoutSec 5 &#124; Out-Null</code> | PowerShell 发起 Web 请求，用来验证页面、接口或下载文件。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <code>    "OK $Url"</code> | 执行 `"ok` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 10 行 | <code>  } catch {</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>    "FAIL $Url"</code> | 执行 `"fail` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 12 行 | <code>    return $false</code> | 执行 `return` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 13 行 | <code>  }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 16 行 | <code>Test-Url -Url "localhost:8000/health"</code> | 执行 `test-url` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>echo "== Date =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 5 行 | <code>date</code> | 执行 `date` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo "== Disk =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>df -h</code> | 查看磁盘空间，用来判断磁盘是否快满。 |


授权：

```bash
chmod +x check.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>chmod +x check.sh</code> | 执行 `chmod` 相关命令，后面的参数决定它具体操作什么对象。 |


运行：

```bash
./check.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>./check.sh</code> | 执行 `./check.sh` 相关命令，后面的参数决定它具体操作什么对象。 |


### PowerShell 脚本

文件：`check.ps1`

```powershell
$ErrorActionPreference = "Stop"

"== Date =="
Get-Date

"== Disk =="
Get-PSDrive -PSProvider FileSystem
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$ErrorActionPreference = "Stop"</code> | 执行 `$erroractionpreference` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 3 行 | <code>"== Date =="</code> | 执行 `"==` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>Get-Date</code> | 执行 `get-date` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 6 行 | <code>"== Disk =="</code> | 执行 `"==` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>Get-PSDrive -PSProvider FileSystem</code> | 执行 `get-psdrive` 相关命令，后面的参数决定它具体操作什么对象。 |


运行：

```powershell
.\check.ps1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.\check.ps1</code> | 执行 `.\check.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |


如果执行策略阻止，见后面的执行策略章节。

## PowerShell 执行策略

查看：

```powershell
Get-ExecutionPolicy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-ExecutionPolicy</code> | 执行 `get-executionpolicy` 相关命令，后面的参数决定它具体操作什么对象。 |


当前用户设置：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Set-ExecutionPolicy -Scope CurrentUser RemoteSigned</code> | 执行 `set-executionpolicy` 相关命令，后面的参数决定它具体操作什么对象。 |


执行策略不是完整安全边界，它主要防止无意运行脚本。公司电脑要遵守组织安全策略，不要随意绕过。

临时绕过当前进程：

```powershell
powershell -ExecutionPolicy Bypass -File .\check.ps1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>powershell -ExecutionPolicy Bypass -File .\check.ps1</code> | 执行 `powershell` 相关命令，后面的参数决定它具体操作什么对象。 |


学习环境可以理解它，生产环境要谨慎。

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

本实验会写一个本地健康检查脚本：请求服务健康接口，把时间、状态码和结果写入日志。它对应 AIOps 里的一个基本动作：把人工巡检变成可重复、可记录、可接入告警系统的脚本。

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
  ps aux | sort -nrk 3 | head -n 10
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>report="docs/learning-records/local-health-check-linux.md"</code> | 执行 `report="docs/learning-records/local-health-check-linux.md"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>mkdir -p "$(dirname "$report")"</code> | 创建目录，用来准备实验项目结构。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>{</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  echo "# Local Health Check"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 9 行 | <code>  echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 10 行 | <code>  echo "## Time"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>  date</code> | 执行 `date` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>  echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 13 行 | <code>  echo "## User and Host"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 14 行 | <code>  echo "user=$(whoami)"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>  echo "host=$(hostname)"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>  echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 17 行 | <code>  echo "## Disk"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 18 行 | <code>  df -h</code> | 查看磁盘空间，用来判断磁盘是否快满。 |
| 第 19 行 | <code>  echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 20 行 | <code>  echo "## Top Processes"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 21 行 | <code>  ps aux &#124; sort -nrk 3 &#124; head -n 10</code> | 查看进程快照，用来确认目标服务或脚本是否正在运行。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 22 行 | <code>  echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>  echo "## Recent Errors"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 24 行 | <code>  if [[ -f "app.log" ]]; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 25 行 | <code>    grep -n "ERROR" app.log &#124; tail -n 20 &#124;&#124; true</code> | 执行 `grep` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 26 行 | <code>  else</code> | 执行 `else` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 27 行 | <code>    echo "app.log not found"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 28 行 | <code>  fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 29 行 | <code>} &gt; "$report"</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 30 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 31 行 | <code>echo "wrote $report"</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


运行：

```bash
chmod +x scripts/local-health-check.sh
./scripts/local-health-check.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>chmod +x scripts/local-health-check.sh</code> | 执行 `chmod` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>./scripts/local-health-check.sh</code> | 执行 `./scripts/local-health-check.sh` 相关命令，后面的参数决定它具体操作什么对象。 |


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
  $Matches = Select-String -Path ".\app.log" -Pattern "ERROR" | Select-Object -Last 20
  if ($Matches) {
    $Lines += ($Matches | Out-String).Trim()
  } else {
    $Lines += "No ERROR lines found."
  }
} else {
  $Lines += "app.log not found"
}

$Lines | Set-Content -Path $ReportPath -Encoding UTF8
Write-Output "wrote $ReportPath"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$ErrorActionPreference = "Stop"</code> | 执行 `$erroractionpreference` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 2 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 3 行 | <code>$ReportPath = "docs/learning-records/local-health-check-windows.md"</code> | 执行 `$reportpath` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 4 行 | <code>$ReportDir = Split-Path $ReportPath</code> | 执行 `$reportdir` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 5 行 | <code>New-Item -ItemType Directory -Path $ReportDir -Force &#124; Out-Null</code> | 执行 `new-item` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>$Lines = @()</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 8 行 | <code>$Lines += "# Local Health Check"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 9 行 | <code>$Lines += ""</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 10 行 | <code>$Lines += "## Time"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 11 行 | <code>$Lines += (Get-Date &#124; Out-String).Trim()</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 12 行 | <code>$Lines += ""</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 13 行 | <code>$Lines += "## User and Host"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 14 行 | <code>$Lines += "user=$env:USERNAME"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 15 行 | <code>$Lines += "computer=$env:COMPUTERNAME"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 16 行 | <code>$Lines += ""</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 17 行 | <code>$Lines += "## Disk"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 18 行 | <code>$Lines += (Get-PSDrive -PSProvider FileSystem &#124; Out-String).Trim()</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 19 行 | <code>$Lines += ""</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 20 行 | <code>$Lines += "## Top Processes"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 21 行 | <code>$Lines += (</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 22 行 | <code>  Get-Process &#124;</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 23 行 | <code>    Sort-Object CPU -Descending &#124;</code> | 执行 `sort-object` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 24 行 | <code>    Select-Object -First 10 Name, Id, CPU, WorkingSet &#124;</code> | 执行 `select-object` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 25 行 | <code>    Out-String</code> | 执行 `out-string` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 26 行 | <code>).Trim()</code> | 执行 `).trim()` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 27 行 | <code>$Lines += ""</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 28 行 | <code>$Lines += "## Recent Errors"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 29 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 30 行 | <code>if (Test-Path ".\app.log") {</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 31 行 | <code>  $Matches = Select-String -Path ".\app.log" -Pattern "ERROR" &#124; Select-Object -Last 20</code> | 执行 `$matches` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 32 行 | <code>  if ($Matches) {</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 33 行 | <code>    $Lines += ($Matches &#124; Out-String).Trim()</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 34 行 | <code>  } else {</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 35 行 | <code>    $Lines += "No ERROR lines found."</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 36 行 | <code>  }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 37 行 | <code>} else {</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 38 行 | <code>  $Lines += "app.log not found"</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 39 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 40 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 41 行 | <code>$Lines &#124; Set-Content -Path $ReportPath -Encoding UTF8</code> | 执行 `$lines` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 42 行 | <code>Write-Output "wrote $ReportPath"</code> | 执行 `write-output` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


运行：

```powershell
.\scripts\local-health-check.ps1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.\scripts\local-health-check.ps1</code> | 执行 `.\scripts\local-health-check.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Permission denied</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


处理：

```bash
chmod +x scripts/local-health-check.sh
./scripts/local-health-check.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>chmod +x scripts/local-health-check.sh</code> | 执行 `chmod` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>./scripts/local-health-check.sh</code> | 执行 `./scripts/local-health-check.sh` 相关命令，后面的参数决定它具体操作什么对象。 |


如果提示找不到解释器，检查 shebang：

```bash
#!/usr/bin/env bash
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |


### PowerShell 脚本无法执行

现象：

```text
running scripts is disabled on this system
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>running scripts is disabled on this system</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


检查：

```powershell
Get-ExecutionPolicy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-ExecutionPolicy</code> | 执行 `get-executionpolicy` 相关命令，后面的参数决定它具体操作什么对象。 |


学习环境可设置当前用户：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Set-ExecutionPolicy -Scope CurrentUser RemoteSigned</code> | 执行 `set-executionpolicy` 相关命令，后面的参数决定它具体操作什么对象。 |


公司设备先遵守组织策略。

### 路径包含空格导致失败

Bash 中变量加双引号：

```bash
cat "$log_file"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>cat "$log_file"</code> | 打印文件内容，用来检查配置或日志片段。 |


PowerShell 中路径加引号，必要时用 `-LiteralPath`：

```powershell
Get-Content -LiteralPath "C:\Logs\app log.txt"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Content -LiteralPath "C:\Logs\app log.txt"</code> | 执行 `get-content` 相关命令，后面的参数决定它具体操作什么对象。 |


### PowerShell 管道结果不是我想的文本

先看对象：

```powershell
Get-Process | Get-Member
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124; Get-Member</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


选择字段：

```powershell
Get-Process | Select-Object Name, Id, CPU
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124; Select-Object Name, Id, CPU</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


需要变成文本时：

```powershell
Get-Process | Out-String
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get-Process &#124; Out-String</code> | 执行 `get-process` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


### 中文乱码

PowerShell 写文件：

```powershell
Set-Content -Path report.md -Value $Lines -Encoding UTF8
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Set-Content -Path report.md -Value $Lines -Encoding UTF8</code> | 执行 `set-content` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


Bash 环境检查：

```bash
locale
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>locale</code> | 执行 `locale` 相关命令，后面的参数决定它具体操作什么对象。 |


确保终端和文件使用 UTF-8。

### 管道失败但脚本还继续

Bash 使用：

```bash
set -euo pipefail
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |


并对允许失败的命令显式写：

```bash
grep ERROR app.log || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grep ERROR app.log &#124;&#124; true</code> | 执行 `grep` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


PowerShell 使用：

```powershell
$ErrorActionPreference = "Stop"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$ErrorActionPreference = "Stop"</code> | 执行 `$erroractionpreference` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


对外部命令要检查 `$LASTEXITCODE`。

### `curl` 在 PowerShell 表现奇怪

Windows PowerShell 中，`curl` 可能是 `Invoke-WebRequest` 的别名。脚本里要明确：

```powershell
Invoke-WebRequest -Uri "localhost:8000/health"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Invoke-WebRequest -Uri "localhost:8000/health"</code> | PowerShell 发起 Web 请求，用来验证页面、接口或下载文件。 |


如果你要调用真正的 curl：

```powershell
curl.exe localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl.exe localhost:8000/health</code> | 执行 `curl.exe` 相关命令，后面的参数决定它具体操作什么对象。 |


## 典型故障排查表

| 现象 | 常见原因 | 检查命令 | 处理 |
|---|---|---|---|
| Bash 脚本 Permission denied | 没执行权限 | `ls -l script.sh` | `chmod +x script.sh` |
| Bash 变量为空导致危险路径 | 未定义变量 | `set -u`、打印变量 | 检查变量和默认值 |
| PowerShell 脚本被阻止 | 执行策略 | `Get-ExecutionPolicy` | 设置 CurrentUser 或按组织策略处理 |
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

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `scripts/local-health-check.sh`
- `scripts/local-health-check.ps1`
- `docs/learning-records/local-health-check-linux.md`
- `docs/learning-records/local-health-check-windows.md`
- 一篇笔记：`Bash 文本管道和 PowerShell 对象管道的区别.md`
- 一篇排障记录：`PowerShell 执行策略和脚本乱码怎么查.md`

如果你能把“手工敲命令排障”变成“脚本自动采集证据并生成报告”，你就已经迈过了 AIOps 自动化的第一道门。
