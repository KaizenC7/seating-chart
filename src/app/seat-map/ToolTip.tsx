'use client';
import React from 'react';

// Add 'children' prop here
interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  children: React.ReactNode; // Add this line
}

// Pass 'children' through props
export const Tooltip: React.FC<TooltipProps> = ({ visible, x, y, children }) => {
  if (!visible) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: y,
    left: x,
    transform: 'translate(-50%, -110%)',
    pointerEvents: 'none',
    zIndex: 50,
  };

  return (
    <div style={style} className="rounded-xl bg-white shadow-xl ring-1 ring-black/5 px-4 py-3 text-sm">
      {/* Render the children content passed to the component */}
      {children}
    </div>
  );
};