import { describe, expect, it } from 'vitest'

import { searchDocs } from './search'
import type { SearchDocument } from './search'

const sampleIndex: SearchDocument[] = [
  {
    route: '/tech-stack/foundation/linux',
    title: 'Linux 深讲',
    section: '基础工具',
    excerpt: 'CPU 内存 磁盘 网络 服务排障',
    text: 'Linux CPU 内存 磁盘 网络 systemd 排障'
  },
  {
    route: '/tech-stack/observability/prometheus',
    title: 'Prometheus 精讲',
    section: '可观测性',
    excerpt: '指标 抓取 PromQL 告警',
    text: 'Prometheus 指标 抓取 PromQL 告警 AIOps'
  }
]

describe('searchDocs', () => {
  it('returns no results for blank queries', () => {
    expect(searchDocs('   ', sampleIndex)).toEqual([])
  })

  it('finds documents by title and body text', () => {
    expect(searchDocs('promql', sampleIndex).map((result) => result.route)).toEqual([
      '/tech-stack/observability/prometheus'
    ])
  })

  it('ranks title matches before body-only matches', () => {
    expect(searchDocs('linux 排障', sampleIndex)[0].route).toBe(
      '/tech-stack/foundation/linux'
    )
  })
})
