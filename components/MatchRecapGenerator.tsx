
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { TeamInfo, Score, MatchStats } from '../types';

type Winner = TeamInfo | 'draw' | null;

// Helper component for loading spinner
const Spinner: React.FC = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

// Component Props
interface MatchRecapGeneratorProps {
    teamA: TeamInfo;
    teamB: TeamInfo;
    score: Score;
    winner: Winner;
    matchStats: MatchStats;
}

export const MatchRecapGenerator: React.FC<MatchRecapGeneratorProps> = ({ teamA, teamB, score, winner, matchStats }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [recap, setRecap] = useState<{ title: string; tags: string[] } | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateRecap = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setRecap(null);

        const scoreA = score[teamA.id] || 0;
        const scoreB = score[teamB.id] || 0;
        const statsA = matchStats[teamA.id] || { possession: 0, shots: 0 };
        const statsB = matchStats[teamB.id] || { possession: 0, shots: 0 };
        const totalPossession = (statsA.possession || 0) + (statsB.possession || 0);
        const possessionA = totalPossession > 0 ? Math.round((statsA.possession / totalPossession) * 100) : 50;
        const possessionB = 100 - possessionA;
        
        const prompt = `
            Você é um editor de esportes criando uma chamada para uma partida de futebol para redes sociais.
            A partida foi entre ${teamA.name} e ${teamB.name}.
            O placar final foi ${teamA.name} ${scoreA} x ${scoreB} ${teamB.name}.
            
            Estatísticas-chave:
            - Chutes: ${teamA.name} (${statsA.shots}), ${teamB.name} (${statsB.shots})
            - Posse de bola: ${teamA.name} (${possessionA}%), ${teamB.name} (${possessionB}%)
            
            Sua tarefa é gerar um título e hashtags.
            1.  **Título:** Crie um título chamativo e intrigante que **NÃO REVELE o placar final ou o vencedor**. O objetivo é criar suspense e curiosidade. Por exemplo: "Que Jogo! Emoção até o fim entre ${teamA.name} e ${teamB.name}!" ou "Um confronto de titãs! Veja o que aconteceu na partida de hoje."
            2.  **Hashtags:** Crie 7 hashtags relevantes para a partida. Elas podem ser sobre os times, o placar, ou o campeonato.

            Responda APENAS com um objeto JSON.
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { 
                                type: Type.STRING,
                                description: "Um título chamativo para a partida que não revele o resultado."
                            },
                            tags: {
                                type: Type.ARRAY,
                                description: "Uma lista de 7 hashtags relevantes começando com #.",
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["title", "tags"]
                    }
                }
            });

            const jsonText = response.text.match(/{[\s\S]*}/)?.[0];
            if (!jsonText) {
                throw new Error("Resposta da IA não continha JSON válido.");
            }
            const data = JSON.parse(jsonText);
            
            // Ensure tags start with #
            const formattedTags = data.tags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag.replace(/\s/g, '')}`);
            
            setRecap({ ...data, tags: formattedTags });

        } catch (e) {
            console.error("Erro ao gerar resumo:", e);
            setError('Não foi possível gerar o resumo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, [teamA, teamB, score, winner, matchStats]);

    const handleCopy = () => {
        if (!recap) return;
        const textToCopy = `${recap.title}\n\n${recap.tags.join(' ')}`;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-md mx-auto my-4 p-4 bg-gray-800/80 rounded-xl border border-gray-700 backdrop-blur-sm">
            {!recap && (
                 <button 
                    onClick={handleGenerateRecap} 
                    disabled={isLoading}
                    className="btn-ripple w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-3 text-lg disabled:bg-gray-600 disabled:cursor-wait"
                >
                    {isLoading ? <Spinner /> : '🧠'}
                    <span>{isLoading ? 'Gerando Resumo...' : 'Gerar Resumo com IA'}</span>
                </button>
            )}

            {error && <p className="text-red-400 text-center mt-2">{error}</p>}

            {recap && (
                <div className="animate-fade-in text-center space-y-3">
                    <h3 className="text-xl font-bold text-white">{recap.title}</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {recap.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-700 text-cyan-300 rounded-full text-sm font-semibold">{tag}</span>
                        ))}
                    </div>
                     <button 
                        onClick={handleCopy}
                        className={`btn-ripple w-full mt-2 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-colors duration-200 ${isCopied ? 'bg-green-600' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                    >
                        {isCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            )}
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