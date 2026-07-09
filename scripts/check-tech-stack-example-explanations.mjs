import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const docsRoot = path.join(repoRoot, 'docs', 'tech-stack')

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

function nextNonEmptyLine(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      return { index: i, value: lines[i].trim() }
    }
  }
  return undefined
}

function parseFence(line) {
  const match = line.match(/^(`{3,}|~{3,})(.*)$/)
  if (!match) return undefined
  const marker = match[1]
  return {
    char: marker[0],
    length: marker.length,
    lang: (match[2] ?? '').trim().split(/\s+/)[0].toLowerCase(),
  }
}

function isClosingFence(line, fence) {
  const escapedChar = fence.char === '`' ? '`' : '~'
  const match = line.match(new RegExp(`^${escapedChar}{${fence.length},}\\s*$`))
  return Boolean(match)
}

function countExplanationRows(lines, startIndex) {
  let rows = 0
  for (let i = startIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      if (rows > 0) break
      continue
    }
    if (/^\|\s*第\s+\d+\s+行\s*\|/.test(trimmed)) {
      rows += 1
    }
  }
  return rows
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

  if (
    ['text', '', 'md', 'markdown'].includes(lang) &&
    !hasEnglishLike(trimmed) &&
    !/[|/\\{}[\]<>:=]/.test(trimmed)
  ) {
    return false
  }

  return true
}

const failures = []
const bannedExplanationFragments = [
  '流程箭头，表示数据、请求或排障步骤从左边流向右边。',
  '从左边流向右边',
  '文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。',
  '环境变量或键值示例，等号左边是名称，右边是要配置的值。',
]

for (const file of walkMarkdownFiles(docsRoot)) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)

  for (const banned of bannedExplanationFragments) {
    const index = text.indexOf(banned)
    if (index !== -1) {
      failures.push({
        file,
        line: text.slice(0, index).split(/\r?\n/).length,
        reason: `banned generic arrow explanation: ${banned}`,
      })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const fence = parseFence(lines[i])
    if (!fence) continue

    const startLine = i + 1
    const codeLines = []
    i += 1

    while (i < lines.length && !isClosingFence(lines[i], fence)) {
      codeLines.push(lines[i])
      i += 1
    }

    const expectedRows = codeLines.filter((line) => shouldExplainLine(line, fence.lang)).length
    if (expectedRows === 0) continue

    const explanationMarker = nextNonEmptyLine(lines, i + 1)
    if (!explanationMarker || explanationMarker.value !== '逐行解释：') {
      failures.push({
        file,
        line: startLine,
        reason: 'missing 逐行解释 marker after code block',
      })
      continue
    }

    const rowCount = countExplanationRows(lines, explanationMarker.index + 1)
    if (rowCount < expectedRows) {
      failures.push({
        file,
        line: startLine,
        reason: `explanation rows ${rowCount} < explainable lines ${expectedRows}`,
      })
    }
  }
}

if (failures.length > 0) {
  console.error('Tech-stack example explanation check failed:')
  for (const failure of failures.slice(0, 50)) {
    const relative = path.relative(repoRoot, failure.file).replaceAll(path.sep, '/')
    console.error(`- ${relative}:${failure.line} ${failure.reason}`)
  }
  if (failures.length > 50) {
    console.error(`...and ${failures.length - 50} more failure(s).`)
  }
  process.exit(1)
}

console.log('Tech-stack example explanation check passed.')
