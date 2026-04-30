// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Skills is the golang structure of table skills for DAO operations like Where/Data.
type Skills struct {
	g.Meta        `orm:"table:skills, do:true"`
	Id            any         //
	Name          any         //
	Description   any         //
	Version       any         //
	CategoryId    any         //
	Status        any         //
	IsPublic      any         //
	IsValid       any         //
	FilePath      any         //
	License       any         //
	DownloadCount any         //
	StarCount     any         //
	FileSize      any         //
	CreatedAt     *gtime.Time //
	UpdatedAt     *gtime.Time //
	ValidatedAt   *gtime.Time //
}
