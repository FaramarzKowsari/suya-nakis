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
  Layers,
  X,
  Volume2
} from 'lucide-react';

// --- Ebru Physics Engine Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const VERTEX_COUNT = 300; 

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
  const [showDetailModal, setShowDetailModal] = useState(false);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

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
        return { x: nx, y: ny };
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
        return { x: nx, y: ny };
      })
    }));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
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
    // Ensure voices are loaded for Chrome
    window.speechSynthesis.getVoices();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearAllTimers();
    };
  }, []);

  // --- Natural Narrator Helper ---
  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      
      // Attempt to find the "Google US English" voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name === 'Google US English' || v.name.includes('US English')) 
                          || voices.find(v => v.lang === 'en-US');
      
      if (preferredVoice) {
        ut.voice = preferredVoice;
      }
      
      ut.lang = 'en-US';
      ut.rate = 0.92;
      ut.pitch = 1.0;
      window.speechSynthesis.speak(ut);
    }
  };

  const run100PhaseDemo = () => {
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

    // Phase 1: Context (Steps 1-25)
    step(() => {}, 0, "Welcome to Suya Nakis. We are initiating a comprehensive 100-phase master simulation of traditional Turkish Ebru art.");
    for (let i = 1; i <= 25; i++) {
      step(() => {
        const x = 100 + Math.random() * 600;
        const y = 100 + Math.random() * 400;
        const colors = ['#1D3557', '#457B9D', '#E63946', '#FFB703', '#F1FAEE'];
        applyMarblingDrop(x, y, 50);
        dropsRef.current.push(createDrop(x, y, 50, colors[i % 5]));
      }, 100);
    }

    // Phase 2: Research Highlight (Steps 26-50)
    step(() => {}, 500, "This advanced simulator is a key outcome of Faramarz Kowsari's research, aimed at introducing the profound intelligence and aesthetics of Turkish culture to the digital world.");
    for (let i = 26; i <= 50; i++) {
      step(() => {
        const x = 150 + Math.random() * 500;
        const y = 150 + Math.random() * 300;
        applyMarblingDrop(x, y, 40);
        dropsRef.current.push(createDrop(x, y, 40, '#E63946'));
      }, 120);
    }

    // Phase 3: Mathematical Physics (Steps 51-75)
    step(() => {}, 500, "Every interaction is calculated using 300-vertex fluid dynamics. This mathematical model simulates how pigments interact on a viscous surface, preserving ancient wisdom through software engineering.");
    for (let i = 51; i <= 75; i++) {
      step(() => {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        applyTineLine(x, y, x + 80, y + 80, 20);
      }, 100);
    }

    // Phase 4: Finalization (Steps 76-100)
    step(() => {}, 500, "Completing the digital masterpiece. Faramarz Kowsari's research bridge the gap between historical Turkish traditions and future computing frontiers.");
    for (let i = 76; i <= 100; i++) {
      step(() => {
        applyCombMove(CANVAS_WIDTH / 2, 50, CANVAS_WIDTH / 2, 550);
      }, 150);
    }

    step(() => setIsDemoRunning(false), 2000, "Simulation complete. Experience the intelligent heritage of Turkey.");
  };

  const philosophyText = `Turkish Ebru, or Paper Marbling, is a UNESCO-recognized masterpiece of human heritage. Historically rooted in the 13th century, it is the art of painting on water to capture the infinite flow of nature. This digital research project by Faramarz Kowsari utilizes high-fidelity fluid physics to honor this tradition. It represents a synthesis of ancient aesthetics and modern mathematical algorithms, designed to showcase the sophisticated intelligence and vibrant cultural depth of Turkey to a global digital audience.`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 md:p-8 font-sans text-stone-900 select-none">
      
      {/* Philosophy Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => { window.speechSynthesis.cancel(); setShowDetailModal(false); }} className="absolute top-6 right-6 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24} /></button>
            <h2 className="text-3xl font-black text-emerald-800 mb-6 uppercase tracking-tighter italic">Philosophy of Ebru Art</h2>
            <p className="text-stone-600 leading-relaxed text-lg mb-8 italic text-justify">{philosophyText}</p>
            <button 
              onClick={() => playVoice(philosophyText)}
              className="flex items-center gap-3 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-95 transition-all shadow-xl"
            >
              <Volume2 size={24} /> Listen to Narrator
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 tracking-tighter italic">Suya <span className="text-emerald-700">Nakış</span></h1>
          <p className="text-stone-400 font-bold text-[10px] md:text-xs tracking-[0.4em] mt-2 uppercase">Advanced Virtual Ebru Lab / <span className="text-emerald-600">Stable Physics v3.0</span></p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={run100PhaseDemo} disabled={isDemoRunning} className={`group p-4 md:px-8 bg-stone-900 text-white rounded-2xl shadow-2xl transition-all active:scale-95 ${isDemoRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-950'}`}>
            <div className="flex items-center gap-3"><PlayCircle size={24} className={isDemoRunning ? 'text-stone-500' : 'text-emerald-400 animate-pulse'} /><div className="text-left"><p className="text-[12px] font-black uppercase tracking-widest">Run 100-Phase Demo</p></div></div>
          </button>
          <button onClick={() => { dropsRef.current = []; clearAllTimers(); }} className="p-4 bg-white rounded-2xl shadow-md hover:bg-red-50 text-red-500 transition-all border border-stone-100"><Trash2 size={24} /></button>
          <button onClick={() => { const link = document.createElement('a'); link.download = 'ebru-masterpiece.png'; link.href = canvasRef.current.toDataURL(); link.click(); }} className="p-4 bg-emerald-700 text-white rounded-2xl shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"><Download size={24} /><span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Export Art</span></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full">
        {/* Sidebar Tools */}
        <aside className="lg:w-32 flex lg:flex-col gap-4 bg-white p-5 rounded-[3.5rem] shadow-2xl border border-stone-100 h-fit">
          <ToolBtn active={tool === 'drop'} onClick={() => setTool('drop')} icon={<Palette />} title="DROP" />
          <ToolBtn active={tool === 'tine'} onClick={() => setTool('tine')} icon={<MousePointer2 />} title="STYLUS" />
          <ToolBtn active={tool === 'comb'} onClick={() => setTool('comb')} icon={<Layers />} title="COMB" />
          <div className="h-px bg-stone-100 my-2" />
          <button onClick={() => setShowDetailModal(true)} className="p-6 rounded-[2.5rem] flex flex-col items-center gap-1 transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white shadow-lg border border-emerald-100"><BookOpen size={28} /><span className="text-[9px] font-black mt-1 uppercase">About</span></button>
        </aside>

        {/* Main Canvas Area */}
        <div className={`relative flex-grow shadow-2xl rounded-[5rem] overflow-hidden border-[16px] md:border-[24px] border-white bg-white outline outline-1 outline-stone-200`}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={(e) => {
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
            }} 
            onMouseMove={(e) => {
              if (!isDrawing || isDemoRunning || tool === 'drop') return;
              const now = performance.now();
              if (now - lastProcessingTime.current < 16) return; 
              lastProcessingTime.current = now;
              const rect = canvasRef.current.getBoundingClientRect();
              const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
              const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
              const prev = lastPos.current;
              if (tool === 'tine') applyTineLine(prev.x, prev.y, x, y);
              else if (tool === 'comb') applyCombMove(prev.x, prev.y, x, y);
              lastPos.current = { x, y };
            }} 
            onMouseUp={() => setIsDrawing(false)}
            className="w-full h-auto cursor-crosshair touch-none" 
          />
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] flex flex-col md:flex-row items-center gap-10 bg-stone-900/95 backdrop-blur-3xl p-8 rounded-[3.5rem] text-white shadow-2xl">
             <div className="flex gap-4">{['#1D3557', '#40E0D0', '#FFB703', '#E63946', '#F1FAEE'].map(c => <button key={c} onClick={() => setCurrentColor(c)} className={`w-12 h-12 rounded-full border-2 transition-all ${currentColor === c ? 'border-white scale-125 ring-4 ring-white/10' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />)}</div>
             <div className="flex-grow w-full flex flex-col gap-2"><div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40"><span>Fluid Brush Precision</span><span>{brushSize}px</span></div><input type="range" min="10" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400" /></div>
          </div>
        </div>

        {/* Research Sidebar */}
        <div className="lg:w-80 space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-xl">
             <div className="flex items-center gap-4 mb-6"><div className="bg-emerald-100 p-4 rounded-2xl text-emerald-700"><HelpCircle size={32} /></div><div><p className="font-black text-sm uppercase tracking-widest text-stone-900">Research Intro</p></div></div>
             <p className="text-[12px] leading-relaxed text-stone-500 text-justify italic font-medium">
               This simulator serves as a bridge between traditional wisdom and high-fidelity computing. Developed as part of Faramarz Kowsari's cultural research.
             </p>
          </div>
          
          <div className="bg-emerald-900 text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <BookOpen size={60} className="absolute -bottom-4 -right-4 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-400">Researcher & Engineer</p>
            <p className="text-lg font-bold tracking-tight">Faramarz Kowsari</p>
            <p className="text-[10px] mt-1 opacity-60">Software Research & Cultural Heritage</p>
            <a href="https://linkedin.com/in/faramarzkowsari" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase text-emerald-200 hover:text-white transition-all underline decoration-emerald-500/50">LinkedIn Profile <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, title }) => (
  <button onClick={onClick} className={`p-6 rounded-[2.5rem] flex flex-col items-center gap-1 transition-all ${active ? 'bg-stone-900 text-white shadow-xl scale-110' : 'text-stone-300 hover:bg-stone-50'}`}>
    {React.cloneElement(icon, { size: 28 })}
    <span className="text-[10px] font-black mt-2 uppercase tracking-tighter">{title}</span>
  </button>
);

export default App;
