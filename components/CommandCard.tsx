import React from 'react';
import { Direction } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

interface CommandCardProps {
  command: Direction;
  index?: number;
  onClick?: () => void;
  isControl?: boolean; 
  isActive?: boolean;
  shortcut?: string;
}

const CommandCard: React.FC<CommandCardProps> = ({ command, index, onClick, isControl = false, isActive = false, shortcut }) => {
  
  const getIcon = () => {
    // Controls get larger icons for easier tapping on mobile
    const iconClass = isControl 
      ? "w-10 h-10 md:w-12 md:h-12" 
      : "w-6 h-6 md:w-9 md:h-9";

    return (
      <>
        {command === Direction.UP && <ArrowUp strokeWidth={4} className={iconClass} />}
        {command === Direction.DOWN && <ArrowDown strokeWidth={4} className={iconClass} />}
        {command === Direction.LEFT && <ArrowLeft strokeWidth={4} className={iconClass} />}
        {command === Direction.RIGHT && <ArrowRight strokeWidth={4} className={iconClass} />}
      </>
    );
  };

  const getStyle = () => {
    // 3D Button Styles (color-500 for bg, color-700 for border-bottom)
    switch (command) {
      case Direction.UP: 
        return 'bg-sky-400 border-sky-600 text-white active:bg-sky-500';
      case Direction.DOWN: 
        return 'bg-indigo-400 border-indigo-600 text-white active:bg-indigo-500';
      case Direction.LEFT: 
        return 'bg-rose-400 border-rose-600 text-white active:bg-rose-500';
      case Direction.RIGHT: 
        return 'bg-emerald-400 border-emerald-600 text-white active:bg-emerald-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl transition-all duration-75 touch-manipulation select-none
        border-b-[4px] md:border-b-[6px] active:border-b-0 active:translate-y-[4px]
        ${getStyle()}
        ${isControl 
            ? 'w-full aspect-square m-0 shadow-lg active:shadow-none' 
            : 'w-14 h-20 md:w-20 md:h-26 min-w-[3.5rem] md:min-w-[5rem] shadow-md hover:-translate-y-1 hover:border-b-[6px]'
        }
        ${isActive ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''}
      `}
      aria-label={`เพิ่มคำสั่ง ${command}`}
    >
      {getIcon()}
      
      {/* Keyboard Shortcut Hint */}
      {shortcut && isControl && (
        <span className="hidden md:block absolute top-1.5 right-2 text-[10px] font-black opacity-60">
          {shortcut}
        </span>
      )}
      
      {/* Sequence Index Badge */}
      {!isControl && index !== undefined && (
        <span className="absolute -top-2 -left-2 w-5 h-5 md:w-6 md:h-6 bg-white text-slate-800 rounded-full text-[10px] md:text-xs font-bold flex items-center justify-center shadow-sm border border-slate-200">
          {index + 1}
        </span>
      )}
    </button>
  );
};

export default CommandCard;