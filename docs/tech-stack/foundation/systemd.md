# systemd

> 目标：能理解 systemd 为什么是 Linux 服务管理入口，能读懂 unit、service、target、timer、journal，能写一个最小服务，能用 `systemctl` 和 `journalctl` 排查服务启动失败、反复重启、开机不自启等问题。

## 官方资料

- [systemd official site](https://systemd.io/)
- [systemd upstream man page source: systemd(1)](https://github.com/systemd/systemd/blob/main/man/systemd.xml)
- [systemd upstream man page source: systemd.unit(5)](https://github.com/systemd/systemd/blob/main/man/systemd.unit.xml)
- [systemd upstream man page source: systemd.service(5)](https://github.com/systemd/systemd/blob/main/man/systemd.service.xml)
- [systemd upstream man page source: systemctl(1)](https://github.com/systemd/systemd/blob/main/man/systemctl.xml)
- [systemd upstream man page source: journalctl(1)](https://github.com/systemd/systemd/blob/main/man/journalctl.xml)
- [systemd upstream man page source: systemd.timer(5)](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml)
- [freedesktop.org systemd manual pages](https://www.freedesktop.org/software/systemd/man/)
- [Red Hat: Managing systemd](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/managing-systemd_configuring-basic-system-settings)

说明：本文是基于 systemd 官方站、upstream man page 源文件和发行版管理员文档整理的原创中文教程，不复制官方全文。systemd 的具体版本会随发行版变化，实际参数请以目标机器上的 `man systemd.unit`、`man systemd.service`、`man systemctl`、`man journalctl` 为准。

## 场景开场

凌晨 2 点，告警说 `aiops-api` 不可用。你 SSH 到服务器后看到：

```bash
systemctl status aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status aiops-api</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

输出里写着：

```text
Active: failed (Result: exit-code)
Main PID: 18244 (code=exited, status=1/FAILURE)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Active: failed (Result: exit-code)</code> | `Active` 是Active 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `failed (Result: exit-code)` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>Main PID: 18244 (code=exited, status=1/FAILURE)</code> | `Main` 是主机、服务、告警或资源的示例名称；`code` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`exited` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；`status` 是状态字段，`1/FAILURE)` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

这时候新手容易只做一件事：

```bash
systemctl restart aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl restart aiops-api</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

重启可能让服务暂时恢复，但它没有回答真正的问题：

- 服务为什么退出？
- 是代码异常、配置缺失、权限错误，还是依赖没起来？
- 它是否被 systemd 自动重启过很多次？
- 重启服务器后它会不会自动启动？
- 最近一次失败的日志在哪里？
- 这个服务属于哪个 target、哪个 cgroup、哪个用户？

这些问题都在 systemd 的管理范围内。AIOps 不是只会“重启一下试试”，而是要把服务状态、启动策略、退出码、日志证据和自动化恢复串起来。systemd 就是 Linux 单机服务治理的核心入口。

## 一句话人话版

systemd 是 Linux 的系统和服务管理器：它通常作为 PID 1 启动，用 unit 描述系统里的服务、定时任务、挂载点和目标状态，再用 `systemctl` 管状态、用 `journalctl` 查日志、用依赖关系决定启动顺序。

## 学习边界

学 systemd，入门阶段先不要追所有组件。systemd 生态很大，包含 journald、logind、resolved、networkd、timedated、homed、coredump 等多个部分。AIOps 初学者第一阶段只需要掌握：

- `systemd` 作为 PID 1 的角色。
- unit 的概念和常见类型。
- `.service` 文件怎么写、怎么加载、怎么启动。
- `systemctl status/start/stop/restart/reload/enable/disable/daemon-reload` 的含义。
- `[Unit]`、`[Service]`、`[Install]` 三段配置。
- `After`、`Requires`、`Wants` 的区别。
- `Type`、`ExecStart`、`Restart`、`User`、`Environment`、`WorkingDirectory` 的含义。
- `journalctl -u` 如何查服务日志。
- 服务启动失败、反复重启、开机不自启时怎么排查。
- `.timer` 如何替代一部分 cron 场景。

暂时可以先不深挖：

- systemd 源码实现。
- D-Bus API 编程。
- socket activation 的高级用法。
- cgroup v2 的完整资源控制体系。
- transient unit、portable service、credential、generator 的高级机制。
- systemd-networkd、systemd-resolved 的复杂网络配置。

## 官方知识地图

官方资料不是按“新手教程”组织的，而是按 man page 和组件边界组织的。读 systemd 要先知道资料应该怎么分层：

```text
systemd.io
  -> 项目总览：systemd 是什么、包含哪些系统基础组件

systemd(1)
  -> systemd manager 本体
  -> PID 1、user manager、unit、job、transaction、cgroup、unit 路径

systemd.unit(5)
  -> 所有 unit 共享的语法和配置
  -> [Unit]、[Install]
  -> Description、Documentation、Wants、Requires、After、Before、Condition

systemd.service(5)
  -> .service 专属配置
  -> [Service]
  -> Type、ExecStart、ExecReload、ExecStop、Restart、User、Group、WorkingDirectory

systemctl(1)
  -> 管理和观察 systemd manager
  -> status、start、stop、restart、reload、enable、disable、daemon-reload、list-units

journalctl(1)
  -> 查询 systemd journal
  -> -u、-n、-f、--since、--until、-p、-b、-o

systemd.timer(5)
  -> 定时触发 unit
  -> OnCalendar、OnBootSec、OnUnitActiveSec、Persistent

systemd.special(7)
  -> 特殊 target 和 unit 名称
  -> default.target、multi-user.target、graphical.target、rescue.target

systemd.exec(5)
  -> 进程执行环境
  -> Environment、EnvironmentFile、User、Group、WorkingDirectory、StandardOutput

systemd.kill(5)
  -> 停止服务时如何发信号
  -> KillMode、KillSignal、TimeoutStopSec

systemd.resource-control(5)
  -> cgroup 资源控制
  -> CPUWeight、MemoryMax、IOWeight
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemd.io</code> | `systemd.io` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; 项目总览：systemd 是什么、包含哪些系统基础组件</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>systemd(1)</code> | 这一行里的英文要这样读：`systemd` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>  -&gt; systemd manager 本体</code> | 这一行要理解这些英文词：`systemd manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; PID 1、user manager、unit、job、transaction、cgroup、unit 路径</code> | 这一行要理解这些英文词：`PID` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`user manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`job` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`transaction` 是事务；`cgroup` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>systemd.unit(5)</code> | `systemd.unit(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>  -&gt; 所有 unit 共享的语法和配置</code> | 这一行要理解这些英文词：`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; [Unit]、[Install]</code> | 这一行要理解这些英文词：`Unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Install` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; Description、Documentation、Wants、Requires、After、Before、Condition</code> | 这一行要理解这些英文词：`Description` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Documentation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Wants` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Requires` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`After` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Before` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Condition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>systemd.service(5)</code> | `systemd.service(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 14 行 | <code>  -&gt; .service 专属配置</code> | 这一行要理解这些英文词：`service` 是服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; [Service]</code> | 这一行要理解这些英文词：`Service` 是服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>  -&gt; Type、ExecStart、ExecReload、ExecStop、Restart、User、Group、WorkingDirectory</code> | 这一行要理解这些英文词：`Type` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`ExecStart` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`ExecReload` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`ExecStop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Restart` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`User` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Group` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`WorkingDirectory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>systemctl(1)</code> | 这一行里的英文要这样读：`systemctl` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 19 行 | <code>  -&gt; 管理和观察 systemd manager</code> | 这一行要理解这些英文词：`systemd manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; status、start、stop、restart、reload、enable、disable、daemon-reload、list-units</code> | 这一行要理解这些英文词：`status` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`start` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`stop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`restart` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`reload` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`enable` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`disable` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`daemon-reload` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`list-units` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>journalctl(1)</code> | 这一行里的英文要这样读：`journalctl` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 23 行 | <code>  -&gt; 查询 systemd journal</code> | 这一行要理解这些英文词：`systemd journal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>  -&gt; -u、-n、-f、--since、--until、-p、-b、-o</code> | 这一行要理解这些英文词：`u` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`n` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`f` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`since` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`until` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`p` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`b` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`o` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>systemd.timer(5)</code> | `systemd.timer(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 27 行 | <code>  -&gt; 定时触发 unit</code> | 这一行要理解这些英文词：`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; OnCalendar、OnBootSec、OnUnitActiveSec、Persistent</code> | 这一行要理解这些英文词：`OnCalendar` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`OnBootSec` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`OnUnitActiveSec` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Persistent` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>systemd.special(7)</code> | `systemd.special(7)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 31 行 | <code>  -&gt; 特殊 target 和 unit 名称</code> | 这一行要理解这些英文词：`target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; default.target、multi-user.target、graphical.target、rescue.target</code> | 这一行要理解这些英文词：`default.target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`multi-user.target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`graphical.target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`rescue.target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>systemd.exec(5)</code> | `systemd.exec(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 35 行 | <code>  -&gt; 进程执行环境</code> | 这一行表示上一级主题下的子项“进程执行环境”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 36 行 | <code>  -&gt; Environment、EnvironmentFile、User、Group、WorkingDirectory、StandardOutput</code> | 这一行要理解这些英文词：`Environment` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`EnvironmentFile` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`User` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Group` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`WorkingDirectory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`StandardOutput` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>systemd.kill(5)</code> | `systemd.kill(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 39 行 | <code>  -&gt; 停止服务时如何发信号</code> | 这一行表示上一级主题下的子项“停止服务时如何发信号”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 40 行 | <code>  -&gt; KillMode、KillSignal、TimeoutStopSec</code> | 这一行要理解这些英文词：`KillMode` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`KillSignal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`TimeoutStopSec` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>systemd.resource-control(5)</code> | `systemd.resource-control(5)` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 43 行 | <code>  -&gt; cgroup 资源控制</code> | 这一行要理解这些英文词：`cgroup` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>  -&gt; CPUWeight、MemoryMax、IOWeight</code> | 这一行要理解这些英文词：`CPUWeight` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`MemoryMax` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`IOWeight` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

新手真正要学的不是背命令，而是把这张地图连起来：

```text
unit 文件描述期望状态
  -> systemd manager 读取 unit
  -> systemctl 发出启动/停止/查看请求
  -> systemd 生成 job 和 transaction
  -> systemd 按依赖和顺序执行
  -> 服务进程放进该 unit 的 cgroup
  -> stdout/stderr 和系统日志进入 journal
  -> journalctl 查询证据
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>unit 文件描述期望状态</code> | 这一行里的英文要这样读：`unit` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; systemd manager 读取 unit</code> | 这一行要理解这些英文词：`systemd manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; systemctl 发出启动/停止/查看请求</code> | 这一行要理解这些英文词：`systemctl` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; systemd 生成 job 和 transaction</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`job` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`transaction` 是事务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; systemd 按依赖和顺序执行</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 服务进程放进该 unit 的 cgroup</code> | 这一行要理解这些英文词：`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`cgroup` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; stdout/stderr 和系统日志进入 journal</code> | 这一行要理解这些英文词：`stdout` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`stderr` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`journal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; journalctl 查询证据</code> | 这一行要理解这些英文词：`journalctl` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## systemd 在 AIOps 链路中的位置

在 AIOps 里，systemd 处在“单机服务控制面”这一层。

```text
用户请求
  -> NGINX / Ingress
  -> 应用进程
  -> systemd service 管理进程生命周期
  -> journald 收集服务日志
  -> node exporter / process exporter 暴露机器和进程指标
  -> Prometheus 抓指标
  -> Alertmanager 发告警
  -> Runbook / 自动化脚本调用 systemctl 诊断或恢复
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; NGINX / Ingress</code> | 这一行要理解这些英文词：`NGINX` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Ingress` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 应用进程</code> | 这一行表示上一级主题下的子项“应用进程”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; systemd service 管理进程生命周期</code> | 这一行要理解这些英文词：`systemd service` 是service=服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; journald 收集服务日志</code> | 这一行要理解这些英文词：`journald` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; node exporter / process exporter 暴露机器和进程指标</code> | 这一行要理解这些英文词：`node exporter` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`process exporter` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Prometheus 抓指标</code> | 这一行要理解这些英文词：`Prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Alertmanager 发告警</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; Runbook / 自动化脚本调用 systemctl 诊断或恢复</code> | 这一行要理解这些英文词：`Runbook` 是故障处理手册；`systemctl` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

systemd 给 AIOps 提供三类关键信息：

| 信息 | 从哪里看 | AIOps 用法 |
|---|---|---|
| 服务当前状态 | `systemctl status`、`systemctl is-active` | 判断服务是否存活 |
| 启动和失败原因 | `systemctl status`、`journalctl -u` | 定位配置、权限、依赖、退出码问题 |
| 生命周期策略 | `.service` 配置 | 判断是否自动重启、是否开机自启、是否依赖网络 |
| 日志证据 | `journalctl` | 给 RCA、告警聚合、异常检测提供材料 |
| 自动化动作 | `systemctl restart/reload` | Runbook 恢复、变更后 reload |

一个成熟的 AIOps runbook 不应该只写：

```bash
systemctl restart aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl restart aiops-api</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

而应该写：

```bash
systemctl status aiops-api --no-pager
journalctl -u aiops-api -n 200 --no-pager
systemctl show aiops-api -p ActiveState -p SubState -p Result -p NRestarts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status aiops-api --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>journalctl -u aiops-api -n 200 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>systemctl show aiops-api -p ActiveState -p SubState -p Result -p NRestarts</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

先收集证据，再决定是否恢复。

## systemd 是什么

systemd 是 Linux 系统和服务管理器。它通常作为系统启动后的第一个用户态进程运行，也就是 PID 1。

PID 1 有特殊地位：

- 它由内核启动。
- 它负责拉起用户态系统。
- 它负责管理系统服务。
- 它会接收孤儿进程。
- 它参与关机、重启、进入救援模式等流程。

传统上，Linux 发行版使用 SysV init 或 Upstart。systemd 的核心变化是：把系统启动和服务管理从“按脚本顺序执行”升级为“按 unit、依赖、目标状态、并行事务来管理”。

你可以把 systemd 理解成一个常驻的系统控制器：

```text
内核启动
  -> /sbin/init
  -> systemd (PID 1)
  -> 读取 unit
  -> 计算依赖
  -> 启动基础系统
  -> 启动服务
  -> 监督服务进程
  -> 处理失败、重启、停止、日志
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; /sbin/init</code> | 这一行要理解这些英文词：`sbin` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`init` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; systemd (PID 1)</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`PID` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 读取 unit</code> | 这一行要理解这些英文词：`unit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 计算依赖</code> | 这一行表示上一级主题下的子项“计算依赖”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 启动基础系统</code> | 这一行表示上一级主题下的子项“启动基础系统”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>  -&gt; 启动服务</code> | 这一行表示上一级主题下的子项“启动服务”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 8 行 | <code>  -&gt; 监督服务进程</code> | 这一行表示上一级主题下的子项“监督服务进程”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 9 行 | <code>  -&gt; 处理失败、重启、停止、日志</code> | 这一行表示上一级主题下的子项“处理失败、重启、停止、日志”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

它不只是“启动脚本管理器”，还会处理：

- 服务生命周期。
- 依赖关系。
- 并行启动。
- 定时任务。
- socket 激活。
- 挂载点。
- 设备。
- cgroup 进程归属。
- 日志。
- target 模式切换。

## Unit 是什么

unit 是 systemd 管理对象的抽象。

服务、挂载点、定时器、socket、设备、target 都可以是 unit。unit 文件通常是类似 INI 的文本文件，用 section 和 key-value 描述“这个对象应该是什么状态、怎么启动、依赖谁、如何安装到启动目标里”。

常见 unit 类型：

| 类型 | 后缀 | 管什么 | 新手例子 |
|---|---|---|---|
| service | `.service` | 长期运行服务或一次性命令 | `nginx.service`、`ssh.service`、`aiops-api.service` |
| socket | `.socket` | socket 监听和 socket activation | `systemd-journald.socket` |
| target | `.target` | 一组 unit 的同步点或目标状态 | `multi-user.target`、`graphical.target` |
| timer | `.timer` | 定时触发另一个 unit | `logrotate.timer` |
| mount | `.mount` | 文件系统挂载点 | `home.mount` |
| automount | `.automount` | 按需挂载 | 访问路径时自动挂载 |
| path | `.path` | 文件路径变化触发服务 | 文件变化后触发处理脚本 |
| device | `.device` | 内核设备 | 磁盘、网卡等设备 |
| swap | `.swap` | swap 分区或文件 | `dev-zram0.swap` |
| slice | `.slice` | cgroup 资源分组 | `system.slice`、`user.slice` |
| scope | `.scope` | systemd 外部创建的进程组 | 登录会话、容器进程 |

对 AIOps 初学者，优先级是：

```text
.service 最高
  -> 因为业务服务都靠它管理

.target 第二
  -> 因为 enable、自启、启动阶段和 target 有关

.timer 第三
  -> 因为巡检、日报、清理任务可以用 timer 管

.slice / cgroup 第四
  -> 因为资源隔离、进程归属和告警排查会用到
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.service 最高</code> | `.service 最高` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; 因为业务服务都靠它管理</code> | 这一行表示上一级主题下的子项“因为业务服务都靠它管理”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>.target 第二</code> | `.target 第二` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  -&gt; 因为 enable、自启、启动阶段和 target 有关</code> | 这一行要理解这些英文词：`enable` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`target` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>.timer 第三</code> | `.timer 第三` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>  -&gt; 因为巡检、日报、清理任务可以用 timer 管</code> | 这一行要理解这些英文词：`timer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>.slice / cgroup 第四</code> | `.slice / cgroup 第四` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>  -&gt; 因为资源隔离、进程归属和告警排查会用到</code> | 这一行表示上一级主题下的子项“因为资源隔离、进程归属和告警排查会用到”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

## Unit 文件在哪里

systemd 会从多个目录读 unit。不同发行版路径略有差异，但核心原则是：管理员自定义优先于软件包默认配置。

常见系统级 unit 路径：

| 路径 | 作用 | 是否建议手改 |
|---|---|---|
| `/etc/systemd/system/` | 管理员自定义 unit、override、enable 生成的链接 | 可以 |
| `/run/systemd/system/` | 运行时临时 unit，重启后通常消失 | 一般不手改 |
| `/usr/lib/systemd/system/` | 软件包安装的 unit，常见于 RHEL/Fedora | 不建议直接改 |
| `/lib/systemd/system/` | 软件包安装的 unit，常见于 Debian/Ubuntu | 不建议直接改 |

为什么不建议直接改 `/usr/lib/systemd/system` 或 `/lib/systemd/system`？

因为这些文件属于软件包。升级软件包时，它们可能被覆盖。管理员修改应该放在：

```text
/etc/systemd/system/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>/etc/systemd/system/</code> | `/etc/systemd/system/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

或者使用 drop-in override：

```bash
systemctl edit nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl edit nginx.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

它通常会创建类似：

```text
/etc/systemd/system/nginx.service.d/override.conf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>/etc/systemd/system/nginx.service.d/override.conf</code> | `/etc/systemd/system/nginx.service.d/override.conf` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

排查 unit 实际来源：

```bash
systemctl cat nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl cat nginx.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

查看 unit 文件搜索路径：

```bash
systemctl show -p FragmentPath nginx.service
systemctl show -p DropInPaths nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl show -p FragmentPath nginx.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl show -p DropInPaths nginx.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

## systemctl 是什么

`systemctl` 是控制和观察 systemd manager 的命令行工具。

它不是服务本身，也不是配置文件。它是客户端。

```text
你输入 systemctl restart nginx
  -> systemctl 把请求发给 systemd manager
  -> systemd 计算 job 和依赖
  -> systemd 停止旧进程并启动新进程
  -> systemctl 显示结果
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>你输入 systemctl restart nginx</code> | 这一行里的英文要这样读：`systemctl restart nginx` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; systemctl 把请求发给 systemd manager</code> | 这一行要理解这些英文词：`systemctl` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`systemd manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; systemd 计算 job 和依赖</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`job` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; systemd 停止旧进程并启动新进程</code> | 这一行要理解这些英文词：`systemd` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; systemctl 显示结果</code> | 这一行要理解这些英文词：`systemctl` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

常见误区：

| 误区 | 正确认识 |
|---|---|
| `systemctl` 启动了服务 | 实际启动服务的是 systemd manager，`systemctl` 只是发请求 |
| `systemctl enable` 等于立即启动 | `enable` 是设置开机自启，不等于 `start` |
| 修改 unit 后 `restart` 一定生效 | 修改 unit 文件后通常要先 `daemon-reload` |
| `status` 只看 active 就够了 | 还要看 Main PID、Result、exit status、日志片段、Loaded 行 |

## journalctl 是什么

`journalctl` 是查询 systemd journal 的工具。

journald 会收集多种日志：

- systemd 自己的日志。
- service 的 stdout/stderr。
- syslog 兼容日志。
- kernel 日志。
- 带结构化字段的日志。

服务写到标准输出的内容，经常可以通过：

```bash
journalctl -u demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

查到。

这就是为什么 systemd 服务里常见这种模式：

```ini
[Service]
ExecStart=/usr/bin/python3 /opt/demo/app.py
StandardOutput=journal
StandardError=journal
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>ExecStart=/usr/bin/python3 /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/usr/bin/python3 /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>StandardOutput=journal</code> | `StandardOutput` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>StandardError=journal</code> | `StandardError` 这个英文标识可以拆开理解为：错误，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

很多发行版中，`StandardOutput=journal` 是默认行为的一部分，因此应用直接往 stdout/stderr 写日志，也能被 journal 收到。实际行为以目标系统的 `systemd.exec` 文档和默认配置为准。

## systemd 如何启动服务

理解 systemd 启动服务，要抓住四个词：

- unit
- job
- dependency
- transaction

当你执行：

```bash
systemctl start aiops-api.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl start aiops-api.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

大致流程是：

```text
1. systemctl 向 systemd manager 请求启动 aiops-api.service
2. systemd 读取或加载 aiops-api.service
3. systemd 根据 Wants/Requires/After/Before 计算相关 unit
4. systemd 生成 start job
5. systemd 把多个 job 合成 transaction
6. systemd 检查依赖和排序是否冲突
7. systemd 执行 job
8. systemd fork/exec 服务进程
9. systemd 把进程放进该 unit 的 cgroup
10. systemd 记录状态、退出码、日志
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. systemctl 向 systemd manager 请求启动 aiops-api.service</code> | `1. systemctl 向 systemd manager 请求启动 aiops-api.service` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>2. systemd 读取或加载 aiops-api.service</code> | `2. systemd 读取或加载 aiops-api.service` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>3. systemd 根据 Wants/Requires/After/Before 计算相关 unit</code> | `3. systemd 根据 Wants/Requires/After/Before 计算相关 unit` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>4. systemd 生成 start job</code> | `4. systemd 生成 start job` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>5. systemd 把多个 job 合成 transaction</code> | `5. systemd 把多个 job 合成 transaction` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>6. systemd 检查依赖和排序是否冲突</code> | `6. systemd 检查依赖和排序是否冲突` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>7. systemd 执行 job</code> | `7. systemd 执行 job` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>8. systemd fork/exec 服务进程</code> | `8. systemd fork/exec 服务进程` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>9. systemd 把进程放进该 unit 的 cgroup</code> | `9. systemd 把进程放进该 unit 的 cgroup` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>10. systemd 记录状态、退出码、日志</code> | `10. systemd 记录状态、退出码、日志` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

这解释了两个常见现象：

第一，`After=network.target` 不是“需要网络服务”。它只是排序：如果两个 unit 都要启动，谁先谁后。

第二，`Requires=postgresql.service` 不是“等 PostgreSQL 完全可用”。它是要求 PostgreSQL 这个 unit 也被拉进启动事务，且强依赖失败会影响当前 unit。数据库端口是否真的可连接，仍要应用自己重试，或用更合适的 readiness 机制。

## Unit 状态怎么看

`systemctl status` 里最重要的是这些字段：

```bash
systemctl status nginx.service --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status nginx.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

典型输出结构：

```text
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Thu 2026-07-02 10:20:31 CST; 2h ago
   Main PID: 1234 (nginx)
      Tasks: 5
     Memory: 12.3M
        CPU: 1.2s
     CGroup: /system.slice/nginx.service
             ├─1234 nginx: master process
             └─1235 nginx: worker process
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>● nginx.service - A high performance web server</code> | `● nginx.service - A high performance web server` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)</code> | `Loaded` 是Loaded 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>     Active: active (running) since Thu 2026-07-02 10:20:31 CST; 2h ago</code> | `Active` 是Active 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `active (running) since Thu 2026-07-02 10:20:31 CST; 2h ago` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>   Main PID: 1234 (nginx)</code> | `Main PID` 是Main PID 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `1234 (nginx)` 是这个字段的示例内容或模板表达式。 |
| 第 5 行 | <code>      Tasks: 5</code> | `Tasks` 是Tasks 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `5` 是这个字段的示例内容或模板表达式。 |
| 第 6 行 | <code>     Memory: 12.3M</code> | `Memory` 是Memory 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `12.3M` 是这个字段的示例内容或模板表达式。 |
| 第 7 行 | <code>        CPU: 1.2s</code> | `CPU` 是CPU 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `1.2s` 是这个字段的示例内容或模板表达式。 |
| 第 8 行 | <code>     CGroup: /system.slice/nginx.service</code> | `CGroup` 是CGroup 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `/system.slice/nginx.service` 是这个字段的示例内容或模板表达式。 |
| 第 9 行 | <code>             ├─1234 nginx: master process</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |
| 第 10 行 | <code>             └─1235 nginx: worker process</code> | 树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。 |

逐项解释：

| 字段 | 含义 | 排障时怎么看 |
|---|---|---|
| `Loaded` | unit 是否加载、来自哪个文件、是否 enabled | 看路径是否正确，是否开机自启 |
| `Active` | 当前运行状态 | `active`、`failed`、`inactive`、`activating` 都要区分 |
| `Main PID` | systemd 认为的主进程 | PID 是否存在，进程名是否符合预期 |
| `Tasks` | cgroup 里的任务数 | 是否异常膨胀 |
| `Memory` | 该 unit 的内存统计 | 是否持续增长 |
| `CPU` | 该 unit 累计 CPU | 排查高 CPU 线索 |
| `CGroup` | 该服务进程树 | 看子进程是否还在 |
| 日志片段 | 最近几行日志 | 看第一现场错误 |

只看 `active (running)` 不够。服务可能 active 但业务不可用，例如应用端口没监听、依赖数据库失败、健康检查失败。systemd 只负责进程级生命周期，不等于业务级健康。

## ActiveState、SubState、Result

自动化脚本里，不建议只解析 `systemctl status` 的文本。可以用 `systemctl show` 拿结构化属性：

```bash
systemctl show nginx.service \
  -p LoadState \
  -p ActiveState \
  -p SubState \
  -p Result \
  -p ExecMainStatus \
  -p MainPID \
  -p NRestarts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl show nginx.service \</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>  -p LoadState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -p ActiveState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -p SubState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -p Result \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  -p ExecMainStatus \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  -p MainPID \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  -p NRestarts</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |

常见属性：

| 属性 | 例子 | 含义 |
|---|---|---|
| `LoadState` | `loaded` | unit 文件是否成功加载 |
| `ActiveState` | `active`、`failed`、`inactive` | 高层状态 |
| `SubState` | `running`、`exited`、`dead`、`auto-restart` | 更细状态 |
| `Result` | `success`、`exit-code`、`timeout`、`signal` | 上次结果 |
| `ExecMainStatus` | `0`、`1`、`203` | 主进程退出码或 systemd 特殊状态 |
| `MainPID` | `1234` | 主进程 PID |
| `NRestarts` | `3` | 重启次数 |

AIOps 脚本可以这样判断：

```bash
state=$(systemctl show aiops-api.service -p ActiveState --value)
result=$(systemctl show aiops-api.service -p Result --value)
restarts=$(systemctl show aiops-api.service -p NRestarts --value)

printf 'state=%s result=%s restarts=%s\n' "$state" "$result" "$restarts"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>state=$(systemctl show aiops-api.service -p ActiveState --value)</code> | 执行 `state=$(systemctl` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>result=$(systemctl show aiops-api.service -p Result --value)</code> | 执行 `result=$(systemctl` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>restarts=$(systemctl show aiops-api.service -p NRestarts --value)</code> | 执行 `restarts=$(systemctl` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 5 行 | <code>printf 'state=%s result=%s restarts=%s\n' "$state" "$result" "$restarts"</code> | 执行 `printf` 相关命令，后面的参数决定它具体操作什么对象。 |

这样比 grep `systemctl status` 稳定。

## `.service` 文件结构

一个 service unit 常见三段：

```ini
[Unit]
Description=Demo AIOps Service
Documentation=https://example.com/runbooks/demo
After=network.target
Wants=network-online.target

[Service]
Type=exec
User=demo
Group=demo
WorkingDirectory=/opt/demo
Environment=APP_ENV=prod
EnvironmentFile=-/etc/demo/demo.env
ExecStart=/usr/bin/python3 /opt/demo/app.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Description=Demo AIOps Service</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`Demo AIOps Service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>Documentation=https://example.com/runbooks/demo</code> | `Documentation` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`https://example.com/runbooks/demo` 表示URL 地址，表示页面、接口或文档入口；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>After=network.target</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 5 行 | <code>Wants=network-online.target</code> | `Wants` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 8 行 | <code>Type=exec</code> | `Type` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`exec` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 9 行 | <code>User=demo</code> | `User` 是用户，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 10 行 | <code>Group=demo</code> | `Group` 是分组，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 11 行 | <code>WorkingDirectory=/opt/demo</code> | `WorkingDirectory` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 12 行 | <code>Environment=APP_ENV=prod</code> | `Environment` 是环境名称字段，`APP_ENV=prod` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 13 行 | <code>EnvironmentFile=-/etc/demo/demo.env</code> | `EnvironmentFile` 这个英文标识可以拆开理解为：环境名称字段，`-/etc/demo/demo.env` 表示路径值，表示文件、目录或接口路径；真实环境按自己的路径、账号或服务参数调整。 |
| 第 14 行 | <code>ExecStart=/usr/bin/python3 /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/usr/bin/python3 /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 15 行 | <code>ExecReload=/bin/kill -HUP $MAINPID</code> | `ExecReload` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/bin/kill -HUP $MAINPID` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 16 行 | <code>Restart=on-failure</code> | `Restart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`on-failure` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 17 行 | <code>RestartSec=5s</code> | `RestartSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`5s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |
| 第 19 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 20 行 | <code>WantedBy=multi-user.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`multi-user.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

三段分工：

| 段 | 管什么 | 典型字段 |
|---|---|---|
| `[Unit]` | unit 通用描述、依赖、顺序、条件 | `Description`、`Documentation`、`Wants`、`Requires`、`After`、`Before` |
| `[Service]` | service 专属启动方式、进程环境、重启策略 | `Type`、`ExecStart`、`ExecReload`、`Restart`、`User`、`WorkingDirectory` |
| `[Install]` | enable/disable 时如何安装到 target | `WantedBy`、`RequiredBy`、`Alias` |

注意：`[Install]` 不决定当前手动 `start` 怎么启动，它决定 `systemctl enable` 时创建什么依赖链接。

## `[Unit]` 常用配置

### Description

给人看的描述：

```ini
Description=AIOps Demo API
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Description=AIOps Demo API</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`AIOps Demo API` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

它会出现在：

```bash
systemctl status aiops-api
systemctl list-units
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status aiops-api</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl list-units</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

好描述应该说明服务用途，而不是重复文件名。

不太好：

```ini
Description=aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Description=aiops-api</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`aiops-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

更好：

```ini
Description=AIOps Alert Analysis API
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Description=AIOps Alert Analysis API</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`AIOps Alert Analysis API` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

### Documentation

放文档链接：

```ini
Documentation=https://example.com/runbooks/aiops-api
Documentation=man:systemd.service(5)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Documentation=https://example.com/runbooks/aiops-api</code> | `Documentation` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`https://example.com/runbooks/aiops-api` 表示URL 地址，表示页面、接口或文档入口；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>Documentation=man:systemd.service(5)</code> | `Documentation` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`man:systemd.service(5)` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

排障时 `systemctl status` 会显示它。AIOps 项目可以把 runbook 链接放这里。

### After 和 Before

排序依赖，控制启动顺序。

```ini
After=network.target
Before=multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>After=network.target</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>Before=multi-user.target</code> | `Before` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`multi-user.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

关键点：

- `After=b.service` 表示如果 A 和 B 都要启动，A 在 B 之后启动。
- 它不表示自动启动 B。
- 它不表示 B 必须成功。
- 它和 `Requires`、`Wants` 是不同维度。

常见错误：

```ini
[Unit]
After=postgresql.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>After=postgresql.service</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

新手以为这会自动启动 PostgreSQL。不会。它只声明顺序。若要拉起 PostgreSQL，通常还要：

```ini
Requires=postgresql.service
After=postgresql.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Requires=postgresql.service</code> | `Requires` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>After=postgresql.service</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

但即使这样，也不代表数据库业务已经 ready。应用仍然应该有连接重试。

### Wants

弱依赖。

```ini
Wants=network-online.target
After=network-online.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Wants=network-online.target</code> | `Wants` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>After=network-online.target</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

含义：

- 当前 unit 启动时，systemd 会尝试一起启动 Wants 里的 unit。
- Wants 里的 unit 启动失败，通常不会导致当前 unit 失败。

适合“希望有，但不是生死依赖”的场景。

### Requires

强依赖。

```ini
Requires=postgresql.service
After=postgresql.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Requires=postgresql.service</code> | `Requires` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>After=postgresql.service</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

含义：

- 当前 unit 启动时，Requires 里的 unit 会被一起启动。
- 如果依赖启动失败，当前启动事务也会受影响。
- 如果依赖被显式停止，当前 unit 可能也会被停止，具体行为还要看依赖关系和场景。

新手常见问题：把所有依赖都写成 `Requires`。这会让服务变脆。很多时候业务应用更应该自己重试依赖，而不是让 systemd 复杂地管理跨服务 readiness。

### Conflicts

负依赖，表示两个 unit 不能同时运行。

```ini
Conflicts=rescue.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Conflicts=rescue.service</code> | `Conflicts` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`rescue.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

常用于系统模式切换，不是业务服务的日常配置。

### Condition

条件不满足时跳过启动。

```ini
ConditionPathExists=/etc/aiops/config.yaml
ConditionUser=!root
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ConditionPathExists=/etc/aiops/config.yaml</code> | `ConditionPathExists` 这个英文标识可以拆开理解为：路径，`/etc/aiops/config.yaml` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>ConditionUser=!root</code> | `ConditionUser` 这个英文标识可以拆开理解为：用户，`!root` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

如果条件不满足，unit 通常不是“失败”，而是被跳过。排障时要注意 `systemctl status` 里的 condition 信息。

适合：

- 配置文件存在才启动。
- 某个路径存在才执行一次性初始化。
- 某些环境才启用服务。

## `[Service]` 常用配置

### Type

`Type` 告诉 systemd：怎样判断服务“启动完成”。

常见值：

| Type | 适合什么 | systemd 怎么判断启动完成 |
|---|---|---|
| `simple` | 默认、长期前台进程 | fork 出进程后基本认为已启动 |
| `exec` | 推荐给多数长期服务 | 成功执行主程序后认为已启动 |
| `forking` | 老式后台化 daemon | 父进程退出后认为已启动 |
| `oneshot` | 一次性任务 | 命令执行结束后完成 |
| `notify` | 应用会主动通知 ready | 收到 `READY=1` 后认为 ready |
| `dbus` | 通过 D-Bus name 表示 ready | 获取指定 bus name 后 ready |
| `idle` | 延后到启动队列空闲时运行 | 少用 |

入门建议：

- Python/Go/Java/Node 这种前台服务，优先考虑 `Type=exec` 或 `Type=simple`。
- 老服务自己 fork 到后台，才考虑 `Type=forking`。
- 初始化脚本、备份脚本、巡检脚本，用 `Type=oneshot`。
- 应用显式支持 `sd_notify`，再用 `Type=notify`。

示例：

```ini
[Service]
Type=exec
ExecStart=/usr/bin/python3 /opt/aiops-api/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Type=exec</code> | `Type` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`exec` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>ExecStart=/usr/bin/python3 /opt/aiops-api/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/usr/bin/python3 /opt/aiops-api/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

### ExecStart

启动命令。

```ini
ExecStart=/usr/bin/python3 /opt/demo/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecStart=/usr/bin/python3 /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/usr/bin/python3 /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

重点：

- 推荐写绝对路径。
- 第一段可执行文件路径必须正确。
- 不要想当然依赖登录 shell 的环境变量。
- 复杂 shell 逻辑要显式调用 shell。

错误示例：

```ini
ExecStart=python app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecStart=python app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`python app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

问题：

- `python` 可能不在 systemd 的 PATH 里。
- 工作目录不一定是代码目录。

更稳：

```ini
WorkingDirectory=/opt/demo
ExecStart=/usr/bin/python3 /opt/demo/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WorkingDirectory=/opt/demo</code> | `WorkingDirectory` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>ExecStart=/usr/bin/python3 /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/usr/bin/python3 /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

如果确实要用 shell：

```ini
ExecStart=/bin/bash -lc 'source /opt/demo/.venv/bin/activate && exec python /opt/demo/app.py'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecStart=/bin/bash -lc 'source /opt/demo/.venv/bin/activate &amp;&amp; exec python /opt/demo/app.py'</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/bin/bash -lc 'source /opt/demo/.venv/bin/activate && exec python /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

但生产上更推荐直接指向虚拟环境解释器：

```ini
ExecStart=/opt/demo/.venv/bin/python /opt/demo/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecStart=/opt/demo/.venv/bin/python /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo/.venv/bin/python /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

### ExecReload

reload 命令，通常用于“重新读取配置但不中断服务”。

```ini
ExecReload=/bin/kill -HUP $MAINPID
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecReload=/bin/kill -HUP $MAINPID</code> | `ExecReload` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/bin/kill -HUP $MAINPID` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

能不能 reload 取决于应用是否支持。`systemctl reload nginx` 可行，是因为 NGINX 支持 reload。你的 Python API 如果没实现 reload，写了也没有意义。

### ExecStop

停止命令。

很多长期服务不需要写 `ExecStop`，systemd 会按配置发信号终止进程。只有服务需要特殊停止流程时才写。

```ini
ExecStop=/opt/demo/bin/graceful-stop
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ExecStop=/opt/demo/bin/graceful-stop</code> | `ExecStop` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo/bin/graceful-stop` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

### WorkingDirectory

工作目录。

```ini
WorkingDirectory=/opt/demo
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WorkingDirectory=/opt/demo</code> | `WorkingDirectory` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

如果应用代码里有相对路径：

```python
open("config.yaml")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>open("config.yaml")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

那它依赖当前工作目录。手工启动时你可能在 `/opt/demo`，systemd 启动时不是。解决办法是设置 `WorkingDirectory`，或者应用里使用绝对路径。

### User 和 Group

运行用户和用户组。

```ini
User=demo
Group=demo
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>User=demo</code> | `User` 是用户，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>Group=demo</code> | `Group` 是分组，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

不要让业务服务默认以 root 运行，除非确实需要。使用普通用户能降低风险。

常见权限问题：

- `User=demo` 读不了 `/opt/demo/config.yaml`。
- `User=demo` 写不了 `/var/log/demo/`。
- 绑定 80 端口需要额外能力或前置反向代理。

排查：

```bash
id demo
namei -l /opt/demo/config.yaml
sudo -u demo /opt/demo/.venv/bin/python /opt/demo/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>id demo</code> | 执行 `id` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>namei -l /opt/demo/config.yaml</code> | 执行 `namei` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>sudo -u demo /opt/demo/.venv/bin/python /opt/demo/app.py</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

### Environment

设置环境变量：

```ini
Environment=APP_ENV=prod
Environment=PORT=8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Environment=APP_ENV=prod</code> | `Environment` 是环境名称字段，`APP_ENV=prod` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>Environment=PORT=8000</code> | `Environment` 是环境名称字段，`PORT=8000` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

多个变量：

```ini
Environment=APP_ENV=prod PORT=8000 LOG_LEVEL=info
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Environment=APP_ENV=prod PORT=8000 LOG_LEVEL=info</code> | `Environment` 是环境名称字段，`APP_ENV=prod PORT=8000 LOG_LEVEL=info` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

注意：

- 不要把高敏感密钥直接写进 unit 文件。
- `systemctl show`、日志、备份都可能暴露配置。
- 密钥应使用更合适的 secret 管理方案，或至少使用权限严格的 EnvironmentFile。

### EnvironmentFile

从文件读取环境变量：

```ini
EnvironmentFile=/etc/aiops-api/aiops-api.env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EnvironmentFile=/etc/aiops-api/aiops-api.env</code> | `EnvironmentFile` 这个英文标识可以拆开理解为：环境名称字段，`/etc/aiops-api/aiops-api.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

文件内容：

```bash
APP_ENV=prod
PORT=8000
LOG_LEVEL=info
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>APP_ENV=prod</code> | 执行 `app_env=prod` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>PORT=8000</code> | 执行 `port=8000` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>LOG_LEVEL=info</code> | 执行 `log_level=info` 相关命令，后面的参数决定它具体操作什么对象。 |

加 `-` 表示文件不存在时不报错：

```ini
EnvironmentFile=-/etc/aiops-api/aiops-api.env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EnvironmentFile=-/etc/aiops-api/aiops-api.env</code> | `EnvironmentFile` 这个英文标识可以拆开理解为：环境名称字段，`-/etc/aiops-api/aiops-api.env` 表示路径值，表示文件、目录或接口路径；真实环境按自己的路径、账号或服务参数调整。 |

排查环境变量是否被读取：

```bash
systemctl show aiops-api.service -p Environment
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl show aiops-api.service -p Environment</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

### Restart

失败后是否自动重启。

常见值：

| Restart | 含义 | 适合场景 |
|---|---|---|
| `no` | 不自动重启 | 默认，或一次性任务 |
| `on-success` | 正常退出时重启 | 很少用于业务服务 |
| `on-failure` | 非 0 退出、信号、超时等失败时重启 | 常用 |
| `on-abnormal` | 异常信号或超时时重启 | 特定场景 |
| `on-abort` | 未捕获信号导致终止时重启 | 特定场景 |
| `on-watchdog` | watchdog 超时时重启 | 支持 watchdog 的服务 |
| `always` | 几乎总是重启 | 守护进程可用，但要小心错误循环 |

常用配置：

```ini
Restart=on-failure
RestartSec=5s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Restart=on-failure</code> | `Restart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`on-failure` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>RestartSec=5s</code> | `RestartSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`5s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |

不要无脑 `Restart=always`。如果配置错了，服务会不断失败、重启、失败、重启，造成日志风暴和资源浪费。

### RestartSec

重启前等待时间：

```ini
RestartSec=10s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>RestartSec=10s</code> | `RestartSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`10s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |

如果服务依赖数据库或网络，短延迟可能让服务不断撞墙。合理设置重试间隔有助于降低雪崩。

### StartLimitIntervalSec 和 StartLimitBurst

限制一定时间内最多重启多少次。

```ini
[Unit]
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Restart=on-failure
RestartSec=5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>StartLimitIntervalSec=60</code> | `StartLimitIntervalSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`60` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>StartLimitBurst=5</code> | `StartLimitBurst` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`5` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 5 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 6 行 | <code>Restart=on-failure</code> | `Restart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`on-failure` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>RestartSec=5</code> | `RestartSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`5` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

含义：60 秒内最多尝试 5 次。超过后 systemd 不再继续重启，服务进入 failed。

排查时看到：

```text
Start request repeated too quickly.
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Start request repeated too quickly.</code> | `Start request repeated too quickly.` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

就要想到 start limit。

### TimeoutStartSec 和 TimeoutStopSec

启动或停止超时时间：

```ini
TimeoutStartSec=30s
TimeoutStopSec=30s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>TimeoutStartSec=30s</code> | `TimeoutStartSec` 这个英文标识可以拆开理解为：超时时间字段，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>TimeoutStopSec=30s</code> | `TimeoutStopSec` 这个英文标识可以拆开理解为：超时时间字段，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |

如果服务启动慢，可能被 systemd 判定超时。要么优化启动，要么合理调大超时。

### StandardOutput 和 StandardError

控制 stdout/stderr 去哪里。

```ini
StandardOutput=journal
StandardError=journal
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>StandardOutput=journal</code> | `StandardOutput` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>StandardError=journal</code> | `StandardError` 这个英文标识可以拆开理解为：错误，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

服务日志进入 journal 后，可以用：

```bash
journalctl -u aiops-api.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

查看。

### KillSignal 和 KillMode

控制停止服务时怎么发信号。

常见默认是发送 `SIGTERM`，超时后再更强制地结束。

如果应用需要优雅退出，要保证它能处理 `SIGTERM`：

```python
import signal
import sys

def handle_term(signum, frame):
    print("shutting down")
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_term)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import signal</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import sys</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>def handle_term(signum, frame):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 5 行 | <code>    print("shutting down")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 6 行 | <code>    sys.exit(0)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>signal.signal(signal.SIGTERM, handle_term)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

服务停止慢时，看：

```bash
journalctl -u aiops-api.service -n 100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -n 100</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

并检查：

```ini
TimeoutStopSec=30s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>TimeoutStopSec=30s</code> | `TimeoutStopSec` 这个英文标识可以拆开理解为：超时时间字段，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |

## `[Install]` 常用配置

`[Install]` 决定 `systemctl enable` 时创建什么关系。

最常见：

```ini
[Install]
WantedBy=multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>WantedBy=multi-user.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`multi-user.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

执行：

```bash
systemctl enable aiops-api.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl enable aiops-api.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

systemd 会创建类似链接：

```text
/etc/systemd/system/multi-user.target.wants/aiops-api.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>/etc/systemd/system/multi-user.target.wants/aiops-api.service</code> | `/etc/systemd/system/multi-user.target.wants/aiops-api.service` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

含义：当系统进入 `multi-user.target` 时，希望启动这个服务。

注意区分：

| 命令 | 做什么 |
|---|---|
| `systemctl start demo` | 现在启动 |
| `systemctl stop demo` | 现在停止 |
| `systemctl enable demo` | 设置开机自启 |
| `systemctl disable demo` | 取消开机自启 |
| `systemctl enable --now demo` | 设置开机自启并立即启动 |
| `systemctl disable --now demo` | 取消开机自启并立即停止 |

这就是新手常犯的错：

```bash
systemctl enable demo
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl enable demo</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

然后发现服务没起来。因为 `enable` 不等于 `start`。

## Target 是什么

target 是一组 unit 的集合，也可以理解成系统要达到的一个“目标状态”。

常见 target：

| target | 含义 |
|---|---|
| `default.target` | 默认启动目标，通常链接到 graphical 或 multi-user |
| `multi-user.target` | 多用户命令行系统，服务器常用 |
| `graphical.target` | 图形界面系统 |
| `rescue.target` | 救援模式 |
| `emergency.target` | 更底层的紧急模式 |
| `network.target` | 网络管理栈启动到某个阶段 |
| `network-online.target` | 网络被认为 online，具体取决于发行版和等待服务 |

查看默认 target：

```bash
systemctl get-default
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl get-default</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

设置默认 target：

```bash
sudo systemctl set-default multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl set-default multi-user.target</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

查看 target 依赖：

```bash
systemctl list-dependencies multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-dependencies multi-user.target</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

业务服务常用：

```ini
[Install]
WantedBy=multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>WantedBy=multi-user.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`multi-user.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

意思是：服务器进入多用户正常运行状态时，把这个服务拉起来。

## 依赖和顺序怎么理解

systemd 里最容易混的是：

- `Wants`
- `Requires`
- `After`
- `Before`

一句话：

```text
Wants / Requires 管“要不要一起拉进来”
After / Before 管“谁先谁后”
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Wants / Requires 管“要不要一起拉进来”</code> | `Wants / Requires 管“要不要一起拉进来”` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>After / Before 管“谁先谁后”</code> | `After / Before 管“谁先谁后”` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

例子：

```ini
[Unit]
Wants=network-online.target
After=network-online.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Wants=network-online.target</code> | `Wants` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>After=network-online.target</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

解释：

- `Wants=network-online.target`：启动本服务时，也尝试启动 `network-online.target`。
- `After=network-online.target`：如果两者都启动，本服务排在它后面。

如果只写：

```ini
After=network-online.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>After=network-online.target</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

并不保证 `network-online.target` 会被启动。

如果只写：

```ini
Wants=network-online.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Wants=network-online.target</code> | `Wants` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`network-online.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

它会被拉起，但不保证你的服务等它之后再启动。

如果你需要强依赖：

```ini
Requires=postgresql.service
After=postgresql.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Requires=postgresql.service</code> | `Requires` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 2 行 | <code>After=postgresql.service</code> | `After` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`postgresql.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

但再强调一次：systemd 依赖表示 unit 级关系，不等于业务 readiness。数据库进程 active，不等于 schema 可用；网络 online，不等于外部 API 可访问。

## daemon-reload 是什么

修改 unit 文件后，执行：

```bash
sudo systemctl daemon-reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

它的含义是：让 systemd manager 重新扫描 unit 文件和 drop-in 配置。

什么时候需要：

- 新建 `/etc/systemd/system/demo.service`。
- 修改已有 unit 文件。
- 修改 override drop-in。
- 删除 unit 文件。

什么时候不一定需要：

- 只改应用配置文件，unit 没变。
- 只改应用代码，然后 restart 服务。

常见流程：

```bash
sudo vim /etc/systemd/system/demo.service
sudo systemctl daemon-reload
sudo systemctl restart demo.service
sudo systemctl status demo.service --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo vim /etc/systemd/system/demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>sudo systemctl restart demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>sudo systemctl status demo.service --no-pager</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

如果忘了 `daemon-reload`，可能看到提示：

```text
Warning: The unit file, source configuration file or drop-ins of demo.service changed on disk.
Run 'systemctl daemon-reload' to reload units.
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Warning: The unit file, source configuration file or drop-ins of demo.service changed on disk.</code> | `Warning` 是Warning 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `The unit file, source configuration file or drop-ins of demo.service changed on disk.` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>Run 'systemctl daemon-reload' to reload units.</code> | `Run 'systemctl daemon-reload' to reload units.` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

## enable 和 preset

`enable` 是管理员明确设置开机自启：

```bash
sudo systemctl enable demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl enable demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

`preset` 是发行版或软件包策略：

```bash
systemctl preset demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl preset demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

新手可以先记住：

- 自己管理服务，用 `enable` / `disable`。
- 软件包安装时可能根据 preset 决定默认启用或禁用。
- `systemctl status` 里 `Loaded` 行可能显示 `preset: enabled` 或类似信息。

查看是否 enabled：

```bash
systemctl is-enabled demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl is-enabled demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

可能结果：

| 结果 | 含义 |
|---|---|
| `enabled` | 已设置开机自启 |
| `disabled` | 未设置开机自启 |
| `static` | 没有 `[Install]`，不能直接 enable，通常被其他 unit 依赖拉起 |
| `masked` | 被屏蔽，不能启动 |

## mask 是什么

`mask` 比 `disable` 更强。

```bash
sudo systemctl mask demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl mask demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

它会让这个 unit 指向 `/dev/null`，阻止它被启动，包括被依赖关系拉起。

取消：

```bash
sudo systemctl unmask demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl unmask demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

区别：

| 操作 | 含义 |
|---|---|
| `disable` | 不再开机自启，但仍可手动 start，也可能被依赖拉起 |
| `mask` | 禁止启动，手动 start 也会失败 |

排查服务怎么都起不来时，要看：

```bash
systemctl is-enabled demo.service
systemctl status demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl is-enabled demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl status demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

如果显示 `masked`，先确认为什么被屏蔽，再决定是否 `unmask`。

## journalctl 常用查询

查看某服务全部日志：

```bash
journalctl -u aiops-api.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

最近 100 行：

```bash
journalctl -u aiops-api.service -n 100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -n 100</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

持续跟随：

```bash
journalctl -u aiops-api.service -f
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -f</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

本次启动以来：

```bash
journalctl -u aiops-api.service -b
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -b</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

指定时间：

```bash
journalctl -u aiops-api.service --since "2026-07-02 10:00:00" --until "2026-07-02 11:00:00"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service --since "2026-07-02 10:00:00" --until "2026-07-02 11:00:00"</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

按优先级：

```bash
journalctl -p err -b
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -p err -b</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

显示更详细字段：

```bash
journalctl -u aiops-api.service -o verbose -n 20
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -o verbose -n 20</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

JSON 输出，适合脚本：

```bash
journalctl -u aiops-api.service -o json -n 20
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -o json -n 20</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

不要分页，适合自动化：

```bash
journalctl -u aiops-api.service -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-api.service -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

看内核日志：

```bash
journalctl -k
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -k</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

看上一次启动：

```bash
journalctl -b -1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -b -1</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

查看可用 boot：

```bash
journalctl --list-boots
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl --list-boots</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## journal 持久化

有些系统默认 journal 只保存在运行时目录，重启后旧日志可能没了。检查：

```bash
ls -ld /var/log/journal
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ls -ld /var/log/journal</code> | 列出文件或目录，用来确认实验文件是否存在。 |

如果存在，通常表示持久化日志目录可用。也可以检查 journald 配置：

```bash
grep -E '^#?Storage=' /etc/systemd/journald.conf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>grep -E '^#?Storage=' /etc/systemd/journald.conf</code> | 执行 `grep` 相关命令，后面的参数决定它具体操作什么对象。 |

常见值：

| Storage | 含义 |
|---|---|
| `auto` | 有 `/var/log/journal` 就持久化，否则运行时 |
| `persistent` | 持久化到 `/var/log/journal` |
| `volatile` | 只放运行时目录 |
| `none` | 不保存日志 |

修改 journald 配置后：

```bash
sudo systemctl restart systemd-journald
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl restart systemd-journald</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

AIOps 项目中，日志证据要能跨重启保留，建议确认持久化策略，并配合日志采集器把关键日志送到 Loki、Elasticsearch 或其他日志系统。

## Timer 是什么

`.timer` 是 systemd 的定时触发机制，可以替代一部分 cron 场景。

一个 timer 通常对应一个同名 service：

```text
aiops-healthcheck.timer
  -> 触发
aiops-healthcheck.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-healthcheck.timer</code> | `aiops-healthcheck.timer` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; 触发</code> | 这一行表示上一级主题下的子项“触发”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>aiops-healthcheck.service</code> | `aiops-healthcheck.service` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

service：

```ini
[Unit]
Description=Run AIOps healthcheck

[Service]
Type=oneshot
ExecStart=/opt/aiops/bin/healthcheck.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Description=Run AIOps healthcheck</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`Run AIOps healthcheck` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 5 行 | <code>Type=oneshot</code> | `Type` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`oneshot` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 6 行 | <code>ExecStart=/opt/aiops/bin/healthcheck.sh</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/aiops/bin/healthcheck.sh` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

timer：

```ini
[Unit]
Description=Run AIOps healthcheck every minute

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
Persistent=true

[Install]
WantedBy=timers.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Description=Run AIOps healthcheck every minute</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`Run AIOps healthcheck every minute` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>[Timer]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 5 行 | <code>OnBootSec=1min</code> | `OnBootSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`1min` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 6 行 | <code>OnUnitActiveSec=1min</code> | `OnUnitActiveSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`1min` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>Persistent=true</code> | `Persistent` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`true` 表示开启这个配置；真实环境按自己的路径、账号或服务参数调整。 |
| 第 9 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 10 行 | <code>WantedBy=timers.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`timers.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aiops-healthcheck.timer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl enable --now aiops-healthcheck.timer</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查看 timer：

```bash
systemctl list-timers
systemctl status aiops-healthcheck.timer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-timers</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl status aiops-healthcheck.timer</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

查看被触发的 service 日志：

```bash
journalctl -u aiops-healthcheck.service -n 100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-healthcheck.service -n 100</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

常见 timer 字段：

| 字段 | 含义 |
|---|---|
| `OnBootSec` | 开机后多久触发 |
| `OnUnitActiveSec` | 上次该 unit 激活后多久再次触发 |
| `OnCalendar` | 日历表达式，如每天、每小时 |
| `Persistent` | 错过的触发是否在下次启动补跑 |
| `Unit` | 指定触发哪个 unit，不写时默认同名 service |

例子：

```ini
OnCalendar=*-*-* 02:00:00
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OnCalendar=*-*-* 02:00:00</code> | `OnCalendar` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`*-*-* 02:00:00` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

表示每天 02:00。

## cgroup 和进程归属

systemd 会把服务进程放进对应 unit 的 cgroup。

查看：

```bash
systemctl status nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status nginx.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

你会看到：

```text
CGroup: /system.slice/nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CGroup: /system.slice/nginx.service</code> | `CGroup` 是CGroup 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `/system.slice/nginx.service` 是这个字段的示例内容或模板表达式。 |

这很重要，因为服务可能有多个子进程。只看主 PID 容易漏掉 worker。

查看 cgroup 树：

```bash
systemd-cgls
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemd-cgls</code> | 执行 `systemd-cgls` 相关命令，后面的参数决定它具体操作什么对象。 |

用 `ps` 看 unit 归属：

```bash
ps xawf -eo pid,user,cgroup,args
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ps xawf -eo pid,user,cgroup,args</code> | 查看进程快照，用来确认目标服务或脚本是否正在运行。 |

AIOps 排查资源问题时，cgroup 能回答：

- 哪些进程属于这个服务？
- 子进程是不是还活着？
- 这个服务占了多少内存和 CPU？
- 停止服务后有没有遗留进程？

资源限制入门示例：

```ini
[Service]
MemoryMax=512M
CPUWeight=100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>MemoryMax=512M</code> | `MemoryMax` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`512M` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>CPUWeight=100</code> | `CPUWeight` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`100` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

这部分属于 systemd resource control，入门阶段知道它和 cgroup 相关即可。生产配置要结合业务压测和 SLO。

## 常用命令字典

### 查看系统 manager 状态

```bash
systemctl
systemctl status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl status</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

含义：查看 systemd 管理的 unit 概况或 manager 状态。

什么时候用：

- 初步确认系统是否由 systemd 管理。
- 查看失败 unit 摘要。

### 查看服务状态

```bash
systemctl status demo.service --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status demo.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：显示 unit 状态、加载路径、active 状态、主进程、cgroup、最近日志。

排障重点：

- `Loaded` 路径是否正确。
- 是否 `enabled`。
- `Active` 是 `active`、`failed` 还是 `inactive`。
- `Result` 和 exit status。
- 最近日志第一条错误。

### 启动服务

```bash
sudo systemctl start demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl start demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：立即启动服务。

注意：只影响当前运行状态，不代表开机自启。

### 停止服务

```bash
sudo systemctl stop demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl stop demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：立即停止服务。

注意：如果服务有 socket、timer 或其他依赖，可能之后又被拉起。需要同时检查触发源。

### 重启服务

```bash
sudo systemctl restart demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl restart demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：停止再启动。

什么时候用：

- 应用代码变更后。
- 配置不支持 reload。
- 服务异常需要恢复。

排障建议：重启前先采集 `status` 和 `journalctl`，否则可能丢失第一现场。

### reload 服务

```bash
sudo systemctl reload nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl reload nginx.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：让服务重新加载配置，不完整重启。

前提：service 配了 `ExecReload`，且应用支持 reload。

### reload-or-restart

```bash
sudo systemctl reload-or-restart nginx.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl reload-or-restart nginx.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：能 reload 就 reload，不能 reload 就 restart。

适合自动化变更，但要确认业务影响。

### 设置开机自启

```bash
sudo systemctl enable demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl enable demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：根据 `[Install]` 创建依赖链接。

注意：不立即启动。

### 设置开机自启并立即启动

```bash
sudo systemctl enable --now demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl enable --now demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：enable + start。

适合首次部署服务。

### 取消开机自启

```bash
sudo systemctl disable demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl disable demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：删除 enable 创建的依赖链接。

注意：不立即停止。

### 取消开机自启并立即停止

```bash
sudo systemctl disable --now demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl disable --now demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：disable + stop。

### 重新加载 unit 配置

```bash
sudo systemctl daemon-reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：让 systemd 重新读取 unit 文件。

什么时候必须用：

- 新建 unit。
- 修改 unit。
- 修改 drop-in。
- 删除 unit。

### 查看 unit 文件内容

```bash
systemctl cat demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl cat demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

含义：显示主 unit 文件和 drop-in override。

排障时比直接 `cat /etc/systemd/system/demo.service` 更可靠，因为它能显示最终叠加的配置来源。

### 查看属性

```bash
systemctl show demo.service -p ActiveState -p SubState -p Result -p MainPID
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl show demo.service -p ActiveState -p SubState -p Result -p MainPID</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

含义：输出结构化属性。

适合脚本和 AIOps 自动化。

### 判断是否 active

```bash
systemctl is-active demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl is-active demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

常见输出：

```text
active
inactive
failed
activating
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>active</code> | 这一行里的英文要这样读：`active` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>inactive</code> | 这一行里的英文要这样读：`inactive` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>failed</code> | 这一行里的英文要这样读：`failed` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>activating</code> | 这一行里的英文要这样读：`activating` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

脚本中可用退出码判断。

### 判断是否 enabled

```bash
systemctl is-enabled demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl is-enabled demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

常见输出：

```text
enabled
disabled
static
masked
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>enabled</code> | 这一行里的英文要这样读：`enabled` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>disabled</code> | 这一行里的英文要这样读：`disabled` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>static</code> | 这一行里的英文要这样读：`static` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>masked</code> | 这一行里的英文要这样读：`masked` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

### 列出失败 unit

```bash
systemctl --failed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl --failed</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：查看当前 failed 状态 unit。

适合巡检脚本。

### 重置 failed 状态

```bash
sudo systemctl reset-failed demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl reset-failed demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：清除 failed 标记和相关状态计数。

注意：这不是修复问题，只是清状态。修复前不要用它掩盖证据。

### 查看依赖

```bash
systemctl list-dependencies demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-dependencies demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

反向依赖：

```bash
systemctl list-dependencies --reverse demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-dependencies --reverse demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

排查：

- 为什么服务被启动？
- 停止某个 unit 会影响谁？
- target 拉起了哪些服务？

### 查看 timer

```bash
systemctl list-timers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-timers</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

含义：查看定时器下次触发和上次触发时间。

### 查看日志

```bash
journalctl -u demo.service -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

含义：查看服务最近 100 行日志。

### 跟随日志

```bash
journalctl -u demo.service -f
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service -f</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

含义：类似 `tail -f`。

### 当前启动以来日志

```bash
journalctl -u demo.service -b
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service -b</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

含义：只看本次 boot 的日志。

### 上次启动日志

```bash
journalctl -u demo.service -b -1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service -b -1</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

含义：看上一次 boot 的日志。

适合排查“机器重启前发生了什么”。

## 配置字典

### `[Unit]`

| 配置 | 作用 | 常见误区 |
|---|---|---|
| `Description=` | 人类可读描述 | 写得太泛，排障时看不懂 |
| `Documentation=` | 文档或 runbook 链接 | 不维护链接，实际不可用 |
| `Wants=` | 弱依赖，尝试拉起 | 以为它会保证依赖成功 |
| `Requires=` | 强依赖 | 滥用导致服务脆弱 |
| `After=` | 排序：在某 unit 后启动 | 以为它会自动拉起依赖 |
| `Before=` | 排序：在某 unit 前启动 | 忽略排序和依赖是两回事 |
| `Conflicts=` | 不能共存 | 业务服务少用 |
| `ConditionPathExists=` | 路径存在才启动 | 条件不满足可能是 skipped，不是 failed |
| `StartLimitIntervalSec=` | 限制重启窗口 | 不知道为什么重启一段时间后停了 |
| `StartLimitBurst=` | 限制窗口内次数 | 配太小导致短暂抖动后停服 |

### `[Service]`

| 配置 | 作用 | 常见误区 |
|---|---|---|
| `Type=` | 判断启动完成的方式 | 所有服务都写 `simple` |
| `ExecStart=` | 启动命令 | 用相对路径、依赖 shell 环境 |
| `ExecReload=` | reload 命令 | 应用不支持 reload 却硬写 |
| `ExecStop=` | 停止命令 | 不需要时乱写复杂停止逻辑 |
| `WorkingDirectory=` | 工作目录 | 手工能跑，systemd 跑不了 |
| `User=` | 运行用户 | root 跑通，普通用户权限失败 |
| `Group=` | 运行组 | 文件组权限没配 |
| `Environment=` | 环境变量 | 把敏感密钥写进 unit |
| `EnvironmentFile=` | 环境变量文件 | 文件权限或路径错 |
| `Restart=` | 自动重启策略 | 无脑 `always` 导致重启风暴 |
| `RestartSec=` | 重启间隔 | 太短导致依赖还没恢复就重试 |
| `TimeoutStartSec=` | 启动超时 | 服务慢启动被误杀 |
| `TimeoutStopSec=` | 停止超时 | 优雅退出没完成就被杀 |
| `StandardOutput=` | stdout 输出目标 | 不知道日志去哪了 |
| `StandardError=` | stderr 输出目标 | 错误日志没进入 journal |
| `MemoryMax=` | 内存上限 | 没结合业务压测 |
| `CPUWeight=` | CPU 权重 | 以为是硬限制 |

### `[Install]`

| 配置 | 作用 | 常见误区 |
|---|---|---|
| `WantedBy=` | enable 时加入某 target 的 wants | 以为它影响手动 start |
| `RequiredBy=` | enable 时加入某 target 的 requires | 少用，容易过强 |
| `Alias=` | enable 时创建别名 | 混淆真实 unit 名 |

## AIOps 入门实验

目标：创建一个由 systemd 托管的本地健康检查服务和定时器，理解 service、timer、日志和状态。

### 1. 准备脚本

创建目录：

```bash
sudo mkdir -p /opt/aiops/bin
sudo mkdir -p /var/log/aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo mkdir -p /opt/aiops/bin</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo mkdir -p /var/log/aiops</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

创建脚本 `/opt/aiops/bin/healthcheck.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

target="${AIOPS_HEALTH_URL:-http://127.0.0.1:8000/health}"
timestamp="$(date -Is)"

if curl -fsS --max-time 3 "$target" >/tmp/aiops-healthcheck.out; then
  printf '%s status=ok target=%s\n' "$timestamp" "$target"
else
  code="$?"
  printf '%s status=failed target=%s curl_exit=%s\n' "$timestamp" "$target" "$code" >&2
  exit "$code"
fi
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 4 行 | <code>target="${AIOPS_HEALTH_URL:-http://127.0.0.1:8000/health}"</code> | 执行 `target="${aiops_health_url:-http://127.0.0.1:8000/health}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>timestamp="$(date -Is)"</code> | 执行 `timestamp="$(date` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>if curl -fsS --max-time 3 "$target" &gt;/tmp/aiops-healthcheck.out; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 8 行 | <code>  printf '%s status=ok target=%s\n' "$timestamp" "$target"</code> | 执行 `printf` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>else</code> | 执行 `else` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>  code="$?"</code> | 执行 `code="$?"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>  printf '%s status=failed target=%s curl_exit=%s\n' "$timestamp" "$target" "$code" &gt;&amp;2</code> | 执行 `printf` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>  exit "$code"</code> | 执行 `exit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |

授权：

```bash
sudo chmod +x /opt/aiops/bin/healthcheck.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo chmod +x /opt/aiops/bin/healthcheck.sh</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

手工测试：

```bash
/opt/aiops/bin/healthcheck.sh
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>/opt/aiops/bin/healthcheck.sh</code> | 执行 `/opt/aiops/bin/healthcheck.sh` 相关命令，后面的参数决定它具体操作什么对象。 |

如果本地没有服务在 `127.0.0.1:8000/health`，失败是正常的。你也可以先把环境变量改成一个存在的地址。

### 2. 创建 oneshot service

创建 `/etc/systemd/system/aiops-healthcheck.service`：

```ini
[Unit]
Description=AIOps local healthcheck
Documentation=https://github.com/quweisheng/zero-to-aiops

[Service]
Type=oneshot
Environment=AIOPS_HEALTH_URL=http://127.0.0.1:8000/health
ExecStart=/opt/aiops/bin/healthcheck.sh
StandardOutput=journal
StandardError=journal
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Description=AIOps local healthcheck</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`AIOps local healthcheck` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>Documentation=https://github.com/quweisheng/zero-to-aiops</code> | `Documentation` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`https://github.com/quweisheng/zero-to-aiops` 表示URL 地址，表示页面、接口或文档入口；真实环境按自己的路径、账号或服务参数调整。 |
| 第 5 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 6 行 | <code>Type=oneshot</code> | `Type` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`oneshot` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>Environment=AIOPS_HEALTH_URL=http://127.0.0.1:8000/health</code> | `Environment` 是环境名称字段，`AIOPS_HEALTH_URL=http://127.0.0.1:8000/health` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 8 行 | <code>ExecStart=/opt/aiops/bin/healthcheck.sh</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/aiops/bin/healthcheck.sh` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 9 行 | <code>StandardOutput=journal</code> | `StandardOutput` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 10 行 | <code>StandardError=journal</code> | `StandardError` 这个英文标识可以拆开理解为：错误，`journal` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

加载：

```bash
sudo systemctl daemon-reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

手动运行：

```bash
sudo systemctl start aiops-healthcheck.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl start aiops-healthcheck.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

查看状态：

```bash
systemctl status aiops-healthcheck.service --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status aiops-healthcheck.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查看日志：

```bash
journalctl -u aiops-healthcheck.service -n 50 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-healthcheck.service -n 50 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

观察点：

- `Type=oneshot` 的服务执行完后可能显示 `inactive (dead)`，这不一定是失败。
- 真正要看 `Result` 和退出码。
- 日志里能看到 `status=ok` 或 `status=failed`。

### 3. 创建 timer

创建 `/etc/systemd/system/aiops-healthcheck.timer`：

```ini
[Unit]
Description=Run AIOps local healthcheck every minute

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
Persistent=true
Unit=aiops-healthcheck.service

[Install]
WantedBy=timers.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Unit]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Description=Run AIOps local healthcheck every minute</code> | `Description` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`Run AIOps local healthcheck every minute` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>[Timer]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 5 行 | <code>OnBootSec=1min</code> | `OnBootSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`1min` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 6 行 | <code>OnUnitActiveSec=1min</code> | `OnUnitActiveSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`1min` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>Persistent=true</code> | `Persistent` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`true` 表示开启这个配置；真实环境按自己的路径、账号或服务参数调整。 |
| 第 8 行 | <code>Unit=aiops-healthcheck.service</code> | `Unit` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`aiops-healthcheck.service` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 10 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 11 行 | <code>WantedBy=timers.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`timers.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

加载并启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aiops-healthcheck.timer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl enable --now aiops-healthcheck.timer</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查看 timer：

```bash
systemctl list-timers aiops-healthcheck.timer
systemctl status aiops-healthcheck.timer --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl list-timers aiops-healthcheck.timer</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl status aiops-healthcheck.timer --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查看 service 日志：

```bash
journalctl -u aiops-healthcheck.service -f
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u aiops-healthcheck.service -f</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 |

### 4. 故意制造失败

把 URL 改成不存在的端口：

```ini
Environment=AIOPS_HEALTH_URL=http://127.0.0.1:65530/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Environment=AIOPS_HEALTH_URL=http://127.0.0.1:65530/health</code> | `Environment` 是环境名称字段，`AIOPS_HEALTH_URL=http://127.0.0.1:65530/health` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

然后：

```bash
sudo systemctl daemon-reload
sudo systemctl start aiops-healthcheck.service
journalctl -u aiops-healthcheck.service -n 50 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl start aiops-healthcheck.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>journalctl -u aiops-healthcheck.service -n 50 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

观察：

- `systemctl status` 里 `Result` 是什么？
- `ExecMainStatus` 是什么？
- journal 里 stderr 是否被记录？
- timer 下次是否还会触发？

### 5. 形成学习证据

把下面内容写进你的学习笔记：

```text
服务名：aiops-healthcheck.service
类型：oneshot
触发方式：aiops-healthcheck.timer 每分钟触发
成功证据：journalctl 中出现 status=ok
失败证据：journalctl 中出现 status=failed 和 curl_exit
我理解的 systemd 作用：负责定时触发脚本、记录日志、保存退出结果
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>服务名：aiops-healthcheck.service</code> | `服务名：aiops-healthcheck.service` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>类型：oneshot</code> | 这一行里的英文要这样读：`oneshot` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>触发方式：aiops-healthcheck.timer 每分钟触发</code> | `触发方式：aiops-healthcheck.timer 每分钟触发` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>成功证据：journalctl 中出现 status=ok</code> | `status` 是状态字段，`ok` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 5 行 | <code>失败证据：journalctl 中出现 status=failed 和 curl_exit</code> | `status` 是状态字段，`failed` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 6 行 | <code>我理解的 systemd 作用：负责定时触发脚本、记录日志、保存退出结果</code> | 这一行里的英文要这样读：`systemd` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| `Unit not found` | `systemctl cat name` | 文件名错、没 daemon-reload、路径错 | 放到 `/etc/systemd/system/` 后 `daemon-reload` |
| 修改 unit 不生效 | `systemctl status` warning | 忘了 `daemon-reload` | `systemctl daemon-reload` 后 restart |
| `status=203/EXEC` | `journalctl -u`、`ExecStart` | 可执行文件不存在、无执行权限、路径错 | 用绝对路径，检查 `chmod +x` |
| 手工能跑，systemd 失败 | `WorkingDirectory`、`User`、`Environment` | 工作目录、环境变量、权限不同 | 显式配置工作目录、用户和环境 |
| 服务反复重启 | `NRestarts`、`journalctl` | 程序启动即崩、Restart 策略太激进 | 看第一条错误，不要只重启 |
| `Start request repeated too quickly` | `StartLimitBurst` | 短时间失败太多 | 修根因，必要时调整 start limit |
| 服务开机没起来 | `is-enabled`、`WantedBy` | 没 enable、无 `[Install]`、target 不对 | `enable --now`，检查 target |
| enable 报 no installation config | `[Install]` | unit 没有 Install 段 | 添加 `WantedBy=multi-user.target` 或由其他 unit 拉起 |
| 服务启动卡住 | `TimeoutStartSec`、日志 | 应用初始化慢、依赖不可用 | 增加可观测日志，合理配置超时 |
| stop 卡住 | `TimeoutStopSec`、进程信号处理 | 应用不处理 SIGTERM | 实现优雅退出，检查停止流程 |
| journal 没旧日志 | `/var/log/journal`、journald.conf | journal 未持久化 | 配置持久化或接入日志系统 |
| 服务被禁止启动 | `is-enabled` 显示 masked | 被 mask | 查原因后 `unmask` |
| 依赖没按预期启动 | `list-dependencies` | 混淆 `After` 和 `Wants/Requires` | 同时配置拉起关系和排序关系 |

## 排障流程：服务启动失败

不要一上来就改配置。按顺序收集证据：

```bash
systemctl status demo.service --no-pager
journalctl -u demo.service -n 200 --no-pager
systemctl show demo.service \
  -p LoadState \
  -p ActiveState \
  -p SubState \
  -p Result \
  -p ExecMainCode \
  -p ExecMainStatus \
  -p MainPID \
  -p NRestarts
systemctl cat demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status demo.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>journalctl -u demo.service -n 200 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>systemctl show demo.service \</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 4 行 | <code>  -p LoadState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -p ActiveState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  -p SubState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  -p Result \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  -p ExecMainCode \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>  -p ExecMainStatus \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>  -p MainPID \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>  -p NRestarts</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>systemctl cat demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

然后判断：

1. unit 是否加载成功？
2. unit 文件路径是不是你以为的那个？
3. 是否有 drop-in override 覆盖了配置？
4. `ExecStart` 的可执行文件是否存在？
5. 运行用户是否有权限？
6. 工作目录是否存在？
7. 环境变量是否完整？
8. 依赖是否真的 ready？
9. 应用自己的日志第一条错误是什么？
10. 是否触发 start limit？

常见修复后流程：

```bash
sudo systemctl daemon-reload
sudo systemctl restart demo.service
systemctl status demo.service --no-pager
journalctl -u demo.service -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl daemon-reload</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl restart demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>systemctl status demo.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>journalctl -u demo.service -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## 排障流程：服务反复重启

先看重启次数：

```bash
systemctl show demo.service -p NRestarts -p RestartUSec -p Result
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl show demo.service -p NRestarts -p RestartUSec -p Result</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

看最近日志：

```bash
journalctl -u demo.service -n 300 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service -n 300 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

看 unit：

```bash
systemctl cat demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl cat demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

重点看：

- `Restart=`
- `RestartSec=`
- `StartLimitIntervalSec=`
- `StartLimitBurst=`
- `ExecStart=`
- 应用启动参数。
- 依赖服务状态。

如果日志很多，不要只看最后一屏。反复重启时，最后一屏可能只是“又重启了”。要找第一次失败：

```bash
journalctl -u demo.service --since "30 min ago" --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u demo.service --since "30 min ago" --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

如果服务已经触发限制：

```bash
sudo systemctl reset-failed demo.service
sudo systemctl start demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl reset-failed demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>sudo systemctl start demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

注意：只有修复根因后再 reset。否则只是重新进入失败循环。

## 排障流程：服务开机不自启

检查是否 enabled：

```bash
systemctl is-enabled demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl is-enabled demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

检查 Install 段：

```bash
systemctl cat demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl cat demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |

应该有类似：

```ini
[Install]
WantedBy=multi-user.target
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Install]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>WantedBy=multi-user.target</code> | `WantedBy` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`multi-user.target` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |

启用：

```bash
sudo systemctl enable demo.service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo systemctl enable demo.service</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

查看链接：

```bash
systemctl status demo.service --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status demo.service --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

如果是 `static`：

```text
static
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>static</code> | 这一行里的英文要这样读：`static` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

说明它没有可 enable 的 `[Install]` 配置，通常要由其他 unit 依赖拉起。不要盲目改，先看它设计上是否应该直接开机自启。

## 排障流程：手工启动正常，systemd 启动失败

这是新手最常遇到的问题。

原因通常不是“systemd 坏了”，而是 systemd 的运行环境和你的交互式 shell 不一样：

| 差异 | 手工启动 | systemd 启动 |
|---|---|---|
| PATH | 继承你的 shell | 更精简 |
| 工作目录 | 当前目录 | 默认不是项目目录 |
| 用户 | 当前登录用户 | unit 里指定的 User 或 root |
| 环境变量 | `.bashrc`、`.profile` 可能加载 | 不加载登录 shell 配置 |
| TTY | 有终端 | 无交互终端 |
| 权限 | 你的用户权限 | service 用户权限 |

排查：

```bash
systemctl cat demo.service
systemctl show demo.service -p User -p Group -p WorkingDirectory -p Environment
journalctl -u demo.service -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl cat demo.service</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl show demo.service -p User -p Group -p WorkingDirectory -p Environment</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 3 行 | <code>journalctl -u demo.service -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

模拟 systemd 用户运行：

```bash
sudo -u demo /opt/demo/.venv/bin/python /opt/demo/app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sudo -u demo /opt/demo/.venv/bin/python /opt/demo/app.py</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |

更稳的 unit：

```ini
[Service]
Type=exec
User=demo
Group=demo
WorkingDirectory=/opt/demo
EnvironmentFile=/etc/demo/demo.env
ExecStart=/opt/demo/.venv/bin/python /opt/demo/app.py
Restart=on-failure
RestartSec=5s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Service]</code> | 配置段标题，下面的配置项都属于这一组。 |
| 第 2 行 | <code>Type=exec</code> | `Type` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`exec` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 3 行 | <code>User=demo</code> | `User` 是用户，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 4 行 | <code>Group=demo</code> | `Group` 是分组，`demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 5 行 | <code>WorkingDirectory=/opt/demo</code> | `WorkingDirectory` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 6 行 | <code>EnvironmentFile=/etc/demo/demo.env</code> | `EnvironmentFile` 这个英文标识可以拆开理解为：环境名称字段，`/etc/demo/demo.env` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 7 行 | <code>ExecStart=/opt/demo/.venv/bin/python /opt/demo/app.py</code> | `ExecStart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`/opt/demo/.venv/bin/python /opt/demo/app.py` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 8 行 | <code>Restart=on-failure</code> | `Restart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`on-failure` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境按自己的路径、账号或服务参数调整。 |
| 第 9 行 | <code>RestartSec=5s</code> | `RestartSec` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，`5s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实环境按自己的路径、账号或服务参数调整。 |

## AIOps 自动化脚本示例

下面脚本只采集证据，不自动重启。初学阶段先学“看清楚”，再学“自动恢复”。

```bash
#!/usr/bin/env bash
set -euo pipefail

unit="${1:-aiops-api.service}"

echo "== status =="
systemctl status "$unit" --no-pager || true

echo
echo "== properties =="
systemctl show "$unit" \
  -p LoadState \
  -p ActiveState \
  -p SubState \
  -p Result \
  -p ExecMainStatus \
  -p MainPID \
  -p NRestarts \
  --no-pager

echo
echo "== recent logs =="
journalctl -u "$unit" -n 100 --no-pager || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 4 行 | <code>unit="${1:-aiops-api.service}"</code> | 执行 `unit="${1:-aiops-api.service}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>echo "== status =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 7 行 | <code>systemctl status "$unit" --no-pager &#124;&#124; true</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 10 行 | <code>echo "== properties =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>systemctl show "$unit" \</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 12 行 | <code>  -p LoadState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>  -p ActiveState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>  -p SubState \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>  -p Result \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>  -p ExecMainStatus \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>  -p MainPID \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>  -p NRestarts \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 19 行 | <code>  --no-pager</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 21 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 22 行 | <code>echo "== recent logs =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>journalctl -u "$unit" -n 100 --no-pager &#124;&#124; true</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |

进阶：只有在满足条件时自动重启：

```bash
state="$(systemctl show "$unit" -p ActiveState --value)"
restarts="$(systemctl show "$unit" -p NRestarts --value)"

if [ "$state" = "failed" ] && [ "${restarts:-0}" -lt 3 ]; then
  sudo systemctl restart "$unit"
fi
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>state="$(systemctl show "$unit" -p ActiveState --value)"</code> | 执行 `state="$(systemctl` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>restarts="$(systemctl show "$unit" -p NRestarts --value)"</code> | 执行 `restarts="$(systemctl` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>if [ "$state" = "failed" ] &amp;&amp; [ "${restarts:-0}" -lt 3 ]; then</code> | 执行 `if` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 5 行 | <code>  sudo systemctl restart "$unit"</code> | 执行 `sudo` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>fi</code> | 执行 `fi` 相关命令，后面的参数决定它具体操作什么对象。 |

生产上还要加：

- 变更窗口判断。
- 服务依赖判断。
- 告警抑制。
- 重启前证据保存。
- 重启后健康检查。
- 防止多实例同时自动恢复。

## 面试怎么讲

systemd 是 Linux 的系统和服务管理器，通常作为 PID 1 运行。它用 unit 表示服务、target、timer、mount 等系统对象，用依赖和排序关系组织启动事务。业务服务通常写成 `.service`，由 `[Unit]` 描述依赖和顺序，由 `[Service]` 描述启动命令、运行用户、环境和重启策略，由 `[Install]` 描述 enable 时挂到哪个 target。排障时我会先看 `systemctl status`、`systemctl show` 和 `journalctl -u`，确认 unit 加载路径、ActiveState、Result、退出码、重启次数和最近日志，再判断是路径、权限、环境、依赖、超时还是应用自身异常。

## 小白可能会问

### systemd 和 systemctl 是一回事吗？

不是。systemd 是常驻的系统和服务管理器，`systemctl` 是控制它的命令行客户端。

### 为什么服务明明 active，业务还是不可用？

systemd 主要判断进程生命周期。进程活着不代表业务健康。业务健康还要看端口、HTTP 健康检查、数据库连接、队列消费、错误率等。

### `enable` 为什么没有启动服务？

`enable` 设置开机自启，`start` 才是立即启动。可以用 `enable --now` 同时做两件事。

### `After=network.target` 为什么服务还是连不上网络？

`After` 只是排序，不是强依赖，也不保证外部网络可用。网络 ready 是复杂问题，应用应有重试逻辑。

### 为什么修改 service 文件后没生效？

systemd manager 已经加载了旧配置。修改 unit 后要执行 `systemctl daemon-reload`，然后重启或重新启动对应服务。

### 为什么 `Type=oneshot` 执行完显示 inactive？

一次性任务执行完就退出，显示 inactive 不一定代表失败。要看 `Result` 和退出码。

### 为什么不建议把密码写在 Environment？

unit 文件、`systemctl show`、备份、日志和排障截图都可能泄漏它。生产应使用更安全的 secret 管理方式。

## 学习路线

第一阶段：会看

- `systemctl status`
- `journalctl -u`
- `systemctl show`
- `systemctl cat`
- `systemctl --failed`

第二阶段：会写

- 写最小 `.service`。
- 设置 `WorkingDirectory`、`User`、`EnvironmentFile`。
- 设置 `Restart=on-failure`。
- 设置 `[Install] WantedBy=multi-user.target`。
- 修改后 `daemon-reload`。

第三阶段：会排障

- 识别 `203/EXEC`。
- 区分 `inactive`、`failed`、`activating`。
- 排查权限、路径、环境变量。
- 理解 start limit。
- 查本次和上次启动日志。

第四阶段：接入 AIOps

- 写状态采集脚本。
- 把 journal 日志接入日志系统。
- 把 failed unit 接入巡检。
- runbook 中加入证据采集。
- 自动恢复前做健康检查和重启限制。

## 学习检查清单

- [ ] 我能解释 systemd 为什么通常是 PID 1。
- [ ] 我能说明 unit 是什么。
- [ ] 我能说出 `.service`、`.target`、`.timer` 的区别。
- [ ] 我能解释 `systemctl` 和 systemd 的关系。
- [ ] 我能读懂 `systemctl status` 的 `Loaded`、`Active`、`Main PID`、`CGroup`。
- [ ] 我能用 `systemctl show` 查看 `ActiveState`、`SubState`、`Result`、`NRestarts`。
- [ ] 我能写一个最小 `.service` 文件。
- [ ] 我能解释 `[Unit]`、`[Service]`、`[Install]` 的分工。
- [ ] 我能解释 `Wants`、`Requires`、`After`、`Before` 的区别。
- [ ] 我知道修改 unit 后要执行 `daemon-reload`。
- [ ] 我能解释 `enable` 和 `start` 的区别。
- [ ] 我能用 `journalctl -u` 查服务日志。
- [ ] 我能排查 `203/EXEC`。
- [ ] 我能排查“手工能跑，systemd 跑不了”。
- [ ] 我能写一个 `.timer` 触发 oneshot service。
- [ ] 我能把 systemd 状态采集放进 AIOps runbook。

## 面试题

1. systemd 在 Linux 中负责什么？
2. 为什么说 systemd 通常是 PID 1？
3. unit 是什么？常见 unit 类型有哪些？
4. `.service` 文件的 `[Unit]`、`[Service]`、`[Install]` 分别做什么？
5. `systemctl start` 和 `systemctl enable` 有什么区别？
6. 修改 unit 文件后为什么要执行 `daemon-reload`？
7. `After` 和 `Requires` 有什么区别？
8. `Wants` 和 `Requires` 有什么区别？
9. `Type=simple`、`Type=exec`、`Type=oneshot` 有什么区别？
10. `Restart=on-failure` 和 `Restart=always` 有什么区别？
11. `Start request repeated too quickly` 可能是什么原因？
12. 如何查看某个服务最近 100 行日志？
13. 如何查看某个服务是否开机自启？
14. `masked` 和 `disabled` 有什么区别？
15. 为什么服务手工启动正常，systemd 启动失败？
16. `journalctl -b` 和 `journalctl -b -1` 有什么区别？
17. 如何查看一个服务的 unit 文件和 drop-in override？
18. systemd timer 和 cron 有什么区别？
19. systemd 如何帮助 AIOps 做自动化恢复？
20. 自动化重启服务前应该采集哪些证据？

## 学习证据

完成本篇后，建议在仓库里留下这些证据：

- 一个 `aiops-healthcheck.service` 示例。
- 一个 `aiops-healthcheck.timer` 示例。
- 一份 `systemctl status` 字段解释笔记。
- 一份服务启动失败排障记录，包含 `status`、`show`、`journalctl` 输出摘要。
- 一段 AIOps runbook：如何判断服务 failed，如何采集证据，什么条件下允许 restart。
