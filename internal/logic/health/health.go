package health

import (
	"context"
	"fmt"

	api "github.com/cicbyte/aic/api/v1/health"
	service "github.com/cicbyte/aic/internal/service"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

func init() {
	service.RegisterHealth(New())
}

func New() *sHealth {
	return &sHealth{
		startTime: gtime.Now(),
	}
}

type sHealth struct {
	startTime *gtime.Time
}

// Check 简单健康检查
func (s *sHealth) Check(ctx context.Context) (status, message string) {
	return "ok", "service is running"
}

// Detail 详细健康检查
func (s sHealth) Detail(ctx context.Context) (res *api.HealthDetailRes, err error) {
	res = &api.HealthDetailRes{
		Checks: []api.CheckItem{},
	}

	// 检查数据库连接
	dbStatus := s.checkDatabase(ctx)
	res.Checks = append(res.Checks, dbStatus)

	// 检查服务器状态
	serverStatus := api.CheckItem{
		Name:   "server",
		Status: "ok",
	}
	res.Checks = append(res.Checks, serverStatus)

	// 判断总体状态
	allOk := true
	for _, check := range res.Checks {
		if check.Status != "ok" {
			allOk = false
			break
		}
	}

	if allOk {
		res.Status = "ok"
		res.Message = "all systems operational"
	} else {
		res.Status = "error"
		res.Message = "some systems are down"
	}

	// 运行时长
	res.Uptime = gtime.Now().Sub(s.startTime).String()
	res.Version = "1.0.0"

	return
}

// checkDatabase 检查数据库连接
func (s *sHealth) checkDatabase(ctx context.Context) api.CheckItem {
	check := api.CheckItem{
		Name: "database",
	}

	// 尝试执行一个简单的查询
	err := g.DB().Model("categories").Ctx(ctx).Limit(1).Scan(&[]interface{}{})
	if err != nil {
		check.Status = "error"
		check.Error = fmt.Sprintf("database connection failed: %v", err)
	} else {
		check.Status = "ok"
	}

	return check
}