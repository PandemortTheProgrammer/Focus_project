import { useEffect, useState, useMemo } from 'react';
import type Perfil from '../../models/Perfil';
import { useToast } from '../essentials/ToastContext';
import PageHeader from '../essentials/Page-head';
import RewardsAchievements from './Rewards_achievements';
import RewardsMilestones from './Rewards_milestones';
import type { RecompensaCatalogo } from '../../utils/Rewards_types';

interface RewardsProps {
  perfilGlobal: Perfil;
}

const normalizarColeccion = (recompensa: RecompensaCatalogo): RecompensaCatalogo => {
  if (recompensa.coleccion) return recompensa;

  const id = Number(recompensa.Id_recompensa);
  if (id >= 1 && id <= 18) return { ...recompensa, coleccion: 'V1' };
  if (id >= 19 && id <= 29) return { ...recompensa, coleccion: 'V2' };
  if (id >= 1001 && id <= 1008) return { ...recompensa, coleccion: 'HITO' };
  return recompensa;
};

export default function RewardsMain({ perfilGlobal }: RewardsProps) {
  const { mostrarToast } = useToast();
  
  const [recompensas, setRecompensas] = useState<RecompensaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState<'LOGROS' | 'HITOS'>('LOGROS');

  useEffect(() => {
    const cargarRecompensas = async () => {
      try {
        const idPerfil = perfilGlobal.id_perfil || 1;
        const res = await fetch(`http://localhost:3000/api/recompensas/catalogo/${idPerfil}`);
        
        if (res.ok) {
          const datos: unknown = await res.json();
          if (!Array.isArray(datos)) {
            throw new Error('El catálogo de recompensas tiene un formato inválido.');
          }
          setRecompensas(datos.map(normalizarColeccion));
        } else {
          mostrarToast('error', 'Error al cargar', 'No se pudieron recuperar tus recompensas.');
        }
      } catch {
        mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    };
    cargarRecompensas();
  }, [perfilGlobal.id_perfil, mostrarToast]);

  // Cálculos de estadísticas compartidas
  const stats = useMemo(() => {
    const calc = (col: string) => {
      const arr = recompensas.filter(r => col === 'LOGROS' ? (r.coleccion === 'V1' || r.coleccion === 'V2') : r.coleccion === 'HITO');
      const obtenidos = arr.filter(r => r.estaDesbloqueado).length;
      const total = arr.length;
      return { obtenidos, total, porcentaje: total > 0 ? Math.round((obtenidos / total) * 100) : 0 };
    };
    return { logros: calc('LOGROS'), hitos: calc('HITOS') };
  }, [recompensas]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center px-4 pb-12 overflow-y-auto">
      <PageHeader titulo="Vitrina de Recompensas" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6 mt-4">

        {cargando ? (
          <p className="text-[#5ecfb8] animate-pulse tracking-widest uppercase font-bold text-sm">Sincronizando base de datos...</p>
        ) : recompensas.length === 0 ? (
          <div className="p-8 rounded-2xl shadow-lg w-full text-center border border-zinc-700/50" style={{ backgroundColor: '#1a1a1a' }}>
            <p className="text-zinc-400">No hay datos de recompensas disponibles.</p>
          </div>
        ) : (
          <>
            {/* ESTADÍSTICAS GLOBALES */}
            <div className="w-full grid grid-cols-2 gap-4 mb-2 animate-fade-in-down">
              <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Logros Obtenidos</span>
                      <span className="text-white font-bold">{stats.logros.obtenidos}/{stats.logros.total}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#fbbf24] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${stats.logros.porcentaje}%` }}></div>
                  </div>
              </div>
              <div className="bg-[#1a1a1a] border border-zinc-700/50 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Hitos Alcanzados</span>
                      <span className="text-white font-bold">{stats.hitos.obtenidos}/{stats.hitos.total}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${stats.hitos.porcentaje}%` }}></div>
                  </div>
              </div>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div className="flex w-full bg-[#1a1a1a] rounded-full p-1 border border-zinc-700/50 relative">
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-700 rounded-full transition-transform duration-300 shadow-md"
                style={{ transform: pestañaActiva === 'LOGROS' ? 'translateX(0)' : 'translateX(100%)' }}
              />
              <button
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider relative z-10 transition-colors ${pestañaActiva === 'LOGROS' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                onClick={() => setPestañaActiva('LOGROS')}
              >
                Logros de Sistema
              </button>
              <button
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider relative z-10 transition-colors ${pestañaActiva === 'HITOS' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                onClick={() => setPestañaActiva('HITOS')}
              >
                Hitos de Nivel
              </button>
            </div>

            {/* RENDERIZADO DEL COMPONENTE ACTIVO */}
            <div className="w-full mt-2">
              {pestañaActiva === 'LOGROS' ? (
                <RewardsAchievements recompensas={recompensas} />
              ) : (
                <RewardsMilestones recompensas={recompensas} />
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}