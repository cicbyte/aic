// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// SkillsDao is the data access object for the table skills.
type SkillsDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  SkillsColumns      // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// SkillsColumns defines and stores column names for the table skills.
type SkillsColumns struct {
	Id            string //
	Name          string //
	Description   string //
	Version       string //
	CategoryId    string //
	Status        string //
	IsPublic      string //
	IsValid       string //
	FilePath      string //
	License       string //
	DownloadCount string //
	StarCount     string //
	FileSize      string //
	CreatedAt     string //
	UpdatedAt     string //
	ValidatedAt   string //
}

// skillsColumns holds the columns for the table skills.
var skillsColumns = SkillsColumns{
	Id:            "id",
	Name:          "name",
	Description:   "description",
	Version:       "version",
	CategoryId:    "category_id",
	Status:        "status",
	IsPublic:      "is_public",
	IsValid:       "is_valid",
	FilePath:      "file_path",
	License:       "license",
	DownloadCount: "download_count",
	StarCount:     "star_count",
	FileSize:      "file_size",
	CreatedAt:     "created_at",
	UpdatedAt:     "updated_at",
	ValidatedAt:   "validated_at",
}

// NewSkillsDao creates and returns a new DAO object for table data access.
func NewSkillsDao(handlers ...gdb.ModelHandler) *SkillsDao {
	return &SkillsDao{
		group:    "default",
		table:    "skills",
		columns:  skillsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *SkillsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *SkillsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *SkillsDao) Columns() SkillsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *SkillsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *SkillsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *SkillsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
