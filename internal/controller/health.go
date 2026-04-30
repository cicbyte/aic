package controller

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/health"
	service "github.com/cicbyte/aic/internal/service"
)

var Health = healthController{}

type healthController struct {
	BaseController
}

// Check 简单健康检查
func (c *healthController) Check(ctx context.Context, req *api.HealthReq) (res *api.HealthRes, err error) {
	res = &api.HealthRes{}
	res.Status, res.Message = service.Health().Check(ctx)
	return
}

// Detail 详细健康检查
func (c *healthController) Detail(ctx context.Context, req *api.HealthDetailReq) (res *api.HealthDetailRes, err error) {
	return service.Health().Detail(ctx)
}