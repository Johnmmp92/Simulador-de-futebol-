import React, { useState } from 'react';

interface SyncCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    syncCode: string | null;
}

export const SyncCodeModal: React.FC<SyncCodeModalProps> = ({ isOpen, onClose, syncCode }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen || !syncCode) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(syncCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-[#2a2a2a] rounded-2xl border-2 border-green-500/50 shadow-2xl w-full max-w-md p-6 text-center transform animate-slide-up relative overflow-hidden">
                <div 
                    className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-10 bg-green-400"
                ></div>
                <div 
                    className="absolute -bottom-20 -right-12 w-56 h-56 rounded-full opacity-10 bg-green-500"
                ></div>

                <div className="relative z-10">
                    <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-5xl shadow-lg border-2 border-gray-700 bg-green-600"
                    >
                        🔑
                    </div>
                    
                    <h2 className="text-3xl font-display font-bold mt-4 mb-2 text-green-300">
                        Código de Sincronização Gerado!
                    </h2>
                    
                    <p className="text-gray-300 text-base mb-6">
                        Guarde este código para acessar seus dados em outros dispositivos. Não o perca!
                    </p>

                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 font-mono text-lg text-yellow-300 break-all select-all">
                        {syncCode}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <button
                            onClick={handleCopy}
                            className={`w-full btn-ripple px-6 py-3 font-bold rounded-lg shadow-lg text-white transition-colors duration-200 ${isCopied ? 'bg-green-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                        >
                            {isCopied ? 'Copiado!' : 'Copiar Código'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto btn-ripple px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg"
                        >
                            Fechar
                        </button>
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