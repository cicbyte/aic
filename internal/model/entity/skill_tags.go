// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// SkillTags is the golang structure for table skill_tags.
type SkillTags struct {
	Id        uint        `json:"id"        orm:"id"         description:""` //
	SkillId   uint        `json:"skillId"   orm:"skill_id"   description:""` //
	TagName   string      `json:"tagName"   orm:"tag_name"   description:""` //
	CreatedAt *gtime.Time `json:"createdAt" orm:"created_at" description:""` //
}
