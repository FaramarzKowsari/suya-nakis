import React, { useState, useRef, useEffect } from 'react';
import { Palette, MousePointer2, Wand2, Download, Info, Trash2, HelpCircle, PlayCircle, ExternalLink, Linkedin, BookOpen, Layers } from 'lucide-react';

// --- Ebru Physics Engine Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const VERTEX_COUNT = 500; 

const App = () => {
  const canvasRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const timersRef = useRef([]); 
  const [drops, setDrops] = useState([]); 
  const [currentColor, setCurrentColor] = useState('#40E0D0'); 
  const [tool, setTool] = useState('drop'); 
  const [brushSize, setBrushSize] = useState(40);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const addTimer = (id) => {
    timersRef.current.push(id);
    return id;
  };

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
        if (d2 <= 0) return v;
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
      addTimer(setTimeout(() => {
        if (i > 0) {
          if (actionType === 'tine') applyTineLine(points[i-1].x, points[i-1].y, p.x, p.y, force);
          else if (actionType === 'comb') applyCombMove(points[i-1].x, points[i-1].y, p.x, p.y, 35, 12);
        }
      }, i * interval));
    });
  };

  const run100StepDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setDrops([]);
    clearAllTimers();

    let timeline = 0;
    const step = (fn, delay, msg) => {
      timeline += delay;
      addTimer(setTimeout(() => { 
        if (msg) playVoice(msg); 
        fn(); 
      }, timeline));
    };

    const addD = (x, y, r, c) => { 
      applyMarblingDrop(x, y, r); 
      setDrops(p => [...p, createDrop(x, y, r, c)]); 
    };

    playVoice("100 adımlık ustalık demosu başlıyor. İlk 40 adım: Battal zemin hazırlığı.");
    for (let i = 1; i <= 40; i++) {
      const x = 100 + Math.random() * (CANVAS_WIDTH - 200);
      const y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      const r = 30 + Math.random() * 80;
      const colors = ['#1D3557', '#457B9D', '#E63946', '#A8DADC', '#F1FAEE', '#FFB703'];
      step(() => addD(x, y, r, colors[i % colors.length]), 120);
    }

    step(() => { setTool('tine'); playVoice("Gelgit ve tarama aşامasına geçiliyor."); }, 500);
    for (let i = 0; i < 30; i++) {
      const offset = 20 + (i * 19);
      if (i < 15) step(() => simulateStroke([{x: 50, y: offset*1.5}, {x: 750, y: offset*1.5}], 'tine', 200, 35), 250);
      else step(() => simulateStroke([{x: offset*1.5, y: 20}, {x: offset*1.5, y: 580}], 'comb', 200), 250);
    }

    step(() => { setTool('tine'); playVoice("Bülbül yuvası ve spiral motifler oluşturuluyor."); }, 500);
    for (let i = 0; i < 20; i++) {
      const cx = (i % 5) * 150 + 100; const cy = Math.floor(i / 5) * 150 + 100;
      const pts = []; for(let a=0; a<Math.PI*5; a+=0.6) { const r = a * 6; pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r }); }
      step(() => simulateStroke(pts, 'tine', 300, 20), 400);
    }

    step(() => { setTool('drop'); playVoice("Son aşama: Merkez lale formu canlandırılıyor."); }, 1000);
    step(() => addD(400, 330, 90, '#AE2012'), 500); 
    step(() => addD(400, 330, 45, '#FFFFFF'), 400); 
    step(() => { setTool('tine'); simulateStroke([{x: 400, y: 330}, {x: 400, y: 580}], 'tine', 500, 60); }, 800);
    step(() => simulateStroke([{x: 400, y: 310}, {x: 400, y: 150}], 'tine', 600, 70), 1000);
    step(() => {
        simulateStroke([{x: 395, y: 310}, {x: 330, y: 190}], 'tine', 500, 40);
        addTimer(setTimeout(() => simulateStroke([{x: 405, y: 310}, {x: 470, y: 190}], 'tine', 500, 40), 600));
    }, 1200);

    step(() => setIsDemoRunning(false), 2000, "100 adımlık Suya Nakış gösterisi tamamlandı.");
  };

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'tr-TR';
        window.speechSynthesis.speak(ut);
      } catch (e) { console.error("Voice guide error", e); }
    }
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
    if (e.buttons !== 1 || tool === 'drop' || isDemoRunning) return;
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
    
    if (!drops || !Array.isArray(drops)) return;

    drops.forEach(drop => {
      if (!drop.vertices || drop.vertices.length === 0) return;
      ctx.beginPath(); 
      ctx.moveTo(drop.vertices[0].x, drop.vertices[0].y);
      for (let i = 1; i < drop.vertices.length; i++) {
        ctx.lineTo(drop.vertices[i].x, drop.vertices[i].y);
      }
      ctx.closePath(); 
      ctx.fillStyle = drop.color; 
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.02)'; 
      ctx.lineWidth = 0.2; 
      ctx.stroke();
    });
  }, [drops]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 md:p-8 font-sans text-stone-900">
      <div className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 tracking-tighter italic">Suya <span className="text-emerald-700">Nakış</span></h1>
          <p className="text-stone-400 font-bold text-[10px] md:text-xs tracking-[0.4em] mt-2 uppercase">100-Phase Master Simulation</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={run100StepDemo} disabled={isDemoRunning} className={`group relative overflow-hidden p-4 md:px-8 bg-stone-900 text-white rounded-2xl shadow-2xl transition-all active:scale-95 ${isDemoRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-950'}`}>
            <div className="flex items-center gap-3"><PlayCircle size={24} className={isDemoRunning ? 'text-stone-500' : 'text-emerald-400 animate-pulse'} /><div className="text-left"><p className="text-[12px] font-black uppercase tracking-widest leading-none">Run 100-Step Demo</p><p className="text-[8px] font-bold text-stone-400 mt-1 uppercase">100 Adımlık Demo</p></div></div>
          </button>
          <button onClick={() => { setDrops([]); clearAllTimers(); }} className="p-4 bg-white rounded-2xl shadow-md hover:bg-red-50 text-red-500 transition-all border border-stone-100"><Trash2 size={24} /></button>
          <button onClick={() => { const link = document.createElement('a'); link.download = 'ebru-masterpiece.png'; link.href = canvasRef.current.toDataURL(); link.click(); }} className="p-4 bg-emerald-700 text-white rounded-2xl shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"><Download size={24} /><span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Save Art</span></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full">
        <aside className="lg:w-32 flex lg:flex-col gap-4 bg-white p-5 rounded-[3.5rem] shadow-2xl border border-stone-100 h-fit">
          <ToolBtn active={tool === 'drop'} onClick={() => setTool('drop')} icon={<Palette />} en="DROP" tr="DAMLAT" />
          <ToolBtn active={tool === 'tine'} onClick={() => setTool('tine')} icon={<MousePointer2 />} en="STYLUS" tr="BİZ" />
          <ToolBtn active={tool === 'comb'} onClick={() => setTool('comb')} icon={<Layers />} en="COMB" tr="TARAK" />
        </aside>

        <div className={`relative flex-grow shadow-2xl rounded-[5rem] overflow-hidden border-[24px] border-white bg-white outline outline-1 outline-stone-200 ${isDemoRunning ? 'cursor-wait' : ''}`}>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseDown={handleStart} onMouseMove={handleMove} className="w-full h-auto cursor-crosshair touch-none" />
          {isDemoRunning && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none text-center"><div className="bg-white/90 px-10 py-5 rounded-full font-black text-xs shadow-2xl tracking-[0.3em] text-stone-900 border border-white animate-bounce">100-STEP MASTERCLASS IN PROGRESS</div></div>}
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] flex flex-col md:flex-row items-center gap-10 bg-stone-900/95 backdrop-blur-3xl p-8 rounded-[3.5rem] text-white shadow-2xl border border-white/10">
             <div className="flex gap-4">{['#1D3557', '#40E0D0', '#FFB703', '#E63946', '#F1FAEE'].map(c => <button key={c} onClick={() => setCurrentColor(c)} className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-125 ${currentColor === c ? 'border-white ring-4 ring-white/20' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
             <div className="flex-grow w-full flex flex-col gap-3"><div className="flex justify-between text-[10px] font-black opacity-40 uppercase tracking-widest"><span>500-Vertex Physics</span><span>Brush Size: {brushSize}px</span></div><input type="range" min="10" max="250" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400" /></div>
          </div>
        </div>

        <div className="lg:w-96 space-y-6">
          <div className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-xl">
             <div className="flex items-center gap-4 mb-8"><div className="bg-emerald-100 p-4 rounded-2xl text-emerald-700"><HelpCircle size={32} /></div><div><p className="font-black text-sm uppercase tracking-widest text-stone-900">Process Guide</p><p className="text-[10px] font-bold opacity-40 uppercase">Süreç Rehberi</p></div></div>
             <div className="space-y-8"><Step n="40" en="Battal Base" tr="40 adımda zemin boyama." /><Step n="30" en="Linear Flow" tr="30 adımda akış و doku." /><Step n="20" en="Ornament" tr="20 adımda süسleme." /><Step n="10" en="Finishing" tr="10 adımda sonuçlandırma." /></div>
          </div>

          <div className="bg-white p-10 rounded-[4rem] border border-emerald-50 shadow-xl space-y-6">
             <div className="flex items-center gap-4 mb-2"><div className="bg-stone-100 p-4 rounded-2xl text-stone-700"><Info size={28} /></div><div><p className="font-black text-sm uppercase tracking-widest text-stone-900">ABOUT</p><p className="text-[10px] font-bold opacity-40 uppercase">HAKKINDA</p></div></div>
             <div className="space-y-4">
                <div className="pb-4 border-b border-stone-50"><p className="text-[13px] font-black text-stone-800 leading-tight">Ebru Art Project</p><p className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-tighter">Faramarz Kowsari</p></div>
                <a href="https://linkedin.com/in/faramarzkowsari" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl hover:bg-emerald-50 transition-colors group">
                    <Linkedin size={20} className="text-stone-400 group-hover:text-emerald-600" /><span className="text-[11px] font-black text-stone-600 uppercase tracking-widest group-hover:text-emerald-900">LinkedIn Profile</span>
                </a>
                <div className="p-5 bg-emerald-900 text-white rounded-[2.5rem] shadow-lg relative overflow-hidden group">
                    <BookOpen size={40} className="absolute -bottom-2 -right-2 opacity-10" />
                    <p className="text-[11px] leading-relaxed font-medium text-justify">For Faramarz Kowsari's books about Turkey, art, culture, language, and traditions, please visit:</p>
                    <a href="https://play.google.com/store/search?q=Faramarz_Kowsari&c=books" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-between bg-white text-emerald-900 px-4 py-2 rounded-full font-black text-[10px] uppercase hover:bg-emerald-100 transition-colors">Google Play Books <ExternalLink size={12} /></a>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, en, tr }) => (
  <button onClick={onClick} className={`p-8 rounded-[3rem] flex flex-col items-center gap-2 transition-all ${active ? 'bg-stone-900 text-white shadow-2xl scale-110' : 'text-stone-300 hover:bg-stone-50 hover:text-stone-900'}`}><div className="flex flex-col items-center text-center leading-tight">{React.cloneElement(icon, { size: 36 })}<span className="text-[12px] font-black mt-2">{en}</span><span className="text-[9px] font-bold opacity-40">{tr}</span></div></button>
);
const Step = ({ n, en, tr }) => (
  <div className="flex gap-6 group"><span className="text-emerald-500 font-black text-3xl group-hover:scale-125 transition-transform duration-500">{n}</span><div><p className="text-[14px] font-black text-stone-800 uppercase leading-none">{en}</p><p className="text-[11px] text-stone-400 font-bold mt-2 uppercase tracking-tighter">{tr}</p></div></div>
);

export default App;
