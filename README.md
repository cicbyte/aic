# aic

**aic** 是一个 Claude Skills 管理平台，用于管理、编辑和打包 Claude 技能（MCP - Model Context Protocol）。

## 功能特性

- 🗂️ **分类管理** - 对技能、项目、提示词进行分类组织
- 📦 **技能管理** - 创建、编辑、导入、导出 Claude Skills
- 💡 **提示词管理** - 管理和复用常用提示词
- 📁 **项目管理** - 按项目组织提示词
- 🌙 **主题切换** - 支持浅色/深色主题
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 技术栈

### 后端
- **框架**: GoFrame v2.10.0
- **数据库**: MySQL 5.7+ / SQLite
- **架构**: RESTful API

### 前端
- **框架**: React 19 + Vite 6
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **编辑器**: CodeMirror 6
- **UI组件**: Radix UI + Lucide Icons

## 快速开始

### 环境要求

- Go 1.23+
- Node.js 18+
- MySQL 5.7+ 或 SQLite

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/cicbyte/aic.git
cd aic

# 安装前端依赖
cd web && npm install && cd ..

# 配置数据库 (编辑 manifest/config/config.yaml)
# 初始化数据库
mysql -u root -p aic < resource/sql/mysql/init.sql
# 或 SQLite
sqlite3 data/aic.db < resource/sql/sqlite/init.sql

# 运行开发服务器
gf run
```

访问 http://localhost:8000 即可使用。

### 构建部署

```bash
# 使用 Python 构建脚本（推荐）
python build.py              # 构建二进制文件
python build.py docker       # 构建 Docker 镜像

# 或手动构建
cd web && npm run build && cd ..
gf build
```

### Docker 部署

详细的 Docker 部署说明请参阅 [manifest/docker/DOCKER.md](./manifest/docker/DOCKER.md)

```bash
# 快速启动
python build.py docker
docker run -d -p 8000:8000 -v ./data:/app/data aic:latest

# 或使用 docker-compose
cd manifest/docker && docker-compose up -d
```

## 项目结构

```
aic/
├── api/                    # API 接口定义
│   └── v1/                 # v1 版本接口
│       ├── categories/     # 分类接口
│       ├── skills/         # 技能接口
│       └── prompts/        # 提示词接口
├── internal/               # 内部实现
│   ├── controller/         # 控制器
│   ├── logic/              # 业务逻辑
│   ├── model/              # 数据模型
│   │   ├── do/             # 数据对象
│   │   └── entity/         # 实体
│   ├── service/            # 服务接口
│   └── router/             # 路由配置
├── library/                # 工具库
├── manifest/               # 配置文件
│   └── config/             # 运行配置
├── hack/                   # 构建配置
├── resource/               # 资源文件
│   ├── sql/                # 数据库脚本
│   │   ├── mysql/          # MySQL 脚本
│   │   └── sqlite/         # SQLite 脚本
│   └── public/             # 静态资源
├── web/                    # 前端项目
│   ├── components/         # React 组件
│   ├── services/           # API 服务
│   └── types/              # TypeScript 类型
├── build.py                # 构建脚本
└── README.md
```

## API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 分类 | `/api/v1/categories` | 分类 CRUD |
| 技能 | `/api/v1/skills` | 技能管理 |
| 提示词 | `/api/v1/prompts` | 提示词管理 |
| 项目 | `/api/v1/projects` | 项目管理 |
| 健康 | `/api/v1/health` | 健康检查 |

## 数据库表

| 表名 | 说明 |
|------|------|
| `categories` | 分类表 |
| `skills` | 技能表 |
| `skill_tags` | 技能标签表 |
| `skill_files` | 技能文件表 |
| `projects` | 项目表 |
| `prompts` | 提示词表 |
| `project_files` | 项目文件表 |

## 配置说明

### 后端配置 (manifest/config/config.yaml)

```yaml
server:
  address: ":8000"

database:
  default:
    type: "mysql"
    link: "mysql:用户:密码@tcp(主机:端口)/aic"
```

### 前端配置

前端构建输出到 `resource/public/`，由后端静态文件服务提供。

## 开发命令

```bash
# 后端开发
gf run                    # 运行开发服务器
gf build                  # 构建生产版本

# 前端开发
cd web
npm run dev               # 运行开发服务器
npm run build             # 构建生产版本

# 代码生成
gf gen dao                # 生成 DAO/DO/Entity
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。
