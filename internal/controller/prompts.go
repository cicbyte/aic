package controller

import (
	"context"
	api "github.com/cicbyte/aic/api/v1/prompts"
	service "github.com/cicbyte/aic/internal/service"
)

var Prompts = promptsController{}

type promptsController struct {
	BaseController
}

// ============ Prompt Methods ============

func (c *promptsController) PromptList(ctx context.Context, req *api.PromptListReq) (res *api.PromptListRes, err error) {
	res = new(api.PromptListRes)
	total, list, err := service.Prompts().ListPrompts(ctx, req)
	res.Total = total
	res.PromptsList = list
	return
}

func (c *promptsController) PromptDetail(ctx context.Context, req *api.PromptDetailReq) (res *api.PromptDetailRes, err error) {
	res = new(api.PromptDetailRes)
	detail, err := service.Prompts().GetPromptDetail(ctx, req.Id)
	res.PromptInfo = detail
	return
}

func (c *promptsController) PromptCreate(ctx context.Context, req *api.PromptCreateReq) (res *api.PromptCreateRes, err error) {
	res = new(api.PromptCreateRes)
	id, err := service.Prompts().CreatePrompt(ctx, req)
	res.PromptId = id
	return
}

func (c *promptsController) PromptUpdate(ctx context.Context, req *api.PromptUpdateReq) (res *api.PromptUpdateRes, err error) {
	res = new(api.PromptUpdateRes)
	err = service.Prompts().UpdatePrompt(ctx, req)
	return
}

func (c *promptsController) PromptDelete(ctx context.Context, req *api.PromptDeleteReq) (res *api.PromptDeleteRes, err error) {
	res = new(api.PromptDeleteRes)
	err = service.Prompts().DeletePrompt(ctx, req.Id)
	return
}

func (c *promptsController) PromptToggleFavorite(ctx context.Context, req *api.PromptToggleFavoriteReq) (res *api.PromptToggleFavoriteRes, err error) {
	res = new(api.PromptToggleFavoriteRes)
	isFavorite, err := service.Prompts().TogglePromptFavorite(ctx, req.PromptId)
	res.IsFavorite = isFavorite
	return
}

func (c *promptsController) PromptVersionList(ctx context.Context, req *api.PromptVersionListReq) (res *api.PromptVersionListRes, err error) {
	res = new(api.PromptVersionListRes)
	versions, err := service.Prompts().PromptVersionList(ctx, req.PromptId)
	res.Versions = versions
	return
}

func (c *promptsController) PromptVersionDelete(ctx context.Context, req *api.PromptVersionDeleteReq) (res *api.PromptVersionDeleteRes, err error) {
	res = new(api.PromptVersionDeleteRes)
	err = service.Prompts().PromptVersionDelete(ctx, req.Id)
	return
}

func (c *promptsController) PromptRollback(ctx context.Context, req *api.PromptRollbackReq) (res *api.PromptRollbackRes, err error) {
	res = new(api.PromptRollbackRes)
	err = service.Prompts().PromptRollback(ctx, req.PromptId, req.Version)
	return
}

func (c *promptsController) PromptPublish(ctx context.Context, req *api.PromptPublishReq) (res *api.PromptPublishRes, err error) {
	res = new(api.PromptPublishRes)
	err = service.Prompts().PromptPublish(ctx, req.PromptId, req.Version)
	return
}

func (c *promptsController) PromptSwitchVersion(ctx context.Context, req *api.PromptSwitchVersionReq) (res *api.PromptSwitchVersionRes, err error) {
	res = new(api.PromptSwitchVersionRes)
	err = service.Prompts().PromptSwitchVersion(ctx, req.PromptId, req.Version)
	return
}

// ============ Project Methods ============

func (c *promptsController) ProjectList(ctx context.Context, req *api.ProjectListReq) (res *api.ProjectListRes, err error) {
	res = new(api.ProjectListRes)
	total, list, err := service.Prompts().ListProjects(ctx, req)
	res.Total = total
	res.ProjectsList = list
	return
}

func (c *promptsController) ProjectDetail(ctx context.Context, req *api.ProjectDetailReq) (res *api.ProjectDetailRes, err error) {
	res = new(api.ProjectDetailRes)
	detail, err := service.Prompts().GetProjectDetail(ctx, req.Id)
	res.ProjectInfo = detail
	return
}

func (c *promptsController) ProjectCreate(ctx context.Context, req *api.ProjectCreateReq) (res *api.ProjectCreateRes, err error) {
	res = new(api.ProjectCreateRes)
	id, err := service.Prompts().CreateProject(ctx, req)
	res.ProjectId = id
	return
}

func (c *promptsController) ProjectUpdate(ctx context.Context, req *api.ProjectUpdateReq) (res *api.ProjectUpdateRes, err error) {
	res = new(api.ProjectUpdateRes)
	err = service.Prompts().UpdateProject(ctx, req)
	return
}

func (c *promptsController) ProjectDelete(ctx context.Context, req *api.ProjectDeleteReq) (res *api.ProjectDeleteRes, err error) {
	res = new(api.ProjectDeleteRes)
	err = service.Prompts().DeleteProject(ctx, req.Id)
	return
}

func (c *promptsController) ProjectToggleFavorite(ctx context.Context, req *api.ProjectToggleFavoriteReq) (res *api.ProjectToggleFavoriteRes, err error) {
	res = new(api.ProjectToggleFavoriteRes)
	isFavorite, err := service.Prompts().ToggleProjectFavorite(ctx, req.ProjectId)
	res.IsFavorite = isFavorite
	return
}
