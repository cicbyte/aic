import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BarChart3, Cpu, MessageSquareText, FolderOpen, FolderTree, Settings, Zap, Sun, Moon, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
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
import LoginPage from './components/LoginPage';
import InitPage from './components/InitPage';
import { initApi } from './services/initService';
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

  // 初始化状态
  const [initStatus, setInitStatus] = useState<{ initialized: boolean } | null>(null);
  const [checkingInit, setCheckingInit] = useState(true);

  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aic_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Data hooks - 必须在所有条件之前调用
  const categories = useCategories();
  const skills = useSkills();
  const prompts = usePrompts();
  const projects = useProjects();

  // Modals
  const [createSkillModal, setCreateSkillModal] = useState(false);
  const [createProjectModal, setCreateProjectModal] = useState(false);

  // Detail/Editor pages (full screen overlays)
  const [promptEditorId, setPromptEditorId] = useState<number | null>(null);
  const [promptNewProjectId, setPromptNewProjectId] = useState<number | null>(null);
  const [projectDetailId, setProjectDetailId] = useState<number | null>(null);

  // 检查初始化状态
  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const status = await initApi.status();
        setInitStatus(status);
      } catch (error) {
        console.error('检查初始化状态失败:', error);
        // 如果检查失败，假设已初始化（避免无限循环）
        setInitStatus({ initialized: true });
      } finally {
        setCheckingInit(false);
      }
    };

    checkInitStatus();
  }, []);

  // 检查 URL 中的 token 参数（用于分享链接直接登录）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      // 保存 URL 中的 token
      localStorage.setItem('token', urlToken);
      setIsAuthenticated(true);

      // 清除 URL 中的 token 参数
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('aic_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Initial data load - 只在认证后加载一次
  const hasLoadedDataRef = React.useRef(false);
  useEffect(() => {
    if (isAuthenticated && !hasLoadedDataRef.current && initStatus?.initialized) {
      hasLoadedDataRef.current = true;
      categories.loadCategories();
      prompts.loadPrompts();
      projects.loadProjects();
    }
  }, [isAuthenticated, initStatus]);

  // Reset the ref when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedDataRef.current = false;
    }
  }, [isAuthenticated]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  // 如果正在检查初始化状态，显示加载
  if (checkingInit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-blue-500 dark:from-emerald-700 dark:to-blue-700 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 dark:text-slate-300">正在检查系统状态...</span>
          </div>
        </div>
      </div>
    );
  }

  // 如果未初始化，显示初始化页面
  if (!initStatus?.initialized) {
    return <InitPage />;
  }

  // 如果未认证，或访问 /login 路径，显示登录页面
  if (!isAuthenticated || location.pathname === '/login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const openNewPrompt = (projectId?: number) => {
    setPromptEditorId(null);
    setPromptNewProjectId(projectId != null ? projectId : 0);
  };

  const closePromptEditor = async () => {
    const fromProject = promptNewProjectId !== null && promptNewProjectId !== 0 && projectDetailId !== null;
    setPromptEditorId(null);
    setPromptNewProjectId(null);
    await prompts.loadPrompts();
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

  const renderPage = () => {
    if (promptEditorId !== null || promptNewProjectId !== null) {
      const id = promptEditorId;
      return (
        <PromptEditorPage
          promptId={id}
          defaultProjectId={promptNewProjectId}
          categories={categories.categories}
          projects={projects.projects}
          onBack={closePromptEditor}
          onSaved={(newId) => {
            prompts.loadPrompts();
            if (newId) setPromptEditorId(newId);
          }}
        />
      );
    }

    if (projectDetailId !== null) {
      return (
        <ProjectDetailPage
          projectId={projectDetailId}
          onBack={() => { setProjectDetailId(null); projects.loadProjects(); }}
          categories={categories.categories}
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
            onSkillClick={(id) => navigate(`/skills/${id}`)}
            onDeleteSkill={(id) => skills.deleteSkill(id)}
          />
        } />
        <Route path="/skills/:id" element={
          <SkillDetailPage />
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
              title={isDarkMode ? '浅色模式' : '深色模式'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 py-1 z-50">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings size={16} />
                    <span>设置</span>
                  </button>
                  <div className="h-px bg-gray-200 dark:bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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
