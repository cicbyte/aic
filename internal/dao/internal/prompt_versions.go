package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

type PromptVersionsDao struct {
	table    string
	group    string
	columns  PromptVersionsColumns
	handlers []gdb.ModelHandler
}

type PromptVersionsColumns struct {
	Id          string
	PromptId    string
	Version     string
	Title       string
	Description string
	Content     string
	Tags        string
	CategoryId  string
	ProjectId   string
	PublishNote string
	CreatedAt   string
}

var promptVersionsColumns = PromptVersionsColumns{
	Id:          "id",
	PromptId:    "prompt_id",
	Version:     "version",
	Title:       "title",
	Description: "description",
	Content:     "content",
	Tags:        "tags",
	CategoryId:  "category_id",
	ProjectId:   "project_id",
	PublishNote: "publish_note",
	CreatedAt:   "created_at",
}

func NewPromptVersionsDao(handlers ...gdb.ModelHandler) *PromptVersionsDao {
	return &PromptVersionsDao{
		group:    "default",
		table:    "prompt_versions",
		columns:  promptVersionsColumns,
		handlers: handlers,
	}
}

func (dao *PromptVersionsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

func (dao *PromptVersionsDao) Table() string {
	return dao.table
}

func (dao *PromptVersionsDao) Columns() PromptVersionsColumns {
	return dao.columns
}

func (dao *PromptVersionsDao) Group() string {
	return dao.group
}

func (dao *PromptVersionsDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

func (dao *PromptVersionsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
