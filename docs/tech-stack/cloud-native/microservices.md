# 微服务深讲

> 学习目标：不是只知道“把系统拆小”，而是能用 Spring Boot 和 Spring Cloud 的官方主线讲清一个 Java 微服务从创建、配置、暴露 API、服务调用、注册发现、网关路由、负载均衡、熔断限流、可观测性、容器化、发布、排障到 AIOps 证据沉淀的完整链路。

## 官方资料

优先读这些官方资料，不要一上来搜零散教程：

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/index.html)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [Spring Boot Metrics](https://docs.spring.io/spring-boot/reference/actuator/metrics.html)
- [Spring Boot Tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [Spring Cloud Reference](https://docs.spring.io/spring-cloud/docs/current/reference/html/)
- [Spring Cloud Release Train Reference](https://docs.spring.io/spring-cloud-release/reference/index.html)
- [Spring Cloud Config](https://docs.spring.io/spring-cloud-config/reference/server.html)
- [Spring Cloud Commons](https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/common-abstractions.html)
- [Spring Cloud LoadBalancer](https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html)
- [Spring Cloud OpenFeign](https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/)
- [Spring Cloud Circuit Breaker](https://docs.spring.io/spring-cloud-circuitbreaker/reference/index.html)
- [Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)
- [Spring Cloud Kubernetes DiscoveryClient](https://docs.spring.io/spring-cloud-kubernetes/reference/discovery-client.html)
- [Spring Initializr](https://start.spring.io/)

说明：本文按 Spring Boot 和 Spring Cloud 官网重新组织，重点服务 AIOps 学习路线。它不是照搬官网，也不是要你一天学完 Spring 全家桶，而是把“Java 微服务在生产里怎么跑、坏了怎么查、指标怎么进 AIOps”讲成一条可执行路径。

## 先说边界

“微服务”不是 Spring 的专属概念。Go、Python、Node.js、.NET 都可以写微服务。

但在国内企业运维和 AIOps 场景里，Java + Spring Boot + Spring Cloud 很常见。你面试或接手生产系统时，遇到的可能是：

```text
Spring Boot 应用
  -> Spring Cloud Gateway
  -> Spring Cloud OpenFeign / RestClient
  -> 注册中心 / Kubernetes Service
  -> Config Server / ConfigMap
  -> MySQL / Redis / RabbitMQ / Kafka
  -> Actuator / Micrometer / Prometheus / OpenTelemetry
```

所以这篇文章的边界是：

- 以 Spring Boot 讲“单个微服务怎么做成生产可运行应用”。
- 以 Spring Cloud 讲“多个服务之间怎么配置、发现、调用、路由和容错”。
- 以 Kubernetes、Prometheus、OpenTelemetry、RabbitMQ、Kafka 讲“它们如何进入 AIOps 链路”。
- 不把 DDD、服务网格、Istio、完整分布式事务展开成另一本书，只讲 AIOps 入门必须掌握的主线。

## 场景开场

你原来维护的是一个单体 Java 系统：

```text
one-repo
  -> one-war
  -> one-database
  -> one-nginx-location
```

上线时整包发布，出问题整包回滚。慢是慢一点，但至少排障路径相对直接。

后来系统拆成了很多服务：

```text
gateway-service
user-service
order-service
payment-service
inventory-service
notification-service
```

这时值班问题变了：

- 网关返回 502，是网关路由错了，还是下游服务挂了？
- order-service 调 payment-service 超时，是网络问题、连接池问题、还是 payment 慢？
- 注册中心里服务实例还在，为什么请求还是失败？
- Config Server 改了超时时间，为什么某个服务没生效？
- Feign 调用失败后重试，把下游打得更慢了怎么办？
- Actuator `/health` 是 UP，为什么真实业务还是 500？
- Prometheus 看到 `http.server.requests` 错误率升高，怎么关联到 trace、日志和最近发布？

微服务不是“拆得越多越先进”。微服务的本质是把系统按业务能力拆成多个可独立发布、扩展和观测的服务。拆完以后，工程复杂度会转移到配置、发现、网络、容错、数据一致性、观测和发布治理上。

## 一句话人话版

微服务是一种把大系统拆成多个围绕业务能力的小服务的架构方式；Spring Boot 负责把每个服务做成可独立运行的应用，Spring Cloud 负责解决多个服务之间的配置、发现、调用、路由和容错。

## 小白追问

### Spring Boot 和 Spring Cloud 是什么关系？

Spring Boot 先解决“单个服务怎么快速启动、配置、打包、监控”。

Spring Cloud 再解决“多个服务之间怎么协作”。

你可以这样理解：

```text
Spring Boot = 把一个服务做成可运行、可管理、可观测的应用
Spring Cloud = 把很多 Spring Boot 服务连成可治理的分布式系统
```

### 有 Kubernetes 了，还要 Spring Cloud 吗？

要分场景。

Kubernetes 提供 Pod、Service、DNS、ConfigMap、Secret、Deployment、Ingress 等平台能力。Spring Cloud 提供 Java 应用内的配置绑定、服务调用、负载均衡、熔断、网关、客户端抽象和生态集成。

在 Kubernetes 中，服务发现可以主要依赖 Kubernetes Service；但应用里的 Feign、LoadBalancer、Actuator、Micrometer、CircuitBreaker 仍然有价值。

### 微服务是不是一定要注册中心？

不一定。

传统 Spring Cloud 系统可能用 Eureka、Consul、Nacos 这类注册中心。Kubernetes 环境下，常见方式是用 Service + DNS 或 Spring Cloud Kubernetes DiscoveryClient。

关键不是“必须用哪个注册中心”，而是服务调用方能不能稳定找到可用实例，并且实例上下线时调用方能感知变化。

### 微服务是不是一定要每个服务一个数据库？

不是第一天就必须这么做。

原则上，服务边界清晰时，每个服务应该拥有自己的数据，不直接跨库改别人表。但真实系统会有历史包袱。学习阶段先理解：跨服务数据一致性很难，要优先避免“多个服务共享一堆表还互相改”的分布式单体。

## 为什么要学微服务

AIOps 很少只处理一个进程。真实故障通常发生在服务关系里：

- 网关路由错。
- 下游服务实例不健康。
- 配置中心推错参数。
- 服务调用超时。
- 连接池耗尽。
- RabbitMQ 消息堆积。
- Kafka 消费延迟。
- 数据库慢 SQL。
- 发布后错误率升高。
- trace 跨服务断开。

如果你不理解 Spring Boot / Spring Cloud 微服务，看到 Prometheus、Grafana、OpenTelemetry、Kubernetes、RabbitMQ、Kafka 时会只看到工具，不知道它们为什么要连在一起。

在 AIOps 里，微服务提供三类关键上下文：

| 上下文 | AIOps 用来做什么 |
|---|---|
| 服务边界 | 判断告警归属、影响范围、负责人 |
| 调用关系 | 做根因定位、故障传播分析 |
| 发布和版本 | 关联错误率、延迟、变更和回滚 |

## 官方知识地图

### Spring Boot 官方主线

Spring Boot 官网主线可以按这张图理解：

```text
Spring Boot
  -> Getting Started
     -> Spring Initializr
     -> Maven / Gradle
     -> main application
     -> embedded server
  -> Developing with Spring Boot
     -> auto-configuration
     -> dependency management
     -> configuration properties
     -> profiles
     -> logging
     -> testing
  -> Web
     -> Spring MVC
     -> RestClient / WebClient
     -> validation
     -> error handling
  -> Data
     -> JDBC / JPA / Redis / messaging
  -> Production-ready Features
     -> Actuator
     -> health
     -> metrics
     -> tracing
     -> loggers
     -> Prometheus / OTLP
  -> Packaging
     -> executable jar
     -> Docker image
     -> Cloud Native Buildpacks
```

对 AIOps 来说，Spring Boot 最关键的不是“能写 Controller”，而是这些生产能力：

- 外部化配置。
- Actuator 健康检查。
- Micrometer 指标。
- tracing 链路追踪。
- 日志级别动态调整。
- 打包和容器化。
- 可测试、可回滚、可观测。

### Spring Cloud 官方主线

Spring Cloud 官网主线可以按这张图理解：

```text
Spring Cloud
  -> configuration management
     -> Spring Cloud Config
  -> service registration and discovery
     -> DiscoveryClient
     -> Eureka / Consul / Kubernetes
  -> service-to-service calls
     -> OpenFeign
     -> RestClient / WebClient
  -> load balancing
     -> Spring Cloud LoadBalancer
  -> routing
     -> Spring Cloud Gateway
  -> circuit breakers
     -> Spring Cloud Circuit Breaker
     -> Resilience4j
  -> distributed messaging
     -> Spring Cloud Stream
  -> Kubernetes integration
     -> Spring Cloud Kubernetes
```

Spring Cloud 不是一个单独的 jar，而是一组分布式系统模式的工具箱。学习时不要贪多，先抓住这条主线：

```text
配置
  -> 发现
  -> 调用
  -> 路由
  -> 容错
  -> 观测
```

## 学习路径

建议按这个顺序学：

```text
1. 先写一个 Spring Boot REST 服务
2. 加 Actuator，暴露 health 和 metrics
3. 加第二个服务，用 RestClient / OpenFeign 调用
4. 引入服务发现或 Kubernetes Service
5. 引入 Spring Cloud Gateway 做统一入口
6. 加 timeout、retry、circuit breaker
7. 加 Prometheus 指标和 OpenTelemetry trace
8. 加 RabbitMQ / Kafka 做异步事件
9. 用 Docker Compose 或 Kubernetes 跑起来
10. 写一次完整排障记录和 RCA
```

这条线跑通后，你才算真正把“微服务”从概念变成作品集证据。

## 核心概念五件套

### 1. Spring Boot Application

**是什么**

一个 Spring Boot 应用通常从 `@SpringBootApplication` 标注的 main class 启动。

```java
@SpringBootApplication
public class OrderApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderApplication.class, args);
  }
}
```

**为什么需要**

它把组件扫描、自动配置、配置绑定、内嵌 Web 容器等能力串起来，让一个服务可以通过 `java -jar` 独立运行。

**怎么工作**

```text
main()
  -> SpringApplication.run()
  -> 创建 ApplicationContext
  -> 加载配置
  -> 自动配置 Bean
  -> 启动内嵌 Tomcat / Jetty / Netty
  -> 暴露 HTTP 端口
```

**怎么看 / 怎么用**

常用命令：

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw package
java -jar target/order-service-0.0.1-SNAPSHOT.jar
```

预期结果：

- 控制台看到 Spring Boot banner。
- 日志里看到应用启动端口。
- `curl http://localhost:8080/actuator/health` 返回 `UP`。

**坏了怎么查**

| 现象 | 先看哪里 |
|---|---|
| 启动失败 | 控制台异常栈、端口占用、配置缺失 |
| Bean 创建失败 | `Caused by` 最底层异常 |
| 端口冲突 | `server.port`、本机端口占用 |
| 环境不一致 | profiles、环境变量、配置中心 |

### 2. Starter 和自动配置

**是什么**

Spring Boot starter 是一组依赖组合，例如 `spring-boot-starter-web` 会带上 Web MVC、JSON、内嵌容器等常用依赖。

**为什么需要**

没有 starter 时，新手要手工拼很多依赖，还容易版本冲突。starter 和 Boot 的依赖管理让项目先以一套官方推荐组合跑起来。

**怎么工作**

```text
pom.xml 引入 starter
  -> Spring Boot 管理依赖版本
  -> classpath 中出现特定类
  -> auto-configuration 条件匹配
  -> 自动创建默认 Bean
```

**怎么看 / 怎么用**

最小 Web 服务常见依赖：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
  </dependency>
</dependencies>
```

**坏了怎么查**

- 依赖冲突：看 `mvn dependency:tree`。
- 自动配置没生效：看条件报告或启动 debug 日志。
- 版本混配：确认 Spring Boot 和 Spring Cloud release train 兼容。

### 3. 外部化配置

**是什么**

把端口、数据库地址、下游服务地址、超时、开关、日志级别等放到配置文件、环境变量、配置中心或 Kubernetes ConfigMap，而不是写死在代码里。

**为什么需要**

同一份代码要跑在 dev、test、prod。配置外置后，镜像和 jar 可以保持一致，环境差异交给配置处理。

**怎么工作**

```text
application.yml
  + application-prod.yml
  + environment variables
  + command line args
  + config server
  -> Spring Environment
  -> @ConfigurationProperties / @Value
```

**怎么看 / 怎么用**

示例：

```yaml
server:
  port: 8081

spring:
  application:
    name: order-service
  profiles:
    active: dev

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
```

**坏了怎么查**

| 现象 | 检查 |
|---|---|
| 本地正常，线上异常 | profile 是否正确 |
| 配置不生效 | key 是否写错、优先级是否被覆盖 |
| 配置中心改了没生效 | 客户端是否重新拉取、是否需要刷新 |
| 密码泄露 | Secret 是否误写进 Git |

### 4. REST API

**是什么**

REST API 是服务对外提供 HTTP 接口的常见方式。

**为什么需要**

微服务之间必须有明确接口，否则服务边界只是口号。API 是服务契约的一部分。

**怎么工作**

```text
HTTP request
  -> DispatcherServlet
  -> Controller
  -> Service
  -> Repository / Client
  -> HTTP response
```

**怎么看 / 怎么用**

示例：

```java
@RestController
@RequestMapping("/orders")
class OrderController {
  private final OrderService orderService;

  OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  OrderResponse create(@RequestBody CreateOrderRequest request) {
    return orderService.create(request);
  }
}
```

**坏了怎么查**

- 404：路径、方法、网关路由。
- 400：请求体、参数校验。
- 500：业务异常、下游调用、数据库。
- 慢：Controller、Service、下游依赖、连接池。

### 5. Actuator

**是什么**

Spring Boot Actuator 提供生产就绪端点，例如 health、metrics、prometheus、loggers、info。

**为什么需要**

AIOps 需要机器可读的健康状态、指标和运行信息。Actuator 是 Spring Boot 服务接入监控和自动化的入口。

**怎么工作**

```text
spring-boot-starter-actuator
  -> 自动注册 endpoint
  -> /actuator/health
  -> /actuator/metrics
  -> /actuator/prometheus
  -> Prometheus scrape
```

**怎么看 / 怎么用**

常用命令：

```bash
curl http://localhost:8081/actuator/health
curl http://localhost:8081/actuator/metrics
curl http://localhost:8081/actuator/metrics/http.server.requests
curl http://localhost:8081/actuator/prometheus
```

预期结果：

- health 返回 `UP` 或具体组件状态。
- metrics 能看到 HTTP、JVM、线程、连接池等指标。
- prometheus 端点返回 Prometheus 文本格式。

**坏了怎么查**

| 现象 | 检查 |
|---|---|
| 404 | 是否引入 actuator，是否暴露 endpoint |
| 403 | Spring Security 是否限制访问 |
| Prometheus 抓不到 | scrape path、端口、网络、ServiceMonitor |
| health 是 UP 但业务失败 | health 检查太浅，需要加自定义 HealthIndicator |

### 6. Metrics 和 Tracing

**是什么**

metrics 是可聚合的数值指标，tracing 是一次请求跨服务经过哪些步骤的链路。

**为什么需要**

微服务排障不能只看日志。你需要知道：

- 哪个服务错误率升高。
- 哪个接口延迟升高。
- 哪个下游调用慢。
- 哪个 trace 在哪个 span 卡住。

**怎么工作**

```text
Spring MVC / RestClient / DataSource
  -> Micrometer Observation
  -> metrics: http.server.requests, jdbc.connections...
  -> tracing: traceId, spanId
  -> Prometheus / OTLP / Zipkin
```

**怎么看 / 怎么用**

常见配置：

```yaml
management:
  tracing:
    sampling:
      probability: 1.0
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
  prometheus:
    metrics:
      export:
        enabled: true
```

**坏了怎么查**

- 指标没有：依赖、endpoint 暴露、Prometheus scrape。
- trace 没有：tracing 依赖、采样率、export endpoint。
- 跨服务断链：HTTP header 没透传、异步消息没带 trace context。
- 标签爆炸：把 userId、orderId 这类高基数字段放进 metrics tag。

### 7. 服务发现

**是什么**

服务发现解决“服务名如何找到真实实例地址”的问题。

**为什么需要**

微服务实例会扩缩容、重启、漂移。调用方不能写死 IP。

**怎么工作**

传统注册中心：

```text
payment-service 启动
  -> 注册到 Eureka / Consul
order-service 调 payment-service
  -> DiscoveryClient 查询实例
  -> LoadBalancer 选择实例
  -> 发起 HTTP 请求
```

Kubernetes：

```text
Pod
  -> Service
  -> Endpoints / EndpointSlice
  -> DNS: payment-service.default.svc.cluster.local
```

**怎么看 / 怎么用**

Kubernetes 检查：

```bash
kubectl get svc payment-service
kubectl get endpoints payment-service
kubectl get endpointslice -l kubernetes.io/service-name=payment-service
```

**坏了怎么查**

| 现象 | 检查 |
|---|---|
| unknown host | DNS、Service 名、namespace |
| connection refused | Pod 端口、容器端口、readiness |
| 只部分失败 | 某些实例不健康、Endpoints 混入坏实例 |
| 注册中心没有实例 | 应用名、注册配置、网络、心跳 |

### 8. 服务调用

**是什么**

服务调用是一个服务通过 HTTP 或消息访问另一个服务。

**为什么需要**

拆成微服务后，原来的本地方法调用变成远程调用。远程调用一定可能失败。

**怎么工作**

OpenFeign 示例：

```java
@FeignClient(name = "payment-service")
interface PaymentClient {
  @PostMapping("/payments")
  PaymentResponse pay(@RequestBody PayRequest request);
}
```

调用链：

```text
order-service
  -> PaymentClient
  -> LoadBalancer
  -> payment-service instance
  -> response / timeout / error
```

**怎么看 / 怎么用**

常见配置重点：

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          payment-service:
            connectTimeout: 1000
            readTimeout: 3000
```

**坏了怎么查**

- 超时：connectTimeout、readTimeout、下游延迟。
- 负载不均：LoadBalancer、实例权重、sticky session。
- 404：Feign path 和下游 Controller 是否一致。
- 重试风暴：retry 配置、幂等性、下游容量。

### 9. Gateway

**是什么**

Spring Cloud Gateway 是 API 网关，用来做统一入口、路由、过滤、限流、鉴权、灰度和监控。

**为什么需要**

外部请求不应该直接打到每个服务。网关把跨服务的公共逻辑收敛在入口层。

**怎么工作**

```text
client
  -> gateway
     -> route predicate match
     -> filters
     -> load-balanced downstream uri
  -> order-service
```

**怎么看 / 怎么用**

示例配置：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-route
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
```

**坏了怎么查**

| 现象 | 检查 |
|---|---|
| 404 | Path predicate、StripPrefix、下游路径 |
| 502 | 下游不可达、服务发现、连接拒绝 |
| 503 | 没有可用实例、readiness、注册中心 |
| 504 | 下游超时、网关 timeout、下游慢 |
| 请求头丢失 | filter 顺序、代理配置 |

### 10. 熔断、限流、超时和重试

**是什么**

这些是微服务容错手段：

| 手段 | 作用 |
|---|---|
| timeout | 不让请求无限等待 |
| retry | 应对短暂失败 |
| circuit breaker | 下游持续失败时快速失败 |
| rate limit | 控制入口流量 |
| bulkhead | 隔离资源池 |
| fallback | 返回降级结果 |

**为什么需要**

没有容错时，一个慢下游会拖垮上游，最后变成雪崩。

**怎么工作**

```text
request
  -> timeout guard
  -> retry policy
  -> circuit breaker state
     -> closed: 正常调用
     -> open: 快速失败
     -> half-open: 少量探测
```

**怎么看 / 怎么用**

Spring Cloud Circuit Breaker 常搭配 Resilience4j。配置重点不是背字段，而是知道每个字段保护什么：

```yaml
resilience4j:
  circuitbreaker:
    instances:
      payment:
        slidingWindowSize: 20
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
  timelimiter:
    instances:
      payment:
        timeoutDuration: 3s
```

**坏了怎么查**

- 熔断频繁打开：下游确实慢、阈值太敏感、超时太短。
- 重试导致流量放大：重试次数过多、没有退避、非幂等接口被重试。
- fallback 掩盖故障：降级返回太“正常”，告警没触发。
- 限流误伤：限流维度错误，没区分用户、接口、服务。

### 11. 数据边界和一致性

**是什么**

数据边界指每个服务应该拥有自己的数据模型和写入边界。

**为什么需要**

如果所有服务共享一套表，每个服务都能改别人数据，代码拆了，数据库还是单体。这就是常见的“分布式单体”。

**怎么工作**

推荐方向：

```text
order-service owns order tables
payment-service owns payment tables
inventory-service owns inventory tables

cross-service state
  -> event
  -> outbox
  -> saga / compensation
  -> eventual consistency
```

**怎么看 / 怎么用**

Outbox 最小表：

```sql
CREATE TABLE outbox_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**坏了怎么查**

- 事件没发出去：outbox 是否堆积。
- 消息重复消费：消费者是否幂等。
- 状态不一致：补偿动作是否执行。
- 事务边界混乱：是否跨服务同步改多个库。

## 最小项目：订单微服务系统

### 目标

做一个能放进 GitHub 的最小微服务实验：

```text
gateway-service
  -> order-service
     -> payment-service
     -> RabbitMQ / Kafka
  -> actuator metrics
  -> OpenTelemetry traces
```

先不要贪多。第一版只要跑通：

- 网关路由到 order-service。
- order-service 调 payment-service。
- payment-service 人为慢 2 秒。
- order-service 配 timeout 和 circuit breaker。
- Actuator 暴露 health、metrics、prometheus。
- Prometheus 抓到 `http.server.requests`。
- trace 能看到 gateway -> order -> payment。

### 目录结构

```text
labs/spring-microservices-aiops/
  README.md
  compose.yaml
  pom.xml
  gateway-service/
  order-service/
  payment-service/
  observability/
    prometheus.yml
    otel-collector-config.yaml
  docs/
    architecture.md
    troubleshooting.md
    rca-sample.md
```

### 服务端口约定

| 服务 | 端口 | 作用 |
|---|---:|---|
| gateway-service | 8080 | 对外入口 |
| order-service | 8081 | 订单 API |
| payment-service | 8082 | 支付 API |
| Prometheus | 9090 | 指标 |
| Grafana | 3000 | 仪表盘 |
| OpenTelemetry Collector | 4318 | OTLP HTTP |

### order-service 最小接口

```java
@RestController
@RequestMapping("/orders")
class OrderController {
  private final PaymentClient paymentClient;

  OrderController(PaymentClient paymentClient) {
    this.paymentClient = paymentClient;
  }

  @PostMapping
  Map<String, Object> create(@RequestBody Map<String, Object> request) {
    var payment = paymentClient.pay(Map.of("amount", request.get("amount")));
    return Map.of("status", "CREATED", "payment", payment);
  }
}
```

### payment-service 模拟慢接口

```java
@RestController
class PaymentController {
  @PostMapping("/payments")
  Map<String, Object> pay(@RequestBody Map<String, Object> request)
      throws InterruptedException {
    Thread.sleep(2000);
    return Map.of("status", "PAID");
  }
}
```

### Prometheus 抓取

```yaml
scrape_configs:
  - job_name: "spring-services"
    metrics_path: "/actuator/prometheus"
    static_configs:
      - targets:
          - "order-service:8081"
          - "payment-service:8082"
          - "gateway-service:8080"
```

## 命令字典

| 命令 | 作用 | 预期结果 | 常见坑 |
|---|---|---|---|
| `./mvnw test` | 跑单元测试 | 测试通过 | Java 版本不匹配 |
| `./mvnw package` | 打 jar | `target/*.jar` | 测试失败会中断 |
| `java -jar app.jar` | 启动服务 | 日志显示端口 | 配置文件路径不对 |
| `curl /actuator/health` | 看健康状态 | `UP` | endpoint 未暴露 |
| `curl /actuator/prometheus` | 看 Prometheus 指标 | 文本指标 | 缺少 registry 依赖 |
| `docker compose up --build` | 启动实验环境 | 多服务启动 | 服务名网络写错 |
| `kubectl get endpoints` | 看服务实例 | 有 endpoints | readiness 失败 |
| `kubectl logs` | 看 Pod 日志 | 输出异常栈 | 容器名选错 |

## 配置字典

| 配置 | 作用 | AIOps 关注点 |
|---|---|---|
| `spring.application.name` | 服务名 | 指标、日志、trace 的 service 名 |
| `server.port` | 监听端口 | 容器端口和 Service targetPort |
| `management.endpoints.web.exposure.include` | 暴露 Actuator endpoint | 最小暴露 health、metrics、prometheus |
| `management.tracing.sampling.probability` | trace 采样率 | 实验可 1.0，生产按成本调 |
| `management.otlp.tracing.endpoint` | trace 上报地址 | 指向 OTel Collector |
| `spring.cloud.gateway.routes` | 网关路由 | 404/502/504 排障关键 |
| `spring.cloud.openfeign.client.config` | Feign 超时 | 避免默认超时不符合生产 |
| `resilience4j.circuitbreaker.instances` | 熔断配置 | 防止下游故障扩散 |
| `spring.config.import` | 导入外部配置 | Config Server / configtree |

## AIOps 观测设计

### 服务标签

每个服务至少要统一这些标签：

```text
service.name
service.version
deployment.environment
team
region
cluster
```

这些标签要进入：

- Prometheus labels。
- OpenTelemetry resource attributes。
- 日志字段。
- 告警 labels。
- runbook 链接。
- 变更记录。

### 指标清单

| 指标 | 用途 |
|---|---|
| `http.server.requests` | 请求量、错误率、延迟 |
| `http.client.requests` | 下游调用量、错误率、延迟 |
| `jvm.memory.used` | JVM 内存 |
| `jvm.threads.live` | 线程数量 |
| `process.cpu.usage` | 进程 CPU |
| `jdbc.connections.active` | 数据库连接池 |
| `hikaricp.connections.pending` | 等连接的请求 |
| `resilience4j.circuitbreaker.calls` | 熔断器调用结果 |
| `rabbitmq.*` | RabbitMQ 连接和消息 |
| `kafka.*` | Kafka producer/consumer |

### 告警规则思路

不要只写“服务挂了”。微服务告警要分层：

| 层 | 示例 |
|---|---|
| 入口层 | gateway 5xx > 5% |
| 服务层 | order-service P95 > 1s |
| 下游层 | payment client timeout 增加 |
| 资源层 | JVM heap 使用率高 |
| 连接池 | Hikari pending > 0 持续 5m |
| 熔断 | circuit breaker open |
| 消息 | RabbitMQ ready messages 增长 |

## 排障路径

### 网关 404

检查顺序：

1. 请求路径是否匹配 Gateway predicate。
2. `StripPrefix` 是否把路径截错。
3. 下游 Controller 路径是否一致。
4. 网关是否加载了正确 profile。
5. 配置中心是否下发旧路由。

### 网关 502 / 503

检查顺序：

1. 下游服务是否启动。
2. 服务发现是否有实例。
3. Kubernetes Endpoints 是否为空。
4. readiness 是否失败。
5. 网关到下游网络是否通。
6. 下游端口是否写错。

### 网关 504 / 接口超时

检查顺序：

1. Gateway timeout。
2. Feign / RestClient timeout。
3. 下游服务 P95 / P99。
4. 数据库连接池。
5. 慢 SQL。
6. 线程池是否耗尽。
7. trace 中哪个 span 最慢。

### Feign 调用失败

检查顺序：

1. `@FeignClient(name = "...")` 是否等于服务名。
2. 下游路径和 HTTP 方法是否匹配。
3. 超时配置是否合理。
4. LoadBalancer 是否拿到实例。
5. 熔断器是否已 open。
6. 是否有重试风暴。

### Actuator 健康是 UP 但业务失败

常见原因：

- health 只检查进程，不检查关键下游。
- 自定义 HealthIndicator 缺失。
- readiness 和 liveness 混用。
- 业务依赖慢，但 health 没覆盖。

改进方向：

- liveness 只判断进程是否应该重启。
- readiness 判断是否能接流量。
- 核心依赖单独暴露 health component。
- 告警不要只依赖 health。

### Trace 断链

检查顺序：

1. 是否启用 tracing 依赖。
2. 采样率是否过低。
3. OTel Collector 地址是否正确。
4. HTTP header 是否透传。
5. Feign / WebClient 是否使用自动配置 builder。
6. 异步消息是否携带 trace context。

### 发布后错误率升高

检查顺序：

1. 对比发布前后 `service.version`。
2. 看 gateway、order、payment 哪层先升高。
3. 查 trace 中最慢 span。
4. 查日志中同一 traceId。
5. 查配置是否同步变更。
6. 查数据库、Redis、RabbitMQ/Kafka 指标。
7. 决定回滚、摘流、扩容或降级。

## 常见反模式

| 反模式 | 后果 | 修正方向 |
|---|---|---|
| 按 controller/dao/util 拆服务 | 调用链变长但业务边界没变 | 按业务能力拆 |
| 所有服务共享一个库 | 分布式单体 | 明确数据拥有者 |
| 没有 timeout | 请求堆积 | 每个下游调用设超时 |
| 无脑 retry | 流量放大 | 限制次数、退避、幂等 |
| 只看 health | 漏掉业务失败 | 指标、日志、trace 一起看 |
| trace 没有服务名 | 根因定位困难 | 统一 resource attributes |
| 配置写死在代码 | 多环境混乱 | 外部化配置 |
| 网关承载业务逻辑 | 网关变单体 | 网关只做入口和横切逻辑 |

## 面试怎么讲

微服务不是简单把一个系统拆成很多小应用，而是把系统按业务能力拆成可以独立开发、部署、扩展和观测的服务。Java 生态里，Spring Boot 负责把单个服务做成可独立运行、可配置、可监控的生产应用；Spring Cloud 负责解决多服务之间的配置管理、服务发现、服务调用、负载均衡、网关路由、熔断限流和消息协作。

真正落地时，我会先保证每个服务有清晰边界、独立配置、Actuator 健康检查、Prometheus 指标和 OpenTelemetry 链路。服务之间调用必须有 timeout、必要的 retry、熔断和幂等保护。网关只处理入口路由、鉴权、限流和统一观测，不承载业务逻辑。数据层避免多个服务随意共享表，跨服务一致性优先用事件、Outbox、Saga 和补偿动作处理。

在 AIOps 场景中，我会把服务名、版本、环境、实例、接口、下游依赖、traceId 和部署记录作为统一关联键。这样当 gateway 5xx 升高时，可以从指标定位到服务，从 trace 找到慢 span，从日志定位异常，从变更记录判断是否由发布引起，再用 runbook 给出扩容、回滚、摘流、降级或修复建议。

## 学习检查清单

- [ ] 我能解释 Spring Boot 和 Spring Cloud 的分工。
- [ ] 我能用 Spring Initializr 创建一个 Boot Web + Actuator 服务。
- [ ] 我能说明 starter、自动配置、外部化配置的作用。
- [ ] 我能写一个 REST Controller 并用 curl 调通。
- [ ] 我能暴露 `/actuator/health`、`/actuator/metrics`、`/actuator/prometheus`。
- [ ] 我能解释 service discovery 在注册中心和 Kubernetes 中的两种方式。
- [ ] 我能用 OpenFeign 或 RestClient 调用下游服务。
- [ ] 我能解释 Gateway 的 route、predicate、filter。
- [ ] 我能说明 timeout、retry、circuit breaker、rate limit 的区别。
- [ ] 我能说出微服务数据一致性的常见方案。
- [ ] 我能把 Spring Boot 指标接入 Prometheus。
- [ ] 我能把 traceId 用于日志、链路和排障关联。
- [ ] 我能排查 404、502、503、504、Feign timeout、Actuator UP 但业务失败。
- [ ] 我能把微服务故障整理成 AIOps RCA。

## 面试题

1. Spring Boot 和 Spring Cloud 分别解决什么问题？
2. 为什么 Spring Boot 适合写微服务？
3. 什么是 starter？自动配置大概怎么工作？
4. 外部化配置为什么重要？
5. Actuator 有哪些常用 endpoint？哪些适合暴露给 Prometheus？
6. 服务发现解决什么问题？Kubernetes 下还需要注册中心吗？
7. OpenFeign、RestClient、WebClient 怎么取舍？
8. Gateway 的 route、predicate、filter 分别是什么？
9. 网关返回 502 / 503 / 504 你会怎么排查？
10. timeout、retry、circuit breaker、rate limit 分别解决什么问题？
11. 为什么无脑 retry 可能造成故障放大？
12. 什么是分布式单体？
13. 微服务之间如何处理数据一致性？
14. Spring Boot 如何接入 Prometheus 指标？
15. Spring Boot 如何接入 tracing？
16. 发布后错误率升高，你如何用指标、日志、trace、变更定位？
17. AIOps 如何利用微服务拓扑做根因分析？
18. 你会如何设计一个 Spring 微服务作品集项目？

## 学习证据

学完后建议提交到 GitHub：

- `labs/spring-microservices-aiops/README.md`
- `labs/spring-microservices-aiops/compose.yaml`
- `gateway-service`、`order-service`、`payment-service` 三个 Spring Boot 服务。
- 一份 `prometheus.yml`，能抓 `/actuator/prometheus`。
- 一份 OpenTelemetry Collector 配置。
- 一张架构图：`docs/architecture.md`。
- 一份 Gateway 404/502/504 排障记录。
- 一份 Feign timeout + circuit breaker 实验记录。
- 一份 `service-label-standard.md`，定义 service、env、version、owner、traceId。
- 一份 RCA：`发布后 order-service 错误率升高排查.md`。

## 本篇小结

微服务的难点不是“把项目拆成几个目录”，而是拆完之后每个服务仍然能独立运行、稳定调用、清晰观测、快速排障和安全发布。

Spring Boot 给你单服务生产化能力：启动、配置、Web、Actuator、metrics、tracing、打包。

Spring Cloud 给你分布式协作能力：配置、发现、调用、负载均衡、网关、熔断、消息。

AIOps 要做的，是把这些能力变成可关联的数据：

```text
service
  -> metrics
  -> logs
  -> traces
  -> alerts
  -> deploy changes
  -> runbooks
  -> RCA
```

当这条链路打通后，微服务才不只是架构名词，而是可以被监控、被诊断、被自动化治理的生产系统。
