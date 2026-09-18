import { useEffect } from 'react';
import { obtenerUrlIcono } from '../utils/icons'; // Asegúrate de tener esta importación

interface ToastProps {
    visible: boolean;
    tipo: 'exito' | 'error' | 'advertencia' | 'logro' | 'reporte';
    titulo: string;
    mensaje: string;
    urlIcono?: string;
    datosLogro?: any; // <-- Agregamos la propiedad para recibir la estructura completa
    onClose: () => void;
}

export default function ToastNotification({ visible, tipo, titulo, mensaje, urlIcono, datosLogro, onClose }: ToastProps) {
    // Autocerrar después de 5 segundos (le damos un segundo extra a los logros para que los puedan leer bien)
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, tipo === 'logro' ? 5000 : 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose, tipo]);

    if (!visible) return null;

    // Definir colores según el tipo clásico
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
            
            {/* CONDICIONAL: Si es un logro y trae datos, mostramos el diseño de tarjeta oscura */}
            {tipo === 'logro' && datosLogro ? (
                
                <div 
                    className="relative flex items-center gap-5 p-4 rounded-2xl shadow-2xl border-l-4 w-[360px]"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#fbbf24' }}
                >
                    {/* Botón de cerrar manual para la tarjeta de logro */}
                    <button onClick={onClose} className="absolute top-2 right-3 text-zinc-500 hover:text-white text-sm font-bold transition">
                        ✕
                    </button>

                    {/* Ícono de la recompensa */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 border-2 border-yellow-500 shadow-inner flex items-center justify-center">
                        {datosLogro.Id_icono ? (
                            <img src={obtenerUrlIcono(datosLogro.Id_icono)} alt="Logro" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">🏆</span>
                        )}
                    </div>

                    {/* Textos del logro replicando tu diseño */}
                    <div className="flex flex-col justify-center w-full pr-4">
                        <span className="text-[#fbbf24] text-[9px] font-extrabold uppercase tracking-widest mb-0.5">
                            Obtuviste:
                        </span>
                        <h3 className="text-white font-bold text-lg leading-none mb-1">
                            {datosLogro.nombre_recompensa}
                        </h3>
                        <p className="text-zinc-400 text-xs leading-snug mb-1.5">
                            {datosLogro.descripcion}
                        </p>
                        
                        <span className="text-[#fbbf24] text-[9px] font-extrabold uppercase tracking-widest mb-0.5">
                            Desbloqueaste:
                        </span>
                        <p className="text-white text-[10px] font-bold uppercase tracking-wide leading-none">
                            {datosLogro.tipo_recompensa}: {datosLogro.nombre_icono}
                        </p>
                    </div>
                </div>

            ) : (

                /* DISEÑO CLÁSICO PARA ÉXITO, ERROR Y ADVERTENCIA */
                <div className={`${actual.bg} ${actual.border} border shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-md w-full`}>
                    {/* Ícono clásico */}
                    <div className="flex-shrink-0 text-3xl">
                        {urlIcono ? (
                            <img src={urlIcono} alt="Icono" className="w-12 h-12 rounded-full border-2 border-white shadow-inner object-cover" />
                        ) : (
                            <span>{actual.icon}</span>
                        )}
                    </div>

                    {/* Textos clásicos */}
                    <div className="flex flex-col">
                        <h4 className={`font-bold text-lg leading-tight ${actual.text}`}>{titulo}</h4>
                        <p className={`text-sm font-medium opacity-90 ${actual.text}`}>{mensaje}</p>
                    </div>

                    {/* Botón de cerrar clásico */}
                    <button onClick={onClose} className={`ml-auto font-bold opacity-60 hover:opacity-100 ${actual.text}`}>
                        ✕
                    </button>
                </div>
                
            )}
            
        </div>
    );
}