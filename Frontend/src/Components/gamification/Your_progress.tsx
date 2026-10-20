import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../essentials/Page-head';
import { useToast } from '../essentials/ToastContext';

interface ProgresoData {
    usuario: { nombre: string; idIcono: number; };
    fechaCreacion: string;
    semanasDesdeCreacion: number;
    totalActividades: number;
    semanasConReporte: number;
    progresoLogros: { desbloqueados: number; totales: number; porcentaje: number; };
    progresoHitos: { desbloqueados: number; totales: number; porcentaje: number; };
    progresoOptimizacion: number;
}

interface ProgresoXPData {
    nivel: number;
    xpParaSiguienteNivel: number;
    xpActualEnNivel: number;
    porcentaje: number;
}

const MiProgreso: React.FC = () => {
    const navigate = useNavigate();
    const { mostrarToast, notificarGamificacion } = useToast();
    const [data, setData] = useState<ProgresoData | null>(null);
    const [progresoXP, setProgresoXP] = useState<ProgresoXPData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const visitaIniciada = useRef(false);

    useEffect(() => {
        const fetchProgreso = async () => {
            try {
                if (!visitaIniciada.current) {
                    visitaIniciada.current = true;
                    try {
                        const resVisita = await fetch('http://localhost:3000/api/progreso/visita-semanal', {
                            method: 'POST'
                        });
                        if (!resVisita.ok) {
                            const respuestaError = await resVisita.json().catch(() => ({}));
                            throw new Error(
                                respuestaError.error || `El servidor respondió HTTP ${resVisita.status}.`
                            );
                        }
                        const dataVisita = await resVisita.json();
                        notificarGamificacion(
                            dataVisita.logrosDesbloqueados ?? [],
                            dataVisita.resultadoXP
                        );
                    } catch (error) {
                        mostrarToast(
                            'error',
                            error instanceof TypeError ? 'Error de conexión' : 'No se pudo registrar la visita',
                            error instanceof Error ? error.message : 'No se pudo procesar la recompensa semanal de Mi progreso.'
                        );
                    }
                }

                // Fetch en paralelo para mayor velocidad
                const [resGeneral, resXP] = await Promise.all([
                    fetch('http://localhost:3000/api/progreso/general'),
                    fetch('http://localhost:3000/api/xp/progreso')
                ]);

                if (!resGeneral.ok) throw new Error(`Error HTTP: ${resGeneral.status}`);
                
                setData(await resGeneral.json());
                if (resXP.ok) setProgresoXP(await resXP.json());
                
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'No se pudo cargar tu progreso.');
            } finally {
                setLoading(false);
            }
        };

        fetchProgreso();
    }, [mostrarToast, notificarGamificacion]);

    if (loading) {
        return (
            <div className="relative w-full min-h-screen flex items-center justify-center">
                <p className="text-xl text-zinc-300 animate-pulse">Cargando tu progreso...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="relative w-full min-h-screen flex flex-col items-center py-10 px-4">
                <PageHeader titulo="Mi Progreso" />
                <div className="flex-1 flex items-center justify-center w-full">
                    <p className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/50">
                        Error: {error || 'No se encontraron datos'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center py-10 px-4">
            <PageHeader titulo="Mi Progreso" />

            <p className="text-zinc-200 text-center max-w-2xl mx-auto mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
                Toca cualquiera de tus métricas para explorar los detalles.
            </p>

            <div className="relative z-10 flex flex-col gap-8 w-full max-w-5xl pb-10">

                {/* 1. Tarjeta de Identidad */}
                <div
                    onClick={() => navigate('/editar-perfil')}
                    className="flex flex-col sm:flex-row items-center gap-6 bg-[#2a2a2a] p-6 rounded-2xl shadow-lg border border-zinc-700/50 cursor-pointer transition-all duration-300 hover:border-[#d946ef] group"
                    title="Editar perfil"
                >
                    <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden shadow-inner border-2 border-[#5ecfb8] group-hover:border-[#d946ef] transition-colors flex-shrink-0">
                        <img
                            src={`/src/assets/images/Icons/icon_${data.usuario.idIcono}.png`}
                            alt={`Icono de ${data.usuario.nombre}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        {data.usuario.idIcono === 1 && (
                            <span className="text-4xl text-white font-bold absolute">
                                {data.usuario.nombre.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-3xl font-bold text-white tracking-wide">{data.usuario.nombre}</h2>
                        <p className="text-zinc-400 text-sm mt-1">Registrando desde el {data.fechaCreacion}</p>
                    </div>
                    <div className="hidden sm:block text-zinc-500 group-hover:text-[#d946ef] transition-colors">
                        <span className="text-sm font-medium">Modificar perfil &rarr;</span>
                    </div>
                </div>

                {/* NUEVO: BARRA DE PROGRESO DE NIVEL */}
                <div 
                    onClick={() => navigate('/nivel-perfil')}
                    className="bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-6 flex flex-col gap-3 shadow-lg cursor-pointer hover:border-purple-500 transition-all duration-300 group"
                    title="Ver detalles de experiencia"
                >
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-purple-400/80 transition-colors">Progreso Actual</span>
                            <span className="text-white text-2xl font-black">Nivel {progresoXP?.nivel || 1}</span>
                        </div>
                        <div className="text-right flex flex-col">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Para subir</span>
                            <span className="text-sm font-bold text-zinc-300">
                                Faltan <span className="text-purple-400">{progresoXP ? progresoXP.xpParaSiguienteNivel - progresoXP.xpActualEnNivel : 0} XP</span>
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-full bg-black rounded-full h-4 overflow-hidden border border-zinc-800 shadow-inner p-0.5 mt-1">
                        <div 
                            className="bg-gradient-to-r from-purple-800 via-purple-500 to-purple-400 h-full rounded-full transition-all duration-1000 relative" 
                            style={{ width: `${progresoXP?.porcentaje || 0}%` }}
                        >
                            <div className="absolute inset-y-0 right-0 w-4 bg-white/30 blur-sm rounded-full"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-[10px] text-zinc-500 font-bold">{progresoXP?.xpActualEnNivel || 0} XP</span>
                        <span className="text-[10px] text-zinc-500 font-bold">{progresoXP?.xpParaSiguienteNivel || 10000} XP</span>
                    </div>
                </div>

                {/* 2. Sección: Constancia e Historial (Intacta) */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white px-2 border-l-4 border-[#3b82f6]">Historial y Constancia</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MetricCard titulo="Semanas Activo" valor={data.semanasDesdeCreacion.toString()} />
                        <MetricCard titulo="Semanas Evaluadas" valor={data.semanasConReporte.toString()} onClick={() => navigate('/resumenes-semanales')} etiquetaAccion="Ver reportes" colorHover="hover:border-[#3b82f6]" />
                        <MetricCard titulo="Actividades Totales" valor={data.totalActividades.toString()} onClick={() => navigate('/actividades')} etiquetaAccion="Gestionar" colorHover="hover:border-[#5ecfb8]" />
                    </div>
                </div>

                {/* 3. Sección: Gamificación y Optimización */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white px-2 border-l-4 border-[#fbbf24]">Gamificación y Desempeño</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <GamificationMetricCard
                            titulo="Logros"
                            detalle={`${data.progresoLogros.desbloqueados}/${data.progresoLogros.totales} desbloqueados`}
                            porcentaje={data.progresoLogros.porcentaje}
                            color="bg-[#fbbf24]"
                            textoColor="text-[#fbbf24]"
                            onClick={() => navigate('/recompensas')}
                            etiquetaAccion="Ver logros"
                        />
                        <GamificationMetricCard
                            titulo="Hitos"
                            detalle={`${data.progresoHitos.desbloqueados}/${data.progresoHitos.totales} alcanzados`}
                            porcentaje={data.progresoHitos.porcentaje}
                            color="bg-purple-500"
                            textoColor="text-purple-400"
                            onClick={() => navigate('/recompensas')}
                            etiquetaAccion="Ver hitos"
                        />
                        <GamificationMetricCard
                            titulo="Optimización Promedio"
                            detalle="Promedio de tus reportes semanales"
                            porcentaje={data.progresoOptimizacion}
                            color="bg-[#5ecfb8]"
                            textoColor="text-[#5ecfb8]"
                            onClick={() => navigate('/resumenes-semanales')}
                            etiquetaAccion="Ver gráficas"
                        />
                    </div>
                </div>

                {/* 4. Comparativa de Motor de Horarios (Intacta) */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-semibold text-white px-2 border-l-4 border-purple-500">Análisis de Horarios</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ScheduleCard titulo="Día Ideal" onClick={() => navigate('/dia-ideal')} />
                        <ScheduleCard titulo="Día Ideal (Enfoque)" onClick={() => navigate('/enfoque-detalle')} />
                        <ScheduleCard titulo="Día Real Histórico" />
                    </div>
                </div>

            </div>
        </div>
    );
};

// ==========================================
// Subcomponentes UI Refinados (Quedan idénticos a tu versión)
// ==========================================

interface MetricCardProps {
    titulo: string;
    valor: string;
    destacado?: boolean;
    colorHighlight?: string;
    onClick?: () => void;
    etiquetaAccion?: string;
    colorHover?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ titulo, valor, destacado, colorHighlight = 'text-white', onClick, etiquetaAccion, colorHover = 'hover:border-zinc-500' }) => (
    <div onClick={onClick} className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border border-zinc-700/50 shadow-lg text-center transition-all duration-300 ${destacado ? 'bg-[#222]' : 'bg-[#2a2a2a]'} ${onClick ? `cursor-pointer hover:scale-105 ${colorHover}` : ''} min-h-[120px] group overflow-hidden`}>
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2 relative z-10">{titulo}</p>
        <p className={`text-3xl font-bold ${destacado ? colorHighlight : 'text-white'} relative z-10`}>{valor}</p>
        {onClick && etiquetaAccion && (
            <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{etiquetaAccion} &rarr;</span>
            </div>
        )}
    </div>
);

interface GamificationMetricCardProps {
    titulo: string;
    detalle: string;
    porcentaje: number;
    color: string;
    textoColor: string;
    onClick: () => void;
    etiquetaAccion: string;
}

const GamificationMetricCard: React.FC<GamificationMetricCardProps> = ({
    titulo,
    detalle,
    porcentaje,
    color,
    textoColor,
    onClick,
    etiquetaAccion
}) => {
    const porcentajeSeguro = Math.min(100, Math.max(0, Number.isFinite(porcentaje) ? porcentaje : 0));

    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex min-h-[150px] w-full cursor-pointer flex-col justify-center gap-3 rounded-2xl border border-zinc-700/50 bg-[#222] p-5 text-left shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={`${titulo}: ${detalle}, ${porcentajeSeguro}% de progreso. ${etiquetaAccion}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{titulo}</p>
                    <p className="mt-1 text-sm text-zinc-300">{detalle}</p>
                </div>
                <span className={`text-2xl font-black ${textoColor}`}>{porcentajeSeguro}%</span>
            </div>
            <div
                className="h-2.5 w-full overflow-hidden rounded-full border border-zinc-700 bg-black/70 p-0.5"
                role="progressbar"
                aria-label={`Progreso: ${titulo}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={porcentajeSeguro}
                aria-valuetext={`${porcentajeSeguro}%`}
            >
                <div
                    className={`h-full rounded-full ${color} transition-[width] duration-700`}
                    style={{ width: `${porcentajeSeguro}%` }}
                />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-zinc-300">
                {etiquetaAccion} &rarr;
            </span>
        </button>
    );
};

interface ScheduleCardProps { titulo: string; onClick?: () => void; }

const ScheduleCard: React.FC<ScheduleCardProps> = ({ titulo, onClick }) => (
    <div onClick={onClick} className={`bg-[#2a2a2a] rounded-2xl border border-zinc-700/50 min-h-[250px] p-6 flex flex-col items-center shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-purple-500 hover:scale-[1.02]' : 'hover:border-zinc-500'} group`}>
        <h3 className="text-lg font-semibold mb-4 text-zinc-200 uppercase tracking-wide border-b border-zinc-600 pb-2 w-full text-center group-hover:text-white transition-colors">{titulo}</h3>
        <div className="flex-1 flex items-center justify-center w-full">
            <p className="text-sm text-zinc-500 text-center italic">Datos del motor de horarios pendientes de conexión...</p>
        </div>
        {onClick && <span className="mt-4 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Configurar &rarr;</span>}
    </div>
);

export default MiProgreso;