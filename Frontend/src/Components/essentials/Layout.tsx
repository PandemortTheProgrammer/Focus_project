// frontend/src/components/Layout.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FocusLogo from '../../assets/Images/Focus_v2_logo.png';
import type Perfil from '../../models/Perfil';
import type Enfoque from '../../models/Enfoque';
import { obtenerUrlIcono } from '../../utils/icons';
import {
  ArrowDownTrayIcon,
  ArrowLeftOnRectangleIcon,
  LockClosedIcon,
  UserCircleIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';

interface EnfoqueApiRow {
  id_enfoque?: number;
  Id_enfoque?: number;
  nombre_enfoque?: string;
  nombre_enf?: string;
  descripcion_enfoque?: string;
  descrip_enf?: string;
}

interface LayoutProps {
  children: React.ReactNode; 
  perfilGlobal?: Perfil | null;
}

export default function Layout({ children, perfilGlobal }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const esOnboarding = searchParams.get('onboarding') === 'true';

  const rutasSinHeader = [
    '/',                 
    '/crear-perfil',     
    '/subir-perfil'      
  ];
  
  const mostrarHeader = 
    !rutasSinHeader.includes(location.pathname) && 
    !(location.pathname === '/seleccionar-enfoque' && esOnboarding);
    
  const [enfoques, setEnfoques] = useState<Enfoque[]>([]);
  
  // NUEVO ESTADO: Progreso de Nivel global
  const [progresoXP, setProgresoXP] = useState<any>(null);

  const nickname = perfilGlobal?.nickname || 'Desconocido';
  const urlIcono = obtenerUrlIcono(perfilGlobal?.id_icono);

  const focusName = perfilGlobal?.id_focus
    ? enfoques.find((enfoque) => enfoque.id_enfoque === perfilGlobal.id_focus)?.nombre_enfoque ??
      '--'
    : '--';

  useEffect(() => {
    const cargarDatosHeader = async () => {
      try {
        const [resEnfoques, resXP] = await Promise.all([
          fetch('http://localhost:3000/api/perfil/enfoques'),
          fetch('http://localhost:3000/api/xp/progreso') // Cargamos la XP globalmente
        ]);

        if (resEnfoques.ok) {
          const data = await resEnfoques.json() as EnfoqueApiRow[];
          setEnfoques(data.map((item) => ({
            id_enfoque: Number(item.id_enfoque ?? item.Id_enfoque ?? 0),
            nombre_enfoque: String(item.nombre_enfoque ?? item.nombre_enf ?? ''),
            descripcion_enfoque: String(item.descripcion_enfoque ?? item.descrip_enf ?? '')
          })));
        }

        if (resXP.ok) {
          setProgresoXP(await resXP.json());
        }

      } catch (error: unknown) {
        console.error('Error al cargar datos en Layout:', error);
      }
    };
    const actualizarXP = async () => {
      try {
        const resXP = await fetch('http://localhost:3000/api/xp/progreso');
        if (resXP.ok) setProgresoXP(await resXP.json());
      } catch (error: unknown) {
        console.error('Error al actualizar el progreso de XP:', error);
      }
    };

    cargarDatosHeader();
    window.addEventListener('focus-xp-updated', actualizarXP);
    return () => window.removeEventListener('focus-xp-updated', actualizarXP);
  }, [location.pathname]); // Refrescar al cambiar de ruta para siempre tener la XP al día

  const blobsDecorativos = [
    { id: 'blob-1', color: '#b8f0a0', className: 'decorative-orb decorative-orb--slow', style: { top: '-2rem', left: '2rem', width: '16rem', height: '16rem' } },
    { id: 'blob-2', color: '#5ecfb8', className: 'decorative-orb decorative-orb--fast decorative-orb--delay-1', style: { top: '-1rem', right: '3rem', width: '14rem', height: '14rem' } },
    { id: 'blob-3', color: '#f97316', className: 'decorative-orb decorative-orb--slow decorative-orb--delay-2', style: { top: '30%', left: '38%', width: '13rem', height: '13rem', transform: 'translateX(-50%)' } },
    { id: 'blob-4', color: '#d946ef', className: 'decorative-orb decorative-orb--fast', style: { bottom: '0rem', left: '1rem', width: '15rem', height: '15rem' } },
    { id: 'blob-5', color: '#86efac', className: 'decorative-orb decorative-orb--slow decorative-orb--delay-1', style: { bottom: '2rem', right: '8rem', width: '8rem', height: '8rem' } }
  ];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: '#4a5e5e' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blobsDecorativos.map((blob) => (
          <div key={blob.id} className={blob.className} style={{ backgroundColor: blob.color, ...blob.style }} />
        ))}
      </div>

      {mostrarHeader && (
        <div className="relative z-50 flex items-center justify-between px-8 py-4 shadow-md" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <img 
            src={FocusLogo} 
            alt="Focus Logo" 
            className="h-10 object-contain cursor-pointer transition hover:scale-105" 
            onClick={() => navigate('/dashboard')} 
          />

          {/* CONTENEDOR DERECHO: NIVEL + PERFIL */}
          <div className="flex items-center gap-4">
            
            {/* NUEVO: INDICADOR DE NIVEL COMPACTO */}
            <div 
              className="flex flex-col items-center justify-center bg-black/40 border border-purple-500/30 rounded-xl px-3 py-1 shadow-inner cursor-pointer hover:bg-black/60 hover:border-purple-500/60 transition" 
              onClick={() => navigate('/nivel-perfil')}
              title="Ver detalles de nivel"
            >
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none mb-0.5">
                  niv
              </span>
              <span className="text-xl font-black text-purple-400 leading-none drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]">
                  {progresoXP?.nivel || 1}
              </span>
            </div>

            {/* Menú Desplegable del Perfil (Intacto) */}
            <div className="relative">
              <div 
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="flex items-center gap-4 cursor-pointer p-2 rounded-2xl transition hover:bg-black/20"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#1a7a6e' }}>
                  {urlIcono ? (
                    <img src={urlIcono} alt={nickname} className="w-full h-full object-cover" />
                  ) : (
                    nickname.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left flex flex-col justify-center">
                  <p className="text-white font-semibold text-sm leading-tight">{nickname}</p>
                  <p className="text-white opacity-60 text-xs leading-tight">Enfoque: {focusName}</p>
                </div>
                <span className={`text-white opacity-50 text-xs ml-1 transition-transform duration-300 ${menuAbierto ? 'rotate-180' : 'rotate-0'}`}>
                  ▼
                </span>
              </div>

              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50" style={{ backgroundColor: '#1a1a1a' }}>
                  <button onClick={() => { setMenuAbierto(false); navigate('/editar-perfil'); }} className="w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3">
                    <UserCircleIcon className="w-5 h-5 text-[#d946ef]" /> Editar Perfil
                  </button>
                  <button onClick={() => { setMenuAbierto(false); navigate('/descargar'); }} className="w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3">
                    <ArrowDownTrayIcon className="w-5 h-5 text-[#b8f0a0]" /> Descargar Perfil
                  </button>
                  <button onClick={() => { setMenuAbierto(false); navigate('/configurar-pin'); }} className="w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3">
                    <LockClosedIcon className="w-5 h-5 text-[#6b7280]" /> Configurar PIN
                  </button>
                  <button onClick={() => { setMenuAbierto(false); navigate('/novedades'); }} className="w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3">
                    <NewspaperIcon className="w-5 h-5 text-[#5ecfb8]" /> Novedades
                  </button>
                  <button onClick={() => { setMenuAbierto(false); navigate('/'); }} className="w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3">
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 text-zinc-400" /> Salir del Perfil
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        {children}
      </div>

    </div>
  );
}