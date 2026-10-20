import { useState, useEffect } from 'react' 
import { useNavigate } from 'react-router-dom'
import type Perfil from '../models/Perfil'
import { useToast } from './essentials/ToastContext'

import { 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  ArrowDownTrayIcon,
  TrophyIcon,
  FlagIcon,
  LockClosedIcon,
  SparklesIcon,
  ChartPieIcon,
  FireIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const { mostrarToast, notificarGamificacion } = useToast()

  const [modoSimple, setModoSimple] = useState(() => {
    return localStorage.getItem('focus_modo_simple') === 'true'
  })

  const toggleModoSimple = () => {
    const nuevoEstado = !modoSimple
    setModoSimple(nuevoEstado)
    localStorage.setItem('focus_modo_simple', String(nuevoEstado))
  }

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

  useEffect(() => {
    const verificarNuevosReportes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/reportes/semanas')
        if (!res.ok) return

        const data = await res.json()
        
        const reportes = Array.isArray(data) ? data : (data.reportes || [])
        const logrosReporte = data.logrosDesbloqueados || []
        if (logrosReporte.length > 0 || data.resultadoXP) {
          notificarGamificacion(logrosReporte, data.resultadoXP)
        }
        
        if (reportes.length > 0) {
          const ultimoReporte = reportes[reportes.length - 1]
          const fechaInicioReciente = String(ultimoReporte.fecha_inicio)
          const reporteNotificado = localStorage.getItem('ultimo_reporte_visto')

          if (fechaInicioReciente !== reporteNotificado) {
            
            setTimeout(() => {
              mostrarToast(
                'exito', 
                '¡Nuevo reporte disponible! 📊', 
                `El resumen de tu semana del ${fechaInicioReciente} ya está listo para revisarse.`
              )
            }, 1000)

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
  }, [mostrarToast, notificarGamificacion, perfilGlobal])

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">

      <div className="relative z-10 flex flex-col items-center justify-start flex-1 pt-16 px-4 pb-8">

        <h1 className="text-4xl font-bold text-center mb-6 mt-2" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          {obtenerSaludo(perfilGlobal?.genero)}, {perfilGlobal?.nickname || "Invitado"}; ¿Qué deseas hacer ahora?
        </h1>

        <div className="w-full max-w-4xl flex justify-end px-6 mb-6">
          <label className="flex items-center cursor-pointer gap-3 group" title="Reduce las funciones de Focus a lo más esencial para una experiencia más simple">
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
              <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ease-in-out ${modoSimple ? 'bg-[#5ecfb8]' : 'bg-zinc-700'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out ${modoSimple ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-5xl">

          {/* Tarjeta 1: Actividades */}
          <div
            onClick={() => navigate('/actividades')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#5ecfb8] hover:scale-105 shadow-lg group">
            <ClipboardDocumentListIcon className="w-12 h-12 text-[#5ecfb8] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Gestiona tus actividades</p>
          </div>

          {/* Tarjeta 2: Progreso Semanal */}
          <div
            onClick={() => navigate('/progreso-semanal')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#f97316] hover:scale-105 shadow-lg group">
            <ChartBarIcon className="w-12 h-12 text-[#f97316] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Ver tu progreso semanal</p>
          </div>

          {/* Tarjeta 3: Reportes Semanales */}
          <div
            onClick={() => navigate('/resumenes-semanales')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#3b82f6] hover:scale-105 shadow-lg group">
            <DocumentTextIcon className="w-12 h-12 text-[#3b82f6] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Ver tus reportes semanales</p>
          </div>

          {/* Tarjeta 4: Día Ideal */}
          <div
            onClick={() => navigate('/dia-ideal')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#fbbf24] hover:scale-105 shadow-lg group">
            <SparklesIcon className="w-12 h-12 text-[#fbbf24] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Mi día ideal</p>
          </div>

          {/* Tarjeta 5: Mi Progreso */}
          <div
            onClick={() => navigate('/mi-progreso')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#c084fc] hover:scale-105 shadow-lg group">
            <ChartPieIcon className="w-12 h-12 text-[#c084fc] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Progreso General</p>
          </div>

          <div
            onClick={() => navigate('/novedades')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#ffb777] hover:scale-105 shadow-lg group">
            <NewspaperIcon className="w-12 h-12 text-[#ffb777] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Novedades</p>
          </div>

          {!modoSimple && (
            <>
              {/* Tarjeta 6: Enfoque Detalle */}
              <div
                onClick={() => navigate('/enfoque-detalle')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#f59e0b] hover:scale-105 shadow-lg group">
                <FlagIcon className="w-12 h-12 text-[#f59e0b] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Conoce tu enfoque</p>
              </div>
              
              {/* Tarjeta 7: Recompensas */}
              <div
                onClick={() => navigate('/recompensas')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#fbbf24] hover:scale-105 shadow-lg group">
                <TrophyIcon className="w-12 h-12 text-[#fbbf24] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Hitos y Logros</p>
              </div>

              {/* Tarjeta 8: Editar Perfil */}
              <div
                onClick={() => navigate('/editar-perfil')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#d946ef] hover:scale-105 shadow-lg group">
                <UserCircleIcon className="w-12 h-12 text-[#d946ef] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Edita tu perfil</p>
              </div>

              {/* Tarjeta 9: Descarga */}
              <div
                onClick={() => navigate('/descargar')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#b8f0a0] hover:scale-105 shadow-lg group">
                <ArrowDownTrayIcon className="w-12 h-12 text-[#b8f0a0] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Descarga tu perfil</p>
              </div>

              {/* Tarjeta 10: Configurar PIN */}
              <div
                onClick={() => navigate('/configurar-pin')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-[#6b7280] hover:scale-105 shadow-lg group">
                <LockClosedIcon className="w-12 h-12 text-[#6b7280] transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Configurar PIN</p>
              </div>

              {/* Tarjeta 11: Nivel de Perfil */}
              <div
                onClick={() => navigate('/nivel-perfil')}
                className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#2a2a2a] hover:bg-purple-400 hover:scale-105 shadow-lg group">
                <FireIcon className="w-12 h-12 text-purple-400 transition group-hover:text-white" />
                <p className="text-white text-sm font-semibold text-center transition group-hover:text-white">Nivel de Perfil</p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}