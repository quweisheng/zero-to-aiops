import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMockApi } from '../mock-api.mjs'
import { loadIncidents } from '../src/api'
import { describeState, parseIncidents } from '../src/contracts'

const server = createMockApi()
let baseUrl = ''

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('missing port')
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

describe('synthetic incident client', () => {
  it('loads and validates the filtered response', async () => {
    const result = await loadIncidents('database', 'normal', new AbortController().signal, baseUrl)
    expect(result).toEqual([{ id: 'INC-1024', service: 'database', severity: 'critical' }])
  })

  it('keeps empty distinct from failure', async () => {
    expect(await loadIncidents('', 'empty', new AbortController().signal, baseUrl)).toEqual([])
    expect(describeState({ status: 'empty' })).toContain('不是系统故障')
  })

  it('rejects HTTP 503 explicitly', async () => {
    await expect(loadIncidents('', 'error', new AbortController().signal, baseUrl)).rejects.toMatchObject({ kind: 'http', message: 'HTTP 503' })
  })

  it('rejects invalid runtime payload despite TypeScript types', async () => {
    await expect(loadIncidents('', 'invalid', new AbortController().signal, baseUrl)).rejects.toMatchObject({ kind: 'contract' })
  })

  it('distinguishes timeout from HTTP failure', async () => {
    await expect(loadIncidents('', 'slow', new AbortController().signal, baseUrl, 25)).rejects.toMatchObject({ kind: 'timeout' })
  })

  it('honors a caller cancellation', async () => {
    const controller = new AbortController()
    const request = loadIncidents('', 'slow', controller.signal, baseUrl)
    controller.abort('test')
    await expect(request).rejects.toMatchObject({ kind: 'cancelled' })
  })

  it('rejects malformed roots and incomplete objects', () => {
    expect(() => parseIncidents({})).toThrow('数组')
    expect(() => parseIncidents([null])).toThrow('对象')
    expect(() => parseIncidents([{ id: 'x' }])).toThrow('契约')
  })
})
