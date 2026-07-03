import { describe, expect, it } from 'vitest'

import { getDocByRoute, loadDocByRoute, markdownLinkToRoute, normalizeDocPath } from './content'

describe('normalizeDocPath', () => {
  it('maps the docs index to the app root', () => {
    expect(normalizeDocPath('../docs/index.md')).toBe('/')
  })

  it('removes docs prefix, README filenames, and markdown extensions', () => {
    expect(normalizeDocPath('../docs/interview/README.md')).toBe('/interview')
    expect(normalizeDocPath('../docs/tech-stack/foundation/linux.md')).toBe(
      '/tech-stack/foundation/linux'
    )
  })
})

describe('markdownLinkToRoute', () => {
  it('leaves absolute, mail, and anchor links untouched', () => {
    expect(markdownLinkToRoute('https://example.com', '/')).toBe(
      'https://example.com'
    )
    expect(markdownLinkToRoute('mailto:test@example.com', '/')).toBe(
      'mailto:test@example.com'
    )
    expect(markdownLinkToRoute('#current', '/')).toBe('#current')
  })

  it('converts same-directory markdown links into routes', () => {
    expect(markdownLinkToRoute('./tech-stack/writing-standard.md', '/')).toBe(
      '/tech-stack/writing-standard'
    )
  })

  it('converts parent-directory README links relative to the current route', () => {
    expect(
      markdownLinkToRoute('../README.md', '/tech-stack/foundation/linux')
    ).toBe('/tech-stack')
  })

  it('keeps anchors after conversion', () => {
    expect(
      markdownLinkToRoute('./roadmap/README.md#学习主线', '/')
    ).toBe('/roadmap#学习主线')
  })
})

describe('getDocByRoute', () => {
  it('returns existing markdown documents by normalized route', () => {
    expect(getDocByRoute('/tech-stack/foundation/linux')?.title).toBe('Linux 深讲')
  })

  it('keeps document metadata lightweight until a page is opened', () => {
    expect(getDocByRoute('/tech-stack/foundation/linux')).not.toHaveProperty('raw')
  })

  it('loads markdown content only for the requested route', async () => {
    const doc = await loadDocByRoute('/tech-stack/foundation/linux')

    expect(doc?.title).toBe('Linux 深讲')
    expect(doc?.raw).toContain('学习目标')
  })

  it('accepts trailing slashes', () => {
    expect(getDocByRoute('/interview/')?.title).toBe('AIOps 面试准备')
  })

  it('reads titles from files that start with a UTF-8 BOM', () => {
    expect(getDocByRoute('/tech-stack/observability/prometheus')?.title).toBe(
      'Prometheus 精讲'
    )
  })

  it('includes the new Microservices and RabbitMQ tech-stack documents', () => {
    expect(getDocByRoute('/tech-stack/cloud-native/microservices')?.title).toBe(
      '微服务深讲'
    )
    expect(getDocByRoute('/tech-stack/data-ai/rabbitmq')?.title).toBe(
      'RabbitMQ 深讲'
    )
  })
})
