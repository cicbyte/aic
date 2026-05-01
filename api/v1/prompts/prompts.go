package prompts

import (
	commonApi "github.com/cicbyte/aic/api/v1/common"
	model "github.com/cicbyte/aic/internal/model"
	"github.com/gogf/gf/v2/frame/g"
)

// ============ Prompt API ============

type PromptListReq struct {
	g.Meta `path:"/prompts/list" method:"get" tags:"提示" summary:"提示列表"`
	commonApi.PageReq
	CategoryId int    `json:"categoryId"`
	ProjectId  *int   `json:"projectId"`
	IsFavorite *bool  `json:"isFavorite"`
	Keyword    string `json:"keyword"`
}

type PromptListRes struct {
	g.Meta `mime:"application/json"`
	commonApi.ListRes
	PromptsList []*model.PromptInfo `json:"promptsList"`
}

type PromptDetailReq struct {
	g.Meta `path:"/prompts/detail" method:"get" tags:"提示" summary:"提示详情"`
	Id     int `json:"id" v:"required#提示ID不能为空"`
}

type PromptDetailRes struct {
	g.Meta `mime:"application/json"`
	*model.PromptInfo
}

type PromptCreateReq struct {
	g.Meta      `path:"/prompts/create" method:"post" tags:"提示" summary:"创建提示"`
	Title       string `json:"title" v:"required#标题不能为空"`
	Description string `json:"description"`
	Content     string `json:"content"`
	CategoryId  int    `json:"categoryId"`
	ProjectId   int    `json:"projectId"`
}

type PromptCreateRes struct {
	g.Meta   `mime:"application/json"`
	PromptId int `json:"promptId"`
}

type PromptUpdateReq struct {
	g.Meta      `path:"/prompts/update" method:"put" tags:"提示" summary:"更新提示"`
	Id          int    `json:"id" v:"required#提示ID不能为空"`
	Title       string `json:"title" v:"required#标题不能为空"`
	Description string `json:"description"`
	Content     string `json:"content"`
	CategoryId  int    `json:"categoryId"`
	ProjectId   int    `json:"projectId"`
}

type PromptUpdateRes struct {
	g.Meta `mime:"application/json"`
}

type PromptDeleteReq struct {
	g.Meta `path:"/prompts/delete" method:"delete" tags:"提示" summary:"删除提示"`
	Id     int `json:"id" v:"required#提示ID不能为空"`
}

type PromptDeleteRes struct {
	g.Meta `mime:"application/json"`
}

type PromptToggleFavoriteReq struct {
	g.Meta   `path:"/prompts/toggle-favorite" method:"post" tags:"提示" summary:"收藏/取消收藏提示"`
	PromptId int `json:"promptId" v:"required#提示ID不能为空"`
}

type PromptToggleFavoriteRes struct {
	g.Meta     `mime:"application/json"`
	IsFavorite bool `json:"isFavorite"`
}

type PromptVersionListReq struct {
	g.Meta   `path:"/prompts/versions" method:"get" tags:"提示" summary:"版本列表"`
	PromptId int `json:"promptId" v:"required#提示ID不能为空"`
}

type PromptVersionListRes struct {
	g.Meta    `mime:"application/json"`
	Versions  []*model.PromptVersionInfo `json:"versions"`
}

type PromptRollbackReq struct {
	g.Meta   `path:"/prompts/rollback" method:"post" tags:"提示" summary:"回滚版本"`
	PromptId int    `json:"promptId" v:"required#提示ID不能为空"`
	Version  string `json:"version" v:"required#版本号不能为空"`
}

type PromptRollbackRes struct {
	g.Meta `mime:"application/json"`
}

type PromptVersionDeleteReq struct {
	g.Meta   `path:"/prompts/version-delete" method:"delete" tags:"提示" summary:"删除版本"`
	Id       int `json:"id" v:"required#版本ID不能为空"`
}

type PromptVersionDeleteRes struct {
	g.Meta `mime:"application/json"`
}

type PromptPublishReq struct {
	g.Meta      `path:"/prompts/publish" method:"post" tags:"提示" summary:"发布版本"`
	PromptId    int    `json:"promptId" v:"required#提示ID不能为空"`
	Version     string `json:"version" v:"required#版本号不能为空"`
	PublishNote string `json:"publishNote"`
}

type PromptPublishRes struct {
	g.Meta `mime:"application/json"`
}

type PromptSwitchVersionReq struct {
	g.Meta   `path:"/prompts/switch-version" method:"post" tags:"提示" summary:"切换发布版本"`
	PromptId int    `json:"promptId" v:"required#提示ID不能为空"`
	Version  string `json:"version" v:"required#版本号不能为空"`
}

type PromptSwitchVersionRes struct {
	g.Meta `mime:"application/json"`
}

// ============ Project API ============

type ProjectListReq struct {
	g.Meta `path:"/projects/list" method:"get" tags:"项目" summary:"项目列表"`
	commonApi.PageReq
	CategoryId int    `json:"categoryId"`
	IsFavorite *bool  `json:"isFavorite"`
	Keyword    string `json:"keyword"`
}

type ProjectListRes struct {
	g.Meta `mime:"application/json"`
	commonApi.ListRes
	ProjectsList []*model.ProjectInfo `json:"projectsList"`
}

type ProjectDetailReq struct {
	g.Meta `path:"/projects/detail" method:"get" tags:"项目" summary:"项目详情"`
	Id     int `json:"id" v:"required#项目ID不能为空"`
}

type ProjectDetailRes struct {
	g.Meta `mime:"application/json"`
	*model.ProjectInfo
}

type ProjectCreateReq struct {
	g.Meta      `path:"/projects/create" method:"post" tags:"项目" summary:"创建项目"`
	Name        string `json:"name" v:"required#名称不能为空"`
	Description string `json:"description"`
	Color       string `json:"color"`
	CategoryId  int    `json:"categoryId"`
}

type ProjectCreateRes struct {
	g.Meta    `mime:"application/json"`
	ProjectId int `json:"projectId"`
}

type ProjectUpdateReq struct {
	g.Meta      `path:"/projects/update" method:"put" tags:"项目" summary:"更新项目"`
	Id          int    `json:"id" v:"required#项目ID不能为空"`
	Name        string `json:"name" v:"required#名称不能为空"`
	Description string `json:"description"`
	Color       string `json:"color"`
	CategoryId  int    `json:"categoryId"`
}

type ProjectUpdateRes struct {
	g.Meta `mime:"application/json"`
}

type ProjectDeleteReq struct {
	g.Meta `path:"/projects/delete" method:"delete" tags:"项目" summary:"删除项目"`
	Id     int `json:"id" v:"required#项目ID不能为空"`
}

type ProjectDeleteRes struct {
	g.Meta `mime:"application/json"`
}

type ProjectToggleFavoriteReq struct {
	g.Meta    `path:"/projects/toggle-favorite" method:"post" tags:"项目" summary:"收藏/取消收藏项目"`
	ProjectId int `json:"projectId" v:"required#项目ID不能为空"`
}

type ProjectToggleFavoriteRes struct {
	g.Meta     `mime:"application/json"`
	IsFavorite bool `json:"isFavorite"`
}
