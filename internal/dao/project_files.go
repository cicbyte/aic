package dao

import (
	"github.com/cicbyte/aic/internal/dao/internal"
)

type internalProjectFilesDao = *internal.ProjectFilesDao

type projectFilesDao struct {
	internalProjectFilesDao
}

var (
	ProjectFiles = projectFilesDao{
		internal.NewProjectFilesDao(),
	}
)
