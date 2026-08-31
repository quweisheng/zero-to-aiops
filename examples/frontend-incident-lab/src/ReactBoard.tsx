import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { loadIncidents, RequestError } from './api'
import { describeState, modes } from './contracts'
import type { RequestState } from './contracts'

export function ReactBoard() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('normal')
  const [state, setState] = useState<RequestState>({ status: 'idle' })
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => {
    controller.current?.abort('unmounted')
    controller.current = null
  }, [])

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    controller.current?.abort('superseded')
    const current = new AbortController()
    controller.current = current
    setState({ status: 'loading' })
    try {
      const data = await loadIncidents(query, mode, current.signal)
      if (controller.current !== current) return
      setState(data.length ? { status: 'success', data } : { status: 'empty' })
    } catch (error) {
      if (controller.current !== current) return
      setState(error instanceof RequestError && error.kind === 'cancelled'
        ? { status: 'cancelled' }
        : { status: 'error', message: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <main>
      <h1>React 事件看板</h1>
      <p>状态快照驱动页面，用户事件发请求，Effect 只负责卸载清理。</p>
      <form onSubmit={search}>
        <label htmlFor="query">按事件号或服务搜索</label>
        <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="例如 database" />
        <label htmlFor="mode">故障模式</label>
        <select id="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
          {modes.map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}
        </select>
        <div className="actions">
          <button type="submit">查询</button>
          <button type="button" disabled={state.status !== 'loading'} onClick={() => controller.current?.abort('user')}>取消</button>
        </div>
      </form>
      <p role="status" aria-live="polite" data-status={state.status}>{describeState(state)}</p>
      {state.status === 'success' && <ul>{state.data.map((incident) => (
        <li key={incident.id} data-severity={incident.severity}>
          {incident.id} · {incident.service} · {incident.severity}
        </li>
      ))}</ul>}
    </main>
  )
}
