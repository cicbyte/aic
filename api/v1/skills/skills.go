package skills

import (
	commonApi "github.com/cicbyte/aic/api/v1/common"
	model "github.com/cicbyte/aic/internal/model"
	"github.com/gogf/gf/v2/frame/g"
)

type CreateReq struct {
	g.Meta      `path:"/skills/create" method:"post" tags:"技能" summary:"创建技能"`
	Name        string   `json:"name" v:"required#技能名称不能为空|length:1,100#名称长度1-100位"`
	Description string   `json:"description"`
	CategoryId  int      `json:"categoryId" v:"required#分类不能为空"`
	Tags        []string `json:"tags"`
}

type CreateRes struct {
	g.Meta  `mime:"application/json"`
	SkillId int `json:"skillId"`
}

type UpdateReq struct {
	g.Meta      `path:"/skills/update" method:"put" tags:"技能" summary:"更新技能"`
	Id          int      `json:"id" v:"required#技能ID不能为空"`
	Name        string   `json:"name" v:"required#技能名称不能为空"`
	Description string   `json:"description"`
	CategoryId  int      `json:"categoryId"`
	Tags        []string `json:"tags"`
}

type UpdateRes struct {
	g.Meta `mime:"application/json"`
}

type DeleteReq struct {
	g.Meta `path:"/skills/delete" method:"delete" tags:"技能" summary:"删除技能"`
	Id     int `json:"id" v:"required#技能ID不能为空"`
}

type DeleteRes struct {
	g.Meta `mime:"application/json"`
}

type ListReq struct {
	g.Meta `path:"/skills/list" method:"get" tags:"技能" summary:"技能列表"`
	commonApi.PageReq
	CategoryId int    `json:"categoryId"`
	Status     int    `json:"status"`
	IsPublic   *bool  `json:"isPublic"`
	Keyword    string `json:"keyword"`
	Tag        string `json:"tag"`
	OrderBy    string `json:"orderBy"`
}

type ListRes struct {
	g.Meta `mime:"application/json"`
	commonApi.ListRes
	SkillsList []*model.SkillsInfo `json:"skillsList"`
}

type DetailReq struct {
	g.Meta `path:"/skills/detail" method:"get" tags:"技能" summary:"技能详情"`
	Id     int `json:"id" v:"required#技能ID不能为空"`
}

type DetailRes struct {
	g.Meta `mime:"application/json"`
	*model.SkillsDetailInfo
}

type SaveFilesReq struct {
	g.Meta `path:"/skills/save-files" method:"post" tags:"技能" summary:"保存技能文件"`
	Id     int               `json:"id" v:"required#技能ID不能为空"`
	Files  []*model.FileNode `json:"files"`
}

type SaveFilesRes struct {
	g.Meta `mime:"application/json"`
}

type GetFilesReq struct {
	g.Meta `path:"/skills/files" method:"get" tags:"技能" summary:"获取技能文件"`
	Id     int `json:"id" v:"required#技能ID不能为空"`
}

type GetFilesRes struct {
	g.Meta `mime:"application/json"`
	Files  []*model.FileNode `json:"files"`
}

type ToggleFavoriteReq struct {
	g.Meta  `path:"/skills/toggle-favorite" method:"post" tags:"技能" summary:"收藏/取消收藏技能"`
	SkillId int `json:"skillId" v:"required#技能ID不能为空"`
}

type ToggleFavoriteRes struct {
	g.Meta     `mime:"application/json"`
	IsFavorite bool `json:"isFavorite"`
	StarCount  int  `json:"starCount"`
}

type GetFavoritesReq struct {
	g.Meta `path:"/skills/favorites" method:"get" tags:"技能" summary:"获取收藏的技能列表"`
	commonApi.PageReq
}

type GetFavoritesRes struct {
	g.Meta `mime:"application/json"`
	commonApi.ListRes
	SkillsList []*model.SkillsInfo `json:"skillsList"`
}

type ImportZipReq struct {
	g.Meta      `path:"/skills/import-zip" method:"post" tags:"技能" summary:"导入ZIP文件创建技能"`
	File        string `json:"file" type:"file" v:"required#请选择ZIP文件"`
	Description string `json:"description"`
	CategoryId  int    `json:"categoryId"`
	Overwrite   bool   `json:"overwrite"`
}

type ImportZipRes struct {
	g.Meta  `mime:"application/json"`
	SkillId int    `json:"skillId"`
	Name    string `json:"name"`
}

type GetGitHistoryReq struct {
	g.Meta   `path:"/skills/git-history" method:"get" tags:"技能" summary:"获取技能Git历史"`
	Id       int `json:"id" v:"required#技能ID不能为空"`
	MaxCount int `json:"maxCount"`
}

type GetGitHistoryRes struct {
	g.Meta `mime:"application/json"`
	*model.GitHistoryResult
}

type GetGitFileContentReq struct {
	g.Meta  `path:"/skills/git-file" method:"get" tags:"技能" summary:"获取技能指定版本的文件内容"`
	Id      int    `json:"id" v:"required#技能ID不能为空"`
	Commit  string `json:"commit" v:"required#Commit哈希不能为空"`
	Path    string `json:"path" v:"required#文件路径不能为空"`
}

type GetGitFileContentRes struct {
	g.Meta  `mime:"application/json"`
	Content string `json:"content"`
}

type GetGitDiffReq struct {
	g.Meta `path:"/skills/git-diff" method:"get" tags:"技能" summary:"获取技能两次提交之间的差异"`
	Id     int    `json:"id" v:"required#技能ID不能为空"`
	From   string `json:"from" v:"required#起始Commit哈希不能为空"`
	To     string `json:"to" v:"required#目标Commit哈希不能为空"`
}

type GetGitDiffRes struct {
	g.Meta `mime:"application/json"`
	Diff   string `json:"diff"`
}
