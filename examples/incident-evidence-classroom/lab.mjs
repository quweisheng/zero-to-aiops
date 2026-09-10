import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// All records are invented classroom aggregates, never real customer telemetry.
export const cohortFixture = [
  { window: 'before', cohort: 'east', requests: 9000, failed: 90 },
  { window: 'before', cohort: 'west', requests: 1000, failed: 90 },
  { window: 'after', cohort: 'east', requests: 1000, failed: 5 },
  { window: 'after', cohort: 'west', requests: 9000, failed: 450 },
];

export function analyzeCohorts(records) {
  const unique = new Map();
  for (const row of records) {
    assert(['before', 'after'].includes(row.window), 'unknown window');
    assert(['east', 'west'].includes(row.cohort), 'unknown cohort');
    assert(Number.isSafeInteger(row.requests) && row.requests > 0, 'invalid requests');
    assert(Number.isSafeInteger(row.failed) && row.failed >= 0 && row.failed <= row.requests, 'invalid failed');
    const key = `${row.window}/${row.cohort}`;
    const normalized = { window: row.window, cohort: row.cohort, requests: row.requests, failed: row.failed };
    if (unique.has(key)) assert.deepEqual(unique.get(key), normalized, 'conflicting duplicate');
    unique.set(key, normalized);
  }
  const missing = ['before/east', 'before/west', 'after/east', 'after/west'].filter(key => !unique.has(key));
  if (missing.length) return { status: 'INSUFFICIENT_COVERAGE', missing, causalConclusion: 'NOT_ESTABLISHED' };
  const windows = ['before', 'after'].map(window => {
    const rows = [...unique.values()].filter(row => row.window === window);
    const requests = rows.reduce((sum, row) => sum + row.requests, 0);
    const failed = rows.reduce((sum, row) => sum + row.failed, 0);
    return { window, requests, failed, failurePercent: 100 * failed / requests };
  });
  const cohorts = ['east', 'west'].map(cohort => ({
    cohort,
    beforePercent: 100 * unique.get(`before/${cohort}`).failed / unique.get(`before/${cohort}`).requests,
    afterPercent: 100 * unique.get(`after/${cohort}`).failed / unique.get(`after/${cohort}`).requests,
  }));
  return { status: 'COMPLETE_FIXTURE', windows, cohorts, causalConclusion: 'NOT_ESTABLISHED' };
}

function digest(plan) {
  // Canonical field order is explicit for this limited teaching schema.
  return createHash('sha256').update(JSON.stringify({
    target: plan.target, expectedVersion: plan.expectedVersion, desiredReplicas: plan.desiredReplicas,
  })).digest('hex');
}

export function simulateRunbook(scenario = 'lost-response') {
  assert(['lost-response', 'lost-receipt', 'changed-plan', 'version-drift'].includes(scenario), 'unknown scenario');
  const plan = { target: 'lab/order-api', expectedVersion: 7, desiredReplicas: 3 };
  const approvedDigest = digest(plan); // A digest binds content, not an identity or signature.
  const provider = { target: 'lab/order-api', version: 7, replicas: 2, writes: 0, receipts: {} };
  const execution = { operationId: 'classroom-operation-42', state: 'APPROVED', plan };
  if (scenario === 'changed-plan') plan.desiredReplicas = 8;
  if (scenario === 'version-drift') provider.version = 8;
  if (digest(plan) !== approvedDigest || provider.target !== plan.target || provider.version !== plan.expectedVersion) {
    return { state: 'REAPPROVAL_REQUIRED', writes: provider.writes, replicas: provider.replicas };
  }
  execution.state = 'SUBMITTED';
  // Model an atomic provider operation, including a queryable receipt.
  provider.replicas = plan.desiredReplicas;
  provider.version += 1;
  provider.writes += 1;
  provider.receipts[execution.operationId] = { planDigest: approvedDigest, outcome: 'APPLIED' };
  execution.state = 'UNKNOWN'; // The reply was lost after the write.
  if (scenario === 'lost-receipt') delete provider.receipts[execution.operationId];
  // Reconstructing independent copies models restart boundaries; this is not disk durability.
  const resumedExecution = JSON.parse(JSON.stringify(execution));
  const resumedProvider = JSON.parse(JSON.stringify(provider));
  const receipt = resumedProvider.receipts[resumedExecution.operationId];
  if (receipt?.planDigest === approvedDigest && receipt.outcome === 'APPLIED') {
    resumedExecution.state = resumedProvider.replicas === plan.desiredReplicas ? 'CONTROL_STATE_VERIFIED' : 'MANUAL_REVIEW';
  } else {
    resumedExecution.state = 'WAIT_RECONCILIATION'; // Desired state alone does not prove who changed it.
  }
  return {
    state: resumedExecution.state,
    writes: resumedProvider.writes,
    replicas: resumedProvider.replicas,
    resubmitted: false,
    businessHealth: 'NOT_TESTED',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, option] = process.argv.slice(2);
  if (mode === 'rca') {
    assert(option === undefined || option === '--missing', 'expected --missing or no option');
    console.log(JSON.stringify(analyzeCohorts(option ? cohortFixture.slice(0, 3) : cohortFixture), null, 2));
  } else if (mode === 'runbook') {
    console.log(JSON.stringify(simulateRunbook(option), null, 2));
  } else {
    throw new Error('Usage: node lab.mjs rca [--missing] | runbook [lost-response|lost-receipt|changed-plan|version-drift]');
  }
}
