import { useState } from "react";

const MAP_BG = `
  radial-gradient(circle at 50% 42%, rgba(255,255,255,0.15) 28%, transparent 29%),
  radial-gradient(circle at 50% 42%, rgba(0,0,0,0.93) 60%, rgba(10,14,26,1) 100%)
`;

type Mode = "atk" | "farm" | "use";
const MODES: Record<Mode, { label: string; color: string; icon: string; slotIcon: string; slotSub: string }> = {
  atk:  { label: "ATK",  color: "#DC2626", icon: "⚡", slotIcon: "⭐", slotSub: "Raro · 45 DMG" },
  farm: { label: "FARM", color: "#16A34A", icon: "⛏", slotIcon: "💰", slotSub: "Dinheiro" },
  use:  { label: "USE",  color: "#7C3AED", icon: "🛡", slotIcon: "🛡", slotSub: "Escudo Fogo" },
};

export default function ControlsC() {
  const [mode, setMode] = useState<Mode>("atk");
  const [pressed, setPressed] = useState(false);
  const cfg = MODES[mode];

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
        <div className="absolute bottom-0 left-0 right-0 pb-8 px-5 z-20">

          {/* Mode pills — above the action button, right-aligned */}
          <div className="flex justify-end mb-3">
            <div className="flex rounded-xl overflow-hidden border border-slate-700" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)' }}>
              {(Object.keys(MODES) as Mode[]).map((m, i) => {
                const c = MODES[m];
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="px-3 py-2 flex flex-col items-center gap-0.5 transition-all duration-150"
                    style={{
                      background: isActive ? c.color + '28' : 'transparent',
                      borderLeft: i > 0 ? '1px solid rgba(100,116,139,0.3)' : 'none',
                    }}
                  >
                    <span className="text-sm">{c.slotIcon}</span>
                    <span className="text-[9px] font-black tracking-wide" style={{ color: isActive ? c.color : '#64748b' }}>
                      {c.label}
                    </span>
                    {isActive && (
                      <span className="text-[7px] max-w-[48px] truncate" style={{ color: c.color + 'cc' }}>
                        {c.slotSub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main row: joystick LEFT — big FAB RIGHT */}
          <div className="flex items-center justify-between">
            {/* LEFT: Joystick */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-28 h-28 rounded-full border-2 border-slate-600/60 flex items-center justify-center relative"
                style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}>
                {/* Tick marks */}
                {[0,45,90,135,180,225,270,315].map(a => (
                  <div key={a} className="absolute w-[2px] h-2 bg-slate-600/50 rounded-full"
                    style={{ top: 6, left: '50%', transformOrigin: '50% 56px', transform: `translateX(-50%) rotate(${a}deg)` }} />
                ))}
                {/* Inner ring */}
                <div className="absolute rounded-full border border-slate-500/25" style={{ inset: 10 }} />
                {/* Knob */}
                <div className="w-10 h-10 rounded-full border border-slate-400/60 flex items-center justify-center"
                  style={{ background: 'rgba(100,116,139,0.25)' }}>
                  <span className="text-slate-300 text-lg">✛</span>
                </div>
              </div>
              <span className="text-slate-500 text-[9px] font-bold tracking-widest">MIRAR / MOVER</span>
            </div>

            {/* RIGHT: Big FAB */}
            <div className="flex flex-col items-center gap-2">
              {/* Ring indicator (dashed) */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-30"
                  style={{ borderColor: cfg.color }} />
                <button
                  onMouseDown={() => setPressed(true)}
                  onMouseUp={() => setPressed(false)}
                  onMouseLeave={() => setPressed(false)}
                  className="w-20 h-20 rounded-full border-[3px] flex items-center justify-center flex-col gap-0.5 transition-all duration-75"
                  style={{
                    borderColor: cfg.color,
                    background: pressed ? cfg.color : cfg.color + '22',
                    boxShadow: `0 0 28px ${cfg.color}66`,
                    transform: pressed ? 'scale(0.88)' : 'scale(1)',
                  }}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <span className="text-[11px] font-black tracking-wider" style={{ color: pressed ? '#fff' : cfg.color }}>
                    {cfg.label}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-1 z-30">
          <span className="text-[9px] text-slate-500 font-bold tracking-widest">OPÇÃO C — JOYSTICK ESQ + PILLS + FAB</span>
        </div>
      </div>
    </div>
  );
}
