package controller

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/init"
	service "github.com/cicbyte/aic/internal/service"
)

var Init = initController{}

type initController struct {
	BaseController
}

// Status 检查系统初始化状态
func (c *initController) Status(ctx context.Context, req *api.InitStatusReq) (res *api.InitStatusRes, err error) {
	res, err = service.Init().Status(ctx, req)
	return
}

// TestConnection 测试数据库连接
func (c *initController) TestConnection(ctx context.Context, req *api.InitTestReq) (res *api.InitTestRes, err error) {
	res, err = service.Init().TestConnection(ctx, req)
	return
}

// Setup 执行系统初始化
func (c *initController) Setup(ctx context.Context, req *api.InitSetupReq) (res *api.InitSetupRes, err error) {
	res, err = service.Init().Setup(ctx, req)
	return
}
