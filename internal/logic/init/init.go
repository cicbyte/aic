package init

import (
	"context"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gogf/gf/v2/os/gfile"
	g "github.com/gogf/gf/v2/frame/g"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	api "github.com/cicbyte/aic/api/v1/init"
	service "github.com/cicbyte/aic/internal/service"
)

const (
	initFlagPath        = "manifest/config/.initialized"
	initializingFlagPath = "manifest/config/.initializing"
	configPath          = "manifest/config/config.yaml"
)

func init() {
	service.RegisterInit(New())
}

func New() *sInit {
	return &sInit{}
}

type sInit struct{}

// Status 检查系统初始化状态
func (s *sInit) Status(ctx context.Context, req *api.InitStatusReq) (res *api.InitStatusRes, err error) {
	res = new(api.InitStatusRes)
	res.Initialized = gfile.Exists(initFlagPath)
	return
}

// TestConnection 测试数据库连接
func (s *sInit) TestConnection(ctx context.Context, req *api.InitTestReq) (res *api.InitTestRes, err error) {
	res = new(api.InitTestRes)

	// 构建 MySQL DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s", req.User, req.Password, req.Host, req.Port)

	// 尝试连接数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		res.Success = false
		res.Error = fmt.Sprintf("连接失败: %v", err)
		return
	}

	// 获取底层 sql.DB 以设置超时和关闭连接
	sqlDB, err := db.DB()
	if err != nil {
		res.Success = false
		res.Error = fmt.Sprintf("获取数据库连接失败: %v", err)
		return
	}
	defer sqlDB.Close()

	// 设置连接超时
	sqlDB.SetConnMaxLifetime(5 * time.Second)

	// 获取 MySQL 版本
	var version string
	err = db.Raw("SELECT VERSION()").Scan(&version).Error
	if err != nil {
		res.Success = false
		res.Error = fmt.Sprintf("获取版本失败: %v", err)
		return
	}

	// 连接成功
	res.Success = true
	// 提取版本号，如 "8.0.35-mysql"
	re := regexp.MustCompile(`^(\d+\.\d+\.\d+)`)
	matches := re.FindStringSubmatch(version)
	if len(matches) > 1 {
		res.Version = matches[1]
	} else {
		res.Version = "MySQL"
	}

	g.Log().Infof(ctx, "数据库连接测试成功: %s", res.Version)
	return
}

// Setup 执行初始化
func (s *sInit) Setup(ctx context.Context, req *api.InitSetupReq) (res *api.InitSetupRes, err error) {
	res = new(api.InitSetupRes)

	// 0. 验证数据库名称格式
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]+$`, req.Database)
	if !matched {
		res.Success = false
		res.Error = "数据库名称只能包含字母、数字和下划线"
		return
	}

	// 1. 检查是否已初始化
	if gfile.Exists(initFlagPath) {
		res.Success = false
		res.Error = "系统已完成初始化"
		return
	}

	// 2. 检查是否正在初始化
	if gfile.Exists(initializingFlagPath) {
		res.Success = false
		res.Error = "正在初始化中，请稍后重试"
		return
	}

	// 3. 创建初始化锁文件
	err = gfile.PutContents(initializingFlagPath, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		g.Log().Errorf(ctx, "创建初始化锁文件失败: %v", err)
		res.Success = false
		res.Error = "创建锁文件失败"
		return
	}
	// 确保函数退出时清理锁文件
	defer func() {
		if res.Success {
			// 成功时删除锁文件，创建完成标记
			gfile.Remove(initializingFlagPath)
			gfile.PutContents(initFlagPath, time.Now().Format("2006-01-02 15:04:05"))
		} else {
			// 失败时清理锁文件
			gfile.Remove(initializingFlagPath)
		}
	}()

	g.Log().Infof(ctx, "开始系统初始化...")

	// 4. 更新配置文件（GoFrame 格式：mysql:user:password@protocol(host:port)/dbname）
	dsn := fmt.Sprintf("mysql:%s:%s@tcp(%s:%d)/%s", req.User, req.Password, req.Host, req.Port, req.Database)
	err = s.writeConfig(dsn)
	if err != nil {
		g.Log().Errorf(ctx, "更新配置文件失败: %v", err)
		res.Success = false
		res.Error = fmt.Sprintf("更新配置失败: %v", err)
		return
	}

	// 5. 连接数据库并创建数据库
	connectDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=10s", req.User, req.Password, req.Host, req.Port)
	db, err := gorm.Open(mysql.Open(connectDSN), &gorm.Config{})
	if err != nil {
		g.Log().Errorf(ctx, "连接数据库失败: %v", err)
		res.Success = false
		res.Error = fmt.Sprintf("连接数据库失败: %v", err)
		return
	}
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// 6. 创建数据库
	err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", req.Database)).Error
	if err != nil {
		g.Log().Errorf(ctx, "创建数据库失败: %v", err)
		res.Success = false
		res.Error = fmt.Sprintf("创建数据库失败: %v", err)
		return
	}
	g.Log().Infof(ctx, "数据库创建成功: %s", req.Database)

	// 7. 重新连接到创建的数据库
	dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?timeout=10s", req.User, req.Password, req.Host, req.Port, req.Database)
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		g.Log().Errorf(ctx, "连接新数据库失败: %v", err)
		res.Success = false
		res.Error = fmt.Sprintf("连接新数据库失败: %v", err)
		return
	}
	newSqlDB, _ := db.DB()
	defer newSqlDB.Close()

	// 8. 执行初始化 SQL（如果存在）
	initSQLPath := "resource/sql/mysql/init.sql"
	if gfile.Exists(initSQLPath) {
		sqlContent := gfile.GetContents(initSQLPath)
		g.Log().Infof(ctx, "准备执行初始化 SQL，文件大小: %d 字节", len(sqlContent))

		// 分割 SQL 语句并逐个执行
		statements := splitSQL(sqlContent)
		successCount := 0
		for _, stmt := range statements {
			if stmt == "" {
				continue
			}
			err = db.Exec(stmt).Error
			if err != nil {
				g.Log().Warningf(ctx, "SQL 执行失败: %v, SQL: %s", err, stmt[:min(100, len(stmt))])
			} else {
				successCount++
			}
		}
		g.Log().Infof(ctx, "执行初始化 SQL 完成，成功执行 %d 条语句", successCount)
	}

	g.Log().Infof(ctx, "系统初始化完成")

	res.Success = true
	return
}

// writeConfig 动态更新配置文件中的数据库连接字符串
func (s *sInit) writeConfig(link string) error {
	// 读取配置文件
	content, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 使用正则替换数据库连接字符串
	// 匹配 database.default.link 的值
	pattern := `(database:\s*\n\s*default:\s*\n\s*link:\s*)"[^"]*"`
	re := regexp.MustCompile(pattern)

	result := re.ReplaceAllString(string(content), "${1}\""+link+"\"")

	// 写回配置文件
	if err := os.WriteFile(configPath, []byte(result), 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %v", err)
	}

	return nil
}

// splitSQL 分割 SQL 语句
func splitSQL(sql string) []string {
	// 移除 SQL 注释
	lines := strings.Split(sql, "\n")
	var cleanedLines []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "--") && trimmed != "" {
			cleanedLines = append(cleanedLines, line)
		}
	}
	cleanedSQL := strings.Join(cleanedLines, "\n")

	// 按分号分割
	var statements []string
	var currentStmt strings.Builder
	inDelimiter := false
	delimiter := ";"

	for _, line := range strings.Split(cleanedSQL, "\n") {
		trimmed := strings.TrimSpace(line)
		lower := strings.ToLower(trimmed)

		// 检查 DELIMITER 命令
		if strings.HasPrefix(lower, "delimiter ") {
			newDelimiter := strings.TrimSpace(trimmed[10:])
			if newDelimiter != "" {
				delimiter = newDelimiter
				inDelimiter = true
			}
			continue
		}

		currentStmt.WriteString(line)
		currentStmt.WriteString("\n")

		if strings.HasSuffix(trimmed, delimiter) && !inDelimiter {
			stmt := strings.TrimSpace(currentStmt.String())
			stmt = strings.TrimSuffix(stmt, delimiter)
			if stmt != "" {
				statements = append(statements, stmt)
			}
			currentStmt.Reset()
			inDelimiter = false
			delimiter = ";"
		}
	}

	// 添加最后一条语句
	if currentStmt.Len() > 0 {
		stmt := strings.TrimSpace(currentStmt.String())
		if stmt != "" {
			statements = append(statements, stmt)
		}
	}

	return statements
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
