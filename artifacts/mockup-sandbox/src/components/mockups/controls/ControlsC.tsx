/**
 * Opção C — Action Bar HUD
 * Compact persistent HUD bar at the bottom (PUBG / RPG style).
 * Left thumb: swipe aim. Center: mode chips + item info. Right thumb: fire button.
 * All controls sit in a single glass bar — minimal screen occlusion.
 */
import { useState, useRef } from "react";

const MODES = [
  { id: "atk",  label: "ATK",  color: "#FF3B3B", icon: "⚡", itemIcon: "⭐", itemLabel: "Raro",       sub: "45 DMG" },
  { id: "farm", label: "FARM", color: "#22C55E", icon: "⛏", itemIcon: "💰", itemLabel: "Dinheiro",   sub: "Spot" },
  { id: "use",  label: "USE",  color: "#A855F7", icon: "🛡", itemIcon: "🛡", itemLabel: "Escudo Fogo", sub: "Buff" },
];

export default function ControlsC() {
  const [mode, setMode] = useState("atk");
  const [pressing, setPressing] = useState(false);
  const [fired, setFired] = useState(false);
  const [aimActive, setAimActive] = useState(false);
  const [aimAngle, setAimAngle] = useState<number | null>(null);
  const aimRef = useRef<{ cx: number; cy: number } | null>(null);
  const aimZoneRef = useRef<HTMLDivElement>(null);
  const cfg = MODES.find(m => m.id === mode)!;

  const handleFireDown = () => setPressing(true);
  const handleFireUp = () => {
    setPressing(false);
    setFired(true);
    setTimeout(() => setFired(false), 180);
  };

  const handleAimDown = (e: React.PointerEvent) => {
    aimZoneRef.current?.setPointerCapture(e.pointerId);
    const r = aimZoneRef.current!.getBoundingClientRect();
    aimRef.current = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    setAimActive(true);
  };
  const handleAimMove = (e: React.PointerEvent) => {
    if (!aimRef.current) return;
    const dx = e.clientX - aimRef.current.cx;
    const dy = e.clientY - aimRef.current.cy;
    if (Math.hypot(dx, dy) > 6) setAimAngle((Math.atan2(dx, -dy) * 180) / Math.PI);
  };
  const handleAimUp = () => { setAimActive(false); setAimAngle(null); aimRef.current = null; };

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

        {/* PLAYER */}
        <div className="absolute" style={{ top: "42%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="w-11 h-11 rounded-full border-[3px] flex items-center justify-center font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", borderColor: "#60a5fa", boxShadow: "0 0 20px #3b82f6aa" }}>V</div>
          <div className="absolute rounded-full border border-blue-400/20 pointer-events-none"
            style={{ width: 130, height: 130, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          {/* Aim arrow from player */}
          {aimActive && aimAngle !== null && (
            <div className="absolute pointer-events-none rounded-full" style={{
              top: "50%", left: "50%",
              width: 3, height: 90,
              transformOrigin: "50% 0%",
              transform: `translate(-50%, 0) rotate(${aimAngle}deg)`,
              background: `linear-gradient(180deg, ${cfg.color}cc 0%, transparent 100%)`,
            }} />
          )}
        </div>

        {/* NEARBY LABEL */}
        <div className="absolute z-20" style={{ bottom: 195, left: "50%", transform: "translateX(-50%)" }}>
          <div className="px-3 py-1 rounded flex items-center gap-2"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(34,197,94,0.4)", backdropFilter: "blur(6px)" }}>
            <span className="text-[10px] text-green-400 font-bold tracking-widest">SPOT PRÓXIMO</span>
            <span className="text-[10px] text-white/60">Rua das Flores · 18m</span>
          </div>
        </div>

        {/* === BOTTOM ACTION BAR === */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4">
          {/* Mode chips above bar */}
          <div className="flex justify-center gap-1.5 mb-2">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className="px-2.5 py-1 rounded font-black tracking-widest text-[9px] transition-all duration-150"
                style={{
                  color: m.color,
                  background: mode === m.id ? m.color + "28" : "rgba(0,0,0,0.5)",
                  border: `1px solid ${mode === m.id ? m.color : m.color + "33"}`,
                  boxShadow: mode === m.id ? `0 0 10px ${m.color}55` : "none",
                }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Glass HUD bar */}
          <div className="flex items-center rounded-2xl overflow-hidden"
            style={{
              height: 84,
              background: "rgba(5,8,15,0.88)",
              border: `1px solid ${cfg.color}33`,
              backdropFilter: "blur(16px)",
              boxShadow: `0 0 24px ${cfg.color}22`
            }}>

            {/* LEFT: Aim zone */}
            <div ref={aimZoneRef}
              onPointerDown={handleAimDown}
              onPointerMove={handleAimMove}
              onPointerUp={handleAimUp}
              onPointerCancel={handleAimUp}
              className="flex flex-col items-center justify-center gap-1 cursor-crosshair touch-none flex-shrink-0"
              style={{ width: 100, height: "100%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{
                  background: aimActive ? cfg.color + "14" : "rgba(255,255,255,0.04)",
                  border: aimActive ? `1.5px solid ${cfg.color}77` : "1.5px solid rgba(255,255,255,0.1)"
                }}>
                <div className="absolute rounded-full" style={{ inset: 10, border: "1px dashed rgba(255,255,255,0.08)" }} />
                <div className="w-3 h-3 rounded-full"
                  style={{ background: aimActive ? cfg.color : "rgba(255,255,255,0.2)" }} />
              </div>
              <span className="text-[7px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>MIRAR</span>
            </div>

            {/* CENTER: Item info */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-2">
              {/* Big item slot */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ background: cfg.color + "18", border: `1.5px solid ${cfg.color}55` }}>
                {cfg.itemIcon}
              </div>
              <div className="text-center">
                <div className="text-[9px] font-black tracking-widest leading-none" style={{ color: cfg.color }}>
                  {cfg.itemLabel}
                </div>
                <div className="text-[8px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {cfg.sub}
                </div>
              </div>
            </div>

            {/* RIGHT: Fire button */}
            <div
              onPointerDown={handleFireDown}
              onPointerUp={handleFireUp}
              onPointerLeave={() => setPressing(false)}
              className="flex flex-col items-center justify-center cursor-pointer touch-none flex-shrink-0"
              style={{
                width: 100, height: "100%",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                background: fired
                  ? cfg.color
                  : pressing
                    ? cfg.color + "28"
                    : "transparent",
                transition: "background 0.08s"
              }}>
              {/* Fire icon */}
              <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5"
                style={{
                  background: fired ? "rgba(255,255,255,0.15)" : cfg.color + "18",
                  border: `2.5px solid ${cfg.color}`,
                  boxShadow: `0 0 ${fired ? 32 : 16}px ${cfg.color}${fired ? "cc" : "66"}`,
                  transform: pressing ? "scale(0.88)" : "scale(1)",
                  transition: "transform 0.08s, box-shadow 0.12s"
                }}>
                <span className="text-lg">{cfg.icon}</span>
                <span className="text-[9px] font-black tracking-widest leading-none" style={{ color: fired ? "#fff" : cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-1 left-0 right-0 flex justify-center z-30">
          <span className="text-[8px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>OPÇÃO C — BARRA HUD</span>
        </div>
      </div>
    </div>
  );
}
