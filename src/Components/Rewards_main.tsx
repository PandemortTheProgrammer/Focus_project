import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type Perfil from '../models/Perfil';
import { obtenerUrlIcono } from '../utils/icons';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useToast } from './ToastContext'; // Importamos las notificaciones globales

interface RewardsProps {
  perfilGlobal: Perfil;
}

// Interfaz para mapear la respuesta del backend
interface RecompensaDesbloqueada {
  nombre_icono: string;
  Id_recompensa: number;
  nombre_recompensa: string;
  descripcion: string;
  Id_icono: number;
  tipo_recompensa?: string;
}

export default function RewardsMain({ perfilGlobal }: RewardsProps) {
  const navigate = useNavigate();
  const { mostrarToast } = useToast(); // Extraemos la función global
  
  const [recompensas, setRecompensas] = useState<RecompensaDesbloqueada[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRecompensas = async () => {
      try {
        const idPerfil = perfilGlobal.id_perfil || 1;
        const res = await fetch(`http://localhost:3000/api/recompensas/perfil/${idPerfil}`);
        
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
        Tus Recompensas y Logros
      </h1>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6">
        {cargando ? (
          <p className="text-zinc-400 animate-pulse">Cargando tus logros...</p>
        ) : recompensas.length === 0 ? (
          <div className="p-8 rounded-2xl shadow-lg w-full text-center border border-zinc-700/50" style={{ backgroundColor: '#2a2a2a' }}>
            <p className="text-zinc-400">Aún no has desbloqueado ninguna recompensa. ¡Registra actividades para empezar a ganar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {recompensas.map((logro) => (
              <div 
                key={logro.Id_recompensa} 
                className="flex items-center gap-5 p-4 rounded-2xl shadow-md border-l-4 transition hover:scale-105"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#fbbf24' }}
              >
                {/* Ícono de la recompensa */}
                <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 border-2 border-yellow-500 shadow-inner flex items-center justify-center">
                  {logro.Id_icono ? (
                    <img src={obtenerUrlIcono(logro.Id_icono)} alt={logro.nombre_recompensa} className="w-full h-full object-cover" />
                  ) : (
                    <CheckBadgeIcon className="w-full h-full text-yellow-500 p-2" />
                  )}
                </div>

                {/* Textos del logro modificado */}
                <div className="flex flex-col justify-center">
                  <span className="text-[#fbbf24] text-[10px] font-extrabold uppercase tracking-widest mb-1">
                    Obtuviste:
                  </span>
                  <h3 className="text-white font-bold text-lg leading-none mb-1.5">
                    {logro.nombre_recompensa}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-snug pr-2">
                    {logro.descripcion}
                  </p>
                  <span className="text-[#fbbf24] text-[9px] font-extrabold uppercase tracking-widest mb-1">
                    Desbloqueaste:
                  </span>
                  <span className="text-white text-[7px] font-extrabold uppercase tracking-widest mb-1">
                    {logro.tipo_recompensa}: {logro.nombre_icono}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-8 px-10 py-3 rounded-full text-white font-semibold transition hover:opacity-80 border border-zinc-700/50" 
          style={{ backgroundColor: '#1a1a1a' }}
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}