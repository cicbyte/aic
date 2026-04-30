package service

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/health"
)

type IHealth interface {
	// Check 简单健康检查
	Check(ctx context.Context) (status, message string)

	// Detail 详细健康检查
	Detail(ctx context.Context) (res *api.HealthDetailRes, err error)
}

var localHealth IHealth

func Health() IHealth {
	if localHealth == nil {
		panic("implement not found for interface IHealth, forgot register?")
	}
	return localHealth
}

func RegisterHealth(i IHealth) {
	localHealth = i
}