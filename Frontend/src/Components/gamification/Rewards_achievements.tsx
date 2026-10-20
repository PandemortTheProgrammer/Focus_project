import { obtenerUrlIcono } from '../../utils/icons';
import { CheckBadgeIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import type { RecompensaCatalogo } from '../../utils/Rewards_types';
import RewardDetails, { type RecompensaDetalle } from './Reward_details';
import { useState } from 'react';

interface Props {
    recompensas: RecompensaCatalogo[];
}

export default function RewardsAchievements({ recompensas }: Props) {
    const [logroSeleccionado, setLogroSeleccionado] = useState<RecompensaDetalle | null>(null);
    // Filtramos solo V1 y V2
    const logros = recompensas.filter(r => r.coleccion === 'V1' || r.coleccion === 'V2');
    const IDs_SECRETOS = [7, 14, 18, 20, 23, 24, 27, 28];

    if (logros.length === 0) return <p className="text-zinc-500 text-center w-full mt-10">No hay logros disponibles.</p>;

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-fade-in">
            {logros.map((logro) => {
                const esSecreto = IDs_SECRETOS.includes(logro.Id_recompensa);
                const ocultarInfo = !logro.estaDesbloqueado && esSecreto;

                return (
                    <button
                        key={logro.Id_recompensa}
                        onClick={() => setLogroSeleccionado(logro)}
                        type="button"
                        className={`flex w-full items-center gap-5 p-4 text-left rounded-2xl shadow-md border-l-4 transition-all duration-300 cursor-pointer ${logro.estaDesbloqueado
                            ? 'hover:scale-105 opacity-100'
                            : 'opacity-60 grayscale hover:opacity-80'
                            }`}
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderColor: logro.estaDesbloqueado ? '#fbbf24' : '#3f3f46'
                        }}
                    >
                        {/* Ícono */}
                        <div className={`w-16 h-16 flex-shrink-0 rounded-full overflow-hidden shadow-inner flex items-center justify-center border-2 ${logro.estaDesbloqueado ? 'bg-zinc-800 border-yellow-500' : 'bg-black border-zinc-600'
                            }`}>
                            {logro.estaDesbloqueado ? (
                                logro.Id_icono ? (
                                    <img src={obtenerUrlIcono(logro.Id_icono)} alt={logro.nombre_recompensa} className="w-full h-full object-cover" />
                                ) : <CheckBadgeIcon className="w-full h-full text-yellow-500 p-2" />
                            ) : <LockClosedIcon className="w-8 h-8 text-zinc-500" />}
                        </div>

                        {/* Textos */}
                        <div className="flex flex-col justify-center flex-1">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${logro.estaDesbloqueado ? 'text-[#fbbf24]' : 'text-zinc-500'
                                }`}>
                                {logro.estaDesbloqueado ? 'Logro Obtenido' : 'Por obtener'}
                            </span>

                            <h3 className={`font-bold text-lg leading-none mb-1.5 ${logro.estaDesbloqueado ? 'text-white' : 'text-zinc-400'
                                }`}>
                                {ocultarInfo ? 'Logro Clasificado' : logro.nombre_recompensa}
                            </h3>

                            <p className="text-zinc-400 text-sm leading-snug pr-2 line-clamp-2">
                                {ocultarInfo ? 'Sigue explorando las funciones ocultas del sistema para revelar este objetivo.' : logro.descripcion}
                            </p>

                            {logro.estaDesbloqueado && (
                                <>
                                    <span className="text-[#5ecfb8] text-[9px] font-extrabold uppercase tracking-widest">
                                        Recompensa:
                                    </span>
                                    <span className="text-white text-[9px] font-bold uppercase tracking-wider">
                                        {logro.tipo_recompensa} - {logro.nombre_icono}
                                    </span>
                                </>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
        {logroSeleccionado && (
            <RewardDetails
                logro={logroSeleccionado}
                onClose={() => setLogroSeleccionado(null)}
            />
        )}
        </>
    );
}