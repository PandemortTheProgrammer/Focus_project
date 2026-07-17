import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type SemanaResumen = {
  numero_semana: number
  fecha_inicio: string
  fecha_fin: string
  total_horas: number
  total_actividades: number
  descripcion_general: string
}


const formatearFecha = (fecha: string): string => {
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function WeeklySummaries() {
  const [semanas, setSemanas] = useState<SemanaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const cargarResumenes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/actividades/semanas')
        if (!res.ok) {
          throw new Error('No se pudo cargar el histórico semanal')
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

  return (
    <div className="relative min-h-screen overflow-auto flex flex-col px-6 py-6">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            ← Volver al dashboard
          </button>
        </div>

        <div className="rounded-3xl p-6 mb-6" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">Resumen semanal</p>
          <h1 className="text-4xl font-bold text-white mt-4" style={{ fontFamily: 'cursive' }}>
            Historial de semanas con actividades registradas
          </h1>
          <p className="text-sm text-white opacity-70 mt-3 leading-relaxed">
            Cada semana muestra un análisis breve generado automáticamente, horas totales y el conteo de actividades. Solo aparecen las semanas con al menos una actividad registrada.
          </p>
          <div className="mt-4 p-4 rounded-xl border border-zinc-600 flex items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-xl">🕒</span>
            <p className="text-xs text-white opacity-80">
              <strong>Nota:</strong> Los reportes semanales se emiten y guardan automáticamente el <b>primer minuto de cada Lunes</b>. Las actividades de tu semana actual están en progreso y aún no generan un reporte definitivo.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            Cargando resumenes...
          </div>
        ) : error ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            {error}
          </div>
        ) : semanas.length === 0 ? (
          <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            No hay registros de actividades para mostrar resúmenes semanales.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {semanas.map((semana) => (
              <button
                key={semana.numero_semana}
                onClick={() => navigate(`/resumen-semanal/${semana.numero_semana}`)}
                className="text-left rounded-3xl p-6 transition hover:scale-[1.01] hover:opacity-95"
                style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white opacity-60">
                      Semana iniciando {formatearFecha(semana.fecha_inicio)}
                    </p>
                    <h2 className="text-3xl font-semibold text-white mt-2" style={{ fontFamily: 'cursive' }}>
                      Semana {semana.numero_semana}
                    </h2>
                    <p className="text-sm text-white opacity-70 mt-3 leading-relaxed">
                      {semana.descripcion_general}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-white opacity-60 text-xs">Horas</p>
                      <p className="text-white font-semibold text-xl">{semana.total_horas.toFixed(1)}h</p>
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-white opacity-60 text-xs">Actividades</p>
                      <p className="text-white font-semibold text-xl">{semana.total_actividades}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-right text-sm font-semibold text-[#f5e6c8]">
                    Ver detalles →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
