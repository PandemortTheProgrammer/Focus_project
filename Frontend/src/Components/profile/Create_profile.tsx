import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconPicker from '../essentials/IconPicker'
import { useToast } from '../essentials/ToastContext'

interface CreateProfileProps {
  setPerfilGlobal: (perfil: { nickname: string; age_rank: string; genero: string; id_focus: number; id_icono?: number }) => void;
}

export default function CreateProfile({ setPerfilGlobal }: CreateProfileProps) {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [nickname, setNickname] = useState('');
  const [ageRank, setAgeRank] = useState('');
  const [genero, setGenero] = useState('');
  const [idIcono, setIdIcono] = useState<number>(1);

  const handleSave = async () => {
    // 1. Validación de campos vacíos (se eliminó focus)
    if (!nickname || !ageRank || !genero) {
        mostrarToast('advertencia', 'Datos incompletos', 'Por favor llena todos los campos para crear tu perfil.');
        return;
    }

    // Asignamos 7 (Equilibrado) como enfoque temporal por defecto para evitar nulos
    const nuevoPerfil = {
        nickname: nickname,
        age_rank: ageRank,
        genero: genero, 
        id_focus: 7, 
        id_icono: idIcono
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/perfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPerfil)
        });

        const data = await respuesta.json().catch(() => ({}));

        if (respuesta.ok) {
            setPerfilGlobal(nuevoPerfil);

            // --- Evaluación del logro Bienvenida ---
            try {
              const resEvento = await fetch('http://localhost:3000/api/recompensas/evaluar-evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventoEspecial: 'CREACION_PERFIL' })
              });

              if (resEvento.ok) {
                const dataEvento = await resEvento.json();
                if (dataEvento.logrosDesbloqueados && dataEvento.logrosDesbloqueados.length > 0) {
                  dataEvento.logrosDesbloqueados.forEach((logro: any, index: number) => {
                    setTimeout(() => {
                      mostrarToast('logro', logro.nombre_recompensa, logro.descripcion, '', logro);
                    }, index * 1500 + 1000); 
                  });
                }
              }
            } catch (eventoError) {
              console.error('Error al evaluar el logro de bienvenida:', eventoError);
            }
            // ----------------------------------------------------

            // Redirigimos al onboarding de enfoque
            navigate('/seleccionar-enfoque?onboarding=true');
        } else {
            mostrarToast('error', 'No se pudo crear el perfil', data.error || 'Hubo un problema al guardar el perfil.');
        }
    } catch {
        mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-start py-8">
      <h1 className="relative z-10 text-5xl font-bold text-center mb-10"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Crear un nuevo perfil
      </h1>

      <div className="relative z-10 flex flex-col gap-4 w-72">
        <IconPicker nickname={nickname} iconoSeleccionado={idIcono} onSeleccionar={setIdIcono} />
      
        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">Identificate por un nickname:</label>
          <input
            type="text"
            placeholder="Escribe tu Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">¿Cómo prefieres que te llamemos?</label>
          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona una opción</option>
            <option value="M">Él (Bienvenido)</option>
            <option value="F">Ella (Bienvenida)</option>
            <option value="O">Neutro (Hola)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">Rango de edad:</label>
          <select
            value={ageRank}
            onChange={(e) => setAgeRank(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none cursor-pointer transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona tu rango</option>
            <option value="15-17">15-17</option>
            <option value="18-21">18-21</option>
            <option value="22-30">22-30</option>
          </select>
        </div>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 border border-zinc-600"
            style={{ backgroundColor: '#1a1a1a' }}>
            Volver
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-full text-[#1a1a1a] text-lg font-bold shadow-lg transition hover:scale-105"
            style={{ backgroundColor: '#5ecfb8' }}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}