import React from 'react';
import { BarChart3, Cpu, MessageSquareText, FolderOpen, ArrowRight, Clock } from 'lucide-react';
import type { Category, Skill, Prompt, Project } from '../types';

interface DashboardPageProps {
  categories: Category[];
  skills: Skill[];
  prompts: Prompt[];
  projects: Project[];
  loadSkills: () => void;
  loadPrompts: () => void;
  loadProjects: () => void;
}

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

export const DashboardPage: React.FC<DashboardPageProps> = ({
  categories,
  skills,
  prompts,
  projects,
  loadSkills,
  loadPrompts,
  loadProjects,
}) => {
  const recentPrompts = [...prompts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const recentSkills = [...skills]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const stats = [
    { icon: FolderOpen, label: '分类', value: categories.length, color: 'text-blue-500' },
    { icon: Cpu, label: '技能', value: skills.length, color: 'text-purple-500' },
    { icon: MessageSquareText, label: '提示词', value: prompts.length, color: 'text-green-500' },
    { icon: BarChart3, label: '项目', value: projects.length, color: 'text-orange-500' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Stats bar */}
      <div className="flex border-b border-border">
        {stats.map(({ icon: Icon, label, value, color }, i) => (
          <div
            key={label}
            data-testid="stat-item"
            className={`flex-1 flex items-center gap-3 px-6 py-5 ${i < stats.length - 1 ? 'border-r border-border' : ''}`}
          >
            <Icon size={18} className={color} />
            <div>
              <span data-testid="stat-value" className="text-xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground ml-1.5">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent items */}
      <div className="flex flex-col lg:flex-row">
        {/* Recent Prompts */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <MessageSquareText size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">最近提示词</span>
            </div>
            <button
              onClick={loadPrompts}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          {recentPrompts.length > 0 ? recentPrompts.map(p => (
            <div key={p.id} data-testid="recent-update" className="flex items-center gap-3 px-6 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">{p.title}</span>
                {p.description && (
                  <span className="text-xs text-muted-foreground truncate block">{p.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.version && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{p.version}</span>
                )}
                {p.publishedVersion && (
                  <span className="text-[9px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">已发布</span>
                )}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-16 justify-end">
                  <Clock size={10} />
                  {formatTime(p.updatedAt)}
                </span>
              </div>
            </div>
          )) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">暂无提示词</div>
          )}
        </div>

        {/* Recent Skills */}
        <div className="flex-1 min-w-0 border-l border-border">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">最近技能</span>
            </div>
            <button
              onClick={loadSkills}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          {recentSkills.length > 0 ? recentSkills.map(s => (
            <div key={s.id} data-testid="recent-update" className="flex items-center gap-3 px-6 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">{s.name}</span>
                {s.description && (
                  <span className="text-xs text-muted-foreground truncate block">{s.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.version && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{s.version}</span>
                )}
                {s.categoryName && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.categoryName}</span>
                )}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-16 justify-end">
                  <Clock size={10} />
                  {formatTime(s.updatedAt)}
                </span>
              </div>
            </div>
          )) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">暂无技能</div>
          )}
        </div>
      </div>
    </div>
  );
};
