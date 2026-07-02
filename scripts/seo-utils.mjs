export function buildSitemapXml({ siteUrl, routes }) {
  const base = normalizeSiteUrl(siteUrl)
  const uniqueRoutes = [...new Set(routes)].sort((a, b) => a.localeCompare(b))
  const urls = uniqueRoutes
    .map((route) => {
      const loc = `${base}${route === '/' ? '' : route.slice(1)}`
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function buildRobotsTxt(siteUrl) {
  const base = normalizeSiteUrl(siteUrl)
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`
}

export function routeToOutputFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean ? `${clean}/index.html` : 'index.html'
}

export function routeToOutputFiles(route) {
  const indexFile = routeToOutputFile(route)
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean ? [indexFile, `${clean}.html`] : [indexFile]
}

export function injectRouteMeta({ html, title, description, canonicalUrl }) {
  const cleanDescription = description || 'AIOps 学习路线、技术栈精讲、面试准备和学习资料'
  const canonical = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`
  const descriptionMeta = `<meta name="description" content="${escapeHtml(cleanDescription)}">`

  let nextHtml = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  )

  if (nextHtml.includes('name="description"')) {
    nextHtml = nextHtml.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      descriptionMeta
    )
  } else {
    nextHtml = nextHtml.replace('</head>', `  ${descriptionMeta}\n  </head>`)
  }

  if (nextHtml.includes('rel="canonical"')) {
    nextHtml = nextHtml.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, canonical)
  } else {
    nextHtml = nextHtml.replace('</head>', `  ${canonical}\n  </head>`)
  }

  return nextHtml
}

export function normalizeSiteUrl(siteUrl) {
  return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeHtml(value) {
  return escapeXml(value)
}
