package main

import (
	"context"
	"fmt"

	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	"github.com/gogf/gf/v2/frame/g"
)

func main() {
	ctx := context.Background()
	_, err := g.DB().Exec(ctx, "ALTER TABLE prompt_versions ADD COLUMN publish_note TEXT COMMENT '版本发布说明' AFTER project_id")
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("OK: publish_note column added")
	}
}
