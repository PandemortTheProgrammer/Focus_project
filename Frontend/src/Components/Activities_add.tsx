import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type Tipo_actividad from '../models/Tipo_actividad'
import { useToast } from './ToastContext' // Importado desde la misma carpeta components

export default function ActivitiesAdd() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast() // Extraemos la función global del contexto

  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [tag, setTag] = useState(0)
  const [hora, setHora] = useState('')
  const [duracion, setDuracion] = useState(0)
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/actividades/tipos-actividad')
        if (res.ok) {
          setTipos(await res.json())
        }
      } catch (error) {
        console.error('Error al cargar tipos de actividad:', error)
      }
    }
    cargarTipos()
  }, [])

  const ajustarDuracion = (minutos: number) => {
    setDuracion(prev => Math.max(0, prev + minutos))
  }

  const formatearDuracion = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const handleSave = async () => {
    // 1. Validación de campos vacíos usando el Toast
    if (!tag || !hora || duracion === 0) {
      mostrarToast('advertencia', 'Datos incompletos', 'Por favor completa todos los campos (incluyendo el tiempo).')
      return
    }

    const nuevaActividad = {
      id_tipo: tag,
      hora_inicio: hora,
      duracion_minutos: duracion,
      descripcion_actividad: descripcion
    }

    try {
      const res = await fetch('http://localhost:3000/api/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaActividad)
      })

      // Convertimos la respuesta para poder leer los mensajes del Backend
      const data = await res.json()

      if (res.ok) {
        
        // 1. Mostramos el éxito normal primero
        mostrarToast('exito', '¡Actividad Registrada!', data.mensaje || 'Tu actividad se ha guardado correctamente.')

        // 2. Verificamos si el backend envió el arreglo de logros nuevos
        if (data.logrosDesbloqueados && data.logrosDesbloqueados.length > 0) {
          data.logrosDesbloqueados.forEach((logroNuevo: any, index: number) => {
            // Retrasamos cada logro (1.5 segundos de cascada + 1 segundo inicial)
            setTimeout(() => {
              mostrarToast('logro', '', '', '', logroNuevo)
            }, index * 1500 + 1000) 
          })
        }

        // Navegación instantánea (los Toasts sobrevivirán porque viven en el Layout global)
        navigate('/actividades')

      } else {
        // Mostramos el error exacto que mandó Express
        mostrarToast('error', 'No se pudo guardar', data.error || data.mensaje || 'Hubo un problema al guardar en Express.')
      }
    } catch (error) {
      console.error('Error:', error)
      mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.')
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Agregar actividad
      </h1>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex gap-6 px-8 py-8 w-full max-w-4xl mx-auto flex-1 items-center">
        
        {/* Columna izquierda */}
        <div className="flex flex-col gap-4 flex-1">

          <p className="text-white text-sm px-2 opacity-70">Tipo de actividad</p>
          <select
            value={tag}
            onChange={(e) => setTag(Number(e.target.value))}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer border border-zinc-700/50"
            style={{ backgroundColor: '#1a1a1a' }}>
            <option value="">Selecciona un tipo de actividad</option>
            {tipos.map((tipo) => (
              <option key={tipo.id_tipo} value={tipo.id_tipo}>
                {tipo.nombre_tipo}
              </option>
            ))}
          </select>

          <p className="text-white text-sm px-2 opacity-70">Hora de inicio de la actividad</p>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none border border-zinc-700/50"
            style={{ backgroundColor: '#1a1a1a', colorScheme: 'dark' }}
          />

          <div className="flex flex-col gap-2">
            <p className="text-white text-sm px-2 opacity-70">Tiempo utilizado (minutos)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => ajustarDuracion(-10)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: '#d946ef' }}>
                -10
              </button>
              <button onClick={() => ajustarDuracion(-5)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: '#d946ef' }}>
                -5
              </button>
              <span className="text-[#f5e6c8] font-bold text-xl px-2">
                {formatearDuracion(duracion)} hrs
              </span>
              <button onClick={() => ajustarDuracion(10)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80 border border-zinc-700/50"
                style={{ backgroundColor: '#1a1a1a' }}>
                +10
              </button>
              <button onClick={() => ajustarDuracion(15)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80 border border-zinc-700/50"
                style={{ backgroundColor: '#1a1a1a' }}>
                +15
              </button>
              <button onClick={() => ajustarDuracion(30)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80 border border-zinc-700/50"
                style={{ backgroundColor: '#1a1a1a' }}>
                +30
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4 flex-1">

          <p className="text-white text-sm px-2 opacity-70">Descripción de la actividad</p>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la actividad que realizaste..."
            className="w-full h-40 px-5 py-4 rounded-2xl text-white text-lg outline-none resize-none border border-zinc-700/50"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          <div className="flex gap-4 justify-end mt-4">
            <button
              onClick={() => navigate('/actividades')}
              className="px-8 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 border border-zinc-600"
              style={{ backgroundColor: '#1a1a1a' }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-full text-[#1a1a1a] text-lg font-bold shadow-lg transition hover:scale-105"
              style={{ backgroundColor: '#5ecfb8' }}>
              Registrar actividad
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}