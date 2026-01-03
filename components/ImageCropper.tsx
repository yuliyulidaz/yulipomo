import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 이미지 로드 시 초기 크기 및 위치 계산
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const containerSize = Math.min(window.innerWidth - 40, 350); // 가이드 박스 크기 (최대 350px)
      let baseScale = 1;

      // 이미지가 가이드 박스를 꽉 채우도록 초기 줌 설정
      if (img.width < img.height) {
        baseScale = containerSize / img.width;
      } else {
        baseScale = containerSize / img.height;
      }

      setImageSize({ width: img.width, height: img.height });
      setMinZoom(baseScale);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const executeCrop = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const cropSize = 600; // 결과물 해상도 (600x600)
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const containerSize = Math.min(window.innerWidth - 40, 350);
      const scale = cropSize / containerSize;

      // 이미지의 원래 크기와 현재 줌/오프셋을 계산하여 캔버스에 그리기
      // 가이드 박스의 중앙을 기준으로 이미지를 배치
      const currentScale = minZoom * zoom;
      const drawWidth = imageSize.width * currentScale * scale;
      const drawHeight = imageSize.height * currentScale * scale;
      const drawX = (offset.x * scale) + (cropSize / 2) - (drawWidth / 2);
      const drawY = (offset.y * scale) + (cropSize / 2) - (drawHeight / 2);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cropSize, cropSize);
      ctx.drawImage(imageRef.current, drawX, drawY, drawWidth, drawHeight);

      onCrop(canvas.toDataURL('image/jpeg', 0.7));
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300 select-none touch-none">
      <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-10">
        <button onClick={onCancel} className="p-2 text-white/60 hover:text-white transition-colors">
          <X size={28} />
        </button>
        <h3 className="text-white font-black text-sm tracking-widest uppercase">영역 선택</h3>
        <button onClick={executeCrop} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-95">
          결정 <Check size={18} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full aspect-square max-w-[350px] overflow-hidden flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* 가이드 박스 외 영역 어둡게 처리 */}
        <div className="absolute inset-0 pointer-events-none z-10 border-[2px] border-white/30 rounded-2xl shadow-[0_0_0_100vw_rgba(0,0,0,0.7)]"></div>

        {/* 실제 이미지 */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt="To be cropped"
          className="max-w-none transition-transform duration-75 ease-out cursor-move"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${minZoom * zoom})`,
            width: imageSize.width > 0 ? 'auto' : '100%'
          }}
          draggable={false}
        />
      </div>

      <div className="mt-12 w-full max-w-[300px] space-y-6 px-6">
        <div className="flex items-center gap-4 text-white/40">
          <ZoomOut size={16} />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <ZoomIn size={16} />
        </div>
        <p className="text-white/40 text-[10px] text-center font-bold uppercase tracking-widest leading-relaxed">
          사진을 드래그하거나 줌 슬라이더를 조절하여<br />최애의 예쁜 얼굴을 가이드 안에 맞춰주세요.
        </p>
      </div>

      {/* Sparkle Decorations */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-20">
        <Sparkles size={40} className="text-primary animate-pulse" />
      </div>
    </div>
  );

  return createPortal(content, document.body);
};