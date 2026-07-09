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

const failures = []

for (const file of walkMarkdownFiles(docsRoot)) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)

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

    if (codeLines.length === 0) continue

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
    if (rowCount < codeLines.length) {
      failures.push({
        file,
        line: startLine,
        reason: `explanation rows ${rowCount} < code lines ${codeLines.length}`,
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
