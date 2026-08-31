# TDSQL-C MySQL 语义实验

本地 MySQL 用于观察 InnoDB 事务和锁，不安装 TCE/TDSQL，也不模拟其分布式控制面、容灾、备份或代理。详见 [TDSQL-C MySQL 技术栈](../../docs/tech-stack/data-ai/tdsql-mysql.md)。

```powershell
docker run --name tdsql-learning-mysql -e MYSQL_ROOT_PASSWORD=lab-only-password -p 127.0.0.1:13306:3306 -d mysql:8.4
docker exec tdsql-learning-mysql mysqladmin ping -uroot -plab-only-password --wait=60
Get-Content examples/tdsql-mysql-lab/init.sql -Raw | docker exec -i tdsql-learning-mysql mysql -uroot -plab-only-password
docker exec tdsql-learning-mysql mysql -uroot -plab-only-password -e "SELECT VERSION(); SHOW ENGINE INNODB STATUS\G"
```

生产环境不要在命令行放密码；这是只绑定本机回环地址、使用一次性密码的教学容器。实验后删除容器及其临时数据：

```powershell
docker rm -f tdsql-learning-mysql
```

故障注入的双会话锁等待步骤在正文中，务必只对这个实验容器执行。
