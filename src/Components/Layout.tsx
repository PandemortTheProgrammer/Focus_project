// frontend/src/components/Layout.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FocusLogo from '../assets/Images/Focus_logo.png';
import type Perfil from '../models/Perfil';
import type Enfoque from '../models/Enfoque';

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
    '/subir-perfil',     // Carga
    '/editar-perfil'     // Edición
  ];

  // Si la ruta actual NO está en el arreglo, mostramos el header
  const mostrarHeader = !rutasSinHeader.includes(location.pathname);

  const [enfoques, setEnfoques] = useState<Enfoque[]>([]);
  const nickname = perfilGlobal?.nickname || 'Desconocido';

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

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: '#4a5e5e' }}>

      {/* 2. CÍRCULOS DECORATIVOS GLOBALES 
          Nota: Agregamos 'fixed' y 'pointer-events-none' para que no se muevan al hacer scroll 
          ni bloqueen los clics de los botones que están debajo */}
      <div className="absolute w-64 h-64 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-52 h-52 rounded-full blur-2xl opacity-80"
        style={{ backgroundColor: '#f97316', top: '30%', left: '38%', transform: 'translateX(-50%)' }} />
      <div className="absolute w-60 h-60 rounded-full blur-2xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: '#1a7a6e' }}>
              {nickname.charAt(0).toUpperCase()}
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