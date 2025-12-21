
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

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
        const img = new Image();
        img.onload = () => {
          // 이미지 최적화: 최대 800px, JPEG 압축
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // PNG 대신 압축 효율이 좋은 JPEG 사용 (0.8 퀄리티)
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          onImageSelected(optimizedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (currentImage) {
    return (
      <div className="relative group w-32 h-32 mx-auto">
        <img 
          src={currentImage} 
          alt="Character Preview" 
          className="w-full h-full object-cover rounded-full border-4 border-indigo-100 shadow-md"
        />
        <button
          onClick={onClear}
          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
          title="이미지 삭제"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={triggerUpload}
      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
    >
      <div className="bg-indigo-100 p-3 rounded-full mb-2 group-hover:bg-indigo-200 transition-colors">
        <Upload className="text-indigo-600" size={24} />
      </div>
      <span className="text-sm text-gray-500 font-medium group-hover:text-indigo-600">캐릭터 이미지 업로드</span>
      <span className="text-xs text-gray-400 mt-1">배경이 투명한 PNG 권장</span>
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
