import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Save, Download, Trash2, Loader2, File, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { skillApi } from '../services/apiService';
import { useToast } from './Toast';
import type { FileNode, SkillDetail } from '../types';

interface SkillDetailPageProps {
  skillId: number;
  onBack: () => void;
  onUpdate: () => void;
}

function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'json': return [json()];
    case 'js': return [javascript()];
    case 'jsx': return [javascript({ jsx: true })];
    case 'ts': return [javascript({ typescript: true })];
    case 'tsx': return [javascript({ jsx: true, typescript: true })];
    case 'md': return [markdown()];
    case 'html': return [html()];
    case 'css': return [css()];
    default: return [];
  }
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  }).map(n => ({
    ...n,
    children: n.children ? sortNodes(n.children) : undefined,
  }));
}

function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateFileContent(nodes: FileNode[], id: string, content: string): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, content };
    if (node.children) return { ...node, children: updateFileContent(node.children, id, content) };
    return node;
  });
}

// FileTree component
const FileTree: React.FC<{
  nodes: FileNode[];
  selectedId: string | null;
  expandedFolders: Set<string>;
  onSelectFile: (node: FileNode) => void;
  onToggleFolder: (id: string) => void;
}> = ({ nodes, selectedId, expandedFolders, onSelectFile, onToggleFolder }) => {
  return (
    <div className="space-y-0.5">
      {nodes.map(node => (
        <FileTreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          expandedFolders={expandedFolders}
          onSelectFile={onSelectFile}
          onToggleFolder={onToggleFolder}
          depth={0}
        />
      ))}
    </div>
  );
};

const FileTreeItem: React.FC<{
  node: FileNode;
  selectedId: string | null;
  expandedFolders: Set<string>;
  onSelectFile: (node: FileNode) => void;
  onToggleFolder: (id: string) => void;
  depth: number;
}> = ({ node, selectedId, expandedFolders, onSelectFile, onToggleFolder, depth }) => {
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.id);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors ${
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span className="w-3" />
        )}
        {isFolder ? (
          isExpanded ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />
        ) : (
          <File size={14} className="text-blue-400" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SkillDetailPage: React.FC<SkillDetailPageProps> = ({ skillId, onBack, onUpdate }) => {
  const { showToast } = useToast();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDetail();
  }, [skillId]);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const [detail, filesRes] = await Promise.all([
        skillApi.detail(skillId),
        skillApi.getFiles(skillId),
      ]);
      setSkill(detail);
      const sortedFiles = sortNodes(filesRes.files || []);
      setFiles(sortedFiles);

      // Auto select first file
      const firstFile = findFirstFile(sortedFiles);
      if (firstFile) {
        setSelectedFileId(firstFile.id);
        setContent(firstFile.content || '');
      }
    } catch (err) {
      console.error('Failed to load skill detail:', err);
      showToast('加载技能详情失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleToggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSelectFile = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFileId(node.id);
      setContent(node.content || '');
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Debounced save
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      handleSaveFiles(value);
    }, 1000);
  };

  const handleSaveFiles = async (newContent?: string) => {
    if (!selectedFileId) return;
    const contentToSave = newContent !== undefined ? newContent : content;
    const updatedFiles = updateFileContent(files, selectedFileId, contentToSave);
    setFiles(updatedFiles);

    setIsSaving(true);
    try {
      await skillApi.saveFiles(skillId, updatedFiles);
    } catch (err) {
      console.error('Failed to save:', err);
      showToast('自动保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedFiles = updateFileContent(files, selectedFileId || '', content);
      await skillApi.saveFiles(skillId, updatedFiles);
      setFiles(updatedFiles);
      showToast('保存成功', 'success');
    } catch (err) {
      console.error('Failed to save:', err);
      showToast('保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    skillApi.download(skillId);
  };

  const handleDelete = async () => {
    try {
      await skillApi.delete(skillId);
      showToast('删除成功', 'success');
      onBack();
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const selectedFile = selectedFileId ? findNodeById(files, selectedFileId) : null;

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
        <h2 className="text-sm font-semibold truncate flex-1">{skill?.name || '技能详情'}</h2>
        <div className="flex items-center gap-1">
          {isSaving && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1 mr-2">
              <Loader2 size={10} className="animate-spin" />
              保存中...
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            <Save size={12} />
            保存
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download size={12} />
            下载
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={12} />
            删除
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside className="w-56 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">文件</span>
          </div>
          <div className="p-2">
            {files.length > 0 ? (
              <FileTree
                nodes={files}
                selectedId={selectedFileId}
                expandedFolders={expandedFolders}
                onSelectFile={handleSelectFile}
                onToggleFolder={handleToggleFolder}
              />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-4 text-center">暂无文件</p>
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center px-4 py-1.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
                <File size={12} className="text-gray-400 dark:text-slate-500 mr-2" />
                <span className="text-xs text-gray-500 dark:text-slate-400">{selectedFile.name}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeMirror
                  value={content}
                  onChange={handleContentChange}
                  theme={vscodeDark}
                  extensions={[...getLanguageExtension(selectedFile.name)]}
                  className="h-full text-sm"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    indentOnInput: true,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-500">
              <div className="text-center">
                <File size={32} className="mx-auto opacity-20 mb-2" />
                <p className="text-sm">选择文件开始编辑</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
