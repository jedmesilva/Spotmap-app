import { useState } from "react";

const MAP_BG = `
  radial-gradient(circle at 50% 42%, rgba(255,255,255,0.15) 28%, transparent 29%),
  radial-gradient(circle at 50% 42%, rgba(0,0,0,0.93) 60%, rgba(10,14,26,1) 100%)
`;

const BTNS = [
  { key: "atk",  label: "ATK",  icon: "⚡", color: "#DC2626", sub: "Raro",      slotIcon: "⭐" },
  { key: "farm", label: "FARM", icon: "⛏", color: "#16A34A", sub: "Dinheiro",  slotIcon: "💰" },
  { key: "use",  label: "USE",  icon: "🛡", color: "#7C3AED", sub: "Escudo",    slotIcon: "🛡" },
];

export default function ControlsB() {
  const [active, setActive] = useState<string | null>(null);
  const [pressing, setPressing] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
      <div className="relative w-[390px] h-[844px] rounded-[44px] overflow-hidden shadow-2xl border border-slate-700"
        style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #111827 100%)" }}>

        <div className="absolute inset-0" style={{ background: MAP_BG }} />

        {/* Fake streets */}
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

        {/* Player */}
        <div className="absolute flex flex-col items-center" style={{ top: '38%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-12 h-12 rounded-full bg-white border-[3px] border-blue-500 flex items-center justify-center text-lg font-bold text-blue-700 shadow-lg shadow-blue-500/40">V</div>
          <span className="text-white text-[10px] font-bold mt-1">Você</span>
          <div className="flex gap-1 mt-0.5">
            <span className="text-green-400 text-[9px]">♥ 100</span>
            <span className="text-slate-400 text-[9px]">|</span>
            <span className="text-yellow-400 text-[9px]">⚡ 150</span>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 px-4 z-20">
          {/* Aim joystick — left side */}
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full border-2 border-slate-600/70 flex items-center justify-center relative"
                style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
                <div className="absolute inset-0 rounded-full border border-slate-500/30" style={{ margin: 6 }} />
                <div className="w-7 h-7 rounded-full bg-slate-300/20 border border-slate-400/50" />
              </div>
              <span className="text-slate-500 text-[9px] font-bold tracking-widest">MIRAR</span>
            </div>

            {/* Placeholder right side balance */}
            <div className="w-20" />
          </div>

          {/* 3 dedicated action buttons */}
          <div className="flex gap-2">
            {BTNS.map(btn => {
              const isActive = active === btn.key;
              const isPress = pressing === btn.key;
              return (
                <button
                  key={btn.key}
                  className="flex-1 rounded-xl flex flex-col items-center py-3 gap-1 border-2 transition-all duration-75"
                  style={{
                    borderColor: isActive ? btn.color : btn.color + '55',
                    background: isPress ? btn.color : isActive ? btn.color + '28' : 'rgba(15,23,42,0.75)',
                    boxShadow: isActive ? `0 0 16px ${btn.color}55` : 'none',
                    transform: isPress ? 'scale(0.95)' : 'scale(1)',
                  }}
                  onClick={() => setActive(isActive ? null : btn.key)}
                  onMouseDown={() => setPressing(btn.key)}
                  onMouseUp={() => setPressing(null)}
                  onMouseLeave={() => setPressing(null)}
                >
                  {/* Equipment slot */}
                  <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm"
                    style={{ borderColor: btn.color + '88', background: btn.color + '18' }}>
                    {btn.slotIcon}
                  </div>
                  <span className="text-[11px] font-black tracking-wider" style={{ color: isPress ? '#fff' : btn.color }}>
                    {btn.label}
                  </span>
                  <span className="text-[9px]" style={{ color: isPress ? '#ffffffaa' : btn.color + 'aa' }}>
                    {btn.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Label */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-1 z-30">
          <span className="text-[9px] text-slate-500 font-bold tracking-widest">OPÇÃO B — BOTÕES DEDICADOS</span>
        </div>
      </div>
    </div>
  );
}
