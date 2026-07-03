import { describe, expect, it } from 'vitest'

import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, paragraphs, and fenced code', async () => {
    const html = await renderMarkdown(
      '# Linux 深讲\n\n这是一段正文。\n\n```bash\necho hello\n```',
      '/tech-stack/foundation/linux'
    )

    expect(html).toContain('<h1>Linux 深讲</h1>')
    expect(html).toContain('<p>这是一段正文。</p>')
    expect(html).toContain('<code class="language-bash">echo hello')
  })

  it('strips a UTF-8 BOM before rendering the first heading', async () => {
    const html = await renderMarkdown('\uFEFF# Prometheus 精讲\n\n正文。', '/tech-stack/observability/prometheus')

    expect(html).toContain('<h1>Prometheus 精讲</h1>')
    expect(html).not.toContain('﻿# Prometheus 精讲')
  })

  it('rewrites markdown links to app routes', async () => {
    const html = await renderMarkdown(
      '阅读 [写作标准](../writing-standard.md) 和 [外部资料](https://example.com)。',
      '/tech-stack/foundation/linux'
    )

    expect(html).toContain('href="/tech-stack/writing-standard"')
    expect(html).toContain('href="https://example.com"')
  })
})
