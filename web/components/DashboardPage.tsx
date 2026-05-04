import React, { useMemo } from 'react';
import { BarChart3, Cpu, MessageSquareText, FolderOpen, ArrowRight, Clock, TrendingUp, TrendingDown, PieChart as PieChartIcon, Activity, BarChart2, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Category, Skill, Prompt, Project } from '../types';

interface DashboardPageProps {
  categories: Category[];
  skills: Skill[];
  prompts: Prompt[];
  projects: Project[];
  skillTotalCount: number;
  promptTotalCount: number;
  projectTotalCount: number;
  loadSkills: () => void;
  loadPrompts: () => void;
  loadProjects: () => void;
}

const CHART_COLORS = [
  'var(--color-chart-1)', // #6366f1
  'var(--color-chart-2)', // #3b82f6
  'var(--color-chart-3)', // #06b6d4
  'var(--color-chart-4)', // #10b981
  'var(--color-chart-5)', // #f59e0b
];

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

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-foreground)',
  fontSize: 12,
};

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const EmptyChart: React.FC = () => (
  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">暂无数据</div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({
  categories,
  skills,
  prompts,
  projects,
  skillTotalCount,
  promptTotalCount,
  projectTotalCount,
  loadSkills,
  loadPrompts,
  loadProjects,
}) => {
  // ---- 数据聚合 ----

  // 分类分布（按 categoryId 统计技能数量）
  const categoryDistribution = useMemo(() => {
    return categories.map(cat => {
      const count = skills.filter(s => s.categoryId === cat.id).length;
      return { name: cat.name, value: count };
    }).filter(d => d.value > 0);
  }, [categories, skills]);

  // 近 30 天活跃趋势
  const trendData = useMemo(() => {
    const now = new Date();
    const days: { date: string; key: string; skills: number; prompts: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, key, skills: 0, prompts: 0 });
    }
    const dayMap = new Map(days.map(d => [d.key, d]));
    for (const s of skills) {
      if (!s.updatedAt) continue;
      const day = dayMap.get(s.updatedAt.slice(0, 10));
      if (day) day.skills++;
    }
    for (const p of prompts) {
      if (!p.updatedAt) continue;
      const day = dayMap.get(p.updatedAt.slice(0, 10));
      if (day) day.prompts++;
    }
    return days;
  }, [skills, prompts]);

  // 各分类技能数量柱状图
  const categorySkillCounts = useMemo(() => {
    return categories.map(cat => {
      const count = skills.filter(s => s.categoryId === cat.id).length;
      return { name: cat.name.length > 6 ? cat.name.slice(0, 6) + '...' : cat.name, count };
    }).filter(d => d.count > 0);
  }, [categories, skills]);

  // 项目提示词数量
  const projectPromptCounts = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.promptCount - a.promptCount)
      .slice(0, 8)
      .map(p => ({ name: p.name.length > 8 ? p.name.slice(0, 8) + '...' : p.name, prompts: p.promptCount }));
  }, [projects]);

  // 本周/上周新增统计
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const countRecent = (items: { updatedAt: string }[], from: Date, to: Date) =>
      items.filter(i => {
        const d = new Date(i.updatedAt);
        return d >= from && d < to;
      }).length;

    return {
      skills: { week: countRecent(skills, weekStart, now), last: countRecent(skills, lastWeekStart, weekStart) },
      prompts: { week: countRecent(prompts, weekStart, now), last: countRecent(prompts, lastWeekStart, weekStart) },
      projects: { week: countRecent(projects, weekStart, now), last: countRecent(projects, lastWeekStart, weekStart) },
    };
  }, [skills, prompts, projects]);

  const recentPrompts = useMemo(() =>
    [...prompts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8),
    [prompts]
  );

  const recentSkills = useMemo(() =>
    [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8),
    [skills]
  );

  const hasTrend = trendData.some(d => d.skills > 0 || d.prompts > 0);

  // ---- 渲染 ----

  const statCards = [
    { icon: FolderOpen, label: '分类', value: categories.length, weekKey: null as string | null, color: 'text-blue-500' },
    { icon: Cpu, label: '技能', value: skillTotalCount, weekKey: 'skills' as const, color: 'text-purple-500' },
    { icon: MessageSquareText, label: '提示词', value: promptTotalCount, weekKey: 'prompts' as const, color: 'text-green-500' },
    { icon: BarChart3, label: '项目', value: projectTotalCount, weekKey: 'projects' as const, color: 'text-orange-500' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* 区域 A：统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
        {statCards.map(({ icon: Icon, label, value, weekKey, color }, i) => {
          const ws = weekKey ? weeklyStats[weekKey] : null;
          const weekDiff = ws ? ws.week - ws.last : 0;
          const weekPct = ws && ws.last > 0 ? Math.round((weekDiff / ws.last) * 100) : null;
          return (
            <div key={label} className={`flex items-center gap-3 px-6 py-5 ${i < statCards.length - 1 ? 'border-r border-border' : ''}`}>
              <div className={`p-2.5 rounded-xl bg-muted/50`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                {ws && (
                  <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${weekDiff > 0 ? 'text-emerald-500' : weekDiff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {weekDiff > 0 ? <TrendingUp size={10} /> : weekDiff < 0 ? <TrendingDown size={10} /> : null}
                    本周 {weekDiff > 0 ? '+' : ''}{ws.week}
                    {weekPct !== null && weekPct !== 0 && (
                      <span className="ml-0.5">({weekPct > 0 ? '+' : ''}{weekPct}%)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 区域 B：分类分布 + 活跃趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <ChartCard title="分类分布" icon={<PieChartIcon size={14} className="text-muted-foreground" />}>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-muted-foreground)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="近 30 天活跃趋势" icon={<Activity size={14} className="text-muted-foreground" />}>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={24} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="skills" name="技能" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="prompts" name="提示词" stroke="var(--color-chart-4)" fill="var(--color-chart-4)" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-muted-foreground)' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* 区域 C：分类技能 + 项目提示词 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <ChartCard title="各分类技能数量" icon={<BarChart2 size={14} className="text-muted-foreground" />}>
          {categorySkillCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categorySkillCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={24} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="技能数" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="项目提示词数量" icon={<Layers size={14} className="text-muted-foreground" />}>
          {projectPromptCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectPromptCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} width={24} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="prompts" name="提示词数" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* 区域 D：最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 最近提示词 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <MessageSquareText size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">最近提示词</span>
            </div>
            <button onClick={loadPrompts} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          {recentPrompts.length > 0 ? recentPrompts.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">{p.title}</span>
                {p.description && <span className="text-xs text-muted-foreground truncate block">{p.description}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.version && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{p.version}</span>}
                {p.publishedVersion && <span className="text-[9px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">已发布</span>}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-16 justify-end">
                  <Clock size={10} />{formatTime(p.updatedAt)}
                </span>
              </div>
            </div>
          )) : <div className="px-4 py-10 text-center text-sm text-muted-foreground">暂无提示词</div>}
        </div>

        {/* 最近技能 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden lg:border-l-0 border-t lg:border-t-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">最近技能</span>
            </div>
            <button onClick={loadSkills} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          {recentSkills.length > 0 ? recentSkills.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">{s.name}</span>
                {s.description && <span className="text-xs text-muted-foreground truncate block">{s.description}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.version && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{s.version}</span>}
                {s.categoryName && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.categoryName}</span>}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-16 justify-end">
                  <Clock size={10} />{formatTime(s.updatedAt)}
                </span>
              </div>
            </div>
          )) : <div className="px-4 py-10 text-center text-sm text-muted-foreground">暂无技能</div>}
        </div>
      </div>
    </div>
  );
};
