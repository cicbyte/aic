package model

// SkillsInfo 技能基本信息
type SkillsInfo struct {
	Id            int      `orm:"id" json:"id"`
	Name          string   `orm:"name" json:"name"`
	Description   string   `orm:"description" json:"description"`
	Version       string   `orm:"version" json:"version"`
	CategoryId    int      `orm:"category_id" json:"categoryId"`
	CategoryName  string   `orm:"category_name" json:"categoryName"` // 关联查询
	Status        int      `orm:"status" json:"status"`
	IsPublic      bool     `orm:"is_public" json:"isPublic"`
	IsValid       bool     `orm:"is_valid" json:"isValid"` // 是否通过校验
	FilePath      string   `orm:"file_path" json:"filePath"` // 磁盘相对路径
	License       string   `orm:"license" json:"license,omitempty"` // 许可证
	DownloadCount int      `orm:"download_count" json:"downloadCount"`
	StarCount     int      `orm:"star_count" json:"starCount"`
	FileSize      int64    `orm:"file_size" json:"fileSize"`
	CreatedAt     string   `orm:"created_at" json:"createdAt"`
	UpdatedAt     string   `orm:"updated_at" json:"updatedAt"`
	ValidatedAt   string   `orm:"validated_at" json:"validatedAt,omitempty"` // 校验时间
	Tags          []string `orm:"-" json:"tags"` // 标签列表
}

// SkillsDetailInfo 技能详情（包含文件和标签）
type SkillsDetailInfo struct {
	*SkillsInfo
	Tags    []string `json:"tags"`
}

// GitCommitInfo git 提交信息
type GitCommitInfo struct {
	Hash      string `json:"hash"`
	Author    string `json:"author"`
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
}

// GitHistoryResult git 历史查询结果
type GitHistoryResult struct {
	Commits   []GitCommitInfo `json:"commits"`
	IsGitRepo bool            `json:"isGitRepo"`
}

// FileNode 文件节点（用于文件树）
type FileNode struct {
	Id       string     `json:"id"`
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	Type     string     `json:"type"` // "file" or "folder"
	Content  string     `json:"content,omitempty"`
	Children []*FileNode `json:"children,omitempty"`
}
