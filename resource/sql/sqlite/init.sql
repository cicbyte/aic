-- aic 技能管理平台 - SQLite 数据库初始化脚本
-- 数据库文件: data/aic.db
-- 执行方式: sqlite3 data/aic.db < init.sql

-- ============================================
-- 1. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

-- ============================================
-- 2. 技能表
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    category_id INTEGER,
    status INTEGER NOT NULL DEFAULT 1,
    is_public INTEGER NOT NULL DEFAULT 1,
    is_valid INTEGER NOT NULL DEFAULT 0,
    file_path TEXT NOT NULL,
    license TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    star_count INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
CREATE INDEX IF NOT EXISTS idx_skills_is_public ON skills(is_public);
CREATE INDEX IF NOT EXISTS idx_skills_is_valid ON skills(is_valid);
CREATE INDEX IF NOT EXISTS idx_skills_file_path ON skills(file_path);

-- ============================================
-- 3. 技能标签表
-- ============================================
CREATE TABLE IF NOT EXISTS skill_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(skill_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_tags_tag_name ON skill_tags(tag_name);

-- ============================================
-- 4. 技能文件表
-- ============================================
CREATE TABLE IF NOT EXISTS skill_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    is_directory INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skill_files_skill_id ON skill_files(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_files_file_path ON skill_files(file_path);

-- ============================================
-- 5. 项目表
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    category_id INTEGER,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_favorite ON projects(is_favorite);

-- ============================================
-- 6. 提示词表
-- ============================================
CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    tags TEXT,
    category_id INTEGER,
    project_id INTEGER,
    version TEXT DEFAULT '1.0.0',
    published_version TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);

-- ============================================
-- 6.1 提示词版本表
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    tags TEXT,
    category_id INTEGER,
    project_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_version ON prompt_versions(prompt_id, version);

-- ============================================
-- 7. 项目文件表
-- ============================================
CREATE TABLE IF NOT EXISTS project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'file',
    content TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES project_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_parent_id ON project_files(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(path);

-- ============================================
-- 8. 插入示例数据
-- ============================================
INSERT INTO categories (name, description, icon, sort) VALUES
('技术', '技术相关分类', 'tech', 100),
('生活', '生活相关分类', 'life', 90),
('学习', '学习相关分类', 'study', 80);

INSERT INTO skills (name, description, category_id, file_path, status, is_public, is_valid) VALUES
('pdf', 'Use this skill whenever user wants to do anything with PDF files.', 1, 'pdf', 1, 1, 1),
('mcp-builder', 'Guide for creating high-quality MCP servers.', 1, 'mcp-builder', 1, 1, 1),
('skill-creator', 'Guide for creating effective skills.', 1, 'skill-creator', 1, 1, 1);

-- ============================================
-- 9. 完成提示
-- ============================================
SELECT '✅ 数据库初始化完成！';
