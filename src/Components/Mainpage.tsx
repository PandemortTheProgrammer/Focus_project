import { useNavigate } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'

export default function Mainpage() {
  const navigate = useNavigate()

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-start py-8">

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <img src={FocusLogo} alt="Focus Logo" className="w-64 object-contain" />
      </div>

      {/* Botones */}
      <div className="relative z-10 flex flex-col gap-4 w-64">
        <button
          onClick={() => navigate('/crear-perfil')}
          className="w-full py-4 rounded-full text-white text-xl font-semibold transition duration-200 hover:opacity-80 hover:scale-105 hover:shadow-lg"
          style={{ backgroundColor: '#1a1a1a' }}>
          Crear un nuevo perfil
        </button>
        <button
          onClick={() => navigate('/subir-perfil')}
          className="w-full py-4 rounded-full text-white text-xl font-semibold transition duration-200 hover:opacity-80 hover:scale-105 hover:shadow-lg"
          style={{ backgroundColor: '#1a1a1a' }}>
          Cargar un perfil
        </button>
      </div>
    </div>
  )
}