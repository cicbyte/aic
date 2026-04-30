// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// SkillFilesDao is the data access object for the table skill_files.
type SkillFilesDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  SkillFilesColumns  // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// SkillFilesColumns defines and stores column names for the table skill_files.
type SkillFilesColumns struct {
	Id          string //
	SkillId     string //
	FilePath    string //
	FileType    string //
	FileName    string //
	FileSize    string //
	IsDirectory string //
	CreatedAt   string //
}

// skillFilesColumns holds the columns for the table skill_files.
var skillFilesColumns = SkillFilesColumns{
	Id:          "id",
	SkillId:     "skill_id",
	FilePath:    "file_path",
	FileType:    "file_type",
	FileName:    "file_name",
	FileSize:    "file_size",
	IsDirectory: "is_directory",
	CreatedAt:   "created_at",
}

// NewSkillFilesDao creates and returns a new DAO object for table data access.
func NewSkillFilesDao(handlers ...gdb.ModelHandler) *SkillFilesDao {
	return &SkillFilesDao{
		group:    "default",
		table:    "skill_files",
		columns:  skillFilesColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *SkillFilesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *SkillFilesDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *SkillFilesDao) Columns() SkillFilesColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *SkillFilesDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *SkillFilesDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *SkillFilesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
