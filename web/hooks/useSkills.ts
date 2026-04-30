import { useState, useCallback } from 'react';
import { skillApi } from '../services/apiService';
import type { Skill, SkillDetail, FileNode } from '../types';
import { useToast } from '../components/Toast';

export function useSkills() {
  const { showToast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadSkills = useCallback(async (params?: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string; tag?: string }) => {
    setLoading(true);
    try {
      const pageNum = params?.pageNum || 1;
      const pageSize = params?.pageSize || 20;
      const data = await skillApi.list({ pageNum, pageSize, categoryId: params?.categoryId, keyword: params?.keyword, tag: params?.tag });
      setSkills(data.skillsList || []);
      setTotalCount(data.total as number || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSkillDetail = async (id: number): Promise<SkillDetail> => {
    return skillApi.detail(id);
  };

  const createSkill = async (data: { name: string; description: string; categoryId: number; tags?: string[] }) => {
    try {
      await skillApi.create(data);
      showToast('创建成功', 'success');
    } catch (err) {
      console.error('Failed to create skill:', err);
      showToast('创建失败', 'error');
      throw err;
    }
  };

  const updateSkill = async (data: { id: number; name: string; description: string; categoryId: number; tags?: string[] }) => {
    try {
      await skillApi.update(data);
      showToast('更新成功', 'success');
    } catch (err) {
      console.error('Failed to update skill:', err);
      showToast('更新失败', 'error');
      throw err;
    }
  };

  const deleteSkill = async (id: number) => {
    try {
      await skillApi.delete(id);
      showToast('删除成功', 'success');
    } catch (err) {
      console.error('Failed to delete skill:', err);
      showToast('删除失败', 'error');
      throw err;
    }
  };

  const saveFiles = async (skillId: number, files: FileNode[]) => {
    try {
      await skillApi.saveFiles(skillId, files);
      showToast('保存成功', 'success');
    } catch (err) {
      console.error('Failed to save files:', err);
      showToast('保存失败', 'error');
      throw err;
    }
  };

  const toggleFavorite = async (id: number) => {
    try {
      const result = await skillApi.toggleFavorite(id);
      setSkills(prev => prev.map(s => s.id === id ? { ...s, isFavorite: result.isFavorite } : s));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const importZip = async (file: File, description?: string, categoryId?: number) => {
    try {
      const result = await skillApi.importZip(file, description, categoryId);
      showToast(`导入成功: ${result.name}`, 'success');
      return result;
    } catch (err) {
      console.error('Failed to import zip:', err);
      showToast('导入失败', 'error');
      throw err;
    }
  };

  return { skills, loading, totalCount, currentPage, loadSkills, getSkillDetail, createSkill, updateSkill, deleteSkill, saveFiles, toggleFavorite, importZip };
}
