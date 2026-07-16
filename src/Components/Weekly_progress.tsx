import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type Tipo_actividad from '../models/Tipo_actividad'
import type Actividad from '../models/Actividad'
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts'

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

// Tooltip personalizado para la gráfica de barras: muestra el detalle de minutos/horas por actividad del día
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

export default function WeeklyProgress() {
  const navigate = useNavigate()
  const [datosSemana, setDatosSemana] = useState<Record<string, Actividad[]>>({})
  const [catalogoTipos, setCatalogoTipos] = useState<Tipo_actividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarTodaLaLeyenda, setMostrarTodaLaLeyenda] = useState(false)
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
    cargarDatos()
  }, [])

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

  // La leyenda de la gráfica de barras puede tener muchos tipos de actividad definidos;
  // por defecto solo mostramos los primeros para no saturar la vista, y el usuario decide ver el resto.
  const LIMITE_LEYENDA_VISIBLE = 6
  const hayLeyendaOculta = catalogoTipos.length > LIMITE_LEYENDA_VISIBLE
  const tiposLeyendaVisibles = mostrarTodaLaLeyenda ? catalogoTipos : catalogoTipos.slice(0, LIMITE_LEYENDA_VISIBLE)

  if (cargando) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-white text-xl">Cargando progreso...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full flex flex-col">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Progreso semanal
        </h1>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4">

        {/* Botón volver */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-full text-white font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#1a1a1a' }}>
            ← Volver
          </button>
        </div>

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
              <Tooltip content={<TooltipBarras />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
              {catalogoTipos.map(tipo => (
                <Bar key={tipo.id_tipo} dataKey={tipo.nombre_tipo}
                  stackId="a"
                  fill={tipo.codigo_color ?? '#888'}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-2">
            {tiposLeyendaVisibles.map(tipo => (
              <span key={tipo.id_tipo} className="flex items-center gap-1 text-xs"
                style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span className="w-3 h-3 rounded-sm inline-block"
                  style={{ backgroundColor: tipo.codigo_color ?? '#888' }} />
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