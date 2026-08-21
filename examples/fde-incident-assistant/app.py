"""A dependency-free, read-only FDE delivery demo.

The program uses synthetic evidence. It never connects to or changes a real system.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4


@dataclass(frozen=True)
class Evidence:
    evidence_id: str
    source: str
    observation: str


SCENARIOS: dict[str, dict[str, Any]] = {
    "checkout-error-spike": {
        "incident_id": "INC-DEMO-001",
        "tenant_id": "demo-retail",
        "service": "checkout-api",
        "user_impact": "部分结算请求失败",
        "error_rate": 0.18,
        "baseline_error_rate": 0.01,
        "deployment": "checkout-api:2026.08.21-rc1",
        "deployment_minutes_before_alert": 8,
        "log_signature": "dependency timeout: payment-adapter",
    },
    "insufficient-evidence": {
        "incident_id": "INC-DEMO-002",
        "tenant_id": "demo-retail",
        "service": "checkout-api",
        "user_impact": "用户报告偶发失败",
    },
    "evidence-timeout": {
        "incident_id": "INC-DEMO-003",
        "tenant_id": "demo-retail",
        "service": "checkout-api",
        "user_impact": "错误率告警，但证据服务超时",
        "fault": "evidence_timeout",
    },
    "unsafe-auto-remediation": {
        "incident_id": "INC-DEMO-004",
        "tenant_id": "demo-retail",
        "service": "checkout-api",
        "user_impact": "请求自动执行生产回滚",
        "requested_action": "rollback-production",
    },
}


def collect_evidence(case: dict[str, Any]) -> list[Evidence]:
    """Convert synthetic inputs into traceable evidence records."""
    if case.get("fault") == "evidence_timeout":
        raise TimeoutError("synthetic evidence provider timeout")

    evidence: list[Evidence] = []
    if "error_rate" in case and "baseline_error_rate" in case:
        evidence.append(
            Evidence(
                "metric:error-rate",
                "synthetic Prometheus snapshot",
                (
                    f"current={case['error_rate']:.2%}, "
                    f"baseline={case['baseline_error_rate']:.2%}"
                ),
            )
        )
    if "deployment" in case:
        evidence.append(
            Evidence(
                "change:deployment",
                "synthetic deployment record",
                (
                    f"version={case['deployment']}, "
                    f"alert_after={case['deployment_minutes_before_alert']}m"
                ),
            )
        )
    if "log_signature" in case:
        evidence.append(
            Evidence(
                "log:signature",
                "synthetic redacted log sample",
                str(case["log_signature"]),
            )
        )
    return evidence


def triage(case: dict[str, Any]) -> dict[str, Any]:
    """Build an evidence-backed recommendation without executing changes."""
    trace_id = str(uuid4())
    base = {
        "trace_id": trace_id,
        "incident_id": case["incident_id"],
        "tenant_id": case["tenant_id"],
        "service": case["service"],
        "user_impact": case["user_impact"],
        "action_executed": False,
    }

    if case.get("requested_action") == "rollback-production":
        return {
            **base,
            "outcome": "approval_required",
            "confidence": 0.0,
            "hypothesis": "未取证，不能判断回滚是否正确。",
            "evidence": [],
            "proposed_action": "拒绝自动执行；先由事件负责人确认影响、证据和回滚条件。",
            "requires_approval": True,
            "reason": "生产回滚属于高风险动作，不能由本样例自动执行。",
        }

    try:
        evidence = collect_evidence(case)
    except TimeoutError as exc:
        return {
            **base,
            "outcome": "degraded",
            "confidence": 0.0,
            "hypothesis": "证据源不可用，当前不能形成可靠假设。",
            "evidence": [],
            "proposed_action": "转人工取证，检查监控、变更记录和日志；不要自动变更。",
            "requires_approval": True,
            "reason": str(exc),
        }

    if len(evidence) < 2:
        return {
            **base,
            "outcome": "insufficient_evidence",
            "confidence": 0.1,
            "hypothesis": "证据不足，不能把用户反馈直接当成根因。",
            "evidence": [asdict(item) for item in evidence],
            "proposed_action": "补充错误率、变更时间线、依赖状态和脱敏日志后重新评估。",
            "requires_approval": True,
            "reason": "至少需要两个相互独立的证据来源。",
        }

    return {
        **base,
        "outcome": "approval_required",
        "confidence": 0.78,
        "hypothesis": (
            "错误率在新版本发布后升高，且日志出现下游超时；"
            "新版本或 payment-adapter 链路是待验证假设，不是已确认根因。"
        ),
        "evidence": [asdict(item) for item in evidence],
        "proposed_action": (
            "停止继续放量，比较旧版本与新版本指标；满足既定回滚条件后，"
            "由授权人员审批回滚。"
        ),
        "requires_approval": True,
        "reason": "回滚会改变生产状态，需要审批、验证和可执行的恢复方案。",
    }


def run_scenario(name: str) -> dict[str, Any]:
    if name not in SCENARIOS:
        raise KeyError(f"unknown scenario: {name}")
    return triage(dict(SCENARIOS[name]))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a synthetic, read-only FDE incident triage scenario."
    )
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = run_scenario(args.scenario)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
