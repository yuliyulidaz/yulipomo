
import React from 'react';

interface EnergySavingOverlayProps {
  isVisible: boolean;
}

export const EnergySavingOverlay: React.FC<EnergySavingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[40] bg-black/80 pointer-events-none animate-in fade-in duration-700" 
      aria-hidden="true"
    />
  );
};
