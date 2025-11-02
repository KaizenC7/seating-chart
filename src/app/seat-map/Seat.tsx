'use client';
import React from 'react';
import { SeatData } from './interface';

interface SeatProps {
  seat: SeatData;
  fillColor: string;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: (seat: SeatData) => void;
  onHover: (seat: SeatData | null, pos: { clientX: number; clientY: number } | null) => void;
}
export const Seat: React.FC<SeatProps> = ({ seat, fillColor, isSelected, isFiltered, onClick, onHover }) => {
  const isBooked = seat.status === "booked";
  // Check for the restricted view property
  const isRestricted = seat.isRestrictedView === true;

  const strokeColor = isSelected ? '#111827' : 'white';
  const strokeWidth = isSelected ? 3 : 2;
  const opacity = isBooked ? 0.3 : (isFiltered ? 1 : 0.2);
  const cursorStyle = (isBooked || !isFiltered) ? 'not-allowed' : 'pointer';
  const radius = 7;

 const handleMouseEnter = (e: React.MouseEvent<SVGElement>) => {
  if (isBooked) return;
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
  onHover(seat, { clientX: e.clientX, clientY: e.clientY });
};


  const handleMouseLeave = () => {
    onHover(null, null);
  };

  // Conditional Rendering for half-filled effect
  if (isRestricted && !isBooked) {
    // Render two half circles (one filled, one slightly transparent or white)
    
    return (
      <g
        opacity={opacity}
        style={{ cursor: cursorStyle }}
        onClick={() => (!isBooked && isFiltered) && onClick(seat)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background half (e.g., white or slightly transparent fill) */}
        <circle
          cx={seat.x}
          cy={seat.y}
          r={radius}
          fill="white" 
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          clipPath={`inset(0 0 0 ${radius}px)`} // Clip right half
        />
        {/* Filled half */}
        <circle
          cx={seat.x}
          cy={seat.y}
          r={radius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          clipPath={`inset(0 ${radius}px 0 0)`} // Clip left half
        />
      </g>
    );
  }

  // Default rendering for full or booked seats
  return (
    <circle
      cx={seat.x}
      cy={seat.y}
      r={radius}
      fill={isBooked ? '#9CA3AF' : fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={{ cursor: cursorStyle, transition: 'opacity 0.2s ease-in-out' }}
      onClick={() => (!isBooked && isFiltered) && onClick(seat)}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    />
  );
};