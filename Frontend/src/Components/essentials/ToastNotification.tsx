import { useEffect } from 'react';
import { obtenerUrlIcono } from '../../utils/icons';
import { obtenerUrlTarjeta } from '../../utils/tarjetas';
import type { LogroNotificacion, ToastPosition, ToastType } from './ToastContext';

// Importamos los iconos sólidos de HeroIcons
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon, 
    TrophyIcon, 
    ChartBarIcon, 
    SparklesIcon 
} from '@heroicons/react/24/solid';

interface ToastProps {
    // Añadimos 'level-up' temporalmente a los tipos si no lo has agregado aún a ToastContext.tsx
    tipo: ToastType | 'level-up'; 
    titulo: string;
    mensaje: string;
    urlIcono?: string;
    datosLogro?: LogroNotificacion;
    posicion: ToastPosition;
    toastsPendientes: number;
    onClose: () => void;
}

export default function ToastNotification({ 
    tipo, titulo, mensaje, urlIcono, datosLogro, posicion, toastsPendientes, onClose 
}: ToastProps) {
    const urlTarjeta = datosLogro?.tipo_recompensa === 'CARD'
        ? obtenerUrlTarjeta(datosLogro.Id_desbloqueado)
        : undefined;
    
    useEffect(() => {
        let duracion = 4000;
        if (tipo === 'logro' || tipo === 'level-up') duracion = 6000;
        if (tipo === 'xp') duracion = 3000; 
        
        const timer = setTimeout(() => {
            onClose();
        }, duracion);
        
        return () => clearTimeout(timer);
    }, [onClose, tipo]);

    // Paleta de estilos ampliada con HeroIcons
    const estilos = {
        exito: { 
            bg: 'bg-[#5ecfb8]', text: 'text-[#1a1a1a]', border: 'border-[#4ab9a3]', 
            icon: <CheckCircleIcon className="w-8 h-8 text-[#1a1a1a]" /> 
        },
        error: { 
            bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', 
            icon: <XCircleIcon className="w-8 h-8 text-white" /> 
        },
        advertencia: { 
            bg: 'bg-yellow-500', text: 'text-[#1a1a1a]', border: 'border-yellow-600', 
            icon: <ExclamationTriangleIcon className="w-8 h-8 text-[#1a1a1a]" /> 
        },
        logro: { 
            bg: 'bg-[#fbbf24]', text: 'text-[#1a1a1a]', border: 'border-yellow-600', 
            icon: <TrophyIcon className="w-8 h-8 text-[#1a1a1a]" /> 
        },
        reporte: { 
            bg: 'bg-[#3b82f6]', text: 'text-white', border: 'border-blue-600', 
            icon: <ChartBarIcon className="w-8 h-8 text-white" /> 
        },
        xp: { 
            bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400', 
            icon: <SparklesIcon className="w-8 h-8 text-white" /> 
        },
        'level-up': { // Estilo especial para subida de nivel
            bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400', 
            icon: <TrophyIcon className="w-10 h-10 text-yellow-400" /> 
        }
    };

    // Fallback por si llega un tipo no registrado
    const actual = estilos[tipo as keyof typeof estilos] || estilos.exito;

    const layoutPosition = posicion === 'bottom-left'
        ? 'fixed bottom-8 left-8 z-50 animate-fade-in-up'
        : 'fixed top-10 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down';

    const BotonAccion = ({ isOscuro }: { isOscuro?: boolean }) => (
        <button 
            onClick={onClose} 
            className={`
                flex items-center justify-center font-bold text-xs uppercase tracking-wider px-2 py-1 rounded transition-all duration-200 min-w-[32px] min-h-[32px]
                ${isOscuro 
                    ? 'text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700' 
                    : `${actual.text} opacity-80 hover:opacity-100 bg-black/10 hover:bg-black/20`}
            `}
        >
            {toastsPendientes > 0 ? `⏭ (${toastsPendientes})` : '✕'}
        </button>
    );

    return (
        <div className={layoutPosition}>
            
            {tipo === 'logro' && datosLogro ? (
                /* DISEÑO TARJETA OSCURA (LOGROS E HITOS) */
                <div 
                    className="relative flex items-center gap-5 p-4 rounded-2xl shadow-2xl border-l-4 w-[360px]"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#fbbf24' }}
                >
                    <div className="absolute top-2 right-2">
                        <BotonAccion isOscuro={true} />
                    </div>

                    <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 border-2 border-yellow-500 shadow-inner flex items-center justify-center">
                        {urlTarjeta ? (
                            <img src={urlTarjeta} alt={datosLogro.nombre_icono ?? 'Tarjeta desbloqueada'} className="w-full h-full object-cover" />
                        ) : datosLogro.Id_icono ? (
                            <img src={obtenerUrlIcono(datosLogro.Id_icono)} alt="Logro" className="w-full h-full object-cover" />
                        ) : (
                            <TrophyIcon className="w-8 h-8 text-yellow-500" />
                        )}
                    </div>

                    {/* ... Resto del contenido del logro (se mantiene igual) ... */}
                    <div className="flex flex-col justify-center w-full pr-12 pt-1">
                        <span className="text-[#fbbf24] text-[9px] font-extrabold uppercase tracking-widest mb-0.5">
                            {datosLogro.coleccion === 'HITO' ? 'Hito Alcanzado:' : 'Logro Obtenido:'}
                        </span>
                        <h3 className="text-white font-bold text-lg leading-none mb-1">
                            {datosLogro.nombre_recompensa}
                        </h3>
                        <p className="text-zinc-400 text-xs leading-snug mb-1.5 line-clamp-2">
                            {datosLogro.descripcion}
                        </p>
                        
                        {datosLogro.tipo_recompensa === 'ICONO' && (
                            <>
                                <span className="text-[#fbbf24] text-[9px] font-extrabold uppercase tracking-widest mb-0.5 mt-1">
                                    Desbloqueaste:
                                </span>
                                <p className="text-white text-[10px] font-bold uppercase tracking-wide leading-none">
                                    Ícono: {datosLogro.nombre_icono}
                                </p>
                            </>
                        )}
                        {datosLogro.xp_otorgada && (
                            <p className="text-purple-400 text-[10px] font-bold uppercase tracking-wide leading-none mt-1">
                                +{datosLogro.xp_otorgada} XP
                            </p>
                        )}
                    </div>
                </div>

            ) : tipo === 'level-up' ? (
                
                /* NUEVO DISEÑO: SUBIDA DE NIVEL (ESTILO PODIO) */
                <div className="relative mt-8 min-w-[280px] max-w-sm flex flex-col items-center">
                    
                    {/* El semicírculo sobresaliente (Cúpula) */}
                    <div className={`absolute -top-8 w-20 h-20 rounded-full ${actual.bg} shadow-xl flex items-start justify-center pt-3 z-10 border-4 border-purple-400/30`}>
                        {actual.icon}
                    </div>

                    {/* El cuerpo rectangular del Toast */}
                    <div className={`relative w-full ${actual.bg} rounded-2xl p-5 pt-10 shadow-2xl overflow-hidden flex flex-col items-center text-center z-0 border border-purple-400/50`}>
                        
                        {/* Destellos de fondo puramente estéticos usando CSS radial-gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50"></div>
                        
                        <div className="absolute top-3 right-3 z-20">
                            <BotonAccion />
                        </div>

                        <h4 className={`font-extrabold text-2xl tracking-wide mb-1 ${actual.text} relative z-20 drop-shadow-md`}>
                            {titulo}
                        </h4>
                        <p className={`text-sm font-semibold text-purple-200 relative z-20`}>
                            {mensaje}
                        </p>
                    </div>
                </div>

            ) : (

                /* DISEÑO CLÁSICO PARA ÉXITO, ERROR, XP, ETC */
                <div className={`${actual.bg} ${actual.border} border shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[280px] max-w-md w-full`}>
                    <div className="flex-shrink-0 flex items-center justify-center">
                        {urlIcono ? (
                            <img src={urlIcono} alt="Icono" className="w-10 h-10 rounded-full border-2 border-white shadow-inner object-cover" />
                        ) : (
                            actual.icon
                        )}
                    </div>

                    <div className="flex flex-col flex-1 pr-2">
                        <h4 className={`font-bold text-lg leading-tight ${actual.text}`}>{titulo}</h4>
                        {mensaje && <p className={`text-sm font-medium opacity-90 leading-tight mt-0.5 ${actual.text}`}>{mensaje}</p>}
                    </div>

                    <div className="ml-auto flex-shrink-0">
                        <BotonAccion />
                    </div>
                </div>
                
            )}
            
        </div>
    );
}