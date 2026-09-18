import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type Tipo_actividad from '../models/Tipo_actividad'
import type Actividad from '../models/Actividad'
import { useToast } from './ToastContext' // 1. Importamos el sistema de notificaciones

const formatearFecha = (fecha?: string | Date | null) => {
  if (!fecha) return { dia: '—', mes: '', anio: '' }

  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : new Date(fecha)
  if (Number.isNaN(fechaObj.getTime())) return { dia: '—', mes: '', anio: '' }

  const dia = fechaObj.getDate()
  const mes = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(fechaObj).replace('.', '')
  const anio = fechaObj.getFullYear()

  return { dia, mes: mes.toLowerCase(), anio }
}

export default function ActivitiesHistory() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast() // 2. Extraemos la función global

  const [historial, setHistorial] = useState<Actividad[]>([])
  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resHistorial, resTipos] = await Promise.all([
          fetch('http://localhost:3000/api/actividades/historial'),
          fetch('http://localhost:3000/api/actividades/tipos-actividad')
        ])

        if (resHistorial.ok && resTipos.ok) {
          setHistorial(await resHistorial.json())
          setTipos(await resTipos.json())
        }
      } catch (error) {
        console.error('Error al cargar el historial de actividades:', error)
      } finally {
        setCargando(false)
      }
    }

    // 3. Función silenciosa para evaluar el logro al visitar el historial
    const evaluarVisitaHistorial = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/recompensas/evaluar-evento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventoEspecial: 'VISITA_HISTORIAL' })
        })

        if (res.ok) {
          const data = await res.json()
          if (data.logrosDesbloqueados && data.logrosDesbloqueados.length > 0) {
            data.logrosDesbloqueados.forEach((logro: any, index: number) => {
              setTimeout(() => {
                // Se utilizan los 5 parámetros para que el ícono se procese correctamente
                mostrarToast('logro', logro.nombre_recompensa, logro.descripcion, '', logro)
              }, index * 1500)
            })
          }
        }
      } catch (error) {
        console.error('Error evaluando el logro por visita al historial:', error)
      }
    }

    cargarDatos()
    evaluarVisitaHistorial() // Ejecutamos la evaluación en segundo plano
  }, [mostrarToast]) // Añadimos mostrarToast como dependencia

  return (
    <div className="relative w-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 mb-4">
        <button onClick={() => navigate('/actividades')} className="px-6 py-2 rounded-full bg-zinc-900 text-white">
          ← Volver
        </button>
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Historial semanal
        </h1>
        {/* Espaciador para mantener el título centrado, tal como en Actividades */}
        <div style={{ width: '148px' }} />
      </div>

      <p className="text-white opacity-50 text-sm text-center -mt-2 mb-2">
        Actividades archivadas (más de 24 horas desde su registro). Este historial es solo de consulta.
      </p>

      <div className="relative z-10 flex flex-col gap-4 px-8 py-4">
        {cargando ? (
          <p className="text-white text-center opacity-60 mt-10">Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p className="text-white text-center opacity-60 mt-10">
            Aún no hay actividades archivadas (más de 24 horas de antigüedad).
          </p>
        ) : (
          historial.map((actividad) => {
            const tipoEncontrado = tipos.find((t) => Number(t.id_tipo) === Number(actividad.id_tipo))
            const nombreTipo = tipoEncontrado?.nombre_tipo ?? 'Actividad'
            const colorTipo = tipoEncontrado?.codigo_color ?? '#888'
            const fecha = formatearFecha(actividad.fecha)

            return (
              <div
                key={actividad.id_actividad}
                className="flex items-center justify-between px-6 py-4 rounded-2xl opacity-90"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center leading-[0.9] text-center gap-[2px]">
                      <span className="text-[10px] lowercase text-zinc-300">{fecha.mes}</span>
                      <span className="text-[18px] font-bold text-white">{fecha.dia}</span>
                      <span className="text-[9px] text-zinc-400">{fecha.anio}</span>
                    </div>
                    <div className="w-3 h-12 rounded-full" style={{ backgroundColor: colorTipo }} />
                  </div>

                  {/* Candado visual: todo el historial está consolidado (solo lectura) */}
                  <div
                    className="flex items-center justify-center p-1.5 rounded-full bg-zinc-800/60"
                    title="Actividad consolidada. Forma parte del historial semanal y no puede modificarse.">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-white font-bold text-lg">{nombreTipo}</p>
                    <p className="text-white opacity-60 text-sm">{actividad.descripcion_actividad}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-white text-sm">
                  <div className="text-center">
                    <p className="opacity-50">Inicio</p>
                    <p className="font-semibold">{actividad.hora_inicio}</p>
                  </div>
                  <div className="text-center">
                    <p className="opacity-50">Duración</p>
                    <p className="font-semibold">{actividad.duracion_minutos} min</p>
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