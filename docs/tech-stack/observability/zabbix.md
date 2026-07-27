# Zabbix 深讲

> 学习目标：从零理解 Zabbix 的完整监控链路，能独立设计主机、监控项、触发器、动作、模板、自动发现和 Proxy，完成一次可复现的监控与故障注入实验，并能回答大型企业面试中关于高可用、容量、性能、安全、升级和故障排查的追问。

## 版本边界

本文写作时采用以下版本边界：

- 实验版本：Zabbix `7.4.12`。
- 长期维护选择：Zabbix `7.0.28 LTS`。
- `7.4` 是当前标准版本，适合学习当前能力；生产环境如果更重视较长维护周期，应评估 `7.0 LTS`。
- `8.0` 仍属于开发版本，不作为本文生产方案基线。
- Zabbix `7.4` 已不再支持 Oracle 作为 Zabbix 后端数据库。升级前必须核对数据库、PHP、Proxy 和 Agent 的兼容矩阵。

版本号会继续变化。实际安装或升级前，以 [Zabbix release notes](https://www.zabbix.com/release_notes) 和 [生命周期策略](https://www.zabbix.com/life_cycle_and_release_policy) 为准。

## 官方资料

- [Zabbix 7.4 documentation](https://www.zabbix.com/documentation/7.4/en)
- [Installation requirements](https://www.zabbix.com/documentation/7.4/en/manual/installation/requirements)
- [Zabbix concepts and definitions](https://www.zabbix.com/documentation/7.4/en/manual/definitions)
- [Zabbix server](https://www.zabbix.com/documentation/7.4/en/manual/concepts/server)
- [Zabbix proxy](https://www.zabbix.com/documentation/7.4/en/manual/concepts/proxy)
- [Zabbix agent 2](https://www.zabbix.com/documentation/7.4/en/manual/concepts/agent2)
- [Items](https://www.zabbix.com/documentation/7.4/en/manual/config/items)
- [History and trends](https://www.zabbix.com/documentation/7.4/en/manual/config/items/history_and_trends)
- [Triggers](https://www.zabbix.com/documentation/7.4/en/manual/config/triggers)
- [Actions](https://www.zabbix.com/documentation/7.4/en/manual/config/notifications/action)
- [Low-level discovery](https://www.zabbix.com/documentation/7.4/en/manual/discovery/low_level_discovery)
- [Native server high availability](https://www.zabbix.com/documentation/7.4/en/manual/concepts/server/ha)
- [API reference](https://www.zabbix.com/documentation/7.4/en/manual/api/reference)
- [Upgrade procedure](https://www.zabbix.com/documentation/7.4/en/manual/installation/upgrade)
- [Official Zabbix Docker repository](https://github.com/zabbix/zabbix-docker)

本文把官方资料重新组织成面向 AIOps 初学者的学习路径，不替代官方兼容矩阵，也不复制官方文档全文。

## 官方知识地图

```text
Zabbix
  ├── data collection
  │   ├── agent / agent 2
  │   ├── SNMP / JMX / IPMI
  │   ├── HTTP agent / browser item
  │   ├── database monitor / ODBC
  │   └── trapper / sender / log monitoring
  ├── configuration model
  │   ├── host and host group
  │   ├── template and macros
  │   ├── item and preprocessing
  │   ├── trigger and event
  │   └── action and media type
  ├── automation
  │   ├── network discovery
  │   ├── active agent autoregistration
  │   └── low-level discovery
  ├── storage
  │   ├── configuration
  │   ├── history
  │   ├── trends
  │   └── housekeeping
  ├── distributed monitoring
  │   ├── proxy
  │   ├── proxy group
  │   └── server high availability
  └── integration
      ├── API
      ├── webhooks
      ├── scripts
      └── dashboards and reports
```

`SNMP` 是简单网络管理协议，常用于交换机、路由器和存储设备；`JMX` 是 Java 管理扩展，常用于 JVM；`IPMI` 是服务器带外管理接口；`LLD` 是 Low-Level Discovery，即低级别自动发现。

## 场景开场

某公司有 800 台服务器、50 台交换机、20 套数据库和多个机房。业务告警出现时，值班工程师需要马上回答：

- 哪台设备、哪个端口或哪个进程出了问题？
- 是设备真的故障，还是采集链路中断？
- 分支机房断网后，监控数据会不会全部丢失？
- 同一故障引发的 300 条告警，能否合并和抑制？
- 扩容前如何估算数据库每天新增多少历史数据？
- Zabbix Server 自己故障时，监控平台还能不能工作？

只在每台机器上写脚本无法统一配置、留存历史和关联告警。Zabbix 把采集、存储、规则、通知、自动发现和权限管理放进一套系统。

## 一句话人话版

Zabbix 是一个集中式监控平台：它从服务器、网络设备、数据库和应用采集状态，把数据保存起来，按规则判断故障，再把问题通知给正确的人或自动化系统。

## 小白最先会问的 8 个问题

### Zabbix 和监控脚本有什么区别

脚本只完成一个动作，例如读取磁盘使用率。Zabbix 还负责：

- 按周期调度脚本或采集器。
- 记录历史值和趋势值。
- 判断什么时候算故障、什么时候算恢复。
- 去重、分级、维护窗口和通知。
- 用模板批量管理成百上千台设备。
- 通过 API 把数据和事件交给 AIOps 系统。

### Zabbix Agent 是不是必须安装

不是。Linux 和 Windows 主机通常安装 Agent 或 Agent 2，但交换机可使用 SNMP，Java 可使用 JMX，网站可使用 HTTP agent，数据库可使用 ODBC，业务也可以通过 `zabbix_sender` 主动发送数据。

### 监控项和触发器有什么区别

- 监控项负责“拿到数据”，例如 CPU 使用率为 `82`。
- 触发器负责“解释数据”，例如 CPU 连续 5 分钟高于 `80%` 才算问题。

没有监控项就没有原始证据；没有触发器就只有图表，没有故障判断。

### Problem 和 Event 是一回事吗

不是。触发器状态发生变化会产生事件，问题事件和恢复事件共同描述一次故障生命周期。`Problem` 更接近“当前或历史故障记录”，`Event` 是状态变化产生的事件对象。

### Template 为什么重要

Template 是模板。它把监控项、触发器、图形、自动发现规则等复用到多台主机。生产环境不应逐台手工创建相同监控项，否则配置会漂移，也很难审计。

### Proxy 是不是备用 Server

不是。Proxy 负责在远端网络采集和缓存数据，再转发给 Server；它不负责前端展示、全局触发器计算和最终配置管理。Server HA 节点才解决 Server 进程故障切换。

### Zabbix 能不能只保留趋势，不保留原始数据

可以缩短 history 保存期并保留更久的 trends，但要知道：history 是每个原始值，trends 是按小时汇总的最小值、最大值、平均值和数量。短周期故障分析需要 history，长期容量趋势可依赖 trends。

### Zabbix 算不算 AIOps

Zabbix 本身更接近监控和事件平台。它提供 AIOps 所需的指标、事件、标签、拓扑线索和 API；异常检测、根因推断、知识检索和自动修复通常由外部分析或自动化系统完成。

## 为什么 AIOps 工程师要掌握 Zabbix

很多企业同时存在物理机、虚拟机、网络设备、存储、数据库和旧应用。它们不一定提供 Prometheus `/metrics`，却往往支持 SNMP、Agent、JMX 或脚本。Zabbix 在这种混合环境里常作为统一数据入口。

```text
hosts / network / storage / database / middleware
                    |
                    v
agent / SNMP / JMX / HTTP / ODBC / sender
                    |
                    v
             Zabbix Server
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
     history     problems      API
        |           |           |
        +-----------+-----------+
                    |
                    v
 anomaly detection / RCA / runbook automation / knowledge base
```

`RCA` 是 Root Cause Analysis，即根因分析；`runbook` 是可执行或可阅读的标准处置手册。

## 学习边界

本文完整覆盖从入门到生产设计的主线，但不会穷举每一种厂商模板、SNMP OID 或所有前端菜单。读完后，你应能：

- 从零搭建实验环境。
- 解释数据从设备到告警的完整路径。
- 设计模板、监控项、触发器、动作和自动发现。
- 估算容量并排查队列、数据库和采集问题。
- 设计 Server、数据库和 Proxy 的高可用。
- 在面试中说明 Zabbix 与 Prometheus 的取舍。

## 整体架构

```text
monitored host             remote site
  ├── agent 2                ├── agents
  ├── application            ├── SNMP devices
  └── local logs             └── Zabbix Proxy
          |                         |
          +------------+------------+
                       |
                       v
             Zabbix Server cluster
               active / standby
                       |
          +------------+-------------+
          |                          |
          v                          v
   PostgreSQL / MySQL           web frontend
   configuration/history        Nginx + PHP
          |
          v
 history / trends / events / audit
```

### Zabbix Server

**是什么：** Server 是中央进程，负责调度采集、接收数据、执行预处理、计算触发器、生成事件和执行动作。

**为什么需要：** 它把分散的设备状态转换为统一配置、时间序列和问题事件。

**如何工作：** Server 内部有 poller、trapper、preprocessing manager、history syncer、alerter 等不同进程。不同进程分别负责主动轮询、接收数据、预处理、写数据库和发送通知。

**怎么观察：** 查看 Server 日志、队列、内部监控项、进程 busy 百分比和缓存使用率。

**坏了怎么查：** 先区分进程未运行、数据库不可达、某类 worker 饱和、缓存不足还是被监控端不可达。

### Zabbix Agent 与 Agent 2

**是什么：** Agent 是运行在主机上的采集程序。Agent 2 使用 Go 编写，并通过插件扩展数据库、容器和应用采集能力。

**为什么需要：** 它能直接读取操作系统内部信息，例如进程、文件、日志、文件系统和性能计数器。

**如何工作：**

- 被动检查：Server 或 Proxy 连接 Agent 并询问一个 item key。
- 主动检查：Agent 向 Server 或 Proxy 获取监控项列表，随后主动发送数据。

**怎么观察：** 使用 `zabbix_agent2 -t <key>` 本地测试；检查 Agent 日志以及 Server 上的 Latest data。

**坏了怎么查：** 核对 `Hostname`、`Server`、`ServerActive`、DNS、端口 `10050`、TLS 设置和主机名是否完全一致。

### Zabbix Proxy

**是什么：** Proxy 是远端采集和缓冲节点。

**为什么需要：**

- 分支机房只需允许 Proxy 与 Server 通信。
- Server 不必直接跨广域网轮询每台设备。
- 网络中断时，Proxy 可在本地数据库缓存数据。
- 大规模环境可分担采集工作。

**如何工作：** Server 把配置同步给 Proxy，Proxy 采集后把数据上传给 Server。触发器计算和最终事件处理仍主要由 Server 完成。

**怎么观察：** 查看 Proxy last seen、待上传队列、Proxy 日志和 Server 上的 Proxy 数据延迟。

**坏了怎么查：** 先判断是 Proxy 进程、Proxy 本地数据库、Proxy 到 Server 链路，还是 Proxy 到设备链路故障。

### 数据库

**是什么：** PostgreSQL 或 MySQL 等后端数据库保存配置、历史、趋势、事件和审计数据。

**为什么需要：** Zabbix Server 进程可以重启，但监控配置和证据不能随内存丢失。

**如何工作：** Server 缓存配置和数据，批量把 history、trends 与事件写入数据库；前端也从数据库读取配置和展示数据。

**怎么观察：** 关注连接数、事务延迟、慢查询、磁盘延迟、表大小、复制延迟、锁和备份恢复状态。

**坏了怎么查：** 如果数据库不可用，Server 可能继续短暂缓存但无法长期正常工作。先保护数据，确认连接和磁盘，再处理数据库，不要把重启 Server 当作根治。

### Web Frontend

**是什么：** 基于 PHP 的管理与展示界面。

**为什么需要：** 用于配置主机和模板、查询 Latest data、查看 Problems、维护用户权限和仪表盘。

**如何工作：** 浏览器访问前端，前端读写 Zabbix 数据库，并把配置交给 Server 使用。

**怎么观察：** 检查 Web、PHP-FPM、数据库连接和反向代理日志。

**坏了怎么查：** 前端不可访问不等于监控停止。先确认 Server 和采集是否正常，再处理 Nginx、PHP 或负载均衡。

## 配置对象关系

```text
host group
    |
    v
host <------ template
 |              |
 |              +--> items
 |              +--> triggers
 |              +--> discovery rules
 |              +--> graphs / dashboards
 |
 +--> interfaces
 +--> macros
 +--> tags
 +--> inventory
```

### Host、Interface 与 Host Group

`Host` 是被监控对象，可以是一台服务器、一个虚拟设备或一个逻辑服务。`Interface` 是访问它的方式，例如 Agent IP、SNMP IP、JMX 地址或 IPMI 地址。`Host group` 用于分类和权限控制。

常见错误是把“主机显示名称”与 Agent 配置中的 `Hostname` 混淆。Agent 主动检查依赖主机技术名称精确匹配，大小写和空格不一致都可能导致 `host not found`。

### Template

模板是可复用的监控定义。一个 Linux 模板可以包含：

- CPU、内存、磁盘和网络监控项。
- 高 CPU、低磁盘空间等触发器。
- 文件系统和网卡 LLD。
- 图形、仪表盘、值映射和宏。

生产做法是“通用模板 + 业务模板 + 环境宏”：

```text
Template OS Linux
        |
        +--> Template App Order API
                     |
                     v
               host order-api-01
               macro {$LATENCY.WARN}=500
```

这样既复用公共能力，又允许不同业务用宏覆盖阈值。

### Macro

Macro 是宏，即配置变量。常见形式：

- `{$LATENCY.WARN}`：用户宏，用于阈值和环境差异。
- `{HOST.NAME}`：内置宏，运行时替换为主机名。
- `{ITEM.LASTVALUE}`：通知中展示监控项最近值。

密码应使用 secret macro，避免出现在普通页面、导出文件或脚本参数中。宏不是完整密钥管理系统，生产环境仍要控制导出、API、数据库和管理员权限。

## 核心数据模型

### Item：监控项

**是什么：** Item 定义“采什么数据以及如何采”。

**为什么需要：** 每一个图形、触发器和趋势判断都要建立在具体数据上。

**如何工作：** 一个监控项至少包含类型、key、值类型、更新间隔、历史保存期和可选预处理。

**怎么使用或观察：** 在 Latest data 查看最新值、采集时间和错误；用 Agent 测试命令或 `zabbix_get` 验证原始结果。

**坏了怎么查：** 从 item error 入手，检查 key、类型、接口、权限、超时、返回值格式和预处理步骤。

常用字段：

| 字段 | 含义 | 初学者要注意什么 |
|---|---|---|
| Name | 显示名称 | 让人一眼知道对象、指标和单位 |
| Type | 采集方式 | Agent、SNMP、HTTP agent、trapper 等不能混用 |
| Key | 数据唯一标识 | 参数顺序和引号错误会导致 unsupported |
| Type of information | 值类型 | 数字、文本、日志必须与实际返回值一致 |
| Units | 单位 | `ms`、`B`、`%` 会影响展示和换算 |
| Update interval | 采集周期 | 越短数据越细，但采集和存储成本越高 |
| History | 原始值保存期 | 用于近期精确排障 |
| Trends | 小时汇总保存期 | 只适用于数值，用于长期趋势 |
| Timeout | 单次采集超时 | 太短误报，太长会拖住 worker |

### Item Key

Item key 是采集动作的名字和参数，例如：

```text
system.cpu.util[,user]
vfs.fs.size[/,pused]
net.tcp.service[https,api.example.com,443]
log[/var/log/app/error.log,ERROR]
```

- `system.cpu.util` 读取 CPU 使用率，`user` 表示用户态 CPU。
- `vfs.fs.size` 读取文件系统空间，`/` 是根目录，`pused` 是已使用百分比。
- `net.tcp.service` 测试 TCP 服务，示例检查 HTTPS 的 `443` 端口。
- `log` 监控日志文件，示例匹配包含 `ERROR` 的新行。

第一次看到 key 时，先去官方 item key 文档确认返回值、参数顺序、平台限制和权限要求，不要只凭名字猜。

### Master Item、Dependent Item 与预处理

**是什么：** Master item 一次采集一段原始数据；dependent item 从主监控项结果中提取多个字段。预处理负责 JSONPath、正则、倍率、差值、丢弃不变值等转换。

**为什么需要：** 如果一个 HTTP API 返回 30 个指标，不应请求 30 次。请求一次 JSON，再拆成 30 个 dependent items，可以降低网络和服务端压力。

```text
HTTP agent master item
        |
        v
JSON response
  ├── JSONPath $.latency_ms --> dependent item latency
  ├── JSONPath $.error_rate --> dependent item error rate
  └── JSONPath $.queue      --> dependent item queue depth
```

**如何工作：** 主监控项更新后，预处理管理器把结果送给依赖项；每个依赖项按自己的步骤提取或转换。

**怎么观察：** 在预处理测试窗口输入一份真实样本，逐步查看每个步骤的输入和输出。

**坏了怎么查：** 保存失败样本，核对字段是否缺失、JSONPath 是否匹配、返回值是否为合法数字，以及“自定义失败处理”是否把错误悄悄丢弃。

### History 与 Trends

**是什么：**

- History 保存每次采集的原始值。
- Trends 对数值型历史按小时保存最小值、最大值、平均值和样本数量。

**为什么需要：** 每 10 秒采集一年原始值成本很高，而长期容量图通常不需要每个 10 秒点。

**如何工作：** Server 写入原始历史，并生成小时趋势。触发器通常依赖 history；只有趋势不能替代短窗口告警。

**怎么观察：** 查看 Latest data、图形时间范围以及数据库 history/trends 表增长。

**坏了怎么查：**

- 没有近期细节：检查 history 保存期和 housekeeping。
- 长期图为空：检查值类型是否为数值、trends 保存期是否为 `0`。
- 触发器不计算：确认监控项仍有 history 和新值。

一个实用策略是“短 history、长 trends”，例如原始值 7 到 30 天，趋势 365 天。真实值必须由审计、故障复盘和容量需求决定。

### Trigger：触发器

**是什么：** Trigger 是把监控值转换成“正常或问题”的表达式。

**为什么需要：** 单次 CPU `85%` 不一定是故障；持续时间、恢复条件和业务窗口决定告警质量。

**如何工作：** 相关 item 获得新值后，Server 重新计算表达式。`nodata()` 等时间函数也会周期计算。

**怎么使用或观察：** 查看 expression、最近值、Problem event、operational data 和恢复时间。

**坏了怎么查：** 核对 host/key 路径、函数窗口、值类型、是否有新数据、依赖关系、维护窗口和 event generation 模式。

示例：

```text
min(/order-api/aiops.demo.latency,5m)>500
```

含义是：主机 `order-api` 的 `aiops.demo.latency` 在最近 5 分钟内最小值仍大于 `500`。这等价于“整个 5 分钟都高”，比一次瞬时抖动更稳。

可配置单独恢复表达式：

```text
max(/order-api/aiops.demo.latency,5m)<300
```

告警阈值 `500`、恢复阈值 `300` 形成回差，避免数值在 `500` 附近来回抖动。

### Trigger Dependency

依赖关系用于抑制下游噪声。例如交换机断电时，其后 100 台服务器都不可达。如果服务器不可达触发器依赖交换机不可达触发器，Zabbix 可以只把上游故障作为主要问题。

依赖不是根因算法。它依赖人工维护的拓扑关系；如果依赖配置错误，真实问题也可能被抑制。

### Event、Problem 与 Recovery

```text
new value
   |
   v
trigger expression changes to PROBLEM
   |
   v
problem event
   |
   +--> action and notification
   +--> acknowledgement / tags / escalation
   |
new value makes recovery expression true
   |
   v
recovery event and problem closed
```

事件标签，例如 `service=order-api`、`env=prod`、`team=payment`，可用于路由、相关性分析和自动化。标签应采用稳定字典，避免同一环境同时出现 `prod`、`production`、`prd`。

### Action、Condition、Operation 与 Media Type

**是什么：**

- Action：动作规则。
- Condition：什么事件满足规则。
- Operation：满足后执行什么。
- Media type：通过什么渠道发出去，例如邮件、Webhook。

**为什么需要：** 同一个问题需要根据严重度、业务、时间和负责团队走不同处置路径。

**如何工作：** 事件满足 action 条件后，Zabbix 按 operation step 发送消息、执行脚本或升级通知。

**怎么观察：** 查看 action log、event details、用户 media 配置和 webhook 返回结果。

**坏了怎么查：** 按“事件是否生成 -> 条件是否匹配 -> 用户是否有 media -> 时间段是否允许 -> 渠道是否成功”逐层检查。

远程命令和 webhook 能触发自动修复，但权限很高。生产中必须限制允许的命令、服务账号、网络出口和幂等逻辑，并设置人工审批或熔断边界。

### Maintenance

维护窗口告诉系统某段时间正在变更。它可以抑制问题通知，也可以选择是否继续采集数据。

不要把长期故障主机放进永久维护来“消除红色”。维护必须绑定变更单、开始结束时间和负责人，否则监控盲区会被合理化。

## 自动发现

### Network Discovery

Server 或 Proxy 扫描指定 IP 范围，使用 ICMP、SNMP、Agent 或端口检查发现设备，然后通过 discovery action 添加主机、加入组或链接模板。

适合已知网络段的设备发现。风险是扫描范围过大、凭证滥用和误加设备，因此要限制源地址、时间窗口和网络权限。

### Active Agent Autoregistration

新 Agent 主动联系 Server 时携带主机名和 metadata，Server 根据 metadata 自动建主机和链接模板。

适合自动扩缩容主机。必须控制 metadata 规则和 TLS 身份，否则未经授权的 Agent 可能进入监控平台。

### Low-Level Discovery

LLD 自动发现“一台主机内部数量会变化的对象”，例如：

- 文件系统。
- 网卡。
- 磁盘。
- 数据库实例。
- Kubernetes Pod。
- 交换机端口。

```text
discovery rule
     |
     v
LLD JSON rows
     |
     +--> item prototypes
     +--> trigger prototypes
     +--> graph prototypes
     +--> host prototypes
```

LLD 宏例如 `{#FSNAME}` 表示本次发现到的文件系统名。原型会为每个发现对象实例化具体监控项。

常见事故是 LLD 发现了几十万个临时对象，造成数据库和配置缓存膨胀。需要：

- 设置过滤器。
- 控制 discovery interval。
- 配置 lost resource 保留和删除周期。
- 先在测试主机查看发现结果。
- 监控新增 item 数量和 unsupported item。

## 采集方式选择

| 方式 | 适合对象 | 数据方向 | 主要风险 |
|---|---|---|---|
| Agent passive | 固定服务器 | Server/Proxy 主动询问 Agent | 防火墙、并发轮询、Agent 端口暴露 |
| Agent active | NAT、弹性主机 | Agent 主动获取配置并发送 | Hostname 不匹配、ServerActive 错误 |
| SNMP | 网络、存储、UPS | Server/Proxy 轮询或接收 trap | OID、版本、团体字/凭证、counter wrap |
| JMX | Java/JVM | Java gateway 读取 MBean | JVM 权限、RMI 端口、gateway 容量 |
| HTTP agent | REST API、网页 | Server/Proxy 发 HTTP 请求 | token、限流、JSON 结构变化 |
| Database monitor | SQL 指标 | ODBC 查询数据库 | 查询负载、账号权限、连接池 |
| Trapper/sender | 批处理、外部脚本 | 外部系统主动推送 | 时间戳、允许主机、丢包重试 |
| Log item | 文件日志 | Agent 读取新增内容 | 轮转、编码、正则成本、权限 |
| Calculated item | 已有监控项二次计算 | Server 内部计算 | 表达式成本和依赖数据质量 |

选择原则：优先使用官方模板和最小权限接口；只有标准采集无法表达业务指标时再写 UserParameter 或外部脚本。

## 数据从采集到告警的完整路径

```text
1. configuration is stored in database
2. server/proxy synchronizes configuration into cache
3. poller asks target, or agent/sender pushes a value
4. preprocessing validates and transforms the value
5. history cache accepts the value
6. history syncer writes history and trends
7. trigger expression is evaluated
8. a problem event is created
9. action matches event tags and severity
10. alerter or webhook sends the notification
11. a later value satisfies the recovery condition
12. recovery event closes the problem
```

面试排障时不要只说“重启 Agent”。沿这 12 步找最后一个成功点，才能缩小故障范围。

## 状态、一致性与故障边界

Zabbix 不是无状态 Web 应用。关键状态包括：

- 数据库中的配置、历史、趋势、事件和审计。
- Server 与 Proxy 内存中的配置缓存和数据缓存。
- Proxy 本地数据库中的待上传数据。
- Agent 主动检查列表和本地日志读取位置。

### 配置一致性

前端写入数据库后，Server 和 Proxy 按同步周期刷新配置缓存，因此配置不是在每个进程上瞬时同时生效。紧急情况下可以执行配置缓存重载，但频繁手工重载不能替代合理同步和变更流程。

### 数据重复和时间

外部发送数据时要注意时间戳、主机名和 item key。系统时间偏差会让数据落在错误时间点，甚至被判定为过旧。所有组件应使用可靠 NTP/Chrony 时间同步。

### Proxy 缓冲

Proxy 与 Server 断开后会缓存数据，但容量不是无限。估算本地数据库必须考虑：

```text
required rows ≈ monitored items × values per second × outage seconds
```

还要加上每行索引和数据库开销。恢复连接后，大量积压上传会同时压迫 Proxy、网络、Server 和中央数据库。

## 容量与性能规划

### NVPS

`NVPS` 是 New Values Per Second，每秒新增监控值数量，是 Zabbix 容量估算的基础指标。

粗略估算：

```text
NVPS = sum(item count / update interval in seconds)
```

示例：

- 10,000 个监控项每 60 秒采一次：约 `166.7 NVPS`。
- 2,000 个监控项每 10 秒采一次：`200 NVPS`。
- 合计约 `366.7 NVPS`，还未包含 trapper、日志和自动发现。

每天历史行数：

```text
history rows per day = NVPS × 86,400
```

`366.7 NVPS` 每天约产生 3168 万个历史值。磁盘容量不能只用“值本身大小”估算，还要加行头、索引、WAL/binlog、临时空间、备份和副本。

### 需要同时看的瓶颈

| 层 | 关键证据 | 常见修复方向 |
|---|---|---|
| 被监控端 | 响应时间、并发、超时 | 降频、批量接口、依赖项 |
| Poller | busy%、queue | 增加对应 worker、优化慢检查 |
| Preprocessing | manager/worker busy% | 简化正则、批量 JSON、增加 worker |
| Cache | history/config/value cache 使用率 | 调整缓存、减少无效数据 |
| Database | 写延迟、IOPS、锁、表大小 | 分区、索引、存储、参数和保留策略 |
| Proxy | backlog、last seen、磁盘 | 扩容、拆分站点、优化上传 |
| Network | RTT、丢包、带宽 | 本地 Proxy、压缩、链路治理 |
| Frontend | PHP、查询延迟 | 限制大范围查询、扩展前端 |

不能只看到 poller busy 就盲目增加进程。若根因是一个 30 秒 SQL 检查，增加 poller 会把数据库压得更重。

### 高频采集的取舍

采集间隔从 60 秒改成 5 秒，理论数据量增加 12 倍。高频只应给真正需要秒级检测的 SLI；普通容量指标继续用 30 秒或 60 秒，长期趋势用 trends。

`SLI` 是 Service Level Indicator，即服务水平指标，例如成功率和延迟。

## 生产高可用设计

### Server 原生 HA

Zabbix Server 原生 HA 是 active/standby：

- 同一时刻只有一个节点为 active。
- 所有节点连接同一个 Zabbix 数据库。
- standby 节点主要运行 HA manager，不执行完整监控工作。
- 通过 `HANodeName` 设置节点名，通过 `NodeAddress` 公布可访问地址。
- 使用 `zabbix_server -R ha_status` 查看状态。

它解决 Server 进程或节点故障，但不解决共享数据库故障。

### 一套完整生产拓扑

```text
users
  |
  v
load balancer
  |
  +--> web-1
  +--> web-2
          |
          v
PostgreSQL HA cluster
  primary + standby + tested backups
          ^
          |
Zabbix Server HA
  active + standby
          ^
          |
  +-------+--------+
  |                |
proxy group A   proxy group B
site agents     site agents
```

必须分别回答以下问题：

- Server active 节点故障后多久切换？
- 数据库主库故障由谁切换，连接地址如何保持稳定？
- 前端是否无状态，session 如何处理？
- Proxy 到 Server 使用哪个 HA 地址？
- 消息渠道故障时是否重试或切备用渠道？
- 备份是否真正恢复演练过？

“两个 Server + 一个数据库”仍然可能因数据库单点导致全平台不可用。

### Proxy 高可用

Zabbix 7.4 可使用 Proxy group 为主动 Agent 提供 Proxy 负载分配和故障转移。设计时仍要验证具体采集类型、配置同步、缓存和故障转移边界，不能把 Proxy group 理解成任意采集都自动无损迁移。

### 容灾

容灾要定义 `RPO` 与 `RTO`：

- `RPO` 是允许丢失多少时间的数据。
- `RTO` 是允许服务中断多久。

数据库备份、WAL/binlog 归档、异地副本、配置导出和恢复演练共同决定真实 RPO/RTO。只复制虚拟机快照不是完整容灾方案。

## 安全边界

### 网络和 TLS

- Agent、Proxy 与 Server 可使用 PSK 或证书 TLS。
- `10050` 是常见 Agent 监听端口，`10051` 是常见 Server/Proxy trapper 端口。
- 不要把这些端口无条件暴露到互联网。
- Web 前端应使用 HTTPS、反向代理和管理网访问控制。

`PSK` 是 Pre-Shared Key，即预共享密钥。它比明文传输安全，但密钥分发、轮换和泄露处置仍要有流程。

### 账号和权限

- 按团队划分 host group 权限。
- API 使用独立服务账号和短权限 token。
- 管理员账号启用强认证策略。
- 审计模板、宏、动作、脚本和用户变更。
- 生产密码不要写进普通宏、仓库或通知正文。

### 自定义脚本风险

UserParameter、external script、webhook 和 remote command 都可能执行代码。必须：

- 固定脚本路径和参数白名单。
- 不把用户输入直接拼接进 shell。
- 使用最小权限系统账号。
- 设置超时、并发和输出大小限制。
- 对自动修复增加幂等、熔断和回滚。

## 从零搭建实验环境

### 前置条件

- Docker 与 Docker Compose。
- 至少 4 GB 可用内存。
- 本机端口 `8080` 和 `10051` 未被占用。
- 实验目录为空，不保存生产密码。

新建目录：

```powershell
New-Item -ItemType Directory -Force zabbix-lab\agent2.d
Set-Location zabbix-lab
```

创建 `compose.yml`：

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: zabbix-lab-only
      POSTGRES_DB: zabbix
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zabbix -d zabbix"]
      interval: 5s
      timeout: 3s
      retries: 20
    volumes:
      - postgres-data:/var/lib/postgresql/data

  zabbix-server:
    image: zabbix/zabbix-server-pgsql:alpine-7.4.12
    environment:
      DB_SERVER_HOST: postgres
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: zabbix-lab-only
      POSTGRES_DB: zabbix
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "10051:10051"

  zabbix-web:
    image: zabbix/zabbix-web-nginx-pgsql:alpine-7.4.12
    environment:
      DB_SERVER_HOST: postgres
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: zabbix-lab-only
      POSTGRES_DB: zabbix
      ZBX_SERVER_HOST: zabbix-server
      PHP_TZ: Asia/Shanghai
    depends_on:
      postgres:
        condition: service_healthy
      zabbix-server:
        condition: service_started
    ports:
      - "8080:8080"

  zabbix-agent2:
    image: zabbix/zabbix-agent2:alpine-7.4.12
    environment:
      ZBX_HOSTNAME: linux-lab
      ZBX_SERVER_HOST: zabbix-server
      ZBX_SERVER_ACTIVE: zabbix-server
    depends_on:
      zabbix-server:
        condition: service_started
    volumes:
      - ./agent2.d:/etc/zabbix/zabbix_agent2.d:ro

volumes:
  postgres-data:
```

关键字段：

| 字段 | 具体含义 |
|---|---|
| `DB_SERVER_HOST` | Zabbix 组件通过服务名 `postgres` 访问数据库 |
| `ZBX_SERVER_HOST` | Web 或 Agent 使用服务名 `zabbix-server` 找到 Server |
| `ZBX_SERVER_ACTIVE` | Agent 2 主动检查要连接的 Server 地址 |
| `PHP_TZ` | 前端 PHP 使用上海时区显示时间 |
| `postgres-data` | 保存数据库文件，容器重建后数据仍存在 |
| `condition: service_healthy` | 等 PostgreSQL 健康检查通过后再启动依赖服务 |

实验密码只适用于本机。生产环境应使用 secret 管理、限制数据库网络并定期轮换。

创建 `agent2.d/aiops.conf`：

```ini
# 定义自定义监控项：读取容器内文件中的模拟延迟值。
UserParameter=aiops.demo.latency,cat /tmp/aiops-latency-ms
```

先验证 Compose 语法，再启动：

```powershell
docker compose config --quiet
docker compose up -d
docker compose ps
docker compose logs --tail 100 zabbix-server
```

预期结果：

- `postgres` 进入 healthy。
- Server、Web 和 Agent 2 处于 running。
- 浏览器访问 `http://localhost:8080` 能打开登录页。
- 默认实验账号通常为 `Admin`，密码为 `zabbix`；首次登录后立即修改。

如果没有启动成功，优先检查：

1. `docker compose config` 是否报 YAML 或环境变量错误。
2. `8080`、`10051` 是否已被占用。
3. PostgreSQL 是否 healthy。
4. Server 日志是否出现数据库连接或初始化失败。
5. Docker 分配的内存和磁盘是否足够。

## 命令与 API 字典

### Agent 本地测试

```powershell
docker compose exec zabbix-agent2 zabbix_agent2 -t system.hostname
```

- `exec`：在运行中的容器内执行命令。
- `zabbix_agent2`：Agent 2 程序。
- `-t`：测试一个 item key。
- `system.hostname`：读取系统主机名的内置 key。
- 正常结果应包含 key、值类型和实际主机名。

### 查看 Agent 支持的自定义 key

```powershell
docker compose exec zabbix-agent2 sh -c "echo 100 > /tmp/aiops-latency-ms"
docker compose exec zabbix-agent2 zabbix_agent2 -t aiops.demo.latency
```

第一条命令把模拟延迟写成 `100` 毫秒；第二条测试自定义 key。若返回 `ZBX_NOTSUPPORTED`，检查配置文件挂载路径、拼写、文件权限和 Agent 日志。

### Server 运行时命令

```bash
zabbix_server -R config_cache_reload
zabbix_server -R diaginfo
zabbix_server -R ha_status
```

- `config_cache_reload`：要求 Server 立即重载配置缓存。
- `diaginfo`：输出内部诊断信息，用于观察缓存和处理队列。
- `ha_status`：显示 HA 节点及状态。

运行时命令只用于观察或加速变更生效，不应掩盖数据库慢、同步异常等根因。

### zabbix_get

```bash
zabbix_get -s 10.0.0.21 -p 10050 -k system.cpu.load[all,avg1]
```

- `-s`：Agent 地址。
- `-p`：Agent 端口。
- `-k`：要读取的 item key。
- 结果是目标主机最近 1 分钟的平均 CPU load。

如果本地 Agent 测试成功但 `zabbix_get` 失败，重点检查网络、`Server=` 允许列表和 TLS。

### zabbix_sender

```bash
zabbix_sender -z zabbix.example.com -s order-api-01 -k deploy.result -o 1
```

- `-z`：Zabbix Server 或 Proxy 地址。
- `-s`：Zabbix 中已配置的主机技术名称。
- `-k`：trapper 类型监控项的 key。
- `-o`：发送的值，这里 `1` 可代表部署成功。

Sender 适合批处理结果和业务事件，不适合无约束地替代常规采集。发送失败必须重试并记录，否则监控数据会悄悄缺失。

### API 请求结构

```bash
curl --request POST \
  --header "Content-Type: application/json-rpc" \
  --header "Authorization: Bearer REPLACE_WITH_API_TOKEN" \
  --data '{
    "jsonrpc": "2.0",
    "method": "problem.get",
    "params": {
      "output": ["eventid", "name", "severity"],
      "recent": true,
      "sortfield": ["eventid"],
      "sortorder": "DESC",
      "limit": 20
    },
    "id": 1
  }' \
  https://zabbix.example.com/api_jsonrpc.php
```

- `jsonrpc`：协议版本。
- `method`：调用的方法，这里查询问题。
- `params`：查询字段、排序和数量限制。
- `id`：客户端请求标识，便于对应响应。
- `Authorization`：API token，示例占位符不能直接使用。

生产脚本要处理 HTTP 错误、JSON-RPC `error` 字段、分页、超时、重试和 token 轮换。

## 基础实验：从一个数字到一条恢复事件

### 实验目标

监控 `linux-lab` 的模拟接口延迟：

- 正常值为 `100 ms`。
- 超过 `500 ms` 触发问题。
- 低于 `300 ms` 恢复。

### 第 1 步：初始化数据并验证 Agent

```powershell
docker compose exec zabbix-agent2 sh -c "echo 100 > /tmp/aiops-latency-ms"
docker compose exec zabbix-agent2 zabbix_agent2 -t aiops.demo.latency
```

预期能看到数值 `100`，而不是 `ZBX_NOTSUPPORTED`。

### 第 2 步：在前端创建主机

进入 `Data collection -> Hosts`，创建：

- Host name：`linux-lab`。
- Host group：选择或新建 `Linux servers`。
- Agent interface：
  - Connect to：DNS。
  - DNS name：`zabbix-agent2`。
  - Port：`10050`。

这里的 DNS 名是 Compose 内部服务名，不是浏览器访问地址。

### 第 3 步：创建监控项

在 `linux-lab` 的 Items 中创建：

- Name：`Demo latency`。
- Type：`Zabbix agent`。
- Key：`aiops.demo.latency`。
- Type of information：`Numeric (unsigned)`。
- Units：`ms`。
- Update interval：`5s`。
- History：`1d`。
- Trends：`7d`。

等待 10 到 20 秒，在 Latest data 中应看到 `100 ms`。

### 第 4 步：创建触发器

问题表达式：

```text
last(/linux-lab/aiops.demo.latency)>500
```

恢复表达式：

```text
last(/linux-lab/aiops.demo.latency)<300
```

把 recovery mode 设置为使用恢复表达式。实验为了快速观察使用 `last()`；生产告警通常还要加入持续窗口和最少样本数。

### 第 5 步：验证正常状态

确认：

- Latest data 有持续更新的 `100 ms`。
- 主机可用性正常。
- Problems 页面没有本实验问题。

### 验证方法

基础实验通过的证据不是“页面能打开”，而是：

1. Agent 本地测试返回 `100`。
2. Latest data 中出现相同值和最新时间。
3. 监控项没有 error。
4. 数据间隔接近 5 秒。

### 基础实验清理

完成下一节故障实验后执行：

```powershell
docker compose down -v
```

`-v` 会删除实验数据库卷，所有实验配置和历史都会消失。不要对生产环境执行。

## 故障注入实验：制造高延迟并验证恢复

### 前置条件

- 基础实验已通过。
- Latest data 正在更新。
- 触发器已启用。

### 注入故障

```powershell
docker compose exec zabbix-agent2 sh -c "echo 900 > /tmp/aiops-latency-ms"
```

等待两个采集周期。预期：

- Latest data 变为 `900 ms`。
- Trigger 状态变为 PROBLEM。
- Problems 页面出现高延迟问题。
- Event details 能看到触发时的值和时间。

### 恢复

```powershell
docker compose exec zabbix-agent2 sh -c "echo 100 > /tmp/aiops-latency-ms"
```

预期：

- Latest data 回到 `100 ms`。
- 恢复表达式成立。
- 问题被关闭并生成恢复时间。

### 故障实验要保存的证据

- Agent 测试输出。
- Latest data 正常值截图。
- Problem event 截图。
- Recovery event 截图。
- 触发器表达式和恢复表达式。
- 一段说明：发现用了多久、通知用了多久、是否有误报。

### 如果实验没有成功，先查这些

1. Latest data 没有 `900`：先查 Agent key、接口、主机可用性。
2. Latest data 有 `900` 但不告警：查触发器路径、启用状态和表达式。
3. 告警出现但不恢复：查 recovery mode 和恢复表达式。
4. 状态变化很慢：查 update interval、Server queue 和配置缓存。
5. 页面没有数据但 Agent 测试正常：查容器 DNS 和 `Server=` 允许地址。

## 监控 Zabbix 自己

监控平台失明比普通业务告警更危险。至少监控：

- Server、Proxy、Agent 进程是否运行。
- Zabbix queue 中超时监控项数量和延迟。
- Poller、trapper、preprocessing worker、history syncer busy 百分比。
- Configuration cache、history cache、value cache 使用率。
- Unsupported items 数量。
- Proxy last seen 和待上传数据。
- 数据库连接、写延迟、磁盘空间、WAL/binlog 和复制延迟。
- 前端 HTTP 可用性和登录链路。
- 通知渠道成功率与延迟。
- NTP 时间偏差。

内部指标持续接近 `100% busy` 说明容量余量不足，但要结合队列和下游延迟判断。单个瞬时尖峰不等于必须扩容。

## 常见故障与证据链

### 监控项显示 Not supported

排查顺序：

1. 打开 item error，读取具体错误。
2. 在 Agent 本地执行 `zabbix_agent2 -t <key>`。
3. 核对值类型与返回内容。
4. 测试每一个预处理步骤。
5. 检查脚本权限、超时和依赖命令。

不要用“discard value”把未知错误全部吞掉，否则仪表盘看似正常，实际没有数据。

### Agent 显示不可用

证据链：

- Server/Proxy 到 `10050` 是否可达。
- `Server=` 是否允许实际来源地址。
- Zabbix host interface 是否填对 IP/DNS。
- TLS 模式、PSK identity 和密钥是否一致。
- Agent 日志是否收到拒绝连接。

### Active check 报 host not found

重点核对 Agent `Hostname` 与 Zabbix Host name 是否逐字符一致。Display name 不参与匹配。

### 有数据但触发器不触发

- 表达式引用的 host 和 key 是否正确。
- 值类型是否允许该函数。
- 窗口中是否有足够新值。
- 触发器是否 disabled。
- 是否被 dependency 或 maintenance 影响。
- event generation 是否允许多问题或单问题。

### Queue 持续升高

先按 item type、Proxy、延迟区间拆分 queue，再检查对应 worker busy。可能原因：

- 目标响应慢或不可达。
- Poller 数不足。
- SNMP 批量配置不当。
- 数据库监控 SQL 太慢。
- 网络丢包或 DNS 慢。
- Proxy 积压回传。

只增加 poller 可能造成更高并发，把目标系统压垮。

### Proxy 数据延迟

分别测：

- Proxy 到被监控端。
- Proxy 本地数据库。
- Proxy 到 Server。
- Server 数据接收和数据库写入。

如果广域网刚恢复，积压数据回放可能与实时数据争抢资源。应限制爆发、准备容量并观察 backlog 下降速度。

### 数据库变慢

先保存：

- 数据库 CPU、内存、磁盘延迟。
- 活跃连接和锁。
- 慢查询。
- history/trends 表与索引大小。
- Zabbix history syncer 和 cache 状态。

再判断是采集量突增、保留期过长、housekeeper、分区、存储故障还是数据库参数问题。不要先删历史表。

### Housekeeper 压力大

Housekeeper 清理过期数据。大量历史一次到期可能产生长事务和 I/O 峰值。大规模环境通常评估数据库分区和按分区淘汰，但必须基于当前 Zabbix 与数据库官方方案设计并测试恢复。

### 告警没有发出去

按下面顺序检查：

```text
problem exists
  -> action condition matched
  -> operation selected user/group
  -> user media enabled for severity and time
  -> media type executed
  -> remote endpoint accepted
```

同时检查维护窗口、抑制、升级步骤、Webhook HTTP 响应和第三方渠道限流。

### 告警风暴

处理顺序：

1. 识别共同上游故障。
2. 临时止损，但保留事件证据。
3. 用依赖关系、标签和 event correlation 减少重复。
4. 调整阈值、窗口和恢复回差。
5. 复盘是否缺少拓扑或维护窗口。

不能简单把所有严重度降级，否则下一次真实故障仍然失控。

### LLD 生成对象过多

暂停对应发现规则，保存发现 JSON，确认过滤条件和生命周期。评估已生成 item 数、history 增长和数据库影响，再分批删除错误对象。

### 前端很慢但采集正常

先确认 Server queue 和 latest data 正常，再看：

- 查询时间范围是否过大。
- 图表是否同时读取大量 history。
- PHP worker 是否耗尽。
- 数据库慢查询和锁。
- 反向代理超时。

前端扩容不能解决底层数据库查询过重。

## 升级与回滚

### 升级前

1. 阅读目标版本 release notes、known issues 和 upgrade notes。
2. 核对数据库、PHP、操作系统、Proxy 和 Agent 兼容性。
3. 在副本环境用生产规模数据演练数据库升级耗时。
4. 完整备份数据库、配置文件、自定义脚本、外部模块和 TLS 材料。
5. 做一次备份恢复验证。
6. 记录当前 NVPS、queue、worker busy 和数据库基线。
7. 准备通知渠道降级和变更回退窗口。

### 为什么数据库升级最关键

Zabbix Server 启动新版本时可能升级数据库 schema。Schema 变化通常不能通过换回旧二进制安全回滚。因此真正的回滚是：

```text
stop new version
restore pre-upgrade database
restore old binaries and configuration
verify collection, trigger evaluation, and notifications
```

只把容器镜像标签改回旧版，不恢复数据库，不算可靠回滚。

### HA 集群升级

官方建议在重大升级时停止 HA 节点，做完整数据库备份，再由一个独立节点完成数据库升级，验证后启动其余节点。不要让不同大版本 Server 同时争用一个正在升级的数据库。

### Proxy 与 Agent 兼容

Server、Proxy 和 Agent 可以存在一定版本差异，但边界有限。新 Proxy 连接旧 Server、跨越过多版本或依赖新功能都可能不受支持。每次升级应按官方 compatibility 页面核对，不凭“端口能通”判断兼容。

## Zabbix 与 Prometheus 怎么选

| 维度 | Zabbix | Prometheus |
|---|---|---|
| 传统基础设施 | Agent、SNMP、IPMI、JMX、模板成熟 | 通常依赖 exporter |
| 云原生 | 可以监控，但对象和采集模型更集中 | Kubernetes 服务发现和标签模型自然 |
| 数据模型 | 以 host/item 为中心，关系明确 | 多维 label 时间序列 |
| 采集 | 主动轮询与被动推送都丰富 | 主要 pull `/metrics` |
| 告警 | 触发器、事件、动作、升级完整 | 规则 + Alertmanager |
| 配置管理 | 前端/API/模板 | 配置文件、服务发现、Operator |
| 长期存储 | 中央关系数据库 history/trends | 本地 TSDB，长期常接远程存储 |
| 典型优势 | 资产、网络设备、综合监控 | 微服务指标、PromQL、云原生 |

企业里经常不是二选一：

```text
Zabbix --> physical servers / network / storage / legacy middleware
Prometheus --> Kubernetes / microservices / application metrics
both --> event platform / Grafana / AIOps correlation
```

关键是统一标签、资产标识、时间和事件路由，否则两个平台会形成两个告警孤岛。

## Zabbix 在 AIOps 中的落地方式

### 异常检测

通过 API 或数据库只读接口提取稳定的历史指标，构造基线、周期性和异常分数。模型输出不能直接覆盖原始值，应保留：

- 原始 item value。
- 模型版本。
- 特征窗口。
- 异常分数。
- 最终阈值和人工反馈。

### 告警相关性

使用 host group、event tag、trigger dependency、服务拓扑和时间窗口聚合同一故障。相关性规则应能解释“为什么合并”，避免黑盒吞告警。

### 根因分析

Zabbix 提供时间线和基础设施证据，但根因需要结合：

- 变更记录。
- 应用日志和 trace。
- CMDB 拓扑。
- 数据库等待事件。
- 网络路径。

`CMDB` 是 Configuration Management Database，即配置管理数据库。

### 自动修复

推荐链路：

```text
Zabbix problem
  -> webhook
  -> automation platform
  -> evidence check
  -> approval or policy
  -> idempotent runbook
  -> post-check
  -> result written back
```

自动化必须有最大执行次数、影响范围、超时、回滚和人工接管条件。

## 生产设计题：三地 5000 台设备怎么设计

### 需求

- 总计 5000 台主机和网络设备。
- 两个数据中心和一个分支园区。
- 分支到中心链路偶尔中断 4 小时。
- 监控平台 RTO 5 分钟，配置和事件 RPO 5 分钟。
- 告警需按业务团队分发。

### 设计答案

1. 中央部署两台 Zabbix Server 原生 HA，使用稳定地址供 Proxy 和 Agent 访问。
2. 后端使用 PostgreSQL HA，异步或同步策略由延迟和 RPO 决定，并做 PITR。
3. 两个前端放在负载均衡后，Web 故障不影响采集。
4. 每个站点部署至少一个 Proxy；重要站点评估 Proxy group。
5. 按站点、采集类型和 NVPS 切分 Proxy，数据库容量覆盖 4 小时断链和恢复回放。
6. 主机优先主动 Agent，网络设备由本地 Proxy SNMP 轮询。
7. 模板分为操作系统、设备型号、业务和环境宏四层。
8. 事件统一使用 `site`、`service`、`env`、`team` 标签。
9. 监控 Server、Proxy、数据库、通知渠道和时间同步。
10. 每季度演练 Server 切换、数据库恢复、Proxy 断链和告警渠道故障。

### 面试官继续追问：数据库写不动怎么办

回答不能只有“加配置”：

- 先用 NVPS、history syncer、queue、数据库 I/O 和慢查询确认瓶颈。
- 查最近是否新增高频 item 或 LLD 爆炸。
- 临时保护数据库，限制异常采集和大查询。
- 优化保留期、dependent item、分区和数据库配置。
- 容量不足再扩展存储与计算。
- 所有删除和分区操作先备份并验证回滚。

## 事故题：全网 40% 主机突然不可达

### 第一步：确认影响面

- 哪些站点、Proxy、主机组和接口类型受影响？
- 是同一时刻开始，还是逐步扩大？
- Server queue 是否只在某个 Proxy 上升？
- Proxy last seen、数据库和网络是否正常？

### 第二步：建立假设

1. Zabbix Server poller 饱和。
2. 一个 Proxy 故障。
3. 防火墙策略变更阻断 `10050`。
4. DNS 或时间同步故障。
5. 统一 Agent 配置发布错误。

### 第三步：用证据排除

- 若只有一个站点，优先查 Proxy 和链路。
- 若本地 `zabbix_agent2 -t` 成功、远程 TCP 不通，查网络和允许列表。
- 若所有类型都延迟且数据库写延迟高，查中央数据库。
- 若 active Agent 日志集中出现 `host not found`，查 Hostname 或自动注册变更。

### 第四步：修复与回滚

- 先恢复采集链路或回滚最近配置。
- 不批量重启全部 Agent，以免制造连接风暴。
- 恢复后观察 queue 和 Proxy backlog 是否持续下降。
- 检查数据缺口、漏发事件和恢复通知。

### 第五步：复盘

补充变更审计、配置灰度、监控平台自身告警和故障演练。记录真实根因，不把“重启后恢复”写成根因。

## 面试速答

### 30 秒回答：Zabbix 是什么

Zabbix 是集中式基础设施和应用监控平台，支持 Agent、SNMP、JMX、HTTP、ODBC 等采集方式。Server 统一管理配置，把采集值写入 history 和 trends，通过 trigger 生成 problem event，再由 action 发送通知或调用自动化。大型环境通过 Proxy 分布式采集，通过 Server active/standby 和独立数据库 HA 提高可用性。

### 3 分钟回答：一条告警如何产生

1. Item 按 update interval 从 Agent、SNMP 或 API 获得值。
2. 预处理校验、转换或从 master item 提取字段。
3. 值进入 history cache，并写入 history/trends。
4. 新值触发 trigger expression 重新计算。
5. 表达式从 OK 变为 PROBLEM 后创建 problem event。
6. Action 根据严重度、标签和主机组匹配。
7. Operation 通过 media type 通知值班人或调用 webhook。
8. 后续值满足恢复条件后创建 recovery event 并关闭问题。

### 追问题 1：Proxy 和 Server HA 的区别

Proxy 解决远端采集、缓冲和分担采集负载；Server HA 解决中央 Server 进程或节点故障。Proxy 不替代中央数据库和 Server，Server HA 也不自动解决数据库高可用。

### 追问题 2：History 和 Trends 的区别

History 保存每个原始值，适合近期精确排障和触发器计算；trends 保存数值型指标的小时 min/max/avg/count，适合长期容量图。缩短 history 能降存储成本，但会失去短周期细节。

### 追问题 3：如何减少告警噪声

从采集质量、阈值窗口、恢复回差、触发器依赖、维护窗口、事件标签和相关性规则逐层治理。先找共同上游和重复原因，不是简单延长所有阈值或关闭通知。

### 追问题 4：如何估算容量

先按 item 数和采集间隔计算 NVPS，再估算每日 history 行数、保留期、索引、WAL/binlog、备份和副本。结合 poller、preprocessing、cache、Proxy backlog 和数据库 I/O 做压测，保留峰值和故障回放余量。

### 追问题 5：Zabbix Server HA 为什么还不够

原生 HA 节点共享同一个数据库，只有一个 active。数据库、负载均衡、通知渠道、Proxy 和备份恢复仍有各自故障边界，必须分别设计和演练。

### 追问题 6：Zabbix 与 Prometheus 如何共存

Zabbix 更擅长传统基础设施、SNMP、资产和事件动作；Prometheus 更适合云原生、多维指标和 PromQL。通过统一服务标识、事件标签、Grafana或事件平台汇聚，避免重复采集和双重告警。

## 学习检查清单

- [ ] 能解释 Host、Template、Item、Trigger、Event、Action 的关系。
- [ ] 能区分主动检查和被动检查。
- [ ] 能区分 history 和 trends。
- [ ] 能用 Agent、SNMP、HTTP agent 和 sender 选择合适采集方式。
- [ ] 能说明 master item、dependent item 和预处理的价值。
- [ ] 能设计有持续窗口和恢复回差的触发器。
- [ ] 能解释 network discovery、autoregistration 和 LLD。
- [ ] 能说明 Proxy 与 Server HA 的不同。
- [ ] 能用 NVPS 估算数据量。
- [ ] 能从 queue、worker、cache、Proxy 和数据库建立排障证据链。
- [ ] 能解释数据库备份为何是升级回滚的核心。
- [ ] 能完成基础实验和故障注入实验。
- [ ] 能设计 Zabbix 到 AIOps 事件平台的集成。
- [ ] 能回答生产架构题和大面积不可达事故题。

## GitHub 学习证据

建议建立：

```text
zabbix-lab/
  ├── README.md
  ├── compose.yml
  ├── agent2.d/
  │   └── aiops.conf
  ├── templates/
  │   └── template-aiops-demo.yaml
  ├── screenshots/
  │   ├── latest-data.png
  │   ├── problem-event.png
  │   └── recovery-event.png
  └── incident-notes/
      └── high-latency-drill.md
```

`README.md` 至少记录：

- 环境和版本。
- 启动与清理命令。
- 监控项和触发器设计理由。
- 正常、故障和恢复证据。
- 一次失败排查过程。
- 生产化还缺什么。

不要提交真实密码、API token、PSK、设备地址或内部拓扑。

## 下一步

1. 学 [Prometheus](/tech-stack/observability/prometheus)，理解云原生指标和 PromQL。
2. 学 [Grafana](/tech-stack/observability/grafana)，把多数据源做成可排障仪表盘。
3. 学 [Alertmanager](/tech-stack/observability/alertmanager)，比较两种告警路由模型。
4. 学 [OpenTelemetry](/tech-stack/observability/opentelemetry)，补齐 metrics、logs、traces 统一采集。
5. 把本实验问题事件通过 Webhook 发送到一个带幂等和回滚的自动化 runbook。

读完本篇不等于自动通过面试。大型企业还会继续考察 Linux、网络、数据库、脚本、系统设计、真实项目证据和沟通能力；本篇的目标是让你具备扎实的 Zabbix 技术主线和可追问的排障框架。
