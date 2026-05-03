package controller

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/auth"
	service "github.com/cicbyte/aic/internal/service"
)

var Auth = authController{}

type authController struct {
	BaseController
}

// Login 用户登录
func (c *authController) Login(ctx context.Context, req *api.AuthLoginReq) (res *api.AuthLoginRes, err error) {
	res = new(api.AuthLoginRes)
	res, err = service.Auth().Login(ctx, req)
	return
}

// GetToken 获取当前 Token 信息
func (c *authController) GetToken(ctx context.Context, req *api.AuthGetTokenReq) (res *api.AuthGetTokenRes, err error) {
	res = new(api.AuthGetTokenRes)
	res, err = service.Auth().GetTokenInfo(ctx, req)
	return
}

// UpdateToken 更新 Token
func (c *authController) UpdateToken(ctx context.Context, req *api.AuthUpdateTokenReq) (res *api.AuthUpdateTokenRes, err error) {
	res = new(api.AuthUpdateTokenRes)
	res, err = service.Auth().UpdateToken(ctx, req)
	return
}
