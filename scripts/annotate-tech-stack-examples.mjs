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

function hasChinese(value) {
  return /\p{Script=Han}/u.test(value)
}

function hasEnglishLike(value) {
  return /[A-Za-z][A-Za-z0-9_.-]*/.test(value)
}

function isChineseOnlyTextLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (hasEnglishLike(trimmed)) return false
  if (/[\w.-]+\s*[:=]/.test(trimmed)) return false
  if (/^[|v^/\\+\-├└│]/.test(trimmed)) return false
  return hasChinese(trimmed)
}

function shouldExplainLine(line, lang) {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (isChineseOnlyTextLine(trimmed)) return false
  const normalized = normalizeLang(lang)

  if (
    ['text', '', 'md', 'markdown'].includes(normalized) &&
    !hasEnglishLike(trimmed) &&
    !/[|/\\{}[\]<>:=]/.test(trimmed)
  ) {
    return false
  }

  return true
}

function splitIdentifier(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_./:-]+/g, ' ')
    .split(/\s+|-/)
    .map((part) => part.trim())
    .filter(Boolean)
}

const fieldGlossary = {
  alert: '告警',
  alert_name: '告警名称字段',
  alert_count: '告警数量',
  alertname: '告警名称字段',
  annotations: '告警补充说明字段',
  api: '应用程序接口',
  app: '应用或服务',
  application: '应用系统',
  addresses: '地址列表',
  ansible_connection: 'Ansible 连接方式字段',
  ansible_host: 'Ansible 要连接的目标主机地址字段',
  ansible_port: 'Ansible SSH 端口字段',
  ansible_ssh_private_key_file: 'Ansible SSH 私钥路径字段',
  ansible_user: 'Ansible 登录用户字段',
  batch: '批处理',
  become: '是否提权执行的配置项',
  become_method: '提权方式配置项',
  client: '客户端',
  cluster: '集群名称字段',
  common: '常见或通用内容',
  connect: '连接',
  connection: '连接方式',
  control: '控制端',
  controller: '控制器',
  critical: '严重级别',
  database: '数据库名称字段',
  db: '数据库',
  duration: '持续时间字段',
  endpoint: '后端地址端点',
  endpointslice: 'Kubernetes 中保存后端 Pod 地址的资源',
  environment: '环境名称字段',
  error: '错误',
  error_rate: '错误率字段',
  event_id: '事件唯一编号字段',
  expected_sections: '期望命中的知识片段字段',
  fastapi: 'Python Web API 框架',
  firing: '告警正在触发的状态',
  group: '分组',
  group_by: '告警分组字段',
  high: '高',
  host: '主机',
  host_key_checking: '是否检查 SSH 主机指纹的配置项',
  ic: 'Incident Commander，故障指挥官',
  index: '索引或目录',
  ingress: 'Kubernetes 入口规则',
  incident: '线上故障或事件',
  instance: '实例名称字段',
  labels: '标签字段，用来标识告警或指标身份',
  listener: '监听器',
  localhost: '本机地址',
  mapping: '字段映射规则',
  matchers: '匹配条件',
  name: '名称字段',
  node: '节点',
  ol: 'Operations Lead，排障执行负责人',
  order: '订单',
  page: '需要立即通知值班人员的告警级别',
  path: '路径',
  payload: '请求或通知正文',
  pod: 'Kubernetes 里运行容器的最小调度单元',
  port: '端口',
  prod: '生产环境',
  production: '生产环境',
  prometheus: '指标采集和告警规则评估系统',
  proxy_pass: 'NGINX 转发到后端服务的配置项',
  query: '查询',
  rate: '比率',
  receiver: '告警接收人或接收渠道',
  recap: 'Ansible 执行结果汇总',
  retry_files_enabled: '是否生成 Ansible 重试文件的配置项',
  route: '路由规则',
  runbook: '故障处理手册',
  runbook_url: '故障处理手册链接字段',
  scrape_interval: 'Prometheus 抓取指标的时间间隔字段',
  service: '服务名称字段',
  service_name: '服务名称字段',
  sev1: '一级故障，通常代表最高优先级',
  sev2: '二级故障，通常代表较高优先级',
  sev3: '三级故障，通常代表较低优先级',
  severity: '告警严重级别字段',
  silence: '告警静默规则',
  slo: '服务等级目标',
  started_at: '告警开始时间字段',
  status: '状态字段',
  stdout_callback: 'Ansible 输出格式配置项',
  summary: '摘要说明字段',
  symptom: '故障现象字段',
  timeout: '超时时间字段',
  tutorial: '教程或入门章节',
  upstream: '上游后端服务',
  user: '用户',
  value: '数值字段',
  webhook: '通过 HTTP 回调接收通知的接口',
  worker: '工作进程',
  '5xx': 'HTTP 5xx 服务端错误，表示请求到达服务端但服务端处理失败',
}

const valueGlossary = {
  critical: '严重级别，通常表示需要优先处理',
  local: '本地连接，表示不通过 SSH 连接远程机器',
  page: '需要立即通知值班人员的告警级别',
  prod: '生产环境',
  production: '生产环境',
  true: '开启这个配置',
  false: '关闭这个配置',
  ubuntu: '登录用户示例，真实环境要换成自己的服务器用户',
  yaml: 'YAML 格式输出，便于阅读结构化结果',
}

function describeIdentifier(value) {
  const cleaned = value.replace(/^["'`]+|["'`,;]+$/g, '')
  const lower = cleaned.toLowerCase()
  const compact = lower.replace(/[^a-z0-9]/g, '')

  if (compact.includes('higherrorrate')) {
    return `${cleaned} 是高错误率告警名，通常表示某个服务的请求失败比例超过阈值`
  }

  if (compact.includes('highlatency')) {
    return `${cleaned} 是高延迟告警名，通常表示请求耗时超过阈值`
  }

  if (compact.includes('orderapi')) {
    return `${cleaned} 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务`
  }

  if (/^\dxx$/.test(lower)) {
    return fieldGlossary[lower] ?? `${cleaned} 表示一类 HTTP 状态码`
  }

  if (fieldGlossary[lower]) return fieldGlossary[lower]
  if (valueGlossary[lower]) return valueGlossary[lower]

  const parts = splitIdentifier(cleaned)
  const knownParts = parts
    .map((part) => {
      const key = part.toLowerCase()
      return fieldGlossary[key] ?? valueGlossary[key]
    })
    .filter(Boolean)

  if (knownParts.length > 0) {
    return `${cleaned} 这个英文标识可以拆开理解为：${knownParts.join('，')}`
  }

  if (/^[A-Z][A-Za-z0-9]+$/.test(cleaned)) {
    return `${cleaned} 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源`
  }

  return `${cleaned} 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值`
}

function describeValue(key, rawValue) {
  const value = rawValue.replace(/[,;]$/g, '').replace(/^["'`]+|["'`]+$/g, '')
  const lower = value.toLowerCase()
  const keyLower = key.toLowerCase()
  const compact = lower.replace(/[^a-z0-9]/g, '')

  if (valueGlossary[lower]) return valueGlossary[lower]
  if (compact.includes('higherrorrate')) return `${value} 是高错误率告警名，表示请求失败比例过高`
  if (compact.includes('highlatency')) return `${value} 是高延迟告警名，表示请求耗时过高`
  if (/^\dxx$/.test(lower)) return `${value} 表示 HTTP ${value} 服务端错误类别`
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return '具体时间值，表示事件、告警或记录发生的时间点'
  if (/^\d+(\.\d+)?m$/.test(value)) return '持续分钟数，常用于表示故障已经持续多久'
  if (/^\d+(\.\d+)?s$/.test(value)) return '持续秒数，常用于配置采集间隔、超时时间或等待时间'
  if (/^\d+(\.\d+)?%$/.test(value)) return '百分比，常用于错误率、影响面或资源使用率'
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return 'IP 地址，表示一台机器或服务端点的位置'
  if (/^\d+$/.test(value) && /port/.test(keyLower)) return '端口号，表示服务监听或连接入口'
  if (/^https?:\/\//.test(value)) return 'URL 地址，表示页面、接口或文档入口'
  if (/^[\w.-]+\/[\w./*-]+$/.test(value)) return '路径值，表示文件、目录或接口路径'
  if (keyLower === 'service' || keyLower === 'service_name') return `${value} 是具体服务名，表示这条记录属于这个服务`
  if (keyLower === 'alertname') return `${value} 是具体告警名，表示触发的是哪一种告警规则`
  if (keyLower === 'severity') return `${value} 是告警级别，用来决定响应优先级`
  if (keyLower === 'database') return `${value} 是具体数据库实例或库名`
  if (keyLower === 'cluster') return `${value} 是具体集群名或环境名`
  if (keyLower === 'instance') return `${value} 是具体实例名，常用来定位哪台机器或哪个 Pod 出问题`
  if (keyLower === 'symptom') return `${value} 是故障现象，描述用户或系统看到的问题`

  if (hasChinese(value) && !hasEnglishLike(value)) return `${value} 是这个字段的中文取值，已经直接说明了含义`
  return `${value} 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值`
}

function formatIdentifierMeaning(term) {
  const description = describeIdentifier(term)
  if (
    description.startsWith(`${term} 是`) ||
    description.startsWith(`${term} 表示`) ||
    description.startsWith(`${term} 里的`) ||
    description.startsWith(`${term} 这个`)
  ) {
    return `\`${term}\` ${description.slice(term.length).trim()}`
  }
  return `\`${term}\` 是${description}`
}

function formatValueMeaning(key, rawValue) {
  const value = rawValue.replace(/[,;]$/g, '').replace(/^["'`]+|["'`]+$/g, '')
  const description = describeValue(key, rawValue)
  if (
    description.startsWith(`${value} 是`) ||
    description.startsWith(`${value} 表示`) ||
    description.startsWith(`${value} 里的`) ||
    description.startsWith(`${value} 这个`)
  ) {
    return `\`${value}\` ${description.slice(value.length).trim()}`
  }
  return `\`${value}\` 表示${description}`
}

function describeKeyValuePair(key, value) {
  return `${formatIdentifierMeaning(key)}，${formatValueMeaning(key, value)}`
}

function extractKeyValuePairs(line) {
  const pairs = []
  const occupied = []
  const datetimePattern =
    /([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*([0-9]{4}-[0-9]{2}-[0-9]{2}(?:[ T][0-9]{2}:[0-9]{2}:[0-9]{2}Z?)?)/g
  let datetimeMatch
  while ((datetimeMatch = datetimePattern.exec(line)) !== null) {
    pairs.push({ key: datetimeMatch[1], value: datetimeMatch[2] })
    occupied.push([datetimeMatch.index, datetimePattern.lastIndex])
  }

  const keyValuePattern = /([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s,;]+)/g
  let match
  while ((match = keyValuePattern.exec(line)) !== null) {
    if (occupied.some(([start, end]) => match.index >= start && match.index < end)) continue
    pairs.push({ key: match[1], value: match[2] })
  }
  return pairs
}

function explainKeyValueText(line) {
  const pairs = extractKeyValuePairs(line)
  const pieces = []
  const first = line.trim().split(/\s+/)[0]

  if (pairs.length > 0 && first && !first.includes('=') && !first.includes(':') && /^[A-Za-z0-9_.-]+$/.test(first)) {
    pieces.push(`\`${first}\` 是主机、服务、告警或资源的示例名称`)
  }

  for (const pair of pairs) {
    pieces.push(describeKeyValuePair(pair.key, pair.value))
  }

  return pieces.join('；') + '。'
}

function explainColonText(line) {
  const trimmed = line.trim()
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_. -]*):\s*(.*)$/)
  if (!match) return undefined
  const key = match[1].trim()
  const value = match[2].trim()
  if (!value) {
    return `\`${key}\` 是${describeIdentifier(key)}，冒号表示后面要填写或列出这个字段的具体内容。`
  }
  return `\`${key}\` 是${describeIdentifier(key)}，冒号后面的 \`${value}\` 是这个字段的示例内容或模板表达式。`
}

function explainUrl(line) {
  const trimmed = line.trim()
  const match = trimmed.match(/^(https?):\/\/([^/\s]+)(\/[^\s]*)?$/)
  if (!match) return undefined
  const [, scheme, host, urlPath = '/'] = match
  return `\`${scheme}\` 表示访问协议，\`${host}\` 是域名或主机名，\`${urlPath}\` 是具体接口路径；真实环境要换成自己的域名和路径。`
}

function explainPathLike(line) {
  const trimmed = line.trim()
  if (!/[/\\.]|\*$/.test(trimmed)) return undefined
  if (trimmed === '|' || trimmed === 'v') return undefined
  const type = trimmed.endsWith('/') ? '目录' : '文件、目录、接口路径或匹配模式'
  return `\`${trimmed}\` 是${type}示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。`
}

function extractEnglishTerms(line) {
  const rawTerms = line.match(/(?:\dxx|[A-Za-z][A-Za-z0-9_.-]*)(?:\s+(?:\dxx|[A-Za-z][A-Za-z0-9_.-]*))*/g) ?? []
  const terms = []
  const seen = new Set()

  for (const raw of rawTerms) {
    for (const term of raw.split(/\s{2,}/)) {
      const cleaned = term.trim().replace(/^["'`[{(]+|["'`,;:.)\]}]+$/g, '')
      if (!cleaned || /^\d+$/.test(cleaned)) continue
      const key = cleaned.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        terms.push(cleaned)
      }
    }
  }

  return terms
}

function explainEnglishTerms(line) {
  const terms = extractEnglishTerms(line)
  if (terms.length === 0) return undefined
  const explanations = terms.slice(0, 8).map((term) => formatIdentifierMeaning(term))
  return `这一行里的英文要这样读：${explanations.join('；')}。`
}

function explainCommand(line, lang) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来把命令分成更容易阅读的几段。'
  if (commentPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return '注释行，提前说明下面命令的目的或注意事项。'
  }

  if (/^-d\s+/.test(trimmed) || /^--data/.test(trimmed)) {
    const jsonMatch = trimmed.match(/(['"])(\{.*\})\1/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[2])
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const pairs = Object.entries(parsed)
            .slice(0, 8)
            .map(([key, value]) => describeKeyValuePair(key, JSON.stringify(value)))
          return `\`-d\` 是 curl 的请求体参数，用来把 JSON 数据发送给接口；这里的字段含义是：${pairs.join('；')}。`
        }
      } catch {
        return '`-d` 是 curl 的请求体参数，用来把后面的文本作为 HTTP 请求正文发送给接口。'
      }
    }
    return '`-d` 是 curl 的请求体参数，用来把后面的文本作为 HTTP 请求正文发送给接口。'
  }

  if (/^-H\s+/.test(trimmed) || /^--header/.test(trimmed)) {
    return '`-H` 是 curl 的请求头参数，用来设置 Content-Type、鉴权信息或其他 HTTP 头。'
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
  if (/\s[|&]{1,2}\s/.test(trimmed)) {
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
    return `${describeKeyValuePair(key, value)}；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。`
  }

  return '配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。'
}

function explainJson(line) {
  const trimmed = line.trim()
  if (!trimmed) return '空行，用来提升 JSON 可读性。'
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const pairs = Object.entries(parsed)
          .slice(0, 8)
          .map(([key, value]) => describeKeyValuePair(key, JSON.stringify(value)))
        if (pairs.length > 0) return pairs.join('；') + '。'
      }
    } catch {
      // Fall through to structural JSON explanations.
    }
  }
  if (trimmed === '{') return '对象开始，表示下面是一组键值对配置。'
  if (trimmed === '}') return '对象结束，表示这一组键值对配置到这里结束。'
  if (trimmed === '[') return '数组开始，表示下面会列出多个同类值或对象。'
  if (trimmed === ']') return '数组结束，表示同类值或对象列表到这里结束。'
  if (trimmed === '},' || trimmed === '}' || trimmed === '],') return '当前对象或数组结束，逗号表示后面还有同级项目。'

  const match = trimmed.match(/^"([^"]+)"\s*:\s*(.*?)(,)?$/)
  if (match) {
    return `${describeKeyValuePair(match[1], match[2])}；真实环境要根据自己的告警、服务或接口返回调整。`
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
  const dictPair = trimmed.match(/^["']([^"']+)["']\s*:\s*(.+?)(,)?$/)
  if (dictPair) {
    return `${describeKeyValuePair(dictPair[1], dictPair[2])}；这是 Python 字典里的一个键值对。`
  }
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
  if (trimmed.startsWith('#')) {
    const terms = explainEnglishTerms(trimmed.replace(/^#+\s*/, ''))
    return terms ?? 'Markdown 标题行，用来组织文档层级。'
  }
  if (trimmed.startsWith('- ')) {
    const item = trimmed.replace(/^-\s+/, '')
    if (extractKeyValuePairs(item).length > 0) return explainKeyValueText(item)
    const colonExplanation = explainColonText(item)
    if (colonExplanation) return colonExplanation
    const terms = explainEnglishTerms(item)
    return terms ?? 'Markdown 列表项，用来列出步骤、要点或证据清单。'
  }
  if (trimmed.startsWith('|')) {
    const terms = explainEnglishTerms(trimmed)
    return terms ?? 'Markdown 表格行，用来对齐展示字段和说明。'
  }
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
    return `${describeKeyValuePair(key.trim(), (value ?? '').trim())}；真实环境按自己的路径、账号或服务参数调整。`
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
  if (isChineseOnlyTextLine(trimmed)) return '中文内容已经直接表达含义，不需要额外拆解英文术语。'
  if (trimmed.includes('->')) return explainArrowText(trimmed)

  const urlExplanation = explainUrl(trimmed)
  if (urlExplanation) return urlExplanation

  if (extractKeyValuePairs(trimmed).length > 0) return explainKeyValueText(trimmed)

  const colonExplanation = explainColonText(trimmed)
  if (colonExplanation) return colonExplanation

  const pathExplanation = explainPathLike(trimmed)
  if (pathExplanation) return pathExplanation

  if (/^[├└│]/.test(trimmed)) {
    return '树形结构符号，表示这一行和上一层目录、文件或组件存在层级关系。'
  }

  if (/^\|+$/.test(trimmed) || trimmed === 'v' || trimmed === '^') {
    return 'ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。'
  }

  if (/^\d+\./.test(trimmed)) {
    const withoutNumber = trimmed.replace(/^\d+\.\s*/, '')
    const terms = explainEnglishTerms(withoutNumber)
    return terms ?? '编号步骤，表示学习或操作时应该按顺序执行。'
  }

  if (/^[-*]\s+/.test(trimmed)) {
    const withoutBullet = trimmed.replace(/^[-*]\s+/, '')
    const terms = explainEnglishTerms(withoutBullet)
    return terms ?? '列表项，表示一个要点、条件、文件或检查项。'
  }

  const terms = explainEnglishTerms(trimmed)
  if (terms) return terms

  return '这一行是符号、路径或状态片段，需要结合上下文确认它连接的是哪个组件、文件或排障证据。'
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

function buildExplanation(lang, codeLines) {
  const rows = []
  codeLines.forEach((line, index) => {
    if (!shouldExplainLine(line, lang)) return
    rows.push(`| 第 ${index + 1} 行 | ${displayLine(line)} | ${explainLine(line, lang)} |`)
  })

  if (rows.length === 0) return []

  const explanation = ['', '逐行解释：', '', '| 行 | 内容 | 说明 |', '|---|---|---|']
  explanation.push(...rows)
  explanation.push('')
  return explanation
}

function findExistingExplanationStart(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    return trimmed === '逐行解释：' ? i : undefined
  }
  return undefined
}

function skipExistingExplanation(lines, markerIndex) {
  let i = markerIndex + 1

  while (i < lines.length && lines[i].trim() === '') {
    i += 1
  }

  if (i < lines.length && lines[i].trim().startsWith('|')) {
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      i += 1
    }
  }

  while (i < lines.length && lines[i].trim() === '') {
    i += 1
  }

  return i
}

function annotateFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  const lines = original.split(/\r?\n/)
  const output = []
  let changed = false

  for (let i = 0; i < lines.length; ) {
    const fence = parseFence(lines[i])
    if (!fence) {
      output.push(lines[i])
      i += 1
      continue
    }

    const lang = fence.lang
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
      i += 1
    }

    const explanationStart = findExistingExplanationStart(lines, i)
    if (explanationStart !== undefined) {
      i = skipExistingExplanation(lines, explanationStart)
      changed = true
    }

    const explanation = buildExplanation(lang, codeLines)
    if (explanation.length > 0) {
      output.push(...explanation)
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
