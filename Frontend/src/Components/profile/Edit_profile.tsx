import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Perfil from '../../models/Perfil'
import IconPicker from '../essentials/IconPicker'
import { useToast } from '../essentials/ToastContext'
import { LightBulbIcon } from '@heroicons/react/24/outline' // Agregamos el ícono para el modal

interface EditProfileProps {
  perfilGlobal: Perfil;
  setPerfilGlobal: (perfil: Perfil) => void;
}

export default function EditProfile({ perfilGlobal, setPerfilGlobal }: EditProfileProps) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [nickname, setNickname] = useState(perfilGlobal?.nickname || '')
  const [ageRank, setAgeRank] = useState(perfilGlobal?.age_rank || '')
  const [genero, setGenero] = useState(perfilGlobal?.genero || '')
  const [idIcono, setIdIcono] = useState<number>(Number(perfilGlobal?.id_icono ?? 1))
  
  // NUEVO: Estado para controlar el modal flotante
  const [mostrarModalEnfoque, setMostrarModalEnfoque] = useState(false)

  const handleSave = async () => {
    if (!nickname || !ageRank || !genero) {
      mostrarToast('advertencia', 'Datos incompletos', 'Por favor, completa todos los campos.')
      return
    }

    const perfilActualizado = new Perfil(
      perfilGlobal?.id_perfil ?? 1,
      nickname,
      ageRank,
      perfilGlobal?.id_focus ?? 7, 
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

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        mostrarToast('exito', '¡Perfil actualizado!', data.mensaje || 'Tus cambios se han guardado correctamente.')
        setPerfilGlobal(perfilActualizado)

        // Evaluación del logro Evolución
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
                }, index * 1500 + 1000)
              })
            }
          }
        } catch (eventoError) {
          console.error('Error al evaluar el logro de edición:', eventoError)
        }

        // EN LUGAR DE REDIRIGIR AL DASHBOARD, ABRIMOS EL MODAL
        setMostrarModalEnfoque(true)
        
      } else {
        mostrarToast('error', 'No se guardaron los cambios', data.error || 'Hubo un problema al guardar tu perfil.')
      }
    } catch (error: unknown) {
      console.error(error)
      mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.')
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">
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

          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 border border-zinc-600"
              style={{ backgroundColor: '#1a1a1a' }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-full text-[#1a1a1a] text-lg font-bold shadow-lg transition hover:scale-105"
              style={{ backgroundColor: '#5ecfb8' }}>
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE DECISIÓN SOBRE EL ENFOQUE */}
      {/* ========================================================= */}
      {mostrarModalEnfoque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div 
            className="w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-zinc-700/50 flex flex-col items-center text-center"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="w-14 h-14 bg-[#5ecfb8]/10 rounded-full flex items-center justify-center mb-4">
              <LightBulbIcon className="w-7 h-7 text-[#5ecfb8]" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">¿Actualizar enfoque?</h2>
            
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Tus datos han sido guardados. ¿Deseas mantener tu enfoque actual o elegir un nuevo camino para tus métricas?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 rounded-full text-white font-semibold transition hover:bg-zinc-800 border border-zinc-600"
                style={{ backgroundColor: 'transparent' }}
              >
                Conservar
              </button>

              <button
                onClick={() => navigate('/seleccionar-enfoque')}
                className="flex-1 py-3 rounded-full text-[#1a1a1a] font-bold transition hover:opacity-90"
                style={{ backgroundColor: '#5ecfb8' }}
              >
                Cambiar enfoque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}