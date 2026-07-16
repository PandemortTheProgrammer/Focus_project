// frontend/src/components/Layout.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FocusLogo from '../assets/Images/Focus_logo.png';
import type Perfil from '../models/Perfil';
import type Enfoque from '../models/Enfoque';
import { obtenerUrlIcono } from '../utils/icons';

interface LayoutProps {
  children: React.ReactNode; // Aquí se inyectará la pantalla actual (Dashboard, Actividades, etc.)
  perfilGlobal?: Perfil | null;
}

export default function Layout({ children, perfilGlobal }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. EL RADAR: Definimos en qué rutas exactas NO queremos que aparezca el Header
  const rutasSinHeader = [
    '/',                 // MainPage
    '/crear-perfil',     // Creación
    '/subir-perfil'      // Subir perfil
  ];

  // Si la ruta actual NO está en el arreglo, mostramos el header
  const mostrarHeader = !rutasSinHeader.includes(location.pathname);

  const [enfoques, setEnfoques] = useState<Enfoque[]>([]);
  const nickname = perfilGlobal?.nickname || 'Desconocido';
  const urlIcono = obtenerUrlIcono(perfilGlobal?.id_icono);

  const focusName = perfilGlobal?.id_focus
    ? enfoques.find((enfoque) =>
        enfoque.id_enfoque === perfilGlobal.id_focus ||
        // Compatibilidad con el shape que devuelve el backend SQLite
        (enfoque as unknown as Record<string, any>).Id_enfoque === perfilGlobal.id_focus
      )?.nombre_enfoque ??
      (enfoques.find((enfoque) =>
        (enfoque as unknown as Record<string, any>).Id_enfoque === perfilGlobal.id_focus ||
        enfoque.id_enfoque === perfilGlobal.id_focus
      ) as unknown as Record<string, any>)?.nombre_enf ??
      '--'
    : '--';

  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques');
        if (res.ok) {
          const data = await res.json();
          const normalizado = data.map((item: any) => ({
            id_enfoque: item.id_enfoque ?? item.Id_enfoque,
            nombre_enfoque: item.nombre_enfoque ?? item.nombre_enf,
            descripcion_enfoque: item.descripcion_enfoque ?? item.descrip_enf ?? ''
          }));
          setEnfoques(normalizado);
        }
      } catch (error) {
        console.error('Error al cargar enfoques en Layout:', error);
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
            className="h-10 object-contain cursor-pointer" 
            onClick={() => navigate('/dashboard')} // Un buen toque: que el logo lleve al inicio
          />

          {/* Info del usuario centralizada */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#1a7a6e' }}>
              {urlIcono ? (
                <img src={urlIcono} alt={nickname} className="w-full h-full object-cover" />
              ) : (
                nickname.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-sm text-left">{nickname}</p>
              <p className="text-white opacity-60 text-xs">Enfoque: {focusName}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. EL CONTENIDO DE LA PÁGINA */}
      {/* Todo lo que esté en tu componente hijo aparecerá aquí */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        {children}
      </div>

    </div>
  );
}