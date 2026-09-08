import assert from 'node:assert/strict'

// 只演示数据语义，不连接或模拟完整的监控产品。
const lesson = process.argv[2]
const fault = process.argv.includes('--fault')
const cases = {
  prometheus() {
    const samples = [0, 3, 7, 1, 4]
    const resetAware = samples.slice(1).reduce((sum, value, index) => sum +
      (value >= samples[index] ? value - samples[index] : value), 0)
    const estimate = fault ? samples.at(-1) - samples[0] : resetAware
    return { samples, resetAware, estimate, issue: estimate !== resetAware }
  },
  grafana() {
    const raw = [0.2, null, 0.8]
    const displayed = fault ? raw.map(value => value ?? 0) : raw
    return { raw, displayed, unit: 'seconds',
      issue: raw.some((value, index) => value === null && displayed[index] === 0) }
  },
  loki() {
    const events = [1, 2, 3, 4].map(id => ({ service: 'checkout', trace_id: `trace-${id}` }))
    const keys = events.map(event => fault ? `${event.service}/${event.trace_id}` : event.service)
    const streams = new Set(keys).size
    return { events: events.length, streams, issue: streams > 1 }
  },
  elasticsearch() {
    const source = 'Payment Timeout'
    const analyzedTokens = source.toLowerCase().split(/\s+/)
    const lookup = fault ? 'Payment' : 'payment'
    return { source, analyzedTokens, lookup, matches: analyzedTokens.includes(lookup),
      issue: !analyzedTokens.includes(lookup) }
  },
  opentelemetry() {
    const spans = [{ traceId: 'trace-a', spanId: 'root', parentId: null },
      { traceId: fault ? 'trace-b' : 'trace-a', spanId: 'child', parentId: 'root' }]
    const broken = spans.filter(span => span.parentId &&
      !spans.some(parent => parent.spanId === span.parentId && parent.traceId === span.traceId))
    return { spans, missingParents: broken.length, issue: broken.length > 0 }
  },
  alertmanager() {
    const event = { service: 'checkout', severity: fault ? 'Critical' : 'critical' }
    const receiver = event.severity === 'critical' ? 'on-call' : 'default-review'
    return { event, receiver, issue: receiver !== 'on-call' }
  },
  zabbix() {
    const sourceSeconds = 0.6
    const thresholdMilliseconds = 500
    const comparedValue = fault ? sourceSeconds : sourceSeconds * 1000
    const problem = comparedValue > thresholdMilliseconds
    return { sourceSeconds, thresholdMilliseconds, comparedValue, problem, issue: !problem }
  },
  victoriametrics() {
    const baseSeries = 10000
    const labelMultiplier = fault ? 1000 : 1
    const scrapeSeconds = 15
    const series = baseSeries * labelMultiplier
    return { baseSeries, labelMultiplier, series, scrapeSeconds,
      samplesPerDay: series * 86400 / scrapeSeconds, issue: series > 100000 }
  },
}

if (!cases[lesson]) throw new Error(`Choose a lesson: ${Object.keys(cases).join(', ')}`)
const result = cases[lesson]()
assert.equal(result.issue, fault)
console.log(JSON.stringify({ kind: 'synthetic-data-semantics', lesson, fault, ...result }, null, 2))
