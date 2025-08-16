import React from 'react';

export const NotificationFeed: React.FC = () => {
    const text = "Inscreva-se para os próximos jogos!";
    
    const sharedClasses = "flex-shrink-0 text-4xl font-display font-bold uppercase text-yellow-300 px-12 whitespace-nowrap";
    const sharedStyle = { 
        textShadow: '0 0 4px #fde047, 0 0 8px #facc15, 0 0 15px #f59e0b, 0 0 25px #f59e0b',
    };

    return (
        <div 
            className="w-full h-20 bg-black border-y-4 border-gray-800 rounded-b-lg overflow-hidden relative flex items-center"
            style={{
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '4px 4px',
            }}
            aria-label={`Letreiro de LED: ${text}`}
            role="status"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 z-10 pointer-events-none"></div>
            
            <div className="flex animate-marquee hover:pause">
                <p className={sharedClasses} style={sharedStyle}>{text}</p>
                <p className={sharedClasses} style={sharedStyle} aria-hidden="true">{text}</p>
                <p className={sharedClasses} style={sharedStyle} aria-hidden="true">{text}</p>
                <p className={sharedClasses} style={sharedStyle} aria-hidden="true">{text}</p>
            </div>

            <style>
                {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                    will-change: transform;
                }
                `}
            </style>
        </div>
    );
};
