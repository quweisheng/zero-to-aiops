import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import {
  docImportPath,
  excerptFromMarkdown,
  extractTitle,
  normalizeDocPath,
  plainTextFromMarkdown,
  sectionForRoute
} from './content-utils.mjs'

const rootDir = resolve('.')
const docsDir = resolve('docs')
const generatedPath = resolve('src/generated/content-index.ts')
const searchIndexPath = resolve('public/search-index.json')

const files = await collectMarkdownFiles(docsDir)

const docs = files
  .filter((file) => !file.includes(`${docsDir}\\superpowers\\`) && !file.includes(`${docsDir}/superpowers/`))
  .map(async (file) => {
    const raw = await readFile(file, 'utf8')
    const path = docImportPath(rootDir, file)
    const route = normalizeDocPath(path)
    const title = extractTitle(raw)
    const excerpt = excerptFromMarkdown(raw, title)

    return {
      path,
      route,
      title,
      section: sectionForRoute(route),
      excerpt,
      text: plainTextFromMarkdown(raw)
    }
  })

const contentIndex = (await Promise.all(docs)).sort((a, b) =>
  a.route.localeCompare(b.route, 'zh-CN')
)

await mkdir(dirname(generatedPath), { recursive: true })
await mkdir(dirname(searchIndexPath), { recursive: true })

await writeFile(
  generatedPath,
  `export const generatedDocs = ${JSON.stringify(
    contentIndex.map(({ path, route, title, section, excerpt }) => ({
      path,
      route,
      title,
      section,
      excerpt
    })),
    null,
    2
  )} as const\n`,
  'utf8'
)

await writeFile(
  searchIndexPath,
  `${JSON.stringify(contentIndex, null, 2)}\n`,
  'utf8'
)

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        return collectMarkdownFiles(fullPath)
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : []
    })
  )

  return files.flat()
}
