package main

import (
	_ "github.com/cicbyte/aic/internal/packed"
	//重要 需要导入数据库驱动
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	// SQLite数据库驱动,如果需要支持需要go get -u github.com/gogf/gf/contrib/drivers/sqlite/v2
	//_ "github.com/gogf/gf/contrib/drivers/sqlite/v2"

	"github.com/gogf/gf/v2/os/gctx"

	"github.com/cicbyte/aic/internal/cmd"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
