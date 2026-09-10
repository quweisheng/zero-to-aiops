# TCE 存储完整性概念实验

`verify.ps1` 在本目录新建本轮专用的 `.verification-随机标识` 子目录，生成 1 MiB 随机文件、复制、比较 SHA-256，再翻转目标文件首字节的一位并确认校验失败。翻转位保证内容确实变化，即使原字节为零也不会漏注入。

结束或失败时只清理本轮创建的两个文件和已核对路径的空目录，不递归删除任何既有目录。以前的 `.verification` 或其他学习材料不会被覆盖。若本轮目录被加入未知文件或替换为链接，脚本拒绝扩大清理范围，应人工核对报错路径。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File examples/tce-storage-integrity-lab/verify.ps1
```

它验证“任务成功”与“内容一致”要分别证明，不连接 TCE，也不代表真实 CBS/CFS/COS 的一致性、备份或容灾已经验证。完整生产边界见 [TCE 存储技术栈](../../docs/tech-stack/storage-data-protection/tce-storage.md)。
