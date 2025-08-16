

export interface Vector {
  x: number;
  y: number;
}

export type Team = string; // Now a team ID, e.g., 'corinthians', 'palmeiras'
export type ObjectTeam = Team | 'ball';

export type MatchLayout = 'horizontal' | 'vertical';

export interface TeamInfo {
  id: Team;
  name: string;
  foundationDate?: string;
  logo: string;
  color: string;
  color2: string; // Secondary color
  logo2?: string; // Optional secondary logo
  category?: string; // Category for grouping teams (e.g., 'Premier League')
  ratings?: {
    attack: number;
    defense: number;
    midfield: number;
    form: number;
    momentum?: number;
  };
}

export interface CircleObject {
  id: string;
  position: Vector;
  velocity: Vector;
  radius: number;
  color: string;
  team: ObjectTeam;
  mass: number;
  bounciness: number;
  friction: number;
  // Buff-related modifiers
  sizeModifier?: number;
  isGhost?: boolean;
  isConfused?: boolean;
  isFrozen?: boolean;
  isGoalie?: boolean;
  isInvisible?: boolean;
  isBlinded?: boolean;
  repelsBall?: boolean;
  // Visual effects
  trail?: Vector[];
}

export interface Score {
  [key: Team]: number;
}

export type GamePhase = 'PRE_GAME' | 'RATINGS_SHOWCASE' | 'COUNTDOWN' | 'FIRST_HALF' | 'FIRST_HALF_STOPPAGE' | 'HALF_TIME' | 'SECOND_HALF' | 'SECOND_HALF_STOPPAGE' | 'FULL_TIME';

export interface BallDefinition {
  id: string;
  name: string;
  mass: number;
  friction: number; // Air resistance/drag
  bounciness: number; // Wall collision energy retention (0-1)
}

export interface TeamStats {
  touches: number;
  shots: number;
  shotsOnTarget: number;
  possession: number; // Stored as frames, calculated as percentage later
  saves: number;
}

export interface MatchStats {
    [key: Team]: TeamStats;
}


// --- Buff System Types ---

export type BuffType = string;

export interface BuffInfo {
    name: string;
    description: string;
    color: string;
    symbol: string;
    duration: number; // in frames
    type: 'attack' | 'defense' | 'utility';
    permanent?: boolean; // Lasts until match ends, doesn't respawn
    unique?: boolean; // Only one player can have this buff active at a time
    effectTemplate?: BuffType; // For AI-generated buffs to reuse existing logic
}

export interface BuffObject {
    id: string;
    position: Vector;
    type: BuffType;
    radius: number;
    isTrap?: boolean;
    trapDuration?: number; // in frames
    ownerTeam?: Team;
}

export interface ActiveBuff {
    id:string;
    team: Team;
    type: BuffType;
    duration: number; // in frames
    initialDuration: number;
    affectedPlayerId?: string; 
}

export interface NotificationPart {
    text: string;
    color?: string;
    bold?: boolean;
}

export interface UINotification {
    id: number;
    parts: NotificationPart[];
}

export interface AudioSettings {
  musicFile: string | null;
  musicVolume: number;
  ambianceFile: string | null;
  ambianceVolume: number;
  sfxVolume: number;
  sfx: Record<string, string | null>;
}

export interface CustomLogos {
  [key: Team]: { logo?: string; logo2?: string };
}

export type CustomTeams = Record<Team, TeamInfo>;

export interface AppData {
  teamA: TeamInfo;
  teamB: TeamInfo;
  recordMatch: boolean;
  recordingAspectRatio: '16:9' | '9:16';
  buffsEnabled: boolean;
  showBuffTutorial: boolean;
  autoShootEnabled: boolean;
  matchDurationSeconds: number;
  goalieIntelligence: number;
  goalieSpeed: number;
  useRealRatings: boolean;
  classicModeEnabled: boolean;
  homeTeamId: Team | null;
  screenShakeEnabled: boolean;
  gameSpeed: number;
  matchLayout: MatchLayout;
  fieldScale: number;
  playerSize: number;
  ballSize: number;
  goalHeight: number;
  goalieSize: number;
  tackleDistance: number;
  scoreboardOffset: number;
  gameFieldOffset: number;
  minPlayerSpeed: number;
  maxPlayerSpeed: number;
  selectedBall: BallDefinition;
  scoreboardScale: number;
  customBallIcon: string | null;
}