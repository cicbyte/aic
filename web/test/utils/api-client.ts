const API_BASE = 'http://localhost:3052/api/v1';

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

async function request<T = unknown>(method: string, path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

export const apiClient = {
  async createCategory(name: string, description = 'E2E测试'): Promise<number> {
    const res = await request<{ categoryId: number }>('POST', '/categories/add', { name, description });
    if (res.code !== 0) throw new Error(`创建分类失败: ${res.message}`);
    return res.data.categoryId;
  },

  async deleteCategory(id: number): Promise<void> {
    await request('DELETE', `/categories/del?id=${id}`);
  },

  async createProject(name: string, description = 'E2E测试'): Promise<number> {
    const res = await request<{ projectId: number }>('POST', '/projects/create', { name, description });
    if (res.code !== 0) throw new Error(`创建项目失败: ${res.message}`);
    return res.data.projectId;
  },

  async deleteProject(id: number): Promise<void> {
    await request('DELETE', `/projects/delete?id=${id}`);
  },

  async createPrompt(title: string, content = 'E2E测试内容', categoryId?: number, projectId?: number): Promise<number> {
    const body: Record<string, unknown> = { title, content };
    if (categoryId) body.categoryId = categoryId;
    if (projectId) body.projectId = projectId;
    const res = await request<{ id: number }>('POST', '/prompts/create', body);
    if (res.code !== 0) throw new Error(`创建提示词失败: ${res.message}`);
    return res.data.id;
  },

  async deletePrompt(id: number): Promise<void> {
    await request('DELETE', `/prompts/delete?id=${id}`);
  },

  async createSkill(name: string, categoryId: number): Promise<number> {
    const res = await request<{ skillId: number }>('POST', '/skills/create', { name, description: 'E2E测试', categoryId });
    if (res.code !== 0) throw new Error(`创建技能失败: ${res.message}`);
    return res.data.skillId;
  },

  async deleteSkill(id: number): Promise<void> {
    await request('DELETE', `/skills/delete?id=${id}`);
  },
};
