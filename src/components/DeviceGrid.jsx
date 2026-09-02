import React, { useMemo, useRef } from 'react';
import { Power, Laptop, Smartphone, Monitor, Eye, EyeOff, Edit2 } from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import DeviceCard from './DeviceCard.jsx';

/* ── Stable device positions on radar (percentage of radius from center) ── */
const SLOT_POSITIONS = [
  { angle: 45,  r: 0.62 },
  { angle: 120, r: 0.72 },
  { angle: 205, r: 0.58 },
  { angle: 285, r: 0.68 },
  { angle: 330, r: 0.52 },
  { angle: 15,  r: 0.80 },
  { angle: 165, r: 0.75 },
  { angle: 240, r: 0.82 },
];

/* ── SVG Radar ── */
function RadarSVG({ isActive, peers, myDevice, isVisible }) {
  const SIZE = 320;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R  = SIZE / 2 - 8;

  // Narrow beam angle (25 degrees)
  const BEAM_ANGLE = 25;
  const radAngle = (-BEAM_ANGLE * Math.PI) / 180;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="radar-svg w-[160px] xs:w-[185px] sm:w-[245px] max-w-full aspect-square"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Radar Background Dark Disc */}
        <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d1f3c" />
          <stop offset="100%" stopColor="#060c1a" />
        </radialGradient>

        {/* Single Smooth Sweep Gradient — fades continuously from leading edge to tail */}
        <linearGradient id="singleSmoothSweep" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.0" />
          <stop offset="40%"  stopColor="#38bdf8" stopOpacity="0.06" />
          <stop offset="80%"  stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.35" />
        </linearGradient>

        {/* Leading edge line gradient */}
        <linearGradient id="sweepLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="50%"  stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1.0" />
        </linearGradient>

        {/* Glow filter for rings */}
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Green glow for discovered devices */}
        <filter id="greenGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Cyan glow for current active device */}
        <filter id="cyanGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Clip to circle */}
        <clipPath id="radarClip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* ── Base disc ── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#radarBg)" />

      {/* ── Subtle radial grid lines ── */}
      <g clipPath="url(#radarClip)" opacity="0.05">
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i * 20 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={CX} y1={CY}
              x2={CX + R * Math.cos(angle)}
              y2={CY + R * Math.sin(angle)}
              stroke="#38bdf8" strokeWidth="0.5"
            />
          );
        })}
      </g>

      {/* ── Crosshairs ── */}
      <g clipPath="url(#radarClip)" opacity="0.12" stroke="#38bdf8" strokeWidth="0.6">
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} />
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
      </g>

      {/* ── Concentric rings ── */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={R * f}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={i === 3 ? 1.2 : 0.6}
          opacity={i === 3 ? 0.25 : 0.12}
          filter="url(#ringGlow)"
        />
      ))}

      {/* ── Tick marks on outer ring ── */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 * Math.PI) / 180;
        const isMajor = i % 9 === 0;
        const r1 = R;
        const r2 = R - (isMajor ? 10 : 5);
        return (
          <line
            key={i}
            x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
            x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
            stroke="#38bdf8" strokeWidth={isMajor ? 1.2 : 0.5}
            opacity={isMajor ? 0.4 : 0.15}
          />
        );
      })}

      {/* ── Active sweep — single narrow wedge with single smooth gradient ── */}
      {isActive && (
        <g clipPath="url(#radarClip)">
          <g transform={`translate(${CX},${CY})`}>
            {/* Single narrow wedge rotating from exact center */}
            <path
              d={`M 0 0 L ${R * Math.cos(radAngle)} ${R * Math.sin(radAngle)} A ${R} ${R} 0 0 1 ${R} 0 Z`}
              fill="url(#singleSmoothSweep)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </path>

            {/* Bright leading edge line */}
            <line
              x1={0} y1={0}
              x2={R} y2={0}
              stroke="url(#sweepLineGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </line>

            {/* Leading edge tip glow */}
            <circle
              cx={R - 1} cy={0}
              r={3}
              fill="#38bdf8"
              opacity="0.9"
              filter="url(#greenGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </g>
      )}

      {/* ── Discovered Device blips in Vibrant Green ── */}
      {isActive && peers.map((peer, i) => {
        const slot = SLOT_POSITIONS[i % SLOT_POSITIONS.length];
        const rad = (slot.angle * Math.PI) / 180;
        const bx = CX + R * slot.r * Math.cos(rad);
        const by = CY + R * slot.r * Math.sin(rad);

        return (
          <g
            key={peer.id}
            filter="url(#greenGlow)"
            style={{ animationDelay: `${i * 0.25}s` }}
            className="radar-blip-group"
          >
            {/* Outer green ping wave */}
            <circle
              cx={bx} cy={by}
              r={12}
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              opacity="0.8"
              className="blip-ping"
            />
            {/* Green glowing aura */}
            <circle
              cx={bx} cy={by}
              r={7}
              fill="#22c55e"
              opacity="0.3"
            />
            {/* Solid vibrant green core */}
            <circle
              cx={bx} cy={by}
              r={5}
              fill="#22c55e"
              stroke="#86efac"
              strokeWidth="1"
              opacity="1"
            />
            {/* Center bright dot */}
            <circle
              cx={bx} cy={by}
              r={1.8}
              fill="#ffffff"
            />
          </g>
        );
      })}

      {/* ── Current Device Blip (Active when isVisible & isActive, completely hidden when isVisible is false) ── */}
      {isActive && isVisible && (() => {
        // Place current device at 12 o'clock (angle: -90 deg) on inner operational orbit (r: 0.48)
        const myAngle = -90;
        const myRad = (myAngle * Math.PI) / 180;
        const myDist = R * 0.48;
        const mx = CX + myDist * Math.cos(myRad);
        const my = CY + myDist * Math.sin(myRad);

        return (
          <g filter="url(#cyanGlow)" className="radar-blip-group">
            {/* Outer Cyan Ping Wave */}
            <circle
              cx={mx} cy={my}
              r={13}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              opacity="0.85"
              className="blip-ping"
            />
            {/* Cyan glowing aura */}
            <circle
              cx={mx} cy={my}
              r={7.5}
              fill="#38bdf8"
              opacity="0.3"
            />
            {/* Solid vibrant cyan core */}
            <circle
              cx={mx} cy={my}
              r={5}
              fill="#0ea5e9"
              stroke="#bae6fd"
              strokeWidth="1.2"
              opacity="1"
            />
            {/* Center bright dot */}
            <circle
              cx={mx} cy={my}
              r={1.8}
              fill="#ffffff"
            />
          </g>
        );
      })()}

      {/* ── Outer bezel ring ── */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={isActive ? 'rgba(56,189,248,0.3)' : 'rgba(71,85,105,0.3)'}
        strokeWidth="1.5"
        style={{ transition: 'stroke 0.5s' }}
      />
      <circle
        cx={CX} cy={CY} r={R + 4}
        fill="none"
        stroke={isActive ? 'rgba(56,189,248,0.08)' : 'rgba(71,85,105,0.06)'}
        strokeWidth="4"
        style={{ transition: 'stroke 0.5s' }}
      />
    </svg>
  );
}

/* ── Main Component ── */
export default function DeviceGrid() {
  const { 
    peers, 
    myDevice, 
    isRadarActive, 
    toggleRadar, 
    isHostMachine,
    toggleVisibility,
    setIsRenameModalOpen 
  } = useFileFly();

  const isVisible = myDevice?.visible !== false;

  const filteredPeers = useMemo(() => (peers || []).filter((peer) => {
    if (!peer?.id) return false;
    if (myDevice?.id && peer.id === myDevice.id) return false;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('filefly_device_id') : null;
    if (saved && peer.id === saved) return false;
    if (myDevice?.isHost && peer.isHost) return false;
    if (myDevice?.name && peer.name === myDevice.name && peer.ip === myDevice.ip) return false;
    return true;
  }), [peers, myDevice]);

  const hasPeers = filteredPeers.length > 0;

  return (
    <div className="dg-wrap">
      {/* ── Panel ── */}
      <div className={`dg-panel ${isRadarActive ? 'dg-panel--active' : ''}`}>

        {/* Corner accents */}
        <span className="dg-corner dg-corner--tl" />
        <span className="dg-corner dg-corner--tr" />
        <span className="dg-corner dg-corner--bl" />
        <span className="dg-corner dg-corner--br" />

        {/* ── Top label row: Device Name & Visibility Toggle ── */}
        <div className="dg-top-row">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900/95 border border-slate-700/60 hover:border-sky-500/40 shadow-lg shadow-black/40 backdrop-blur-md transition-all text-xs select-none">
            {/* Device Identity Button (Edit Icon + Name) */}
            <button
              type="button"
              onClick={() => setIsRenameModalOpen(true)}
              className="flex items-center gap-1.5 text-white hover:text-sky-300 font-bold font-sans tracking-wide transition-colors group"
              title="انقر لتعديل اسم جهازك"
            >
              <Edit2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{myDevice?.name || 'جهازي'}</span>
            </button>

            {/* Subtle Divider */}
            <span className="w-px h-3.5 bg-slate-700/70 shrink-0" />

            {/* Visibility Toggle Icon Button */}
            <button
              type="button"
              onClick={toggleVisibility}
              className={`p-1 rounded-full transition-all flex items-center justify-center hover:scale-110 active:scale-95 ${
                isVisible
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] border border-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
              title={isVisible ? 'الجهاز مكشوف على الشبكة (مرئي - انقر للإخفاء)' : 'وضع التخفي - مخفي (انقر للظهور)'}
            >
              {isVisible ? (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* ── Radar + Button layout ── */}
        <div className="dg-radar-area">

          {/* Radar SVG */}
          <div className={`dg-radar-wrap ${isRadarActive ? 'dg-radar-wrap--active' : ''}`}>
            <RadarSVG isActive={isRadarActive} peers={filteredPeers} myDevice={myDevice} isVisible={isVisible} />
          </div>

          {/* Center power button — overlaid on radar center */}
          <button
            type="button"
            onClick={toggleRadar}
            className={`dg-power-btn ${isRadarActive ? 'dg-power-btn--on' : 'dg-power-btn--off'}`}
            title={isRadarActive ? 'إيقاف' : 'تشغيل'}
          >
            <span className="dg-power-btn__glow" />
            <span className="dg-power-btn__border" />
            <span className="dg-power-btn__face">
              <Power
                strokeWidth={1.8}
                className={`dg-power-icon ${isRadarActive ? 'dg-power-icon--on' : 'dg-power-icon--off'}`}
              />
            </span>
          </button>
        </div>

        {/* ── Status bar (Sleek English ONLINE badge) ── */}
        <div className="dg-status-bar">
          {!isRadarActive ? (
            <span className="dg-status-text">الرادار متوقف</span>
          ) : (
            <span className={`dg-freq-tag flex items-center gap-1.5 ${hasPeers ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'text-sky-400/80 border-sky-500/20 bg-sky-500/5'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasPeers ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-sky-400 animate-pulse'}`} />
              {filteredPeers.length} ONLINE
            </span>
          )}
        </div>

      </div>

      {/* ── Subtle Quick Connect Hint (Only on host PC when radar active and no peers yet) ── */}
      {!hasPeers && isRadarActive && isHostMachine && (
        <div className="flex items-center justify-center pt-2 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-400 text-xs shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80" />
            <span>امسح رمز الـ QR من الأعلى لربط هاتفك في ثوانٍ</span>
          </div>
        </div>
      )}

      {/* ── Discovered Devices ── */}
      {hasPeers && (
        <div className="dg-devices">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredPeers.map((peer) => (
              <DeviceCard key={peer.id} peer={peer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
