import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { useToast } from './Toast';
import { skillApi } from '../services/apiService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import type { Category } from '../types';

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: Category[];
}

export const CreateSkillModal: React.FC<CreateSkillModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  categories,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
    }
  }, [isOpen, categories]);

  const handleSubmit = async () => {
    if (!name.trim()) { showToast('请输入技能名称', 'warning'); return; }
    setIsSubmitting(true);
    try {
      await skillApi.create({
        name: name.trim(),
        description: description.trim(),
        categoryId: categoryId ? Number(categoryId) : 0,
      });
      showToast('创建成功', 'success');
      onCreated();
    } catch (err) {
      showToast('创建失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>创建技能</SheetTitle>
          <SheetDescription>创建一个新的 Claude 技能包</SheetDescription>
        </SheetHeader>
        <div className="px-6 flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1.5">技能名称 <span className="text-red-400">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：PDF 工具" disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单描述这个技能的用途" rows={3} disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">分类</label>
            <SearchableSelect
              options={categories.map(c => ({ value: String(c.id), label: c.name }))}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="选择分类"
              allLabel="全部分类"
              data-testid="category-select"
            />
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
