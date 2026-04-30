package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

type ProjectFilesDao struct {
	table    string
	group    string
	columns  ProjectFilesColumns
	handlers []gdb.ModelHandler
}

type ProjectFilesColumns struct {
	Id        string
	ProjectId string
	ParentId  string
	Name      string
	Path      string
	Type      string
	Content   string
	SortOrder string
	CreatedAt string
	UpdatedAt string
}

var projectFilesColumns = ProjectFilesColumns{
	Id:        "id",
	ProjectId: "project_id",
	ParentId:  "parent_id",
	Name:      "name",
	Path:      "path",
	Type:      "type",
	Content:   "content",
	SortOrder: "sort_order",
	CreatedAt: "created_at",
	UpdatedAt: "updated_at",
}

func NewProjectFilesDao(handlers ...gdb.ModelHandler) *ProjectFilesDao {
	return &ProjectFilesDao{
		group:    "default",
		table:    "project_files",
		columns:  projectFilesColumns,
		handlers: handlers,
	}
}

func (dao *ProjectFilesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

func (dao *ProjectFilesDao) Table() string {
	return dao.table
}

func (dao *ProjectFilesDao) Columns() ProjectFilesColumns {
	return dao.columns
}

func (dao *ProjectFilesDao) Group() string {
	return dao.group
}

func (dao *ProjectFilesDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

func (dao *ProjectFilesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
