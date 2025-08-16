

import React from 'react';
import { BuffInfo } from '../types';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
    buffDefinitions: Record<string, BuffInfo>;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <details className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden group" open>
        <summary className="p-4 font-bold text-xl text-cyan-300 cursor-pointer list-none flex justify-between items-center transition-colors hover:bg-gray-700/50">
            {title}
            <span className="text-2xl transition-transform transform group-open:rotate-180">▾</span>
        </summary>
        <div className="p-4 border-t border-gray-700 bg-gray-900/50 text-gray-300 prose prose-invert max-w-none">
            {children}
        </div>
    </details>
);

const BuffDisplay: React.FC<{ buff: BuffInfo, buffDefinitions: Record<string, BuffInfo> }> = ({ buff, buffDefinitions }) => (
    <div className="flex items-start gap-4 not-prose my-4">
        <div style={{ backgroundColor: buff.color }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-3xl shadow-lg mt-1">
            {buff.symbol}
        </div>
        <div>
            <h4 className="font-bold text-white text-lg" style={{ color: buff.color }}>{buff.name}</h4>
            <p className="text-gray-400 text-sm">{buff.description}</p>
            {buff.effectTemplate && buffDefinitions[buff.effectTemplate] && (
                <p className="text-xs italic text-cyan-400/70 mt-1">
                    (Este buff usa a lógica de jogo do buff "{buffDefinitions[buff.effectTemplate]?.name || buff.effectTemplate}")
                </p>
            )}
        </div>
    </div>
);


export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, buffDefinitions }) => {
    if (!isOpen) return null;

    const groupedBuffs = Object.values(buffDefinitions).reduce((acc, buff) => {
        const type = buff.type || 'utility';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(buff);
        return acc;
    }, {} as Record<'attack' | 'defense' | 'utility', BuffInfo[]>);


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-yellow-300 font-display">Como Jogar</h2>
                    <button onClick={onClose} className="text-4xl text-gray-400 hover:text-white transition-transform hover:rotate-90">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <Section title="O Básico">
                        <p>Bem-vindo ao Simulador de Futebol Cinético! Este não é um jogo de futebol comum. Em vez de controlar os jogadores diretamente, você define as condições da partida e assiste a uma simulação baseada em física se desenrolar.</p>
                        <p>Os jogadores se movem e reagem por conta própria com base em sua programação de IA e nos atributos de seu time. O objetivo é simples: marcar mais gols que o adversário!</p>
                        <ul>
                            <li><strong>Dois Tempos:</strong> A partida é dividida em dois tempos, assim como no futebol real.</li>
                            <li><strong>Física:</strong> Todas as colisões, chutes e movimentos são regidos por um motor de física.</li>
                            <li><strong>Estratégia:</strong> Sua principal influência é na configuração da partida: escolher os times, habilitar buffs e ajustar as configurações de jogabilidade.</li>
                        </ul>
                    </Section>
                    
                    <Section title="Fases da Partida">
                        <p>Uma partida completa passa por várias fases:</p>
                        <ol>
                            <li><strong>Contagem Regressiva:</strong> Um breve período de 3 segundos antes do início.</li>
                            <li><strong>Primeiro Tempo:</strong> Os primeiros 45 minutos (no tempo de jogo) da partida.</li>
                            <li><strong>Acréscimos do 1º Tempo:</strong> Um tempo extra adicionado no final do primeiro tempo.</li>
                            <li><strong>Intervalo:</strong> Uma pausa curta onde os times reiniciam em suas posições.</li>
                            <li><strong>Segundo Tempo:</strong> Os 45 minutos finais da partida.</li>
                            <li><strong>Acréscimos do 2º Tempo:</strong> Tempo extra no final do jogo para compensar as paradas.</li>
                            <li><strong>Fim de Jogo:</strong> A partida termina, e um vencedor (ou empate) é declarado.</li>
                        </ol>
                        <p className="font-bold text-yellow-400">Nova Regra: Morte Súbita! Se o tempo regulamentar (incluindo acréscimos) acabar enquanto a bola estiver dentro da área de um dos goleiros, o jogo continua até que a bola saia da área. A próxima ação decidirá o jogo!</p>
                    </Section>

                     <Section title="Power-Ups (Buffs)">
                        <p>Os Buffs são power-ups que aparecem aleatoriamente no campo. Um jogador que tocar em um buff o ativa para seu time (ou para o adversário, dependendo do buff!). Eles são divididos em três categorias:</p>
                        <div>
                            <h3 className="text-xl font-bold text-red-400 mt-4 mb-2">Buffs de Ataque</h3>
                            {groupedBuffs.attack?.map((buff, i) => <BuffDisplay key={i} buff={buff} buffDefinitions={buffDefinitions} />)}
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-blue-400 mt-4 mb-2">Buffs de Defesa</h3>
                            {groupedBuffs.defense?.map((buff, i) => <BuffDisplay key={i} buff={buff} buffDefinitions={buffDefinitions} />)}
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-purple-400 mt-4 mb-2">Buffs de Utilidade</h3>
                            {groupedBuffs.utility?.map((buff, i) => <BuffDisplay key={i} buff={buff} buffDefinitions={buffDefinitions} />)}
                        </div>
                        <p className="mt-4">Você pode personalizar, criar e refazer buffs usando IA no menu "Gerenciar Buffs com IA" na tela de configuração da partida!</p>
                    </Section>

                     <Section title="Inteligência Artificial (IA) dos Jogadores">
                        <p>Os jogadores não são apenas peões aleatórios. Eles seguem uma lógica para tentar vencer o jogo.</p>
                        
                        <h4>Tomada de Decisão (Passe & Chute)</h4>
                        <p>A IA foi aprimorada com uma tomada de decisão tática. Em vez de sempre chutar para a frente, um jogador com a bola agora avalia a situação para decidir a melhor ação:</p>
                        <ul>
                          <li><strong>Chute:</strong> Se o jogador tem um caminho claro para o gol adversário e está a uma distância razoável, ele tentará chutar. A força do chute é influenciada pelo atributo de <strong>Ataque</strong>.</li>
                          <li><strong>Passe:</strong> Se um chute direto não for uma boa opção, o jogador procurará por um companheiro de equipe desmarcado e em uma posição mais avançada no campo. Se encontrar um bom alvo, ele tentará um passe. A "visão de jogo" para encontrar passes e a precisão são influenciadas pelo atributo de <strong>Meio-campo</strong>.</li>
                          <li><strong>Drible:</strong> Se nem o chute nem o passe forem boas opções, o jogador dará um toque curto para a frente para manter a posse de bola e continuar avançando.</li>
                        </ul>
                        
                        <h4>Bote (Tackle)</h4>
                        <p>Os jogadores agora tentarão dar um "bote" na bola para roubá-la. Isso adiciona uma camada extra de agressividade e defesa.</p>
                        <ul>
                            <li><strong>Como Funciona:</strong> Quando um jogador está perto da bola, há uma chance de ele executar um rápido impulso em direção a ela.</li>
                            <li><strong>Risco e Recompensa:</strong> Um bote bem-sucedido pode interceptar um passe ou roubar a bola, mas um bote errado pode deixar o jogador fora de posição, abrindo espaço para o adversário.</li>
                            <li><strong>Influência dos Atributos:</strong> Com os "Scores Reais" ativados, o atributo de <strong>Defesa</strong> de um time aumenta a <strong>distância</strong> a partir da qual um jogador pode iniciar um bote, sua <strong>chance</strong> de sucesso e a <strong>força</strong> do impulso.</li>
                        </ul>

                        <h4>IA do Goleiro</h4>
                        <p>O goleiro é o jogador mais especializado:</p>
                        <ul>
                            <li>Ele permanece dentro de sua grande área (a menos que seja empurrado para fora).</li>
                            <li>Ele prevê a trajetória da bola para se posicionar e bloquear os chutes.</li>
                            <li>Sua eficácia é determinada pelas configurações de <strong>Inteligência do Goleiro</strong> (quão bem ele prevê) e <strong>Velocidade do Goleiro</strong> (quão rápido ele se move).</li>
                        </ul>

                         <h4>Scores Reais & Atributos</h4>
                        <p>Quando a opção <strong>"Usar Scores Reais"</strong> está ativa, o desempenho dos jogadores é influenciado por atributos baseados em dados do mundo real, processados por IA:</p>
                        <ul>
                            <li><strong>Ataque:</strong> Aumenta a potência dos chutes.</li>
                            <li><strong>Defesa:</strong> Aumenta a massa (força em colisões) dos jogadores, melhora a reação do goleiro e a eficácia dos botes.</li>
                            <li><strong>Meio-campo:</strong> Aumenta a velocidade máxima e a qualidade das decisões de passe.</li>
                            <li><strong>Tamanho do Jogador:</strong> Times com uma média de atributos mais alta terão jogadores ligeiramente maiores no campo, dando-lhes uma pequena vantagem física.</li>
                            <li><strong>Forma:</strong> Um multiplicador geral que afeta todos os outros atributos.</li>
                            <li><strong>Momento:</strong> Analisa notícias e resultados recentes do time. Um bom momento concede um pequeno bônus a todos os atributos, enquanto um momento ruim aplica uma pequena penalidade. Este atributo é dinâmico e muda com o desempenho do time no mundo real!</li>
                            <li><strong>Vantagem de Casa:</strong> O time selecionado como "Time da Casa" recebe um pequeno bônus em todos os seus atributos.</li>
                        </ul>

                        <h4 className="mt-4">Mecânica de Virada (Frenesi)</h4>
                        <p>Para manter as partidas emocionantes, uma "Mecânica de Virada" é ativada quando um time está perdendo por 2 ou mais gols. O time entra em estado de <strong>Frenesi</strong>!</p>
                        <ul>
                            <li><strong>Bônus Ofensivo (Recompensa):</strong> Os jogadores do time que está perdendo recebem um bônus massivo de <strong>velocidade, tamanho, força do chute e massa</strong> (tornando-os maiores e mais fortes em colisões). Seus jogadores brilharão com uma aura laranja intensa e um indicador de "FRENESI" aparecerá no placar.</li>
                            <li><strong>Vulnerabilidade Defensiva (Risco):</strong> No entanto, este é um movimento de "tudo ou nada". Ao se lançarem ao ataque, eles se tornam mais expostos. <strong>O goleiro do time fica menos reativo</strong>, tornando mais fácil para o adversário marcar um gol de contra-ataque.</li>
                        </ul>
                        <p>Esta mecânica cria um cenário de alto risco e alta recompensa, levando a viradas dramáticas ou a derrotas ainda maiores!</p>
                    </Section>
                </div>

                <div className="mt-6 text-center flex-shrink-0">
                     <button onClick={onClose} className="btn-ripple px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105">
                        Entendido!
                    </button>
                </div>
                <style>{`
                    .prose h4 { margin-top: 1em; margin-bottom: 0.5em; }
                    .prose p { margin-top: 0.5em; margin-bottom: 0.5em; }
                    .prose ul, .prose ol { margin-top: 0.5em; margin-bottom: 0.5em; padding-left: 1.5em; }
                    .prose li { margin-top: 0.25em; margin-bottom: 0.25em; }
                    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                    @keyframes fade-in {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>
            </div>
        </div>
    )
};