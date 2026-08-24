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

    default:
      return null;
  }
};
