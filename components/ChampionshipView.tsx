


import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { TeamInfo } from '../types';

const Spinner: React.FC<{ size?: string }> = ({ size = '8' }) => (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-cyan-400`}></div>
);

interface ChampionshipViewProps {
    onSetupSimulation: (teamA: TeamInfo, teamB: TeamInfo) => void;
    onBack: () => void;
}

interface Match {
    homeTeam: string;
    homeTeamFoundationDate: string;
    awayTeam: string;
    awayTeamFoundationDate: string;
    date: string;
}

export const ChampionshipView: React.FC<ChampionshipViewProps> = ({ onSetupSimulation, onBack }) => {
    const [championshipName, setChampionshipName] = useState('Brasileirão Série A');
    const [roundNumber, setRoundNumber] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState<string | null>(null); // Store "home-away" ID
    const [error, setError] = useState('');

    const fetchMatches = async () => {
        if (!championshipName.trim()) return;
        setIsLoading(true);
        setError('');
        setMatches([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let prompt = ``;

            if (roundNumber.trim() || searchDate.trim()) {
                 prompt = `Liste os jogos de futebol do campeonato "${championshipName}"`;
                 if(roundNumber.trim()) {
                     prompt += ` para a rodada número ${roundNumber.trim()}`;
                 }
                 if(searchDate.trim()) {
                     prompt += ` que ocorrem próximos à data de "${searchDate.trim()}"`;
                 }
                 prompt += `.`;
            } else {
                 const today = new Date().toLocaleDateString('pt-BR');
                 prompt = `Considerando que a data de hoje é ${today}, liste os 10 jogos de futebol mais relevantes do campeonato "${championshipName}", focando nos jogos que aconteceram nos últimos 7 dias e os que acontecerão nos próximos 14 dias.`;
            }

            prompt += ` Para cada jogo, forneça o nome exato do time da casa, o ano de fundação do time da casa, o nome exato do time visitante, o ano de fundação do time visitante, e a data do jogo (incluindo o ano). Ordene os resultados por data. Responda APENAS com um array JSON de objetos.`;


            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                homeTeam: { type: Type.STRING },
                                homeTeamFoundationDate: { type: Type.STRING },
                                awayTeam: { type: Type.STRING },
                                awayTeamFoundationDate: { type: Type.STRING },
                                date: { type: Type.STRING }
                            },
                            required: ["homeTeam", "homeTeamFoundationDate", "awayTeam", "awayTeamFoundationDate", "date"]
                        }
                    }
                }
            });
            const jsonMatch = response.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch || !jsonMatch[0]) {
              throw new Error("A resposta da IA não continha um array JSON válido.");
            }
            const data = JSON.parse(jsonMatch[0]);
            setMatches(data);
        } catch (e) {
            console.error("Failed to fetch matches:", e);
            setError('Não foi possível buscar os jogos. Verifique o nome do campeonato e tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSimulate = async (match: Match) => {
        setIsSimulating(`${match.homeTeam}-${match.awayTeam}`);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Você é um analista de dados de futebol. Para a partida entre "${match.homeTeam}" (fundado em ${match.homeTeamFoundationDate}) e "${match.awayTeam}" (fundado em ${match.awayTeamFoundationDate}), forneça informações detalhadas e atributos comparativos para AMBOS os times. Para cada um, encontre: nome comum, cor primária (hex), cor secundária (hex), URL do logo (SVG/PNG), e atributos realistas para "ataque", "defesa", "meio-campo", "forma" e "momentum" (escala 50-100). O momentum deve refletir o desempenho recente do time (sequência de vitórias/derrotas), com base nas informações mais atuais. Os atributos devem refletir a força relativa entre os dois times e em comparação com benchmarks globais como Real Madrid (Ataque: 94) e Man City (Ataque: 95). Responda APENAS com um objeto JSON com chaves 'teamA' e 'teamB', cada um contendo 'teamName', 'primaryColor', 'secondaryColor', 'logoUrl', 'attack', 'defense', 'midfield', 'form', 'momentum'.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            teamA: {
                                type: Type.OBJECT,
                                properties: {
                                    teamName: { type: Type.STRING },
                                    primaryColor: { type: Type.STRING },
                                    secondaryColor: { type: Type.STRING },
                                    logoUrl: { type: Type.STRING },
                                    attack: { type: Type.NUMBER },
                                    defense: { type: Type.NUMBER },
                                    midfield: { type: Type.NUMBER },
                                    form: { type: Type.NUMBER },
                                    momentum: { type: Type.NUMBER },
                                },
                                required: ["teamName", "primaryColor", "secondaryColor", "logoUrl", "attack", "defense", "midfield", "form", "momentum"]
                            },
                            teamB: {
                                type: Type.OBJECT,
                                properties: {
                                    teamName: { type: Type.STRING },
                                    primaryColor: { type: Type.STRING },
                                    secondaryColor: { type: Type.STRING },
                                    logoUrl: { type: Type.STRING },
                                    attack: { type: Type.NUMBER },
                                    defense: { type: Type.NUMBER },
                                    midfield: { type: Type.NUMBER },
                                    form: { type: Type.NUMBER },
                                    momentum: { type: Type.NUMBER },
                                },
                                required: ["teamName", "primaryColor", "secondaryColor", "logoUrl", "attack", "defense", "midfield", "form", "momentum"]
                            }
                        },
                        required: ["teamA", "teamB"]
                    }
                }
            });

            const jsonMatch = response.text.match(/{[\s\S]*}/);
            if (!jsonMatch || !jsonMatch[0]) throw new Error("A resposta da IA não continha um objeto JSON válido.");
            const data = JSON.parse(jsonMatch[0]);

            const teamAInfo: TeamInfo = {
                id: data.teamA.teamName.toLowerCase().replace(/\s/g, '_').replace(/[^\w-]/g, ''),
                name: data.teamA.teamName,
                foundationDate: match.homeTeamFoundationDate,
                logo: data.teamA.logoUrl,
                color: data.teamA.primaryColor,
                color2: data.teamA.secondaryColor,
                ratings: {
                    attack: data.teamA.attack,
                    defense: data.teamA.defense,
                    midfield: data.teamA.midfield,
                    form: data.teamA.form,
                    momentum: data.teamA.momentum,
                }
            };
            const teamBInfo: TeamInfo = {
                id: data.teamB.teamName.toLowerCase().replace(/\s/g, '_').replace(/[^\w-]/g, ''),
                name: data.teamB.teamName,
                foundationDate: match.awayTeamFoundationDate,
                logo: data.teamB.logoUrl,
                color: data.teamB.primaryColor,
                color2: data.teamB.secondaryColor,
                ratings: {
                    attack: data.teamB.attack,
                    defense: data.teamB.defense,
                    midfield: data.teamB.midfield,
                    form: data.teamB.form,
                    momentum: data.teamB.momentum,
                }
            };

            onSetupSimulation(teamAInfo, teamBInfo);
            
        } catch (e) {
            console.error("Failed to setup simulation:", e);
            setError(`Não foi possível configurar a simulação para ${match.homeTeam} vs ${match.awayTeam}. Tente novamente.`);
        } finally {
            setIsSimulating(null);
        }
    };

    return (
        <div className="w-full max-w-4xl p-4 sm:p-6 bg-[#1f1f1f]/60 rounded-xl border border-gray-700 backdrop-blur-sm animate-fade-in relative">
            <button onClick={onBack} className="absolute top-4 left-4 btn-ripple px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                <span>←</span> Menu
            </button>
            <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-4 text-center tracking-wide font-display" style={{textShadow: '0 0 15px rgba(250, 204, 21, 0.5)'}}>
                Modo Campeonato 🏆
            </h2>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        value={championshipName}
                        onChange={(e) => setChampionshipName(e.target.value)}
                        placeholder="Ex: Premier League"
                        className="flex-grow p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg"
                    />
                    <button 
                        onClick={fetchMatches}
                        disabled={isLoading}
                        className="btn-ripple px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-3 text-lg"
                    >
                        {isLoading ? <><Spinner size="6" /> Buscando...</> : 'Buscar Jogos'}
                    </button>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <input
                        type="text"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(e.target.value)}
                        placeholder="Rodada (opcional)"
                        className="p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg"
                    />
                    <input
                        type="text"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        placeholder="Data (opcional, ex: '25/12/2024')"
                        className="p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg"
                    />
                </div>
            </div>

            {error && <p className="text-red-400 bg-red-900/50 border border-red-500 p-3 rounded-lg text-center mb-4">{error}</p>}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {matches.length > 0 ? (
                    matches.map((match, index) => (
                        <div key={index} className="bg-gray-800/70 p-4 rounded-xl border border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up" style={{animationDelay: `${index * 50}ms`}}>
                            <div className="text-center sm:text-left">
                                <p className="text-xl md:text-2xl font-bold text-white font-display tracking-wide">
                                    {match.homeTeam} <span className="text-gray-500 mx-2">vs</span> {match.awayTeam}
                                </p>
                                <p className="text-sm text-yellow-300 font-semibold">{match.date}</p>
                            </div>
                            <button 
                                onClick={() => handleSimulate(match)}
                                disabled={!!isSimulating}
                                className="btn-ripple px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                {isSimulating === `${match.homeTeam}-${match.awayTeam}` ? <><Spinner size="5" /> Configurando...</> : 'Simular Partida'}
                            </button>
                        </div>
                    ))
                ) : (
                    !isLoading && <p className="text-center text-gray-400 py-8">Digite o nome de um campeonato e clique em buscar para ver os jogos.</p>
                )}
                {isLoading && (
                     <div className="flex justify-center items-center py-8">
                        <Spinner size="12"/>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in {
                  from { opacity: 0; transform: scale(0.98); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
                 @keyframes slide-up {
                  from { transform: translateY(20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; opacity: 0; animation-fill-mode: forwards; }
              `}</style>
        </div>
    );
};