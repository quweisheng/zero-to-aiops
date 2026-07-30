# Apache Maven 技术栈深讲

> 适用版本：Apache Maven 3.9.16（当前稳定版），兼顾 Maven 3.10.0-rc-1 与 Maven 4.0.0-rc-5 的迁移认知。
> 文档基线：2026 年 7 月 30 日。版本会继续变化，安装或升级前请再次核对官方发布历史。
> 学习边界：本文讲透 Java 项目从模型解析、依赖解析、生命周期执行到制品发布的主链路。Java 语法、JVM、完整 CI/CD 平台和 Nexus 运维需要分别学习。

## 学完你应该能做到什么

学完本文，不只是会输入 `mvn clean package`，还应该能够：

- 用人话说明 Maven、POM、坐标、生命周期、阶段、插件和目标分别是什么。
- 画出一次构建从读取配置到生成 JAR、再到发布制品的完整数据路径。
- 解释继承与聚合、`dependencies` 与 `dependencyManagement`、父 POM 与 BOM 的区别。
- 看懂传递依赖、依赖范围、最短路径仲裁、排除和可选依赖。
- 正确使用本地仓库、中央仓库、企业私服、镜像、代理和凭据。
- 为项目固定 Maven、JDK、插件和依赖版本，降低“我这里能构建”的环境漂移。
- 在 CI 中构建多模块项目，选择正确的失败策略、并行度、缓存和制品边界。
- 诊断 `Non-resolvable parent POM`、401/403、TLS、校验和、依赖冲突、测试失败等常见问题。
- 完成一个可复现的入门实验和一个仓库故障注入实验。
- 回答大厂面试中关于内部路径、状态模型、生产架构、安全、性能、升级与事故处理的追问。

## 先记住版本边界

截至本文基线日期，官方发布历史给出的边界是：

| 分支 | 状态 | 运行 Maven 所需 JDK | 本文建议 |
|---|---|---:|---|
| Maven 3.9.16 | 当前稳定版（GA，正式可用） | Java 8+ | 新的生产构建基线优先选它 |
| Maven 3.10.0-rc-1 | Release Candidate，发布候选版 | Java 8+ | 只做兼容性验证，不当生产默认 |
| Maven 4.0.0-rc-5 | 尚未 GA 的 Maven 4 候选版 | Java 17+ | 建独立试验流水线，不直接替换生产 |

GA 是 General Availability，表示面向生产正式发布；RC 是 Release Candidate，表示候选版本，仍需要生态反馈。
“Maven 4 已经有 RC”不等于“Maven 4 已经正式发布”。

还有两个容易混淆的 Java 版本：

- **运行 Maven 的 JDK**：启动 `mvn` 进程的 Java，由 `JAVA_HOME` 或 `PATH` 决定。
- **编译项目的 JDK 或目标版本**：由编译插件、`--release` 或 Toolchains（工具链）决定。

因此，Maven 可以由较新的 JDK 启动，同时通过 Toolchains 选择另一套 JDK 编译项目。不要只看 `pom.xml`，也不要只看 `java -version`；先看 `mvn -version`。

## 官方资料

建议按下面的顺序阅读一手资料：

1. [Maven 官方首页](https://maven.apache.org/)
2. [Maven 安装说明](https://maven.apache.org/install)
3. [Maven 发布历史](https://maven.apache.org/docs/history.html)
4. [Maven Guides 指南索引](https://maven.apache.org/guides/)
5. [POM Reference](https://maven.apache.org/pom.html)
6. [构建生命周期介绍](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)
7. [依赖机制介绍](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
8. [仓库介绍](https://maven.apache.org/guides/introduction/introduction-to-repositories.html)
9. [settings 配置参考](https://maven.apache.org/settings.html)
10. [Maven Wrapper](https://maven.apache.org/wrapper/)
11. [可复现构建指南](https://maven.apache.org/guides/mini/guide-reproducible-builds.html)
12. [Maven 4 迁移指南](https://maven.apache.org/guides/mini/guide-migration-to-mvn4)

官方文档负责给出事实和接口，本文负责把它们重新组织成一条适合 AIOps、SRE 和 DevOps 学习者的实践路径。

## 官方知识地图

```text
Apache Maven
├─ 输入
│  ├─ pom.xml：项目模型
│  ├─ settings.xml：用户或机器环境配置
│  ├─ .mvn/：项目级 Maven 参数、JVM 参数与 Wrapper
│  └─ 源码、测试、资源文件
├─ 模型
│  ├─ 坐标：groupId + artifactId + version
│  ├─ packaging：jar、war、pom……
│  ├─ 继承：parent
│  ├─ 聚合：modules
│  ├─ 依赖图：dependencies
│  └─ 插件执行图：build/plugins
├─ 执行
│  ├─ 生命周期：clean、default、site
│  ├─ 阶段：validate、compile、test、package、verify、install、deploy
│  ├─ 插件：plugin
│  └─ 目标：goal
├─ 解析
│  ├─ 本地仓库
│  ├─ 远程仓库
│  ├─ 企业镜像/私服
│  ├─ POM、元数据、JAR 与校验文件
│  └─ 依赖仲裁、范围、排除、BOM
└─ 输出
   ├─ target/ 编译结果与测试报告
   ├─ JAR/WAR 等制品
   ├─ 本地 install
   ├─ 远程 deploy
   └─ 构建日志、指标、SBOM 与审计证据
```

这里的 artifact（制品）是构建后可被识别、存储和复用的文件，例如 JAR、WAR、POM。
repository（仓库）是保存并分发制品的地方，不是 Git 源码仓库。

## 推荐学习顺序

如果你是零基础，按这条线学习：

1. 先会读坐标和最小 `pom.xml`。
2. 再理解生命周期、阶段、插件和目标。
3. 跟着入门实验完成编译、测试、打包和验证。
4. 学会看 `effective-pom` 和 `dependency:tree`。
5. 再学依赖范围、仲裁、BOM、继承和多模块 Reactor。
6. 学会 `settings.xml`、镜像、企业私服与凭据。
7. 完成仓库故障注入，建立证据化排障习惯。
8. 最后学习 CI、性能、安全、可复现构建、升级与生产系统设计。

## 场景开场：同一份代码，为什么换台机器就构建失败

开发电脑上执行：

```powershell
mvn clean package
```

很快得到 JAR。提交到 CI 后却出现：

```text
Non-resolvable import POM
Could not transfer artifact ...
```

换一台 Agent 又报：

```text
Unsupported class file major version
```

有人把本机 `.m2/repository` 整个复制到 CI，短期似乎恢复；几天后运行时又出现：

```text
java.lang.NoSuchMethodError
```

这不是三个毫无关系的问题。它们都在说明：团队没有控制完整的构建输入。

Maven 构建的输入不只有源码，还包括：

- Maven 版本；
- 运行和编译使用的 JDK；
- 生效 POM；
- 插件及其依赖；
- 依赖图和仓库元数据；
- 用户或 CI 的 `settings.xml`；
- 网络、镜像和企业私服；
- 环境变量、Profile 与命令行属性。

真正的 Maven 能力，是把这些输入变成可解释、可复现、可观测、可回滚的构建链路。

## 一句话人话版

**Maven 是 Java 生态里的“项目说明书解释器 + 依赖解析器 + 构建流程调度器”：它读取 POM，算出完整项目模型和依赖图，按生命周期调用插件，最后产出并发布制品。**

## 小白可能会问

### Maven 是编译器吗

不是。Java 编译工作通常由 Maven Compiler Plugin 调用 `javac` 完成。Maven 负责组织“何时编译、使用什么参数、之前和之后做什么”。

### Maven 是依赖下载器吗

不止。下载依赖只是它的一部分。Maven 还负责项目模型、生命周期、插件执行、多模块排序、测试、打包、安装和发布。

### Maven 和 Jenkins 是一回事吗

不是：

- Maven 定义并执行单个项目或 Reactor 的构建。
- Jenkins、GitHub Actions、GitLab CI 等负责在什么事件、什么节点、什么权限和什么发布流程中调用 Maven。

可以把 Maven 看成生产制品的机器，把 Jenkins 看成安排机器何时开工的车间调度系统。

### Maven 和 Nexus 是一回事吗

不是：

- Maven 是构建客户端。
- Nexus Repository 等制品库负责缓存、托管、代理和分发制品。

Maven 可以直接访问 Central，但企业通常让它统一经过内部制品库。

### `.m2/repository` 能当备份吗

不能把它当权威备份。它主要是本地缓存，也会保存 `mvn install` 产生的本地制品和解析状态。权威发布制品应该进入受治理的远程制品库。

## Maven 解决什么问题

没有统一构建工具时，不同项目可能各自维护脚本：

```text
下载哪些 JAR？
以什么顺序编译？
测试怎么运行？
资源文件放哪里？
怎么打成 JAR 或 WAR？
多模块先构建谁？
制品发布到哪里？
```

Maven 用约定、POM 和插件生态解决这些问题：

- **统一项目结构**：默认知道源码、测试和资源目录。
- **声明依赖**：写坐标，不把一堆 JAR 提交进 Git。
- **统一生命周期**：`verify` 在不同项目里表达相近的质量含义。
- **插件化能力**：编译、测试、打包、代码生成、检查和发布各由插件完成。
- **多模块编排**：根据模块依赖进行拓扑排序。
- **制品复用**：本地安装或远程发布后，其他项目按坐标使用。
- **CI 友好**：可以用非交互、可解析的命令运行。

但 Maven 不自动保证：

- 依赖一定安全；
- 每次构建一定字节级相同；
- 所有插件都兼容任意 Maven/JDK；
- 私服一定高可用；
- `SNAPSHOT` 一定不变；
- 测试一定充分；
- 制品可以直接生产发布。

这些仍需版本治理、仓库治理、测试、安全扫描和发布策略共同完成。

## 关键术语先拆开

| 术语 | 人话解释 | 怎么观察 | 常见误区 |
|---|---|---|---|
| Project | Maven 正在构建的项目模型 | `mvn help:effective-pom` | 只等于当前目录 |
| POM | Project Object Model，项目对象模型 | `pom.xml` | 只是依赖清单 |
| Coordinate | 唯一定位制品的坐标 | `groupId:artifactId:packaging:version` | 只有文件名 |
| Artifact | 构建或解析出的制品 | `target/*.jar`、仓库目录 | 只指 JAR |
| Lifecycle | 一条预定义构建生命周期 | `clean`、`default`、`site` | 等于具体命令 |
| Phase | 生命周期中的阶段 | `compile`、`test`、`verify` | 自己执行工作 |
| Plugin | 提供构建能力的插件 | `maven-surefire-plugin` | Maven 核心自带所有功能 |
| Goal | 插件暴露的具体动作 | `dependency:tree` | 等于阶段 |
| Repository | POM、JAR、元数据的仓库 | Central、Nexus、`.m2/repository` | 等于 Git 仓库 |
| Reactor | 当前多模块构建会话中的项目集合与顺序 | 构建日志中的 Reactor Summary | 长期运行的服务 |
| Profile | 条件化的一组模型配置 | `mvn help:active-profiles` | 最佳的环境配置中心 |
| BOM | Bill of Materials，版本物料清单 | `dependencyManagement` 中导入 POM | 自动引入依赖 |

## 核心原理一：坐标、制品与项目目录

### 它是什么

最常见坐标由三部分构成：

```text
groupId:artifactId:version
dev.aiops:alert-service:1.0.0
```

完整定位还可能包含：

```text
groupId:artifactId:type:classifier:version
```

- `groupId`：组织或项目组命名空间。
- `artifactId`：当前模块或制品名。
- `version`：版本。
- `type`：常见为 `jar`、`war`、`pom`。
- `classifier`：同一版本的附加变体，如 `sources`、`javadoc`。

### 为什么需要

如果只有 `common.jar`，你不知道它属于谁、是什么版本、是否和另一份同名文件相同。坐标把人类命名变成依赖解析器可以确定处理的身份。

### 怎么工作

坐标会映射为仓库路径。比如：

```text
org.junit.jupiter:junit-jupiter-api:5.11.0
```

对应路径近似为：

```text
org/junit/jupiter/junit-jupiter-api/5.11.0/
```

目录中可出现 JAR、POM、校验文件和仓库状态文件。

### 怎么使用和观察

```powershell
mvn dependency:tree
mvn dependency:get -Dartifact=org.junit.jupiter:junit-jupiter-api:5.11.0
```

再观察：

```powershell
Get-ChildItem "$env:USERPROFILE\.m2\repository\org\junit\jupiter\junit-jupiter-api\5.11.0"
```

### 坏了怎么查

- 坐标拼错：先在可信仓库中核对 GAV。
- 版本不存在：查仓库 URL 和版本，而不是反复 `-U`。
- JAR 有、POM 缺失：依赖图可能不完整，检查仓库代理和发布流程。
- 同名不同内容：对比 SHA-256、来源仓库和发布记录。

## 核心原理二：POM、Super POM 与 Effective POM

### 它是什么

`pom.xml` 是项目声明，但 Maven 真正执行的不是肉眼看到的原始文件，而是合并后的 Effective POM（生效 POM）。

它的来源包括：

```text
Super POM
  + 父 POM 链
  + 当前 pom.xml
  + 激活的 Profile
  + settings 与命令行属性影响
  = Effective POM
```

Super POM 是 Maven 内置的基础模型。即使你没有声明 Central、默认目录和部分插件绑定，Maven 仍能按默认约定工作。

### 为什么需要

它让团队把公共版本、插件和规则放在父 POM 中，子项目只描述差异；同时保留 Maven 的约定优于配置。

### 怎么工作

模型构建器读取当前 POM，解析父 POM和导入的 BOM，插值属性，合并 Profile，校验模型，最终产生可执行模型。
因此，错误可能在真正编译源码前就发生，例如父 POM或 BOM 无法解析。

### 怎么使用和观察

```powershell
mvn help:effective-pom -Doutput=target/effective-pom.xml
mvn help:effective-settings -Doutput=target/effective-settings.xml
mvn help:active-profiles
```

`effective-settings.xml` 可能包含环境细节，提交或分享前必须检查是否暴露服务器标识、用户名或其他敏感信息。

### 坏了怎么查

1. 看报错是模型构建阶段，还是插件执行阶段。
2. 执行 `help:effective-pom`，确认最后生效的版本和插件配置。
3. 检查父 POM 的 `relativePath` 与仓库可达性。
4. 检查 Profile 是谁激活的。
5. 用 `mvn -X` 查看模型和仓库解析细节，但分享日志前先脱敏。

## 核心原理三：继承与聚合不是一回事

### 继承是什么

子 POM 通过 `<parent>` 继承父 POM 的可继承配置：

```xml
<parent>
  <groupId>dev.aiops</groupId>
  <artifactId>platform-parent</artifactId>
  <version>1.0.0</version>
  <relativePath>../pom.xml</relativePath>
</parent>
```

它常用于统一：

- 依赖版本；
- 插件版本；
- Java 编译级别；
- 编码；
- 测试和质量规则；
- 发布规则。

### 聚合是什么

聚合 POM 用 `<modules>` 把多个项目放进同一次 Reactor：

```xml
<packaging>pom</packaging>

<modules>
  <module>common</module>
  <module>service</module>
</modules>
```

Reactor 会读取模块间依赖并拓扑排序，不要求 `<modules>` 按依赖顺序手工排列。

### 为什么要分清

- 一个项目可以继承某个父 POM，但不在该父 POM 的模块列表里。
- 一个聚合器可以构建若干模块，但这些模块不一定继承它。
- 一个 POM 也可以同时是父 POM 和聚合器，这很常见，但仍是两种关系。

### 怎么观察

```powershell
mvn -B -ntp validate
mvn -pl service -am verify
```

- `-pl service`：只选择 `service`。
- `-am`：also make，把 `service` 所依赖的 Reactor 模块一起构建。

### 坏了怎么查

- `Child module ... does not exist`：检查模块路径和大小写。
- 构建顺序不对：检查模块间是否真的用 Maven 坐标声明依赖。
- 子模块版本不一致：检查父版本、CI-friendly revision 或版本更新流程。
- 单模块能过、根目录失败：看 Reactor Summary，定位首个失败模块和依赖传播范围。

## 核心原理四：生命周期、阶段、插件与目标

### 三条内置生命周期

Maven 有三条内置生命周期：

| 生命周期 | 作用 | 常见调用 |
|---|---|---|
| `clean` | 清理上次构建输出 | `mvn clean` |
| `default` | 校验、编译、测试、打包、验证、安装、发布 | `mvn verify` |
| `site` | 生成项目站点和报告 | `mvn site` |

### default 生命周期的主线

```text
validate
  -> compile
  -> test
  -> package
  -> verify
  -> install
  -> deploy
```

调用后面的阶段，会按顺序执行前面的阶段：

```powershell
mvn verify
```

不是“只执行 verify”，而是从前面的阶段一路执行到 `verify`。

### 阶段自己会编译吗

不会。Phase 是流程中的挂点，实际工作由绑定到阶段的 Plugin Goal 完成。例如：

```text
compile phase
  -> maven-compiler-plugin:compile

test phase
  -> maven-surefire-plugin:test

package phase（jar packaging）
  -> maven-jar-plugin:jar
```

绑定取决于 packaging、POM 和 Maven 默认规则。

### 直接调用目标

```powershell
mvn dependency:tree
```

这是直接调用 Maven Dependency Plugin 的 `tree` goal，不是运行完整 default 生命周期。

也可以混合：

```powershell
mvn clean dependency:tree verify
```

生产流水线应保持命令目的清晰，避免把大量临时目标堆在一起，导致日志和失败语义难以理解。

### 坏了怎么查

1. 看日志中的 `plugin:version:goal`，确认真正失败的动作。
2. 判断是 Maven Core、构建插件，还是业务测试报错。
3. 显式固定插件版本，减少默认版本漂移。
4. 遇到并行问题，确认插件目标是否标记 thread-safe。
5. 用 `mvn help:describe -Dplugin=... -Ddetail` 查看插件目标和参数。

## 核心原理五：依赖图、范围与版本仲裁

### 传递依赖

如果 A 依赖 B，B 依赖 C，Maven 通常会把 C 作为 A 的传递依赖解析进图中。
这减少手工声明，但依赖图会快速增长。

源码直接使用某个库时，即使它当前由别的依赖传递带入，也应直接声明。否则上游改变依赖后，你的代码会突然无法编译。

### 六种范围

| scope | 编译主代码 | 测试 | 运行 | 是否典型传递 | 典型用途 |
|---|---:|---:|---:|---:|---|
| `compile` | 是 | 是 | 是 | 是 | 常规业务依赖，默认值 |
| `provided` | 是 | 是 | 否 | 通常不传给消费者运行时 | Servlet API 等由运行环境提供的库 |
| `runtime` | 否 | 是 | 是 | 是 | JDBC 驱动、运行时实现 |
| `test` | 否 | 是 | 否 | 否 | JUnit、Mockito |
| `system` | 是 | 是 | 视配置而定 | 否 | 本地绝对路径 JAR，不推荐 |
| `import` | 不直接进类路径 | 不直接进类路径 | 不直接进类路径 | 只在 `dependencyManagement` 中处理 | 导入 BOM |

`system` 绕过仓库与可移植性，官方也不建议作为常规方案。企业私有 JAR 应发布到受控制品库，而不是写开发者电脑路径。

### 版本仲裁

同一个制品出现多个版本时，Maven 的核心规则是：

1. **nearest definition**：离当前项目依赖树路径更近的版本胜出。
2. 若深度相同，POM 中先声明的路径胜出。
3. 当前项目显式声明版本，可以把选择固定在当前层。
4. `dependencyManagement` 可以统一管理被使用依赖的版本。

这不是“自动选择最高版本”。面试中如果回答“Maven 总选最新版”，通常会被继续追问。

### 怎么观察

```powershell
mvn dependency:tree
mvn dependency:tree -Dverbose
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core
mvn dependency:analyze
```

重点看：

- `omitted for conflict`；
- 选中的版本；
- 哪条路径带入；
- scope 如何传播；
- 是否使用了未声明依赖；
- 是否声明了但没使用。

### 运行时冲突为什么构建还能成功

编译只要求编译期类路径里存在所需符号。运行时若实际加载了另一个不兼容版本，就可能出现：

```text
NoSuchMethodError
ClassNotFoundException
NoClassDefFoundError
```

排查时不要只搜索异常文本，要同时收集：

```powershell
mvn dependency:tree -Dverbose
java -verbose:class -jar app.jar
```

具体运行命令需根据应用打包方式调整。

### exclusion 与 optional

排除某条路径带入的依赖：

```xml
<dependency>
  <groupId>example</groupId>
  <artifactId>legacy-client</artifactId>
  <version>2.0.0</version>
  <exclusions>
    <exclusion>
      <groupId>example</groupId>
      <artifactId>old-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

可选依赖：

```xml
<dependency>
  <groupId>example</groupId>
  <artifactId>feature-driver</artifactId>
  <version>1.2.0</version>
  <optional>true</optional>
</dependency>
```

`optional` 可以理解为“对消费者默认不继续传递”。如果消费者需要该能力，应自己显式声明。

排除不是“看到安全告警就删坐标”。先验证运行路径、兼容版本和回归测试，否则可能把冲突变成缺类故障。

## 核心原理六：dependencies、dependencyManagement 与 BOM

### `dependencies` 会真正使用依赖

```xml
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

它把依赖加入当前项目的依赖图和相应类路径。

### `dependencyManagement` 主要管理默认值

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.11.0</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

它本身通常不会把 JUnit 加进类路径。子项目或当前项目仍需在 `<dependencies>` 中使用它，只是可以省略被管理的版本。

### `pluginManagement` 也只提供默认值

`pluginManagement` 用来统一插件版本与默认配置，但不会让所有受管理插件自动执行。插件真正执行还需要满足至少一种条件：

- packaging 已有默认生命周期绑定；
- 插件出现在 `<build><plugins>`；
- `<executions>` 把 goal 绑定到阶段；
- 命令行显式调用 goal。

因此，“Effective POM 里看到了插件”不等于“这次构建一定执行了它”。要以日志中的 `plugin:version:goal` 和执行计划为证据。

### BOM 是什么

BOM 是一份相关依赖的版本组合。Maven 3 常见导入方式：

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit</groupId>
      <artifactId>junit-bom</artifactId>
      <version>5.11.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

它解决“一组组件应该使用哪套兼容版本”的问题，但不会自动把 BOM 中所有库都引入。

### 父 POM 与 BOM 的选择

| 需求 | 父 POM | BOM |
|---|---:|---:|
| 统一依赖版本 | 可以 | 可以 |
| 统一插件版本和构建规则 | 可以 | 不适合 |
| 同时导入多套版本清单 | 单继承限制明显 | 可以导入多个 |
| 改变项目继承关系 | 会 | 不会 |

实践中常用：

- 企业 Parent 统一构建规则；
- 框架 BOM 统一库版本；
- Enforcer 校验禁止未受控版本。

## 核心原理七：本地仓库、远程仓库与元数据

### 只有两类 Maven 仓库

从 Maven 客户端视角，仓库分为：

- **local repository**：本地仓库，默认在用户目录的 `.m2/repository`。
- **remote repository**：远程仓库，包括 Central、企业私服和其他受控仓库。

企业“Hosted、Proxy、Group”是制品库产品的管理方式，对 Maven 来说最终仍是远程仓库 URL。

四类配置不要混淆：

| 配置 | 作用 |
|---|---|
| `<repositories>` | 下载项目依赖 |
| `<pluginRepositories>` | 下载构建插件 |
| `<distributionManagement>` | 发布 Release 或 Snapshot |
| settings 中 `<mirrors>` | 在真正访问前把匹配仓库重定向到另一个入口 |

同一原仓库只会匹配一个 Mirror。多个 Mirror 不是客户端高可用池；上游聚合、代理和故障转移应交给企业 Repository Manager。

### 解析路径

```text
构建请求一个坐标
  -> 检查 Reactor 中是否有对应模块
  -> 检查本地仓库与更新策略
  -> 根据 mirror 选择远程地址
  -> 下载 POM、元数据和制品
  -> 校验并写入本地仓库
  -> 构建依赖图与类路径
```

对 Maven Plugin 及其依赖，也会发生相似解析。
所以“业务依赖都在缓存里”不等于“离线构建一定能成功”，插件和插件依赖也必须准备完整。

### 本地仓库不是普通文件夹

其中除了 JAR 和 POM，还可能有：

- `maven-metadata-*.xml`：版本与快照元数据；
- `_remote.repositories`：来源跟踪；
- `.lastUpdated`：某次解析失败或更新时间记录；
- 校验文件与 Resolver 状态。

因此不要在共享目录上让大量并发构建随意读写，也不要遇到任何错误就删除整个 `.m2`。

更安全的处理是：

1. 确认精确坐标和失败文件。
2. 记录错误、来源仓库和校验值。
3. 仅隔离相关坐标目录，或使用新的临时本地仓库复现。
4. 修复网络、镜像或上游制品后重新解析。
5. 保留证据，评估是否有供应链风险。

### Release 与 SNAPSHOT

- `1.2.3` 通常表示 Release，应保持不可变。
- `1.2.4-SNAPSHOT` 表示开发快照，远程仓库中的实际文件可带时间戳并发生更新。

如果生产构建依赖 SNAPSHOT，即使源码不变，解析结果也可能随时间变化。
稳定发布应固定 Release 版本、禁止覆盖已发布版本，并保留制品哈希和构建来源。

## 核心原理八：settings、mirror、proxy、server 与 Profile

### 两层 settings

常见位置：

```text
${maven.home}/conf/settings.xml
${user.home}/.m2/settings.xml
```

前者是 Maven 安装级全局配置，后者是当前用户配置。CI 通常显式提供受控的临时 `settings.xml`。

### settings 字段字典

| 字段 | 作用 | 关键点 | 常见坑 |
|---|---|---|---|
| `localRepository` | 修改本地仓库路径 | CI 可使用任务级隔离目录 | 多任务共享导致争用或污染 |
| `mirrors` | 把仓库请求改送到镜像 | `mirrorOf` 匹配仓库 ID/范围 | 误写 `*` 后所有请求都被错误私服接管 |
| `proxies` | 配置 HTTP/HTTPS 代理 | 注意 `nonProxyHosts` | 密码泄露进仓库或日志 |
| `servers` | 按 `id` 保存认证信息 | `id` 要与仓库/发布配置对应 | 把凭据写进 POM |
| `profiles` | 提供仓库、属性等环境模型 | 要明确激活条件 | 环境切换变得隐式、难复现 |
| `activeProfiles` | 显式激活 settings Profile | CI 要可审计 | 本机默默激活，CI 没激活 |
| `pluginGroups` | 允许简写插件前缀 | 影响插件前缀解析 | 前缀解析到意外插件组 |

### 企业镜像示例

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0">
  <mirrors>
    <mirror>
      <id>company-public</id>
      <name>Company Maven group</name>
      <url>https://repo.example.com/repository/maven-public/</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>

  <servers>
    <server>
      <id>company-releases</id>
      <username>${env.MAVEN_REPO_USER}</username>
      <password>${env.MAVEN_REPO_TOKEN}</password>
    </server>
  </servers>
</settings>
```

这是结构示例，不要直接照搬域名和环境变量。生产实践还应：

- 由 CI 密钥系统注入凭据；
- 限制 Token 权限与有效期；
- 避免在调试日志中输出；
- 配置 TLS 信任链；
- 区分只读解析身份和可写发布身份；
- 审计下载与发布行为。

### `mirrorOf` 不是简单布尔开关

它可以匹配 `*`、`external:*`、`external:http:*`，也可以用 `!repo-id` 排除。匹配规则写错可能造成：

- Central 没走企业私服；
- 内部仓库被错误重定向；
- 本地测试仓库也被镜像；
- 所有构建在私服故障时一起失败。

先用：

```powershell
mvn help:effective-settings
mvn -X validate
```

确认“原始仓库 ID -> 最终镜像 ID/URL”的映射。

Maven 3.8 起默认设置包含外部 HTTP 仓库阻断逻辑。遇到 `maven-default-http-blocker` 时，不要绕过安全策略去恢复明文 HTTP；应优先让仓库提供 HTTPS，修复证书和信任链。

## 核心原理九：Wrapper、Toolchains 与 Enforcer

### Maven Wrapper

Wrapper 把启动脚本和 Maven 版本配置提交到项目中，让开发机和 CI 使用同一 Maven 分发版本。

生成示例：

```powershell
mvn wrapper:wrapper -Dmaven=3.9.16
```

之后：

```powershell
.\mvnw.cmd -version
.\mvnw.cmd -B -ntp verify
```

Linux/macOS：

```bash
./mvnw -version
./mvnw -B -ntp verify
```

Wrapper 3.2.0 起支持在配置中校验 Maven 分发包的 SHA-256。高可信流水线应固定：

- `distributionUrl`；
- Maven 版本；
- `distributionSha256Sum`；
- 如使用 wrapper JAR，再考虑 `wrapperSha256Sum`。

Wrapper 解决 Maven 版本一致性，不解决 JDK、操作系统、依赖仓库和插件版本的全部漂移。

### Toolchains

Toolchains 让 Maven 插件选择指定 JDK 等工具，而不是默认使用启动 Maven 的那一套。适合：

- CI 机器同时维护 JDK 17 与 21；
- Maven 由 JDK 24 启动，但项目必须用 JDK 17 编译；
- 多模块需要明确工具链要求。

先用 `mvn -version` 看启动 JDK，再看 Toolchains 插件日志确认编译工具链。不要把“能运行 Maven”和“能生成目标 Java 版本字节码”混为一谈。

### Maven Enforcer Plugin

Enforcer 可把团队约束变成失败门禁，例如：

- Maven 版本范围；
- JDK 版本范围；
- 依赖收敛；
- 禁止重复类或黑名单依赖；
- 禁止快照依赖；
- 要求插件或依赖版本。

它不会替你决定正确策略。门禁规则应先在报告模式验证，评估历史项目的影响，再逐步升级为阻断。

## 最小 POM 逐字段解释

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>dev.aiops.demo</groupId>
  <artifactId>hello-maven</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.build.outputTimestamp>2026-07-30T00:00:00Z</project.build.outputTimestamp>
  </properties>
</project>
```

| 字段 | 作用 | 预期结果 | 常见坑 |
|---|---|---|---|
| `modelVersion` | 指定 POM 模型版本 | Maven 3 常用 `4.0.0` | 把 Maven 版本写在这里 |
| `groupId` | 组织命名空间 | 和 `artifactId` 共同定位项目 | 随意变化导致坐标断裂 |
| `artifactId` | 模块/制品名 | 默认影响输出 JAR 名 | 多模块重名 |
| `version` | 项目版本 | 进入坐标和默认文件名 | 生产依赖长期使用 SNAPSHOT |
| `packaging` | 制品类型与默认生命周期绑定 | 默认是 `jar` | 以为只改变扩展名 |
| `maven.compiler.release` | 编译目标 Java 平台 | 编译器按 Java 17 API/字节码约束 | 只设 `source`，运行时仍不兼容 |
| `sourceEncoding` | 源码资源编码 | 跨环境更稳定 | 依赖平台默认编码 |
| `outputTimestamp` | 支持可复现归档时间戳 | 兼容插件可生成更稳定制品 | 以为只加它就完全可复现 |

## 项目目录约定

```text
hello-maven/
├─ pom.xml
├─ .mvn/
│  ├─ maven.config
│  ├─ jvm.config
│  └─ wrapper/
├─ mvnw
├─ mvnw.cmd
├─ src/
│  ├─ main/
│  │  ├─ java/
│  │  └─ resources/
│  └─ test/
│     ├─ java/
│     └─ resources/
└─ target/
```

- `src/main/java`：主 Java 源码。
- `src/main/resources`：会进入主类路径的资源。
- `src/test/java`：测试源码。
- `src/test/resources`：测试资源。
- `target`：生成目录，通常不提交 Git。
- `.mvn/maven.config`：项目级 Maven 命令参数。
- `.mvn/jvm.config`：启动 Maven JVM 的参数，不是应用 JVM 参数。

从 Maven 3.9 起，`.mvn/maven.config` 每一行按一个参数解释。升级旧项目时要检查原来是否把多个参数放在同一行。

## 常用命令字典

| 命令 | 目的 | 关键结果 | 典型 AIOps 场景 | 常见坑 |
|---|---|---|---|---|
| `mvn -version` | 看 Maven、Java、目录和平台 | 确认实际运行环境 | 构建漂移取证 | 只看 `java -version` |
| `mvn validate` | 解析并校验项目模型 | 很早暴露父 POM/BOM 问题 | 仓库可用性探针 | 误以为编译过了 |
| `mvn compile` | 编译主代码 | `target/classes` | 编译耗时基线 | 未运行测试 |
| `mvn test` | 编译并运行单元测试 | Surefire 报告 | 测试失败率和波动 | 等于集成测试 |
| `mvn package` | 生成 JAR/WAR | `target` 中有制品 | 产物大小异常检测 | 未必执行额外 verify 检查 |
| `mvn verify` | 跑到验证阶段 | 质量门禁完成 | CI 默认候选命令 | 仍未写入本地/远程仓库 |
| `mvn install` | 写入本地仓库 | 其他本地项目可解析 | 本地多仓协作 | 把本地缓存当正式发布 |
| `mvn deploy` | 发布远程仓库 | 制品可供团队使用 | Release 流水线 | 用高权限凭据跑 PR |
| `mvn clean` | 删除项目构建目录 | 重新干净构建 | 排除增量残留 | 每次都 clean 增加 CI 成本 |
| `mvn dependency:tree` | 查看解析后的依赖树 | 版本和路径 | 依赖冲突/RCA | 只看直接依赖 |
| `mvn dependency:analyze` | 检查使用与声明关系 | used undeclared 等 | 依赖治理 | 反射使用可能误报 |
| `mvn help:effective-pom` | 输出生效模型 | 看继承和默认值 | 配置漂移对比 | 输出太长但不筛重点 |
| `mvn help:effective-settings` | 输出生效 settings | 看镜像/代理/Profile | CI 环境核对 | 共享前没脱敏 |
| `mvn help:active-profiles` | 看激活 Profile | 找隐式环境差异 | 本地和 CI 比对 | Profile 过度承载环境配置 |
| `mvn dependency:go-offline` | 预取项目依赖和插件 | 提高后续离线成功率 | 隔离网络构建准备 | 不保证所有动态运行路径已缓存 |
| `mvn -o verify` | 离线构建 | 不访问远程仓库 | 灾备验证 | 缺插件依赖直接失败 |
| `mvn -U verify` | 强制检查缺失 Release 与更新 SNAPSHOT | 刷新解析 | 修复已解决的临时解析失败 | 当成万能重试 |

### CI 常用参数

```powershell
.\mvnw.cmd -B -ntp --fail-at-end verify
```

- `-B` / `--batch-mode`：批处理模式，避免交互。
- `-ntp` / `--no-transfer-progress`：关闭下载进度条，减少 CI 日志噪声。
- `--fail-at-end`：尽可能构建不依赖失败模块的其他模块，最后整体失败，便于一次收集更多结果。

对快速反馈流水线，也可以保留默认 `--fail-fast`，首个失败就停止。两者没有绝对优劣，要根据构建成本和反馈需求选择。

### 多模块选择参数

```powershell
mvn -pl :alert-service -am verify
mvn -pl :common -amd test
mvn -rf :failed-module verify
```

| 参数 | 作用 | 风险 |
|---|---|---|
| `-pl` / `--projects` | 选择 Reactor 项目 | 漏掉必要模块 |
| `-am` / `--also-make` | 同时构建所选项目依赖的模块 | 扩大构建范围 |
| `-amd` / `--also-make-dependents` | 同时构建依赖所选项目的模块 | 大仓中范围可能很大 |
| `-rf` / `--resume-from` | 从指定失败模块继续 | 前面模块产物必须仍可用且一致 |

### 跳过测试的差别

```powershell
mvn verify -DskipTests
mvn verify -Dmaven.test.skip=true
```

常见语义是：

- `-DskipTests`：跳过测试执行，但通常仍编译测试代码。
- `-Dmaven.test.skip=true`：连测试编译也跳过。

具体插件版本和配置会影响行为。生产发布不应为了“变绿”长期跳过测试；如果是应急绕行，要记录原因、风险、审批、补测和回滚条件。

### 调试参数

```powershell
mvn -e verify
mvn -X validate
```

- `-e`：显示异常堆栈。
- `-X`：调试日志，信息量和敏感信息风险都更高。

先用普通日志定位层级，再局部使用 `-e`/`-X`。不要默认保存长期开放访问的调试日志。

## 一次 Maven 构建的内部请求与数据路径

面试时不要只说“读取 POM、下载依赖、打包”。更完整的主线是：

```text
Shell / CI Runner
  -> Maven CLI 解析命令行
  -> 读取安装级与用户级 settings
  -> 定位根项目和 pom.xml
  -> 构建 Effective Settings
  -> 构建 Effective POM
       -> Super POM
       -> parent
       -> profile
       -> BOM
       -> 属性插值
  -> 构建 Reactor
       -> 收集模块
       -> 建立模块依赖图
       -> 拓扑排序
  -> 解析项目依赖与插件
       -> 本地仓库
       -> mirror / proxy / remote repository
       -> POM / metadata / artifact / checksum
  -> 计算生命周期阶段和 goal 执行计划
  -> 逐项目执行插件
       -> resources
       -> compiler
       -> surefire
       -> jar
       -> 额外质量插件
  -> 输出 target、报告和制品
  -> 可选 install 到本地仓库
  -> 可选 deploy 到远程仓库
  -> 返回退出码和 Reactor Summary
```

关键判断点：

1. **模型能否建立**：父 POM、BOM 和 Profile 是否可解析。
2. **图能否建立**：模块和依赖坐标是否完整，是否存在环。
3. **输入能否取得**：仓库、代理、TLS、认证、校验是否正常。
4. **计划能否执行**：插件版本和 Maven/JDK 是否兼容。
5. **质量能否通过**：编译、单测、集成测试、静态检查是否成功。
6. **制品能否可信发布**：版本是否允许、仓库是否可写、来源和哈希是否保留。

看到错误时，先判断它落在哪个判断点，再选择证据和修复。这样比“删除缓存、加 `-U`、重跑”更稳定。

## 状态、一致性与可复现性

Maven Core 本身不是长期运行的数据库服务，但构建仍然有状态：

| 状态 | 在哪里 | 是否权威 | 主要风险 |
|---|---|---:|---|
| 项目模型 | Git 中的 POM、`.mvn/` | 是 | 分支或 Profile 漂移 |
| 构建输出 | `target/` | 否，可再生 | 增量残留、误发布旧制品 |
| 本地仓库 | `.m2/repository` | 否，缓存和本地 install 混合 | 污染、损坏、并发争用 |
| 远程 Release 制品 | 企业制品库 | 应是权威 | 覆盖已发布版本、权限过大 |
| SNAPSHOT 元数据 | 远程和本地仓库 | 可变化 | 同坐标随时间变化 |
| 用户环境 | `settings.xml`、Toolchains、环境变量 | 运行时输入 | 不进 Git、难审计 |
| 构建日志和报告 | CI、日志平台 | 证据 | 保留不足或泄密 |

### Maven 没有自动生成通用依赖锁文件

和部分包管理器不同，Maven Core 的典型工作流不依赖一个自动生成的全图 lockfile。
如果使用版本范围、SNAPSHOT、未固定插件版本、可变化仓库或不同 JDK，即使 POM 没变，结果仍可能漂移。

降低漂移的组合拳：

- Wrapper 固定 Maven 版本与分发校验。
- Toolchains 或容器镜像固定 JDK 和操作系统基线。
- 显式固定插件版本。
- 父 POM/BOM 管理依赖版本。
- Release 不可覆盖，避免生产使用 SNAPSHOT 和动态版本范围。
- 企业镜像统一仓库入口。
- 记录依赖树、制品 SHA-256、构建镜像摘要和 Git SHA。
- 配置并实际验证可复现构建。

### 可复现构建

可复现构建的目标是：相同源码、构建环境和构建说明，能够生成字节级一致的指定制品。

Maven 官方建议先检查插件是否支持可复现模式，再设置：

```xml
<properties>
  <project.build.outputTimestamp>2026-07-30T00:00:00Z</project.build.outputTimestamp>
</properties>
```

验证思路：

```powershell
mvn clean install
mvn clean verify artifact:compare
```

需要理解三个边界：

- `outputTimestamp` 只解决兼容插件中的时间戳输入，不会消除所有环境差异。
- Windows 与 Unix 换行、文件权限、路径以及 JDK 大版本仍可能影响结果。
- 本机连续两次相同，只说明本机条件下较稳定，不等于第三方独立环境已经验证。

Maven 4 从较新的预发布阶段开始默认启用相关模式，但 Maven 4 尚未 GA；不要据此跳过 Maven 3 项目的显式治理。

## 生产架构：Maven 客户端没有集群，关键状态在外围

典型企业构建架构：

```text
Git Server
  -> CI Orchestrator
       -> Ephemeral Runner / Agent
            ├─ Maven Wrapper
            ├─ JDK Toolchain / Build Image
            ├─ Read-only settings for PR
            ├─ Local repository cache
            └─ Build workspace
                  -> Maven Repository Group
                       ├─ Proxy: Maven Central
                       ├─ Hosted: Internal Releases
                       └─ Hosted: Internal Snapshots
                  -> Test / Scan / SBOM
                  -> Artifact Staging
                  -> Release approval
                  -> Deployment system
  -> Metrics / Logs / Trace or change events
  -> AIOps analysis and alerting
```

### Maven 自己如何高可用

Maven 是每次启动、完成后退出的客户端进程，通常不谈“Maven 双机热备”。生产高可用重点在：

- Git 和 CI 控制面；
- Runner 容量；
- DNS、代理和出口网络；
- 企业制品库及其数据库、Blob 存储；
- 认证系统；
- 构建镜像与 Wrapper 分发源；
- 制品备份与恢复。

因此，“Maven HA 方案”如果只回答“多装几台 Maven”，没有触及真正的单点。

### PR 与发布流水线要分权

建议：

```text
PR / feature build
  -> 仓库只读
  -> 不允许 deploy Release
  -> 不拿生产密钥
  -> 执行 compile/test/verify/scan

protected branch / tag release
  -> 短期发布凭据
  -> 版本与签名门禁
  -> staging
  -> 审批或策略判定
  -> deploy
```

这能降低恶意或被攻陷的 PR 构建窃取发布 Token、投毒企业仓库的风险。

## 容量与性能

### 总耗时拆解

```text
T_total =
  T_queue
  + T_environment
  + T_model
  + T_download
  + T_compile
  + T_test
  + T_package
  + T_scan
  + T_upload
```

只盯 Maven 的 `Total time` 会遗漏 CI 排队和环境拉起；只盯测试又会遗漏仓库下载瓶颈。

建议采集：

- 队列等待时长；
- Runner 启动时长；
- Maven 总时长及各阶段时长；
- 缓存命中率与下载字节数；
- 依赖解析失败率；
- 测试数量、失败率、跳过数和 flaky test；
- 各模块耗时；
- CPU、内存、磁盘 I/O、网络吞吐；
- 制品大小与变化率；
- 企业私服响应时间、5xx、存储增长；
- Git SHA、Maven/JDK/镜像版本。

### 并行构建

Maven 可用 `-T` 设置并行度，例如：

```powershell
mvn -T 1C -B -ntp verify
mvn -T 4 -B -ntp verify
```

- `1C` 近似表示每个 CPU 核心一个线程。
- `4` 表示固定线程数。

不要把线程数直接开到最大。并行收益受这些因素限制：

- 模块依赖图中可并行的宽度；
- 编译和测试是 CPU 密集还是 I/O 密集；
- 插件 goal 是否 thread-safe；
- 测试是否使用固定端口、共享数据库或共享目录；
- 本地仓库与磁盘竞争；
- Runner 内存是否足够；
- 企业私服并发限制。

容量测试方法：

1. 固定同一 Git SHA、JDK、Maven、Runner 规格和缓存状态。
2. 分别跑 `-T 1`、`-T 2`、`-T 1C`。
3. 对比 P50/P95 总时长、CPU、峰值内存和失败率。
4. 检查测试结果和制品哈希，而不是只看速度。
5. 选择稳定吞吐而非单次最快值。

### 缓存设计

缓存 `.m2/repository` 可以加速，但要控制：

- 缓存键至少考虑操作系统、JDK/Maven 大版本和 POM/Wrapper 变化。
- 缓存只是加速层，缓存丢失后构建仍应能恢复。
- 不缓存 settings 凭据。
- 不让不可信 PR 写入其他分支共享的高信任缓存。
- 定期验证冷缓存构建。
- 不把 `target/` 跨提交盲目复用。

### Maven Daemon 与 Build Cache

截至本文基线，Apache Maven Daemon（`mvnd`）稳定版为 1.0.6，2.0.0-rc-3 仍是预览版。它通过复用 JVM 等方式降低多次构建的启动成本。Apache Maven Build Cache Extension 是 Maven 3.9.0+ 可选扩展，可以复用可识别的构建结果，并非 Maven 3 默认内置行为。它们都不是 Maven 基础正确性的前提。

引入前要做：

- 确认当前版本与 Maven/JDK/插件兼容；
- 定义缓存键、远程缓存信任和失效边界；
- 比较命中与未命中的制品和测试语义；
- 监控错误命中、缓存污染和磁盘占用；
- 保留一键关闭扩展、退回普通 `mvn` 的路径。

不要把“构建更快”建立在“跳过了本应执行的质量检查”上。

## 安全与软件供应链

### 威胁面

Maven 构建会执行插件和测试，也会下载可执行字节码。主要威胁包括：

- 仓库或 DNS 被劫持；
- 明文 HTTP 中间人攻击；
- 依赖混淆和恶意同名包；
- 上游依赖或插件被攻陷；
- 版本覆盖与快照漂移；
- CI 凭据泄露；
- 恶意测试或插件读取环境变量；
- 不可信 PR 污染共享缓存；
- 调试日志泄露 Token；
- 构建 Agent 权限过大。

### 基线控制

1. 统一走受控 HTTPS 企业镜像。
2. Release 仓库禁止覆盖，Snapshot 与 Release 分离。
3. 固定 Maven、插件、父 POM、BOM 和依赖版本。
4. 校验 Maven 分发包 SHA-256 与官方签名。
5. 使用短期、最小权限凭据；读写身份分离。
6. PR 不获得发布权限和生产 Secret。
7. 对依赖、插件、构建镜像进行漏洞和许可证扫描。
8. 生成并归档 SBOM，关联 Git SHA 与制品 SHA-256。
9. 让 Runner 临时化并限制网络、文件和云元数据访问。
10. 对发布进行审计、签名、来源证明和回滚演练。

SBOM 是 Software Bill of Materials，软件物料清单。Maven Core 不会仅凭 `mvn package` 自动交付完整供应链治理；通常需要合适的 SBOM 插件和外部扫描、签名、制品库策略共同完成。

### settings 密码加密的边界

Maven 支持对 settings 中的服务器密码做加密存储，但解密所需主密码仍存在运行环境中。它主要降低明文偶然暴露，不等于硬件级密钥保护。

更稳妥的 CI 方式是：

- Secret Manager 下发短期 Token；
- 任务开始时生成临时 settings；
- 任务结束后由临时 Runner 一起销毁；
- 日志遮罩并禁止 `set`/环境全量输出；
- 仓库端限制来源、权限、有效期和发布路径。

### 校验和与签名

下载 Maven 本体时，官方提供 SHA-512 与 `.asc` 签名。
依赖解析中的校验策略可以发现传输损坏或仓库内容不一致，但“校验值匹配仓库提供的值”不自动证明发布者可信。还要结合可信源、签名、来源证明和组织准入策略。

严格校验可用：

```powershell
.\mvnw.cmd -C -B -ntp verify
```

Checksum 主要回答“内容与期望摘要是否一致”；Signature 加可信公钥才进一步回答“是谁签了这份内容”；SBOM 回答“里面有哪些组件”；漏洞扫描回答“这些组件是否命中已知风险”。四者不能互相替代。

### 发布、Staging 与部分成功

多模块逐个 `deploy` 可能出现前几个模块已上传、后续模块失败。Maven Deploy Plugin 提供 `deployAtEnd`，用于把部署推迟到 Reactor 末尾；它能降低部分发布风险，但不能替代制品库的 Staging/Promotion。

Maven Release Plugin 的经典流程是：

```text
release:prepare
  -> 检查工作区和 Snapshot
  -> 修改版本、测试、提交、创建 Tag

release:perform
  -> 从 Tag 独立检出
  -> 构建并发布
```

`release:rollback` 依赖本地备份和 `release.properties`，而且不能覆盖撤回已经进入不可变远程仓库的 Release。已发布错误版本应标记风险并发布新版本；尚在 Staging 的候选制品可以丢弃。

## 升级、兼容与回滚

### Maven 3.8/3.9 升级检查

Maven 3.9 的重要兼容变化包括：

- Resolver 默认传输实现变化；
- 不再为旧插件隐式注入古老的 `plexus-utils`；
- 插件 API 使用会产生验证警告；
- `.mvn/maven.config` 参数解释方式更严格；
- 用户属性与系统属性处理发生清理。

升级步骤：

1. 盘点项目、父 POM、插件、扩展、JDK 和仓库。
2. 用 Wrapper 在分支中固定目标 Maven 3.9.16。
3. 先跑 `validate` 和 `help:effective-pom`。
4. 再跑全量 `clean verify`，检查插件验证警告。
5. 对比依赖树、测试报告、制品 SHA-256 和部署结果。
6. 让少量非关键流水线先试运行。
7. 扩大范围并保留旧 Wrapper 提交作为回滚点。

### Maven 4 迁移

Maven 4 尚未 GA，正确路径不是直接改全部 POM：

1. 先把项目在最新 Maven 3.9 上构建干净。
2. 升级插件到兼容的 Maven 3 版本。
3. 准备 Java 17+ 构建环境。
4. 用 Maven 4 RC 做独立兼容测试，先保持 POM model 4.0.0。
5. 修复重复插件声明、旧属性和生命周期绑定等问题。
6. 确认基础兼容后，才逐项评估 model 4.1.0 新能力。
7. 使用 `mvnup check` 做只读检查，再评审 `apply` 变更。

Maven 4 的代表性变化包括：

- 新的 POM model 4.1.0；
- build POM 与面向消费者的 consumer POM 分离；
- Maven 3 的 `<modules>` 在 4.1.0 模型中演进为 `<subprojects>`；
- 多项目版本表达改进；
- 新的 `bom` packaging；
- 新的 `all`、`each` 等生命周期阶段；
- install/deploy 等行为存在需要验证的变化。

`modelVersion 4.1.0` 不是使用 Maven 4 的第一步，也不是所有项目必须立即采用。Maven 4 可以继续构建经典 4.0.0 模型。

### 回滚设计

可回滚项：

- Wrapper 的 `distributionUrl` 和校验值；
- CI 构建镜像标签与摘要；
- 父 POM/插件版本提交；
- 企业镜像配置版本；
- Maven 4 专用分支或试验任务。

回滚前还要问：

- 新版本是否已经发布了不同内容的 Release？如果是，不能简单覆盖。
- 新构建是否执行了数据库或外部系统变更？Maven 回滚不等于业务回滚。
- 缓存是否混入新版本解析结果？可用隔离本地仓库验证。
- 旧 Maven 是否仍受支持、是否存在已知安全风险？

## AIOps 中 Maven 处在什么位置

```text
Git 变更
  -> Maven 构建
  -> 测试与质量门禁
  -> JAR/WAR/SBOM/报告
  -> 制品库
  -> 部署系统
  -> 运行时指标、日志、Trace、告警
  -> AIOps 关联变更与故障
  -> 根因假设、回滚或自动化 Runbook
```

Maven 提供的是“从源码到制品”阶段的重要事实：

- 哪个 Git SHA 触发；
- 使用哪个 Maven/JDK；
- 解析出哪些依赖；
- 哪些插件执行；
- 哪个模块失败；
- 测试是否通过；
- 生成什么制品与哈希；
- 发布到哪个仓库坐标。

把这些事实与部署和运行时信号关联，可以回答：

- 某次告警是否只发生在包含特定依赖版本的服务？
- 构建耗时突增是下载、编译、测试还是扫描导致？
- 一批项目同时失败是否共享同一私服、父 POM 或插件？
- `NoSuchMethodError` 是否和依赖仲裁变化有关？
- 制品体积异常是否和传递依赖增长有关？
- 哪个变更首次引入高危组件？

### 指标建议

| 指标 | 含义 | 告警或分析用途 |
|---|---|---|
| `build_duration_seconds` | 构建总时长 | 趋势和 P95 异常 |
| `build_stage_duration_seconds` | 阶段时长 | 定位慢在下载、测试还是扫描 |
| `build_result_total` | 成功/失败计数 | 失败率与爆发检测 |
| `dependency_resolution_failures_total` | 依赖/插件解析失败 | 私服、TLS、上游事件 |
| `test_failures_total` | 测试失败 | 代码回归和 flaky 分析 |
| `artifact_size_bytes` | 制品大小 | 意外依赖和打包异常 |
| `repository_request_duration_seconds` | 私服请求耗时 | 仓库容量与网络瓶颈 |
| `cache_hit_ratio` | 构建缓存命中率 | 性能优化与异常命中 |

不要把高基数的完整依赖坐标、Commit SHA 或错误堆栈直接放进时序指标标签。它们更适合日志、Trace/事件或可检索构建元数据。

### 日志最小字段

建议结构化保留：

```text
pipeline_id
job_id
repository
branch_or_tag
git_sha
maven_version
java_version
build_image_digest
reactor_project
phase
plugin
goal
result
duration_ms
artifact_coordinate
artifact_sha256
error_category
```

对仓库 URL、用户名、Token、代理凭据和环境变量做脱敏。

### 自动化 Runbook 边界

可以自动执行的低风险动作：

- 重新采集 `mvn -version`、Effective POM 和依赖树；
- 用隔离本地仓库复现；
- 检查企业私服健康、DNS、TLS 证书有效期；
- 对瞬时网络错误做有上限、带退避的重试；
- 汇总受影响项目与共同父 POM。

不应无条件自动执行：

- 删除整个共享 `.m2`；
- 绕过 TLS 或校验；
- 把 HTTP 仓库加入白名单；
- 覆盖 Release 制品；
- 将失败测试永久跳过；
- 自动升级依赖并直接发布生产。

## 安装与启动

### 前置条件

先确认 JDK：

```powershell
java -version
$env:JAVA_HOME
```

Maven 3.9.16 运行需要 JDK 8+，但项目本身常要求 JDK 17 或 21。生产应按项目和插件兼容矩阵选择仍受支持的 JDK。

### Windows 手动安装固定版本

1. 从 [官方下载页](https://maven.apache.org/download.cgi) 获取 `apache-maven-3.9.16-bin.zip`。
2. 同时获取 SHA-512 文件和 `.asc` 签名。
3. 按 Apache 官方 KEYS 验证签名，并核对 SHA-512。
4. 解压到版本化目录，例如：

```text
C:\maven\apache-maven-3.9.16
```

5. 配置：

```powershell
$env:MAVEN_HOME = 'C:\maven\apache-maven-3.9.16'
$env:Path = "$env:MAVEN_HOME\bin;$env:Path"
mvn -version
```

上述只修改当前 PowerShell 会话。需要永久配置时，在 Windows“环境变量”界面设置并新开终端验证。

预期输出至少包含：

```text
Apache Maven 3.9.16
Maven home: ...
Java version: ...
Java home: ...
OS name: ...
```

### Linux 手动安装固定版本

```bash
tar xzvf apache-maven-3.9.16-bin.tar.gz
export MAVEN_HOME=/opt/apache-maven-3.9.16
export PATH="$MAVEN_HOME/bin:$PATH"
mvn -version
```

APT、DNF、Homebrew、Chocolatey 和 Scoop 也可安装 Maven，但发行版仓库版本可能滞后或后续自动变化。需要可复现 CI 时，优先用 Wrapper 或固定构建镜像。

### 安装失败先查什么

1. `mvn` 找不到：检查新终端的 `PATH`。
2. `JAVA_HOME` 无效：指向 JDK 根目录，不是 `bin/java.exe`。
3. 显示旧 Maven：执行 `Get-Command mvn -All` 或 `which -a mvn` 查路径优先级。
4. 显示错误 JDK：以 `mvn -version` 中 `Java home` 为准。
5. 下载包损坏：重新从官方镜像下载并核对哈希和签名。
6. Maven 4 启动失败：确认是 Java 17+，并再次确认是否误用了预发布版。

## 入门实验：从零生成、测试和解释一个 Maven 项目

### 实验目标

你会得到：

- 一个标准 Maven Java 项目；
- 一次通过的单元测试；
- 一个 JAR；
- 一份 Effective POM；
- 一份依赖树；
- 可以提交 GitHub 的构建证据。

### 前置条件

- `java -version` 正常。
- `mvn -version` 正常。
- 首次执行可以访问 Maven Central 或企业镜像。
- 在专门实验目录中运行，不要覆盖已有项目。

### 第 1 步：建立实验目录

PowerShell：

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\maven-lab"
Set-Location "$env:USERPROFILE\maven-lab"
```

如果目录已存在，不要直接覆盖；换一个新目录名，或先确认里面是否是你自己的可丢弃实验。

### 第 2 步：用官方 Quickstart Archetype 生成项目

```powershell
mvn -B -ntp archetype:generate `
  -DgroupId=dev.aiops.demo `
  -DartifactId=hello-maven `
  -DarchetypeArtifactId=maven-archetype-quickstart `
  -DarchetypeVersion=1.5 `
  -DinteractiveMode=false
```

Archetype 是项目骨架模板。
预期末尾：

```text
BUILD SUCCESS
Project created from Archetype in dir: ...\hello-maven
```

进入项目：

```powershell
Set-Location .\hello-maven
```

### 第 3 步：固定 Maven Wrapper

```powershell
mvn wrapper:wrapper -Dmaven=3.9.16
.\mvnw.cmd -version
```

把生成的 `mvnw`、`mvnw.cmd` 和 `.mvn/wrapper/` 纳入 Git。
检查 `.mvn/wrapper/maven-wrapper.properties` 中的版本、URL和校验配置。

### 第 4 步：完成干净验证

```powershell
.\mvnw.cmd -B -ntp clean verify
```

预期看到：

```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

验证 JAR：

```powershell
Get-Item .\target\hello-maven-1.0-SNAPSHOT.jar
jar tf .\target\hello-maven-1.0-SNAPSHOT.jar
```

`jar tf` 应列出 `META-INF/` 和编译后的 `App.class`。这个 Quickstart JAR 通常不是包含所有依赖的可执行 Fat JAR，不要用“双击是否运行”判断构建是否成功。

### 第 5 步：导出生效模型和依赖树

```powershell
.\mvnw.cmd -q help:effective-pom -Doutput=target/effective-pom.xml
.\mvnw.cmd -q dependency:tree -DoutputFile=target/dependency-tree.txt
Get-Content .\target\dependency-tree.txt
```

依赖树应包含 JUnit 5 测试依赖。
再比较原始 POM 与 Effective POM，找出：

- 哪些插件版本来自 POM；
- 哪些值来自父 POM或 Super POM；
- 测试依赖如何传递；
- Java 编译版本如何设置。

### 第 6 步：验证离线边界

在前面构建成功、所需插件和依赖已缓存后：

```powershell
.\mvnw.cmd -o -B -ntp clean verify
```

预期仍然 `BUILD SUCCESS`。
如果失败，记录缺少的是项目依赖、插件还是插件依赖。不要为了通过实验复制未知来源的 `.m2`。

### 如果没成功，先检查这些

| 现象 | 首要检查 |
|---|---|
| Archetype 解析失败 | 网络、镜像、TLS、代理、坐标版本 |
| `mvnw.cmd` 不存在 | Wrapper 步骤是否成功，当前目录是否正确 |
| 编译报 release 不支持 | `mvn -version` 的实际 JDK |
| 测试插件下载失败 | 企业私服/Central 连通、TLS、临时网络 |
| `BUILD SUCCESS` 但找不到 JAR | packaging、项目目录、`target` 文件名 |
| 离线失败 | 错误中缺少的插件或依赖是否从未下载 |

一次 `Remote host terminated the handshake` 可能是瞬时网络或 TLS 链路故障，不等于业务测试失败。先保留完整错误，再检查网络和仓库健康；有证据表明是瞬时错误时，可以有限重试：

```powershell
.\mvnw.cmd -U -B -ntp clean verify
```

`-U` 不会修复错误的证书、镜像 URL 或凭据。

### 清理

只清理当前项目生成目录：

```powershell
.\mvnw.cmd clean
```

不要把“实验清理”写成删除整个用户 `.m2/repository`。如果要移除整个实验目录，先退出目录、确认绝对路径确实是你刚创建的实验目录，再用系统回收站或精确删除。

### GitHub 学习证据

建议提交：

```text
hello-maven/
├─ pom.xml
├─ mvnw
├─ mvnw.cmd
├─ .mvn/wrapper/
├─ src/main/java/
├─ src/test/java/
└─ evidence/
   ├─ mvn-version.txt
   ├─ dependency-tree.txt
   ├─ effective-pom-notes.md
   ├─ build-success.md
   └─ artifact-sha256.txt
```

不要提交：

- `target/`；
- `.m2/repository`；
- 含 Token 的 `settings.xml`；
- 未脱敏的 `effective-settings.xml`；
- 只截最后一行而看不到命令和环境的“成功截图”。

## 故障注入实验：错误镜像如何让 BOM 解析失败

这个实验模拟企业私服地址错误。它不会修改用户全局 settings，也不会停止真实仓库。

### 实验目标

理解这条因果链：

```text
mirrorOf=* 指向不可达地址
  -> BOM POM 无法下载
  -> BOM 管理的依赖版本无法建立
  -> Maven 在模型构建阶段失败
  -> 恢复正确 settings 后 validate 成功
```

### 前置条件

- 使用上一个 `hello-maven` 项目。
- 项目 POM 中通过 `dependencyManagement` 使用了 JUnit BOM；Quickstart 1.5 默认包含类似结构。
- 只使用项目内临时 settings 和临时本地仓库。

### 第 1 步：创建故障 settings

在项目根目录新建 `settings-broken.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0">
  <mirrors>
    <mirror>
      <id>fault-mirror</id>
      <name>Deliberately unreachable mirror</name>
      <url>http://127.0.0.1:9/repository/</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>
</settings>
```

`127.0.0.1:9` 在这个实验中故意作为不可达仓库。不要把它写进用户全局 settings。

### 第 2 步：用隔离本地仓库触发故障

```powershell
.\mvnw.cmd -B -ntp `
  -s .\settings-broken.xml `
  -Dmaven.repo.local=.m2-fault `
  validate
```

预期失败，并出现接近以下信息：

```text
Non-resolvable import POM
Could not transfer artifact org.junit:junit-bom:pom:...
from/to fault-mirror
Connection refused
```

为什么后面可能还出现“dependency version is missing”？

因为 JUnit BOM 没有解析成功，原本由 BOM 提供的依赖版本无法进入 Effective POM。这是上游模型输入失败的连锁结果，不应先去给每个 JUnit 依赖手工补版本掩盖根因。

### 第 3 步：收集证据

记录：

- 完整命令；
- 退出码；
- 原始仓库 ID 与最终镜像 ID；
- 失败 URL；
- 首个 `Non-resolvable` 错误；
- 后续连锁错误；
- 当前 `mvn -version`；
- 故障开始和恢复时间。

需要更多细节时：

```powershell
.\mvnw.cmd -X `
  -s .\settings-broken.xml `
  -Dmaven.repo.local=.m2-fault `
  validate
```

日志提交前脱敏。

### 第 4 步：恢复

去掉故障 settings，仍使用另一个隔离仓库：

```powershell
.\mvnw.cmd -B -ntp `
  -Dmaven.repo.local=.m2-recovered `
  validate
```

预期：

```text
BUILD SUCCESS
```

这证明代码和 POM 在正确仓库路径下可以建立模型，故障点是镜像配置或仓库可达性。

### 第 5 步：验证修复不是偶然

```powershell
.\mvnw.cmd -B -ntp `
  -Dmaven.repo.local=.m2-recovered `
  clean verify
```

再检查测试、JAR 和依赖树。仅 `validate` 成功只证明模型能建立，不证明完整构建已经恢复。

### 清理

先确认当前目录是实验项目，然后：

```powershell
Remove-Item -LiteralPath .\settings-broken.xml
Remove-Item -LiteralPath .\.m2-fault -Recurse
Remove-Item -LiteralPath .\.m2-recovered -Recurse
```

这些目标都是本实验在项目目录内创建的精确路径。执行前仍应先用 `Resolve-Path` 或 `Get-Item` 验证；不要把路径替换成用户的 `.m2` 根目录。

### 如果实验没有按预期失败

- 可能当前 Reactor 或本地仓库已满足模型解析，确认使用了新的 `.m2-fault`。
- 可能命令没有加载 `settings-broken.xml`，检查 `-s` 路径。
- 可能 9 端口恰好有服务，换一个确认未监听的本机端口。
- 可能 POM 不使用外部父 POM/BOM，改用 `dependency:get` 请求一个明确坐标。
- 不要改真实企业私服或全局 settings 来制造故障。

## 常见故障排查字典

### 1. `Non-resolvable parent POM`

可能原因：

- 父坐标或版本写错；
- `relativePath` 指向错误；
- 父 POM 没发布；
- 仓库镜像/认证/TLS 失败；
- 父 POM只存在于某人本地 `mvn install`。

证据顺序：

```powershell
mvn -version
mvn -e validate
mvn help:effective-settings
```

修复应让父 POM进入受控制品库或正确 Reactor，不是复制某人的缓存。

### 2. `Non-resolvable import POM`

先查 BOM 坐标、仓库和镜像。
如果随后出现大量“dependency version is missing”，先修复 BOM 解析，不要逐个补版本。

### 3. 401 / 403

- 401：常见为未认证、凭据错误或过期。
- 403：常见为已识别身份但无权限，也可能是仓库路径策略拒绝。

检查：

- `server.id` 是否和目标仓库 ID 一致；
- Token 是否只读/可写；
- settings 是否真的被当前任务加载；
- 是否向 Release 仓库发布了 Snapshot，或反之；
- 仓库端审计日志。

不要把 Token 直接打印出来验证。

### 4. PKIX、TLS handshake、证书错误

分层检查：

1. DNS 是否解析到预期地址。
2. 代理是否做 TLS 终止。
3. 服务器证书链是否完整、是否过期、主机名是否匹配。
4. `mvn -version` 的 Java truststore 是否信任企业 CA。
5. 同一 Agent 上浏览器可访问不代表 Java truststore 可用。

不要用关闭证书校验当永久修复。

### 5. `maven-default-http-blocker`

说明外部 HTTP 仓库被默认安全策略阻断。
正确修复通常是：

- 把仓库升级为 HTTPS；
- 在企业私服中代理旧仓库；
- 修复依赖 POM 中陈旧仓库声明。

不是把 blocker 全局禁用。

### 6. 下载失败被缓存

常见日志会提示上次失败已缓存，要等更新间隔或强制更新。

处理：

```powershell
mvn -U -B -ntp validate
```

如果仍失败，查真实网络、仓库和认证。
只有证据指向单个本地坐标状态损坏时，才隔离那个精确目录，或者用新的 `-Dmaven.repo.local` 复现。

### 7. `NoSuchMethodError`

这是运行时二进制兼容问题的强信号。

检查：

```powershell
mvn dependency:tree -Dverbose
mvn dependency:tree -Dincludes=疑似坐标
```

再确认最终打包内容和运行时实际加载类来源。
修复可能是统一版本、升级调用方、排除错误路径，或选择兼容 BOM；必须跑回归测试。

### 8. `ClassNotFoundException` / `NoClassDefFoundError`

区别简化理解：

- `ClassNotFoundException` 常见于代码显式尝试加载类但类路径没有。
- `NoClassDefFoundError` 常见于 JVM 在链接/初始化已编译引用时找不到或无法初始化类。

检查 scope、Fat JAR/WAR 打包方式、容器提供依赖和运行命令，不要只把缺失 JAR手工塞进服务器目录。

### 9. 测试失败与测试插件解析失败

```text
Tests run: 10, Failures: 1
```

说明测试已运行，有断言失败。

```text
Plugin ... surefire ... could not be resolved
```

说明测试执行器还没准备好，属于插件依赖解析问题。两者责任层完全不同。

### 10. `Unsupported class file major version`

收集：

```powershell
mvn -version
java -version
javap -verbose path\to\Class.class
```

判断：

- Maven/插件是否不支持当前 JDK；
- 运行 JDK 是否低于编译 JDK；
- Toolchains 是否选择了错误 JDK；
- 某个依赖是否用更高 Java 版本编译。

### 11. 编码只在 CI 失败

固定：

```xml
<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
```

同时检查测试数据、资源过滤、操作系统换行和默认 Locale。
不要只在 CI 命令上临时加编码参数而不修项目模型。

### 12. 多模块单独构建失败

可能模块依赖另一个 Reactor 模块，但该模块没有发布或安装。

尝试：

```powershell
mvn -pl :target-module -am verify
```

如果单模块必须能独立构建，则其依赖版本应能从受控远程仓库解析，或重新设计仓库/模块边界。

### 13. 并行后出现随机测试失败

先退回：

```powershell
mvn -T 1 verify
```

如果串行稳定，检查：

- 测试固定端口；
- 共享数据库和表；
- 共享临时目录；
- 静态单例状态；
- 插件 thread-safe 标记；
- Runner 内存和文件句柄。

修复共享状态，而不是默认永远关闭所有并行。

### 14. OOM 或进程被系统杀死

区分：

- Maven JVM OOM；
- 测试 fork JVM OOM；
- 容器/Agent 触发内存限制；
- 并行模块叠加峰值；
- 编译器或扫描器内存。

`.mvn/jvm.config` 影响 Maven JVM；Surefire/Failsafe 的 `argLine` 等影响测试 JVM。不要把参数加错进程。

### 15. Release 发布失败

先确认：

- 版本是不是已存在且禁止覆盖；
- `distributionManagement` 仓库 ID；
- settings 的 `server.id`；
- 发布身份权限；
- staging 规则；
- 签名、校验和与网络。

已发布 Release 不应通过“允许覆盖”修复。应该发布新版本，并调查为什么流水线试图复用旧版本号。

## 故障排查总流程

```text
1. 定位失败层
   环境 / 模型 / 仓库 / 插件 / 编译 / 测试 / 打包 / 发布
2. 固定复现输入
   Git SHA / Maven / JDK / settings / 命令 / Runner
3. 找首个根因错误
   不被后续连锁错误带偏
4. 收集最小证据
   -version / effective model / dependency tree / repository health
5. 建立 2~3 个假设
6. 用隔离仓库或最小命令逐个证伪
7. 选择最小安全修复
8. 运行完整 verify 与必要发布验证
9. 评估影响面和回滚
10. 沉淀 Runbook、指标和复盘
```

## 生产事故题：所有 Java 流水线突然无法构建

### 现象

10:05 开始，多个无代码关联的仓库同时失败：

```text
Could not transfer artifact ...
from/to company-public
Read timed out
```

本地已缓存依赖的开发者有时仍能通过，新的临时 Runner 全部失败。

### 第一步：止损

- 暂停非必要发布，避免重试风暴压垮私服。
- 不宣布是 Central 故障，也不立刻切换未知公共镜像。
- 保留首批失败任务、私服和网络指标。
- 识别是否有正在进行的高风险生产发布，准备受控回滚或延期。

### 证据

收集：

- 首次失败时间和受影响流水线数量；
- 失败是否集中在同一镜像 ID；
- 热缓存与冷缓存差异；
- 私服健康、线程池、数据库连接、Blob 存储、磁盘和 5xx；
- DNS、TLS、代理与出口网络；
- 最近 settings、证书、网络、私服版本变更；
- Central 直连只读探测结果，但不让所有 Runner 绕过私服；
- 受影响坐标是否集中于新依赖。

### 假设与验证

| 假设 | 支持证据 | 反证方式 |
|---|---|---|
| 私服容量耗尽 | 延迟、5xx、线程/连接池饱和 | 私服内部健康和资源正常 |
| 私服 Blob/数据库故障 | 读取超时、存储错误 | 本地资源正常、只在出口失败 |
| DNS/TLS/代理变更 | 握手或解析错误集中出现 | 私服本机也无法读取本地制品 |
| Central 上游故障 | 只代理缓存未命中失败 | 内部 Hosted 制品也失败 |
| 新 settings 错误 | 同一配置发布后集中爆发 | 旧配置 Runner 也失败 |

### 修复选择

按证据可能采取：

- 回滚最近的 settings/证书/私服配置；
- 扩容或恢复制品库依赖的数据库、存储；
- 暂时限流非关键冷构建；
- 只对已验证 Release 使用受控只读灾备仓库；
- 对网络瞬时失败采用退避重试，设置上限和熔断。

### 影响面

检查：

- 哪些项目无法构建；
- 已经开始的发布是否使用了不完整制品；
- 是否有人绕过私服从未知源下载；
- 是否存在失败缓存和损坏制品；
- 快照元数据是否出现不一致；
- 发布凭据和审计是否受影响。

### 回滚与恢复验证

恢复后不要只看私服首页变绿：

1. 用冷的隔离本地仓库运行代表项目 `validate`。
2. 运行 `clean verify`。
3. 对内部 Hosted Release 做只读解析。
4. 用专门测试坐标验证受控发布，不覆盖正式制品。
5. 核对制品哈希、测试报告和依赖树。
6. 逐步恢复并发，观察 P95 延迟和错误率。

### 复盘

- 为什么私服故障能影响全部流水线？
- 是否有经过演练的只读灾备？
- 重试是否形成放大效应？
- 仓库健康是否只看进程存活？
- 是否能从构建日志快速聚类出共同 mirror？
- Release 是否可由哈希和来源证明独立验证？

## 生产设计题：为 300 个 Java 仓库设计统一构建平台

### 需求

- 300 个 Java 仓库，JDK 17 与 21 并存。
- 每天数千次 PR 构建。
- 发布必须可追溯、不可覆盖。
- 依赖下载需经过企业治理。
- 单个项目不能拖垮全部构建。
- 需要支持安全扫描、SBOM、灰度升级和灾备。

### 设计

```text
Git Webhook
  -> CI Scheduler
       -> Runner Pool by trust and JDK
            -> Project Maven Wrapper
            -> Immutable build image digest
            -> Job-scoped settings and credentials
            -> Dependency cache
            -> Maven Repository Group
                 -> Central proxy with allow/deny policy
                 -> Internal releases
                 -> Internal snapshots
            -> verify / tests / quality / SBOM / scan
            -> artifact staging
            -> protected release identity
            -> immutable release repository
  -> Build metadata store
  -> Metrics + logs + change events
  -> AIOps correlation / anomaly detection / RCA
```

### 关键取舍

**父 POM 与模板**

- 企业父 POM管理插件和基础门禁。
- Pipeline 模板管理流程。
- Wrapper 留在项目，避免平台静默替换 Maven。
- 父 POM分批升级，保留兼容窗口。

**缓存**

- 按信任域隔离 PR 与发布缓存。
- 冷构建作为持续演练。
- 缓存失败不影响正确性。

**仓库**

- Central 统一代理；
- Release 不可覆盖；
- Snapshot 独立保留策略；
- 只读与发布 Token 分离；
- 数据库、Blob、备份和恢复按制品库产品设计 HA。

**容量**

- 按队列和资源类型弹性扩缩 Runner；
- CPU 密集编译与 I/O 密集下载分别观测；
- 私服按请求率、缓存命中、下载带宽、制品增长和元数据压力估算。

**安全**

- 不可信 PR 无发布 Secret；
- Runner 临时化；
- 构建网络最小化；
- Wrapper 分发校验；
- SBOM、漏洞、许可证、签名和来源证明形成发布证据。

**升级**

- Maven/JDK/父 POM都有 Canary 项目；
- 先报告兼容性，再小流量启用；
- 对比依赖树、测试与制品；
- Wrapper、镜像和模板均能独立回滚。

### 面试追问

**为什么不让所有项目直接访问 Central？**
因为需要统一缓存、可用性、审计、准入、恶意组件阻断和依赖来源治理。但企业私服也会成为关键基础设施，必须设计容量、HA、备份和灾备。

**为什么不强制所有项目同一天升级 Maven 4？**
Maven 4 尚未 GA，且项目插件、扩展、JDK 与模型复杂度不同。应建立兼容矩阵和灰度验证，不应一次性扩大影响面。

**怎样证明发布制品来自某次代码？**
关联 Git SHA、流水线身份、构建镜像摘要、Maven/JDK、依赖清单、测试/扫描结果、制品 SHA-256、签名与仓库审计；更高要求下加入可验证来源证明和独立重建。

## Maven 与其他工具怎么选

| 工具 | 优势 | 代价 | 更合适的场景 |
|---|---|---|---|
| Maven | Java 生态成熟、约定清晰、POM 和仓库标准广泛 | XML 冗长、灵活定制不如脚本自然 | 大多数标准 Java/JVM 项目 |
| Gradle | DSL 灵活、增量与缓存能力强、Android 主流 | 构建逻辑可能过度复杂、版本升级学习成本 | 复杂定制、多语言/Android 构建 |
| Bazel | 大规模多语言、严格输入和远程缓存能力强 | 迁移和规则维护成本高 | 超大 Monorepo、多语言统一构建 |
| Ant | 任务式脚本直观、历史项目多 | 依赖与生命周期约定弱、维护成本高 | 遗留构建维护，不作为默认新选 |

选择标准：

- 团队已有生态和人才；
- 项目规模与语言数量；
- 是否需要强增量/远程缓存；
- 构建逻辑复杂度；
- 插件和依赖生态；
- 可维护性、可观测性和迁移成本。

不要为了“更先进”重写一个稳定构建，也不要因为“大家都用 Maven”忽略当前构建已经不可维护的事实。

## 面试怎么讲

### 30 秒回答

> Maven 是 Java 生态的项目模型、依赖管理和构建编排工具。它读取 POM 和 settings，形成 Effective POM 与依赖图，再把生命周期阶段映射到插件目标，完成编译、测试、打包、验证、安装和发布。生产上我会用 Wrapper 固定 Maven、Toolchains 固定 JDK、父 POM/BOM 固定插件和依赖，统一经过企业制品库，并采集构建阶段、依赖解析、测试和制品哈希。排障时先区分模型、仓库、插件、代码和发布层，避免一上来删除整个 `.m2`。

### 3 分钟回答

> Maven 的核心输入包括源码、POM、settings、Maven/JDK、插件与仓库。启动后先构建 Effective Settings 和 Effective POM，解析父 POM、Profile 与 BOM；多模块项目进入 Reactor，按模块依赖拓扑排序；Resolver 从 Reactor、本地仓库和镜像后的远程仓库解析项目依赖与插件；最后按 clean、default 或 site 生命周期，把阶段映射到插件 goal。
>
> 依赖冲突不是简单选最高版本，而是最近路径优先、同深度先声明优先，可以通过直接声明或 dependencyManagement 管理。BOM 负责一组依赖版本，父 POM还能统一插件和构建规则；聚合只是把模块放进同一 Reactor，和继承不是一回事。
>
> 生产上 Maven 本身是客户端，真正的关键状态在 Git、CI、企业制品库、构建镜像和凭据系统。我会用 Wrapper、Toolchains、固定插件版本、不可变 Release、受控镜像、最小权限发布身份、SBOM 与制品哈希降低漂移和供应链风险。性能上拆队列、下载、编译、测试、扫描和上传阶段，再验证 `-T`、缓存或 mvnd 的收益。事故中如果很多仓库同时解析失败，我会先找共同 mirror、私服、DNS/TLS 和最近变更，用冷的隔离本地仓库验证，而不是让全部任务绕过私服。

### 问题 1：Maven 生命周期、阶段、插件和 goal 的关系

**回答要点**

- 生命周期是阶段序列。
- 阶段是执行挂点，本身不做具体工作。
- 插件提供能力，goal 是具体动作。
- packaging 和 POM把 goal 绑定到阶段。
- 调后阶段会执行前面阶段。

**追问：`mvn package` 和 `mvn jar:jar` 一样吗？**
不一样。`package` 会执行之前生命周期阶段和相应绑定；`jar:jar` 只是直接调用 JAR Plugin 的一个 goal，可能没有先编译、测试，也可能绕过项目的其他验证。

### 问题 2：dependencyManagement 会自动引入依赖吗

**回答要点**

通常不会。它管理被使用依赖的默认版本、范围等。当前项目或子项目仍需在 `dependencies` 中声明使用。

**追问：BOM 为什么用 import scope？**
为了把另一个 POM 的 dependencyManagement 清单导入当前管理模型，而不是把 BOM 当普通运行时依赖。

### 问题 3：Maven 如何选择冲突版本

**回答要点**

- 最近定义优先；
- 同深度先声明路径优先；
- 直接声明和 dependencyManagement 可固定版本；
- 用 `dependency:tree -Dverbose` 观察。

**追问：为什么不能总选最高版本？**
最高版本不保证二进制、语义或框架兼容；Maven 的确定性规则也不是最高版本策略。版本升级需要 BOM、兼容矩阵和测试。

### 问题 4：父 POM 和聚合 POM 有什么区别

**回答要点**

- parent 是模型继承；
- modules 是构建聚合；
- 二者可以同时存在但不是同一关系；
- 聚合 Reactor 根据依赖拓扑排序。

**追问：子项目必须在父 POM 的 modules 中吗？**
不必须。它可以继承远程发布的父 POM，同时由另一个聚合器构建。

### 问题 5：`install` 和 `deploy` 的区别

**回答要点**

- `install` 写本地仓库；
- `deploy` 发布远程仓库；
- 本地 install 只对当前环境可见，不能作为团队发布证据；
- Release 发布要不可覆盖、最小权限、可审计。

**追问：为什么 CI PR 不应执行 deploy？**
不可信代码可能读取发布凭据或投毒仓库，而且 PR 版本和质量门禁尚未进入受保护发布条件。

### 问题 6：为什么删除 `.m2` 有时“有效”但不是好 Runbook

**回答要点**

- 新下载可绕过某个损坏或失败状态，所以看似恢复。
- 但会销毁证据、放大下载流量、掩盖私服/网络/校验根因。
- 共享缓存删除还会影响其他任务。
- 应精确到坐标，或用隔离本地仓库复现。

**追问：什么时候可以清理某个坐标目录？**
确认目标、记录哈希和来源、证明本地内容损坏或失败状态已失效，并验证远端权威制品正确时；最好先移到隔离位置而不是永久删除。

### 问题 7：怎样设计可复现 Maven 构建

**回答要点**

- 固定源码、Maven、JDK、插件、依赖和仓库输入；
- Release 不可变，避免范围和 SNAPSHOT；
- 配置 `outputTimestamp` 与兼容插件；
- 记录镜像摘要和制品哈希；
- 用独立环境重建比较。

**追问：两次 SHA-256 相同就证明供应链安全吗？**
不能。它说明两个文件相同，不证明输入可信、发布者身份、安全扫描或运行时配置正确。

### 问题 8：如何排查所有项目同时出现依赖解析失败

**回答要点**

- 找共同时间、mirror、父 POM、私服和网络；
- 比较热缓存与冷缓存；
- 查私服、DNS、TLS、代理、数据库和存储；
- 限制重试风暴；
- 用隔离仓库完成端到端恢复验证。

**追问：能否临时绕过私服直连 Central？**
只有在经过授权、风险评估、来源和哈希验证、网络策略允许并有明确时限时，才可能作为受控应急方案；不能让所有流水线自行改公共镜像。

### 问题 9：Maven 并行构建为什么会变得不稳定

**回答要点**

- 插件不 thread-safe；
- 测试共享端口、目录、数据库或静态状态；
- CPU/内存/磁盘超卖；
- Reactor 可并行宽度有限；
- 私服请求被放大。

**追问：怎样选 `-T`？**
用固定输入做多档压测，对比 P50/P95 时长、资源峰值、失败率和制品/测试一致性，选择稳定吞吐点。

### 问题 10：Maven 4 怎样迁移

**回答要点**

- Maven 4 当前仍是 RC；
- 先升级到最新 Maven 3.9 并清理插件兼容问题；
- 准备 Java 17+；
- 独立流水线验证经典 POM 4.0.0；
- 再逐项采用 4.1.0、consumer POM 等能力；
- 使用 `mvnup check`，所有变更可评审、可回滚。

**追问：是不是必须立即把 modelVersion 改成 4.1.0？**
不是。Maven 4 可继续构建 4.0.0 模型，4.1.0 是使用新模型能力时再采用的选择。

## 学习检查清单

### 入门层

- [ ] 能用一句话解释 Maven。
- [ ] 能识别 `groupId:artifactId:version`。
- [ ] 能解释 `pom.xml` 和 Effective POM 的区别。
- [ ] 能解释生命周期、阶段、插件和 goal。
- [ ] 能跑通 `clean verify`。
- [ ] 能找到测试报告和 JAR。
- [ ] 能导出依赖树。
- [ ] 能区分 Maven、Jenkins 和 Nexus。

### 实战层

- [ ] 能解释六种依赖范围。
- [ ] 能解释最近路径仲裁而不是“最高版本”。
- [ ] 能区分 parent、aggregation、BOM。
- [ ] 能使用 `-pl`、`-am` 和 `--fail-at-end`。
- [ ] 能配置镜像、代理和 server ID。
- [ ] 能用 Wrapper 和 Toolchains 固定环境。
- [ ] 能用隔离本地仓库复现问题。
- [ ] 能区分测试失败和测试插件解析失败。

### 生产与面试层

- [ ] 能画出模型、依赖、插件和制品的内部路径。
- [ ] 能说明本地仓库为何不是权威状态。
- [ ] 能设计企业制品库、缓存、凭据和发布分权。
- [ ] 能设计可复现构建与供应链证据。
- [ ] 能用数据选择并行度和缓存。
- [ ] 能设计 Maven 3.9 到 Maven 4 的灰度迁移与回滚。
- [ ] 能处理“全部流水线解析失败”事故。
- [ ] 能完成 300 个 Java 仓库的构建平台系统设计。

## 建议提交到 GitHub 的学习证据

至少保留：

- 一个可运行的 Maven 项目；
- `pom.xml` 字段说明；
- Wrapper 文件及 Maven 分发校验；
- `mvn -version` 环境记录；
- `dependency-tree.txt`；
- Effective POM 观察笔记；
- 正常构建日志摘要和 JAR SHA-256；
- 仓库故障注入记录；
- 假设、证据、修复、验证、影响面与回滚；
- 一张 Maven 构建与制品发布链路图；
- 一份面试问答复盘。

示例 README 证据：

```text
Git SHA:
Maven:
JDK:
OS / build image:
Command:
Tests:
Artifact coordinate:
Artifact SHA-256:
Dependency tree evidence:
Fault injected:
First root-cause error:
Repair:
Recovery verification:
Residual risk:
```

## 文章边界与下一步

本文覆盖 Maven 从零入门到生产和面试的主干，但没有展开：

- Java 语言、JVM 类加载和 GC；
- 每个 Maven 插件的完整参数；
- Nexus Repository 的产品级 HA 与备份恢复；
- Jenkins/GitHub Actions 的完整安全模型；
- Spring Boot 特有的重打包和依赖管理；
- SBOM、签名、SLSA 来源证明工具的完整落地；
- Bazel/Gradle 大规模迁移。

下一步建议：

1. 学 [Jenkins](./jenkins.md)，理解 CI 如何调度 Maven。
2. 学 [Nexus Repository](./nexus-repository.md)，理解制品代理、Hosted 与发布治理。
3. 学 [SonarQube](./sonarqube.md)，把代码质量门禁接入 `verify`。
4. 学 [CI/CD](./cicd.md)，把构建、发布、回滚和变更指标连起来。
5. 选择一个真实多模块项目，完成 Wrapper、Toolchains、BOM、Enforcer、SBOM、冷缓存构建和故障演练。

读完一篇 Maven 文章不能保证获得岗位。大厂平台、SRE、DevOps 和 AIOps 面试还会考察 Java/JVM、Linux、网络、容器、CI/CD、系统设计、编码能力、真实项目证据和沟通表达。本文的目标，是让 Maven 这一环不再停留在背命令。
