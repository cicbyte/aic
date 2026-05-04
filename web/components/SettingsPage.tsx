import React, { useState, useEffect } from 'react';
import { Sun, Moon, Zap, Info, Palette, Shield, LogOut, Key, Eye, RefreshCw, Edit2, Check, Github, ExternalLink } from 'lucide-react';

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
  const [fullToken, setFullToken] = useState(''); // 完整的 token
  const [newToken, setNewToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [copied, setCopied] = useState(false); // 复制状态

  // 复制 token 到剪贴板
  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(fullToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒后恢复状态
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  // 加载 Token 信息
  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        const response = await fetch('/api/v1/auth/token');
        const data = await response.json();
        if (data.code === 0) {
          setFullToken(data.data.token);
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

  const handleUpdateToken = async (regenerate = false) => {
    try {
      const response = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regenerate ? { regenerate: true } : { token: newToken }),
      });
      const data = await response.json();

      if (data.code === 0) {
        // 更新本地 token
        localStorage.setItem('token', data.data.token);
        setFullToken(data.data.token);
        setShowTokenInput(false);
        setNewToken('');
        alert('Token 已更新，请重新登录');
        window.location.href = '/login';
      } else {
        alert(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新 Token 失败:', error);
      alert('更新失败，请检查网络连接');
    }
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
                  <a
                    href="https://github.com/cicbyte/aic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm group hover:bg-gray-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="text-muted-foreground">GitHub 仓库</span>
                    <div className="flex items-center gap-1.5 text-primary group-hover:gap-2 transition-all">
                      <span className="font-medium">cicbyte/aic</span>
                      <ExternalLink size={14} className="opacity-70" />
                    </div>
                  </a>
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

                {!showTokenInput ? (
                  <div className="p-5">
                    {/* Token 显示卡片 */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">当前 Token</span>
                        <button
                          onClick={handleCopyToken}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                          title="点击复制完整 Token"
                        >
                          {copied ? <Check size={14} /> : <Eye size={14} />}
                          {copied ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div className="font-mono text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-2 rounded border border-gray-200 dark:border-slate-700 mb-2 break-all">
                        {fullToken || '加载中...'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Token 用于 API 认证，点击复制按钮可复制完整 Token
                      </p>
                    </div>

                    {/* 操作按钮组 */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowTokenInput(true)}
                        className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-primary/50 transition-all group"
                      >
                        <Edit2 size={18} className="text-gray-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">自定义</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要重新生成 Token 吗？旧 Token 将立即失效！')) {
                            handleUpdateToken(true);
                          }
                        }}
                        className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-primary/50 transition-all group"
                      >
                        <RefreshCw size={18} className="text-gray-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">重新生成</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 编辑表单 */
                  <div className="p-5">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          新 Token
                        </label>
                        <input
                          type="text"
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                          placeholder="请输入新的 Token（至少12位）"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Token 长度不能少于12位
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateToken(false)}
                          disabled={newToken.length < 12}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Check size={16} />
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setShowTokenInput(false);
                            setNewToken('');
                          }}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 登出按钮 */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
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
