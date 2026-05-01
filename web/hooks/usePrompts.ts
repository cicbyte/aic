import { useState, useCallback } from 'react';
import { promptApi } from '../services/apiService';
import type { Prompt, PromptVersion } from '../types';
import { useToast } from '../components/Toast';

export function usePrompts() {
  const { showToast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPrompts = useCallback(async (params?: { pageNum?: number; pageSize?: number; projectId?: number; categoryId?: number; isFavorite?: boolean; keyword?: string }) => {
    setLoading(true);
    try {
      const pageNum = params?.pageNum || 1;
      const pageSize = params?.pageSize || 20;
      const data = await promptApi.list({ pageNum, pageSize, projectId: params?.projectId, categoryId: params?.categoryId, isFavorite: params?.isFavorite, keyword: params?.keyword });
      setPrompts(data.promptsList || []);
      setTotalCount(data.total as number || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPromptDetail = async (id: number): Promise<Prompt> => {
    return promptApi.detail(id);
  };

  const createPrompt = async (data: { title: string; description?: string; content?: string; categoryId?: number; projectId?: number }) => {
    try {
      await promptApi.create(data);
      showToast('创建成功', 'success');
    } catch (err) {
      console.error('Failed to create prompt:', err);
      showToast('创建失败', 'error');
      throw err;
    }
  };

  const updatePrompt = async (data: { id: number; title: string; description?: string; content?: string; categoryId?: number; projectId?: number }) => {
    try {
      await promptApi.update(data);
      showToast('更新成功', 'success');
    } catch (err) {
      console.error('Failed to update prompt:', err);
      showToast('更新失败', 'error');
      throw err;
    }
  };

  const deletePrompt = async (id: number) => {
    const title = prompts.find(p => p.id === id)?.title || '';
    try {
      await promptApi.delete(id);
      await loadPrompts();
      showToast(`"${title}" 删除成功`, 'success');
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      showToast(`"${title}" 删除失败`, 'error');
      throw err;
    }
  };

  const toggleFavorite = async (id: number) => {
    try {
      const result = await promptApi.toggleFavorite(id);
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: result.isFavorite } : p));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const loadVersions = async (promptId: number): Promise<PromptVersion[]> => {
    const data = await promptApi.versions(promptId);
    return data.versions || [];
  };

  const rollbackVersion = async (promptId: number, version: string) => {
    try {
      await promptApi.rollback(promptId, version);
      showToast(`已回滚到 v${version}`, 'success');
    } catch (err) {
      console.error('Failed to rollback:', err);
      showToast('回滚失败', 'error');
      throw err;
    }
  };

  const publishVersion = async (promptId: number, version: string) => {
    try {
      await promptApi.publish(promptId, version);
      showToast(`已发布 v${version}`, 'success');
    } catch (err) {
      console.error('Failed to publish:', err);
      showToast('发布失败', 'error');
      throw err;
    }
  };

  const switchVersion = async (promptId: number, version: string) => {
    try {
      await promptApi.switchVersion(promptId, version);
      showToast(`已切换到 v${version}`, 'success');
    } catch (err) {
      console.error('Failed to switch version:', err);
      showToast('切换版本失败', 'error');
      throw err;
    }
  };

  return { prompts, loading, totalCount, currentPage, loadPrompts, getPromptDetail, createPrompt, updatePrompt, deletePrompt, toggleFavorite, loadVersions, rollbackVersion, publishVersion, switchVersion };
}
