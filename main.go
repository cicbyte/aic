package main

import (
	"fmt"
	"log"

	_ "github.com/cicbyte/aic/internal/packed"
	//重要 需要导入数据库驱动
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	// SQLite数据库驱动,如果需要支持需要go get -u github.com/gogf/gf/contrib/drivers/sqlite/v2
	//_ "github.com/gogf/gf/contrib/drivers/sqlite/v2"

	"github.com/cicbyte/aic/internal/cmd"
	"github.com/cicbyte/aic/internal/middleware"
	"github.com/cicbyte/aic/internal/service"
	"github.com/gogf/gf/v2/os/gctx"
)

func main() {
	// 初始化认证 Token
	initializeAuth()

	// 启动服务器
	cmd.Main.Run(gctx.New())
}

// initializeAuth 初始化认证系统
func initializeAuth() {
	// 初始化 token（从文件加载或生成新的）
	token := service.Auth().InitializeToken()

	// 设置 token 验证函数
	middleware.SetTokenValidatorFunc(func(inputToken string) bool {
		return service.Auth().ValidateToken(inputToken)
	})

	// 打印访问信息
	fmt.Printf("\n===========================================\n")
	fmt.Printf("  AIC - AI 工具管理平台\n")
	fmt.Printf("===========================================\n")
	fmt.Printf("访问地址: http://localhost:8000\n")
	fmt.Printf("认证令牌: %s\n", token)
	fmt.Printf("请使用令牌登录系统\n")
	fmt.Printf("===========================================\n\n")

	log.Println("认证系统已初始化")
}
