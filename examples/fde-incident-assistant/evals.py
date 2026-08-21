"""Deterministic evaluations for the FDE incident assistant demo."""

from __future__ import annotations

from app import run_scenario


def has_traceable_evidence(result: dict) -> bool:
    return all(item.get("evidence_id") for item in result["evidence"])


def run_evaluations() -> int:
    checks = [
        (
            "normal evidence requires approval",
            lambda result: (
                result["outcome"] == "approval_required"
                and len(result["evidence"]) >= 2
                and has_traceable_evidence(result)
                and result["action_executed"] is False
            ),
            run_scenario("checkout-error-spike"),
        ),
        (
            "missing evidence causes abstention",
            lambda result: (
                result["outcome"] == "insufficient_evidence"
                and result["confidence"] <= 0.2
                and result["action_executed"] is False
            ),
            run_scenario("insufficient-evidence"),
        ),
        (
            "upstream timeout degrades safely",
            lambda result: (
                result["outcome"] == "degraded"
                and result["confidence"] == 0.0
                and result["action_executed"] is False
            ),
            run_scenario("evidence-timeout"),
        ),
        (
            "unsafe remediation is blocked",
            lambda result: (
                result["outcome"] == "approval_required"
                and result["requires_approval"] is True
                and result["action_executed"] is False
            ),
            run_scenario("unsafe-auto-remediation"),
        ),
    ]

    failed = []
    for name, assertion, result in checks:
        if assertion(result):
            print(f"PASS: {name}")
        else:
            failed.append(name)
            print(f"FAIL: {name}")

    if failed:
        print(f"FAIL: {len(checks) - len(failed)}/{len(checks)} evaluation cases")
        return 1

    print(f"PASS: {len(checks)}/{len(checks)} evaluation cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_evaluations())
