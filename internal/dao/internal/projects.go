package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

type ProjectsDao struct {
	table    string
	group    string
	columns  ProjectsColumns
	handlers []gdb.ModelHandler
}

type ProjectsColumns struct {
	Id          string
	Name        string
	Description string
	Color       string
	CategoryId  string
	IsFavorite  string
	CreatedAt   string
	UpdatedAt   string
}

var projectsColumns = ProjectsColumns{
	Id:          "id",
	Name:        "name",
	Description: "description",
	Color:       "color",
	CategoryId:  "category_id",
	IsFavorite:  "is_favorite",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
}

func NewProjectsDao(handlers ...gdb.ModelHandler) *ProjectsDao {
	return &ProjectsDao{
		group:    "default",
		table:    "projects",
		columns:  projectsColumns,
		handlers: handlers,
	}
}

func (dao *ProjectsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

func (dao *ProjectsDao) Table() string {
	return dao.table
}

func (dao *ProjectsDao) Columns() ProjectsColumns {
	return dao.columns
}

func (dao *ProjectsDao) Group() string {
	return dao.group
}

func (dao *ProjectsDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

func (dao *ProjectsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
