import { useState, useEffect } from 'react' // Asegúrate de tener useState aquí
import { useNavigate } from 'react-router-dom'
import type Perfil from '../models/Perfil'
import { useToast } from './essentials/ToastContext'

// Importamos los íconos de HeroIcons 
import { 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  ArrowDownTrayIcon,
  TrophyIcon,
  FlagIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  // --- ESTADO PARA EL MODO SIMPLIFICADO ---
  const [modoSimple, setModoSimple] = useState(() => {
    // Al cargar, revisamos si el usuario ya tenía activo el modo simple
    return localStorage.getItem('focus_modo_simple') === 'true'
  })

  const toggleModoSimple = () => {
    const nuevoEstado = !modoSimple
    setModoSimple(nuevoEstado)
    localStorage.setItem('focus_modo_simple', String(nuevoEstado))
  }

  // Carga de enfoques
  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques')
        if (res.ok) {
          await res.json()
        }
      } catch (error) {
        console.error('Error al cargar enfoques:', error)
      }
    }
    cargarEnfoques()
  }, [])

  const obtenerSaludo = (generoSeleccionado?: string) => {
    if (generoSeleccionado === 'M') return 'Bienvenido';
    if (generoSeleccionado === 'F') return 'Bienvenida';
    return 'Saludos'; 
  };

  // --- EFECTO DE NOTIFICACIÓN DE REPORTES SEMANALES Y LOGROS ---
  useEffect(() => {
    const verificarNuevosReportes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/reportes/semanas')
        if (!res.ok) return

        const data = await res.json()
        
        // Hacemos que sea compatible tanto si el backend devuelve un Array directo 
        // como si devuelve un Objeto con { reportes: [], logrosDesbloqueados: [] }
        const reportes = Array.isArray(data) ? data : (data.reportes || [])
        const logrosReporte = data.logrosDesbloqueados || []
        
        if (reportes.length > 0) {
          const ultimoReporte = reportes[reportes.length - 1]
          const fechaInicioReciente = String(ultimoReporte.fecha_inicio)
          const reporteNotificado = localStorage.getItem('ultimo_reporte_visto')

          // Si es un reporte nuevo que no hemos notificado aún
          if (fechaInicioReciente !== reporteNotificado) {
            
            // 1. Lanzamos el Toast del reporte semanal (Retrasado 1 segundo)
            setTimeout(() => {
              mostrarToast(
                'exito', 
                '¡Nuevo reporte disponible! 📊', 
                `El resumen de tu semana del ${fechaInicioReciente} ya está listo para revisarse.`
              )
            }, 1000)

            // 2. Lanzamos los Toasts de los logros obtenidos por este reporte en cascada
            if (logrosReporte.length > 0) {
              logrosReporte.forEach((logro: any, index: number) => {
                setTimeout(() => {
                  // Respetamos los 5 parámetros para que el ícono (r.Id_icono) se procese perfectamente
                  mostrarToast('logro', logro.nombre_recompensa, logro.descripcion, '', logro)
                }, index * 1500 + 2500) // Se muestran DESPUÉS del toast del reporte
              })
            }

            // Guardamos la fecha para no repetir la animación
            localStorage.setItem('ultimo_reporte_visto', fechaInicioReciente)
          }
        }
      } catch (error) {
        console.error("Error al verificar los reportes semanales:", error)
      }
    }

    if (perfilGlobal) {
        verificarNuevosReportes()
    }
  }, [mostrarToast, perfilGlobal])

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-start flex-1 pt-16 px-4 pb-8">

        {/* Título */}
        <h1 className="text-4xl font-bold text-center mb-6 mt-2" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          {obtenerSaludo(perfilGlobal?.genero)}, {perfilGlobal?.nickname || "Invitado"}; ¿Qué deseas hacer ahora?
        </h1>

        {/* Contenedor del Interruptor Modo Simple */}
        <div className="w-full max-w-4xl flex justify-end px-6 mb-6">
          <label className="flex items-center cursor-pointer gap-3 group">
            <span className="text-zinc-400 text-sm font-medium transition group-hover:text-zinc-300">
              Modo Simplificado
            </span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={modoSimple} 
                onChange={toggleModoSimple} 
              />
              {/* Fondo del interruptor */}
              <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ease-in-out ${modoSimple ? 'bg-[#5ecfb8]' : 'bg-zinc-700'}`}></div>
              {/* Círculo deslizable */}
              <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out ${modoSimple ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>

        {/* Tarjetas */}
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl">

          {/* Tarjeta 1: Actividades (SIEMPRE VISIBLE) */}
          <div
            onClick={() => navigate('/actividades')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <ClipboardDocumentListIcon className="w-12 h-12 text-[#5ecfb8] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Gestiona tus actividades</p>
          </div>

          {/* Tarjeta 2: Progreso Semanal (SIEMPRE VISIBLE) */}
          <div
            onClick={() => navigate('/progreso-semanal')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <ChartBarIcon className="w-12 h-12 text-[#f97316] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Ver tu progreso semanal</p>
          </div>

          {/* Tarjeta 3: Reportes Semanales (SIEMPRE VISIBLE) */}
          <div
            onClick={() => navigate('/resumenes-semanales')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <DocumentTextIcon className="w-12 h-12 text-[#3b82f6] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Ver tus reportes semanales</p>
          </div>

          {/* --- BLOQUE SECUNDARIO: OCULTO SI 'modoSimple' ES TRUE --- */}
          {!modoSimple && (
            <>
              {/* Tarjeta 4: Editar Perfil */}
              <div
                onClick={() => navigate('/editar-perfil')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <UserCircleIcon className="w-12 h-12 text-[#d946ef] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Edita tu perfil</p>
              </div>

              {/* Tarjeta 5: Descarga */}
              <div
                onClick={() => navigate('/descargar')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <ArrowDownTrayIcon className="w-12 h-12 text-[#b8f0a0] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Descarga tu perfil</p>
              </div>

              {/* Tarjeta 6: Enfoque Detalle */}
              <div
                onClick={() => navigate('/enfoque-detalle')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <FlagIcon className="w-12 h-12 text-[#f59e0b] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Conoce tu enfoque</p>
              </div>
              
              {/* Tarjeta 7: Recompensas */}
              <div
                onClick={() => navigate('/recompensas')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <TrophyIcon className="w-12 h-12 text-[#fbbf24] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Logros</p>
              </div>

              {/* Tarjeta 8: Configurar PIN */}
              <div
                onClick={() => navigate('/configurar-pin')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-400 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <LockClosedIcon className="w-12 h-12 text-[#6b7280] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Configurar PIN</p>
              </div>

              {/* Tarjeta 9: Día Ideal */}
              <div
                onClick={() => navigate('/dia-ideal')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-200 hover:scale-105 shadow-lg group"
                style={{ backgroundColor: '#2a2a2a' }}>
                <SparklesIcon className="w-12 h-12 text-[#fbbf24] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center">Mi día ideal</p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}