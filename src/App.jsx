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
const VERTEX_COUNT = 400; // Optimized for performance

const App = () => {
  const canvasRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const timersRef = useRef([]); 
  const [drops, setDrops] = useState([]); 
  const [currentColor, setCurrentColor] = useState('#40E0D0'); 
  const [tool, setTool] = useState('drop'); 
  const [brushSize, setBrushSize] = useState(40);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // --- Physics Logic ---
  const createDrop = (x, y, r, color) => {
    const vertices = [];
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const angle = (i / VERTEX_COUNT) * Math.PI * 2;
      vertices.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }
    return { x, y, r, color, vertices };
  };

  const applyMarblingDrop = (x, y, r) => {
    setDrops(prevDrops => prevDrops.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        const dx = v.x - x;
        const dy = v.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 === 0) return v;
        const m = Math.sqrt(1 + (r * r) / d2);
        return { x: x + dx * m, y: y + dy * m };
      })
    })));
  };

  const applyTineLine = (x1, y1, x2, y2, forceVal = 35) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) return;
    setDrops(prevDrops => prevDrops.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        const dpx = v.x - x1;
        const dpy = v.y - y1;
        const perpDist = Math.abs(dpx * dy - dpy * dx) / dist;
        if (perpDist < 50) {
          const power = Math.pow(1 - perpDist / 50, 2);
          const force = power * forceVal;
          return { x: v.x + (dx / dist) * force, y: v.y + (dy / dist) * force };
        }
        return v;
      })
    })));
  };

  const applyCombMove = (x1, y1, x2, y2, combSpacing = 40, combForce = 18) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    const ux = -dy / dist;
    const uy = dx / dist;
    setDrops(prevDrops => prevDrops.map(drop => ({
      ...drop,
      vertices: drop.vertices.map(v => {
        let nx = v.x; let ny = v.y;
        for (let i = -12; i <= 12; i++) {
          const tx = x1 + i * combSpacing * ux;
          const ty = y1 + i * combSpacing * uy;
          const dpx = nx - tx; const dpy = ny - ty;
          const perpDist = Math.abs(dpx * dy - dpy * dx) / dist;
          if (perpDist < 20) {
            const force = Math.pow(1 - perpDist / 20, 2) * combForce;
            nx += (dx / dist) * force; ny += (dy / dist) * force;
          }
        }
        return { x: nx, y: ny };
      })
    })));
  };

  const simulateStroke = (points, actionType, duration, force = 30) => {
    const steps = points.length;
    const interval = duration / steps;
    points.forEach((p, i) => {
      const tid = setTimeout(() => {
        if (i > 0) {
          if (actionType === 'tine') applyTineLine(points[i-1].x, points[i-1].y, p.x, p.y, force);
          else if (actionType === 'comb') applyCombMove(points[i-1].x, points[i-1].y, p.x, p.y, 35, 12);
        }
      }, i * interval);
      timersRef.current.push(tid);
    });
  };

  const run100StepDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setDrops([]);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    let timeline = 0;
    const step = (fn, delay, msg) => {
      timeline += delay;
      const tid = setTimeout(() => { if (msg) playVoice(msg); fn(); }, timeline);
      timersRef.current.push(tid);
    };
    const addD = (x, y, r, c) => { applyMarblingDrop(x, y, r); setDrops(p => [...p, createDrop(x, y, r, c)]); };

    playVoice("Starting 100-step masterclass.");
    for (let i = 1; i <= 40; i++) {
      const x = 100 + Math.random() * (CANVAS_WIDTH - 200);
      const y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      const r = 30 + Math.random() * 80;
      const colors = ['#1D3557', '#457B9D', '#E63946', '#A8DADC', '#F1FAEE', '#FFB703'];
      step(() => addD(x, y, r, colors[i % colors.length]), 120);
    }
    step(() => { setTool('tine'); playVoice("Generating fluid flow patterns."); }, 500);
    for (let i = 0; i < 30; i++) {
      const offset = 20 + (i * 19);
      if (i < 15) step(() => simulateStroke([{x: 50, y: offset*1.5}, {x: 750, y: offset*1.5}], 'tine', 200, 35), 250);
      else step(() => simulateStroke([{x: offset*1.5, y: 20}, {x: offset*1.5, y: 580}], 'comb', 200), 250);
    }
    step(() => { setTool('tine'); playVoice("Researching cultural intelligence through software."); }, 500);
    for (let i = 0; i < 20; i++) {
      const cx = (i % 5) * 150 + 100; const cy = Math.floor(i / 5) * 150 + 100;
      const pts = []; for(let a=0; a<Math.PI*5; a+=0.6) { const r = a * 6; pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r }); }
      step(() => simulateStroke(pts, 'tine', 300, 20), 400);
    }
    step(() => setIsDemoRunning(false), 2000, "Masterclass simulation complete.");
  };

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = 'en-US';
      window.speechSynthesis.speak(ut);
    }
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleStart = (e) => {
    if (isDemoRunning) return;
    const pos = getPos(e); lastPos.current = pos;
    if (tool === 'drop') {
      applyMarblingDrop(pos.x, pos.y, brushSize);
      setDrops(prev => [...prev, createDrop(pos.x, pos.y, brushSize, currentColor)]);
    }
  };

  const handleMove = (e) => {
    if ((!e.buttons && !e.touches) || tool === 'drop' || isDemoRunning) return;
    const pos = getPos(e); const prev = lastPos.current;
    if (tool === 'tine') applyTineLine(prev.x, prev.y, pos.x, pos.y);
    else if (tool === 'comb') applyCombMove(prev.x, prev.y, pos.x, pos.y);
    lastPos.current = pos;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drops.forEach(drop => {
      ctx.beginPath(); ctx.moveTo(drop.vertices[0].x, drop.vertices[0].y);
      for (let i = 1; i < drop.vertices.length; i++) ctx.lineTo(drop.vertices[i].x, drop.vertices[i].y);
      ctx.closePath(); ctx.fillStyle = drop.color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.02)'; ctx.lineWidth = 0.2; ctx.stroke();
    });
  }, [drops]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 md:p-8 font-sans text-stone-900 overflow-x-hidden">
      {/* --- HEADER --- */}
      <div className="max-w-6xl w-full flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-6xl font-serif font-black text-stone-900 tracking-tighter italic">Suya <span className="text-emerald-700">Nakış</span></h1>
          <p className="text-stone-400 font-bold text-[8px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] mt-1 md:mt-2 uppercase">100-Phase Master Simulation</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={run100StepDemo} disabled={isDemoRunning} className={`group relative p-2 md:p-4 md:px-8 bg-stone-900 text-white rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 ${isDemoRunning ? 'opacity-50' : 'hover:bg-emerald-950'}`}>
            <div className="flex items-center gap-2 md:gap-3"><PlayCircle size={20} className={isDemoRunning ? 'text-stone-500' : 'text-emerald-400 animate-pulse'} /><div className="text-left"><p className="text-[10px] md:text-[12px] font-black uppercase">Run Demo</p></div></div>
          </button>
          <button onClick={() => setDrops([])} className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-md hover:bg-red-50 text-red-500 transition-all border border-stone-100"><Trash2 size={20} /></button>
          <button onClick={() => { const link = document.createElement('a'); link.download = 'ebru.png'; link.href = canvasRef.current.toDataURL(); link.click(); }} className="p-3 md:p-4 bg-emerald-700 text-white rounded-xl md:rounded-2xl shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"><Download size={20} /><span className="hidden md:block text-[10px] font-black uppercase">Save</span></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 max-w-7xl w-full">
        {/* --- TOOLBAR (Responsive) --- */}
        <aside className="w-full lg:w-32 flex flex-row lg:flex-col gap-2 md:gap-4 bg-white p-3 md:p-5 rounded-2xl md:rounded-[3.5rem] shadow-xl border border-stone-100 justify-center h-fit">
          <ToolBtn active={tool === 'drop'} onClick={() => setTool('drop')} icon={<Palette />} title="DROP" />
          <ToolBtn active={tool === 'tine'} onClick={() => setTool('tine')} icon={<MousePointer2 />} title="STYLUS" />
          <ToolBtn active={tool === 'comb'} onClick={() => setTool('comb')} icon={<Layers />} title="COMB" />
        </aside>

        {/* --- CANVAS AREA --- */}
        <div className={`relative flex-grow shadow-2xl rounded-2xl md:rounded-[5rem] overflow-hidden border-[8px] md:border-[24px] border-white bg-white outline outline-1 outline-stone-200 ${isDemoRunning ? 'cursor-wait' : ''}`}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={handleStart} 
            onMouseMove={handleMove}
            onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
            onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
            className="w-full h-auto cursor-crosshair touch-none" 
          />
          {isDemoRunning && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none text-center"><div className="bg-white/90 px-4 md:px-10 py-2 md:py-5 rounded-full font-black text-[8px] md:text-xs shadow-2xl tracking-widest text-stone-900 border border-white animate-bounce">SIMULATION IN PROGRESS</div></div>}
          
          <div className="absolute bottom-2 md:bottom-10 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] flex flex-col md:flex-row items-center gap-3 md:gap-10 bg-stone-900/95 backdrop-blur-3xl p-3 md:p-8 rounded-2xl md:rounded-[3.5rem] text-white shadow-2xl border border-white/10">
             <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
               {['#1D3557', '#40E0D0', '#FFB703', '#E63946', '#F1FAEE'].map(c => (
                 <button key={c} onClick={() => setCurrentColor(c)} className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-2 transition-all hover:scale-110 ${currentColor === c ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`} style={{ backgroundColor: c }} />
               ))}
             </div>
             <div className="flex-grow w-full flex flex-col gap-1 md:gap-3">
               <div className="flex justify-between text-[7px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
                 <span>Precision Fluid Physics</span>
                 <span>Size: {brushSize}px</span>
               </div>
               <input type="range" min="10" max="250" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400" />
             </div>
          </div>
        </div>

        {/* --- SIDEBAR INFO --- */}
        <div className="lg:w-96 space-y-4 md:space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[4rem] border border-stone-100 shadow-xl">
             <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
               <div className="bg-emerald-100 p-3 md:p-4 rounded-xl text-emerald-700"><HelpCircle size={24} /></div>
               <p className="font-black text-xs md:text-sm uppercase tracking-widest text-stone-900">Research Effort</p>
             </div>
             <p className="text-[10px] md:text-[12px] leading-relaxed text-stone-500 italic text-justify">
               This simulator honors the intelligent culture of Turkey through high-fidelity software research. Developed by Faramarz Kowsari to bridge tradition and computation.
             </p>
          </div>
          <div className="bg-emerald-900 text-white p-6 md:p-10 rounded-2xl md:rounded-[4rem] shadow-xl relative overflow-hidden group">
            <BookOpen size={40} className="absolute -bottom-2 -right-2 opacity-10" />
            <p className="text-[9px] md:text-[11px] font-black uppercase mb-1 md:mb-2 text-emerald-400 tracking-widest">Developed By</p>
            <p className="text-md md:text-xl font-bold italic">Faramarz Kowsari</p>
            <a href="https://linkedin.com/in/faramarzkowsari" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase text-emerald-200 hover:text-white transition-colors">
              LinkedIn Profile <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, title }) => (
  <button onClick={onClick} className={`p-3 md:p-8 rounded-xl md:rounded-[3rem] flex flex-col items-center gap-1 transition-all flex-1 lg:flex-none ${active ? 'bg-stone-900 text-white shadow-xl scale-105' : 'text-stone-300 hover:bg-stone-50'}`}>
    {React.cloneElement(icon, { size: 20 })}
    <span className="text-[8px] md:text-[12px] font-black mt-1">{title}</span>
  </button>
);

const Step = ({ n, en, tr }) => (
  <div className="flex gap-4 md:gap-6"><span className="text-emerald-500 font-black text-xl md:text-3xl">{n}</span><div><p className="text-[12px] md:text-[14px] font-black text-stone-800 uppercase">{en}</p></div></div>
);

export default App;
