package cmd

import (
	"context"
	"strings"

	_ "github.com/cicbyte/aic/internal/logic"
	"github.com/cicbyte/aic/internal/router"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			s := g.Server()

			s.Group("/", func(group *ghttp.RouterGroup) {
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				r := &router.Router{}
				r.BindController(ctx, group)

				// SPA 回退支持 - 处理 Vue Router HTML5 History 模式
				group.Hook("/*", ghttp.HookBeforeServe, func(r *ghttp.Request) {
					path := r.URL.Path

					// 如果是 API 请求，跳过 SPA 回退
					if strings.HasPrefix(path, "/api/") {
						return
					}

					// 如果是静态资源（有文件扩展名），让默认处理
					if strings.Contains(path, ".") && !strings.HasSuffix(path, "/") {
						return
					}

					// 对于其他所有路径，返回 index.html，让 Vue Router 处理
					r.Response.ServeFile("resource/public/index.html")
					r.ExitAll()
				})
			})

			// 添加静态文件映射
			s.AddSearchPath("resource/public")
			s.AddStaticPath("/assets", "resource/public/assets")

			s.Run()
			return nil
		},
	}
)
