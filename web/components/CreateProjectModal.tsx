import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { useToast } from './Toast';
import { projectApi } from '../services/apiService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import type { Category } from '../types';

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899',
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: Category[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen, onClose, onCreated, categories,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setName(''); setDescription(''); setColor(PRESET_COLORS[0]); setCategoryId(''); }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) { showToast('请输入项目名称', 'warning'); return; }
    setIsSubmitting(true);
    try {
      await projectApi.create({
        name: name.trim(), description: description.trim(), color,
        categoryId: categoryId ? Number(categoryId) : undefined,
      });
      showToast('创建成功', 'success');
      onCreated();
    } catch (err) {
      showToast('创建失败', 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>创建项目</SheetTitle>
          <SheetDescription>创建一个提示词项目来组织管理相关提示词</SheetDescription>
        </SheetHeader>
        <div className="px-6 flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1.5">项目名称 <span className="text-red-400">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：客服系统" disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单描述这个项目" rows={3} disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">颜色</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">分类</label>
            <SearchableSelect options={categories.map(c => ({ value: String(c.id), label: c.name }))} value={categoryId} onChange={setCategoryId} placeholder="选择分类" allLabel="无分类" />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}
            创建
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
