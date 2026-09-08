import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function run(script, lesson, fault = false) {
  return JSON.parse(execFileSync(process.execPath, [
    resolve('examples/teacher-led-reliability-lab', script), lesson,
    ...(fault ? ['--fault'] : []),
  ], { encoding: 'utf8', timeout: 10000 }))
}

describe('synthetic teacher-led lessons', () => {
  it.each([
    ['slo', 'WITHIN_BUDGET', 'BUDGET_EXCEEDED'],
    ['alert', 'GROUPING_OK', 'REJECT_UNSAFE_GROUPING'],
    ['incident', 'BUSINESS_RECOVERY_VERIFIED', 'KEEP_INCIDENT_OPEN'],
    ['rca', 'SUPPORTED_WITH_LAB_EVIDENCE', 'INSUFFICIENT_CAUSAL_EVIDENCE'],
    ['change', 'CONTINUE_OBSERVATION', 'STOP_AND_EVALUATE_ROLLBACK'],
    ['runbook', 'IDEMPOTENT_SIMULATION_OK', 'BLOCKED_BEFORE_ACTION'],
    ['aiops', 'EVALUATION_SPLIT_OK', 'REJECT_TIME_LEAKAGE'],
    ['architecture', 'ONE_REPLICA_FAILURE_CAPACITY_OK', 'CAPACITY_SHORTFALL'],
  ])('%s distinguishes expected and injected fault decisions', (lesson, normal, fault) => {
    expect(run('lab.mjs', lesson).decision).toBe(normal)
    expect(run('lab.mjs', lesson, true).decision).toBe(fault)
  })

  it.each(['prometheus', 'grafana', 'loki', 'elasticsearch', 'opentelemetry',
    'alertmanager', 'zabbix', 'victoriametrics'])('%s exposes a data-semantics fault', lesson => {
    expect(run('telemetry.mjs', lesson)).toMatchObject({ lesson, fault: false, issue: false })
    expect(run('telemetry.mjs', lesson, true)).toMatchObject({ lesson, fault: true, issue: true })
  })

  it('uses a failure-capacity budget and does not confuse a simulated fault with execution failure', () => {
    const result = run('lab.mjs', 'architecture', true)
    expect(result).toMatchObject({ replicas: 3, safeRps: 338, requiredWithOneFailure: 5 })
    expect(run('telemetry.mjs', 'victoriametrics').samplesPerDay).toBe(57600000)
    expect(run('telemetry.mjs', 'victoriametrics', true).samplesPerDay).toBe(57600000000)
  })
})
