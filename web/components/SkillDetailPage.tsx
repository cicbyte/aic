import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { ArrowLeft, Save, Download, Trash2, Loader2, File, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Pencil, FilePlus, FolderPlus, Upload, Archive, AlertTriangle, Tag, RotateCcw, Eye, X, Send, FileText, FileCode2, FileJson, FileType as FileTypeIcon, Image as ImageIcon, Settings } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import remarkGfm from 'remark-gfm';
const MarkdownPreview = lazy(() => import('@uiw/react-markdown-preview').then(m => {
  const C = m.default;
  return { default: function MarkdownPreviewWrapper(props: any) { return React.createElement(C, props); } };
}));

function parseFrontmatter(text: string): { meta: Record<string, string>; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta: Record<string, string> = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return { meta, body: match[2] };
}
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { skillApi } from '../services/apiService';
import { useToast } from './Toast';
import { useContextMenu } from './ContextMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useParams, useNavigate } from 'react-router-dom';
import type { FileNode, SkillDetail, SkillTagInfo } from '../types';

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

// ---- Tree utility functions ----

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

function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
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

function removeNodeById(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: node.children ? removeNodeById(node.children, id) : undefined,
    }));
}

function addNodeToParent(nodes: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (parentId === null) {
    return sortNodes([...nodes, newNode]);
  }
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, type: 'folder' as const, children: sortNodes([...(node.children || []), newNode]) };
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, parentId, newNode) };
    }
    return node;
  });
}

function renameNodeInTree(nodes: FileNode[], id: string, newName: string): FileNode[] {
  const target = findNodeById(nodes, id);
  if (!target) return nodes;
  if (target.name === newName) return nodes;

  const oldPath = target.path;
  const lastSlash = oldPath.lastIndexOf('/');
  const dir = lastSlash >= 0 ? oldPath.substring(0, lastSlash + 1) : '';
  const newPath = dir + newName;

  function updatePath(node: FileNode): FileNode {
    if (node.path === oldPath) {
      return { ...node, name: newName, path: newPath };
    }
    if (node.path.startsWith(oldPath + '/')) {
      return { ...node, path: newPath + node.path.substring(oldPath.length) };
    }
    if (node.children) {
      return { ...node, children: node.children.map(updatePath) };
    }
    return node;
  }

  return nodes.map(updatePath);
}

function checkNameExists(nodes: FileNode[], parentId: string | null, name: string, excludeId?: string): boolean {
  const siblings = parentId ? findNodeById(nodes, parentId)?.children || [] : nodes;
  return siblings.some(n => n.name === name && n.id !== excludeId);
}

function collectFileIds(nodes: FileNode[]): string[] {
  const ids: string[] = [];
  function walk(ns: FileNode[]) {
    for (const n of ns) {
      if (n.type === 'file') ids.push(n.id);
      if (n.children) walk(n.children);
    }
  }
  walk(nodes);
  return ids;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- FileTreeItem component ----

const FileTreeItem: React.FC<{
  node: FileNode;
  selectedId: string | null;
  expandedFolders: Set<string>;
  editingNodeId: string | null;
  editingValue: string;
  onSelectFile: (node: FileNode) => void;
  onToggleFolder: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onEditingChange: (value: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  depth: number;
}> = ({ node, selectedId, expandedFolders, editingNodeId, editingValue, onSelectFile, onToggleFolder, onContextMenu, onEditingChange, onEditConfirm, onEditCancel, depth }) => {
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';
  const isEditing = editingNodeId === node.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const dotIndex = node.name.lastIndexOf('.');
      inputRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : node.name.length);
    }
  }, [isEditing, node.name]);

  const handleClick = () => {
    if (isEditing) return;
    if (isFolder) {
      onToggleFolder(node.id);
    } else {
      onSelectFile(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEditConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onEditCancel();
    }
  };

  return (
    <div data-node-id={node.id}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg transition-colors ${
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
          <File size={14} className={getFileIconColor(node.name)} />
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editingValue}
            onChange={(e) => onEditingChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 text-xs bg-background border border-primary rounded px-1 py-0 outline-none"
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </button>
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedFolders={expandedFolders}
              editingNodeId={editingNodeId}
              editingValue={editingValue}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onContextMenu={onContextMenu}
              onEditingChange={onEditingChange}
              onEditConfirm={onEditConfirm}
              onEditCancel={onEditCancel}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  const getOrCreateFolder = (folderPath: string): FileNode => {
    if (folderMap.has(folderPath)) return folderMap.get(folderPath)!;
    const parts = folderPath.split('/');
    const name = parts[parts.length - 1];
    const node: FileNode = {
      id: folderPath,
      name,
      path: folderPath,
      type: 'folder',
      children: [],
    };
    folderMap.set(folderPath, node);
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = getOrCreateFolder(parentPath);
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      root.push(node);
    }
    return node;
  };

  for (const p of paths) {
    const parts = p.split('/');
    const name = parts[parts.length - 1];
    const node: FileNode = { id: p, name, path: p, type: 'file' };
    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      const parent = getOrCreateFolder(folderPath);
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      root.push(node);
    }
  }

  return root;
}

// ---- File icon mapping ----

const FILE_ICON_MAP: Array<[string, React.ElementType, string]> = [
  ['md', FileText, 'text-blue-500'],
  ['txt', FileText, 'text-gray-400'],
  ['py', FileCode2, 'text-green-500'],
  ['js', FileCode2, 'text-yellow-500'],
  ['jsx', FileCode2, 'text-yellow-500'],
  ['ts', FileCode2, 'text-blue-500'],
  ['tsx', FileCode2, 'text-blue-500'],
  ['json', FileJson, 'text-yellow-600'],
  ['html', FileCode2, 'text-orange-500'],
  ['css', FileTypeIcon, 'text-purple-500'],
  ['yaml', FileTypeIcon, 'text-red-400'],
  ['yml', FileTypeIcon, 'text-red-400'],
  ['go', FileCode2, 'text-cyan-500'],
  ['rs', FileCode2, 'text-orange-600'],
  ['java', FileCode2, 'text-red-500'],
  ['xml', FileCode2, 'text-orange-500'],
  ['sql', FileTypeIcon, 'text-sky-500'],
  ['sh', FileTypeIcon, 'text-green-400'],
  ['bat', FileTypeIcon, 'text-green-400'],
  ['png', ImageIcon, 'text-pink-400'],
  ['jpg', ImageIcon, 'text-pink-400'],
  ['svg', ImageIcon, 'text-amber-500'],
  ['gif', ImageIcon, 'text-pink-400'],
  ['env', Settings, 'text-gray-400'],
  ['lock', Settings, 'text-gray-500'],
];

const getFileIconColor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const entry = FILE_ICON_MAP.find(([e]) => e === ext);
  return entry ? entry[2] : 'text-gray-400';
};

function PreviewFileNode({ node, depth, selectedPath, onSelect }: {
  node: FileNode;
  depth: number;
  selectedPath: string;
  onSelect: (node: FileNode) => void;
}) {
  const isFile = node.type === 'file';
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-6 py-1.5 text-xs transition-colors ${isFile ? 'cursor-pointer hover:bg-muted/30' : 'text-muted-foreground'} ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 24}px` }}
        onClick={() => isFile && onSelect(node)}
      >
        {isFile ? (
          <File size={12} className={getFileIconColor(node.name)} />
        ) : (
          <Folder size={12} className="text-amber-400 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {!isFile && node.children?.map(child => (
        <PreviewFileNode key={child.id} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ---- Main component ----

export const SkillDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const skillId = Number(id);
  const { showToast } = useToast();


// ---- FileTreeItem component ----
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Inline confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Version management state
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [tags, setTags] = useState<SkillTagInfo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [publishVersionInput, setPublishVersionInput] = useState('');
  const [publishNoteInput, setPublishNoteInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [previewTag, setPreviewTag] = useState<SkillTagInfo | null>(null);
  const [previewFileList, setPreviewFileList] = useState<FileNode[]>([]);
  const [previewFileContent, setPreviewFileContent] = useState<string | null>(null);
  const [previewFilePath, setPreviewFilePath] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  // Inline editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editingIsAddRef = useRef(false);
  const editingNodeRef = useRef<FileNode | null>(null);
  const editingParentIdRef = useRef<string | null>(null);

  // Context menus (3 independent instances to avoid collision)
  const treeCtx = useContextMenu();
  const rootCtx = useContextMenu();
  const addBtnCtx = useContextMenu();
  const editorCtx = useContextMenu();

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIdRef = useRef<string | null>(null);

  // Prevent context menu from closing on blur
  const isConfirmingRef = useRef(false);
  const [showZipConfirm, setShowZipConfirm] = useState(false);

  // ---- Load ----

  useEffect(() => {
    loadDetail();
  }, [skillId]);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const [detail, filesRes, tagsRes] = await Promise.all([
        skillApi.detail(skillId),
        skillApi.getFiles(skillId),
        skillApi.tagList(skillId),
      ]);
      setSkill(detail);
      setTags(tagsRes.tags || []);
      setCurrentTag(tagsRes.currentTag || '');
      const sortedFiles = sortNodes(filesRes.files || []);
      setFiles(sortedFiles);
      setEditingNodeId(null);

      const firstFile = findFirstFile(sortedFiles);
      if (firstFile) {
        setSelectedFileId(firstFile.id);
        setContent(firstFile.content || '');
      } else {
        setSelectedFileId(null);
        setContent('');
      }
    } catch (err) {
      console.error('Failed to load skill detail:', err);
      showToast('加载技能详情失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    const skillMd = findFileByName(nodes, 'SKILL.md');
    if (skillMd) return skillMd;
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const findFileByName = (nodes: FileNode[], name: string): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file' && node.name === name) return node;
      if (node.children) {
        const found = findFileByName(node.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  // ---- Version management ----

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const tagsRes = await skillApi.tagList(skillId);
      setTags(tagsRes.tags || []);
      setCurrentTag(tagsRes.currentTag || '');
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  }, [skillId]);

  const openVersionPanel = async () => {
    setVersionPanelOpen(true);
    setPreviewTag(null);
    setShowPublishForm(false);
    await loadVersions();
  };

  const latestTag = tags.length > 0 ? tags[0] : null;

  const getNextVersion = () => {
    if (!latestTag) return '1.0.0';
    const parts = latestTag.tag.replace(/^v/, '').split('.').map(Number);
    if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    return '1.0.0';
  };

  const handlePublish = async () => {
    const version = publishVersionInput.trim();
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
      showToast('版本号格式不正确，应为 x.y.z', 'warning');
      return;
    }
    setIsPublishing(true);
    try {
      await skillApi.tagCreate(skillId, version, publishNoteInput.trim() || undefined);
      showToast(`已发布 v${version}`, 'success');

      // 刷新文件列表以获取更新后的 SKILL.md
      await loadDetail();

      setShowPublishForm(false);
      setPublishVersionInput('');
      setPublishNoteInput('');
      await loadVersions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '发布失败', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    setConfirmDialog({
      message: `确定删除标签 ${tag} 吗？`,
      onConfirm: async () => {
        try {
          await skillApi.tagDelete(skillId, tag);
          showToast('标签已删除', 'success');
          await loadVersions();
        } catch (err) {
          showToast('删除标签失败', 'error');
        }
      },
    });
  };

  const handlePreviewTag = async (tag: SkillTagInfo) => {
    try {
      const res = await skillApi.gitTree(skillId, tag.tag);
      const filePaths = res.files || [];
      const tree = buildFileTree(filePaths);
      setPreviewTag(tag);
      setPreviewFileList(tree);
      setPreviewFileContent(null);
      setPreviewFilePath('');
    } catch (err) {
      showToast('获取版本文件列表失败', 'error');
    }
  };

  const handleRollback = async (tag: string) => {
    setConfirmDialog({
      message: `确定回滚到 ${tag} 吗？当前未保存的更改将丢失。`,
      onConfirm: async () => {
        setIsRollingBack(true);
        try {
          await skillApi.tagCheckout(skillId, tag);
          showToast(`已回滚到 ${tag}`, 'success');
          setVersionPanelOpen(false);
          exitPreview();
          await loadDetail();
        } catch (err) {
          showToast('回滚失败', 'error');
        } finally {
          setIsRollingBack(false);
        }
      },
    });
  };

  const exitPreview = () => {
    setPreviewTag(null);
    setPreviewFileList([]);
    setPreviewFileContent(null);
    setPreviewFilePath('');
  };

  const handlePreviewFile = async (path: string) => {
    if (!previewTag) return;
    setPreviewFileContent('加载中...');
    setPreviewFilePath(path);
    try {
      const res = await skillApi.gitFileContent(skillId, previewTag.tag, path);
      setPreviewFileContent(res.content);
    } catch {
      setPreviewFileContent('无法加载文件内容');
    }
  };

  const formatTimestamp = (ts: string) => {
    const num = parseInt(ts, 10);
    if (isNaN(num)) return ts;
    return new Date(num * 1000).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  // ---- Tree interactions ----

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
      setMdPreview(false);
    }
  };

  // ---- Editor save ----

  const handleContentChange = (value: string) => {
    setContent(value);
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      debouncedSaveRef.current();
    }, 1000);
  };

  const debouncedSaveRef = useRef<() => void>(() => {});

  // Keep debouncedSaveRef up to date
  useEffect(() => {
    debouncedSaveRef.current = async () => {
      if (!selectedFileId) return;
      const updatedFiles = updateFileContent(files, selectedFileId, content);
      setFiles(updatedFiles);
      setIsSaving(true);
      try {
        await skillApi.saveFiles(skillId, updatedFiles);
      } catch (err) {
        console.error('Failed to auto-save:', err);
        showToast('自动保存失败', 'error');
      } finally {
        setIsSaving(false);
      }
    };
  }, [files, selectedFileId, content, skillId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedFileId, files, content, skillId]);

  const handleEditorContextMenu = (e: React.MouseEvent) => {
    if (!selectedFileId) return;
    editorCtx.show(e, [
      { label: '保存', icon: <Save size={14} />, onClick: handleSave },
      { label: '下载', icon: <Download size={14} />, onClick: handleDownload, divider: true },
      { label: '复制全部', icon: <FileText size={14} />, onClick: () => { navigator.clipboard.writeText(content); showToast('已复制', 'success'); } },
    ]);
  };

  const handleSave = async () => {
    if (!selectedFileId) {
      showToast('请先选择文件', 'warning');
      return;
    }
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    const updatedFiles = updateFileContent(files, selectedFileId, content);
    setFiles(updatedFiles);
    setIsSaving(true);
    try {
      await skillApi.saveFiles(skillId, updatedFiles);
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

  const handleDeleteSkill = async () => {
    setConfirmDialog({
      message: '确定要删除该技能吗？',
      onConfirm: async () => {
        try {
          await skillApi.delete(skillId);
          showToast('删除成功', 'success');
          navigate('/skills');
        } catch (err) {
          showToast('删除失败', 'error');
        }
      },
    });
  };

  // ---- Persist helper ----

  const persistFiles = useCallback(async (newFiles: FileNode[]) => {
    setFiles(newFiles);
    setIsSaving(true);
    try {
      await skillApi.saveFiles(skillId, newFiles);
    } catch (err) {
      console.error('Failed to save files:', err);
      showToast('保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [skillId]);

  // ---- File tree operations ----

  const startEditing = (node: FileNode, isAdd: boolean, parentId: string | null = null) => {
    editingIsAddRef.current = isAdd;
    editingNodeRef.current = node;
    editingParentIdRef.current = parentId;
    setEditingNodeId(node.id);
    setEditingValue(node.name);
  };

  const confirmEdit = useCallback(() => {
    const value = editingValue.trim();
    const node = editingNodeRef.current;
    const isAdd = editingIsAddRef.current;

    if (!value) {
      if (isAdd && node) {
        setFiles(prev => removeNodeById(prev, node.id));
      }
      setEditingNodeId(null);
      editingNodeRef.current = null;
      return;
    }

    // Validate: no empty names, no slashes, no duplicate names
    if (value.includes('/') || value.includes('\\')) {
      showToast('名称不能包含 / 或 \\', 'warning');
      return;
    }

    let newFiles = files;
    if (isAdd && node) {
      if (checkNameExists(files, editingParentIdRef.current, value)) {
        showToast(`"${value}" 已存在`, 'warning');
        return;
      }
      const dir = node.path.substring(0, node.path.lastIndexOf('/'));
      const newPath = dir ? `${dir}/${value}` : value;
      newFiles = files.map(n => n.id === node.id ? { ...n, name: value, path: newPath } : n);
    } else if (node && node.name !== value) {
      if (checkNameExists(files, editingParentIdRef.current, value, node.id)) {
        showToast(`"${value}" 已存在`, 'warning');
        return;
      }
      newFiles = renameNodeInTree(files, node.id, value);
    }

    isConfirmingRef.current = true;
    setEditingNodeId(null);
    editingNodeRef.current = null;

    persistFiles(newFiles).finally(() => {
      setTimeout(() => { isConfirmingRef.current = false; }, 50);
    });
  }, [files, editingValue, persistFiles]);

  const cancelEdit = useCallback(() => {
    if (editingIsAddRef.current && editingNodeRef.current) {
      setFiles(prev => removeNodeById(prev, editingNodeRef.current.id));
    }
    setEditingNodeId(null);
    editingNodeRef.current = null;
  }, []);

  const addNode = (parentId: string | null, type: 'file' | 'folder') => {
    const parent = parentId ? findNodeById(files, parentId) : null;
    const dir = parent ? (parent.type === 'folder' ? parent.path : parent.path.substring(0, parent.path.lastIndexOf('/'))) : '';
    const defaultName = type === 'file' ? 'untitled.txt' : 'untitled';
    const path = dir ? `${dir}/${defaultName}` : defaultName;
    const newNode: FileNode = { id: generateId(), name: defaultName, path, type, content: type === 'file' ? '' : undefined };
    const newFiles = addNodeToParent(files, parentId, newNode);
    setFiles(newFiles);
    if (type === 'folder') {
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(newNode.id);
      setExpandedFolders(newExpanded);
    }
    startEditing(newNode, true, parentId);
  };

  const renameNode = (nodeId: string) => {
    const node = findNodeById(files, nodeId);
    if (!node) return;
    const lastSlash = node.path.lastIndexOf('/');
    const parentPath = lastSlash > 0 ? node.path.substring(0, lastSlash) : '';
    const parentNode = parentPath ? findNodeByPath(files, parentPath) : null;
    startEditing(node, false, parentNode?.id || null);
  };

  const deleteNode = (nodeId: string) => {
    const node = findNodeById(files, nodeId);
    if (!node) return;
    const childFiles = node.type === 'folder' ? collectFileIds(node.children || []) : [nodeId];
    const msg = node.type === 'folder'
      ? (childFiles.length > 0 ? `确定删除文件夹 "${node.name}" 及其 ${childFiles.length} 个文件吗？` : `确定删除空文件夹 "${node.name}" 吗？`)
      : `确定删除文件 "${node.name}" 吗？`;
    setConfirmDialog({
      message: msg,
      onConfirm: () => {
        const ids = node.type === 'folder' ? collectFileIds(node.children || []) : [nodeId];
        const newFiles = removeNodeById(files, nodeId);
        if (ids.includes(selectedFileId || '')) {
          setSelectedFileId(null);
          setContent('');
        }
        persistFiles(newFiles);
        showToast(`已删除${node.type === 'folder' ? '文件夹' : '文件'}`, 'success');
      },
    });
  };

  // ---- Upload ----

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const parentId = uploadTargetIdRef.current;
    uploadTargetIdRef.current = null;

    const readFilePromises = Array.from(fileList).map(file =>
      new Promise<{ name: string; content: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, content: reader.result as string });
        reader.readAsText(file);
      })
    );

    Promise.all(readFilePromises).then((results) => {
      let newFiles = [...files];
      for (const { name, content } of results) {
        if (checkNameExists(newFiles, parentId, name)) {
          showToast(`"${name}" 已存在，已跳过`, 'warning');
          continue;
        }
        const id = generateId();
        const parent = parentId ? findNodeById(newFiles, parentId) : null;
        const dir = parent ? (parent.type === 'folder' ? parent.path : parent.path.substring(0, parent.path.lastIndexOf('/'))) : '';
        const path = dir ? `${dir}/${name}` : name;
        newFiles = addNodeToParent(newFiles, parentId, { id, name, path, type: 'file', content });
      }
      persistFiles(sortNodes(newFiles));
      showToast(`已上传 ${results.length} 个文件`, 'success');
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await skillApi.importZip(file, undefined, undefined, true);
      showToast('ZIP 导入成功', 'success');
      await loadDetail();
    } catch (err) {
      showToast('ZIP 导入失败', 'error');
    }
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  // ---- Context menu builders ----

  const getNodeMenuItems = (node: FileNode) => {
    const items = [];
    const isProtected = node.name.toLowerCase() === 'skill.md';
    if (node.type === 'folder') {
      items.push({ label: '新增文件', icon: <FilePlus size={14} />, onClick: () => { uploadTargetIdRef.current = node.id; addNode(node.id, 'file'); } });
      items.push({ label: '新增文件夹', icon: <FolderPlus size={14} />, onClick: () => addNode(node.id, 'folder') });
    }
    if (!isProtected) {
      items.push({ label: '重命名', icon: <Pencil size={14} />, onClick: () => renameNode(node.id) });
      items.push({ divider: true, label: '删除', icon: <AlertTriangle size={14} />, danger: true, onClick: () => deleteNode(node.id) });
    }
    return items;
  };

  const getRootMenuItems = () => [
    { label: '新增文件', icon: <FilePlus size={14} />, onClick: () => { uploadTargetIdRef.current = null; addNode(null, 'file'); } },
    { label: '新增文件夹', icon: <FolderPlus size={14} />, onClick: () => addNode(null, 'folder') },
    { divider: true, label: '上传文件', icon: <Upload size={14} />, onClick: () => { uploadTargetIdRef.current = null; fileInputRef.current?.click(); } },
    { label: '上传 ZIP', icon: <Archive size={14} />, onClick: () => setShowZipConfirm(true) },
  ];

  const getAddBtnMenuItems = () => [
    { label: '新增文件', icon: <FilePlus size={14} />, onClick: () => { uploadTargetIdRef.current = null; addNode(null, 'file'); } },
    { label: '新增文件夹', icon: <FolderPlus size={14} />, onClick: () => addNode(null, 'folder') },
  ];

  const handleNodeContextMenu = (e: React.MouseEvent, node: FileNode) => {
    const items = getNodeMenuItems(node);
    if (items.length === 0) return;
    treeCtx.show(e, items);
  };

  const handleRootContextMenu = (e: React.MouseEvent) => {
    rootCtx.show(e, getRootMenuItems());
  };

  const handleAddBtnClick = (e: React.MouseEvent) => {
    addBtnCtx.show(e, getAddBtnMenuItems());
  };

  const selectedFile = selectedFileId ? findNodeById(files, selectedFileId) : null;
  const isMdFile = selectedFile?.name.split('.').pop()?.toLowerCase() === 'md';
  const [mdPreview, setMdPreview] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex flex-col">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadFile} />
      <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />
      {treeCtx.menu}
      {rootCtx.menu}
      {addBtnCtx.menu}
      {editorCtx.menu}

      {/* ZIP 覆盖确认弹框 */}
      <Dialog open={showZipConfirm} onOpenChange={setShowZipConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传 ZIP 确认</DialogTitle>
            <DialogDescription>上传 ZIP 将覆盖当前技能的所有文件内容，此操作不可撤销。确定继续吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowZipConfirm(false)}>取消</Button>
            <Button size="sm" onClick={() => { setShowZipConfirm(false); zipInputRef.current?.click(); }}>确定上传</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top bar */}
      <header className="flex items-center h-12 px-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 gap-3">
        <button
          onClick={() => navigate('/skills')}
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
            onClick={openVersionPanel}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              latestTag
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            <Tag size={12} />
            {latestTag ? `v${latestTag.tag.replace(/^v/, '')}` : '未发布'}
          </button>
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
            onClick={handleDeleteSkill}
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
        <aside className="w-56 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0" onContextMenu={(e) => { e.preventDefault(); const target = (e.target as HTMLElement).closest('[data-node-id]'); if (target) { const id = target.getAttribute('data-node-id'); const node = findNodeById(files, id!); if (node) handleNodeContextMenu(e, node); } else { handleRootContextMenu(e); } }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">文件</span>
            <button
              onClick={handleAddBtnClick}
              className="p-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2">
            {files.length > 0 ? (
              files.map(node => (
                <FileTreeItem
                  key={node.id}
                  node={node}
                  selectedId={selectedFileId}
                  expandedFolders={expandedFolders}
                  editingNodeId={editingNodeId}
                  editingValue={editingValue}
                  onSelectFile={handleSelectFile}
                  onToggleFolder={handleToggleFolder}
                  onContextMenu={handleNodeContextMenu}
                  onEditingChange={setEditingValue}
                  onEditConfirm={confirmEdit}
                  onEditCancel={cancelEdit}
                  depth={0}
                />
              ))
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-4 text-center">暂无文件</p>
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-2">
                  <File size={12} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-xs text-gray-500 dark:text-slate-400">{selectedFile.name}</span>
                </div>
                {isMdFile && (
                  <div className="flex items-center bg-gray-200 dark:bg-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => setMdPreview(false)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${!mdPreview ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-700 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setMdPreview(true)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${mdPreview ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-700 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    >
                      预览
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {isMdFile && mdPreview ? (() => {
                  const fm = parseFrontmatter(content);
                  const mk = Object.keys(fm.meta);
                  return (
                  <div className="h-full overflow-auto md-preview bg-white dark:bg-slate-900">
                    <style>{`
                      .md-preview .wmde-markdown {
                        padding: 16px !important;
                        background: transparent !important;
                        color: inherit !important;
                      }
                      .md-preview .wmde-markdown h1,
                      .md-preview .wmde-markdown h2 {
                        border-bottom: none !important;
                        padding-bottom: 0 !important;
                      }
                      .dark .md-preview .wmde-markdown {
                        color: rgb(203, 213, 225) !important;
                      }
                      .dark .md-preview .wmde-markdown h1,
                      .dark .md-preview .wmde-markdown h2,
                      .dark .md-preview .wmde-markdown h3,
                      .dark .md-preview .wmde-markdown h4,
                      .dark .md-preview .wmde-markdown h5,
                      .dark .md-preview .wmde-markdown h6 {
                        color: rgb(226, 232, 240) !important;
                      }
                      .dark .md-preview .wmde-markdown code {
                        background-color: rgb(30, 41, 59) !important;
                        color: rgb(248, 250, 252) !important;
                      }
                      .dark .md-preview .wmde-markdown pre {
                        background-color: rgb(30, 41, 59) !important;
                        border: 1px solid rgb(51, 65, 85) !important;
                      }
                      .dark .md-preview .wmde-markdown pre code {
                        background-color: transparent !important;
                      }
                      .dark .md-preview .wmde-markdown a {
                        color: rgb(56, 189, 248) !important;
                      }
                      .dark .md-preview .wmde-markdown blockquote {
                        border-left-color: rgb(71, 85, 105) !important;
                        color: rgb(148, 163, 184) !important;
                      }
                      .dark .md-preview .wmde-markdown table {
                        border-color: rgb(51, 65, 85) !important;
                      }
                      .dark .md-preview .wmde-markdown td,
                      .dark .md-preview .wmde-markdown th {
                        border-color: rgb(51, 65, 85) !important;
                      }
                    `}</style>
                    {mk.length > 0 && (
                      <div className="mx-4 mt-3 mb-2 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                        <div className="grid gap-1.5 text-xs">
                          {mk.map(key => (
                            <div key={key} className="flex gap-2">
                              <span className="shrink-0 font-medium text-gray-500 dark:text-slate-400 min-w-[60px]">{key}</span>
                              <span className="text-gray-700 dark:text-slate-300 break-all">{fm.meta[key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="animate-spin" /></div>}>
                      <MarkdownPreview
                        source={fm.body}
                        rehypePlugins={[remarkGfm]}
                        style={{ minHeight: '100%', background: 'transparent' }}
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                      />
                    </Suspense>
                  </div>);
                })() : (
                  <CodeMirror
                    value={content}
                    onChange={handleContentChange}
                    theme={vscodeDark}
                    extensions={[...getLanguageExtension(selectedFile.name)]}
                    className="text-sm"
                    height="100%"
                    style={{ height: '100%' }}
                    onContextMenu={handleEditorContextMenu}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      highlightActiveLine: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      indentOnInput: true,
                    }}
                  />
                )}
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

      {/* Version Management Sheet */}
      <Sheet open={versionPanelOpen} onOpenChange={(open) => { if (!open) { setVersionPanelOpen(false); exitPreview(); setShowPublishForm(false); } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>版本管理</SheetTitle>
            <SheetDescription>发布版本、查看提交历史</SheetDescription>
          </SheetHeader>

          {/* Publish form */}
          {!previewTag && (
            <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                {!showPublishForm ? (
                  <Button size="sm" onClick={() => { setShowPublishForm(true); setPublishVersionInput(getNextVersion()); }}>
                    <Plus size={12} className="mr-1" />发布新版本
                  </Button>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={publishVersionInput}
                          onChange={(e) => setPublishVersionInput(e.target.value)}
                          placeholder="x.y.z"
                          className="h-7 w-28 text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={handlePublish}
                          disabled={isPublishing || !publishVersionInput.trim() || !/^\d+\.\d+\.\d+$/.test(publishVersionInput.trim())}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-xs"
                        >
                          {isPublishing ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowPublishForm(false); setPublishNoteInput(''); }} className="h-7 w-7 p-0 text-muted-foreground">
                          <X size={12} />
                        </Button>
                      </div>
                      <textarea
                        value={publishNoteInput}
                        onChange={(e) => setPublishNoteInput(e.target.value)}
                        placeholder="版本发布说明（可选）"
                        rows={2}
                        className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {previewTag ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-2.5 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">v{previewTag.tag.replace(/^v/, '')}</span>
                    <span className="text-[10px] text-muted-foreground">{previewTag.note || '无说明'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRollback(previewTag.tag)}
                      disabled={isRollingBack}
                      className="h-7 text-[10px] px-2"
                    >
                      {isRollingBack ? <Loader2 size={10} className="animate-spin mr-1" /> : <RotateCcw size={10} className="mr-1" />}
                      回滚
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewTag(null)}
                      className="h-7 w-7 p-0 text-muted-foreground"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-2 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{formatTimestamp(previewTag.createdAt)}</span>
                </div>
                {/* File list */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {previewFileList.map(node => (
                    <PreviewFileNode key={node.id} node={node} depth={0} selectedPath={previewFilePath} onSelect={(n) => handlePreviewFile(n.path)} />
                  ))}
                  {previewFileList.length === 0 && (
                    <div className="px-6 py-8 text-center text-xs text-muted-foreground">无文件</div>
                  )}
                </div>
                {/* Content area */}
                {previewFileContent !== null && (
                  <div className="border-t border-border flex flex-col" style={{ height: '50%' }}>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30 shrink-0">
                      <File size={12} className={getFileIconColor(previewFilePath.split('/').pop() || '')} />
                      <span className="text-xs font-medium truncate">{previewFilePath}</span>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      <CodeMirror
                        value={previewFileContent}
                        theme={vscodeDark}
                        extensions={[...getLanguageExtension(previewFilePath)]}
                        className="text-sm"
                        height="100%"
                        style={{ height: '100%' }}
                        editable={false}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: false,
                          highlightActiveLine: false,
                          bracketMatching: false,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : loadingVersions ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : (
              tags.length > 0 ? (
                <div className="divide-y divide-border">
                  {tags.map(t => (
                    <div key={t.tag} className={`px-6 py-3 hover:bg-muted/50 cursor-pointer transition-colors group ${currentTag === t.tag ? 'bg-primary/5' : ''}`} onClick={() => handlePreviewTag(t)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600">
                            v{t.tag.replace(/^v/, '')}
                          </span>
                          {currentTag === t.tag && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">当前</span>
                          )}
                          <span className="text-xs truncate max-w-[160px]">{t.note || '无说明'}</span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => handlePreviewTag(t)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="预览">
                            <Eye size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRollback(t.tag)} disabled={isRollingBack} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="回滚">
                            <RotateCcw size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTag(t.tag)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="删除">
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatTimestamp(t.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Tag size={24} className="opacity-20 mb-2" />
                  <p className="text-xs">暂无发布版本</p>
                </div>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-5 max-w-sm w-full mx-4">
            <p className="text-sm text-gray-700 dark:text-slate-200 mb-4">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
