import { useEffect, useMemo, useState } from 'react'

import { DocPage, getDocByRoute, loadDocByRoute, navGroups, normalizeRoute } from './content'
import { extractMarkdownHeadings, renderMarkdown, type MarkdownHeading } from './markdown'
import { fetchSearchIndex, searchDocs } from './search'
import type { SearchDocument, SearchResult } from './search'

type Theme = 'light' | 'dark'

const backToTopThreshold = 480

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
    body: '先跟老师认识文件、进程、网络和服务，再按能力地图找到自己的起点。'
  },
  {
    title: '动手实验',
    body: '先预测再操作，完成基础实验和故障演练，用实际结果检查自己的理解。'
  },
  {
    title: '沉淀证据',
    body: '把复盘、项目记录和学习产出放进 GitHub，形成可展示材料。'
  },
  {
    title: '面试表达',
    body: '用 30 秒讲概念、3 分钟讲机制，再回答设计取舍；练习与真实经历分开说。'
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
      <BackToTopButton />
    </div>
  )
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(() => window.scrollY >= backToTopThreshold)

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY >= backToTopThreshold)

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })

    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!isVisible) {
    return null
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      onClick={() => scrollToTop(prefersReducedMotion ? 'auto' : 'smooth')}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m6.75 10.75 5.25-5.25 5.25 5.25M12 5.5v13" />
      </svg>
      <span>顶部</span>
    </button>
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
          <p className="eyebrow">AIOps learning wiki · 智能运维学习库</p>
          <h1>To Be Better AIOps Engineer</h1>
          <p className="hero__lead">
            从完全零基础开始，跟老师读懂中文知识地图、做实验、学排障，再练习大厂面试中的机制追问和架构取舍。
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
            <a
              className="button button--ghost"
              href={hrefForRoute('/tech-stack/teaching-coverage')}
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/tech-stack/teaching-coverage')
              }}
            >
              查看精讲复核
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
              <p className="muted">学习过程示意 · 以下不是终端命令</p>
              <p>
                <span className="prompt">1.</span> learn（学习）：Linux、Git、Prometheus
              </p>
              <p className="muted">route（路线）：基础工具 → 可观测性 → 可靠性实践</p>
              <p>
                <span className="ok">evidence（证据）</span>：笔记、实验、操作手册、GitHub 提交
              </p>
              <p>
                <span className="prompt">2.</span> explain（讲解）：一次事件响应的判断过程
              </p>
              <p className="muted">output（输出）：场景、指标、取舍、下一步行动</p>
            </div>
          </div>
          <div className="signal-grid">
            <span>SLI 质量指标</span>
            <span>SLO 质量目标</span>
            <span>RCA 根因分析</span>
            <span>RAG 检索增强生成</span>
          </div>
        </div>
      </section>

      <section className="command-band" aria-labelledby="command-title">
        <div className="section-head section-head--stacked">
          <h2 id="command-title">把学习过程跑起来。</h2>
          <p>先安装 Git 和 Node.js，再在你自己的学习目录打开终端。下面依次下载仓库、进入目录、安装依赖、启动本地网页；按终端显示的地址访问，按 Ctrl+C 停止服务。</p>
        </div>
        <pre className="command-panel"><code>git clone https://github.com/quweisheng/zero-to-aiops
cd zero-to-aiops
npm install
npm run dev</code></pre>
      </section>

      <section className="knowledge-band" aria-labelledby="knowledge-title">
        <div className="section-head section-head--stacked">
          <h2 id="knowledge-title">从这些入口开始。</h2>
          <p>先学习基础工具，再沿指标、日志、自动化和 AI 的业务链逐步深入。不要求你一开始就懂所有缩写，也不把阅读完成当成已经掌握。</p>
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
              <span>{doc.section}</span>
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

    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    if (finePointer && !finePointer.matches) {
      return
    }

    const trace = document.querySelector('.cursor-trace')
    if (!(trace instanceof HTMLElement)) {
      return
    }

    let lastX = Number.NaN
    let lastY = Number.NaN
    let lastSparkAt = 0

    const onPointerMove = (event: PointerEvent) => {
      const now = window.performance.now()
      const deltaX = Number.isNaN(lastX) ? 0 : event.clientX - lastX
      const deltaY = Number.isNaN(lastY) ? 0 : event.clientY - lastY
      const distance = Math.hypot(deltaX, deltaY)

      if (distance < 7 && now - lastSparkAt < 24) {
        return
      }

      lastX = event.clientX
      lastY = event.clientY
      lastSparkAt = now

      const spark = document.createElement('span')
      const direction = distance > 0 ? Math.atan2(deltaY, deltaX) + Math.PI : Math.random() * Math.PI * 2
      const drift = 14 + Math.min(distance, 42) * 0.45
      const scatter = (Math.random() - 0.5) * 18
      const size = 7 + Math.random() * 8

      spark.className = 'cursor-trace__spark'
      spark.style.setProperty('--trail-left', `${event.clientX}px`)
      spark.style.setProperty('--trail-top', `${event.clientY}px`)
      spark.style.setProperty('--trail-size', `${size.toFixed(1)}px`)
      spark.style.setProperty('--trail-dx', `${(Math.cos(direction) * drift + scatter).toFixed(1)}px`)
      spark.style.setProperty('--trail-dy', `${(Math.sin(direction) * drift + scatter * 0.45).toFixed(1)}px`)
      spark.style.setProperty('--trail-rotate', `${(Math.random() * 90 - 45).toFixed(1)}deg`)
      spark.style.setProperty('--trail-duration', `${Math.round(580 + Math.random() * 260)}ms`)
      spark.addEventListener('animationend', () => spark.remove(), { once: true })
      trace.append(spark)
    }

    const clearTrail = () => {
      trace.replaceChildren()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', clearTrail, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', clearTrail)
      clearTrail()
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

function scrollToTop(behavior: ScrollBehavior = 'auto') {
  try {
    window.scrollTo({ top: 0, behavior })
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
