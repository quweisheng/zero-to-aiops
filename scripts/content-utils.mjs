import { relative, sep } from 'node:path'

export const sectionByPrefix = [
  ['/tech-stack/foundation/', '基础工具'],
  ['/tech-stack/observability/', '可观测性'],
  ['/tech-stack/cloud-native/', '云原生'],
  ['/tech-stack/automation/', '自动化'],
  ['/tech-stack/data-ai/', '数据与 AI'],
  ['/tech-stack/sre-aiops/', 'SRE/AIOps 实践'],
  ['/tech-stack', '技术栈'],
  ['/roadmap', '路线'],
  ['/interview', '面试'],
  ['/resources', '开始'],
  ['/', '开始']
]

export function normalizeDocPath(path) {
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

export function normalizeRoute(route) {
  const clean = route
    .replaceAll('\\', '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')

  return clean === '' ? '/' : clean
}

export function docImportPath(rootDir, filePath) {
  const relativePath = relative(rootDir, filePath).split(sep).join('/')
  return `../${relativePath}`
}

export function sectionForRoute(route) {
  return sectionByPrefix.find(([prefix]) =>
    prefix === '/' ? route === '/' : route.startsWith(prefix)
  )?.[1] ?? '文档'
}

export function extractTitle(raw) {
  let inFence = false

  for (const originalLine of raw.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = originalLine.trim()

    if (line.startsWith('```') || line.startsWith('~~~')) {
      inFence = !inFence
      continue
    }

    if (inFence) {
      continue
    }

    const match = line.match(/^#\s+(.+)$/)
    if (match) {
      return match[1].trim()
    }
  }

  return 'Untitled'
}

export function plainTextFromMarkdown(raw) {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerptFromMarkdown(raw, title) {
  const plain = plainTextFromMarkdown(raw).replace(title, '').trim()
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain
}
