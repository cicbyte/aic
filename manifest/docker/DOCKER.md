# aic Docker 部署指南

本文档介绍如何使用 Docker 部署 aic 应用。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [构建镜像](#构建镜像)
- [运行容器](#运行容器)
- [Docker Compose 部署](#docker-compose-部署)
- [配置说明](#配置说明)
- [数据持久化](#数据持久化)
- [常见问题](#常见问题)

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+ (可选)
- 至少 512MB 可用内存

## 快速开始

```bash
# 克隆项目
git clone https://github.com/cicbyte/aic.git
cd aic

# 构建 Docker 镜像
python build.py docker

# 运行容器
docker run -d -p 8000:8000 --name aic aic:latest

# 访问应用
# http://localhost:8000
```

## 构建镜像

### 方式一：使用构建脚本（推荐）

```bash
# 自动构建前端和 Docker 镜像
python build.py docker
```

### 方式二：手动构建

```bash
# 1. 构建前端
cd web
npm install
npm run build
cd ..

# 2. 构建 Docker 镜像
docker build -t aic:latest -f manifest/docker/Dockerfile .
```

### 构建参数

```bash
# 指定平台架构
docker build --build-arg TARGETARCH=arm64 -t aic:latest -f manifest/docker/Dockerfile .

# 指定镜像标签
docker build -t aic:v1.0.0 -f manifest/docker/Dockerfile .
```

## 运行容器

### 基本运行

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  aic:latest
```

### 带数据持久化

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  aic:latest
```

### 带自定义配置

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/manifest/config:ro \
  aic:latest
```

### 连接外部 MySQL

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/manifest/config:ro \
  --network your-network \
  aic:latest
```

## Docker Compose 部署

### 目录结构

```
manifest/docker/
├── Dockerfile
├── docker-compose.yml      # 开发环境（从源码构建）
├── docker-compose.prod.yml # 生产环境（使用预构建镜像）
└── DOCKER.md
```

### 生产环境部署（推荐）

使用预构建的 `aic:latest` 镜像：

```bash
# 1. 创建部署目录
mkdir -p aic-deploy && cd aic-deploy

# 2. 创建必要的目录
mkdir -p data config init

# 3. 复制配置文件
cp /path/to/aic/manifest/config/config.yaml config/
cp /path/to/aic/resource/sql/mysql/init.sql init/

# 4. 复制 docker-compose.prod.yml
cp /path/to/aic/manifest/docker/docker-compose.prod.yml docker-compose.yml

# 5. 修改配置文件中的数据库连接
vim config/config.yaml
# 将数据库地址改为: aic-mysql:3306

# 6. 启动服务
docker-compose up -d
```

### 开发环境部署

从源码构建镜像：

```bash
# 进入 docker 目录
cd manifest/docker

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f aic

# 停止服务
docker-compose down
```

### docker-compose.yml 说明

```yaml
version: '3.8'

services:
  # aic 应用服务
  aic:
    build:
      context: ../..
      dockerfile: manifest/docker/Dockerfile
    image: aic:latest
    container_name: aic
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data                    # 数据持久化
      - ./config:/app/manifest/config:ro    # 配置文件（只读）
    environment:
      - TZ=Asia/Shanghai
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  # MySQL 数据库服务（可选）
  aic-mysql:
    image: mysql:8.0
    container_name: aic-mysql
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root123456
      MYSQL_DATABASE: aic
      TZ: Asia/Shanghai
    volumes:
      - mysql_data:/var/lib/mysql
      - ../../resource/sql/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

volumes:
  mysql_data:
```

### 仅启动应用服务

如果已有外部数据库，可以只启动应用服务：

```bash
# 创建配置目录
mkdir -p config data

# 复制配置文件
cp ../../manifest/config/config.yaml config/

# 编辑配置文件，连接外部数据库
vim config/config.yaml

# 启动应用
docker-compose up -d aic
```

## 配置说明

### 配置文件位置

容器内配置文件路径：`/app/manifest/config/config.yaml`

### 挂载配置文件

```bash
# 创建本地配置目录
mkdir -p config

# 复制默认配置
cp manifest/config/config.yaml config/

# 修改配置
vim config/config.yaml

# 运行时挂载
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/config:/app/manifest/config:ro \
  aic:latest
```

### 配置示例

```yaml
server:
  address: ":8000"

database:
  default:
    type: "mysql"
    link: "mysql:root:password@tcp(mysql-host:3306)/aic"

skill_storage:
  data_dir: "./data"
  skills_dir: "skills"
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TZ` | `Asia/Shanghai` | 时区设置 |

## 数据持久化

### 需要持久化的目录

| 容器路径 | 说明 |
|----------|------|
| `/app/data` | 技能文件存储目录 |
| `/app/manifest/config` | 配置文件目录 |

### 挂载示例

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/manifest/config:ro \
  aic:latest
```

### 备份数据

```bash
# 备份 data 目录
docker cp aic:/app/data ./backup/data_$(date +%Y%m%d)

# 备份配置
docker cp aic:/app/manifest/config ./backup/config_$(date +%Y%m%d)
```

## 常见问题

### 1. 容器无法启动

```bash
# 查看日志
docker logs aic

# 检查端口占用
netstat -tlnp | grep 8000

# 检查配置文件
docker exec aic cat /app/manifest/config/config.yaml
```

### 2. 数据库连接失败

```bash
# 检查网络连通性
docker exec aic ping mysql-host

# 检查数据库配置
docker exec aic cat /app/manifest/config/config.yaml
```

### 3. 权限问题

```bash
# 修复数据目录权限
docker exec aic chmod -R 755 /app/data
```

### 4. 健康检查失败

```bash
# 手动测试健康检查
docker exec aic wget -q -O- http://localhost:8000/api/v1/health
```

## 镜像信息

- **基础镜像**: `alpine:3.19`
- **构建镜像**: `golang:1.23-alpine`
- **暴露端口**: 8000
- **工作目录**: `/app`

## 版本更新

```bash
# 拉取最新代码
git pull

# 重新构建镜像
python build.py docker

# 停止旧容器
docker stop aic
docker rm aic

# 启动新容器
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/manifest/config:ro \
  aic:latest
```

## 生产环境建议

1. **使用外部数据库**：生产环境建议使用独立的 MySQL 服务
2. **配置反向代理**：使用 Nginx 作为反向代理，配置 SSL
3. **定期备份**：定期备份 `data` 目录和数据库
4. **监控告警**：配置健康检查和日志监控
5. **资源限制**：设置容器资源限制

```bash
docker run -d \
  --name aic \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/manifest/config:ro \
  --memory=512m \
  --cpus=1 \
  --restart=unless-stopped \
  aic:latest
```
