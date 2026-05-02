import type { Category, Skill, SkillDetail, FileNode, Prompt, PromptVersion, Project, SkillTagInfo } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  const json = await response.json();
  if (json.code !== 0) throw new Error(json.message || '请求失败');
  return json.data;
}

// ============ Category API ============

export const categoryApi = {
  list: () => request<{ categoriesList: Category[] }>('/categories/list'),
  detail: (id: number) => request<Category>(`/categories/detail?id=${id}`),
  add: (data: { name: string; description: string; icon?: string; sort?: number }) =>
    request<{}>('/categories/add', { method: 'POST', body: JSON.stringify(data) }),
  edit: (id: number, data: Partial<{ name: string; description: string; icon: string; sort: number }>) =>
    request<{}>('/categories/edit', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: number) =>
    request<{}>(`/categories/del?id=${id}`, { method: 'DELETE' }),
  batchDelete: (ids: number[]) =>
    request<{}>('/categories/batchdel', { method: 'DELETE', body: JSON.stringify({ ids }) }),
};

// ============ Skill API ============

export const skillApi = {
  list: (params: { pageNum: number; pageSize: number; categoryId?: number; keyword?: string; tag?: string }) => {
    let url = `/skills/list?pageNum=${params.pageNum}&pageSize=${params.pageSize}`;
    if (params.categoryId) url += `&categoryId=${params.categoryId}`;
    if (params.keyword) url += `&keyword=${encodeURIComponent(params.keyword)}`;
    if (params.tag) url += `&tag=${encodeURIComponent(params.tag)}`;
    return request<{ skillsList: Skill[]; total: number }>(url);
  },
  detail: (id: number) => request<SkillDetail>(`/skills/detail?id=${id}`),
  create: (data: { name: string; description: string; categoryId: number; tags?: string[] }) =>
    request<{ skillId: number }>('/skills/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: number; name: string; description: string; categoryId: number; tags?: string[] }) =>
    request<{}>('/skills/update', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{}>(`/skills/delete?id=${id}`, { method: 'DELETE' }),
  saveFiles: (skillId: number, files: FileNode[]) =>
    request<{}>('/skills/save-files', { method: 'POST', body: JSON.stringify({ id: skillId, files }) }),
  getFiles: (skillId: number) =>
    request<{ files: FileNode[] }>(`/skills/files?id=${skillId}`),
  download: (skillId: number) => {
    window.open(`${API_BASE}/skills/download?id=${skillId}`, '_blank');
  },
  importZip: async (file: File, description?: string, categoryId?: number, overwrite?: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (categoryId) formData.append('categoryId', String(categoryId));
    if (overwrite) formData.append('overwrite', 'true');
    const response = await fetch(`${API_BASE}/skills/import-zip`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.code !== 0) throw new Error(result.message || '导入失败');
    return result.data as { skillId: number; name: string };
  },
  toggleFavorite: (id: number) =>
    request<{ isFavorite: boolean }>('/skills/toggle-favorite', { method: 'POST', body: JSON.stringify({ skillId: id }) }),
  favorites: () => request<{ skillsList: Skill[]; total: number }>('/skills/favorites'),
  gitHistory: (skillId: number, maxCount?: number) => {
    let url = `/skills/git-history?id=${skillId}`;
    if (maxCount) url += `&maxCount=${maxCount}`;
    return request<{ commits: import('../types').GitCommit[]; isGitRepo: boolean }>(url);
  },
  gitFileContent: (skillId: number, commit: string, path: string) =>
    request<{ content: string }>(`/skills/git-file?id=${skillId}&commit=${commit}&path=${encodeURIComponent(path)}`),
  gitDiff: (skillId: number, from: string, to: string) =>
    request<{ diff: string }>(`/skills/git-diff?id=${skillId}&from=${from}&to=${to}`),
  tagCreate: (skillId: number, version: string, note?: string) =>
    request<{}>('/skills/tag-create', { method: 'POST', body: JSON.stringify({ id: skillId, version, note }) }),
  tagList: (skillId: number) =>
    request<{ tags: SkillTagInfo[]; currentTag: string }>(`/skills/tag-list?id=${skillId}`),
  tagDelete: (skillId: number, tag: string) =>
    request<{}>('/skills/tag-delete', { method: 'POST', body: JSON.stringify({ id: skillId, tag }) }),
  tagCheckout: (skillId: number, tag: string) =>
    request<{}>('/skills/tag-checkout', { method: 'POST', body: JSON.stringify({ id: skillId, tag }) }),
};

// ============ Prompt API ============

export const promptApi = {
  list: (params: { pageNum: number; pageSize: number; projectId?: number; categoryId?: number; isFavorite?: boolean; keyword?: string }) => {
    let url = `/prompts/list?pageNum=${params.pageNum}&pageSize=${params.pageSize}`;
    if (params.projectId) url += `&projectId=${params.projectId}`;
    if (params.categoryId) url += `&categoryId=${params.categoryId}`;
    if (params.isFavorite !== undefined) url += `&isFavorite=${params.isFavorite}`;
    if (params.keyword) url += `&keyword=${encodeURIComponent(params.keyword)}`;
    return request<{ promptsList: Prompt[]; total: number }>(url);
  },
  detail: (id: number) => request<Prompt>(`/prompts/detail?id=${id}`),
  create: (data: { title: string; description?: string; content?: string; categoryId?: number; projectId?: number }) =>
    request<{ id: number; promptId: number }>('/prompts/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: number; title: string; description?: string; content?: string; categoryId?: number; projectId?: number }) =>
    request<{}>('/prompts/update', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{}>(`/prompts/delete?id=${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: number) =>
    request<{ isFavorite: boolean }>('/prompts/toggle-favorite', { method: 'POST', body: JSON.stringify({ promptId: id }) }),
  versions: (promptId: number) =>
    request<{ versions: PromptVersion[] }>(`/prompts/versions?promptId=${promptId}`),
  deleteVersion: (versionId: number) =>
    request<{}>(`/prompts/version-delete?id=${versionId}`, { method: 'DELETE' }),
  rollback: (promptId: number, version: string) =>
    request<{}>('/prompts/rollback', { method: 'POST', body: JSON.stringify({ promptId, version }) }),
  publish: (promptId: number, version: string, publishNote?: string) =>
    request<{}>('/prompts/publish', { method: 'POST', body: JSON.stringify({ promptId, version, publishNote }) }),
  switchVersion: (promptId: number, version: string) =>
    request<{}>('/prompts/switch-version', { method: 'POST', body: JSON.stringify({ promptId, version }) }),
};

// ============ Project API ============

export const projectApi = {
  list: (params: { pageNum: number; pageSize: number; categoryId?: number; keyword?: string }) => {
    let url = `/projects/list?pageNum=${params.pageNum}&pageSize=${params.pageSize}`;
    if (params.categoryId) url += `&categoryId=${params.categoryId}`;
    if (params.keyword) url += `&keyword=${encodeURIComponent(params.keyword)}`;
    return request<{ projectsList: Project[]; total: number }>(url);
  },
  detail: (id: number) => request<Project>(`/projects/detail?id=${id}`),
  create: (data: { name: string; description?: string; color?: string; categoryId?: number }) =>
    request<{ id: number }>('/projects/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: number; name: string; description?: string; color?: string; categoryId?: number }) =>
    request<{}>('/projects/update', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{}>(`/projects/delete?id=${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: number) =>
    request<{ isFavorite: boolean }>('/projects/toggle-favorite', { method: 'POST', body: JSON.stringify({ projectId: id }) }),
};

// ============ Health API ============

export const healthApi = {
  check: () => request<{ status: string; message: string }>('/health'),
  detail: () => request<{ status: string; message: string; checks: unknown[]; uptime: string; version: string }>('/health/detail'),
};
