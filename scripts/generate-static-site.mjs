import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  buildRobotsTxt,
  buildSitemapXml,
  injectRouteMeta,
  normalizeSiteUrl,
  routeToCanonicalUrl,
  routeToOutputFile
} from './seo-utils.mjs'

const siteUrl = normalizeSiteUrl(
  process.env.SITE_URL || 'https://quweisheng.github.io/zero-to-aiops/'
)
const indexHtmlPath = resolve('dist/index.html')
const indexHtml = await readFile(indexHtmlPath, 'utf8')
const searchIndex = JSON.parse(await readFile(resolve('public/search-index.json'), 'utf8'))

const routes = ['/', ...searchIndex.map((doc) => doc.route)]
const routeMeta = new Map(
  searchIndex.map((doc) => [
    doc.route,
    {
      title: `${doc.title} | To Be Better AIOps Engineer`,
      description: doc.excerpt
    }
  ])
)

routeMeta.set('/', {
  title: 'To Be Better AIOps Engineer',
  description: 'AIOps 学习路线、技术栈精讲、面试准备和学习资料'
})

for (const route of routes) {
  const meta = routeMeta.get(route)
  const html = injectRouteMeta({
    html: indexHtml,
    title: meta.title,
    description: meta.description,
    canonicalUrl: routeToCanonicalUrl(siteUrl, route)
  })
  const outputPath = resolve('dist', routeToOutputFile(route))
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html, 'utf8')
}

await writeFile(
  resolve('dist/sitemap.xml'),
  buildSitemapXml({ siteUrl, routes }),
  'utf8'
)
await writeFile(resolve('dist/robots.txt'), buildRobotsTxt(siteUrl), 'utf8')
await writeFile(resolve('dist/404.html'), await readFile(indexHtmlPath, 'utf8'), 'utf8')
