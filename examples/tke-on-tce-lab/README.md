# TKE on TCE 的 Kubernetes 语义实验

本目录只在专门创建的本地 kind 集群中演示 Service 到 Pod 的端口映射。它不安装 TCE、不创建真实 CLB/CBS、不证明 TCE 版本兼容。

前提：Docker、kind、kubectl；全部命令明确指定 `--context kind-tce-learning`，不要改为生产集群。

```powershell
kind create cluster --name tce-learning
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/app.yaml
kubectl --context kind-tce-learning -n tce-learning rollout status deployment/incident-web --timeout=120s
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
```

预期返回 Nginx 欢迎页。接着注入端口错误：

```powershell
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/service-broken.yaml
kubectl --context kind-tce-learning -n tce-learning get pods,svc,endpointslices
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
```

预期 Pod 仍 Ready，但请求拒绝或超时，命令非零退出。修复并验证：

```powershell
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/app.yaml
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
```

清理只删除专门创建的实验集群及其中数据：

```powershell
kind delete cluster --name tce-learning
```

完整原理、字段解释、检查顺序与生产边界见 [TKE on TCE 教程](../../docs/tech-stack/cloud-native/tke-on-tce.md)。
