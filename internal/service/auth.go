package service

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/auth"
)

type IAuth interface {
	// InitializeToken 初始化 token
	InitializeToken() string

	// GetToken 获取当前 token
	GetToken() string

	// ValidateToken 验证 token 是否有效
	ValidateToken(token string) bool

	// Login 用户登录验证
	Login(ctx context.Context, req *api.AuthLoginReq) (res *api.AuthLoginRes, err error)

	// GetTokenInfo 获取当前 Token 信息
	GetTokenInfo(ctx context.Context, req *api.AuthGetTokenReq) (res *api.AuthGetTokenRes, err error)

	// UpdateToken 更新 Token
	UpdateToken(ctx context.Context, req *api.AuthUpdateTokenReq) (res *api.AuthUpdateTokenRes, err error)
}

var localAuth IAuth

func Auth() IAuth {
	if localAuth == nil {
		panic("implement not found for interface IAuth, forgot register?")
	}
	return localAuth
}

func RegisterAuth(i IAuth) {
	localAuth = i
}
