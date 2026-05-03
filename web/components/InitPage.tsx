import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { initApi } from '../services/initService';

type InitStep = 'form' | 'testing' | 'initializing' | 'complete';

interface FormData {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export default function InitPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'aic',
  });

  const [step, setStep] = useState<InitStep>('form');
  const [testResult, setTestResult] = useState<{ success: boolean; version?: string; error?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除之前的测试结果和错误信息
    if (testResult || errorMsg) {
      setTestResult(null);
      setErrorMsg('');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.host.trim()) {
      showToast('请输入数据库主机地址', 'warning');
      return false;
    }
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      showToast('请输入有效的端口号（1-65535）', 'warning');
      return false;
    }
    if (!formData.user.trim()) {
      showToast('请输入数据库用户名', 'warning');
      return false;
    }
    if (!formData.database.trim()) {
      showToast('请输入数据库名称', 'warning');
      return false;
    }
    // 数据库名称验证：只允许字母、数字、下划线
    if (!/^[a-zA-Z0-9_]+$/.test(formData.database)) {
      showToast('数据库名称只能包含字母、数字和下划线', 'warning');
      return false;
    }
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setStep('testing');
    setTestResult(null);
    setErrorMsg('');

    try {
      const result = await initApi.testConnection({
        host: formData.host,
        port: formData.port,
        user: formData.user,
        password: formData.password,
      });
      setTestResult(result);
      if (result.success) {
        showToast(`连接成功！MySQL 版本: ${result.version}`, 'success');
      }
    } catch (error) {
      const err = error as Error;
      setTestResult({ success: false, error: err.message });
      showToast(err.message || '连接失败', 'error');
    } finally {
      setStep('form');
    }
  };

  const handleSetup = async () => {
    if (!testResult?.success) {
      showToast('请先测试数据库连接', 'warning');
      return;
    }

    if (!validateForm()) return;

    setStep('initializing');
    setErrorMsg('');

    try {
      const result = await initApi.setup({
        host: formData.host,
        port: formData.port,
        user: formData.user,
        password: formData.password,
        database: formData.database,
      });

      if (result.success) {
        setStep('complete');
        showToast('初始化完成！', 'success');
        // 1.5秒后跳转到登录页
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || '初始化失败');
      setStep('form');
      showToast(err.message || '初始化失败', 'error');
    }
  };

  const isLoading = step === 'testing' || step === 'initializing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-blue-500 dark:from-emerald-700 dark:to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent mb-2">
            AIC
          </h1>
          <p className="text-gray-600 dark:text-slate-400">个人 AI 工具管理平台</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">首次使用需要配置 MySQL 数据库连接</p>
        </div>

        {/* 完成状态 */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">初始化完成</h2>
            <p className="text-gray-600 dark:text-slate-400">即将跳转到登录页...</p>
          </div>
        )}

        {/* 表单 */}
        {step !== 'complete' && (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 主机和端口 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  数据库主机 <span className="text-red-500">*</span>
                </label>
                <input
                  id="host"
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="127.0.0.1"
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  端口 <span className="text-red-500">*</span>
                </label>
                <input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 3306)}
                  min={1}
                  max={65535}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 用户名和密码 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="user"
                  type="text"
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  placeholder="root"
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="数据库密码"
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 数据库名 */}
            <div>
              <label htmlFor="database" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                数据库名 <span className="text-red-500">*</span>
              </label>
              <input
                id="database"
                type="text"
                value={formData.database}
                onChange={(e) => handleInputChange('database', e.target.value)}
                placeholder="aic"
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* 测试结果 */}
            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                <div className="flex items-start">
                  {testResult.success ? (
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm">
                    {testResult.success ? `连接成功 (MySQL ${testResult.version})` : testResult.error}
                  </span>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{errorMsg}</span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {step === 'testing' ? '测试中...' : '测试连接'}
              </button>
              <button
                type="button"
                onClick={handleSetup}
                disabled={!testResult?.success || isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {step === 'initializing' ? '初始化中...' : '开始初始化'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
