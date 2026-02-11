import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  MousePointer2, 
  Wand2, 
  Download, 
  Info, 
  Trash2, 
  HelpCircle, 
  PlayCircle, 
  ExternalLink, 
  Linkedin, 
  BookOpen, 
  Layers 
} from 'lucide-react';

// --- Ebru Physics Engine Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const VERTEX_COUNT = 300; // Optimized for Chrome stability

const App = () => {
  const canvasRef = useRef(null);
  const dropsRef = useRef([]); 
  const lastPos = useRef({ x: 0, y: 0 });
  const timersRef = useRef([]); 
  const animationFrameRef = useRef(null);
  const lastProcessingTime = useRef(0);
  
  const [currentColor, setCurrentColor] = useState('#40E0D0'); 
  const [tool, setTool] = useState('drop'); 
  const [brushSize, setBrushSize] = useState(40);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Helper to safely clear all active timeouts
  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // --- Physics Logic with Safety Checks for Chrome ---
  const createDrop = (x, y, r, color) => {
    const vertices = [];
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const angle = (i / VERTEX_COUNT) * Math.PI * 2;
      vertices.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }
    return { x, y, r, color, vertices };
  };

  const applyMarblingDrop = (x, y, r) => {
    const r2 = r * r;
    dropsRef.current = dropsRef.current.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        const dx = v.x - x;
        const dy = v.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= 0 || !Number.isFinite(d2)) return v;
        const m = Math.sqrt(1 + r2 / d2);
        const nx = x + dx * m;
        const ny = y + dy * m;
        return (Number.isFinite(nx) && Number.isFinite(ny)) ? { x: nx, y: ny } : v;
      })
    }));
  };

  const applyTineLine = (x1, y1, x2, y2, forceVal = 25) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5 || !Number.isFinite(dist)) return;

    dropsRef.current = dropsRef.current.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        const dpx = v.x - x1;
        const dpy = v.y - y1;
        const perpDist = Math.abs(dpx * dy - dpy * dx) / dist;
        if (perpDist < 50) {
          const power = Math.pow(1 - perpDist / 50, 2);
          const force = power * forceVal;
          const nx = v.x + (dx / dist) * force;
          const ny = v.y + (dy / dist) * force;
          return (Number.isFinite(nx) && Number.isFinite(ny)) ? { x: nx, y: ny } : v;
        }
        return v;
      })
    }));
  };

  const applyCombMove = (x1, y1, x2, y2, combSpacing = 35, combForce = 12) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1 || !Number.isFinite(dist)) return;
    const ux = -dy / dist;
    const uy = dx / dist;

    dropsRef.current = dropsRef.current.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        let nx = v.x; let ny = v.y;
        for (let i = -8; i <= 8; i++) {
          const tx = x1 + i * combSpacing * ux;
          const ty = y1 + i * combSpacing * uy;
          const dpx = nx - tx; const dpy = ny - ty;
          const pDist = Math.abs(dpx * dy - dpy * dx) / dist;
          if (pDist < 20) {
            const force = Math.pow(1 - pDist / 20, 2) * combForce;
            nx += (dx / dist) * force; ny += (dy / dist) * force;
          }
        }
        return (Number.isFinite(nx) && Number.isFinite(ny)) ? { x: nx, y: ny } : v;
      })
    }));
  };

  // --- Animation Loop ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimization for Chrome
    
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    dropsRef.current.forEach(drop => {
      if (!drop.vertices || drop.vertices.length === 0) return;
      ctx.beginPath(); 
      ctx.moveTo(drop.vertices[0].x, drop.vertices[0].y);
      for (let i = 1; i < drop.vertices.length; i++) {
        ctx.lineTo(drop.vertices[i].x, drop.vertices[i].y);
      }
      ctx.closePath(); 
      ctx.fillStyle = drop.color; 
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.03)'; 
      ctx.lineWidth = 0.5; 
      ctx.stroke();
    });

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearAllTimers();
    };
  }, []);

  // --- Throttled Input Handlers for Chrome ---
  const handleStart = (e) => {
    if (isDemoRunning) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    
    lastPos.current = { x, y };
    setIsDrawing(true);

    if (tool === 'drop') {
      applyMarblingDrop(x, y, brushSize);
      dropsRef.current.push(createDrop(x, y, brushSize, currentColor));
    }
  };

  const handleMove = (e) => {
    if (!isDrawing || isDemoRunning || tool === 'drop') return;
    
    const now = performance.now();
    if (now - lastProcessingTime.current < 16) return; // Limit to ~60fps calculations
    lastProcessingTime.current = now;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    
    const prev = lastPos.current;
    if (tool === 'tine') applyTineLine(prev.x, prev.y, x, y);
    else if (tool === 'comb') applyCombMove(prev.x, prev.y, x, y);
    
    lastPos.current = { x, y };
  };

  const handleEnd = () => setIsDrawing(false);

  // --- Automation ---
  const run100StepDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    dropsRef.current = [];
    clearAllTimers();

    let timeline = 0;
    const step = (fn, delay, msg) => {
      timeline += delay;
      timersRef.current.push(setTimeout(() => { 
        if (msg) playVoice(msg); 
        fn(); 
      }, timeline));
    };

    playVoice("دموی استادی هنر ابرو آغاز می‌شود.");
    for (let i = 1; i <= 30; i++) {
      step(() => {
        const x = 150 + Math.random() * (CANVAS_WIDTH - 300);
        const y = 150 + Math.random() * (CANVAS_HEIGHT - 300);
        const r = 40 + Math.random() * 50;
        const colors = ['#1D3557', '#457B9D', '#E63946', '#FFB703', '#F1FAEE'];
        applyMarblingDrop(x, y, r);
        dropsRef.current.push(createDrop(x, y, r, colors[i % 5]));
      }, 150);
    }

    step(() => setIsDemoRunning(false), 2000, "نمایش پایان یافت.");
  };

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = 'tr-TR';
      window.speechSynthesis.speak(ut);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 md:p-8 font-sans text-stone-900 select-none">
      {/* Header UI */}
      <div className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 tracking-tighter italic">Suya <span className="text-emerald-700">Nakış</span></h1>
          <p className="text-stone-400 font-bold text-[10px] md:text-xs tracking-[0.4em] mt-2 uppercase underline decoration-emerald-500/30">Stable Physics Engine v2.5 (Chrome Optimized)</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={run100StepDemo} disabled={isDemoRunning} className={`group p-4 md:px-8 bg-stone-900 text-white rounded-2xl shadow-2xl transition-all active:scale-95 ${isDemoRunning ? 'opacity-50' : 'hover:bg-emerald-950'}`}>
            <div className="flex items-center gap-3"><PlayCircle size={24} className={isDemoRunning ? 'text-stone-500' : 'text-emerald-400 animate-pulse'} /><div className="text-left"><p className="text-[12px] font-black uppercase tracking-widest">Master Demo</p></div></div>
          </button>
          <button onClick={() => { dropsRef.current = []; clearAllTimers(); }} className="p-4 bg-white rounded-2xl shadow-md hover:bg-red-50 text-red-500 transition-all border border-stone-100"><Trash2 size={24} /></button>
          <button onClick={() => { const link = document.createElement('a'); link.download = 'ebru-art.png'; link.href = canvasRef.current.toDataURL(); link.click(); }} className="p-4 bg-emerald-700 text-white rounded-2xl shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"><Download size={24} /></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full h-full">
        {/* Tool Selector */}
        <aside className="lg:w-32 flex lg:flex-col gap-4 bg-white p-5 rounded-[3.5rem] shadow-2xl border border-stone-100 h-fit">
          <ToolBtn active={tool === 'drop'} onClick={() => setTool('drop')} icon={<Palette />} en="DROP" tr="DAMLAT" />
          <ToolBtn active={tool === 'tine'} onClick={() => setTool('tine')} icon={<MousePointer2 />} en="STYLUS" tr="BİZ" />
          <ToolBtn active={tool === 'comb'} onClick={() => setTool('comb')} icon={<Layers />} en="COMB" tr="TARAK" />
        </aside>

        {/* Interactive Canvas */}
        <div className={`relative flex-grow shadow-2xl rounded-[5rem] overflow-hidden border-[16px] md:border-[20px] border-white bg-white outline outline-1 outline-stone-200`}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={handleStart} 
            onMouseMove={handleMove} 
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            className="w-full h-auto cursor-crosshair touch-none" 
          />
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[85%] flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-stone-900/95 backdrop-blur-3xl p-6 md:p-8 rounded-[3.5rem] text-white shadow-2xl">
             <div className="flex gap-3 md:gap-4">
               {['#1D3557', '#40E0D0', '#FFB703', '#E63946', '#F1FAEE'].map(c => (
                 <button key={c} onClick={() => setCurrentColor(c)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all ${currentColor === c ? 'border-white scale-125 ring-4 ring-white/10' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />
               ))}
             </div>
             <div className="flex-grow w-full flex flex-col gap-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                  <span>Fluid Sensitivity</span>
                  <span>{brushSize}px</span>
                </div>
                <input type="range" min="10" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400" />
             </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:w-80 space-y-6 pb-10">
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-xl">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Info size={20}/></div>
               <h3 className="font-black text-xs uppercase tracking-widest text-stone-800">Ebru Guide</h3>
             </div>
             <p className="text-[11px] leading-relaxed text-stone-500 text-justify italic">
               این نسخه برای پایداری در مرورگر کروم بهینه‌سازی شده است. اگر همچنان با کندی مواجه هستید، تعداد قطرات کمتری ایجاد کنید.
             </p>
          </div>
          
          <div className="bg-emerald-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
            <BookOpen size={40} className="absolute -bottom-2 -right-2 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-400">Project Master</p>
            <p className="text-sm font-bold tracking-tight">Faramarz Kowsari</p>
            <a href="https://linkedin.com/in/faramarzkowsari" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-200 hover:text-white transition-all underline decoration-emerald-500/50">
              LinkedIn Profile <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, en, tr }) => (
  <button onClick={onClick} className={`p-5 md:p-6 rounded-[2.5rem] flex flex-col items-center gap-1 transition-all ${active ? 'bg-stone-900 text-white shadow-xl scale-110' : 'text-stone-300 hover:bg-stone-50'}`}>
    {React.cloneElement(icon, { size: 28 })}
    <span className="text-[10px] font-black mt-2 leading-none uppercase tracking-tighter">{en}</span>
    <span className="text-[8px] font-bold opacity-30 uppercase">{tr}</span>
  </button>
);

export default App;
