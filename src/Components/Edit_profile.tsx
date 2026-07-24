import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Perfil from '../models/Perfil'
import IconPicker from './IconPicker'
import { useToast } from './ToastContext' // Importamos el sistema de notificaciones

interface EnfoqueCatalogoRow {
  Id_enfoque: number;
  nombre_enf: string;
  descrip_enf?: string;
}

interface EditProfileProps {
  perfilGlobal: Perfil;
  setPerfilGlobal: (perfil: Perfil) => void;
}

export default function EditProfile({ perfilGlobal, setPerfilGlobal }: EditProfileProps) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast() // Extraemos la función global

  const [nickname, setNickname] = useState(perfilGlobal?.nickname || '')
  const [ageRank, setAgeRank] = useState(perfilGlobal?.age_rank || '')
  const [focus, setFocus] = useState(perfilGlobal?.id_focus ? String(perfilGlobal.id_focus) : '')
  const [genero, setGenero] = useState(perfilGlobal?.genero || '')
  const [idIcono, setIdIcono] = useState<number>(Number(perfilGlobal?.id_icono ?? 1))
  const [enfoquesCatalogo, setEnfoquesCatalogo] = useState<EnfoqueCatalogoRow[]>([])
  const descripcionSeleccionada = focus
    ? (enfoquesCatalogo.find((enfoque) => enfoque.Id_enfoque === Number(focus))?.descrip_enf ?? '')
    : ''

  // Carga los enfoques desde la BD
  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques')
        if (res.ok) {
          const datos = await res.json() as EnfoqueCatalogoRow[]
          setEnfoquesCatalogo(datos)
        } else {
          mostrarToast('error', 'Error de carga', 'No se pudieron cargar los enfoques disponibles.')
        }
      } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido"
        console.error('Error al cargar enfoques:', mensaje)
        mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.')
      }
    }
    cargarEnfoques()
  }, [mostrarToast])

  const handleSave = async () => {
    // 1. Validación de campos vacíos con Toast de advertencia
    if (!nickname || !ageRank || !focus || !genero) {
      mostrarToast('advertencia', 'Datos incompletos', 'Por favor, completa todos los campos.')
      return
    }

    const perfilActualizado = new Perfil(
      perfilGlobal?.id_perfil ?? 1,
      nickname,
      ageRank,
      parseInt(focus),
      genero,
      idIcono
    )

    try {
      const res = await fetch('http://localhost:3000/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: perfilActualizado.nickname,
          age_rank: perfilActualizado.age_rank,
          genero: perfilActualizado.genero,
          id_focus: perfilActualizado.id_focus,
          id_icono: perfilActualizado.id_icono
        })
      })

      // 2. Extraemos el mensaje de Express
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        mostrarToast('exito', '¡Perfil actualizado!', data.mensaje || 'Tus cambios se han guardado correctamente.')
        setPerfilGlobal(perfilActualizado)

        // --- NUEVA LÓGICA: Evaluación del logro Evolución ---
        try {
          const resEvento = await fetch('http://localhost:3000/api/recompensas/evaluar-evento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventoEspecial: 'EDICION_PERFIL' })
          })

          if (resEvento.ok) {
            const dataEvento = await resEvento.json()
            if (dataEvento.logrosDesbloqueados && dataEvento.logrosDesbloqueados.length > 0) {
              dataEvento.logrosDesbloqueados.forEach((logro: any, index: number) => {
                setTimeout(() => {
                  mostrarToast('logro', logro.nombre_recompensa, logro.descripcion, '', logro)
                }, index * 1500 + 1000) // +1000ms para que aparezca después del toast de éxito
              })
            }
          }
        } catch (eventoError) {
          console.error('Error al evaluar el logro de edición:', eventoError)
        }
        // ----------------------------------------------------

        navigate('/dashboard')
      } else {
        mostrarToast('error', 'No se guardaron los cambios', data.error || 'Hubo un problema al guardar tu perfil.')
      }
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido"
      console.error(mensaje)
      mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.')
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">

      {/* Formulario */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1">
        <div className="flex flex-col gap-4 w-72">

          <IconPicker nickname={nickname} iconoSeleccionado={idIcono} onSeleccionar={setIdIcono} />
          
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm px-2">Cambia tu nickname:</label>
            <input
              type="text"
              placeholder="Nuevo nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
              style={{ backgroundColor: '#2a2a2a' }}
            />
          </div>


          <div className="flex flex-col gap-1">
            <label className="text-white text-sm px-2">¿Cómo prefieres que te llamemos ahora?</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
              style={{ backgroundColor: '#2a2a2a' }}>
              <option value="">Selecciona una opción</option>
              <option value="M">Él (Bienvenido)</option>
              <option value="F">Ella (Bienvenida)</option>
              <option value="O">Neutro (Hola)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white text-sm px-2">Nuevo rango de edad:</label>
            <select
              value={ageRank}
              onChange={(e) => setAgeRank(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
              style={{ backgroundColor: '#2a2a2a' }}>
              <option value="">Cambia tu rango de edad</option>
              <option value="15-17">15-17</option>
              <option value="18-21">18-21</option>
              <option value="22-30">22-30</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white text-sm px-2">Re-enfócate:</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
              style={{ backgroundColor: '#2a2a2a' }}>
              <option value="">Selecciona tu nuevo enfoque</option>
              {enfoquesCatalogo.map((enf) => (
                <option key={enf.Id_enfoque} value={enf.Id_enfoque}>
                  {enf.nombre_enf}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              overflow: 'hidden',
              maxHeight: descripcionSeleccionada ? '120px' : '0px',
              opacity: descripcionSeleccionada ? 1 : 0,
              transition: 'max-height 450ms ease, opacity 400ms ease',
              marginTop: descripcionSeleccionada ? '0' : '0',
            }}
          >
            <p
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: '1.6',
                paddingLeft: '0.75rem',
                paddingRight: '0.25rem',
              }}
            >
              {descripcionSeleccionada}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-2 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 border border-zinc-600"
              style={{ backgroundColor: '#1a1a1a' }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-10 py-3 rounded-full text-[#1a1a1a] text-lg font-bold shadow-lg transition hover:scale-105"
              style={{ backgroundColor: '#5ecfb8' }}>
              Guardar cambios
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}