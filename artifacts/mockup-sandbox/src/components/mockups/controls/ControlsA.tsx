/**
 * Opção A — Skill Cluster
 * 3 action buttons in arc at bottom-right (Diablo Immortal style).
 * Left side is a swipe-aim zone. No movement joystick (GPS game).
 */
import { useState, useRef } from "react";

const SKILLS = [
  { id: "atk",  label: "ATK",  icon: "⚡", color: "#FF3B3B", glow: "#FF3B3B",  itemIcon: "⭐", itemLabel: "Raro" },
  { id: "farm", label: "FARM", icon: "⛏", color: "#22C55E", glow: "#22C55E",  itemIcon: "💰", itemLabel: "Dinheiro" },
  { id: "use",  label: "USE",  icon: "🛡", color: "#A855F7", glow: "#A855F7", itemIcon: "🛡", itemLabel: "Escudo" },
];

// Arc positions: bottom-right cluster
const ARC = [
  { right: 16,  bottom: 120 }, // ATK  — top
  { right: 90,  bottom: 68  }, // FARM — middle-left
  { right: 16,  bottom: 24  }, // USE  — bottom
];

export default function ControlsA() {
  const [active, setActive] = useState("atk");
  const [pressing, setPressing] = useState<string | null>(null);
  const [aimActive, setAimActive] = useState(false);
  const [aimAngle, setAimAngle] = useState(0);
  const aimRef = useRef<{ x: number; y: number } | null>(null);
  const aimZoneRef = useRef<HTMLDivElement>(null);

  const handleAimStart = (e: React.PointerEvent) => {
    aimZoneRef.current?.setPointerCapture(e.pointerId);
    const r = aimZoneRef.current!.getBoundingClientRect();
    aimRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    setAimActive(true);
  };
  const handleAimMove = (e: React.PointerEvent) => {
    if (!aimRef.current || !aimActive) return;
    const dx = e.clientX - aimRef.current.x;
    const dy = e.clientY - aimRef.current.y;
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    setAimAngle(angle);
  };
  const handleAimEnd = () => { setAimActive(false); aimRef.current = null; };

  return (
    <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace" }}
      className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 shadow-2xl"
        style={{ width: 390, height: 844, background: "linear-gradient(170deg,#05080f 0%,#0a1220 100%)" }}>

        {/* === FOG OF WAR MAP BG === */}
        <div className="absolute inset-0">
          {/* Fog overlay */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 55% 50% at 50% 45%, transparent 0%, rgba(0,0,0,0.92) 65%)"
          }} />
          {/* Street lines visible in fog hole */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.18 }}>
            <line x1="50" y1="300" x2="340" y2="300" stroke="#7dd3fc" strokeWidth="1.5"/>
            <line x1="195" y1="180" x2="195" y2="420" stroke="#7dd3fc" strokeWidth="1.5"/>
            <line x1="80"  y1="360" x2="310" y2="220" stroke="#7dd3fc" strokeWidth="1"/>
            <rect x="120" y="240" width="60" height="40" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
            <rect x="210" y="310" width="50" height="35" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
          </svg>
        </div>

        {/* === TOP HUD === */}
        <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-20">
          {/* Player card */}
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
          {/* Top-right mini buttons */}
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>🎒</div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>🗺</div>
          </div>
        </div>

        {/* === PLAYER DOT === */}
        <div className="absolute" style={{ top: "42%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="w-11 h-11 rounded-full border-[3px] flex items-center justify-center font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", borderColor: "#60a5fa", boxShadow: "0 0 20px #3b82f6aa" }}>V</div>
          {/* Vision radius indicator */}
          <div className="absolute rounded-full border border-blue-400/20 pointer-events-none"
            style={{ width: 130, height: 130, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          {/* Aim arrow */}
          {aimActive && (
            <div className="absolute pointer-events-none" style={{
              top: "50%", left: "50%", width: 2, height: 70,
              transformOrigin: "50% 0",
              transform: `translate(-50%, 0) rotate(${aimAngle}deg)`,
              background: "linear-gradient(180deg, rgba(255,80,80,0.9) 0%, transparent 100%)",
            }} />
          )}
        </div>

        {/* === NEARBY SPOT LABEL === */}
        <div className="absolute z-20" style={{ bottom: 260, left: "50%", transform: "translateX(-50%)" }}>
          <div className="px-3 py-1 rounded flex items-center gap-2"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(34,197,94,0.4)", backdropFilter: "blur(6px)" }}>
            <span className="text-[10px] text-green-400 font-bold tracking-widest">SPOT PRÓXIMO</span>
            <span className="text-[10px] text-white/60">Rua das Flores · 18m</span>
          </div>
        </div>

        {/* === LEFT: AIM SWIPE ZONE === */}
        <div ref={aimZoneRef}
          onPointerDown={handleAimStart}
          onPointerMove={handleAimMove}
          onPointerUp={handleAimEnd}
          onPointerCancel={handleAimEnd}
          className="absolute z-20 flex flex-col items-center justify-center select-none touch-none cursor-crosshair"
          style={{ left: 16, bottom: 24, width: 128, height: 128 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center relative"
            style={{
              background: aimActive ? "rgba(255,80,80,0.08)" : "rgba(255,255,255,0.04)",
              border: aimActive ? "1.5px solid rgba(255,80,80,0.5)" : "1.5px solid rgba(255,255,255,0.12)",
              transition: "all 0.15s"
            }}>
            {/* Inner ring */}
            <div className="absolute rounded-full" style={{ inset: 22, border: "1px dashed rgba(255,255,255,0.1)" }} />
            {/* Center dot */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: aimActive ? "#ff5050" : "rgba(255,255,255,0.4)" }} />
            </div>
            {/* Cardinal ticks */}
            {[0,90,180,270].map(a => (
              <div key={a} className="absolute w-1 h-2 rounded-full" style={{
                background: "rgba(255,255,255,0.2)",
                top: 6, left: "calc(50% - 2px)",
                transformOrigin: "50% 58px",
                transform: `rotate(${a}deg)`
              }} />
            ))}
          </div>
          <span className="text-[8px] font-bold tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>ARRASTAR PRA MIRAR</span>
        </div>

        {/* === RIGHT: SKILL CLUSTER (arc) === */}
        {SKILLS.map((sk, i) => {
          const pos = ARC[i];
          const isActive = active === sk.id;
          const isPress = pressing === sk.id;
          const size = isActive ? 76 : 60;
          return (
            <button key={sk.id}
              className="absolute z-20 rounded-full flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-150"
              style={{
                right: pos.right, bottom: pos.bottom,
                width: size, height: size,
                background: isPress
                  ? sk.color
                  : isActive
                    ? `radial-gradient(circle, ${sk.color}33 0%, ${sk.color}11 100%)`
                    : "rgba(10,18,32,0.85)",
                border: `${isActive ? 2 : 1.5}px solid ${isActive ? sk.color : sk.color + "55"}`,
                boxShadow: isActive ? `0 0 24px ${sk.glow}88, 0 0 8px ${sk.glow}44 inset` : "none",
                transform: isPress ? "scale(0.88)" : "scale(1)",
              }}
              onPointerDown={() => { setPressing(sk.id); setActive(sk.id); }}
              onPointerUp={() => setPressing(null)}
              onPointerLeave={() => setPressing(null)}
            >
              {/* Item slot */}
              <div className="w-6 h-6 rounded flex items-center justify-center text-sm"
                style={{ background: sk.color + "22", border: `1px solid ${sk.color}44` }}>
                {sk.itemIcon}
              </div>
              <span className="text-[9px] font-black tracking-widest leading-none" style={{ color: isPress ? "#fff" : sk.color }}>
                {sk.label}
              </span>
            </button>
          );
        })}

        {/* Bottom label */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-center z-30">
          <span className="text-[8px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>OPÇÃO A — SKILL CLUSTER</span>
        </div>
      </div>
    </div>
  );
}
