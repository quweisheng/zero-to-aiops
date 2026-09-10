import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCohorts, cohortFixture, simulateRunbook } from './lab.mjs';

test('weighted aggregate rises while both cohort rates fall; no causal claim', () => {
  const result = analyzeCohorts(cohortFixture);
  assert.equal(result.windows[0].failurePercent, 1.8);
  assert.equal(result.windows[1].failurePercent, 4.55);
  assert(result.cohorts.every(row => row.afterPercent < row.beforePercent));
  assert.equal(result.causalConclusion, 'NOT_ESTABLISHED');
});
test('missing cohort refuses an incomplete global result', () => {
  assert.deepEqual(analyzeCohorts(cohortFixture.slice(0, 3)).missing, ['after/west']);
  assert.equal(analyzeCohorts(cohortFixture.slice(0, 3)).status, 'INSUFFICIENT_COVERAGE');
});
test('identical batch duplicates do not double-count', () => {
  assert.deepEqual(analyzeCohorts([...cohortFixture, cohortFixture[0]]), analyzeCohorts(cohortFixture));
});
test('conflicting duplicates, impossible counts, and unknown scopes fail closed', () => {
  assert.throws(() => analyzeCohorts([...cohortFixture, { ...cohortFixture[0], failed: 3 }]), /conflicting duplicate/);
  for (const replacement of [{ requests: -1 }, { failed: 99999 }, { failed: -1 }, { cohort: 'other' }]) {
    assert.throws(() => analyzeCohorts([{ ...cohortFixture[0], ...replacement }]));
  }
});
test('lost response reconciles using receipt without a second write', () => {
  const result = simulateRunbook('lost-response');
  assert.equal(result.state, 'CONTROL_STATE_VERIFIED');
  assert.equal(result.writes, 1);
  assert.equal(result.resubmitted, false);
  assert.equal(result.businessHealth, 'NOT_TESTED');
});
test('missing receipt remains unknown despite desired replica count', () => {
  const result = simulateRunbook('lost-receipt');
  assert.equal(result.state, 'WAIT_RECONCILIATION');
  assert.equal(result.replicas, 3);
  assert.equal(result.writes, 1);
  assert.equal(result.resubmitted, false);
});
test('changed approval content or changed resource version forbids a write', () => {
  for (const scenario of ['changed-plan', 'version-drift']) {
    assert.deepEqual(simulateRunbook(scenario), { state: 'REAPPROVAL_REQUIRED', writes: 0, replicas: 2 });
  }
});
