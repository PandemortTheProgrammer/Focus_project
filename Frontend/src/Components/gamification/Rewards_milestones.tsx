// src/components/Rewards_milestones.tsx
import { obtenerUrlIcono } from '../../utils/icons';
import { obtenerUrlTarjeta } from '../../utils/tarjetas';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import type { RecompensaCatalogo } from '../../utils/Rewards_types';
import RewardDetails, { type RecompensaDetalle } from './Reward_details';
import { useState } from 'react';

interface Props {
    recompensas: RecompensaCatalogo[];
}

export default function RewardsMilestones({ recompensas }: Props) {
    const [hitoSeleccionado, setHitoSeleccionado] = useState<RecompensaDetalle | null>(null);
    // Filtramos solo los hitos
    const hitos = recompensas.filter(r => r.coleccion === 'HITO');

    if (hitos.length === 0) return <p className="text-zinc-500 text-center w-full mt-10">Los hitos de nivel aún no están configurados en el catálogo.</p>;

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-fade-in">
            {hitos.map((hito) => {
                const urlTarjeta = hito.tipo_recompensa === 'CARD'
                    ? obtenerUrlTarjeta(hito.Id_desbloqueado)
                    : undefined;

                return (
                <button
                    key={hito.Id_recompensa}
                    type="button"
                    onClick={() => setHitoSeleccionado(hito)}
                    className={`relative flex items-center gap-5 p-4 rounded-2xl shadow-md border-l-4 transition-all duration-300 overflow-hidden ${hito.estaDesbloqueado
                            ? 'w-full text-left hover:scale-105 opacity-100 cursor-pointer bg-gradient-to-r from-[#1a1a1a] to-purple-900/10'
                            : 'w-full text-left opacity-60 grayscale hover:opacity-80 cursor-pointer bg-[#1a1a1a]'
                        }`}
                    style={{
                        borderColor: hito.estaDesbloqueado ? '#a855f7' : '#3f3f46',
                        ...(hito.estaDesbloqueado && urlTarjeta ? {
                            backgroundImage: `linear-gradient(90deg, rgba(26, 26, 26, 0.65), rgba(26, 26, 26, 0.2)), url("${urlTarjeta}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } : {})
                    }}
                >
                    {hito.estaDesbloqueado && urlTarjeta && (
                        <span className="absolute inset-0 bg-purple-950/10 pointer-events-none" aria-hidden="true" />
                    )}
                    
                    {/* Ícono de Hito */}
                    <div className={`relative z-10 w-16 h-16 flex-shrink-0 rounded-full overflow-hidden shadow-inner flex items-center justify-center border-2 ${hito.estaDesbloqueado ? 'bg-zinc-800 border-purple-500' : 'bg-black border-zinc-600'
                        }`}>
                        {hito.estaDesbloqueado ? (
                            urlTarjeta ? (
                                <img src={urlTarjeta} alt={hito.nombre_icono ?? hito.nombre_recompensa} className="w-full h-full object-cover" />
                            ) : hito.Id_icono ? (
                                <img src={obtenerUrlIcono(hito.Id_icono)} alt={hito.nombre_recompensa} className="w-full h-full object-cover" />
                            ) : null
                        ) : <LockClosedIcon className="w-8 h-8 text-zinc-500" />}
                    </div>

                    {/* Contenedor de Texto con Glassmorphism dinámico */}
                    <div className={`relative z-10 flex flex-col justify-center flex-1 transition-all duration-300 ${
                        hito.estaDesbloqueado 
                        ? 'bg-zinc-700/85 backdrop-blur-md p-3 rounded-xl border border-white/5 shadow-lg' 
                        : ''
                    }`}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${hito.estaDesbloqueado ? 'text-purple-400' : 'text-zinc-500'
                            }`}>
                            {hito.estaDesbloqueado ? 'Hito Alcanzado' : 'Nivel Requerido'}
                        </span>

                        <h3 className={`font-bold text-lg leading-none mb-1.5 ${hito.estaDesbloqueado ? 'text-white' : 'text-zinc-400'
                            }`}>
                            {hito.nombre_recompensa}
                        </h3>

                        <p className={`text-sm leading-snug line-clamp-2 ${hito.estaDesbloqueado ? 'text-zinc-300' : 'text-zinc-400 pr-2'}`}>
                            {hito.descripcion}
                        </p>

                        {hito.estaDesbloqueado && (
                            <div className="flex flex-col mt-2.5">
                                <span className="text-[#5ecfb8] text-[9px] font-extrabold uppercase tracking-widest">
                                    Recompensa:
                                </span>
                                <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                                    {hito.tipo_recompensa == 'CARD' ? 'Tarjeta' : 'N/A'} - {hito.nombre_icono}
                                </span>
                            </div>
                        )}
                    </div>
                </button>
                );
            })}
        </div>
        
        {hitoSeleccionado && (
            <RewardDetails
                logro={hitoSeleccionado}
                onClose={() => setHitoSeleccionado(null)}
            />
        )}
        </>
    );
}