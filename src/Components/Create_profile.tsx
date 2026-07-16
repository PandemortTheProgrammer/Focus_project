import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IconPicker from './IconPicker'

interface CreateProfileProps {
  setPerfilGlobal: (perfil: { nickname: string; age_rank: string; genero: string; id_focus: number; icono?: string }) => void;
}

export default function CreateProfile({ setPerfilGlobal }: CreateProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [ageRank, setAgeRank] = useState('');
  const [focus, setFocus] = useState('');
  const [genero, setGenero] = useState('');
  const [icono, setIcono] = useState('');
  
  const [enfoquesCatalogo, setEnfoquesCatalogo] = useState<{Id_enfoque: number, nombre_enf: string}[]>([]);
  const [cargandoEnfoques, setCargandoEnfoques] = useState(true);

  // ── Agrega aquí el texto de contexto de cada enfoque ──────────────────────
  // La clave de cada entrada debe coincidir con el Id_enfoque de tu base de datos.
  const enfoquesConTexto: Record<number, string> = {
    1: 'Descripción del enfoque 1. Reemplaza este texto con tu propio contenido.',
    2: 'Descripción del enfoque 2. Reemplaza este texto con tu propio contenido.',
    3: 'Descripción del enfoque 3. Reemplaza este texto con tu propio contenido.',
    4: 'Descripción del enfoque 4. Reemplaza este texto con tu propio contenido.',
    5: 'Descripción del enfoque 5. Reemplaza este texto con tu propio contenido.',
    6: 'Descripción del enfoque 6. Reemplaza este texto con tu propio contenido.',
    7: 'Descripción del enfoque 7. Reemplaza este texto con tu propio contenido.',
    

  };
  // ──────────────────────────────────────────────────────────────────────────

  const descripcionSeleccionada = focus
    ? (enfoquesConTexto[parseInt(focus)] ?? '')
    : '';

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
      } finally {
        setCargandoEnfoques(false);
      }
    };
    cargarEnfoques();
  }, []);

  const handleSave = async () => {
    if (!nickname || !ageRank || !focus || !genero) {
        alert("Por favor llena todos los campos");
        return;
    }

    // Estructura limpia que coincide al 100% con las propiedades leídas por Dashboard.tsx
    const nuevoPerfil = {
        nickname: nickname,
        age_rank: ageRank,
        genero: genero, 
        id_focus: parseInt(focus),
        icono: icono
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/perfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPerfil)
        });

        if (respuesta.ok) {
            // Al pasarle el objeto completo, React redibuja el Dashboard al instante con el saludo correcto
            setPerfilGlobal(nuevoPerfil);
            navigate('/dashboard');
        } else {
            alert("Hubo un problema al guardar el perfil.");
        }
    } catch (error) {
        alert("Error al conectar con el servidor.");
    }
};

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">

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

        <IconPicker nickname={nickname} iconoSeleccionado={icono} onSeleccionar={setIcono} />

        {/* NUEVO CAMPO: Género / Pronombres */}
        <div className="flex flex-col gap-1">
          <label className="text-white text-sm px-2">
            ¿Cómo prefieres que te llamemos?
          </label>
          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full px-5 py-3 rounded-full text-white text-lg outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/30"
            style={{ backgroundColor: '#2a2a2a' }}>
            <option value="" disabled>Selecciona una opción</option>
            <option value="M">Él (Bienvenido)</option>
            <option value="F">Ella (Bienvenida)</option>
            <option value="O">Neutro (Hola)</option>
          </select>
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
            <option value="" disabled>
              {cargandoEnfoques ? 'Cargando enfoques...' : 'Selecciona tu enfoque'}
            </option>
            {enfoquesCatalogo.length === 0 && !cargandoEnfoques ? (
              <option value="" disabled>No hay enfoques disponibles</option>
            ) : (
              enfoquesCatalogo.map((enf) => (
                <option key={enf.Id_enfoque} value={enf.Id_enfoque}>
                  {enf.nombre_enf}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Descripción del enfoque seleccionado */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: descripcionSeleccionada ? '120px' : '0px',
            opacity: descripcionSeleccionada ? 1 : 0,
            transition: 'max-height 450ms ease, opacity 400ms ease',
            marginTop: descripcionSeleccionada ? '0' : '0',
          }}
        >
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: '1.6',
              paddingLeft: '0.75rem',
              paddingRight: '0.25rem',
            }}
          >
            {descripcionSeleccionada}
          </p>
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