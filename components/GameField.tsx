import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { CircleObject, Vector, Team, GamePhase, BuffObject, BuffType, ActiveBuff, TeamInfo, Score, BuffInfo, MatchLayout, BallDefinition, MatchStats } from '../types';
import { 
  FIELD_WIDTH, FIELD_HEIGHT, PLAYER_RADIUS, BALL_RADIUS, NUM_PLAYERS_PER_TEAM, 
  BALL_COLOR, GOAL_DEPTH, PLAYER_MASS,
  BUFF_RADIUS, BUFF_SPAWN_SECONDS, HALF_TIME_SECONDS
} from '../constants';

type Winner = TeamInfo | 'draw' | null;

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

interface GameFieldProps {
  onGoal: (team: Team) => void;
  resetTrigger: number;
  isGameActive: boolean;
  gamePhase: GamePhase;
  isPaused: boolean;
  matchBuffs: BuffType[];
  activeBuffs: ActiveBuff[];
  onActiveBuffsChange: React.Dispatch<React.SetStateAction<ActiveBuff[]>>;
  teamA: TeamInfo;
  teamB: TeamInfo;
  onBuffPickup: (team: TeamInfo, buffType: BuffType) => void;
  onBuffSpawn: (buffType: BuffType) => void;
  seenBuffs: Set<BuffType>;
  onFirstBuffPickup: (buffType: BuffType, team: TeamInfo) => void;
  autoShootEnabled: boolean;
  winner: Winner;
  buffDefinitions: Record<string, BuffInfo>;
  buffsEnabled: boolean;
  // Video Recording Props
  recordMatch: boolean;
  aspectRatio: '16:9' | '9:16';
  onRecordingComplete: (blobUrl: string) => void;
  onRecordingStatusChange: (status: 'idle' | 'recording' | 'generating' | 'ready' | 'error') => void;
  score: Score;
  gameTime: number;
  // General Settings
  screenShakeEnabled: boolean;
  gameSpeed: number;
  // Real Ratings
  useRealRatings: boolean;
  classicModeEnabled: boolean;
  homeTeamId: Team | null;
  // Goalie Settings
  goalieIntelligence: number;
  goalieSpeed: number;
  // New Layout & Sizing Props
  matchLayout: MatchLayout;
  fieldScale: number;
  playerSize: number;
  ballSize: number;
  goalHeight: number;
  goalieSize: number;
  tackleDistance: number;
  // New Stats & Physics Props
  matchStats: MatchStats;
  setMatchStats: React.Dispatch<React.SetStateAction<MatchStats>>;
  minPlayerSpeed: number;
  maxPlayerSpeed: number;
  selectedBall: BallDefinition;
  countdown: number | null;
  isBallInPenaltyAreaRef?: React.MutableRefObject<boolean>;
  onPlaySfx: (type: 'ballTouch' | 'goal' | 'wallHit' | 'buffPickup' | 'goalCheer') => void;
  losingTeamId: Team | null;
  customBallIcon: string | null;
}

const DRIBBLE_COOLDOWN_FRAMES = 15;
const DRIBBLE_FORCE = 1.4;
const TACKLE_COOLDOWN_FRAMES = 90; // 1.5 seconds at 60fps
const BASE_TACKLE_CHANCE = 0.01; 
const TACKLE_FORCE = 5;

const randomVelocity = (minSpeed: number, maxSpeed: number): Vector => {
  const angle = Math.random() * 2 * Math.PI;
  const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
};

export const GameField: React.FC<GameFieldProps> = ({ 
    onGoal, resetTrigger, isGameActive, gamePhase, isPaused, matchBuffs, activeBuffs, onActiveBuffsChange,
    teamA, teamB, onBuffPickup, onBuffSpawn,
    seenBuffs, onFirstBuffPickup, autoShootEnabled, winner, buffDefinitions, buffsEnabled,
    recordMatch, aspectRatio, onRecordingComplete, onRecordingStatusChange,
    score, gameTime, screenShakeEnabled, gameSpeed, useRealRatings, classicModeEnabled, homeTeamId,
    goalieIntelligence, goalieSpeed,
    matchLayout, fieldScale, playerSize, ballSize, tackleDistance, goalHeight, goalieSize,
    matchStats, setMatchStats, minPlayerSpeed, maxPlayerSpeed, selectedBall, countdown,
    isBallInPenaltyAreaRef, onPlaySfx, losingTeamId, customBallIcon
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameObjectsRef = useRef<CircleObject[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const [goalAnimation, setGoalAnimation] = useState<{ timer: number, scoringTeam: Team, shake: number } | null>(null);
  const isGoalPauseActive = useRef(false);

  const [buffsOnField, setBuffsOnField] = useState<BuffObject[]>([]);
  const buffSpawnCounter = useRef(0);
  const [ballEffect, setBallEffect] = useState<{type: BuffType, duration: number, fromTeam: Team, fromPos?: Vector} | null>(null);
  const [teamLogos, setTeamLogos] = useState<Record<Team, HTMLImageElement | null>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ballIconImage, setBallIconImage] = useState<HTMLImageElement | null>(null);
  
  const claimedPermanentBuffs = useRef<Set<BuffType>>(new Set());
  const prevGamePhase = useRef<GamePhase>(gamePhase);
  const dribbleCooldowns = useRef<Map<string, number>>(new Map());
  const tackleCooldowns = useRef<Map<string, number>>(new Map());

  // Stats refs
  const statsRef = useRef<MatchStats>(matchStats);
  const lastTouchedByTeam = useRef<Team | null>(null);
  const statsUpdateCounter = useRef(0);

  // Video Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  useEffect(() => {
    statsRef.current = matchStats;
  }, [matchStats]);

  const effectiveDimensions = useMemo(() => {
    const scale = fieldScale;
    const baseW = FIELD_WIDTH * scale;
    const baseH = FIELD_HEIGHT * scale;
    const pR = playerSize;
    const bR = ballSize;
    const gH = goalHeight * scale;
    const gD = GOAL_DEPTH * scale;
    const paW = 165 * scale;
    const paH = 403 * scale;

    if (matchLayout === 'vertical') {
        return { fieldW: baseH, fieldH: baseW, playerR: pR, ballR: bR, goalH: gH, goalD: gD, paW: paH, paH: paW };
    }
    return { fieldW: baseW, fieldH: baseH, playerR: pR, ballR: bR, goalH: gH, goalD: gD, paW, paH };
  }, [matchLayout, fieldScale, playerSize, ballSize, goalHeight]);


  const getEffectType = useCallback((buffType: BuffType): string => {
      const info = buffDefinitions[buffType];
      return info?.effectTemplate || buffType;
  }, [buffDefinitions]);

  const createInitialObjects = useCallback((): CircleObject[] => {
    const { fieldW, fieldH, playerR, ballR } = effectiveDimensions;
    const objects: CircleObject[] = [];
    
    const formation_442 = [
        { x: 0.25, y: 0.2 }, { x: 0.25, y: 0.4 }, { x: 0.25, y: 0.6 }, { x: 0.25, y: 0.8 },
        { x: 0.4, y: 0.15 }, { x: 0.4, y: 0.4 }, { x: 0.4, y: 0.6 }, { x: 0.4, y: 0.85 },
        { x: 0.55, y: 0.3 }, { x: 0.55, y: 0.7 }
    ].map(p => ({ 
        x: p.x * (FIELD_WIDTH * fieldScale / 2), 
        y: p.y * (FIELD_HEIGHT * fieldScale) 
    }));

    // Team A (left in horizontal, top in vertical)
    const goalieAPos = matchLayout === 'vertical' ? { x: fieldW / 2, y: playerR * 2.5 } : { x: playerR * 2.5, y: fieldH / 2 };
    objects.push({
        id: `${teamA.id}-goalie`, position: goalieAPos, velocity: { x: 0, y: 0 },
        radius: goalieSize, color: teamA.color, team: teamA.id, mass: PLAYER_MASS * 1.5, isGoalie: true, bounciness: 0.5, friction: 0.9
    });
    formation_442.forEach((pos, i) => {
        const finalPos = matchLayout === 'vertical' ? { x: pos.y, y: pos.x } : { x: pos.x, y: pos.y };
        objects.push({
            id: `${teamA.id}-player-${i}`, position: finalPos,
            velocity: randomVelocity(minPlayerSpeed, maxPlayerSpeed), radius: playerR, color: teamA.color, team: teamA.id, mass: PLAYER_MASS, bounciness: 0.5, friction: 0.9
        });
    });

    // Team B (right in horizontal, bottom in vertical)
    const goalieBPos = matchLayout === 'vertical' ? { x: fieldW / 2, y: fieldH - (playerR * 2.5) } : { x: fieldW - (playerR * 2.5), y: fieldH / 2 };
    objects.push({
        id: `${teamB.id}-goalie`, position: goalieBPos, velocity: { x: 0, y: 0 },
        radius: goalieSize, color: teamB.color, team: teamB.id, mass: PLAYER_MASS * 1.5, isGoalie: true, bounciness: 0.5, friction: 0.9
    });
    formation_442.forEach((pos, i) => {
        const finalPos = matchLayout === 'vertical' ? { x: fieldW - pos.y, y: fieldH - pos.x } : { x: fieldW - pos.x, y: pos.y };
        objects.push({
            id: `${teamB.id}-player-${i}`, position: finalPos,
            velocity: randomVelocity(minPlayerSpeed, maxPlayerSpeed), radius: playerR, color: teamB.color, team: teamB.id, mass: PLAYER_MASS, bounciness: 0.5, friction: 0.9
        });
    });
    
    objects.push({
        id: 'ball', position: { x: fieldW / 2, y: fieldH / 2 },
        velocity: randomVelocity(minPlayerSpeed, maxPlayerSpeed), radius: ballR, color: BALL_COLOR, team: 'ball', 
        mass: selectedBall.mass, bounciness: selectedBall.bounciness, friction: selectedBall.friction,
    });
    return objects;
  }, [teamA, teamB, effectiveDimensions, matchLayout, fieldScale, minPlayerSpeed, maxPlayerSpeed, selectedBall, goalieSize]);

  useEffect(() => {
    if (customBallIcon) {
        const img = new Image();
        img.src = customBallIcon;
        img.onload = () => setBallIconImage(img);
        img.onerror = () => setBallIconImage(null);
    } else {
        setBallIconImage(null);
    }
  }, [customBallIcon]);

  useEffect(() => {
    const loadLogos = () => {
        [teamA, teamB].forEach(team => {
            if (!team.logo) {
                setTeamLogos(prev => ({...prev, [team.id]: null}));
                return;
            };
            const logo = new Image();
            logo.src = team.logo;
            logo.crossOrigin = "anonymous"; // Important for canvas tainting
            logo.onload = () => setTeamLogos(prev => ({ ...prev, [team.id]: logo }));
            logo.onerror = () => setTeamLogos(prev => ({ ...prev, [team.id]: null })); // Handle broken links
        });
    }
    loadLogos();
  }, [teamA, teamB]);

  const resetGame = useCallback(() => {
    gameObjectsRef.current = createInitialObjects();
    setBuffsOnField([]);
    onActiveBuffsChange([]);
    setBallEffect(null);
    buffSpawnCounter.current = 0;
    claimedPermanentBuffs.current.clear();
    dribbleCooldowns.current.clear();
    tackleCooldowns.current.clear();
    setParticles([]);
    lastTouchedByTeam.current = null;
  }, [onActiveBuffsChange, createInitialObjects]);

  useEffect(() => {
    resetGame();
  }, [resetTrigger, resetGame]);

  useEffect(() => {
    if (prevGamePhase.current === 'HALF_TIME' && gamePhase === 'SECOND_HALF') {
        gameObjectsRef.current = createInitialObjects();
        const ball = gameObjectsRef.current.find(o => o.team === 'ball');
        if (ball) {
            ball.velocity = { x: 0, y: 0 };
            setTimeout(() => {
                if(isGameActive && gamePhase === 'SECOND_HALF') ball.velocity = randomVelocity(minPlayerSpeed, maxPlayerSpeed);
            }, 500);
        }
    }
    prevGamePhase.current = gamePhase;
  }, [gamePhase, isGameActive, createInitialObjects, minPlayerSpeed, maxPlayerSpeed]);
  
  useEffect(() => {
    if (!recordMatch) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
      }
      return;
    }

    if (isGameActive && !mediaRecorderRef.current) {
      try {
        onRecordingStatusChange('recording');
        const recCanvas = recordingCanvasRef.current;
        recCanvas.width = aspectRatio === '16:9' ? 960 : 540;
        recCanvas.height = aspectRatio === '16:9' ? 540 : 960;

        const stream = recCanvas.captureStream(30);
        const options = { mimeType: 'video/webm; codecs=vp9' };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          onRecordingStatusChange('generating');
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          onRecordingComplete(url);
          onRecordingStatusChange('ready');
          mediaRecorderRef.current = null;
        };
        recorder.onerror = () => {
          console.error('MediaRecorder error');
          onRecordingStatusChange('error');
          mediaRecorderRef.current = null;
        };
        recorder.start();
      } catch (e) {
        console.error("Failed to start recording:", e);
        onRecordingStatusChange('error');
      }
    }

    if (!isGameActive && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaRecorderRef.current) {
      if (isPaused && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.pause();
      else if (!isPaused && mediaRecorderRef.current.state === 'paused') mediaRecorderRef.current.resume();
    }

    return () => {
        if(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }

  }, [isGameActive, isPaused, recordMatch, aspectRatio, onRecordingComplete, onRecordingStatusChange]);


  const drawField = (ctx: CanvasRenderingContext2D) => {
    const { fieldW, fieldH, goalH, goalD, paW, paH } = effectiveDimensions;
    const isVertical = matchLayout === 'vertical';

    ctx.fillStyle = '#1a202c'; // Dark gray
    ctx.fillRect(0, 0, fieldW, fieldH);
    
    const stripeCount = 12;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(22, 163, 74, 0.9)' : 'rgba(21, 128, 61, 0.9)'; // semi-transparent green
      if (isVertical) {
        ctx.fillRect(0, i * (fieldH / stripeCount), fieldW, (fieldH / stripeCount));
      } else {
        ctx.fillRect(i * (fieldW / stripeCount), 0, (fieldW / stripeCount), fieldH);
      }
    }
    
    buffsOnField.forEach(buff => {
        if(buff.isTrap && buff.trapDuration) {
             const buffInfo = buffDefinitions[buff.type];
             if (!buffInfo) return;
             const alpha = Math.min(1, buff.trapDuration / 120);
             ctx.save();
             ctx.beginPath();
             const radius = getEffectType(buff.type) === 'GEL_ESCORREGADIO' ? buff.radius : playerSize * 2
             ctx.arc(buff.position.x, buff.position.y, radius, 0, Math.PI * 2);
             ctx.strokeStyle = buffInfo.color;
             ctx.fillStyle = buffInfo.color + '33'; // transparent fill
             ctx.lineWidth = 3;
             if (getEffectType(buff.type) === 'GEL_ESCORREGADIO') ctx.globalAlpha = alpha * (0.3 + Math.sin(Date.now()/200) * 0.2);
             else ctx.globalAlpha = alpha * (0.5 + Math.sin(Date.now()/100) * 0.2);
             ctx.stroke();
             ctx.fill();
             ctx.restore();
        }
    })

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(127, 255, 212, 0.5)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath(); 
    isVertical ? ctx.moveTo(0, fieldH / 2) : ctx.moveTo(fieldW / 2, 0); 
    isVertical ? ctx.lineTo(fieldW, fieldH / 2) : ctx.lineTo(fieldW / 2, fieldH);
    ctx.stroke();
    
    ctx.beginPath(); ctx.arc(fieldW / 2, fieldH / 2, 90 * fieldScale, 0, 2 * Math.PI); ctx.stroke();
    ctx.strokeRect(2, 2, fieldW-4, fieldH-4);
    
    const penaltyAreaY_H = (fieldH - paH) / 2;
    const penaltyAreaX_V = (fieldW - paW) / 2;
    if(isVertical) {
        ctx.strokeRect(penaltyAreaX_V, 0, paW, paH);
        ctx.strokeRect(penaltyAreaX_V, fieldH - paH, paW, paH);
    } else {
        ctx.strokeRect(0, penaltyAreaY_H, paW, paH);
        ctx.strokeRect(fieldW - paW, penaltyAreaY_H, paW, paH);
    }
    ctx.shadowBlur = 0;
    
    const shrinkTargetingB = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHRINK' && b.team === teamA.id);
    const goalHeightA = shrinkTargetingB ? goalH * 0.6 : goalH;
    
    const shrinkTargetingA = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHRINK' && b.team === teamB.id);
    const goalHeightB = shrinkTargetingA ? goalH * 0.6 : goalH;

    const drawGoal = (x_or_y: number, height: number, isTop: boolean) => {
        const postWidth = 10 * fieldScale;
        ctx.save();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = postWidth;
        if(isVertical) {
             const goalX = (fieldW - height) / 2;
             ctx.strokeRect(goalX, x_or_y, height, 0);
        } else {
             const goalY = (fieldH - height) / 2;
             ctx.strokeRect(x_or_y, goalY, 0, height);
        }
        ctx.restore();
    };

    if(isVertical) {
        drawGoal(0, goalHeightA, true);
        drawGoal(fieldH, goalHeightB, false);
    } else {
        drawGoal(0, goalHeightA, true);
        drawGoal(fieldW, goalHeightB, false);
    }
  };
  
  const drawObject = (ctx: CanvasRenderingContext2D, obj: CircleObject, losingTeamId: Team | null) => {
    const { playerR } = effectiveDimensions;
    ctx.save();
    const currentRadius = obj.radius * (obj.sizeModifier || 1);
    
    if(obj.team !== 'ball' && obj.trail) {
        obj.trail.push({x: obj.position.x, y: obj.position.y});
        if(obj.trail.length > 5) obj.trail.shift();

        obj.trail.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius * (i / 5), 0, 2*Math.PI);
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = (i / 5) * 0.2;
            ctx.fill();
        });
    }


    ctx.globalAlpha = 1;

    if (obj.isInvisible) {
        ctx.restore();
        return;
    }

    ctx.globalAlpha = obj.isGhost ? 0.5 : 1;
    if (obj.isFrozen) ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100) * 0.2;
    
    ctx.beginPath();
    ctx.arc(obj.position.x, obj.position.y, currentRadius, 0, 2 * Math.PI);
    
    if (obj.team === 'ball') {
        const angle = Math.atan2(obj.velocity.y, obj.velocity.x);
        
        if(ballEffect && (getEffectType(ballEffect.type) === 'FIREBALL_SHOT' || getEffectType(ballEffect.type) === 'FURACAO_DE_FOGO')) {
            const isTornado = getEffectType(ballEffect.type) === 'FURACAO_DE_FOGO';
            for (let i = 0; i < 7; i++) {
                const offset = i * 8;
                const fireAngle = isTornado ? angle + (Date.now()/50) + i*0.5 : angle;
                ctx.beginPath();
                ctx.arc(obj.position.x - Math.cos(fireAngle) * offset, obj.position.y - Math.sin(fireAngle) * offset, currentRadius * (1 - i/7), 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(255, ${150 - i * 20}, 0, ${1 - i/7})`;
                ctx.fill();
            }
             ctx.beginPath();
             ctx.arc(obj.position.x, obj.position.y, currentRadius + 5 + Math.sin(Date.now() / 50) * 5, 0, 2 * Math.PI);
             ctx.fillStyle = `rgba(255, 100, 0, ${0.3 + Math.sin(Date.now() / 50) * 0.2})`;
             ctx.fill();
        }
        
        if(ballEffect && getEffectType(ballEffect.type) === 'CHUTE_TIGRE') {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.font = `${currentRadius * 4}px sans-serif`;
            ctx.translate(obj.position.x, obj.position.y);
            ctx.rotate(angle);
            ctx.fillText('🐅', -currentRadius * 2, currentRadius * 0.7);
            ctx.restore();
        }
        
        if (ballEffect && getEffectType(ballEffect.type) === 'TIRO_DE_EFEITO') {
            const trailLength = 15;
            for(let i=0; i < trailLength; i++) {
                 const progress = i / trailLength;
                 ctx.beginPath();
                 const timeOffset = (Date.now() / 500) * (ballEffect.fromTeam === teamA.id ? -1 : 1);
                 const curveAmount = Math.sin(progress * Math.PI) * 50;
                 const trailPos = {
                     x: obj.position.x - obj.velocity.x * progress * 2,
                     y: obj.position.y - obj.velocity.y * progress * 2 + Math.sin(timeOffset + progress * 5) * curveAmount * progress
                 };
                 ctx.arc(trailPos.x, trailPos.y, currentRadius * (1 - progress), 0, 2 * Math.PI);
                 const buffInfo = buffDefinitions['TIRO_DE_EFEITO'];
                 if (buffInfo) ctx.fillStyle = buffInfo.color;
                 ctx.globalAlpha = (1 - progress) * 0.5;
                 ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const gradient = ctx.createRadialGradient(
            obj.position.x - currentRadius/2, obj.position.y - currentRadius/2, currentRadius/10,
            obj.position.x, obj.position.y, currentRadius
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (ballIconImage) {
            ctx.save();
            ctx.clip(); // clips to the ball's circle path
            ctx.drawImage(ballIconImage, obj.position.x - currentRadius, obj.position.y - currentRadius, currentRadius * 2, currentRadius * 2);
            ctx.restore();
        } else {
            // Fallback to original pentagon drawing
            ctx.save();
            ctx.translate(obj.position.x, obj.position.y);
            const rotation = (obj.position.x + obj.position.y) / 40;
            ctx.rotate(rotation);
            
            const drawPentagon = (size: number) => {
                ctx.fillStyle = '#1f2937';
                ctx.beginPath();
                const angleStep = (Math.PI * 2) / 5;
                ctx.moveTo(0, -size);
                for (let i = 1; i <= 5; i++) {
                    ctx.lineTo(size * Math.sin(i * angleStep), -size * Math.cos(i * angleStep));
                }
                ctx.closePath();
                ctx.fill();
            };

            drawPentagon(currentRadius * 0.5);
            ctx.restore();
        }

        const magnetBuff = activeBuffs.find(b => getEffectType(b.type) === 'MAGNETIC_BALL');
        let auraColor: string | null = null;
        let auraOpacity = 0.3;

        const shotAuras: string[] = ['FIREBALL_SHOT', 'FURACAO_DE_FOGO', 'BULLDOZER_SHOT', 'HOMING_SHOT', 'BOLA_DE_CANHÃO', 'CHUTE_COMETA', 'BOMBA_DE_IMPACTO', 'BOLA_DE_CHUMBO', 'BROCA_GIRATORIA'];
        
        const ballEffectType = ballEffect ? getEffectType(ballEffect.type) : null;
        if (ballEffectType && shotAuras.includes(ballEffectType)) {
             const buffInfo = buffDefinitions[ballEffectType];
             if(buffInfo) auraColor = buffInfo.color;
        } else if (magnetBuff) { 
            const buffInfo = buffDefinitions['MAGNETIC_BALL'];
            if(buffInfo) auraColor = buffInfo.color;
            auraOpacity = 0.4 + Math.sin(Date.now() / 150) * 0.2; 
        }

        if (auraColor) {
            ctx.globalAlpha = auraOpacity;
            ctx.fillStyle = auraColor;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    } else { // It's a player
        const logo = teamLogos[obj.team];
        const teamInfo = obj.team === teamA.id ? teamA : teamB;
        
        ctx.fillStyle = obj.color;
        ctx.fill();

        ctx.save();
        if (obj.isGoalie) {
            ctx.lineWidth = 4 + Math.sin(Date.now() / 200) * 2;
            ctx.strokeStyle = teamInfo.color2;
            ctx.shadowColor = teamInfo.color2;
            ctx.shadowBlur = 20;
            ctx.setLineDash([15, 10]);
        } else {
            ctx.shadowColor = teamInfo.color2;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = teamInfo.color2;
            ctx.lineWidth = 4;
        }
        ctx.stroke();
        ctx.restore();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (logo) {
            ctx.save();
            ctx.clip(); 
            ctx.fillStyle = 'white';
            ctx.fillRect(obj.position.x - currentRadius, obj.position.y - currentRadius, currentRadius * 2, currentRadius * 2);
            ctx.drawImage(logo, obj.position.x - currentRadius, obj.position.y - currentRadius, currentRadius * 2, currentRadius * 2);
            ctx.restore();
        }
        
        if (obj.isGoalie) {
            ctx.save();
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            const starOuterRadius = currentRadius * 0.5;
            const starInnerRadius = currentRadius * 0.25;
            
            let rot = Math.PI / 2 * 3;
            let x = obj.position.x;
            let y = obj.position.y;
            const step = Math.PI / 5;
            
            ctx.beginPath();
            ctx.moveTo(x, y - starOuterRadius);
            for (let i = 0; i < 5; i++) {
                x = obj.position.x + Math.cos(rot) * starOuterRadius;
                y = obj.position.y + Math.sin(rot) * starOuterRadius;
                ctx.lineTo(x, y);
                rot += step;
                x = obj.position.x + Math.cos(rot) * starInnerRadius;
                y = obj.position.y + Math.sin(rot) * starInnerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(obj.position.x, obj.position.y - starOuterRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    if (obj.team !== 'ball') {
        let auraColor: string | null = null;
        let auraSize = 30;
        const chargedBuffTypes: BuffType[] = ['FIREBALL_SHOT', 'HOMING_SHOT', 'BULLDOZER_SHOT', 'TELEPORT_DRIBBLE', 'CHUTE_TIGRE', 'FURACAO_DE_FOGO', 'TIRO_DE_EFEITO', 'BOLA_DE_CANHÃO', 'CHUTE_COMETA', 'BOMBA_DE_IMPACTO', 'CHUTE_FANTASMA', 'BROCA_GIRATORIA', 'CHUTE_DE_DOIS_ESTAGIOS', 'BOLA_DE_CHUMBO'];
        const chargedBuff = activeBuffs.find(b => b.team === obj.team && chargedBuffTypes.includes(getEffectType(b.type)) && b.affectedPlayerId === obj.id);

        if(activeBuffs.some(b => b.team === obj.team && getEffectType(b.type) === 'SPEED_ADVANTAGE')) auraColor = buffDefinitions[getEffectType('SPEED_ADVANTAGE')]?.color || null;
        if(chargedBuff) auraColor = buffDefinitions[getEffectType(chargedBuff.type)]?.color || null;
        if(activeBuffs.some(b => b.team !== obj.team && getEffectType(b.type) === 'SLOW_GAME')) auraColor = buffDefinitions[getEffectType('SLOW_GAME')]?.color || null;
        if(activeBuffs.some(b => b.team === obj.team && getEffectType(b.type) === 'GOALIE_INSTINCT')) auraColor = buffDefinitions[getEffectType('GOALIE_INSTINCT')]?.color || null;
        if(activeBuffs.some(b => b.affectedPlayerId === obj.id && getEffectType(b.type) === 'REPULSOR_FIELD')) auraColor = buffDefinitions[getEffectType('REPULSOR_FIELD')]?.color || null;
        if(obj.id === activeBuffs.find(b => getEffectType(b.type) === 'GIANT_GOALIE' && b.team === obj.team)?.affectedPlayerId) { auraColor = buffDefinitions[getEffectType('GIANT_GOALIE')]?.color || null; auraSize=40; }
        if(activeBuffs.some(b => getEffectType(b.type) === 'JOGADOR_CASCUDO' && b.affectedPlayerId === obj.id)) {
             const buffInfo = buffDefinitions['JOGADOR_CASCUDO'];
             if (buffInfo) {
                ctx.shadowColor = buffInfo.color;
                ctx.shadowBlur = 20;
                ctx.strokeStyle = buffInfo.color;
                ctx.lineWidth = 2;
                ctx.stroke();
             }
        }
        
        if(auraColor) {
            ctx.shadowColor = auraColor;
            ctx.shadowBlur = auraSize;
            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        if (obj.team === losingTeamId) {
            ctx.save();
            const alpha = 0.5 + Math.sin(Date.now() / 150) * 0.4;
            const gradient = ctx.createRadialGradient(
                obj.position.x, obj.position.y, currentRadius,
                obj.position.x, obj.position.y, currentRadius + 15
            );
            gradient.addColorStop(0, `rgba(255, 180, 40, ${alpha * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);

            ctx.beginPath();
            ctx.arc(obj.position.x, obj.position.y, currentRadius + 15, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
        
        const dribleFantasmaBuff = activeBuffs.find(b => getEffectType(b.type) === 'DRIBLE_FANTASMA' && b.affectedPlayerId === obj.id);
        if (dribleFantasmaBuff) {
            const timeLapsed = dribleFantasmaBuff.initialDuration - dribleFantasmaBuff.duration;
            const progress = timeLapsed / dribleFantasmaBuff.initialDuration;
            for(let i = 0; i < 2; i++) {
                const angle = (i * Math.PI) + (progress * Math.PI * 2);
                const distance = progress * 80;
                ctx.save();
                ctx.globalAlpha = (1 - progress) * 0.6;
                ctx.translate(obj.position.x + Math.cos(angle) * distance, obj.position.y + Math.sin(angle) * distance);
                ctx.beginPath();
                ctx.arc(0, 0, currentRadius, 0, 2*Math.PI);
                ctx.fillStyle = obj.color;
                ctx.fill();
                ctx.restore();
            }
        }

    }
    ctx.restore();

    if(obj.isFrozen) {
        ctx.save();
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('🟥', obj.position.x, obj.position.y - currentRadius - 10);
        ctx.restore();
    }
     if(ballEffect && getEffectType(ballEffect.type) === 'HOMING_SHOT' && obj.id === 'ball') {
        const { fieldW, fieldH } = effectiveDimensions;
        const targetX = ballEffect.fromTeam === teamA.id ? fieldW : 0;
        const targetY = fieldH / 2;
        const dx = targetX - obj.position.x, dy = targetY - obj.position.y;
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(obj.position.x, obj.position.y);
        ctx.rotate(angle);
        const buffInfo = buffDefinitions['HOMING_SHOT'];
        if (buffInfo) ctx.strokeStyle = buffInfo.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100) * 0.3;
        ctx.beginPath();
        ctx.moveTo(currentRadius, 0);
        ctx.lineTo(currentRadius + 10, -10);
        ctx.lineTo(currentRadius + 10, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
  };

  const drawBuff = (ctx: CanvasRenderingContext2D, buff: BuffObject) => {
    const buffInfo = buffDefinitions[buff.type];
    if (!buffInfo || buff.isTrap) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(buff.position.x, buff.position.y, buff.radius, 0, 2 * Math.PI);
    ctx.shadowColor = buffInfo.color;
    ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = buffInfo.color;
    ctx.fill();
    ctx.fill(); 
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${buff.radius * 1.8}px sans-serif`;
    ctx.fillText(buffInfo.symbol, buff.position.x, buff.position.y);
    ctx.restore();
  };

  const drawShield = (ctx: CanvasRenderingContext2D, teamId: Team) => {
    if (!activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHIELD' && b.team === teamId)) return;
    const { fieldW, fieldH, goalH } = effectiveDimensions;
    const isVertical = matchLayout === 'vertical';

    ctx.save();
    if(isVertical) {
        const goalX = (fieldW - goalH) / 2;
        const y = teamId === teamA.id ? 1 : fieldH - 1;
        ctx.beginPath();
        ctx.moveTo(goalX, y);
        ctx.lineTo(goalX + goalH, y);
    } else {
        const goalY = (fieldH - goalH) / 2;
        const x = teamId === teamA.id ? 1 : fieldW - 1;
        ctx.beginPath();
        ctx.moveTo(x, goalY);
        ctx.lineTo(x, goalY + goalH);
    }

    ctx.lineWidth = 10 + Math.sin(Date.now() / 150) * 4;
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.6 + Math.sin(Date.now() / 150) * 0.2})`;
    const buffInfo = buffDefinitions['GOAL_SHIELD'];
    if (buffInfo) ctx.shadowColor = buffInfo.color;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    const newParticles = particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1, // gravity
        life: p.life - gameSpeed,
      }))
      .filter(p => p.life > 0);

    newParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = (p.life / p.maxLife) * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    setParticles(newParticles);
  };
  
  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    const { fieldW, fieldH } = effectiveDimensions;
    if (gamePhase === 'COUNTDOWN' && countdown !== null && countdown > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, fieldW, fieldH);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 150px "Exo 2", sans-serif';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 20;
        ctx.fillText(String(countdown), fieldW / 2, fieldH / 2);
        ctx.restore();
    } else if (isPaused) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, fieldW, fieldH);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px "Exo 2", sans-serif';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 10;
      ctx.fillText('PAUSADO', fieldW / 2, fieldH / 2);
      ctx.restore();
    } else if (goalAnimation) {
      const { timer, scoringTeam } = goalAnimation;
      const scoringTeamInfo = scoringTeam === teamA.id ? teamA : teamB;
      const scale = 1 + (150 - timer) / 75;
      const alpha = Math.max(0, timer / 150);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.font = `bold ${100 * scale}px "Exo 2", sans-serif`;
      ctx.fillStyle = scoringTeamInfo.color === '#000000' ? '#FFFFFF' : scoringTeamInfo.color;
      ctx.globalAlpha = alpha;
      ctx.fillText('GOL!', fieldW / 2, fieldH / 2);

      ctx.font = `bold ${40 * scale}px "Exo 2", sans-serif`;
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(scoringTeamInfo.name.toUpperCase(), fieldW / 2, fieldH / 2 + 80);
      
      ctx.restore();
    }
    
    if (gamePhase === 'FULL_TIME' && winner) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, fieldW, fieldH);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const scoreA = score[teamA.id] || 0;
        const scoreB = score[teamB.id] || 0;
        const scoreText = `${scoreA} - ${scoreB}`;
        
        if (winner === 'draw') {
            ctx.font = 'bold 90px "Exo 2", sans-serif';
            ctx.fillStyle = '#facc15'; // yellow-400
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 15;
            ctx.fillText('EMPATE', fieldW / 2, fieldH / 2 - 30);
            
            ctx.font = 'bold 50px "Exo 2", sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(scoreText, fieldW / 2, fieldH / 2 + 50);
        } else {
            ctx.font = 'bold 50px "Exo 2", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 15;
            ctx.fillText('VENCEDOR', fieldW / 2, fieldH / 2 - 100);

            ctx.font = 'bold 80px "Exo 2", sans-serif';
            ctx.fillStyle = winner.color === '#000000' ? '#FFFFFF' : winner.color;
            ctx.shadowColor = winner.color;
            ctx.shadowBlur = 25;
            ctx.fillText(winner.name.toUpperCase(), fieldW / 2, fieldH / 2);

            ctx.font = 'bold 50px "Exo 2", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 15;
            ctx.fillText(scoreText, fieldW / 2, fieldH / 2 + 80);
        }
        ctx.restore();
    }
  };

  const createExplosion = (position: Vector, radius: number, power: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 8 + 2;
        newParticles.push({
            id: Date.now() + i,
            x: position.x,
            y: position.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40 + Math.random() * 30,
            maxLife: 70,
            size: Math.random() * 4 + 2,
            color: `rgba(255, ${Math.random() * 155 + 100}, 0, ${Math.random() * 0.5 + 0.5})`
        });
    }
    setParticles(p => [...p, ...newParticles]);

    gameObjectsRef.current.forEach(obj => {
        if (obj.team !== 'ball') {
            const dx = obj.position.x - position.x;
            const dy = obj.position.y - position.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < radius * radius && distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = power / (dist + 10);
                obj.velocity.x += (dx / dist) * force;
                obj.velocity.y += (dy / dist) * force;
            }
        }
    });
};
  
  const handleGoalScored = useCallback((team: Team) => {
    const { fieldW, fieldH } = effectiveDimensions;
    const isVertical = matchLayout === 'vertical';

    if (isGoalPauseActive.current) return;
    isGoalPauseActive.current = true;
    onGoal(team);
    onPlaySfx('goal');
    onPlaySfx('goalCheer');
    statsRef.current[team].shotsOnTarget++;
    setBallEffect(null);
    setGoalAnimation({ timer: 150, scoringTeam: team, shake: screenShakeEnabled ? 20 : 0 });
    
    const scoringTeamInfo = team === teamA.id ? teamA : teamB;
    const goalPos = isVertical ? {x: fieldW/2, y: team === teamA.id ? fieldH : 0} : {x: team === teamA.id ? fieldW : 0, y: fieldH/2};
    const newParticles: Particle[] = [];
    for(let i = 0; i < 100; i++) {
        const angle = isVertical ? (Math.random() * Math.PI) : (Math.random() * Math.PI - Math.PI/2);
        const speed = Math.random() * 10 + 5;
        let vx, vy;
        if(isVertical) {
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed * (team === teamA.id ? -1 : 1);
        } else {
            vx = Math.cos(angle) * speed * (team === teamA.id ? -1 : 1);
            vy = Math.sin(angle) * speed;
        }
        newParticles.push({
            id: Date.now() + i, x: goalPos.x, y: goalPos.y, vx, vy,
            life: 60 + Math.random() * 60, maxLife: 120,
            size: Math.random() * 5 + 2,
            color: Math.random() > 0.5 ? scoringTeamInfo.color : scoringTeamInfo.color2
        });
    }
    setParticles(p => [...p, ...newParticles]);

    setTimeout(() => {
        resetGame();
        isGoalPauseActive.current = false;
        setGoalAnimation(null);
    }, 2500 / gameSpeed);
  }, [onGoal, createInitialObjects, teamA, teamB, screenShakeEnabled, effectiveDimensions, matchLayout, gameSpeed, resetGame, onPlaySfx]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { fieldW, fieldH, playerR, ballR, goalH, paW, paH } = effectiveDimensions;
    const isVertical = matchLayout === 'vertical';

    if (goalAnimation && goalAnimation.shake > 0) {
        setGoalAnimation(g => g ? {...g, timer: g.timer > 0 ? g.timer - gameSpeed : 0, shake: g.shake - 1} : null);
    }
    
    const newFrameParticles: Particle[] = [];

    if (isGameActive && !isGoalPauseActive.current && !isPaused) {
        if(lastTouchedByTeam.current && statsRef.current[lastTouchedByTeam.current]) {
            statsRef.current[lastTouchedByTeam.current].possession++;
        }
        statsUpdateCounter.current++;
        if(statsUpdateCounter.current >= 60) {
            setMatchStats({...statsRef.current});
            statsUpdateCounter.current = 0;
        }


        const objects = gameObjectsRef.current;
        if(objects.length === 0) return;
        
        const ball = objects.find(o => o.team === 'ball')!;

        if (isBallInPenaltyAreaRef && ball) {
            const penaltyAreaY_H = (fieldH - paH) / 2;
            const penaltyAreaX_V = (fieldW - paW) / 2;

            const inAreaA_H = ball.position.x < paW && ball.position.y > penaltyAreaY_H && ball.position.y < penaltyAreaY_H + paH;
            const inAreaB_H = ball.position.x > fieldW - paW && ball.position.y > penaltyAreaY_H && ball.position.y < penaltyAreaY_H + paH;
            
            const inAreaA_V = ball.position.y < paH && ball.position.x > penaltyAreaX_V && ball.position.x < penaltyAreaX_V + paW;
            const inAreaB_V = ball.position.y > fieldH - paH && ball.position.x > penaltyAreaX_V && ball.position.x < penaltyAreaX_V + paW;
            
            isBallInPenaltyAreaRef.current = isVertical ? (inAreaA_V || inAreaB_V) : (inAreaA_H || inAreaB_V);
        }
        
        const playerModifiers = new Map<string, { speedMod: number, kickPowerMod: number, goalieReactionMod: number, strengthMod: number, tackleChanceMod: number, tackleForceMod: number, tackleRangeMod: number, midfieldMod: number, ratingSizeMod: number, dribbleControlMod: number }>();
        const defaultModifiers = { speedMod: 1, kickPowerMod: 1, goalieReactionMod: 1, strengthMod: 1, tackleChanceMod: 1, tackleForceMod: 1, tackleRangeMod: 1, midfieldMod: 1, ratingSizeMod: 1, dribbleControlMod: 1 };
        
        if (useRealRatings) {
            const defaultRatings = { attack: 75, defense: 75, midfield: 75, form: 75, momentum: 75 };

            const getMomentumModifier = (momentum: number | undefined) => {
                const m = momentum || 75;
                return 1 + (m - 75) / 25 * 0.08; // +-8%
            };

            const applyModifiers = (baseRatings: any, isHome: boolean) => {
                const momentumMod = getMomentumModifier(baseRatings.momentum);
                const homeMod = isHome ? 1.05 : 1.0;
                return {
                    attack: Math.min(100, baseRatings.attack * homeMod * momentumMod),
                    defense: Math.min(100, baseRatings.defense * homeMod * momentumMod),
                    midfield: Math.min(100, baseRatings.midfield * homeMod * momentumMod),
                    form: Math.min(100, baseRatings.form * homeMod * momentumMod),
                };
            };

            const baseRatingsA = { ...defaultRatings, ...teamA.ratings };
            const baseRatingsB = { ...defaultRatings, ...teamB.ratings };
            
            let finalRatingsA = applyModifiers(baseRatingsA, homeTeamId === teamA.id);
            let finalRatingsB = applyModifiers(baseRatingsB, homeTeamId === teamB.id);

            if (classicModeEnabled) {
                const balanceFactor = 0.5;
                const avgAttack = (finalRatingsA.attack + finalRatingsB.attack) / 2;
                const avgDefense = (finalRatingsA.defense + finalRatingsB.defense) / 2;
                const avgMidfield = (finalRatingsA.midfield + finalRatingsB.midfield) / 2;
                const avgForm = (finalRatingsA.form + finalRatingsB.form) / 2;

                finalRatingsA = {
                    attack: finalRatingsA.attack - (finalRatingsA.attack - avgAttack) * balanceFactor,
                    defense: finalRatingsA.defense - (finalRatingsA.defense - avgDefense) * balanceFactor,
                    midfield: finalRatingsA.midfield - (finalRatingsA.midfield - avgMidfield) * balanceFactor,
                    form: finalRatingsA.form - (finalRatingsA.form - avgForm) * balanceFactor,
                };
                finalRatingsB = {
                    attack: finalRatingsB.attack - (finalRatingsB.attack - avgAttack) * balanceFactor,
                    defense: finalRatingsB.defense - (finalRatingsB.defense - avgDefense) * balanceFactor,
                    midfield: finalRatingsB.midfield - (finalRatingsB.midfield - avgMidfield) * balanceFactor,
                    form: finalRatingsB.form - (finalRatingsB.form - avgForm) * balanceFactor,
                };
            }
            
            const teamRatingsMap = { [teamA.id]: finalRatingsA, [teamB.id]: finalRatingsB };

            objects.filter(o => o.team !== 'ball').forEach(player => {
                const ratings = teamRatingsMap[player.team];
                 if(!ratings) {
                    playerModifiers.set(player.id, defaultModifiers);
                    return;
                }
                const avgRating = (ratings.attack + ratings.defense + ratings.midfield) / 3;
                const ratingSizeMod = 1.0 + ((avgRating - 80) / 20) * 0.1;

                const speedMod = 1 + ((ratings.midfield + ratings.form) / 2 - 75) * 0.03;
                const kickPowerMod = 1 + ((ratings.attack + ratings.form) / 2 - 75) * 0.055;
                const goalieReactionMod = 1 + ((ratings.defense + ratings.form) / 2 - 75) * 0.035;
                const strengthMod = 1 + ((ratings.defense + ratings.midfield) / 2 - 75) * 0.050;
                const tackleChanceMod = 1 + ((ratings.defense - 75) * 0.05); 
                const tackleForceMod = 1 + ((ratings.defense - 75) * 0.03);
                const tackleRangeMod = 1 + ((ratings.defense - 75) * 0.04);
                const midfieldMod = 1 + ((ratings.midfield - 75) * 0.02);
                const dribbleControlMod = 1 + ((ratings.midfield - 75) * 0.025);
                playerModifiers.set(player.id, { speedMod, kickPowerMod, goalieReactionMod, strengthMod, tackleChanceMod, tackleForceMod, tackleRangeMod, midfieldMod, ratingSizeMod, dribbleControlMod });
            });
        }
        
        // --- Dribble Boost Logic ---
        if (ball) {
            objects.forEach(obj => {
                if (obj.team !== 'ball' && !obj.isGoalie) {
                    const cooldown = dribbleCooldowns.current.get(obj.id) || 0;
                    if (cooldown > 0) {
                        dribbleCooldowns.current.set(obj.id, cooldown - gameSpeed);
                        return;
                    }

                    const currentObjRadius = obj.radius * (obj.sizeModifier || 1);
                    const dribbleDistance = currentObjRadius + ball.radius + 15;
                    const dx = ball.position.x - obj.position.x;
                    const dy = ball.position.y - obj.position.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < dribbleDistance * dribbleDistance) {
                        const playerSpeed = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
                        if (playerSpeed > 0.5) { // Only dribble if player is moving
                            const modifiers = playerModifiers.get(obj.id);
                            const dribbleMod = (useRealRatings && modifiers?.dribbleControlMod) ? modifiers.dribbleControlMod : 1;
                            const finalDribbleForce = DRIBBLE_FORCE * dribbleMod;
                            
                            const boostX = (obj.velocity.x / playerSpeed) * finalDribbleForce;
                            const boostY = (obj.velocity.y / playerSpeed) * finalDribbleForce;
                            
                            ball.velocity.x += boostX;
                            ball.velocity.y += boostY;
                            
                            dribbleCooldowns.current.set(obj.id, DRIBBLE_COOLDOWN_FRAMES);
                        }
                    }
                }
            });
        }
        
        // --- Tackle/Lunge Logic ---
        if (ball) {
            objects.forEach(obj => {
                if (obj.team === 'ball' || obj.isGoalie || obj.isFrozen) return;

                const cooldown = tackleCooldowns.current.get(obj.id) || 0;
                if (cooldown > 0) {
                    tackleCooldowns.current.set(obj.id, cooldown - gameSpeed);
                    return;
                }
                const modifiers = playerModifiers.get(obj.id);
                let currentTackleDistance = (tackleDistance * fieldScale) * (modifiers?.tackleRangeMod || 1);
                if (obj.team === losingTeamId) {
                    currentTackleDistance *= 1.5; // Comeback tackle range boost
                }

                const dx = ball.position.x - obj.position.x;
                const dy = ball.position.y - obj.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < currentTackleDistance * currentTackleDistance) {
                    let tackleChance = BASE_TACKLE_CHANCE * (modifiers?.tackleChanceMod || 1);
                    if (obj.team === losingTeamId) {
                        tackleChance *= 1.8; // Comeback tackle chance boost
                    }
                    
                    if (Math.random() < tackleChance * gameSpeed) {
                        const dist = Math.sqrt(distSq) || 1;
                        const force = TACKLE_FORCE * (modifiers?.tackleForceMod || 1);
                        
                        obj.velocity.x += (dx / dist) * force;
                        obj.velocity.y += (dy / dist) * force;

                        for (let i = 0; i < 5; i++) {
                            newFrameParticles.push({
                                id: Date.now() + Math.random(),
                                x: obj.position.x,
                                y: obj.position.y,
                                vx: (Math.random() - 0.5) * 2 - obj.velocity.x * 0.1,
                                vy: (Math.random() - 0.5) * 2 - obj.velocity.y * 0.1,
                                life: 20 + Math.random() * 15, maxLife: 35,
                                size: Math.random() * 2 + 1,
                                color: obj.color,
                            });
                        }
                        tackleCooldowns.current.set(obj.id, TACKLE_COOLDOWN_FRAMES);
                    }
                }
            });
        }

        if (buffsEnabled) {
            const availableBuffsForSpawning = matchBuffs.filter(b => {
                const buffInfo = buffDefinitions[b];
                return !buffInfo?.permanent || !claimedPermanentBuffs.current.has(b);
            });
    
            if(availableBuffsForSpawning.length > 0) {
                buffSpawnCounter.current += gameSpeed;
                if (buffSpawnCounter.current >= BUFF_SPAWN_SECONDS * 60) {
                    buffSpawnCounter.current = 0;
                    if(buffsOnField.length < 4) {
                        const type = availableBuffsForSpawning[Math.floor(Math.random() * availableBuffsForSpawning.length)];
                        const newBuff: BuffObject = {
                            id: `buff-${Date.now()}`, type, radius: BUFF_RADIUS,
                            position: { x: 100 + Math.random() * (fieldW - 200), y: 50 + Math.random() * (fieldH - 100) }
                        };
                        setBuffsOnField(prev => [...prev, newBuff]);
                        onBuffSpawn(type);
                    }
                }
            }
        }

        setBuffsOnField(prev => prev.map(b => ({ ...b, trapDuration: (b.trapDuration || 0) - gameSpeed })).filter(b => !b.isTrap || (b.trapDuration || 0) > 0));

        onActiveBuffsChange(prev => prev.map(b => ({...b, duration: b.duration - gameSpeed})).filter(b => b.duration > 0));
        if (ballEffect) setBallEffect(prev => (prev && prev.duration > gameSpeed) ? { ...prev, duration: prev.duration - gameSpeed } : null);
        
        objects.forEach(obj => { 
            obj.sizeModifier = 1; obj.isGhost = false; obj.isConfused = false; obj.isFrozen = false;
            obj.isInvisible = false; obj.isBlinded = false; obj.repelsBall = false;
            
            let baseMass = obj.team === 'ball' ? selectedBall.mass : (obj.isGoalie ? PLAYER_MASS * 1.5 : PLAYER_MASS);
            if (useRealRatings && obj.team !== 'ball' && playerModifiers.has(obj.id)) {
                const modifiers = playerModifiers.get(obj.id)!;
                baseMass *= modifiers.strengthMod;
                if(modifiers.ratingSizeMod) {
                    obj.sizeModifier *= modifiers.ratingSizeMod;
                }
            }
            if (obj.team === losingTeamId) {
                baseMass *= 1.5; // Comeback mass boost
                obj.sizeModifier *= 1.25; // Comeback size boost
            }
            obj.mass = baseMass;

            if(obj.team !== 'ball' && !obj.trail) obj.trail = [];
        });
        
        activeBuffs.forEach(buff => {
            const players = objects.filter(o => o.team !== 'ball');
            const effectType = getEffectType(buff.type);
            switch (effectType) {
                case 'TEAM_GIANTS': players.forEach(p => { if (p.team === buff.team) p.sizeModifier *= 1.25; }); break;
                case 'SHRINK_OPPONENT': players.forEach(p => { if (p.team !== buff.team) p.sizeModifier *= 0.75; }); break;
                case 'DRIBLE_FANTASMA': players.forEach(p => { if (p.id === buff.affectedPlayerId) p.isGhost = true; }); break;
                case 'CONFUSE_RAY': players.forEach(p => { if (p.id === buff.affectedPlayerId) p.isConfused = true; }); break;
                case 'TEMP_RED_CARD': players.forEach(p => { if (p.id === buff.affectedPlayerId) p.isFrozen = true; }); break;
                case 'JOGADOR_CASCUDO': 
                    const veteran = players.find(p => p.id === buff.affectedPlayerId);
                    if(veteran) { veteran.mass *= 1.2; }
                    break;
                case 'GIANT_GOALIE':
                    const goalie = players.find(p => p.team === buff.team && p.isGoalie);
                    if(goalie) { goalie.sizeModifier *= 2.0; buff.affectedPlayerId = goalie.id; }
                    break;
                case 'GOLEIRO_ENCOLHIDO':
                    const shrunkenGoalie = players.find(p => p.team !== buff.team && p.isGoalie);
                    if(shrunkenGoalie) shrunkenGoalie.sizeModifier *= 0.6;
                    break;
                case 'CEGUEIRA_TEMPORARIA':
                    const blindedGoalie = players.find(p => p.team !== buff.team && p.isGoalie);
                    if(blindedGoalie) blindedGoalie.isBlinded = true;
                    break;
                case 'INVERSAO_DE_CONTROLES_GOLEIRO':
                    const confusedGoalie = players.find(p => p.team !== buff.team && p.isGoalie);
                    if(confusedGoalie) confusedGoalie.isConfused = true;
                    break;
                case 'IMAN_REVERSO':
                    const repellingGoalie = players.find(p => p.team !== buff.team && p.isGoalie);
                    if(repellingGoalie) repellingGoalie.repelsBall = true;
                    break;
            }
        });
        
        const ballEffectType = ballEffect ? getEffectType(ballEffect.type) : null;

        if (ballEffectType === 'BOLA_DE_CHUMBO') ball.mass = selectedBall.mass * 25;
        else if(ballEffectType === 'BOLA_DE_CANHÃO') ball.mass = selectedBall.mass * 10;
        // The base mass is already set, no need for an else here.

        if (ballEffectType === 'CHUTE_FANTASMA' && ballEffect) {
            const initialDuration = 240;
            const progress = (initialDuration - ballEffect.duration) / initialDuration;
            if (progress > 0.2 && progress < 0.8) {
                ball.isInvisible = true;
            }
        }
        if (ballEffectType === 'CHUTE_DE_DOIS_ESTAGIOS' && ballEffect) {
            const initialDuration = 240;
            if (ballEffect.duration === Math.floor(initialDuration * 0.5)) {
                ball.velocity.x *= 2.5;
                ball.velocity.y *= 2.5;
            }
        }

        if (ball && ballEffect && (ballEffectType === 'BULLDOZER_SHOT' || ballEffectType === 'CHUTE_TIGRE')) {
            const pushFactor = ballEffectType === 'CHUTE_TIGRE' ? 1.5 : 1;
            objects.forEach(obj => {
                if(obj.team !== 'ball' && obj.team !== ballEffect.fromTeam) {
                    const dx = obj.position.x - ball.position.x;
                    const dy = obj.position.y - ball.position.y;
                    const distSq = dx*dx + dy*dy;
                    const pushRadius = (ball.radius + 60)**2;
                    if(distSq < pushRadius && distSq > 1) {
                        const force = (120 / (distSq + 10)) * pushFactor;
                        obj.velocity.x += dx * force;
                        obj.velocity.y += dy * force;
                    }
                }
            });
        }
        
        activeBuffs.filter(b => getEffectType(b.type) === 'REPULSOR_FIELD').forEach(buff => {
            const repulsor = objects.find(o => o.id === buff.affectedPlayerId);
            if (!repulsor) return;
            objects.forEach(other => {
                if (other.team !== 'ball' && other.team !== buff.team) {
                    const dx = other.position.x - repulsor.position.x;
                    const dy = other.position.y - repulsor.position.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 120 * 120 && distSq > 1) {
                        const force = 60 / (distSq + 100);
                        other.velocity.x += dx * force;
                        other.velocity.y += dy * force;
                    }
                }
            });
        });

        const goalieInstinct = activeBuffs.find(b => getEffectType(b.type) === 'GOALIE_INSTINCT');
        if (goalieInstinct && ball) {
            const team = goalieInstinct.team;
            const isDanger = (team === teamA.id && (isVertical ? ball.velocity.y < -0.5 : ball.velocity.x < -0.5)) ||
                           (team === teamB.id && (isVertical ? ball.velocity.y > 0.5 : ball.velocity.x > 0.5));
            if(isDanger) {
                const defenders = objects.filter(o => o.team === team);
                if(defenders.length > 0) {
                    const defender = isVertical ? 
                        (team === teamA.id ? defenders.sort((a,b) => a.position.y - b.position.y)[0] : defenders.sort((a,b) => b.position.y - a.position.y)[0]) :
                        (team === teamA.id ? defenders.sort((a,b) => a.position.x - b.position.x)[0] : defenders.sort((a,b) => b.position.x - a.position.x)[0]);
                    
                    const targetX = isVertical ? ball.position.x : (team === teamA.id ? Math.max(ball.position.x, playerR * 3) : Math.min(ball.position.x, fieldW - playerR * 3));
                    const targetY = isVertical ? (team === teamA.id ? Math.max(ball.position.y, playerR * 3) : Math.min(ball.position.y, fieldH - playerR * 3)) : ball.position.y;
                    const dx = targetX - defender.position.x;
                    const dy = targetY - defender.position.y;
                    const dist = Math.sqrt(dx*dx+dy*dy);
                    if (dist > 1) {
                        defender.velocity.x += (dx/dist) * 0.8;
                        defender.velocity.y += (dy/dist) * 0.8;
                    }
                }
            }
        }
        
        const earthquakeBuff = activeBuffs.find(b => getEffectType(b.type) === 'TERREMOTO_NA_AREA');
        if (earthquakeBuff && ball) {
            const oppTeamId = earthquakeBuff.team === teamA.id ? teamB.id : teamA.id;
            const inOppArea = isVertical ? 
                (oppTeamId === teamA.id ? ball.position.y < paH : ball.position.y > fieldH - paH) :
                (oppTeamId === teamA.id ? ball.position.x < paW : ball.position.x > fieldW - paW);
            if(inOppArea) {
                if (!goalAnimation) setGoalAnimation({ timer: 1, scoringTeam: teamA.id, shake: screenShakeEnabled ? 10 : 0 });
            }
        }

        objects.forEach(obj => {
          if (obj.isFrozen) return;
          const objR = obj.radius * (obj.sizeModifier || 1);

          if (obj.isGoalie) {
              const penaltyAreaLimitY = isVertical ? paH : fieldH;
              const penaltyAreaLimitX = isVertical ? fieldW : paW;
                
              if(isVertical) {
                  obj.position.x = Math.max((fieldW-paW)/2 + objR, Math.min((fieldW+paW)/2 - objR, obj.position.x));
                  if (obj.team === teamA.id) obj.position.y = Math.max(objR, Math.min(paH - objR, obj.position.y));
                  else obj.position.y = Math.max(fieldH - paH + objR, Math.min(fieldH - objR, obj.position.y));
              } else {
                  obj.position.y = Math.max((fieldH - paH) / 2 + objR, Math.min((fieldH + paH) / 2 - objR, obj.position.y));
                  if (obj.team === teamA.id) obj.position.x = Math.max(objR, Math.min(paW - objR, obj.position.x));
                  else obj.position.x = Math.max(fieldW - paW + objR, Math.min(fieldW - objR, obj.position.y));
              }
          }

          let currentMaxSpeed = obj.isGoalie ? maxPlayerSpeed * goalieSpeed : maxPlayerSpeed;
          if(obj.team !== 'ball') {
            currentMaxSpeed *= (playerModifiers.get(obj.id)?.speedMod || 1);
            if (activeBuffs.some(b => getEffectType(b.type) === 'SPEED_ADVANTAGE' && b.team === obj.team)) currentMaxSpeed *= 1.5;
            if (activeBuffs.some(b => getEffectType(b.type) === 'SLOW_GAME' && b.team !== obj.team)) currentMaxSpeed *= 0.6;
            if (activeBuffs.some(b => getEffectType(b.type) === 'JOGADOR_CASCUDO' && b.affectedPlayerId === obj.id)) currentMaxSpeed *= 1.1;
            if (obj.team === losingTeamId) currentMaxSpeed *= 1.9; // Comeback speed boost
          }
          if(obj.isConfused && !obj.isGoalie) {
              obj.velocity.x += (Math.random() - 0.5) * 2;
              obj.velocity.y += (Math.random() - 0.5) * 2;
          }

          if(obj.team === 'ball') {
             obj.velocity.x *= obj.friction;
             obj.velocity.y *= obj.friction;
             if (selectedBall.name === 'De Efeito') {
                 const spin = 0.05 * (obj.velocity.x);
                 obj.velocity.y += spin * 0.1;
             }

             if(ballEffectType === 'HOMING_SHOT' && ballEffect) {
                const targetX = isVertical ? fieldW/2 : (ballEffect.fromTeam === teamA.id ? fieldW : 0);
                const targetY = isVertical ? (ballEffect.fromTeam === teamA.id ? fieldH : 0) : fieldH/2;
                const dx = targetX - obj.position.x, dy = targetY - obj.position.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist > 1) {
                    const homingStrength = 0.1; 
                    obj.velocity.x = (1 - homingStrength) * obj.velocity.x + homingStrength * (dx / dist) * maxPlayerSpeed * 1.5;
                    obj.velocity.y = (1 - homingStrength) * obj.velocity.y + homingStrength * (dy / dist) * maxPlayerSpeed * 1.5;
                }
             }
             if (ballEffectType === 'TIRO_DE_EFEITO' && ballEffect) {
                const shootingTowardsOpponentGoal = (ballEffect.fromTeam === teamA.id && (isVertical ? obj.velocity.y > 0.5 : obj.velocity.x > 0.5)) || 
                           (ballEffect.fromTeam === teamB.id && (isVertical ? obj.velocity.y < -0.5 : obj.velocity.x < -0.5));

                if (shootingTowardsOpponentGoal) {
                    const curveAxis = isVertical ? 'x' : 'y';
                    const speedAxis = isVertical ? 'y' : 'x';
                    const targetPos = isVertical ? fieldW/2 : fieldH/2;
                    const dCurve = targetPos - obj.position[curveAxis];
                    const curveStrength = 0.05 * Math.abs(obj.velocity[speedAxis]); 
                    if (Math.abs(dCurve) > 1) {
                        obj.velocity[curveAxis] += (dCurve / Math.abs(dCurve)) * curveStrength;
                    }
                }
             }
          }

          if (obj.isGoalie && ball) {
              const reactionFactor = obj.isBlinded ? 0.3 : (playerModifiers.get(obj.id)?.goalieReactionMod || 1);
              let effectiveGoalieIntelligence = goalieIntelligence;
              if (obj.team === losingTeamId) {
                  effectiveGoalieIntelligence *= 0.55; // Nerf: Goalie is less focused/reactive
              }

              const predictionFrames = (1 / (effectiveGoalieIntelligence * reactionFactor)) * 20;
              const targetX = ball.position.x + ball.velocity.x * predictionFrames;
              const targetY = ball.position.y + ball.velocity.y * predictionFrames;
              const dx = targetX - obj.position.x;
              const dy = targetY - obj.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 1) {
                  const goalieCurrentSpeed = Math.sqrt(obj.velocity.x**2 + obj.velocity.y**2);
                  const maxGoalieSpeed = maxPlayerSpeed * goalieSpeed;
                  const confusionFactor = (obj.isConfused ? -1 : 1);
                  obj.velocity.x += (dx / dist) * maxGoalieSpeed * 0.1 * confusionFactor;
                  obj.velocity.y += (dy / dist) * maxGoalieSpeed * 0.1 * confusionFactor;
              }
          }


          obj.position.x += obj.velocity.x * gameSpeed;
          obj.position.y += obj.velocity.y * gameSpeed;
          
          const speed = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
          if (obj.id !== 'ball' || !ballEffect) {
              if (speed > currentMaxSpeed) {
                  obj.velocity.x = (obj.velocity.x/speed) * currentMaxSpeed;
                  obj.velocity.y = (obj.velocity.y/speed) * currentMaxSpeed;
              }
          }
          if (speed < minPlayerSpeed && speed > 0 && !obj.isGoalie) {
              obj.velocity.x = (obj.velocity.x/speed) * minPlayerSpeed;
              obj.velocity.y = (obj.velocity.y/speed) * minPlayerSpeed;
          }
        });

        activeBuffs.filter(b => getEffectType(b.type) === 'MAGNETIC_BALL').forEach(buff => {
            if(!ball) return;
            objects.forEach(obj => {
                if (obj.team === buff.team) {
                    const dx = obj.position.x - ball.position.x, dy = obj.position.y - ball.position.y;
                    const distSq = dx*dx + dy*dy;
                    if (distSq < 300*300 && distSq > 1) {
                        const force = 40 / distSq;
                        ball.velocity.x += dx * force;
                        ball.velocity.y += dy * force;
                    }
                }
            });
        });

        objects.forEach(obj => {
            if (obj.repelsBall && ball) {
                const dx = ball.position.x - obj.position.x, dy = ball.position.y - obj.position.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 200 * 200 && distSq > 1) {
                    const force = 35 / distSq;
                    ball.velocity.x += dx * force;
                    ball.velocity.y += dy * force;
                }
            }
        });

        buffsOnField.filter(t => getEffectType(t.type) === 'GEL_ESCORREGADIO').forEach(trap => {
            objects.forEach(obj => {
                if (obj.isGoalie && obj.team !== trap.ownerTeam) {
                    const dx = obj.position.x - trap.position.x;
                    const dy = obj.position.y - trap.position.y;
                    if (dx*dx + dy*dy < trap.radius! * trap.radius!) {
                        obj.velocity.x += (Math.random() - 0.5) * 0.7;
                        obj.velocity.y += (Math.random() - 0.5) * 0.7;
                    }
                }
            });
        });
        
        const shrinkTargetingB = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHRINK' && b.team === teamA.id);
        const goalHeightA = shrinkTargetingB ? goalH * 0.6 : goalH;
        
        const shrinkTargetingA = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHRINK' && b.team === teamB.id);
        const goalHeightB = shrinkTargetingA ? goalH * 0.6 : goalH;

        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const objR = obj.radius * (obj.sizeModifier || 1);

            if (obj.isGoalie) {
                if (isVertical) {
                    obj.position.x = Math.max((fieldW - paW) / 2 + objR, Math.min((fieldW + paW) / 2 - objR, obj.position.x));
                    if (obj.team === teamA.id) obj.position.y = Math.max(objR, Math.min(paH - objR, obj.position.y));
                    else obj.position.y = Math.max(fieldH - paH + objR, Math.min(fieldH - objR, obj.position.y));
                } else {
                    obj.position.y = Math.max((fieldH - paH) / 2 + objR, Math.min((fieldH + paH) / 2 - objR, obj.position.y));
                    if (obj.team === teamA.id) obj.position.x = Math.max(objR, Math.min(paW - objR, obj.position.x));
                    else obj.position.x = Math.max(fieldW - paW + objR, Math.min(fieldW - objR, obj.position.x));
                }
            }

            if (obj.team === 'ball') {
                const shieldA = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHIELD' && b.team === teamA.id);
                const shieldB = activeBuffs.some(b => getEffectType(b.type) === 'GOAL_SHIELD' && b.team === teamB.id);
                const ghostHandA = activeBuffs.find(b => getEffectType(b.type) === 'MÃO_FANTASMA' && b.team === teamA.id);
                const ghostHandB = activeBuffs.find(b => getEffectType(b.type) === 'MÃO_FANTASMA' && b.team === teamB.id);
                
                const goalCheck = (isTeamA: boolean, goalHeight: number) => {
                    if(ballEffectType === 'BOMBA_DE_IMPACTO') { createExplosion(obj.position, 150, 40); setBallEffect(null); }
                    const ghostHand = isTeamA ? ghostHandA : ghostHandB;
                    if(ghostHand) {
                        onActiveBuffsChange(prev => prev.filter(b => b.id !== ghostHand.id));
                        if(isVertical) { obj.position.y = objR + 5; obj.velocity.y *= -2; }
                        else { obj.position.x = objR + 5; obj.velocity.x *= -2; }
                    } else if (!(isTeamA ? shieldA : shieldB)) {
                        handleGoalScored(isTeamA ? teamB.id : teamA.id);
                    } else {
                        if(isVertical) { obj.position.y = objR + 5; obj.velocity.y *= -1.2 * obj.bounciness; }
                        else { obj.position.x = objR + 5; obj.velocity.x *= -1.2 * obj.bounciness; }
                    }
                }
                
                if(isVertical) {
                    const goalX = (fieldW - goalHeightA)/2;
                    if(obj.position.x > goalX && obj.position.x < goalX + goalHeightA) {
                        if (obj.position.y - objR < 0) { goalCheck(true, goalHeightA); break; }
                        if (obj.position.y + objR > fieldH) { goalCheck(false, goalHeightB); break; }
                    }
                } else {
                    const goalY = (fieldH - goalHeightA)/2;
                    if (obj.position.y > goalY && obj.position.y < goalY + goalHeightA) {
                        if (obj.position.x - objR < 0) { goalCheck(true, goalHeightA); break; }
                    }
                    if (obj.position.y > (fieldH - goalHeightB)/2 && obj.position.y < (fieldH + goalHeightB)/2) {
                        if (obj.position.x + objR > fieldW) { goalCheck(false, goalHeightB); break; }
                    }
                }
            }
            
            if (obj.position.x < objR) { onPlaySfx('wallHit'); obj.position.x = objR; obj.velocity.x *= -1 * obj.bounciness; }
            if (obj.position.x > fieldW - objR) { onPlaySfx('wallHit'); obj.position.x = fieldW - objR; obj.velocity.x *= -1 * obj.bounciness; }
            if (obj.position.y < objR) { onPlaySfx('wallHit'); obj.position.y = objR; obj.velocity.y *= -1 * obj.bounciness; }
            if (obj.position.y > fieldH - objR) { onPlaySfx('wallHit'); obj.position.y = fieldH - objR; obj.velocity.y *= -1 * obj.bounciness; }

            for (let j = i + 1; j < objects.length; j++) {
                const other = objects[j];
                const otherR = other.radius * (other.sizeModifier || 1);
                
                if ((obj.isGhost || other.isGhost) && (obj.team !== 'ball' && other.team !== 'ball')) continue;

                const player = obj.team === 'ball' ? other : obj;
                const theBall = obj.team === 'ball' ? obj : other;
                if (player.isGoalie && theBall.team === 'ball' && ballEffectType === 'BROCA_GIRATORIA' && Math.random() < 0.4) {
                    continue; 
                }

                const dx = other.position.x - obj.position.x, dy = other.position.y - obj.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = objR + otherR;
                if (distance < minDistance) {
                    const overlap = (minDistance - distance) / distance;
                    const moveX = (dx * overlap) / 2, moveY = (dy * overlap) / 2;
                    obj.position.x -= moveX; obj.position.y -= moveY;
                    other.position.x += moveX; other.position.y += moveY;
                    const normalX = dx / distance, normalY = dy / distance;
                    const kx = obj.velocity.x - other.velocity.x, ky = obj.velocity.y - other.velocity.y;
                    const p = 2.0 * (normalX * kx + normalY * ky) / (obj.mass + other.mass);
                    const oldObjVx = obj.velocity.x, oldObjVy = obj.velocity.y;
                    obj.velocity = { x: obj.velocity.x - p * other.mass * normalX, y: obj.velocity.y - p * other.mass * normalY };
                    other.velocity = { x: other.velocity.x + p * obj.mass * normalX, y: other.velocity.y + p * obj.mass * normalY };
                    
                    // NEW LOGIC: Goalkeeper save physics
                    const goalie = obj.isGoalie ? obj : (other.isGoalie ? other : null);
                    if (goalie && (obj.team === 'ball' || other.team === 'ball')) {
                        const ballToModify = obj.team === 'ball' ? obj : other;
                        
                        // Increase ball speed on save
                        ballToModify.velocity.x *= 2.5;
                        ballToModify.velocity.y *= 2.5;

                        // Prevent own goals by ensuring the ball reflects away from the goal line
                        const isGoalieA = goalie.team === teamA.id;
                        
                        if (isVertical) {
                            // Goalie A's goal is at y=0. If ball moves towards it (y velocity < 0), reflect it.
                            if (isGoalieA && ballToModify.velocity.y < 0) {
                                ballToModify.velocity.y *= -1;
                            }
                            // Goalie B's goal is at y=fieldH. If ball moves towards it (y velocity > 0), reflect it.
                            else if (!isGoalieA && ballToModify.velocity.y > 0) {
                                ballToModify.velocity.y *= -1;
                            }
                        } else { // Horizontal layout
                            // Goalie A's goal is at x=0. If ball moves towards it (x velocity < 0), reflect it.
                            if (isGoalieA && ballToModify.velocity.x < 0) {
                                ballToModify.velocity.x *= -1;
                            }
                            // Goalie B's goal is at x=fieldW. If ball moves towards it (x velocity > 0), reflect it.
                            else if (!isGoalieA && ballToModify.velocity.x > 0) {
                                ballToModify.velocity.x *= -1;
                            }
                        }
                    }

                    if(player.team !== 'ball' && theBall.team === 'ball') {
                        const impactMagnitude = Math.sqrt((obj.velocity.x - oldObjVx)**2 + (obj.velocity.y - oldObjVy)**2);
                        if (impactMagnitude > 1.5) { // Threshold for effect
                            onPlaySfx('ballTouch'); // Play sound effect
                            const numParticles = Math.min(15, Math.floor(impactMagnitude * 2));
                            const teamInfo = player.team === teamA.id ? teamA : teamB;
                            for (let k = 0; k < numParticles; k++) {
                                const impactAngle = Math.atan2(dy, dx);
                                const randomAngle = impactAngle + Math.PI + (Math.random() - 0.5) * Math.PI; 
                                const speed = Math.random() * impactMagnitude * 0.4;
                                newFrameParticles.push({
                                    id: Date.now() + Math.random(),
                                    x: theBall.position.x - normalX * theBall.radius, 
                                    y: theBall.position.y - normalY * theBall.radius,
                                    vx: Math.cos(randomAngle) * speed, 
                                    vy: Math.sin(randomAngle) * speed,
                                    life: 20 + Math.random() * 20, 
                                    maxLife: 40,
                                    size: Math.random() * 2 + 1,
                                    color: teamInfo.color2
                                });
                            }
                        }

                        if(statsRef.current[player.team]) {
                            lastTouchedByTeam.current = player.team;
                            statsRef.current[player.team].touches++;

                            if(player.isGoalie && lastTouchedByTeam.current && lastTouchedByTeam.current !== player.team) {
                                statsRef.current[player.team].saves++;
                                if (statsRef.current[lastTouchedByTeam.current]) {
                                    statsRef.current[lastTouchedByTeam.current].shotsOnTarget++;
                                }
                            }

                            const kickStrength = Math.sqrt(player.velocity.x**2 + player.velocity.y**2);
                            const isShot = kickStrength > maxPlayerSpeed * 0.8 || autoShootEnabled;
                            if (isShot) {
                                const isTowardsOpponentGoal = isVertical ? 
                                    (player.team === teamA.id ? theBall.velocity.y > 1 : theBall.velocity.y < -1) :
                                    (player.team === teamA.id ? theBall.velocity.x > 1 : theBall.velocity.x < -1);
                                
                                if (isTowardsOpponentGoal) {
                                    statsRef.current[player.team].shots++;
                                }
                            }
                        }

                        if(ballEffect && ballEffectType === 'BOMBA_DE_IMPACTO' && ballEffect.fromTeam !== player.team) {
                            createExplosion(theBall.position, 150, 40);
                            setBallEffect(null);
                        }
                    }

                    if (autoShootEnabled && player.team !== 'ball' && theBall.team === 'ball' && !player.isGoalie) {
                        const kickPowerMod = playerModifiers.get(player.id)?.kickPowerMod || 1;
                        const midfieldMod = playerModifiers.get(player.id)?.midfieldMod || 1;

                        const opponentTeamId = player.team === teamA.id ? teamB.id : teamA.id;
                        const targetGoalX = isVertical ? fieldW / 2 : (player.team === teamA.id ? fieldW : 0);
                        const targetGoalY = isVertical ? (player.team === teamA.id ? fieldH : 0) : fieldH / 2;
                        const opponentGoalPos = { x: targetGoalX, y: targetGoalY };
                        
                        // Find potential pass targets
                        const teammates = objects.filter(o => o.team === player.team && o.id !== player.id && !o.isGoalie);
                        const potentialPasses = teammates.map(t => {
                            const distToGoal = Math.hypot(t.position.x - opponentGoalPos.x, t.position.y - opponentGoalPos.y);
                            const playerDistToGoal = Math.hypot(player.position.x - opponentGoalPos.x, player.position.y - opponentGoalPos.y);
                            
                            if (distToGoal >= playerDistToGoal - playerR) return { target: t, score: -1 }; // Don't pass backwards or sideways

                            let score = (playerDistToGoal - distToGoal) * 0.5; // Reward for forward progress

                            const opponents = objects.filter(o => o.team === opponentTeamId);
                            const closestOpponentDist = Math.min(...opponents.map(o => Math.hypot(o.position.x - t.position.x, o.position.y - t.position.y)));
                            if (closestOpponentDist < playerR * 4) score -= (playerR * 5 - closestOpponentDist); // Penalize for being marked
                            else score += 50; // Reward for being open

                            const passDx = t.position.x - player.position.x;
                            const passDy = t.position.y - player.position.y;
                            const passDist = Math.hypot(passDx, passDy);
                            let interceptions = 0;
                            opponents.forEach(o => {
                                const dot = (((o.position.x - player.position.x) * passDx) + ((o.position.y - player.position.y) * passDy)) / (passDist * passDist);
                                if (dot > 0 && dot < 1) {
                                    const closestX = player.position.x + (dot * passDx);
                                    const closestY = player.position.y + (dot * passDy);
                                    if (Math.hypot(o.position.x - closestX, o.position.y - closestY) < playerR * 2) interceptions++;
                                }
                            });
                            score -= interceptions * 100;

                            return { target: t, score: score * midfieldMod };
                        }).sort((a, b) => b.score - a.score);

                        const bestPass = potentialPasses.length > 0 && potentialPasses[0].score > 40 ? potentialPasses[0] : null;

                        const playerDistToGoal = Math.hypot(player.position.x - opponentGoalPos.x, player.position.y - opponentGoalPos.y);
                        const isGoodShotPosition = playerDistToGoal < fieldW * 0.45;
                        
                        let decision = 'dribble';
                        if (isGoodShotPosition && (!bestPass || playerDistToGoal < Math.hypot(bestPass.target.position.x - opponentGoalPos.x, bestPass.target.position.y - opponentGoalPos.y))) {
                            decision = 'shoot';
                        } else if (bestPass) {
                            decision = 'pass';
                        }

                        let kickDirection = { x: 0, y: 0 };
                        let kickForce = 0;

                        switch(decision) {
                            case 'shoot': {
                                // Aim with slight inaccuracy based on kick power
                                const shotInaccuracy = 150 / kickPowerMod; // Higher power = less spread. 150 is a magic number for pixel spread.
                                const targetGoalPostOffset = (Math.random() - 0.5) * goalH * 0.8; // Aim somewhere between the posts, not just center
                                
                                const targetX = opponentGoalPos.x + (isVertical ? targetGoalPostOffset : 0) + (Math.random() - 0.5) * shotInaccuracy;
                                const targetY = opponentGoalPos.y + (isVertical ? 0 : targetGoalPostOffset) + (Math.random() - 0.5) * shotInaccuracy;

                                kickDirection = { x: targetX - theBall.position.x, y: targetY - theBall.position.y };
                                kickForce = 6 * kickPowerMod;
                                if (player.team === losingTeamId) kickForce *= 1.8;
                                break;
                            }
                            case 'pass':
                                if (bestPass) {
                                    kickDirection = { x: bestPass.target.position.x - theBall.position.x, y: bestPass.target.position.y - theBall.position.y };
                                    kickForce = 4.5 * midfieldMod;
                                }
                                break;
                            default: { // dribble
                                const forwardDirection = { x: isVertical ? 0 : (player.team === teamA.id ? 1 : -1), y: isVertical ? (player.team === teamA.id ? 1 : -1) : 0 };
                                const dribbleRandomness = 0.3 / midfieldMod; // Less randomness for higher midfield
                                kickDirection = { x: forwardDirection.x + (Math.random() - 0.5) * dribbleRandomness, y: forwardDirection.y + (Math.random() - 0.5) * dribbleRandomness };
                                kickForce = 2.5;
                                break;
                            }
                        }
                        const norm = Math.hypot(kickDirection.x, kickDirection.y) || 1;
                        theBall.velocity.x += (kickDirection.x / norm) * kickForce;
                        theBall.velocity.y += (kickDirection.y / norm) * kickForce;
                    }

                    if(player.team !== 'ball' && theBall.team === 'ball') {
                        const teleportBuff = activeBuffs.find(b => b.team === player.team && getEffectType(b.type) === 'TELEPORT_DRIBBLE' && b.affectedPlayerId === player.id);
                        if(teleportBuff) {
                            const teleportDistance = 150;
                            const speed = Math.sqrt(player.velocity.x**2 + player.velocity.y**2) || 1;
                            player.position.x += (player.velocity.x / speed) * teleportDistance;
                            player.position.y += (player.velocity.y / speed) * teleportDistance;
                            player.position.x = Math.max(player.radius, Math.min(fieldW - player.radius, player.position.x));
                            player.position.y = Math.max(player.radius, Math.min(fieldH - player.radius, player.position.y));
                            onActiveBuffsChange(prev => prev.filter(b => b.id !== teleportBuff.id));
                        }
                        const shotBuffTypes: BuffType[] = ['FIREBALL_SHOT', 'HOMING_SHOT', 'BULLDOZER_SHOT', 'CHUTE_TIGRE', 'FURACAO_DE_FOGO', 'TIRO_DE_EFEITO', 'BOLA_DE_CANHÃO', 'CHUTE_COMETA', 'BOMBA_DE_IMPACTO', 'CHUTE_FANTASMA', 'BROCA_GIRATORIA', 'CHUTE_DE_DOIS_ESTAGIOS', 'BOLA_DE_CHUMBO'];
                        const shotBuff = activeBuffs.find(b => b.team === player.team && shotBuffTypes.includes(getEffectType(b.type)) && b.affectedPlayerId === player.id);
                        if (shotBuff) {
                             const effectType = getEffectType(shotBuff.type);
                             setBallEffect({ type: shotBuff.type, duration: 240, fromTeam: player.team as Team });
                             const factors: Partial<Record<BuffType, number>> = { 'FIREBALL_SHOT': 2.0, 'HOMING_SHOT': 1.5, 'CHUTE_TIGRE': 3.0, 'FURACAO_DE_FOGO': 2.5, 'CHUTE_COMETA': 4.0 };
                             let factor = factors[effectType];
                             if(factor) {
                                factor *= (playerModifiers.get(player.id)?.kickPowerMod || 1);
                                const speed = Math.sqrt(theBall.velocity.x**2 + theBall.velocity.y**2) || 1;
                                theBall.velocity.x = (theBall.velocity.x / speed) * maxPlayerSpeed * factor;
                                theBall.velocity.y = (theBall.velocity.y / speed) * maxPlayerSpeed * factor;
                             }
                             onActiveBuffsChange(prev => prev.filter(b => b.id !== shotBuff.id));
                        }
                    }
                }
            }

            if (obj.team !== 'ball') { 
                const playerTeamId = obj.team as Team;
                buffsOnField.forEach(trap => {
                    if (trap.isTrap && trap.ownerTeam && trap.ownerTeam !== playerTeamId) {
                        const dx = trap.position.x - obj.position.x;
                        const dy = trap.position.y - obj.position.y;
                        if (Math.sqrt(dx * dx + dy * dy) < objR + trap.radius) {
                            onActiveBuffsChange(prev => [...prev, {
                                id: `active-trap-${Date.now()}`, team: playerTeamId, type: 'TEMP_RED_CARD',
                                duration: 3 * 60, initialDuration: 3 * 60, affectedPlayerId: obj.id
                            }]);
                            setBuffsOnField(prev => prev.filter(b => b.id !== trap.id));
                        }
                    }
                });

                buffsOnField.forEach(buff => {
                    if (buff.isTrap) return;
                    const dx = buff.position.x - obj.position.x, dy = buff.position.y - obj.position.y;
                    if (Math.sqrt(dx * dx + dy * dy) < objR + buff.radius) {
                        onPlaySfx('buffPickup');
                        const buffInfo = buffDefinitions[buff.type];
                        if (!buffInfo) return;
                        setBuffsOnField(prev => prev.filter(b => b.id !== buff.id));
                        const collectingTeamInfo = obj.team === teamA.id ? teamA : teamB;
                        onBuffPickup(collectingTeamInfo, buff.type);

                        if (!seenBuffs.has(buff.type)) {
                            onFirstBuffPickup(buff.type, collectingTeamInfo);
                        }

                        if (buffInfo.permanent) {
                            claimedPermanentBuffs.current.add(buff.type);
                        }

                        const effectType = getEffectType(buff.type);

                        let affectedPlayerId = obj.id;
                        // Special cases for buffs that target opponents
                        if (effectType === 'CONFUSE_RAY' || effectType === 'TEMP_RED_CARD') {
                            const opponentTeamId = obj.team === teamA.id ? teamB.id : teamA.id;
                            const opponents = objects.filter(o => o.team === opponentTeamId && !o.isGoalie);
                            if (opponents.length > 0) {
                                affectedPlayerId = opponents[Math.floor(Math.random() * opponents.length)].id;
                            }
                        }

                        // Buffs with immediate, one-off effects
                        if (effectType === 'SWAP_PLAYER') {
                            const opponentTeamId = obj.team === teamA.id ? teamB.id : teamA.id;
                            const opponents = objects.filter(o => o.team === opponentTeamId && !o.isGoalie);
                            if (opponents.length > 0) {
                                const opponentToSwap = opponents[Math.floor(Math.random() * opponents.length)];
                                const tempPos = obj.position;
                                obj.position = opponentToSwap.position;
                                opponentToSwap.position = tempPos;
                            }
                        } else if (effectType === 'ZONA_MORTA') {
                            setBuffsOnField(prev => [...prev, {
                                ...buff,
                                isTrap: true,
                                trapDuration: buffInfo.duration,
                                ownerTeam: obj.team as Team,
                                position: { ...obj.position },
                            }]);
                        } else if (effectType === 'GEL_ESCORREGADIO') {
                            const opponentGoalPos = isVertical ?
                                (obj.team === teamA.id ? {x: fieldW / 2, y: fieldH - paH/2} : {x: fieldW/2, y: paH/2}) :
                                (obj.team === teamA.id ? {x: fieldW - paW/2, y: fieldH/2} : {x: paW/2, y: fieldH/2});
                            setBuffsOnField(prev => [...prev, {
                                ...buff,
                                isTrap: true,
                                trapDuration: buffInfo.duration,
                                ownerTeam: obj.team as Team,
                                position: opponentGoalPos,
                                radius: 100 * fieldScale,
                            }]);
                        } else if (effectType === 'EMPURRAR_LINHA') {
                            const opponentTeamId = obj.team === teamA.id ? teamB.id : teamA.id;
                            const pushAmount = isVertical ? 150 * (opponentTeamId === teamA.id ? -1 : 1) : 150 * (opponentTeamId === teamA.id ? -1 : 1);
                             objects.forEach(o => {
                                if (o.team === opponentTeamId && !o.isGoalie) {
                                    if (isVertical) o.position.y += pushAmount;
                                    else o.position.x += pushAmount;
                                }
                            });
                        } else if (effectType === 'PURA_ENERGIA') {
                            // remove negative effects
                            onActiveBuffsChange(prev => prev.filter(b => {
                                const bInfo = buffDefinitions[b.type];
                                return b.team !== obj.team || (bInfo && bInfo.type !== 'defense');
                            }));
                             // give small boost
                            objects.forEach(o => {
                                if (o.team === obj.team) {
                                    o.velocity.x *= 1.2;
                                    o.velocity.y *= 1.2;
                                }
                            });
                        } else {
                            // Default behavior: add buff to active list
                            onActiveBuffsChange(prev => [...prev, {
                                id: `active-${buff.type}-${Date.now()}`,
                                team: obj.team as Team,
                                type: buff.type,
                                duration: buffInfo.duration,
                                initialDuration: buffInfo.duration,
                                affectedPlayerId: affectedPlayerId,
                            }]);
                        }
                    }
                });
            }
        }
    }
    
    ctx.clearRect(0, 0, fieldW, fieldH);
    
    ctx.save();
    if(goalAnimation && goalAnimation.shake > 0) {
        ctx.translate(Math.random() * goalAnimation.shake - goalAnimation.shake/2, Math.random() * goalAnimation.shake - goalAnimation.shake/2);
    }
    
    drawField(ctx);
    
    buffsOnField.forEach(b => drawBuff(ctx, b));

    gameObjectsRef.current.sort((a,b) => (a.isGoalie ? -1 : 1) - (b.isGoalie ? -1 : 1)).forEach(obj => {
        if(obj.team !== 'ball') drawObject(ctx, obj, losingTeamId);
    });
    
    const ball = gameObjectsRef.current.find(o => o.team === 'ball');
    if(ball) drawObject(ctx, ball, losingTeamId);
    
    drawShield(ctx, teamA.id);
    drawShield(ctx, teamB.id);

    if(newFrameParticles.length > 0) {
        setParticles(prev => [...prev, ...newFrameParticles]);
    }
    updateAndDrawParticles(ctx);

    ctx.restore();

    drawOverlay(ctx);

    if (recordMatch && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        const recCtx = recordingCanvasRef.current.getContext('2d');
        if (recCtx) {
            recCtx.clearRect(0, 0, recordingCanvasRef.current.width, recordingCanvasRef.current.height);
            recCtx.drawImage(canvas, 0, 0, recordingCanvasRef.current.width, recordingCanvasRef.current.height);
        }
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [
    isGameActive, isPaused, teamA, teamB, handleGoalScored, effectiveDimensions, buffDefinitions,
    onActiveBuffsChange, activeBuffs, buffSpawnCounter, buffsOnField, ballEffect, onBuffPickup,
    onBuffSpawn, onFirstBuffPickup, autoShootEnabled, setMatchStats, matchLayout,
    useRealRatings, classicModeEnabled, homeTeamId, goalieIntelligence, goalieSpeed,
    fieldScale, playerSize, ballSize, tackleDistance, minPlayerSpeed, maxPlayerSpeed,
    selectedBall, onPlaySfx, resetGame, losingTeamId, gameSpeed, recordMatch, score, gameTime,
    winner, screenShakeEnabled, seenBuffs, countdown, getEffectType, goalAnimation,
    isBallInPenaltyAreaRef, customBallIcon
  ]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={effectiveDimensions.fieldW}
      height={effectiveDimensions.fieldH}
      className="rounded-lg shadow-2xl border-2 border-cyan-400/20"
      style={{
        boxShadow: '0 0 25px rgba(56, 189, 248, 0.1)',
        width: '100%',
        aspectRatio: `${effectiveDimensions.fieldW} / ${effectiveDimensions.fieldH}`,
        touchAction: 'none'
      }}
    />
  );
};
