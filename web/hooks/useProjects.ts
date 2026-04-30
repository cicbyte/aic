import { useState, useCallback } from 'react';
import { projectApi } from '../services/apiService';
import type { Project } from '../types';
import { useToast } from '../components/Toast';

export function useProjects() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadProjects = useCallback(async (params?: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) => {
    setLoading(true);
    try {
      const pageNum = params?.pageNum || 1;
      const pageSize = params?.pageSize || 20;
      const data = await projectApi.list({ pageNum, pageSize, categoryId: params?.categoryId, keyword: params?.keyword });
      setProjects(data.projectsList || []);
      setTotalCount(data.total as number || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProjectDetail = async (id: number): Promise<Project> => {
    return projectApi.detail(id);
  };

  const createProject = async (data: { name: string; description?: string; color?: string; categoryId?: number }) => {
    try {
      await projectApi.create(data);
      showToast('创建成功', 'success');
    } catch (err) {
      console.error('Failed to create project:', err);
      showToast('创建失败', 'error');
      throw err;
    }
  };

  const updateProject = async (data: { id: number; name: string; description?: string; color?: string; categoryId?: number }) => {
    try {
      await projectApi.update(data);
      showToast('更新成功', 'success');
    } catch (err) {
      console.error('Failed to update project:', err);
      showToast('更新失败', 'error');
      throw err;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectApi.delete(id);
      showToast('删除成功', 'success');
    } catch (err) {
      console.error('Failed to delete project:', err);
      showToast('删除失败', 'error');
      throw err;
    }
  };

  const toggleFavorite = async (id: number) => {
    try {
      const result = await projectApi.toggleFavorite(id);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: result.isFavorite } : p));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  return { projects, loading, totalCount, currentPage, loadProjects, getProjectDetail, createProject, updateProject, deleteProject, toggleFavorite };
}
