import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type Actividad from '../models/Actividad'
import type Tipo_actividad from '../models/Tipo_actividad'

export default function ActivitiesEdit() {
  const navigate = useNavigate()
  const { id } = useParams() // obtiene el ID de la URL

  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [tag, setTag] = useState('')
  const [hora, setHora] = useState('')
  const [duracion, setDuracion] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(true)

  // Al abrir la pantalla, carga los tipos Y los datos actuales de la actividad
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resTipos, resActividades] = await Promise.all([
          fetch('http://localhost:3000/api/actividades/tipos-actividad'),
          fetch('http://localhost:3000/api/actividades')
        ])

        if (resTipos.ok && resActividades.ok) {
          const tiposData = await resTipos.json()
          const actividades = await resActividades.json()

          setTipos(tiposData)

          // Busca la actividad con el ID de la URL y precarga sus datos
          const actividad = actividades.find((a: Actividad) => a.id_actividad === parseInt(id!))
          if (actividad) {
            setTag(String(actividad.id_tipo))
            setHora(actividad.hora_inicio)
            setDuracion(actividad.duracion_minutos)
            setDescripcion(actividad.descripcion_actividad)
          } else {
            alert('Esta actividad ya fue archivada (24h) y no puede editarse.')
            navigate('/actividades')
          }
        }

      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [id])

  const ajustarDuracion = (minutos: number) => {
    setDuracion(prev => Math.max(0, prev + minutos))
  }

  const formatearDuracion = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const handleGuardar = async () => {
    if (!tag || !hora || duracion === 0) {
      alert('Por favor completa todos los campos')
      return
    }

    try {
      const res = await fetch(`http://localhost:3000/api/actividades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tipo: parseInt(tag),
          hora_inicio: hora,
          duracion_minutos: duracion,
          descripcion_actividad: descripcion
        })
      })

      if (res.ok) {
        navigate('/actividades')
      } else if (res.status === 403) {
        alert('Esta actividad ya fue archivada (24h) y no puede editarse.')
        navigate('/actividades')
      } else {
        alert('Hubo un problema al actualizar la actividad.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('No se pudo conectar con el servidor.')
    }
  }

  if (cargando) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">

      {/* Contenido */}
      <div className="relative z-10 flex gap-6 px-8 py-8 w-full max-w-4xl mx-auto flex-1 items-center">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-4 flex-1">

          <p className="text-white text-sm px-2 opacity-70">Tipo de actividad</p>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none"
            style={{ backgroundColor: '#1a1a1a' }}>
            <option value="" disabled>Selecciona un tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id_tipo} value={tipo.id_tipo}>
                {tipo.nombre_tipo}
              </option>
            ))}
          </select>

          <p className="text-white text-sm px-2 opacity-70">Hora de inicio</p>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none"
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
              <span className="text-white font-bold text-lg px-2">
                {formatearDuracion(duracion)} hrs
              </span>
              <button onClick={() => ajustarDuracion(10)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: '#1a1a1a' }}>
                +10
              </button>
              <button onClick={() => ajustarDuracion(15)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: '#1a1a1a' }}>
                +15
              </button>
              <button onClick={() => ajustarDuracion(30)}
                className="px-3 py-2 rounded-full text-white text-sm font-bold transition hover:opacity-80"
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
            placeholder="Describe la actividad..."
            className="w-full h-40 px-5 py-4 rounded-2xl text-white text-lg outline-none resize-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          <div className="flex gap-4 justify-end">
            <button
              onClick={handleGuardar}
              className="px-8 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80"
              style={{ backgroundColor: '#1a1a1a' }}>
              Guardar cambios
            </button>
            <button
              onClick={() => navigate('/actividades')}
              className="px-8 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80"
              style={{ backgroundColor: '#1a1a1a' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}