package controller

import (
	"context"
	"os"

	api "github.com/cicbyte/aic/api/v1/skills"
	service "github.com/cicbyte/aic/internal/service"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

var Skills = skillsController{}

type skillsController struct {
	BaseController
}

func (c *skillsController) Create(ctx context.Context, req *api.CreateReq) (res *api.CreateRes, err error) {
	res = new(api.CreateRes)
	id, err := service.Skills().Create(ctx, req)
	res.SkillId = id
	return
}

func (c *skillsController) Update(ctx context.Context, req *api.UpdateReq) (res *api.UpdateRes, err error) {
	res = new(api.UpdateRes)
	err = service.Skills().Update(ctx, req)
	return
}

func (c *skillsController) Delete(ctx context.Context, req *api.DeleteReq) (res *api.DeleteRes, err error) {
	res = new(api.DeleteRes)
	err = service.Skills().Delete(ctx, req.Id)
	return
}

func (c *skillsController) List(ctx context.Context, req *api.ListReq) (res *api.ListRes, err error) {
	res = new(api.ListRes)
	total, list, err := service.Skills().List(ctx, req)
	res.Total = total
	res.SkillsList = list
	return
}

func (c *skillsController) Detail(ctx context.Context, req *api.DetailReq) (res *api.DetailRes, err error) {
	res = new(api.DetailRes)
	detail, err := service.Skills().GetDetail(ctx, req.Id)
	res.SkillsDetailInfo = detail
	return
}

func (c *skillsController) SaveFiles(ctx context.Context, req *api.SaveFilesReq) (res *api.SaveFilesRes, err error) {
	res = new(api.SaveFilesRes)
	err = service.Skills().SaveFiles(ctx, req.Id, req.Files)
	return
}

func (c *skillsController) GetFiles(ctx context.Context, req *api.GetFilesReq) (res *api.GetFilesRes, err error) {
	res = new(api.GetFilesRes)
	files, err := service.Skills().GetFiles(ctx, req.Id)
	res.Files = files
	return
}

func (c *skillsController) ToggleFavorite(ctx context.Context, req *api.ToggleFavoriteReq) (res *api.ToggleFavoriteRes, err error) {
	res = new(api.ToggleFavoriteRes)
	isFavorite, starCount, err := service.Skills().ToggleFavorite(ctx, req.SkillId)
	res.IsFavorite = isFavorite
	res.StarCount = starCount
	return
}

func (c *skillsController) GetFavorites(ctx context.Context, req *api.GetFavoritesReq) (res *api.GetFavoritesRes, err error) {
	res = new(api.GetFavoritesRes)
	total, list, err := service.Skills().GetFavorites(ctx, req.PageNum, req.PageSize)
	res.Total = total
	res.SkillsList = list
	return
}

func (c *skillsController) ImportZip(ctx context.Context, req *api.ImportZipReq) (res *api.ImportZipRes, err error) {
	res = new(api.ImportZipRes)

	r := g.RequestFromCtx(ctx)
	file := r.GetUploadFiles("file")
	if len(file) == 0 {
		err = gerror.New("请选择ZIP文件")
		return
	}

	uploadFile := file[0]
	header, err := uploadFile.Open()
	if err != nil {
		err = gerror.New("打开上传文件失败")
		return
	}
	defer header.Close()

	tmpFile, err := os.CreateTemp("", "import-*.zip")
	if err != nil {
		err = gerror.New("创建临时文件失败")
		return
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)

	if _, err = tmpFile.ReadFrom(header); err != nil {
		tmpFile.Close()
		err = gerror.New("保存上传文件失败")
		return
	}
	tmpFile.Close()

	req.File = tmpPath

	skillId, skillName, err := service.Skills().ImportZip(ctx, req)
	res.SkillId = skillId
	res.Name = skillName
	return
}

func (c *skillsController) GetGitHistory(ctx context.Context, req *api.GetGitHistoryReq) (res *api.GetGitHistoryRes, err error) {
	res = new(api.GetGitHistoryRes)
	result, err := service.Skills().GetGitHistory(ctx, req.Id, req.MaxCount)
	res.GitHistoryResult = result
	return
}

func (c *skillsController) GetGitFileContent(ctx context.Context, req *api.GetGitFileContentReq) (res *api.GetGitFileContentRes, err error) {
	res = new(api.GetGitFileContentRes)
	content, err := service.Skills().GetGitFileContent(ctx, req.Id, req.Commit, req.Path)
	res.Content = content
	return
}

func (c *skillsController) GetGitDiff(ctx context.Context, req *api.GetGitDiffReq) (res *api.GetGitDiffRes, err error) {
	res = new(api.GetGitDiffRes)
	diff, err := service.Skills().GetGitDiff(ctx, req.Id, req.From, req.To)
	res.Diff = diff
	return
}

func (c *skillsController) CreateTag(ctx context.Context, req *api.TagCreateReq) (res *api.TagCreateRes, err error) {
	res = new(api.TagCreateRes)
	err = service.Skills().CreateTag(ctx, req.Id, req.Version, req.Note)
	return
}

func (c *skillsController) ListTags(ctx context.Context, req *api.TagListReq) (res *api.TagListRes, err error) {
	res = new(api.TagListRes)
	tags, err := service.Skills().ListTags(ctx, req.Id)
	res.Tags = tags
	return
}

func (c *skillsController) DeleteTag(ctx context.Context, req *api.TagDeleteReq) (res *api.TagDeleteRes, err error) {
	res = new(api.TagDeleteRes)
	err = service.Skills().DeleteTag(ctx, req.Id, req.Tag)
	return
}

func (c *skillsController) CheckoutTag(ctx context.Context, req *api.TagCheckoutReq) (res *api.TagCheckoutRes, err error) {
	res = new(api.TagCheckoutRes)
	err = service.Skills().CheckoutTag(ctx, req.Id, req.Tag)
	return
}
