import { useRef } from 'react';
import * as api from '../../api/client';

interface Props {
  currentPhoto: string;
  onPhotoChange: (filename: string) => void;
}

export default function PhotoUploader({ currentPhoto, onPhotoChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('照片不能超过 5MB');
      return;
    }
    try {
      // 删除旧照片
      if (currentPhoto) await api.deletePhoto(currentPhoto).catch(() => {});
      const filename = await api.uploadPhoto(file);
      onPhotoChange(filename);
    } catch {
      alert('上传失败');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
        {currentPhoto ? (
          <img src={`/photo/${currentPhoto}`} alt="头像" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">📷</div>
        )}
      </div>
      <div>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 bg-gray-100 text-sm rounded hover:bg-gray-200"
        >
          {currentPhoto ? '更换照片' : '上传照片'}
        </button>
        {currentPhoto && (
          <button
            onClick={() => onPhotoChange('')}
            className="ml-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded"
          >
            移除
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最大 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
    </div>
  );
}
