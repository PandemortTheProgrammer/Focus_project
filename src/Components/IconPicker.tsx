import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Icono from '../models/Icono'
import { iconosDisponibles, obtenerUrlIcono } from '../utils/icons'

interface IconPickerProps {
  nickname: string;
  iconoSeleccionado: number;
  onSeleccionar: (idIcono: number) => void;
  idPerfil?: number; // Lo hacemos opcional y por defecto será 1 para mantener compatibilidad
}

const VELOCIDAD_DESPLAZAMIENTO = 4;

export default function IconPicker({ nickname, iconoSeleccionado, onSeleccionar, idPerfil = 1 }: IconPickerProps) {
  const inicial = (nickname || '?').charAt(0).toUpperCase();
  const carruselRef = useRef<HTMLDivElement>(null);
  const intervaloRef = useRef<number | null>(null);
  
  const [iconosCatalogo, setIconosCatalogo] = useState<Icono[]>([]);
  // NUEVO ESTADO: Guardará un arreglo con los IDs que el usuario ya ganó
  const [idsDesbloqueados, setIdsDesbloqueados] = useState<number[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Ejecutamos ambas peticiones al mismo tiempo para mayor velocidad
        const [resCatalogo, resDesbloqueados] = await Promise.all([
          fetch('http://localhost:3000/api/recompensas/iconos'),
          fetch(`http://localhost:3000/api/recompensas/iconos/${idPerfil}`)
        ]);

        if (!resCatalogo.ok || !resDesbloqueados.ok) {
          throw new Error('Error al cargar datos de iconos');
        }

        // 1. Procesar el catálogo completo
        const datosCatalogo = await resCatalogo.json() as Array<{ id_icono?: number; Id_icono?: number; nombre_icono?: string; nombre?: string }>;
        const normalizadoCatalogo = datosCatalogo
          .map((item) => new Icono(
            Number(item.id_icono ?? item.Id_icono ?? 0),
            String(item.nombre_icono ?? item.nombre ?? '')
          ))
          .filter((icono) => icono.id_icono > 1)
          .sort((a, b) => a.id_icono - b.id_icono);

        // 2. Procesar los desbloqueados
        const datosDesbloqueados = await resDesbloqueados.json() as Array<{ id_icono?: number; Id_icono?: number }>;
        const desbloqueadosArray = datosDesbloqueados.map(item => Number(item.id_icono ?? item.Id_icono ?? 0));

        setIconosCatalogo(normalizadoCatalogo);
        setIdsDesbloqueados(desbloqueadosArray);

      } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al cargar datos de iconos:', mensaje);
        
        // Fallback en caso de error (mostrar el catálogo por defecto, pero bloqueado)
        setIconosCatalogo(
          iconosDisponibles
            .filter((item) => item.id > 1)
            .map((item) => new Icono(item.id, `Icono ${item.id}`))
        );
        setIdsDesbloqueados([]); // Asumimos que no tiene nada desbloqueado si hay error
      }
    };

    cargarDatos();
  }, [idPerfil]); // Se vuelve a ejecutar si cambia el idPerfil

  const detenerDesplazamiento = () => {
    if (intervaloRef.current !== null) {
      window.clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  };

  const iniciarDesplazamiento = (direccion: 'izquierda' | 'derecha') => {
    detenerDesplazamiento();
    intervaloRef.current = window.setInterval(() => {
      if (!carruselRef.current) return;
      carruselRef.current.scrollLeft += direccion === 'izquierda' ? -VELOCIDAD_DESPLAZAMIENTO : VELOCIDAD_DESPLAZAMIENTO;
    }, 16);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-white text-sm px-2">
        Elige un ícono para tu perfil (opcional):
      </label>

      {iconosCatalogo.length === 0 ? (
        <p className="text-xs px-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Aún no hay íconos disponibles. Por ahora se mostrará la inicial de tu nickname.
        </p>
      ) : (
        <div
          className="relative flex items-center gap-2 p-3 rounded-2xl"
          style={{ backgroundColor: '#2a2a2a' }}
        >
          {/* Flecha izquierda */}
          <div
            onMouseEnter={() => iniciarDesplazamiento('izquierda')}
            onMouseLeave={detenerDesplazamiento}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition hover:bg-white/10"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white opacity-70" />
          </div>

          {/* Viewport de iconos */}
          <div
            ref={carruselRef}
            className="flex items-center gap-3 overflow-x-hidden scroll-smooth scrollbar-none"
            style={{ width: '13.5rem' }}
          >
            {/* Ícono 1: Inicial (Siempre desbloqueado) */}
            <button
              type="button"
              onClick={() => onSeleccionar(1)}
              title="Sin ícono (usar inicial)"
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition hover:scale-110"
              style={{
                backgroundColor: '#1a7a6e',
                outline: iconoSeleccionado === 1 ? '3px solid #5ecfb8' : 'none',
                outlineOffset: '2px',
              }}
            >
              {inicial}
            </button>

            {/* Íconos Dinámicos (IDs 2 en adelante) */}
            {iconosCatalogo.map((icono) => {
                
                // Usamos tu módulo de Vite para obtener la URL empaquetada
                const urlIcono = obtenerUrlIcono(icono.id_icono); 
                
                // Si la BD tiene el ícono, pero olvidaste guardar la imagen en la carpeta 'assets', 
                // saltamos este botón para que la app no truene mostrando una imagen rota.
                if (!urlIcono) return null;

                const estaDesbloqueado = idsDesbloqueados.includes(icono.id_icono);

                return (
                  <button
                    key={icono.id_icono}
                    type="button"
                    onClick={() => estaDesbloqueado ? onSeleccionar(icono.id_icono) : null}
                    title={estaDesbloqueado ? (icono.nombre_icono || `Icono ${icono.id_icono}`) : 'Bloqueado'}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden shadow-sm transition 
                      ${estaDesbloqueado 
                        ? 'hover:scale-110 cursor-pointer' 
                        : 'cursor-not-allowed opacity-50 grayscale hover:opacity-70'
                      }`}
                    style={{
                      outline: iconoSeleccionado === icono.id_icono ? '3px solid #5ecfb8' : 'none',
                      outlineOffset: '2px',
                    }}
                  >
                    {/* Renderizamos la URL segura generada por tu import.meta.glob */}
                    <img 
                      src={urlIcono} 
                      alt={icono.nombre_icono || String(icono.id_icono)} 
                      className="w-full h-full object-cover bg-zinc-800" 
                    />
                    
                    {/* Capa oscura y candado si está bloqueado */}
                    {!estaDesbloqueado && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <LockClosedIcon className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Flecha derecha */}
          <div
            onMouseEnter={() => iniciarDesplazamiento('derecha')}
            onMouseLeave={detenerDesplazamiento}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition hover:bg-white/10"
          >
            <ChevronRightIcon className="w-5 h-5 text-white opacity-70" />
          </div>
        </div>
      )}
    </div>
  )
}