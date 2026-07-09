import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface CreateProfileProps {
  setPerfilGlobal: (perfil: { nickname: string; age_rank: string; id_focus: number }) => void;
}

export default function CreateProfile({ setPerfilGlobal }: CreateProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [ageRank, setAgeRank] = useState('');
  const [focus, setFocus] = useState('');
  const [enfoquesCatalogo, setEnfoquesCatalogo] = useState<{Id_enfoque: number, nombre_enf: string}[]>([]);

  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques');
        if (res.ok) {
          setEnfoquesCatalogo(await res.json());
        }
      } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        console.error('Error al cargar enfoques:', mensaje);
      }
    };
    cargarEnfoques();
  }, []);

  const handleSave = async () => {
    if (!nickname || !ageRank || !focus) {
      alert("Por favor llena todos los campos");
      return;
    }

    const nuevoPerfil = {
      nickname: nickname,
      age_rank: ageRank,
      id_focus: parseInt(focus)
    };

    try {
      const respuesta = await fetch('http://localhost:3000/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPerfil)
      });

      if (respuesta.ok) {
        setPerfilGlobal(nuevoPerfil);
        navigate('/dashboard');
      } else {
        alert("Hubo un problema al guardar el perfil en el servidor.");
      }
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al conectar con el servidor: ${mensaje}`);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos */}
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

      {/* Título */}
      <h1 className="relative z-10 text-5xl font-bold text-center mb-10"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Crear un nuevo perfil
      </h1>

      {/* Formulario */}
      <div className="relative z-10 flex flex-col gap-4 w-72">

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">
            Identificate por un nickname:
          </label>
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
          <label className="text-white text-sm px-2">
            Rango de edad:
          </label>
          <select
            value={ageRank}
            onChange={(e) => setAgeRank(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona tu rango</option>
            <option value="15-17">15-17</option>
            <option value="18-21">18-21</option>
            <option value="22-30">22-30</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">
            Establece tu enfoque:
          </label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona tu enfoque</option>
            {enfoquesCatalogo.map((enf) => (
              <option key={enf.Id_enfoque} value={enf.Id_enfoque}>
                {enf.nombre_enf}
              </option>
            ))}
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-4 mt-2 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#1a1a1a' }}>
            Volver
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#1a1a1a' }}>
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}