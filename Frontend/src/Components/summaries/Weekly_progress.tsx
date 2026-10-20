import { useState, useEffect } from 'react'
import type Tipo_actividad from '../../models/Tipo_actividad'
import type Actividad from '../../models/Actividad'
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts'
import { useToast } from '../essentials/ToastContext' // 1. Importamos el contexto de notificaciones
import PageHeader from '../essentials/Page-head'

// Genera los últimos 7 días como strings "YYYY-MM-DD"
const obtenerUltimosSieteDias = (): string[] => {
  const dias = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dias.push(d.toISOString().split('T')[0])
  }
  return dias
}

// Convierte "YYYY-MM-DD" a "Lun", "Mar", etc.
const obtenerNombreDia = (fecha: string): string => {
  const nombres = ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb']
  return nombres[new Date(fecha + 'T12:00:00').getDay()]
}

const formatearDuracion = (minutosTotales: number): string => {
  const horas = Math.floor(minutosTotales / 60)
  const minutos = minutosTotales % 60
  return [
    horas > 0 ? `${horas} h` : '',
    minutos > 0 ? `${minutos} min` : ''
  ].filter(Boolean).join(' ') || '0 min'
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
  const item = payload.find(entry => entry.value > 0)
  if (!item) return null

  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-white text-xs font-semibold mb-1">{label}</p>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span
          className="w-2 h-2 rounded-sm inline-block"
          style={{ backgroundColor: item.color ?? '#888' }}
        />
        <span>{item.dataKey}:</span>
        <span className="font-semibold">{item.value} min ({formatearDuracion(item.value)})</span>
      </div>
    </div>
  )
}

export default function WeeklyProgress() {
  const { notificarGamificacion } = useToast()

  const [datosSemana, setDatosSemana] = useState<Record<string, Actividad[]>>({})
  const [catalogoTipos, setCatalogoTipos] = useState<Tipo_actividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarTodaLaLeyenda, setMostrarTodaLaLeyenda] = useState(false)
  const [tipoActividadHover, setTipoActividadHover] = useState<string | null>(null)
  const [tipoActividadFijado, setTipoActividadFijado] = useState<string | null>(null)
  const tipoActividadActivo = tipoActividadHover ?? tipoActividadFijado

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resSemana, resTipos] = await Promise.all([
          fetch('http://localhost:3000/api/actividades/semana'),
          fetch('http://localhost:3000/api/actividades/tipos-actividad')
        ])
        if (resSemana.ok && resTipos.ok) {
          setDatosSemana(await resSemana.json())
          setCatalogoTipos(await resTipos.json())
        }
      } catch (error) {
        console.error('Error al cargar progreso semanal:', error)
      } finally {
        setCargando(false)
      }
    }

    // 3. Función silenciosa para evaluar el logro de "Gestor" al visitar la vista
    const evaluarVisita = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/recompensas/evaluar-evento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventoEspecial: 'VISITA_PROGRESO' })
        })
        if (res.ok) {
          const data = await res.json()
          notificarGamificacion(data.logrosDesbloqueados ?? [], data.resultadoXP)
        }
      } catch (error) {
        console.error('Error evaluando el logro por visita:', error)
      }
    }

    cargarDatos()
    evaluarVisita() // Ejecutamos la evaluación en segundo plano
  }, [notificarGamificacion])

  // Construye los datos para la gráfica de barras
  const datosBarras = obtenerUltimosSieteDias().map(fecha => {
    const actividades = datosSemana[fecha] || []
    const entrada: Record<string, number | string> = { dia: obtenerNombreDia(fecha) }
    catalogoTipos.forEach(tipo => {
      const minutos = actividades
        .filter(a => a.id_tipo === tipo.id_tipo)
        .reduce((sum: number, a: Actividad) => sum + a.duracion_minutos, 0)
      entrada[tipo.nombre_tipo] = minutos
    })
    return entrada
  })

  const minutosSemanaPorTipo = new Map(
    catalogoTipos.map(tipo => [
      tipo.nombre_tipo,
      datosBarras.reduce((total, dia) => total + Number(dia[tipo.nombre_tipo] ?? 0), 0)
    ])
  )

  // Construye los datos para la gráfica de dona
  const datosDona = catalogoTipos.map(tipo => {
    const total = Object.values(datosSemana)
      .flat()
      .filter((a: Actividad) => a.id_tipo === tipo.id_tipo)
      .reduce((sum: number, a: Actividad) => sum + a.duracion_minutos, 0)
    return { name: tipo.nombre_tipo, value: total, color: tipo.codigo_color ?? '#888' }
  }).filter(d => d.value > 0)

  // Calcula tarjetas resumen
  const todasActividades = Object.values(datosSemana).flat()
  const totalMinutos = todasActividades.reduce((sum: number, a: Actividad) => sum + a.duracion_minutos, 0)
  const totalHoras = (totalMinutos / 60).toFixed(1)
  const totalActividades = todasActividades.length

  const diaMaximo = obtenerUltimosSieteDias().reduce((max, fecha) => {
    const mins = (datosSemana[fecha] || []).reduce((s: number, a: Actividad) => s + a.duracion_minutos, 0)
    const maxMins = (datosSemana[max] || []).reduce((s: number, a: Actividad) => s + a.duracion_minutos, 0)
    return mins > maxMins ? fecha : max
  }, obtenerUltimosSieteDias()[0])

  // Lógica de leyenda visual
  const LIMITE_LEYENDA_VISIBLE = 6
  const hayLeyendaOculta = catalogoTipos.length > LIMITE_LEYENDA_VISIBLE
  const tiposLeyendaVisibles = mostrarTodaLaLeyenda ? catalogoTipos : catalogoTipos.slice(0, LIMITE_LEYENDA_VISIBLE)

  if (cargando) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Cargando progreso...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full flex flex-col">
      <PageHeader titulo="Progreso semanal" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4">

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-50 text-xs mb-1">Total horas</p>
            <p className="text-white text-3xl font-bold">{totalHoras}h</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-50 text-xs mb-1">Actividades</p>
            <p className="text-white text-3xl font-bold">{totalActividades}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-50 text-xs mb-1">Día más activo</p>
            <p className="text-white text-3xl font-bold">
              {totalActividades > 0 ? obtenerNombreDia(diaMaximo) : '--'}
            </p>
          </div>
        </div>

        {/* Gráfica de barras */}
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <p className="text-white opacity-60 text-sm mb-3">Minutos por día</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datosBarras}>
              <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip shared={false} content={<TooltipBarras />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
              {catalogoTipos.map(tipo => (
                <Bar key={tipo.id_tipo} dataKey={tipo.nombre_tipo}
                  stackId="a"
                  fill={tipo.codigo_color ?? '#888'}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={tipoActividadActivo === null || tipoActividadActivo === tipo.nombre_tipo ? 1 : 0.16}
                  onMouseEnter={() => setTipoActividadHover(tipo.nombre_tipo)}
                  onMouseLeave={() => setTipoActividadHover(null)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-2">
            {tiposLeyendaVisibles.map(tipo => (
              <span
                key={tipo.id_tipo}
                className="relative inline-flex"
                style={{
                  color: tipoActividadActivo === null || tipoActividadActivo === tipo.nombre_tipo
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.3)',
                  filter: tipoActividadActivo !== null && tipoActividadActivo !== tipo.nombre_tipo
                    ? 'grayscale(1)'
                    : undefined,
                  opacity: tipoActividadActivo !== null && tipoActividadActivo !== tipo.nombre_tipo ? 0.55 : 1
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs transition-colors duration-150 cursor-pointer"
                  aria-pressed={tipoActividadFijado === tipo.nombre_tipo}
                  title={tipoActividadFijado === tipo.nombre_tipo ? 'Haz clic para quitar el resaltado' : 'Haz clic para fijar este tipo de actividad'}
                  onMouseEnter={() => setTipoActividadHover(tipo.nombre_tipo)}
                  onMouseLeave={() => setTipoActividadHover(null)}
                  onFocus={() => setTipoActividadHover(tipo.nombre_tipo)}
                  onBlur={() => setTipoActividadHover(null)}
                  onClick={() => setTipoActividadFijado(actual =>
                    actual === tipo.nombre_tipo ? null : tipo.nombre_tipo
                  )}
                >
                  <span className="w-3 h-3 rounded-sm inline-block"
                    style={{ backgroundColor: tipo.codigo_color ?? '#888' }} />
                  {tipo.nombre_tipo}
                  {(minutosSemanaPorTipo.get(tipo.nombre_tipo) ?? 0) > 0 && (
                    <span
                      aria-label="Tiene actividad en la gráfica"
                      title="Este tipo tiene actividad en la gráfica"
                      className="ml-0.5 font-bold text-[#5ecfb8]"
                    >
                      !
                    </span>
                  )}
                </button>
                {tipoActividadActivo === tipo.nombre_tipo && (
                  <div
                    role="status"
                    className="absolute left-0 top-full z-20 mt-2 inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs shadow-lg"
                    style={{
                      backgroundColor: 'rgba(20,20,20,0.96)',
                      border: `1px solid ${tipo.codigo_color ?? '#888'}`,
                      color: 'rgba(255,255,255,0.85)',
                      filter: 'none',
                      opacity: 1,
                      pointerEvents: 'none'
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: tipo.codigo_color ?? '#888' }}
                    />
                    <span className="font-semibold">{tipo.nombre_tipo}</span>
                    <span className="text-zinc-300">
                      {minutosSemanaPorTipo.get(tipo.nombre_tipo) ?? 0} min
                      {' '}({formatearDuracion(minutosSemanaPorTipo.get(tipo.nombre_tipo) ?? 0)})
                    </span>
                  </div>
                )}
              </span>
            ))}
            {hayLeyendaOculta && (
              <button
                type="button"
                onClick={() => setMostrarTodaLaLeyenda(prev => !prev)}
                className="text-xs font-semibold underline-offset-2 hover:underline transition"
                style={{ color: '#5ecfb8' }}
              >
                {mostrarTodaLaLeyenda ? 'Ver menos' : `Ver todas (${catalogoTipos.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Dona + barras de recurrencia */}
        <div className="grid grid-cols-2 gap-4 pb-4">

          {/* Gráfica de dona */}
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-60 text-sm mb-2">Distribución por tipo</p>
            {datosDona.length > 0 ? (
              <div className="w-full aspect-square max-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosDona} dataKey="value" cx="50%" cy="50%"
                      innerRadius="55%" outerRadius="85%">
                      {datosDona.map((entry, index) => (
                        <Cell key={index} fill={entry.color ?? '#888'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white opacity-40 text-sm text-center mt-8">Sin datos esta semana</p>
            )}
          </div>

          {/* Barras de recurrencia */}
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-60 text-sm mb-3">Recurrencia por tipo</p>
            <div className="flex flex-col gap-3">
              {catalogoTipos.map(tipo => {
                const minutos = Object.values(datosSemana)
                  .flat()
                  .filter((a: Actividad) => a.id_tipo === tipo.id_tipo)
                  .reduce((sum: number, a: Actividad) => sum + a.duracion_minutos, 0)
                const porcentaje = totalMinutos > 0 ? Math.round((minutos / totalMinutos) * 100) : 0
                if (minutos === 0) return null
                return (
                  <div key={tipo.id_tipo}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-xs opacity-70">{tipo.nombre_tipo}</span>
                      <span className="text-white text-xs opacity-70">{(minutos / 60).toFixed(1)}h</span>
                    </div>
                    <div className="rounded-full h-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${porcentaje}%`, backgroundColor: tipo.codigo_color ?? '#888' }} />
                    </div>
                  </div>
                )
              })}
              {totalActividades === 0 && (
                <p className="text-white opacity-40 text-sm text-center mt-4">Sin datos esta semana</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}