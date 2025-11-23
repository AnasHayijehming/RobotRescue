import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trash, Wand2, HelpCircle, Keyboard, X, ChevronRight, Menu, RefreshCw, ArrowRight, Trophy, AlertTriangle } from 'lucide-react';
import GridCell from './components/GridCell';
import CommandCard from './components/CommandCard';
import { generateLevelWithGemini } from './services/geminiService';
import { PREDEFINED_LEVELS } from './constants';
import { Direction, GameStatus, Position, Command, LevelData, CellType } from './types';

const App: React.FC = () => {
  // --- State ---
  const [level, setLevel] = useState<LevelData>(PREDEFINED_LEVELS[0]);
  const [robotPos, setRobotPos] = useState<Position>(PREDEFINED_LEVELS[0].start);
  const [robotDir, setRobotDir] = useState<Direction>(Direction.RIGHT);
  const [commands, setCommands] = useState<Command[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.PLANNING);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  // --- Refs ---
  const shouldStopRef = useRef(false);
  const commandsRef = useRef(commands);
  const gameStatusRef = useRef(gameStatus);

  // Keep refs synced
  useEffect(() => {
    commandsRef.current = commands;
    gameStatusRef.current = gameStatus;
  }, [commands, gameStatus]);

  // --- Helpers ---
  const resetLevel = useCallback(() => {
    setRobotPos(level.start);
    setRobotDir(Direction.RIGHT); 
    setGameStatus(GameStatus.PLANNING);
    setActiveCommandIndex(null);
    shouldStopRef.current = false;
  }, [level]);

  const clearCommands = useCallback(() => {
    if (gameStatusRef.current === GameStatus.RUNNING) return;
    setCommands([]);
    resetLevel();
  }, [resetLevel]);

  const loadLevel = (newLevel: LevelData) => {
    setLevel(newLevel);
    setCommands([]);
    setRobotPos(newLevel.start);
    setRobotDir(Direction.RIGHT);
    setGameStatus(GameStatus.PLANNING);
    setActiveCommandIndex(null);
  };

  const handleNextLevel = () => {
    const currentIndex = PREDEFINED_LEVELS.findIndex(l => l.id === level.id);
    if (currentIndex !== -1 && currentIndex < PREDEFINED_LEVELS.length - 1) {
      loadLevel(PREDEFINED_LEVELS[currentIndex + 1]);
    } else {
      // Loop back or generate AI level? Let's generate AI for endless fun
      handleGenerateLevel();
    }
  };

  const handleGenerateLevel = async () => {
    setIsGenerating(true);
    const newLevel = await generateLevelWithGemini('medium');
    loadLevel(newLevel);
    setIsGenerating(false);
  };

  const addCommand = useCallback((cmd: Command) => {
    if (gameStatusRef.current !== GameStatus.PLANNING) return;
    setCommands(prev => [...prev, cmd]);
    
    // Auto scroll to right
    const strip = document.getElementById('command-strip');
    if (strip) {
      setTimeout(() => {
        strip.scrollTo({ left: strip.scrollWidth, behavior: 'smooth' });
      }, 50);
    }
  }, []);

  const removeCommand = (index: number) => {
    if (gameStatus !== GameStatus.PLANNING) return;
    const newCommands = [...commands];
    newCommands.splice(index, 1);
    setCommands(newCommands);
  };

  const removeLastCommand = useCallback(() => {
    if (gameStatusRef.current !== GameStatus.PLANNING) return;
    setCommands(prev => {
        if (prev.length === 0) return prev;
        const newCmds = [...prev];
        newCmds.pop();
        return newCmds;
    });
  }, []);

  // --- Game Logic ---
  const checkCollision = (pos: Position): boolean => {
    if (pos.x < 0 || pos.x >= level.gridSize || pos.y < 0 || pos.y >= level.gridSize) {
      return true;
    }
    return level.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
  };

  const runSimulation = async () => {
    if (commandsRef.current.length === 0) return;
    if (gameStatusRef.current === GameStatus.RUNNING) return;

    setGameStatus(GameStatus.RUNNING);
    shouldStopRef.current = false;
    
    let currentPos = { ...level.start };
    setRobotPos(currentPos);
    
    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < commandsRef.current.length; i++) {
      if (shouldStopRef.current) break;
      
      setActiveCommandIndex(i);
      // Scroll strip to keep active command in view
      const cardId = `cmd-card-${i}`;
      document.getElementById(cardId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      const cmd = commandsRef.current[i];
      let nextPos = { ...currentPos };

      switch (cmd) {
        case Direction.UP: nextPos.y -= 1; break;
        case Direction.DOWN: nextPos.y += 1; break;
        case Direction.LEFT: nextPos.x -= 1; break;
        case Direction.RIGHT: nextPos.x += 1; break;
      }

      setRobotDir(cmd); 
      await new Promise(r => setTimeout(r, 600));

      if (checkCollision(nextPos)) {
        setGameStatus(GameStatus.FAILED);
        return;
      }

      currentPos = nextPos;
      setRobotPos(currentPos);
    }

    if (currentPos.x === level.goal.x && currentPos.y === level.goal.y) {
      setGameStatus(GameStatus.SUCCESS);
    } else {
      setGameStatus(GameStatus.FAILED);
    }
  };

  const stopSimulation = useCallback(() => {
    shouldStopRef.current = true;
    setGameStatus(GameStatus.PLANNING);
    resetLevel();
  }, [resetLevel]);

  // --- Keyboard Event Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameStatusRef.current === GameStatus.RUNNING) {
        if (e.key === 'Escape') stopSimulation();
        return;
      }

      if (showInstructions) {
        if (e.key === 'Enter' || e.key === 'Escape') setShowInstructions(false);
        return;
      }

      // If Modal is open (Success/Fail), Handle Enter to continue/retry
      if (gameStatusRef.current === GameStatus.SUCCESS) {
        if (e.key === 'Enter') handleNextLevel();
        return;
      }
      if (gameStatusRef.current === GameStatus.FAILED) {
        if (e.key === 'Enter') resetLevel();
        return;
      }

      switch (e.key) {
        case 'ArrowUp': addCommand(Direction.UP); break;
        case 'ArrowDown': addCommand(Direction.DOWN); break;
        case 'ArrowLeft': addCommand(Direction.LEFT); break;
        case 'ArrowRight': addCommand(Direction.RIGHT); break;
        case 'Backspace': removeLastCommand(); break;
        case 'Enter': runSimulation(); break;
        case 'Escape': resetLevel(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addCommand, removeLastCommand, stopSimulation, resetLevel, showInstructions, level]);

  // --- Render Helpers ---
  const getCellType = (x: number, y: number): CellType => {
    if (x === level.goal.x && y === level.goal.y) return CellType.GOAL;
    if (x === level.start.x && y === level.start.y) return CellType.START;
    if (level.obstacles.some(o => o.x === x && o.y === y)) return CellType.OBSTACLE;
    return CellType.EMPTY;
  };

  return (
    <div className="h-[100dvh] w-screen bg-gradient-to-br from-sky-50 to-indigo-50 text-stone-800 font-sans flex flex-col overflow-hidden selection:bg-none">
      
      {/* 1. TOP NAVBAR */}
      <header className="shrink-0 h-12 md:h-16 px-3 md:px-4 flex items-center justify-between z-30 bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-white p-1.5 md:p-2 rounded-xl shadow-lg shadow-blue-200">
             <Trophy className="w-4 h-4 md:w-5 md:h-5" /> 
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold leading-tight text-slate-700 tracking-tight">Robot Rescue</h1>
            <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Puzzle</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Level Selector Dropdown */}
          <div className="relative group">
            <select 
              className="appearance-none pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 bg-white border-2 border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm hover:border-slate-300 w-[100px] md:w-[140px] truncate"
              onChange={(e) => {
                const id = e.target.value;
                const found = PREDEFINED_LEVELS.find(l => l.id.toString() === id);
                if (found) loadLevel(found);
              }}
              value={PREDEFINED_LEVELS.some(l => l.id === level.id) ? level.id : ''}
            >
              <option value="" disabled>เลือกด่าน</option>
              {PREDEFINED_LEVELS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400 pointer-events-none rotate-90" />
          </div>

           <button 
             onClick={handleGenerateLevel}
             disabled={isGenerating || gameStatus === GameStatus.RUNNING}
             className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-xl border-2 border-purple-200 active:scale-95 transition-all hover:bg-purple-200"
             title="สร้างด่านด้วย AI"
           >
             {isGenerating ? <Wand2 className="animate-spin w-4 h-4 md:w-5 md:h-5"/> : <Wand2 className="w-4 h-4 md:w-5 md:h-5"/>}
           </button>
           <button 
             onClick={() => setShowInstructions(true)}
             className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-xl border-2 border-yellow-200 active:scale-95 transition-all hover:bg-yellow-200"
           >
             <HelpCircle className="w-5 h-5 md:w-[22px] md:h-[22px]" />
           </button>
        </div>
      </header>

      {/* 2. MAIN GAME AREA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT/TOP: Game Board */}
        <div className="flex-1 flex flex-col relative items-center justify-center p-2 md:p-4 lg:p-8 min-h-0">
          
          {/* The Board Background Card 
              Updated to ensure proper square aspect ratio and responsive sizing using clamp/min logic
          */}
          <div 
             className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl border-4 border-slate-100 ring-1 ring-slate-200/50 transition-all flex items-center justify-center aspect-square mx-auto"
             style={{
               width: 'min(100% - 24px, 500px, 50dvh)', 
             }}
          >
             {/* The Grid */}
             <div 
               className="w-full h-full grid gap-1 md:gap-2 bg-slate-200 rounded-xl p-1.5 md:p-2 border-inner"
               style={{ 
                 gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))`,
                 gridTemplateRows: `repeat(${level.gridSize}, minmax(0, 1fr))`
               }}
             >
               {Array.from({ length: level.gridSize * level.gridSize }).map((_, index) => {
                 const x = index % level.gridSize;
                 const y = Math.floor(index / level.gridSize);
                 return (
                   <div key={`${x}-${y}`} className="w-full h-full perspective-1000">
                     <GridCell 
                       x={x} 
                       y={y} 
                       type={getCellType(x, y)}
                       isRobotHere={robotPos.x === x && robotPos.y === y}
                       robotPosition={robotPos}
                       robotDirection={robotDir}
                     />
                   </div>
                 );
               })}
             </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-0" />
        </div>

        {/* RIGHT/BOTTOM: Control Center */}
        <div className="shrink-0 bg-white/90 backdrop-blur-xl border-t-2 lg:border-t-0 lg:border-l-2 border-slate-100 lg:w-[420px] flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[24px] lg:rounded-none pb-4 md:pb-6 lg:pb-0">
          
          {/* Draggable Handle for Mobile (Visual only) */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2 mb-1 lg:hidden opacity-50" />

          {/* 1. Command Strip (The Code) */}
          <div className="px-2 md:px-4 py-1 md:py-2 shrink-0">
             <div className="flex justify-between items-end mb-1 md:mb-2">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Main Sequence</span>
                </div>
                <button 
                  onClick={clearCommands} 
                  className="text-[10px] md:text-xs font-bold text-red-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                   <Trash size={12} /> ลบทั้งหมด
                </button>
             </div>
             
             {/* Scrollable Container */}
             <div 
               id="command-strip"
               className="bg-slate-100/50 border-2 border-slate-200 rounded-2xl h-16 md:h-20 md:h-28 flex items-center px-2 gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x"
             >
                {commands.length === 0 && (
                   <div className="w-full text-center text-slate-400 text-[10px] md:text-sm font-medium animate-pulse px-4">
                     กดปุ่มลูกศรเพื่อวางแผน...
                   </div>
                )}
                
                {commands.map((cmd, idx) => (
                  <div key={idx} id={`cmd-card-${idx}`} className="snap-center shrink-0 py-1 md:py-2">
                    <CommandCard 
                      command={cmd} 
                      index={idx}
                      onClick={() => removeCommand(idx)}
                      isActive={idx === activeCommandIndex}
                    />
                  </div>
                ))}
                
                {/* Placeholder ghost card at end */}
                <div className="w-4 shrink-0" />
             </div>
          </div>

          {/* 2. Control Pad */}
          <div className="flex-1 px-2 md:px-4 lg:p-8 bg-white/0 flex flex-row lg:flex-col gap-2 md:gap-4 lg:gap-6 items-center justify-between lg:justify-center">
             
             {/* Direction Arrows */}
             <div className="flex-1 flex justify-center items-center lg:flex-none lg:w-full">
                <div className="grid grid-cols-3 gap-1 md:gap-3 p-1.5 md:p-3 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 shadow-inner transform scale-100 lg:scale-110 transition-transform">
                   <div className="col-start-2">
                      <CommandCard command={Direction.UP} isControl onClick={() => addCommand(Direction.UP)} shortcut="↑" />
                   </div>
                   <div className="col-start-1 row-start-2">
                      <CommandCard command={Direction.LEFT} isControl onClick={() => addCommand(Direction.LEFT)} shortcut="←" />
                   </div>
                   <div className="col-start-2 row-start-2">
                      <CommandCard command={Direction.DOWN} isControl onClick={() => addCommand(Direction.DOWN)} shortcut="↓" />
                   </div>
                   <div className="col-start-3 row-start-2">
                      <CommandCard command={Direction.RIGHT} isControl onClick={() => addCommand(Direction.RIGHT)} shortcut="→" />
                   </div>
                </div>
             </div>

             {/* Action Buttons (Play/Stop/Reset) */}
             <div className="flex flex-col gap-1.5 md:gap-3 w-[100px] xs:w-[130px] md:w-[160px] lg:w-full lg:max-w-[320px] items-stretch justify-center">
                
                {gameStatus === GameStatus.RUNNING ? (
                  <button 
                    onClick={stopSimulation}
                    className="h-auto py-3 md:py-4 lg:py-6 bg-red-500 hover:bg-red-400 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-xl border-b-[4px] md:border-b-[6px] border-red-700 active:border-b-0 active:translate-y-1.5 transition-all shadow-xl shadow-red-200 flex flex-col lg:flex-row items-center justify-center gap-1 md:gap-2"
                  >
                    <div className="p-1 bg-red-600 rounded-full"><X size={20} className="w-4 h-4 md:w-7 md:h-7" /></div>
                    <span>หยุด</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 w-full">
                    {/* Primary Action: RUN */}
                    <button 
                      onClick={() => runSimulation()}
                      disabled={commands.length === 0}
                      className={`
                        group relative overflow-hidden
                        py-2 md:py-3 lg:py-5 rounded-xl md:rounded-2xl font-black text-sm md:text-lg lg:text-2xl border-b-[4px] lg:border-b-[8px] active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col lg:flex-row items-center justify-center gap-0.5 md:gap-3
                        ${commands.length === 0 
                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-400 text-white border-green-700 shadow-green-200'
                        }
                      `}
                    >
                      <div className={`p-1 rounded-full transition-transform group-hover:scale-110 ${commands.length > 0 ? 'bg-white/20' : 'bg-transparent'}`}>
                        <Play fill="currentColor" className={`w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 ${commands.length > 0 ? "ml-0.5" : ""}`} /> 
                      </div>
                      <span>รันคำสั่ง!</span>
                    </button>

                    {/* Secondary Action: RESET */}
                    <button 
                      onClick={resetLevel}
                      disabled={gameStatus === GameStatus.RUNNING}
                      className="py-1.5 md:py-2 lg:py-3 bg-amber-400 hover:bg-amber-300 text-amber-900 rounded-lg md:rounded-xl font-bold text-xs md:text-sm lg:text-lg border-b-[3px] md:border-b-[4px] border-amber-600 active:border-b-0 active:translate-y-1 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                       <RefreshCw className="w-3 h-3 md:w-[18px] md:h-[18px] lg:w-6 lg:h-6" />
                       <span>เริ่มใหม่</span>
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      
      {/* 1. SUCCESS MODAL */}
      {gameStatus === GameStatus.SUCCESS && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center border-4 border-white ring-4 ring-green-400 relative overflow-hidden animate-in zoom-in-95 duration-300">
               {/* Confetti Background effect could go here */}
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent -z-10"></div>
               
               <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-200 shadow-inner">
                  <Trophy size={40} className="md:w-12 md:h-12 text-green-500 drop-shadow-sm" />
               </div>
               
               <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">เก่งมาก!</h2>
               <p className="text-slate-500 mb-6 md:mb-8 font-medium text-sm md:text-base">ภารกิจสำเร็จ หุ่นยนต์กลับถึงฐานแล้ว</p>
               
               <div className="space-y-3">
                 <button 
                   onClick={handleNextLevel}
                   className="w-full py-3 md:py-4 bg-green-500 hover:bg-green-400 text-white text-base md:text-lg font-bold rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                 >
                    ด่านถัดไป <ArrowRight size={20} />
                 </button>
                 <button 
                    onClick={resetLevel}
                    className="w-full py-2 md:py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm md:text-base"
                 >
                    เล่นด่านเดิมอีกครั้ง
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* 2. FAILED MODAL */}
      {gameStatus === GameStatus.FAILED && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center border-4 border-white ring-4 ring-red-400 animate-in zoom-in-95 duration-300 shake-animation">
               
               <div className="w-20 h-20 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200 shadow-inner">
                  <AlertTriangle size={40} className="md:w-12 md:h-12 text-red-500" />
               </div>
               
               <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">อุ๊บส์! ชนแล้ว</h2>
               <p className="text-slate-500 mb-6 md:mb-8 font-medium text-sm md:text-base">โปรแกรมมีข้อผิดพลาด ลองตรวจสอบคำสั่งดูใหม่นะ</p>
               
               <div className="space-y-3">
                 <button 
                   onClick={resetLevel}
                   className="w-full py-3 md:py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-base md:text-lg font-bold rounded-2xl border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-yellow-200 flex items-center justify-center gap-2"
                 >
                    <RefreshCw size={20} /> ลองใหม่อีกครั้ง
                 </button>
                 <button 
                    onClick={clearCommands}
                    className="w-full py-2 md:py-3 text-red-400 font-bold hover:text-red-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                 >
                    <Trash size={16} /> ลบคำสั่งทั้งหมด
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* 3. INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInstructions(false)}>
           <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300 border-4 border-white ring-1 ring-slate-200" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowInstructions(false)} 
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500"/>
              </button>
              
              <div className="text-center mb-6">
                 <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-3 shadow-sm border-b-4 border-blue-200">
                    <HelpCircle size={32} className="text-blue-500"/>
                 </div>
                 <h2 className="text-xl md:text-2xl font-black text-slate-800">วิธีการเล่น</h2>
              </div>

              <div className="space-y-3 md:space-y-4">
                 <div className="flex gap-4 items-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base md:text-lg font-black text-blue-500 shadow-sm border border-slate-100 shrink-0">1</div>
                    <p className="text-sm md:text-base text-slate-600 font-medium">ดูแผนที่และวางแผนพาหุ่นยนต์ไปที่ <strong className="text-green-600">แท่นชาร์จ</strong></p>
                 </div>
                 <div className="flex gap-4 items-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base md:text-lg font-black text-purple-500 shadow-sm border border-slate-100 shrink-0">2</div>
                    <p className="text-sm md:text-base text-slate-600 font-medium">กดปุ่ม <strong className="text-blue-500">ลูกศร</strong> เพื่อเขียนคำสั่งทีละขั้นตอน</p>
                 </div>
                 <div className="flex gap-4 items-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base md:text-lg font-black text-green-500 shadow-sm border border-slate-100 shrink-0">3</div>
                    <p className="text-sm md:text-base text-slate-600 font-medium">กดปุ่ม <strong className="text-green-500">รันคำสั่ง</strong> เพื่อดูหุ่นยนต์เดิน!</p>
                 </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <Keyboard size={14}/> <span>Keyboard Supported</span>
              </div>

              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 bg-blue-500 text-white font-bold py-3 md:py-4 rounded-2xl shadow-blue-200 shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all"
              >
                พร้อมแล้ว! ลุยเลย
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;