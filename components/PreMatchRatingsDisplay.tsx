import React, { useMemo } from 'react';
import { Team, TeamInfo } from '../types';

export const PreMatchRatingsDisplay: React.FC<{
    teamA: TeamInfo;
    teamB: TeamInfo;
    homeTeamId: Team | null;
    classicModeEnabled: boolean;
}> = ({ teamA, teamB, homeTeamId, classicModeEnabled }) => {
    
    const { finalRatingsA, finalRatingsB } = useMemo(() => {
        const defaultRatings = { attack: 75, defense: 75, midfield: 75, form: 75, momentum: 75 };

        const getMomentumModifier = (momentum: number | undefined) => {
            const m = momentum || 75;
            return 1 + (m - 75) / 25 * 0.05; // -5% to +5%
        };

        const applyModifiers = (baseRatings: typeof defaultRatings, isHome: boolean, momentum: number | undefined) => {
            const momentumMod = getMomentumModifier(momentum);
            const homeMod = isHome ? 1.05 : 1.0;

            return {
                attack: Math.min(100, baseRatings.attack * homeMod * momentumMod),
                defense: Math.min(100, baseRatings.defense * homeMod * momentumMod),
                midfield: Math.min(100, baseRatings.midfield * homeMod * momentumMod),
                form: Math.min(100, baseRatings.form * homeMod * momentumMod),
                momentum: baseRatings.momentum || 75,
            };
        };
        
        const baseRatingsA = { ...defaultRatings, ...teamA.ratings };
        const baseRatingsB = { ...defaultRatings, ...teamB.ratings };
        
        const modifiedA = applyModifiers(baseRatingsA, homeTeamId === teamA.id, baseRatingsA.momentum);
        const modifiedB = applyModifiers(baseRatingsB, homeTeamId === teamB.id, baseRatingsB.momentum);


        if (classicModeEnabled) {
            const balanceFactor = 0.5;
            const avgAttack = (modifiedA.attack + modifiedB.attack) / 2;
            const avgDefense = (modifiedA.defense + modifiedB.defense) / 2;
            const avgMidfield = (modifiedA.midfield + modifiedB.midfield) / 2;
            const avgForm = (modifiedA.form + modifiedB.form) / 2;

            const balancedA = {
                attack: Math.round(modifiedA.attack - (modifiedA.attack - avgAttack) * balanceFactor),
                defense: Math.round(modifiedA.defense - (modifiedA.defense - avgDefense) * balanceFactor),
                midfield: Math.round(modifiedA.midfield - (modifiedA.midfield - avgMidfield) * balanceFactor),
                form: Math.round(modifiedA.form - (modifiedA.form - avgForm) * balanceFactor),
                momentum: modifiedA.momentum,
            };
            const balancedB = {
                attack: Math.round(modifiedB.attack - (modifiedB.attack - avgAttack) * balanceFactor),
                defense: Math.round(modifiedB.defense - (modifiedB.defense - avgDefense) * balanceFactor),
                midfield: Math.round(modifiedB.midfield - (modifiedB.midfield - avgMidfield) * balanceFactor),
                form: Math.round(modifiedB.form - (modifiedB.form - avgForm) * balanceFactor),
                momentum: modifiedB.momentum,
            };
            return { finalRatingsA: balancedA, finalRatingsB: balancedB };
        }
        
        const roundedA = { attack: Math.round(modifiedA.attack), defense: Math.round(modifiedA.defense), midfield: Math.round(modifiedA.midfield), form: Math.round(modifiedA.form), momentum: modifiedA.momentum };
        const roundedB = { attack: Math.round(modifiedB.attack), defense: Math.round(modifiedB.defense), midfield: Math.round(modifiedB.midfield), form: Math.round(modifiedB.form), momentum: modifiedB.momentum };

        return { finalRatingsA: roundedA, finalRatingsB: roundedB };

    }, [teamA, teamB, homeTeamId, classicModeEnabled]);


    const RatingBar: React.FC<{ value: number, color: string }> = ({ value, color }) => {
        const width = ((value - 40) / 60) * 100; // Scale 40-100 to 0-100% for better visual difference
        return (
            <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                <div
                    className={`h-4 rounded-full transition-all duration-500`}
                    style={{ width: `${width}%`, backgroundColor: color }}
                />
            </div>
        );
    };

    const RatingRow: React.FC<{
        label: string;
        valueA: number;
        valueB: number;
    }> = ({ label, valueA, valueB }) => {
        const diff = valueA - valueB;
        const diffTextA = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '';
        const diffTextB = diff < 0 ? `(+${-diff})` : diff > 0 ? `(${-diff})` : '';
        const diffColorA = diff > 0 ? 'text-green-400' : 'text-red-400';
        const diffColorB = diff < 0 ? 'text-green-400' : 'text-red-400';

        return (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center justify-end gap-2">
                    <span className={`font-mono w-10 text-sm font-bold ${diff !== 0 ? diffColorA : 'text-gray-500'}`}>{diffTextA}</span>
                    <span className="font-bold font-display text-lg text-white w-8 text-right">{valueA}</span>
                    <RatingBar value={valueA} color="bg-cyan-500" />
                </div>
                <span className="font-bold text-center text-yellow-300 uppercase text-sm px-2">{label}</span>
                <div className="flex items-center gap-2">
                    <RatingBar value={valueB} color="bg-red-500" />
                    <span className="font-bold font-display text-lg text-white w-8 text-left">{valueB}</span>
                    <span className={`font-mono w-10 text-sm font-bold ${diff !== 0 ? diffColorB : 'text-gray-500'}`}>{diffTextB}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl space-y-3 bg-gray-900/80 border-2 border-cyan-500/50 p-6 rounded-2xl shadow-2xl backdrop-blur-sm animate-fade-in">
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold font-display text-cyan-300">Análise de Atributos por IA</h2>
                <p className="text-sm text-gray-400">Atributos gerados para uma simulação mais realista.</p>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 mb-2">
                <div className="text-right font-bold text-lg" style={{ color: teamA.color === '#000000' ? '#FFFFFF' : teamA.color }}>
                    {teamA.name}
                    {homeTeamId === teamA.id && <span className="text-yellow-400 text-xs block font-normal">⭐ Vantagem de Casa (+5% nos atributos) ⭐</span>}
                </div>
                <div></div>
                <div className="text-left font-bold text-lg" style={{ color: teamB.color === '#000000' ? '#FFFFFF' : teamB.color }}>
                    {teamB.name}
                    {homeTeamId === teamB.id && <span className="text-yellow-400 text-xs block font-normal">⭐ Vantagem de Casa (+5% nos atributos) ⭐</span>}
                </div>
            </div>
            {classicModeEnabled && (
                <div className="text-center text-sm text-cyan-300 font-semibold mb-3">⚡ Modo Clássico Ativado: Diferença de atributos reduzida em 50% ⚡</div>
            )}
            <RatingRow label="Ataque" valueA={finalRatingsA.attack} valueB={finalRatingsB.attack} />
            <RatingRow label="Defesa" valueA={finalRatingsA.defense} valueB={finalRatingsB.defense} />
            <RatingRow label="Meio-campo" valueA={finalRatingsA.midfield} valueB={finalRatingsB.midfield} />
            <RatingRow label="Forma" valueA={finalRatingsA.form} valueB={finalRatingsB.form} />
            <RatingRow label="Momento" valueA={finalRatingsA.momentum} valueB={finalRatingsB.momentum} />
        </div>
    );
};