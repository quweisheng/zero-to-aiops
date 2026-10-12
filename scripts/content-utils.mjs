import { relative, sep } from 'node:path'

export const sectionByPrefix = [
  ['/tech-stack/foundation/', '基础工具'],
  ['/tech-stack/observability/', '可观测性'],
  ['/tech-stack/cloud-native/', '云原生'],
  ['/tech-stack/storage-data-protection/', '存储与数据保护'],
  ['/tech-stack/automation/', '自动化'],
  ['/tech-stack/security-compliance/', '安全与合规'],
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
  let fence

  for (const originalLine of raw.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const marker = originalLine.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && /^[ \t]*$/.test(marker[2])) fence = undefined
      continue
    }
    // A shorter marker, the other fence character, or trailing text cannot close a fence.
    if (marker && (marker[1][0] !== '`' || !marker[2].includes('`'))) {
      fence = { character: marker[1][0], length: marker[1].length }
      continue
    }

    const match = originalLine.match(/^ {0,3}#\s+(.+)$/)
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
