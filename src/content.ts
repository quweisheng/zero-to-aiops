export interface NavItem {
  text: string
  route: string
}

export interface NavGroup {
  text: string
  items: NavItem[]
}

export interface DocPage {
  path: string
  route: string
  title: string
  section: string
  excerpt: string
}

export interface LoadedDocPage extends DocPage {
  raw: string
}

import { generatedDocs } from './generated/content-index'

const docLoaders = import.meta.glob(['../docs/**/*.md', '!../docs/superpowers/**/*.md'], {
  import: 'default',
  query: '?raw'
}) as Record<string, () => Promise<string>>

export const navGroups: NavGroup[] = [
  {
    text: '开始',
    items: [
      { text: '首页', route: '/' },
      { text: '资料清单', route: '/resources' }
    ]
  },
  {
    text: '技术栈',
    items: [
      { text: '总清单', route: '/tech-stack' },
      { text: '精讲写作标准', route: '/tech-stack/writing-standard' },
      { text: '拆分进度', route: '/tech-stack/progress' }
    ]
  },
  {
    text: '基础工具',
    items: [
      { text: 'Linux', route: '/tech-stack/foundation/linux' },
      { text: 'Git', route: '/tech-stack/foundation/git' },
      { text: 'GitHub', route: '/tech-stack/foundation/github' },
      { text: 'Markdown', route: '/tech-stack/foundation/markdown' },
      { text: 'VitePress', route: '/tech-stack/foundation/vitepress' },
      { text: 'Python', route: '/tech-stack/foundation/python' },
      { text: 'Shell / PowerShell', route: '/tech-stack/foundation/shell-powershell' },
      { text: 'systemd', route: '/tech-stack/foundation/systemd' },
      { text: '网络基础', route: '/tech-stack/foundation/networking' }
    ]
  },
  {
    text: '可观测性',
    items: [
      { text: 'Prometheus', route: '/tech-stack/observability/prometheus' },
      { text: 'VictoriaMetrics', route: '/tech-stack/observability/victoriametrics' },
      { text: 'Grafana', route: '/tech-stack/observability/grafana' },
      { text: 'OpenTelemetry', route: '/tech-stack/observability/opentelemetry' },
      { text: 'Alertmanager', route: '/tech-stack/observability/alertmanager' },
      { text: 'Loki', route: '/tech-stack/observability/loki' },
      { text: 'Elasticsearch', route: '/tech-stack/observability/elasticsearch' }
    ]
  },
  {
    text: '云原生',
    items: [
      { text: 'Docker', route: '/tech-stack/cloud-native/docker' },
      { text: 'Docker Compose', route: '/tech-stack/cloud-native/docker-compose' },
      { text: 'Kubernetes', route: '/tech-stack/cloud-native/kubernetes' },
      { text: 'Helm', route: '/tech-stack/cloud-native/helm' },
      { text: 'NGINX / Ingress', route: '/tech-stack/cloud-native/nginx-ingress' },
      { text: '微服务', route: '/tech-stack/cloud-native/microservices' }
    ]
  },
  {
    text: '自动化',
    items: [
      { text: 'Ansible', route: '/tech-stack/automation/ansible' },
      { text: 'Terraform', route: '/tech-stack/automation/terraform' },
      { text: 'GitHub Actions', route: '/tech-stack/automation/github-actions' },
      { text: 'CI/CD', route: '/tech-stack/automation/cicd' },
      { text: 'Runbook Automation', route: '/tech-stack/automation/runbook-automation' }
    ]
  },
  {
    text: '数据与 AI',
    items: [
      { text: 'MySQL / SQL', route: '/tech-stack/data-ai/mysql-sql' },
      { text: 'Oracle Database', route: '/tech-stack/data-ai/oracle' },
      { text: 'PostgreSQL', route: '/tech-stack/data-ai/postgresql' },
      { text: 'Redis', route: '/tech-stack/data-ai/redis' },
      { text: 'Kafka', route: '/tech-stack/data-ai/kafka' },
      { text: 'RabbitMQ', route: '/tech-stack/data-ai/rabbitmq' },
      { text: 'pandas', route: '/tech-stack/data-ai/pandas' },
      { text: '机器学习', route: '/tech-stack/data-ai/machine-learning' },
      { text: 'scikit-learn', route: '/tech-stack/data-ai/scikit-learn' },
      { text: 'FastAPI', route: '/tech-stack/data-ai/fastapi' },
      { text: 'LLM / OpenAI API', route: '/tech-stack/data-ai/llm-openai' },
      { text: 'LangChain', route: '/tech-stack/data-ai/langchain' },
      { text: 'LangGraph', route: '/tech-stack/data-ai/langgraph' },
      { text: 'RAG', route: '/tech-stack/data-ai/rag' },
      { text: '向量数据库', route: '/tech-stack/data-ai/vector-database' }
    ]
  },
  {
    text: 'SRE/AIOps 实践',
    items: [
      { text: 'SLI / SLO / SLA', route: '/tech-stack/sre-aiops/sli-slo-sla' },
      { text: '告警治理', route: '/tech-stack/sre-aiops/alert-governance' },
      { text: '事件响应', route: '/tech-stack/sre-aiops/incident-response' },
      { text: 'Runbook', route: '/tech-stack/sre-aiops/runbook' },
      { text: 'RCA 根因分析', route: '/tech-stack/sre-aiops/rca' },
      { text: '变更管理', route: '/tech-stack/sre-aiops/change-management' },
      { text: 'AIOps 闭环', route: '/tech-stack/sre-aiops/aiops-loop' }
    ]
  },
  {
    text: '路线',
    items: [
      { text: '学习路线', route: '/roadmap' },
      { text: '能力地图', route: '/roadmap/00-skill-map' }
    ]
  },
  {
    text: '面试',
    items: [{ text: '面试准备', route: '/interview' }]
  }
]

export function normalizeDocPath(path: string): string {
  const normalized = path.replaceAll('\\', '/')
  const docsIndex = normalized.lastIndexOf('/docs/')
  const withoutPrefix =
    docsIndex >= 0
      ? normalized.slice(docsIndex + '/docs/'.length)
      : normalized.replace(/^(\.\.\/|\.\/)?docs\//, '')

  const withoutMarkdown = withoutPrefix
    .replace(/(^|\/)index\.md$/i, '')
    .replace(/(^|\/)README\.md$/i, '')
    .replace(/\.md$/i, '')

  return normalizeRoute(`/${withoutMarkdown}`)
}

export function normalizeRoute(route: string): string {
  const clean = route
    .replaceAll('\\', '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')

  return clean === '' ? '/' : clean
}

export function markdownLinkToRoute(href: string, currentRoute = '/'): string {
  if (/^(https?:)?\/\//.test(href) || /^[a-z]+:/i.test(href) || href.startsWith('#')) {
    return href
  }

  const [withoutHash, hash = ''] = href.split('#')
  const hashSuffix = hash ? `#${hash}` : ''

  if (!withoutHash.endsWith('.md')) {
    return href
  }

  if (withoutHash.startsWith('/')) {
    return `${normalizeDocPath(`docs${withoutHash}`)}${hashSuffix}`
  }

  const baseSegments =
    currentRoute === '/'
      ? []
      : normalizeRoute(currentRoute).split('/').filter(Boolean).slice(0, -1)
  const resolvedSegments = [...baseSegments]

  for (const segment of withoutHash.split('/')) {
    if (segment === '' || segment === '.') {
      continue
    }

    if (segment === '..') {
      resolvedSegments.pop()
      continue
    }

    resolvedSegments.push(segment)
  }

  return `${normalizeDocPath(`docs/${resolvedSegments.join('/')}`)}${hashSuffix}`
}

export const docs: DocPage[] = generatedDocs
  .map((doc) => ({
    ...doc
  }))
  .sort((a, b) => a.route.localeCompare(b.route, 'zh-CN'))

export function getDocByRoute(route: string): DocPage | undefined {
  const normalized = normalizeRoute(route)
  return docs.find((doc) => doc.route === normalized)
}

export async function loadDocByRoute(route: string): Promise<LoadedDocPage | undefined> {
  const doc = getDocByRoute(route)
  if (!doc) {
    return undefined
  }

  const loadRaw = docLoaders[doc.path]
  if (!loadRaw) {
    return undefined
  }

  return {
    ...doc,
    raw: await loadRaw()
  }
}
