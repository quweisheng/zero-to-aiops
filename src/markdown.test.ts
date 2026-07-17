import { describe, expect, it } from 'vitest'

import { extractMarkdownHeadings, renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, paragraphs, and fenced code', async () => {
    const html = await renderMarkdown(
      '# Linux 深讲\n\n这是一段正文。\n\n```bash\necho hello\n```',
      '/tech-stack/foundation/linux'
    )

    expect(html).toContain('<h1 id="linux-深讲">Linux 深讲</h1>')
    expect(html).toContain('<p>这是一段正文。</p>')
    expect(html).toContain('<code class="language-bash">echo hello')
  })

  it('strips a UTF-8 BOM before rendering the first heading', async () => {
    const html = await renderMarkdown('\uFEFF# Prometheus 精讲\n\n正文。', '/tech-stack/observability/prometheus')

    expect(html).toContain('<h1 id="prometheus-精讲">Prometheus 精讲</h1>')
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

  it('wraps markdown tables in a keyboard-scrollable region', async () => {
    const html = await renderMarkdown('| 名称 | 作用 |\n|---|---|\n| zkCli.sh | 连接命令行客户端 |', '/')

    expect(html).toContain('class="markdown-table-scroll"')
    expect(html).toContain('role="region"')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('<table>')
  })

  it('extracts stable h2 and h3 anchors for the article table of contents', () => {
    const headings = extractMarkdownHeadings(
      '# Linux 深讲\n\n## 官方资料\n\n### 内核与系统调用\n\n## 官方资料'
    )

    expect(headings).toEqual([
      { depth: 2, id: '官方资料', text: '官方资料' },
      { depth: 3, id: '内核与系统调用', text: '内核与系统调用' },
      { depth: 2, id: '官方资料-2', text: '官方资料' }
    ])
  })
})
