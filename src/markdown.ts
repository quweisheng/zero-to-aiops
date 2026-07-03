import { Marked, Renderer } from 'marked'

import { markdownLinkToRoute } from './content'

export async function renderMarkdown(raw: string, currentRoute: string): Promise<string> {
  const renderer = new Renderer()

  renderer.link = function link({ href, title, tokens }) {
    const resolvedHref = markdownLinkToRoute(href, currentRoute)
    const text = this.parser.parseInline(tokens)
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : ''
    const externalAttributes = /^https?:\/\//.test(resolvedHref)
      ? ' target="_blank" rel="noreferrer"'
      : ''

    return `<a href="${escapeHtml(resolvedHref)}"${titleAttribute}${externalAttributes}>${text}</a>`
  }

  const marked = new Marked({ renderer, gfm: true, breaks: false })
  return marked.parse(raw.replace(/^\uFEFF/, ''))
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
