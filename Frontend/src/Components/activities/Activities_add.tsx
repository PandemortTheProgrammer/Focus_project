import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type Tipo_actividad from '../../models/Tipo_actividad'
import { useToast } from '../essentials/ToastContext'
import { BoltIcon, BookmarkIcon } from '@heroicons/react/24/outline'

// Reutilizamos la interfaz (puedes importarla si la exportaste en Activities_templates)
export interface Plantilla {
  id_plantilla: number;
  id_tipo: number;
  titulo_plantilla: string;
  desc_activ_default: string | null;
  durac_min_default: number | null;
  nombre_categoria: string;
  color_categoria: string;
}

export default function ActivitiesAdd() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mostrarToast } = useToast() 

  const [tipos, setTipos] = useState<Tipo_actividad[]>([])
  const [tag, setTag] = useState(0)
  const [hora, setHora] = useState('')
  const [duracion, setDuracion] = useState(0)
  const [descripcion, setDescripcion] = useState('')

  // NUEVOS ESTADOS PARA PLANTILLAS
  const [plantillasRapidas, setPlantillasRapidas] = useState<Plantilla[]>([])
  const [guardarComoPlantilla, setGuardarComoPlantilla] = useState(false)
  const [tituloPlantilla, setTituloPlantilla] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resTipos, resPlantillas] = await Promise.all([
          fetch('http://localhost:3000/api/actividades/tipos-actividad'),
          fetch('http://localhost:3000/api/plantillas')
        ])
        if (resTipos.ok) setTipos(await resTipos.json())
        if (resPlantillas.ok) setPlantillasRapidas(await resPlantillas.json())
      } catch (error) {
        console.error('Error al cargar catálogos:', error)
      }
    }
    cargarDatos()
  }, [])

  // Efecto Interceptor: Aplica la plantilla si venimos de la pantalla de plantillas
  useEffect(() => {
    if (location.state?.plantillaAutofill) {
      aplicarPlantilla(location.state.plantillaAutofill)
    }
  }, [location.state])

  const aplicarPlantilla = (p: Plantilla) => {
    setTag(p.id_tipo)
    setDescripcion(p.desc_activ_default || '')
    if (p.durac_min_default) setDuracion(p.durac_min_default)
    mostrarToast('exito', 'Plantilla aplicada', `Configuración "${p.titulo_plantilla}" lista.`)
  }

  const ajustarDuracion = (minutos: number) => {
    setDuracion(prev => Math.max(0, prev + minutos))
  }

  const formatearDuracion = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  // Modificamos handleSave para aceptar el flujo continuo
  const handleSave = async (registrarOtra = false) => {
    if (!tag || !hora || duracion === 0) {
      mostrarToast('advertencia', 'Datos incompletos', 'Por favor completa todos los campos (incluyendo el tiempo).')
      return
    }

    setGuardando(true)
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

      const data = await res.json()

      if (res.ok) {
        // Lógica de Plantilla en Segundo Plano
        if (guardarComoPlantilla && tituloPlantilla.trim()) {
          await fetch('http://localhost:3000/api/plantillas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_tipo: tag,
              titulo_plantilla: tituloPlantilla.trim(),
              desc_activ_default: descripcion.trim() || null,
              durac_min_default: duracion
            })
          }).catch(err => console.error("Error guardando plantilla silenciosa", err))
        }

        mostrarToast('exito', '¡Actividad Registrada!', data.mensaje || 'Tu actividad se ha guardado correctamente.')

        if (data.logrosDesbloqueados && data.logrosDesbloqueados.length > 0) {
          data.logrosDesbloqueados.forEach((logroNuevo: any, index: number) => {
            setTimeout(() => {
              mostrarToast('logro', '', '', '', logroNuevo)
            }, index * 1500 + 1000) 
          })
        }

        if (registrarOtra) {
          // Limpiamos solo duración y descripción para permitir un registro en ráfaga ágil
          setDuracion(0)
          setDescripcion('')
          setGuardarComoPlantilla(false)
          setTituloPlantilla('')
        } else {
          navigate('/actividades')
        }

      } else {
        mostrarToast('error', 'No se pudo guardar', data.error || data.mensaje || 'Hubo un problema al guardar en Express.')
      }
    } catch (error) {
      console.error('Error:', error)
      mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">
        <h1 className="mt-3 sm:mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          Agregar actividad
      </h1>
      
      {/* Carrusel de Moldes Rápidos - Se ubica de forma natural encima del formulario */}
      {plantillasRapidas.length > 0 && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 mt-6 animate-fade-in">
          <p className="text-white text-xs uppercase tracking-wider font-bold mb-3 px-2 opacity-70">Relleno rápido</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {plantillasRapidas.map(p => (
              <button
                key={p.id_plantilla}
                onClick={() => aplicarPlantilla(p)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700/50 hover:border-[#5ecfb8]/50 text-white transition-all whitespace-nowrap group"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <BoltIcon className="w-4 h-4 text-[#5ecfb8] group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">{p.titulo_plantilla}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido principal: La estructura de Flexbox se mantiene idéntica */}
        <div className="relative z-10 flex flex-row flex-wrap gap-6 px-4 sm:px-8 py-4 sm:py-6 w-full max-w-5xl mx-auto items-start">
        
        {/* Columna izquierda: Intacta */}
        <div className="flex flex-col gap-4 flex-[1_1_28rem] min-w-0">
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
            <div className="flex flex-wrap items-center gap-2">
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

        {/* Columna derecha: Integra la creación de moldes */}
        <div className="flex flex-col gap-4 flex-[1_1_28rem] min-w-0">

          <p className="text-white text-sm px-2 opacity-70">Descripción de la actividad</p>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la actividad que realizaste..."
            className="w-full h-40 px-5 py-4 rounded-2xl text-white text-lg outline-none resize-none border border-zinc-700/50"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          {/* CHECKBOX: GUARDAR COMO PLANTILLA */}
          <div className="mt-1 px-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="guardarPlantilla"
                checked={guardarComoPlantilla}
                onChange={(e) => setGuardarComoPlantilla(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-600 text-[#5ecfb8] focus:ring-[#5ecfb8] focus:ring-offset-0 bg-[#1a1a1a] cursor-pointer"
              />
              <label htmlFor="guardarPlantilla" className="text-sm text-zinc-300 cursor-pointer select-none flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-[#5ecfb8]" />
                Guardar esta configuración como plantilla
              </label>
            </div>
            
            {guardarComoPlantilla && (
              <div className="animate-fade-in-down">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Nombre de la plantilla (ej. Sesión de estudio)"
                  value={tituloPlantilla}
                  onChange={(e) => setTituloPlantilla(e.target.value)}
                  className="w-full px-5 py-3 rounded-full text-white text-sm outline-none border border-zinc-700/50 focus:border-[#5ecfb8] transition-colors"
                  style={{ backgroundColor: '#1a1a1a' }}
                />
              </div>
            )}
          </div>

          {/* BOTONERA ACTUALIZADA */}
          <div className="flex flex-wrap gap-3 justify-end mt-2">
            <button
              onClick={() => navigate('/actividades')}
              className="px-6 py-3 rounded-full text-white text-base font-semibold transition hover:opacity-80 border border-zinc-600"
              style={{ backgroundColor: '#1a1a1a' }}>
              Cancelar
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={guardando}
              className="px-6 py-3 rounded-full text-[#5ecfb8] text-base font-bold transition hover:opacity-80 border border-[#5ecfb8]/30 hover:bg-[#5ecfb8]/10 disabled:opacity-50"
              style={{ backgroundColor: '#1a1a1a' }}>
              Guardar y seguir registrando
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={guardando}
              className="px-8 py-3 rounded-full text-[#1a1a1a] text-base sm:text-lg font-bold shadow-lg transition hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: '#5ecfb8' }}>
              {guardando ? 'Guardando...' : 'Registrar y terminar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}