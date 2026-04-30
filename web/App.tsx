import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Cpu, MessageSquareText, FolderOpen, FolderTree, Settings, Zap, Sun, Moon, Menu, X } from 'lucide-react';
import { ToastProvider, useToast } from './components/Toast';
import { useCategories } from './hooks/useCategories';
import { useSkills } from './hooks/useSkills';
import { usePrompts } from './hooks/usePrompts';
import { useProjects } from './hooks/useProjects';
import { DashboardPage } from './components/DashboardPage';
import { SkillsPage } from './components/SkillsPage';
import { SkillDetailPage } from './components/SkillDetailPage';
import { PromptsPage } from './components/PromptsPage';
import { PromptEditorPage } from './components/PromptEditorPage';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { CategoriesPage } from './components/CategoriesPage';
import { SettingsPage } from './components/SettingsPage';
import { CreateSkillModal } from './components/CreateSkillModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import type { ViewMode } from './types';

interface NavItem {
  id: ViewMode;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: BarChart3, label: '仪表盘' },
  { id: 'categories', icon: FolderTree, label: '分类' },
  { id: 'prompts', icon: MessageSquareText, label: '提示词' },
  { id: 'projects', icon: FolderOpen, label: '项目' },
  { id: 'skills', icon: Cpu, label: '技能' },
  { id: 'settings', icon: Settings, label: '设置' },
];

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aic_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('aic_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data hooks
  const categories = useCategories();
  const skills = useSkills();
  const prompts = usePrompts();
  const projects = useProjects();

  // Initial load
  useEffect(() => {
    categories.loadCategories();
    skills.loadSkills();
    prompts.loadPrompts();
    projects.loadProjects();
  }, []);

  // Modals
  const [createSkillModal, setCreateSkillModal] = useState(false);
  const [createProjectModal, setCreateProjectModal] = useState(false);

  // Detail/Editor pages (full screen overlays)
  const [skillDetailId, setSkillDetailId] = useState<number | null>(null);
  const [promptEditorId, setPromptEditorId] = useState<number | null>(null);
  const [promptNewProjectId, setPromptNewProjectId] = useState<number | null>(null);
  const [projectDetailId, setProjectDetailId] = useState<number | null>(null);

  const openNewPrompt = (projectId?: number) => {
    setPromptEditorId(null);
    setPromptNewProjectId(projectId != null ? projectId : 0);
  };

  const closePromptEditor = () => {
    const wasNew = promptNewProjectId !== null;
    const fromProject = wasNew && promptNewProjectId !== 0 && projectDetailId !== null;
    setPromptEditorId(null);
    setPromptNewProjectId(null);
    prompts.loadPrompts();
    if (fromProject) return;
    navigate('/prompts');
  };

  // Get current view from location
  const getCurrentView = (): ViewMode => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/skills')) return 'skills';
    if (path.startsWith('/prompts')) return 'prompts';
    if (path.startsWith('/projects')) return 'projects';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  const handleNavClick = (view: ViewMode) => {
    setIsMobileSidebarOpen(false);
    if (view === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${view}`);
    }
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const renderPage = () => {
    if (skillDetailId !== null) {
      return (
        <SkillDetailPage
          skillId={skillDetailId}
          onBack={() => { setSkillDetailId(null); skills.loadSkills(); }}
          onUpdate={() => skills.loadSkills()}
        />
      );
    }

    if (promptEditorId !== null || promptNewProjectId !== null) {
      const id = promptEditorId;
      return (
        <PromptEditorPage
          promptId={id}
          defaultProjectId={promptNewProjectId}
          categories={categories.categories}
          projects={projects.projects}
          onBack={closePromptEditor}
          onSaved={() => prompts.loadPrompts()}
        />
      );
    }

    if (projectDetailId !== null) {
      return (
        <ProjectDetailPage
          projectId={projectDetailId}
          onBack={() => { setProjectDetailId(null); projects.loadProjects(); }}
          categories={categories.categories}
          onEditProject={() => {}}
          onPromptClick={(id) => { setPromptEditorId(id); setPromptNewProjectId(null); }}
          onCreatePrompt={() => openNewPrompt(projectDetailId)}
          onDeletePrompt={(id) => prompts.deletePrompt(id)}
          onToggleFavorite={(id) => prompts.toggleFavorite(id)}
        />
      );
    }

    return (
      <Routes>
        <Route path="/" element={
          <DashboardPage
            categories={categories.categories}
            skills={skills.skills}
            prompts={prompts.prompts}
            projects={projects.projects}
            loadSkills={() => skills.loadSkills()}
            loadPrompts={() => prompts.loadPrompts()}
            loadProjects={() => projects.loadProjects()}
          />
        } />
        <Route path="/skills" element={
          <SkillsPage
            skills={skills.skills}
            loading={skills.loading}
            totalCount={skills.totalCount}
            currentPage={skills.currentPage}
            loadSkills={skills.loadSkills}
            categories={categories.categories}
            onCreateSkill={() => setCreateSkillModal(true)}
            onImportZip={(file) => skills.importZip(file)}
            onToggleFavorite={(id) => skills.toggleFavorite(id)}
            onSkillClick={(id) => setSkillDetailId(id)}
            onDeleteSkill={(id) => skills.deleteSkill(id)}
          />
        } />
        <Route path="/prompts" element={
          <PromptsPage
            prompts={prompts.prompts}
            loading={prompts.loading}
            totalCount={prompts.totalCount}
            currentPage={prompts.currentPage}
            loadPrompts={prompts.loadPrompts}
            categories={categories.categories}
            projects={projects.projects}
            onCreatePrompt={() => openNewPrompt()}
            onToggleFavorite={(id) => prompts.toggleFavorite(id)}
            onPromptClick={(id) => { setPromptEditorId(id); setPromptNewProjectId(null); }}
            onDeletePrompt={(id) => prompts.deletePrompt(id)}
          />
        } />
        <Route path="/projects" element={
          <ProjectsPage
            projects={projects.projects}
            loading={projects.loading}
            totalCount={projects.totalCount}
            currentPage={projects.currentPage}
            loadProjects={projects.loadProjects}
            categories={categories.categories}
            onCreateProject={() => setCreateProjectModal(true)}
            onToggleFavorite={(id) => projects.toggleFavorite(id)}
            onProjectClick={(id) => setProjectDetailId(id)}
            onDeleteProject={(id) => projects.deleteProject(id)}
          />
        } />
        <Route path="/categories" element={
          <CategoriesPage
            categories={categories.categories}
            loading={categories.loading}
            skills={skills.skills}
            prompts={prompts.prompts}
            projects={projects.projects}
            createCategory={categories.createCategory}
            updateCategory={categories.updateCategory}
            deleteCategory={(id) => categories.deleteCategory(id)}
          />
        } />
        <Route path="/settings" element={
          <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        } />
      </Routes>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-56'
        } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-800 shrink-0 ${
          isSidebarCollapsed ? 'justify-center' : 'gap-3'
        }`}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-primary" />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight truncate">aic</h1>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">AI Capsule</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative text-sm ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {isActive && !isSidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Top bar */}
        <header className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:block p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              <Menu size={18} />
            </button>

            <h2 className="text-sm font-medium truncate">
              {navItems.find(n => n.id === currentView)?.label || '仪表盘'}
            </h2>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            title={isDarkMode ? '浅色模式' : '深色模式'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>

      {/* Create Skill Modal */}
      <CreateSkillModal
        isOpen={createSkillModal}
        onClose={() => setCreateSkillModal(false)}
        onCreated={() => {
          setCreateSkillModal(false);
          skills.loadSkills();
        }}
        categories={categories.categories}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModal}
        onClose={() => setCreateProjectModal(false)}
        onCreated={() => {
          setCreateProjectModal(false);
          projects.loadProjects();
        }}
        categories={categories.categories}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
