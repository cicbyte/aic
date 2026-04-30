# 数据库初始化脚本

本目录包含 aic 项目的数据库初始化脚本。

## 目录结构

```
sql/
├── mysql/           # MySQL 数据库脚本
│   └── 01_categories.sql
├── sqlite/          # SQLite 数据库脚本
│   └── 01_categories.sql
└── README.md
```

## 使用方法

### MySQL

#### 1. 创建数据库
```sql
CREATE DATABASE IF NOT EXISTS aic DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aic;
```

#### 2. 执行初始化脚本
```bash
# 命令行方式
mysql -u root -p < resource/sql/mysql/01_categories.sql

# 或在 MySQL 客户端中
source /path/to/resource/sql/mysql/01_categories.sql
```

#### 3. 更新配置文件
修改 `manifest/config/config.yaml`：
```yaml
database:
  default:
    link: "mysql:root:password@tcp(127.0.0.1:3306)/aic"
```

修改 `hack/config.yaml`：
```yaml
gfcli:
  gen:
    dao:
      - link: "mysql:root:password@tcp(127.0.0.1:3306)/aic"
        descriptionTag: true
```

### SQLite

#### 1. 创建数据库文件
```bash
# 数据库文件会自动创建在项目根目录
touch aic.db
```

#### 2. 执行初始化脚本
```bash
sqlite3 aic.db < resource/sql/sqlite/01_categories.sql
```

#### 3. 更新配置文件
修改 `manifest/config/config.yaml`：
```yaml
database:
  default:
    link: "sqlite::@file(./aic.db)"
```

并在 `main.go` 中取消 SQLite 驱动的注释：
```go
// import _ "github.com/gogf/gf/contrib/drivers/sqlite/v2"
```

## 脚本命名规范

- 文件名格式：`<序号>_<模块名>.sql`
- 序号用于控制执行顺序（如 01, 02, 03...）
- 每个模块一个文件，便于维护

## 注意事项

1. **执行顺序**：按文件名序号顺序执行
2. **幂等性**：脚本使用 `IF NOT EXISTS`，支持重复执行
3. **字符集**：MySQL 使用 utf8mb4，支持 Emoji 等特殊字符
4. **触发器**：SQLite 使用触发器实现 `updated_at` 自动更新

## 数据库差异说明

| 特性 | MySQL | SQLite |
|------|-------|--------|
| 自增主键 | AUTO_INCREMENT | AUTOINCREMENT |
| 字符串类型 | VARCHAR(n) | TEXT |
| 引擎 | ENGINE=InnoDB | 无 |
| 字符集 | CHARSET=utf8mb4 | 无（UTF-8默认） |
| 注释 | COMMENT | 不支持 |
| 自动更新时间戳 | ON UPDATE CURRENT_TIMESTAMP | 需要触发器 |

## 添加新表

1. 在对应的数据库目录下创建新的 SQL 文件
2. 文件名使用下一个序号（如 02_users.sql）
3. 执行初始化脚本
4. 运行 `make dao` 生成 DAO 代码
