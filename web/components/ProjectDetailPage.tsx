import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Search, Loader2, MessageSquareText, ChevronLeft, ChevronRight, Heart, Trash2, Eye, Edit3, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useContextMenu } from './ContextMenu';
import { promptApi, projectApi } from '../services/apiService';
import { useToast } from './Toast';
import type { Project, Category, Prompt } from '../types';

interface ProjectDetailPageProps {
  projectId: number;
  onBack: () => void;
  categories: Category[];
  onEditProject: () => void;
  onPromptClick: (id: number) => void;
  onCreatePrompt: () => void;
  onDeletePrompt: (id: number) => void;
  onToggleFavorite: (id: number) => void;
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

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  categories,
  onPromptClick,
  onCreatePrompt,
  onDeletePrompt,
  onToggleFavorite,
}) => {
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const ctx = useContextMenu();

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadPrompts = useCallback(async (params?: { pageNum?: number; keyword?: string }) => {
    setLoading(true);
    try {
      const pageNum = params?.pageNum || 1;
      const data = await promptApi.list({
        pageNum,
        pageSize: PAGE_SIZE,
        projectId,
        keyword: params?.keyword,
      });
      setPrompts(data.promptsList || []);
      setTotalCount(data.total as number || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const projectData = await projectApi.detail(projectId);
        setProject(projectData);
      } catch (err) {
        console.error('Failed to load project:', err);
        showToast('加载项目详情失败', 'error');
      }
      loadPrompts({ pageNum: 1 });
    })();
  }, [projectId]);

  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPrompts({ pageNum: 1, keyword: value });
    }, 300);
  }, [loadPrompts]);

  const handleSearchChange = (value: string) => {
    setKeyword(value);
    debouncedSearch(value);
  };

  const handlePageChange = (page: number) => {
    loadPrompts({ pageNum: page, keyword });
  };

  const handleDeletePrompt = async (id: number) => {
    try {
      await promptApi.delete(id);
      showToast('删除成功', 'success');
      loadPrompts({ pageNum: currentPage, keyword });
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const result = await promptApi.toggleFavorite(id);
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: result.isFavorite } : p));
    } catch (err) {}
  };

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {ctx.menu}
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            返回
          </button>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project?.color || '#6366f1' }} />
            <h2 className="text-sm font-semibold truncate">{project?.name || '项目详情'}</h2>
            {project?.categoryName && (
              <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{project.categoryName}</Badge>
            )}
          </div>
          <div className="flex-1" />
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => handleSearchChange(e.target.value)} placeholder="搜索提示词..." className="h-8 pl-8 text-xs" />
          </div>
          <Badge variant="secondary" className="text-xs">{totalCount} 项</Badge>
          <Button size="sm" onClick={onCreatePrompt}><Plus size={14} className="mr-1" />添加提示词</Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : prompts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>标题</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-20">版本</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-28">更新时间</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map(prompt => (
                <TableRow key={prompt.id} className="group"
                  onContextMenu={(e) => ctx.show(e, [
                    { label: '查看详情', icon: <Eye size={14} />, onClick: () => onPromptClick(prompt.id) },
                    { label: '编辑', icon: <Edit3 size={14} />, onClick: () => onPromptClick(prompt.id) },
                    { divider: true, label: '删除', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDeletePrompt(prompt.id) },
                  ])}
                >
                  <TableCell className="py-2">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(prompt.id); }} className="p-0">
                      <Heart size={14} className={prompt.isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500'} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onPromptClick(prompt.id)} className="text-left w-full">
                      <span className="text-sm font-medium truncate block">{prompt.title}</span>
                      {prompt.description && <span className="text-xs text-muted-foreground truncate block">{prompt.description}</span>}
                    </button>
                  </TableCell>
                  <TableCell>
                    {prompt.categoryName ? <Badge variant="secondary" className="text-[10px] h-5">{prompt.categoryName}</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{prompt.version || '-'}</span></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prompt.publishedVersion ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {prompt.publishedVersion ? `v${prompt.publishedVersion}` : '草稿'}
                    </span>
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatTime(prompt.updatedAt)}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(prompt.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : keyword ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search size={40} className="opacity-20 mb-3" />
            <p className="text-sm">未找到匹配 "{keyword}" 的提示词</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageSquareText size={40} className="opacity-20 mb-3" />
            <p className="text-sm">暂无提示词</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={onCreatePrompt}><Plus size={14} className="mr-1" />添加提示词</Button>
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
