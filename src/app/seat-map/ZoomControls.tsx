'use client';
import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
      <button onClick={onZoomIn} className="h-9 w-9 rounded-lg bg-white shadow ring-1 ring-black/10 hover:bg-gray-50 text-xl font-semibold">+</button>
      <button onClick={onZoomOut} className="h-9 w-9 rounded-lg bg-white shadow ring-1 ring-black/10 hover:bg-gray-50 text-xl font-semibold">−</button>
      <button onClick={onReset} className="h-9 w-9 rounded-lg bg-white shadow ring-1 ring-black/10 hover:bg-gray-50 text-xl">⟲</button>
    </div>
  );
};