import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { iconosDisponibles } from '../utils/icons'

interface IconPickerProps {
  nickname: string;
  iconoSeleccionado: number;
  onSeleccionar: (idIcono: number) => void;
}

const VELOCIDAD_DESPLAZAMIENTO = 4; // px por tick mientras el cursor permanece sobre una flecha

export default function IconPicker({ nickname, iconoSeleccionado, onSeleccionar }: IconPickerProps) {
  const inicial = (nickname || '?').charAt(0).toUpperCase();
  const carruselRef = useRef<HTMLDivElement>(null);
  const intervaloRef = useRef<number | null>(null);

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

      {iconosDisponibles.length === 0 ? (
        <p className="text-xs px-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Aún no hay íconos disponibles. Por ahora se mostrará la inicial de tu nickname.
        </p>
      ) : (
        <div
          className="relative flex items-center gap-2 p-3 rounded-2xl"
          style={{ backgroundColor: '#2a2a2a' }}
        >
          {/* Flecha izquierda: mantener el cursor aquí revela los íconos anteriores */}
          <div
            onMouseEnter={() => iniciarDesplazamiento('izquierda')}
            onMouseLeave={detenerDesplazamiento}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition hover:bg-white/10"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white opacity-70" />
          </div>

          {/* Viewport de tamaño fijo: los íconos se desplazan dentro sin agrandar el formulario */}
          <div
            ref={carruselRef}
            className="flex items-center gap-3 overflow-x-hidden scroll-smooth scrollbar-none"
            style={{ width: '13.5rem' }}
          >
            {/* Opción "sin ícono": mantiene el avatar con la inicial del nickname */}
            <button
              type="button"
              onClick={() => onSeleccionar(0)}
              title="Sin ícono (usar inicial)"
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition hover:scale-110"
              style={{
                backgroundColor: '#1a7a6e',
                outline: iconoSeleccionado === 0 ? '3px solid #5ecfb8' : 'none',
                outlineOffset: '2px',
              }}
            >
              {inicial}
            </button>

            {iconosDisponibles.map((icono) => (
              <button
                key={icono.id}
                type="button"
                onClick={() => onSeleccionar(icono.id)}
                title={String(icono.id)}
                className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden shadow-sm transition hover:scale-110"
                style={{
                  outline: iconoSeleccionado === icono.id ? '3px solid #5ecfb8' : 'none',
                  outlineOffset: '2px',
                }}
              >
                <img src={icono.url} alt={String(icono.id)} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Flecha derecha: mantener el cursor aquí revela los íconos siguientes */}
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
