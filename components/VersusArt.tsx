

import React, { useRef, useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeamInfo } from '../types';

interface VersusArtProps {
  teamA: TeamInfo;
  teamB: TeamInfo;
}

interface StyleComponentProps {
    teamA: TeamInfo;
    teamB: TeamInfo;
    logoA: string | null;
    logoB: string | null;
    width: number;
    height: number;
}

// --- Style 1: Dynamic Duo ---
const DynamicDuoArt: React.FC<StyleComponentProps> = ({ teamA, teamB, logoA, logoB, width, height }) => {
    const isVertical = height > width;
    const idA = `gradA-${React.useId()}`;
    const idB = `gradB-${React.useId()}`;
    const filterId = `glow-filter-${React.useId()}`;
    const shadowId = `shadow-filter-${React.useId()}`;
    const logoSize = isVertical ? width * 0.35 : height * 0.45;
    const logoStroke = logoSize * 0.05;
    
    const teamAPos = { x: isVertical ? width / 2 : width * 0.25, y: isVertical ? height * 0.25 : height / 2 };
    const teamBPos = { x: isVertical ? width / 2 : width * 0.75, y: isVertical ? height * 0.75 : height / 2 };
    const vsPos = { x: width / 2, y: height / 2 };

    return (
        <g>
            <defs>
                <linearGradient id={idA} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={teamA.color} />
                    <stop offset="100%" stopColor={teamA.color2} />
                </linearGradient>
                <linearGradient id={idB} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={teamB.color} />
                    <stop offset="100%" stopColor={teamB.color2} />
                </linearGradient>
                <filter id={filterId}>
                    <feGaussianBlur stdDeviation="10" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                 <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="8" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
                </filter>
            </defs>
            {/* Background with more depth */}
            <rect x="0" y="0" width={width} height={height} fill="#1a1a1a" />
            <path d={`M0,0 L${width},0 L0,${height} Z`} fill={`url(#${idA})`} opacity="0.8" />
            <path d={`M${width},0 L${width},${height} L0,${height} Z`} fill={`url(#${idB})`} opacity="0.8"/>

            {/* Central divider */}
            <path d={`M${width*0.5 - 2},0 L${width*0.5 - 50},${height} L${width*0.5 - 80},${height} L${width*0.5 + 2},0 Z`} fill="rgba(0,0,0,0.4)" />
            <path d={`M${width*0.5},0 L${width*0.5 + 50},${height} L${width*0.5 + 80},${height} L${width*0.5 + 20},0 Z`} fill="rgba(255,255,255,0.3)" />

            {/* Logos with shadows */}
            <g transform={`translate(${teamAPos.x}, ${teamAPos.y})`} filter={`url(#${shadowId})`}>
                {logoA && <image href={logoA} x={-logoSize/2} y={-logoSize/2} width={logoSize} height={logoSize} />}
                <circle cx="0" cy="0" r={logoSize/2} fill="none" stroke={teamA.color} strokeWidth={logoStroke} filter={`url(#${filterId})`} />
            </g>
            <g transform={`translate(${teamBPos.x}, ${teamBPos.y})`} filter={`url(#${shadowId})`}>
                {logoB && <image href={logoB} x={-logoSize/2} y={-logoSize/2} width={logoSize} height={logoSize} />}
                <circle cx="0" cy="0" r={logoSize/2} fill="none" stroke={teamB.color} strokeWidth={logoStroke} filter={`url(#${filterId})`} />
            </g>

            {/* VS text with better styling */}
             <g style={{ filter: `url(#${shadowId})`}}>
                 <text x={vsPos.x} y={vsPos.y + (logoSize*0.1)} fontFamily="'Exo 2', sans-serif" fontSize={logoSize * 1.2} fontWeight="900" fill="#fff" textAnchor="middle" stroke="#000" strokeWidth="12" strokeLinejoin="round" paintOrder="stroke" style={{textShadow: "0 0 20px #fff"}}>VS</text>
             </g>
            {/* Team names with shadows */}
            <text x={teamAPos.x} y={teamAPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#e5e7eb" textAnchor="middle" style={{textShadow: "2px 2px 4px #000"}}>{teamA.name}</text>
            <text x={teamBPos.x} y={teamBPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#e5e7eb" textAnchor="middle" style={{textShadow: "2px 2px 4px #000"}}>{teamB.name}</text>
        </g>
    );
};


// --- Style 2: Cosmic Clash ---
const CosmicClashArt: React.FC<StyleComponentProps> = ({ teamA, teamB, logoA, logoB, width, height }) => {
    const isVertical = height > width;
    const glowAId = `glowA-${React.useId()}`;
    const glowBId = `glowB-${React.useId()}`;
    const shadowId = `shadow-filter-${React.useId()}`;
    const gradAId = `gradA-${React.useId()}`;
    const gradBId = `gradB-${React.useId()}`;
    const logoSize = isVertical ? width * 0.45 : height * 0.5;

    const teamAPos = { x: isVertical ? width / 2 : width * 0.25, y: isVertical ? height * 0.25 : height / 2 };
    const teamBPos = { x: isVertical ? width / 2 : width * 0.75, y: isVertical ? height * 0.75 : height / 2 };

    return (
        <g>
            <defs>
                <filter id={glowAId} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
                </filter>
                 <filter id={glowBId} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
                </filter>
                <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.7" />
                </filter>
                 <radialGradient id={gradAId}>
                    <stop offset="0%" stopColor={teamA.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={teamA.color} stopOpacity="0" />
                </radialGradient>
                 <radialGradient id={gradBId}>
                    <stop offset="0%" stopColor={teamB.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={teamB.color} stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width={width} height={height} fill="#0c0a09" />
             {/* Stars - more layers */}
            {[...Array(150)].map((_, i) => (
                <circle key={`s1-${i}`} cx={Math.random() * width} cy={Math.random() * height} r={Math.random() * 0.8} fill="#fff" opacity={Math.random() * 0.6 + 0.1} />
            ))}
             {[...Array(50)].map((_, i) => (
                <circle key={`s2-${i}`} cx={Math.random() * width} cy={Math.random() * height} r={Math.random() * 1.2 + 0.5} fill="#fff" opacity={Math.random() * 0.4 + 0.5} />
            ))}

            {/* Nebulas */}
            <g opacity="0.5">
                <ellipse cx={teamAPos.x} cy={teamAPos.y} rx={logoSize * 2} ry={logoSize * 1.2} fill={`url(#${gradAId})`} filter={`url(#${glowAId})`} />
                <ellipse cx={teamBPos.x} cy={teamBPos.y} rx={logoSize * 2} ry={logoSize * 1.2} fill={`url(#${gradBId})`} filter={`url(#${glowBId})`} />
            </g>
            
            {/* Logos with shadows */}
             <g filter={`url(#${shadowId})`}>
                 {logoA && <image href={logoA} x={teamAPos.x - logoSize / 2} y={teamAPos.y - logoSize / 2} width={logoSize} height={logoSize} />}
                {logoB && <image href={logoB} x={teamBPos.x - logoSize / 2} y={teamBPos.y - logoSize / 2} width={logoSize} height={logoSize} />}
             </g>
            
            {/* VS Text with inner/outer glow */}
            <text x={width/2} y={height/2 + (logoSize*0.1)} fontFamily="'Exo 2', sans-serif" fontSize={logoSize * 1.5} fontWeight="900" fill="#fff" textAnchor="middle" style={{ textShadow: "0 0 15px #fff, 0 0 35px #fff, 0 0 50px #0ff" }}>VS</text>

            <text x={teamAPos.x} y={teamAPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#e5e7eb" textAnchor="middle" style={{textShadow: "2px 2px 5px #000"}}>{teamA.name}</text>
            <text x={teamBPos.x} y={teamBPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#e5e7eb" textAnchor="middle" style={{textShadow: "2px 2px 5px #000"}}>{teamB.name}</text>
        </g>
    );
};

// --- Style 3: Ink Splatter ---
const InkSplatterArt: React.FC<StyleComponentProps> = ({ teamA, teamB, logoA, logoB, width, height }) => {
    const isVertical = height > width;
    const logoSize = isVertical ? width * 0.5 : height * 0.5;

    const teamAPos = { x: isVertical ? width / 2 : width * 0.28, y: isVertical ? height * 0.28 : height / 2 };
    const teamBPos = { x: isVertical ? width / 2 : width * 0.72, y: isVertical ? height * 0.72 : height / 2 };
    
    return (
        <g>
            <rect width={width} height={height} fill="#e2e8f0" />
            <g transform={`translate(${teamAPos.x} ${teamAPos.y}) scale(${logoSize/100})`}>
                <path d="M50 0 C-20 20, -20 80, 50 100 C120 80, 120 20, 50 0" fill={teamA.color} opacity="0.8" transform={isVertical ? "rotate(80)" : "rotate(30)"} />
                <path d="M40 10 C-10 30, 0 70, 40 90 C100 70, 110 30, 40 10" fill={teamA.color2} opacity="0.7" transform={isVertical ? "rotate(75) scale(0.8)" : "rotate(-15) scale(0.8)"} />
            </g>
             <g transform={`translate(${teamBPos.x} ${teamBPos.y}) scale(${logoSize/100})`}>
                <path d="M50 0 C-20 20, -20 80, 50 100 C120 80, 120 20, 50 0" fill={teamB.color} opacity="0.8" transform={isVertical ? "rotate(-100) scale(1.1)" : "rotate(-60) scale(1.1)"} />
                <path d="M40 10 C-10 30, 0 70, 40 90 C100 70, 110 30, 40 10" fill={teamB.color2} opacity="0.7" transform={isVertical ? "rotate(-85) scale(0.9)" : "rotate(25) scale(0.9)"} />
            </g>

            <text x={width/2} y={height/2 + (logoSize*0.1)} fontFamily="'Exo 2', sans-serif" fontSize={logoSize} fontWeight="900" fill="#1e293b" textAnchor="middle">VS</text>

            {logoA && <image href={logoA} x={teamAPos.x - logoSize / 2} y={teamAPos.y - logoSize / 2} width={logoSize} height={logoSize} />}
            {logoB && <image href={logoB} x={teamBPos.x - logoSize / 2} y={teamBPos.y - logoSize / 2} width={logoSize} height={logoSize} />}
            
            <text x={teamAPos.x} y={teamAPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.18} fontWeight="800" fill="#1e293b" textAnchor="middle">{teamA.name}</text>
            <text x={teamBPos.x} y={teamBPos.y + logoSize*0.7} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.18} fontWeight="800" fill="#1e293b" textAnchor="middle">{teamB.name}</text>
        </g>
    );
};

// --- Style 4: Retro Arcade ---
const RetroArcadeArt: React.FC<StyleComponentProps> = ({ teamA, teamB, logoA, logoB, width, height }) => {
    const isVertical = height > width;
    const boxWidth = isVertical ? width * 0.8 : width * 0.4;
    const boxHeight = isVertical ? height * 0.35 : height * 0.7;
    const logoSize = Math.min(boxWidth, boxHeight) * 0.6;
    
    const teamAPos = { x: isVertical ? width/2 : width * 0.25, y: isVertical ? height * 0.3 : height / 2 };
    const teamBPos = { x: isVertical ? width/2 : width * 0.75, y: isVertical ? height * 0.7 : height / 2 };

    return (
        <g>
            <rect width={width} height={height} fill="#111827" />
            <defs>
                <pattern id={`grid-${React.useId()}`} width={isVertical ? 20 : 40} height={isVertical ? 20 : 40} patternUnits="userSpaceOnUse">
                    <path d={`M ${isVertical ? 20 : 40} 0 L 0 0 0 ${isVertical ? 20 : 40}`} fill="none" stroke="rgba(0, 255, 255, 0.1)" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#grid-${React.useId()})`} />

            <g transform={`translate(${teamAPos.x}, ${teamAPos.y})`}>
                <rect x={-boxWidth/2} y={-boxHeight/2} width={boxWidth} height={boxHeight} fill="rgba(0,0,0,0.3)" stroke={teamA.color} strokeWidth="4" rx="10" />
                {logoA && <image href={logoA} x={-logoSize/2} y={-logoSize/2-boxHeight*0.1} width={logoSize} height={logoSize} style={{ imageRendering: 'pixelated' }}/>}
                <text x="0" y={boxHeight*0.3} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.25} fontWeight="800" fill={teamA.color} textAnchor="middle">{teamA.name}</text>
            </g>
            <g transform={`translate(${teamBPos.x}, ${teamBPos.y})`}>
                <rect x={-boxWidth/2} y={-boxHeight/2} width={boxWidth} height={boxHeight} fill="rgba(0,0,0,0.3)" stroke={teamB.color} strokeWidth="4" rx="10" />
                {logoB && <image href={logoB} x={-logoSize/2} y={-logoSize/2-boxHeight*0.1} width={logoSize} height={logoSize} style={{ imageRendering: 'pixelated' }}/>}
                <text x="0" y={boxHeight*0.3} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.25} fontWeight="800" fill={teamB.color} textAnchor="middle">{teamB.name}</text>
            </g>

            <text x={width/2} y={height/2 + (logoSize*0.1)} fontFamily="'Exo 2', sans-serif" fontSize={logoSize * 1.3} fontWeight="900" fill="#facc15" textAnchor="middle" stroke="#000" strokeWidth="6" paintOrder="stroke" style={{textShadow: `0 0 10px #f59e0b`}}>VS</text>
        </g>
    );
};

// --- Style 5: Halftone Hero ---
const HalftoneHeroArt: React.FC<StyleComponentProps> = ({ teamA, teamB, logoA, logoB, width, height }) => {
    const isVertical = height > width;
    const idA = `patternA-${React.useId()}`;
    const idB = `patternB-${React.useId()}`;
    const logoSize = isVertical ? width * 0.6 : height * 0.6;
    
    const teamAPos = { x: isVertical ? width / 2 : width * 0.25, y: isVertical ? height * 0.25 : height / 2 };
    const teamBPos = { x: isVertical ? width / 2 : width * 0.75, y: isVertical ? height * 0.75 : height / 2 };
    
    const rayLength = Math.hypot(width, height) / 2;
    const rayWidth = rayLength * 0.05;

    return (
        <g>
            <defs>
                <pattern id={idA} patternUnits="userSpaceOnUse" width="8" height="8">
                    <circle cx="4" cy="4" r="2" fill={teamA.color} />
                </pattern>
                 <pattern id={idB} patternUnits="userSpaceOnUse" width="8" height="8">
                    <circle cx="4" cy="4" r="2" fill={teamB.color} />
                </pattern>
            </defs>
            <rect width={width} height={height} fill="#fef08a" />
            <g transform={`translate(${width/2}, ${height/2})`}>
                {[...Array(12)].map((_, i) => (
                    <path key={i} d={`M0,0 L${rayLength},-${rayWidth} L${rayLength},${rayWidth} Z`} fill={i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.1)'} transform={`rotate(${i * 30})`}/>
                ))}
            </g>

            <g transform={`translate(${teamAPos.x}, ${teamAPos.y})`}>
                <circle cx="0" cy="0" r={logoSize/2 + 20} fill={`url(#${idA})`} />
                {logoA && <image href={logoA} x={-logoSize/2} y={-logoSize/2} width={logoSize} height={logoSize} />}
                 <text x="0" y={logoSize*0.65} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#fff" textAnchor="middle" stroke="#000" strokeWidth="4" paintOrder="stroke">{teamA.name}</text>
            </g>
            <g transform={`translate(${teamBPos.x}, ${teamBPos.y})`}>
                <circle cx="0" cy="0" r={logoSize/2 + 20} fill={`url(#${idB})`} />
                {logoB && <image href={logoB} x={-logoSize/2} y={-logoSize/2} width={logoSize} height={logoSize} />}
                <text x="0" y={logoSize*0.65} fontFamily="'Exo 2', sans-serif" fontSize={logoSize*0.2} fontWeight="800" fill="#fff" textAnchor="middle" stroke="#000" strokeWidth="4" paintOrder="stroke">{teamB.name}</text>
            </g>
            <text x={width/2} y={height/2 + (logoSize*0.15)} fontFamily="'Exo 2', sans-serif" fontSize={logoSize * 1.5} fontWeight="900" fill="#ef4444" textAnchor="middle" stroke="#fff" strokeWidth="12" strokeLinejoin="round" paintOrder="stroke">
                <tspan stroke="#000" strokeWidth="20">VS</tspan>
            </text>
        </g>
    );
};


const artStyles: Record<string, { name: string; component: React.FC<StyleComponentProps> }> = {
  dynamicDuo: { name: 'Duo Dinâmico', component: DynamicDuoArt },
  cosmicClash: { name: 'Confronto Cósmico', component: CosmicClashArt },
  inkSplatter: { name: 'Tinta de Pincel', component: InkSplatterArt },
  retroArcade: { name: 'Fliperama Retrô', component: RetroArcadeArt },
  halftoneHero: { name: 'Herói de Quadrinhos', component: HalftoneHeroArt },
};

const VersusArt: React.FC<VersusArtProps> = ({ teamA, teamB }) => {
  const [logoADataUrl, setLogoADataUrl] = useState<string | null>(null);
  const [logoBDataUrl, setLogoBDataUrl] = useState<string | null>(null);
  const [fontCss, setFontCss] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('dynamicDuo');

  useEffect(() => {
    const convertImgToDataUrl = async (url: string): Promise<string | null> => {
        // If the URL is not a standard http/https link, or it's already a data URL, pass it through.
        if (!url || !url.startsWith('http')) {
            return url;
        }

        try {
            // Attempt to fetch the image directly without a CORS proxy.
            // This will work if the image server has CORS enabled.
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Convert the blob to a data URL to embed in the SVG.
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            // If the fetch fails (likely due to a CORS error), log the issue and return null.
            // The component will gracefully handle the missing logo.
            console.warn(`Could not convert ${url} to data URL. This is likely a CORS issue. The image server for this logo may not allow direct access.`, error);
            return null;
        }
    };
    
    const loadFont = async (): Promise<string> => {
        try {
            const cssResponse = await fetch("https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800;900&display=swap");
            const cssText = await cssResponse.text();
            const fontUrlMatch = cssText.match(/url\((https:\/\/[^)]+\.woff2)\)/);
            if (!fontUrlMatch) return '';

            const fontResponse = await fetch(fontUrlMatch[1]);
            const fontBlob = await fontResponse.blob();
            const fontDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(fontBlob);
            });
            return `@font-face { font-family: 'Exo 2'; font-style: normal; font-weight: 700 900; src: url(${fontDataUrl}) format('woff2'); }`;
        } catch (error) {
            console.error("Failed to fetch and embed font:", error);
            return ''; // Return empty on failure
        }
    };

    const loadAssets = async () => {
        setIsLoading(true);
        try {
            const [aUrl, bUrl, css] = await Promise.all([
                convertImgToDataUrl(teamA.logo),
                convertImgToDataUrl(teamB.logo),
                loadFont()
            ]);
            setLogoADataUrl(aUrl);
            setLogoBDataUrl(bUrl);
            setFontCss(css);
        } catch (error) {
            console.error("Error loading assets for versus art:", error);
            setFontCss('');
        } finally {
            setIsLoading(false);
        }
    };

    loadAssets();
  }, [teamA.logo, teamB.logo]);

  const downloadImage = (format: 'png' | 'jpeg', aspectRatio: '16:9' | '9:16') => {
    if (isLoading || fontCss === null) return;
    
    const is169 = aspectRatio === '16:9';
    const width = is169 ? 1600 : 900;
    const height = is169 ? 900 : 1600;

    const ArtComponent = artStyles[selectedStyle].component;

    const SvgComponent = () => (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
            <style type="text/css">
                {fontCss}
            </style>
        </defs>
        <ArtComponent teamA={teamA} teamB={teamB} logoA={logoADataUrl} logoB={logoBDataUrl} width={width} height={height} />
      </svg>
    );

    const svgString = renderToStaticMarkup(<SvgComponent />);
    
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.scale(scale, scale);

      if (format === 'jpeg') {
        const bgFill = artStyles[selectedStyle].component === InkSplatterArt ? '#e2e8f0' : '#1a202c';
        ctx.fillStyle = bgFill;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.92 : 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${teamA.name}_vs_${teamB.name}_${selectedStyle}_${aspectRatio.replace(':', 'x')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.onerror = (err) => {
        console.error("Failed to load SVG image for canvas rendering", err);
        URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const ArtComponent = artStyles[selectedStyle].component;

  const renderContent = () => {
    if (isLoading || fontCss === null) {
        return <div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div></div>;
    }

    return (
        <svg width="100%" height="100%" viewBox="0 0 1600 900" className="overflow-visible bg-[#1a202c] rounded-lg">
            <ArtComponent teamA={teamA} teamB={teamB} logoA={logoADataUrl} logoB={logoBDataUrl} width={1600} height={900} />
        </svg>
    );
  };

  const buttonClass = (isActive: boolean) =>
    `px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm font-bold rounded-full transition-all duration-200 transform hover:scale-105 ${
      isActive ? 'bg-cyan-500 text-white shadow-lg ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
    }`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 my-4 animate-fade-in w-full max-w-2xl">
        <div className="w-full p-2 bg-gray-900/50 rounded-xl">
             <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(artStyles).map(([key, { name }]) => (
                    <button key={key} onClick={() => setSelectedStyle(key)} className={buttonClass(selectedStyle === key)}>{name}</button>
                ))}
            </div>
        </div>
        <div className="relative w-full group" style={{aspectRatio: '16 / 9'}}>
            {renderContent()}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 z-10">
            <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-xl">
                 <span className="font-semibold text-cyan-300">PNG:</span>
                 <button onClick={() => downloadImage('png', '16:9')} disabled={isLoading} className="btn-ripple px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-md">16:9</button>
                 <button onClick={() => downloadImage('png', '9:16')} disabled={isLoading} className="btn-ripple px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-md">9:16</button>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-xl">
                 <span className="font-semibold text-purple-300">JPG:</span>
                 <button onClick={() => downloadImage('jpeg', '16:9')} disabled={isLoading} className="btn-ripple px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md">16:9</button>
                 <button onClick={() => downloadImage('jpeg', '9:16')} disabled={isLoading} className="btn-ripple px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md">9:16</button>
            </div>
        </div>
         <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default VersusArt;
