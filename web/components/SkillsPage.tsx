import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Upload, Loader2, Cpu, ChevronLeft, ChevronRight, Star, Trash2, Eye, Edit3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useContextMenu } from './ContextMenu';
import SearchableSelect from './SearchableSelect';
import type { Skill, Category } from '../types';

interface SkillsPageProps {
  skills: Skill[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  loadSkills: (params?: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) => void;
  categories: Category[];
  onCreateSkill: () => void;
  onImportZip: (file: File) => void;
  onToggleFavorite: (id: number) => void;
  onSkillClick: (id: number) => void;
  onDeleteSkill: (id: number) => void;
}

const PAGE_SIZE = 20;

const formatTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export const SkillsPage: React.FC<SkillsPageProps> = ({
  skills, loading, totalCount, currentPage, loadSkills, categories,
  onCreateSkill, onImportZip, onToggleFavorite, onSkillClick, onDeleteSkill,
}) => {
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const ctx = useContextMenu();

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadSkills({ pageNum: 1, pageSize: PAGE_SIZE, keyword: value, categoryId: categoryId ? Number(categoryId) : undefined });
    }, 300);
  }, [loadSkills, categoryId]);

  const handleSearchChange = (value: string) => {
    setKeyword(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    loadSkills({ pageNum: 1, pageSize: PAGE_SIZE, keyword, categoryId: value ? Number(value) : undefined });
  };

  const handlePageChange = (page: number) => {
    loadSkills({ pageNum: page, pageSize: PAGE_SIZE, keyword, categoryId: categoryId ? Number(categoryId) : undefined });
  };

  const handleImportZip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadSkills({ pageNum: 1, pageSize: PAGE_SIZE });
  }, [loadSkills]);

  const categoryOptions = categories.map(c => ({ value: String(c.id), label: c.name }));

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {ctx.menu}
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => handleSearchChange(e.target.value)} placeholder="搜索技能..." className="h-8 pl-8 text-xs" />
          </div>
          <SearchableSelect options={categoryOptions} value={categoryId} onChange={handleCategoryChange} placeholder="分类筛选" allLabel="全部分类" />
          <div className="flex-1" />
          <Badge variant="secondary" className="text-xs">{totalCount} 项</Badge>
          <Button size="sm" onClick={onCreateSkill}><Plus size={14} className="mr-1" />创建</Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload size={14} className="mr-1" />导入ZIP</Button>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleImportZip} className="hidden" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : skills.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>名称</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-20">版本</TableHead>
                <TableHead className="w-20">下载</TableHead>
                <TableHead className="w-28">更新时间</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map(skill => (
                <TableRow key={skill.id} className="group"
                  onContextMenu={(e) => ctx.show(e, [
                    { label: '查看详情', icon: <Eye size={14} />, onClick: () => onSkillClick(skill.id) },
                    { label: '编辑', icon: <Edit3 size={14} />, onClick: () => onSkillClick(skill.id) },
                    { divider: true, label: '删除', icon: <Trash2 size={14} />, danger: true, onClick: () => onDeleteSkill(skill.id) },
                  ])}
                >
                  <TableCell className="py-2">
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(skill.id); }} className="p-0">
                      <Star size={14} className={skill.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-500'} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onSkillClick(skill.id)} className="text-left w-full">
                      <span className="text-sm font-medium truncate block">{skill.name}</span>
                      {skill.description && <span className="text-xs text-muted-foreground truncate block">{skill.description}</span>}
                    </button>
                  </TableCell>
                  <TableCell>
                    {skill.categoryName ? <Badge variant="secondary" className="text-[10px] h-5">{skill.categoryName}</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{skill.version || '-'}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{skill.downloadCount > 0 ? skill.downloadCount : '-'}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatTime(skill.updatedAt)}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => onDeleteSkill(skill.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Cpu size={40} className="opacity-20 mb-3" />
            <p className="text-sm">暂无技能</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft size={14} className="mr-1" />上一页
          </Button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
            下一页<ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
