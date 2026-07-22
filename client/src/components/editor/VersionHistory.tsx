import { useEffect, useState } from 'react';
import * as api from '../../api/client';
import type { VersionMeta } from '../../api/client';

interface Props {
  resumeId: string;
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function VersionHistory({ resumeId, open, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmRestore(null);
      setError(null);
      return;
    }
    loadVersions();
  }, [open, resumeId]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.fetchVersions(resumeId);
      setVersions(list);
    } catch {
      setError('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNamed = async () => {
    const name = prompt('请输入版本名称：', `手动存档`);
    if (!name) return;
    setSavingName(true);
    try {
      await api.createNamedVersion(resumeId, name);
      await loadVersions();
    } catch {
      alert('创建版本失败');
    } finally {
      setSavingName(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    setError(null);
    try {
      await api.restoreVersion(resumeId, versionId);
      setConfirmRestore(null);
      onRestored();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || '恢复版本失败');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm(`确定要删除这个版本吗？`)) return;
    try {
      await api.deleteVersion(resumeId, versionId);
      setVersions(prev => prev.filter(v => v.versionId !== versionId));
    } catch {
      alert('删除版本失败');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">版本历史</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Manual save button */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <button
            onClick={handleCreateNamed}
            disabled={savingName}
            className="w-full text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
          >
            {savingName ? '保存中...' : '+ 手动存档'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{error}</div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8 text-sm">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">暂无版本记录</div>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.versionId} className="border rounded p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium text-gray-800 truncate">{v.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {formatTime(v.timestamp)} · {formatSize(v.resumeSize)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmRestore(v.versionId)}
                      disabled={restoringId === v.versionId}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                    >
                      {restoringId === v.versionId ? '恢复中...' : '恢复'}
                    </button>
                    <button
                      onClick={() => handleDelete(v.versionId)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation dialog */}
        {confirmRestore && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-5 shadow-lg border border-gray-200 w-80">
              <p className="text-sm text-gray-700 mb-1">确定要恢复到这个版本吗？</p>
              <p className="text-xs text-red-500 mb-4">当前未保存的修改将丢失。</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  取消
                </button>
                <button
                  onClick={() => handleRestore(confirmRestore)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  确认恢复
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
