
import React from 'react';
import { Score, GamePhase, TeamInfo, Team, MatchLayout } from '../types';
import { HALF_TIME_SECONDS } from '../constants';

interface ScoreboardProps {
  score: Score;
  gameTime: number;
  gamePhase: GamePhase;
  stoppageTime: number;
  teamA: TeamInfo;
  teamB: TeamInfo;
  layout: MatchLayout;
  scoreboardScale: number;
  frenzyTeam: Team | null;
}

const formatTime = (totalSeconds: number, gamePhase: GamePhase, stoppageTime: number): string => {
  let displaySeconds = totalSeconds;
  
  if (gamePhase === 'FIRST_HALF_STOPPAGE') {
    displaySeconds = HALF_TIME_SECONDS;
  } else if (gamePhase === 'SECOND_HALF_STOPPAGE') {
    displaySeconds = HALF_TIME_SECONDS * 2;
  } else if (gamePhase === 'FULL_TIME' && totalSeconds > HALF_TIME_SECONDS * 2) {
    // Show final time correctly if it went into stoppage
    displaySeconds = totalSeconds;
  }
  
  if (displaySeconds > HALF_TIME_SECONDS * 2) displaySeconds = HALF_TIME_SECONDS * 2;
  
  const minutes = Math.floor(displaySeconds / 60).toString().padStart(2, '0');
  const seconds = (displaySeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatStoppageTime = (gameTime: number, gamePhase: GamePhase): string => {
    let elapsedStoppage = 0;
    if (gamePhase === 'FIRST_HALF_STOPPAGE') {
        elapsedStoppage = gameTime - HALF_TIME_SECONDS;
    } else if (gamePhase === 'SECOND_HALF_STOPPAGE') {
        elapsedStoppage = gameTime - (HALF_TIME_SECONDS * 2);
    }

    if (elapsedStoppage <= 0) return '';
    
    const minutes = Math.floor(elapsedStoppage / 60).toString().padStart(2, '0');
    const seconds = (elapsedStoppage % 60).toString().padStart(2, '0');
    return `+${minutes}:${seconds}`;
};

const getHalfText = (gamePhase: GamePhase): string => {
    switch (gamePhase) {
        case 'PRE_GAME': return 'Pré-Jogo';
        case 'COUNTDOWN': return 'Começando...';
        case 'FIRST_HALF': return '1º Tempo';
        case 'FIRST_HALF_STOPPAGE': return '1º Tempo + Acréscimos';
        case 'HALF_TIME': return 'Intervalo';
        case 'SECOND_HALF': return '2º Tempo';
        case 'SECOND_HALF_STOPPAGE': return '2º Tempo + Acréscimos';
        case 'FULL_TIME': return 'Fim de Jogo';
        default: return '';
    }
}

const TeamDisplay: React.FC<{team: TeamInfo, score: number, alignment: 'left' | 'right', layout: MatchLayout, scale: number, isFrenzy: boolean}> = ({ team, score, alignment, layout, scale, isFrenzy }) => {
    const isRight = alignment === 'right';
    const nameColor = team.color === '#000000' || team.color === '#FFFFFF' ? '#e5e7eb' : team.color;
    
    // Base sizes
    const baseLogoSize = 40;
    const baseScoreBoxSize = 56;
    const baseTeamNameSize = 18;
    const baseGap = 12;

    // Scaled sizes
    const logoSize = baseLogoSize * scale;
    const scoreBoxSize = baseScoreBoxSize * scale;
    const teamNameSize = baseTeamNameSize * scale;
    const gap = baseGap * scale;

    if (layout === 'vertical') {
        return (
             <div className="flex items-center w-full" style={{ gap: `${gap}px` }}>
                <img src={team.logo} alt={`${team.name} Logo`} className="bg-white rounded-full object-contain flex-shrink-0" style={{filter: `drop-shadow(0 0 10px ${team.color})`, width: `${logoSize}px`, height: `${logoSize}px`, padding: `${2 * scale}px`}}/>
                <div className="flex-1 min-w-0">
                    <span className="font-bold uppercase tracking-wider truncate font-display" style={{ color: nameColor, textShadow: '1px 1px 3px rgba(0,0,0,0.5)', fontSize: `${teamNameSize}px` }}>{team.name}</span>
                    {isFrenzy && <span className="text-xs font-bold text-orange-400 animate-pulse block">🔥 FRENESI 🔥</span>}
                </div>
                <div 
                    className="font-display font-bold text-white flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                        backgroundColor: team.color,
                        textShadow: '0 0 10px rgba(0,0,0,0.7)',
                        boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 8px ${team.color}`,
                        width: `${scoreBoxSize}px`,
                        height: `${scoreBoxSize}px`,
                        fontSize: `${36 * scale}px`,
                    }}
                >
                    {score}
                </div>
            </div>
        );
    }

    // Scaled sizes for horizontal
    const hLogoSize = 56 * scale;
    const hScoreBoxWidth = 80 * scale;
    const hScoreBoxHeight = 64 * scale;
    const hTeamNameSize = 24 * scale;
    const hGap = 16 * scale;

    return (
        <div className={`flex items-center flex-1 min-w-0 ${isRight ? 'flex-row-reverse' : ''}`} style={{ gap: `${hGap}px` }}>
             <div 
                className="font-display font-bold text-white flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                    backgroundColor: team.color,
                    textShadow: '0 0 10px rgba(0,0,0,0.7)',
                    boxShadow: `inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px ${team.color}`,
                    width: `${hScoreBoxWidth}px`,
                    height: `${hScoreBoxHeight}px`,
                    fontSize: `${56 * scale}px`
                }}
            >
                {score}
            </div>
            <div className={`flex flex-col flex-1 min-w-0 ${isRight ? 'items-end' : 'items-start'}`}>
                <span className="font-bold uppercase tracking-wider truncate font-display" style={{ color: nameColor, textShadow: '1px 1px 3px rgba(0,0,0,0.5)', fontSize: `${hTeamNameSize}px` }}>{team.name}</span>
                {isFrenzy && <span className="text-sm font-bold text-orange-400 animate-pulse">🔥 FRENESI 🔥</span>}
            </div>
            <img src={team.logo} alt={`${team.name} Logo`} className="bg-white rounded-full object-contain flex-shrink-0" style={{filter: `drop-shadow(0 0 10px ${team.color})`, width: `${hLogoSize}px`, height: `${hLogoSize}px`, padding: `${4*scale}px`}}/>
        </div>
    )
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ score, gameTime, gamePhase, stoppageTime, teamA, teamB, layout, scoreboardScale, frenzyTeam }) => {
  const isVertical = layout === 'vertical';
  const stoppageTimeText = formatStoppageTime(gameTime, gamePhase);

  // Base sizes
  const basePadding = 16;
  const baseGap = 8;
  const baseMainTimeSize = isVertical ? 56 : 64;
  const baseStoppageTimeSize = isVertical ? 24 : 28;
  const baseHalfTextSize = isVertical ? 16 : 18;

  // Scaled sizes
  const padding = basePadding * scoreboardScale;
  const gap = baseGap * scoreboardScale;
  const mainTimeSize = baseMainTimeSize * scoreboardScale;
  const stoppageTimeSize = baseStoppageTimeSize * scoreboardScale;
  const halfTextSize = baseHalfTextSize * scoreboardScale;

  return (
    <div className={`bg-[#1f1f1f]/70 rounded-xl mb-2 shadow-2xl w-full ${isVertical ? 'max-w-md' : 'max-w-4xl'} border-2 border-cyan-400/30 backdrop-blur-sm relative overflow-hidden flex flex-col items-center`} 
        style={{
            padding: `${padding}px`,
            gap: `${gap}px`,
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)'
        }}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/10 to-transparent opacity-50"></div>
      
      {/* Timer and Half on top */}
      <div className="flex flex-col items-center justify-center z-10 order-1">
          <div className="flex items-baseline gap-3">
             <div className={`font-display font-bold text-white tracking-widest`} style={{textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee', fontSize: `${mainTimeSize}px`}}>{formatTime(gameTime, gamePhase, stoppageTime)}</div>
             {stoppageTimeText && <span className="font-display font-bold text-yellow-400" style={{textShadow: '0 0 8px #facc15', fontSize: `${stoppageTimeSize}px`}}>{stoppageTimeText}</span>}
          </div>
          <div className={`font-bold text-yellow-300 uppercase tracking-wider`} style={{textShadow: '0 0 5px black', fontSize: `${halfTextSize}px`}}>{getHalfText(gamePhase)}</div>
      </div>
      
      {/* Teams below the timer */}
      <div className={`flex justify-between items-center w-full z-10 order-2 ${isVertical ? 'flex-col' : ''}`} style={{gap: `${isVertical ? 4*scoreboardScale : 16*scoreboardScale}px`}}>
        <TeamDisplay team={teamA} score={score[teamA.id] || 0} alignment="left" layout={layout} scale={scoreboardScale} isFrenzy={frenzyTeam === teamA.id} />
        {isVertical && <div className="text-gray-600 font-bold" style={{fontSize: `${12*scoreboardScale}px`}}>VS</div>}
        <TeamDisplay team={teamB} score={score[teamB.id] || 0} alignment="right" layout={layout} scale={scoreboardScale} isFrenzy={frenzyTeam === teamB.id} />
      </div>
    </div>
  );
};
