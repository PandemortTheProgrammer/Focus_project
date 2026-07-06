import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'
import type Actividad from '../models/Actividad'
import type Tipo_actividad from '../models/Tipo_actividad'
import type Perfil from '../models/Perfil'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function ActivitiesEdit({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const { id } = useParams() // obtiene el ID de la URL

  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [tag, setTag] = useState('')
  const [hora, setHora] = useState('')
  const [duracion, setDuracion] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(true)
   const nickname = perfilGlobal?.nickname || 'Desconocido'
  const focus = perfilGlobal?.id_focus || '--'

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
      <div className="w-full h-screen flex items-center justify-center"
        style={{ backgroundColor: '#4a5e5e' }}>
        <p className="text-white text-xl">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos */}
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-52 h-52 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#f97316', top: '30%', left: '38%', transform: 'translateX(-50%)' }} />
      <div className="absolute w-60 h-60 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <img src={FocusLogo} alt="Focus Logo" className="h-10 object-contain" />
        <h1 className="text-4xl font-bold"
          style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Editar actividad
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#1a7a6e' }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{nickname}</p>
            <p className="text-white opacity-50 text-xs">Enfoque: {focus}</p>
          </div>
        </div>
      </div>

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