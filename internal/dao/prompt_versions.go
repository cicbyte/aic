package dao

import (
	"github.com/cicbyte/aic/internal/dao/internal"
)

type internalPromptVersionsDao = *internal.PromptVersionsDao

type promptVersionsDao struct {
	internalPromptVersionsDao
}

var (
	PromptVersions = promptVersionsDao{
		internal.NewPromptVersionsDao(),
	}
)
