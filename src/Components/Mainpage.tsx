import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'

export default function Mainpage() {
  const navigate = useNavigate()
  
  // Estados para controlar lo que ve el usuario
  const [tienePerfil, setTienePerfil] = useState(false)
  const [nicknameGuardado, setNicknameGuardado] = useState('') // Nuevo estado para el nombre
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    const revisarPerfilLocal = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil')
        
        if (res.ok) {
          const data = await res.json()
          setTienePerfil(true)
          setNicknameGuardado(data.nickname) // Extraemos el nickname de la BD
        } else {
          setTienePerfil(false)
        }
      } catch (error) {
        console.error("Error al conectar con la BD local:", error)
        setTienePerfil(false)
      } finally {
        setVerificando(false)
      }
    }

    revisarPerfilLocal()
  }, [])

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-center px-4 py-8">

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-8 sm:mb-10">
        <img src={FocusLogo} alt="Focus Logo" className="w-40 sm:w-56 md:w-64 object-contain" />
      </div>

      {/* Botones */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
        
        {verificando ? (
          // Estado de carga
          <div className="flex justify-center mb-4">
            <p className="text-white opacity-60 animate-pulse font-medium">Verificando base de datos...</p>
          </div>
        ) : tienePerfil ? (
          // Acceso Rápido con bienvenida personalizada
          <div className="flex flex-col items-center w-full mb-2">
            <p 
              className="text-2xl mb-4 text-center animate-fade-in-down" 
              style={{ fontFamily: 'cursive', color: '#f5e6c8' }}
            >
              ¡Hola de nuevo, {nicknameGuardado}! 👋
            </p>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 sm:py-4 rounded-full text-[#1a1a1a] text-base sm:text-xl font-bold transition duration-200 hover:opacity-90 hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: '#5ecfb8' }}>
              Continuar al Dashboard
            </button>
            
            {/* Divisor visual sutil */}
            <div className="flex items-center gap-4 mt-6 mb-2 w-full opacity-50">
              <div className="flex-1 h-px bg-zinc-500"></div>
              <span className="text-white text-xs uppercase tracking-wider">o también</span>
              <div className="flex-1 h-px bg-zinc-500"></div>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => navigate('/crear-perfil')}
          className="w-full py-3 sm:py-4 rounded-full text-white text-base sm:text-xl font-semibold transition duration-200 hover:opacity-80 hover:scale-105 hover:shadow-lg border border-zinc-700/50"
          style={{ backgroundColor: tienePerfil ? 'rgba(26,26,26,0.6)' : '#1a1a1a' }}>
          Crear un nuevo perfil
        </button>
        
        <button
          onClick={() => navigate('/subir-perfil')}
          className="w-full py-3 sm:py-4 rounded-full text-white text-base sm:text-xl font-semibold transition duration-200 hover:opacity-80 hover:scale-105 hover:shadow-lg border border-zinc-700/50"
          style={{ backgroundColor: tienePerfil ? 'rgba(26,26,26,0.6)' : '#1a1a1a' }}>
          Cargar un perfil
        </button>
        
      </div>
    </div>
  )
}