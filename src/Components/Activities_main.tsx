import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'
import type Tipo_actividad from '../models/Tipo_actividad'
import type Actividad from '../models/Actividad'
import type Perfil from '../models/Perfil'

// Mapeo de colores adaptado a los nombres que pusiste en tu backend
const tagColor: Record<number, string> = {
  1: '#1a7a6e',
  2: '#135850', 
  3: '#d946ef',
  4: '#b227c7',
  5: '#f97316',
  6: '#3b82f6',
  7: '#eab308',
  8: '#ff987a',
  9: '#8b7fef',
}

interface DashboardProps {
  perfilGlobal: Perfil;
}

// Función auxiliar para calcular si pasaron 24 horas desde la creación
const esActividadBloqueada = (fechaCreacion?: string | Date | null) => {
  if (!fechaCreacion) return false;
  
  const fechaUtc = typeof fechaCreacion === 'string'
    ? new Date(fechaCreacion.replace(' ', 'T') + 'Z')
    : new Date(fechaCreacion);
  const ahora = new Date();
  
  // Calculamos la diferencia exacta en horas
  const horasTranscurridas = (ahora.getTime() - fechaUtc.getTime()) / (1000 * 60 * 60);
  
  return horasTranscurridas >= 24;
};

export default function ActivitiesMain({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const nickname = perfilGlobal?.nickname || 'Desconocido'
  const focus = perfilGlobal?.id_focus || '--'
  
  // 1. Estados para guardar lo que viene de Express
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [cargando, setCargando] = useState(true)

  // 2. Traer las actividades y el catálogo de tipos al cargar la pantalla
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Hacemos ambas peticiones al mismo tiempo para mayor velocidad
        const [resActividades, resTipos] = await Promise.all([
          fetch('http://localhost:3000/api/actividades'),
          fetch('http://localhost:3000/api/actividades/tipos-actividad')
        ]);

        if (resActividades.ok && resTipos.ok) {
          setActividades(await resActividades.json());
          setTipos(await resTipos.json());
        }
      } catch (error) {
        console.error("Error al conectar con Express:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  // 3. Función para eliminar conectada al backend
  const handleEliminar = async (id_actividad: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta actividad?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/actividades/${id_actividad}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Borramos visualmente la actividad sin recargar la página
        setActividades(actividades.filter(act => act.id_actividad !== id_actividad));
      }
    } catch (error) {
      alert("Error al intentar eliminar la actividad.");
      console.log(error);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos (Sin cambios) */}
      <div className="absolute w-64 h-64 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-52 h-52 rounded-full blur-2xl opacity-80"
        style={{ backgroundColor: '#f97316', top: '30%', left: '38%', transform: 'translateX(-50%)' }} />
      <div className="absolute w-60 h-60 rounded-full blur-2xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>

        {/* Logo */}
        <img src={FocusLogo} alt="Focus Logo" className="h-10 object-contain" />

        {/* Navegación central */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            ← Volver
          </button>
          <h1 className="text-5xl font-bold" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
            Actividades
          </h1>
          <button
            onClick={() => navigate('/actividades/agregar')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            + Agregar actividad
          </button>
        </div>

        {/* Info del usuario */}
        <div className="flex items-center gap-4">
          {/* Avatar con inicial */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#1a7a6e' }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          {/* Datos del perfil */}
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{nickname}</p>
            <p className="text-white opacity-50 text-xs">Enfoque: {focus}</p>
          </div>
        </div>

      </div>

      {/* Lista de actividades Dinámica */}
      <div className="relative z-10 flex flex-col gap-4 px-8 py-4 overflow-y-auto">
        {cargando ? (
           <p className="text-white text-center opacity-60 mt-10">Cargando actividades...</p>
        ) : actividades.length === 0 ? (
          <p className="text-white text-center opacity-60 mt-10">
            No hay actividades registradas aún.
          </p>
        ) : (
          actividades.map((actividad) => {
            // 4. Buscamos el nombre del tipo basándonos en el id_tipo que guardó el backend
            const tipoEncontrado = tipos.find((t) => Number(t.id_tipo) === Number(actividad.id_tipo));
            const nombreTipo = tipoEncontrado?.nombre_tipo ?? 'Actividad';
            const idTipo = tipoEncontrado ? Number(tipoEncontrado.id_tipo) : 0;

            // Evaluamos si el registro ya cumplió las 24 horas de antigüedad
            const bloqueada = esActividadBloqueada(actividad.hora_creacion ?? '');

            return (
              <div
                key={actividad.id_actividad}
                className="flex items-center justify-between px-6 py-4 rounded-2xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

                {/* Tag con color e ícono de candado */}
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: tagColor[idTipo] ?? '#888' }} />
                  
                  {/* Candado visual: Solo se dibuja si la actividad está bloqueada */}
                  {bloqueada && (
                    <div 
                      className="flex items-center justify-center p-1.5 rounded-full bg-zinc-800/60 transition-all"
                      title="Actividad consolidada. Ha superado las 24 horas desde su registro y ya no puede ser modificada.">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  <div>
                    <p className="text-white font-bold text-lg">{nombreTipo}</p>
                    <p className="text-white opacity-60 text-sm">{actividad.descripcion_actividad}</p>
                  </div>
                </div>

                {/* Info derecha */}
                <div className="flex items-center gap-8 text-white text-sm">
                  <div className="text-center">
                    <p className="opacity-50">Inicio</p>
                    <p className="font-semibold">{actividad.hora_inicio}</p>
                  </div>
                  <div className="text-center">
                    <p className="opacity-50">Duración</p>
                    <p className="font-semibold">{actividad.duracion_minutos} min</p>
                  </div>

                  {/* Botones editar/eliminar con bloqueo condicional */}
                  <div className="flex gap-2">
                    <button
                      disabled={bloqueada}
                      onClick={() => navigate(`/actividades/editar/${actividad.id_actividad}`)}
                      title={bloqueada ? "Edición deshabilitada (Se superó el límite de 24 horas)" : "Editar actividad"}
                      className={`px-4 py-2 rounded-full text-white text-xs font-semibold transition-all ${
                        bloqueada 
                          ? 'opacity-30 cursor-not-allowed grayscale pointer-events-none' 
                          : 'hover:opacity-80'
                      }`}
                      style={{ backgroundColor: '#1a7a6e' }}>
                      Editar
                    </button>
                    <button
                      disabled={bloqueada}
                      onClick={() => handleEliminar(actividad.id_actividad)}
                      title={bloqueada ? "Eliminación deshabilitada (Se superó el límite de 24 horas)" : "Eliminar actividad"}
                      className={`px-4 py-2 rounded-full text-white text-xs font-semibold transition-all ${
                        bloqueada 
                          ? 'opacity-30 cursor-not-allowed grayscale pointer-events-none' 
                          : 'hover:opacity-80'
                      }`}
                      style={{ backgroundColor: '#7a1a1a' }}>
                      Eliminar
                    </button>
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}