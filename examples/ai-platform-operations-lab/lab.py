"""Offline event-sequence classroom: no network, credentials, or durable writes."""

import argparse
import copy
import hashlib
import json
import math
import sys
from dataclasses import dataclass

sys.dont_write_bytecode = True


@dataclass(frozen=True)
class Response:
    status: int
    retry_after: float = 0.0


def finite_number(value, name, minimum=0.0):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number")
    if not math.isfinite(value) or value < minimum:
        raise ValueError(f"{name} must be finite and >= {minimum}")


def simulate_rate_limit(responses, max_attempts=4, budget_seconds=10.0,
                        base_delay=1.0, max_delay=4.0):
    """200 means a complete non-streaming fixture response, not SSE completion."""
    if isinstance(max_attempts, bool) or not isinstance(max_attempts, int):
        raise ValueError("max_attempts must be an integer")
    if not 1 <= max_attempts <= 20:
        raise ValueError("max_attempts must be between 1 and 20")
    finite_number(budget_seconds, "budget_seconds", 0.001)
    finite_number(base_delay, "base_delay", 0.001)
    finite_number(max_delay, "max_delay", base_delay)
    responses = list(responses)
    for response in responses:
        if not isinstance(response, Response):
            raise ValueError("each response must be a Response")
        if isinstance(response.status, bool) or not isinstance(response.status, int):
            raise ValueError("status must be an integer")
        finite_number(response.retry_after, "retry_after")

    attempts, delays, trace = [], [], []
    elapsed = 0.0  # 虚拟等待时间，不会真的 sleep，也未计入网络/推理耗时。
    outcome = "stopped_no_response"
    for index in range(max_attempts):
        if index >= len(responses):
            outcome = "stopped_no_response"
            break
        response = responses[index]
        attempts.append(response.status)
        trace.append({"attempt": index + 1, "status": response.status})
        if response.status == 200:
            outcome = "completed"
            break
        if response.status != 429:
            outcome = "stopped_not_retryable"
            break
        if index + 1 == max_attempts:
            outcome = "stopped_attempt_budget"
            break
        # 相对 Retry-After 是模拟输入；等待不能短于它，超过上限则停止而非截短。
        delay = max(min(base_delay * (2 ** index), max_delay), response.retry_after)
        if delay > max_delay:
            outcome = "stopped_retry_after_exceeds_cap"
            break
        if elapsed + delay > budget_seconds:
            outcome = "stopped_wait_budget"
            break
        delays.append(delay)
        elapsed += delay
        trace.append({"scheduled_wait_seconds": delay})
    return {
        "outcome": outcome, "attempts": len(attempts), "statuses": attempts,
        "scheduled_delays_seconds": delays, "virtual_wait_seconds": elapsed,
        "max_attempts": max_attempts, "budget_seconds": budget_seconds,
        "trace": trace,
    }


def observe_stream(events):
    """Observe a teaching contract, not a wire-level SSE parser or provider SDK."""
    http_status = None
    chunks = []
    completed = False
    reason = "end_without_completion_marker"
    outcome = "incomplete"
    observed = []
    for event in events:
        if not isinstance(event, dict) or "kind" not in event:
            outcome, reason = "stopped_invalid_event", "malformed_event"
            break
        kind = event["kind"]
        observed.append(kind)
        if kind == "http_status":
            if http_status is not None or completed:
                outcome, reason = "stopped_invalid_event", "duplicate_http_status"
                break
            http_status = event.get("status")
            if type(http_status) is not int or http_status != 200:
                outcome, reason = "http_failed", "http_status_not_200"
                break
        elif kind == "delta":
            if http_status != 200 or completed or not isinstance(event.get("text"), str):
                outcome, reason = "stopped_invalid_event", "delta_outside_active_stream"
                break
            chunks.append(event["text"])
        elif kind == "completed":
            if http_status != 200 or completed:
                outcome, reason = "stopped_invalid_event", "completion_outside_active_stream"
                break
            completed = True
            outcome, reason = "completed", "application_completion_marker_seen"
        elif kind in ("disconnect", "timeout", "error"):
            if completed and kind == "disconnect":
                outcome, reason = "completed", "closed_after_completion"
            elif completed:
                outcome, reason = "stopped_invalid_event", "error_after_completion"
            else:
                outcome, reason = "incomplete", kind
            break
        else:
            outcome, reason = "stopped_invalid_event", "unknown_event"
            break
    return {
        "http_status": http_status, "first_chunk_seen": bool(chunks),
        "completion_marker_seen": completed, "outcome": outcome,
        "reason": reason, "partial_text": "".join(chunks),
        "observed_events": observed,
    }


def complete_stream():
    return [
        {"kind": "http_status", "status": 200},
        {"kind": "delta", "text": "diagnostic "},
        {"kind": "delta", "text": "summary"},
        {"kind": "completed"},
    ]


class PayloadConflict(ValueError):
    pass


class Ledger:
    """Single-threaded atomic in-memory fixture; NOT a durable production ledger."""

    def __init__(self):
        self.records = {}
        self.write_count = 0

    def apply(self, key, payload):
        if not isinstance(key, str) or not key.strip():
            raise ValueError("idempotency key must not be empty")
        if not isinstance(payload, dict):
            raise ValueError("payload must be a JSON object")
        fingerprint = hashlib.sha256(json.dumps(
            payload, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")).hexdigest()
        if key in self.records:
            record = self.records[key]
            if record["payload_sha256"] != fingerprint:
                raise PayloadConflict("same key with a different payload must stop")
            return {**record, "reused": True}
        self.write_count += 1  # 副作用仅为内存计数，不会真正写工单或调用工具。
        record = {
            "state": "applied", "receipt": f"demo-receipt-{self.write_count:03d}",
            "payload_sha256": fingerprint,
        }
        self.records[key] = record
        return {**record, "reused": False}

    def query(self, key, visibility="available"):
        if visibility == "unknown":
            return {"state": "unknown"}
        if visibility != "available":
            raise ValueError("unsupported visibility")
        if key not in self.records:
            return {"state": "absent"}  # 本模拟中，这是权威而非最终一致的查询。
        return copy.deepcopy(self.records[key])


def recover_task(checkpoint, ledger, visibility="available"):
    """Unknown or conflicting state is a stop condition, never permission to replay."""
    restored = copy.deepcopy(checkpoint)
    if not isinstance(restored, dict):
        return {"outcome": "paused_invalid_checkpoint", "checkpoint": restored,
                "decision": "checkpoint_must_be_an_object"}
    if (type(restored.get("schema_version")) is not int or restored["schema_version"] != 1 or
            not isinstance(restored.get("task_id"), str) or not restored["task_id"].strip() or
            restored.get("phase") not in ("pending_write", "completed") or
            restored.get("collected") is not True or
            not isinstance(restored.get("key"), str) or not restored["key"].strip() or
            not isinstance(restored.get("payload"), dict)):
        return {"outcome": "paused_invalid_checkpoint", "checkpoint": restored,
                "decision": "do_not_invent_missing_state"}
    if restored["phase"] == "completed":
        if not isinstance(restored.get("receipt"), str) or not restored["receipt"].strip():
            return {"outcome": "paused_invalid_checkpoint", "checkpoint": restored,
                    "decision": "completion_needs_a_saved_receipt"}
        return {"outcome": "completed", "checkpoint": restored,
                "decision": "already_completed"}
    status = ledger.query(restored["key"], visibility)
    if status["state"] == "unknown":
        return {"outcome": "paused_unknown", "checkpoint": restored,
                "decision": "reconcile_before_any_write"}
    if status["state"] not in ("applied", "absent"):
        return {"outcome": "paused_unknown", "checkpoint": restored,
                "decision": "unsupported_tool_state"}
    try:
        # applied 时同键同参数重放只取原收据，absent 时才产生一条新副作用。
        receipt = ledger.apply(restored["key"], restored["payload"])
    except PayloadConflict:
        return {"outcome": "paused_payload_conflict", "checkpoint": restored,
                "decision": "same_key_must_describe_same_operation"}
    restored["phase"] = "completed"
    restored["receipt"] = receipt["receipt"]
    return {
        "outcome": "completed", "checkpoint": restored,
        "decision": "reuse_receipt" if receipt["reused"] else "apply_after_proven_absent",
        "receipt_reused": receipt["reused"],
    }


def simulate_agent(failure="lost-response"):
    if failure not in ("normal", "lost-response", "before-write", "unknown-state"):
        raise ValueError("unsupported agent failure")
    ledger = Ledger()
    checkpoint = {
        "schema_version": 1, "task_id": "demo-task-001", "phase": "pending_write",
        "collected": True, "key": "demo-task-001:attach-note:v1",
        "payload": {"ticket_id": "demo-ticket-001", "note": "offline synthetic note"},
    }
    trace = ["collected_once", "checkpoint_contains_operation_key_before_write"]
    if failure != "before-write":
        receipt = ledger.apply(checkpoint["key"], checkpoint["payload"])
        if failure == "normal":
            checkpoint.update(phase="completed", receipt=receipt["receipt"])
            trace.append("accepted_and_receipt_checkpointed")
        else:
            trace.append("tool_accepted_but_response_lost")
    else:
        trace.append("execution_interrupted_before_tool_write")
    before = copy.deepcopy(checkpoint)
    before_writes = ledger.write_count
    # JSON 往返只模拟读取检查点，数据仍在内存，未模拟断电或真实进程重启。
    restored = json.loads(json.dumps(checkpoint))
    visibility = "unknown" if failure == "unknown-state" else "available"
    recovery = recover_task(restored, ledger, visibility)
    trace.append(recovery["decision"])
    return {
        "injected_failure": failure, "before_recovery": before,
        "writes_before_recovery": before_writes, "recovery": recovery,
        "side_effect_writes": ledger.write_count, "collect_runs": 1,
        "trace": trace,
    }


def run_lab(rate_failures=2, max_attempts=4, budget_seconds=10.0,
            retry_after=0.0, stream_failure="disconnect", agent_failure="lost-response"):
    if type(rate_failures) is not int or not 0 <= rate_failures <= 100:
        raise ValueError("rate_failures must be between 0 and 100")
    finite_number(retry_after, "retry_after")
    if stream_failure not in ("disconnect", "timeout", "missing-completed", "unknown-event"):
        raise ValueError("unsupported stream failure")
    normal = {
        "rate": simulate_rate_limit([Response(200)]),
        "stream": observe_stream(complete_stream()),
        "agent": simulate_agent("normal"),
    }
    responses = [Response(429, retry_after) for _ in range(rate_failures)] + [Response(200)]
    rate = simulate_rate_limit(responses, max_attempts, budget_seconds)
    interrupted_events = complete_stream()[:2]
    if stream_failure != "missing-completed":
        interrupted_events.append({"kind": stream_failure})
    interrupted = observe_stream(interrupted_events)
    stream_recovery = observe_stream(complete_stream())
    agent = simulate_agent(agent_failure)
    checks = {
        "normal_rate_completed": normal["rate"]["outcome"] == "completed",
        "normal_stream_completed": normal["stream"]["outcome"] == "completed",
        "normal_agent_completed": normal["agent"]["recovery"]["outcome"] == "completed",
        "rate_attempts_within_cap": rate["attempts"] <= max_attempts,
        "rate_wait_within_budget": rate["virtual_wait_seconds"] <= budget_seconds,
        "stream_200_is_not_completion": interrupted["http_status"] == 200 and
            interrupted["outcome"] != "completed",
        "stream_recovery_replaces_partial": stream_recovery["outcome"] == "completed" and
            stream_recovery["partial_text"] == "diagnostic summary",
        "agent_inputs_not_recollected": agent["collect_runs"] == 1,
        "agent_side_effect_not_duplicated": agent["side_effect_writes"] == 1,
        "agent_unknown_stops": agent["recovery"]["outcome"] ==
            ("paused_unknown" if agent_failure == "unknown-state" else "completed"),
    }
    return {
        "evidence_scope": "offline_event_sequence_simulation",
        "network_calls": 0, "persistent_writes": 0, "real_sleep_seconds": 0,
        "parameters": {
            "rate_failures": rate_failures, "max_attempts": max_attempts,
            "budget_seconds": budget_seconds, "retry_after": retry_after,
            "stream_failure": stream_failure, "agent_failure": agent_failure,
        },
        "normal": normal,
        "faults": {
            "rate_limit": rate,
            "stream_interrupted": {
                "failure": interrupted, "recovery": stream_recovery,
                "recovery_policy": "discard_partial_and_start_new_read_only_generation",
            },
            "long_task_interrupted": agent,
        },
        "checks": checks, "classroom_checks_passed": all(checks.values()),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rate-failures", type=int, default=2)
    parser.add_argument("--max-attempts", type=int, default=4)
    parser.add_argument("--budget-seconds", type=float, default=10.0)
    parser.add_argument("--retry-after", type=float, default=0.0)
    parser.add_argument("--stream-failure", choices=[
        "disconnect", "timeout", "missing-completed", "unknown-event"
    ], default="disconnect")
    parser.add_argument("--agent-failure", choices=[
        "lost-response", "before-write", "unknown-state"
    ], default="lost-response")
    args = parser.parse_args(argv)
    try:
        result = run_lab(**vars(args))
    except ValueError as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2, ensure_ascii=True))
    return 0 if result["classroom_checks_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
