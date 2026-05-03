import React, { useState, useEffect } from 'react';
import { Sun, Moon, Zap, Info, Palette, Shield, LogOut, Key, Eye } from 'lucide-react';

interface SettingsPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const tabs = [
  { id: 'appearance', icon: Palette, label: '外观' },
  { id: 'security', icon: Shield, label: '安全' },
  { id: 'about', icon: Info, label: '关于' },
] as const;

type TabId = typeof tabs[number]['id'];

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDarkMode, setIsDarkMode }) => {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const [tokenInfo, setTokenInfo] = useState('');

  // 加载 Token 信息
  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        const response = await fetch('/api/v1/auth/token');
        const data = await response.json();
        if (data.code === 0) {
          setTokenInfo(data.data.token);
        }
      } catch (error) {
        console.error('获取 Token 信息失败:', error);
      }
    };

    loadTokenInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="h-full flex">
      {/* Left sidebar tabs */}
      <aside className="w-48 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 p-3">
        <h2 className="text-sm font-semibold px-3 mb-3">设置</h2>
        <nav className="flex flex-col gap-0.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {activeTab === 'appearance' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {isDarkMode ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
                  主题
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">深色模式</p>
                    <p className="text-xs text-muted-foreground mt-0.5">切换浅色/深色主题</p>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  关于
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">AI Capsule</h4>
                    <p className="text-xs text-muted-foreground">个人 AI 工具管理平台</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">版本</span>
                    <span className="font-medium">0.1.0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">技术栈</span>
                    <span className="font-medium">React 19 + Vite 6</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Token 信息 */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Key size={16} className="text-primary" />
                    访问令牌
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">当前 Token</span>
                    <span className="font-medium font-mono">{tokenInfo || '加载中...'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Token 用于 API 认证，请妥善保管
                  </p>
                </div>
              </div>

              {/* 登出按钮 */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <LogOut size={16} className="text-primary" />
                    登出
                  </h3>
                </div>
                <div className="p-5">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
