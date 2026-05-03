package init

import (
	g "github.com/gogf/gf/v2/frame/g"
)

// InitStatusReq 检查初始化状态请求
type InitStatusReq struct {
	g.Meta `path:"/status" method:"get" tags:"初始化" summary:"检查系统初始化状态"`
}

// InitStatusRes 检查初始化状态响应
type InitStatusRes struct {
	g.Meta   `mime:"application/json" example:"string"`
	Initialized bool   `json:"initialized"` // 是否已初始化
}

// InitTestReq 测试数据库连接请求
type InitTestReq struct {
	g.Meta   `path:"/test-connection" method:"post" tags:"初始化" summary:"测试数据库连接"`
	Host     string `json:"host" v:"required#数据库主机地址" dc:"数据库主机地址"`
	Port     int    `json:"port" v:"required|min:1|max:65535" dc:"数据库端口"`
	User     string `json:"user" v:"required#数据库用户名" dc:"数据库用户名"`
	Password string `json:"password" v:"required#数据库密码" dc:"数据库密码"`
}

// InitTestRes 测试数据库连接响应
type InitTestRes struct {
	g.Meta  `mime:"application/json" example:"string"`
	Success bool   `json:"success"`   // 连接是否成功
	Version string `json:"version"`   // MySQL 版本号（成功时）
	Error   string `json:"error"`     // 错误信息（失败时）
}

// InitSetupReq 执行初始化请求
type InitSetupReq struct {
	g.Meta   `path:"/setup" method:"post" tags:"初始化" summary:"执行系统初始化"`
	Host     string `json:"host" v:"required#数据库主机地址"`
	Port     int    `json:"port" v:"required|min:1|max:65535"`
	User     string `json:"user" v:"required#数据库用户名"`
	Password string `json:"password" v:"required#数据库密码"`
	Database string `json:"database" v:"required|length:1,32#数据库名称必填，长度1-32字符"`
}

// InitSetupRes 执行初始化响应
type InitSetupRes struct {
	g.Meta  `mime:"application/json" example:"string"`
	Success bool   `json:"success"` // 初始化是否成功
	Error   string `json:"error"`   // 错误信息（失败时）
}
