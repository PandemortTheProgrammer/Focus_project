import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Mapeo de colores adaptado a los nombres que pusiste en tu backend
const tagColor: Record<string, string> = {
  "Estudio": '#1a7a6e',
  "Trabajar": '#1a7a6e', // Color similar para trabajar
  "Hacer Ejercicio": '#d946ef',
  "Ejercicio": '#d946ef',
  "Leer": '#f97316',
  "Lectura": '#f97316',
  "Dormir": '#3b82f6',
  "Ocio": '#eab308'
}

export default function ActivitiesMain() {
  const navigate = useNavigate()
  
  // 1. Estados para guardar lo que viene de Express
  const [actividades, setActividades] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
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
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos (Sin cambios) */}
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-70" style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-70" style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-60 h-60 rounded-full blur-3xl opacity-80" style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70" style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      {/* Header (Sin cambios visuales) */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          ← Back
        </button>
        <h1 className="text-5xl font-bold" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Activities
        </h1>
        <button
          onClick={() => navigate('/actividades/agregar')}
          className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          + Add activity
        </button>
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
            const tipoEncontrado = tipos.find(t => t.id_tipo === actividad.id_tipo);
            const nombreTipo = tipoEncontrado ? tipoEncontrado.nombre_tipo : 'Actividad';

            return (
              <div
                key={actividad.id_actividad}
                className="flex items-center justify-between px-6 py-4 rounded-2xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

                {/* Tag con color */}
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: tagColor[nombreTipo] ?? '#888' }} />
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

                  {/* Botones editar/eliminar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/actividades/editar/${actividad.id_actividad}`)}
                      className="px-4 py-2 rounded-full text-white text-xs font-semibold transition hover:opacity-80"
                      style={{ backgroundColor: '#1a7a6e' }}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(actividad.id_actividad)}
                      className="px-4 py-2 rounded-full text-white text-xs font-semibold transition hover:opacity-80"
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