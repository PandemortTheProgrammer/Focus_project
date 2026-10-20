import { useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { obtenerUrlIcono } from '../../utils/icons';
import { obtenerUrlTarjeta } from '../../utils/tarjetas';
import { 
    LockClosedIcon, 
    CalendarDaysIcon, 
    TrophyIcon, 
    SparklesIcon 
} from '@heroicons/react/24/outline';

export interface RecompensaDetalle {
    Id_recompensa: number;
    nombre_recompensa: string;
    descripcion: string;
    Id_icono?: number | null;
    Id_desbloqueado?: number | null;
    nombre_icono?: string;
    nombre_desbloqueado?: string | null;
    tipo_recompensa?: string;
    coleccion?: string;
    estaDesbloqueado: boolean;
    fecha_obtencion?: string | null;
    xp_otorgada?: number;
}

interface Props {
    logro: RecompensaDetalle;
    onClose: () => void;
}

const formatearFechaObtencion = (fecha: string): string => {
    const fechaNormalizada = fecha.trim().replace(' ', 'T');
    const tieneZonaHoraria = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(fechaNormalizada);
    const fechaUTC = fechaNormalizada.includes('T') && !tieneZonaHoraria
        ? `${fechaNormalizada}Z`
        : fechaNormalizada;
    const fechaParseada = new Date(fechaUTC);

    if (Number.isNaN(fechaParseada.getTime())) return '—';

    return fechaParseada.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export default function RewardDetails({ logro, onClose }: Props) {
    useEffect(() => {
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const manejarEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', manejarEscape);

        return () => {
            document.body.style.overflow = overflowAnterior;
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [onClose]);

    const manejarCerrar = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
    };

    // Formateo del tipo de colección
    const obtenerEtiquetaColeccion = () => {
        if (logro.coleccion === 'HITO') return 'Hito de Nivel';
        if (logro.coleccion === 'V1') return 'Logro (Sistema Base V1)';
        if (logro.coleccion === 'V2') return 'Logro (Focus V2)';
        return 'Recompensa Especial';
    };

    // Color base según colección
    const colorPrimario = logro.coleccion === 'HITO' ? 'text-purple-400' : 'text-[#fbbf24]';
    const borderPrimario = logro.coleccion === 'HITO' ? 'border-purple-500' : 'border-[#fbbf24]';
    const urlTarjeta = logro.tipo_recompensa === 'CARD'
        ? obtenerUrlTarjeta(logro.Id_desbloqueado)
        : undefined;

    // LÓGICA DE LOS TRES ESTADOS
    const IDs_SECRETOS = [7, 14, 18, 20, 23, 24, 27, 28];
    const esSecreto = IDs_SECRETOS.includes(logro.Id_recompensa);
    const ocultarInfo = !logro.estaDesbloqueado && esSecreto;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div 
                className={`relative w-full max-w-lg bg-[#121212] rounded-3xl border-2 shadow-2xl flex flex-col overflow-hidden animate-scale-up`}
                style={{ borderColor: logro.estaDesbloqueado ? (logro.coleccion === 'HITO' ? '#a855f7' : '#fbbf24') : '#3f3f46' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="reward-details-title"
            >
                {/* SECCIÓN SUPERIOR: PREVISUALIZACIÓN DEDICADA */}
                <div className="w-full h-48 sm:h-56 bg-zinc-900 relative flex items-center justify-center border-b border-zinc-800 overflow-hidden">
                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-b ${logro.coleccion === 'HITO' ? 'from-purple-500' : 'from-yellow-500'} to-transparent`} />

                    {!logro.estaDesbloqueado ? (
                        <div className="flex flex-col items-center gap-2 opacity-50 text-zinc-500 z-10">
                            <LockClosedIcon className="w-16 h-16" />
                            <span className="font-bold tracking-widest uppercase text-xs">
                                {ocultarInfo ? 'Información Restringida' : 'Misión Bloqueada'}
                            </span>
                        </div>
                    ) : (
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
                            {logro.tipo_recompensa === 'ICONO' && (
                                logro.Id_icono ? (
                                    <img
                                        src={obtenerUrlIcono(logro.Id_icono)}
                                        alt={logro.nombre_icono ?? logro.nombre_recompensa}
                                        className="h-full object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-float"
                                    />
                                ) : <TrophyIcon className="w-20 h-20 text-yellow-400" />
                            )}
                            
                            {(logro.tipo_recompensa === 'FONDO' || logro.tipo_recompensa === 'MEDALLON') && (
                                <div className="w-32 h-full rounded-xl border border-zinc-700 shadow-2xl relative overflow-hidden flex flex-col">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80" /> 
                                    <div className="w-full h-4 bg-black/40 mb-auto" />
                                    <div className="w-3/4 h-8 bg-white/10 rounded-lg mx-auto mb-2" />
                                    <div className="w-full h-1/2 bg-black/40 rounded-t-xl" />
                                </div>
                            )}

                            {logro.tipo_recompensa === 'CARD' && (
                                <div className="relative w-full h-full rounded-2xl border border-purple-400/60 bg-gradient-to-br from-purple-950 via-zinc-900 to-black shadow-2xl overflow-hidden flex flex-col items-center justify-center gap-3 p-4 text-center">
                                    {urlTarjeta && (
                                        <img
                                            src={urlTarjeta}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/70" />
                                    <SparklesIcon className="relative z-10 w-10 h-10 text-purple-300" />
                                    <span className="relative z-10 text-sm font-black uppercase tracking-wide text-white">
                                        {logro.nombre_desbloqueado ?? logro.nombre_icono ?? logro.nombre_recompensa}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SECCIÓN INFERIOR: DETALLES DE TEXTO */}
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${colorPrimario} mb-1 flex items-center gap-1.5`}>
                            {logro.coleccion === 'HITO' ? <SparklesIcon className="w-3 h-3" /> : <TrophyIcon className="w-3 h-3" />}
                            {obtenerEtiquetaColeccion()}
                        </span>
                        
                        <h2 id="reward-details-title" className={`text-2xl font-black leading-tight ${logro.estaDesbloqueado ? 'text-white' : 'text-zinc-500'}`}>
                            {ocultarInfo ? 'Logro Clasificado' : logro.nombre_recompensa}
                        </h2>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-zinc-800 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">
                            {logro.estaDesbloqueado ? 'Registro de Misión:' : (ocultarInfo ? 'Pista de Desbloqueo:' : 'Requisitos de Misión:')}
                        </span>
                        <p className={`text-sm leading-relaxed ${logro.estaDesbloqueado ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            {ocultarInfo 
                                ? 'Los requisitos de esta misión son un misterio. Sigue usando la aplicación de forma constante y explora todas sus funciones para revelar este objetivo.'
                                : logro.descripcion
                            }
                        </p>
                    </div>

                    {/* METADATOS INFERIORES */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <CalendarDaysIcon className="w-5 h-5 opacity-70" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Obtenido el</span>
                                <span className="text-xs font-semibold text-zinc-300">
                                    {logro.estaDesbloqueado && logro.fecha_obtencion 
                                        ? formatearFechaObtencion(logro.fecha_obtencion)
                                        : '—'
                                    }
                                </span>
                            </div>
                        </div>

                        {logro.estaDesbloqueado && (
                            <div className="flex gap-2">
                                {logro.xp_otorgada && logro.xp_otorgada > 0 && (
                                    <div className={`px-3 py-1.5 rounded-lg border bg-black/40 flex flex-col items-center justify-center border-purple-500/50`}>
                                        <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-400">Otorgó</span>
                                        <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                                            +{logro.xp_otorgada} XP
                                        </span>
                                    </div>
                                )}
                                
                                <div className={`px-3 py-1.5 rounded-lg border bg-black/40 flex flex-col items-end ${borderPrimario}`}>
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Desbloqueó</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${colorPrimario}`}>
                                        {logro.tipo_recompensa === 'CARD' ? 'Tarjeta' : logro.tipo_recompensa}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={manejarCerrar}
                        aria-label="Regresar a la vitrina de recompensas"
                        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition hover:border-yellow-500 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] cursor-pointer"
                    >
                        Volver a la vitrina
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}