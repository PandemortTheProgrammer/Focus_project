import { useState, useEffect } from 'react';
import PageHeader from '../essentials/Page-head'; // Ajusta la ruta según tu nueva estructura
import { PlusIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

// Interfaces base
interface TipoActividad {
  id_tipo: number;
  nombre_tipo: string;
  codigo_color: string;
}

interface BloqueIdeal {
  id_temporal: string;
  id_tipo: number;
  nombre_tipo: string;
  color: string;
  duracion_min: number;
  hora_inicio: string | null; // null significa que está en el "Banco"
}

export default function IdealDay() {
  // Estados
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [bloquesBanco, setBloquesBanco] = useState<BloqueIdeal[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Estados del formulario flotante
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('60');

  // Generar las 24 horas para la cuadrícula
  const horasDelDia = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  // Cargar tipos de actividad al montar
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/actividades/tipos-actividad');
        if (res.ok) {
          const data = await res.json();
          setTiposActividad(data);
        }
      } catch (error) {
        console.error("Error al cargar tipos de actividad:", error);
      }
    };
    cargarTipos();
  }, []);

  const crearBloque = () => {
    if (!tipoSeleccionado || !duracionSeleccionada) return;

    const tipoObj = tiposActividad.find(t => t.id_tipo === Number(tipoSeleccionado));
    if (!tipoObj) return;

    const nuevoBloque: BloqueIdeal = {
      id_temporal: `block-${Date.now()}`,
      id_tipo: tipoObj.id_tipo,
      nombre_tipo: tipoObj.nombre_tipo,
      color: tipoObj.codigo_color || '#888',
      duracion_min: Number(duracionSeleccionada),
      hora_inicio: null // Nace en el banco
    };

    setBloquesBanco([...bloquesBanco, nuevoBloque]);
    setMostrarModal(false);
    setTipoSeleccionado('');
    setDuracionSeleccionada('60'); // Reset a 1 hora por defecto
  };

  const eliminarBloqueBanco = (id_temporal: string) => {
    setBloquesBanco(bloquesBanco.filter(b => b.id_temporal !== id_temporal));
  };

  return (
    <div className="relative min-h-screen flex flex-col pb-12">
      <PageHeader 
        titulo="Mi Día Ideal" 
        rutaVolver="/dashboard" 
      />
      <p className="text-zinc-200 text-center max-w-2xl mx-auto mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
        Diseña la estructura perfecta de tus 24 horas. Este lienzo servirá como tu línea base para evaluar tus métricas y la compatibilidad con tu enfoque elegido.
      </p>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2 flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* ========================================= */}
      {/* MODAL: FORMULARIO GENERADOR DE BLOQUES    */}
      {/* ========================================= */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-zinc-700/50 flex flex-col bg-[#1a1a1a]">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Generar Bloque</h2>
              <button onClick={() => setMostrarModal(false)} className="text-zinc-500 hover:text-white transition">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-sm px-2">Tipo de Actividad</label>
                <select
                  value={tipoSeleccionado}
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none bg-[#2a2a2a] border border-zinc-700 focus:border-[#5ecfb8] transition-colors cursor-pointer"
                >
                  <option value="" disabled>Selecciona una actividad</option>
                  {tiposActividad.map((tipo) => (
                    <option key={tipo.id_tipo} value={tipo.id_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-sm px-2">Duración del bloque</label>
                <select
                  value={duracionSeleccionada}
                  onChange={(e) => setDuracionSeleccionada(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none bg-[#2a2a2a] border border-zinc-700 focus:border-[#5ecfb8] transition-colors cursor-pointer"
                >
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora 30 mins</option>
                  <option value="120">2 horas</option>
                  <option value="180">3 horas</option>
                  <option value="240">4 horas</option>
                  <option value="480">8 horas</option>
                </select>
              </div>
            </div>

            <button
              onClick={crearBloque}
              disabled={!tipoSeleccionado}
              className="w-full py-3 rounded-full text-[#1a1a1a] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              style={{ backgroundColor: '#5ecfb8' }}
            >
              Añadir al Banco
            </button>
          </div>
        </div>
      )}
        
        {/* ========================================= */}
        {/* ZONA 1: TABLERO DE 24 HORAS (LIENZO)      */}
        {/* ========================================= */}
        <div className="flex-[3] bg-[#1a1a1a]/80 border border-zinc-700/50 rounded-3xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-700/50 bg-[#2a2a2a]/50">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[#5ecfb8]" />
              Línea de tiempo
            </h2>
            <p className="text-zinc-400 text-xs mt-1">
              Arrastra aquí los bloques desde tu banco para estructurar tu día.
            </p>
          </div>
          
          {/* Cuadrícula scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
            <div className="relative border-l-2 border-zinc-700/30 ml-16">
              {horasDelDia.map((hora) => (
                <div key={hora} className="h-20 border-b border-zinc-700/20 relative group">
                  {/* Etiqueta de la hora */}
                  <span className="absolute -left-16 top-0 -translate-y-1/2 w-12 text-right text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {hora}
                  </span>
                  
                  {/* Área droppable (futura) */}
                  <div className="absolute inset-0 hover:bg-[#5ecfb8]/5 transition-colors cursor-pointer rounded-r-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* ZONA 2: BANCO DE BLOQUES Y BOTÓN "+"      */}
        {/* ========================================= */}
        <div className="flex-[1] min-w-[280px] bg-[#1a1a1a]/80 border border-zinc-700/50 rounded-3xl shadow-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-zinc-700/50 bg-[#2a2a2a]/50 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg">Tus Bloques</h3>
            <button
              onClick={() => setMostrarModal(true)}
              className="w-8 h-8 rounded-full bg-[#5ecfb8] text-[#1a1a1a] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_15px_rgba(94,207,184,0.4)] transition-all"
              title="Crear nuevo bloque"
            >
              <PlusIcon className="w-5 h-5 font-bold" />
            </button>
          </div>
          
          {/* Lista de bloques generados */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
            {bloquesBanco.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-12 h-12 border-2 border-dashed border-zinc-500 rounded-xl mb-3"></div>
                <p className="text-sm text-zinc-300">No tienes bloques creados.</p>
                <p className="text-xs text-zinc-400 mt-1">Usa el botón + para empezar.</p>
              </div>
            ) : (
              bloquesBanco.map((bloque) => (
                <div 
                  key={bloque.id_temporal} 
                  className="group relative p-3 rounded-xl border border-transparent hover:border-zinc-600 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                  style={{ backgroundColor: `${bloque.color}15`, borderLeft: `4px solid ${bloque.color}` }}
                >
                  <button 
                    onClick={() => eliminarBloqueBanco(bloque.id_temporal)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <p className="font-bold text-sm text-white mb-1 pr-6">{bloque.nombre_tipo}</p>
                  <p className="text-xs font-medium" style={{ color: bloque.color }}>
                    {bloque.duracion_min} minutos ({(bloque.duracion_min / 60).toFixed(1)}h)
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}