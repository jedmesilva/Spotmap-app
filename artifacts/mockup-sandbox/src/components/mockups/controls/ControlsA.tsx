import { useState } from "react";

const MAP_BG = `
  radial-gradient(circle at 50% 42%, rgba(255,255,255,0.15) 28%, transparent 29%),
  radial-gradient(circle at 50% 42%, rgba(0,0,0,0.93) 60%, rgba(10,14,26,1) 100%)
`;

type Context = "farm" | "atk" | "use" | "idle";
const CTX: Record<Context, { label: string; color: string; icon: string; sub: string }> = {
  farm: { label: "FARM", color: "#16A34A", icon: "⛏", sub: "Spot próximo: Rua das Flores" },
  atk:  { label: "ATK",  color: "#DC2626", icon: "⚡", sub: "Inimigo: Player_42" },
  use:  { label: "USE",  color: "#7C3AED", icon: "🛡", sub: "Escudo de Fogo" },
  idle: { label: "AÇÃO", color: "#64748B", icon: "◎",  sub: "Ande até um spot ou inimigo" },
};

export default function ControlsA() {
  const [ctx, setCtx] = useState<Context>("farm");
  const [pressed, setPressed] = useState(false);
  const cfg = CTX[ctx];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
      {/* Phone frame */}
      <div className="relative w-[390px] h-[844px] rounded-[44px] overflow-hidden shadow-2xl border border-slate-700"
        style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #111827 100%)" }}>

        {/* Map area */}
        <div className="absolute inset-0" style={{ background: MAP_BG }} />

        {/* Fake map streets (light glimpse in fog hole) */}
        <div className="absolute" style={{ top: '28%', left: '30%', width: '40%', height: '30%', opacity: 0.25 }}>
          <div className="w-full h-[2px] bg-slate-300 absolute top-1/2" />
          <div className="h-full w-[2px] bg-slate-300 absolute left-1/2" />
          <div className="w-[60%] h-[1px] bg-slate-400 absolute top-[30%] left-[10%] rotate-12" />
        </div>

        {/* HUD Top */}
        <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">V</div>
            <div className="bg-slate-900/80 rounded-lg px-2 py-1 flex gap-2 border border-slate-700">
              <span className="text-green-400 text-xs">♥ 100</span>
              <span className="text-slate-500 text-xs">|</span>
              <span className="text-yellow-400 text-xs">⚡ 150</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xl">🎒</div>
        </div>

        {/* Player marker */}
        <div className="absolute flex flex-col items-center" style={{ top: '38%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-12 h-12 rounded-full bg-white border-[3px] border-blue-500 flex items-center justify-center text-lg font-bold text-blue-700 shadow-lg shadow-blue-500/40">V</div>
          <span className="text-white text-[10px] font-bold mt-1 drop-shadow">Você</span>
          <div className="flex gap-1 mt-0.5">
            <span className="text-green-400 text-[9px]">♥ 100</span>
            <span className="text-slate-400 text-[9px]">|</span>
            <span className="text-yellow-400 text-[9px]">⚡ 150</span>
          </div>
        </div>

        {/* Context label above button */}
        <div className="absolute right-5 flex flex-col items-center gap-1" style={{ bottom: '168px' }}>
          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.color + '22', border: `1px solid ${cfg.color}55` }}>
            {cfg.sub}
          </div>
          {/* Equipment slot */}
          <div className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg" style={{ borderColor: cfg.color, background: cfg.color + '18' }}>
            {cfg.icon}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 pb-8 z-20">
          {/* LEFT: Aim joystick */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-24 h-24 rounded-full border-2 border-slate-600/70 flex items-center justify-center relative"
              style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="absolute inset-0 rounded-full border border-slate-500/30" style={{ margin: 8 }} />
              <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-400/50" />
            </div>
            <span className="text-slate-500 text-[9px] font-bold tracking-widest">MIRAR</span>
          </div>

          {/* RIGHT: Contextual action button */}
          <div className="flex flex-col items-end gap-2">
            <button
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
              className="w-20 h-20 rounded-full border-[3px] flex items-center justify-center flex-col gap-0.5 transition-all duration-75 shadow-lg"
              style={{
                borderColor: cfg.color,
                background: pressed ? cfg.color : cfg.color + '22',
                boxShadow: `0 0 24px ${cfg.color}55`,
                transform: pressed ? 'scale(0.92)' : 'scale(1)',
              }}
            >
              <span className="text-2xl">{cfg.icon}</span>
              <span className="text-[10px] font-black tracking-wider" style={{ color: pressed ? '#fff' : cfg.color }}>{cfg.label}</span>
            </button>
          </div>
        </div>

        {/* Context switcher (demo only) */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-1 z-30">
          {(["farm","atk","use","idle"] as Context[]).map(c => (
            <button key={c} onClick={() => setCtx(c)}
              className="text-[8px] px-1.5 py-0.5 rounded font-bold transition-all"
              style={{ background: ctx === c ? CTX[c].color + '33' : 'transparent', color: CTX[c].color, border: `1px solid ${CTX[c].color}55` }}>
              {CTX[c].label}
            </button>
          ))}
        </div>

        {/* Label overlay */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-1 z-30">
          <span className="text-[9px] text-slate-500 font-bold tracking-widest">OPÇÃO A — BOTÃO CONTEXTUAL</span>
        </div>
      </div>
    </div>
  );
}
