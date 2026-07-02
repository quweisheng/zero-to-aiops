import { describe, expect, it } from 'vitest'

import {
  buildRobotsTxt,
  buildSitemapXml,
  injectRouteMeta,
  routeToCanonicalUrl,
  routeToOutputFile
} from '../scripts/seo-utils.mjs'

describe('seo utilities', () => {
  it('builds a sitemap with the home route and document routes', () => {
    const xml = buildSitemapXml({
      siteUrl: 'https://quweisheng.github.io/zero-to-aiops/',
      routes: ['/', '/tech-stack/foundation/linux']
    })

    expect(xml).toContain('<loc>https://quweisheng.github.io/zero-to-aiops/</loc>')
    expect(xml).toContain(
      '<loc>https://quweisheng.github.io/zero-to-aiops/tech-stack/foundation/linux/</loc>'
    )
  })

  it('points robots.txt at the generated sitemap', () => {
    expect(buildRobotsTxt('https://quweisheng.github.io/zero-to-aiops/')).toContain(
      'Sitemap: https://quweisheng.github.io/zero-to-aiops/sitemap.xml'
    )
  })

  it('maps routes to nested index files for static fallback pages', () => {
    expect(routeToOutputFile('/')).toBe('index.html')
    expect(routeToOutputFile('/tech-stack/foundation/linux')).toBe(
      'tech-stack/foundation/linux/index.html'
    )
  })

  it('builds canonical directory URLs for static Pages routes', () => {
    expect(routeToCanonicalUrl('https://quweisheng.github.io/zero-to-aiops', '/')).toBe(
      'https://quweisheng.github.io/zero-to-aiops/'
    )
    expect(
      routeToCanonicalUrl(
        'https://quweisheng.github.io/zero-to-aiops/',
        '/tech-stack/foundation/linux'
      )
    ).toBe('https://quweisheng.github.io/zero-to-aiops/tech-stack/foundation/linux/')
  })

  it('injects route-specific title, description, and canonical metadata', () => {
    const html = injectRouteMeta({
      html: '<html><head><title>Old</title></head><body></body></html>',
      title: 'Linux 深讲',
      description: 'Linux CPU 内存 网络排障',
      canonicalUrl: 'https://quweisheng.github.io/zero-to-aiops/tech-stack/foundation/linux/'
    })

    expect(html).toContain('<title>Linux 深讲</title>')
    expect(html).toContain(
      '<meta name="description" content="Linux CPU 内存 网络排障">'
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://quweisheng.github.io/zero-to-aiops/tech-stack/foundation/linux/">'
    )
  })
})
