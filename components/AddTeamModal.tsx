import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { TeamInfo } from '../types';

const Spinner: React.FC<{ size?: string }> = ({ size = '6' }) => (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-cyan-400`}></div>
);

interface FoundTeamData {
    name: string;
    foundationDate: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    ratings: {
        attack: number;
        defense: number;
        midfield: number;
        form: number;
        momentum: number;
    };
}

interface AddTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamAdd: (newTeam: TeamInfo) => void;
}

export const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, onTeamAdd }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [foundTeams, setFoundTeams] = useState<FoundTeamData[]>([]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError('');
        setFoundTeams([]);

        const prompt = `Encontre times de futebol com o nome parecido com "${searchQuery}". Para cada time encontrado, forneça os seguintes dados com base nas informações mais recentes e precisas disponíveis:
        - name: O nome comum e mais conhecido do time.
        - foundationDate: O ano em que o time foi fundado.
        - logoUrl: Uma URL direta para o logo do time (preferencialmente SVG ou PNG de alta qualidade).
        - primaryColor: A cor primária do time em formato hexadecimal (ex: '#FFFFFF').
        - secondaryColor: A cor secundária do time em formato hexadecimal.
        - ratings: Um objeto contendo scores de 50 a 100 para 'attack', 'defense', 'midfield', 'form', e 'momentum'.
        
        Retorne os resultados como um array JSON de objetos, mesmo que encontre apenas um time. Se nenhum time for encontrado, retorne um array vazio.`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                                name: { type: Type.STRING },
                                foundationDate: { type: Type.STRING },
                                logoUrl: { type: Type.STRING },
                                primaryColor: { type: Type.STRING },
                                secondaryColor: { type: Type.STRING },
                                ratings: {
                                    type: Type.OBJECT,
                                    properties: {
                                        attack: { type: Type.NUMBER },
                                        defense: { type: Type.NUMBER },
                                        midfield: { type: Type.NUMBER },
                                        form: { type: Type.NUMBER },
                                        momentum: { type: Type.NUMBER }
                                    },
                                    required: ['attack', 'defense', 'midfield', 'form', 'momentum']
                                }
                            },
                            required: ['name', 'foundationDate', 'logoUrl', 'primaryColor', 'secondaryColor', 'ratings']
                        }
                    }
                }
            });
            const jsonMatch = response.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch || !jsonMatch[0]) {
              throw new Error("A resposta da IA não continha um array JSON válido.");
            }
            const data = JSON.parse(jsonMatch[0]);
            setFoundTeams(data);
            if (data.length === 0) {
                setError("Nenhum time encontrado. Tente um nome diferente.");
            }
        } catch (e) {
            console.error("Failed to search for team:", e);
            setError("Ocorreu um erro ao buscar o time. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const handleSelectTeam = (teamData: FoundTeamData) => {
        const newTeam: TeamInfo = {
            id: teamData.name.toLowerCase().replace(/\s/g, '_').replace(/[^\w-]/g, '') + `_${Date.now()}`,
            name: teamData.name,
            foundationDate: teamData.foundationDate,
            logo: teamData.logoUrl,
            color: teamData.primaryColor,
            color2: teamData.secondaryColor,
            category: 'Personalizados (IA)',
            ratings: teamData.ratings,
        };
        onTeamAdd(newTeam);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-green-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-3xl font-bold text-green-300 font-display">Encontrar Time com IA</h2>
                    <button onClick={onClose} className="text-4xl text-gray-400 hover:text-white transition-transform hover:rotate-90">&times;</button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                         <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Digite o nome de um time..."
                            className="flex-grow p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                            autoFocus
                        />
                        <button onClick={handleSearch} disabled={isLoading || !searchQuery} className="btn-ripple w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2">
                             {isLoading ? <Spinner /> : '🔍'}
                            <span>{isLoading ? 'Buscando...' : 'Buscar'}</span>
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {foundTeams.length > 0 && (
                        foundTeams.map((team, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectTeam(team)}
                                className="w-full flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg text-left transition-colors hover:bg-gray-700/70 border border-gray-700 hover:border-green-400"
                            >
                                <img src={team.logoUrl} alt={team.name} className="w-14 h-14 bg-white/10 rounded-full p-1 object-contain flex-shrink-0" />
                                <div className="flex-grow">
                                    <h4 className="font-bold text-white text-lg">{team.name}</h4>
                                    <p className="text-gray-400 text-sm">Fundado em: {team.foundationDate}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-xs">
                                    <span style={{color: team.primaryColor}} className="font-bold">■</span>
                                    <span style={{color: team.secondaryColor}} className="font-bold">■</span>
                                </div>
                            </button>
                        ))
                    )}
                    {!isLoading && foundTeams.length === 0 && !error && (
                         <div className="text-center py-10 text-gray-500">
                             <p>Digite o nome de um time para a IA encontrar.</p>
                        </div>
                    )}
                    {isLoading && (
                         <div className="flex justify-center py-10">
                            <Spinner size="10"/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
