import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Definimos que este componente recibe la función desde App.tsx
interface CreateProfileProps {
  setPerfilGlobal: (perfil: any) => void;
}

export default function CreateProfile({ setPerfilGlobal }: CreateProfileProps) {
  const navigate = useNavigate();
  
  // Estados para tus inputs
  const [nickname, setNickname] = useState('');
  const [ageRank, setAgeRank] = useState('');
  const [focus, setFocus] = useState('');

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
      // 1. Enviamos a Express
      const respuesta = await fetch('http://localhost:3000/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPerfil)
      });

      if (respuesta.ok) {
        // 2. Si Express lo guardó, actualizamos App.tsx
        setPerfilGlobal(nuevoPerfil);
        
        // 3. Nos movemos al Dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      alert("Error al conectar con el servidor.");
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
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500"
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
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona tu rango</option>
            <option value="15-17">15-17</option>
            <option value="18-21">18-21</option>
            <option value="18-21">22-30</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">
            Establece tu enfoque:
          </label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona tu enfoque</option>
            <option value="Enfoque1">Enfoque1</option>
            <option value="Enfoque2">Enfoque2</option>
            <option value="Enfoque3">Enfoque3</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-4 mt-2 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-10 py-3 rounded-full text-white text-lg font-semibold transition transtion-transform:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
            style={{ backgroundColor: '#1a1a1a' }}>
            Volver
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-3 rounded-full text-white text-lg font-semibold transition transition-transform:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
            style={{ backgroundColor: '#1a1a1a' }}>
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}