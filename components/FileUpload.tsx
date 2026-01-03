import React, { useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';

interface FileUploadProps {
  onImageSelected: (base64: string) => void;
  currentImage: string | null;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onImageSelected, currentImage, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // 이미지를 캔버스로 리사이징하는 복잡한 로직을 제거하고 
        // 크로퍼 컴포넌트에서 처리할 수 있도록 원본 Base64를 그대로 전달합니다.
        const base64 = e.target?.result as string;
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (currentImage) {
    return (
      <div className="relative group w-12 h-12">
        <button
          onClick={triggerUpload}
          className="w-full h-full bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-light transition-colors"
          title="이미지 교체"
        >
          <Camera size={18} />
        </button>
        <button
          onClick={onClear}
          className="absolute -top-1 -right-1 bg-surface text-text-primary border border-border rounded-full p-0.5 shadow-sm hover:text-rose-500 transition-colors"
          title="이미지 삭제"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={triggerUpload}
      className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary-light transition-colors group"
    >
      <Upload size={18} />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};