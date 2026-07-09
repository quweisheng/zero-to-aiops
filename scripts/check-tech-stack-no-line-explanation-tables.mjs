import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const roots = [
  path.join(repoRoot, 'docs', 'tech-stack'),
  path.join(repoRoot, 'docs', 'templates'),
]

function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return []

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

const markerPattern = /^逐行解释[:：]\s*$/m
const failures = []

for (const root of roots) {
  for (const file of walkMarkdownFiles(root)) {
    const text = fs.readFileSync(file, 'utf8')
    const match = markerPattern.exec(text)
    if (!match) continue

    failures.push({
      file,
      line: text.slice(0, match.index).split(/\r?\n/).length,
    })
  }
}

if (failures.length > 0) {
  console.error('Tech-stack line explanation table check failed:')
  for (const failure of failures.slice(0, 50)) {
    const relative = path.relative(repoRoot, failure.file).replaceAll(path.sep, '/')
    console.error(`- ${relative}:${failure.line} remove the generated line explanation table`)
  }
  if (failures.length > 50) {
    console.error(`...and ${failures.length - 50} more failure(s).`)
  }
  process.exit(1)
}

console.log('Tech-stack line explanation table check passed.')
