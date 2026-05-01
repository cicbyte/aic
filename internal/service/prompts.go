package service

import (
	"context"
	api "github.com/cicbyte/aic/api/v1/prompts"
	model "github.com/cicbyte/aic/internal/model"
)

type IPrompts interface {
	CreatePrompt(ctx context.Context, req *api.PromptCreateReq) (promptId int, err error)
	UpdatePrompt(ctx context.Context, req *api.PromptUpdateReq) error
	DeletePrompt(ctx context.Context, promptId int) error
	GetPromptDetail(ctx context.Context, promptId int) (*model.PromptInfo, error)
	ListPrompts(ctx context.Context, req *api.PromptListReq) (total interface{}, prompts []*model.PromptInfo, err error)
	TogglePromptFavorite(ctx context.Context, promptId int) (isFavorite bool, err error)
	PromptVersionList(ctx context.Context, promptId int) ([]*model.PromptVersionInfo, error)
	PromptVersionDelete(ctx context.Context, versionId int) error
	PromptRollback(ctx context.Context, promptId int, version string) error
	PromptPublish(ctx context.Context, promptId int, version string) error
	PromptSwitchVersion(ctx context.Context, promptId int, version string) error

	CreateProject(ctx context.Context, req *api.ProjectCreateReq) (projectId int, err error)
	UpdateProject(ctx context.Context, req *api.ProjectUpdateReq) error
	DeleteProject(ctx context.Context, projectId int) error
	GetProjectDetail(ctx context.Context, projectId int) (*model.ProjectInfo, error)
	ListProjects(ctx context.Context, req *api.ProjectListReq) (total interface{}, projects []*model.ProjectInfo, err error)
	ToggleProjectFavorite(ctx context.Context, projectId int) (isFavorite bool, err error)
}

var localPrompts IPrompts

func Prompts() IPrompts {
	if localPrompts == nil {
		panic("implement not found for interface IPrompts, forgot register?")
	}
	return localPrompts
}

func RegisterPrompts(i IPrompts) {
	localPrompts = i
}
