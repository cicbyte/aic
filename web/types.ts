export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  sort: number;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  version: string;
  categoryId: number;
  categoryName?: string;
  status: number;
  isPublic: boolean;
  isValid: boolean;
  filePath: string;
  downloadCount: number;
  starCount: number;
  fileSize: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SkillDetail extends Skill {
  files?: FileNode[];
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

export interface Prompt {
  id: number;
  title: string;
  description: string;
  content: string;
  categoryId: number;
  categoryName?: string;
  projectId: number;
  version: string;
  publishedVersion: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: number;
  promptId: number;
  version: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  categoryId: number;
  projectId: number;
  publishNote?: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  categoryId: number;
  categoryName?: string;
  isFavorite: boolean;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  timestamp: string;
  message: string;
}

export type ViewMode = 'dashboard' | 'skills' | 'prompts' | 'projects' | 'categories' | 'settings';
