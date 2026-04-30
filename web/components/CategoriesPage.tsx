import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Loader2, FolderTree, Search, Trash2 } from 'lucide-react';
import { useContextMenu } from './ContextMenu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useToast } from './Toast';
import type { Category, Skill, Prompt, Project } from '../types';

interface CategoriesPageProps {
  categories: Category[];
  loading: boolean;
  skills: Skill[];
  prompts: Prompt[];
  projects: Project[];
  createCategory: (data: { name: string; description: string; icon?: string; sort?: number }) => Promise<void>;
  updateCategory: (id: number, data: Partial<{ name: string; description: string; icon: string; sort: number }>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories, loading, skills, prompts, projects,
  createCategory, updateCategory, deleteCategory,
}) => {
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSort, setFormSort] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ctx = useContextMenu();

  const countMap = useMemo(() => {
    const map: Record<number, { skills: number; prompts: number; projects: number }> = {};
    for (const cat of categories) map[cat.id] = { skills: 0, prompts: 0, projects: 0 };
    for (const s of skills) { if (s.categoryId && map[s.categoryId]) map[s.categoryId].skills++; }
    for (const p of prompts) { if (p.categoryId && map[p.categoryId]) map[p.categoryId].prompts++; }
    for (const p of projects) { if (p.categoryId && map[p.categoryId]) map[p.categoryId].projects++; }
    return map;
  }, [categories, skills, prompts, projects]);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sort - b.sort), [categories]);

  const filteredCategories = useMemo(() => {
    if (!searchKeyword.trim()) return sortedCategories;
    const kw = searchKeyword.toLowerCase();
    return sortedCategories.filter(c => c.name.toLowerCase().includes(kw) || (c.description && c.description.toLowerCase().includes(kw)));
  }, [sortedCategories, searchKeyword]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormSort(categories.length > 0 ? Math.max(...categories.map(c => c.sort)) + 1 : 0);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormDescription(cat.description);
    setFormSort(cat.sort);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { showToast('请输入分类名称', 'warning'); return; }
    setIsSubmitting(true);
    try {
      if (editingId === null) {
        await createCategory({ name: formName.trim(), description: formDescription.trim(), icon: 'folder', sort: formSort });
      } else {
        await updateCategory(editingId, { name: formName.trim(), description: formDescription.trim(), sort: formSort });
      }
      setDialogOpen(false);
    } catch (err) {} finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteCategory(id); } catch (err) {}
  };

  const totalAssoc = (id: number) => { const c = countMap[id]; return c ? c.skills + c.prompts + c.projects : 0; };

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {ctx.menu}
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索分类..." className="h-8 pl-8 text-xs" />
          </div>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-xs">{categories.length} 个分类</Badge>
          <Button size="sm" onClick={openCreateDialog}><Plus size={14} className="mr-1" />创建分类</Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : filteredCategories.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 px-6 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              <div className="w-8" />
              <div className="flex-1">名称</div>
              <div className="w-48">关联内容</div>
              <div className="w-8">排序</div>
              <div className="w-16" />
            </div>
            <div className="divide-y divide-border">
            {filteredCategories.map(cat => {
              const counts = countMap[cat.id] || { skills: 0, prompts: 0, projects: 0 };
              const total = counts.skills + counts.prompts + counts.projects;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onContextMenu={(e) => ctx.show(e, [
                    { label: '编辑', icon: <Edit3 size={14} />, onClick: () => openEditDialog(cat) },
                    { divider: true, label: '删除', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(cat.id) },
                  ])}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderTree size={15} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.description ? <span className="text-xs text-muted-foreground ml-2">{cat.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {counts.skills > 0 && <Badge variant="secondary" className="text-[10px] h-5">{counts.skills} 技能</Badge>}
                    {counts.prompts > 0 && <Badge variant="secondary" className="text-[10px] h-5">{counts.prompts} 提示词</Badge>}
                    {counts.projects > 0 && <Badge variant="secondary" className="text-[10px] h-5">{counts.projects} 项目</Badge>}
                    {total === 0 && <span className="text-[10px] text-muted-foreground/60">空</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 w-8 text-right shrink-0">#{cat.sort}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(cat)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"><Edit3 size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></Button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : searchKeyword ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search size={40} className="opacity-20 mb-3" />
            <p className="text-sm">未找到匹配 "{searchKeyword}" 的分类</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderTree size={40} className="opacity-20 mb-3" />
            <p className="text-sm">暂无分类</p>
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId === null ? '创建分类' : '编辑分类'}</SheetTitle>
            <SheetDescription>{editingId === null ? '添加一个新的分类' : `编辑分类 "${formName}"`}</SheetDescription>
          </SheetHeader>
          <div className="px-6 flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-1.5">名称 <span className="text-red-400">*</span></label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="分类名称" autoFocus disabled={isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">描述</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="分类描述（可选）" rows={3} disabled={isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">排序</label>
              <Input type="number" value={formSort} onChange={(e) => setFormSort(Number(e.target.value))} placeholder="排序号" disabled={isSubmitting} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>取消</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <Edit3 size={16} className="mr-1" />}保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
