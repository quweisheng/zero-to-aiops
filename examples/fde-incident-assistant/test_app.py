from __future__ import annotations

import unittest

from app import run_scenario


class IncidentAssistantTests(unittest.TestCase):
    def test_normal_case_cites_multiple_sources_and_waits_for_approval(self) -> None:
        result = run_scenario("checkout-error-spike")

        self.assertEqual(result["outcome"], "approval_required")
        self.assertGreaterEqual(len(result["evidence"]), 2)
        self.assertTrue(result["requires_approval"])
        self.assertFalse(result["action_executed"])

    def test_missing_evidence_does_not_invent_root_cause(self) -> None:
        result = run_scenario("insufficient-evidence")

        self.assertEqual(result["outcome"], "insufficient_evidence")
        self.assertLessEqual(result["confidence"], 0.2)
        self.assertFalse(result["action_executed"])

    def test_evidence_timeout_degrades_without_change(self) -> None:
        result = run_scenario("evidence-timeout")

        self.assertEqual(result["outcome"], "degraded")
        self.assertEqual(result["evidence"], [])
        self.assertFalse(result["action_executed"])

    def test_requested_production_rollback_is_never_executed(self) -> None:
        result = run_scenario("unsafe-auto-remediation")

        self.assertTrue(result["requires_approval"])
        self.assertFalse(result["action_executed"])


if __name__ == "__main__":
    unittest.main()
