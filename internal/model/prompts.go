package model

type PromptInfo struct {
	Id           int    `orm:"id" json:"id"`
	Title        string `orm:"title" json:"title"`
	Description  string `orm:"description" json:"description"`
	Content      string `orm:"content" json:"content"`
	CategoryId   int    `orm:"category_id" json:"categoryId"`
	CategoryName string `orm:"-" json:"categoryName,omitempty"`
	ProjectId    int    `orm:"project_id" json:"projectId"`
	Version          string `orm:"version" json:"version"`
	PublishedVersion string `orm:"published_version" json:"publishedVersion"`
	IsFavorite       bool   `orm:"is_favorite" json:"isFavorite"`
	CreatedAt    string `orm:"created_at" json:"createdAt"`
	UpdatedAt    string `orm:"updated_at" json:"updatedAt"`
}

type PromptVersionInfo struct {
	Id          int    `orm:"id" json:"id"`
	PromptId    int    `orm:"prompt_id" json:"promptId"`
	Version     string `orm:"version" json:"version"`
	Title       string `orm:"title" json:"title"`
	Description string `orm:"description" json:"description"`
	Content     string `orm:"content" json:"content"`
	Tags        string `orm:"tags" json:"tags"`
	CategoryId  int    `orm:"category_id" json:"categoryId"`
	ProjectId   int    `orm:"project_id" json:"projectId"`
	CreatedAt   string `orm:"created_at" json:"createdAt"`
}

type ProjectInfo struct {
	Id           int    `orm:"id" json:"id"`
	Name         string `orm:"name" json:"name"`
	Description  string `orm:"description" json:"description"`
	Color        string `orm:"color" json:"color"`
	CategoryId   int    `orm:"category_id" json:"categoryId"`
	CategoryName string `orm:"-" json:"categoryName,omitempty"`
	IsFavorite   bool   `orm:"is_favorite" json:"isFavorite"`
	PromptCount  int    `orm:"-" json:"promptCount"`
	CreatedAt    string `orm:"created_at" json:"createdAt"`
	UpdatedAt    string `orm:"updated_at" json:"updatedAt"`
}
