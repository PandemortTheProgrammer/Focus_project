import { useEffect } from 'react';

interface ToastProps {
    visible: boolean;
    tipo: 'exito' | 'error' | 'advertencia' | 'logro' | 'reporte';
    titulo: string;
    mensaje: string;
    urlIcono?: string; // Para mostrar el ícono del logro
    onClose: () => void;
}

export default function ToastNotification({ visible, tipo, titulo, mensaje, urlIcono, onClose }: ToastProps) {
    // Autocerrar después de 4 segundos
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    // Definir colores según el tipo
    const estilos = {
        exito: { bg: 'bg-[#5ecfb8]', text: 'text-[#1a1a1a]', border: 'border-[#4ab9a3]', icon: '✅' },
        error: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', icon: '❌' },
        advertencia: { bg: 'bg-yellow-500', text: 'text-[#1a1a1a]', border: 'border-yellow-600', icon: '⚠️' },
        logro: { bg: 'bg-[#fbbf24]', text: 'text-[#1a1a1a]', border: 'border-yellow-600', icon: '🏆' },
        reporte: { bg: 'bg-[#3b82f6]', text: 'text-white', border: 'border-blue-600', icon: '📊' },
    };

    const actual = estilos[tipo];

    return (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
            <div className={`${actual.bg} ${actual.border} border shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-md w-full`}>

                {/* Ícono o Imagen del Logro */}
                <div className="flex-shrink-0 text-3xl">
                    {tipo === 'logro' && urlIcono ? (
                        <img src={urlIcono} alt="Logro" className="w-12 h-12 rounded-full border-2 border-white shadow-inner object-cover" />
                    ) : (
                        <span>{actual.icon}</span>
                    )}
                </div>

                {/* Textos */}
                <div className="flex flex-col">
                    <h4 className={`font-bold text-lg leading-tight ${actual.text}`}>{titulo}</h4>
                    <p className={`text-sm font-medium opacity-90 ${actual.text}`}>{mensaje}</p>
                </div>

                {/* Botón de cerrar manual */}
                <button onClick={onClose} className={`ml-auto font-bold opacity-60 hover:opacity-100 ${actual.text}`}>
                    ✕
                </button>
            </div>
        </div>
    );
}