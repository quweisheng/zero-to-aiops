// 只用内置合成数据练判断，不访问网络、不执行生产变更、不写磁盘。
import assert from 'node:assert/strict'

const fault = process.argv.includes('--fault')
const mode = process.argv[2] || 'slo'
const scenarios = {
  slo() {
    const total = 10000
    const bad = fault ? 100 : 5
    const target = 0.999
    const errorRate = bad / total
    return { total, bad, target, successRate: 1 - errorRate,
      burnRate: Number((errorRate / (1 - target)).toFixed(2)),
      decision: errorRate > 1 - target ? 'BUDGET_EXCEEDED' : 'WITHIN_BUDGET' }
  },
  alert() {
    const events = [
      { tenant: 'A', service: 'checkout', dependency: 'db', severity: 'critical' },
      { tenant: 'A', service: 'checkout', dependency: 'db', severity: 'critical' },
      { tenant: 'B', service: 'checkout', dependency: 'db', severity: 'critical' },
      { tenant: 'A', service: 'checkout', dependency: 'db', severity: 'warning' },
    ]
    const groups = new Map()
    for (const event of events) {
      const key = fault ? event.service : [event.tenant, event.service, event.dependency, event.severity].join('/')
      groups.set(key, [...(groups.get(key) || []), event])
    }
    const unsafe = [...groups.values()].some(group => new Set(group.map(event => event.tenant)).size > 1)
    return { inputEvents: events.length, groups: groups.size, unsafeTenantMerge: unsafe,
      decision: unsafe ? 'REJECT_UNSAFE_GROUPING' : 'GROUPING_OK' }
  },
  incident() {
    const timeline = { impact: 0, detection: 4, mitigation: 12, businessVerified: fault ? null : 15 }
    return { timelineMinutes: timeline, detectionMinutes: timeline.detection - timeline.impact,
      recoveryMinutes: timeline.businessVerified === null ? null : timeline.businessVerified - timeline.impact,
      decision: timeline.businessVerified === null ? 'KEEP_INCIDENT_OPEN' : 'BUSINESS_RECOVERY_VERIFIED' }
  },
  rca() {
    const evidence = { changeBeforeFailure: true, connectionWaitIncreased: true,
      unchangedGroupHealthy: !fault, revertOnlyPoolConfigRecovers: !fault }
    const corroborated = evidence.unchangedGroupHealthy && evidence.revertOnlyPoolConfigRecovers
    return { evidence, hypothesis: 'connection pool limit reduced',
      decision: corroborated ? 'SUPPORTED_WITH_LAB_EVIDENCE' : 'INSUFFICIENT_CAUSAL_EVIDENCE' }
  },
  change() {
    const baseline = { requests: 1000, errors: 1 }
    const canary = { requests: 1000, errors: fault ? 60 : 2 }
    const excess = canary.errors / canary.requests - baseline.errors / baseline.requests
    return { baseline, canary, excessErrorRate: excess, stopThreshold: 0.01,
      decision: excess > 0.01 ? 'STOP_AND_EVALUATE_ROLLBACK' : 'CONTINUE_OBSERVATION' }
  },
  runbook() {
    const state = { expectedOwner: 'team-a', actualOwner: fault ? 'team-b' : 'team-a',
      expectedVersion: 3, actualVersion: 3 }
    const seen = new Set()
    let simulatedActions = 0
    const journal = []
    for (const id of ['job-42', 'job-42']) {
      if (seen.has(id)) { journal.push('DUPLICATE_SKIPPED'); continue }
      if (state.expectedOwner !== state.actualOwner || state.expectedVersion !== state.actualVersion) {
        journal.push('PRECONDITION_FAILED'); continue
      }
      seen.add(id)
      simulatedActions++
      journal.push('SIMULATED_ACTION_RECORDED')
    }
    return { state, journal, simulatedActions,
      decision: simulatedActions === 1 ? 'IDEMPOTENT_SIMULATION_OK' : 'BLOCKED_BEFORE_ACTION' }
  },
  aiops() {
    const records = [
      [true, true], [true, true], [true, true], [true, false], [false, true],
      [false, false], [false, false], [false, false], [false, false], [false, false],
    ]
    const tp = records.filter(([truth, predicted]) => truth && predicted).length
    const fp = records.filter(([truth, predicted]) => !truth && predicted).length
    const fn = records.filter(([truth, predicted]) => truth && !predicted).length
    const trainMaxTime = fault ? 12 : 8
    const testMinTime = 10
    return { tp, fp, fn, precision: tp / (tp + fp), recall: tp / (tp + fn),
      trainMaxTime, testMinTime,
      decision: trainMaxTime >= testMinTime ? 'REJECT_TIME_LEAKAGE' : 'EVALUATION_SPLIT_OK' }
  },
  architecture() {
    const peakRps = 600
    const measuredRpsPerReplica = 260
    const safeFraction = 0.65
    const replicas = fault ? 3 : 5
    const survivors = replicas - 1
    const safeRps = survivors * measuredRpsPerReplica * safeFraction
    return { peakRps, measuredRpsPerReplica, safeFraction, replicas, survivors, safeRps,
      requiredWithOneFailure: Math.ceil(peakRps / (measuredRpsPerReplica * safeFraction)) + 1,
      decision: safeRps >= peakRps ? 'ONE_REPLICA_FAILURE_CAPACITY_OK' : 'CAPACITY_SHORTFALL' }
  },
}

const expected = {
  slo: ['WITHIN_BUDGET', 'BUDGET_EXCEEDED'],
  alert: ['GROUPING_OK', 'REJECT_UNSAFE_GROUPING'],
  incident: ['BUSINESS_RECOVERY_VERIFIED', 'KEEP_INCIDENT_OPEN'],
  rca: ['SUPPORTED_WITH_LAB_EVIDENCE', 'INSUFFICIENT_CAUSAL_EVIDENCE'],
  change: ['CONTINUE_OBSERVATION', 'STOP_AND_EVALUATE_ROLLBACK'],
  runbook: ['IDEMPOTENT_SIMULATION_OK', 'BLOCKED_BEFORE_ACTION'],
  aiops: ['EVALUATION_SPLIT_OK', 'REJECT_TIME_LEAKAGE'],
  architecture: ['ONE_REPLICA_FAILURE_CAPACITY_OK', 'CAPACITY_SHORTFALL'],
}

if (!scenarios[mode]) throw new Error(`Unknown lesson: ${mode}. Choose ${Object.keys(scenarios).join(', ')}`)
const result = scenarios[mode]()
assert.equal(result.decision, expected[mode][Number(fault)])
console.log(JSON.stringify({ kind: 'synthetic-classroom-simulation', lesson: mode, fault, ...result }, null, 2))
