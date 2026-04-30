package dao

import (
	"github.com/cicbyte/aic/internal/dao/internal"
)

type internalPromptsDao = *internal.PromptsDao

type promptsDao struct {
	internalPromptsDao
}

var (
	Prompts = promptsDao{
		internal.NewPromptsDao(),
	}
)
