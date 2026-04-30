// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Skills is the golang structure for table skills.
type Skills struct {
	Id            uint        `json:"id"            orm:"id"             description:""` //
	Name          string      `json:"name"          orm:"name"           description:""` //
	Description   string      `json:"description"   orm:"description"    description:""` //
	Version       string      `json:"version"       orm:"version"        description:""` //
	CategoryId    uint        `json:"categoryId"    orm:"category_id"    description:""` //
	Status        int         `json:"status"        orm:"status"         description:""` //
	IsPublic      int         `json:"isPublic"      orm:"is_public"      description:""` //
	IsValid       int         `json:"isValid"       orm:"is_valid"       description:""` //
	FilePath      string      `json:"filePath"      orm:"file_path"      description:""` //
	License       string      `json:"license"       orm:"license"        description:""` //
	DownloadCount int         `json:"downloadCount" orm:"download_count" description:""` //
	StarCount     int         `json:"starCount"     orm:"star_count"     description:""` //
	FileSize      int64       `json:"fileSize"      orm:"file_size"      description:""` //
	CreatedAt     *gtime.Time `json:"createdAt"     orm:"created_at"     description:""` //
	UpdatedAt     *gtime.Time `json:"updatedAt"     orm:"updated_at"     description:""` //
	ValidatedAt   *gtime.Time `json:"validatedAt"   orm:"validated_at"   description:""` //
}
