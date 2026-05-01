import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Loader2, FolderOpen, ChevronLeft, ChevronRight, Heart, Trash2, Eye, Edit3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useContextMenu } from './ContextMenu';
import SearchableSelect from './SearchableSelect';
import type { Project, Category } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  loadProjects: (params?: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) => void;
  categories: Category[];
  onCreateProject: () => void;
  onToggleFavorite: (id: number) => void;
  onProjectClick: (id: number) => void;
  onDeleteProject: (id: number) => void;
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

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects, loading, totalCount, currentPage, loadProjects, categories,
  onCreateProject, onToggleFavorite, onProjectClick, onDeleteProject,
}) => {
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const ctx = useContextMenu();

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProjects({ pageNum: 1, pageSize: PAGE_SIZE, keyword: value, categoryId: categoryId ? Number(categoryId) : undefined });
    }, 300);
  }, [loadProjects, categoryId]);

  const handleSearchChange = (value: string) => {
    setKeyword(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    loadProjects({ pageNum: 1, pageSize: PAGE_SIZE, keyword, categoryId: value ? Number(value) : undefined });
  };

  const handlePageChange = (page: number) => {
    loadProjects({ pageNum: page, pageSize: PAGE_SIZE, keyword, categoryId: categoryId ? Number(categoryId) : undefined });
  };

  useEffect(() => {
    loadProjects({ pageNum: 1, pageSize: PAGE_SIZE });
  }, [loadProjects]);

  const categoryOptions = categories.map(c => ({ value: String(c.id), label: c.name }));

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {ctx.menu}
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="search-input" value={keyword} onChange={(e) => handleSearchChange(e.target.value)} placeholder="搜索项目..." className="h-8 pl-8 text-xs" />
          </div>
          <SearchableSelect options={categoryOptions} value={categoryId} onChange={handleCategoryChange} placeholder="分类筛选" allLabel="全部分类" />
          <div className="flex-1" />
          <Badge variant="secondary" className="text-xs">{totalCount} 项</Badge>
          <Button data-testid="create-project" size="sm" onClick={onCreateProject}><Plus size={14} className="mr-1" />创建</Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : projects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>名称</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-24">提示词</TableHead>
                <TableHead className="w-28">更新时间</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(project => (
                <TableRow key={project.id} className="group"
                  onContextMenu={(e) => ctx.show(e, [
                    { label: '查看详情', icon: <Eye size={14} />, onClick: () => onProjectClick(project.id) },
                    { label: '编辑', icon: <Edit3 size={14} />, onClick: () => onProjectClick(project.id) },
                    { divider: true, label: '删除', icon: <Trash2 size={14} />, danger: true, onClick: () => onDeleteProject(project.id) },
                  ])}
                >
                  <TableCell className="py-2">
                    <button data-testid="favorite-btn" onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id); }} className="p-0">
                      <Heart size={14} className={project.isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500'} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onProjectClick(project.id)} className="text-left w-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color || '#6366f1' }} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">{project.name}</span>
                        {project.description && <span className="text-xs text-muted-foreground truncate block">{project.description}</span>}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    {project.categoryName ? <Badge variant="secondary" className="text-[10px] h-5">{project.categoryName}</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{project.promptCount > 0 ? project.promptCount : '-'}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatTime(project.updatedAt)}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button data-testid="delete-btn" variant="ghost" size="sm" onClick={() => onDeleteProject(project.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
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
            <FolderOpen size={40} className="opacity-20 mb-3" />
            <p className="text-sm">暂无项目</p>
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
