import { useNavigate } from 'react-router-dom'
import Activities from '../assets/Images/Activities.png'
import DownloadProfile from '../assets/Images/Download Profile.png'
import EditProfile from '../assets/Images/Edit Profile.png'
import WeeklyProgress from '../assets/Images/Weekly Progress.png'
import FocusLogo from '../assets/Images/Focus_logo.png'
import type Perfil from '../models/Perfil'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const nickname = perfilGlobal?.nickname || 'Desconocido'
  const focus = perfilGlobal?.id_focus || '--'
  const obtenerSaludo = (generoSeleccionado?: string) => {
  if (generoSeleccionado === 'M') return 'Bienvenido';
  if (generoSeleccionado === 'F') return 'Bienvenida';
  return 'Saludos'; // O tu saludo neutro por defecto
  };
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col"
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

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>

        {/* Logo */}
        <img src={FocusLogo} alt="Focus Logo" className="h-10 object-contain" />

        {/* Info del usuario */}
        <div className="flex items-center gap-4">
          {/* Avatar con inicial */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#1a7a6e' }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          {/* Datos del perfil */}
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{nickname}</p>
            <p className="text-white opacity-50 text-xs">Enfoque: {focus}</p>
          </div>
        </div>

      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1">

        {/* Título */}
        <h1 className="text-5xl font-bold text-center mb-10" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
          {obtenerSaludo(perfilGlobal?.genero)}, {perfilGlobal?.nickname || "Invitado"}
        </h1>

        {/* Tarjetas */}
        <div className="flex flex-wrap justify-center gap-6">

          <div
            onClick={() => navigate('/actividades')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition duration-200 hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#2a2a2a' }}>
            <img src={Activities} alt="Activities" className="w-16 h-16 object-contain" />
            <p className="text-white text-sm font-semibold">Gestiona tus actividades</p>
          </div>

          <div
            onClick={() => navigate('/progreso-semanal')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition duration-200 hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#2a2a2a' }}>
            <img src={WeeklyProgress} alt="Weekly Progress" className="w-16 h-16 object-contain" />
            <p className="text-white text-sm font-semibold">Ver tu progreso semanal</p>
          </div>
          <div
            onClick={() => navigate('/resumenes-semanales')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition duration-200 hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#2a2a2a' }}>
            <img src={WeeklyProgress} alt="Weekly Progress" className="w-16 h-16 object-contain" />
            <p className="text-white text-sm font-semibold">Ver tus reportes semanales</p>
          </div>
          <div
            onClick={() => navigate('/editar-perfil')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition duration-200 hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#2a2a2a' }}>
            <img src={EditProfile} alt="Edit Profile" className="w-16 h-16 object-contain" />
            <p className="text-white text-sm font-semibold">Edita tu perfil</p>
          </div>

          <div
            onClick={() => navigate('/Download')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition duration-200 hover:opacity-80 hover:scale-105"
            style={{ backgroundColor: '#2a2a2a' }}>
            <img src={DownloadProfile} alt="Download Profile" className="w-16 h-16 object-contain" />
            <p className="text-white text-sm font-semibold">Descarga tu perfil</p>
          </div>

        </div>
      </div>
    </div>
  )
}