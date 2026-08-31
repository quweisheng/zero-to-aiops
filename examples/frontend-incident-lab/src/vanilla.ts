import './style.css'
import { loadIncidents, RequestError } from './api'
import { describeState } from './contracts'
import type { RequestState } from './contracts'

const form = document.querySelector<HTMLFormElement>('#search-form')!
const query = document.querySelector<HTMLInputElement>('#query')!
const mode = document.querySelector<HTMLSelectElement>('#mode')!
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const list = document.querySelector<HTMLUListElement>('#incidents')!
let controller: AbortController | undefined

function render(state: RequestState) {
  status.textContent = describeState(state)
  status.dataset.status = state.status
  cancelButton.disabled = state.status !== 'loading'
  list.replaceChildren()
  if (state.status !== 'success') return
  for (const incident of state.data) {
    const row = document.createElement('li')
    row.dataset.severity = incident.severity
    row.textContent = `${incident.id} · ${incident.service} · ${incident.severity}`
    list.append(row)
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  controller?.abort('superseded')
  const current = new AbortController()
  controller = current
  render({ status: 'loading' })
  try {
    const data = await loadIncidents(query.value, mode.value, current.signal)
    if (controller !== current) return
    render(data.length ? { status: 'success', data } : { status: 'empty' })
  } catch (error) {
    if (controller !== current) return
    render(error instanceof RequestError && error.kind === 'cancelled'
      ? { status: 'cancelled' }
      : { status: 'error', message: error instanceof Error ? error.message : String(error) })
  }
})

cancelButton.addEventListener('click', () => controller?.abort('user'))
window.addEventListener('pagehide', () => controller?.abort('pagehide'))
