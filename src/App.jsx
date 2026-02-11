import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  MousePointer2, 
  Download, 
  Info, 
  Trash2, 
  HelpCircle, 
  PlayCircle, 
  ExternalLink, 
  Linkedin, 
  BookOpen, 
  Layers,
  X,
  Volume2
} from 'lucide-react';

// --- Ebru Physics Engine Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const VERTEX_COUNT = 300; // Balanced for mobile and Chrome stability

const App = () => {
  const canvasRef = useRef(null);
  const dropsRef = useRef([]); // Optimized Ref to prevent heavy React re-renders
  const lastPos = useRef({ x: 0, y: 0 });
  const timersRef = useRef([]); 
  const animationFrameRef = useRef(null);
  const lastProcessingTime = useRef(0);
  
  const [currentColor, setCurrentColor] = useState('#40E0D0'); 
  const [tool, setTool] = useState('drop'); 
  const [brushSize, setBrushSize] = useState(40);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // --- Natural Narrator Helper ---
  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to find a high-quality "Google US English" voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name === 'Google US English' || v.name.includes('US English')) 
                          || voices.find(v => v.lang === 'en-US');
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.lang = 'en-US';
      utterance.rate = 0.95; // Slightly slower for clear research narration
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Ebru Physics Logic ---
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
        return { x: x + dx * m, y: y + dy * m };
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
          return { x: v.x + (dx / dist) * force, y: v.y + (dy / dist) * force };
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
        for (let i = -10; i <= 10; i++) {
          const tx = x1 + i * combSpacing * ux;
          const ty = y1 + i * combSpacing * uy;
          const dpx = nx - tx; const dpy = ny - ty;
          const pDist = Math.abs(dpx * dy - dpy * dx) / dist;
          if (pDist < 20) {
            const force = Math.pow(1 - pDist / 20, 2) * combForce;
            nx += (dx / dist) * force; ny += (dy / dist) * force;
          }
        }
        return { x: nx, y: ny };
      })
    }));
  };

  // --- Rendering Loop ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Chrome optimization
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    dropsRef.current.forEach(drop => {
      if (!drop.vertices || drop.vertices.length === 0) return;
      ctx.beginPath(); ctx.moveTo(drop.vertices[0].x, drop.vertices[0].y);
      for (let i = 1; i < drop.vertices.length; i++) ctx.lineTo(drop.vertices[i].x, drop.vertices[i].y);
      ctx.closePath(); ctx.fillStyle = drop.color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5; ctx.stroke();
    });
    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    window.speechSynthesis.getVoices(); // Pre-load voices for Chrome
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearAllTimers();
    };
  }, []);

  // --- Interactions ---
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleStart = (e) => {
    if (isDemoRunning) return;
    const pos = getPos(e); lastPos.current = pos;
    setIsDrawing(true);
    if (tool === 'drop') {
      applyMarblingDrop(pos.x, pos.y, brushSize);
      dropsRef.current.push(createDrop(pos.x, pos.y, brushSize, currentColor));
    }
  };

  const handleMove = (e) => {
    if ((!e.buttons && !e.touches) || isDemoRunning || tool === 'drop' || !isDrawing) return;
    const now = performance.now();
    if (now - lastProcessingTime.current < 16) return; // Throttle for Chrome stability
    lastProcessingTime.current = now;

    const pos = getPos(e); const prev = lastPos.current;
    if (tool === 'tine') applyTineLine(prev.x, prev.y, pos.x, pos.y);
    else if (tool === 'comb') applyCombMove(prev.x, prev.y, pos.x, pos.y);
    lastPos.current = pos;
  };

  // --- 100-Phase Research Simulation ---
  const run100PhaseDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    dropsRef.current = [];
    clearAllTimers();

    let timeline = 0;
    const step = (fn, delay, msg) => {
      timeline += delay;
      timersRef.current.push(setTimeout(() => { if (msg) playVoice(msg); fn(); }, timeline));
    };

    step(() => {}, 0, "Welcome to Suya Nakis. We are initiating a 100-phase master simulation of traditional Turkish Ebru art.");
    
    // Background Setup (1-40)
    for (let i = 1; i <= 40; i++) {
      step(() => {
        const x = 100 + Math.random() * 600; const y = 100 + Math.random() * 400;
        const colors = ['#1D3557', '#457B9D', '#E63946', '#FFB703', '#F1FAEE'];
        applyMarblingDrop(x, y, 60);
        dropsRef.current.push(createDrop(x, y, 60, colors[i % 5]));
      }, 100);
    }

    step(() => {}, 500, "This simulator is part of Faramarz Kowsari's research to introduce the rich and intelligent cultural heritage of Turkey through advanced mathematical software engineering.");

    // Stylus Strokes (41-80)
    for (let i = 0; i < 40; i++) {
      step(() => {
        const x = Math.random() * CANVAS_WIDTH; const y = Math.random() * CANVAS_HEIGHT;
        applyTineLine(x, y, x + 100, y + 100, 30);
      }, 120);
    }

    step(() => {}, 500, "Every interaction is calculated using complex fluid dynamics to honor ancient Turkish aesthetics while exploring modern computing frontiers.");

    // Comb Movements (81-100)
    for (let i = 0; i < 20; i++) {
      step(() => {
        applyCombMove(CANVAS_WIDTH / 2, 50, CANVAS_WIDTH / 2, 550);
      }, 200);
    }

    step(() => setIsDemoRunning(false), 2000, "Simulation complete. Experience the intelligence of Turkish tradition.");
  };

  const philosophyText = `Turkish Ebru, or Paper Marbling, is a UNESCO-recognized masterpiece of human heritage. Historically rooted in the 13th century, it is the art of painting on water to capture the infinite flow of nature. This digital research project by Faramarz Kowsari utilizes high-fidelity fluid physics to honor this tradition. It represents a synthesis of ancient aesthetics and modern mathematical algorithms, designed to showcase the sophisticated intelligence and vibrant cultural depth of Turkey to a global digital audience.`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 md:p-8 font-sans text-stone-900 select-none overflow-x-hidden">
      
      {/* --- Philosophy Modal --- */}
      {showPhilosophy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 max-w-3xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => { window.speechSynthesis.cancel(); setShowPhilosophy(false); }} className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24} /></button>
            <h2 className="text-2xl md:text-4xl font-black text-emerald-800 mb-6 uppercase tracking-tighter italic">Philosophy of Ebru</h2>
            <p className="text-stone-600 leading-relaxed text-sm md:text-lg mb-8 italic text-justify">{philosophyText}</p>
            <button onClick={() => playVoice(philosophyText)} className="flex items-center gap-3 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-95 transition-all shadow-xl shadow-emerald-100">
              <Volume2 size={24} /> Narrate Concept
            </button>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 tracking-tighter italic">Suya <span className="text-emerald-700">Nakış</span></h1>
          <p className="text-stone-400 font-bold text-[8px] md:text-xs tracking-[0.3em] mt-1 md:mt-2 uppercase">Virtual Ebru Lab / <span className="text-emerald-600 font-black">Math Research Project</span></p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          <button onClick={run100PhaseDemo} disabled={isDemoRunning} className={`group p-3 md:p-4 md:px-8 bg-stone-900 text-white rounded-xl md:rounded-2xl shadow-2xl transition-all active:scale-95 ${isDemoRunning ? 'opacity-50' : 'hover:bg-emerald-950'}`}>
            <div className="flex items-center gap-2 md:gap-3"><PlayCircle size={24} className={isDemoRunning ? 'text-stone-500' : 'text-emerald-400 animate-pulse'} /><div className="text-left"><p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest">Run 100-Phase Demo</p></div></div>
          </button>
          <button onClick={() => { dropsRef.current = []; }} className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-md hover:bg-red-50 text-red-500 transition-all border border-stone-100"><Trash2 size={24} /></button>
          <button onClick={() => { const link = document.createElement('a'); link.download = 'ebru-art.png'; link.href = canvasRef.current.toDataURL(); link.click(); }} className="p-3 md:p-4 bg-emerald-700 text-white rounded-xl md:rounded-2xl shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"><Download size={24} /><span className="hidden md:block text-[10px] font-black uppercase">Export</span></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 max-w-7xl w-full">
        {/* --- Responsive Toolbar --- */}
        <aside className="w-full lg:w-32 flex flex-row lg:flex-col gap-2 md:gap-4 bg-white p-3 md:p-5 rounded-2xl md:rounded-[3.5rem] shadow-xl border border-stone-100 h-fit justify-center">
          <ToolBtn active={tool === 'drop'} onClick={() => setTool('drop')} icon={<Palette />} title="DROP" />
          <ToolBtn active={tool === 'tine'} onClick={() => setTool('tine')} icon={<MousePointer2 />} title="STYLUS" />
          <ToolBtn active={tool === 'comb'} onClick={() => setTool('comb')} icon={<Layers />} title="COMB" />
          <div className="hidden lg:block h-px bg-stone-100 my-2" />
          <button onClick={() => setShowPhilosophy(true)} className="p-4 md:p-6 rounded-xl md:rounded-[2.5rem] flex flex-col items-center gap-1 transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white shadow-lg border border-emerald-100"><BookOpen size={28} /><span className="text-[9px] font-black mt-1">ABOUT</span></button>
        </aside>

        {/* --- Main Interactive Canvas --- */}
        <div className={`relative flex-grow shadow-2xl rounded-2xl md:rounded-[5rem] overflow-hidden border-[8px] md:border-[24px] border-white bg-white outline outline-1 outline-stone-200`}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={handleStart} 
            onMouseMove={handleMove} 
            onMouseUp={() => setIsDrawing(false)}
            onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
            onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
            className="w-full h-auto cursor-crosshair touch-none" 
          />
          {isDemoRunning && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none text-center"><div className="bg-white/90 px-6 md:px-10 py-3 md:py-5 rounded-full font-black text-[10px] md:text-xs shadow-2xl tracking-[0.3em] text-stone-900 border border-white animate-bounce">RESEARCH SIMULATION IN PROGRESS</div></div>}
          
          <div className="absolute bottom-2 md:bottom-10 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] flex flex-col md:flex-row items-center gap-4 md:gap-10 bg-stone-900/95 backdrop-blur-3xl p-4 md:p-8 rounded-2xl md:rounded-[3.5rem] text-white shadow-2xl">
             <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
               {['#1D3557', '#40E0D0', '#FFB703', '#E63946', '#F1FAEE'].map(c => (
                 <button key={c} onClick={() => setCurrentColor(c)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all ${currentColor === c ? 'border-white scale-125 ring-4 ring-white/10' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />
               ))}
             </div>
             <div className="flex-grow w-full flex flex-col gap-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40"><span>Fluid Brush Precision</span><span>{brushSize}px</span></div>
                <input type="range" min="10" max="250" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400" />
             </div>
          </div>
        </div>

        {/* --- Sidebar Research Info --- */}
        <div className="lg:w-80 space-y-4 md:space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-stone-100 shadow-xl">
             <div className="flex items-center gap-4 mb-6"><div className="bg-emerald-100 p-3 md:p-4 rounded-xl text-emerald-700"><HelpCircle size={32} /></div><p className="font-black text-sm uppercase tracking-widest text-stone-900">Research Intro</p></div>
             <p className="text-[11px] md:text-[12px] leading-relaxed text-stone-500 text-justify italic font-medium">
               This simulator serves as a bridge between traditional Turkish wisdom and high-fidelity computing. Developed as part of Faramarz Kowsari's cultural research efforts.
             </p>
          </div>
          <div className="bg-emerald-900 text-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <BookOpen size={60} className="absolute -bottom-4 -right-4 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-400">Researcher & Dev</p>
            <p className="text-lg md:text-xl font-bold tracking-tight">Faramarz Kowsari</p>
            <p className="text-[10px] mt-1 opacity-60 italic">Software Research & Cultural Heritage</p>
            <a href="https://linkedin.com/in/faramarzkowsari" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase text-emerald-200 hover:text-white transition-all underline decoration-emerald-500/50">LinkedIn Profile <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, title }) => (
  <button onClick={onClick} className={`p-4 md:p-6 rounded-xl md:rounded-[2.5rem] flex flex-col items-center gap-1 transition-all flex-1 lg:flex-none ${active ? 'bg-stone-900 text-white shadow-xl scale-110' : 'text-stone-300 hover:bg-stone-50'}`}>
    {React.cloneElement(icon, { size: 24 })}
    <span className="text-[9px] md:text-[10px] font-black mt-1 uppercase tracking-tighter">{title}</span>
  </button>
);

export default App;
