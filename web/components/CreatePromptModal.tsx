import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { useToast } from './Toast';
import { promptApi } from '../services/apiService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import type { Category, Project } from '../types';

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id?: number) => void;
  categories: Category[];
  projects: Project[];
}

export const CreatePromptModal: React.FC<CreatePromptModalProps> = ({
  isOpen, onClose, onCreated, categories, projects,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setTitle(''); setDescription(''); setCategoryId(''); setProjectId(''); }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) { showToast('请输入标题', 'warning'); return; }
    setIsSubmitting(true);
    try {
      const result = await promptApi.create({
        title: title.trim(), description: description.trim(),
        categoryId: categoryId ? Number(categoryId) : undefined,
        projectId: projectId ? Number(projectId) : undefined,
      });
      showToast('创建成功', 'success');
      onCreated(result.id);
    } catch (err) {
      showToast('创建失败', 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>创建提示词</SheetTitle>
          <SheetDescription>创建一个新的提示词模板</SheetDescription>
        </SheetHeader>
        <div className="px-6 flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1.5">标题 <span className="text-red-400">*</span></label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="提示词标题" disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单描述这个提示词的用途" rows={3} disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">分类</label>
            <SearchableSelect options={categories.map(c => ({ value: String(c.id), label: c.name }))} value={categoryId} onChange={setCategoryId} placeholder="选择分类" allLabel="无分类" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">项目</label>
            <SearchableSelect options={projects.map(p => ({ value: String(p.id), label: p.name }))} value={projectId} onChange={setProjectId} placeholder="选择项目" allLabel="无项目" />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}
            创建
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
