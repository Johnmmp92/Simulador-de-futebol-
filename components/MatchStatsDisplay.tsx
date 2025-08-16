import React from 'react';
import { MatchStats, TeamInfo } from '../types';

interface MatchStatsDisplayProps {
    stats: MatchStats;
    teamA: TeamInfo;
    teamB: TeamInfo;
}

const StatBar: React.FC<{ valueA: number; valueB: number; colorA: string; colorB: string }> = ({ valueA, valueB, colorA, colorB }) => {
    const total = valueA + valueB;
    const percentA = total > 0 ? (valueA / total) * 100 : 50;
    
    return (
        <div className="w-full bg-gray-700/50 rounded-full h-6 flex overflow-hidden border-2 border-gray-600">
            <div
                className="h-full rounded-l-full transition-all duration-500"
                style={{ width: `${percentA}%`, backgroundColor: colorA, boxShadow: `0 0 10px ${colorA}` }}
            />
            <div
                className="h-full rounded-r-full transition-all duration-500"
                style={{ width: `${100-percentA}%`, backgroundColor: colorB, boxShadow: `0 0 10px ${colorB}` }}
            />
        </div>
    );
};

interface StatRowProps {
    label: string;
    valueA: string | number;
    valueB: string | number;
    colorA: string;
    colorB: string;
    teamA: TeamInfo;
    teamB: TeamInfo;
}

const StatRow: React.FC<StatRowProps> = ({ label, valueA, valueB, colorA, colorB, teamA, teamB }) => (
    <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
        <div className="flex justify-around items-center text-2xl font-bold font-display">
            <div className="flex items-center gap-3">
                <img src={teamA.logo} alt={teamA.name} className="w-10 h-10 bg-white rounded-full p-1" />
                <span style={{ color: colorA }}>{valueA}</span>
            </div>
            <span className="text-gray-500 text-lg">vs</span>
             <div className="flex items-center gap-3">
                <span style={{ color: colorB }}>{valueB}</span>
                 <img src={teamB.logo} alt={teamB.name} className="w-10 h-10 bg-white rounded-full p-1" />
            </div>
        </div>
    </div>
);


export const MatchStatsDisplay: React.FC<MatchStatsDisplayProps> = ({ stats, teamA, teamB }) => {
    const statsA = stats[teamA.id] || { touches: 0, shots: 0, shotsOnTarget: 0, possession: 0, saves: 0 };
    const statsB = stats[teamB.id] || { touches: 0, shots: 0, shotsOnTarget: 0, possession: 0, saves: 0 };
    const totalPossession = statsA.possession + statsB.possession;

    const possessionPercentA = totalPossession > 0 ? Math.round((statsA.possession / totalPossession) * 100) : 50;
    const possessionPercentB = 100 - possessionPercentA;
    
    const colorA = teamA.color === '#000000' ? teamA.color2 : teamA.color;
    const colorB = teamB.color === '#000000' ? teamB.color2 : teamB.color;

    return (
        <div className="w-full max-w-2xl bg-gray-900/80 border-2 border-cyan-500/50 rounded-2xl p-6 my-4 shadow-2xl backdrop-blur-sm animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-yellow-300 mb-6 font-display" style={{textShadow: '0 0 10px #facc15'}}>Estatísticas da Partida</h2>
            
            <div className="space-y-6">
                {/* Possession */}
                <div>
                    <h3 className="text-xl font-bold text-center text-white mb-2">Posse de Bola</h3>
                    <div className="flex justify-between items-center text-2xl font-bold font-display mb-2">
                        <span style={{ color: colorA }}>{possessionPercentA}%</span>
                        <span style={{ color: colorB }}>{possessionPercentB}%</span>
                    </div>
                    <StatBar valueA={statsA.possession} valueB={statsB.possession} colorA={colorA} colorB={colorB} />
                </div>
                
                {/* Shots on Target */}
                <StatRow 
                    label="Chutes no Alvo / Chutes Totais"
                    valueA={`${statsA.shotsOnTarget} / ${statsA.shots}`}
                    valueB={`${statsB.shotsOnTarget} / ${statsB.shots}`}
                    colorA={colorA}
                    colorB={colorB}
                    teamA={teamA}
                    teamB={teamB}
                />

                 {/* Touches */}
                <StatRow 
                    label="Toques na Bola"
                    valueA={statsA.touches}
                    valueB={statsB.touches}
                    colorA={colorA}
                    colorB={colorB}
                    teamA={teamA}
                    teamB={teamB}
                />

                 {/* Saves */}
                <StatRow 
                    label="Defesas do Goleiro"
                    valueA={statsA.saves}
                    valueB={statsB.saves}
                    colorA={colorA}
                    colorB={colorB}
                    teamA={teamA}
                    teamB={teamB}
                />
            </div>
             <style>{`
                @keyframes fade-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};