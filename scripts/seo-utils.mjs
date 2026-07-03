export function buildSitemapXml({ siteUrl, routes }) {
  const base = normalizeSiteUrl(siteUrl)
  const uniqueRoutes = [...new Set(routes)].sort((a, b) => a.localeCompare(b))
  const urls = uniqueRoutes
    .map((route) => {
      const loc = routeToCanonicalUrl(base, route)
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

export function routeToCanonicalUrl(siteUrl, route) {
  const base = normalizeSiteUrl(siteUrl)
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean ? `${base}${clean}/` : base
}

export function injectRouteMeta({ html, title, description, canonicalUrl, type = 'article' }) {
  const cleanDescription = description || 'AIOps 学习路线、技术栈精讲、面试准备和学习资料'
  const canonical = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`
  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(cleanDescription)

  let nextHtml = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapedTitle}</title>`
  )

  nextHtml = upsertMeta(nextHtml, 'name', 'description', escapedDescription)
  nextHtml = upsertMeta(nextHtml, 'property', 'og:title', escapedTitle)
  nextHtml = upsertMeta(nextHtml, 'property', 'og:description', escapedDescription)
  nextHtml = upsertMeta(nextHtml, 'property', 'og:type', type)
  nextHtml = upsertMeta(nextHtml, 'property', 'og:url', escapeHtml(canonicalUrl))
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:card', 'summary')
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:title', escapedTitle)
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:description', escapedDescription)

  if (nextHtml.includes('rel="canonical"')) {
    nextHtml = nextHtml.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, canonical)
  } else {
    nextHtml = nextHtml.replace('</head>', `  ${canonical}\n  </head>`)
  }

  return nextHtml
}

function upsertMeta(html, attribute, key, escapedContent) {
  const tag = `<meta ${attribute}="${key}" content="${escapedContent}">`
  const pattern = new RegExp(`<meta\\s+${attribute}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*\\/?>`)

  if (pattern.test(html)) {
    return html.replace(pattern, tag)
  }

  return html.replace('</head>', `  ${tag}\n  </head>`)
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
