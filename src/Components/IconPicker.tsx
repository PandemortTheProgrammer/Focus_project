import { iconosDisponibles } from '../utils/icons'

interface IconPickerProps {
  nickname: string;
  iconoSeleccionado: string;
  onSeleccionar: (idIcono: string) => void;
}

export default function IconPicker({ nickname, iconoSeleccionado, onSeleccionar }: IconPickerProps) {
  const inicial = (nickname || '?').charAt(0).toUpperCase();

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
          className="flex flex-wrap gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: '#2a2a2a' }}
        >
          {/* Opción "sin ícono": mantiene el avatar con la inicial del nickname */}
          <button
            type="button"
            onClick={() => onSeleccionar('')}
            title="Sin ícono (usar inicial)"
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition hover:scale-110"
            style={{
              backgroundColor: '#1a7a6e',
              outline: iconoSeleccionado === '' ? '3px solid #5ecfb8' : 'none',
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
              title={icono.id}
              className="w-12 h-12 rounded-full overflow-hidden shadow-sm transition hover:scale-110"
              style={{
                outline: iconoSeleccionado === icono.id ? '3px solid #5ecfb8' : 'none',
                outlineOffset: '2px',
              }}
            >
              <img src={icono.url} alt={icono.id} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
