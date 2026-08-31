# TCE 存储完整性概念实验

`verify.ps1` 在本目录的临时子目录生成 1 MiB 随机文件、复制、比较 SHA-256，再改动目标文件的一个字节并确认校验失败，最后删除临时数据。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File examples/tce-storage-integrity-lab/verify.ps1
```

它验证“任务成功”与“内容一致”要分别证明，不连接 TCE，也不代表真实 CBS/CFS/COS 的一致性、备份或容灾已经验证。完整生产边界见 [TCE 存储技术栈](../../docs/tech-stack/storage-data-protection/tce-storage.md)。
