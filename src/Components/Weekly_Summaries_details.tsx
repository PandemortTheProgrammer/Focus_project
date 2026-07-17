import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type TipoResumen = {
  id_tipo: number
  nombre_tipo: string
  horas: number
  color: string
  resumen: string
  mensaje: string
}

type ActividadDetalle = {
  id_actividad: number
  id_tipo: number
  nombre_tipo: string
  peso: number
  fecha: string
  hora_inicio: string
  durac_min: number
  desc_activ: string
}

type SemanaResumen = {
  numero_semana: number
  fecha_inicio: string
  fecha_fin: string
  total_horas: number
  total_actividades: number
  descripcion_general: string
  actividades: ActividadDetalle[]
  tipos: TipoResumen[]
}

const formatearFecha = (fecha: string): string => {
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function WeeklySummaryDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [semanas, setSemanas] = useState<SemanaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarResumenes = async () => {
      try {
        // Se actualizó el endpoint a la nueva API de reportes
        const res = await fetch('http://localhost:3000/api/reportes/semanas')
        if (!res.ok) {
          throw new Error('No se pudo cargar el resumen semanal')
        }
        const data = await res.json()
        setSemanas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    cargarResumenes()
  }, [])

  const semanaSeleccionada = useMemo(() => {
    const numero = Number(id)
    return semanas.find((semana) => semana.numero_semana === numero) ?? null
  }, [id, semanas])

  return (
    <div className="relative min-h-screen overflow-auto flex flex-col px-6 py-6">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate('/resumenes-semanales')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            ← Volver al historial
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            Cargando detalles de la semana...
          </div>
        ) : error ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            {error}
          </div>
        ) : !semanaSeleccionada ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            No se encontró la semana seleccionada. Vuelve al historial para elegir otra.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">
                Semana de {formatearFecha(semanaSeleccionada.fecha_inicio)} a {formatearFecha(semanaSeleccionada.fecha_fin)}
              </p>
              <h2 className="text-4xl font-bold text-white mt-2" style={{ fontFamily: 'cursive' }}>
                Semana {semanaSeleccionada.numero_semana}
              </h2>
              <p className="text-sm text-white opacity-75 mt-3 leading-relaxed">
                {semanaSeleccionada.descripcion_general}
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white opacity-60 text-xs">Horas totales</p>
                  <p className="text-white font-semibold text-xl">{semanaSeleccionada.total_horas.toFixed(1)}h</p>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white opacity-60 text-xs">Actividades totales</p>
                  <p className="text-white font-semibold text-xl">{semanaSeleccionada.total_actividades}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <h3 className="text-xl font-semibold text-white">Detalle por tipo de actividad</h3>
              <p className="text-sm text-white opacity-70 mt-2">
                Se muestran únicamente los tipos de actividad que realizaste en esta semana.
              </p>
              <div className="mt-5 grid gap-4">
                {semanaSeleccionada.tipos.map((tipo) => (
                  <div key={tipo.id_tipo} className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tipo.color }} />
                        <span className="text-white font-semibold text-lg">{tipo.nombre_tipo}</span>
                      </div>
                      <span className="text-white opacity-70 text-sm">{tipo.horas.toFixed(1)}h</span>
                    </div>
                    <p className="text-white opacity-70 text-sm mt-4">{tipo.resumen}</p>
                    <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
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