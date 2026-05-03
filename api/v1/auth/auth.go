package template

import (
	g "github.com/gogf/gf/v2/frame/g"
)

// AuthLoginReq Token验证请求
type AuthLoginReq struct {
	g.Meta `path:"/login" method:"post" tags:"认证" summary:"Token验证"`
	Token  string `json:"token" v:"required#请输入访问令牌"`
}

// AuthLoginRes Token验证响应
type AuthLoginRes struct {
	g.Meta `mime:"application/json" example:"string"`
	Token  string `json:"token"` // 验证成功的token（脱敏显示）
}

// AuthGetTokenReq 获取当前 Token 信息请求
type AuthGetTokenReq struct {
	g.Meta `path:"/token" method:"get" tags:"认证" summary:"获取当前Token信息"`
}

// AuthGetTokenRes 获取当前 Token 信息响应
type AuthGetTokenRes struct {
	g.Meta `mime:"application/json" example:"string"`
	Token  string `json:"token"` // 脱敏显示的 token
}

// AuthUpdateTokenReq 更新 Token 请求
type AuthUpdateTokenReq struct {
	g.Meta      `path:"/token" method:"post" tags:"认证" summary:"更新Token"`
	Token       string `json:"token"`       // 新的 token（可选）
	Regenerate  bool   `json:"regenerate"`  // 是否重新生成（可选）
}

// AuthUpdateTokenRes 更新 Token 响应
type AuthUpdateTokenRes struct {
	g.Meta `mime:"application/json" example:"string"`
	Token  string `json:"token"` // 新的 token
}
