import React, { useEffect, useState } from 'react';

interface HalftimeInterstitialProps {
    onComplete: () => void;
}

const HALFTIME_DURATION_MS = 5000;

export const HalftimeInterstitial: React.FC<HalftimeInterstitialProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = (elapsedTime / HALFTIME_DURATION_MS) * 100;
            if (newProgress >= 100) {
                clearInterval(interval);
                onComplete();
            } else {
                setProgress(newProgress);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[200] text-white animate-fade-in p-4">
            <div className="bg-gray-800/50 p-8 sm:p-12 rounded-2xl shadow-2xl border-2 border-yellow-400/50 text-center w-full max-w-2xl">
                <h2 className="text-4xl sm:text-6xl font-black text-yellow-300 mb-4 font-display" style={{textShadow: '0 0 20px #facc15'}}>INTERVALO</h2>
                <p className="text-xl sm:text-2xl text-gray-200 mb-8">Gostou da partida até agora?</p>
                <div className="flex justify-center items-center gap-6 sm:gap-12 mb-8">
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                        <span className="text-5xl sm:text-7xl">👍</span>
                        <span className="font-bold text-lg sm:text-xl">Dê um Like!</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 animate-bounce" style={{animationDelay: '200ms'}}>
                        <span className="text-5xl sm:text-7xl">🔔</span>
                        <span className="font-bold text-lg sm:text-xl">Inscreva-se!</span>
                    </div>
                </div>
                <div className="w-full max-w-md mx-auto h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-400 mt-4">O segundo tempo começa em breve...</p>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-bounce { animation: bounce 1.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
};
