// frontend/src/components/views/Profile_level.tsx
import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../essentials/Page-head';
import { 
    SparklesIcon, 
    FireIcon, 
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';

interface ProgresoXP {
    nivel: number;
    xpAcumulada: number;
    xpParaSiguienteNivel: number;
    xpActualEnNivel: number;
    porcentaje: number;
    esNivelMaximo: boolean;
}

export default function ProfileLevel() {
    const [progresoXP, setProgresoXP] = useState<ProgresoXP | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        // Obtenemos los datos en vivo del endpoint de XP
        fetch('http://localhost:3000/api/xp/progreso')
            .then(res => res.json())
            .then(data => setProgresoXP(data))
            .catch(err => console.error("Error al cargar la XP:", err))
            .finally(() => setCargando(false));
    }, []);

    // Calcula el próximo hito (múltiplo de 5)
    const proximoHito = useMemo(() => {
        if (!progresoXP) return 5;
        if (progresoXP.esNivelMaximo) return 40;
        return (Math.floor(progresoXP.nivel / 5) + 1) * 5;
    }, [progresoXP]);

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center px-4 pb-12 overflow-y-auto">
            <PageHeader titulo="Nivel de Perfil" />

            <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-6 mt-2">
                
                {/* 1. SECCIÓN PRINCIPAL: ESTADO EN GRANDE */}
                <div className="w-full bg-[#121212] border-2 border-purple-500/30 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_30px_rgba(168,85,247,0.1)] animate-fade-in-down">
                    <span className="text-purple-400 font-extrabold tracking-[0.3em] uppercase text-xs mb-2 flex items-center gap-2">
                        <FireIcon className="w-4 h-4" /> Rango Actual
                    </span>
                    
                    {cargando ? (
                        <div className="h-16 w-48 bg-zinc-800 animate-pulse rounded-lg mb-6"></div>
                    ) : (
                        <h1 className="text-6xl font-black text-white mb-6 drop-shadow-md">
                            Nivel {progresoXP?.nivel || 1}
                        </h1>
                    )}

                    <div className="w-full max-w-lg flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-bold px-2">
                            <span className="text-zinc-400">{progresoXP?.xpActualEnNivel || 0} XP</span>
                            <span className="text-purple-400 font-black text-lg">
                                {progresoXP && !progresoXP.esNivelMaximo 
                                    ? `${progresoXP.xpParaSiguienteNivel - progresoXP.xpActualEnNivel} XP para subir` 
                                    : 'NIVEL MÁXIMO'}
                            </span>
                            <span className="text-zinc-400">{progresoXP?.xpParaSiguienteNivel || 10000} XP</span>
                        </div>
                        
                        <div className="w-full bg-black rounded-full h-5 overflow-hidden border border-zinc-800 shadow-inner p-0.5">
                            <div 
                                className="bg-gradient-to-r from-purple-800 via-purple-500 to-purple-400 h-full rounded-full transition-all duration-1000 relative" 
                                style={{ width: `${progresoXP?.porcentaje || 0}%` }}
                            >
                                <div className="absolute inset-y-0 right-0 w-8 bg-white/30 blur-md rounded-full"></div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-2">
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                XP Total Acumulada: {progresoXP?.xpAcumulada || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. VISTA PREVIA DEL PRÓXIMO HITO */}
                <div className="w-full bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-6 flex items-center gap-6 animate-fade-in-down delay-100 shadow-lg">
                    <div className="w-20 h-20 rounded-full bg-black border-2 border-purple-500/50 flex items-center justify-center shadow-inner flex-shrink-0 relative overflow-hidden">
                        {/* Brillo de fondo para el ícono */}
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
                        
                        {progresoXP?.esNivelMaximo ? (
                            <SparklesIcon className="w-10 h-10 text-purple-400 relative z-10" />
                        ) : (
                            <LockClosedIcon className="w-8 h-8 text-zinc-600 relative z-10" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-1">
                            {progresoXP?.esNivelMaximo ? 'Progreso Máximo Alcanzado' : 'Próxima Recompensa'}
                        </span>
                        <h3 className="text-xl font-bold text-white mb-1">
                            {progresoXP?.esNivelMaximo ? 'Maestría Total' : `Hito de Nivel ${proximoHito}`}
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {progresoXP?.esNivelMaximo 
                                ? 'Has alcanzado el límite de nivel de la versión actual. ¡Sigue acumulando experiencia, tu progreso se guardará para futuras actualizaciones!'
                                : `Alcanza el nivel ${proximoHito} para desbloquear una nueva recompensa visual para tu perfil y conmemorar tu constancia en Focus.`}
                        </p>
                    </div>
                </div>

                {/* 3. GUÍA: CÓMO GANAR EXPERIENCIA */}
                <div className="w-full flex flex-col gap-4 animate-fade-in-down delay-200 mt-2">
                    <h3 className="text-lg font-bold text-white px-2 flex items-center gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-purple-400" /> Manual de Experiencia (XP)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Lo que DA experiencia */}
                        <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-5 shadow-lg">
                            <span className="text-[#5ecfb8] font-bold text-xs uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#5ecfb8]"></span>
                                Acciones Recompensadas
                            </span>
                            <ul className="flex flex-col gap-3.5">
                                <li className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-300">Registrar una actividad nueva</span>
                                    <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">+10 XP</span>
                                </li>
                                <li className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-300">Crear una plantilla rápida</span>
                                    <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">+50 XP</span>
                                </li>
                                <li className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-300">Generar Reporte Semanal</span>
                                    <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">+500 XP</span>
                                </li>
                                <li className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-300">Desbloquear Logros (Misiones)</span>
                                    <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">Variable</span>
                                </li>
                            </ul>
                        </div>

                        {/* Lo que NO DA experiencia */}
                        <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-5 shadow-lg flex flex-col">
                            <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                Acciones Neutrales (0 XP)
                            </span>
                            <ul className="flex flex-col gap-3.5 flex-1">
                                <li className="flex items-center gap-3 text-sm text-zinc-400">
                                    <LockClosedIcon className="w-4 h-4 opacity-50" /> Editar actividades existentes
                                </li>
                                <li className="flex items-center gap-3 text-sm text-zinc-400">
                                    <LockClosedIcon className="w-4 h-4 opacity-50" /> Eliminar registros
                                </li>
                                <li className="flex items-center gap-3 text-sm text-zinc-400">
                                    <LockClosedIcon className="w-4 h-4 opacity-50" /> Ediciones continuas del perfil
                                </li>
                            </ul>
                            
                            <div className="mt-4 bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                    El sistema premia el progreso real y la constancia diaria. Modificar registros antiguos para inflar tu tiempo no otorgará experiencia adicional.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}