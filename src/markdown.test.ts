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

  it('rewrites markdown links to app routes', async () => {
    const html = await renderMarkdown(
      '阅读 [写作标准](../writing-standard.md) 和 [外部资料](https://example.com)。',
      '/tech-stack/foundation/linux'
    )

    expect(html).toContain('href="/tech-stack/writing-standard"')
    expect(html).toContain('href="https://example.com"')
  })
})
