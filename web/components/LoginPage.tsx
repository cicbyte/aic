import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import type { ApiError } from '../services/apiService';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      showToast('请输入访问令牌', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 临时保存 token 以便验证
      localStorage.setItem('token', token.trim());

      // 验证 token
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.code === 0) {
        showToast('登录成功！', 'success');
        onLoginSuccess();
        navigate('/');
      } else {
        // 验证失败，清除临时 token
        localStorage.removeItem('token');
        showToast(data.message || '访问令牌无效', 'error');
      }
    } catch (error) {
      // 验证失败，清除临时 token
      localStorage.removeItem('token');
      const err = error as ApiError;
      showToast(err.message || '登录失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-blue-500 dark:from-emerald-700 dark:to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent mb-2">
            AIC
          </h1>
          <p className="text-gray-600 dark:text-slate-400">个人 AI 工具管理平台</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              访问令牌
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入访问令牌"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 提示信息 */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
          请使用启动时生成的访问令牌进行登录
        </div>
      </div>
    </div>
  );
}
