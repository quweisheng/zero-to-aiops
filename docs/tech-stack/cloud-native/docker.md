# Docker

> 目标：能把一个服务打包成镜像，用容器运行，并理解镜像、容器、网络、卷、registry 的关系。

## 官方资料

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Docker run reference](https://docs.docker.com/reference/cli/docker/container/run/)

说明：本文是基于 Docker 官方文档的原创中文学习教程，不复制官方全文。

## 是什么

Docker 是开发、打包、分发、运行应用的平台。它把应用和依赖打包成镜像，再用容器运行。

## 核心原理

Docker 使用 client-server 架构：

```text
docker CLI
  -> Docker API
  -> Docker daemon
  -> images / containers / networks / volumes
  -> registry
```

底层依赖：

- namespaces：隔离进程、网络、挂载点等。
- cgroups：限制 CPU、内存、IO 等资源。
- union filesystem：镜像分层。

## 关键概念

### Image

镜像是只读模板，包含应用和运行依赖。

### Container

容器是镜像的运行实例。一个镜像可以启动多个容器。

### Dockerfile

Dockerfile 是构建镜像的说明书。

### Registry

镜像仓库，例如 Docker Hub 或公司私有仓库。

### Volume

卷用于持久化数据，避免容器删除后数据丢失。

### Network

Docker 网络让容器之间、容器和宿主机之间通信。

## 安装检查

```bash
docker version
docker info
docker run hello-world
```

## Dockerfile 入门

Python 服务示例：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "app.py"]
```

逐行理解：

- `FROM`：基础镜像。
- `WORKDIR`：容器内工作目录。
- `COPY`：复制文件到镜像。
- `RUN`：构建镜像时执行。
- `EXPOSE`：声明服务端口。
- `CMD`：容器启动时默认命令。

## 常用命令

```bash
docker build -t demo-app:0.1 .
docker images
docker run --rm -p 8000:8000 demo-app:0.1
docker ps
docker ps -a
docker logs <container>
docker exec -it <container> sh
docker stop <container>
docker rm <container>
docker rmi demo-app:0.1
```

## 网络配置

端口映射：

```bash
docker run -p 8080:80 nginx
```

含义：宿主机 `8080` 端口转发到容器内 `80` 端口。

自定义网络：

```bash
docker network create aiops-net
docker run -d --name web --network aiops-net nginx
```

## Volume 配置

```bash
docker volume create demo-data
docker run -v demo-data:/data demo-app:0.1
```

绑定宿主机目录：

```bash
docker run -v "$PWD/data:/app/data" demo-app:0.1
```

## 在 AIOps 中的作用

- 快速复现服务环境。
- 运行 Prometheus、Grafana、OpenTelemetry Collector。
- 把 Python 异常检测服务打包。
- 理解容器指标和 K8s Pod 问题。

## 入门实验

目标：容器化一个健康检查服务。

`app.py`：

```python
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_response(404)
            self.end_headers()

HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
```

构建运行：

```bash
docker build -t aiops-demo:0.1 .
docker run --rm -p 8000:8000 aiops-demo:0.1
curl http://localhost:8000/health
```

## 排障清单

容器启动失败：

```bash
docker ps -a
docker logs <container>
docker inspect <container>
```

端口访问不了：

1. 容器是否运行。
2. 应用是否监听 `0.0.0.0`。
3. `-p` 端口映射是否正确。
4. 宿主机防火墙是否阻挡。

镜像太大：

- 使用 slim 基础镜像。
- 合并无意义层。
- 使用 `.dockerignore`。

## 学习证据

- `Dockerfile`
- `README.md` 里写清 build/run/curl 命令
- 一篇记录：镜像和容器的区别
