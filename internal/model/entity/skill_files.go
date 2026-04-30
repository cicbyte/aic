// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// SkillFiles is the golang structure for table skill_files.
type SkillFiles struct {
	Id          uint        `json:"id"          orm:"id"           description:""` //
	SkillId     uint        `json:"skillId"     orm:"skill_id"     description:""` //
	FilePath    string      `json:"filePath"    orm:"file_path"    description:""` //
	FileType    string      `json:"fileType"    orm:"file_type"    description:""` //
	FileName    string      `json:"fileName"    orm:"file_name"    description:""` //
	FileSize    int64       `json:"fileSize"    orm:"file_size"    description:""` //
	IsDirectory int         `json:"isDirectory" orm:"is_directory" description:""` //
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"   description:""` //
}
