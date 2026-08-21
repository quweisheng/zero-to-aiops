# Java 技术栈深讲

> 学习目标：让零基础读者先分清 Java、JDK、JRE、JVM、OpenJDK 和不同 JDK 发行版，再从第一段源码一路理解编译、字节码、类加载、解释执行、JIT、内存、GC、线程与并发；最终能写出一个可编译、可测试、可观测的 AIOps 小程序，能用 JFR、`jcmd` 和 Thread Dump 排查生产问题，并能回答大厂面试中的机制、权衡、事故和系统设计追问。

## 官方资料

- [dev.java 学习中心](https://dev.java/learn/)
- [Java Language Updates](https://docs.oracle.com/en/java/javase/26/language/java-language-changes.html)
- [Java SE 26 API](https://docs.oracle.com/en/java/javase/26/docs/api/)
- [Java Language Specification 26](https://docs.oracle.com/javase/specs/jls/se26/html/)
- [Java Virtual Machine Specification 26](https://docs.oracle.com/javase/specs/jvms/se26/html/)
- [OpenJDK JDK 26 项目](https://openjdk.org/projects/jdk/26/)
- [JDK 26 正式构建下载](https://jdk.java.net/26/)
- [JDK 26 Release Notes](https://www.oracle.com/java/technologies/javase/26-relnotes.html)
- [JDK 26.0.2 Release Notes](https://www.oracle.com/java/technologies/javase/26-0-2-relnotes.html)
- [Oracle Java Security Baselines](https://ops.java/security/baselines/)
- [Oracle 2026 年 8 月 Critical Security Patch Update](https://www.oracle.com/security-alerts/cspuaug2026.html)
- [Oracle Java SE Support Roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)
- [Oracle JDK Licensing FAQ](https://www.oracle.com/java/technologies/javase/jdk-faqs.html)
- [OpenJDK GPLv2 + Classpath Exception](https://openjdk.org/legal/gplv2+ce.html)
- [JEP 3：JDK Release Process](https://openjdk.org/jeps/3)
- [Java Platform Module System](https://dev.java/learn/modules/)
- [JEP 444：Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 491：Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)
- [JEP 525：Structured Concurrency (Sixth Preview)](https://openjdk.org/jeps/525)
- [JEP 486：Permanently Disable the Security Manager](https://openjdk.org/jeps/486)
- [JEP 400：UTF-8 by Default](https://openjdk.org/jeps/400)
- [Java Core Libraries](https://dev.java/learn/)
- [Java Tools Reference](https://docs.oracle.com/en/java/javase/26/docs/specs/man/)
- [Java Flight Recorder](https://docs.oracle.com/en/java/javase/26/jfapi/)
- [JDK Flight Recorder 指南](https://docs.oracle.com/en/java/javase/26/jfapi/flight-recorder.html)
- [Java Monitoring and Management Guide](https://docs.oracle.com/en/java/javase/26/management/)
- [Java Troubleshooting Guide](https://docs.oracle.com/en/java/javase/26/troubleshoot/)
- [Java Security Developer's Guide](https://docs.oracle.com/en/java/javase/26/security/)
- [Java Secure Coding Guidelines](https://www.oracle.com/java/technologies/javase/seccodeguide.html)

说明：本文依据 OpenJDK、Java 语言与虚拟机规范、Oracle Java 官方文档重新组织，不复制官方长段落。语言规范、虚拟机规范、OpenJDK 项目和某个厂商的构建、许可、商业支持不是同一个层次；生产选型必须同时核对目标 JDK 版本、发行方、操作系统/CPU、框架与中间件认证、许可和支持周期。

## 版本、LTS 与许可边界

本文快照日期是 2026-08-21。Oracle 的公开下载与发行说明仍把 Java SE 26.0.2（完整构建号 `26.0.2+10`）列为当前正式功能版本；但 2026-08-18 的 Critical Security Patch Update（CSPU，关键安全补丁更新）已经把 Oracle 安全基线提高到 26.0.2.1、25.0.4.1、21.0.12.1、17.0.20.1、11.0.32.1 和 8u503。CSPU 公告也明确把此前的 26.0.2、25.0.4、21.0.12、17.0.20、11.0.32、8u501 列为受影响版本。

这说明“公开下载页上的最新 GA 版本”和“当前安全基线”可能暂时不是同一个数字。Oracle CSPU 补丁面向具有有效支持合同的客户；Temurin、Corretto、Microsoft、Red Hat 等发行版是否受影响、何时发布修复、版本号如何写，必须查各自公告。生产选型不能只抄本文数字，应把“发行方 + 完整版本 + 获取渠道 + 安全公告日期”一起记录，并在每次发布前重新核验。

学习主线区分两类版本：

| 版本线 | 本文定位 | 选用时先问什么 |
|---|---|---|
| JDK 26 / Oracle 基线 26.0.2.1 | 当前功能版本主线，2026-03 GA、非 LTS，用于认识最新正式 Java SE 能力 | 框架、中间件、Agent、驱动和公司支持矩阵是否已认证；能否取得当前安全补丁 |
| JDK 25 / Oracle 基线 25.0.4.1 | 2025-09 GA；Oracle 与多数厂商视为当前 LTS，适合作为新项目长期维护候选 | 具体发行方承诺支持多久、补丁如何获取、许可是什么 |
| JDK 21 / 17（Oracle 基线 21.0.12.1 / 17.0.20.1） | 广泛使用的较早 LTS 版本线 | 业务依赖和供应商是否仍支持，安全补丁是否持续交付 |
| JDK 8 / 11 | 大量存量系统仍在运行 | 是否已进入迁移窗口，TLS、GC、依赖和中间件约束是什么 |

LTS 是 Long-Term Support，意思是“某个发行方承诺较长时间维护某条版本线”。它不等于“所有 OpenJDK 构建都自动获得同样年限的免费补丁”。同一个 Java 版本可以有 Oracle JDK、Eclipse Temurin、Microsoft Build of OpenJDK、Amazon Corretto、IBM Semeru 等不同构建；它们实现同一平台标准，但打包、补丁节奏、支持期限、虚拟机选择和商业条款可能不同。

OpenJDK JDK 25 项目页的原话边界是“多数厂商会把 JDK 25 作为 LTS”；Oracle 路线图则明确把 8、11、17、21、25 列为 Oracle LTS，并列出 Oracle 客户支持日期。这两句话不能互相替代。Oracle JDK 21 在 NFTC 下的更新许可还计划于 2026-09 后变化，生产资产应按实际发行方和法务结论盘点，而不是只看 `java -version` 的数字。

### JDK 26 的正式、Preview 与 Incubator 边界

JDK 26 的 HTTP Client HTTP/3 支持等属于正式交付功能；Structured Concurrency 仍是第六次 Preview，primitive pattern 仍是第四次 Preview，Lazy Constants/PEM API 也仍是 Preview，Vector API 仍是 Incubator。Preview/Incubator API 可能继续变化，不能不加说明地写进长期兼容的公共库。

Preview 代码必须显式选择目标版本：

```powershell
javac --release 26 --enable-preview Main.java
java --enable-preview Main
```

本文的基础实验故意不用 Preview，目标是让生成的 Java 21 class 在常规 Java 21+ 环境运行。

还要分清两件事：

- OpenJDK 源代码主要使用 GPLv2 with Classpath Exception；Classpath Exception 让普通 Java 应用链接标准类库时不因此自动变成 GPL 应用。
- 某个可下载二进制的使用条款、更新服务和商业支持，以该发行方当前页面和合同为准，不能只凭“Java 是免费的”或“Oracle Java 要收费”一句话下结论。

## 官方知识地图

```text
Java language
  -> syntax / types / classes / interfaces / generics
  -> exceptions / annotations / lambdas / streams
  -> Java Memory Model and concurrency rules

JDK toolchain
  -> javac / java / jar / javap / javadoc / jshell
  -> jdeps / jlink / keytool
  -> jcmd / jstack / jmap / jstat / jfr

JVM runtime
  -> class loading / verification / linking / initialization
  -> interpreter / JIT / code cache
  -> heap / metaspace / thread stack / native memory
  -> garbage collection / safepoint / threads

Production engineering
  -> package and dependency governance
  -> configuration / logs / metrics / traces / JFR
  -> capacity / security / HA / deployment
  -> upgrade / rollback / incident evidence
```

本文按“语言与工具链 -> JVM 执行路径 -> 并发与内存 -> 生产运行 -> AIOps 实验 -> 故障排查 -> 面试与系统设计”推进。

## 学习边界与面试目标

基础层要做到：

- 能安装 JDK，并确认 `java` 与 `javac` 真正来自哪个目录。
- 能编译、运行、打包一个小程序，理解源码、字节码和进程的关系。
- 能使用变量、方法、类、接口、record、集合、异常、泛型、Lambda 和 Stream。
- 能分清 checked exception、runtime exception 和 Error，不用空的 `catch` 隐藏故障。
- 能写最小单元逻辑，知道 Maven/Gradle 与 Java 语言本身的边界。
- 能读结构化日志，查看 JVM 版本、线程、堆和 JFR 记录。

进阶面试层还要做到：

- 解释类加载、双亲委派、类身份、链接、初始化和常见 LinkageError。
- 解释栈、堆、Metaspace、Code Cache、Direct Memory 与本地内存的差异。
- 解释解释器、分层编译、JIT、逃逸分析、去优化和预热，而不是只背“Java 跨平台”。
- 用 Java Memory Model 的 happens-before 关系分析 `synchronized`、`volatile`、锁和原子变量。
- 区分平台线程与虚拟线程，知道虚拟线程解决的是并发规模而不是让 CPU 计算变快。
- 根据暂停目标、吞吐、堆大小和版本选择 GC，并能从 GC 日志和 JFR 形成证据链。
- 设计限流、超时、背压、线程池、连接池、优雅停机、可观测性和灰度回滚。
- 处理 CPU 高、堆增长、Full GC、死锁、线程池耗尽、类冲突和版本升级事故。

本文不会从零实现 HotSpot 编译器或垃圾回收器，也不展开 Spring、Tomcat、WebSphere、Maven 的全部细节；这些内容在仓库对应专题继续学习。本文负责把 Java/JDK/JVM 这条公共底座讲完整。

## 场景开场

凌晨 02:10，告警平台显示订单服务接口延迟突然升高。运维看到：

- Java 进程仍在，端口也能建立连接；
- CPU 只有 45%，但请求排队越来越多；
- 日志没有明显异常，只偶尔出现超时；
- 重启后暂时恢复，几个小时后再次发生。

“进程在”并不等于应用能正常处理请求。问题可能是两个线程互相等锁、线程池被慢下游占满、数据库连接池枯竭、GC 长暂停、堆外内存不足、类加载死锁，或业务自己建立了无界队列。

Java 技术栈的价值，就是把一个看似黑盒的 `java.exe` 拆成可以观察和推理的对象：类、对象、线程、锁、堆、GC、编译代码、文件、Socket、依赖、配置和诊断事件。

## 一句话人话版

Java 是一门把源码编译成平台无关字节码、再由 JVM 在具体机器上校验和执行的强类型语言；JDK 同时提供编译、运行、打包、安全和生产诊断工具。

## 小白可能会问

### Java、JavaScript 是一回事吗

不是。两者名称相似，但语言设计、运行环境、类型系统和生态不同。Java 常运行在 JVM 上；JavaScript 常运行在浏览器或 Node.js 中。

### 装了 JRE 能不能写 Java

传统 JRE 主要用于运行，JDK 才包含 `javac` 等开发工具。现代 JDK 已经包含运行所需模块，Oracle 从 JDK 11 起不再单独提供传统 Oracle JRE 下载。学习和生产构建通常直接选受支持的 JDK；需要更小运行时可以用 `jlink` 按模块生成，但必须测试完整依赖。

### JVM 是不是 Java 虚拟机软件的名字

JVM 既指 Java Virtual Machine 规范，也常泛指具体实现。HotSpot、OpenJ9 都能实现 JVM 规范，但内部 GC、JIT、诊断参数和行为不必完全相同。看到 `java -version` 里的 VM 名称后再判断，不要把 HotSpot 参数照搬到所有 JVM。

### Java 是解释型还是编译型

两者都涉及。`javac` 先把源码编译成字节码；JVM 可以解释执行热点尚未编译的字节码，也会用 JIT 把热点编译成本地机器码。部分场景还会用 AOT 或 Native Image，但那是另一套启动、峰值性能和兼容性权衡。

### 有 GC 就不会内存泄漏吗

不会自动保证。只要仍有强引用能从 GC Roots 到达对象，GC 就认为它还活着。无界缓存、监听器未注销、ThreadLocal 未清理、类加载器无法卸载都可能造成逻辑泄漏；堆外内存、线程栈和本地库也不完全由普通 Heap GC 解决。

### Java 一次编译真的到处运行吗

更准确地说，符合某个 class 文件版本和标准 API 的字节码，可以在兼容的 JVM 与运行环境上运行。JNI、本地库、文件路径、字符集、时区、操作系统权限、CPU 架构和厂商扩展仍会带来平台差异。

## Java 是什么，解决什么问题

Java 把一套强类型语言、标准类库、字节码格式、虚拟机规范和工具链放在一起。它主要解决三类工程问题：让编译器尽早发现类型错误，让同一套字节码可由不同平台 JVM 执行，并让大型长期运行服务获得成熟的内存管理、并发、诊断和生态支持。

它不负责自动解决业务拆分、数据库一致性、消息可靠性或服务高可用；这些能力需要应用架构、框架和基础设施共同完成。

## 为什么值得 AIOps 工程师学习

企业告警经常只告诉你“某个 Java 接口慢了”或“某个 JVM 内存高了”。如果不理解 JVM，就容易把所有问题都归因于 GC，然后重启或盲目加堆。掌握 Java 后，你能把同一时间窗的请求、线程、锁、连接池、Heap/native、GC、JFR、容器和最近变更连成证据链，也能把排障动作写成受控 Runbook。

## 核心原则

1. 区分规范、实现、发行版和应用框架，结论必须落到真实版本。
2. 区分编译期、类加载期、启动期和运行期，错误发生在哪一段就收哪一段证据。
3. 区分 Heap 与整个进程内存，GC 只管理受管对象的主要部分。
4. 并发先定义状态所有权和 happens-before，再选锁、队列、原子变量或虚拟线程。
5. 生产调优先量化 SLO 与瓶颈，再改参数；没有前后对照就不叫优化。
6. 交付时把 JDK、依赖、Agent、配置、数据兼容和回滚当作一个整体。

## Java 在 AIOps 链路中的位置

```text
metrics / logs / traces / alerts / tickets
                 |
                 v
Java service / collector / rule engine / automation API
  -> threads and virtual threads process work
  -> HTTP / JDBC / messaging call dependencies
  -> logs describe events
  -> metrics describe rates and resources
  -> traces connect cross-service latency
  -> JFR and thread dumps expose JVM internals
                 |
                 v
alert correlation / anomaly detection / RCA / runbook automation
```

Java 常见于银行、保险、政企、运营商、电商和大型平台的核心服务，也常用于流处理、消息消费、监控后台、CMDB、任务调度和自动化编排。AIOps 工程师不一定每天写复杂业务，但必须能把 JVM 指标、应用日志、Trace、线程栈、GC 和变更记录关联起来。

## 先分清 Java、JDK、JRE、JVM 与 OpenJDK

| 名词 | 人话解释 | 你怎么验证 | 常见误区 |
|---|---|---|---|
| Java | 语言、平台规范和生态的统称 | 看源码、JLS、API 和目标版本 | 把 Java 等同于某个厂商安装包 |
| Java SE | 标准平台，定义语言、JVM 与核心 API 基线 | 看对应版本规范和 API | 与 Jakarta EE 或 Spring 混为一谈 |
| JDK | 开发工具包，包含运行时、编译器和诊断工具 | `java -version`、`javac -version` | 只检查 `java`，忽略 `javac` 来自另一目录 |
| JRE | 传统“只运行”组合的名称 | 现代生产通常核对实际 runtime image | 认为现代所有厂商仍单独发传统 JRE |
| JVM | 执行 class 字节码的抽象机与具体实现 | `java -version` 看 VM 名称 | 把 HotSpot 的所有细节说成 JVM 规范 |
| OpenJDK | Java SE 的开源参考实现项目与代码社区 | 看 `openjdk.org` 项目和构建来源 | 认为所有 OpenJDK 二进制支持政策完全一样 |
| Jakarta EE | 企业 Java 规范集合，如 Servlet、JPA、JMS | 看应用服务器和命名空间 | 认为 JDK 自带全部企业容器能力 |
| Spring | Java 应用开发生态 | 看项目依赖与框架版本 | 把 Spring 当成 Java 语言本身 |

## 架构与数据流：一段代码怎样变成运行中的进程

```text
AlertDigest.java
  -> javac parses and type-checks source
  -> AlertDigest.class bytecode
  -> java starts a JVM process
  -> class loader finds the class
  -> verifier checks bytecode safety
  -> linking prepares and resolves symbols
  -> class initialization runs static initialization
  -> interpreter starts execution
  -> JIT compiles hot methods to machine code
  -> GC reclaims unreachable managed objects
  -> OS schedules threads and performs I/O
```

这条链路解释了许多错误为何发生在不同阶段：

- `javac` 报错：通常是语法、类型或 API 使用问题。
- `UnsupportedClassVersionError`：运行 JDK 太旧，读不懂 class 版本。
- `ClassNotFoundException`：类加载器按指定名字找不到类。
- `NoClassDefFoundError`：编译时或早期可见的类，在运行时缺失或初始化失败。
- `NoSuchMethodError`：调用方按一种依赖版本编译，运行时却加载了不兼容版本。
- `ExceptionInInitializerError`：类静态初始化失败。
- `OutOfMemoryError`：可能是 Heap、Metaspace、Direct Buffer、本地线程或其他资源不足，不能只改 `-Xmx`。

## 安装与环境确认

### 选哪一版

零基础学习可以使用当前受支持的 JDK 25 LTS；若要研究最新正式语言/JVM 功能，可另装 JDK 26。公司项目先服从框架、中间件、数据库驱动、APM Agent 和供应商认证矩阵，不要在生产服务器上直接替换默认 Java。

### Windows

1. 从选定发行方的官方页面下载与 CPU 架构匹配的 JDK 安装包。
2. 记录版本、发行方、下载 URL 和 SHA256；企业环境按软件准入流程验证签名。
3. 安装后把 `JAVA_HOME` 指向 JDK 根目录，不要指向 `bin` 或 `java.exe`。
4. 把 `%JAVA_HOME%\bin` 加入 `PATH`，重新打开 PowerShell。
5. 逐项验证：

```powershell
java -version
javac -version
Get-Command java | Select-Object -ExpandProperty Source
Get-Command javac | Select-Object -ExpandProperty Source
$env:JAVA_HOME
```

预期 `java`、`javac` 来自同一 JDK 系列，版本满足项目要求。Windows 常有 `C:\Program Files\Common Files\Oracle\Java\javapath`、旧 IDE、自带 Maven 或应用服务器修改 `PATH`，所以不能只看 `JAVA_HOME`。

### Linux

包名随发行版和 JDK 发行方变化，先用包管理器查看候选版本。下面只展示检查思路：

```bash
java -version
javac -version
command -v java
readlink -f "$(command -v java)"
echo "$JAVA_HOME"
```

RPM/DEB 管理的 JDK 应由包管理器升级；手工解压的 JDK 应放在版本化目录，并用明确的软链接或服务配置切换。不要删除系统正在使用的旧目录后才验证新版本。

### macOS

```bash
/usr/libexec/java_home -V
java -version
javac -version
```

`/usr/libexec/java_home -V` 能列出系统发现的 JDK。IDE、终端和 CI 可能各自选择不同 JDK，仍要在真实构建进程里输出版本。

## 第一个 Java 程序

创建 `HelloAiOps.java`：

```java
public final class HelloAiOps {
    public static void main(String[] args) {
        System.out.println("hello, AIOps");
    }
}
```

编译和运行：

```powershell
javac HelloAiOps.java
java -cp . HelloAiOps
```

预期输出：

```text
hello, AIOps
```

`javac` 把 `.java` 编译为 `.class`；`java -cp . HelloAiOps` 告诉 JVM 从当前目录这个 classpath 中寻找 `HelloAiOps`。这里传类的全限定名，不写 `.class` 后缀。

也可以在支持 source-file mode 的 JDK 上直接执行：

```powershell
java HelloAiOps.java
```

这适合单文件学习或小脚本，不代表大型项目无需构建、测试和依赖治理。

## `main` 方法逐词理解

```java
public static void main(String[] args)
```

- `public`：JVM 启动器需要从类外调用它。
- `static`：不先创建 `HelloAiOps` 对象就能调用。
- `void`：方法不返回 Java 值；进程退出码可用 `System.exit` 指定。
- `main`：约定的入口名。
- `String[] args`：命令行参数数组，例如 `java HelloAiOps prod` 中的 `prod`。

## 包、类名与目录

真实项目不会把所有类堆在根目录。下面源码声明：

```java
package lab.aiops;

public final class HelloAiOps {
    public static void main(String[] args) {
        System.out.println("hello, AIOps");
    }
}
```

文件通常放在 `src/lab/aiops/HelloAiOps.java`，编译到独立输出目录：

```powershell
New-Item -ItemType Directory -Force out
javac -d out src\lab\aiops\HelloAiOps.java
java -cp out lab.aiops.HelloAiOps
```

`package` 是命名与访问边界；目录结构是工具约定。`lab.aiops.HelloAiOps` 是全限定类名。不要把包名、Maven 的 `groupId`、JAR 文件名和 Java Module 名称混成同一个东西。

## 变量、基本类型与引用类型

Java 有 8 个 primitive type（基本类型）：

| 类型 | 常见用途 | 初学陷阱 |
|---|---|---|
| `boolean` | 真/假状态 | 不能拿整数当布尔值 |
| `byte` / `short` / `int` / `long` | 整数 | 溢出通常不会自动报错 |
| `float` / `double` | 浮点数 | 不适合直接表示精确金额 |
| `char` | 一个 UTF-16 code unit | 不保证等于一个完整 Unicode 字符 |

其他如 `String`、数组、集合和自定义类属于引用类型。引用变量保存“如何找到对象”，不是把对象所有字节直接塞进变量。

```java
int retryLimit = 3;
long timeoutMillis = 5_000L;
double errorRate = 0.015;
boolean enabled = true;
String service = "order-api";
```

局部变量使用前必须赋值；对象字段会有默认值，但依赖默认值会让配置语义不清。金额通常用 `BigDecimal` 并明确舍入规则；时间点优先用 `Instant`，业务时区用 `ZonedDateTime`。

### `var` 不是动态类型

```java
var service = "order-api";
```

编译器从右侧推断 `service` 为 `String`，之后不能赋成整数。`var` 只用于局部变量，适合右侧类型明显的场景；过度使用会降低可读性。

### `==` 与 `equals`

```java
String left = new String("critical");
String right = new String("critical");

System.out.println(left == right);      // 比较引用身份，通常是 false
System.out.println(left.equals(right)); // 比较 String 内容，是 true
```

自定义值对象若参与集合键、去重或比较，应正确实现 `equals` 与 `hashCode`；record 会按组件生成这类值语义方法。

## 条件、循环与 switch

```java
if (latencyMillis >= 1_000) {
    System.out.println("slow");
} else {
    System.out.println("normal");
}

for (String service : services) {
    System.out.println(service);
}
```

switch expression 可以直接产生值：

```java
String priority = switch (statusCode / 100) {
    case 2 -> "ok";
    case 4 -> "client";
    case 5 -> "server";
    default -> "other";
};
```

生产规则不要形成几百行嵌套分支。把解析、校验、分类和副作用拆开，并用测试覆盖边界值。

## 方法、参数与返回值

```java
static boolean shouldPage(long latencyMillis, int failures) {
    return latencyMillis >= 1_000 && failures >= 3;
}
```

Java 总是按值传递参数。传基本类型时复制数值；传对象时复制引用值。方法可以通过这个引用修改同一可变对象，但不能让调用方变量神奇地改指向另一个对象。

```java
static void replace(List<String> values) {
    values = List.of("new"); // 只改变本方法里的引用副本
}
```

面试中说“对象是引用传递”不准确。更准确的回答是“对象引用本身按值传递”。

## 类、对象、封装与组合

```java
public final class AlertCounter {
    private long total;

    public void increment() {
        total++;
    }

    public long total() {
        return total;
    }
}
```

- class 定义状态和行为。
- object 是 class 的运行时实例。
- `private` 隐藏内部状态，公开方法维护约束。
- `final class` 禁止继承，减少不受控扩展。

继承适合稳定的“is-a”关系；组合常更容易测试和替换：

```java
final class AlertService {
    private final TicketClient ticketClient;

    AlertService(TicketClient ticketClient) {
        this.ticketClient = ticketClient;
    }
}
```

这里 `AlertService` 使用 `TicketClient`，无需继承它。构造器注入还能让测试传入假的客户端。

## interface、abstract class 与多态

```java
interface TicketClient {
    String create(String summary);
}
```

interface 定义调用方需要的契约；不同实现可以连接真实工单、测试桩或本地文件。abstract class 还能复用部分状态和实现，但会引入单继承约束。

多态不是“为了设计模式而设计”。它的价值是让上层依赖稳定能力，而不是绑死某个基础设施实现。坏了时先确认实际注入了哪一个实现、代理层做了什么、调用是否跨线程或网络。

## record、enum 与 sealed class

record 适合表达透明、不可重新赋值组件的浅不可变数据载体：

```java
record Alert(String service, Severity severity, long latencyMillis) {
    Alert {
        if (latencyMillis < 0) {
            throw new IllegalArgumentException("latencyMillis must be >= 0");
        }
    }
}

enum Severity {
    INFO, WARNING, CRITICAL
}
```

record 的组件引用若指向可变集合，集合仍可能被修改，所以它不是自动“深不可变”。enum 比散落字符串更能让编译器检查合法值。

sealed class/interface 可以限制允许的子类型：

```java
sealed interface DeliveryResult permits Delivered, Rejected {}
record Delivered(String ticketId) implements DeliveryResult {}
record Rejected(String reason) implements DeliveryResult {}
```

它适合有限状态模型。加入新子类型时，穷尽 switch 会提示需要处理的新分支。

## 异常：失败也要有类型和边界

```java
try {
    ticketClient.create(summary);
} catch (TimeoutException exception) {
    logger.warn("ticket request timed out", exception);
    throw new TicketDeliveryException("ticket delivery failed", exception);
}
```

### 三类失败

- checked exception：继承 `Exception` 但不继承 `RuntimeException`，调用方必须捕获或声明，例如部分 I/O 异常。
- runtime exception：通常代表参数、状态、编程契约或无法在当前层恢复的问题。
- `Error`：JVM 或系统级严重问题，如 `OutOfMemoryError`；通常不应把它当普通业务异常吞掉继续运行。

### 正确处理原则

1. 在有能力补充上下文、恢复、转换边界或清理资源的层处理。
2. 保留原始 `cause`，否则证据链断裂。
3. 日志记录一次有用上下文，避免每层重复打印同一堆栈。
4. 重试必须限定次数、退避、超时，并确认操作是否幂等。
5. 不写空 `catch`，不返回模糊的 `null` 假装成功。

## 泛型：让容器和算法保留类型信息

```java
List<Alert> alerts = new ArrayList<>();
Optional<Alert> firstCritical = alerts.stream()
    .filter(alert -> alert.severity() == Severity.CRITICAL)
    .findFirst();
```

泛型主要在编译期提供类型检查。Java 通常通过 type erasure 实现泛型，所以运行时 `List<String>` 与 `List<Integer>` 的原始类都是 `List`；不能直接 `new T()`，也不能可靠用 `instanceof List<String>`。

PECS 是常见读取/写入口诀：Producer Extends, Consumer Super。

```java
static double sum(List<? extends Number> values) { /* 主要读取 */ }
static void addDefaults(List<? super Integer> values) { /* 可以写 Integer */ }
```

不要把 raw type 如 `List` 与参数化类型混用，否则编译器无法帮你阻止运行时 `ClassCastException`。

## 集合怎么选

| 需求 | 常用选择 | 关键边界 |
|---|---|---|
| 有顺序、允许重复 | `ArrayList` | 随机访问快，中间插入可能搬移元素 |
| 去重 | `HashSet` | 依赖正确的 `equals/hashCode`，不保证业务排序 |
| 键值查找 | `HashMap` | 普通实现不保证线程安全 |
| 有序键值 | `TreeMap` | 按自然顺序或 Comparator，操作通常为 O(log n) |
| 并发键值 | `ConcurrentHashMap` | 单个操作并发安全，不代表多步业务事务原子 |
| 阻塞任务队列 | `ArrayBlockingQueue` 等 | 容量要有界，生产/消费策略要明确 |

```java
Map<String, Long> counts = new HashMap<>();
counts.merge("order-api", 1L, Long::sum);
```

复杂度只是第一步。还要看数据量、对象开销、访问局部性、并发模型、迭代顺序和是否允许 `null`。

## Lambda、Stream 与 Optional

```java
long criticalCount = alerts.stream()
    .filter(alert -> alert.severity() == Severity.CRITICAL)
    .map(Alert::service)
    .distinct()
    .count();
```

Stream 是描述数据处理流水线的 API，不是存数据的集合。中间操作通常惰性执行，终止操作才触发计算。它适合清晰的转换、过滤和聚合；包含复杂副作用、异常控制或性能热点时，普通循环可能更直观。

`parallelStream()` 不是免费加速按钮。它通常使用公共 ForkJoinPool，会与其他任务争用线程；阻塞 I/O、数据量小、顺序敏感或共享可变状态时可能更慢或出错。

`Optional` 适合方法返回值表达“可能没有”，不建议把它机械用于所有字段、参数或集合元素。不要用 `optional.get()` 把显式缺失重新变成隐藏异常。

## 字符串、字符集与文本边界

Java `String` 使用 Unicode 表示文本，但 `char` 是 UTF-16 code unit，一个 emoji 可能需要一对 surrogate。按用户可见字符截断时不能简单按 `char` 数量处理。

文件和网络边界必须明确字符集：

```java
String content = Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(output, content, StandardCharsets.UTF_8);
```

不要依赖机器默认编码。JDK 18 起标准 Java API 的默认字符集改为 UTF-8，但外部程序、存量文件、控制台和本地库仍可能不同；协议与文件格式应显式声明。

## 时间：Instant、Duration 与时区

```java
Instant startedAt = Instant.now();
Duration timeout = Duration.ofSeconds(5);
ZonedDateTime localTime = startedAt.atZone(ZoneId.of("Asia/Shanghai"));
```

- `Instant`：UTC 时间线上的时刻，适合日志、事件和存储。
- `Duration`：基于秒/纳秒的时长，适合超时。
- `LocalDateTime`：没有时区，不能单独代表全球唯一时刻。
- `ZonedDateTime`：带时区规则，适合展示和日历业务。

计算耗时优先用单调时间源 `System.nanoTime()` 的差值，不要用墙上时钟差值；NTP 校时可能让墙上时间跳变。

## I/O、NIO 与资源关闭

```java
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    for (String line; (line = reader.readLine()) != null; ) {
        process(line);
    }
}
```

try-with-resources 会按逆序关闭实现 `AutoCloseable` 的资源。文件、Socket、数据库连接、ResultSet 和流如果泄漏，最终可能耗尽文件描述符、连接池或本地内存。

NIO 不等于“所有 API 都非阻塞”。`Path`/`Files` 是现代文件 API；Channel、Buffer、Selector 提供更底层的 I/O 能力。选择阻塞、异步或事件驱动模型要结合连接数、调用方式和框架，不要只凭名字。

## HTTP Client 的生产边界

JDK 自带 `java.net.http.HttpClient`：

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2))
    .build();

HttpRequest request = HttpRequest.newBuilder(uri)
    .timeout(Duration.ofSeconds(5))
    .header("Accept", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request,
    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
);
```

`connectTimeout` 只约束建连，不等于整个请求截止时间；请求本身还要设置 timeout。还要处理非 2xx、响应体上限、重试幂等、代理、TLS truststore、DNS、连接复用和敏感头日志脱敏。

JDK 没有内置通用 JSON 对象映射器。生产项目通常选经过治理的 JSON 库并固定版本；不要用字符串拼接构造不可信 JSON。

## 注解与反射

注解是附加在类、方法、字段等位置的元数据；框架可以在编译期或运行时读取它。反射能动态检查和调用类成员，常用于依赖注入、序列化和测试工具。

代价与风险包括：

- 许多错误从编译期推迟到启动或运行期；
- 模块边界和强封装可能阻止深反射；
- 反射元数据、代理类和生成类影响启动与 Metaspace；
- 允许用户控制类名或方法名可能形成安全风险。

升级时不要把 `--add-opens` 当永久修复。它是针对模块封装的临时兼容开口，应定位旧依赖并升级。

## JAR、classpath 与 module path

JAR 是 ZIP 格式的 Java 归档，通常包含 class、资源和 `META-INF/MANIFEST.MF`：

```powershell
jar --create --file alert-digest.jar --main-class lab.aiops.AlertDigest -C out .
java -jar alert-digest.jar
jar --list --file alert-digest.jar
```

classpath 是 JVM 搜索未模块化 class 和资源的位置集合。Windows 分隔符是 `;`，Linux/macOS 是 `:`。顺序错误或重复依赖会让“错误版本先被加载”。

Java Platform Module System（JPMS）从 Java 9 引入命名模块、显式依赖和强封装：

```java
module lab.aiops.alerts {
    requires java.net.http;
    exports lab.aiops.api;
}
```

module path 与 classpath 可以混用，但迁移会遇到 automatic module、split package、反射开放和模块名稳定性问题。没有模块化不等于应用不能运行；是否采用 JPMS 应由部署、封装和依赖生态收益决定。

## Maven、Gradle 与 Java 的边界

`javac` 能编译 Java，但团队项目还需要依赖解析、测试、打包、代码生成和发布。Maven/Gradle 负责构建编排，不是 JVM 的一部分。

生产构建至少固定：

- JDK 发行方与版本；
- Maven Wrapper 或 Gradle Wrapper；
- 编译 `--release` 目标；
- 直接和传递依赖版本；
- 插件版本；
- 企业仓库、校验和与凭据来源；
- 测试、静态检查、漏洞扫描和制品哈希。

只写 `source=21` 不一定阻止误用更高 JDK 的 API；优先使用 `--release 21` 或构建工具对应的 release 配置，同时约束语言、class 版本和公开 API 基线。

## class 文件与向前/向后兼容

`javap -verbose` 可以查看 class 主版本：

```powershell
javap -verbose -classpath out lab.aiops.AlertDigest
```

JDK 21 编译的普通 class 主版本是 65。较新的 JVM 通常能运行较老 class，但较老 JVM 不能理解更高 class 版本，于是出现 `UnsupportedClassVersionError`。

兼容不只有 class 版本：

- source compatibility：源码能否被目标编译器接受。
- binary compatibility：旧调用方能否链接到新类库。
- behavioral compatibility：虽能运行，行为是否变化。
- serialization compatibility：序列化数据能否被新版读取。
- framework/vendor compatibility：框架、中间件和 Agent 是否认证。

## 类加载生命周期

JVM 对类的大致过程：

```text
loading
  -> read class bytes and create Class object
linking
  -> verify bytecode
  -> prepare static storage
  -> resolve symbolic references when required
initialization
  -> execute static field initializers and static blocks
```

### 常见类加载器

- Bootstrap Class Loader：加载核心 Java 模块，Java 代码里通常显示为 `null` loader。
- Platform Class Loader：加载平台模块。
- Application/System Class Loader：加载应用 classpath/module path。
- 自定义类加载器：应用服务器、插件框架、热部署工具会使用。

所谓双亲委派，是类加载器通常先让父加载器尝试，减少核心类被应用重复定义。但规范与实现边界要分清；应用服务器可能使用 parent-last 等策略解决隔离需求。

一个类的运行时身份由“全限定类名 + 定义它的类加载器”共同决定。同名 class 被两个不相容类加载器定义，彼此也不是同一个类型，可能出现看似荒谬的 `ClassCastException`。

### 类加载故障怎么查

```powershell
java -Xlog:class+load=info -jar app.jar
java -verbose:class -jar app.jar
jcmd <pid> VM.classloader_stats
jdeps --recursive app.jar
```

先记录实际加载来源、类加载器层级、JAR 哈希和启动 classpath。不要一看到 `ClassNotFoundException` 就把更多 JAR 随便复制到公共目录。

## 解释器、JIT 与预热

HotSpot 启动后会收集方法调用和分支等 profile。冷代码可解释执行；达到阈值的热点会被 C1/C2 等编译器优化为本地机器码。优化依赖当时观察到的假设，假设失效时可能 deoptimization（去优化）再执行。

这带来几个生产结论：

- 刚启动的延迟不代表稳态延迟。
- benchmark 必须处理预热、死代码消除、常量折叠和 GC 干扰，优先用 JMH。
- CPU profile 里既可能有业务方法，也可能有 JIT、GC 和 VM 线程。
- Code Cache 满、频繁去优化或类动态生成过多都可能影响性能。
- `-Xint` 强制解释、`-Xcomp` 偏向编译都不是常规生产调优开关。

## JVM 内存地图

```text
process virtual memory
  -> Java heap
       -> young / old organization depends on GC
  -> metaspace for class metadata
  -> code cache for compiled machine code
  -> one native stack per platform thread
  -> direct buffers and mapped files
  -> GC / JIT / JVM native structures
  -> JNI and other native libraries
```

### Heap

存放普通对象和数组。`-Xms` 常设置初始堆，`-Xmx` 设置最大堆。Heap 高不等于泄漏；要看 live set、分配率、回收后基线、暂停和业务负载。

### Thread Stack

每个平台线程有本地栈，保存栈帧等执行状态。线程过多会消耗大量本地内存。`-Xss` 太大降低可创建线程数，太小可能 `StackOverflowError`；不能只为多开线程盲目调小。

### Metaspace

存放类元数据，使用本地内存。类加载器泄漏、动态代理/字节码生成或无界热部署会让它增长。`OutOfMemoryError: Metaspace` 不是普通对象堆不够。

### Direct Memory

NIO DirectByteBuffer 和网络框架可能使用堆外内存。Heap 图看起来健康，进程 RSS 仍可能很高。结合 Native Memory Tracking、框架指标、操作系统映射和分配栈检查。

### Code Cache

存放 JIT 编译后的机器码。满时可能限制进一步编译并造成性能退化。先用 JFR、编译日志和 `jcmd Compiler.codecache` 证实，再考虑参数。

## 对象什么时候能被 GC

GC 从 GC Roots 出发追踪可达对象。常见 Roots 包括活线程栈中的引用、静态字段、JNI 引用和 JVM 内部引用。对象不可达后才具备回收资格，不等于立刻回收。

四种引用强度常用于缓存或资源关联：strong、soft、weak、phantom。不要用 SoftReference 代替有容量、命中率和淘汰策略的缓存。终结器 finalization 已被弃用并走向移除；资源应使用显式关闭、try-with-resources 或 Cleaner 的受控兜底。

## GC 先问目标，不先背参数

垃圾回收器在吞吐、暂停、CPU、内存占用和堆规模之间做权衡。

| 收集器 | 常见定位 | 选择时的核心问题 |
|---|---|---|
| Serial GC | 小堆、单 CPU 或极简场景 | 停顿是否可接受 |
| Parallel GC | 追求批处理吞吐 | 较长 Stop-The-World 暂停是否可接受 |
| G1 GC | HotSpot 常用默认，平衡吞吐与暂停目标 | region、live set、分配率和目标暂停是否匹配 |
| ZGC | 大堆、低暂停目标 | 额外 CPU/内存成本和版本支持是否可接受 |
| Shenandoah | 部分 OpenJDK 发行版提供的低暂停收集器 | 目标发行版是否包含并支持 |

不同 JDK、发行方和 JVM 的可用收集器可能不同。用 `java -XX:+PrintFlagsFinal -version`、启动日志和发行方文档确认，不要假设所有机器都有 Shenandoah 或同名参数。

### GC 关键量

- allocation rate：每秒创建多少对象。
- live set：一次完整标记后真正存活的数据量。
- headroom：峰值 live set、突发分配和回收所需余量。
- pause time：应用线程暂停时间。
- throughput：业务执行时间占总时间比例。
- promotion：对象从年轻区域进入老年代的速度。

只把 `-Xmx` 调大可能让回收更少但单次工作更多，也可能挤压容器和操作系统。正确顺序是先确认分配源、live set、暂停目标、物理/容器限制，再做负载测试。

## 统一日志查看 GC 与 JVM 事件

现代 HotSpot 使用 Unified Logging：

```powershell
java -Xlog:gc*=info:file=gc.log:time,uptime,level,tags -jar app.jar
java -Xlog:os+container=trace -version
java -Xlog:class+load=info -jar app.jar
```

`-Xlog:gc*` 会产生更多数据；生产要配置轮转、权限、容量和保留期。GC 日志只是证据之一，还要关联同一时间窗的请求量、延迟、错误率、CPU、RSS、线程池、连接池和变更。

## Java Memory Model 与 happens-before

多线程共享内存时，问题不只是“同时写”。编译器、JIT 和 CPU 可以在规则允许范围内重排，线程还可能观察缓存中的旧值。Java Memory Model（JMM）规定哪些读写结果合法，以及哪些同步动作建立可见性和顺序关系。

happens-before 可以理解为：若动作 A happens-before 动作 B，那么 B 必须看见 A 在规则范围内的结果。常见关系包括：

- 同一线程内，前面的动作先于后面的动作。
- 解锁某个 monitor 先于随后对同一 monitor 的加锁。
- 对 volatile 变量的写先于随后对它的读。
- `Thread.start()` 前的动作先于新线程中的动作。
- 线程中的动作先于另一个线程从 `join()` 成功返回。

没有建立关系时，即使测试一万次“看起来没问题”，也不代表程序正确。

## `synchronized`、`volatile`、Lock 与 atomic

### `synchronized`

```java
synchronized (lock) {
    balance = balance + delta;
}
```

它同时提供互斥和可见性。锁范围过大降低并发；锁顺序不一致可能死锁；持锁期间调用慢网络会放大阻塞。

### `volatile`

```java
private volatile boolean stopping;
```

适合一个线程写状态、其他线程读取，确保可见性与相关排序。`count++` 是读、加、写的复合操作，`volatile` 不会让它整体原子。

### `ReentrantLock`

提供可中断获取、超时 `tryLock`、多个 Condition 等能力，但必须在 `finally` 解锁。复杂锁能力不自动比 `synchronized` 更快。

### Atomic

```java
AtomicLong processed = new AtomicLong();
processed.incrementAndGet();
```

适合简单原子状态。多个原子变量之间的业务约束仍不自动成为一个事务。高竞争计数指标可评估 `LongAdder`，但读取不是严格瞬时快照。

## 平台线程与虚拟线程

平台线程通常较紧密映射到操作系统线程；创建和阻塞大量平台线程会消耗线程栈、调度和内存。虚拟线程在 JDK 21 正式交付，由 JVM 调度到较少的 carrier platform threads 上，适合“大量彼此独立、以阻塞 I/O 为主”的任务。

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> result = executor.submit(() -> callDependency());
    System.out.println(result.get());
}
```

虚拟线程不是：

- CPU 核心的替代品；CPU 密集任务仍受核心数限制。
- 取消超时、限流和背压的理由；下游数据库只有 100 个连接时，10 万虚拟线程只会排队争抢。
- 线程池调参的同义词；常见模型是“一任务一虚拟线程”，资源并发由 Semaphore、连接池或限流器控制。
- 所有性能问题的自动修复；ThreadLocal 数据、监控维度和库兼容性仍要评估。

JDK 24 通过 JEP 491 改进了虚拟线程在 `synchronized` 场景的 pinning，但本地方法等场景仍需结合 JFR 事件和版本核实；不要机械背旧版本结论。

## Executor、线程池与背压

```java
var executor = new ThreadPoolExecutor(
    8,
    8,
    0L,
    TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(200),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

需要解释的不是“核心线程 8”这么简单：

- core/max size：同时执行多少平台线程任务。
- queue capacity：突发请求能缓存多少；无界队列会把过载变成内存和长延迟。
- rejection policy：满载时丢弃、报错还是让调用方执行形成反馈。
- task timeout/cancellation：超时后是否真正停止下游工作。
- workload isolation：HTTP、数据库、消息消费和批任务是否互相拖死。
- observability：active、queue size、completed、rejected、task latency 是否可见。

Little's Law 可做粗略容量检查：并发量约等于到达率乘平均停留时间。每秒 500 个任务、平均停留 200 ms，稳态在途量约 100；还要为长尾、重试和波动留余量。它不是最终配置值，必须压测验证。

## CompletableFuture 与异步边界

```java
CompletableFuture<Result> future = CompletableFuture
    .supplyAsync(this::load, ioExecutor)
    .orTimeout(2, TimeUnit.SECONDS)
    .thenApply(this::transform);
```

异步 API 不等于工作消失。要知道每一段在哪个 Executor 上执行、异常怎样传播、timeout 是否取消底层调用、context/trace 怎样传递。未指定 Executor 的 `*Async` 方法常使用公共池，生产服务要避免无意资源共享。

## Structured Concurrency 的当前边界

Structured Concurrency 把一组有共同生命周期的子任务当成一个工作单元，便于统一 join、失败传播、取消和观测。但截至 JDK 26，它仍是 Sixth Preview，不是无需风险评估的稳定 API。示例代码、方法名和返回类型曾在多次 Preview 中变化，生产采用时必须固定 JDK、启用 Preview、保留迁移测试，并避免把 Preview 类型暴露为长期公共契约。

## 死锁、活锁、饥饿与线程泄漏

- deadlock：线程形成环形等待，谁也无法继续。
- livelock：线程都在运行和让步，但状态反复变化，业务没有进展。
- starvation：某些任务长期拿不到 CPU、锁、线程或连接。
- thread leak：线程或任务生命周期没有结束，数量持续增长。

死锁排查优先抓线程转储并找 `Found one Java-level deadlock`、锁拥有者和等待者。线程池饥饿不一定被 JVM 判定为 Java-level deadlock，需要看队列、active 数、调用栈、连接池和下游延迟。

## 配置来源与优先级

Java 应用常同时读取：

- 命令行参数；
- JVM system property，如 `-Dapp.mode=prod`；
- 环境变量；
- YAML/properties/XML 配置；
- 配置中心、Secret 管理器或平台注入；
- 代码默认值。

每个项目要文档化优先级和热更新边界。`System.getenv("TOKEN")` 与 `System.getProperty("token")` 是两套来源；环境变量通常在进程启动后不变，system property 也不应被业务随意全局改写。

密码、Token、私钥不要出现在命令行、Git、Heap Dump 或普通日志。命令行在系统进程列表中可能对其他用户可见。

## JVM 参数的管理原则

```text
-Xms1g
-Xmx1g
-XX:+UseG1GC
-XX:MaxRAMPercentage=70
-XX:StartFlightRecording=...
-Xlog:gc*=info:...
```

参数分为标准、`-X` 非标准和 `-XX` 高级实现参数。高级参数可能变更或移除；换 JVM 或跨大版本时必须重新验证。

建议：

1. 把实际启动命令和环境保存为可审计配置。
2. 记录每个非默认参数要解决的问题和验证指标。
3. 不复制十年前的“万能参数模板”。
4. 对照容器 limit、节点物理内存和同机进程留出 native headroom。
5. 灰度启动并观察启动时间、RSS、GC、延迟和错误。

## 容器里的 Java

现代 HotSpot 能识别常见容器 CPU 和内存限制，但仍要核实目标 JDK、cgroup 版本和日志。`-Xmx` 只控制 Java Heap，不包括 Metaspace、Code Cache、线程栈、Direct Buffer、JIT/GC 结构和本地库。

容量可以先做预算：

```text
container memory limit
  >= max heap
   + metaspace
   + code cache
   + thread stacks
   + direct/native buffers
   + JVM/GC/JIT native memory
   + application native libraries
   + safety margin
```

容器被 OOM Killer 终止时，JVM 可能来不及输出 `OutOfMemoryError` 或 Heap Dump。必须同时查看 Kubernetes Pod status、container exit reason、节点内核日志、cgroup 指标和 JVM 指标。

CPU limit 过紧会让 GC、JIT 和业务线程争用配额，并导致 throttling。把 `availableProcessors`、GC/线程池自适应与实际 quota 一起核验。

## Java 服务的高可用边界

单个 JVM 自己不是高可用系统。生产 HA 来自：

```text
multiple instances across failure domains
  + load balancer and health checks
  + stateless request handling where possible
  + external durable state
  + idempotency and retry boundaries
  + graceful shutdown and connection draining
  + deployment rollback
```

如果会话、定时任务、缓存和文件只放在一个进程内，副本数从 1 改 3 也可能产生重复执行、状态不一致或丢失。readiness 要证明实例能安全接流量；liveness 只用于判断是否需要重启，不能把下游短暂故障直接变成所有实例重启风暴。

## 优雅停机

收到 SIGTERM 或平台停止信号后，理想顺序是：

1. readiness 变为失败，停止接收新流量。
2. 入口/负载均衡完成摘流。
3. 停止拉取新消息和新任务。
4. 等待有界时间让在途请求完成。
5. 刷新日志/Trace/状态，关闭线程池、连接池和文件。
6. 超时后按既定策略取消并退出。

Shutdown Hook 可以做最后清理，但不能无限阻塞，也不能代替编排平台的 termination grace period 和业务幂等设计。

## 可观测性：四层证据一起看

### 业务与请求层

- 请求量、成功率、p50/p95/p99 延迟；
- 队列长度、拒绝数、重试、超时；
- 业务结果、幂等冲突和下游错误码。

### 应用资源层

- HTTP worker、Executor、连接池 active/idle/pending；
- 缓存大小/命中、消息 lag、批次耗时；
- 文件描述符、Socket、DNS/TLS 错误。

### JVM 层

- Heap used/committed/max、回收后基线和分配率；
- GC 次数、暂停、并发周期、promotion；
- 线程数、状态、deadlock、class load/unload；
- Metaspace、Code Cache、Direct/Native Memory；
- JIT 编译、safepoint 和 JFR 事件。

### 主机/容器层

- CPU usage、run queue、throttling；
- RSS、page fault、swap、OOM kill；
- 磁盘空间/延迟、网络丢包/重传、cgroup limit。

仅凭“Heap 80%”或“CPU 90%”不能判事故。必须在同一时间窗按服务实例、版本和流量维度关联。

## 结构化日志、指标与 Trace

日志回答“发生了什么”；指标回答“发生多少、趋势如何”；Trace 回答“跨组件时间花在哪里”。建议统一：

- 时间使用带时区/UTC 的标准格式；
- 级别、service、instance、environment、version；
- trace_id、span_id、request_id 或受控 correlation ID；
- error type、稳定 error code、耗时、下游目标；
- 敏感字段脱敏和日志大小上限。

不要把完整 Token、Cookie、密码、身份证、数据库行或 Heap Dump 上传到公共平台。高基数用户 ID、随机 URL 和异常全文不适合直接做指标 label。

## JFR：低开销事件记录不是业务日志

Java Flight Recorder（JFR）记录 JVM 与应用事件，如 CPU sample、allocation、GC、lock、thread park、I/O、class load。它适合回答“这段时间 JVM 真正在做什么”。

启动时录制示例：

```powershell
java -XX:StartFlightRecording=name=prod,settings=profile,filename=app.jfr,dumponexit=true -jar app.jar
jfr summary app.jfr
jfr print --events jdk.CPULoad,jdk.GarbageCollection app.jfr
```

在线进程示例：

```powershell
jcmd <pid> JFR.start name=incident settings=profile duration=5m filename=incident.jfr
jcmd <pid> JFR.check
jcmd <pid> JFR.dump name=incident filename=incident-now.jfr
```

`profile` 比 `default` 采集更多事件，仍需在目标版本、负载和数据敏感性下评估。JFR 文件可能包含类名、路径、环境和业务事件，应像诊断证据一样控制访问和保留。

## `jcmd`、`jstack`、`jmap`、`jstat` 怎么选

| 工具 | 首要用途 | 常用动作 | 风险边界 |
|---|---|---|---|
| `jcmd` | 首选综合诊断入口 | `VM.version`、`Thread.print`、`GC.heap_info`、`JFR.*` | 某些命令有明显开销，先看 `help` |
| `jstack` | 线程转储 | 查看状态、锁和调用栈 | 高频抓取会有开销；现代场景优先评估 `jcmd Thread.print` |
| `jmap` | 堆配置、直方图/转储 | `-histo`、heap dump | live heap dump 可能触发停顿、占满磁盘并包含敏感数据 |
| `jstat` | JVM 统计抽样 | GC/容量趋势 | 输出字段依版本，不能代替长时间监控 |
| `jfr` | 读取/打印 JFR 文件 | `summary`、`print` | 控制文件权限与体积 |
| `javap` | 反汇编 class 元数据 | class version、方法、常量池 | 看到字节码不等于证明运行时加载了这个文件 |
| `jdeps` | 静态依赖分析 | 模块/JDK internal API | 反射和运行时动态加载不一定被发现 |

诊断工具通常需要相同用户权限、兼容 JDK 和可访问的进程命名空间。容器中工具可能不在精简 runtime image 内；可用受控 debug container 或同版本工具镜像，不要把完整 JDK 无条件塞进生产镜像。

## Thread Dump 阅读顺序

1. 记录时间、实例、PID、版本和业务现象。
2. 连续抓 3 份，间隔数秒，区分瞬时等待与持续卡住。
3. 按线程状态统计 RUNNABLE/BLOCKED/WAITING/TIMED_WAITING。
4. 找 deadlock 报告、相同栈的大量线程、锁拥有者。
5. 看线程池名称、队列和连接池指标。
6. 把栈顶方法对应到下游、磁盘、锁或 CPU 路径。
7. 与 Trace、慢查询、GC、部署版本和主机资源交叉验证。

RUNNABLE 不等于正在用 CPU，它也可能在 native Socket read；WAITING 不一定异常，空闲 worker 本来就可能等待队列。

## Heap Dump 与内存排查

Heap Dump 是某一时刻 Java Heap 的对象图。它可能很大、产生停顿、占满磁盘并包含密码或业务数据。

安全步骤：

1. 先看 Heap 指标、GC 后基线、class histogram 和 JFR allocation。
2. 确认磁盘余量、停顿影响、文件路径和权限。
3. 在流量摘除的实例或副本上采集。
4. 加密传输，限制访问，分析后按策略删除。
5. 用 dominator tree、retained size 和 GC Roots 验证谁在保留对象。

`-XX:+HeapDumpOnOutOfMemoryError` 可在 OOM 时留证，但仍要设置安全路径和磁盘监控；容器 OOM kill 不保证产生 JVM Heap Dump。

## Native Memory Tracking

HotSpot Native Memory Tracking（NMT）可帮助拆分 JVM 原生内存，但通常需要启动时开启：

```powershell
java -XX:NativeMemoryTracking=summary -jar app.jar
jcmd <pid> VM.native_memory summary
jcmd <pid> VM.native_memory baseline
jcmd <pid> VM.native_memory summary.diff
```

NMT 有开销，也不追踪所有第三方 native 分配。RSS 高、Heap 低时，把 NMT、线程数、Direct Buffer、mmap、JNI、系统工具和容器指标组合起来。

## 性能诊断顺序

不要从调 JVM 参数开始。先回答：

1. 哪个 SLO 变差：吞吐、错误还是尾延迟？
2. 只影响一个实例、一个版本、一个可用区还是全部？
3. 资源饱和在哪里：CPU、锁、线程池、连接池、磁盘、网络、GC？
4. 最近有什么代码、配置、流量、数据或依赖变更？
5. profile/JFR/Thread Dump/GC log 支持哪条假设？
6. 最小风险缓解是什么，回滚条件是什么？

优化前后用相同负载、相同数据和相同环境对比 p50/p99、吞吐、CPU、内存和错误。微基准用 JMH，不用一次 `System.nanoTime()` 循环下结论。

## 安全边界

### 反序列化

Java 原生对象反序列化可能在对象构造完成前触发复杂代码路径。不要反序列化不可信数据；优先使用有明确 schema 和类型白名单的数据格式。存量系统必须评估 ObjectInputFilter、依赖 gadget、消息来源和签名认证。

### Security Manager

Security Manager 曾用于进程内沙箱，但已经被弃用并在现代 JDK 中永久禁用。不要设计依赖它隔离不可信代码的新系统；使用进程、容器、操作系统账户、文件权限、网络策略和最小权限凭据等边界。

### TLS 与 truststore

Java 的信任库与浏览器/操作系统不一定相同。浏览器能打开 HTTPS 不证明 JVM 能连接。排查 `PKIX path building failed` 时核对：

- 实际 JVM 与 truststore 路径；
- 服务端完整证书链、SNI、主机名和时间；
- 企业代理/中间 CA；
- TLS 协议与 cipher；
- 是否误把证书导入另一个 JDK。

`keytool -list` 可以查看证书库，但不要把私钥密码写在 shell history 或日志里。不要用“信任所有证书”作为生产修复。

### 依赖与供应链

- 固定直接/传递依赖和插件版本，使用 lock/verification 能力。
- 通过企业制品库代理外部仓库，保留来源、哈希和审计。
- 生成 SBOM，扫描 CVE，但由实际可达性、配置和补丁判断风险。
- 验证 JDK、构建工具、基础镜像和 Agent 的签名/摘要。
- CI 凭据最小权限、短期化，禁止写入制品。
- 可复现构建并不自动证明源码安全，但能减少不解释的字节差异。

## 升级与回滚

Java 升级不是只换 `java.exe`：

```text
JDK distribution and patch
  + bytecode target
  + framework and middleware
  + build plugins and annotation processors
  + JDBC / messaging / TLS drivers
  + APM / profiler / security agents
  + GC and JVM flags
  + container base image and OS libraries
```

建议流程：

1. 盘点生产真实版本、VM、参数、依赖、Agent 和中间件认证。
2. 阅读目标 JDK release notes、removed/deprecated API 和安全变更。
3. 用 `jdeps --jdk-internals`、编译告警和测试找内部 API/封装问题。
4. 在目标 JDK 重新构建；不要只拿旧 class 替换运行时。
5. 跑单测、集成、兼容、性能、启动、停机和故障恢复测试。
6. 用生产副本数据与流量模型做 canary，比较 GC、RSS、CPU、p99 和错误。
7. 分批扩大，保留旧镜像/制品、数据库兼容和流量切回方案。

回滚前确认新版本是否写入了旧版本读不懂的数据、缓存、队列消息或 Schema。只回退 JVM 而保留不兼容 Agent/参数，也可能启动失败。

## AIOps 容量模型

以告警处理服务为例，先列资源预算：

```text
arrival rate
  x average service time
  -> in-flight work

in-flight work
  x per-request retained bytes
  -> request memory

base live set
  + caches
  + queues
  + request memory
  + allocation/GC headroom
  -> heap target

platform threads x stack size
  + direct buffers
  + metaspace/code cache/native
  -> non-heap/native target
```

再用压测和故障测试修正。平均值会隐藏长尾；重试会放大到达率；队列会让吞吐看似稳定但延迟持续增长。容量告警应同时看 utilization、saturation、errors 和 queue age。

## AIOps 入门实验：告警摘要器

### 实验目标

只使用 JDK：

- 用 record、enum、List、Map、Lambda 和 Stream 表达告警数据；
- 用 `javac --release 21` 生成可在 Java 21+ 运行的 class；
- 用 `javap` 验证 class 版本；
- 用 JFR 留下运行证据。

### 前置条件

```powershell
java -version
javac -version
$env:JAVA_HOME
```

需要 JDK 21 或更高。若 `java` 与 `javac` 版本不同，先修复 PATH/JAVA_HOME；不要继续生成不可解释的制品。

### 创建目录

```powershell
New-Item -ItemType Directory -Force java-aiops-lab\src\lab\aiops
Set-Location java-aiops-lab
```

创建 `src/lab/aiops/AlertDigest.java`：

```java
package lab.aiops;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public final class AlertDigest {
    enum Severity { WARNING, CRITICAL }

    record Alert(String service, Severity severity, long durationSeconds) {}

    public static void main(String[] args) {
        var alerts = List.of(
            new Alert("order-api", Severity.CRITICAL, 95),
            new Alert("payment-api", Severity.WARNING, 18),
            new Alert("order-api", Severity.WARNING, 42),
            new Alert("order-api", Severity.CRITICAL, 130)
        );

        Map<String, Long> countByService = new TreeMap<>();
        alerts.forEach(alert -> countByService.merge(alert.service(), 1L, Long::sum));

        long criticalCount = alerts.stream()
            .filter(alert -> alert.severity() == Severity.CRITICAL)
            .count();
        long slowCount = alerts.stream()
            .filter(alert -> alert.durationSeconds() >= 60)
            .count();

        System.out.printf(
            "{\"event\":\"alert_digest\",\"time\":\"%s\",\"total\":%d,\"critical\":%d,\"slow\":%d}%n",
            Instant.EPOCH,
            alerts.size(),
            criticalCount,
            slowCount
        );
        countByService.forEach((service, count) ->
            System.out.printf("service=%s alert_count=%d%n", service, count)
        );
    }
}
```

### 编译与运行

```powershell
New-Item -ItemType Directory -Force out
javac --release 21 -d out src\lab\aiops\AlertDigest.java
java -cp out lab.aiops.AlertDigest
```

预期输出：

```text
{"event":"alert_digest","time":"1970-01-01T00:00:00Z","total":4,"critical":2,"slow":2}
service=order-api alert_count=3
service=payment-api alert_count=1
```

### 验证字节码

```powershell
javap -classpath out -verbose lab.aiops.AlertDigest | Select-String "major version"
```

预期看到：

```text
major version: 65
```

65 对应 Java 21 class 格式，说明 `--release 21` 生效。这不代表所有依赖也兼容，真实项目还要检查全部 JAR。

### 录制 JFR

```powershell
java -XX:StartFlightRecording=filename=alert-digest.jfr,settings=profile,dumponexit=true -cp out lab.aiops.AlertDigest
jfr summary alert-digest.jfr
```

预期 `jfr summary` 显示 Version、Chunks、Start、Duration 和事件计数。程序很短，Duration 可能为 0 秒，仍可看到启动与 JVM 事件。

### 本文实测结果

本文在 Windows、Oracle JDK 24 上真实执行：

- `javac --release 21` 成功；
- 输出 4 条总告警、2 条 critical、2 条慢告警；
- `javap` 返回 `major version: 65`；
- JFR 2.1 文件可由 `jfr summary` 读取。

该结果证明本文这组纯 JDK 命令在上述环境跑通，不等于 JDK 25/26、Linux、容器、其他发行版或生产负载已验证。

### 如果没有成功，先查这些

1. `javac` 不存在：安装的是不含编译器的 runtime image，或 PATH 错误。
2. `record` 语法报错：JDK 太旧，或实际 `javac` 不是你以为的版本。
3. `release version 21 not supported`：编译 JDK 低于 21。
4. `Could not find or load main class`：`-cp out`、包名或输出目录不一致。
5. `jfr` 不存在：runtime image 被裁剪，换同版本完整 JDK 工具或受控诊断环境。
6. JFR 文件不能写：检查当前目录权限和安全软件拦截。

### 清理

确认路径后，从实验目录的上一级删除整个实验目录；不要在不确定当前位置时递归删除：

```powershell
Set-Location ..
Remove-Item -LiteralPath .\java-aiops-lab -Recurse -Force
```

## 故障注入实验：制造并定位 Java 死锁

### 目标与安全边界

两个线程故意以相反顺序获取两把锁，稳定形成死锁。实验只在独立 JVM 中运行，不连接网络和数据库；诊断后按精确 PID 终止该实验进程。

不要把故障代码部署到共享环境。启动后它不会自行退出，这是预期现象。

### 故障代码

创建 `src/lab/aiops/DeadlockLab.java`：

```java
package lab.aiops;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.locks.ReentrantLock;

public final class DeadlockLab {
    private static final ReentrantLock ALERT_LOCK = new ReentrantLock();
    private static final ReentrantLock TICKET_LOCK = new ReentrantLock();
    private static final CountDownLatch FIRST_LOCKS_HELD = new CountDownLatch(2);

    public static void main(String[] args) throws InterruptedException {
        var alertToTicket = new Thread(
            () -> lockInOrder(ALERT_LOCK, TICKET_LOCK),
            "alert-to-ticket"
        );
        var ticketToAlert = new Thread(
            () -> lockInOrder(TICKET_LOCK, ALERT_LOCK),
            "ticket-to-alert"
        );
        alertToTicket.start();
        ticketToAlert.start();
        alertToTicket.join();
        ticketToAlert.join();
    }

    private static void lockInOrder(ReentrantLock first, ReentrantLock second) {
        first.lock();
        try {
            System.out.printf("thread=%s first_lock_acquired=true%n", Thread.currentThread().getName());
            FIRST_LOCKS_HELD.countDown();
            awaitBothThreads();
            second.lock();
            try {
                System.out.printf("thread=%s both_locks_acquired=true%n", Thread.currentThread().getName());
            } finally {
                second.unlock();
            }
        } finally {
            first.unlock();
        }
    }

    private static void awaitBothThreads() {
        try {
            FIRST_LOCKS_HELD.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while preparing the deadlock", exception);
        }
    }
}
```

### 编译、启动和取证

```powershell
javac --release 21 -d out src\lab\aiops\DeadlockLab.java

$labProcess = Start-Process `
  -FilePath "$env:JAVA_HOME\bin\java.exe" `
  -ArgumentList @('-cp', 'out', 'lab.aiops.DeadlockLab') `
  -WindowStyle Hidden `
  -PassThru

Start-Sleep -Seconds 2
$labProcess.Id
& "$env:JAVA_HOME\bin\jcmd.exe" $labProcess.Id Thread.print -l
```

预期看到：

```text
Found one Java-level deadlock:
"alert-to-ticket":
  waiting for ownable synchronizer ... which is held by "ticket-to-alert"
"ticket-to-alert":
  waiting for ownable synchronizer ... which is held by "alert-to-ticket"
```

### 恢复与清理

只终止刚才保存的精确实验 PID：

```powershell
if (-not $labProcess.HasExited) {
    Stop-Process -Id $labProcess.Id -Force
    $labProcess.WaitForExit()
}
$labProcess.HasExited
```

预期最后输出 `True`。不要使用 `Stop-Process -Name java`，那会误杀机器上的其他 Java 服务。

### 修复：统一锁顺序

所有路径都先获取 `ALERT_LOCK`，再获取 `TICKET_LOCK`：

```java
private static void updateBoth() {
    ALERT_LOCK.lock();
    try {
        TICKET_LOCK.lock();
        try {
            updateAlertAndTicket();
        } finally {
            TICKET_LOCK.unlock();
        }
    } finally {
        ALERT_LOCK.unlock();
    }
}
```

真实业务还可以缩小临界区、避免持锁调用网络、使用带超时的 `tryLock`，或重新设计为单一所有者/消息传递。`tryLock` 只是避免无限等待，仍要处理获取失败、回滚和一致性。

### 本文实测结果

本文在隔离的 Oracle JDK 24 进程中真实复现：

- 两个线程分别成功获取第一把锁；
- `jcmd <pid> Thread.print -l` 报告一个 Java-level deadlock；
- 报告明确给出相互持有和等待的 `ReentrantLock`；
- 精确 PID 被终止，修复版两个线程均完成并输出 `result=completed_without_deadlock`。

### 如果没有复现

1. 确认运行的是 `DeadlockLab`，不是修复版。
2. 确认 `CountDownLatch` 初始值是 2，两个线程都打印第一把锁已获得。
3. `jcmd` attach 失败时，确认工具和目标进程用户、位数、容器命名空间与版本。
4. 若 `$labProcess.HasExited` 已是 `True`，先查看标准错误，常见是 classpath 或编译问题。
5. 不要在生产进程上为了实验修改锁顺序；生产修复必须先测试一致性和回滚。

## 常见故障排查

### `UnsupportedClassVersionError`

**现象：** class 由更高 Java 版本编译，当前 JVM 无法读取。

**证据：** `java -version`、`javap -verbose` 的 major version、构建日志中的 JDK 和 `--release`。

**修复：** 用目标基线重新构建或升级受支持运行时；不是简单改文件名。验证全部依赖和部署节点版本一致。

### `ClassNotFoundException` / `NoClassDefFoundError`

**现象：** 类在运行时缺失，或初始化曾失败。

**证据：** 完整异常 cause、启动 classpath/module path、JAR 内容、`-Xlog:class+load`、容器/应用服务器加载策略。

**修复：** 恢复正确依赖与加载边界；不要把随机 JAR 复制到全局 lib。

### `NoSuchMethodError` / `NoSuchFieldError`

**现象：** 调用方编译时看到的 API 与运行时实际加载版本不一致。

**证据：** 加载来源、依赖树、JAR 哈希、`javap` 方法签名、所有节点制品版本。

**修复：** 统一依赖/BOM，移除冲突旧包，重新构建并在目标运行时验证。

### Heap 持续增长

**先查：** GC 后基线是否增长、live set、allocation、缓存/队列、class histogram、Heap Dump retained path。

**不要先做：** 无限调大 `-Xmx` 或重启后宣布根因已解决。

### `OutOfMemoryError`

先读取完整消息：`Java heap space`、`Metaspace`、`Direct buffer memory`、`unable to create native thread` 等指向不同资源。再关联 RSS、线程、容器 limit、NMT、Heap 与系统日志。

### Full GC 频繁、暂停高

比较流量、分配率、promotion、live set、老年代占用、humongous object、显式 `System.gc()`、容器 CPU throttling。先定位对象和负载原因，再调整堆或收集器。

### CPU 高

用系统工具找进程/线程，再用 JFR/async-profiler 等受控 profile 映射热点；同时看 GC/JIT。Thread Dump 中 RUNNABLE 栈可以给线索，但采样 CPU profile 更适合回答时间花在哪里。

### 请求卡住但 CPU 不高

抓多份 Thread Dump，查看 BLOCKED/WAITING、线程池队列、连接池 pending、Socket read、慢查询、下游 Trace 和超时配置。可能是等待而非计算。

### 线程数持续增长

按线程名和栈分组，检查每请求建线程、未关闭 Executor、重复 scheduler、ThreadLocal、库重试和虚拟线程监控口径。平台线程增长还会增加 native stack。

### 容器 `OOMKilled`，没有 Heap OOM

查看 Pod/container 终止原因、memory.current/limit、RSS、Direct/Metaspace/thread、page cache 和 sidecar。JVM 可能被外部杀死，Heap Dump 没有生成很正常。

### `PKIX path building failed`

核对实际 JVM、truststore、服务端完整链、主机名、时间和企业代理。不要关闭证书校验；把正确 CA 按受控方式加入实际使用的信任链。

### 升级后启动慢或 p99 变差

比较相同流量下的 JIT 预热、GC、class load、Agent、CPU quota、默认参数和依赖版本。用 canary 与旧版本同窗对比，满足回滚阈值立即切回。

## 命令与参数字典

| 命令/参数 | 目的 | 预期结果 | 常见坑 |
|---|---|---|---|
| `java -version` | 看运行时、发行方和 VM | 输出版本与 VM 名称 | IDE/服务实际 Java 可能不同 |
| `javac -version` | 看编译器版本 | 与构建基线一致 | 与 `java` 来自不同目录 |
| `javac --release 21` | 约束语言/class/API 基线 | 生成 Java 21 class | 不检查第三方依赖兼容 |
| `java -cp ... Main` | 按 classpath 启动类 | main 被调用 | Windows/Linux 分隔符不同 |
| `java -jar app.jar` | 按 manifest 启动 JAR | 应用启动 | `-cp` 常被 `-jar` 语义忽略 |
| `jar --list --file app.jar` | 看归档内容 | 列出 class/资源 | 内容存在不证明运行时加载 |
| `javap -verbose` | 看 class 元数据/字节码 | 版本、常量池、方法 | 要检查实际部署文件 |
| `jcmd -l` | 列本用户可见 JVM | PID 与启动类 | 容器/权限可能隔离 |
| `jcmd PID Thread.print -l` | 抓线程和锁 | 状态、栈、deadlock | 需要连续样本和业务关联 |
| `jcmd PID GC.heap_info` | 看堆摘要 | 当前 heap 信息 | 不是泄漏证明 |
| `jcmd PID VM.flags` | 看生效 VM 参数 | 启动/默认 flags | 敏感参数输出要保护 |
| `jcmd PID VM.system_properties` | 看 system properties | 运行配置证据 | 可能含敏感路径/配置 |
| `jfr summary file.jfr` | 汇总 JFR | 事件计数 | 文件可能敏感 |
| `jdeps --jdk-internals` | 找 JDK 内部 API | 迁移线索 | 动态反射可能漏报 |
| `-Xms` / `-Xmx` | 初始/最大 Heap | 堆边界生效 | 不是整个进程内存 |
| `-Xss` | 平台线程栈大小 | 改变栈预算 | 太小 StackOverflow，太大少线程 |
| `-XX:MaxRAMPercentage` | 按可见内存定 Heap | 容器内比例生效 | 仍需留 native 余量 |
| `-Xlog:gc*` | 记录 GC | 形成时间线 | 文件轮转与开销 |

## 生产事故题：发布后接口超时，但 JVM 没崩

### 已知现象

- 10:00 发布新版本，10:08 p99 从 300 ms 升至 12 s。
- 错误率缓慢上升，CPU 45%，Heap 55%，没有 OOM。
- 重启一个实例后短暂恢复。

### 证据收集

1. 固定 10:05-10:15 时间窗，按版本和实例拆指标。
2. 比较旧/新版本请求量、p99、错误、线程池 queue/rejected。
3. 连抓三份 Thread Dump，保留 PID、JDK、时间。
4. 看相同栈是否集中等待某把锁、连接池或下游 Socket。
5. 查 Trace 的慢 Span、数据库 active/pending、下游状态。
6. 检查发布差异、配置、依赖树、JDK/Agent/容器 limit。
7. 若允许，录制短时 JFR，查看 lock、park、socket 和 CPU sample。

### 假设与验证

- 假设 A：Java-level deadlock。验证 thread dump 是否形成明确环。
- 假设 B：线程池饥饿。验证所有 worker 是否阻塞在同一慢下游，队列是否增长。
- 假设 C：GC 暂停。验证 GC/JFR 是否与延迟峰值同窗；Heap 百分比本身不够。
- 假设 D：连接池枯竭。验证 active=max、pending 增长、连接泄漏和数据库响应。

### 缓解、修复与回滚

若新版本与故障强相关且旧版本仍兼容，先摘流新实例并回滚；不要等根因完全确认才保护 SLO。修复可能是统一锁顺序、为下游设超时、隔离线程池、关闭泄漏连接或限制并发。恢复后继续观察一个完整高峰，并把门禁补到测试和发布流程。

### 影响面

明确受影响租户、接口、实例、消息积压、重复请求和数据一致性。超时不代表请求未执行；客户端重试可能造成重复写，必须核对幂等键与补偿。

## 生产系统设计题：设计高吞吐告警处理平台

### 需求

- 平均 5,000 条/秒，峰值 20,000 条/秒。
- 规则查询、聚合、工单和通知包含 I/O。
- 不能无限堆积，关键告警不能静默丢失。
- 支持滚动升级、跨可用区故障和可审计回放。

### 设计主线

```text
load balancer / message broker
  -> stateless Java consumers
  -> bounded validation and enrichment
  -> partitioned aggregation state
  -> idempotent ticket / notification outbox
  -> durable store

observability
  -> business rate/error/latency
  -> queue lag and age
  -> executor/connection pools
  -> JVM/GC/JFR
  -> logs and traces
```

### 面试回答要点

- 用有界队列、消费速率和上游协议实现背压；满载策略不能默认丢关键告警。
- 按告警键分区，保证需要顺序的同键事件落到同一处理者。
- 外部副作用使用幂等键、outbox 或状态机，重试不会重复开工单。
- I/O 并发可评估虚拟线程，但数据库连接、下游 QPS 仍由 Semaphore/连接池限制。
- 状态放在可恢复存储；本地缓存只是加速，并有大小、TTL 和一致性策略。
- 多副本跨故障域，readiness/摘流/优雅停机；消费者重平衡期间控制重复处理。
- 容量用流量、服务时间、长尾、队列年龄、对象保留和 native 内存估算，再压测。
- 发布采用 canary，比较业务与 JVM 指标；保留制品、配置和数据兼容回滚。

### 递进追问

**下游工单只能 1,000 QPS 怎么办？** 限制该步骤并发，优先级排队，合并重复告警，设置截止时间，超载时明确降级并告警；不能用更多线程突破下游能力。

**一个实例死机，如何不丢数据？** 输入先持久化并有 ack 边界；只在结果和状态达到既定一致性后确认。消费者恢复时靠幂等处理重复投递。

**怎样证明不是 GC？** 同窗比较 pause、GC CPU、allocation、live set 与请求延迟，再看线程/连接池/Trace；没有对应暂停就降低 GC 假设优先级。

## Java 与其他语言怎么选

| 对比 | Java 的常见优势 | 需要付出的代价 |
|---|---|---|
| Java vs Go | 企业库、JVM 诊断、成熟框架、复杂业务建模 | 启动/内存通常更重，构建与依赖体系复杂 |
| Java vs Python | 静态类型、长期服务吞吐、多线程并行、部署基线明确 | 原型和数据分析表达通常更冗长 |
| Java vs Kotlin | Java 生态与兼容面最直接 | Kotlin 语法更精炼，但编译/互操作/团队能力需评估 |
| JVM vs native executable | JIT 可按运行热点优化，动态能力与诊断成熟 | 需要预热和 JVM；native 方案有反射、构建和峰值权衡 |

没有“永远更好”的语言。按团队能力、生态、延迟/吞吐、内存、启动、交付、可观测性、支持期限和业务风险选择。

## 面试怎么讲

### 30 秒版本

Java 是静态类型语言，`javac` 把源码编译为 class 字节码，JVM 负责类加载、校验、解释/JIT 执行、线程和 GC。JDK 还提供 `jcmd`、JFR 等生产工具。做 Java 服务时我会同时治理字节码与依赖兼容、Heap 与 native 内存、线程/连接池、日志指标 Trace、容器容量、灰度和回滚，而不是只会写语法或调 `-Xmx`。

### 3 分钟版本

可以按四层讲：

1. 语言层：类型、类/interface、泛型、异常、集合、Stream 和并发语义。
2. 工具链：JDK 发行版、`javac --release`、JAR、classpath/module path、Maven/Gradle 与供应链。
3. JVM：类加载与链接、解释/JIT、Heap/Metaspace/Code Cache/native、GC、JMM、平台/虚拟线程。
4. 生产层：有界队列和背压、连接池、HA、优雅停机、JFR/Thread Dump/GC、升级回滚和安全。

最后举真实实验：用 JDK 24 目标 Java 21 编译告警摘要器并验证 major 65；再制造双锁死锁，用 `jcmd Thread.print -l` 找到双方持锁与等待关系，统一锁顺序后恢复。

## 核心面试题与连续追问

### 1. JDK、JRE、JVM 有什么区别

JVM 定义/实现字节码执行环境；JRE 是传统运行时组合；JDK 包含运行时、编译器、打包和诊断工具。追问发行版时说明 OpenJDK 代码、厂商构建、许可和支持承诺要分开。

### 2. Java 为什么跨平台

源码通常编译成标准 class 字节码，各平台 JVM 把它执行为本地行为。追问边界时说 JNI、本地库、路径、字符集、时区和 OS 权限仍可能不跨平台。

### 3. Java 是值传递还是引用传递

一律按值传递；对象参数复制的是引用值。追问为什么能改对象时说明两个引用指向同一可变对象，但重绑形参不改变调用方变量。

### 4. `==` 与 `equals` 有什么区别

基本类型 `==` 比数值，引用类型 `==` 比身份；`equals` 可定义值相等。追问 HashMap 时说明相等对象必须有一致 hashCode。

### 5. HashMap 怎么工作

根据 hash 定位桶，再用 equals 确认键；碰撞结构与扩容是实现细节。追问并发时说明普通 HashMap 不提供线程安全，复合操作即使换 ConcurrentHashMap 也要分析原子边界。

### 6. ArrayList 与 LinkedList 怎么选

ArrayList 连续引用数组、随机访问和局部性通常更好；LinkedList 每节点额外对象和指针，按迭代器已定位位置插删才可能有优势。不能只背 O(1)/O(n)，要结合定位成本和内存。

### 7. 泛型为什么有类型擦除

Java 泛型主要在编译期检查，运行时通常保留原始类以兼容既有字节码。追问限制时说不能 `new T()`、不能 `instanceof List<String>`，bridge method 和签名属性用于保持多态/元数据。

### 8. checked exception 是否应该全部保留

它强制调用方处理可预期失败，但层层声明可能污染边界。应按是否能恢复、调用契约和框架习惯选择；无论哪类都要保留 cause、上下文和清理。

### 9. 类加载的双亲委派有什么价值

优先复用父加载器定义，减少核心类重复与类型混乱。追问应用服务器时说明可有 child-first/隔离策略；类身份还包含定义类加载器。

### 10. `ClassNotFoundException` 与 `NoClassDefFoundError` 区别

前者常由显式加载找不到类的受检异常；后者是 JVM 需要类定义但不可用的 Error，也可能源于静态初始化先前失败。最终以完整 cause 和加载日志判断。

### 11. JVM 内存区域有哪些

Heap、每线程栈、Metaspace、Code Cache、Direct/Native 等。追问 OOM 时先读具体消息，容器 OOM kill 还要查 cgroup 与 RSS。

### 12. GC 怎样判断对象存活

从 GC Roots 做可达性分析。追问泄漏时说明“仍可达但不再需要”不会被回收，要用 retained path 找意外引用。

### 13. G1 与 ZGC 怎么选

从堆规模、暂停 SLO、吞吐、CPU/内存预算和版本支持出发，基于压测与生产 canary；不是“ZGC 新所以一定好”。

### 14. `volatile` 能保证什么

保证相关读写的可见性和排序，不让 `count++` 复合操作自动原子。追问单例时结合初始化安全与 happens-before 解释。

### 15. `synchronized` 和 ReentrantLock 怎么选

简单作用域优先清晰的 `synchronized`；需要可中断、超时、多 Condition 时评估 Lock。二者都要控制临界区和锁顺序。

### 16. 什么是 happens-before

它是 JMM 中保证可见性和顺序的关系，不是简单墙上时间。举解锁/随后加锁、volatile 写/读、start/join 例子。

### 17. 虚拟线程为什么能支持更多并发

阻塞时 JVM 可卸载虚拟线程，让 carrier 执行其他任务，减少一个请求绑定一个 OS 线程的成本。追问边界时说明 CPU、连接池、下游限额和背压没有消失。

### 18. 怎样定位死锁

同窗抓 `jcmd PID Thread.print -l`，找 JVM deadlock 报告、锁拥有者/等待者和业务路径；修复锁顺序或设计。线程池饥饿可能没有 deadlock 报告，要结合队列和下游。

### 19. Heap 低但 RSS 高怎么办

查线程栈、Direct Buffer、Metaspace、Code Cache、NMT、mmap、JNI、本地库和 page cache；也看容器/系统口径。只做 Heap Dump 不够。

### 20. 怎样定位 Java CPU 高

先确认实例与时间窗，系统层找热线程，JFR/profile 映射热点，结合 GC/JIT/锁和业务流量。连续 Thread Dump 可辅助但不是精确 CPU profile。

### 21. 为什么线程池队列不建议无界

过载时任务无限等待并占内存，把立即拒绝变成长尾和 OOM。追问策略时给有界容量、超时、CallerRuns/拒绝、上游背压和告警。

### 22. Java 服务如何优雅停机

先 readiness 摘流，停新任务，等待有界在途，关闭池和资源，超时退出；消息确认与外部写要幂等。追问 Kubernetes 时结合 preStop、termination grace 和负载均衡传播。

### 23. JFR 与 Heap Dump 有什么区别

JFR 是一段时间的事件记录；Heap Dump 是某一时刻对象图。前者适合 CPU/锁/分配/GC 时间线，后者适合保留关系；两者都有开销与敏感数据边界。

### 24. Java 大版本怎样升级

盘点 JDK/框架/中间件/驱动/Agent/参数，重新构建和测试，做性能/兼容 canary，保持数据和制品可回退。追问 `--add-opens` 时说明它只应是有退出计划的临时兼容措施。

### 25. 怎样设计可观测 Java 服务

业务 RED/USE 指标、结构化日志、Trace，上层线程/连接池和队列，底层 JVM/GC/JFR 与容器资源；统一 version/instance/time/trace 维度，配合 SLO 和 runbook。

## 学习路线

### 第 1 周：语言与工具链

- 安装 JDK，确认版本和路径。
- 写 class、method、record、interface、exception。
- 练 List/Map、泛型、Lambda、Stream。
- 编译、运行、JAR、`javap`。

### 第 2 周：JVM 与并发

- 画类加载、JIT、内存和 GC 图。
- 写线程、Executor、锁、volatile、atomic。
- 跑死锁实验并读 Thread Dump。
- 录 JFR，识别 CPU、allocation、GC 和 lock 事件。

### 第 3 周：生产工程

- 做带超时、限流和结构化日志的 HTTP 调用。
- 接入指标和 Trace，画一个 JVM Dashboard。
- 设计容器内存预算、readiness 和优雅停机。
- 演练 class 冲突、OOM 或下游慢故障。

### 第 4 周：交付与面试

- 用 Maven/Gradle 固定 JDK、依赖、测试和制品。
- 做一次 JDK 升级 canary/回滚方案。
- 完成告警平台系统设计和事故复盘。
- 用 30 秒、3 分钟和白板图回答连续追问。

## 学习检查清单

- [ ] 我能分清 Java、Java SE、JDK、JRE、JVM、OpenJDK、Jakarta EE 和 Spring。
- [ ] 我知道 LTS 与支持期取决于发行方，不把它当成全生态统一承诺。
- [ ] 我能确认 `java`、`javac` 和应用实际使用的 JDK 路径。
- [ ] 我能从源码编译、运行、打 JAR，并解释 classpath。
- [ ] 我会使用类型、类、interface、record、泛型、集合、异常和 Stream。
- [ ] 我能解释 Java 按值传递、equals/hashCode 和泛型擦除。
- [ ] 我能画出加载、验证、链接、初始化、解释/JIT 的路径。
- [ ] 我能区分 Heap、Stack、Metaspace、Code Cache、Direct 与其他 native 内存。
- [ ] 我能用 allocation、live set、暂停和吞吐讨论 GC。
- [ ] 我能用 happens-before 解释锁、volatile、start 和 join。
- [ ] 我能区分平台线程、虚拟线程、线程池和资源限流。
- [ ] 我能设计有界队列、背压、超时、重试和幂等。
- [ ] 我会用 `jcmd`、JFR、Thread Dump 和 GC 日志收集证据。
- [ ] 我知道 Heap Dump 的停顿、磁盘和敏感数据风险。
- [ ] 我能排查 class 版本、缺类、方法冲突、OOM、死锁和 PKIX。
- [ ] 我能做容器 Heap + native 内存预算，不把 `-Xmx` 当 RSS。
- [ ] 我能设计多副本、readiness、摘流、优雅停机和恢复。
- [ ] 我能给出 JDK/框架/Agent/依赖的升级与回滚方案。
- [ ] 我能完成生产事故题和高吞吐告警平台设计题。
- [ ] 我能把实验、截图、JFR 摘要和排障记录提交到 GitHub。

## GitHub 学习证据

建议建立：

```text
java-aiops-lab/
  README.md
  pom.xml or build.gradle
  src/main/java/
  src/test/java/
  evidence/
    java-version.txt
    class-version.txt
    jfr-summary.txt
    thread-dump-analysis.md
    gc-notes.md
    capacity-budget.md
    upgrade-rollback.md
  runbooks/
    cpu-high.md
    memory-growth.md
    thread-pool-exhausted.md
```

README 写清前置版本、运行命令、预期输出、故障注入、安全边界和清理。JFR、Heap Dump、Thread Dump 可能包含敏感信息；公开仓库只提交脱敏摘要和分析结论，不提交生产原文件。

一次合格的学习证据至少包含：

1. 可复现源码和测试。
2. 实际 `java -version`、编译目标和制品哈希。
3. 基础实验成功输出。
4. 故障现象、证据、假设、修复、验证和回滚。
5. 一张架构/数据流图和一份容量预算。
6. 明确哪些环境已验证，哪些只是设计。

## 学习与验证边界

本文的告警摘要器、class version、短时 JFR、确定性死锁和统一锁顺序修复已在 Windows + Oracle JDK 24 本地真实执行。没有在 JDK 25/26、Linux、macOS、容器、OpenJ9、生产业务流量或大型 Heap 上实测；版本与工具行为仍应在目标发行版重新验证。

读完本文不等于自动具备 Java 高级工程师或大厂岗位能力。还需要独立训练数据结构与算法、Linux、网络、数据库、Spring/Jakarta EE、Maven/Gradle、测试、分布式系统、云原生、安全、系统设计、真实项目和沟通表达。本文的目标，是让 Java/JVM 这一环达到“能运行、能解释、能诊断、能设计、能留下证据”的水平。
