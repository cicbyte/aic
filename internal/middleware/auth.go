package middleware

import (
	"net/http"

	"github.com/gogf/gf/v2/net/ghttp"
)

// AuthMiddleware 认证中间件
func AuthMiddleware(r *ghttp.Request) {
	// 获取 Authorization header
	authHeader := r.Header.Get("Authorization")

	// 检查是否提供了 token
	if authHeader == "" {
		r.Response.WriteHeader(http.StatusUnauthorized)
		r.Response.WriteJson(map[string]interface{}{
			"code":    401,
			"message": "未提供认证信息",
		})
		r.Exit()
		return
	}

	// 验证 token 格式（Bearer <token>）
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		r.Response.WriteHeader(http.StatusUnauthorized)
		r.Response.WriteJson(map[string]interface{}{
			"code":    401,
			"message": "认证信息格式错误",
		})
		r.Exit()
		return
	}

	// 提取 token
	token := authHeader[7:]

	// 验证 token 是否有效
	validator := GetTokenValidator()
	if !validator(token) {
		r.Response.WriteHeader(http.StatusUnauthorized)
		r.Response.WriteJson(map[string]interface{}{
			"code":    401,
			"message": "认证失败",
		})
		r.Exit()
		return
	}

	// 认证通过，继续处理请求
	r.Middleware.Next()
}

// validateToken 验证 token 的辅助函数
func validateToken(token string) bool {
	// 这里需要从服务层获取验证方法
	// 暂时返回 false，需要在应用启动时初始化
	// 实际使用时，应该调用 service.Auth().ValidateToken(token)
	return false // 临时实现，将在 main.go 中覆盖
}

// SetTokenValidator 设置 token 验证函数
func SetTokenValidator(validator func(string) bool) {
	// 将在 main.go 中设置
}

// 可以通过全局变量或依赖注入来设置验证函数
var tokenValidator func(string) bool

func GetTokenValidator() func(string) bool {
	if tokenValidator == nil {
		// 默认验证器，始终返回 false
		return func(token string) bool {
			return false
		}
	}
	return tokenValidator
}

func SetTokenValidatorFunc(validator func(string) bool) {
	tokenValidator = validator
}
