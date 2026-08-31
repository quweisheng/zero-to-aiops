import { parseIncidents } from './contracts'
import type { Incident } from './contracts'

export class RequestError extends Error {
  constructor(public kind: 'http' | 'timeout' | 'cancelled' | 'contract' | 'network', message: string) {
    super(message)
    this.name = 'RequestError'
  }
}

export async function loadIncidents(
  query: string,
  mode: string,
  signal: AbortSignal,
  baseUrl = '',
  timeoutMs = 2000
): Promise<Incident[]> {
  const controller = new AbortController()
  const cancel = () => controller.abort('cancelled')
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) cancel()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  const params = new URLSearchParams({ q: query, mode })

  try {
    const response = await fetch(`${baseUrl}/api/incidents?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    })
    if (!response.ok) throw new RequestError('http', `HTTP ${response.status}`)
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new RequestError('contract', '响应不是 JSON')
    }
    const payload: unknown = await response.json()
    try {
      return parseIncidents(payload)
    } catch {
      throw new RequestError('contract', '响应数据不符合事件契约')
    }
  } catch (error) {
    if (signal.aborted) throw new RequestError('cancelled', '用户取消或查询已过期')
    if (controller.signal.aborted) throw new RequestError('timeout', '超过 2 秒等待预算')
    if (error instanceof RequestError) throw error
    throw new RequestError('network', '网络连接或响应解析失败')
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
  }
}
