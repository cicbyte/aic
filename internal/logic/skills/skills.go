package skills

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	api "github.com/cicbyte/aic/api/v1/skills"
	dao "github.com/cicbyte/aic/internal/dao"
	model "github.com/cicbyte/aic/internal/model"
	do "github.com/cicbyte/aic/internal/model/do"
	service "github.com/cicbyte/aic/internal/service"
	liberr "github.com/cicbyte/aic/library/liberr"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
	"github.com/mozillazg/go-pinyin"
)

func init() {
	service.RegisterSkills(New())
}

func New() *sSkills {
	return &sSkills{}
}

type sSkills struct{}

// Create 创建技能
func (s *sSkills) Create(ctx context.Context, req *api.CreateReq) (skillId int, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		filePath, err := generateSlugPath(req.Name)
		liberr.ErrIsNil(ctx, err, "生成路径失败")

		baseDir := "data/skills"
		skillDir := filepath.Join(baseDir, filePath)
		if !gfile.Exists(skillDir) {
			gfile.Mkdir(skillDir)
		}

		gitInit(skillDir)
		generateSkillMd(skillDir, filePath, req.Name, req.Description)
		gitCommitAll(skillDir, "Initial commit")

		result, err := dao.Skills.Ctx(ctx).Insert(do.Skills{
			Name:        req.Name,
			Description: req.Description,
			CategoryId:  req.CategoryId,
			FilePath:    filePath,
			Status:      1,
			IsPublic:    1,
			IsValid:     0,
		})
		liberr.ErrIsNil(ctx, err, "创建技能失败")

		id, err := result.LastInsertId()
		liberr.ErrIsNil(ctx, err, "获取ID失败")
		skillId = int(id)

		if len(req.Tags) > 0 {
			for _, tagName := range req.Tags {
				if tagName == "" {
					continue
				}
				_, err = dao.SkillTags.Ctx(ctx).Insert(do.SkillTags{
					SkillId: skillId,
					TagName: tagName,
				})
				liberr.ErrIsNil(ctx, err, "插入标签失败")
			}
		}
	})
	return
}

// Update 更新技能
func (s *sSkills) Update(ctx context.Context, req *api.UpdateReq) error {
	err := g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, req.Id).One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}
		oldFilePath := entity[dao.Skills.Columns().FilePath].String()

		_, err = dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, req.Id).
			Update(do.Skills{
				Name:        req.Name,
				Description: req.Description,
				CategoryId:  req.CategoryId,
			})
		liberr.ErrIsNil(ctx, err, "更新技能失败")

		newSlug := toSlug(req.Name)
		if newSlug != oldFilePath {
			newDir := filepath.Join("data/skills", newSlug)
			if gfile.Exists(newDir) {
				resolved, _ := generateSlugPath(req.Name)
				newSlug = resolved
				newDir = filepath.Join("data/skills", newSlug)
			}
			oldDir := filepath.Join("data/skills", oldFilePath)
			if gfile.Exists(oldDir) {
				if err := os.Rename(oldDir, newDir); err == nil {
					dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, req.Id).
						Update(do.Skills{FilePath: newSlug})
					gitCommitAll(newDir, "Rename to: "+req.Name)
				}
			}
		}

		_, err = dao.SkillTags.Ctx(ctx).
			Where(dao.SkillTags.Columns().SkillId, req.Id).
			Delete()
		liberr.ErrIsNil(ctx, err, "删除旧标签失败")

		if len(req.Tags) > 0 {
			for _, tagName := range req.Tags {
				if tagName == "" {
					continue
				}
				_, err = dao.SkillTags.Ctx(ctx).Insert(do.SkillTags{
					SkillId: req.Id,
					TagName: tagName,
				})
				liberr.ErrIsNil(ctx, err, "插入标签失败")
			}
		}
	})
	return err
}

// Delete 删除技能
func (s *sSkills) Delete(ctx context.Context, skillId int) error {
	err := g.Try(ctx, func(ctx context.Context) {
		// 获取技能信息（用于删除文件）
		entity, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		// 删除数据库记录
		_, err = dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			Delete()
		liberr.ErrIsNil(ctx, err, "删除技能失败")

		// 删除磁盘文件
		filePath := entity[dao.Skills.Columns().FilePath].String()
		skillDir := filepath.Join("data/skills", filePath)
		if gfile.Exists(skillDir) {
			os.RemoveAll(skillDir)
		}
	})
	return err
}

// GetDetail 获取技能详情
func (s *sSkills) GetDetail(ctx context.Context, skillId int) (*model.SkillsDetailInfo, error) {
	var detail *model.SkillsDetailInfo

	err := g.Try(ctx, func(ctx context.Context) {
		// 查询技能基本信息
		entity, err := dao.Skills.Ctx(ctx).
			LeftJoin("categories", "categories.id = skills.category_id").
			Where(dao.Skills.Columns().Id, skillId).
			Fields("skills.*, categories.name as category_name").
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		detail = &model.SkillsDetailInfo{
			SkillsInfo: &model.SkillsInfo{
				Id:            int(entity[dao.Skills.Columns().Id].Int()),
				Name:          entity[dao.Skills.Columns().Name].String(),
				Description:   entity[dao.Skills.Columns().Description].String(),
				Version:       entity[dao.Skills.Columns().Version].String(),
				CategoryId:    int(entity[dao.Skills.Columns().CategoryId].Int()),
				CategoryName:  entity["category_name"].String(),
				Status:        int(entity[dao.Skills.Columns().Status].Int()),
				IsPublic:      entity[dao.Skills.Columns().IsPublic].Bool(),
				IsValid:       entity[dao.Skills.Columns().IsValid].Bool(),
				FilePath:      entity[dao.Skills.Columns().FilePath].String(),
				License:       entity[dao.Skills.Columns().License].String(),
				DownloadCount: int(entity[dao.Skills.Columns().DownloadCount].Int()),
				StarCount:     int(entity[dao.Skills.Columns().StarCount].Int()),
				FileSize:      entity[dao.Skills.Columns().FileSize].Int64(),
			},
		}

		// 查询标签
		tags, err := dao.SkillTags.Ctx(ctx).
			Where(dao.SkillTags.Columns().SkillId, skillId).
			All()
		liberr.ErrIsNil(ctx, err, "查询标签失败")

		tagList := make([]string, 0, len(tags))
		for _, tag := range tags {
			tagName := tag[dao.SkillTags.Columns().TagName].String()
			if tagName != "" {
				tagList = append(tagList, tagName)
			}
		}
		detail.Tags = tagList
	})

	return detail, err
}

// List 获取技能列表
func (s *sSkills) List(ctx context.Context, req *api.ListReq) (total interface{}, skills []*model.SkillsInfo, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		m := dao.Skills.Ctx(ctx).
			LeftJoin("categories", "categories.id = skills.category_id").
			Where("1=1")

		// 分类筛选
		if req.CategoryId > 0 {
			m = m.Where(dao.Skills.Columns().CategoryId, req.CategoryId)
		}

		// 状态筛选
		if req.Status > 0 {
			m = m.Where(dao.Skills.Columns().Status, req.Status)
		}

		// 公开筛选
		if req.IsPublic != nil {
			m = m.Where(dao.Skills.Columns().IsPublic, *req.IsPublic)
		}

		// 关键词搜索
		if req.Keyword != "" {
			columns := dao.Skills.Columns()
			m = m.Where(fmt.Sprintf("(%s like ? or %s like ?)",
				columns.Name, columns.Description),
				"%"+req.Keyword+"%", "%"+req.Keyword+"%")
		}

		// 标签筛选
		if req.Tag != "" {
			m = m.Where("id IN (SELECT skill_id FROM skill_tags WHERE tag_name = ?)", req.Tag)
		}

		// 排序
		orderBy := req.OrderBy
		if orderBy == "" {
			orderBy = "id desc"
		}
		m = m.Order(orderBy)

		// 查询总数
		total, err = m.Count()
		liberr.ErrIsNil(ctx, err, "查询技能总数失败")

		// 分页查询
		var entities []gdb.Record
		entities, err = m.Fields("skills.*, categories.name as category_name").
			Page(req.PageNum, req.PageSize).
			All()
		liberr.ErrIsNil(ctx, err, "查询技能列表失败")

		// 转换结果
		skills = make([]*model.SkillsInfo, 0, len(entities))
		for _, entity := range entities {
			skillId := int(entity[dao.Skills.Columns().Id].Int())

			// 查询标签
			tagEntities, err := dao.SkillTags.Ctx(ctx).
				Where(dao.SkillTags.Columns().SkillId, skillId).
				All()
			var tagList []string
			if err == nil {
				tagList = make([]string, 0, len(tagEntities))
				for _, tag := range tagEntities {
					tagName := tag[dao.SkillTags.Columns().TagName].String()
					if tagName != "" {
						tagList = append(tagList, tagName)
					}
				}
			}

			skills = append(skills, &model.SkillsInfo{
				Id:            skillId,
				Name:          entity[dao.Skills.Columns().Name].String(),
				Description:   entity[dao.Skills.Columns().Description].String(),
				Version:       entity[dao.Skills.Columns().Version].String(),
				CategoryId:    int(entity[dao.Skills.Columns().CategoryId].Int()),
				CategoryName:  entity["category_name"].String(),
				Status:        int(entity[dao.Skills.Columns().Status].Int()),
				IsPublic:      entity[dao.Skills.Columns().IsPublic].Bool(),
				IsValid:       entity[dao.Skills.Columns().IsValid].Bool(),
				FilePath:      entity[dao.Skills.Columns().FilePath].String(),
				License:       entity[dao.Skills.Columns().License].String(),
				DownloadCount: int(entity[dao.Skills.Columns().DownloadCount].Int()),
				StarCount:     int(entity[dao.Skills.Columns().StarCount].Int()),
				FileSize:      entity[dao.Skills.Columns().FileSize].Int64(),
				Tags:          tagList,
			})
		}
	})

	return total, skills, err
}

// SaveFiles 保存技能文件到磁盘
func (s *sSkills) SaveFiles(ctx context.Context, skillId int, files []*model.FileNode) error {
	err := g.Try(ctx, func(ctx context.Context) {
		entity, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		filePath := entity[dao.Skills.Columns().FilePath].String()
		skillDir := filepath.Join("data/skills", filePath)

		writeFilesToDisk(skillDir, files, "")

		var totalSize int64 = 0
		for _, file := range files {
			totalSize += calculateFileSize(file)
		}

		_, err = dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			Update(do.Skills{
				FileSize: totalSize,
			})
		liberr.ErrIsNil(ctx, err, "更新文件大小失败")
	})

	return err
}

// 计算单个文件节点的大小（包含子节点）
func calculateFileSize(node *model.FileNode) int64 {
	var size int64 = 0
	if node.Type == "file" {
		size += int64(len(node.Content))
	}
	if node.Children != nil {
		for _, child := range node.Children {
			size += calculateFileSize(child)
		}
	}
	return size
}

// GetFiles 获取技能文件树
func (s *sSkills) GetFiles(ctx context.Context, skillId int) ([]*model.FileNode, error) {
	var files []*model.FileNode

	err := g.Try(ctx, func(ctx context.Context) {
		// 获取技能路径
		entity, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		filePath := entity[dao.Skills.Columns().FilePath].String()
		skillDir := filepath.Join("data/skills", filePath)

		// 检查目录是否存在，不存在则返回空数组
		if !gfile.Exists(skillDir) {
			files = []*model.FileNode{}
			return
		}

		// 扫描文件
		files, err = scanDirectory(skillDir, "")
		liberr.ErrIsNil(ctx, err, "扫描文件失败")
	})

	return files, err
}

// GenerateZip 生成技能ZIP包
func (s *sSkills) GenerateZip(ctx context.Context, skillId int) (zipData []byte, skillName string, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		// 获取技能信息
		entity, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		filePath := entity[dao.Skills.Columns().FilePath].String()
		skillName = entity[dao.Skills.Columns().Name].String()
		skillDir := filepath.Join("data/skills", filePath)

		// 检查目录是否存在
		if !gfile.Exists(skillDir) {
			liberr.ErrIsNil(ctx, gerror.New("技能目录不存在"), "")
			return
		}

		// 创建 ZIP 缓冲区
		buf := new(bytes.Buffer)
		zipWriter := zip.NewWriter(buf)

		// 遍历目录并添加文件到 ZIP
		err = filepath.Walk(skillDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// 获取相对路径
			relPath, err := filepath.Rel(skillDir, path)
			if err != nil {
				return err
			}

			// 跳过根目录
			if relPath == "." {
				return nil
			}

			// 创建 ZIP 条目（直接使用相对路径，不添加额外层级）
			zipPath := strings.ReplaceAll(relPath, "\\", "/")

			if info.IsDir() {
				_, err = zipWriter.Create(zipPath + "/")
				return err
			}

			// 添加文件
			writer, err := zipWriter.Create(zipPath)
			if err != nil {
				return err
			}

			fileData, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			_, err = writer.Write(fileData)
			return err
		})
		liberr.ErrIsNil(ctx, err, "打包文件失败")

		// 关闭 ZIP 写入器
		err = zipWriter.Close()
		liberr.ErrIsNil(ctx, err, "关闭ZIP失败")

		zipData = buf.Bytes()

		// 增加下载次数
		_ = s.IncrementDownload(ctx, skillId)
	})

	return zipData, skillName, err
}

// IncrementDownload 增加下载次数
func (s *sSkills) IncrementDownload(ctx context.Context, skillId int) error {
	err := g.Try(ctx, func(ctx context.Context) {
		_, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			Increment(dao.Skills.Columns().DownloadCount, 1)
		liberr.ErrIsNil(ctx, err, "更新下载次数失败")
	})
	return err
}

// Search 搜索技能
func (s *sSkills) Search(ctx context.Context, keyword string, page, pageSize int) (total interface{}, skills []*model.SkillsInfo, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		m := dao.Skills.Ctx(ctx).
			LeftJoin("categories", "categories.id = skills.category_id")

		if keyword != "" {
			columns := dao.Skills.Columns()
			m = m.Where(fmt.Sprintf("(%s like ? or %s like ?)",
				columns.Name, columns.Description),
				"%"+keyword+"%", "%"+keyword+"%")
		}

		// 查询总数
		total, err = m.Count()
		liberr.ErrIsNil(ctx, err, "查询技能总数失败")

		// 分页查询
		var entities []gdb.Record
		offset := (page - 1) * pageSize
		entities, err = m.Fields("skills.*, categories.name as category_name").
			Limit(pageSize).
			Offset(offset).
			Page(page, pageSize).
			All()
		liberr.ErrIsNil(ctx, err, "查询技能列表失败")

		// 转换结果
		skills = make([]*model.SkillsInfo, 0, len(entities))
		for _, entity := range entities {
			skills = append(skills, &model.SkillsInfo{
				Id:            int(entity[dao.Skills.Columns().Id].Int()),
				Name:          entity[dao.Skills.Columns().Name].String(),
				Description:   entity[dao.Skills.Columns().Description].String(),
				Version:       entity[dao.Skills.Columns().Version].String(),
				CategoryId:    int(entity[dao.Skills.Columns().CategoryId].Int()),
				CategoryName:  entity["category_name"].String(),
				Status:        int(entity[dao.Skills.Columns().Status].Int()),
				IsPublic:      entity[dao.Skills.Columns().IsPublic].Bool(),
				IsValid:       entity[dao.Skills.Columns().IsValid].Bool(),
				FilePath:      entity[dao.Skills.Columns().FilePath].String(),
				License:       entity[dao.Skills.Columns().License].String(),
				DownloadCount: int(entity[dao.Skills.Columns().DownloadCount].Int()),
				StarCount:     int(entity[dao.Skills.Columns().StarCount].Int()),
				FileSize:      entity[dao.Skills.Columns().FileSize].Int64(),
			})
		}
	})

	return total, skills, err
}

// ToggleFavorite 切换收藏状态
// 简单实现：每次调用增加/减少 star_count
// 客户端负责维护收藏状态
func (s *sSkills) ToggleFavorite(ctx context.Context, skillId int) (isFavorite bool, starCount int, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		// 获取当前收藏数
		entity, err := dao.Skills.Ctx(ctx).
			Where(dao.Skills.Columns().Id, skillId).
			One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")
		if entity.IsEmpty() {
			liberr.ErrIsNil(ctx, gerror.New("技能不存在"), "")
			return
		}

		currentCount := int(entity[dao.Skills.Columns().StarCount].Int())

		// 从请求体中获取是否收藏（需要从上下文获取，这里简化处理）
		// 客户端应该传递当前的收藏状态，然后我们切换它
		// 由于没有用户系统，我们简单地在每次调用时增加收藏数
		// 客户端负责维护自己的收藏状态

		// 这里我们返回当前的 star_count，让客户端决定如何更新
		starCount = currentCount
		isFavorite = false // 客户端维护此状态
	})

	return isFavorite, starCount, err
}

// GetFavorites 获取收藏的技能列表
// 由于没有用户系统，这个方法返回空列表
// 客户端应该自己维护收藏列表
func (s *sSkills) GetFavorites(ctx context.Context, page, pageSize int) (total interface{}, skills []*model.SkillsInfo, err error) {
	// 返回空列表，客户端应该自己维护收藏列表
	return 0, []*model.SkillsInfo{}, nil
}

// ============ 辅助函数 ============

func toSlug(name string) string {
	// 先用拼音转换中文
	a := pinyin.NewArgs()
	a.Style = pinyin.Normal
	words := pinyin.Pinyin(name, a)
	var b strings.Builder
	for _, syllables := range words {
		for _, s := range syllables {
			b.WriteString(s)
			b.WriteRune(' ')
		}
	}
	converted := b.String()
	if strings.TrimSpace(converted) == "" {
		converted = name
	}

	var result strings.Builder
	for _, r := range strings.ToLower(converted) {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			result.WriteRune(r)
		} else if r == ' ' || r == '_' || r == '-' {
			result.WriteRune('-')
		}
	}
	s := strings.Trim(result.String(), "-")
	s = collapseDashes(s)
	if s == "" {
		return "skill"
	}
	return s
}

func generateSkillMd(dirPath string, slug string, name string, description string) {
	desc := strings.ReplaceAll(description, `"`, `\"`)
	desc = strings.ReplaceAll(desc, "\n", " ")
	skillMd := fmt.Sprintf(`---
name: %s
description: "%s"
metadata:
  version: "1.0.0"
---

# %s

## Instructions

Describe what this skill does and how Claude should use it.

## Examples

Provide examples of using this skill.
`, slug, desc, name)
	_ = os.WriteFile(filepath.Join(dirPath, "SKILL.md"), []byte(skillMd), 0644)
}

func collapseDashes(s string) string {
	var b strings.Builder
	prevDash := false
	for _, c := range s {
		if c == '-' {
			if !prevDash {
				b.WriteRune(c)
			}
			prevDash = true
		} else {
			b.WriteRune(c)
			prevDash = false
		}
	}
	return b.String()
}

func generateSlugPath(name string) (string, error) {
	slug := toSlug(name)
	baseDir := "data/skills"
	candidate := slug

	for i := 0; i < 10; i++ {
		dir := filepath.Join(baseDir, candidate)
		if !gfile.Exists(dir) {
			return candidate, nil
		}
		if i == 0 {
			suffix := fmt.Sprintf("%06x", time.Now().UnixNano()%0xFFFFFF)
			candidate = fmt.Sprintf("%s-%s", slug, suffix)
		} else {
			suffix := fmt.Sprintf("%06x", time.Now().UnixNano()%0xFFFFFF)
			candidate = fmt.Sprintf("%s-%s-%d", slug, suffix, i)
		}
	}
	return candidate, nil
}

func isUUIDPath(s string) bool {
	return len(s) == 36 && strings.Count(s, "-") == 4
}

// 递归扫描目录并构建文件树
func scanDirectory(dirPath string, relativePath string) ([]*model.FileNode, error) {
	nodes := make([]*model.FileNode, 0)

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}
	fmt.Printf("[DEBUG] scanDirectory: dir=%s, entries=%d\n", dirPath, len(entries))

	for _, entry := range entries {
		name := entry.Name()
		fullPath := filepath.Join(dirPath, name)
		relPath := filepath.Join(relativePath, name)
			relPath = filepath.ToSlash(relPath)

		if entry.IsDir() {
			// 跳过隐藏目录
			if strings.HasPrefix(name, ".") {
				continue
			}
			// 递归扫描子目录
			children, err := scanDirectory(fullPath, relPath)
			if err != nil {
				continue
			}
			nodes = append(nodes, &model.FileNode{
				Id:       generateId(),
				Name:     name,
				Path:     relPath,
				Type:     "folder",
				Children: children,
			})
		} else {
			// 跳过隐藏文件和二进制文件
			if strings.HasPrefix(name, ".") || !isTextFile(name) {
				continue
			}
			// 读取文件内容
			content, _ := os.ReadFile(fullPath)
			nodes = append(nodes, &model.FileNode{
				Id:      generateId(),
				Name:    name,
				Path:    relPath,
				Type:    "file",
				Content: string(content),
			})
		}
	}

	fmt.Printf("[DEBUG] scanDirectory: returning %d nodes for dir=%s\n", len(nodes), dirPath)

	for _, node := range nodes {
		fmt.Printf("[DEBUG] scanDirectory: node: ID=%s, Name=%s, Type=%s, Children=%d\n", node.Id, node.Name, node.Type, len(node.Children))
	}

	return nodes, nil
}

// 写入文件到磁盘
func writeFilesToDisk(basePath string, files []*model.FileNode, relativePath string) error {
	fmt.Printf("[DEBUG] writeFilesToDisk: basePath=%s, relativePath=%s, files count=%d\n", basePath, relativePath, len(files))
	for _, file := range files {
		fullPath := filepath.Join(basePath, relativePath, file.Name)
		fmt.Printf("[DEBUG] writeFilesToDisk: writing %s (type=%s)\n", fullPath, file.Type)

		if file.Type == "folder" {
			// 创建目录
			if err := os.MkdirAll(fullPath, 0755); err != nil {
				return err
			}
			// 递归写入子文件
			if file.Children != nil {
				if err := writeFilesToDisk(basePath, file.Children, filepath.Join(relativePath, file.Name)); err != nil {
					return err
				}
			}
		} else {
			// 写入文件
			dir := filepath.Dir(fullPath)
			if err := os.MkdirAll(dir, 0755); err != nil {
				return err
			}
			if err := os.WriteFile(fullPath, []byte(file.Content), 0644); err != nil {
				return err
			}
		}
	}
	return nil
}

// 判断是否为文本文件
func isTextFile(filename string) bool {
	textExtensions := []string{
		".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv",
		".go", ".js", ".ts", ".py", ".java", ".c", ".cpp", ".h",
		".sh", ".bat", ".ps1", ".html", ".css", ".scss", ".less",
		".sql", ".conf", ".config", ".ini", ".toml",
	}
	ext := strings.ToLower(filepath.Ext(filename))
	for _, textExt := range textExtensions {
		if ext == textExt {
			return true
		}
	}
	return false
}

// 生成唯一ID
var idCounter uint64 = 0

func generateId() string {
	idCounter++
	return fmt.Sprintf("%d%d", time.Now().UnixNano(), idCounter)
}

// ImportZip 导入 ZIP 文件创建技能
func (s *sSkills) ImportZip(ctx context.Context, req *api.ImportZipReq) (skillId int, skillName string, err error) {
	err = g.Try(ctx, func(ctx context.Context) {
		files, name, err := parseZipFromPath(req.File)
		liberr.ErrIsNil(ctx, err, "解析ZIP文件失败")

		if name == "" {
			liberr.ErrIsNil(ctx, gerror.New("未找到 skill.md 或 skill.md 中未定义 name 字段"), "")
			return
		}
		skillName = name

		// 检查是否已存在同名技能
		var existingEntity gdb.Record
		existingEntity, err = dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Name, skillName).One()
		liberr.ErrIsNil(ctx, err, "查询技能失败")

		if !existingEntity.IsEmpty() && !req.Overwrite {
			liberr.ErrIsNil(ctx, gerror.New("技能名称已存在"), "")
			return
		}

		categoryId := req.CategoryId
		if categoryId == 0 {
			var categories []gdb.Record
			categories, err = dao.Categories.Ctx(ctx).All()
			liberr.ErrIsNil(ctx, err, "查询分类失败")
			if len(categories) == 0 {
				liberr.ErrIsNil(ctx, gerror.New("没有可用的分类，请先创建分类"), "")
				return
			}
			categoryId = int(categories[0][dao.Categories.Columns().Id].Int())
		}

		var totalSize int64
		for _, file := range files {
			totalSize += calculateFileSize(file)
		}

		if !existingEntity.IsEmpty() && req.Overwrite {
			// 覆盖：保留目录和 git 历史，只替换文件
			oldId := int(existingEntity[dao.Skills.Columns().Id].Int())
			oldFilePath := existingEntity[dao.Skills.Columns().FilePath].String()
			skillDir := filepath.Join("data/skills", oldFilePath)

			clearSkillFiles(skillDir)
			writeFilesToDisk(skillDir, files, "")
			gitCommitAll(skillDir, "Import from ZIP (overwrite): "+skillName)

			_, err = dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, oldId).
				Update(do.Skills{FileSize: totalSize})
			liberr.ErrIsNil(ctx, err, "更新技能失败")

			skillId = oldId
			return
		}

		// 新建
		filePath, err := generateSlugPath(skillName)
		liberr.ErrIsNil(ctx, err, "生成路径失败")

		skillDir := filepath.Join("data/skills", filePath)
		if !gfile.Exists(skillDir) {
			gfile.Mkdir(skillDir)
		}

		writeFilesToDisk(skillDir, files, "")
		gitInit(skillDir)
		gitCommitAll(skillDir, "Import from ZIP: "+skillName)

		result, err := dao.Skills.Ctx(ctx).Insert(do.Skills{
			Name:        skillName,
			Description: req.Description,
			CategoryId:  categoryId,
			FilePath:    filePath,
			Status:      1,
			IsPublic:    1,
			IsValid:     0,
			FileSize:    totalSize,
		})
		liberr.ErrIsNil(ctx, err, "创建技能失败")

		id, err := result.LastInsertId()
		liberr.ErrIsNil(ctx, err, "获取ID失败")
		skillId = int(id)
	})

	return skillId, skillName, err
}

// parseZipFromPath 从 ZIP 文件路径解析文件树
func parseZipFromPath(zipPath string) ([]*model.FileNode, string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, "", fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer r.Close()

	var skillName string
	nodes := make(map[string]*model.FileNode)

	for _, f := range r.File {
		// 跳过隐藏文件
		if strings.HasPrefix(f.Name, ".") || strings.Contains(f.Name, "/.") {
			continue
		}

		// 标准化路径
		fName := strings.TrimSuffix(f.Name, "/")
		if fName == "" {
			continue
		}

		parts := strings.Split(fName, "/")
		if len(parts) == 0 {
			continue
		}

		// 移除第一层目录（ZIP 包含的根目录）
		if len(parts) > 1 {
			relPath := strings.Join(parts[1:], "/")
			name := parts[len(parts)-1]

			if f.FileInfo().IsDir() {
				nodes[relPath] = &model.FileNode{
					Id:       generateId(),
					Name:     name,
					Path:     relPath,
					Type:     "folder",
					Children: []*model.FileNode{},
				}
				continue
			}

			// 跳过非文本文件
			if !isTextFile(name) {
				continue
			}

			rc, err := f.Open()
			if err != nil {
				continue
			}

			content, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				continue
			}

			nodes[relPath] = &model.FileNode{
				Id:      generateId(),
				Name:    name,
				Path:    relPath,
				Type:    "file",
				Content: string(content),
			}

			// 提取 skill.md 中的名称
			if strings.ToLower(name) == "skill.md" {
				skillName = extractSkillNameFromContent(string(content))
			}
		}
	}

	// 构建文件树
	tree := buildFileTreeFromMap(nodes)
	return tree, skillName, nil
}

// extractSkillNameFromContent 从 skill.md 内容提取名称
func extractSkillNameFromContent(content string) string {
	if !strings.Contains(content, "---") {
		return ""
	}

	lines := strings.Split(content, "\n")
	inYaml := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" {
			inYaml = !inYaml
			continue
		}
		if inYaml {
			if strings.HasPrefix(trimmed, "name:") || strings.HasPrefix(trimmed, "name :") {
				name := strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(trimmed, "name:"), "name :"))
				name = strings.Trim(name, "\"'")
				if name != "" {
					return name
				}
			}
		}
	}
	return ""
}

// buildFileTreeFromMap 从 map 构建文件树
func buildFileTreeFromMap(nodes map[string]*model.FileNode) []*model.FileNode {
	var rootNodes []*model.FileNode

	for _, node := range nodes {
		parentPath := filepath.Dir(node.Path)
		if parentPath == "." || parentPath == "" {
			rootNodes = append(rootNodes, node)
			continue
		}

		parent, exists := nodes[parentPath]
		if exists && parent.Type == "folder" {
			parent.Children = append(parent.Children, node)
		} else {
			rootNodes = append(rootNodes, node)
		}
	}

	return rootNodes
}

// GetGitHistory 获取技能 git 历史
func (s *sSkills) GetGitHistory(ctx context.Context, skillId int, maxCount int) (*model.GitHistoryResult, error) {
	if maxCount <= 0 {
		maxCount = 50
	}
	entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if err != nil {
		return nil, gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return nil, gerror.New("技能不存在")
	}
	filePath := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", filePath)
	if !isGitAvailable() {
		return &model.GitHistoryResult{IsGitRepo: false}, nil
	}
	commits, err := gitLog(skillDir, maxCount)
	if err != nil {
		return &model.GitHistoryResult{IsGitRepo: false}, nil
	}
	return &model.GitHistoryResult{Commits: commits, IsGitRepo: true}, nil
}

// GetGitFileContent 获取技能指定版本的文件内容
func (s *sSkills) GetGitFileContent(ctx context.Context, skillId int, commitHash string, filePath string) (content string, err error) {
	entity, e := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if e != nil {
		return "", gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return "", gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)
	content, err = gitShowFile(skillDir, commitHash, filePath)
	if err != nil {
		if strings.Contains(err.Error(), "not in") {
			return "", gerror.Newf("文件 %s 在此版本中不存在", filePath)
		}
		return "", gerror.New("获取文件内容失败")
	}
	return
}

// GetGitTree 获取技能指定版本的文件列表
func (s *sSkills) GetGitTree(ctx context.Context, skillId int, ref string) ([]string, error) {
	entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if err != nil {
		return nil, gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return nil, gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)
	return gitListFiles(skillDir, ref)
}

// GetGitDiff 获取技能两次提交之间的差异
func (s *sSkills) GetGitDiff(ctx context.Context, skillId int, fromHash string, toHash string) (diff string, err error) {
	entity, e := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if e != nil {
		return "", gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return "", gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)
	diff, err = gitDiff(skillDir, fromHash, toHash)
	if err != nil {
		return "", gerror.New("获取差异失败")
	}
	return
}

// CreateTag 创建版本标签
func (s *sSkills) CreateTag(ctx context.Context, skillId int, version string, note string) error {
	entity, e := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if e != nil {
		return gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)

	// 获取技能信息用于验证和修复 SKILL.md
	skillName := entity[dao.Skills.Columns().Name].String()
	skillDesc := entity[dao.Skills.Columns().Description].String()

	// 校验和修复 SKILL.md
	skillMdPath := filepath.Join(skillDir, "SKILL.md")
	var content string
	if gfile.Exists(skillMdPath) {
		content = gfile.GetContents(skillMdPath)
		// 验证和修复 SKILL.md
		updatedContent, err := validateAndFixSkillMd(content, skillName, skillDesc, version)
		if err != nil {
			return gerror.Newf("SKILL.md验证失败: %v", err)
		}
		content = updatedContent
	} else {
		// SKILL.md 不存在，创建新的
		content = generateDefaultSkillMd(skillName, skillDesc, version)
	}

	// 写入修复后的 SKILL.md
	if err := gfile.PutContents(skillMdPath, content); err != nil {
		return gerror.Newf("写入SKILL.md失败: %v", err)
	}

	gitCommitAll(skillDir, fmt.Sprintf("Release %s", version))

	e = gitCreateTag(skillDir, version, note)
	if e != nil {
		return gerror.Newf("创建标签失败: %v", e)
	}
	return nil
}

// ListTags 获取版本标签列表
func (s *sSkills) ListTags(ctx context.Context, skillId int) ([]model.SkillTagInfo, string, error) {
	entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if err != nil {
		return nil, "", gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return nil, "", gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)
	tags, err := gitListTags(skillDir)
	if err != nil {
		return []model.SkillTagInfo{}, "", nil
	}
	currentTag := gitCurrentTag(skillDir)
	return tags, currentTag, nil
}

// DeleteTag 删除版本标签
func (s *sSkills) DeleteTag(ctx context.Context, skillId int, tag string) error {
	entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if err != nil {
		return gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)

	err = gitDeleteTag(skillDir, tag)
	if err != nil {
		return gerror.Newf("删除标签失败: %v", err)
	}
	return nil
}

// CheckoutTag 回滚技能到指定版本
func (s *sSkills) CheckoutTag(ctx context.Context, skillId int, tag string) error {
	entity, err := dao.Skills.Ctx(ctx).Where(dao.Skills.Columns().Id, skillId).One()
	if err != nil {
		return gerror.New("查询技能失败")
	}
	if entity.IsEmpty() {
		return gerror.New("技能不存在")
	}
	fp := entity[dao.Skills.Columns().FilePath].String()
	skillDir := filepath.Join("data/skills", fp)

	err = gitCheckoutFiles(skillDir, tag)
	if err != nil {
		return gerror.Newf("回滚失败: %v", err)
	}
	gitCommitAll(skillDir, fmt.Sprintf("Rollback to %s", tag))
	return nil
}

// validateAndFixSkillMd 验证和修复 SKILL.md 文件
func validateAndFixSkillMd(content string, skillName string, skillDesc string, version string) (string, error) {
	lines := strings.Split(content, "\n")
	var result []string
	inYaml := false
	inMetadata := false

	// 检查的字段
	hasName := false
	hasDescription := false
	hasMetadata := false
	hasVersion := false

	// 第一遍：分析现有内容
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if trimmed == "---" {
			if !inYaml {
				inYaml = true
			} else {
				inYaml = false
				inMetadata = false
			}
			continue
		}

		if !inYaml {
			continue
		}

		// 检查 metadata 块
		if strings.HasPrefix(trimmed, "metadata:") {
			inMetadata = true
			hasMetadata = true
			continue
		}

		// 检查缩进，判断是否还在 metadata 块内
		if inMetadata && len(trimmed) > 0 && trimmed[0] != ' ' && trimmed[0] != '\t' {
			inMetadata = false
		}

		// 检查必须字段
		lowerTrimmed := strings.ToLower(trimmed)
		if strings.HasPrefix(lowerTrimmed, "name:") || strings.HasPrefix(lowerTrimmed, "name :") {
			hasName = true
		}
		if strings.HasPrefix(lowerTrimmed, "description:") || strings.HasPrefix(lowerTrimmed, "description :") {
			hasDescription = true
		}
		if inMetadata && (strings.HasPrefix(lowerTrimmed, "version:") || strings.HasPrefix(lowerTrimmed, "version :")) {
			hasVersion = true
		}
	}

	// 第二遍：重建内容，修复缺失的字段
	inYaml = false
	inMetadata = false
	yamlEndIndex := -1

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		if trimmed == "---" {
			if !inYaml {
				// YAML 开始
				inYaml = true
				result = append(result, line)
				continue
			} else {
				// YAML 结束
				inYaml = false
				inMetadata = false
				yamlEndIndex = i
				result = append(result, line)
				continue
			}
		}

		if !inYaml {
			result = append(result, line)
			continue
		}

		// 在 YAML 内部处理
		if strings.HasPrefix(trimmed, "metadata:") {
			inMetadata = true
			hasMetadata = true
			result = append(result, line)

			// 如果 metadata 块内没有 version，添加它
			if !hasVersion {
				result = append(result, fmt.Sprintf("  version: \"%s\"", version))
				hasVersion = true
			}
			continue
		}

		// 检查缩进判断是否还在 metadata 内
		if inMetadata && len(trimmed) > 0 && trimmed[0] != ' ' && trimmed[0] != '\t' {
			inMetadata = false
		}

		// 跳过 metadata 块内的旧 version 字段（因为我们已经添加了新的）
		if inMetadata && (strings.HasPrefix(trimmed, "version:") || strings.HasPrefix(trimmed, "version :")) {
			continue
		}

		// 更新 name 和 description 为数据库中的值（确保一致性）
		if strings.HasPrefix(trimmed, "name:") || strings.HasPrefix(trimmed, "name :") {
			result = append(result, fmt.Sprintf("name: %s", skillName))
			continue
		}
		if strings.HasPrefix(trimmed, "description:") || strings.HasPrefix(trimmed, "description :") {
			// 保留引号格式
			if strings.Contains(trimmed, `"`) {
				result = append(result, fmt.Sprintf("description: \"%s\"", skillDesc))
			} else {
				result = append(result, fmt.Sprintf("description: %s", skillDesc))
			}
			continue
		}

		result = append(result, line)
	}

	// 如果没有 YAML frontmatter，创建完整的
	if yamlEndIndex == -1 {
		// 没有找到 YAML 结束标记，说明没有 frontmatter
		return generateDefaultSkillMd(skillName, skillDesc, version), nil
	}

	// 检查缺失的字段并在 metadata 前插入
	finalResult := make([]string, 0, len(result)+10)
	yamlStarted := false

	for _, line := range result {
		trimmed := strings.TrimSpace(line)

		if trimmed == "---" {
			if !yamlStarted {
				yamlStarted = true
				finalResult = append(finalResult, line)

				// 在 --- 后添加缺失的字段（如果有）
				inserted := false
				if !hasMetadata {
					// 添加 metadata 块
					finalResult = append(finalResult, "metadata:")
					finalResult = append(finalResult, fmt.Sprintf("  version: \"%s\"", version))
					inserted = true
				} else if !hasVersion {
					// 有 metadata 但没有 version，这不应该发生，但以防万一
					// 这里不处理，因为上面已经在 metadata 后添加了
				}

				// 添加缺失的 name
				if !hasName && !inserted {
					finalResult = append(finalResult, fmt.Sprintf("name: %s", skillName))
				}

				// 添加缺失的 description
				if !hasDescription && !inserted {
					desc := strings.ReplaceAll(skillDesc, `"`, `\"`)
					finalResult = append(finalResult, fmt.Sprintf("description: \"%s\"", desc))
				}

				continue
			}
		}

		finalResult = append(finalResult, line)
	}

	return strings.Join(finalResult, "\n"), nil
}

// generateDefaultSkillMd 生成默认的 SKILL.md 内容
func generateDefaultSkillMd(skillName string, skillDesc string, version string) string {
	escapedDesc := strings.ReplaceAll(skillDesc, `"`, `\"`)
	escapedDesc = strings.ReplaceAll(escapedDesc, "\n", " ")

	return fmt.Sprintf(`---
name: %s
description: "%s"
metadata:
  version: "%s"
---

# %s

## Instructions

Describe what this skill does and how Claude should use it.

## Examples

Provide examples of using this skill.
`, skillName, escapedDesc, version, skillName)
}
