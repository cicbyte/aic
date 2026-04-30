package dao

import (
	"github.com/cicbyte/aic/internal/dao/internal"
)

type internalProjectsDao = *internal.ProjectsDao

type projectsDao struct {
	internalProjectsDao
}

var (
	Projects = projectsDao{
		internal.NewProjectsDao(),
	}
)
