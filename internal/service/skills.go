package service

import (
	"context"
	api "github.com/cicbyte/aic/api/v1/skills"
	model "github.com/cicbyte/aic/internal/model"
)

type ISkills interface {
	// 基础 CRUD
	Create(ctx context.Context, req *api.CreateReq) (skillId int, err error)
	Update(ctx context.Context, req *api.UpdateReq) error
	Delete(ctx context.Context, skillId int) error
	GetDetail(ctx context.Context, skillId int) (*model.SkillsDetailInfo, error)
	List(ctx context.Context, req *api.ListReq) (total interface{}, skills []*model.SkillsInfo, err error)

	// 文件管理
	SaveFiles(ctx context.Context, skillId int, files []*model.FileNode) error
	GetFiles(ctx context.Context, skillId int) ([]*model.FileNode, error)
	GenerateZip(ctx context.Context, skillId int) (zipData []byte, skillName string, err error)

	// 导入
	ImportZip(ctx context.Context, req *api.ImportZipReq) (skillId int, skillName string, err error)

	// 统计
	IncrementDownload(ctx context.Context, skillId int) error

	// 搜索
	Search(ctx context.Context, keyword string, page, pageSize int) (total interface{}, skills []*model.SkillsInfo, err error)

	// 收藏
	ToggleFavorite(ctx context.Context, skillId int) (isFavorite bool, starCount int, err error)
	GetFavorites(ctx context.Context, page, pageSize int) (total interface{}, skills []*model.SkillsInfo, err error)
}

var localSkills ISkills

func Skills() ISkills {
	if localSkills == nil {
		panic("implement not found for interface ISkills, forgot register?")
	}
	return localSkills
}

func RegisterSkills(i ISkills) {
	localSkills = i
}
