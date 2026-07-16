import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Perfil from '../models/Perfil'
import IconPicker from './IconPicker'

interface EditProfileProps {
  perfilGlobal: Perfil;
  setPerfilGlobal: (perfil: Perfil) => void;
}

export default function EditProfile({ perfilGlobal, setPerfilGlobal }: EditProfileProps) {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(perfilGlobal?.nickname || '')
  const [ageRank, setAgeRank] = useState(perfilGlobal?.age_rank || '')
  const [focus, setFocus] = useState(perfilGlobal?.id_focus ? String(perfilGlobal.id_focus) : '')
  const [genero, setGenero] = useState(perfilGlobal?.genero || '')
  const [idIcono, setIdIcono] = useState(perfilGlobal?.id_icono || '')
  const [enfoquesCatalogo, setEnfoquesCatalogo] = useState<{ Id_enfoque: number, nombre_enf: string }[]>([])

  // Carga los enfoques desde la BD
  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques')
        if (res.ok) {
          setEnfoquesCatalogo(await res.json())
        }
      } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido"
        console.error('Error al cargar enfoques:', mensaje)
      }
    }
    cargarEnfoques()
  }, [])

  const handleSave = async () => {
    if (!nickname || !ageRank || !focus || !genero) {
      alert('Por favor, completa todos los campos.')
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

      if (res.ok) {
        setPerfilGlobal(perfilActualizado)
        navigate('/dashboard')
      } else {
        alert('Hubo un problema al guardar los cambios.')
      }
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido"
      alert(`Error al conectar con el servidor: ${mensaje}`)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">

      {/* Formulario */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1">
        <div className="flex flex-col gap-4 w-72">

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

          <IconPicker nickname={nickname} iconoSeleccionado={idIcono} onSeleccionar={setIdIcono} />

          <div className="flex flex-col gap-1">
            <label className="text-white text-sm px-2">¿Cómo prefieres que te llamemos ahora?</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
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
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
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
              className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
              style={{ backgroundColor: '#2a2a2a' }}>
              <option value="">Selecciona tu nuevo enfoque</option>
              {enfoquesCatalogo.map((enf) => (
                <option key={enf.Id_enfoque} value={enf.Id_enfoque}>
                  {enf.nombre_enf}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-2 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 hover:scale-105"
              style={{ backgroundColor: '#1a1a1a' }}>
              Regresar
            </button>
            <button
              onClick={handleSave}
              className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 hover:scale-105"
              style={{ backgroundColor: '#1a7a6e' }}>
              Guardar cambios
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}