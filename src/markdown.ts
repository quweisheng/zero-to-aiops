import { Marked, Renderer, type Token, type Tokens } from 'marked'

import { markdownLinkToRoute } from './content'

export interface MarkdownHeading {
  depth: number
  id: string
  text: string
}

export async function renderMarkdown(raw: string, currentRoute: string): Promise<string> {
  const renderer = new Renderer()
  const createHeadingId = createHeadingIdFactory()

  renderer.heading = function heading({ tokens, depth }) {
    const text = textFromInlineTokens(tokens)
    const id = createHeadingId(text)
    const content = this.parser.parseInline(tokens)

    return `<h${depth} id="${escapeHtml(id)}">${content}</h${depth}>`
  }

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
  return marked.parse(stripBom(raw))
}

export function extractMarkdownHeadings(raw: string): MarkdownHeading[] {
  const marked = new Marked({ gfm: true, breaks: false })
  const createHeadingId = createHeadingIdFactory()

  return marked
    .lexer(stripBom(raw))
    .filter(isHeadingToken)
    .filter((token) => token.depth >= 2 && token.depth <= 3)
    .map((token) => {
      const text = textFromInlineTokens(token.tokens)

      return {
        depth: token.depth,
        id: createHeadingId(text),
        text
      }
    })
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '')
}

function createHeadingIdFactory(): (text: string) => string {
  const seen = new Map<string, number>()

  return (text: string) => {
    const base = slugifyHeading(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)

    return count === 0 ? base : `${base}-${count + 1}`
  }
}

function slugifyHeading(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[`*_~()[\]{}<>]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'section'
}

function isHeadingToken(token: Token): token is Tokens.Heading {
  return token.type === 'heading'
}

function textFromInlineTokens(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if ('tokens' in token && Array.isArray(token.tokens)) {
        return textFromInlineTokens(token.tokens)
      }

      if ('text' in token && typeof token.text === 'string') {
        return token.text
      }

      return token.raw ?? ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
