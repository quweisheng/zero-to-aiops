# NGINX / Ingress

> 目标：理解反向代理、负载均衡、Kubernetes Ingress 的作用，能配置基本 HTTP 路由并排查 404/502/504。

## 官方资料

- [NGINX reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [NGINX Ingress Controller](https://docs.nginx.com/nginx-ingress-controller/)
- [ingress-nginx documentation](https://kubernetes.github.io/ingress-nginx/)

说明：本文是基于 NGINX 和 Kubernetes 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

NGINX 是 Web 服务器、反向代理和负载均衡器。Ingress 是 Kubernetes 里管理 HTTP/HTTPS 外部访问的 API 对象。Ingress Controller 负责读取 Ingress 规则并实际配置代理。

## 核心原理

### 反向代理

```text
Client
  -> NGINX
  -> upstream application servers
```

客户端只知道 NGINX，不直接知道后端服务。

### Kubernetes Ingress

```text
Client
  -> LoadBalancer / NodePort
  -> Ingress Controller
  -> Service
  -> Pods
```

Ingress 只是规则，真正转发流量的是 Ingress Controller。

## NGINX 反向代理配置

```nginx
upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 3s;
        proxy_read_timeout 30s;
    }
}
```

重点：

- `upstream` 定义后端。
- `proxy_pass` 转发请求。
- `proxy_set_header` 传递原始请求信息。
- timeout 决定慢请求如何失败。

## Kubernetes Ingress 示例

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-app
spec:
  rules:
    - host: demo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-app
                port:
                  number: 80
```

## 常用命令

```bash
kubectl get ingress
kubectl describe ingress demo-app
kubectl get svc
kubectl get endpoints demo-app
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
curl -H "Host: demo.local" http://<ingress-ip>/
```

## 在 AIOps 中的作用

- NGINX 访问日志是 QPS、状态码、延迟的重要来源。
- 502/504 常常能指向后端服务不可用或超时。
- Ingress 配置错误会导致服务外部不可达。
- AIOps 做根因分析时要关联 Ingress、Service、Pod、后端日志。

## 日志字段

NGINX access log 常见字段：

```text
remote_addr
time_local
request
status
body_bytes_sent
http_referer
http_user_agent
request_time
upstream_response_time
upstream_addr
```

对 AIOps 最有用：

- status：状态码。
- request_time：总耗时。
- upstream_response_time：后端耗时。
- upstream_addr：后端实例。

## 入门实验

1. 本地启动两个 demo 服务。
2. 用 NGINX 配置 upstream。
3. 访问 NGINX。
4. 停掉一个后端，观察日志和状态码。
5. 在 Kubernetes 中创建 Service 和 Ingress。

## 排障清单

### 404

- Host 是否匹配。
- path 是否匹配。
- Ingress 规则是否生效。

### 502

- 后端 Pod 是否 Ready。
- Service selector 是否匹配。
- endpoints 是否为空。
- 后端端口是否正确。

### 504

- 后端响应是否超时。
- `proxy_read_timeout` 是否过短。
- 应用是否卡在数据库或下游依赖。

## 学习证据

- 一份 NGINX 反向代理配置。
- 一份 Kubernetes Ingress YAML。
- 一篇记录：404、502、504 分别优先查哪里。
