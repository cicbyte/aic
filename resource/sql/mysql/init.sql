-- aic 技能管理平台 - MySQL 数据库初始化脚本
-- 数据库: aic
-- 执行方式: mysql -u root -p aic < init.sql

-- ============================================
-- 1. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(255) NOT NULL COMMENT '分类名称，唯一',
    `description` TEXT NOT NULL COMMENT '分类描述',
    `icon` VARCHAR(512) DEFAULT NULL COMMENT '分类图标URL或标识',
    `sort` INT(11) NOT NULL DEFAULT 0 COMMENT '排序，数字越大越靠前',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_sort` (`sort`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 2. 技能表
-- ============================================
CREATE TABLE IF NOT EXISTS `skills` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '技能ID',
    `name` VARCHAR(255) NOT NULL COMMENT '技能名称',
    `description` TEXT COMMENT '技能描述',
    `version` VARCHAR(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
    `category_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1=发布，0=草稿',
    `is_public` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开：1=是，0=否',
    `is_valid` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '校验状态：1=通过，0=未校验',
    `file_path` VARCHAR(512) NOT NULL COMMENT '技能文件存储路径',
    `license` VARCHAR(255) DEFAULT NULL COMMENT '许可证信息',
    `download_count` INT(11) NOT NULL DEFAULT 0 COMMENT '下载次数',
    `star_count` INT(11) NOT NULL DEFAULT 0 COMMENT '收藏次数',
    `file_size` BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `validated_at` TIMESTAMP NULL DEFAULT NULL COMMENT '校验时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_public` (`is_public`),
    KEY `idx_is_valid` (`is_valid`),
    KEY `idx_file_path` (`file_path`),
    CONSTRAINT `fk_skills_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能表';

-- ============================================
-- 3. 技能标签表
-- ============================================
CREATE TABLE IF NOT EXISTS `skill_tags` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    `skill_id` INT(11) UNSIGNED NOT NULL COMMENT '技能ID',
    `tag_name` VARCHAR(50) NOT NULL COMMENT '标签名',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_skill_tag` (`skill_id`, `tag_name`),
    KEY `idx_tag_name` (`tag_name`),
    CONSTRAINT `fk_skill_tags_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能标签表';

-- ============================================
-- 4. 技能文件表
-- ============================================
CREATE TABLE IF NOT EXISTS `skill_files` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文件ID',
    `skill_id` INT(11) UNSIGNED NOT NULL COMMENT '技能ID',
    `file_path` VARCHAR(512) NOT NULL COMMENT '文件路径',
    `file_type` VARCHAR(50) DEFAULT NULL COMMENT '文件类型',
    `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
    `file_size` BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    `is_directory` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否目录：1=是，0=否',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_skill_id` (`skill_id`),
    KEY `idx_file_path` (`file_path`),
    CONSTRAINT `fk_skill_files_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能文件表';

-- ============================================
-- 5. 项目表
-- ============================================
CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目ID',
    `name` VARCHAR(255) NOT NULL COMMENT '项目名称',
    `description` TEXT COMMENT '项目描述',
    `color` VARCHAR(20) DEFAULT '#3b82f6' COMMENT '项目颜色',
    `category_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `is_favorite` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否收藏：1=是，0=否',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_is_favorite` (`is_favorite`),
    CONSTRAINT `fk_projects_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- ============================================
-- 6. 提示词表
-- ============================================
CREATE TABLE IF NOT EXISTS `prompts` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '提示词ID',
    `title` VARCHAR(255) NOT NULL COMMENT '标题',
    `description` TEXT COMMENT '描述',
    `content` LONGTEXT COMMENT '内容',
    `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签，逗号分隔',
    `category_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `project_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '项目ID',
    `version` VARCHAR(50) DEFAULT '1.0.0' COMMENT '版本号',
    `published_version` VARCHAR(50) DEFAULT NULL COMMENT '发布版本号',
    `is_favorite` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否收藏：1=是，0=否',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_is_favorite` (`is_favorite`),
    CONSTRAINT `fk_prompts_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词表';

-- ============================================
-- 7. 提示词版本表
-- ============================================
CREATE TABLE IF NOT EXISTS `prompt_versions` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '版本ID',
    `prompt_id` INT(11) UNSIGNED NOT NULL COMMENT '提示词ID',
    `version` VARCHAR(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
    `title` VARCHAR(255) NOT NULL COMMENT '标题',
    `description` TEXT COMMENT '描述',
    `content` LONGTEXT COMMENT '内容',
    `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签',
    `category_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `project_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '项目ID',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_prompt_version` (`prompt_id`, `version`),
    CONSTRAINT `fk_prompt_versions_prompt` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词版本表';

-- ============================================
-- 7. 项目文件表
-- ============================================
CREATE TABLE IF NOT EXISTS `project_files` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文件ID',
    `project_id` INT(11) UNSIGNED NOT NULL COMMENT '项目ID',
    `parent_id` INT(11) UNSIGNED DEFAULT NULL COMMENT '父目录ID',
    `name` VARCHAR(255) NOT NULL COMMENT '文件名',
    `path` VARCHAR(512) NOT NULL COMMENT '文件路径',
    `type` VARCHAR(20) NOT NULL DEFAULT 'file' COMMENT '类型：file=文件，folder=文件夹',
    `content` LONGTEXT COMMENT '文件内容',
    `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_path` (`path`),
    CONSTRAINT `fk_project_files_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_project_files_parent` FOREIGN KEY (`parent_id`) REFERENCES `project_files`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目文件表';

-- ============================================
-- 8. 插入示例数据
-- ============================================
INSERT INTO `categories` (`name`, `description`, `icon`, `sort`) VALUES
('技术', '技术相关分类', 'tech', 100),
('生活', '生活相关分类', 'life', 90),
('学习', '学习相关分类', 'study', 80);

INSERT INTO `skills` (`name`, `description`, `category_id`, `file_path`, `status`, `is_public`, `is_valid`) VALUES
('pdf', 'Use this skill whenever user wants to do anything with PDF files.', 1, 'pdf', 1, 1, 1),
('mcp-builder', 'Guide for creating high-quality MCP servers.', 1, 'mcp-builder', 1, 1, 1),
('skill-creator', 'Guide for creating effective skills.', 1, 'skill-creator', 1, 1, 1);

-- ============================================
-- 9. 完成提示
-- ============================================
SELECT '✅ 数据库初始化完成！' AS '状态';
SELECT '📊 已创建 7 张表：categories, skills, skill_tags, skill_files, projects, prompts, project_files' AS '表信息';
