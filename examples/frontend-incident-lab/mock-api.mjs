import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

const incidents = [
  { id: 'INC-1024', service: 'database', severity: 'critical' },
  { id: 'INC-1025', service: 'gateway', severity: 'warning' },
  { id: 'INC-1026', service: 'order-api', severity: 'warning' }
]

// Only synthetic read-only data. No credentials, databases, or production targets.
export function createMockApi() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const send = (status, value) => {
      if (response.destroyed) return
      response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Request-ID': 'frontend-lab-synthetic'
      })
      response.end(JSON.stringify(value))
    }

    if (request.method !== 'GET' || url.pathname !== '/api/incidents') {
      send(404, { message: 'read-only endpoint: GET /api/incidents' })
      return
    }

    const mode = url.searchParams.get('mode') ?? 'normal'
    if (mode === 'error') {
      send(503, { message: 'synthetic dependency unavailable' })
      return
    }
    if (mode === 'invalid') {
      send(200, [{ id: 'INC-BAD', service: null, severity: 'fatal' }])
      return
    }

    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const result = mode === 'empty' ? [] : incidents.filter((incident) =>
      `${incident.id} ${incident.service}`.toLowerCase().includes(query)
    )

    if (mode === 'slow') {
      const timer = setTimeout(() => send(200, result), 4000)
      response.on('close', () => clearTimeout(timer))
    } else {
      send(200, result)
    }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createMockApi()
  server.listen(4188, '127.0.0.1', () => {
    console.log('Synthetic read-only API: http://127.0.0.1:4188/api/incidents')
  })
}
