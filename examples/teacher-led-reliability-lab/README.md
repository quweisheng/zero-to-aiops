# 老师带学：可靠性判断实验

这个实验用合成数据练习 SRE（站点可靠性工程）判断。它不会访问网络、创建云资源、连接生产系统或执行真实修复动作。只需要 Node.js，先运行 `node --version` 确认安装，在仓库根目录执行下面的命令。

| 课程 | 正常案例 | 故障案例要观察什么 |
|---|---|---|
| 服务目标 | `node examples/teacher-led-reliability-lab/lab.mjs slo` | 追加 `--fault` 后错误预算燃烧率从 0.5 到 10 |
| 告警治理 | `node examples/teacher-led-reliability-lab/lab.mjs alert` | 分组从 3 组变 1 组，但跨租户错误合并被识别 |
| 事件响应 | `node examples/teacher-led-reliability-lab/lab.mjs incident` | 缺业务恢复证据时事件保持打开 |
| 根因分析 | `node examples/teacher-led-reliability-lab/lab.mjs rca` | 仅时间相关无法确认因果关系 |
| 变更管理 | `node examples/teacher-led-reliability-lab/lab.mjs change` | 灰度错误率恶化时停止推进 |
| 操作手册 | `node examples/teacher-led-reliability-lab/lab.mjs runbook` | 所有者不匹配，模拟动作数为 0 |
| 智能运维 | `node examples/teacher-led-reliability-lab/lab.mjs aiops` | 训练时间越过测试时间时拒绝评估 |
| 架构容量 | `node examples/teacher-led-reliability-lab/lab.mjs architecture` | 少一副本后承载能力低于峰值 |

每条命令先执行正常案例，再在结尾追加 `--fault`。故障模式返回结构化的异常判断，程序正常退出，表示“成功识别课堂故障”，不是“业务健康”。`decision` 是决策，`fault` 表示是否注入课堂故障，`kind` 说明数据性质。

先预测，再运行，再用纸笔复算。两个结果都要保留，并解释是哪条证据让判断改变。如果不能运行，先确认当前目录含 `examples`、Node 可用、参数拼写与表格一致。脚本没有外部依赖，也不会产出持久文件，无须清理服务；关闭终端就结束。若自行保存输出，仅删除自己保存的文件。

GitHub 学习证据：正常/故障输出、计算过程、一个反例、一个生产环境还需要补采的证据。脚本可以验证算术和判断流程，不能证明真实平台的高可用、消息恰好一次或模型上线效果。

## 可观测性数据语义课堂

执行 `node examples/teacher-led-reliability-lab/telemetry.mjs prometheus`，再追加 `--fault` 比较结果。课程参数可换成 `grafana`、`loki`、`elasticsearch`、`opentelemetry`、`alertmanager`、`zabbix` 或 `victoriametrics`，对应文章解释其数据与判断。

正常模式 `issue` 为 `false`，故障模式为 `true`；这是对设定课堂条件的检查。实验不启动这些产品，不模拟完整协议或存储语义，不代表生产运行测试。脚本只使用 Node.js 内置能力，没有网络、文件或服务清理要求。
