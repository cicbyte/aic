package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

type PromptsDao struct {
	table    string
	group    string
	columns  PromptsColumns
	handlers []gdb.ModelHandler
}

type PromptsColumns struct {
	Id               string
	Title            string
	Description      string
	Content          string
	Tags             string
	CategoryId       string
	ProjectId        string
	Version          string
	PublishedVersion string
	IsFavorite       string
	CreatedAt        string
	UpdatedAt        string
}

var promptsColumns = PromptsColumns{
	Id:               "id",
	Title:            "title",
	Description:      "description",
	Content:          "content",
	Tags:             "tags",
	CategoryId:       "category_id",
	ProjectId:        "project_id",
	Version:          "version",
	PublishedVersion: "published_version",
	IsFavorite:       "is_favorite",
	CreatedAt:        "created_at",
	UpdatedAt:        "updated_at",
}

func NewPromptsDao(handlers ...gdb.ModelHandler) *PromptsDao {
	return &PromptsDao{
		group:    "default",
		table:    "prompts",
		columns:  promptsColumns,
		handlers: handlers,
	}
}

func (dao *PromptsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

func (dao *PromptsDao) Table() string {
	return dao.table
}

func (dao *PromptsDao) Columns() PromptsColumns {
	return dao.columns
}

func (dao *PromptsDao) Group() string {
	return dao.group
}

func (dao *PromptsDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

func (dao *PromptsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
