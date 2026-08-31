export interface Incident {
  id: string
  service: string
  severity: 'warning' | 'critical'
}

export type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Incident[] }
  | { status: 'empty' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export const modes = [
  { value: 'normal', text: '正常' },
  { value: 'empty', text: '空结果' },
  { value: 'error', text: 'HTTP 503' },
  { value: 'slow', text: '慢响应（4 秒）' },
  { value: 'invalid', text: '非法契约' }
] as const

export function parseIncidents(payload: unknown): Incident[] {
  if (!Array.isArray(payload)) throw new TypeError('根数据必须是数组')
  return payload.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new TypeError('事件必须是对象')
    const value = item as Record<string, unknown>
    if (typeof value.id !== 'string' || typeof value.service !== 'string'
      || (value.severity !== 'warning' && value.severity !== 'critical')) {
      throw new TypeError('事件 id/service/severity 不符合契约')
    }
    return { id: value.id, service: value.service, severity: value.severity }
  })
}

export function describeState(state: RequestState): string {
  switch (state.status) {
    case 'idle': return '尚未查询'
    case 'loading': return '加载中…（2 秒超时，可主动取消）'
    case 'success': return `找到 ${state.data.length} 条事件`
    case 'empty': return '暂无事件，不是系统故障'
    case 'cancelled': return '已取消本次查询'
    case 'error': return `查询失败：${state.message}`
    default: {
      const impossible: never = state
      return impossible
    }
  }
}
