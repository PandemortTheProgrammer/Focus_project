import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type Perfil from '../models/Perfil';
import { obtenerUrlIcono } from '../utils/icons';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface RewardsProps {
  perfilGlobal: Perfil;
}

// Interfaz para mapear la respuesta del backend
interface RecompensaDesbloqueada {
  Id_recompensa: number;
  nombre_recompensa: string;
  descripcion: string;
  Id_icono: number;
}

export default function RewardsMain({ perfilGlobal }: RewardsProps) {
  const navigate = useNavigate();
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
        }
      } catch (error) {
        console.error('Error al cargar recompensas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarRecompensas();
  }, [perfilGlobal.id_perfil]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center pt-16 px-4 pb-12 overflow-y-auto">
      <h1 className="text-4xl font-bold text-center mb-10 z-10" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Tus Recompensas y Logros
      </h1>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6">
        {cargando ? (
          <p className="text-zinc-400">Cargando tus logros...</p>
        ) : recompensas.length === 0 ? (
          <div className="p-8 rounded-2xl shadow-lg w-full text-center" style={{ backgroundColor: '#2a2a2a' }}>
            <p className="text-zinc-400">Aún no has desbloqueado ninguna recompensa. ¡Registra actividades para empezar a ganar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {recompensas.map((logro) => (
              <div 
                key={logro.Id_recompensa} 
                className="flex items-center gap-4 p-4 rounded-2xl shadow-md border-l-4 transition hover:scale-105"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#fbbf24' }}
              >
                {/* Ícono de la recompensa */}
                <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-zinc-700 border-2 border-yellow-500 shadow-inner">
                  {logro.Id_icono ? (
                    <img src={obtenerUrlIcono(logro.Id_icono)} alt={logro.nombre_recompensa} className="w-full h-full object-cover" />
                  ) : (
                    <CheckBadgeIcon className="w-full h-full text-yellow-500 p-2" />
                  )}
                </div>

                {/* Textos del logro */}
                <div className="flex flex-col">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {logro.nombre_recompensa}
                  </h3>
                  <p className="text-zinc-400 text-sm">{logro.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-8 px-10 py-2 rounded-full text-white font-bold transition hover:opacity-80" 
          style={{ backgroundColor: '#1a1a1a' }}
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}