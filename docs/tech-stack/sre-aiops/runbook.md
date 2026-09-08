# Runbook

> 目标：不是写一篇“故障处理说明”，而是能把告警、检查、判断、动作、风险、审批、验证、升级、记录和自动化边界写成故障现场可执行的流程，并能逐步把低风险步骤变成脚本或自动化 runbook。

## 官方资料

优先读这些官方资料：

- [AWS Systems Manager - Creating your own runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-documents.html)
- [AWS Systems Manager - Authoring Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-authoring-runbooks.html)
- [AWS Systems Manager Automation actions reference](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-actions.html)
- [Google SRE Book - The Evolution of Automation at Google](https://sre.google/sre-book/automation-at-google/)
- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)

说明：本文把 runbook 当成“可执行的运维知识单元”来学。先写人工 Markdown runbook，再逐步把安全、重复、低风险的步骤自动化。

## 场景开场

同一条告警来了：

```text
OrderApiHighErrorRate
```

老同事会这样处理：

```text
先看 Grafana 的错误率和 p95。
再看 30 分钟内有没有发布。
如果发布后开始升高，先评估回滚。
如果日志是 database timeout，看连接池和慢查询。
如果下游 payment-api 也在 5xx，拉 payment team。
回滚后观察 15 分钟。
```

新人只看到一行红字：

```text
order-api 5xx is above 5%
```

Runbook 的价值，就是把老同事脑子里的处理路径写成别人也能执行、能验证、能升级、能自动化的步骤。

## 一句话人话版

Runbook 是故障处理说明书：把触发条件、影响、检查步骤、判断逻辑、安全动作、风险、审批、验证恢复和升级条件写清楚，让处理过程可重复。

## 小白可能会问

- Runbook 和普通技术文档有什么区别？
- Runbook 和 incident 文档有什么关系？
- 为什么每一步都要写验证方式？
- 为什么动作要分低风险和高风险？
- 什么样的步骤适合自动化？
- runbook_url 为什么应该放进告警？
- Runbook 怎么和 RAG、LLM、AIOps 结合？
- Runbook 长期不维护怎么办？

## 官方知识地图

Runbook 可以按这张地图理解：

```text
Runbook（运行操作手册）
  -> Metadata（元数据）
     -> service（服务）
     -> owner（责任人）
     -> alertname（告警名称）
     -> severity（严重级别）
     -> last_updated（最后更新时间）
  -> Trigger（触发条件）
     -> alert rule（告警规则）
     -> user report（用户报告）
     -> maintenance task（维护任务）
  -> Context（上下文）
     -> user impact（用户影响）
     -> dashboards（仪表盘）
     -> logs（日志）
     -> dependencies（依赖）
  -> Preconditions（前置条件）
     -> permissions（权限）
     -> environment（环境）
     -> approvals（审批）
     -> tools（工具）
  -> Diagnosis（诊断）
     -> checks（检查）
     -> commands（命令）
     -> expected output（预期输出）
     -> decision tree（判断分支树）
  -> Actions（动作）
     -> safe actions（经评估的低风险动作）
     -> risky actions（高风险动作）
     -> approval（批准）
     -> rollback（回滚）
  -> Verification（验证）
     -> SLI back to normal（服务指标恢复正常）
     -> alerts stop（告警停止）
     -> user reports stop（用户不再报告故障）
  -> Escalation（升级处理）
     -> owner（责任人）
     -> SME（领域专家）
     -> SEV upgrade（提高事件级别）
  -> Automation（自动化）
     -> inputs（输入）
     -> steps（步骤）
     -> actions（动作）
     -> outputs（输出）
     -> audit（审计）
```

初学路线：

```text
write markdown runbook（用Markdown编写手册）
  -> attach to alert annotation（关联到告警注解）
  -> test in a drill（演练验证）
  -> add commands and expected outputs（补命令与预期结果）
  -> add decision tree（增加判断分支）
  -> automate read-only checks（自动化只读检查）
  -> automate low-risk actions（自动化低风险动作）
  -> require approval for high-risk actions（高风险动作进入审批流程）
```

## 老师带你写一份别人真的能执行的手册

半夜值班的新同学看到“服务异常，请重启”。他不知道是哪套环境、哪个实例、是否允许操作，也不知道重启后应检查什么。Runbook 是“运行操作手册”，核心价值是把不确定的现场判断变成明确的条件、证据与动作。我们先写给第一次接触系统的人读，再考虑自动化。

第一句话写用户影响：“订单查询失败，已有订单写入是否受影响尚未确认。”第二句话写对象：“生产 A 租户的查询服务，只读检查范围为指定实例。”第三句话写停止条件：“发现数据写入异常或目标不符，暂停本流程并升级。”读者先知道边界，后面的命令才有含义。

### 第一课：为什么每个检查都需要预期结果

`curl` 返回一段内容只是事实，HTTP 200 也可能是统一错误页面。手册应同时写响应状态、关键业务字段和时间窗口。检查进程存在不能证明配置已加载，端口监听不能证明下游可用。让每个步骤只回答一个问题，再根据结果决定下一步。

你可以用“如果 A，则执行 B；否则收集 C 并停止”写分支。先检查最近变更和用户影响，再看依赖与资源；风险动作放在证据满足的分支里。不要把诊断和修复混成一串没有停顿的命令，因为执行到中间时可能已经改变了待分析状态。

Precondition（前置条件）是动作开始前必须成立的条件，例如目标所有者、当前版本和可用副本数。Postcondition（后置条件）是执行后应该成立的条件，例如配置值已生效且业务探测恢复。Rollback（回滚）是恢复到经过验证的先前状态；它并不保证所有数据变更都能逆转。

### 基础实验：重复执行为什么只产生一次效果

前置条件是本机安装 Node.js，在仓库根目录运行。这个例子只记录内存中的模拟动作，不访问真实服务。

```powershell
node examples/teacher-led-reliability-lab/lab.mjs runbook
node examples/teacher-led-reliability-lab/lab.mjs runbook --fault
```

正常模式给同一个 `job-42` 两次，输出 `simulatedActions: 1`，第二次为 `DUPLICATE_SKIPPED`（跳过重复请求）。这叫幂等：在规定条件下重试不增加业务效果。故障模式把实际所有者改为另一团队，出现 `PRECONDITION_FAILED`，模拟动作数为 0。先预测，再对照 `state`（条件状态）与 `journal`（执行记录）。

若结果不同，检查命令参数、目录和文件版本。程序结束后内存记录消失，无持久文件或服务要清理。这个范围非常重要：内存集合只演示机制；生产重启后仍需去重，应把请求标识和结果存进持久账本，并用原子条件更新处理并发。

### 故障实验：一份流程在执行期间过期了

纸面增加一个场景：检查时目标版本是 3，真正执行前另一任务升级到 4。若动作仍按版本 3 的假设修改，会覆盖别人的变更。你要在动作提交时再次校验版本，最好让检查和修改由服务端原子完成。这里的原子表示不会被别的并发动作插进半个操作。

把手册修改为“提交时版本不符则拒绝，重新采集状态”，再模拟两个操作同时到达。预期只有符合条件的一次通过，其余停止并留记录。不要在生产做这个竞争实验；用笔记中的状态表演练即可。清理时保留修订前后文档，作为发现陈旧假设的证据。

### 第二课：生产自动化需要哪些状态

任务通常经过待校验、待确认、运行中、成功、失败、补偿中和人工接管。每次状态转移保存输入摘要、目标、版本、时间和结果。任务超时不代表动作未发生；可能是动作成功而结果回传失败。重试前先查询业务状态或利用幂等键确认，避免再次执行不可重复动作。

权限分开设计：收集日志不需要管理员权限，读取状态不等于获准修改配置。自动化身份只获得必要能力，敏感输入不写日志。任务并发、速率和最大影响对象数都设置上限；同一时间大批服务触发告警时，不能让自动化同时重启全部实例。

手册也有版本和发布流程。配置字段变了、监控入口改了、负责人转岗了，旧手册会失效。给手册标明适用版本和最后演练日期，例行用正常及故障案例验证；发现页面链接失效或输出格式变化，先暂停受影响的自动动作再修订。

### 面试课堂：把流程讲成一条状态链

30 秒：“Runbook 把触发条件、只读证据、分支判断、动作、验证、回滚和升级写清楚，让不同值班人员能一致地处理问题。自动化时再增加前置校验、幂等、持久状态和审计。”

3 分钟用本实验说明：读取对象与版本，核对所有者，用任务标识防重，执行前再检查条件，记录结果，验证业务，失败时停止或补偿。强调课堂内存去重与生产持久账本的差别。

追问：“脚本退出 0 就能关闭事件吗？”还需业务验收。“重试安全怎么保证？”解释幂等范围、事务边界与结果查询。“为什么不能把所有步骤自动化？”有些证据不足、风险不可控或需要现场判断，应该明确人工接管条件。设计题是为 100 个服务安排有并发上限的恢复任务；事故题是超时后重试造成重复动作，沿任务账本和业务提交点还原原因。

GitHub 学习证据：一份带正常/异常输出的手册、两个模拟结果、任务状态图、权限表和演练记录。写清哪些操作只是课堂模拟，避免把模板内容当成实测履历。

## 工作坊：从一条告警写出真正可交接的手册

### 第一步，先让新同学知道自己有没有走错门

假设告警叫“订单接口错误率升高”。不要马上贴重启命令，先写服务用途、环境、租户、资源范围、维护团队和变更入口。新同学应能把告警中的对象与资源台账一一对应。如果名称相似但资源标识不同，必须先澄清，而不是“看起来像”就操作。

运行环境也要明确：命令在个人电脑、应用主机、容器里还是运维跳板上执行？需要什么只读权限？命令中的占位符从哪里取得？如果这些没说明，一个技术上正确的命令也可能在错误环境产生完全不同的结果。

把证据入口写成可维护链接或明确的查询条件，并说明时间范围。例如“查看受影响服务过去三十分钟的请求数、错误数和延迟，与告警发生前窗口比较”。不要只写“看监控”，因为读者可能挑到没有业务流量的实例，误以为系统健康。

### 第二步，每个检查只回答一个能决定下一步的问题

问题一：用户是否真的受到影响？比较业务探测、错误响应和入口流量。问题二：影响范围是什么？按区域、租户、版本和接口拆分。问题三：有无紧邻变更？查看实际发布记录与生效配置。这样形成的流程能逐步缩小范围，而不是一上来同时执行二十条命令。

“没有查到”要拆成没有数据、没有权限、查询错误、对象不对和确实未发生。手册为这些情况分别给分支。例如查询接口拒绝访问时，不应继续判断“错误数为零”；应记录权限问题并找授权人员代查，不能为了完成手册临时扩大自己的权限。

输出说明至少包含正常、异常和不确定三类。正常表示检查条件满足；异常表示某个假设需要处理；不确定表示证据不足。对不确定状态安排补采或升级，比强迫二选一更接近真实值班场景。

### 第三步，把诊断权限和修复权限分开

读配置、查看日志、查询健康状态通常属于诊断；重启、改参数、切流、删除和恢复属于改变系统状态。两类步骤可以在同一手册，但应有清晰门槛：谁批准、哪些前置证据成立、目标上限是多少、允许在哪个时间窗口执行。

例如“只回滚一个已确认异常的灰度实例”与“重启所有实例”影响范围不同。即使一个命令很短，也可能覆盖整个服务。危险程度由作用对象、可逆性和业务影响决定，不由命令字符数决定。Runbook 应让读者在执行前复述这三点。

生产中如需紧急授权，应遵循已建立的紧急流程并记录原因、范围和事后复核。不能用“事故紧急”作为永久绕过审计的借口。自动化执行器也应受同样边界约束，不能因为它叫机器人就拥有无限管理员权限。

### 第四步，解释“成功”到底指哪一层

脚本成功退出，只能证明脚本按它的规则结束。接口返回接受，可能只是任务排入队列。任务显示完成，可能只是配置已写入，应用尚未加载。实例健康，也可能只是进程存活，关键业务仍无法访问数据库。把每一层的验收条件写清楚，新同学才不会过早关单。

以配置回滚为例，先确认目标版本恢复，再确认实际运行实例加载了该版本，然后观察关键业务探测、请求错误率和延迟，最后检查没有引入新的影响。观察时间应根据业务流量与故障特征确定，不能没有样本也机械等待十分钟后宣布成功。

若业务流量很低，需要受控的合成探测补足证据；若问题只在峰值出现，离峰恢复验证应记录这个限制并安排代表性演练。把尚未验证的边界写在交接中，比让下一班猜测更可靠。

### 第五步，正确处理超时、取消与重试

超时只表示在约定时间内没有拿到期望结果，不说明远端没有执行。客户端取消也可能仅停止本地等待，远端任务仍在运行。手册遇到超时后，先查询任务标识对应的执行状态和业务结果，再决定继续等待、重试、补偿或人工接管。

幂等键要能稳定代表同一次业务意图。如果每次重试都生成新键，就失去去重效果；如果不同操作误用同一键，又可能错误跳过该做的事。生产持久账本还要规定保存多久、并发如何互斥、结果如何返回、人工修复后如何继续，不能只用内存中的一个变量代表可靠去重。

补偿也不一定是反向执行。例如重新发送通知后，无法收回已经看到的消息；恢复某个配置值，不会撤销它期间产生的所有业务数据。手册应明确哪些状态能回滚，哪些需要业务对账与人工处理。这个边界是高级面试里常见的追问点。

### 第六步，用一次交接测试暴露手册缺陷

课堂演练准备一份只含合成数据的故障包：告警摘要、当前版本、两张指标表和一段脱敏日志。让另一位同学在不询问作者的情况下按手册处理，记录他在哪个术语、路径、权限或分支处停住。作者暂时不要口头补充，停住的地方正是需要补写的内容。

故障注入可以把目标版本改成不适用版本、隐藏一项必要证据，或把接口返回改成“接受但未完成”。预期是执行者识别限制并停止危险动作，而不是想办法把每一步都执行完。恢复演练数据后重新跑一遍，验证修订确实消除了歧义。

清理只处理演练创建的本地材料或独立资源，保留脱敏证据与修订差异。学习成果包括一份可交接手册、三类结果分支、权限表、正常/故障记录和未覆盖事项。面试时说明你用交接测试发现了什么，以及为什么某些步骤仍保留人工判断。

## Runbook 不是什么

Runbook 不是普通知识文章。

| 文档类型 | 目标 | 特点 |
|---|---|---|
| 技术文章 | 解释原理 | 可以长、可以讲背景 |
| 架构文档 | 描述系统 | 关注组件、依赖、设计 |
| Incident 文档 | 记录一次事件 | 关注时间线、决策、结果 |
| Runbook | 指导如何处理 | 关注步骤、判断、动作、验证 |

如果一篇文档只有原理，没有“现在该做什么”，它不是合格 runbook。

## Runbook 和 Incident 的关系

```text
alert（告警）
  -> runbook tells what to do（手册说明该做什么）
  -> incident doc records what happened（事件文档记录实际发生什么）
  -> postmortem improves runbook（复盘改进手册）
```

Runbook 是事前准备。

Incident 文档是事中记录。

Postmortem 是事后学习。

三者形成闭环：

```text
runbook（运行手册）
  -> incident response（事件响应）
  -> postmortem action item（复盘行动项）
  -> runbook update（手册更新）
```

## 好 Runbook 的标准

一份好的 runbook 应该让新人也能回答：

- 这条告警是什么意思？
- 用户影响是什么？
- 先看哪个 dashboard？
- 查哪些日志？
- 执行哪些只读命令？
- 哪些结果说明问题在哪？
- 哪些动作是安全的？
- 哪些动作需要审批？
- 做完后怎么验证？
- 什么时候升级？
- 处理记录写在哪里？

判断标准：

```text
能执行。
能验证。
能升级。
能审计。
能维护。
```
## Runbook 结构

推荐结构：

```text
metadata（元数据）
  -> trigger（触发条件）
  -> impact（影响）
  -> prerequisites（前置要求）
  -> quick triage（快速分类与判断）
  -> dashboards（仪表盘）
  -> checks（检查）
  -> decision tree（判断分支树）
  -> safe actions（经评估的低风险动作）
  -> risky actions（高风险动作）
  -> verification（验证）
  -> escalation（升级处理）
  -> record（记录）
  -> automation mapping（自动化步骤映射）
```

每一节都要短、具体、可执行。

## Markdown 模板

````md
# Runbook: order-api HighErrorRate

## 元信息

- 服务: order-api
- 告警: OrderApiHighErrorRate
- Owner: team-order
- 严重级别: page
- 最近更新: 2026-07-02
- 适用环境: prod
- 关联 SLO: order-api-availability
- 相关 dashboard: https://grafana.example.com/d/order-api

## 触发条件

5 分钟内 order-api 5xx 错误率 > 5%。

## 用户影响

用户可能无法下单，订单提交可能失败。

## 先决条件

- 已登录监控系统。
- 有只读日志权限。
- 有 Kubernetes 只读权限。
- 有发布系统查看权限。
- 生产回滚需要 IC 审批。

## 快速判断

1. 打开 order-api dashboard，确认错误率、p95 延迟、请求量。
2. 查看最近 30 分钟发布记录。
3. 查看 order-api 错误日志。
4. 查看下游 payment-api 状态。
5. 查看 MySQL 连接池和慢查询。

## 检查命令

```bash
kubectl get pods -n prod -l app=order-api
kubectl logs -n prod deploy/order-api --since=30m | tail -n 200
```

期望输出：

- Pod 不应大面积 CrashLoopBackOff。
- 错误日志中应定位主要错误类型。

## 决策树

- 如果错误从发布后开始，评估回滚。
- 如果日志主要是 database timeout，检查连接池和慢 SQL。
- 如果下游 payment-api 5xx 同时增加，升级 payment-api owner。
- 如果只有单个实例异常，摘除或重启该实例。

## 安全动作

### 查看最近发布

风险：低。

审批：不需要。

结果记录：记录发布版本、时间、负责人。

### 摘除单个异常实例

风险：低到中，取决于副本数。

审批：按团队规则。

前置条件：至少还有足够健康副本。

## 高风险动作

### 回滚

风险：中。

审批：需要 IC。

```bash
kubectl rollout undo deployment/order-api -n prod
```

回滚后验证：

- 5xx 错误率回落。
- p95 延迟回落。
- 新版本错误日志消失。

### 扩容

风险：低到中。

审批：按团队规则。

```bash
kubectl scale deployment/order-api -n prod --replicas=6
```

扩容后验证：

- Pod ready。
- 请求分布正常。
- 延迟下降。

## 验证恢复

- 5xx 错误率回到 1% 以下并持续 15 分钟。
- p95 延迟回到 300ms 以下。
- SLO burn rate 恢复到可接受范围。
- 新告警停止触发。
- 用户工单不再增加。

## 升级条件

- 10 分钟内没有明确缓解方向。
- 影响升级为 SEV1。
- 需要数据库、网络、安全团队参与。
- 回滚失败。
- 怀疑数据丢失。

## 处理记录

- 执行人:
- 执行动作:
- 执行时间:
- 结果:
- 后续事项:

## 自动化候选

| 步骤 | 风险 | 是否适合自动化 |
|---|---|---|
| 拉取 dashboard 链接 | 低 | 是 |
| 查询最近发布 | 低 | 是 |
| 查询错误日志摘要 | 低 | 是 |
| 摘除单实例 | 中 | 需要条件和审批 |
| 回滚生产 | 高 | 需要人工审批 |
````

## Runbook 字段解释

| 字段 | 为什么需要 |
|---|---|
| 服务 | 路由和检索 |
| 告警名 | 关联 alert rule |
| Owner | 找到责任团队 |
| 严重级别 | 响应方式 |
| 最近更新 | 判断是否过期 |
| 触发条件 | 知道为什么来这里 |
| 用户影响 | 判断优先级 |
| 先决条件 | 防止执行者卡住 |
| 检查命令 | 快速定位事实 |
| 期望输出 | 知道结果怎么解释 |
| 决策树 | 避免凭感觉 |
| 风险 | 防止危险动作 |
| 审批 | 接入事件流程 |
| 验证恢复 | 防止过早结束 |
| 升级条件 | 不让新人独自硬扛 |
| 处理记录 | 进入 incident / postmortem |

## Alertmanager 中挂 Runbook

告警必须能直接跳到 runbook。

Prometheus alerting rule：

```yaml
annotations:
  summary: "order-api high error rate"
  description: "More than 5% of order-api requests are returning 5xx."
  runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"
  dashboard_url: "https://grafana.example.com/d/order-api"
```

如果通知里没有 runbook_url，值班人会浪费时间搜索。

## Runbook 质量检查

每份 runbook 上线前检查：

- 是否能从告警一键打开？
- 是否写了 owner？
- 是否写了适用环境？
- 是否写了用户影响？
- 是否列出只读检查？
- 是否给出期望输出？
- 是否有决策树？
- 是否区分安全动作和高风险动作？
- 是否写了审批要求？
- 是否写了验证恢复？
- 是否写了升级条件？
- 是否最近演练过？

不合格 runbook 不应该作为 page 告警的唯一处理依据。

## 从人工到自动化

AWS Systems Manager Automation runbook 的概念很适合理解自动化：runbook 由按顺序执行的 steps 组成，每个 step 围绕一个 action，前一步的输出可以作为后一步输入。

通用自动化路径：

```text
人工 Markdown runbook
  -> 只读检查脚本
  -> 参数化脚本
  -> 受控自动化
  -> 自助执行
  -> 告警触发 + 人工审批
  -> 低风险自动执行
```

不要跳过前几步直接让告警自动重启生产。

## 自动化风险分级

| 步骤 | 风险 | 自动化建议 |
|---|---:|---|
| 查询指标 | 低 | 自动 |
| 查询日志摘要 | 低 | 自动 |
| 查询最近发布 | 低 | 自动 |
| 生成状态更新草稿 | 低 | 自动，但人工发送 |
| 创建工单 | 低到中 | 可自动 |
| 扩容 | 中 | 加条件和审批 |
| 摘除实例 | 中 | 加健康检查和回滚 |
| 回滚生产 | 高 | 必须审批 |
| 删除数据 | 极高 | 不应自动 |

自动化要满足：

- 幂等。
- 可重试。
- 可回滚。
- 有超时。
- 有审计。
- 有权限边界。
- 有人工审批入口。

## Runbook 和 AIOps

Runbook 是 AIOps 的知识资产。

| AIOps 能力 | Runbook 如何参与 |
|---|---|
| 告警摘要 | 提供告警含义和用户影响 |
| Runbook 推荐 | 根据 alertname/service 检索 |
| RAG 问答 | runbook chunk 进入向量库 |
| 自动化 | 安全步骤变成执行单元 |
| 事件响应 | runbook 指导检查和缓解 |
| 复盘 | incident action item 更新 runbook |
| 新人学习 | 用真实告警学习操作路径 |

LLM 可以帮助：

- 总结 runbook。
- 根据告警推荐 runbook。
- 把长 runbook 变成步骤清单。
- 生成状态更新草稿。

但 LLM 不应该绕过审批执行高风险动作。

## 入门练习：写一个告警 Runbook

任务：为 `OrderApiHighErrorRate` 写一份 runbook。

必须包含：

1. 元信息。
2. 触发条件。
3. 用户影响。
4. 先决条件。
5. 快速判断。
6. 检查命令。
7. 决策树。
8. 安全动作。
9. 高风险动作和审批。
10. 验证恢复。
11. 升级条件。
12. 自动化候选。

再写一个只读检查脚本：

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-prod}"
APP="${2:-order-api}"

echo "== Pods =="
kubectl get pods -n "$NAMESPACE" -l app="$APP"

echo "== Recent logs =="
kubectl logs -n "$NAMESPACE" deploy/"$APP" --since=30m | tail -n 100
```

这个脚本只读，适合作为自动化第一步。

## 常见错误

### 只有原理，没有步骤

Runbook 不是知识文章。必须写“下一步做什么”。

### 没有期望输出

只有命令不够，执行者还要知道结果怎么解释。

### 没有验证恢复

执行完动作不代表恢复。必须看 SLI、告警和用户反馈。

### 没有风险说明

回滚、扩容、重启、删除都要写风险和审批。

### 没有升级条件

新人可能独自卡太久。必须写什么时候拉人。

### 长期不维护

过期 runbook 比没有 runbook 更危险。

### 自动化没有权限边界

自动化必须有最小权限、审计和审批。

## 常用字段字典

### `runbook_url`

告警跳转到 runbook 的链接。

### `dashboard_url`

排障 dashboard 链接。

### `owner`

责任团队或服务负责人。

### `trigger`

Runbook 适用的触发条件。

### `preconditions`

执行前需要满足的权限、环境和工具条件。

### `safe_actions`

低风险动作，通常可以自动化或自助执行。

### `risky_actions`

需要审批或人工确认的动作。

### `verification`

执行后如何确认恢复。

### `escalation`

什么时候、找谁升级。

### `automation_id`

关联脚本、流水线、AWS SSM Automation 或内部自动化平台 ID。

## 面试怎么讲

Runbook 是故障处理的可执行手册，不是普通知识文章。好的 runbook 要从告警或任务出发，写清楚触发条件、用户影响、先决条件、检查步骤、期望输出、决策树、缓解动作、风险、审批、验证恢复和升级条件。它应该挂在告警的 `runbook_url` 上，让值班人从通知直接进入处理流程。

我会先写人工 Markdown runbook，并通过演练验证它是否真的可执行。之后把低风险、重复、只读的步骤自动化，比如查询 dashboard、最近发布、日志摘要；高风险动作如生产回滚、重启、删除数据必须保留审批、审计和回滚方案。AIOps 中，runbook 还能进入 RAG 和向量库，用于相似故障检索、告警摘要、runbook 推荐和自动化候选生成。

## 学习检查清单

- [ ] 我能解释 runbook 和普通技术文档的区别。
- [ ] 我能解释 runbook、incident、postmortem 的关系。
- [ ] 我能写一份完整告警 runbook。
- [ ] 我能把 runbook_url 挂到 Prometheus 告警。
- [ ] 我能写检查命令和期望输出。
- [ ] 我能写决策树。
- [ ] 我能区分安全动作和高风险动作。
- [ ] 我能写验证恢复标准。
- [ ] 我能写升级条件。
- [ ] 我能判断哪些步骤适合自动化。
- [ ] 我能说明自动化需要权限、审批和审计。
- [ ] 我能说明 runbook 如何进入 AIOps / RAG。

## 面试题

1. Runbook 解决什么问题？
2. Runbook 和普通文档有什么区别？
3. Runbook 和 incident 文档有什么关系？
4. 一份好的 runbook 应该包含哪些部分？
5. 为什么每条 page 告警都应该有 runbook_url？
6. 为什么命令后面要写期望输出？
7. 为什么动作要写风险和审批？
8. 什么样的 runbook 步骤适合自动化？
9. 为什么不能一开始就自动回滚生产？
10. 自动化 runbook 需要哪些安全边界？
11. Runbook 如何支持新人值班？
12. Runbook 如何进入 RAG？
13. Postmortem action item 如何更新 runbook？
14. 如何判断 runbook 是否过期？
15. AIOps 如何利用 runbook 做告警推荐？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份 `order-api-high-error-rate.md` runbook。
- 一条带 `runbook_url` 的 Prometheus 告警规则。
- 一个只读检查脚本。
- 一张自动化候选表。
- 一份 runbook 质量检查表。
- README 解释 runbook、incident、postmortem 的闭环。
- README 说明哪些动作不能自动化，为什么。
