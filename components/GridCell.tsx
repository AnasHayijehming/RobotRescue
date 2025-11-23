import React from 'react';
import { CellType, Position, Direction } from '../types';
import { Bot, BatteryCharging, Box, Flag } from 'lucide-react';

interface GridCellProps {
  x: number;
  y: number;
  type: CellType;
  robotPosition: Position;
  robotDirection: Direction;
  isRobotHere: boolean;
}

const GridCell: React.FC<GridCellProps> = ({ x, y, type, isRobotHere, robotDirection }) => {
  
  // Determine rotation based on last move direction
  const getRotationClass = (dir: Direction) => {
    switch (dir) {
      case Direction.UP: return 'rotate-0';
      case Direction.RIGHT: return 'rotate-90';
      case Direction.DOWN: return 'rotate-180';
      case Direction.LEFT: return '-rotate-90';
      default: return 'rotate-0';
    }
  };

  return (
    <div 
      className={`
        relative w-full h-full rounded-lg md:rounded-xl 
        flex items-center justify-center overflow-hidden
        transition-all duration-300
        ${type === CellType.OBSTACLE 
          ? 'bg-stone-400 border-b-4 border-stone-600' 
          : 'bg-white border-b-4 border-slate-200 shadow-sm'}
        ${type === CellType.GOAL ? 'bg-green-50 border-green-200' : ''}
        ${type === CellType.START ? 'bg-blue-50 border-blue-200' : ''}
      `}
    >
      {/* Coordinates (Debug/Learning) */}
      <span className="absolute top-1 left-1.5 text-[8px] md:text-[10px] text-slate-300 font-bold font-mono">
        {x},{y}
      </span>

      {/* Render Obstacle (3D Rock effect) */}
      {type === CellType.OBSTACLE && (
        <div className="w-full h-full flex items-center justify-center">
            <Box className="w-3/5 h-3/5 text-stone-200" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-stone-500 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/20"></div>
        </div>
      )}

      {/* Render Start Marker */}
      {type === CellType.START && !isRobotHere && (
        <div className="opacity-30 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-300 mb-1"></div>
            <span className="text-[8px] font-bold text-blue-300 uppercase">Start</span>
        </div>
      )}

      {/* Render Goal */}
      {type === CellType.GOAL && !isRobotHere && (
        <div className="animate-pulse w-full h-full flex items-center justify-center p-2">
           <div className="w-full h-full border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center bg-green-100/50">
             <BatteryCharging className="w-2/3 h-2/3 text-green-500 fill-green-100" />
           </div>
        </div>
      )}

      {/* Render Robot */}
      {isRobotHere && (
        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-transform duration-500 ease-in-out ${getRotationClass(robotDirection)}`}>
           <div className="relative w-[80%] h-[80%] flex items-center justify-center filter drop-shadow-xl">
              <Bot className="w-full h-full text-blue-600 fill-blue-50" strokeWidth={1.5} />
              {/* Eyes */}
              <div className="absolute top-[32%] left-[28%] w-[12%] h-[12%] bg-cyan-300 rounded-full animate-ping" />
              <div className="absolute top-[32%] right-[28%] w-[12%] h-[12%] bg-cyan-300 rounded-full animate-ping" />
           </div>
        </div>
      )}
      
      {/* Success Particle Effect (Simple CSS) */}
      {type === CellType.GOAL && isRobotHere && (
         <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="w-full h-full bg-yellow-400/20 animate-pulse rounded-lg"></div>
         </div>
      )}
    </div>
  );
};

export default GridCell;