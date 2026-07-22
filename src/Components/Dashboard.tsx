import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type Perfil from '../models/Perfil'
import { useToast } from './ToastContext'

// Importamos los íconos de HeroIcons 
import { 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  ArrowDownTrayIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  // MANTENIDO: Tu lógica original de carga
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

  // MANTENIDO: Tu lógica de saludo
  const obtenerSaludo = (generoSeleccionado?: string) => {
    if (generoSeleccionado === 'M') return 'Bienvenido';
    if (generoSeleccionado === 'F') return 'Bienvenida';
    return 'Saludos'; // O tu saludo neutro por defecto
  };

  // --- EFECTO DE NOTIFICACIÓN DE REPORTES SEMANALES ---
  useEffect(() => {
    const verificarNuevosReportes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/reportes/semanas')
        if (!res.ok) return

        const reportes = await res.json()
        
        // Si hay al menos un reporte generado
        if (reportes.length > 0) {
          // Tomamos el último reporte de la lista (el más reciente)
          const ultimoReporte = reportes[reportes.length - 1]
          const fechaInicioReciente = String(ultimoReporte.fecha_inicio)

          // Leemos la memoria del navegador
          const reporteNotificado = localStorage.getItem('ultimo_reporte_visto')

          // Si el más reciente NO es el que tenemos guardado, ¡es nuevo!
          if (reportes.length > 0 && fechaInicioReciente !== reporteNotificado) {
            
            // Retrasamos el Toast 1 segundo para que la animación de entrada 
            // del dashboard termine primero y se vea más elegante
            setTimeout(() => {
              mostrarToast(
                'exito', 
                '¡Nuevo reporte disponible! 📊', 
                `El resumen de tu semana del ${fechaInicioReciente} ya está listo para revisarse.`
              )
            }, 1000)

            // Guardamos esta fecha para que no vuelva a saltar hasta el próximo lunes
            localStorage.setItem('ultimo_reporte_visto', fechaInicioReciente)
          }
        }
      } catch (error) {
        console.error("Error al verificar los reportes semanales:", error)
      }
    }

    // Solo ejecutamos la verificación si el usuario ya tiene un perfil cargado
    if (perfilGlobal) {
        verificarNuevosReportes()
    }
  }, [mostrarToast, perfilGlobal])

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col">

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-start flex-1 pt-16 px-4 pb-8">

        {/* Título */}
        <h1 className="text-4xl font-bold text-center mb-10 mt-2" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          {obtenerSaludo(perfilGlobal?.genero)}, {perfilGlobal?.nickname || "Invitado"}; ¿Qué deseas hacer ahora?
        </h1>

        {/* Tarjetas */}
        <div className="flex flex-wrap justify-center gap-6">

          {/* Tarjeta 1: Actividades */}
          <div
            onClick={() => navigate('/actividades')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <ClipboardDocumentListIcon className="w-12 h-12 text-[#5ecfb8] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Gestiona tus actividades</p>
          </div>

          {/* Tarjeta 2: Progreso Semanal */}
          <div
            onClick={() => navigate('/progreso-semanal')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <ChartBarIcon className="w-12 h-12 text-[#f97316] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Ver tu progreso semanal</p>
          </div>

          {/* Tarjeta 3: Reportes Semanales */}
          <div
            onClick={() => navigate('/resumenes-semanales')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <DocumentTextIcon className="w-12 h-12 text-[#3b82f6] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Ver tus reportes semanales</p>
          </div>

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
            onClick={() => navigate('/Download')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            <ArrowDownTrayIcon className="w-12 h-12 text-[#b8f0a0] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Descarga tu perfil</p>
          </div>

        {/* Tarjeta 6: Recompensas */}
          <div
            onClick={() => navigate('/recompensas')}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition duration-200 hover:bg-zinc-700 hover:scale-105 shadow-lg group"
            style={{ backgroundColor: '#2a2a2a' }}>
            {/* Usamos un color dorado/amarillo para que resalte como un premio */}
            <TrophyIcon className="w-12 h-12 text-[#fbbf24] transition group-hover:text-white" />
            <p className="text-white text-sm font-semibold text-center">Mis recompensas</p>
          </div>
        </div>
      </div>
    </div>
  )
}