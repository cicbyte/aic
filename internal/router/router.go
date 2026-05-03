package router

import (
	"context"
	"fmt"

	controller "github.com/cicbyte/aic/internal/controller"
	"github.com/cicbyte/aic/internal/middleware"
	service "github.com/cicbyte/aic/internal/service"
	"github.com/cicbyte/aic/library/libRouter"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Router struct{}

func (router *Router) BindController(ctx context.Context, group *ghttp.RouterGroup) {
	group.Group("/api/v1", func(group *ghttp.RouterGroup) {
		group.Middleware(service.Middleware().MiddlewareCORS)

		// 初始化相关接口（不需要认证）
		initGroup := group.Group("/init")
		{
			initGroup.Bind(
				controller.Init,
			)
		}

		// 认证相关接口（不需要认证）
		authGroup := group.Group("/auth")
		{
			authGroup.Bind(
				controller.Auth,
			)
		}

		// 需要认证的接口
		protectedGroup := group.Group("")
		protectedGroup.Middleware(func(r *ghttp.Request) {
			middleware.AuthMiddleware(r)
		})
		{
			protectedGroup.Bind(
				controller.Categories,
				controller.Health,
				controller.Skills,
				controller.Prompts,
			)
		}

		// 技能下载特殊处理
		group.GET("/skills/download", func(r *ghttp.Request) {
			id := r.GetQuery("id", 0).Int()
			if id == 0 {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    1,
					"message": "技能ID不能为空",
				})
				return
			}

			zipData, skillName, err := service.Skills().GenerateZip(r.Context(), id)
			if err != nil {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    1,
					"message": err.Error(),
				})
				return
			}

			r.Response.Header().Set("Content-Type", "application/zip")
			r.Response.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", skillName))
			r.Response.Header().Set("Content-Length", fmt.Sprintf("%d", len(zipData)))
			r.Response.Write(zipData)
		})

		//自动绑定定义的控制器
		if err := libRouter.RouterAutoBind(ctx, router, group); err != nil {
			panic(err)
		}
	})
}
