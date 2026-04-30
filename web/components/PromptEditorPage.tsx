import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Send, Loader2, Eye, Edit3, FileText, History,
  RotateCcw, X, ArrowRightLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { promptApi } from '../services/apiService';
import { useToast } from './Toast';
import SearchableSelect from './SearchableSelect';
import type { Prompt, PromptVersion, Category, Project } from '../types';

// Semver utility functions
function parseSemver(v: string): [number, number, number] {
  const parts = v.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function bumpPatch(v: string): string {
  const [major, minor, patch] = parseSemver(v);
  return `${major}.${minor}.${patch + 1}`;
}

function isNewer(a: string, b: string): boolean {
  const [am, an, ap] = parseSemver(a);
  const [bm, bn, bp] = parseSemver(b);
  if (am !== bm) return am > bm;
  if (an !== bn) return an > bn;
  return ap > bp;
}

function getNextVersion(currentVersion: string | null, publishedVersion: string | null, versions: PromptVersion[]): string {
  if (!publishedVersion) {
    return '1.0.0';
  }
  let maxVersion = publishedVersion;
  for (const v of versions) {
    if (isNewer(v.version, maxVersion)) {
      maxVersion = v.version;
    }
  }
  if (currentVersion && isNewer(currentVersion, maxVersion)) {
    maxVersion = currentVersion;
  }
  return bumpPatch(maxVersion);
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
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface PromptEditorPageProps {
  promptId: number | null;
  defaultProjectId?: number | null;
  categories: Category[];
  projects: Project[];
  onBack: () => void;
  onSaved: () => void;
}

export const PromptEditorPage: React.FC<PromptEditorPageProps> = ({
  promptId,
  defaultProjectId,
  categories,
  projects,
  onBack,
  onSaved,
}) => {
  const { showToast } = useToast();
  const isNew = promptId === null;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [version, setVersion] = useState('');
  const [publishedVersion, setPublishedVersion] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Version management
  const [versionSheetOpen, setVersionSheetOpen] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [switchingVersion, setSwitchingVersion] = useState<string | null>(null);

  // Publish dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishVersionInput, setPublishVersionInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (promptId) {
      loadPrompt();
    } else {
      setTitle('');
      setDescription('');
      setContent('');
      setCategoryId('');
      setProjectId(defaultProjectId != null && defaultProjectId !== 0 ? String(defaultProjectId) : '');
      setVersion('');
      setPublishedVersion('');
    }
    setPreviewVersion(null);
    setVersionSheetOpen(false);
  }, [promptId]);

  const loadPrompt = async () => {
    if (!promptId) return;
    setIsLoading(true);
    try {
      const data = await promptApi.detail(promptId);
      setTitle(data.title);
      setDescription(data.description || '');
      setContent(data.content || '');
      setCategoryId(data.categoryId ? String(data.categoryId) : '');
      setProjectId(data.projectId ? String(data.projectId) : '');
      setVersion(data.version || '');
      setPublishedVersion(data.publishedVersion || '');
    } catch (err) {
      console.error('Failed to load prompt:', err);
      showToast('加载提示词失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      if (promptId) {
        await promptApi.update({
          id: promptId,
          title: title.trim(),
          description: description.trim(),
          content,
          categoryId: categoryId ? Number(categoryId) : undefined,
          projectId: projectId ? Number(projectId) : undefined,
        });
      } else {
        const result = await promptApi.create({
          title: title.trim(),
          description: description.trim(),
          content,
          categoryId: categoryId ? Number(categoryId) : undefined,
          projectId: projectId ? Number(projectId) : undefined,
        });
      }
      showToast(promptId ? '更新成功' : '创建成功', 'success');
      onSaved();
    } catch (err) {
      console.error('Failed to save prompt:', err);
      showToast('保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish
  const openPublishDialog = () => {
    const next = getNextVersion(version || null, publishedVersion || null, versions);
    setPublishVersionInput(next);
    setPublishDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!promptId || !publishVersionInput.trim()) {
      showToast('请输入版本号', 'warning');
      return;
    }
    const ver = publishVersionInput.trim();
    if (!/^\d+\.\d+\.\d+$/.test(ver)) {
      showToast('版本号格式不正确，应为 x.y.z', 'warning');
      return;
    }
    if (publishedVersion && !isNewer(ver, publishedVersion)) {
      showToast('版本号必须大于已发布版本', 'warning');
      return;
    }
    for (const v of versions) {
      if (v.version === ver) {
        showToast('版本号已存在', 'warning');
        return;
      }
    }
    setIsPublishing(true);
    try {
      await promptApi.publish(promptId, ver);
      showToast(`已发布 v${ver}`, 'success');
      setPublishDialogOpen(false);
      setPublishedVersion(ver);
      onSaved();
    } catch (err) {
      console.error('Failed to publish:', err);
      showToast('发布失败', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Version history
  const openVersionHistory = async () => {
    if (!promptId) return;
    setVersionSheetOpen(true);
    setPreviewVersion(null);
    setLoadingVersions(true);
    try {
      const data = await promptApi.versions(promptId);
      setVersions(data.versions || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
      showToast('加载版本失败', 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRollback = async (v: PromptVersion) => {
    if (!promptId) return;
    setRollingBack(true);
    try {
      await promptApi.rollback(promptId, v.version);
      showToast(`已回滚到 v${v.version}`, 'success');
      setVersionSheetOpen(false);
      setPreviewVersion(null);
      setTitle(v.title);
      setDescription(v.description || '');
      setContent(v.content || '');
      onSaved();
    } catch (err) {
      console.error('Failed to rollback:', err);
      showToast('回滚失败', 'error');
    } finally {
      setRollingBack(false);
    }
  };

  const handleSwitchVersion = async (ver: string) => {
    if (!promptId) return;
    setSwitchingVersion(ver);
    try {
      await promptApi.switchVersion(promptId, ver);
      showToast(`已切换到 v${ver}`, 'success');
      onSaved();
    } catch (err) {
      console.error('Failed to switch version:', err);
      showToast('切换版本失败', 'error');
    } finally {
      setSwitchingVersion(null);
    }
  };

  const isPublishedVersion = (v: string) => publishedVersion === v;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center h-12 px-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="提示词标题"
          className="flex-1 text-sm font-semibold bg-transparent border-none outline-none text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 min-w-0"
          autoFocus
        />
        <div className="flex items-center gap-1">
          {/* Version badge */}
          {promptId && (
            <button
              onClick={openVersionHistory}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all ${
                publishedVersion
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : version
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    : 'text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <History size={12} />
              {version ? `v${version}` : '未发布'}
              {publishedVersion && (
                <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-600 px-1 py-0.5 rounded">
                  已发布
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            保存
          </button>
          {promptId && (
            <button
              onClick={openPublishDialog}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
            >
              <Send size={12} />
              发布
            </button>
          )}
        </div>
      </header>

      {/* Meta bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <SearchableSelect
          options={categories.map(c => ({ value: String(c.id), label: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="选择分类"
          allLabel="无分类"
        />
        <SearchableSelect
          options={projects.map(p => ({ value: String(p.id), label: p.name }))}
          value={projectId}
          onChange={setProjectId}
          placeholder="选择项目"
          allLabel="无项目"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="添加描述..."
          className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary/50 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 min-w-0"
        />
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText size={12} className="text-gray-400" />
          <span className="text-[11px] text-gray-500 dark:text-slate-400">
            {isPreview ? '预览' : '编辑'}
          </span>
        </div>
        <div className="flex items-center rounded-lg bg-gray-100 dark:bg-slate-700 p-0.5">
          <button
            onClick={() => setIsPreview(false)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
              !isPreview ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm' : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <Edit3 size={9} /> 编辑
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
              isPreview ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm' : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <Eye size={9} /> 预览
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden relative">
        <textarea
          className={`absolute inset-0 w-full h-full p-5 resize-none focus:outline-none font-mono text-[13px] leading-7 text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 ${
            isPreview ? 'hidden' : ''
          }`}
          placeholder={'# 系统角色\n你是一个有用的助手...\n\n## 任务\n你的任务是...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
        />
        {isPreview && (
          <div className="absolute inset-0 overflow-y-auto p-5 bg-white dark:bg-slate-900">
            {content ? (
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-gray-800 dark:text-slate-200">{content}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
                <FileText size={28} className="opacity-20 mb-2" />
                <p className="text-xs">暂无内容，请先编辑</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{publishedVersion ? '发布新版本' : '首次发布'}</DialogTitle>
            <DialogDescription>设置发布版本号</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">版本号</label>
            <Input
              type="text"
              value={publishVersionInput}
              onChange={(e) => setPublishVersionInput(e.target.value)}
              placeholder="例如 1.0.0"
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">格式: x.y.z (主版本.次版本.修订号)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !publishVersionInput.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isPublishing ? <Loader2 size={12} className="animate-spin mr-1" /> : <Send size={12} className="mr-1" />}
              确认发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionSheetOpen} onOpenChange={(open) => { if (!open) { setVersionSheetOpen(false); setPreviewVersion(null); } }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>版本历史</DialogTitle>
            <DialogDescription>查看或切换 Prompt 版本</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {previewVersion ? (
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-2.5 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">v{previewVersion.version}</span>
                    {isPublishedVersion(previewVersion.version) && (
                      <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-600 px-1 py-0.5 rounded">已发布</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{previewVersion.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchVersion(previewVersion.version)}
                      disabled={switchingVersion === previewVersion.version || isPublishedVersion(previewVersion.version)}
                      className="h-7 text-[10px] px-2"
                    >
                      {switchingVersion === previewVersion.version ? <Loader2 size={10} className="animate-spin mr-1" /> : <ArrowRightLeft size={10} className="mr-1" />}
                      切换
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRollback(previewVersion)}
                      disabled={rollingBack}
                      className="h-7 text-[10px] px-2 text-muted-foreground"
                    >
                      {rollingBack ? <Loader2 size={10} className="animate-spin mr-1" /> : <RotateCcw size={10} className="mr-1" />}
                      回滚
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewVersion(null)}
                      className="h-7 w-7 p-0 text-muted-foreground"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-3 space-y-1 border-b border-border bg-muted/30 shrink-0">
                  {previewVersion.description && (
                    <p className="text-xs text-muted-foreground">{previewVersion.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{formatTime(previewVersion.createdAt)}</p>
                </div>
                <div className="overflow-y-auto p-6 max-h-[40vh]">
                  <pre className="whitespace-pre-wrap font-mono text-[12px] leading-6">{previewVersion.content}</pre>
                </div>
              </div>
            ) : (
              <div>
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : versions.length > 0 ? (
                  <div className="divide-y divide-border">
                    {versions.map(v => (
                      <div
                        key={v.id}
                        className="px-6 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => setPreviewVersion(v)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isPublishedVersion(v.version)
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              v{v.version}
                            </span>
                            <span className="text-sm font-medium truncate max-w-[180px]">{v.title}</span>
                            {isPublishedVersion(v.version) && (
                              <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-600 px-1 py-0.5 rounded">已发布</span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isPublishedVersion(v.version) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleSwitchVersion(v.version); }}
                                disabled={switchingVersion === v.version}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                title="切换到此版本"
                              >
                                {switchingVersion === v.version ? <Loader2 size={12} className="animate-spin" /> : <ArrowRightLeft size={12} />}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleRollback(v); }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="回滚到此版本"
                            >
                              <RotateCcw size={12} />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{formatTime(v.createdAt)}</span>
                          {v.description && (
                            <>
                              <span className="text-border">·</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[240px]">{v.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <History size={24} className="opacity-20 mb-2" />
                    <p className="text-xs">暂无版本记录</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
