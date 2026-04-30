// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// SkillTags is the golang structure of table skill_tags for DAO operations like Where/Data.
type SkillTags struct {
	g.Meta    `orm:"table:skill_tags, do:true"`
	Id        any         //
	SkillId   any         //
	TagName   any         //
	CreatedAt *gtime.Time //
}
