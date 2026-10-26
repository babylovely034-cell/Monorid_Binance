'use client';

import React from 'react';
import { motion } from 'motion/react';

interface BotMotionProps {
  isOpen?: boolean;
  className?: string;
  size?: number;
}

// 1. Apex Momentum: Directional upward velocity chevrons with kinetic speed waves
export function ApexMomentumMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Kinetic Beam Center */}
        <motion.line
          x1="12"
          y1="21"
          x2="12"
          y2="3"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          strokeDashoffset="0"
          animate={{ strokeDashoffset: [0, -10] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          opacity={0.6}
        />
        {/* Chevron 1 (Top / Apex) */}
        <motion.path
          d="M5 9 L12 3 L19 9"
          animate={{
            y: [-1, -3, -1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
        {/* Chevron 2 (Mid) */}
        <motion.path
          d="M6 14 L12 8 L18 14"
          animate={{
            y: [-0.5, -2.5, -0.5],
            opacity: [0.4, 0.85, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.15, ease: 'easeInOut' }}
        />
        {/* Chevron 3 (Bottom) */}
        <motion.path
          d="M7 19 L12 14 L17 19"
          animate={{
            y: [0, -2, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
        />
      </svg>
      {/* Dynamic Ambient Flare */}
      <motion.div
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 2. Mean Reversion: Dual oscillating equilibrium waves converging to a center mean axis
export function MeanReversionMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Central Mean Axis Line */}
        <line x1="2" y1="12" x2="22" y2="12" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="2 2" opacity={0.65} />
        
        {/* Upper Boundary Envelope */}
        <line x1="4" y1="5" x2="20" y2="5" stroke={primaryColor} strokeWidth="0.75" strokeDasharray="1 3" opacity={0.35} />
        {/* Lower Boundary Envelope */}
        <line x1="4" y1="19" x2="20" y2="19" stroke={primaryColor} strokeWidth="0.75" strokeDasharray="1 3" opacity={0.35} />

        {/* Dynamic Sine Harmonic Wave */}
        <motion.path
          d="M2 12 Q 7 4, 12 12 T 22 12"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              'M2 12 Q 7 4, 12 12 T 22 12',
              'M2 12 Q 7 19, 12 12 T 22 12',
              'M2 12 Q 7 4, 12 12 T 22 12',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />

        {/* Reversion Nodes (Oscillating toward center) */}
        <motion.circle
          cx="7"
          cy="6"
          r="2"
          fill={primaryColor}
          animate={{ cy: [5, 12, 5] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="17"
          cy="18"
          r="2"
          fill={primaryColor}
          animate={{ cy: [19, 12, 19] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 3. Breakout Hunter: Rotating targeting reticle with sonar ping locking onto breakout zones
export function BreakoutHunterMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Rotating Outer Segmented Reticle */}
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          style={{ transformOrigin: '12px 12px' }}
        />

        {/* Inner Counter-Rotating Reticle */}
        <motion.circle
          cx="12"
          cy="12"
          r="5.5"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity={0.7}
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          style={{ transformOrigin: '12px 12px' }}
        />

        {/* Precision Crosshair Lines */}
        <line x1="12" y1="1" x2="12" y2="5" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="23" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="12" x2="5" y2="12" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="12" x2="23" y2="12" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />

        {/* Central Radar Ping Expanding Ring */}
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          stroke={primaryColor}
          strokeWidth="1"
          animate={{ r: [2, 7, 2], opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
        />

        {/* Central Target Lock Node */}
        <motion.circle
          cx="12"
          cy="12"
          r="2.2"
          fill={primaryColor}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
          style={{ transformOrigin: '12px 12px' }}
        />
      </svg>
      <motion.div
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 4. Rapid Scalper: High-frequency cybernetic lightning surge with rapid energy arcs
export function RapidScalperMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Orbiting Electric Sparks */}
        <motion.circle
          cx="6"
          cy="7"
          r="1"
          fill={primaryColor}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }}
        />
        <motion.circle
          cx="18"
          cy="16"
          r="1"
          fill={primaryColor}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
        />

        {/* Main High-Voltage Angular Bolt */}
        <motion.path
          d="M13 2 L5 12 L11 12 L9 22 L19 10 L13 10 Z"
          fill={isOpen ? '#34d399' : '#22d3ee'}
          fillOpacity={0.25}
          stroke={primaryColor}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          animate={{
            scale: [1, 1.08, 0.96, 1.04, 1],
            opacity: [0.85, 1, 0.75, 1, 0.85],
          }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          style={{ transformOrigin: '12px 12px' }}
        />

        {/* Dynamic Energy Discharge Arc */}
        <motion.path
          d="M3 12 C 4 9, 7 8, 8 10"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.7, repeatDelay: 0.5 }}
        />
        <motion.path
          d="M16 14 C 17 16, 20 15, 21 12"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.7, delay: 0.3, repeatDelay: 0.5 }}
        />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.85, 1.15, 0.85] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 5. Swing Raider: Wide-amplitude oscillating pendulum swing with parabolic pivot arcs
export function SwingRaiderMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Parabolic Guide Arc */}
        <path
          d="M4 18 A 9 9 0 0 0 20 18"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity={0.4}
        />

        {/* Pivot Point at Top */}
        <circle cx="12" cy="5" r="2" fill={primaryColor} />

        {/* Swinging Pendulum Arm & Energy Bob */}
        <motion.g
          animate={{ rotate: [-32, 32, -32] }}
          transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut' }}
          style={{ transformOrigin: '12px 5px' }}
        >
          <line x1="12" y1="5" x2="12" y2="18" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="18" r="3" fill={primaryColor} />
          {/* Energy Core inside Bob */}
          <circle cx="12" cy="18" r="1.2" fill="#ffffff" opacity={0.9} />
        </motion.g>

        {/* Left & Right Swing Target Nodes */}
        <circle cx="5" cy="16" r="1.5" stroke={primaryColor} strokeWidth="1" opacity={0.5} />
        <circle cx="19" cy="16" r="1.5" stroke={primaryColor} strokeWidth="1" opacity={0.5} />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2.0 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 6. Volatility Reaper: Dual spinning cybernetic vortex scythe blades capturing price volatility
export function VolatilityReaperMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Outer Volatility Ring */}
        <circle cx="12" cy="12" r="9.5" stroke={primaryColor} strokeWidth="0.8" strokeDasharray="3 4" opacity={0.4} />

        {/* Rotating Dual Scythe Blades */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
          style={{ transformOrigin: '12px 12px' }}
        >
          {/* Top Scythe Blade */}
          <path
            d="M12 3 C16.5 3 20 6.5 20 11 C16.5 10 13 8 12 3 Z"
            fill={primaryColor}
            fillOpacity={0.35}
            stroke={primaryColor}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Bottom Scythe Blade */}
          <path
            d="M12 21 C7.5 21 4 17.5 4 13 C7.5 14 11 16 12 21 Z"
            fill={primaryColor}
            fillOpacity={0.35}
            stroke={primaryColor}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Core Volatility Eye */}
        <motion.circle
          cx="12"
          cy="12"
          r="2.5"
          fill={primaryColor}
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          style={{ transformOrigin: '12px 12px' }}
        />
        <circle cx="12" cy="12" r="1" fill="#ffffff" />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.9, 1.2, 0.9] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 7. Liquidity Sweeper: Inward collapsing gravitational suction waves sweeping order book liquidity
export function LiquiditySweeperMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Outer Inward Cascade Wave 1 */}
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          animate={{
            r: [9, 2],
            opacity: [0.1, 0.9],
          }}
          transition={{ repeat: Infinity, duration: 2.0, ease: 'easeIn' }}
        />
        {/* Mid Inward Cascade Wave 2 */}
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          animate={{
            r: [9, 2],
            opacity: [0.1, 0.9],
          }}
          transition={{ repeat: Infinity, duration: 2.0, delay: 0.65, ease: 'easeIn' }}
        />
        {/* Inner Inward Cascade Wave 3 */}
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          animate={{
            r: [9, 2],
            opacity: [0.1, 0.9],
          }}
          transition={{ repeat: Infinity, duration: 2.0, delay: 1.3, ease: 'easeIn' }}
        />

        {/* Dynamic Sweeper Spiral Vectors */}
        <motion.path
          d="M5 5 C 9 8, 10 11, 12 12"
          stroke={primaryColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.path
          d="M19 19 C 15 16, 14 13, 12 12"
          stroke={primaryColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
        />

        {/* Central Liquidity Singularity Core */}
        <motion.circle
          cx="12"
          cy="12"
          r="2.8"
          fill={primaryColor}
          animate={{ scale: [0.9, 1.25, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.0 }}
          style={{ transformOrigin: '12px 12px' }}
        />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 8. Order Flow Reaper: Real-time dynamic order book depth ladder with bid/ask packet streaming
export function OrderFlowReaperMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const bidColor = '#34d399';
  const askColor = isOpen ? '#22d3ee' : '#38bdf8';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Center Spread Corridor Guide */}
        <line x1="12" y1="2" x2="12" y2="22" stroke={primaryColor} strokeWidth="1" strokeDasharray="1 3" opacity={0.4} />

        {/* Bid Depth Bars (Left Side) */}
        <motion.rect
          x="3"
          y="4"
          height="2.5"
          rx="1"
          fill={bidColor}
          animate={{ width: [7, 8.5, 6, 7] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
        <motion.rect
          x="4.5"
          y="8.5"
          height="2.5"
          rx="1"
          fill={bidColor}
          animate={{ width: [5.5, 7, 5, 5.5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
        />
        <motion.rect
          x="2"
          y="13"
          height="2.5"
          rx="1"
          fill={bidColor}
          animate={{ width: [8, 9.5, 7.5, 8] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.6, ease: 'easeInOut' }}
        />
        <motion.rect
          x="3.5"
          y="17.5"
          height="2.5"
          rx="1"
          fill={bidColor}
          animate={{ width: [6.5, 8, 6, 6.5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.9, ease: 'easeInOut' }}
        />

        {/* Ask Depth Bars (Right Side) */}
        <motion.rect
          x="14"
          y="4"
          height="2.5"
          rx="1"
          fill={askColor}
          animate={{ width: [6.5, 8, 6, 6.5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.2, ease: 'easeInOut' }}
        />
        <motion.rect
          x="14"
          y="8.5"
          height="2.5"
          rx="1"
          fill={askColor}
          animate={{ width: [7.5, 6, 8, 7.5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
        />
        <motion.rect
          x="14"
          y="13"
          height="2.5"
          rx="1"
          fill={askColor}
          animate={{ width: [5, 7, 5.5, 5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.8, ease: 'easeInOut' }}
        />
        <motion.rect
          x="14"
          y="17.5"
          height="2.5"
          rx="1"
          fill={askColor}
          animate={{ width: [8, 6.5, 9, 8] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 1.1, ease: 'easeInOut' }}
        />

        {/* Streaming Flow Packet traversing the corridor */}
        <motion.circle
          cx="12"
          cy="3"
          r="1.6"
          fill="#ffffff"
          animate={{ cy: [3, 21, 3] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        />
      </svg>
      <motion.div
        animate={{ opacity: [0.15, 0.45, 0.15] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 9. Interchain Pulse: Constellation bridging nodes with quantum packets orbiting cross-chain paths
export function InterchainPulseMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Constellation Bridge Diamond Path */}
        <polygon
          points="12,3 21,12 12,21 3,12"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity={0.6}
        />
        <line x1="12" y1="3" x2="12" y2="21" stroke={primaryColor} strokeWidth="0.8" opacity={0.3} />
        <line x1="3" y1="12" x2="21" y2="12" stroke={primaryColor} strokeWidth="0.8" opacity={0.3} />

        {/* 4 Constellation Node Terminals */}
        <motion.circle cx="12" cy="3" r="2" fill={primaryColor} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0 }} style={{ transformOrigin: '12px 3px' }} />
        <motion.circle cx="21" cy="12" r="2" fill={primaryColor} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.4 }} style={{ transformOrigin: '21px 12px' }} />
        <motion.circle cx="12" cy="21" r="2" fill={primaryColor} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.8 }} style={{ transformOrigin: '12px 21px' }} />
        <motion.circle cx="3" cy="12" r="2" fill={primaryColor} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 1.2 }} style={{ transformOrigin: '3px 12px' }} />

        {/* Orbiting Quantum Data Packet traversing between nodes */}
        <motion.circle
          cx="12"
          cy="3"
          r="1.8"
          fill="#ffffff"
          animate={{
            cx: [12, 21, 12, 3, 12],
            cy: [3, 12, 21, 12, 3],
          }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        />

        {/* Inner Bridge Core */}
        <circle cx="12" cy="12" r="1.5" fill={primaryColor} opacity={0.8} />
      </svg>
      <motion.div
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// 10. Surge Breakout: Plasma rocket arrow blasting violently through a resistance barrier
export function SurgeBreakoutMotion({ isOpen, className = '', size = 20 }: BotMotionProps) {
  const primaryColor = isOpen ? '#34d399' : '#22d3ee';
  const glowColor = isOpen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Resistance Barrier Line at Top (with shatter gap) */}
        <motion.line
          x1="2"
          y1="8"
          x2="22"
          y2="8"
          stroke={primaryColor}
          strokeWidth="1.8"
          strokeDasharray="4 2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />

        {/* Shatter Shockwave Rings expanding from breakthrough point */}
        <motion.circle
          cx="12"
          cy="8"
          r="2"
          stroke={primaryColor}
          strokeWidth="1"
          animate={{
            r: [2, 7, 2],
            opacity: [1, 0, 1],
          }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
        />

        {/* Upward Blasting Jet / Surge Rocket Arrow */}
        <motion.g
          animate={{
            y: [3, -2, 3],
          }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        >
          {/* Arrow Head Penetrating Ceiling */}
          <path
            d="M12 2 L6 10 L18 10 Z"
            fill={isOpen ? '#34d399' : '#22d3ee'}
            fillOpacity={0.3}
            stroke={primaryColor}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Propulsion Jet Body */}
          <rect x="10.5" y="10" width="3" height="7" rx="1" fill={primaryColor} />
          {/* Flame Exhaust Flare */}
          <motion.path
            d="M10.5 17 L12 21 L13.5 17 Z"
            fill="#f59e0b"
            animate={{ scaleY: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            style={{ transformOrigin: '12px 17px' }}
          />
        </motion.g>

        {/* Side Debris Sparks */}
        <motion.circle cx="8" cy="7" r="1" fill={primaryColor} animate={{ y: [0, -3, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }} />
        <motion.circle cx="16" cy="7" r="1" fill={primaryColor} animate={{ y: [0, -3, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} />
      </svg>
      <motion.div
        animate={{ opacity: [0.25, 0.65, 0.25], scale: [0.85, 1.2, 0.85] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// Master Helper to Render the Unique Animated Motion Icon by Category ID
export function BotMotionIcon({
  catId,
  isOpen = false,
  className = '',
  size = 20,
}: {
  catId: string;
  isOpen?: boolean;
  className?: string;
  size?: number;
}) {
  switch (catId) {
    case 'l1-mainstream':
      return <ApexMomentumMotion isOpen={isOpen} className={className} size={size} />;
    case 'l2-rollups':
      return <MeanReversionMotion isOpen={isOpen} className={className} size={size} />;
    case 'ai-big-data':
      return <BreakoutHunterMotion isOpen={isOpen} className={className} size={size} />;
    case 'defi-protocols':
      return <RapidScalperMotion isOpen={isOpen} className={className} size={size} />;
    case 'meme-coins':
      return <SwingRaiderMotion isOpen={isOpen} className={className} size={size} />;
    case 'gaming-metaverse':
      return <VolatilityReaperMotion isOpen={isOpen} className={className} size={size} />;
    case 'rwa-payments':
      return <LiquiditySweeperMotion isOpen={isOpen} className={className} size={size} />;
    case 'infra-depin':
      return <OrderFlowReaperMotion isOpen={isOpen} className={className} size={size} />;
    case 'crosschain-interop':
      return <InterchainPulseMotion isOpen={isOpen} className={className} size={size} />;
    case 'max-movers-volatility':
      return <SurgeBreakoutMotion isOpen={isOpen} className={className} size={size} />;
    default:
      return <ApexMomentumMotion isOpen={isOpen} className={className} size={size} />;
  }
}
