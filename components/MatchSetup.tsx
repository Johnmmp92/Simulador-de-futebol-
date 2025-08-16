

import React, { useState, useRef, ChangeEvent, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { TeamInfo, BuffType, BuffInfo, Team, MatchLayout, BallDefinition } from '../types';
import { BUFF_DEFINITIONS, PLAYER_RADIUS, BALL_RADIUS, BALL_DEFINITIONS, DEFAULT_MAX_PLAYER_SPEED, DEFAULT_MIN_PLAYER_SPEED, INITIAL_TEAMS } from '../constants';
import VersusArt from './VersusArt';
import { AddTeamModal } from './AddTeamModal';

const Spinner: React.FC<{ size?: string }> = ({ size = '8' }) => (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-cyan-400`}></div>
);

type SettingsModalComponentProps = {
    isOpen: boolean;
    onClose: () => void;
    onResetSettings: () => void;
    recordMatch: boolean;
    onRecordMatchChange: (value: boolean) => void;
    recordingAspectRatio: '16:9' | '9:16';
    onAspectRatioChange: (value: '16:9' | '9:16') => void;
    buffsEnabled: boolean;
    onBuffsEnabledChange: (value: boolean) => void;
    showBuffTutorial: boolean;
    onShowBuffTutorialChange: (value: boolean) => void;
    autoShootEnabled: boolean;
    onAutoShootEnabledChange: (value: boolean) => void;
    matchDurationSeconds: number;
    onMatchDurationSecondsChange: (value: number) => void;
    screenShakeEnabled: boolean;
    onScreenShakeChange: (value: boolean) => void;
    gameSpeed: number;
    onGameSpeedChange: (value: number) => void;
    useRealRatings: boolean;
    onUseRealRatingsChange: (value: boolean) => void;
    classicModeEnabled: boolean;
    onClassicModeEnabledChange: (value: boolean) => void;
    homeTeamId: Team | null;
    onHomeTeamIdChange: (value: Team | null) => void;
    goalieIntelligence: number;
    onGoalieIntelligenceChange: (value: number) => void;
    goalieSpeed: number;
    onGoalieSpeedChange: (value: number) => void;
    matchLayout: MatchLayout;
    onMatchLayoutChange: (value: MatchLayout) => void;
    fieldScale: number;
    onFieldScaleChange: (value: number) => void;
    playerSize: number;
    onPlayerSizeChange: (value: number) => void;
    ballSize: number;
    onBallSizeChange: (value: number) => void;
    goalHeight: number;
    onGoalHeightChange: (value: number) => void;
    goalieSize: number;
    onGoalieSizeChange: (value: number) => void;
    tackleDistance: number;
    onTackleDistanceChange: (value: number) => void;
    scoreboardOffset: number;
    onScoreboardOffsetChange: (value: number) => void;
    gameFieldOffset: number;
    onGameFieldOffsetChange: (value: number) => void;
    minPlayerSpeed: number;
    onMinPlayerSpeedChange: (value: number) => void;
    maxPlayerSpeed: number;
    onMaxPlayerSpeedChange: (value: number) => void;
    selectedBall: BallDefinition;
    onSelectedBallChange: (value: BallDefinition) => void;
    scoreboardScale: number;
    onScoreboardScaleChange: (value: number) => void;
    customBallIcon: string | null;
    onCustomBallIconChange: (value: string | null) => void;
    teamA: TeamInfo;
    teamB: TeamInfo;
    // Audio props
    musicFile: string | null;
    onMusicFileChange: (value: string | null) => void;
    musicVolume: number;
    onMusicVolumeChange: (value: number) => void;
    ambianceFile: string | null;
    onAmbianceFileChange: (value: string | null) => void;
    ambianceVolume: number;
    onAmbianceVolumeChange: (value: number) => void;
    sfxVolume: number;
    onSfxVolumeChange: (value: number) => void;
    sfx: Record<string, string | null>;
    onSfxChange: (value: Record<string, string | null>) => void;
};

const SettingsModal: React.FC<SettingsModalComponentProps> = ({ isOpen, onClose, ...props }) => {
    const [activeTab, setActiveTab] = useState<'visuals' | 'gameplay' | 'general' | 'audio'>('visuals');
    
    const [durationMinutes, setDurationMinutes] = useState(String(Math.floor(props.matchDurationSeconds / 60)));
    const [durationSecondsInput, setDurationSecondsInput] = useState(String(props.matchDurationSeconds % 60).padStart(2, '0'));

    useEffect(() => {
        setDurationMinutes(String(Math.floor(props.matchDurationSeconds / 60)));
        setDurationSecondsInput(String(props.matchDurationSeconds % 60).padStart(2, '0'));
    }, [props.matchDurationSeconds]);

    const handleDurationBlur = () => {
        let minutes = Number(durationMinutes) || 0;
        let seconds = Number(durationSecondsInput) || 0;
        if (seconds > 59) {
            minutes += Math.floor(seconds / 60);
            seconds %= 60;
        }
        let total = (minutes * 60) + seconds;
        total = Math.max(10, Math.min(600, total));
        props.onMatchDurationSecondsChange(total);
    };

    if (!isOpen) return null;
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    callback(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            callback(null);
        }
    };
    
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    callback(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            callback(null);
        }
    };

    const AudioFileInput: React.FC<{
        label: string;
        file: string | null;
        onFileChange: (dataUrl: string | null) => void;
    }> = ({ label, file, onFileChange }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        return (
            <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                <span className="font-semibold text-white">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs italic ${file ? 'text-green-400' : 'text-gray-400'}`}>{file ? 'Carregado' : 'Nenhum'}</span>
                    <button onClick={() => inputRef.current?.click()} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md">Carregar</button>
                    {file && (
                      <button onClick={() => onFileChange(null)} className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md">X</button>
                    )}
                    <input type="file" accept="audio/*" ref={inputRef} className="hidden" onChange={(e) => handleFileChange(e, onFileChange)} />
                </div>
            </div>
        );
    };

    const SfxInput: React.FC<{ sfxKey: string, label: string }> = ({ sfxKey, label }) => {
        return (
            <AudioFileInput
                label={label}
                file={props.sfx[sfxKey]}
                onFileChange={(dataUrl) => props.onSfxChange({ ...props.sfx, [sfxKey]: dataUrl })}
            />
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'visuals':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2 flex flex-col justify-center items-center gap-2 text-lg">
                            <label className="font-semibold text-white">Layout da Partida</label>
                            <div className="flex items-center gap-4 bg-gray-700/50 p-2 rounded-lg">
                                 <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="matchLayout" value="horizontal" checked={props.matchLayout === 'horizontal'} onChange={() => props.onMatchLayoutChange('horizontal')} className="w-5 h-5 accent-cyan-400" />
                                    <span className="text-white">Horizontal</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="matchLayout" value="vertical" checked={props.matchLayout === 'vertical'} onChange={() => props.onMatchLayoutChange('vertical')} className="w-5 h-5 accent-cyan-400" />
                                    <span className="text-white">Vertical</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="field-scale-slider" className="font-semibold text-white flex justify-between"><span>Tamanho do Campo</span><span className="font-bold text-cyan-300">{(props.fieldScale * 100).toFixed(0)}%</span></label>
                            <input id="field-scale-slider" type="range" min="0.8" max="1.2" step="0.05" value={props.fieldScale} onChange={(e) => props.onFieldScaleChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="player-size-slider" className="font-semibold text-white flex justify-between"><span>Tamanho do Jogador</span><span className="font-bold text-cyan-300">{props.playerSize}px</span></label>
                            <input id="player-size-slider" type="range" min={PLAYER_RADIUS * 0.75} max={PLAYER_RADIUS * 1.5} step="1" value={props.playerSize} onChange={(e) => props.onPlayerSizeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="ball-size-slider" className="font-semibold text-white flex justify-between"><span>Tamanho da Bola</span><span className="font-bold text-cyan-300">{props.ballSize}px</span></label>
                            <input id="ball-size-slider" type="range" min={BALL_RADIUS * 0.75} max={BALL_RADIUS * 1.5} step="1" value={props.ballSize} onChange={(e) => props.onBallSizeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="goal-height-slider" className="font-semibold text-white flex justify-between"><span>Altura do Gol</span><span className="font-bold text-cyan-300">{props.goalHeight}</span></label>
                            <input id="goal-height-slider" type="range" min="120" max="240" step="5" value={props.goalHeight} onChange={(e) => props.onGoalHeightChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="goalie-size-slider" className="font-semibold text-white flex justify-between"><span>Tamanho do Goleiro</span><span className="font-bold text-cyan-300">{props.goalieSize}px</span></label>
                            <input id="goalie-size-slider" type="range" min="20" max="50" step="1" value={props.goalieSize} onChange={(e) => props.onGoalieSizeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="scoreboard-scale-slider" className="font-semibold text-white flex justify-between"><span>Escala do Placar</span><span className="font-bold text-cyan-300">{(props.scoreboardScale * 100).toFixed(0)}%</span></label>
                            <input id="scoreboard-scale-slider" type="range" min="0.75" max="1.25" step="0.05" value={props.scoreboardScale} onChange={(e) => props.onScoreboardScaleChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="scoreboard-offset-slider" className="font-semibold text-white flex justify-between"><span>Espaçamento do Placar</span><span className="font-bold text-cyan-300">{props.scoreboardOffset}px</span></label>
                            <input id="scoreboard-offset-slider" type="range" min="-50" max="50" step="1" value={props.scoreboardOffset} onChange={(e) => props.onScoreboardOffsetChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="gamefield-offset-slider" className="font-semibold text-white flex justify-between"><span>Espaçamento do Campo</span><span className="font-bold text-cyan-300">{props.gameFieldOffset}px</span></label>
                            <input id="gamefield-offset-slider" type="range" min="-50" max="50" step="1" value={props.gameFieldOffset} onChange={(e) => props.onGameFieldOffsetChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="md:col-span-2 flex flex-col justify-center gap-2 p-3 mt-2 bg-gray-900/40 rounded-lg border border-gray-700/50">
                            <label className="font-semibold text-white text-lg">Ícone Personalizado da Bola</label>
                            <div className="flex items-center gap-3">
                                {props.customBallIcon ? (
                                    <img src={props.customBallIcon} alt="Ícone da bola" className="w-10 h-10 rounded-full bg-white object-contain" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">?</div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    id="ball-icon-upload" 
                                    className="hidden" 
                                    onChange={(e) => handleImageFileChange(e, props.onCustomBallIconChange)} 
                                />
                                <label htmlFor="ball-icon-upload" className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">
                                    Carregar
                                </label>
                                {props.customBallIcon && (
                                    <button onClick={() => props.onCustomBallIconChange(null)} className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg">
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'gameplay':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/50">
                            <label className="flex items-center gap-3 cursor-pointer text-lg">
                                <input type="checkbox" checked={props.buffsEnabled} onChange={(e) => props.onBuffsEnabledChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                                <span className="font-semibold text-white">Habilitar Buffs</span>
                            </label>
                            {props.buffsEnabled && (
                                <label className="flex items-center gap-3 cursor-pointer text-lg">
                                    <input type="checkbox" checked={props.showBuffTutorial} onChange={(e) => props.onShowBuffTutorialChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                                    <span className="font-semibold text-white">Mostrar Tutorial de Buffs</span>
                                </label>
                            )}
                        </div>
                         <label className="flex items-center gap-3 cursor-pointer text-lg">
                            <input type="checkbox" checked={props.autoShootEnabled} onChange={(e) => props.onAutoShootEnabledChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                            <span className="font-semibold text-white">Chute Automático (IA)</span>
                        </label>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="game-speed-slider" className="font-semibold text-white flex justify-between"><span>Velocidade do Jogo</span><span className="font-bold text-cyan-300">{props.gameSpeed.toFixed(1)}x</span></label>
                            <input id="game-speed-slider" type="range" min="0.5" max="3" step="0.1" value={props.gameSpeed} onChange={(e) => props.onGameSpeedChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="min-speed-slider" className="font-semibold text-white flex justify-between"><span>Velocidade Mínima do Jogador</span><span className="font-bold text-cyan-300">{props.minPlayerSpeed.toFixed(2)}</span></label>
                             <input id="min-speed-slider" type="range" min="0" max={props.maxPlayerSpeed} step="0.05" value={props.minPlayerSpeed} onChange={(e) => props.onMinPlayerSpeedChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                         <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="max-speed-slider" className="font-semibold text-white flex justify-between"><span>Velocidade Máxima do Jogador</span><span className="font-bold text-cyan-300">{props.maxPlayerSpeed.toFixed(2)}</span></label>
                            <input id="max-speed-slider" type="range" min={props.minPlayerSpeed} max="8" step="0.05" value={props.maxPlayerSpeed} onChange={(e) => props.onMaxPlayerSpeedChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>

                         <div className="md:col-span-2">
                            <label className="font-semibold text-white text-lg">Tipo de Bola</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {BALL_DEFINITIONS.map(ball => (
                                    <button
                                        key={ball.id}
                                        onClick={() => props.onSelectedBallChange(ball)}
                                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${props.selectedBall.id === ball.id ? 'bg-cyan-500 text-white shadow-lg ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                    >
                                        {ball.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="tackle-dist-slider" className="font-semibold text-white flex justify-between"><span>Distância do Bote (Tackle)</span><span className="font-bold text-cyan-300">{props.tackleDistance.toFixed(0)}</span></label>
                             <input id="tackle-dist-slider" type="range" min="50" max="300" step="10" value={props.tackleDistance} onChange={(e) => props.onTackleDistanceChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>

                        <div className="md:col-span-2">
                             <div className="text-lg">
                                <label htmlFor="duration-input" className="font-semibold text-white">Duração da Partida (Real)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                        onBlur={handleDurationBlur}
                                        className="w-20 p-2 rounded-lg bg-gray-800 border-2 border-gray-700 text-white text-center"
                                    />
                                    <span className="font-bold text-white">:</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="59" 
                                        value={durationSecondsInput}
                                        onChange={(e) => setDurationSecondsInput(e.target.value)}
                                        onBlur={handleDurationBlur}
                                        className="w-20 p-2 rounded-lg bg-gray-800 border-2 border-gray-700 text-white text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
             case 'general':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <label className="flex items-center gap-3 cursor-pointer text-lg">
                            <input type="checkbox" checked={props.screenShakeEnabled} onChange={(e) => props.onScreenShakeChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                            <span className="font-semibold text-white">Vibração de Tela (Gol/Terremoto)</span>
                        </label>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                             <label htmlFor="home-team-select" className="font-semibold text-white">Time da Casa</label>
                             <select id="home-team-select" value={props.homeTeamId || ''} onChange={(e) => props.onHomeTeamIdChange(e.target.value || null)} className="p-3 w-full rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                                <option value="">Nenhum (neutro)</option>
                                <option value={props.teamA.id}>{props.teamA.name}</option>
                                <option value={props.teamB.id}>{props.teamB.name}</option>
                             </select>
                        </div>

                        <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/50">
                            <label className="flex items-center gap-3 cursor-pointer text-lg">
                                <input type="checkbox" checked={props.useRealRatings} onChange={(e) => props.onUseRealRatingsChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                                <span className="font-semibold text-white">Usar Scores Reais</span>
                            </label>
                            {props.useRealRatings && (
                                <label className="flex items-center gap-3 cursor-pointer text-lg">
                                    <input type="checkbox" checked={props.classicModeEnabled} onChange={(e) => props.onClassicModeEnabledChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                                    <span className="font-semibold text-white">Modo Clássico (Equilibrado)</span>
                                </label>
                            )}
                        </div>

                         <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="goalie-int-slider" className="font-semibold text-white flex justify-between"><span>Inteligência do Goleiro</span><span className="font-bold text-cyan-300">{props.goalieIntelligence.toFixed(2)}</span></label>
                             <input id="goalie-int-slider" type="range" min="0.1" max="5" step="0.1" value={props.goalieIntelligence} onChange={(e) => props.onGoalieIntelligenceChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="goalie-speed-slider" className="font-semibold text-white flex justify-between"><span>Velocidade do Goleiro</span><span className="font-bold text-cyan-300">{props.goalieSpeed.toFixed(2)}</span></label>
                            <input id="goalie-speed-slider" type="range" min="0.05" max="0.5" step="0.01" value={props.goalieSpeed} onChange={(e) => props.onGoalieSpeedChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>

                         <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/50">
                            <label className="flex items-center gap-3 cursor-pointer text-lg">
                                <input type="checkbox" checked={props.recordMatch} onChange={(e) => props.onRecordMatchChange(e.target.checked)} className="w-5 h-5 accent-cyan-400" />
                                <span className="font-semibold text-white">Gravar Partida</span>
                            </label>
                            {props.recordMatch && (
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="aspectRatio" value="16:9" checked={props.recordingAspectRatio === '16:9'} onChange={() => props.onAspectRatioChange('16:9')} className="w-5 h-5 accent-cyan-400" />
                                        <span className="text-white">16:9</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="aspectRatio" value="9:16" checked={props.recordingAspectRatio === '9:16'} onChange={() => props.onAspectRatioChange('9:16')} className="w-5 h-5 accent-cyan-400" />
                                        <span className="text-white">9:16</span>
                                    </label>
                                </div>
                            )}
                        </div>

                         <div className="md:col-span-2">
                            <button onClick={props.onResetSettings} className="btn-ripple w-full px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg shadow-lg">
                                Restaurar Configurações Padrão
                            </button>
                        </div>
                     </div>
                );
            case 'audio':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2 flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="sfx-volume-slider" className="font-semibold text-white flex justify-between"><span>Volume SFX</span><span className="font-bold text-cyan-300">{(props.sfxVolume * 100).toFixed(0)}%</span></label>
                            <input id="sfx-volume-slider" type="range" min="0" max="1" step="0.01" value={props.sfxVolume} onChange={(e) => props.onSfxVolumeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                        <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="music-volume-slider" className="font-semibold text-white flex justify-between"><span>Volume da Música</span><span className="font-bold text-cyan-300">{(props.musicVolume * 100).toFixed(0)}%</span></label>
                            <input id="music-volume-slider" type="range" min="0" max="1" step="0.01" value={props.musicVolume} onChange={(e) => props.onMusicVolumeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                         <div className="flex flex-col justify-center gap-1 text-lg">
                            <label htmlFor="ambiance-volume-slider" className="font-semibold text-white flex justify-between"><span>Volume do Ambiente</span><span className="font-bold text-cyan-300">{(props.ambianceVolume * 100).toFixed(0)}%</span></label>
                            <input id="ambiance-volume-slider" type="range" min="0" max="1" step="0.01" value={props.ambianceVolume} onChange={(e) => props.onAmbianceVolumeChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>

                         <div className="md:col-span-2 space-y-2">
                             <AudioFileInput label="Música de Fundo" file={props.musicFile} onFileChange={props.onMusicFileChange} />
                             <AudioFileInput label="Som Ambiente" file={props.ambianceFile} onFileChange={props.onAmbianceFileChange} />
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <h3 className="sm:col-span-2 text-lg font-semibold text-white mt-2">Efeitos Sonoros Específicos</h3>
                            <SfxInput sfxKey="ballTouch" label="Toque na Bola" />
                            <SfxInput sfxKey="goal" label="Gol" />
                            <SfxInput sfxKey="wallHit" label="Batida na Parede" />
                            <SfxInput sfxKey="buffPickup" label="Coleta de Buff" />
                            <SfxInput sfxKey="goalCheer" label="Comemoração de Gol" />
                            <SfxInput sfxKey="matchStart" label="Início da Partida" />
                            <SfxInput sfxKey="halfTime" label="Intervalo" />
                            <SfxInput sfxKey="secondHalfStart" label="Início 2º Tempo" />
                            <SfxInput sfxKey="matchEnd" label="Fim da Partida" />
                        </div>
                    </div>
                );
        }
    }

    const tabClasses = (tabName: 'visuals' | 'gameplay' | 'general' | 'audio') => `px-4 py-2 font-bold text-lg rounded-t-lg transition-colors duration-200 border-b-4 ${activeTab === tabName ? 'bg-gray-800 border-cyan-400 text-cyan-300' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-yellow-300 font-display">Configurações da Partida</h2>
                    <button onClick={onClose} className="text-4xl text-gray-400 hover:text-white transition-transform hover:rotate-90">&times;</button>
                </div>

                 <div className="border-b border-gray-700 px-4 flex-shrink-0">
                    <nav className="flex items-center -mb-px">
                        <button className={tabClasses('visuals')} onClick={() => setActiveTab('visuals')}>🎨 Visuais</button>
                        <button className={tabClasses('gameplay')} onClick={() => setActiveTab('gameplay')}>🎮 Gameplay</button>
                        <button className={tabClasses('general')} onClick={() => setActiveTab('general')}>⚙️ Geral</button>
                        <button className={tabClasses('audio')} onClick={() => setActiveTab('audio')}>🔊 Áudio</button>
                    </nav>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </div>
             <style>{`
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};


interface TeamEditorProps {
    team: TeamInfo;
    onUpdate: (updates: Partial<TeamInfo>) => void;
    onCustomLogoUpdate: (teamId: Team, field: 'logo' | 'logo2', dataUrl: string) => void;
    onDelete: () => void;
    isDeletable: boolean;
}

interface TeamEditorHandle {
    triggerLogo1Upload: () => void;
}

const TeamEditor = forwardRef<TeamEditorHandle, TeamEditorProps>(({ team, onUpdate, onCustomLogoUpdate, onDelete, isDeletable }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const logo2InputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        triggerLogo1Upload: () => {
            logoInputRef.current?.click();
        }
    }));
    
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        onUpdate({ [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>, field: 'logo' | 'logo2') => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    onCustomLogoUpdate(team.id, field, loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            {/* These inputs must always be in the DOM for the ref to work */}
            <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={(e) => handleLogoUpload(e, 'logo')} />
            <input type="file" accept="image/*" ref={logo2InputRef} className="hidden" onChange={(e) => handleLogoUpload(e, 'logo2')} />
            
            <button 
                onClick={() => setIsOpen(p => !p)}
                className="w-full text-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold transition-colors"
            >
                {isOpen ? 'Fechar Edição' : 'Editar Time'}
            </button>
            {isOpen && (
                <div className="bg-gray-700/80 p-4 mt-2 z-10 flex flex-col gap-3 rounded-lg border-2 border-cyan-500/30 animate-fade-in-fast">
                     <input type="text" name="name" value={team.name} onChange={handleInputChange} placeholder="Nome do Time" className="p-2 rounded bg-gray-800 text-white w-full border border-gray-700" />
                     <input type="text" name="foundationDate" value={team.foundationDate || ''} onChange={handleInputChange} placeholder="Ano de Fundação" className="p-2 rounded bg-gray-800 text-white w-full border border-gray-700" />
                     
                     <div className="flex items-center gap-2">
                        <label htmlFor={`logo_url_${team.id}`} className="text-sm text-gray-400 w-12 flex-shrink-0">Logo 1</label>
                        <input id={`logo_url_${team.id}`} type="text" name="logo" value={team.logo} onChange={handleInputChange} placeholder="URL ou Carregar" className="flex-grow p-2 rounded bg-gray-800 text-white w-full border border-gray-700" />
                        <button onClick={() => logoInputRef.current?.click()} className="p-2 bg-blue-600 hover:bg-blue-700 rounded font-bold flex-shrink-0" aria-label="Carregar logo 1">
                            📤
                        </button>
                     </div>

                     <div className="flex items-center gap-2">
                        <label htmlFor={`logo2_url_${team.id}`} className="text-sm text-gray-400 w-12 flex-shrink-0">Logo 2</label>
                        <input id={`logo2_url_${team.id}`} type="text" name="logo2" value={team.logo2 || ''} onChange={handleInputChange} placeholder="URL ou Carregar (opcional)" className="flex-grow p-2 rounded bg-gray-800 text-white w-full border border-gray-700" />
                        <button onClick={() => logo2InputRef.current?.click()} className="p-2 bg-blue-600 hover:bg-blue-700 rounded font-bold flex-shrink-0" aria-label="Carregar logo 2">
                            📤
                        </button>
                     </div>

                     <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Cor 1</label>
                        <input type="color" name="color" value={team.color} onChange={handleInputChange} className="h-8 w-full bg-transparent rounded" />
                     </div>
                     <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Cor 2</label>
                        <input type="color" name="color2" value={team.color2} onChange={handleInputChange} className="h-8 w-full bg-transparent rounded" />
                     </div>
                     <div className="flex-grow"></div>
                     <div className="flex gap-2">
                         {isDeletable && (
                            <button onClick={() => { if(window.confirm(`Tem certeza que deseja deletar ${team.name}?`)) onDelete() }} className="p-2 bg-red-700 hover:bg-red-800 rounded font-bold" aria-label="Deletar time">
                                🗑️
                            </button>
                         )}
                     </div>
                </div>
            )}
            <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </>
    );
});

const BuffCreatorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    buffDefinitions: Record<string, BuffInfo>;
    onBuffDefinitionsChange: (buffs: Record<string, BuffInfo>) => void;
}> = ({ isOpen, onClose, buffDefinitions, onBuffDefinitionsChange }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [promptText, setPromptText] = useState('');
    const [editedBuffs, setEditedBuffs] = useState<Record<string, BuffInfo>>(buffDefinitions);
    const [error, setError] = useState('');

    useEffect(() => {
        setEditedBuffs(buffDefinitions);
    }, [buffDefinitions, isOpen]);

    const handleGenerateBuff = async () => {
        if (!promptText) return;
        setIsGenerating(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const fullPrompt = `Você é um designer de jogos criando um novo power-up (buff) para um jogo de futebol de fliperama.
                Instrução do usuário: "${promptText}".
                
                Com base na instrução, crie UM novo buff. O buff deve ter:
                1.  **key**: Um ID único em SCREAMING_SNAKE_CASE (ex: SUPER_CHUTE_FOGUETE).
                2.  **name**: Um nome curto e chamativo em português (ex: "Chute Foguete").
                3.  **description**: Uma descrição clara e curta do que o buff faz.
                4.  **color**: Um código de cor hexadecimal (ex: "#ff4500").
                5.  **symbol**: Um único emoji que represente o buff (ex: "🚀").
                6.  **duration**: Duração em segundos do efeito (se não for de uso único). Para uso único, coloque 9999.
                7.  **type**: O tipo de buff, deve ser 'attack', 'defense', ou 'utility'.
                8.  **effectTemplate** (Opcional): Se a mecânica do novo buff for similar a um buff existente, coloque a 'key' do buff existente aqui. Buffs existentes são: ${Object.keys(BUFF_DEFINITIONS).join(', ')}. Isso ajuda a reusar a lógica do jogo. Se for uma mecânica totalmente nova, omita este campo.

                Responda APENAS com um objeto JSON contendo as chaves 'key' e 'buffData' (que é o objeto do buff).
                Exemplo: {"key": "NOVO_BUFF_ID", "buffData": {"name": ..., "description": ..., ...}}
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            buffData: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    color: { type: Type.STRING },
                                    symbol: { type: Type.STRING },
                                    duration: { type: Type.NUMBER },
                                    type: { type: Type.STRING, enum: ['attack', 'defense', 'utility'] },
                                    effectTemplate: { type: Type.STRING },
                                },
                                required: ["name", "description", "color", "symbol", "duration", "type"]
                            }
                        },
                        required: ["key", "buffData"]
                    }
                }
            });

            const jsonText = response.text.match(/{[\s\S]*}/)?.[0];
            if (!jsonText) throw new Error("A resposta da IA não continha JSON válido.");

            const { key, buffData } = JSON.parse(jsonText);
            
            const newBuff: BuffInfo = {
                ...buffData,
                duration: buffData.duration * 60 // Convert seconds to frames
            };

            setEditedBuffs(prev => ({...prev, [key]: newBuff }));
            setPromptText('');

        } catch (e) {
            console.error(e);
            setError("Falha ao gerar o buff. Tente novamente com um prompt diferente.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = () => {
        onBuffDefinitionsChange(editedBuffs);
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-yellow-300 font-display">Gerenciar Buffs com IA</h2>
                    <button onClick={onClose} className="text-4xl text-gray-400 hover:text-white transition-transform hover:rotate-90">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <textarea
                            value={promptText}
                            onChange={e => setPromptText(e.target.value)}
                            placeholder="Descreva uma ideia para um novo buff. Ex: 'um chute que congela o goleiro' ou 'um escudo que reflete a bola'"
                            className="w-full p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[80px]"
                            rows={3}
                        />
                        <button onClick={handleGenerateBuff} disabled={isGenerating || !promptText} className="btn-ripple w-full mt-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2">
                             {isGenerating ? <Spinner size="6" /> : '✨'}
                            <span>{isGenerating ? 'Gerando...' : 'Gerar Novo Buff'}</span>
                        </button>
                        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
                    </div>

                     <div className="space-y-2">
                        {Object.entries(editedBuffs).map(([key, buff]) => (
                             <div key={key} className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg">
                                <div style={{ backgroundColor: buff.color }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-3xl shadow-lg mt-1">
                                    {buff.symbol}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-white text-lg" style={{ color: buff.color }}>{buff.name}</h4>
                                    <p className="text-gray-400 text-sm">{buff.description}</p>
                                </div>
                                <button onClick={() => {
                                    const { [key]: _, ...rest } = editedBuffs;
                                    setEditedBuffs(rest);
                                }} className="p-2 bg-red-700 hover:bg-red-800 rounded font-bold self-center">
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-900 flex-shrink-0 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg">Salvar e Fechar</button>
                </div>
            </div>
        </div>
    );
};

const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onTeamSelect: (teamId: Team) => void;
    availableTeams: TeamInfo[];
    opponentId: Team;
    currentTeamId: Team;
}> = ({ isOpen, onClose, onTeamSelect, availableTeams, opponentId, currentTeamId }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAndGroupedTeams = useMemo(() => {
        const filtered = availableTeams.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.reduce((acc, team) => {
            const category = team.category || 'Outros';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(team);
            return acc;
        }, {} as Record<string, TeamInfo[]>);
    }, [searchQuery, availableTeams]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-start pt-16 justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col border-2 border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <input
                        type="text"
                        placeholder="Pesquisar time..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        autoFocus
                    />
                    <button onClick={onClose} className="text-4xl text-gray-400 hover:text-white ml-4">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {Object.keys(filteredAndGroupedTeams).length > 0 ? Object.entries(filteredAndGroupedTeams).sort(([a], [b]) => a.localeCompare(b)).map(([category, teams]) => (
                        <div key={category}>
                            <h3 className="text-xl font-bold text-yellow-300 uppercase tracking-wider mb-3 border-b-2 border-gray-700 pb-2">{category}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {teams.map(team => {
                                    const isDisabled = team.id === opponentId;
                                    const isSelected = team.id === currentTeamId;
                                    let cardClasses = "bg-gray-800/50 p-3 rounded-lg flex flex-col items-center gap-2 text-center transition-all duration-200 transform border-2 ";
                                    if (isDisabled) {
                                        cardClasses += "opacity-40 cursor-not-allowed border-transparent";
                                    } else if (isSelected) {
                                        cardClasses += "border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg";
                                    } else {
                                        cardClasses += "border-transparent hover:scale-105 hover:bg-gray-700/50 hover:border-cyan-400 cursor-pointer";
                                    }

                                    return (
                                        <button key={team.id} onClick={() => !isDisabled && onTeamSelect(team.id)} disabled={isDisabled} className={cardClasses}>
                                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center p-1">
                                                <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-sm font-semibold text-white h-10 flex items-center">{team.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">Nenhum time encontrado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RatingBar: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const width = ((value - 40) / 60) * 100; // Scale 40-100 to 0-100%
    return (
        <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(0, width)}%`, backgroundColor: color }}
            />
        </div>
    );
};

interface TeamSelectorProps {
    team: TeamInfo;
    onTeamSelect: (teamId: Team) => void;
    availableTeams: TeamInfo[];
    onTeamInfoUpdate: (teamId: Team, updates: Partial<TeamInfo>) => void;
    onCustomLogoUpdate: (teamId: Team, field: 'logo' | 'logo2', dataUrl: string) => void;
    onDeleteTeam: (teamId: Team) => void;
    isDeletable: boolean;
    opponentId: Team;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ team, onTeamSelect, availableTeams, onTeamInfoUpdate, onCustomLogoUpdate, onDeleteTeam, isDeletable, opponentId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const teamEditorRef = useRef<TeamEditorHandle>(null);
    
    const { attack = 75, defense = 75, midfield = 75 } = team.ratings || {};

    return (
        <div className="w-full max-w-sm flex flex-col gap-4 p-4 bg-gray-900/70 rounded-2xl border-2 border-gray-700/50 backdrop-blur-sm shadow-2xl" style={{borderColor: team.color, boxShadow: `0 0 20px ${team.color}20`}}>
            <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20" style={{background: `radial-gradient(circle, ${team.color} 0%, transparent 70%)`}}></div>
                <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain z-10" />
            </div>

            <h3 className="text-center font-bold text-2xl text-white uppercase tracking-wider font-display truncate" title={team.name}>{team.name}</h3>

            <div className="space-y-3">
                <div className="text-sm">
                    <div className="flex justify-between items-center mb-1 text-gray-300 font-semibold"><span>Ataque</span><span className="font-mono">{attack}</span></div>
                    <RatingBar value={attack} color="#ef4444" />
                </div>
                <div className="text-sm">
                    <div className="flex justify-between items-center mb-1 text-gray-300 font-semibold"><span>Defesa</span><span className="font-mono">{defense}</span></div>
                    <RatingBar value={defense} color="#3b82f6" />
                </div>
                <div className="text-sm">
                    <div className="flex justify-between items-center mb-1 text-gray-300 font-semibold"><span>Meio-Campo</span><span className="font-mono">{midfield}</span></div>
                    <RatingBar value={midfield} color="#22c55e" />
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full text-center py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-bold transition-colors shadow-lg"
                >
                    Mudar Time
                </button>
                <TeamEditor
                    ref={teamEditorRef}
                    team={team}
                    onUpdate={(updates) => onTeamInfoUpdate(team.id, updates)}
                    onCustomLogoUpdate={onCustomLogoUpdate}
                    onDelete={() => onDeleteTeam(team.id)}
                    isDeletable={isDeletable}
                />
            </div>
            
            <TeamSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTeamSelect={(id) => {
                    onTeamSelect(id);
                    setIsModalOpen(false);
                }}
                availableTeams={availableTeams}
                opponentId={opponentId}
                currentTeamId={team.id}
            />
        </div>
    );
};

type MatchSetupProps = Omit<SettingsModalComponentProps, 'isOpen' | 'onClose'> & {
    availableTeams: TeamInfo[];
    onAddNewTeam: (newTeam: TeamInfo) => void;
    setTeamA: (team: TeamInfo) => void;
    setTeamB: (team: TeamInfo) => void;
    onTeamInfoUpdate: (teamId: Team, updates: Partial<TeamInfo>) => void;
    onCustomLogoUpdate: (teamId: Team, field: 'logo' | 'logo2', dataUrl: string) => void;
    onDeleteTeam: (teamId: Team) => void;
    isSettingsOpen: boolean;
    onSettingsToggle: () => void;
    buffDefinitions: Record<string, BuffInfo>;
    onBuffDefinitionsChange: (buffs: Record<string, BuffInfo>) => void;
};

export const MatchSetup: React.FC<MatchSetupProps> = (props) => {
    const { availableTeams, onAddNewTeam, teamA, setTeamA, teamB, setTeamB, onTeamInfoUpdate, onCustomLogoUpdate, onDeleteTeam, isSettingsOpen, onSettingsToggle, buffDefinitions, onBuffDefinitionsChange } = props;

    const [isBuffCreatorOpen, setIsBuffCreatorOpen] = useState(false);
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);

    const handleTeamSelectA = (teamId: Team) => {
        const newTeam = availableTeams.find(t => t.id === teamId);
        if (newTeam) setTeamA(newTeam);
    };

    const handleTeamSelectB = (teamId: Team) => {
        const newTeam = availableTeams.find(t => t.id === teamId);
        if (newTeam) setTeamB(newTeam);
    };

    const isDeletableA = !INITIAL_TEAMS.some(t => t.id === teamA.id) || availableTeams.length > 2;
    const isDeletableB = !INITIAL_TEAMS.some(t => t.id === teamB.id) || availableTeams.length > 2;

    return (
        <div className="w-full max-w-7xl animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 md:gap-8">
                <TeamSelector 
                    team={teamA} 
                    onTeamSelect={handleTeamSelectA}
                    availableTeams={availableTeams}
                    onTeamInfoUpdate={onTeamInfoUpdate}
                    onCustomLogoUpdate={onCustomLogoUpdate}
                    onDeleteTeam={onDeleteTeam}
                    isDeletable={isDeletableA}
                    opponentId={teamB.id}
                />
                
                <div className="flex flex-col items-center gap-4 my-4 md:my-0">
                    <VersusArt teamA={teamA} teamB={teamB} />
                    <button onClick={onSettingsToggle} className="btn-ripple px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                        ⚙️ Configurações
                    </button>
                    <button onClick={() => setIsBuffCreatorOpen(true)} className="btn-ripple px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                        ✨ Gerenciar Buffs com IA
                    </button>
                    <button onClick={() => setIsAddTeamModalOpen(true)} className="btn-ripple px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                        🔍 Encontrar Time com IA
                    </button>
                </div>

                <TeamSelector 
                    team={teamB} 
                    onTeamSelect={handleTeamSelectB}
                    availableTeams={availableTeams}
                    onTeamInfoUpdate={onTeamInfoUpdate}
                    onCustomLogoUpdate={onCustomLogoUpdate}
                    onDeleteTeam={onDeleteTeam}
                    isDeletable={isDeletableB}
                    opponentId={teamA.id}
                />
            </div>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={onSettingsToggle} {...props} />
            <BuffCreatorModal isOpen={isBuffCreatorOpen} onClose={() => setIsBuffCreatorOpen(false)} buffDefinitions={buffDefinitions} onBuffDefinitionsChange={onBuffDefinitionsChange} />
            <AddTeamModal 
                isOpen={isAddTeamModalOpen}
                onClose={() => setIsAddTeamModalOpen(false)}
                onTeamAdd={onAddNewTeam}
            />
        </div>
    );
};