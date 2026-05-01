package do

type Prompts struct {
	Id               interface{}
	Title            interface{}
	Description      interface{}
	Content          interface{}
	Tags             interface{}
	CategoryId       interface{}
	ProjectId        interface{}
	Version          interface{}
	PublishedVersion interface{}
	IsFavorite       interface{}
	CreatedAt        interface{}
	UpdatedAt        interface{}
}

type PromptVersions struct {
	Id          interface{}
	PromptId    interface{}
	Version     interface{}
	Title       interface{}
	Description interface{}
	Content     interface{}
	Tags        interface{}
	CategoryId  interface{}
	ProjectId   interface{}
	PublishNote interface{}
	CreatedAt   interface{}
}
