import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
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
})
