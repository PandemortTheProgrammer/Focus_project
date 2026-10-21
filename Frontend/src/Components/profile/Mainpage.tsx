import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLogo from '../../assets/Images/Focus_logo.png'
import { useToast } from '../essentials/ToastContext' 
import { LockClosedIcon, LightBulbIcon } from '@heroicons/react/24/outline'

// IMPORTANTE: Ajusta estas rutas según la ubicación de tus helpers
import { obtenerUrlIcono } from '../../utils/icons' 
import { obtenerUrlTarjeta } from '../../utils/tarjetas'

interface PerfilActivo {
  nickname: string;
  id_icono?: number | null;
  id_tarjeta?: number | null;
  nivel?: number;
  pin?: string | null;
  pista_pin?: string | null;
}

export default function Mainpage() {
  const navigate = useNavigate()
  const { mostrarToastPin, cerrarToastPin } = useToast()
  
  // Estados para controlar lo que ve el usuario
  const [tienePerfil, setTienePerfil] = useState(false)
  const [perfilData, setPerfilData] = useState<PerfilActivo | null>(null)
  const [nicknameGuardado, setNicknameGuardado] = useState('')
  const [pinGuardado, setPinGuardado] = useState<string | null>(null)
  const [pistaGuardada, setPistaGuardada] = useState<string | null>(null) 
  const [verificando, setVerificando] = useState(true)
  
  // Estado para controlar la ventana de advertencia
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false)

  // Estados para controlar la intercepción del PIN
  const [pidiendoPin, setPidiendoPin] = useState(false)
  const [pinIngresado, setPinIngresado] = useState('')
  const [intentosFallidos, setIntentosFallidos] = useState(0)

  useEffect(() => {
    const revisarPerfilLocal = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json() as PerfilActivo
          setTienePerfil(true)
          setPerfilData(data)
          setNicknameGuardado(data.nickname)
          setPinGuardado(data.pin || null)
          setPistaGuardada(data.pista_pin || null) 
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

  const handleCrearPerfilClick = () => {
    if (tienePerfil) {
      setMostrarAdvertencia(true)
    } else {
      navigate('/crear-perfil')
    }
  }

  const manejarContinuar = () => {
    if (pinGuardado) {
      setPidiendoPin(true)
      setIntentosFallidos(0) 
    } else {
      navigate('/dashboard')
    }
  }

  const validarPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinIngresado === pinGuardado) {
      setIntentosFallidos(0)
      cerrarToastPin()
      navigate('/dashboard')
    } else {
      const nuevosIntentos = intentosFallidos + 1
      setIntentosFallidos(nuevosIntentos)
      
      if (nuevosIntentos === 3) {
        mostrarToastPin(
          'Demasiados intentos',
          pistaGuardada
            ? 'Hemos revelado tu pista para ayudarte a recordar.'
            : 'Revisa el PIN e inténtalo de nuevo.'
        )
      }
      setPinIngresado('') 
    }
  }

  // Pre-calculamos las URLs visuales de la tarjeta
  const urlFondo = obtenerUrlTarjeta(perfilData?.id_tarjeta);
  const urlIcono = obtenerUrlIcono(perfilData?.id_icono);

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-center px-4 py-8">

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-8 sm:mb-6">
        <img src={FocusLogo} alt="Focus Logo" className="w-40 sm:w-56 md:w-64 object-contain" />
      </div>

      {/* Botones principales y Tarjeta */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
        
        {verificando ? (
          <div className="flex justify-center mb-4">
            <p className="text-white opacity-60 animate-pulse font-medium">Verificando base de datos...</p>
          </div>
        ) : tienePerfil ? (
          <div className="flex flex-col items-center w-full mb-2 animate-fade-in-down">
            
            {/* TARJETA DE PERFIL (Reemplaza al texto plano) */}
            <div className="relative mt-8 mb-4 w-full flex flex-col items-center">
              <div 
                className="relative w-full bg-[#1a1a1a] rounded-3xl p-6 pt-14 flex flex-col items-center shadow-2xl border border-zinc-800/50 overflow-visible transition-all duration-500"
                style={urlFondo ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(26,26,26,0.3) 0%, rgba(20,20,20,0.98) 75%), url("${urlFondo}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {/* Avatar Sobresaliendo */}
                <div className="absolute -top-12 w-24 h-24 rounded-full border-[6px] border-[#24343b] bg-zinc-900 shadow-xl overflow-hidden z-10 flex items-center justify-center">
                  {urlIcono ? (
                    <img src={urlIcono} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>

                {/* Nombre y Nivel */}
                <h2 className="text-2xl font-bold text-white mb-1 z-10 relative drop-shadow-md text-center tracking-wide">
                  {nicknameGuardado}
                </h2>
                <p className="text-[#5ecfb8] text-xs font-black tracking-widest mb-6 z-10 relative uppercase">
                  Nivel {perfilData?.nivel || 1}
                </p>

                {/* Switcher entre Botón "Ingresar" y Formulario PIN */}
                {!pidiendoPin ? (
                  <button
                    onClick={manejarContinuar}
                    className="relative z-10 w-full bg-[#5ecfb8] hover:bg-[#4db8a3] text-zinc-900 font-bold text-lg py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-[#5ecfb8]/20 transform hover:-translate-y-0.5"
                  >
                    Ingresar al perfil
                  </button>
                ) : (
                  <form onSubmit={validarPin} className="w-full flex flex-col items-center gap-3 animate-fade-in relative z-10">
                    <div className="relative w-full">
                      <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input 
                        type="password" 
                        maxLength={4}
                        autoFocus
                        placeholder="Ingresa tu PIN (4 dígitos)"
                        value={pinIngresado}
                        onChange={(e) => setPinIngresado(e.target.value.replace(/\D/g, ''))}
                        className="w-full py-3 pl-12 pr-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm text-white text-center tracking-widest border border-zinc-600 focus:outline-none focus:border-[#5ecfb8] transition-colors shadow-inner"
                      />
                    </div>
                    
                    {/* Pista visual (solo aparece al fallar 3 veces) */}
                    {intentosFallidos >= 3 && pistaGuardada && (
                      <div className="w-full p-3 rounded-xl bg-[#5ecfb8]/10 border border-[#5ecfb8]/30 animate-fade-in flex flex-col gap-1 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-[#5ecfb8]">
                          <LightBulbIcon className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pista de recuperación</span>
                        </div>
                        <p className="text-zinc-300 text-sm italic pl-6 leading-snug">"{pistaGuardada}"</p>
                      </div>
                    )}

                    <div className="flex gap-2 w-full mt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setPidiendoPin(false)
                          setPinIngresado('')
                          setIntentosFallidos(0) 
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors border border-white/5">
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={pinIngresado.length < 4}
                        className="flex-1 py-2.5 rounded-xl bg-[#5ecfb8] text-[#1a1a1a] font-bold hover:bg-[#4db8a3] transition-colors disabled:opacity-50 disabled:hover:bg-[#5ecfb8]">
                        Entrar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2 mb-2 w-full opacity-50">
              <div className="flex-1 h-px bg-zinc-500"></div>
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">o también</span>
              <div className="flex-1 h-px bg-zinc-500"></div>
            </div>
          </div>
        ) : null}

        {/* Botones secundarios (Crear / Cargar Perfil) */}
        <button
          onClick={handleCrearPerfilClick}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition duration-200 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-lg border border-zinc-700/50 backdrop-blur-sm"
          style={{ backgroundColor: tienePerfil ? 'rgba(26,26,26,0.6)' : '#1a1a1a' }}>
          Crear un nuevo perfil
        </button>
        
        <button
          onClick={() => navigate('/subir-perfil')}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition duration-200 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-lg border border-zinc-700/50 backdrop-blur-sm"
          style={{ backgroundColor: tienePerfil ? 'rgba(26,26,26,0.6)' : '#1a1a1a' }}>
          Cargar un perfil
        </button>
        
      </div>

      {/* MODAL DE ADVERTENCIA */}
      {mostrarAdvertencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md p-6 rounded-3xl shadow-2xl border border-red-500/20 flex flex-col items-center text-center"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">¡Cuidado, {nicknameGuardado}!</h2>
            
            <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
              Ya existe un perfil guardado en este equipo. Si creas uno nuevo ahora, <strong className="text-red-400">todo tu progreso actual, historial y logros desaparecerán para siempre</strong>.
            </p>

            <p className="text-zinc-400 text-xs mb-8 bg-black/40 p-4 rounded-xl border border-zinc-800">
              💡 <strong>Te recomendamos:</strong> Entra primero al Dashboard y descarga un respaldo de tu perfil actual para que puedas conservarlo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setMostrarAdvertencia(false)}
                className="flex-1 py-3 rounded-xl text-[#1a1a1a] font-bold transition hover:opacity-90 hover:-translate-y-0.5"
                style={{ backgroundColor: '#5ecfb8' }}
              >
                Cancelar y regresar
              </button>

              <button
                onClick={async () => {
                  try {
                    await fetch('http://localhost:3000/api/perfil/reset', { method: 'DELETE' });
                    setMostrarAdvertencia(false);
                    navigate('/crear-perfil');
                  } catch (error) {
                    console.error("Error al intentar limpiar la base de datos", error);
                  }
                }}
                className="flex-1 py-3 rounded-xl text-red-400 font-bold transition hover:bg-red-500/10 border border-red-500/30"
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