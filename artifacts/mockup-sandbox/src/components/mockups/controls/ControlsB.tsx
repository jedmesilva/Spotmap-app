/**
 * Opção B — Hold + Radial Menu
 * Single primary action button. Tap = fire. Hold = radial mode selector opens.
 * Left: swipe-aim zone. Right: big fire button.
 * Inspired by MOBA / action RPG (Mobile Legends, AoV).
 */
import { useState, useRef } from "react";

const MODES = [
  { id: "atk",  label: "ATK",  color: "#FF3B3B", icon: "⚡", itemIcon: "⭐", desc: "Raro · 45 DMG",     angle: -90 },
  { id: "farm", label: "FARM", color: "#22C55E", icon: "⛏", itemIcon: "💰", desc: "Dinheiro",          angle: 30  },
  { id: "use",  label: "USE",  color: "#A855F7", icon: "🛡", itemIcon: "🛡", desc: "Escudo Fogo",       angle: 150 },
];

const RADIAL_R = 72; // px from center to radial button center

export default function ControlsB() {
  const [mode, setMode] = useState("atk");
  const [radialOpen, setRadialOpen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [fired, setFired] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aimZoneRef = useRef<HTMLDivElement>(null);
  const [aimActive, setAimActive] = useState(false);

  const cfg = MODES.find(m => m.id === mode)!;

  const handleFireDown = () => {
    setPressing(true);
    holdTimer.current = setTimeout(() => setRadialOpen(true), 420);
  };
  const handleFireUp = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    setPressing(false);
    if (!radialOpen) { setFired(true); setTimeout(() => setFired(false), 200); }
    setRadialOpen(false);
  };

  return (
    <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace" }}
      className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 shadow-2xl select-none"
        style={{ width: 390, height: 844, background: "linear-gradient(170deg,#05080f 0%,#0a1220 100%)" }}>

        {/* MAP BG */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 55% 50% at 50% 45%, transparent 0%, rgba(0,0,0,0.92) 65%)"
          }} />
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.18 }}>
            <line x1="50" y1="300" x2="340" y2="300" stroke="#7dd3fc" strokeWidth="1.5"/>
            <line x1="195" y1="180" x2="195" y2="420" stroke="#7dd3fc" strokeWidth="1.5"/>
            <line x1="80"  y1="360" x2="310" y2="220" stroke="#7dd3fc" strokeWidth="1"/>
            <rect x="120" y="240" width="60" height="40" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
            <rect x="210" y="310" width="50" height="35" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
          </svg>
        </div>

        {/* TOP HUD */}
        <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full border-2 border-blue-400 flex items-center justify-center text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", boxShadow: "0 0 12px #3b82f688" }}>V</div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <div className="h-2 rounded-full" style={{ width: 60, background: "linear-gradient(90deg,#22c55e,#15803d)" }} />
                <span className="text-[9px] text-green-400">100</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 rounded-full" style={{ width: 44, background: "linear-gradient(90deg,#facc15,#ca8a04)" }} />
                <span className="text-[9px] text-yellow-400">150</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>🎒</div>
          </div>
        </div>

        {/* PLAYER DOT */}
        <div className="absolute" style={{ top: "42%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="w-11 h-11 rounded-full border-[3px] flex items-center justify-center font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", borderColor: "#60a5fa", boxShadow: "0 0 20px #3b82f6aa" }}>V</div>
          <div className="absolute rounded-full border border-blue-400/20 pointer-events-none"
            style={{ width: 130, height: 130, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        </div>

        {/* NEARBY LABEL */}
        <div className="absolute z-20" style={{ bottom: 270, left: "50%", transform: "translateX(-50%)" }}>
          <div className="px-3 py-1 rounded flex items-center gap-2"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(34,197,94,0.4)", backdropFilter: "blur(6px)" }}>
            <span className="text-[10px] text-green-400 font-bold tracking-widest">SPOT PRÓXIMO</span>
            <span className="text-[10px] text-white/60">Rua das Flores · 18m</span>
          </div>
        </div>

        {/* LEFT AIM ZONE */}
        <div ref={aimZoneRef}
          onPointerDown={() => setAimActive(true)}
          onPointerUp={() => setAimActive(false)}
          onPointerLeave={() => setAimActive(false)}
          className="absolute z-20 flex flex-col items-center justify-center cursor-crosshair"
          style={{ left: 16, bottom: 28, width: 120, height: 120 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center relative"
            style={{
              background: aimActive ? "rgba(255,80,80,0.07)" : "rgba(255,255,255,0.03)",
              border: aimActive ? "1.5px solid rgba(255,80,80,0.4)" : "1.5px solid rgba(255,255,255,0.10)",
            }}>
            <div className="absolute rounded-full" style={{ inset: 20, border: "1px dashed rgba(255,255,255,0.08)" }} />
            <div className="w-4 h-4 rounded-full" style={{ background: aimActive ? "#ff5050aa" : "rgba(255,255,255,0.15)" }} />
          </div>
          <span className="text-[8px] tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>MIRAR</span>
        </div>

        {/* RIGHT: MAIN ACTION BUTTON + RADIAL */}
        <div className="absolute z-20" style={{ right: 24, bottom: 32 }}>
          {/* Radial options — appear on hold */}
          {MODES.map((m) => {
            const rad = RADIAL_R;
            const a = (m.angle * Math.PI) / 180;
            const x = Math.cos(a) * rad;
            const y = Math.sin(a) * rad;
            const isSelected = mode === m.id;
            return (
              <div key={m.id}
                className="absolute flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 52, height: 52,
                  left: `calc(50% + ${x}px - 26px)`,
                  top: `calc(50% + ${y}px - 26px)`,
                  opacity: radialOpen ? 1 : 0,
                  transform: radialOpen ? "scale(1)" : "scale(0.4)",
                  background: isSelected ? m.color + "33" : "rgba(10,18,32,0.95)",
                  border: `2px solid ${isSelected ? m.color : m.color + "66"}`,
                  boxShadow: isSelected ? `0 0 16px ${m.color}88` : "none",
                  pointerEvents: radialOpen ? "auto" : "none",
                  zIndex: 30,
                }}
                onPointerDown={(e) => { e.stopPropagation(); setMode(m.id); setRadialOpen(false); }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base">{m.itemIcon}</span>
                  <span className="text-[8px] font-black tracking-wider" style={{ color: m.color }}>{m.label}</span>
                </div>
              </div>
            );
          })}

          {/* Main fire button */}
          <div
            onPointerDown={handleFireDown}
            onPointerUp={handleFireUp}
            onPointerLeave={handleFireUp}
            className="relative rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer"
            style={{
              width: 88, height: 88,
              background: fired
                ? cfg.color
                : pressing && !radialOpen
                  ? cfg.color + "44"
                  : `radial-gradient(circle, ${cfg.color}22 0%, ${cfg.color}08 100%)`,
              border: `3px solid ${cfg.color}`,
              boxShadow: `0 0 ${fired ? 40 : 20}px ${cfg.color}${fired ? "cc" : "66"}, 0 0 8px ${cfg.color}33 inset`,
              transform: fired ? "scale(0.88)" : pressing && !radialOpen ? "scale(0.93)" : "scale(1)",
              transition: "transform 0.08s, box-shadow 0.15s",
            }}
          >
            {/* Equipped item slot */}
            <div className="w-7 h-7 rounded flex items-center justify-center text-base"
              style={{ background: cfg.color + "22" }}>
              {cfg.itemIcon}
            </div>
            <span className="text-[11px] font-black tracking-widest leading-none" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {/* Hold hint */}
          {!radialOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 flex justify-center" style={{ bottom: -18 }}>
              <span className="text-[8px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>SEGURAR = TROCAR</span>
            </div>
          )}
        </div>

        {/* Active mode info */}
        <div className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded"
          style={{
            right: 24, bottom: 152,
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${cfg.color}44`,
            backdropFilter: "blur(8px)"
          }}>
          <span className="text-sm">{cfg.itemIcon}</span>
          <div>
            <div className="text-[9px] font-black tracking-widest" style={{ color: cfg.color }}>{cfg.label}</div>
            <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.desc}</div>
          </div>
        </div>

        <div className="absolute bottom-1 left-0 right-0 flex justify-center z-30">
          <span className="text-[8px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>OPÇÃO B — SEGURAR PRA TROCAR MODO</span>
        </div>
      </div>
    </div>
  );
}
