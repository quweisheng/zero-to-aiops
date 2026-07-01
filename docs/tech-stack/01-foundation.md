# 01：基础工具技术栈

基础工具是 AIOps 的地基。它们不一定“看起来很 AI”，但你后面的所有实验、项目、文档和排障都靠它们支撑。

## Linux

### 是什么

Linux 是服务器操作系统。大多数线上服务、容器、Kubernetes 节点、监控组件都会运行在 Linux 上。

### 原理

Linux 的核心是内核，负责进程调度、内存管理、文件系统、网络栈、设备驱动和权限控制。用户态工具通过系统调用间接请求内核完成工作。

### 架构

```text
应用进程
  -> C 库/系统调用
  -> Linux Kernel
  -> CPU / 内存 / 磁盘 / 网络设备
```

### 在 AIOps 中的作用

- 生产故障大多最终会落到进程、CPU、内存、磁盘、网络这些基础资源。
- 监控采集的很多指标来自 Linux，例如 load、CPU usage、memory usage、disk IO、network errors。
- 容器隔离依赖 Linux namespaces 和 cgroups。

### 配置重点

- 进程：`ps`、`top`、`pidstat`
- CPU/内存：`top`、`free`、`vmstat`
- 磁盘：`df -h`、`du -sh`、`iostat`
- 网络：`ss`、`ip addr`、`curl`、`dig`
- 日志：`journalctl`、`/var/log/`
- 权限：用户、用户组、文件权限、sudo

### 入门练习

写一篇 `docs/learning-records/linux-first-checklist.md`：

```text
1. 当前机器 CPU、内存、磁盘分别是多少？
2. 找到占用 CPU 最高的进程。
3. 找到监听端口的进程。
4. 查看最近 50 行系统日志。
5. 写出你不懂的 3 个指标。
```

### 官方资料

- [Red Hat: performance monitoring options](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/overview-of-performance-monitoring-options_monitoring-and-managing-system-status-and-performance)
- [Linux cgroup v2 docs](https://docs.kernel.org/admin-guide/cgroup-v2.html)

## systemd

### 是什么

systemd 是 Linux 上常见的系统和服务管理器。它作为 PID 1 启动并管理用户态服务。

### 原理

systemd 通过 unit 管理服务、定时任务、挂载、socket 等对象。服务 unit 通常是 `.service` 文件，描述服务如何启动、停止、重启、依赖谁。

### 架构

```text
systemctl 命令
  -> systemd manager
  -> unit files
  -> service processes
  -> journald logs
```

### 在 AIOps 中的作用

- 你需要知道服务为什么没启动、为什么反复重启。
- Runbook 自动化经常会执行 `systemctl restart xxx`，必须知道风险。
- 服务日志常通过 `journalctl -u 服务名` 排查。

### 配置重点

常见 unit 文件路径：

```text
/etc/systemd/system/
/usr/lib/systemd/system/
```

最小服务配置：

```ini
[Unit]
Description=Demo Service
After=network.target

[Service]
ExecStart=/usr/bin/python /opt/demo/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

常用命令：

```bash
systemctl status demo
systemctl restart demo
systemctl enable demo
journalctl -u demo -n 100
```

### 官方资料

- [systemd homepage](https://systemd.io/)
- [systemd.unit manual](https://www.freedesktop.org/software/systemd/man/systemd.unit.html)

## 网络基础

### 是什么

网络基础包括 IP、端口、DNS、HTTP、TCP、TLS、负载均衡等。AIOps 排障离不开网络链路。

### 原理

请求从客户端发出后，会经历 DNS 解析、TCP 连接、TLS 握手、HTTP 请求、反向代理、后端服务、数据库或中间件等环节。

### 架构

```text
Browser / Client
  -> DNS
  -> Load Balancer / NGINX
  -> Application
  -> Database / Cache / MQ
```

### 在 AIOps 中的作用

- 链路追踪本质上就是把一次请求跨服务的网络路径记录下来。
- 网络错误、连接超时、DNS 故障、TLS 证书过期都是常见告警来源。
- AIOps 做根因线索时经常需要判断是应用问题、依赖问题还是网络问题。

### 配置重点

常用命令：

```bash
curl -v https://example.com
ping example.com
dig example.com
ss -tulnp
traceroute example.com
```

### 入门练习

用 `curl -v` 访问一个网站，记录 DNS、连接、TLS、HTTP 状态码。把输出里看不懂的字段写进学习记录。

## Git

### 是什么

Git 是版本控制系统，用来记录文件变化、创建提交、管理分支和协作。

### 原理

Git 把项目历史记录成一系列快照。文件有三种常见状态：modified、staged、committed。分支本质上是指向某个提交的可移动指针。

### 架构

```text
working tree
  -> git add
staging area
  -> git commit
local repository
  -> git push
remote repository
```

### 在 AIOps 中的作用

- 记录学习过程。
- 保存实验代码和配置。
- 管理 runbook、告警规则、仪表盘配置。
- 面试时展示持续学习和工程习惯。

### 配置重点

```bash
git status
git add .
git commit -m "docs: add learning note"
git log --oneline
git push
```

### 官方资料

- [Git Book: What is Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

## GitHub

### 是什么

GitHub 是代码和文档托管平台。你现在的 `zero-to-aiops` 仓库就是学习资产的公开入口。

### 原理

GitHub 托管远程 Git 仓库，并提供 README、Issue、Pull Request、Actions、Pages 等协作和发布能力。

### 架构

```text
Local Git repo
  -> HTTPS/SSH push
GitHub repository
  -> README / Docs / Issues / Actions / Pages
```

### 在 AIOps 中的作用

- 展示学习路线、项目、复盘。
- 用 GitHub Actions 自动构建文档站。
- 用 Issue 管理学习任务。
- 用 README 让别人快速理解你的项目。

### 配置重点

- `README.md`：项目门面。
- `.github/workflows/`：自动化工作流。
- `docs/`：学习文档。
- Personal Access Token：HTTPS 推送认证。

### 官方资料

- [GitHub README docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [GitHub writing syntax](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

## Markdown

### 是什么

Markdown 是轻量标记语言，用普通文本写标题、列表、链接、表格和代码块。

### 原理

Markdown 文本会被解析器转换成 HTML。它的价值是简单、可读、适合版本控制。

### 架构

```text
README.md / docs/*.md
  -> Markdown parser
  -> HTML page
  -> GitHub / VitePress render
```

### 在 AIOps 中的作用

- 记录学习笔记。
- 写 runbook。
- 写项目 README。
- 写事故复盘和面试故事。

### 配置重点

常用语法：

```md
# 一级标题
## 二级标题
- 列表
[链接](https://example.com)
`命令`
```bash
echo hello
```
```

### 官方资料

- [Markdown Guide: Basic syntax](https://www.markdownguide.org/basic-syntax/)

## VitePress

### 是什么

VitePress 是基于 Vite 和 Vue 的静态文档站生成器，可以把 Markdown 变成文档网站。

### 原理

VitePress 使用文件路由读取 `docs/` 下的 Markdown，构建成静态 HTML、CSS、JS。

### 架构

```text
docs/*.md
  -> VitePress
  -> static site
  -> GitHub Pages
```

### 在 AIOps 中的作用

- 把学习仓库变成可浏览的网站。
- 给别人分享路线和项目。
- 训练自己写结构化技术文档。

### 配置重点

- `docs/.vitepress/config.mts`：站点标题、导航、侧边栏。
- `package.json`：`docs:dev`、`docs:build` 脚本。
- `.github/workflows/docs.yml`：发布到 GitHub Pages。

### 官方资料

- [VitePress](https://vitepress.dev/)
- [VitePress routing](https://vitepress.dev/guide/routing)

## Python

### 是什么

Python 是 AIOps 数据处理、脚本自动化、API 原型和机器学习实验的核心语言。

### 原理

Python 通过解释器运行代码，通过包管理和虚拟环境隔离依赖。AIOps 中常用它读取指标、处理日志、训练异常检测模型、暴露 API。

### 架构

```text
Python code
  -> venv isolated environment
  -> packages: pandas / scikit-learn / FastAPI
  -> scripts / APIs / jobs
```

### 在 AIOps 中的作用

- 解析 CSV、JSON、日志。
- 写告警聚合脚本。
- 做异常检测。
- 写 runbook automation 原型。

### 配置重点

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install pandas scikit-learn fastapi uvicorn
pip freeze > requirements.txt
```

### 官方资料

- [Python venv](https://docs.python.org/3/library/venv.html)

## Shell / PowerShell

### 是什么

Shell 是 Linux 常用命令环境，PowerShell 是 Windows 常用自动化命令环境。

### 原理

它们通过命令、管道、变量、脚本，把多个系统工具串起来。

### 在 AIOps 中的作用

- 快速排障。
- 执行采集命令。
- 做自动化脚本。
- 把手工操作沉淀成 runbook。

### 配置重点

Shell：

```bash
grep ERROR app.log | tail -n 20
df -h
systemctl status nginx
```

PowerShell：

```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
Get-Content .\\app.log -Tail 50
Test-NetConnection github.com -Port 443
```

### 入门练习

写一个脚本，输出当前机器的 CPU、内存、磁盘、网络连通性，并保存到 Markdown 文件。
