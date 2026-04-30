import { useState, useEffect, useCallback } from 'react';
import { categoryApi } from '../services/apiService';
import type { Category } from '../types';
import { useToast } from '../components/Toast';

export function useCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryApi.list();
      setCategories(data.categoriesList || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (data: { name: string; description: string; icon?: string; sort?: number }) => {
    try {
      await categoryApi.add(data);
      await loadCategories();
      showToast('创建成功', 'success');
    } catch (err) {
      console.error('Failed to create category:', err);
      showToast('创建失败', 'error');
      throw err;
    }
  };

  const updateCategory = async (id: number, data: Partial<{ name: string; description: string; icon: string; sort: number }>) => {
    try {
      await categoryApi.edit(id, data);
      await loadCategories();
      showToast('更新成功', 'success');
    } catch (err) {
      console.error('Failed to update category:', err);
      showToast('更新失败', 'error');
      throw err;
    }
  };

  const deleteCategory = async (id: number) => {
    const name = categories.find(c => c.id === id)?.name || '';
    try {
      await categoryApi.delete(id);
      await loadCategories();
      showToast(`"${name}" 删除成功`, 'success');
    } catch (err) {
      console.error('Failed to delete category:', err);
      showToast(`"${name}" 删除失败`, 'error');
      throw err;
    }
  };

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return { categories, loading, loadCategories, createCategory, updateCategory, deleteCategory };
}
