import { useState, useEffect } from 'react';
import type Perfil from '../models/Perfil';
import { useToast } from './essentials/ToastContext';
import DashboardButton from './essentials/Dashboard_button'; // <-- Importamos el componente
import { usePreferences } from '../utils/preferencesContext';

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
  NewspaperIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const { mostrarToast, notificarGamificacion } = useToast();
  const { valores: preferencias } = usePreferences();

  const [modoSimple, setModoSimple] = useState(() => {
    return localStorage.getItem('focus_modo_simple') === 'true';
  });

  const toggleModoSimple = () => {
    const nuevoEstado = !modoSimple;
    setModoSimple(nuevoEstado);
    localStorage.setItem('focus_modo_simple', String(nuevoEstado));
    window.dispatchEvent(new Event('focus-simple-mode-updated'));
  };

  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques');
        if (res.ok) {
          await res.json();
        }
      } catch (error) {
        console.error('Error al cargar enfoques:', error);
      }
    };
    cargarEnfoques();
  }, []);

  const obtenerSaludo = (generoSeleccionado?: string) => {
    if (generoSeleccionado === 'M') return 'Bienvenido';
    if (generoSeleccionado === 'F') return 'Bienvenida';
    return 'Saludos'; 
  };

  useEffect(() => {
    const verificarNuevosReportes = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/reportes/semanas');
        if (!res.ok) return;

        const data = await res.json();
        
        const reportes = Array.isArray(data) ? data : (data.reportes || []);
        const logrosReporte = data.logrosDesbloqueados || [];
        if (logrosReporte.length > 0 || data.resultadoXP) {
          notificarGamificacion(logrosReporte, data.resultadoXP);
        }
        
        if (reportes.length > 0) {
          const ultimoReporte = reportes[reportes.length - 1];
          const fechaInicioReciente = String(ultimoReporte.fecha_inicio);
          const reporteNotificado = localStorage.getItem('ultimo_reporte_visto');

          if (fechaInicioReciente !== reporteNotificado) {
            setTimeout(() => {
              mostrarToast(
                'exito', 
                '¡Nuevo reporte disponible! 📊', 
                `El resumen de tu semana del ${fechaInicioReciente} ya está listo para revisarse.`
              );
            }, 1000);
            localStorage.setItem('ultimo_reporte_visto', fechaInicioReciente);
          }
        }
      } catch (error) {
        console.error("Error al verificar los reportes semanales:", error);
      }
    };

    if (perfilGlobal) {
        verificarNuevosReportes();
    }
  }, [mostrarToast, notificarGamificacion, perfilGlobal]);

  const botones = [
    { titulo: 'Gestiona tus actividades', Icono: ClipboardDocumentListIcon, ruta: '/actividades', colorHex: '#5ecfb8', prefKeys: ['btn_actividades'] },
    { titulo: 'Ver tu progreso semanal', Icono: ChartBarIcon, ruta: '/progreso-semanal', colorHex: '#f97316', prefKeys: ['btn_progreso_semanal'] },
    { titulo: 'Ver tus reportes semanales', Icono: DocumentTextIcon, ruta: '/resumenes-semanales', colorHex: '#3b82f6', prefKeys: ['btn_reportes'] },
    { titulo: 'Mi día ideal', Icono: SparklesIcon, ruta: '/dia-ideal', colorHex: '#fbbf24', prefKeys: ['btn_dia_ideal'] },
    { titulo: 'Progreso General', Icono: ChartPieIcon, ruta: '/mi-progreso', colorHex: '#c084fc', prefKeys: ['btn_progreso_general'] },
    { titulo: 'Novedades', Icono: NewspaperIcon, ruta: '/novedades', colorHex: '#ffb777', prefKeys: ['btn_novedades'] },
    { titulo: 'Preferencias', Icono: AdjustmentsHorizontalIcon, ruta: '/preferencias', colorHex: '#9ca3af', prefKeys: ['btn_preferencias'] },
    { titulo: 'Conoce tu enfoque', Icono: FlagIcon, ruta: '/enfoque-detalle', colorHex: '#f59e0b', prefKeys: ['btn_enfoque'] },
    { titulo: 'Hitos y Logros', Icono: TrophyIcon, ruta: '/recompensas', colorHex: '#fbbf24', prefKeys: ['btn_recompensas'] },
    { titulo: 'Edita tu perfil', Icono: UserCircleIcon, ruta: '/editar-perfil', colorHex: '#d946ef', prefKeys: ['btn_editar_perfil'] },
    { titulo: 'Descarga tu perfil', Icono: ArrowDownTrayIcon, ruta: '/descargar', colorHex: '#b8f0a0', prefKeys: ['btn_descargar_perfil'] },
    { titulo: 'Configurar PIN', Icono: LockClosedIcon, ruta: '/configurar-pin', colorHex: '#6b7280', prefKeys: ['btn_configurar_pin'] },
    { titulo: 'Nivel de Perfil', Icono: FireIcon, ruta: '/nivel-perfil', colorHex: '#c084fc', prefKeys: ['btn_nivel_perfil'] },
  ];

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
          {botones
            .filter((btn) => !modoSimple || btn.prefKeys.length === 0
              || btn.prefKeys.every((key) => preferencias[key] !== false))
            .map((btn) => (
            <DashboardButton
              key={btn.ruta}
              titulo={btn.titulo}
              Icono={btn.Icono}
              ruta={btn.ruta}
              colorHex={btn.colorHex}
            />
          ))}
        </div>

      </div>
    </div>
  );
}