// frontend/src/components/Layout.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FocusLogo from '../assets/Images/Focus_logo.png';
import type Perfil from '../models/Perfil';
import type Enfoque from '../models/Enfoque';
import { obtenerUrlIcono } from '../utils/icons';

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

  // ESTADO PARA EL MENÚ DESPLEGABLE DEL PERFIL
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 1. EL RADAR: Definimos en qué rutas exactas NO queremos que aparezca el Header
  const rutasSinHeader = [
    '/',                 // MainPage
    '/crear-perfil',     // Creación
    '/subir-perfil'      // Subir perfil
  ];

  const mostrarHeader = !rutasSinHeader.includes(location.pathname);

  const [enfoques, setEnfoques] = useState<Enfoque[]>([]);
  const nickname = perfilGlobal?.nickname || 'Desconocido';
  const urlIcono = obtenerUrlIcono(perfilGlobal?.id_icono);

  const focusName = perfilGlobal?.id_focus
    ? enfoques.find((enfoque) => enfoque.id_enfoque === perfilGlobal.id_focus)?.nombre_enfoque ??
      '--'
    : '--';

  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques');
        if (res.ok) {
          const data = await res.json() as EnfoqueApiRow[];
          const normalizado: Enfoque[] = data.map((item) => ({
            id_enfoque: Number(item.id_enfoque ?? item.Id_enfoque ?? 0),
            nombre_enfoque: String(item.nombre_enfoque ?? item.nombre_enf ?? ''),
            descripcion_enfoque: String(item.descripcion_enfoque ?? item.descrip_enf ?? '')
          }));
          setEnfoques(normalizado);
        }
      } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al cargar enfoques en Layout:', mensaje);
      }
    };
    cargarEnfoques();
  }, []);

  const blobsDecorativos = [
    {
      id: 'blob-1',
      color: '#b8f0a0',
      className: 'decorative-orb decorative-orb--slow',
      style: { top: '-2rem', left: '2rem', width: '16rem', height: '16rem' }
    },
    {
      id: 'blob-2',
      color: '#5ecfb8',
      className: 'decorative-orb decorative-orb--fast decorative-orb--delay-1',
      style: { top: '-1rem', right: '3rem', width: '14rem', height: '14rem' }
    },
    {
      id: 'blob-3',
      color: '#f97316',
      className: 'decorative-orb decorative-orb--slow decorative-orb--delay-2',
      style: { top: '30%', left: '38%', width: '13rem', height: '13rem', transform: 'translateX(-50%)' }
    },
    {
      id: 'blob-4',
      color: '#d946ef',
      className: 'decorative-orb decorative-orb--fast',
      style: { bottom: '0rem', left: '1rem', width: '15rem', height: '15rem' }
    },
    {
      id: 'blob-5',
      color: '#86efac',
      className: 'decorative-orb decorative-orb--slow decorative-orb--delay-1',
      style: { bottom: '2rem', right: '8rem', width: '8rem', height: '8rem' }
    }
  ];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: '#4a5e5e' }}>

      {/* 2. CÍRCULOS DECORATIVOS GLOBALES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blobsDecorativos.map((blob) => (
          <div
            key={blob.id}
            className={blob.className}
            style={{ backgroundColor: blob.color, ...blob.style }}
          />
        ))}
      </div>

      {/* 3. EL HEADER CONDICIONAL */}
      {mostrarHeader && (
        <div className="relative z-50 flex items-center justify-between px-8 py-4 shadow-md" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <img 
            src={FocusLogo} 
            alt="Focus Logo" 
            className="h-10 object-contain cursor-pointer transition hover:scale-105" 
            onClick={() => navigate('/dashboard')} 
          />

          {/* CONTENEDOR RELATIVO PARA EL MENÚ DESPLEGABLE */}
          <div className="relative">
            
            {/* Zona clickeable del usuario */}
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
              
              {/* Flecha indicadora que gira cuando se abre */}
              <span className={`text-white opacity-50 text-xs ml-1 transition-transform duration-300 ${menuAbierto ? 'rotate-180' : 'rotate-0'}`}>
                ▼
              </span>
            </div>

            {/* Menú Flotante */}
            {menuAbierto && (
              <div 
                className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50" 
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <button
                  onClick={() => {
                    setMenuAbierto(false); // Cerramos el menú
                    navigate('/'); // Navegamos a MainPage
                  }}
                  className="w-full text-left px-5 py-4 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center gap-3"
                >
                  <span className="text-lg">🚪</span> Salir del Perfil
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. EL CONTENIDO DE LA PÁGINA */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        {children}
      </div>

    </div>
  );
}