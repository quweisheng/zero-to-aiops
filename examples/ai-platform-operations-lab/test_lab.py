"""Real local tests of the simulation, not tests of a live AI platform."""

import json
import subprocess
import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True

from lab import (Ledger, PayloadConflict, Response, complete_stream, observe_stream,
                 recover_task, run_lab, simulate_agent, simulate_rate_limit)


class RateLimitTests(unittest.TestCase):
    def test_two_429_then_success(self):
        result = simulate_rate_limit([Response(429), Response(429), Response(200)])
        self.assertEqual(result["statuses"], [429, 429, 200])
        self.assertEqual(result["scheduled_delays_seconds"], [1.0, 2.0])
        self.assertEqual(result["outcome"], "completed")

    def test_attempt_budget_no_wait_after_last_attempt(self):
        result = simulate_rate_limit([Response(429)] * 30, max_attempts=3)
        self.assertEqual(result["attempts"], 3)
        self.assertEqual(result["scheduled_delays_seconds"], [1.0, 2.0])
        self.assertEqual(result["outcome"], "stopped_attempt_budget")

    def test_wait_budget(self):
        result = simulate_rate_limit([Response(429)] * 4, budget_seconds=2)
        self.assertEqual(result["outcome"], "stopped_wait_budget")
        self.assertEqual(result["attempts"], 2)
        self.assertEqual(result["virtual_wait_seconds"], 1.0)

    def test_retry_after_is_not_truncated(self):
        result = simulate_rate_limit([Response(429, 30), Response(200)])
        self.assertEqual(result["outcome"], "stopped_retry_after_exceeds_cap")
        self.assertEqual(result["scheduled_delays_seconds"], [])
        self.assertEqual(result["attempts"], 1)

    def test_retry_after_honored_within_cap(self):
        result = simulate_rate_limit([Response(429, 3), Response(200)])
        self.assertEqual(result["scheduled_delays_seconds"], [3])

    def test_non_retryable_does_not_silently_retry(self):
        for status in (401, 403, 500, 503, 999):
            with self.subTest(status=status):
                result = simulate_rate_limit([Response(status), Response(200)])
                self.assertEqual(result["outcome"], "stopped_not_retryable")
                self.assertEqual(result["attempts"], 1)

    def test_no_response_is_unknown_not_success(self):
        self.assertEqual(simulate_rate_limit([])["outcome"], "stopped_no_response")
        result = simulate_rate_limit([Response(429)])
        self.assertEqual(result["outcome"], "stopped_no_response")

    def test_invalid_inputs_rejected(self):
        for arguments in ({"max_attempts": 0}, {"max_attempts": True},
                          {"budget_seconds": -1}, {"budget_seconds": float("nan")},
                          {"base_delay": 0}, {"max_delay": .5}):
            with self.subTest(arguments=arguments), self.assertRaises(ValueError):
                simulate_rate_limit([Response(200)], **arguments)
        with self.assertRaises(ValueError):
            simulate_rate_limit([Response(429, float("inf"))])


class StreamTests(unittest.TestCase):
    def test_complete_stream(self):
        result = observe_stream(complete_stream())
        self.assertEqual(result["outcome"], "completed")
        self.assertEqual(result["partial_text"], "diagnostic summary")

    def test_200_without_completion_is_not_success(self):
        for ending in ([], [{"kind": "disconnect"}], [{"kind": "timeout"}],
                       [{"kind": "error"}]):
            with self.subTest(ending=ending):
                result = observe_stream(complete_stream()[:2] + ending)
                self.assertEqual(result["http_status"], 200)
                self.assertEqual(result["outcome"], "incomplete")
                self.assertFalse(result["completion_marker_seen"])

    def test_unknown_event_stops(self):
        result = observe_stream(complete_stream()[:2] + [{"kind": "unexpected"}])
        self.assertEqual(result["outcome"], "stopped_invalid_event")

    def test_status_and_order_are_validated(self):
        self.assertEqual(observe_stream([{"kind": "http_status", "status": 401}])
                         ["outcome"], "http_failed")
        for events in ([{"kind": "delta", "text": "hello"}],
                       [{"kind": "completed"}],
                       complete_stream() + [{"kind": "delta", "text": "late"}],
                       [{"kind": "http_status", "status": 200}] * 2):
            with self.subTest(events=events):
                self.assertEqual(observe_stream(events)["outcome"], "stopped_invalid_event")

    def test_closed_after_completion_is_complete(self):
        result = observe_stream(complete_stream() + [{"kind": "disconnect"}])
        self.assertEqual(result["outcome"], "completed")


class AgentTests(unittest.TestCase):
    def test_lost_response_recovers_with_same_receipt_once(self):
        result = simulate_agent("lost-response")
        self.assertEqual(result["before_recovery"]["phase"], "pending_write")
        self.assertEqual(result["writes_before_recovery"], 1)
        self.assertEqual(result["recovery"]["outcome"], "completed")
        self.assertEqual(result["recovery"]["decision"], "reuse_receipt")
        self.assertEqual(result["side_effect_writes"], 1)
        self.assertEqual(result["collect_runs"], 1)

    def test_before_write_uses_authoritatively_absent_record(self):
        result = simulate_agent("before-write")
        self.assertEqual(result["writes_before_recovery"], 0)
        self.assertEqual(result["side_effect_writes"], 1)
        self.assertEqual(result["recovery"]["decision"], "apply_after_proven_absent")

    def test_unknown_state_does_not_duplicate_write(self):
        result = simulate_agent("unknown-state")
        self.assertEqual(result["recovery"]["outcome"], "paused_unknown")
        self.assertEqual(result["recovery"]["checkpoint"]["phase"], "pending_write")
        self.assertEqual(result["writes_before_recovery"], 1)
        self.assertEqual(result["side_effect_writes"], 1)

    def test_idempotency_and_payload_conflict(self):
        ledger = Ledger()
        original = ledger.apply("demo-key", {"amount": 1})
        duplicate = ledger.apply("demo-key", {"amount": 1})
        self.assertEqual(original["receipt"], duplicate["receipt"])
        self.assertTrue(duplicate["reused"])
        with self.assertRaises(PayloadConflict):
            ledger.apply("demo-key", {"amount": 2})
        self.assertEqual(ledger.write_count, 1)

    def test_changed_checkpoint_payload_stops(self):
        ledger = Ledger()
        ledger.apply("demo-key", {"amount": 1})
        checkpoint = {"schema_version": 1, "task_id": "demo-task", "phase": "pending_write", "collected": True,
                      "key": "demo-key", "payload": {"amount": 2}}
        result = recover_task(checkpoint, ledger)
        self.assertEqual(result["outcome"], "paused_payload_conflict")
        self.assertEqual(ledger.write_count, 1)

    def test_invalid_checkpoint_stops(self):
        for checkpoint in ([], {}, {"phase": "running"},
                           {"schema_version": True, "task_id": "demo-task", "phase": "pending_write",
                            "collected": True, "key": "demo-key", "payload": {}},
                           {"schema_version": 1, "task_id": "demo-task", "phase": "completed",
                            "collected": True, "key": "demo-key", "payload": {}},
                           {"phase": "pending_write", "collected": True,
                            "key": "", "payload": {}}):
            ledger = Ledger()
            with self.subTest(checkpoint=checkpoint):
                self.assertEqual(recover_task(checkpoint, ledger)["outcome"],
                                 "paused_invalid_checkpoint")
                self.assertEqual(ledger.write_count, 0)

    def test_zero_faults_still_validate_retry_after(self):
        with self.assertRaises(ValueError):
            run_lab(rate_failures=0, retry_after=float("nan"))


class ClassroomTests(unittest.TestCase):
    def test_default_classroom_checks(self):
        result = run_lab()
        self.assertTrue(result["classroom_checks_passed"])
        self.assertEqual(result["network_calls"], 0)
        self.assertEqual(result["persistent_writes"], 0)

    def test_changed_parameters_keep_safety_conditions(self):
        for arguments in ({"rate_failures": 8, "max_attempts": 3},
                          {"budget_seconds": 2}, {"retry_after": 30},
                          {"agent_failure": "unknown-state"},
                          {"agent_failure": "before-write"},
                          {"stream_failure": "timeout"},
                          {"stream_failure": "missing-completed"},
                          {"stream_failure": "unknown-event"}):
            with self.subTest(arguments=arguments):
                self.assertTrue(run_lab(**arguments)["classroom_checks_passed"])

    def test_cli_json_and_invalid_parameter_exit(self):
        command = [sys.executable, "-B", str(Path(__file__).with_name("lab.py"))]
        valid = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(valid.returncode, 0, valid.stderr)
        self.assertTrue(json.loads(valid.stdout)["classroom_checks_passed"])
        for value in ("nan", "inf", "-1"):
            with self.subTest(value=value):
                invalid = subprocess.run(command + ["--budget-seconds", value],
                                         capture_output=True, text=True, check=False)
                self.assertEqual(invalid.returncode, 2)
                self.assertEqual(invalid.stdout, "")


if __name__ == "__main__":
    unittest.main()
