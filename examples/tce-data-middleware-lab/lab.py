import argparse
from collections import deque


def run(inject_duplicate: bool) -> None:
    database: dict[str, dict[str, str]] = {}
    cache: dict[str, dict[str, str]] = {}
    events: deque[dict[str, str]] = deque()
    processed_event_ids: set[str] = set()
    knowledge_index: dict[str, str] = {}

    incident = {"id": "INC-001", "status": "OPEN", "summary": "demo latency alarm"}
    database[incident["id"]] = incident.copy()
    event = {"eventId": "EVT-001", "incidentId": incident["id"], "type": "IncidentCreated"}
    events.append(event)
    if inject_duplicate:
        events.append(event.copy())

    cache[incident["id"]] = database[incident["id"]].copy()

    handled = 0
    duplicates = 0
    while events:
        message = events.popleft()
        if message["eventId"] in processed_event_ids:
            duplicates += 1
            continue
        processed_event_ids.add(message["eventId"])
        source = database[message["incidentId"]]
        knowledge_index[source["id"]] = source["summary"]
        handled += 1

    assert database["INC-001"]["status"] == "OPEN"
    assert cache["INC-001"] == database["INC-001"]
    assert knowledge_index["INC-001"] == "demo latency alarm"
    print(f"result=PASS handled={handled} duplicates={duplicates} backlog={len(events)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthetic TCE data and middleware semantics lab")
    parser.add_argument("--fault", action="store_true", help="inject one duplicate message")
    args = parser.parse_args()
    run(args.fault)
