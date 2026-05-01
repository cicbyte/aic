import { apiClient } from './api-client';

interface TrackedResource {
  type: 'category' | 'project' | 'prompt' | 'skill';
  id: number;
}

const tracked: TrackedResource[] = [];

export const dataCleaner = {
  track(type: TrackedResource['type'], id: number) {
    tracked.push({ type, id });
  },

  trackCategory(id: number) { this.track('category', id); },
  trackProject(id: number) { this.track('project', id); },
  trackPrompt(id: number) { this.track('prompt', id); },
  trackSkill(id: number) { this.track('skill', id); },

  async cleanupAll() {
    const errors: string[] = [];
    // reverse order: prompts first, then projects, then categories
    const order: TrackedResource['type'][] = ['prompt', 'skill', 'project', 'category'];

    for (const type of order) {
      const items = tracked.filter(r => r.type === type);
      for (const item of items) {
        try {
          switch (item.type) {
            case 'category': await apiClient.deleteCategory(item.id); break;
            case 'project': await apiClient.deleteProject(item.id); break;
            case 'prompt': await apiClient.deletePrompt(item.id); break;
            case 'skill': await apiClient.deleteSkill(item.id); break;
          }
        } catch (e) {
          errors.push(`清理 ${item.type}#${item.id} 失败: ${e}`);
        }
      }
    }

    tracked.length = 0;
    if (errors.length > 0) {
      console.warn('清理警告:', errors.join('\n'));
    }
  },

  getTracked(): readonly TrackedResource[] {
    return tracked;
  },
};
