import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
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

    expect(
      await screen.findByRole('heading', { name: 'Linux 深讲' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: '文档导航' })
    ).toBeInTheDocument()
  })
})
