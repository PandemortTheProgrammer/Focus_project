import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type Tipo_actividad from '../models/Tipo_actividad'
import type Actividad from '../models/Actividad'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'

// Colores por tipo de actividad
const coloresTipo: Record<string, string> = {
  "Estudio":                  '#1a7a6e',
  "Dormir":                   '#3b82f6',
  "Ejercicio":                '#d946ef',
  "Lectura":                  '#f97316',
  "Trabajo":                  '#eab308',
  "Deporte":                  '#22c55e',
  "Series o Películas":       '#e11d48',
  "Música":                   '#8b5cf6',
  "Redes sociales":           '#64748b',
}

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

export default function WeeklyProgress() {
  const navigate = useNavigate()
  const [datosSemana, setDatosSemana] = useState<Record<string, Actividad[]>>({})
  const [catalogoTipos, setCatalogoTipos] = useState<Tipo_actividad[]>([])
  const [cargando, setCargando] = useState(true)
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
    return { name: tipo.nombre_tipo, value: total }
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

  if (cargando) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-white text-xl">Cargando progreso...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
        <h1 className="text-5xl font-bold" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Progreso semanal
        </h1>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col gap-4 px-8 py-4 overflow-y-auto flex-1">

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
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: 'white' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              {catalogoTipos.map(tipo => (
                <Bar key={tipo.id_tipo} dataKey={tipo.nombre_tipo}
                  stackId="a"
                  fill={coloresTipo[tipo.nombre_tipo] ?? '#888'}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-2">
            {catalogoTipos.map(tipo => (
              <span key={tipo.id_tipo} className="flex items-center gap-1 text-xs"
                style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span className="w-3 h-3 rounded-sm inline-block"
                  style={{ backgroundColor: coloresTipo[tipo.nombre_tipo] ?? '#888' }} />
                {tipo.nombre_tipo}
              </span>
            ))}
          </div>
        </div>

        {/* Dona + barras de recurrencia */}
        <div className="grid grid-cols-2 gap-4 pb-4">

          {/* Gráfica de dona */}
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <p className="text-white opacity-60 text-sm mb-2">Distribución por tipo</p>
            {datosDona.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={datosDona} dataKey="value" cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65}>
                    {datosDona.map((entry, index) => (
                      <Cell key={index} fill={coloresTipo[entry.name] ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                       contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: 'white' }}
                    />
                </PieChart>
              </ResponsiveContainer>
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
                        style={{ width: `${porcentaje}%`, backgroundColor: coloresTipo[tipo.nombre_tipo] ?? '#888' }} />
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