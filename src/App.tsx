import { useEffect, useMemo, useState } from 'react'

import { DocPage, getDocByRoute, loadDocByRoute, navGroups, normalizeRoute } from './content'
import { extractMarkdownHeadings, renderMarkdown, type MarkdownHeading } from './markdown'
import { fetchSearchIndex, searchDocs } from './search'
import type { SearchDocument, SearchResult } from './search'

type Theme = 'light' | 'dark'

const featuredRoutes = [
  '/tech-stack/foundation/linux',
  '/tech-stack/foundation/git',
  '/tech-stack/observability/prometheus',
  '/tech-stack/cloud-native/kubernetes',
  '/tech-stack/data-ai/pandas',
  '/tech-stack/sre-aiops/aiops-loop'
]

const workflow = [
  {
    title: '定位差距',
    body: '先看路线和能力地图，知道自己还缺哪块工程能力。'
  },
  {
    title: '动手实验',
    body: '每篇技术栈文章都尽量落到命令、配置、实验和排障。'
  },
  {
    title: '沉淀证据',
    body: '把复盘、项目记录和学习产出放进 GitHub，形成可展示材料。'
  },
  {
    title: '面试表达',
    body: '把运维经验讲成 SRE、DevOps 和 AIOps 的真实项目故事。'
  }
]

export default function App() {
  const [route, setRoute] = useState(getRouteFromLocation)
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    getStorage()?.setItem('zero-to-aiops-theme', theme)
  }, [theme])

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (nextRoute: string) => {
    const normalized = normalizeRoute(nextRoute)
    window.history.pushState({}, '', hrefForRoute(normalized))
    setRoute(normalized)
    scrollToTop()
  }

  const doc = getDocByRoute(route)
  const isHome = route === '/'

  usePointerMotion()
  useRouteMeta(route, doc)

  return (
    <div className="app-shell">
      <div className="cursor-trace" aria-hidden="true" />
      <SiteHeader
        route={route}
        theme={theme}
        onThemeChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onNavigate={navigate}
      />
      {isHome ? (
        <HomePage onNavigate={navigate} />
      ) : doc ? (
        <DocLayout doc={doc} route={route} onNavigate={navigate} />
      ) : (
        <NotFound onNavigate={navigate} />
      )}
    </div>
  )
}

function useRouteMeta(route: string, doc: DocPage | undefined) {
  useEffect(() => {
    const title = doc ? `${doc.title} | To Be Better AIOps Engineer` : 'To Be Better AIOps Engineer'
    const description =
      doc?.excerpt ?? 'AIOps 学习路线、技术栈精讲、面试准备和学习资料'
    const canonicalUrl = canonicalUrlForRoute(route)

    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', doc ? 'article' : 'website', 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('twitter:card', 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setCanonical(canonicalUrl)
  }, [doc, route])
}

interface HeaderProps {
  route: string
  theme: Theme
  onThemeChange: () => void
  onNavigate: (route: string) => void
}

function SiteHeader({ route, theme, onThemeChange, onNavigate }: HeaderProps) {
  const navItems = [
    { text: '学习路线', route: '/roadmap' },
    { text: '技术栈', route: '/tech-stack' },
    { text: '面试', route: '/interview' },
    { text: '资料清单', route: '/resources' }
  ]

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a
          className="brand"
          href={hrefForRoute('/')}
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="To Be Better AIOps Engineer home"
        >
          <span className="brand__mark" aria-hidden="true">
            AI
          </span>
          <span className="brand__text">AIOps Engineer</span>
        </a>

        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <a
              key={item.route}
              href={hrefForRoute(item.route)}
              className={route.startsWith(item.route) ? 'is-active' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(item.route)
              }}
            >
              {item.text}
            </a>
          ))}
        </nav>

        <SearchBox onNavigate={onNavigate} />

        <div className="site-actions">
          <a className="source-pill" href="https://github.com/quweisheng/zero-to-aiops">
            GitHub
          </a>
          <button
            className="theme-button"
            type="button"
            onClick={onThemeChange}
            aria-label="切换颜色主题"
            title="切换颜色主题"
          >
            <span className="theme-button__icon" aria-hidden="true" />
            <span>{theme === 'dark' ? '浅色' : '深色'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function SearchBox({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchDocument[] | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setStatus('idle')
      return
    }

    let cancelled = false

    async function runSearch() {
      try {
        setStatus('loading')
        const nextIndex =
          index ?? (await fetchSearchIndex(`${getBasePath()}search-index.json`))

        if (cancelled) {
          return
        }

        if (!index) {
          setIndex(nextIndex)
        }

        setResults(searchDocs(trimmed, nextIndex))
        setStatus('ready')
      } catch {
        if (!cancelled) {
          setStatus('error')
          setResults([])
        }
      }
    }

    void runSearch()

    return () => {
      cancelled = true
    }
  }, [index, query])

  const hasQuery = query.trim().length > 0

  return (
    <div className="site-search">
      <label className="visually-hidden" htmlFor="site-search-input">
        搜索文章
      </label>
      <input
        id="site-search-input"
        value={query}
        placeholder="搜索文章"
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {hasQuery ? (
        <div className="search-panel" role="status">
          {status === 'loading' ? <p>正在搜索...</p> : null}
          {status === 'error' ? <p>搜索索引加载失败。</p> : null}
          {status === 'ready' && results.length === 0 ? <p>没有找到相关文章。</p> : null}
          {results.length > 0 ? (
            <div className="search-results">
              {results.map((result) => (
                <a
                  key={result.route}
                  href={hrefForRoute(result.route)}
                  onClick={(event) => {
                    event.preventDefault()
                    setQuery('')
                    setResults([])
                    onNavigate(result.route)
                  }}
                >
                  <span>{result.section}</span>
                  <strong>{result.title}</strong>
                  <small>{result.excerpt}</small>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const featuredDocs = featuredRoutes
    .map((route) => getDocByRoute(route))
    .filter((doc): doc is DocPage => Boolean(doc))

  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">AIOps learning wiki</p>
          <h1>To Be Better AIOps Engineer</h1>
          <p className="hero__lead">
            从运维经验出发，用可观测性、自动化、数据分析和 AI 能力解决真实生产问题。
          </p>
          <div className="hero__actions">
            <a
              className="button button--primary"
              href={hrefForRoute('/roadmap')}
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/roadmap')
              }}
            >
              阅读路线
            </a>
            <a
              className="button button--ghost"
              href={hrefForRoute('/tech-stack')}
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/tech-stack')
              }}
            >
              查看技术栈
            </a>
          </div>
        </div>

        <div className="hero__visual" aria-label="AIOps 学习工作台预览">
          <div className="terminal">
            <div className="terminal__bar">
              <span />
              <span />
              <span />
              <strong>zero-to-aiops</strong>
            </div>
            <div className="terminal__body">
              <p>
                <span className="prompt">$</span> learn linux git prometheus
              </p>
              <p className="muted">route: foundation - observability - sre practice</p>
              <p>
                <span className="ok">evidence</span> notes, labs, runbooks, GitHub commits
              </p>
              <p>
                <span className="prompt">$</span> explain incident-response for interview
              </p>
              <p className="muted">output: story, metrics, tradeoffs, next action</p>
            </div>
          </div>
          <div className="signal-grid" aria-hidden="true">
            <span>SLI</span>
            <span>SLO</span>
            <span>RCA</span>
            <span>RAG</span>
          </div>
        </div>
      </section>

      <section className="command-band" aria-labelledby="command-title">
        <div className="section-head section-head--stacked">
          <h2 id="command-title">把学习过程跑起来。</h2>
          <p>用公开仓库记录路线、实验、复盘和面试材料。页面只做一件事：帮你持续前进。</p>
        </div>
        <pre className="command-panel"><code>git clone https://github.com/quweisheng/zero-to-aiops
cd zero-to-aiops
npm install
npm run dev</code></pre>
      </section>

      <section className="knowledge-band" aria-labelledby="knowledge-title">
        <div className="section-head section-head--stacked">
          <h2 id="knowledge-title">从这些入口开始。</h2>
          <p>保留原来的知识结构，把最常用路径放到首页更显眼的位置。</p>
        </div>
        <div className="knowledge-grid">
          {featuredDocs.map((doc, index) => (
            <a
              className={`knowledge-card knowledge-card--${index + 1}`}
              key={doc.route}
              href={hrefForRoute(doc.route)}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(doc.route)
              }}
            >
              <span>{doc.route.split('/')[2] ?? 'start'}</span>
              <strong>{doc.title}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="workflow-band" aria-labelledby="workflow-title">
        <div className="section-head section-head--stacked">
          <h2 id="workflow-title">学习闭环要留下证据。</h2>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

interface DocLayoutProps {
  doc: DocPage
  route: string
  onNavigate: (route: string) => void
}

function DocLayout({ doc, route, onNavigate }: DocLayoutProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [tocItems, setTocItems] = useState<MarkdownHeading[]>([])

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    setTocItems([])

    loadDocByRoute(doc.route).then(async (loadedDoc) => {
      if (!cancelled && loadedDoc) {
        const nextTocItems = extractMarkdownHeadings(loadedDoc.raw)
        const nextHtml = await renderMarkdown(loadedDoc.raw, loadedDoc.route)

        if (cancelled) {
          return
        }

        setTocItems(nextTocItems)
        setHtml(nextHtml)
      }
    })

    return () => {
      cancelled = true
    }
  }, [doc])

  const currentGroup = useMemo(
    () => navGroups.find((group) => group.items.some((item) => item.route === route)),
    [route]
  )

  return (
    <main className="doc-shell">
      <aside className="doc-sidebar">
        <nav aria-label="文档导航">
          {navGroups.map((group) => (
            <section key={group.text} className="doc-nav-group">
              <h2>{group.text}</h2>
              {group.items.map((item) => (
                <a
                  key={item.route}
                  href={hrefForRoute(item.route)}
                  className={item.route === route ? 'is-active' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(item.route)
                  }}
                >
                  {item.text}
                </a>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <article className="doc-content">
        <div className="doc-kicker">{currentGroup?.text ?? '文档'}</div>
        {html ? (
          <div
            className="markdown-body"
            onClick={(event) => handleMarkdownClick(event, onNavigate)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="article-skeleton" aria-label="文章加载中">
            <span />
            <span />
            <span />
          </div>
        )}
      </article>

      <aside className="doc-toc" aria-label="文章目录">
        <div className="doc-toc__inner">
          <div className="doc-toc__label">目录</div>
          {tocItems.length > 0 ? (
            <nav aria-label="文章目录">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  className={`doc-toc__link doc-toc__link--depth-${item.depth}`}
                  href={`#${item.id}`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          ) : (
            <div className="doc-toc__skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </aside>
    </main>
  )
}

function NotFound({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <main className="not-found">
      <h1>页面没有找到</h1>
      <p>这条路径暂时没有对应的知识库文章，可以回到首页重新选择入口。</p>
      <a
        className="button button--primary"
        href={hrefForRoute('/')}
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/')
        }}
      >
        回到首页
      </a>
    </main>
  )
}

function handleMarkdownClick(
  event: React.MouseEvent<HTMLDivElement>,
  onNavigate: (route: string) => void
) {
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const anchor = target.closest('a')
  if (!(anchor instanceof HTMLAnchorElement) || anchor.hash) {
    return
  }

  const route = routeFromHref(anchor.href)
  if (!route || (!getDocByRoute(route) && route !== '/')) {
    return
  }

  event.preventDefault()
  onNavigate(route)
}

function getInitialTheme(): Theme {
  const stored = getStorage()?.getItem('zero-to-aiops-theme')
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function usePointerMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reducedMotion?.matches) {
      return
    }

    const root = document.documentElement
    const requestFrame =
      window.requestAnimationFrame?.bind(window) ??
      ((callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16))
    const cancelFrame = window.cancelAnimationFrame?.bind(window) ?? window.clearTimeout.bind(window)
    const interactiveSelector = 'a, button, input, textarea, select, [role="button"], .button, .theme-button'
    let frame: number | null = null
    let currentX = window.innerWidth * 0.72
    let currentY = window.innerHeight * 0.28
    let targetX = currentX
    let targetY = currentY
    let pointerSpeed = 0

    const applyPosition = () => {
      root.style.setProperty('--pointer-x', `${currentX}px`)
      root.style.setProperty('--pointer-y', `${currentY}px`)
      root.style.setProperty('--pointer-speed', pointerSpeed.toFixed(3))
      root.style.setProperty('--cursor-motion-scale', (1 + pointerSpeed * 0.08).toFixed(3))
    }

    const applyCursorState = (nextX: number, nextY: number, target: EventTarget | null) => {
      const deltaX = nextX - targetX
      const deltaY = nextY - targetY
      const distance = Math.hypot(deltaX, deltaY)
      const targetElement = target instanceof Element ? target : undefined

      if (targetElement?.closest(interactiveSelector)) {
        root.dataset.cursor = 'hover'
      } else {
        delete root.dataset.cursor
      }

      pointerSpeed = Math.max(pointerSpeed, Math.min(distance / 44, 1))
    }

    const followPointer = () => {
      currentX += (targetX - currentX) * 0.16
      currentY += (targetY - currentY) * 0.16
      pointerSpeed *= 0.9
      applyPosition()

      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2 || pointerSpeed > 0.01) {
        frame = requestFrame(followPointer)
      } else {
        frame = null
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      applyCursorState(event.clientX, event.clientY, event.target)
      targetX = event.clientX
      targetY = event.clientY

      if (frame === null) {
        frame = requestFrame(followPointer)
      }
    }

    const onPointerLeave = () => {
      root.dataset.cursor = 'hidden'
    }

    applyPosition()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      if (frame !== null) {
        cancelFrame(frame)
      }
      root.style.removeProperty('--pointer-x')
      root.style.removeProperty('--pointer-y')
      root.style.removeProperty('--pointer-speed')
      root.style.removeProperty('--cursor-motion-scale')
      delete root.dataset.cursor
    }
  }, [])
}

function getStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function getRouteFromLocation(): string {
  return routeFromHref(window.location.href) ?? '/'
}

function routeFromHref(href: string): string | undefined {
  const url = new URL(href, window.location.origin)
  if (url.origin !== window.location.origin) {
    return undefined
  }

  const base = getBasePath()
  const path = url.pathname.startsWith(base)
    ? url.pathname.slice(base.length - 1)
    : url.pathname

  return normalizeRoute(path || '/')
}

function hrefForRoute(route: string): string {
  const normalized = normalizeRoute(route)
  const base = getBasePath()

  if (base === '/') {
    return normalized
  }

  return `${base.replace(/\/$/, '')}${normalized}`
}

function canonicalUrlForRoute(route: string): string {
  const href = hrefForRoute(route)
  const url = new URL(href, window.location.origin)

  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`
  }

  return url.toString()
}

function scrollToTop() {
  try {
    window.scrollTo({ top: 0 })
  } catch {
    // Some non-browser environments expose scrollTo but do not implement it.
  }
}

function getBasePath(): string {
  return import.meta.env.BASE_URL || '/'
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  const selector = `meta[${attribute}="${name}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.append(element)
  }

  element.content = content
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }

  element.href = href
}
