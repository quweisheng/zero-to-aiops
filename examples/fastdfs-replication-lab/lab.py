#!/usr/bin/env python3
"""本地教学模拟：异步副本、完整性校验与业务幂等；不实现 FastDFS。"""

import argparse
import hashlib
import json
import math
import shutil
import sys
import tempfile
from pathlib import Path


SCOPE = "LOCAL_SIMULATION_ONLY"
PAYLOAD = "这是用于课堂实验的附件，不是生产数据。\n".encode("utf-8")


class BusinessKeyConflict(ValueError):
    """同一个业务键被用于不同的内容。"""


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, explanation):
    if not condition:
        raise RuntimeError("实验断言未通过：" + explanation)


class ReplicaLab:
    """两个自有临时目录代表两个节点；业务映射只保存在本进程内。"""

    def __init__(self, root):
        self.nodes = {name: root / name for name in ("storage-a", "storage-b")}
        for directory in self.nodes.values():
            directory.mkdir()
        self.mapping = {}
        self.objects_created = 0

    def upload(self, business_key, data):
        digest = sha256(data)
        if business_key in self.mapping:
            record = self.mapping[business_key]
            if record["expected_sha256"] != digest:
                raise BusinessKeyConflict("同一个业务键不能悄悄替换成另一份内容")
            return record["object_id"], False

        object_id = "sim-object-{:04d}".format(self.objects_created + 1)
        # x 模式只创建新文件；业务映射没有持久事务或跨进程并发能力。
        with self.object_path("storage-a", object_id).open("xb") as stream:
            stream.write(data)
        self.mapping[business_key] = {
            "object_id": object_id,
            "expected_sha256": digest,
        }
        self.objects_created += 1
        return object_id, True

    def object_path(self, node, object_id):
        return self.nodes[node] / (object_id + ".bin")

    def inspect(self, business_key):
        record = self.mapping[business_key]
        observations = {}
        for node in self.nodes:
            path = self.object_path(node, record["object_id"])
            actual = sha256(path.read_bytes()) if path.exists() else None
            state = "MISSING" if actual is None else (
                "MATCH" if actual == record["expected_sha256"] else "MISMATCH"
            )
            observations[node] = {
                "simulated_status": "ACTIVE",
                "checksum_status": state,
                "actual_sha256": actual,
            }
        return {
            "business_key": business_key,
            "object_id": record["object_id"],
            "expected_sha256": record["expected_sha256"],
            "nodes": observations,
        }

    def copy_verified_source(self, business_key):
        record = self.mapping[business_key]
        source = self.object_path("storage-a", record["object_id"])
        # 修复前先验证候选源；副本数相同并不说明内容正确。
        require(sha256(source.read_bytes()) == record["expected_sha256"],
                "模拟修复源必须与上传内容的摘要一致")
        target = self.object_path("storage-b", record["object_id"])
        shutil.copyfile(source, target)


def node_state(observation, node):
    return observation["nodes"][node]["checksum_status"]


def stage(name, explanation, observations):
    return {"stage": name, "explanation_zh": explanation, "observations": observations}


def base_report(scenario):
    return {
        "scope": SCOPE,
        "scenario": scenario,
        "not_implemented": [
            "FastDFS 协议、Tracker 调度、真实 Storage 状态与复制机制",
            "网络、真实异步线程、崩溃持久化、高可用和跨故障域验收",
            "跨重启或并发请求的业务幂等事务",
        ],
    }


def run_replication(scenario):
    report = base_report(scenario)
    stages = []
    checks = []
    key = "teaching-attachment-001"
    with tempfile.TemporaryDirectory(prefix="fastdfs-teaching-") as directory:
        root = Path(directory)
        lab = ReplicaLab(root)
        object_id, created = lab.upload(key, PAYLOAD)
        require(created, "首次上传应创建一个本地模拟对象")
        initial = lab.inspect(key)
        require(node_state(initial, "storage-a") == "MATCH", "上传节点已有正确内容")
        require(node_state(initial, "storage-b") == "MISSING", "复制未执行前另一节点没有副本")
        stages.append(stage("upload_ack_before_replication",
                            "上传完成只代表模拟节点 a 写入；节点 b 此时还没有副本。", initial))
        checks.append("上传确认时，副本未同步的时间窗口已确定性复现")

        if scenario == "demo":
            # 模拟服务端已保存、响应却丢失；同一进程内重试同一业务键。
            retry_id, retry_created = lab.upload(key, PAYLOAD)
            require(retry_id == object_id and not retry_created,
                    "丢响应后重试应返回同一个对象，而不是创建第二个对象")
            conflict_rejected = False
            try:
                lab.upload(key, PAYLOAD + b"changed")
            except BusinessKeyConflict:
                conflict_rejected = True
            require(conflict_rejected and lab.objects_created == 1,
                    "同业务键不同内容必须拒绝，且没有多创建对象")
            stages.append({
                "stage": "lost_response_and_business_retry",
                "explanation_zh": "故意把第一次响应视为丢失，然后用同一业务键重试。",
                "first_response_received_by_client": False,
                "retry_object_id": retry_id,
                "retry_created_new_object": retry_created,
                "same_key_different_content_rejected": conflict_rejected,
                "objects_created": lab.objects_created,
                "boundary_zh": "业务映射仅在本进程中；未验证重启、并发或数据库事务。",
            })
            checks.append("同键同内容重试没有新增对象，同键不同内容被拒绝")
            lab.copy_verified_source(key)
            synchronized = lab.inspect(key)
            require(all(node_state(synchronized, node) == "MATCH" for node in lab.nodes),
                    "复制后两个节点均与预期 SHA-256 一致")
            stages.append(stage("after_manual_replication_step",
                                "手工推进模拟复制步骤后，两个本地文件的摘要一致。", synchronized))
            checks.append("推进复制步骤后，两份本地字节的 SHA-256 一致")
        else:
            lab.copy_verified_source(key)
            baseline = lab.inspect(key)
            require(all(node_state(baseline, node) == "MATCH" for node in lab.nodes),
                    "故障注入前应有两份正确副本")
            stages.append(stage("fault_baseline", "注入故障前，先记录两份正确副本。", baseline))

            replica = lab.object_path("storage-b", object_id)
            replica.unlink()  # 只删除本次自有临时目录里的模拟副本。
            missing = lab.inspect(key)
            require(node_state(missing, "storage-b") == "MISSING", "缺失故障必须出现")
            require(all(value["simulated_status"] == "ACTIVE"
                        for value in missing["nodes"].values()), "模拟存活状态保持 ACTIVE")
            stages.append(stage("active_but_replica_missing",
                                "两个模拟节点仍显示 ACTIVE，但节点 b 的目标文件不存在。", missing))
            lab.copy_verified_source(key)
            repaired_missing = lab.inspect(key)
            require(node_state(repaired_missing, "storage-b") == "MATCH", "缺失修复后必须复测")
            stages.append(stage("repair_missing_and_retest",
                                "校验 a 的源内容，再人工复制；复测 b 恢复 MATCH。", repaired_missing))
            checks.append("模拟 ACTIVE 不能证明目标副本存在；缺失故障及修复均已验证")

            damaged = bytearray(replica.read_bytes())
            damaged[0] ^= 1  # 翻转一个比特，保证内容改变，不依赖原字节值。
            replica.write_bytes(damaged)
            corrupted = lab.inspect(key)
            require(node_state(corrupted, "storage-b") == "MISMATCH", "损坏故障必须出现")
            require(node_state(corrupted, "storage-a") == "MATCH", "修复源仍应正确")
            stages.append(stage("active_but_checksum_mismatch",
                                "文件存在且模拟节点仍 ACTIVE，但节点 b 的 SHA-256 不匹配。", corrupted))
            lab.copy_verified_source(key)
            repaired_corrupted = lab.inspect(key)
            require(all(node_state(repaired_corrupted, node) == "MATCH" for node in lab.nodes),
                    "修复损坏后，两份内容必须重新通过摘要比较")
            stages.append(stage("repair_corruption_and_retest",
                                "人工从已校验源重新复制，复测两份本地字节均匹配。", repaired_corrupted))
            checks.append("文件存在不能证明字节正确；确定性损坏、修复和复测均已验证")
        report["stages"] = stages
        report["checks"] = checks
        report["objects_created"] = lab.objects_created

    require(not root.exists(), "本次自有临时目录应已清理")
    report["temporary_data_cleaned"] = True
    report["all_checks_passed"] = True
    return report


def finite_number(value):
    try:
        parsed = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("请输入有限数值") from error
    if not math.isfinite(parsed):
        raise argparse.ArgumentTypeError("不接受 NaN 或无穷大")
    return parsed


def positive_number(value):
    parsed = finite_number(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("逻辑容量必须大于 0")
    return parsed


def positive_integer(value):
    try:
        parsed = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("副本数必须为正整数") from error
    if parsed <= 0:
        raise argparse.ArgumentTypeError("副本数必须大于 0")
    return parsed


def reserve_percentage(value):
    parsed = finite_number(value)
    if not 0 <= parsed < 100:
        raise argparse.ArgumentTypeError("预留百分比必须满足 0 <= reserve-percent < 100")
    return parsed


def run_capacity(args):
    raw = args.logical_tb * args.copies / (1 - args.reserve_percent / 100)
    if not math.isfinite(raw) or raw <= 0:
        raise ValueError("容量计算结果溢出或下溢，请使用可表示的容量与副本数")
    return {
        "scope": SCOPE,
        "scenario": "capacity",
        "logical_tb": args.logical_tb,
        "copies": args.copies,
        "reserve_percent": args.reserve_percent,
        "formula": "logical_tb * copies / (1 - reserve_percent / 100)",
        "raw_required_tb": raw,
        "assumptions_zh": [
            "TB 为十进制容量单位；输入容量均使用同一种单位。",
            "copies 是每份业务数据的总副本数，包含第一份。",
            "reserve_percent 以规划后的物理总容量为分母。",
            "这里只算副本与空闲比例的下限，不含元数据、碎片、备份、快照和额外故障预留。",
            "这是浮点数课堂计算，不代表真实磁盘可用容量或实际 FastDFS 集群。",
        ],
        "all_checks_passed": True,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name, description in (("demo", "复制与业务幂等基础实验"),
                              ("fault", "副本缺失与校验失败故障实验")):
        command = subparsers.add_parser(name, help=description)
        command.add_argument("--output", type=Path, help="可选证据 JSON；只创建新文件，绝不覆盖")
    capacity = subparsers.add_parser("capacity", help="计算副本和空闲比例对应的容量下限")
    capacity.add_argument("--logical-tb", required=True, type=positive_number)
    capacity.add_argument("--copies", required=True, type=positive_integer)
    capacity.add_argument("--reserve-percent", required=True, type=reserve_percentage)
    capacity.add_argument("--output", type=Path, help="可选证据 JSON；只创建新文件，绝不覆盖")
    args = parser.parse_args(argv)
    try:
        report = run_capacity(args) if args.command == "capacity" else run_replication(args.command)
        encoded = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        if args.output is not None:
            # 不创建父目录；x 模式遇到已有文件或符号链接会拒绝。
            with args.output.open("x", encoding="utf-8", newline="\n") as stream:
                stream.write(encoded)
        print(encoded, end="")
        return 0
    except (OSError, ValueError, RuntimeError, ArithmeticError) as error:
        print("实验失败：{}".format(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
