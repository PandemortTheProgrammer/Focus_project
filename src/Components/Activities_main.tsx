import { useNavigate } from 'react-router-dom'

// Datos de prueba para visualizar el diseño
const actividadesPrueba = [
  { id: 1, tag: 'Estudio', descripcion: 'Repasar apuntes de matemáticas', hora_inicio: '08:00', duracion: 45 },
  { id: 2, tag: 'Ejercicio', descripcion: 'Rutina de cardio en casa', hora_inicio: '10:30', duracion: 30 },
  { id: 3, tag: 'Lectura', descripcion: 'Leer capítulo 5 del libro', hora_inicio: '15:00', duracion: 60 },
]

// Color por tipo de actividad
const tagColor: Record<string, string> = {
  Estudio: '#1a7a6e',
  Ejercicio: '#d946ef',
  Lectura: '#f97316',
}

export default function ActivitiesMain() {
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos */}
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-60 h-60 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          ← Back
        </button>
        <h1 className="text-5xl font-bold"
          style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Activities
        </h1>
        <button
          onClick={() => navigate('/actividades/agregar')}
          className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          + Add activity
        </button>
      </div>

      {/* Lista de actividades */}
      <div className="relative z-10 flex flex-col gap-4 px-8 py-4 overflow-y-auto">
        {actividadesPrueba.length === 0 ? (
          <p className="text-white text-center opacity-60 mt-10">
            No hay actividades registradas aún.
          </p>
        ) : (
          actividadesPrueba.map((actividad) => (
            <div
              key={actividad.id}
              className="flex items-center justify-between px-6 py-4 rounded-2xl"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

              {/* Tag con color */}
              <div className="flex items-center gap-4">
                <div className="w-3 h-12 rounded-full"
                  style={{ backgroundColor: tagColor[actividad.tag] ?? '#888' }} />
                <div>
                  <p className="text-white font-bold text-lg">{actividad.tag}</p>
                  <p className="text-white opacity-60 text-sm">{actividad.descripcion}</p>
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
                  <p className="font-semibold">{actividad.duracion} min</p>
                </div>

                {/* Botones editar/eliminar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/actividades/editar/${actividad.id}`)}
                    className="px-4 py-2 rounded-full text-white text-xs font-semibold transition hover:opacity-80"
                    style={{ backgroundColor: '#1a7a6e' }}>
                    Editar
                  </button>
                  <button
                    className="px-4 py-2 rounded-full text-white text-xs font-semibold transition hover:opacity-80"
                    style={{ backgroundColor: '#7a1a1a' }}>
                    Eliminar
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}