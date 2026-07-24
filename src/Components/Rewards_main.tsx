import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type Perfil from '../models/Perfil';
import { obtenerUrlIcono } from '../utils/icons';
import { CheckBadgeIcon, LockClosedIcon } from '@heroicons/react/24/solid'; // Importamos el candado
import { useToast } from './ToastContext';

interface RewardsProps {
  perfilGlobal: Perfil;
}

// Interfaz actualizada para recibir la bandera estaDesbloqueado
interface CatalogoRecompensa {
  Id_recompensa: number;
  nombre_recompensa: string;
  descripcion: string;
  Id_icono: number;
  nombre_icono: string;
  tipo_recompensa?: string;
  estaDesbloqueado: boolean;
}

export default function RewardsMain({ perfilGlobal }: RewardsProps) {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  
  const [recompensas, setRecompensas] = useState<CatalogoRecompensa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRecompensas = async () => {
      try {
        const idPerfil = perfilGlobal.id_perfil || 1;
        // MODIFICACIÓN: Apuntamos al nuevo endpoint del catálogo completo
        const res = await fetch(`http://localhost:3000/api/recompensas/catalogo/${idPerfil}`);
        
        if (res.ok) {
          const datos = await res.json();
          setRecompensas(datos);
        } else {
          mostrarToast('error', 'Error al cargar', 'No se pudieron recuperar tus recompensas.');
        }
      } catch (error) {
        console.error('Error al cargar recompensas:', error);
        mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    cargarRecompensas();
  }, [perfilGlobal.id_perfil, mostrarToast]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center pt-16 px-4 pb-12 overflow-y-auto">
      <h1 className="text-4xl font-bold text-center mb-10 z-10" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Vitrina de Logros
      </h1>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6">
        {cargando ? (
          <p className="text-[#5ecfb8] animate-pulse tracking-widest uppercase font-bold text-sm">
            Sincronizando base de datos...
          </p>
        ) : recompensas.length === 0 ? (
          <div className="p-8 rounded-2xl shadow-lg w-full text-center border border-zinc-700/50" style={{ backgroundColor: '#1a1a1a' }}>
            <p className="text-zinc-400">No hay datos de recompensas disponibles en el servidor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {recompensas.map((logro) => {
              const esSecreto = logro.Id_recompensa === 7;
              const ocultarInfo = !logro.estaDesbloqueado && esSecreto;

              return (
                <div 
                  key={logro.Id_recompensa} 
                  className={`flex items-center gap-5 p-4 rounded-2xl shadow-md border-l-4 transition-all duration-300 ${
                    logro.estaDesbloqueado 
                      ? 'hover:scale-105 opacity-100' 
                      : 'opacity-60 grayscale hover:opacity-80'
                  }`}
                  style={{ 
                    backgroundColor: '#1a1a1a', 
                    borderColor: logro.estaDesbloqueado ? '#fbbf24' : '#3f3f46' 
                  }}
                >
                  {/* Contenedor del Ícono con diseño HUD */}
                  <div className={`w-16 h-16 flex-shrink-0 rounded-full overflow-hidden shadow-inner flex items-center justify-center border-2 ${
                    logro.estaDesbloqueado ? 'bg-zinc-800 border-yellow-500' : 'bg-black border-zinc-600'
                  }`}>
                    {logro.estaDesbloqueado ? (
                      logro.Id_icono ? (
                        <img src={obtenerUrlIcono(logro.Id_icono)} alt={logro.nombre_recompensa} className="w-full h-full object-cover" />
                      ) : (
                        <CheckBadgeIcon className="w-full h-full text-yellow-500 p-2" />
                      )
                    ) : (
                      <LockClosedIcon className="w-8 h-8 text-zinc-500" />
                    )}
                  </div>

                  {/* Panel de Texto */}
                  <div className="flex flex-col justify-center flex-1">
                    {/* Etiqueta superior */}
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${
                      logro.estaDesbloqueado ? 'text-[#fbbf24]' : 'text-zinc-500'
                    }`}>
                      {logro.estaDesbloqueado ? 'Desbloqueado' : 'Misión Bloqueada'}
                    </span>
                    
                    {/* Título del logro */}
                    <h3 className={`font-bold text-lg leading-none mb-1.5 ${
                      logro.estaDesbloqueado ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {ocultarInfo ? 'Logro Clasificado' : logro.nombre_recompensa}
                    </h3>
                    
                    {/* Descripción */}
                    <p className="text-zinc-400 text-sm leading-snug pr-2 line-clamp-2">
                      {ocultarInfo ? 'Sigue explorando las funciones ocultas del sistema para revelar este objetivo.' : logro.descripcion}
                    </p>
                    
                    {/* Recompensa física */}
                    {logro.estaDesbloqueado && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[#5ecfb8] text-[9px] font-extrabold uppercase tracking-widest">
                          Recompensa:
                        </span>
                        <span className="text-white text-[9px] font-bold uppercase tracking-wider">
                          {logro.tipo_recompensa} - {logro.nombre_icono}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-8 px-10 py-3 rounded-full text-white font-semibold transition hover:opacity-80 hover:scale-105 border border-zinc-700/50 shadow-lg" 
          style={{ backgroundColor: '#5ecfb8', color: '#1a1a1a' }}
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}