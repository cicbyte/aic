package service

import (
	"context"

	api "github.com/cicbyte/aic/api/v1/init"
)

type IInit interface {
	Status(ctx context.Context, req *api.InitStatusReq) (res *api.InitStatusRes, err error)
	TestConnection(ctx context.Context, req *api.InitTestReq) (res *api.InitTestRes, err error)
	Setup(ctx context.Context, req *api.InitSetupReq) (res *api.InitSetupRes, err error)
}

var localInit IInit

func Init() IInit {
	if localInit == nil {
		panic("implement not found for interface IInit, forgot register?")
	}
	return localInit
}

func RegisterInit(i IInit) {
	localInit = i
}
