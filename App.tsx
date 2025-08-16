




import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GameField } from './components/GameField';
import { Scoreboard } from './components/Scoreboard';
import { MatchSetup } from './components/MatchSetup';
import { NotificationFeed } from './components/NotificationFeed';
import { ChampionshipView } from './components/ChampionshipView';
import { Score, Team, GamePhase, BuffType, ActiveBuff, TeamInfo, BuffInfo, UINotification, NotificationPart, MatchLayout, BallDefinition, MatchStats, TeamStats, AppData, AudioSettings, CustomLogos, CustomTeams } from './types';
import { HALF_TIME_SECONDS, BUFF_DEFINITIONS, INITIAL_TEAMS, PLAYER_RADIUS, BALL_RADIUS, BALL_DEFINITIONS, DEFAULT_MIN_PLAYER_SPEED, DEFAULT_MAX_PLAYER_SPEED, DEFAULT_TACKLE_DISTANCE, GOAL_HEIGHT, INITIAL_TEAMS_DATA } from './constants';
import { loadData, saveData } from './storage';
import { MatchStatsDisplay } from './components/MatchStatsDisplay';
import { HowToPlayModal } from './components/HowToPlayModal';
import { audioManager } from './audio';
import { defaultSounds } from './audio/defaultSounds';
import { PreMatchRatingsDisplay } from './components/PreMatchRatingsDisplay';
import { MatchRecapGenerator } from './components/MatchRecapGenerator';
import VersusArt from './components/VersusArt';
import { GoogleGenAI, Type } from '@google/genai';
import { HalftimeInterstitial } from './components/HalftimeInterstitial';
import { SyncCodeModal } from './components/SyncCodeModal';

const BLOB_URI_STORAGE_KEY = 'kineticSoccer.jsonBlobUri';
const AUDIO_SETTINGS_STORAGE_KEY = 'kineticSoccer.audioSettings';
const CUSTOM_LOGOS_STORAGE_KEY = 'kineticSoccer.customLogos';
const CUSTOM_TEAMS_STORAGE_KEY = 'kineticSoccer.customTeams';
const BUFF_DEFINITIONS_STORAGE_KEY = 'kineticSoccer.buffDefinitions';

const defaultAudioSettings: AudioSettings = {
  musicFile: null,
  musicVolume: 0.3,
  ambianceFile: defaultSounds.stadiumAmbiance,
  ambianceVolume: 0.4,
  sfxVolume: 0.5,
  sfx: {
    ballTouch: defaultSounds.ballTouch,
    goal: defaultSounds.goal,
    wallHit: defaultSounds.wallHit,
    buffPickup: defaultSounds.buffPickup,
    goalCheer: defaultSounds.goalCheer,
    matchStart: defaultSounds.matchStart,
    halfTime: defaultSounds.halfTime,
    secondHalfStart: defaultSounds.secondHalfStart,
    matchEnd: defaultSounds.matchEnd,
  },
};

const defaultAppSettings: AppData = {
  teamA: INITIAL_TEAMS[0],
  teamB: INITIAL_TEAMS[1],
  recordMatch: false,
  recordingAspectRatio: '16:9',
  buffsEnabled: false,
  showBuffTutorial: true,
  autoShootEnabled: true,
  matchDurationSeconds: 60,
  goalieIntelligence: 1,
  goalieSpeed: 0.22,
  useRealRatings: false,
  classicModeEnabled: false,
  homeTeamId: INITIAL_TEAMS[0].id,
  screenShakeEnabled: true,
  gameSpeed: 1,
  matchLayout: 'horizontal',
  fieldScale: 1,
  playerSize: PLAYER_RADIUS,
  ballSize: BALL_RADIUS,
  goalHeight: GOAL_HEIGHT,
  goalieSize: 30,
  tackleDistance: DEFAULT_TACKLE_DISTANCE,
  scoreboardOffset: 0,
  gameFieldOffset: 16,
  minPlayerSpeed: DEFAULT_MIN_PLAYER_SPEED,
  maxPlayerSpeed: DEFAULT_MAX_PLAYER_SPEED,
  selectedBall: BALL_DEFINITIONS[0],
  scoreboardScale: 1,
  customBallIcon: null,
};


const ActiveBuffsDisplay: React.FC<{ activeBuffs: ActiveBuff[], teamInfo: TeamInfo, buffDefinitions: Record<string, BuffInfo>, layout: MatchLayout, isTeamB?: boolean }> = ({ activeBuffs, teamInfo, buffDefinitions, layout, isTeamB }) => {
    const teamBuffs = activeBuffs.filter(b => b.team === teamInfo.id);
    const isVertical = layout === 'vertical';
    return (
        <div className={`flex gap-2 min-h-12 items-center flex-wrap ${isVertical ? 'justify-center' : (isTeamB ? 'justify-end' : 'justify-start')}`}>
             {teamBuffs.map(buff => {
                const buffInfo = buffDefinitions[buff.type];
                if (!buffInfo) return null;
                const remaining = (buff.duration / buff.initialDuration) * 100;
                return (
                    <div key={buff.id} className="relative group flex items-center bg-gray-900/50 p-1 rounded-full border border-gray-700">
                         <div style={{backgroundColor: buffInfo.color}} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                           {buffInfo.symbol}
                         </div>
                         <div className="absolute bottom-0 left-0 h-1 bg-yellow-400 rounded-b-full" style={{width: `${remaining}%`}}></div>
                         <div className="absolute bottom-full mb-2 w-max p-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                             <strong>{buffInfo.name}</strong>: {buffInfo.description}
                         </div>
                    </div>
                )
             })}
        </div>
    )
};

interface BuffExplanationCardProps {
  buffType: BuffType;
  team: TeamInfo;
  buffInfo: BuffInfo;
}

const BuffExplanationCard: React.FC<BuffExplanationCardProps> = ({ buffType, team, buffInfo }) => {
  const typeStyles = {
    attack: 'bg-red-500 text-red-100',
    defense: 'bg-blue-500 text-blue-100',
    utility: 'bg-purple-500 text-purple-100',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-[#2a2a2a] rounded-2xl border border-gray-700 shadow-2xl w-full max-w-sm p-6 text-center transform animate-slide-up relative overflow-hidden">
        <div 
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: buffInfo.color }}
        ></div>
        <div 
          className="absolute -bottom-20 -right-12 w-56 h-56 rounded-full opacity-10"
          style={{ backgroundColor: buffInfo.color }}
        ></div>

        <div className="relative z-10">
          <div 
            style={{ backgroundColor: buffInfo.color }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-5xl shadow-lg border-2 border-gray-700"
          >
            {buffInfo.symbol}
          </div>
          
          <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase tracking-wider ${typeStyles[buffInfo.type]}`}>
            {buffInfo.type === 'attack' ? 'Ataque' : buffInfo.type === 'defense' ? 'Defesa' : 'Utilitário'}
          </span>
          
          <h2 className="text-3xl font-display font-bold mt-4 mb-2" style={{ color: buffInfo.color }}>
            {buffInfo.name}
          </h2>
          
          <p className="text-gray-300 text-base mb-6">
            {buffInfo.description}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6 border-t border-gray-700/50 pt-5">
              <img src={team.logo} alt={team.name} className="w-10 h-10 bg-white rounded-full p-1 object-contain"/>
              <p className="text-base font-semibold" style={{color: team.color === '#000000' ? '#FFFFFF' : team.color}}>
                  {team.name} pegou o buff!
              </p>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

type Winner = TeamInfo | 'draw' | null;

const GameControls: React.FC<{
    onPause: () => void;
    onRestart: () => void;
    onMenu: () => void;
    isPaused: boolean;
    isDisabled: boolean;
}> = ({ onPause, onRestart, onMenu, isPaused, isDisabled }) => {
    const [isOpen, setIsOpen] = useState(false);

    const buttonClasses = "btn-ripple w-40 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-gray-600/50 flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-wider text-sm";
    
    return (
        <div className="fixed bottom-5 right-5 z-50">
            <div className="relative flex flex-col items-center gap-3">
                 <div className={`flex flex-col items-center gap-3 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <button onClick={onRestart} disabled={isDisabled} className={buttonClasses} style={{backgroundColor: '#3b82f6'}}>
                        🔄 <span>Reiniciar</span>
                    </button>
                    <button onClick={onMenu} disabled={isDisabled} className={buttonClasses} style={{backgroundColor: '#6b7280'}}>
                        🏠 <span>Menu</span>
                    </button>
                    <button onClick={onPause} disabled={isDisabled} className={buttonClasses} style={{backgroundColor: '#f59e0b'}}>
                        {isPaused ? '▶️' : '⏸️'}
                        <span>{isPaused ? 'Continuar' : 'Pausar'}</span>
                    </button>
                </div>
                <button
                    onClick={() => setIsOpen(p => !p)}
                    className="btn-ripple w-16 h-16 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg flex items-center justify-center text-3xl transition-transform duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                >
                   {isOpen ? '✕' : '⚙️'}
                </button>
            </div>
        </div>
    );
};

const SavingIndicator: React.FC<{ status: 'idle' | 'saving' | 'saved' | 'error' }> = ({ status }) => {
    if (status === 'idle') return null;

    const content = {
        saving: { text: 'Salvando...', icon: '🔄', color: 'bg-yellow-600/80' },
        saved: { text: 'Salvo na nuvem!', icon: '☁️', color: 'bg-green-600/80' },
        error: { text: 'Erro ao salvar', icon: '⚠️', color: 'bg-red-600/80' }
    };

    const current = content[status];
    const animationClass = status === 'saving' ? 'animate-spin' : '';

    return (
        <div 
            className={`fixed bottom-4 left-4 z-[200] flex items-center gap-3 px-4 py-2 rounded-full text-white font-semibold shadow-lg text-sm transition-all duration-300 ${current.color} backdrop-blur-sm`}
        >
            <span className={`inline-block ${animationClass}`}>{current.icon}</span>
            <span>{current.text}</span>
        </div>
    );
};

const App: React.FC = () => {
  // --- State Management Refactor ---
  const [settings, setSettings] = useState<AppData>(defaultAppSettings);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
      try {
          const stored = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
          if (stored) {
              const parsed = JSON.parse(stored);
              // Deep merge sfx, shallow merge the rest to ensure new defaults are added
              return {
                  ...defaultAudioSettings,
                  ...parsed,
                  sfx: {
                      ...defaultAudioSettings.sfx,
                      ...(parsed.sfx || {}),
                  }
              };
          }
          return defaultAudioSettings;
      } catch {
          return defaultAudioSettings;
      }
  });
  const [customLogos, setCustomLogos] = useState<CustomLogos>(() => {
    try {
        const stored = window.localStorage.getItem(CUSTOM_LOGOS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
  });
  const [customTeams, setCustomTeams] = useState<CustomTeams>(() => {
    try {
        const stored = window.localStorage.getItem(CUSTOM_TEAMS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
  });
  const [buffDefinitions, setBuffDefinitions] = useState<Record<string, BuffInfo>>(() => {
    try {
        const stored = window.localStorage.getItem(BUFF_DEFINITIONS_STORAGE_KEY);
        // Merge with defaults to ensure all base buffs are present and user customizations are preserved
        const storedBuffs = stored ? JSON.parse(stored) : {};
        return { ...BUFF_DEFINITIONS, ...storedBuffs };
    } catch {
        return BUFF_DEFINITIONS;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const isInitialCloudLoadDone = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Cloud Sync State
  const [jsonBlobUri, setJsonBlobUri] = useState<string | null>(null);
  const [blobUriInput, setBlobUriInput] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [newSyncCode, setNewSyncCode] = useState<string | null>(null);
  
  const mergedAvailableTeams = useMemo(() => {
      const teamsMap = new Map(INITIAL_TEAMS.map(t => [t.id, { ...t }]));
      Object.values(customTeams).forEach(customTeam => {
          teamsMap.set(customTeam.id, { ...customTeam });
      });
      return Array.from(teamsMap.values());
  }, [customTeams]);

  // Get blob URI from local storage on initial mount
  useEffect(() => {
    const storedUri = window.localStorage.getItem(BLOB_URI_STORAGE_KEY);
    if (storedUri) {
        setJsonBlobUri(storedUri);
    } else {
        setIsLoading(false);
        isInitialCloudLoadDone.current = true; // No cloud data to load, so we're "done".
    }
  }, []);

  const handleLogout = useCallback(() => {
      setJsonBlobUri(null);
      window.localStorage.removeItem(BLOB_URI_STORAGE_KEY);
      setBlobUriInput('');
      setSettings(defaultAppSettings);
      isInitialCloudLoadDone.current = true;
      // Not resetting audio/logo/buff/team settings on logout, as they are local to the device
  }, []);

  // Load data when jsonBlobUri changes
  useEffect(() => {
    const loadAppData = async () => {
        setIsLoading(true);
        try {
            const data = await loadData(jsonBlobUri!);
            if (data) {
              // Check for new master format vs old format
              if (data.settings && typeof data.settings === 'object') {
                console.log("Loading new master data format from cloud.");
                const { settings: loadedSettings, audioSettings: loadedAudio, customLogos: loadedLogos, customTeams: loadedTeams, buffDefinitions: loadedBuffs } = data;

                // Overwrite settings, ensuring defaults for new keys
                setSettings({ ...defaultAppSettings, ...loadedSettings });

                // Overwrite audio settings, ensuring defaults and deep-merging SFX
                setAudioSettings({
                    ...defaultAudioSettings,
                    ...(loadedAudio || {}),
                    sfx: {
                        ...defaultAudioSettings.sfx,
                        ...(loadedAudio?.sfx || {}),
                    }
                });

                // Overwrite custom data
                setCustomLogos(loadedLogos || {});
                setCustomTeams(loadedTeams || {});
                setBuffDefinitions({ ...BUFF_DEFINITIONS, ...(loadedBuffs || {}) });

              } else { // Handle old format with migration
                console.log("Loading old data format from cloud. Running migration.");
                const {
                  musicFile, musicVolume, ambianceFile, ambianceVolume, sfxVolume, sfx, // Old audio fields
                  buffDefinitions: loadedBuffs, // Old buff fields
                  availableTeams: loadedTeams, // The main problem: old team list
                  ...coreData
                } = data as any;
      
                // --- MIGRATION LOGIC ---
                if (loadedTeams && Array.isArray(loadedTeams)) {
                    const newCustomTeams: CustomTeams = {};
                    const initialTeamMap = new Map(INITIAL_TEAMS.map(t => [t.id, JSON.stringify(t)]));
                    loadedTeams.forEach((team: TeamInfo) => {
                        const initialTeamJSON = initialTeamMap.get(team.id);
                        if (!initialTeamJSON || initialTeamJSON !== JSON.stringify(team)) {
                            newCustomTeams[team.id] = team;
                        }
                    });
                    setCustomTeams(prev => ({ ...prev, ...newCustomTeams }));
                }
      
                if (loadedBuffs) {
                    setBuffDefinitions(prev => ({ ...prev, ...loadedBuffs }));
                }
      
                if (musicFile !== undefined || musicVolume !== undefined || ambianceFile !== undefined || ambianceVolume !== undefined || sfxVolume !== undefined || sfx !== undefined) {
                  const migratedAudioSettings: Partial<AudioSettings> = {};
                  if (musicFile !== undefined) migratedAudioSettings.musicFile = musicFile;
                  if (musicVolume !== undefined) migratedAudioSettings.musicVolume = musicVolume;
                  if (ambianceFile !== undefined) migratedAudioSettings.ambianceFile = ambianceFile;
                  if (ambianceVolume !== undefined) migratedAudioSettings.ambianceVolume = ambianceVolume;
                  if (sfxVolume !== undefined) migratedAudioSettings.sfxVolume = sfxVolume;
                  if (sfx !== undefined) migratedAudioSettings.sfx = sfx;
                  
                  setAudioSettings(prev => {
                    const { sfx: migratedSfx, ...restOfMigratedSettings } = migratedAudioSettings;
                    return {
                        ...prev,
                        ...restOfMigratedSettings,
                        sfx: {
                            ...(prev.sfx || {}),
                            ...(migratedSfx || {})
                        }
                    };
                  });
                }
                
                 if (coreData.teamA && coreData.teamA.logo && coreData.teamA.logo.startsWith('data:')) {
                      const originalTeam = INITIAL_TEAMS.find(t => t.id === coreData.teamA.id);
                      coreData.teamA.logo = originalTeam ? originalTeam.logo : '';
                  }
                   if (coreData.teamB && coreData.teamB.logo && coreData.teamB.logo.startsWith('data:')) {
                      const originalTeam = INITIAL_TEAMS.find(t => t.id === coreData.teamB.id);
                      coreData.teamB.logo = originalTeam ? originalTeam.logo : '';
                  }
                
                setSettings(prev => ({ ...defaultAppSettings, ...coreData }));
              }
            } else {
              alert('Não foi possível carregar os dados para o código fornecido. Pode ser inválido, ter expirado ou pertencer a uma versão antiga do serviço de armazenamento. Sua sessão foi encerrada.');
              handleLogout();
            }
        } catch (error) {
            console.error("Erro ao carregar ou processar dados da nuvem:", error);
            alert("Ocorreu um erro ao processar os dados da nuvem. Pode estar corrompido. Sua sessão será encerrada.");
            handleLogout();
        } finally {
            setIsLoading(false);
            isInitialCloudLoadDone.current = true;
        }
    };
    
    if (jsonBlobUri) {
      loadAppData();
    } else {
      setIsLoading(false);
    }
  }, [jsonBlobUri, handleLogout]);

  // Save app data to cloud on settings change (debounced)
  useEffect(() => {
    // We never want to save while loading data or if the initial data hasn't been processed yet.
    if (isLoading || !isInitialCloudLoadDone.current) {
        return;
    }

    if (!jsonBlobUri) return;

    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }
    
    setSavingStatus('saving');

    saveTimeoutRef.current = window.setTimeout(async () => {
        try {
            // Create a master object with all data to be synced
            const dataToSave = {
                settings,
                audioSettings,
                customLogos,
                customTeams,
                buffDefinitions,
            };

            const newUri = await saveData(dataToSave, jsonBlobUri);
            
            if (newUri !== jsonBlobUri) {
                setJsonBlobUri(newUri);
                window.localStorage.setItem(BLOB_URI_STORAGE_KEY, newUri);
                setNewSyncCode(newUri); // Show the new code in the modal
            }

            setSavingStatus('saved');
            setTimeout(() => setSavingStatus('idle'), 2000);
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            setSavingStatus('error');
             if (error.message === 'Blob not found') {
                alert('Seus dados salvos não puderam ser encontrados online (podem ter expirado). Sua sessão foi encerrada. Por favor, gere um novo código.');
                handleLogout();
            }
            setTimeout(() => setSavingStatus('idle'), 3000);
        }
    }, 1500); // Increased debounce to 1.5s to handle larger data object

    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    }
  }, [settings, audioSettings, customLogos, customTeams, buffDefinitions, jsonBlobUri, handleLogout, isLoading]);

  // Save local settings
  useEffect(() => {
    try { window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(audioSettings)); } catch (e) { console.error("Failed to save audio settings", e); }
  }, [audioSettings]);
  
  useEffect(() => {
    try { window.localStorage.setItem(CUSTOM_LOGOS_STORAGE_KEY, JSON.stringify(customLogos)); } catch (e) { console.error("Failed to save custom logos", e); }
  }, [customLogos]);
  
  useEffect(() => {
    try { window.localStorage.setItem(CUSTOM_TEAMS_STORAGE_KEY, JSON.stringify(customTeams)); } catch (e) { console.error("Failed to save custom teams", e); }
  }, [customTeams]);

  useEffect(() => {
    try { window.localStorage.setItem(BUFF_DEFINITIONS_STORAGE_KEY, JSON.stringify(buffDefinitions)); } catch (e) { console.error("Failed to save buff definitions", e); }
  }, [buffDefinitions]);

  // Destructure settings for easier use
  const {
      teamA, teamB, recordMatch, recordingAspectRatio,
      buffsEnabled, showBuffTutorial, autoShootEnabled, matchDurationSeconds,
      goalieIntelligence, goalieSpeed, useRealRatings, homeTeamId,
      screenShakeEnabled, gameSpeed, matchLayout, fieldScale,
      playerSize, ballSize, tackleDistance, scoreboardOffset, gameFieldOffset, minPlayerSpeed,
      maxPlayerSpeed, selectedBall, scoreboardScale, classicModeEnabled,
      goalHeight, goalieSize, customBallIcon
  } = settings;

   const {
      musicFile, musicVolume, sfxVolume, sfx, ambianceFile, ambianceVolume,
  } = audioSettings;
  
  // --- Setter functions for props ---
  const setTeamA = (value: TeamInfo) => setSettings(s => ({ ...s, teamA: value }));
  const setTeamB = (value: TeamInfo) => setSettings(s => ({ ...s, teamB: value }));
  const setRecordMatch = (value: boolean) => setSettings(s => ({ ...s, recordMatch: value }));
  const setRecordingAspectRatio = (value: '16:9' | '9:16') => setSettings(s => ({ ...s, recordingAspectRatio: value }));
  const setBuffsEnabled = (value: boolean) => setSettings(s => ({ ...s, buffsEnabled: value }));
  const setShowBuffTutorial = (value: boolean) => setSettings(s => ({ ...s, showBuffTutorial: value }));
  const setAutoShootEnabled = (value: boolean) => setSettings(s => ({ ...s, autoShootEnabled: value }));
  const setMatchDurationSeconds = (value: number) => setSettings(s => ({ ...s, matchDurationSeconds: value }));
  const setGoalieIntelligence = (value: number) => setSettings(s => ({ ...s, goalieIntelligence: value }));
  const setGoalieSpeed = (value: number) => setSettings(s => ({ ...s, goalieSpeed: value }));
  const setUseRealRatings = (value: boolean) => setSettings(s => ({ ...s, useRealRatings: value }));
  const setClassicModeEnabled = (value: boolean) => setSettings(s => ({ ...s, classicModeEnabled: value }));
  const setHomeTeamId = (value: Team | null) => setSettings(s => ({ ...s, homeTeamId: value }));
  const setScreenShakeEnabled = (value: boolean) => setSettings(s => ({ ...s, screenShakeEnabled: value }));
  const setGameSpeed = (value: number) => setSettings(s => ({ ...s, gameSpeed: value }));
  const setMatchLayout = (value: MatchLayout) => setSettings(s => ({ ...s, matchLayout: value }));
  const setFieldScale = (value: number) => setSettings(s => ({ ...s, fieldScale: value }));
  const setPlayerSize = (value: number) => setSettings(s => ({ ...s, playerSize: value }));
  const setBallSize = (value: number) => setSettings(s => ({ ...s, ballSize: value }));
  const setGoalHeight = (value: number) => setSettings(s => ({ ...s, goalHeight: value }));
  const setGoalieSize = (value: number) => setSettings(s => ({ ...s, goalieSize: value }));
  const setTackleDistance = (value: number) => setSettings(s => ({ ...s, tackleDistance: value }));
  const setScoreboardOffset = (value: number) => setSettings(s => ({ ...s, scoreboardOffset: value }));
  const setGameFieldOffset = (value: number) => setSettings(s => ({ ...s, gameFieldOffset: value }));
  const setMinPlayerSpeed = (value: number) => setSettings(s => ({ ...s, minPlayerSpeed: value }));
  const setMaxPlayerSpeed = (value: number) => setSettings(s => ({ ...s, maxPlayerSpeed: value }));
  const setSelectedBall = (value: BallDefinition) => setSettings(s => ({ ...s, selectedBall: value }));
  const setScoreboardScale = (value: number) => setSettings(s => ({ ...s, scoreboardScale: value }));
  const setCustomBallIcon = (value: string | null) => setSettings(s => ({...s, customBallIcon: value}));
  
  // Audio setters
  const setMusicFile = (value: string | null) => setAudioSettings(s => ({ ...s, musicFile: value }));
  const setMusicVolume = (value: number) => setAudioSettings(s => ({ ...s, musicVolume: value }));
  const setSfxVolume = (value: number) => setAudioSettings(s => ({ ...s, sfxVolume: value }));
  const setSfx = (value: Record<string, string | null>) => setAudioSettings(s => ({ ...s, sfx: value }));
  const setAmbianceFile = (value: string | null) => setAudioSettings(s => ({ ...s, ambianceFile: value }));
  const setAmbianceVolume = (value: number) => setAudioSettings(s => ({ ...s, ambianceVolume: value }));

  // --- End State Refactor ---

  // View state
  const [view, setView] = useState<'MENU' | 'MATCH_SETUP' | 'CHAMPIONSHIP' | 'GAME'>('MENU');
  const [setupEntryPoint, setSetupEntryPoint] = useState<'MENU' | 'CHAMPIONSHIP'>('MENU');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Game state (non-persistent)
  const [score, setScore] = useState<Score>({});
  const [resetCounter, setResetCounter] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('PRE_GAME');
  const [stoppageTime, setStoppageTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [matchBuffs, setMatchBuffs] = useState<BuffType[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
  const [seenBuffs, setSeenBuffs] = useState<Set<BuffType>>(new Set());
  const [tutorialPauseInfo, setTutorialPauseInfo] = useState<{ buffType: BuffType; team: TeamInfo; } | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'recording' | 'generating' | 'ready' | 'error'>('idle');
  const [winner, setWinner] = useState<Winner>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [matchStats, setMatchStats] = useState<MatchStats>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const isBallInPenaltyAreaRef = useRef(false);
  const [frenzyTeam, setFrenzyTeam] = useState<Team | null>(null);
  const [isUpdatingRatings, setIsUpdatingRatings] = useState(false);

  useEffect(() => {
    const scoreA = score[teamA.id] || 0;
    const scoreB = score[teamB.id] || 0;
    const scoreDiff = scoreA - scoreB;

    if (scoreDiff <= -2) {
        setFrenzyTeam(teamA.id);
    } else if (scoreDiff >= 2) {
        setFrenzyTeam(teamB.id);
    } else {
        setFrenzyTeam(null);
    }
  }, [score, teamA.id, teamB.id]);


  const handleResetSettings = useCallback(() => {
    if (window.confirm('Tem certeza de que deseja restaurar todas as configurações de jogo para o padrão? (Seus times salvos e configurações de áudio/logo/buff não serão afetados)')) {
        setSettings(defaultAppSettings);
    }
  }, []);

  const { matchTeamA, matchTeamB } = useMemo(() => {
    const mergeCustomData = (team: TeamInfo): TeamInfo => {
      const customLogo = customLogos[team.id];
      const customTeamData = customTeams[team.id];
      const finalTeam = { ...team, ...(customTeamData || {}) };

      if (customLogo) {
          finalTeam.logo = customLogo.logo ?? finalTeam.logo;
          finalTeam.logo2 = customLogo.logo2 ?? finalTeam.logo2;
      }
      return finalTeam;
    }
    
    let finalA = mergeCustomData(teamA);
    let finalB = mergeCustomData(teamB);
    
    if (finalA.id !== finalB.id && finalA.color === finalB.color) {
      finalB.color = finalB.color2;
      finalB.logo = finalB.logo2 || finalB.logo;
    }

    return { matchTeamA: finalA, matchTeamB: finalB };
  }, [teamA, teamB, customLogos, customTeams]);

  const isGameActive = gamePhase === 'FIRST_HALF' || gamePhase === 'SECOND_HALF' || gamePhase === 'FIRST_HALF_STOPPAGE' || gamePhase === 'SECOND_HALF_STOPPAGE';
  const isEffectivelyPaused = isPaused || tutorialPauseInfo !== null;

  const audioManagerRef = useRef(audioManager);

    // Load audio settings on mount and when they change
  useEffect(() => {
      const am = audioManagerRef.current;
      am.loadMusic(musicFile);
      am.setMusicVolume(musicVolume);
      am.loadAmbiance(ambianceFile);
      am.setAmbianceVolume(ambianceVolume);
      am.loadSfx(sfx);
      am.setSfxVolume(sfxVolume);
  }, [musicFile, musicVolume, sfx, sfxVolume, ambianceFile, ambianceVolume]);

  const handlePlaySfx = useCallback((type: string) => {
      audioManagerRef.current.playSfx(type);
  }, []);

  // Control music playback based on game phase
  useEffect(() => {
      const am = audioManagerRef.current;
      if (isGameActive && !isEffectivelyPaused) {
          am.playMusic();
          am.playAmbiance();
      } else {
          am.pauseMusic();
          am.pauseAmbiance();
      }
  }, [isGameActive, isEffectivelyPaused]);

  // Sound effects for game phase changes
  const prevGamePhaseRef = useRef<GamePhase>(gamePhase);
  useEffect(() => {
    const prevPhase = prevGamePhaseRef.current;
    if (prevPhase !== gamePhase) {
      if (gamePhase === 'HALF_TIME') {
          handlePlaySfx('halfTime');
      } else if (gamePhase === 'FULL_TIME') {
          handlePlaySfx('matchEnd');
      } else if (gamePhase === 'SECOND_HALF' && prevPhase === 'HALF_TIME') {
          handlePlaySfx('secondHalfStart');
      } else if (gamePhase === 'FIRST_HALF' && (prevPhase === 'COUNTDOWN' || prevPhase === 'RATINGS_SHOWCASE')) {
          handlePlaySfx('matchStart');
      }
    }
    prevGamePhaseRef.current = gamePhase;
  }, [gamePhase, handlePlaySfx]);

  const resetStats = useCallback((isNewMatch: boolean) => {
    if (isNewMatch) {
      const initialTeamStats: TeamStats = { touches: 0, shots: 0, shotsOnTarget: 0, possession: 0, saves: 0 };
      setMatchStats({
          [matchTeamA.id]: { ...initialTeamStats },
          [matchTeamB.id]: { ...initialTeamStats },
      });
    }
  }, [matchTeamA.id, matchTeamB.id]);


  useEffect(() => {
    if (gamePhase === 'PRE_GAME') {
        const allBuffs = Object.keys(buffDefinitions);
        
        const attackBuffs = allBuffs.filter(b => buffDefinitions[b].type === 'attack');
        const defenseBuffs = allBuffs.filter(b => buffDefinitions[b].type === 'defense');
        const utilityBuffs = allBuffs.filter(b => buffDefinitions[b].type === 'utility');

        const shuffle = (arr: BuffType[]) => arr.sort(() => 0.5 - Math.random());

        const selectedBuffs = [
            ...shuffle(attackBuffs).slice(0, 2),
            ...shuffle(defenseBuffs).slice(0, 2),
            ...shuffle(utilityBuffs).slice(0, 2),
        ];

        setMatchBuffs(selectedBuffs);
    }
  }, [gamePhase, buffDefinitions]);

  useEffect(() => {
    if (!isTimerRunning || isEffectivelyPaused) return;

    const totalGameSeconds = HALF_TIME_SECONDS * 2;
    const realMatchDurationMs = matchDurationSeconds * 1000;
    const tickInterval = realMatchDurationMs / totalGameSeconds;

    const timerId = setInterval(() => {
      setGameTime(prevTime => {
        const newTime = prevTime + 1;

        if (gamePhase === 'FIRST_HALF' && newTime >= HALF_TIME_SECONDS) {
            const extraTime = Math.floor(Math.random() * 120) + 60; // 1-3 mins stoppage
            setStoppageTime(extraTime);
            setGamePhase('FIRST_HALF_STOPPAGE');
            return HALF_TIME_SECONDS;
        }
        if (gamePhase === 'FIRST_HALF_STOPPAGE' && newTime >= HALF_TIME_SECONDS + stoppageTime) {
            setGamePhase('HALF_TIME'); setIsTimerRunning(false); return HALF_TIME_SECONDS + stoppageTime;
        }
        if (gamePhase === 'SECOND_HALF' && newTime >= HALF_TIME_SECONDS * 2) {
            const extraTime = Math.floor(Math.random() * 180) + 120; // 2-5 mins stoppage
            setStoppageTime(extraTime);
            setGamePhase('SECOND_HALF_STOPPAGE');
            return HALF_TIME_SECONDS * 2;
        }
        if (gamePhase === 'SECOND_HALF_STOPPAGE' && newTime >= (HALF_TIME_SECONDS * 2) + stoppageTime) {
          // Time is up. Check for sudden death condition.
          if (!isBallInPenaltyAreaRef.current) {
            setGamePhase('FULL_TIME'); 
            setIsTimerRunning(false);
            // Return the final time, which might be slightly over.
            return (HALF_TIME_SECONDS * 2) + stoppageTime;
          }
          // Ball is in the penalty area. Freeze the clock at the end of stoppage time.
          // The interval will keep checking until the ball is cleared.
          return (HALF_TIME_SECONDS * 2) + stoppageTime;
        }
        return newTime;
      });
    }, tickInterval / gameSpeed); // Adjust timer to game speed
    return () => clearInterval(timerId);
  }, [isTimerRunning, gamePhase, isEffectivelyPaused, matchDurationSeconds, gameSpeed, stoppageTime]);

  useEffect(() => {
    if (gamePhase === 'RATINGS_SHOWCASE') {
        const timerId = setTimeout(() => {
            setGamePhase('COUNTDOWN');
            setCountdown(3);
        }, 5000); // Show ratings for 5 seconds
        return () => clearTimeout(timerId);
    }
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase === 'COUNTDOWN' && countdown !== null) {
        if (countdown > 0) {
            const timerId = setTimeout(() => {
                setCountdown(c => (c !== null ? c - 1 : null));
            }, 1000);
            return () => clearTimeout(timerId);
        } else {
            // Countdown finished, start the game
            setGamePhase('FIRST_HALF');
            setIsTimerRunning(true);
            setCountdown(null);
        }
    }
  }, [gamePhase, countdown]);

  useEffect(() => {
    if (tutorialPauseInfo) {
      const timer = setTimeout(() => {
        setTutorialPauseInfo(null);
      }, 4000); // Display for 4 seconds
      return () => clearTimeout(timer);
    }
  }, [tutorialPauseInfo]);

  useEffect(() => {
    if (gamePhase === 'FULL_TIME') {
        const scoreA = score[matchTeamA.id] || 0;
        const scoreB = score[matchTeamB.id] || 0;
        if (scoreA > scoreB) setWinner(matchTeamA);
        else if (scoreB > scoreA) setWinner(matchTeamB);
        else setWinner('draw');
    } else {
        setWinner(null);
    }
}, [gamePhase, score, matchTeamA, matchTeamB]);


  const handleGoal = useCallback((scoringTeamId: Team) => {
    if (!isGameActive) return;
    setScore(prev => ({ ...prev, [scoringTeamId]: (prev[scoringTeamId] || 0) + 1 }));
  }, [isGameActive]);
  
  const handleFirstBuffPickup = useCallback((buffType: BuffType, team: TeamInfo) => {
    if (!showBuffTutorial) {
      setSeenBuffs(prev => new Set(prev).add(buffType));
      return;
    }
    const buffInfo = buffDefinitions[buffType];
    if (!buffInfo) return; // Don't show tutorial for a buff that somehow doesn't exist
    setTutorialPauseInfo({ buffType, team });
    setSeenBuffs(prev => new Set(prev).add(buffType));
  }, [showBuffTutorial, buffDefinitions]);

  const handleStartMatch = useCallback(async () => {
    setVideoBlobUrl(null);
    setVideoStatus('idle');
    setSeenBuffs(new Set());
    setTutorialPauseInfo(null);
    setStoppageTime(0);

    setScore({ [matchTeamA.id]: 0, [matchTeamB.id]: 0 });
    resetStats(true);
    setGameTime(0);

    if (useRealRatings) {
        setIsUpdatingRatings(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Para os times "${teamA.name}" (fundado em ${teamA.foundationDate || 'N/A'}) e "${teamB.name}" (fundado em ${teamB.foundationDate || 'N/A'}), forneça um score de "momentum" para cada um entre 50 (em má fase) e 100 (sequência de vitórias). Baseie-se no desempenho mais recente do mundo real e nas notícias até a data de hoje. Responda APENAS com um objeto JSON com os nomes dos times como chaves e seus scores de momentum como valores. Exemplo: {"${teamA.name}": 88, "${teamB.name}": 72}.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const jsonText = response.text.match(/{[\s\S]*}/)?.[0];
            if (jsonText) {
                const momentumData = JSON.parse(jsonText);
                const defaultRatings = { attack: 75, defense: 75, midfield: 75, form: 75 };
                
                const newTeamA = { ...teamA, ratings: { 
                    ...(teamA.ratings || defaultRatings),
                    momentum: momentumData[teamA.name] || 75 
                } };
                const newTeamB = { ...teamB, ratings: { 
                    ...(teamB.ratings || defaultRatings),
                    momentum: momentumData[teamB.name] || 75 
                } };
                
                setCustomTeams(s => ({
                  ...s,
                  [newTeamA.id]: newTeamA,
                  [newTeamB.id]: newTeamB,
                }));

                setSettings(s => ({
                    ...s,
                    teamA: newTeamA,
                    teamB: newTeamB,
                }));
            }
        } catch (e) {
            console.error("Failed to update momentum, using default values.", e);
        } finally {
            setIsUpdatingRatings(false);
        }
    }
    
    if (useRealRatings) {
        setGamePhase('RATINGS_SHOWCASE');
    } else {
        setGamePhase('COUNTDOWN');
        setCountdown(3);
    }
    
    setView('GAME');
    setResetCounter(c => c + 1);
    setActiveBuffs([]);
  }, [matchTeamA, matchTeamB, resetStats, useRealRatings, teamA, teamB, setSettings, setCustomTeams]);

  const handlePauseToggle = useCallback(() => {
    if (isGameActive) {
      setIsPaused(prev => !prev);
    }
  }, [isGameActive]);

  const handleRestartMatch = useCallback(() => {
    setIsPaused(false);
    setVideoBlobUrl(null);
    setVideoStatus('idle');
    setScore({ [matchTeamA.id]: 0, [matchTeamB.id]: 0 });
    resetStats(true);
    setGameTime(0);
    if (useRealRatings) {
        setGamePhase('RATINGS_SHOWCASE');
    } else {
        setGamePhase('COUNTDOWN');
        setCountdown(3);
    }
    setIsTimerRunning(false); // Timer will start after countdown
    setResetCounter(c => c + 1);
    setActiveBuffs([]);
    setSeenBuffs(new Set());
    setTutorialPauseInfo(null);
    setWinner(null);
    setStoppageTime(0);
  }, [matchTeamA, matchTeamB, resetStats, useRealRatings]);

  const handleBackToMenu = useCallback(() => {
    setIsPaused(false);
    setView('MENU');
    setGamePhase('PRE_GAME');
    setIsTimerRunning(false);
    setGameTime(0);
    setScore({});
    resetStats(true);
    setActiveBuffs([]);
    setVideoBlobUrl(null);
    setVideoStatus('idle');
    setRecordMatch(false);
    setSeenBuffs(new Set());
    setTutorialPauseInfo(null);
    setWinner(null);
    setStoppageTime(0);
  }, [resetStats, setRecordMatch]);

  const handleCustomLogoUpdate = useCallback((teamId: Team, field: 'logo' | 'logo2', dataUrl: string | null) => {
    setCustomLogos(prev => {
        const newLogos = JSON.parse(JSON.stringify(prev));
        if (!newLogos[teamId]) {
            if (!dataUrl) return prev;
            newLogos[teamId] = {};
        }

        if (dataUrl) {
            newLogos[teamId][field] = dataUrl;
        } else {
            delete newLogos[teamId][field];
            if (Object.keys(newLogos[teamId]).length === 0) {
                delete newLogos[teamId];
            }
        }
        return newLogos;
    });
  }, []);

  const handleTeamInfoUpdate = useCallback((teamId: Team, updates: Partial<TeamInfo>) => {
      const teamToUpdate = mergedAvailableTeams.find(t => t.id === teamId) || customTeams[teamId];
      if (!teamToUpdate) return;
      
      const validUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ) as Partial<TeamInfo>;

      const updatedTeam = { ...teamToUpdate, ...validUpdates, id: teamId };

      setCustomTeams(prev => ({ ...prev, [teamId]: updatedTeam }));

      setSettings(s => ({
          ...s,
          teamA: s.teamA.id === teamId ? updatedTeam : s.teamA,
          teamB: s.teamB.id === teamId ? updatedTeam : s.teamB,
      }));

      if ('logo' in updates) {
        handleCustomLogoUpdate(teamId, 'logo', null);
      }
      if ('logo2' in updates) {
          handleCustomLogoUpdate(teamId, 'logo2', null);
      }
  }, [mergedAvailableTeams, customTeams, handleCustomLogoUpdate]);
  
  const handleAddNewTeam = useCallback((newTeam: TeamInfo) => {
      setCustomTeams(prev => ({ ...prev, [newTeam.id]: newTeam }));
  }, []);

  if (isLoading) {
    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[300]">
            <div className="flex flex-col items-center gap-4 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                <p className="text-xl font-semibold">Carregando dados...</p>
            </div>
        </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden ${matchLayout === 'vertical' ? 'p-2' : 'p-4'} gap-4`}>
        {isUpdatingRatings && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    <p className="text-xl font-semibold">Atualizando scores com IA...</p>
                </div>
            </div>
        )}

        {view !== 'GAME' && <NotificationFeed />}

        <div className="flex-grow flex items-center justify-center w-full">
            {view === 'MENU' && (
                <div className="text-center animate-fade-in flex flex-col items-center gap-6">
                    <h1 className="text-6xl md:text-8xl font-black text-white font-display" style={{ textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 40px #22d3ee' }}>SimulaFut</h1>
                    <p className="text-xl text-gray-300 max-w-2xl">Uma simulação de futebol baseada em física totalmente personalizável. Crie times, gere buffs com IA e assista ao caos se desenrolar.</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button onClick={() => { setView('MATCH_SETUP'); setSetupEntryPoint('MENU'); }} className="btn-ripple px-10 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg text-xl">Partida Rápida</button>
                        <button onClick={() => { setView('CHAMPIONSHIP'); }} className="btn-ripple px-10 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-lg text-xl">Modo Campeonato</button>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <button onClick={() => setIsHowToPlayOpen(true)} className="btn-ripple px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg">Como Jogar?</button>
                        {!jsonBlobUri ? (
                            <div className="flex flex-col items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                                 <div className="flex gap-2">
                                     <input type="text" value={blobUriInput} onChange={e => setBlobUriInput(e.target.value)} placeholder="Cole o código de sincronização aqui" className="p-2 rounded bg-gray-900 text-white border border-gray-700 w-64"/>
                                    <button onClick={async () => {
                                        if(blobUriInput) {
                                            setJsonBlobUri(blobUriInput);
                                            window.localStorage.setItem(BLOB_URI_STORAGE_KEY, blobUriInput);
                                        }
                                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Entrar</button>
                                 </div>
                                 <button onClick={async () => {
                                     setIsGeneratingCode(true);
                                     try {
                                         const dataToSave = {
                                            settings,
                                            audioSettings,
                                            customLogos,
                                            customTeams,
                                            buffDefinitions,
                                         };
                                         const newUri = await saveData(dataToSave, null);
                                         setJsonBlobUri(newUri);
                                         window.localStorage.setItem(BLOB_URI_STORAGE_KEY, newUri);
                                         setNewSyncCode(newUri);
                                     } catch (e) {
                                         alert('Não foi possível gerar um novo código. Verifique sua conexão com a internet.');
                                     } finally {
                                         setIsGeneratingCode(false);
                                     }
                                 }} disabled={isGeneratingCode} className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-500">
                                     {isGeneratingCode && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                                     Gerar Novo Código de Sincronização
                                 </button>
                            </div>
                        ) : (
                             <button onClick={handleLogout} className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg">Sair (Desconectar)</button>
                        )}
                    </div>
                </div>
            )}
            {view === 'MATCH_SETUP' && (
                <div className="flex flex-col items-center gap-4 w-full">
                    <MatchSetup
                        teamA={matchTeamA}
                        teamB={matchTeamB}
                        setTeamA={setTeamA}
                        setTeamB={setTeamB}
                        availableTeams={mergedAvailableTeams}
                        onAddNewTeam={handleAddNewTeam}
                        onTeamInfoUpdate={handleTeamInfoUpdate}
                        onCustomLogoUpdate={handleCustomLogoUpdate}
                        onDeleteTeam={(teamId) => {
                            const newCustomTeams = { ...customTeams };
                            delete newCustomTeams[teamId];
                            setCustomTeams(newCustomTeams);
                            // If deleted team was selected, reset to default
                            if (teamA.id === teamId) setTeamA(INITIAL_TEAMS[0]);
                            if (teamB.id === teamId) setTeamB(INITIAL_TEAMS[1]);
                        }}
                        onResetSettings={handleResetSettings}
                        isSettingsOpen={isSettingsOpen}
                        onSettingsToggle={() => setIsSettingsOpen(p => !p)}
                        buffDefinitions={buffDefinitions}
                        onBuffDefinitionsChange={setBuffDefinitions}
                        // Pass all the settings props
                        recordMatch={recordMatch} onRecordMatchChange={setRecordMatch}
                        recordingAspectRatio={recordingAspectRatio} onAspectRatioChange={setRecordingAspectRatio}
                        buffsEnabled={buffsEnabled} onBuffsEnabledChange={setBuffsEnabled}
                        showBuffTutorial={showBuffTutorial} onShowBuffTutorialChange={setShowBuffTutorial}
                        autoShootEnabled={autoShootEnabled} onAutoShootEnabledChange={setAutoShootEnabled}
                        matchDurationSeconds={matchDurationSeconds} onMatchDurationSecondsChange={setMatchDurationSeconds}
                        screenShakeEnabled={screenShakeEnabled} onScreenShakeChange={setScreenShakeEnabled}
                        gameSpeed={gameSpeed} onGameSpeedChange={setGameSpeed}
                        useRealRatings={useRealRatings} onUseRealRatingsChange={setUseRealRatings}
                        classicModeEnabled={classicModeEnabled} onClassicModeEnabledChange={setClassicModeEnabled}
                        homeTeamId={homeTeamId} onHomeTeamIdChange={setHomeTeamId}
                        goalieIntelligence={goalieIntelligence} onGoalieIntelligenceChange={setGoalieIntelligence}
                        goalieSpeed={goalieSpeed} onGoalieSpeedChange={setGoalieSpeed}
                        matchLayout={matchLayout} onMatchLayoutChange={setMatchLayout}
                        fieldScale={fieldScale} onFieldScaleChange={setFieldScale}
                        playerSize={playerSize} onPlayerSizeChange={setPlayerSize}
                        ballSize={ballSize} onBallSizeChange={setBallSize}
                        goalHeight={goalHeight} onGoalHeightChange={setGoalHeight}
                        goalieSize={goalieSize} onGoalieSizeChange={setGoalieSize}
                        tackleDistance={tackleDistance} onTackleDistanceChange={setTackleDistance}
                        scoreboardOffset={scoreboardOffset} onScoreboardOffsetChange={setScoreboardOffset}
                        gameFieldOffset={gameFieldOffset} onGameFieldOffsetChange={setGameFieldOffset}
                        minPlayerSpeed={minPlayerSpeed} onMinPlayerSpeedChange={setMinPlayerSpeed}
                        maxPlayerSpeed={maxPlayerSpeed} onMaxPlayerSpeedChange={setMaxPlayerSpeed}
                        selectedBall={selectedBall} onSelectedBallChange={setSelectedBall}
                        scoreboardScale={scoreboardScale} onScoreboardScaleChange={setScoreboardScale}
                        customBallIcon={customBallIcon} onCustomBallIconChange={setCustomBallIcon}
                        // Audio props
                        musicFile={musicFile} onMusicFileChange={setMusicFile}
                        musicVolume={musicVolume} onMusicVolumeChange={setMusicVolume}
                        ambianceFile={ambianceFile} onAmbianceFileChange={setAmbianceFile}
                        ambianceVolume={ambianceVolume} onAmbianceVolumeChange={setAmbianceVolume}
                        sfxVolume={sfxVolume} onSfxVolumeChange={setSfxVolume}
                        sfx={sfx} onSfxChange={setSfx}
                    />
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => setView(setupEntryPoint)} className="btn-ripple px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg text-lg">Voltar</button>
                        <button onClick={handleStartMatch} className="btn-ripple px-12 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg animate-pulse">Iniciar Simulação</button>
                    </div>
                </div>
            )}
            {view === 'CHAMPIONSHIP' && (
                <ChampionshipView 
                    onBack={() => setView('MENU')}
                    onSetupSimulation={(teamA, teamB) => {
                        handleTeamInfoUpdate(teamA.id, teamA);
                        handleTeamInfoUpdate(teamB.id, teamB);
                        setSettings(s => ({...s, teamA, teamB, homeTeamId: teamA.id, useRealRatings: true}));
                        setSetupEntryPoint('CHAMPIONSHIP');
                        setView('MATCH_SETUP');
                    }}
                />
            )}
            {view === 'GAME' && (
                <div 
                    className="flex flex-col items-center justify-start w-full transition-all duration-500"
                    style={{ 
                        gap: `${gameFieldOffset}px`, 
                        paddingTop: `${scoreboardOffset}px` 
                    }}
                >
                    <Scoreboard 
                        score={score} 
                        gameTime={gameTime} 
                        gamePhase={gamePhase}
                        stoppageTime={stoppageTime}
                        teamA={matchTeamA}
                        teamB={matchTeamB}
                        layout={matchLayout}
                        scoreboardScale={scoreboardScale}
                        frenzyTeam={frenzyTeam}
                    />
                    <div className={`flex w-full ${matchLayout === 'vertical' ? 'flex-col max-w-lg' : 'flex-row max-w-6xl items-start'}`}>
                       <div className="flex-1 flex flex-col items-center">
                         <ActiveBuffsDisplay activeBuffs={activeBuffs} teamInfo={matchTeamA} buffDefinitions={buffDefinitions} layout={matchLayout} />
                       </div>
                       <div className={`${matchLayout === 'vertical' ? 'w-full' : 'w-auto'}`}>
                         <GameField
                            key={resetCounter}
                            onGoal={handleGoal}
                            resetTrigger={resetCounter}
                            isGameActive={isGameActive}
                            gamePhase={gamePhase}
                            isPaused={isEffectivelyPaused}
                            matchBuffs={matchBuffs}
                            activeBuffs={activeBuffs}
                            onActiveBuffsChange={setActiveBuffs}
                            teamA={matchTeamA}
                            teamB={matchTeamB}
                            onBuffPickup={(team, buffType) => {}}
                            onBuffSpawn={(buffType) => {}}
                            seenBuffs={seenBuffs}
                            onFirstBuffPickup={handleFirstBuffPickup}
                            autoShootEnabled={autoShootEnabled}
                            winner={winner}
                            buffDefinitions={buffDefinitions}
                            buffsEnabled={buffsEnabled}
                            recordMatch={recordMatch}
                            aspectRatio={recordingAspectRatio}
                            onRecordingComplete={setVideoBlobUrl}
                            onRecordingStatusChange={setVideoStatus}
                            score={score}
                            gameTime={gameTime}
                            screenShakeEnabled={screenShakeEnabled}
                            gameSpeed={gameSpeed}
                            useRealRatings={useRealRatings}
                            classicModeEnabled={classicModeEnabled}
                            homeTeamId={homeTeamId}
                            goalieIntelligence={goalieIntelligence}
                            goalieSpeed={goalieSpeed}
                            matchLayout={matchLayout}
                            fieldScale={fieldScale}
                            playerSize={playerSize}
                            ballSize={ballSize}
                            goalHeight={goalHeight}
                            goalieSize={goalieSize}
                            tackleDistance={tackleDistance}
                            matchStats={matchStats}
                            setMatchStats={setMatchStats}
                            minPlayerSpeed={minPlayerSpeed}
                            maxPlayerSpeed={maxPlayerSpeed}
                            selectedBall={selectedBall}
                            countdown={countdown}
                            isBallInPenaltyAreaRef={isBallInPenaltyAreaRef}
                            onPlaySfx={handlePlaySfx}
                            losingTeamId={frenzyTeam}
                            customBallIcon={customBallIcon}
                         />
                       </div>
                        <div className="flex-1 flex flex-col items-center">
                          <ActiveBuffsDisplay activeBuffs={activeBuffs} teamInfo={matchTeamB} buffDefinitions={buffDefinitions} layout={matchLayout} isTeamB />
                        </div>
                    </div>
                     {gamePhase === 'FULL_TIME' && (
                        <>
                          <MatchStatsDisplay stats={matchStats} teamA={matchTeamA} teamB={matchTeamB} />
                          {videoBlobUrl && (
                             <div className="text-center my-4 p-4 bg-gray-800/80 rounded-lg">
                                 <h3 className="text-xl font-bold text-white mb-2">Gravação da Partida</h3>
                                 <video src={videoBlobUrl} controls className="max-w-md w-full rounded-lg" />
                                 <a href={videoBlobUrl} download={`kinetic_soccer_${new Date().toISOString()}.webm`} className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Baixar Vídeo</a>
                             </div>
                          )}
                          <MatchRecapGenerator teamA={matchTeamA} teamB={matchTeamB} score={score} winner={winner} matchStats={matchStats} />
                        </>
                    )}
                </div>
            )}
        </div>
        
        {gamePhase === 'HALF_TIME' && <HalftimeInterstitial onComplete={() => {
            setGamePhase('SECOND_HALF');
            setIsTimerRunning(true);
        }} />}

        {gamePhase === 'RATINGS_SHOWCASE' && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]">
                <PreMatchRatingsDisplay teamA={teamA} teamB={teamB} homeTeamId={homeTeamId} classicModeEnabled={classicModeEnabled} />
            </div>
        )}

        {tutorialPauseInfo && (
            <BuffExplanationCard 
                buffType={tutorialPauseInfo.buffType} 
                team={tutorialPauseInfo.team}
                buffInfo={buffDefinitions[tutorialPauseInfo.buffType]}
            />
        )}

        <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} buffDefinitions={buffDefinitions} />
        
        <SyncCodeModal isOpen={!!newSyncCode} onClose={() => setNewSyncCode(null)} syncCode={newSyncCode} />

        {view === 'GAME' && <GameControls onPause={handlePauseToggle} onRestart={handleRestartMatch} onMenu={handleBackToMenu} isPaused={isEffectivelyPaused} isDisabled={!isGameActive && gamePhase !== 'FULL_TIME'}/>}
        <SavingIndicator status={savingStatus} />
    </div>
  );
};

export default App;