import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'

type TipoResumen = {
  nombre: string
  horas: number
  color: string
  resumen: string
  mensaje: string
}

type SemanaResumen = {
  id: number
  titulo: string
  fecha: string
  horas: number
  actividades: number
  descripcion: string
  tipos: TipoResumen[]
}

const evaluacionesSemana: SemanaResumen[] = [
  {
    id: 1,
    titulo: 'Semana 1',
    fecha: '09/07/2026',
    horas: 22.4,
    actividades: 16,
    descripcion: 'Inicio del hábito con sesiones organizadas y un balance saludable entre estudio y descanso.',
    tipos: [
      {
        nombre: 'Estudio',
        horas: 5.5,
        color: '#1a7a6e',
        resumen: 'Se mantuvo una rutina constante con sesiones cortas y muy enfocadas.',
        mensaje: 'Tu disciplina en estudio está creciendo. Cada sesión suma y te acerca a tus metas.'
      },
      {
        nombre: 'Ejercicio',
        horas: 2.3,
        color: '#d946ef',
        resumen: 'Se cuidó el cuerpo con movimientos breves pero consistentes.',
        mensaje: 'El progreso también se construye desde el autocuidado. Seguir así te dará más energía.'
      },
      {
        nombre: 'Trabajo',
        horas: 6.2,
        color: '#eab308',
        resumen: 'La semana laboral fue intensa y bien distribuida.',
        mensaje: 'Tu constancia en el trabajo demuestra orden y compromiso.'
      }
    ]
  },
  {
    id: 2,
    titulo: 'Semana 2',
    fecha: '16/07/2026',
    horas: 24.8,
    actividades: 19,
    descripcion: 'Mayor estabilidad en la rutina, con mejor organización y más tiempo para actividades de crecimiento.',
    tipos: [
      {
        nombre: 'Lectura',
        horas: 2.1,
        color: '#f97316',
        resumen: 'Hubo un tiempo dedicado a aprender y reflexionar.',
        mensaje: 'La lectura sigue siendo una poderosa forma de crecer de manera tranquila y profunda.'
      },
      {
        nombre: 'Dormir',
        horas: 8.1,
        color: '#3b82f6',
        resumen: 'Se priorizó el descanso como base del rendimiento.',
        mensaje: 'Dormir bien no es descanso perdido, es energía para seguir adelante.'
      },
      {
        nombre: 'Trabajo',
        horas: 7.4,
        color: '#eab308',
        resumen: 'La carga laboral fue más organizada y enfocada.',
        mensaje: 'Tu forma de trabajar está más alineada y eso marca la diferencia.'
      }
    ]
  },
  {
    id: 3,
    titulo: 'Semana 3',
    fecha: '23/07/2026',
    horas: 26.1,
    actividades: 21,
    descripcion: 'Cierre de la semana con más intención, mejor energía y un avance más claro en las metas personales.',
    tipos: [
      {
        nombre: 'Estudio',
        horas: 6.4,
        color: '#1a7a6e',
        resumen: 'Se cerró la semana con sesiones más profundas y completas.',
        mensaje: 'Tu esfuerzo en estudio se refleja en resultados cada vez más claros.'
      },
      {
        nombre: 'Ejercicio',
        horas: 3.0,
        color: '#d946ef',
        resumen: 'Se dio más espacio al movimiento y al cuidado personal.',
        mensaje: 'Mantener este ritmo te ayuda a sentirte mejor y con más confianza.'
      },
      {
        nombre: 'Música',
        horas: 1.5,
        color: '#8b5cf6',
        resumen: 'Se incluyó un tiempo de pausa y bienestar emocional.',
        mensaje: 'Pequeños espacios de calma también forman parte de un buen progreso.'
      }
    ]
  }
]

export default function WeeklySummary() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()

  const semanaSeleccionada = useMemo(() => {
    return evaluacionesSemana.find((semana) => String(semana.id) === id) ?? null
  }, [id])

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#4a5e5e' }}>
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-60 h-60 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      <div className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <img src={FocusLogo} alt="Focus Logo" className="h-10 object-contain" />
        <h1 className="text-4xl font-bold"
          style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          {semanaSeleccionada ? 'Detalle semanal' : 'Historial semanal'}
        </h1>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: '#1a7a6e' }}>
          F
        </div>
      </div>

      <div className="relative z-10 flex-1 px-8 py-6 overflow-y-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate(semanaSeleccionada ? '/resumenes-semanales' : '/dashboard')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            {semanaSeleccionada ? '← Volver al historial' : '← Volver'}
          </button>
        </div>

        {!semanaSeleccionada ? (
          <>
            <div className="rounded-3xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">Evaluaciones guardadas</p>
              <h2 className="text-3xl font-bold text-white mt-2">Selecciona una semana para ver su detalle</h2>
              <p className="text-sm text-white opacity-75 mt-3 leading-relaxed">
                El historial muestra cada semana como un botón resumido, y al entrar se despliega la evaluación más específica con horas, actividades y mensajes motivacionales.
              </p>
            </div>

            <div className="grid gap-4 mt-6">
              {evaluacionesSemana.map((semana) => (
                <button
                  key={semana.id}
                  onClick={() => navigate(`/resumen-semanal/${semana.id}`)}
                  className="text-left rounded-3xl p-6 transition hover:scale-[1.01] hover:opacity-95"
                  style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">{semana.fecha}</p>
                      <h3 className="text-2xl font-semibold text-white">{semana.titulo}</h3>
                      <p className="text-sm text-white opacity-70 mt-2">{semana.descripcion}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <p className="text-white opacity-60 text-xs">Horas</p>
                        <p className="text-white font-semibold">{semana.horas.toFixed(1)}h</p>
                      </div>
                      <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <p className="text-white opacity-60 text-xs">Actividades</p>
                        <p className="text-white font-semibold">{semana.actividades}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-sm font-semibold text-[#f5e6c8]">
                    Ver detalles →
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">{semanaSeleccionada.fecha}</p>
              <h2 className="text-3xl font-bold text-white mt-2">{semanaSeleccionada.titulo}</h2>
              <p className="text-sm text-white opacity-75 mt-3 leading-relaxed">{semanaSeleccionada.descripcion}</p>

              <div className="flex flex-wrap gap-3 mt-5">
                <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white opacity-60 text-xs">Horas totales</p>
                  <p className="text-white font-semibold">{semanaSeleccionada.horas.toFixed(1)}h</p>
                </div>
                <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white opacity-60 text-xs">Actividades</p>
                  <p className="text-white font-semibold">{semanaSeleccionada.actividades}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <h3 className="text-xl font-semibold text-white">Detalle por tipo de actividad</h3>
              <div className="mt-5 grid gap-3">
                {semanaSeleccionada.tipos.map((tipo) => (
                  <div key={tipo.nombre} className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tipo.color }} />
                        <span className="text-white font-semibold">{tipo.nombre}</span>
                      </div>
                      <span className="text-white opacity-70 text-sm">{tipo.horas.toFixed(1)}h</span>
                    </div>
                    <p className="text-white opacity-70 text-sm mt-2">{tipo.resumen}</p>
                    <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <p className="text-sm font-medium text-[#f5e6c8]">{tipo.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}