// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// SkillFiles is the golang structure of table skill_files for DAO operations like Where/Data.
type SkillFiles struct {
	g.Meta      `orm:"table:skill_files, do:true"`
	Id          any         //
	SkillId     any         //
	FilePath    any         //
	FileType    any         //
	FileName    any         //
	FileSize    any         //
	IsDirectory any         //
	CreatedAt   *gtime.Time //
}
