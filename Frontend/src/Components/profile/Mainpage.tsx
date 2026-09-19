import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'
import { useToast } from '../essentials/ToastContext' // Asegúrate de tener la ruta correcta
import { LockClosedIcon } from '@heroicons/react/24/outline'

export default function Mainpage() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  
  // Estados para controlar lo que ve el usuario
  const [tienePerfil, setTienePerfil] = useState(false)
  const [nicknameGuardado, setNicknameGuardado] = useState('')
  const [pinGuardado, setPinGuardado] = useState<string | null>(null) // NUEVO: Guardamos el PIN si existe
  const [verificando, setVerificando] = useState(true)
  
  // Estado para controlar la ventana de advertencia
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false)

  // NUEVOS: Estados para controlar la intercepción del PIN
  const [pidiendoPin, setPidiendoPin] = useState(false)
  const [pinIngresado, setPinIngresado] = useState('')

  useEffect(() => {
    const revisarPerfilLocal = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil')
        
        if (res.ok) {
          const data = await res.json()
          setTienePerfil(true)
          setNicknameGuardado(data.nickname)
          setPinGuardado(data.pin || null) // Rescatamos el PIN si el backend lo envía
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

  // Función que intercepta el clic de "Crear perfil"
  const handleCrearPerfilClick = () => {
    if (tienePerfil) {
      setMostrarAdvertencia(true)
    } else {
      navigate('/crear-perfil')
    }
  }

  // NUEVO: Función que intercepta el clic de "Continuar al Dashboard"
  const manejarContinuar = () => {
    if (pinGuardado) {
      setPidiendoPin(true)
    } else {
      navigate('/dashboard')
    }
  }

  // NUEVO: Función para validar el PIN ingresado
  const validarPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinIngresado === pinGuardado) {
      navigate('/dashboard')
    } else {
      mostrarToast('error', 'PIN incorrecto', 'Inténtalo de nuevo.')
      setPinIngresado('')
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-center px-4 py-8">

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-8 sm:mb-10">
        <img src={FocusLogo} alt="Focus Logo" className="w-40 sm:w-56 md:w-64 object-contain" />
      </div>

      {/* Botones principales */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
        
        {verificando ? (
          <div className="flex justify-center mb-4">
            <p className="text-white opacity-60 animate-pulse font-medium">Verificando base de datos...</p>
          </div>
        ) : tienePerfil ? (
          <div className="flex flex-col items-center w-full mb-2">
            <p 
              className="text-2xl mb-4 text-center animate-fade-in-down" 
              style={{ fontFamily: 'cursive', color: '#f5e6c8' }}
            >
              ¡Hola de nuevo, {nicknameGuardado}! 👋
            </p>
            
            {/* MODIFICACIÓN: Interceptor de PIN vs Botón normal */}
            {!pidiendoPin ? (
              <button
                onClick={manejarContinuar}
                className="w-full py-3 sm:py-4 rounded-full text-[#1a1a1a] text-base sm:text-xl font-bold transition duration-200 hover:opacity-90 hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: '#5ecfb8' }}>
                Continuar al Dashboard
              </button>
            ) : (
              <form onSubmit={validarPin} className="w-full flex flex-col items-center gap-3 animate-fade-in">
                <div className="relative w-full">
                  <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="password" 
                    maxLength={4}
                    autoFocus
                    placeholder="Ingresa tu PIN (4 dígitos)"
                    value={pinIngresado}
                    onChange={(e) => setPinIngresado(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3 pl-12 pr-4 rounded-full bg-zinc-800 text-white text-center tracking-widest border border-zinc-600 focus:outline-none focus:border-[#5ecfb8]"
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => {
                      setPidiendoPin(false)
                      setPinIngresado('')
                    }}
                    className="flex-1 py-2 rounded-full bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition">
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={pinIngresado.length < 4}
                    className="flex-1 py-2 rounded-full bg-[#5ecfb8] text-[#1a1a1a] font-bold hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100">
                    Entrar
                  </button>
                </div>
              </form>
            )}
            
            <div className="flex items-center gap-4 mt-6 mb-2 w-full opacity-50">
              <div className="flex-1 h-px bg-zinc-500"></div>
              <span className="text-white text-xs uppercase tracking-wider">o también</span>
              <div className="flex-1 h-px bg-zinc-500"></div>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleCrearPerfilClick}
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

      {/* ========================================================= */}
      {/* MODAL DE ADVERTENCIA PARA EVITAR PÉRDIDA DE DATOS */}
      {/* ========================================================= */}
      {mostrarAdvertencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div 
            className="w-full max-w-md p-6 rounded-3xl shadow-2xl border-2 border-red-500/30 flex flex-col items-center text-center"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">¡Cuidado, {nicknameGuardado}!</h2>
            
            <p className="text-zinc-300 text-base mb-4 leading-relaxed">
              Ya existe un perfil guardado en este equipo. Si creas uno nuevo ahora, <strong className="text-red-400">todo tu progreso actual, historial y logros desaparecerán para siempre</strong>.
            </p>

            <p className="text-zinc-400 text-sm mb-8 bg-black/40 p-4 rounded-2xl border border-zinc-700/50">
              💡 <strong>Te recomendamos:</strong> Entra primero al Dashboard y descarga un respaldo de tu perfil actual para que puedas conservarlo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setMostrarAdvertencia(false)}
                className="flex-1 py-3 rounded-full text-[#1a1a1a] font-bold transition hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: '#5ecfb8' }}
              >
                Cancelar y regresar
              </button>

              <button
                onClick={async () => {
                  try {
                    await fetch('http://localhost:3000/api/perfil/reset', {
                      method: 'DELETE'
                    });
                    setMostrarAdvertencia(false);
                    navigate('/crear-perfil');
                  } catch (error) {
                    console.error("Error al intentar limpiar la base de datos", error);
                  }
                }}
                className="flex-1 py-3 rounded-full text-red-400 font-semibold transition hover:bg-red-500/20 border border-red-500/30"
                style={{ backgroundColor: 'transparent' }}
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}