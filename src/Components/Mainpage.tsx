import { useNavigate } from 'react-router-dom'
import FocusLogo from '../assets/Images/Focus_logo.png'

export default function Mainpage() {
  const navigate = useNavigate()

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

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <img
          src={FocusLogo}
          alt="Focus Logo"
          className="w-64 object-contain"
        />
      </div>

      {/* Botones */}
      <div className="relative z-10 flex flex-col gap-4 w-64">
        <button
          onClick={() => navigate('/crear-perfil')}
          className="w-full py-4 rounded-full text-white text-xl font-semibold transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#1a1a1a' }}>
          Crear un nuevo perfil
        </button>
        <button
          onClick={() => navigate('/subir-perfil')}
          className="w-full py-4 rounded-full text-white text-xl font-semibold transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#1a1a1a' }}>
          Cargar un perfil nuevo
        </button>
      </div>
    </div>
  )
}