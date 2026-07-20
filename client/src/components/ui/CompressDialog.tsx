import { useResumeStore } from '../../stores/useResumeStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function CompressDialog({ open, onClose, onApply }: Props) {
  const { compressSettings, setCompressSettings } = useResumeStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">智能一页纸</h2>
        <p className="text-sm text-gray-500 mb-4">内容超出一页，请选择压缩策略：</p>

        <label className="flex items-start gap-3 mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.compact}
            onChange={e => setCompressSettings({ compact: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">📏 紧凑模式</span>
            <p className="text-xs text-gray-400">缩小边距、行距、字号，内容不变</p>
          </div>
        </label>

        <label className="flex items-start gap-3 mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.trim}
            onChange={e => setCompressSettings({ trim: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">✂️ 精简模式</span>
            <p className="text-xs text-gray-400">缩短描述文本，保留前 3 条亮点</p>
          </div>
        </label>

        <label className="flex items-start gap-3 mb-4 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={compressSettings.hide}
            onChange={e => setCompressSettings({ hide: e.target.checked })} className="mt-1" />
          <div>
            <span className="font-medium text-sm">🎯 隐藏次要模块</span>
            <p className="text-xs text-gray-400">隐藏证书、语言等模块</p>
          </div>
        </label>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">取消</button>
          <button onClick={onApply} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">应用</button>
        </div>
      </div>
    </div>
  );
}
