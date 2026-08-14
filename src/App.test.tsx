import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0
    })
    vi.mocked(window.scrollTo).mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the home experience with primary learning links', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /To Be Better AIOps Engineer/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Linux 深讲/ })).toHaveAttribute(
      'href',
      '/tech-stack/foundation/linux'
    )
  })

  it('renders a markdown article from a direct route', async () => {
    window.history.pushState({}, '', '/tech-stack/foundation/linux')

    render(<App />)

    expect(screen.getByLabelText('文章加载中')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Linux 深讲' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: '文档导航' })
    ).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: '文章目录' })
    expect(within(toc).getByRole('link', { name: '官方资料' })).toHaveAttribute(
      'href',
      '#官方资料'
    )
    expect(document.title).toBe('Linux 深讲 | To Be Better AIOps Engineer')
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://localhost:3000/tech-stack/foundation/linux/'
    )
  })

  it('loads the search index on demand and navigates to a result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            route: '/tech-stack/observability/prometheus',
            title: 'Prometheus 精讲',
            section: '可观测性',
            excerpt: '指标 抓取 PromQL 告警',
            text: 'Prometheus 指标 抓取 PromQL 告警 AIOps'
          }
        ]
      }))
    )

    render(<App />)

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'promql' }
    })

    const searchPanel = await screen.findByRole('status')
    const result = await within(searchPanel).findByRole('link', { name: /Prometheus 精讲/ })
    expect(fetch).toHaveBeenCalledWith('/search-index.json')

    fireEvent.click(result)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/tech-stack/observability/prometheus')
    })
    expect(screen.getByLabelText('搜索文章')).toHaveValue('')
  })

  it('shows a back-to-top button after scrolling and scrolls smoothly', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: '回到顶部' })).not.toBeInTheDocument()

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 600
    })
    fireEvent.scroll(window)

    fireEvent.click(screen.getByRole('button', { name: '回到顶部' }))

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0
    })
    fireEvent.scroll(window)

    expect(screen.queryByRole('button', { name: '回到顶部' })).not.toBeInTheDocument()
  })

  it('respects reduced-motion preferences when returning to the top', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    )

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 600
    })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '回到顶部' }))

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })
})
