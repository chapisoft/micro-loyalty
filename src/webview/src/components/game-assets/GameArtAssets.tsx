import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. HIGH-END 3D STYLIZED VECTOR GAME COVER CARDS (GameHub & Dashboard)
// ─────────────────────────────────────────────────────────────────────────────

interface GameCoverProps {
  gameId: string;
  className?: string;
}

export const GameCoverArt: React.FC<GameCoverProps> = ({ gameId, className = 'w-full h-full' }) => {
  switch (gameId) {
    case 'WHEEL':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wheelGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="wheelCenterGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Ambient Glow */}
          <circle cx="100" cy="100" r="90" fill="url(#wheelGlow)" />
          {/* Outer Wheel Rim */}
          <circle cx="100" cy="100" r="76" fill="url(#wheelGoldGrad)" stroke="#FEF08A" strokeWidth="4" filter="url(#shadow3d)" />
          <circle cx="100" cy="100" r="70" fill="#1E1B4B" stroke="#FDE047" strokeWidth="2" />
          {/* Slices */}
          <g transform="rotate(15 100 100)">
            <path d="M100 100 L100 30 A70 70 0 0 1 160.6 65 Z" fill="#DC2626" />
            <path d="M100 100 L160.6 65 A70 70 0 0 1 170 100 Z" fill="#F59E0B" />
            <path d="M100 100 L170 100 A70 70 0 0 1 160.6 135 Z" fill="#2563EB" />
            <path d="M100 100 L160.6 135 A70 70 0 0 1 100 170 Z" fill="#16A34A" />
            <path d="M100 100 L100 170 A70 70 0 0 1 39.4 135 Z" fill="#9333EA" />
            <path d="M100 100 L39.4 135 A70 70 0 0 1 30 100 Z" fill="#EA580C" />
            <path d="M100 100 L30 100 A70 70 0 0 1 39.4 65 Z" fill="#0D9488" />
            <path d="M100 100 L39.4 65 A70 70 0 0 1 100 30 Z" fill="#E11D48" />
          </g>
          {/* Light bulbs */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            const bx = 100 + Math.cos(rad) * 73;
            const by = 100 + Math.sin(rad) * 73;
            return <circle key={i} cx={bx} cy={by} r="3.5" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />;
          })}
          {/* Center Hub */}
          <circle cx="100" cy="100" r="26" fill="url(#wheelCenterGold)" stroke="#FFFBEB" strokeWidth="3" filter="url(#shadow3d)" />
          <path d="M100 84 L104 93 L114 94 L106 101 L109 111 L100 105 L91 111 L94 101 L86 94 L96 93 Z" fill="#FFFBEB" />
          {/* Top Pointer */}
          <polygon points="100,16 112,38 88,38" fill="#EF4444" stroke="#FEF08A" strokeWidth="2" filter="url(#shadow3d)" />
        </svg>
      );

    case 'FLAPPY':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flappySky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="60%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <linearGradient id="birdBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="towerSteel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="40%" stopColor="#94A3B8" />
              <stop offset="70%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.8" />
            </filter>
          </defs>
          {/* Background Sky */}
          <rect width="200" height="200" rx="36" fill="url(#flappySky)" />
          {/* Clouds */}
          <path d="M20 70 A15 15 0 0 1 45 60 A22 22 0 0 1 80 62 A18 18 0 0 1 95 75 Z" fill="white" fillOpacity="0.75" />
          <path d="M120 45 A14 14 0 0 1 145 38 A20 20 0 0 1 175 42 A16 16 0 0 1 188 52 Z" fill="white" fillOpacity="0.6" />
          {/* 4G Antenna Tower (Right) */}
          <rect x="145" y="60" width="30" height="140" fill="url(#towerSteel)" rx="4" />
          <rect x="141" y="52" width="38" height="10" fill="#DC2626" rx="3" />
          <circle cx="160" cy="46" r="4" fill="#EF4444" filter="url(#glowCyan)" />
          {/* Holographic 4G Signal Waves */}
          <path d="M140 40 A25 25 0 0 0 140 10" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <path d="M130 45 A38 38 0 0 0 130 5" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          {/* Natcom Mascot Bird */}
          <g transform="translate(45, 75) rotate(-6)">
            {/* Wing */}
            <ellipse cx="22" cy="38" rx="14" ry="9" fill="#FDE047" stroke="#D97706" strokeWidth="1.5" transform="rotate(-20 22 38)" />
            {/* Body */}
            <circle cx="42" cy="35" r="26" fill="url(#birdBody)" stroke="#B45309" strokeWidth="2" filter="url(#shadow3d)" />
            {/* Natcom Red Pilot Helmet */}
            <path d="M22 32 A24 24 0 0 1 64 24 L62 36 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            <ellipse cx="50" cy="22" rx="7" ry="4" fill="#F59E0B" />
            {/* Eye */}
            <circle cx="53" cy="30" r="7" fill="white" />
            <circle cx="56" cy="30" r="4" fill="#0F172A" />
            <circle cx="58" cy="28" r="1.5" fill="white" />
            {/* Golden Beak */}
            <polygon points="65,33 82,38 65,45" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" />
          </g>
          {/* Floating Gold Coin */}
          <g transform="translate(100, 130)">
            <circle cx="14" cy="14" r="14" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" filter="url(#shadow3d)" />
            <text x="14" y="18" textAnchor="middle" fill="#78350F" fontSize="12" fontWeight="900" fontFamily="sans-serif">N</text>
          </g>
        </svg>
      );

    case 'GAME2048':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg2048" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="gold2048" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="coinGrad512" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBCFE8" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="coinGrad1024" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Card Container */}
          <rect width="200" height="200" rx="36" fill="url(#bg2048)" />
          {/* Mini Grid in Background */}
          <g opacity="0.6">
            <rect x="24" y="24" width="40" height="40" rx="10" fill="#F97316" />
            <text x="44" y="49" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">128</text>
            <rect x="70" y="24" width="40" height="40" rx="10" fill="url(#coinGrad512)" />
            <text x="90" y="49" textAnchor="middle" fill="white" fontSize="13" fontWeight="900">512</text>
            <rect x="116" y="24" width="60" height="40" rx="10" fill="url(#coinGrad1024)" />
            <text x="146" y="49" textAnchor="middle" fill="white" fontSize="13" fontWeight="900">1024</text>
          </g>
          {/* Giant Hero 2048 Gold Token Tile */}
          <g transform="translate(30, 75)" filter="url(#shadow3d)">
            <rect x="0" y="0" width="140" height="95" rx="20" fill="url(#gold2048)" stroke="#FFFBEB" strokeWidth="3" />
            {/* Top Crown Emblem */}
            <path d="M70 12 L76 22 L86 16 L83 28 L57 28 L54 16 L64 22 Z" fill="#FFFBEB" />
            {/* 2048 Text */}
            <text x="70" y="60" textAnchor="middle" fill="#78350F" fontSize="32" fontWeight="900" letterSpacing="-1" fontFamily="sans-serif">
              2048
            </text>
            <rect x="42" y="68" width="56" height="16" rx="8" fill="#78350F" />
            <text x="70" y="80" textAnchor="middle" fill="#FEF08A" fontSize="9" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">
              NATCASH
            </text>
          </g>
          {/* Sparkles */}
          <polygon points="160,70 163,78 171,81 163,84 160,92 157,84 149,81 157,78" fill="#FEF08A" />
        </svg>
      );

    case 'MEMORY':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgMemory" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#581C87" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="cardGoldBack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="cardFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgMemory)" />
          {/* Back Card 1 (Left Tilted) */}
          <g transform="translate(25, 40) rotate(-14)" filter="url(#shadow3d)">
            <rect width="70" height="105" rx="12" fill="url(#cardGoldBack)" stroke="#F59E0B" strokeWidth="2.5" />
            <rect x="6" y="6" width="58" height="93" rx="8" fill="none" stroke="#FDE047" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="35" cy="52" r="16" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="35" y="58" textAnchor="middle" fill="#FDE047" fontSize="18" fontWeight="bold">★</text>
          </g>
          {/* Front Card 2 (Right Overlapping - Revealing Natcom 4G / Delimart Logo) */}
          <g transform="translate(95, 35) rotate(12)" filter="url(#shadow3d)">
            <rect width="75" height="110" rx="14" fill="url(#cardFrontGrad)" stroke="#FFFBEB" strokeWidth="3" />
            <rect x="6" y="6" width="63" height="98" rx="10" fill="#0284C7" />
            {/* Delimart & Natcash VIP Crest */}
            <circle cx="37" cy="46" r="20" fill="white" />
            <text x="37" y="53" textAnchor="middle" fill="#0284C7" fontSize="22">🛒</text>
            <rect x="14" y="74" width="46" height="18" rx="6" fill="#F59E0B" />
            <text x="37" y="86" textAnchor="middle" fill="#78350F" fontSize="8" fontWeight="900" fontFamily="sans-serif">DELIMART</text>
          </g>
          {/* Match Sparkle Burst */}
          <polygon points="100,20 104,30 114,34 104,38 100,48 96,38 86,34 96,30" fill="#FEF08A" />
        </svg>
      );

    case 'BUBBLE':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgBubble" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="50%" stopColor="#4C0519" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <radialGradient id="bubbleRed" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#FCA5A5" />
              <stop offset="60%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
            <radialGradient id="bubbleGold" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#FEF08A" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
            <radialGradient id="bubbleBlue" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#BAE6FD" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </radialGradient>
            <radialGradient id="bubbleGreen" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#BBF7D0" />
              <stop offset="60%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#14532D" />
            </radialGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgBubble)" />
          {/* Cluster of 3D Crystal Bubbles */}
          <circle cx="65" cy="50" r="22" fill="url(#bubbleRed)" filter="url(#shadow3d)" />
          <circle cx="105" cy="45" r="22" fill="url(#bubbleGold)" filter="url(#shadow3d)" />
          <circle cx="145" cy="55" r="20" fill="url(#bubbleBlue)" filter="url(#shadow3d)" />
          <circle cx="85" cy="85" r="24" fill="url(#bubbleGreen)" filter="url(#shadow3d)" />
          <circle cx="125" cy="82" r="23" fill="url(#bubbleRed)" filter="url(#shadow3d)" />
          {/* Carnival Brass Cannon */}
          <g transform="translate(100, 180) rotate(-25)">
            <path d="M-14 0 L-10 -55 L10 -55 L14 0 Z" fill="#D97706" stroke="#FEF08A" strokeWidth="2" filter="url(#shadow3d)" />
            <rect x="-13" y="-58" width="26" height="8" rx="4" fill="#FDE047" />
            {/* Cannon Base Wheel */}
            <circle cx="0" cy="0" r="24" fill="#92400E" stroke="#FEF08A" strokeWidth="3" />
            <circle cx="0" cy="0" r="8" fill="#FEF08A" />
          </g>
          {/* Laser Aiming Ray */}
          <line x1="75" y1="125" x2="85" y2="105" stroke="#FDE047" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'FRUIT':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgFruit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="60%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="mangoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#84CC16" />
            </linearGradient>
            <linearGradient id="watermelonFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
            <linearGradient id="bladeTrail" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="30%" stopColor="#FDE047" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgFruit)" />
          {/* Watermelon Slice (Bottom Left) */}
          <g transform="translate(30, 95) rotate(-18)" filter="url(#shadow3d)">
            <path d="M0 50 A50 50 0 0 1 80 15 L40 50 Z" fill="#15803D" />
            <path d="M4 48 A46 46 0 0 1 76 18 L40 48 Z" fill="#86EFAC" />
            <path d="M8 46 A42 42 0 0 1 72 22 L40 46 Z" fill="url(#watermelonFlesh)" />
            {/* Seeds */}
            <circle cx="34" cy="36" r="2" fill="#0F172A" />
            <circle cx="48" cy="34" r="2" fill="#0F172A" />
            <circle cx="42" cy="26" r="2" fill="#0F172A" />
          </g>
          {/* Sliced Haitian Francisque Mango (Top Right) */}
          <g transform="translate(100, 35) rotate(15)" filter="url(#shadow3d)">
            <ellipse cx="40" cy="35" rx="32" ry="24" fill="url(#mangoSkin)" />
            {/* Leaf */}
            <path d="M12 25 Q2 10 20 8 Q24 20 12 25 Z" fill="#15803D" />
            {/* Inner Golden Juicy Pulp Cut */}
            <ellipse cx="44" cy="36" rx="24" ry="16" fill="#FBBF24" stroke="#FFFBEB" strokeWidth="1.5" />
          </g>
          {/* Glowing Golden Blade Slash Trail */}
          <path
            d="M15 175 Q100 100 185 25"
            stroke="url(#bladeTrail)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#shadow3d)"
          />
          <path d="M15 175 Q100 100 185 25" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          {/* Juice Splash Droplets */}
          <circle cx="85" cy="80" r="4" fill="#F59E0B" />
          <circle cx="115" cy="110" r="3" fill="#EF4444" />
          <circle cx="130" cy="70" r="4" fill="#FBBF24" />
        </svg>
      );

    case 'KNIFE':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgKnife" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451A03" />
              <stop offset="70%" stopColor="#1C1917" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <radialGradient id="woodLogGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="40%" stopColor="#B45309" />
              <stop offset="75%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </radialGradient>
            <linearGradient id="bladeSteel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgKnife)" />
          {/* Central Ancient Tree Log */}
          <circle cx="100" cy="85" r="54" fill="url(#woodLogGrad)" stroke="#F59E0B" strokeWidth="4" filter="url(#shadow3d)" />
          <circle cx="100" cy="85" r="42" fill="none" stroke="#92400E" strokeWidth="2" strokeDasharray="12 4" />
          <circle cx="100" cy="85" r="28" fill="none" stroke="#78350F" strokeWidth="2" />
          <circle cx="100" cy="85" r="14" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />
          <text x="100" y="90" textAnchor="middle" fill="#78350F" fontSize="12" fontWeight="900">VIP</text>
          {/* Pinned Daggers into Log */}
          <g transform="translate(100, 85) rotate(45)">
            <rect x="-3" y="52" width="6" height="22" fill="url(#bladeSteel)" />
            <rect x="-6" y="74" width="12" height="4" fill="#F59E0B" />
            <rect x="-4" y="78" width="8" height="16" fill="#DC2626" rx="2" />
          </g>
          <g transform="translate(100, 85) rotate(-60)">
            <rect x="-3" y="52" width="6" height="22" fill="url(#bladeSteel)" />
            <rect x="-6" y="74" width="12" height="4" fill="#F59E0B" />
            <rect x="-4" y="78" width="8" height="16" fill="#DC2626" rx="2" />
          </g>
          {/* Pinned Lucky Red Envelope (Lì xì) */}
          <g transform="translate(100, 85) rotate(135)">
            <rect x="-10" y="32" width="20" height="28" rx="4" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.5" />
            <circle cx="0" cy="46" r="5" fill="#FEF08A" />
          </g>
          {/* Hero Throwing Dagger at Bottom Ready to Strike */}
          <g transform="translate(100, 135)" filter="url(#shadow3d)">
            <path d="M0 0 L5 25 L-5 25 Z" fill="url(#bladeSteel)" />
            <rect x="-8" y="25" width="16" height="5" rx="2" fill="#F59E0B" />
            <rect x="-4" y="30" width="8" height="24" rx="3" fill="#DC2626" />
            <circle cx="0" cy="54" r="5" fill="#FEF08A" />
          </g>
        </svg>
      );

    case 'BLOCK':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgBlock" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="gemRuby" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="40%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="gemSapphire" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="40%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </linearGradient>
            <linearGradient id="gemEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="gemTopaz" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgBlock)" />
          {/* 3D Jewel Tetris Blocks Assembly */}
          <g transform="translate(40, 45)" filter="url(#shadow3d)">
            {/* Block 1: Sapphire */}
            <rect x="0" y="0" width="36" height="36" rx="8" fill="url(#gemSapphire)" stroke="#BAE6FD" strokeWidth="2" />
            <polygon points="0,0 18,18 36,0" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Block 2: Emerald */}
            <rect x="40" y="0" width="36" height="36" rx="8" fill="url(#gemEmerald)" stroke="#A7F3D0" strokeWidth="2" />
            <polygon points="40,0 58,18 76,0" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Block 3: Ruby */}
            <rect x="80" y="0" width="36" height="36" rx="8" fill="url(#gemRuby)" stroke="#FDA4AF" strokeWidth="2" />
            <polygon points="80,0 98,18 116,0" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Block 4: Topaz (L-piece bottom) */}
            <rect x="80" y="40" width="36" height="36" rx="8" fill="url(#gemTopaz)" stroke="#FEF08A" strokeWidth="2" />
            <polygon points="80,40 98,58 116,40" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Block 5: Topaz */}
            <rect x="80" y="80" width="36" height="36" rx="8" fill="url(#gemTopaz)" stroke="#FEF08A" strokeWidth="2" />
            <polygon points="80,80 98,98 116,80" fill="#FFFFFF" fillOpacity="0.3" />
          </g>
          {/* Laser Blast Line Sweep FX */}
          <line x1="20" y1="100" x2="180" y2="100" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'RUNNER':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgRunner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="45%" stopColor="#C2410C" />
              <stop offset="75%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="taptapBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgRunner)" />
          {/* Sunset Horizon & Palm Silhouettes */}
          <circle cx="100" cy="110" r="35" fill="#FEF08A" fillOpacity="0.8" />
          <path d="M165 130 Q175 90 190 70 Q160 85 165 130 Z" fill="#0F172A" />
          {/* Road Asphalt */}
          <rect x="0" y="140" width="200" height="60" fill="#0F172A" />
          <line x1="0" y1="170" x2="200" y2="170" stroke="#F59E0B" strokeWidth="3" strokeDasharray="16 12" />
          {/* Traditional Haitian Tap-Tap Bus */}
          <g transform="translate(105, 95)" filter="url(#shadow3d)">
            {/* Bus Body */}
            <rect x="0" y="0" width="70" height="45" rx="8" fill="url(#taptapBody)" stroke="#FEF08A" strokeWidth="2" />
            {/* Bus Windows */}
            <rect x="6" y="6" width="20" height="16" rx="3" fill="#BAE6FD" />
            <rect x="30" y="6" width="34" height="16" rx="3" fill="#BAE6FD" />
            {/* Folk Art Roof Carrier */}
            <rect x="4" y="-8" width="62" height="8" rx="2" fill="#FDE047" />
            {/* Wheels */}
            <circle cx="18" cy="45" r="9" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
            <circle cx="54" cy="45" r="9" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
          </g>
          {/* Hero Runner Silhouette Sprinting */}
          <g transform="translate(30, 105)" filter="url(#shadow3d)">
            <circle cx="20" cy="12" r="8" fill="#F59E0B" />
            {/* Red Cap */}
            <path d="M12 10 A8 8 0 0 1 28 8 L32 10 Z" fill="#DC2626" />
            {/* Torso */}
            <rect x="14" y="20" width="12" height="18" rx="4" fill="#DC2626" />
            {/* Arms & Legs */}
            <line x1="16" y1="24" x2="6" y2="34" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            <line x1="24" y1="24" x2="34" y2="16" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            <line x1="16" y1="36" x2="8" y2="52" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <line x1="24" y1="36" x2="36" y2="48" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'WORDLE':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgWordle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="50%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="tileGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="tileYellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgWordle)" />
          {/* Row 1: N A T C O (Word Guess) */}
          <g transform="translate(18, 45)" filter="url(#shadow3d)">
            {/* Box 1: N (Green) */}
            <rect x="0" y="0" width="30" height="34" rx="8" fill="url(#tileGreen)" stroke="#A7F3D0" strokeWidth="1.5" />
            <text x="15" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">N</text>
            {/* Box 2: A (Green) */}
            <rect x="34" y="0" width="30" height="34" rx="8" fill="url(#tileGreen)" stroke="#A7F3D0" strokeWidth="1.5" />
            <text x="49" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">A</text>
            {/* Box 3: T (Yellow) */}
            <rect x="68" y="0" width="30" height="34" rx="8" fill="url(#tileYellow)" stroke="#FEF08A" strokeWidth="1.5" />
            <text x="83" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">T</text>
            {/* Box 4: C (Dark) */}
            <rect x="102" y="0" width="30" height="34" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            <text x="117" y="24" textAnchor="middle" fill="#CBD5E1" fontSize="18" fontWeight="900" fontFamily="sans-serif">C</text>
            {/* Box 5: H (Green) */}
            <rect x="136" y="0" width="30" height="34" rx="8" fill="url(#tileGreen)" stroke="#A7F3D0" strokeWidth="1.5" />
            <text x="151" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">H</text>
          </g>
          {/* Row 2: Empty Grid Outline */}
          <g transform="translate(18, 88)" opacity="0.4">
            <rect x="0" y="0" width="30" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <rect x="34" y="0" width="30" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <rect x="68" y="0" width="30" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <rect x="102" y="0" width="30" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <rect x="136" y="0" width="30" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          </g>
          {/* Cyberpunk Virtual Keyboard Preview at Bottom */}
          <g transform="translate(25, 138)">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U'].map((k, i) => (
              <g key={k} transform={`translate(${i * 22}, 0)`}>
                <rect width="18" height="22" rx="5" fill="#334155" stroke="#475569" strokeWidth="1" />
                <text x="9" y="15" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold">{k}</text>
              </g>
            ))}
          </g>
        </svg>
      );

    case 'SCREW':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgScrew" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="metalPlate1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="metalPlate2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="screwHead" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgScrew)" />
          {/* Perforated Board Holes */}
          {[35, 75, 125, 165].map((x) =>
            [40, 90, 140, 170].map((y, j) => (
              <circle key={`${x}-${j}`} cx={x} cy={y} r="8" fill="#020617" stroke="#475569" strokeWidth="2" />
            ))
          )}
          {/* Overlapping Metal Bars */}
          <g filter="url(#shadow3d)" transform="rotate(-25 100 100)">
            <rect x="30" y="85" width="140" height="30" rx="15" fill="url(#metalPlate1)" stroke="#FEF08A" strokeWidth="2" />
            <circle cx="50" cy="100" r="7" fill="#020617" />
            <circle cx="150" cy="100" r="7" fill="#020617" />
          </g>
          <g filter="url(#shadow3d)" transform="rotate(35 100 100)">
            <rect x="30" y="85" width="140" height="30" rx="15" fill="url(#metalPlate2)" stroke="#BAE6FD" strokeWidth="2" />
            <circle cx="50" cy="100" r="7" fill="#020617" />
            <circle cx="150" cy="100" r="7" fill="#020617" />
          </g>
          {/* 3D Screw Bolts with Cross Slot */}
          <g transform="translate(100, 100)" filter="url(#shadow3d)">
            <circle cx="0" cy="0" r="14" fill="url(#screwHead)" stroke="#FCA5A5" strokeWidth="2" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g transform="translate(55, 60)" filter="url(#shadow3d)">
            <circle cx="0" cy="0" r="12" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'UNTANGLE':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgUntangle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1329" />
              <stop offset="50%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="glowPink" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#EC4899" floodOpacity="0.9" />
            </filter>
            <filter id="glowCyanNeon" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06B6D4" floodOpacity="0.9" />
            </filter>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgUntangle)" />
          {/* Constellation Laser Cords */}
          <line x1="45" y1="55" x2="155" y2="145" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" filter="url(#glowPink)" />
          <line x1="45" y1="145" x2="155" y2="55" stroke="#06B6D4" strokeWidth="4" strokeLinecap="round" filter="url(#glowCyanNeon)" />
          <line x1="100" y1="35" x2="100" y2="165" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <line x1="45" y1="55" x2="100" y2="35" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
          <line x1="155" y1="55" x2="100" y2="35" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
          {/* Glowing Peg Nodes */}
          {[
            { cx: 45, cy: 55, color: '#EC4899' },
            { cx: 155, cy: 55, color: '#06B6D4' },
            { cx: 100, cy: 35, color: '#10B981' },
            { cx: 45, cy: 145, color: '#06B6D4' },
            { cx: 155, cy: 145, color: '#EC4899' },
            { cx: 100, cy: 165, color: '#F59E0B' },
          ].map((peg, i) => (
            <g key={i} filter="url(#shadow3d)">
              <circle cx={peg.cx} cy={peg.cy} r="14" fill="#0F172A" stroke={peg.color} strokeWidth="3" />
              <circle cx={peg.cx} cy={peg.cy} r="6" fill={peg.color} />
              <circle cx={peg.cx - 2} cy={peg.cy - 2} r="2.5" fill="#FFFFFF" />
            </g>
          ))}
          {/* Sparkle Center */}
          <circle cx="100" cy="100" r="5" fill="#FEF08A" filter="url(#glowPink)" />
        </svg>
      );

    case 'PULLPIN':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgPullPin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1C1917" />
              <stop offset="60%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0C0A09" />
            </linearGradient>
            <linearGradient id="pinGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="lavaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="60%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgPullPin)" />
          {/* Castle Wall Bricks */}
          <rect x="35" y="25" width="130" height="150" rx="12" fill="#0C0A09" stroke="#78716C" strokeWidth="4" />
          {/* Water Chamber Top */}
          <rect x="45" y="35" width="50" height="40" rx="6" fill="url(#waterGrad)" opacity="0.85" />
          <text x="70" y="60" textAnchor="middle" fontSize="16">💧</text>
          {/* Lava Chamber Right */}
          <rect x="105" y="35" width="50" height="40" rx="6" fill="url(#lavaGrad)" opacity="0.85" />
          <text x="130" y="60" textAnchor="middle" fontSize="16">🔥</text>
          {/* Treasure Chamber Bottom */}
          <rect x="45" y="125" width="110" height="40" rx="6" fill="#451A03" opacity="0.9" />
          <text x="100" y="152" textAnchor="middle" fontSize="22">👑</text>
          {/* Golden Pull Pins */}
          <g filter="url(#shadow3d)">
            {/* Top Horizontal Pin */}
            <rect x="25" y="78" width="130" height="10" rx="5" fill="url(#pinGold)" stroke="#FEF08A" strokeWidth="1.5" />
            <circle cx="28" cy="83" r="9" fill="url(#pinGold)" stroke="#FFFBEB" strokeWidth="2" />
            {/* Bottom Vertical Pin */}
            <rect x="95" y="75" width="10" height="55" rx="5" fill="url(#pinGold)" stroke="#FEF08A" strokeWidth="1.5" />
            <circle cx="100" cy="72" r="8" fill="url(#pinGold)" stroke="#FFFBEB" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'JIGSAW':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgJigsaw" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
            <linearGradient id="p1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="p2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="p3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="p4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgJigsaw)" />
          {/* 4 Interlocking Puzzle Pieces */}
          <g filter="url(#shadow3d)">
            {/* Top-Left Piece */}
            <rect x="36" y="36" width="60" height="60" rx="8" fill="url(#p1Grad)" />
            <circle cx="96" cy="66" r="10" fill="url(#p1Grad)" />
            {/* Top-Right Piece */}
            <rect x="104" y="36" width="60" height="60" rx="8" fill="url(#p2Grad)" />
            <circle cx="134" cy="96" r="10" fill="url(#p2Grad)" />
            {/* Bottom-Left Piece */}
            <rect x="36" y="104" width="60" height="60" rx="8" fill="url(#p3Grad)" />
            <circle cx="66" cy="104" r="10" fill="#312E81" />
            {/* Bottom-Right Piece */}
            <rect x="104" y="104" width="60" height="60" rx="8" fill="url(#p4Grad)" />
            <circle cx="104" cy="134" r="10" fill="#312E81" />
          </g>
          {/* Sparkles & Star */}
          <circle cx="100" cy="100" r="14" fill="#FDE047" stroke="#FFF" strokeWidth="2" filter="url(#shadow3d)" />
          <text x="100" y="106" textAnchor="middle" fontSize="14" fontWeight="black" fill="#1E1B4B">✨</text>
        </svg>
      );

    case 'WATERSORT':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgWaterSort" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="60%" stopColor="#075985" />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>
            <linearGradient id="tubeLiq1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="tubeLiq2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="tubeLiq3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgWaterSort)" />
          {/* 3 Test Tubes */}
          <g filter="url(#shadow3d)">
            {/* Tube 1 */}
            <rect x="36" y="45" width="34" height="110" rx="17" fill="rgba(255,255,255,0.12)" stroke="#E0F2FE" strokeWidth="3" />
            <rect x="40" y="80" width="26" height="70" rx="13" fill="url(#tubeLiq1)" />
            {/* Tube 2 (Higher) */}
            <rect x="83" y="35" width="34" height="120" rx="17" fill="rgba(255,255,255,0.12)" stroke="#E0F2FE" strokeWidth="3" />
            <rect x="87" y="65" width="26" height="85" rx="13" fill="url(#tubeLiq2)" />
            {/* Tube 3 */}
            <rect x="130" y="45" width="34" height="110" rx="17" fill="rgba(255,255,255,0.12)" stroke="#E0F2FE" strokeWidth="3" />
            <rect x="134" y="90" width="26" height="60" rx="13" fill="url(#tubeLiq3)" />
          </g>
          {/* Liquid bubbles */}
          <circle cx="53" cy="95" r="3" fill="#FFF" opacity="0.6" />
          <circle cx="100" cy="85" r="4" fill="#FFF" opacity="0.7" />
          <circle cx="147" cy="110" r="3" fill="#FFF" opacity="0.6" />
        </svg>
      );

    case 'STACKTOWER':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgStack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgStack)" />
          {/* Stacked Blocks */}
          <g filter="url(#shadow3d)">
            <rect x="40" y="145" width="120" height="20" rx="4" fill="#EF4444" />
            <rect x="40" y="145" width="120" height="4" fill="rgba(255,255,255,0.4)" />
            <rect x="46" y="122" width="108" height="20" rx="4" fill="#F97316" />
            <rect x="46" y="122" width="108" height="4" fill="rgba(255,255,255,0.4)" />
            <rect x="52" y="99" width="96" height="20" rx="4" fill="#FBBF24" />
            <rect x="52" y="99" width="96" height="4" fill="rgba(255,255,255,0.4)" />
            <rect x="60" y="76" width="80" height="20" rx="4" fill="#10B981" />
            <rect x="60" y="76" width="80" height="4" fill="rgba(255,255,255,0.4)" />
            <rect x="70" y="53" width="60" height="20" rx="4" fill="#38BDF8" />
            <rect x="70" y="53" width="60" height="4" fill="rgba(255,255,255,0.4)" />
          </g>
          {/* Stars */}
          <text x="40" y="45" fontSize="14">✨</text>
          <text x="155" y="60" fontSize="12">⭐</text>
        </svg>
      );

    case 'PIPECONNECT':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgPipe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B132B" />
            </linearGradient>
            <linearGradient id="neonWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgPipe)" />
          {/* Interconnected Pipes */}
          <g filter="url(#shadow3d)">
            {/* Top-to-right pipe */}
            <path d="M40 30 V90 H100 V160 H160" stroke="#334155" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M40 30 V90 H100 V160 H160" stroke="url(#neonWater)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M40 30 V90 H100 V160 H160" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
            {/* Valves */}
            <circle cx="100" cy="90" r="14" fill="#F59E0B" stroke="#FFF" strokeWidth="3" />
            <circle cx="160" cy="160" r="10" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          </g>
          <text x="40" y="145" fontSize="24">💧</text>
        </svg>
      );

    case 'MERGEDROP':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgMerge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="60%" stopColor="#065F46" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgMerge)" />
          {/* Concentric / Merging Fruits */}
          <g filter="url(#shadow3d)">
            {/* Giant Watermelon */}
            <circle cx="100" cy="120" r="48" fill="#10B981" stroke="#047857" strokeWidth="3" />
            <circle cx="100" cy="120" r="42" fill="#EF4444" />
            <circle cx="90" cy="115" r="2.5" fill="#1E293B" />
            <circle cx="105" cy="110" r="2.5" fill="#1E293B" />
            <circle cx="100" cy="130" r="2.5" fill="#1E293B" />
            {/* Orange */}
            <circle cx="55" cy="65" r="24" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
            <text x="55" y="72" fontSize="20" textAnchor="middle">🍊</text>
            {/* Strawberry */}
            <circle cx="140" cy="60" r="18" fill="#F43F5E" stroke="#E11D48" strokeWidth="2" />
            <text x="140" y="66" fontSize="16" textAnchor="middle">🍓</text>
          </g>
          <text x="100" y="50" fontSize="16" textAnchor="middle">✨</text>
        </svg>
      );

    case 'WHACKAMOLE':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgWhack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451A03" />
              <stop offset="60%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#291204" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgWhack)" />
          {/* Mole Mound & Hammer */}
          <g filter="url(#shadow3d)">
            {/* Mound */}
            <ellipse cx="100" cy="145" rx="55" ry="20" fill="#292524" />
            <ellipse cx="100" cy="142" rx="45" ry="14" fill="#1C1917" />
            {/* Mole */}
            <circle cx="100" cy="115" r="28" fill="#A8A29E" stroke="#78716C" strokeWidth="2" />
            <circle cx="90" cy="110" r="4" fill="#0C0A09" />
            <circle cx="110" cy="110" r="4" fill="#0C0A09" />
            <ellipse cx="100" cy="120" rx="7" ry="5" fill="#F43F5E" />
            {/* Hammer */}
            <g transform="rotate(-30 145 65)">
              <rect x="140" y="60" width="12" height="65" rx="4" fill="#D97706" />
              <rect x="125" y="50" width="42" height="26" rx="6" fill="#78350F" stroke="#FDE047" strokeWidth="2" />
            </g>
          </g>
          <text x="50" y="70" fontSize="22">⭐</text>
        </svg>
      );

    case 'SCRATCH':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgScratch" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
            <linearGradient id="foilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgScratch)" />
          <rect x="28" y="42" width="144" height="116" rx="18" fill="#FFFBEB" stroke="#FDE047" strokeWidth="4" />
          <rect x="40" y="56" width="120" height="88" rx="12" fill="url(#foilGrad)" />
          <path d="M55 128 C72 95, 95 112, 118 76 C128 62, 140 86, 148 70" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="72" cy="86" r="10" fill="#FDE047" />
          <circle cx="132" cy="116" r="12" fill="#F59E0B" />
          <text x="100" y="108" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#7C2D12">🎁</text>
        </svg>
      );

    case 'LEARNING':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgLearning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="60%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgLearning)" />
          <rect x="38" y="48" width="124" height="104" rx="16" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="3" />
          <line x1="100" y1="54" x2="100" y2="146" stroke="#818CF8" strokeWidth="3" />
          <rect x="52" y="68" width="36" height="8" rx="4" fill="#4F46E5" />
          <rect x="52" y="86" width="32" height="6" rx="3" fill="#818CF8" />
          <rect x="52" y="100" width="38" height="6" rx="3" fill="#818CF8" />
          <circle cx="130" cy="96" r="20" fill="#F59E0B" stroke="#FEF08A" strokeWidth="3" />
          <text x="130" y="103" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#FFFFFF">?</text>
        </svg>
      );

    case 'GOLDMINER':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgMineEarth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="28%" stopColor="#78350F" />
              <stop offset="68%" stopColor="#451A03" />
              <stop offset="100%" stopColor="#1C0F06" />
            </linearGradient>
            <linearGradient id="nuggetGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="diamondGemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgMineEarth)" />
          {/* Wooden mine gantry top beam */}
          <rect x="0" y="0" width="200" height="44" rx="12" fill="#3B2314" />
          <rect x="16" y="34" width="168" height="12" rx="4" fill="#92400E" stroke="#451A03" strokeWidth="2" />
          {/* Winch pulley */}
          <circle cx="100" cy="40" r="14" fill="#64748B" stroke="#F59E0B" strokeWidth="3" />
          <circle cx="100" cy="40" r="5" fill="#FDE047" />
          {/* Cable & 2-prong claw */}
          <line x1="100" y1="54" x2="100" y2="104" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
          <path d="M100 104 L76 122 L82 140 M100 104 L124 122 L118 140" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="104" r="6" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
          {/* Faceted Golden Nugget in Claw */}
          <polygon points="78,128 96,116 118,122 126,144 106,162 80,152" fill="url(#nuggetGoldGrad)" stroke="#FEF08A" strokeWidth="3" />
          <polygon points="86,130 98,122 110,128 100,142" fill="#FFFBEB" fillOpacity="0.65" />
          {/* Sparkling Cyan Diamond on side */}
          <polygon points="154,126 168,136 162,152 146,152 140,136" fill="url(#diamondGemGrad)" stroke="#BAE6FD" strokeWidth="2" />
          <circle cx="44" cy="150" r="16" fill="#64748B" stroke="#334155" strokeWidth="2" />
          <circle cx="40" cy="146" r="5" fill="#94A3B8" />
          {/* Gleam star */}
          <path d="M132 82 L135 90 L143 93 L135 96 L132 104 L129 96 L121 93 L129 90 Z" fill="#FEF08A" />
        </svg>
      );

    case 'HELIX':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgHelixSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="cylGradArt" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <radialGradient id="orangeBallGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="40%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#C2410C" />
            </radialGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgHelixSky)" />
          {/* Central Cylinder Column */}
          <rect x="84" y="0" width="32" height="200" fill="url(#cylGradArt)" />
          {/* Top Platform Ring */}
          <ellipse cx="100" cy="55" rx="55" ry="18" fill="#15803D" />
          <ellipse cx="100" cy="50" rx="55" ry="18" fill="#22C55E" stroke="#4ADE80" strokeWidth="2.5" />
          <ellipse cx="100" cy="50" rx="16" ry="6" fill="#047857" />
          {/* Middle Platform Ring with Danger Slice & Gap */}
          <ellipse cx="100" cy="115" rx="55" ry="18" fill="#15803D" />
          <ellipse cx="100" cy="110" rx="55" ry="18" fill="#22C55E" stroke="#4ADE80" strokeWidth="2.5" />
          {/* Red Danger Slice on Middle Platform */}
          <path d="M125 102 C145 106 155 114 150 120 L116 112 Z" fill="#DC2626" stroke="#F87171" strokeWidth="2" />
          <ellipse cx="100" cy="110" rx="16" ry="6" fill="#047857" />
          {/* Bottom Platform Ring */}
          <ellipse cx="100" cy="170" rx="55" ry="18" fill="#15803D" />
          <ellipse cx="100" cy="165" rx="55" ry="18" fill="#22C55E" stroke="#4ADE80" strokeWidth="2.5" />
          <ellipse cx="100" cy="165" rx="16" ry="6" fill="#047857" />
          {/* Splat Mark on Top Platform */}
          <ellipse cx="94" cy="52" rx="12" ry="5" fill="#EA580C" fillOpacity="0.85" />
          {/* Juicy Bouncing Orange Ball with Glow */}
          <circle cx="100" cy="80" r="16" fill="url(#orangeBallGrad)" />
          <ellipse cx="96" cy="74" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.85" />
          {/* Bouncing Energy Particles */}
          <circle cx="92" cy="68" r="2.5" fill="#F97316" />
          <circle cx="108" cy="70" r="2" fill="#FDE047" />
          <circle cx="100" cy="62" r="3" fill="#FB923C" />
        </svg>
      );

    case 'PIGGY':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgFarmPasture" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="42%" stopColor="#BAE6FD" />
              <stop offset="42.1%" stopColor="#78350F" />
              <stop offset="70%" stopColor="#451A03" />
              <stop offset="70.1%" stopColor="#15803D" />
              <stop offset="100%" stopColor="#14532D" />
            </linearGradient>
            <radialGradient id="fatPigGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FBCFE8" />
              <stop offset="50%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </radialGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#bgFarmPasture)" />
          {/* Red Barn on Horizon */}
          <rect x="18" y="52" width="38" height="32" rx="3" fill="#DC2626" />
          <polygon points="15,52 37,36 59,52" fill="#991B1B" />
          <rect x="30" y="66" width="14" height="18" fill="#FEE2E2" />
          {/* Silo */}
          <rect x="60" y="44" width="14" height="40" rx="2" fill="#94A3B8" />
          {/* Running Pig */}
          <g transform="translate(112, 108)">
            {/* Legs */}
            <rect x="-18" y="10" width="5" height="12" rx="2" fill="#831843" />
            <rect x="-8" y="12" width="5" height="10" rx="2" fill="#831843" />
            <rect x="8" y="10" width="5" height="12" rx="2" fill="#831843" />
            <rect x="18" y="12" width="5" height="10" rx="2" fill="#831843" />
            {/* Body */}
            <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#fatPigGrad)" />
            {/* Ears */}
            <polygon points="-12,-16 -8,-24 -3,-14" fill="#FBCFE8" />
            <polygon points="6,-16 10,-24 15,-14" fill="#FBCFE8" />
            {/* Snout */}
            <ellipse cx="24" cy="2" rx="9" ry="7" fill="#FBCFE8" stroke="#DB2777" strokeWidth="1.5" />
            <circle cx="22" cy="1" r="1.5" fill="#831843" />
            <circle cx="26" cy="1" r="1.5" fill="#831843" />
            {/* Eye */}
            <circle cx="10" cy="-6" r="2.5" fill="#1E293B" />
            {/* Curly Tail */}
            <path d="M-28 -2 Q-36 -6 -32 -12" stroke="#DB2777" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          {/* Cowboy Character at Bottom */}
          <g transform="translate(56, 168)">
            {/* Boots */}
            <rect x="-8" y="8" width="6" height="10" rx="1.5" fill="#451A03" />
            <rect x="2" y="8" width="6" height="10" rx="1.5" fill="#451A03" />
            {/* Jeans */}
            <rect x="-7" y="-2" width="5" height="11" fill="#1E3A8A" />
            <rect x="2" y="-2" width="5" height="11" fill="#1E3A8A" />
            {/* Red Shirt */}
            <rect x="-8" y="-16" width="16" height="15" rx="2" fill="#DC2626" />
            {/* Head */}
            <circle cx="0" cy="-21" r="6.5" fill="#FDE68A" />
            {/* Cowboy Hat */}
            <ellipse cx="0" cy="-26" rx="14" ry="4" fill="#78350F" />
            <rect x="-6" y="-34" width="12" height="9" rx="2" fill="#78350F" />
          </g>
          {/* Flying Lasso Golden Rope */}
          <path d="M58 152 Q90 120 115 106" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="118" cy="104" rx="14" ry="9" transform="rotate(-15 118 104)" stroke="#F59E0B" strokeWidth="3" fill="none" />
          {/* Speech Bubble */}
          <rect x="105" y="66" width="76" height="22" rx="8" fill="#FFFFFF" fillOpacity="0.95" />
          <polygon points="120,88 126,88 122,94" fill="#FFFFFF" />
          <text x="143" y="81" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F172A">Bái bai! 👋</text>
        </svg>
      );

    case 'MINESWEEPER':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mineBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <radialGradient id="mineGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#DC2626" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mineIron" x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="40%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="flagPole" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <filter id="mineShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.7" />
            </filter>
          </defs>
          {/* Tactical Background with Radar Grid */}
          <rect width="200" height="200" rx="36" fill="url(#mineBg)" />
          <circle cx="100" cy="100" r="75" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.25" />
          <circle cx="100" cy="100" r="50" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
          <line x1="25" y1="100" x2="175" y2="100" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.2" />
          <line x1="100" y1="25" x2="100" y2="175" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.2" />
          {/* Corner Number Badges */}
          <rect x="24" y="24" width="34" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <text x="41" y="48" textAnchor="middle" fontSize="20" fontWeight="900" fill="#60A5FA">1</text>
          <rect x="142" y="24" width="34" height="34" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <text x="159" y="48" textAnchor="middle" fontSize="20" fontWeight="900" fill="#4ADE80">2</text>
          {/* Danger Mine Radial Glow */}
          <circle cx="100" cy="105" r="70" fill="url(#mineGlow)" />
          {/* Spikes of 3D Naval Mine */}
          <g filter="url(#mineShadow)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => {
              const rad = (ang * Math.PI) / 180;
              const x1 = 100 + Math.cos(rad) * 35;
              const y1 = 105 + Math.sin(rad) * 35;
              const x2 = 100 + Math.cos(rad) * 48;
              const y2 = 105 + Math.sin(rad) * 48;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="6" strokeLinecap="round" />
                  <circle cx={x2} cy={y2} r="4.5" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
                </g>
              );
            })}
            {/* Center Iron Body */}
            <circle cx="100" cy="105" r="38" fill="url(#mineIron)" stroke="#94A3B8" strokeWidth="2.5" />
            <circle cx="92" cy="94" r="12" fill="#FFFFFF" fillOpacity="0.12" />
            {/* Blinking Red Danger LED Core */}
            <circle cx="100" cy="105" r="10" fill="#EF4444" stroke="#FCA5A5" strokeWidth="2" />
            <circle cx="98" cy="103" r="3" fill="#FFFFFF" />
          </g>
          {/* Red Flag on Gold Brass Pole */}
          <g filter="url(#mineShadow)">
            <line x1="62" y1="120" x2="62" y2="175" stroke="url(#flagPole)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="62" cy="120" r="4" fill="#FDE047" />
            <path d="M62 122 L102 135 L62 148 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
          </g>
        </svg>
      );

    case 'SUDOKU':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sudokuBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <radialGradient id="sudokuGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#0284C7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tileGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="tileGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Blueprint Deep Navy Background */}
          <rect width="200" height="200" rx="36" fill="url(#sudokuBg)" />
          {/* Intellect Radial Glow */}
          <circle cx="100" cy="100" r="85" fill="url(#sudokuGlow)" />
          {/* Luminous 3x3 Blueprint Grid */}
          <rect x="28" y="28" width="144" height="144" rx="14" fill="#0B132B" fillOpacity="0.8" stroke="#38BDF8" strokeWidth="2.5" />
          {/* Inner Grid Lines */}
          <line x1="76" y1="28" x2="76" y2="172" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="124" y1="28" x2="124" y2="172" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="28" y1="76" x2="172" y2="76" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="28" y1="124" x2="172" y2="124" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.8" />
          {/* Secondary Subgrid Dots/Lines */}
          <line x1="44" y1="28" x2="44" y2="172" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="60" y1="28" x2="60" y2="172" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="28" y1="44" x2="172" y2="44" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="28" y1="60" x2="172" y2="60" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
          {/* 3D Acrylic Floating Number Tiles */}
          {/* Tile 9 (Top Left Box) */}
          <g filter="url(#tileShadow)">
            <rect x="36" y="36" width="32" height="32" rx="8" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
            <text x="52" y="60" textAnchor="middle" fontSize="22" fontWeight="900" fill="#93C5FD">9</text>
          </g>
          {/* Tile 7 (Top Right Box) */}
          <g filter="url(#tileShadow)">
            <rect x="132" y="36" width="32" height="32" rx="8" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
            <text x="148" y="60" textAnchor="middle" fontSize="22" fontWeight="900" fill="#93C5FD">7</text>
          </g>
          {/* Central Highlighted Gold Tile: 5 */}
          <g filter="url(#tileShadow)">
            <rect x="80" y="80" width="40" height="40" rx="10" fill="url(#tileGold)" stroke="#FFFBEB" strokeWidth="2" />
            <text x="100" y="109" textAnchor="middle" fontSize="26" fontWeight="900" fill="#451A03">5</text>
          </g>
          {/* Tile 3 (Bottom Left Box) */}
          <g filter="url(#tileShadow)">
            <rect x="36" y="132" width="32" height="32" rx="8" fill="url(#tileGlass)" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="52" y="156" textAnchor="middle" fontSize="22" fontWeight="900" fill="#FFFFFF">3</text>
          </g>
          {/* Tile 1 (Bottom Right Box) */}
          <g filter="url(#tileShadow)">
            <rect x="132" y="132" width="32" height="32" rx="8" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
            <text x="148" y="156" textAnchor="middle" fontSize="22" fontWeight="900" fill="#93C5FD">1</text>
          </g>
          {/* Glowing Golden Intellect Star Sparkles */}
          <path d="M165 95 L168 102 L175 105 L168 108 L165 115 L162 108 L155 105 L162 102 Z" fill="#FDE047" />
          <path d="M35 100 L37 105 L42 107 L37 109 L35 114 L33 109 L28 107 L33 105 Z" fill="#FDE047" />
        </svg>
      );

    default:
      return null;
  }
};
