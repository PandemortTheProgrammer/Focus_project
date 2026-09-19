import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts'

type TipoResumen = {
  id_tipo: number
  nombre_tipo: string
  horas: number
  color: string
  porcentaje_semana: number
  num_actividades: number
  promedio_sesion_min: number
  dias_activos: number
  tendencia: 'subio' | 'bajo' | 'igual' | 'nuevo'
  variacion_horas: number
  resumen: string
  mensaje: string
  consejo: string
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

const obtenerNombreDia = (fecha: string): string => {
  const nombres = ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb']
  return nombres[new Date(fecha + 'T12:00:00').getDay()]
}

const tendenciaInfo: Record<TipoResumen['tendencia'], { icono: string; texto: string; color: string }> = {
  subio: { icono: '▲', texto: 'Subió', color: '#f2a65a' },
  bajo: { icono: '▼', texto: 'Bajó', color: '#5ecfb8' },
  igual: { icono: '■', texto: 'Estable', color: 'rgba(255,255,255,0.6)' },
  nuevo: { icono: '★', texto: 'Nuevo', color: '#8fb8f5' }
}

// Tooltip personalizado para la gráfica de barras
interface BarraTooltipPayloadItem {
  dataKey: string
  value: number
  color?: string
}
interface BarraTooltipProps {
  active?: boolean
  payload?: BarraTooltipPayloadItem[]
  label?: string
}
const TooltipBarras = ({ active, payload, label }: BarraTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null
  const items = payload.filter(item => item.value > 0)
  if (items.length === 0) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-white text-xs font-semibold mb-1">{label}</p>
      <div className="flex flex-col gap-0.5">
        {items.map(item => (
          <div key={item.dataKey} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <span
              className="w-2 h-2 rounded-sm inline-block"
              style={{ backgroundColor: item.color ?? '#888' }}
            />
            <span>{item.dataKey}:</span>
            <span className="font-semibold">{item.value} min ({(item.value / 60).toFixed(1)}h)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WeeklySummaryDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [semanas, setSemanas] = useState<SemanaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarTodaLaLeyenda, setMostrarTodaLaLeyenda] = useState(false)

  useEffect(() => {
    const cargarResumenes = async () => {
      try {
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

  // Transformación de datos para Recharts basados en la semana histórica
  const graficasData = useMemo(() => {
    if (!semanaSeleccionada) return { barras: [], dona: [] }

    // 1. Datos para la Dona
    const dona = semanaSeleccionada.tipos.map(t => ({
      name: t.nombre_tipo,
      value: t.horas * 60, // Mantenemos minutos para consistencia visual
      color: t.color
    })).filter(d => d.value > 0)

    // 2. Datos para las Barras (Reconstruimos los 7 días de la semana)
    const diasArray: string[] = []
    const fechaActual = new Date(semanaSeleccionada.fecha_inicio + 'T12:00:00')
    for (let i = 0; i < 7; i++) {
      diasArray.push(fechaActual.toISOString().split('T')[0])
      fechaActual.setDate(fechaActual.getDate() + 1)
    }

    const barras = diasArray.map(fecha => {
      const actividadesDelDia = semanaSeleccionada.actividades.filter(a => a.fecha === fecha)
      const entrada: Record<string, number | string> = { dia: obtenerNombreDia(fecha) }
      
      semanaSeleccionada.tipos.forEach(tipo => {
        const minutos = actividadesDelDia
          .filter(a => a.id_tipo === tipo.id_tipo)
          .reduce((sum, a) => sum + a.durac_min, 0)
        entrada[tipo.nombre_tipo] = minutos
      })
      return entrada
    })

    return { barras, dona }
  }, [semanaSeleccionada])

  // Lógica de leyenda visual
  const LIMITE_LEYENDA_VISIBLE = 6
  const hayLeyendaOculta = semanaSeleccionada ? semanaSeleccionada.tipos.length > LIMITE_LEYENDA_VISIBLE : false
  const tiposLeyendaVisibles = semanaSeleccionada 
    ? (mostrarTodaLaLeyenda ? semanaSeleccionada.tipos : semanaSeleccionada.tipos.slice(0, LIMITE_LEYENDA_VISIBLE)) 
    : []

  return (
    <div className="relative min-h-screen overflow-auto flex flex-col px-6 py-6">
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="mb-4">
          <button
            onClick={() => navigate('/resumenes-semanales')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80 border border-zinc-700/50"
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
          <div className="space-y-5 w-full">
            
            {/* Encabezado del resumen */}
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

            {/* SECCIÓN DE GRÁFICAS ESTÁTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Gráfica de barras */}
              <div className="p-5 rounded-3xl" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <p className="text-white opacity-60 text-sm mb-4">Minutos por día (Semana {semanaSeleccionada.numero_semana})</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={graficasData.barras}>
                    <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipBarras />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                    {semanaSeleccionada.tipos.map(tipo => (
                      <Bar key={tipo.id_tipo} dataKey={tipo.nombre_tipo}
                        stackId="a"
                        fill={tipo.color ?? '#888'}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {tiposLeyendaVisibles.map(tipo => (
                    <span key={tipo.id_tipo} className="flex items-center gap-1 text-xs"
                      style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <span className="w-3 h-3 rounded-sm inline-block"
                        style={{ backgroundColor: tipo.color ?? '#888' }} />
                      {tipo.nombre_tipo}
                    </span>
                  ))}
                  {hayLeyendaOculta && (
                    <button
                      type="button"
                      onClick={() => setMostrarTodaLaLeyenda(prev => !prev)}
                      className="text-xs font-semibold underline-offset-2 hover:underline transition"
                      style={{ color: '#5ecfb8' }}
                    >
                      {mostrarTodaLaLeyenda ? 'Ver menos' : `Ver todas (${semanaSeleccionada.tipos.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Gráfica de dona */}
              <div className="p-5 rounded-3xl flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <p className="text-white opacity-60 text-sm mb-2">Distribución de la semana</p>
                {graficasData.dona.length > 0 ? (
                  <div className="w-full flex-1 min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={graficasData.dona} dataKey="value" cx="50%" cy="50%"
                          innerRadius="55%" outerRadius="85%">
                          {graficasData.dona.map((entry, index) => (
                            <Cell key={index} fill={entry.color ?? '#888'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-white opacity-40 text-sm text-center mt-8">Sin datos para graficar</p>
                )}
              </div>
            </div>

            {/* Análisis detallado de los tipos */}
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
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ color: tendenciaInfo[tipo.tendencia].color, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        >
                          {tendenciaInfo[tipo.tendencia].icono} {tendenciaInfo[tipo.tendencia].texto}
                        </span>
                        <span className="text-white opacity-70 text-sm">{tipo.horas.toFixed(1)}h</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="text-xs text-white opacity-60">
                        <span className="font-semibold text-white opacity-90">{tipo.porcentaje_semana}%</span> del tiempo
                      </div>
                      <div className="text-xs text-white opacity-60">
                        <span className="font-semibold text-white opacity-90">{tipo.num_actividades}</span> sesión{tipo.num_actividades === 1 ? '' : 'es'}
                      </div>
                      <div className="text-xs text-white opacity-60">
                        <span className="font-semibold text-white opacity-90">{tipo.dias_activos}</span> día{tipo.dias_activos === 1 ? '' : 's'} activos
                      </div>
                      <div className="text-xs text-white opacity-60">
                        <span className="font-semibold text-white opacity-90">{tipo.promedio_sesion_min}</span> min/sesión en promedio
                      </div>
                    </div>

                    <p className="text-white opacity-70 text-sm mt-4">{tipo.resumen}</p>
                    <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <p className="text-sm font-medium text-[#f5e6c8]">{tipo.mensaje}</p>
                    </div>
                    <div className="mt-3 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xs uppercase tracking-wide text-white opacity-50 mb-1">Consejo</p>
                      <p className="text-sm font-medium text-white opacity-85">{tipo.consejo}</p>
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