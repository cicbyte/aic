package prompts

import (
	"context"
	"fmt"

	api "github.com/cicbyte/aic/api/v1/prompts"
	"github.com/cicbyte/aic/internal/dao"
	model "github.com/cicbyte/aic/internal/model"
	do "github.com/cicbyte/aic/internal/model/do"
	service "github.com/cicbyte/aic/internal/service"
	liberr "github.com/cicbyte/aic/library/liberr"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func init() {
	service.RegisterPrompts(New())
}

func New() *sPrompts {
	return &sPrompts{}
}

type sPrompts struct{}

// ============ Prompt Methods ============

func (s *sPrompts) CreatePrompt(ctx context.Context, req *api.PromptCreateReq) (promptId int, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		var categoryId interface{}
		if req.CategoryId > 0 {
			categoryId = req.CategoryId
		}

		var projectId interface{}
		if req.ProjectId > 0 {
			projectId = req.ProjectId
		}

		result, err := dao.Prompts.Ctx(ctx).OmitEmpty().Insert(do.Prompts{
			Title:       req.Title,
			Description: req.Description,
			Content:     req.Content,
			CategoryId:  categoryId,
			ProjectId:   projectId,
			IsFavorite:  0,
		})
		liberr.ErrIsNil(ctx, err, "创建提示失败")

		id, err := result.LastInsertId()
		liberr.ErrIsNil(ctx, err, "获取ID失败")
		promptId = int(id)
	})
	return
}

func (s *sPrompts) UpdatePrompt(ctx context.Context, req *api.PromptUpdateReq) error {
	return g.Try(ctx, func(ctx context.Context) {
		data := g.Map{
			dao.Prompts.Columns().Title:       req.Title,
			dao.Prompts.Columns().Description: req.Description,
			dao.Prompts.Columns().Content:     req.Content,
		}
		if req.CategoryId > 0 {
			data[dao.Prompts.Columns().CategoryId] = req.CategoryId
		} else {
			data[dao.Prompts.Columns().CategoryId] = nil
		}
		if req.ProjectId > 0 {
			data[dao.Prompts.Columns().ProjectId] = req.ProjectId
		} else {
			data[dao.Prompts.Columns().ProjectId] = nil
		}

		_, err := dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, req.Id).
			Data(data).
			Update()
		liberr.ErrIsNil(ctx, err, "更新提示失败")
	})
}

func (s *sPrompts) DeletePrompt(ctx context.Context, promptId int) error {
	_, err := dao.Prompts.Ctx(ctx).
		Where(dao.Prompts.Columns().Id, promptId).
		Delete()
	return err
}

func (s *sPrompts) GetPromptDetail(ctx context.Context, promptId int) (*model.PromptInfo, error) {
	var prompt *model.PromptInfo

	err := g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Prompts.Ctx(ctx).
			LeftJoin("categories", "categories.id = prompts.category_id").
			Where(dao.Prompts.Columns().Id, promptId).
			Fields("prompts.*, categories.name as category_name").
			One()
		liberr.ErrIsNil(ctx, err, "查询提示失败")
		if entity.IsEmpty() {
			gerror.New("提示不存在")
		}

		prompt = &model.PromptInfo{
			Id:           int(entity[dao.Prompts.Columns().Id].Int()),
			Title:        entity[dao.Prompts.Columns().Title].String(),
			Description:  entity[dao.Prompts.Columns().Description].String(),
			Content:      entity[dao.Prompts.Columns().Content].String(),
			CategoryId:   int(entity[dao.Prompts.Columns().CategoryId].Int()),
			CategoryName: entity["category_name"].String(),
			ProjectId:    int(entity[dao.Prompts.Columns().ProjectId].Int()),
			Version:          entity[dao.Prompts.Columns().Version].String(),
			PublishedVersion: entity[dao.Prompts.Columns().PublishedVersion].String(),
			IsFavorite:   entity[dao.Prompts.Columns().IsFavorite].Bool(),
		}
	})

	return prompt, err
}

func (s *sPrompts) ListPrompts(ctx context.Context, req *api.PromptListReq) (total interface{}, prompts []*model.PromptInfo, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		m := dao.Prompts.Ctx(ctx).
			LeftJoin("categories", "categories.id = prompts.category_id").
			Where("1=1")

		if req.CategoryId > 0 {
			m = m.Where(dao.Prompts.Columns().CategoryId, req.CategoryId)
		}

		if req.ProjectId != nil {
			if *req.ProjectId > 0 {
				m = m.Where(dao.Prompts.Columns().ProjectId, *req.ProjectId)
			} else {
				m = m.Where(fmt.Sprintf("%s IS NULL OR %s = 0", dao.Prompts.Columns().ProjectId, dao.Prompts.Columns().ProjectId))
			}
		} else {
			m = m.Where(fmt.Sprintf("%s IS NULL OR %s = 0", dao.Prompts.Columns().ProjectId, dao.Prompts.Columns().ProjectId))
		}

		if req.IsFavorite != nil {
			m = m.Where(dao.Prompts.Columns().IsFavorite, *req.IsFavorite)
		}

		if req.Keyword != "" {
			columns := dao.Prompts.Columns()
			m = m.Where(fmt.Sprintf("(prompts.%s like ? or prompts.%s like ?)",
				columns.Title, columns.Description),
				"%"+req.Keyword+"%", "%"+req.Keyword+"%")
		}

		m = m.Order("id desc")

		total, err = m.Count()
		liberr.ErrIsNil(ctx, err, "查询提示总数失败")

		var entities []gdb.Record
		entities, err = m.Fields("prompts.*, categories.name as category_name").
			Page(req.PageNum, req.PageSize).
			All()
		liberr.ErrIsNil(ctx, err, "查询提示列表失败")

		prompts = make([]*model.PromptInfo, 0, len(entities))
		for _, entity := range entities {
			prompts = append(prompts, &model.PromptInfo{
				Id:           int(entity[dao.Prompts.Columns().Id].Int()),
				Title:        entity[dao.Prompts.Columns().Title].String(),
				Description:  entity[dao.Prompts.Columns().Description].String(),
				Content:      entity[dao.Prompts.Columns().Content].String(),
				CategoryId:   int(entity[dao.Prompts.Columns().CategoryId].Int()),
				CategoryName: entity["category_name"].String(),
				ProjectId:    int(entity[dao.Prompts.Columns().ProjectId].Int()),
				Version:          entity[dao.Prompts.Columns().Version].String(),
				PublishedVersion: entity[dao.Prompts.Columns().PublishedVersion].String(),
				IsFavorite:   entity[dao.Prompts.Columns().IsFavorite].Bool(),
			})
		}
	})

	return total, prompts, err
}

func (s *sPrompts) TogglePromptFavorite(ctx context.Context, promptId int) (isFavorite bool, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			One()
		liberr.ErrIsNil(ctx, err, "查询提示失败")
		if entity.IsEmpty() {
			gerror.New("提示不存在")
		}

		currentFavorite := entity[dao.Prompts.Columns().IsFavorite].Bool()
		newFavorite := !currentFavorite

		_, err = dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			Data(dao.Prompts.Columns().IsFavorite, newFavorite).
			Update()
		liberr.ErrIsNil(ctx, err, "更新收藏状态失败")

		isFavorite = newFavorite
	})

	return isFavorite, err
}

// ============ Project Methods ============

func (s *sPrompts) CreateProject(ctx context.Context, req *api.ProjectCreateReq) (projectId int, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		color := req.Color
		if color == "" {
			color = "#3b82f6"
		}

		var categoryId interface{}
		if req.CategoryId > 0 {
			categoryId = req.CategoryId
		}

		result, err := dao.Projects.Ctx(ctx).Insert(do.Projects{
			Name:        req.Name,
			Description: req.Description,
			Color:       color,
			CategoryId:  categoryId,
			IsFavorite:  0,
		})
		liberr.ErrIsNil(ctx, err, "创建项目失败")

		id, err := result.LastInsertId()
		liberr.ErrIsNil(ctx, err, "获取ID失败")
		projectId = int(id)
	})
	return
}

func (s *sPrompts) UpdateProject(ctx context.Context, req *api.ProjectUpdateReq) error {
	return g.Try(ctx, func(ctx context.Context) {
		var categoryId interface{}
		if req.CategoryId > 0 {
			categoryId = req.CategoryId
		}

		_, err := dao.Projects.Ctx(ctx).
			Where(dao.Projects.Columns().Id, req.Id).
			OmitEmpty().
			Update(do.Projects{
				Name:        req.Name,
				Description: req.Description,
				Color:       req.Color,
				CategoryId:  categoryId,
			})
		liberr.ErrIsNil(ctx, err, "更新项目失败")
	})
}

func (s *sPrompts) DeleteProject(ctx context.Context, projectId int) error {
	return g.Try(ctx, func(ctx context.Context) {
		_, err := dao.Projects.Ctx(ctx).
			Where(dao.Projects.Columns().Id, projectId).
			Delete()
		liberr.ErrIsNil(ctx, err, "删除项目失败")

		_, err = dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().ProjectId, projectId).
			Delete()
		liberr.ErrIsNil(ctx, err, "删除项目下的提示失败")
	})
}

func (s *sPrompts) GetProjectDetail(ctx context.Context, projectId int) (*model.ProjectInfo, error) {
	var project *model.ProjectInfo

	err := g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Projects.Ctx(ctx).
			LeftJoin("categories", "categories.id = projects.category_id").
			Where(dao.Projects.Columns().Id, projectId).
			Fields("projects.*, categories.name as category_name").
			One()
		liberr.ErrIsNil(ctx, err, "查询项目失败")
		if entity.IsEmpty() {
			gerror.New("项目不存在")
		}

		count, err := dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().ProjectId, projectId).
			Count()
		liberr.ErrIsNil(ctx, err, "查询提示数量失败")

		project = &model.ProjectInfo{
			Id:           int(entity[dao.Projects.Columns().Id].Int()),
			Name:         entity[dao.Projects.Columns().Name].String(),
			Description:  entity[dao.Projects.Columns().Description].String(),
			Color:        entity[dao.Projects.Columns().Color].String(),
			CategoryId:   int(entity[dao.Projects.Columns().CategoryId].Int()),
			CategoryName: entity["category_name"].String(),
			IsFavorite:   entity[dao.Projects.Columns().IsFavorite].Bool(),
			PromptCount:  count,
		}
	})

	return project, err
}

func (s *sPrompts) ListProjects(ctx context.Context, req *api.ProjectListReq) (total interface{}, projects []*model.ProjectInfo, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		m := dao.Projects.Ctx(ctx).
			LeftJoin("categories", "categories.id = projects.category_id").
			Where("1=1")

		if req.CategoryId > 0 {
			m = m.Where(dao.Projects.Columns().CategoryId, req.CategoryId)
		}

		if req.IsFavorite != nil {
			m = m.Where(dao.Projects.Columns().IsFavorite, *req.IsFavorite)
		}

		if req.Keyword != "" {
			columns := dao.Projects.Columns()
			m = m.Where(fmt.Sprintf("(prompts.%s like ? or prompts.%s like ?)",
				columns.Name, columns.Description),
				"%"+req.Keyword+"%", "%"+req.Keyword+"%")
		}

		m = m.Order("id desc")

		total, err = m.Count()
		liberr.ErrIsNil(ctx, err, "查询项目总数失败")

		var entities []gdb.Record
		entities, err = m.Fields("projects.*, categories.name as category_name").
			Page(req.PageNum, req.PageSize).
			All()
		liberr.ErrIsNil(ctx, err, "查询项目列表失败")

		projects = make([]*model.ProjectInfo, 0, len(entities))
		for _, entity := range entities {
			projectId := int(entity[dao.Projects.Columns().Id].Int())
			count, _ := dao.Prompts.Ctx(ctx).
				Where(dao.Prompts.Columns().ProjectId, projectId).
				Count()

			projects = append(projects, &model.ProjectInfo{
				Id:           projectId,
				Name:         entity[dao.Projects.Columns().Name].String(),
				Description:  entity[dao.Projects.Columns().Description].String(),
				Color:        entity[dao.Projects.Columns().Color].String(),
				CategoryId:   int(entity[dao.Projects.Columns().CategoryId].Int()),
				CategoryName: entity["category_name"].String(),
				IsFavorite:   entity[dao.Projects.Columns().IsFavorite].Bool(),
				PromptCount:  count,
			})
		}
	})

	return total, projects, err
}

func (s *sPrompts) ToggleProjectFavorite(ctx context.Context, projectId int) (isFavorite bool, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Projects.Ctx(ctx).
			Where(dao.Projects.Columns().Id, projectId).
			One()
		liberr.ErrIsNil(ctx, err, "查询项目失败")
		if entity.IsEmpty() {
			gerror.New("项目不存在")
		}

		currentFavorite := entity[dao.Projects.Columns().IsFavorite].Bool()
		newFavorite := !currentFavorite

		_, err = dao.Projects.Ctx(ctx).
			Where(dao.Projects.Columns().Id, projectId).
			Data(dao.Projects.Columns().IsFavorite, newFavorite).
			Update()
		liberr.ErrIsNil(ctx, err, "更新收藏状态失败")

		isFavorite = newFavorite
	})

	return isFavorite, err
}


func (s *sPrompts) PromptVersionDelete(ctx context.Context, versionId int) error {
	_, err := dao.PromptVersions.Ctx(ctx).Where(dao.PromptVersions.Columns().Id, versionId).Delete()
	return err
}

func (s *sPrompts) PromptVersionList(ctx context.Context, promptId int) ([]*model.PromptVersionInfo, error) {
	var versions []*model.PromptVersionInfo

	err := g.Try(ctx, func(ctx context.Context) {
		entities, err := dao.PromptVersions.Ctx(ctx).
			Where(dao.PromptVersions.Columns().PromptId, promptId).
			OrderDesc(dao.PromptVersions.Columns().CreatedAt).
			All()
		liberr.ErrIsNil(ctx, err, "查询版本列表失败")

		versions = make([]*model.PromptVersionInfo, 0, len(entities))
		for _, entity := range entities {
			versions = append(versions, &model.PromptVersionInfo{
				Id:          int(entity[dao.PromptVersions.Columns().Id].Int()),
				PromptId:    int(entity[dao.PromptVersions.Columns().PromptId].Int()),
				Version:     entity[dao.PromptVersions.Columns().Version].String(),
				Title:       entity[dao.PromptVersions.Columns().Title].String(),
				Description: entity[dao.PromptVersions.Columns().Description].String(),
				Content:     entity[dao.PromptVersions.Columns().Content].String(),
				Tags:        entity[dao.PromptVersions.Columns().Tags].String(),
				CategoryId:  int(entity[dao.PromptVersions.Columns().CategoryId].Int()),
				ProjectId:   int(entity[dao.PromptVersions.Columns().ProjectId].Int()),
				PublishNote: entity[dao.PromptVersions.Columns().PublishNote].String(),
				CreatedAt:   entity[dao.PromptVersions.Columns().CreatedAt].String(),
			})
		}
	})

	return versions, err
}

func (s *sPrompts) PromptRollback(ctx context.Context, promptId int, version string) error {
	return g.Try(ctx, func(ctx context.Context) {
		versionEntity, err := dao.PromptVersions.Ctx(ctx).
			Where(dao.PromptVersions.Columns().PromptId, promptId).
			Where(dao.PromptVersions.Columns().Version, version).
			One()
		liberr.ErrIsNil(ctx, err, "查询版本失败")
		if versionEntity.IsEmpty() {
			gerror.New("版本不存在")
		}

		_, err = dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			Data(dao.Prompts.Columns().Title, versionEntity[dao.PromptVersions.Columns().Title].String()).
			Data(dao.Prompts.Columns().Description, versionEntity[dao.PromptVersions.Columns().Description].String()).
			Data(dao.Prompts.Columns().Content, versionEntity[dao.PromptVersions.Columns().Content].String()).
			Data(dao.Prompts.Columns().Tags, versionEntity[dao.PromptVersions.Columns().Tags].String()).
			Update()
		liberr.ErrIsNil(ctx, err, "回滚失败")
	})
}

func (s *sPrompts) PromptPublish(ctx context.Context, promptId int, version string, publishNote string) error {
	return g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			One()
		liberr.ErrIsNil(ctx, err, "查询提示失败")
		if entity.IsEmpty() {
			gerror.New("提示不存在")
		}

		_, err = dao.PromptVersions.Ctx(ctx).Insert(do.PromptVersions{
			PromptId:    promptId,
			Version:     version,
			Title:       entity[dao.Prompts.Columns().Title].String(),
			Description: entity[dao.Prompts.Columns().Description].String(),
			Content:     entity[dao.Prompts.Columns().Content].String(),
			Tags:        entity[dao.Prompts.Columns().Tags].String(),
			CategoryId:  entity[dao.Prompts.Columns().CategoryId].Int(),
			ProjectId:   entity[dao.Prompts.Columns().ProjectId].Int(),
			PublishNote: publishNote,
		})
		liberr.ErrIsNil(ctx, err, "保存版本快照失败")

		_, err = dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			Data(dao.Prompts.Columns().Version, version).
			Data(dao.Prompts.Columns().PublishedVersion, version).
			Update()
		liberr.ErrIsNil(ctx, err, "发布失败")
	})
}

func (s *sPrompts) PromptSwitchVersion(ctx context.Context, promptId int, version string) error {
	return g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.PromptVersions.Ctx(ctx).
			Where(dao.PromptVersions.Columns().PromptId, promptId).
			Where(dao.PromptVersions.Columns().Version, version).
			One()
		liberr.ErrIsNil(ctx, err, "查询版本失败")
		if entity.IsEmpty() {
			gerror.New("版本不存在")
		}

		_, err = dao.Prompts.Ctx(ctx).
			Where(dao.Prompts.Columns().Id, promptId).
			Data(dao.Prompts.Columns().PublishedVersion, version).
			Update()
		liberr.ErrIsNil(ctx, err, "切换版本失败")
	})
}
