import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const docsRoot = path.join(repoRoot, 'docs', 'tech-stack')

const commentPrefixes = ['#', '//', '--', ';']

function walkMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files.sort()
}

function normalizeLang(rawLang) {
  return rawLang.trim().split(/\s+/)[0].toLowerCase() || 'text'
}

function parseFence(line) {
  const match = line.match(/^(`{3,}|~{3,})(.*)$/)
  if (!match) return undefined
  const marker = match[1]
  return {
    char: marker[0],
    length: marker.length,
    lang: normalizeLang(match[2] ?? ''),
  }
}

function isClosingFence(line, fence) {
  const escapedChar = fence.char === '`' ? '`' : '~'
  const match = line.match(new RegExp(`^${escapedChar}{${fence.length},}\\s*$`))
  return Boolean(match)
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '&#124;')
}

function displayLine(line) {
  return line.length === 0 ? '<em>空行</em>' : `<code>${escapeHtml(line)}</code>`
}

function firstToken(line) {
  const trimmed = line.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/)[0].replace(/[;&|]+$/g, '')
}

function explainCommand(line, lang) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来把命令分成更容易阅读的几段。'
  if (commentPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return '注释行，提前说明下面命令的目的或注意事项。'
  }

  const token = firstToken(trimmed).toLowerCase()
  const commandExplanations = {
    git: '执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。',
    npm: '执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。',
    node: '运行 Node.js 脚本，通常用于生成索引、构建页面或执行检查逻辑。',
    python: '运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。',
    pip: '管理 Python 依赖包，通常用于安装实验需要的库。',
    docker: '执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。',
    kubectl: '执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。',
    helm: '执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。',
    curl: '发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。',
    wget: '下载文件或访问 URL，用来验证网络连通性和服务响应。',
    systemctl: '管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。',
    journalctl: '读取 systemd journal 日志，用来排查服务启动失败和运行错误。',
    ps: '查看进程快照，用来确认目标服务或脚本是否正在运行。',
    top: '实时查看系统资源，用来观察 CPU、内存和进程压力。',
    df: '查看磁盘空间，用来判断磁盘是否快满。',
    du: '统计目录占用空间，用来定位大文件或日志目录。',
    ss: '查看网络监听和连接，用来确认端口是否打开。',
    dig: '查询 DNS 解析结果，用来排查域名解析问题。',
    ping: '发送 ICMP 探测包，用来粗略判断网络连通性。',
    openssl: '检查 TLS/证书相关信息，用来排查 HTTPS 连接问题。',
    ansible: '执行 Ansible 自动化命令，用来批量检查或变更服务器。',
    terraform: '执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。',
    promtool: '执行 Prometheus 工具命令，用来检查配置文件或告警规则。',
    amtool: '执行 Alertmanager 工具命令，用来查看、静默或调试告警。',
    mysql: '连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。',
    psql: '连接或操作 PostgreSQL 数据库，用来查询事件、工单或告警数据。',
    'redis-cli': '连接 Redis，用来检查缓存、队列、限流或告警去重状态。',
    'kafka-topics': '管理 Kafka topic，用来查看或创建事件流主题。',
    rabbitmqctl: '管理 RabbitMQ，用来查看队列、交换机和节点状态。',
    uvicorn: '启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。',
    mkdir: '创建目录，用来准备实验项目结构。',
    cd: '切换当前目录，确保后续命令在正确项目位置执行。',
    ls: '列出文件或目录，用来确认实验文件是否存在。',
    cat: '打印文件内容，用来检查配置或日志片段。',
    echo: '输出一段文本，常用于写入测试内容或验证变量。',
    export: '设置 shell 环境变量，常用于配置 API Key、端口或运行参数。',
    set: '设置 shell 或工具变量，具体含义取决于当前终端环境。',
    copy: '复制文件或目录，用来准备配置、样例或备份。',
    xcopy: '复制文件树，用来批量复制实验目录。',
    'remove-item': 'PowerShell 删除文件或目录，执行前要确认路径正确。',
    'get-childitem': 'PowerShell 列出文件、目录或匹配项，用来检查本地环境。',
    'select-string': 'PowerShell 搜索文本，用来在日志或代码中定位关键字。',
    'invoke-webrequest': 'PowerShell 发起 Web 请求，用来验证页面、接口或下载文件。',
    'invoke-restmethod': 'PowerShell 调用 REST API，用来获取 JSON 接口结果。',
  }

  const prefix = commandExplanations[token] ?? `执行 \`${token}\` 相关命令，后面的参数决定它具体操作什么对象。`
  if (/[|&]{1,2}/.test(trimmed)) {
    return `${prefix} 这一行还包含管道或连接符，表示把多个命令串起来处理。`
  }
  if (trimmed.includes('--')) {
    return `${prefix} 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。`
  }
  if (lang === 'powershell' && trimmed.includes('$')) {
    return `${prefix} 其中 \`$\` 开头的是 PowerShell 变量，用来保存临时值或配置。`
  }
  return prefix
}

function explainYaml(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔不同配置段，方便阅读。'
  if (trimmed.startsWith('#')) return '注释行，用来说明这段配置的目的，不会被程序当作配置执行。'
  if (trimmed.startsWith('- ')) return '列表项，表示同一个配置字段下面可以有多个值或多个对象。'

  const match = trimmed.match(/^("?[\w.-]+"?)\s*:\s*(.*)$/)
  if (match) {
    const key = match[1].replaceAll('"', '')
    const value = match[2]
    if (value === '') {
      return `定义 \`${key}\` 配置段，下面缩进的内容都属于这个配置段。`
    }
    return `设置 \`${key}\` 字段的值为 \`${value}\`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。`
  }

  return '配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。'
}

function explainJson(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来提升 JSON 可读性。'
  if (trimmed === '{') return '对象开始，表示下面是一组键值对配置。'
  if (trimmed === '}') return '对象结束，表示这一组键值对配置到这里结束。'
  if (trimmed === '[') return '数组开始，表示下面会列出多个同类值或对象。'
  if (trimmed === ']') return '数组结束，表示同类值或对象列表到这里结束。'
  if (trimmed === '},' || trimmed === '}' || trimmed === '],') return '当前对象或数组结束，逗号表示后面还有同级项目。'

  const match = trimmed.match(/^"([^"]+)"\s*:\s*(.*?)(,)?$/)
  if (match) {
    return `设置 \`${match[1]}\` 字段，值是 \`${match[2]}\`；真实环境要根据自己的告警、服务或接口返回调整。`
  }

  return 'JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。'
}

function explainSql(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来把 SQL 的不同逻辑段分开。'
  if (trimmed.startsWith('--')) return 'SQL 注释行，用来说明查询目的，不会被数据库执行。'
  const upper = trimmed.toUpperCase()

  if (upper.startsWith('SELECT')) return '选择最终要返回的字段或计算结果，是查询结果表头的来源。'
  if (upper.startsWith('FROM')) return '指定从哪张表读取数据，是 SQL 逻辑执行的起点。'
  if (upper.startsWith('WHERE')) return '过滤原始数据行，只保留符合条件的记录。'
  if (upper.startsWith('GROUP BY')) return '按指定字段分组，让每组单独统计或聚合。'
  if (upper.startsWith('HAVING')) return '对分组后的结果再次过滤，常用于限制 COUNT、AVG 等聚合结果。'
  if (upper.startsWith('ORDER BY')) return '对查询结果排序，让最重要或最新的数据排在前面。'
  if (upper.startsWith('LIMIT')) return '限制返回行数，避免结果太多影响阅读或性能。'
  if (upper.includes('JOIN')) return '把两张表按关联字段连接起来，用于把告警、服务、变更等上下文拼在一起。'
  if (upper.startsWith('INSERT')) return '向表里新增数据，常用于写入告警、事件或学习样例。'
  if (upper.startsWith('UPDATE')) return '更新已有数据，生产执行前要先用 SELECT 确认影响范围。'
  if (upper.startsWith('DELETE')) return '删除数据，生产执行前必须确认 WHERE 条件避免误删。'
  if (upper.startsWith('CREATE')) return '创建数据库对象，例如表、索引或视图。'
  if (upper.startsWith('ALTER')) return '修改数据库对象结构，例如新增字段或索引。'
  if (upper.startsWith('INDEX') || upper.startsWith('KEY')) return '定义索引，加速按这些字段过滤、排序或关联查询。'
  if (upper.startsWith('PRIMARY KEY')) return '定义主键，用来唯一标识每一行记录。'

  return 'SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。'
}

function explainPython(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔不同逻辑块，让代码更容易阅读。'
  if (trimmed.startsWith('#')) return 'Python 注释行，用来解释代码目的，不会被解释器执行。'
  if (trimmed.startsWith('import ')) return '导入 Python 模块，后面的代码会使用这个模块提供的功能。'
  if (trimmed.startsWith('from ')) return '从某个模块导入指定对象，减少后面代码的书写量。'
  if (trimmed.startsWith('def ')) return '定义函数，把一段可复用逻辑命名，后续可以反复调用。'
  if (trimmed.startsWith('class ')) return '定义类，用来组织一组数据和行为。'
  if (trimmed.startsWith('if ')) return '条件判断，只有条件成立时才执行下面缩进的代码。'
  if (trimmed.startsWith('elif ')) return '补充条件判断，前面的 if 不成立时继续检查这里。'
  if (trimmed.startsWith('else')) return '兜底分支，前面的条件都不成立时执行。'
  if (trimmed.startsWith('for ')) return '循环处理一组数据，常用于逐条处理告警、日志或指标样本。'
  if (trimmed.startsWith('while ')) return '按条件循环执行，条件一直成立就会继续运行。'
  if (trimmed.startsWith('with ')) return '上下文管理语句，常用于安全打开文件或管理连接。'
  if (trimmed.startsWith('return ')) return '返回函数结果，调用方会拿到这个值继续处理。'
  if (trimmed.startsWith('print(')) return '打印输出，用来在实验中确认变量、结果或调试信息。'
  if (/^[\w_]+\s*=/.test(trimmed)) return '给变量赋值，把右侧计算结果保存起来供后续代码使用。'
  if (trimmed.includes('.read_')) return '读取外部数据，AIOps 场景里常见来源是 CSV、数据库导出或日志文件。'
  if (trimmed.includes('.groupby(')) return '按字段分组统计，常用于按服务、告警名或时间窗口聚合数据。'
  if (trimmed.includes('.fit(')) return '训练模型或拟合转换器，让算法从样本数据里学习规律。'
  if (trimmed.includes('.predict(')) return '用训练好的模型做预测，输出分类、异常分数或预测值。'

  return 'Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。'
}

function explainMarkdown(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔 Markdown 段落。'
  if (trimmed.startsWith('#')) return 'Markdown 标题行，用来组织文档层级。'
  if (trimmed.startsWith('- ')) return 'Markdown 列表项，用来列出步骤、要点或证据清单。'
  if (trimmed.startsWith('|')) return 'Markdown 表格行，用来对齐展示字段和说明。'
  if (trimmed.startsWith('>')) return 'Markdown 引用行，用来突出说明、提示或学习目标。'
  return 'Markdown 正文示例，展示文档里应该怎样写说明内容。'
}

function explainDockerfile(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。'
  if (trimmed.startsWith('#')) return '注释行，用来解释镜像构建步骤。'
  const upper = trimmed.toUpperCase()
  if (upper.startsWith('FROM')) return '指定基础镜像，后续镜像会在它的基础上继续构建。'
  if (upper.startsWith('WORKDIR')) return '设置容器内工作目录，后续命令默认在这个目录执行。'
  if (upper.startsWith('COPY')) return '把宿主机项目文件复制进镜像。'
  if (upper.startsWith('RUN')) return '在构建镜像时执行命令，常用于安装依赖或准备文件。'
  if (upper.startsWith('EXPOSE')) return '声明容器应用监听的端口，方便读者知道服务入口。'
  if (upper.startsWith('CMD') || upper.startsWith('ENTRYPOINT')) return '设置容器启动时默认执行的命令。'
  if (upper.startsWith('ENV')) return '设置镜像或容器里的环境变量。'
  return 'Dockerfile 构建指令，描述镜像构建或容器启动的一步。'
}

function explainIni(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔配置段。'
  if (trimmed.startsWith('#') || trimmed.startsWith(';')) return '注释行，用来说明配置目的。'
  if (/^\[.+\]$/.test(trimmed)) return '配置段标题，下面的配置项都属于这一组。'
  if (trimmed.includes('=')) {
    const [key, value] = trimmed.split(/=(.*)/s)
    return `设置 \`${key.trim()}\` 配置项为 \`${(value ?? '').trim()}\`，真实环境按自己的路径、账号或服务参数调整。`
  }
  return '配置文件中的一行，通常和所在配置段一起决定程序行为。'
}

function explainNginx(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来分隔 NGINX 配置块。'
  if (trimmed.startsWith('#')) return 'NGINX 注释行，用来说明配置目的。'
  if (trimmed.endsWith('{')) return '配置块开始，花括号内的指令只在这个上下文中生效。'
  if (trimmed === '}') return '配置块结束，表示当前上下文配置到这里结束。'
  if (trimmed.startsWith('server')) return '定义一个虚拟主机入口，通常对应一个域名或端口。'
  if (trimmed.startsWith('location')) return '定义 URL 路径匹配规则，决定请求交给哪段配置处理。'
  if (trimmed.startsWith('proxy_pass')) return '把请求转发到后端服务，是反向代理的核心配置。'
  if (trimmed.startsWith('listen')) return '声明 NGINX 监听的端口。'
  if (trimmed.startsWith('server_name')) return '声明匹配的域名或主机名。'
  return 'NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。'
}

const textTermGlossary = {
  aiops: '智能运维',
  alert: '告警',
  alertmanager: 'Prometheus 生态里的告警管理器',
  api: '应用程序接口',
  batch: '批处理',
  client: '客户端',
  common: '常见',
  connect: '连接',
  data: '数据',
  database: '数据库',
  ddl: '数据定义语言，用来建库、建表、建索引',
  dml: '数据操作语言，用来增删改查数据',
  enter: '输入',
  explain: '解释执行计划的命令',
  github: '代码托管平台',
  index: '索引或目录',
  indexes: '索引',
  language: '语言',
  load: '加载',
  logs: '日志',
  llm: '大语言模型',
  metrics: '指标',
  mode: '模式',
  mysql: 'MySQL 数据库或客户端命令',
  mysqld: 'MySQL 服务端进程',
  mysqldump: 'MySQL 备份导出工具',
  mysqladmin: 'MySQL 管理命令',
  mysqlbinlog: '查看 MySQL 二进制日志的工具',
  mysqlimport: '导入数据到 MySQL 的工具',
  mysqlshow: '查看 MySQL 数据库对象的工具',
  programs: '程序集合',
  queries: '查询',
  query: '查询',
  retrieve: '检索',
  runbook: '故障处理手册',
  server: '服务端',
  service: '服务',
  slo: '服务等级目标',
  sql: '结构化查询语言',
  table: '表',
  traces: '链路追踪',
  transaction: '事务',
  tutorial: '教程或入门章节',
}

function explainArrowText(line) {
  const cleaned = line
    .replace(/\s*[-+]*>\s*/g, ' -> ')
    .split(/\s*->\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  const terms = []
  const seen = new Set()

  for (const part of cleaned) {
    const matches = part.match(/[A-Za-z][A-Za-z0-9_.-]*(?:\s+[A-Za-z][A-Za-z0-9_.-]*)*/g) ?? []
    for (const match of matches) {
      const term = match.trim()
      const key = term.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        terms.push(term)
      }
    }
  }

  if (terms.length === 0) {
    const subject = cleaned.at(-1) ?? line.trim()
    return `这一行表示上一级主题下的子项“${subject}”。\`->\` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。`
  }

  const definitions = terms.map((term) => {
    const words = term.toLowerCase().replace(/[._-]+/g, ' ').split(/\s+/)
    const known = words
      .filter((word) => textTermGlossary[word])
      .map((word) => `${word}=${textTermGlossary[word]}`)
    const meaning = textTermGlossary[term.toLowerCase()] ?? known.join('，') ?? ''
    return `\`${term}\` 是${meaning || '英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题'}`
  })

  return `这一行要理解这些英文词：${definitions.join('；')}。\`->\` 只是知识地图里的层级符号，不是要学习的概念。`
}

function explainText(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来把示例结构分成更容易阅读的段落。'
  if (trimmed.includes('->')) return explainArrowText(trimmed)
  if (/^[├└│]/.test(trimmed)) return '树形结构行，表示文件、组件或知识点之间的层级关系。'
  if (/^\d+\./.test(trimmed)) return '编号步骤，表示学习或操作时应该按顺序执行。'
  if (/^[-*]\s+/.test(trimmed)) return '列表项，表示一个要点、条件、文件或检查项。'
  if (/^[A-Z_]+=.*/.test(trimmed)) return '环境变量或键值示例，等号左边是名称，右边是要配置的值。'
  return '文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。'
}

function explainLine(line, lang) {
  const normalized = normalizeLang(lang)
  if (['bash', 'sh', 'powershell', 'shell', 'console'].includes(normalized)) {
    return explainCommand(line, normalized)
  }
  if (['yaml', 'yml', 'yaml{2}'].includes(normalized)) return explainYaml(line)
  if (normalized === 'json') return explainJson(line)
  if (normalized === 'sql') return explainSql(line)
  if (normalized === 'python' || normalized === 'py') return explainPython(line)
  if (['markdown', 'md'].includes(normalized)) return explainMarkdown(line)
  if (normalized === 'dockerfile') return explainDockerfile(line)
  if (['ini', 'properties', 'toml'].includes(normalized)) return explainIni(line)
  if (normalized === 'nginx') return explainNginx(line)
  if (['ts', 'tsx', 'js', 'jsx', 'java'].includes(normalized)) {
    return line.trim().startsWith('//')
      ? '注释行，用来说明这段代码的作用。'
      : '代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。'
  }
  if (normalized === 'http') return 'HTTP 报文示例行，用来展示请求方法、路径、头部或返回内容。'
  if (normalized === 'csv') return 'CSV 数据行，逗号分隔的每一列代表一个字段。'
  if (normalized === 'xml') return 'XML 配置或数据行，标签名表示字段或配置节点。'
  return explainText(line)
}

function existingExplanationIsSufficient(lines, fromIndex, expectedRows) {
  for (let i = fromIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (trimmed !== '逐行解释：') return false

    let rows = 0
    for (let j = i + 1; j < lines.length; j++) {
      const row = lines[j].trim()
      if (row === '') {
        if (rows > 0) break
        continue
      }
      if (/^\|\s*第\s+\d+\s+行\s*\|/.test(row)) {
        rows += 1
      }
    }
    return rows >= expectedRows
  }
  return false
}

function buildExplanation(lang, codeLines) {
  const explanation = ['', '逐行解释：', '', '| 行 | 内容 | 说明 |', '|---|---|---|']
  codeLines.forEach((line, index) => {
    explanation.push(
      `| 第 ${index + 1} 行 | ${displayLine(line)} | ${explainLine(line, lang)} |`
    )
  })
  explanation.push('')
  return explanation
}

function annotateFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  const lines = original.split(/\r?\n/)
  const output = []
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    const fence = parseFence(lines[i])
    if (!fence) {
      output.push(lines[i])
      continue
    }

    const lang = fence.lang
    const blockStartOutputIndex = output.length
    output.push(lines[i])
    const codeLines = []
    i += 1

    while (i < lines.length && !isClosingFence(lines[i], fence)) {
      codeLines.push(lines[i])
      output.push(lines[i])
      i += 1
    }

    if (i < lines.length) {
      output.push(lines[i])
    }

    if (
      codeLines.length > 0 &&
      !existingExplanationIsSufficient(lines, i + 1, codeLines.length) &&
      blockStartOutputIndex >= 0
    ) {
      output.push(...buildExplanation(lang, codeLines))
      changed = true
    }
  }

  const updated = output.join('\n')
  if (changed && updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8')
  }
  return changed
}

const files = walkMarkdownFiles(docsRoot)
const changedFiles = files.filter((file) => annotateFile(file))

console.log(`Annotated ${changedFiles.length} file(s).`)
for (const file of changedFiles) {
  console.log(path.relative(repoRoot, file).replaceAll(path.sep, '/'))
}
