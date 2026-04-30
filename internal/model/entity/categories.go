// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Categories is the golang structure for table categories.
type Categories struct {
	Id          uint        `json:"id"          orm:"id"          description:"主键ID"`       // 主键ID
	Name        string      `json:"name"        orm:"name"        description:"分类名称，唯一"`    // 分类名称，唯一
	Description string      `json:"description" orm:"description" description:"分类描述"`       // 分类描述
	Icon        string      `json:"icon"        orm:"icon"        description:"分类图标URL或标识"` // 分类图标URL或标识
	Sort        int         `json:"sort"        orm:"sort"        description:"排序，数字越大越靠前"` // 排序，数字越大越靠前
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"  description:"创建时间"`       // 创建时间
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  description:"更新时间"`       // 更新时间
}
