// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Categories is the golang structure of table categories for DAO operations like Where/Data.
type Categories struct {
	g.Meta      `orm:"table:categories, do:true"`
	Id          any         // 主键ID
	Name        any         // 分类名称，唯一
	Description any         // 分类描述
	Icon        any         // 分类图标URL或标识
	Sort        any         // 排序，数字越大越靠前
	CreatedAt   *gtime.Time // 创建时间
	UpdatedAt   *gtime.Time // 更新时间
}
