import React, { useMemo, useRef } from 'react';
import { Power, Laptop, Smartphone, Monitor } from 'lucide-react';
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
function RadarSVG({ isActive, peers }) {
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
      className="radar-svg w-[250px] xs:w-[280px] sm:w-[320px] max-w-full aspect-square"
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
  const { peers, myDevice, isRadarActive, toggleRadar } = useFileFly();

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

        {/* ── Top label row ── */}
        <div className="dg-top-row">
          <span className="dg-top-label">RADAR SCANNER</span>
        </div>

        {/* ── Radar + Button layout ── */}
        <div className="dg-radar-area">

          {/* Radar SVG */}
          <div className={`dg-radar-wrap ${isRadarActive ? 'dg-radar-wrap--active' : ''}`}>
            <RadarSVG isActive={isRadarActive} peers={filteredPeers} />
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

        {/* ── Status bar ── */}
        <div className="dg-status-bar">
          {!isRadarActive ? (
            <span className="dg-status-text">الرادار متوقف</span>
          ) : (
            <span className={`dg-freq-tag ${hasPeers ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : ''}`}>
              {filteredPeers.length} ONLINE
            </span>
          )}
        </div>

      </div>

      {/* ── Discovered Devices ── */}
      {hasPeers && (
        <div className="dg-devices">
          <div className="dg-devices__header">
            <span className="dg-devices__dot" />
            <span className="dg-devices__title">الأجهزة المكتشفة</span>
            <span className="dg-devices__count">{filteredPeers.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeers.map((peer) => (
              <DeviceCard key={peer.id} peer={peer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
