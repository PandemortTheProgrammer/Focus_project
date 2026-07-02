import { useNavigate } from 'react-router-dom'
import Activities from '../assets/Images/Activities.png'
import DownloadProfile from '../assets/Images/Download Profile.png'
import EditProfile from '../assets/Images/Edit Profile.png'
import WeeklyProgress from '../assets/Images/Weekly Progress.png'

interface DashboardProps {
  perfilGlobal: any;
}


export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()
  const nickname = perfilGlobal?.nickname || 'Desconocido'; // después esto vendrá del perfil guardado

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
        Bienvenid@, {nickname}
      </h1>

      {/* Tarjetas */}
      <div className="relative z-10 flex flex-wrap justify-center gap-6">

        {/* Go to activities */}
        <div
          onClick={() => navigate('/actividades')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#2a2a2a' }}>
          <img src={Activities} alt="Activities" className="w-16 h-16 object-contain" />
          <p className="text-white text-sm font-semibold">Gestiona tus actividades</p>
        </div>

        {/* Go to weekly progress */}
        <div
          onClick={() => navigate('/progreso-semanal')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#2a2a2a' }}>
          <img src={WeeklyProgress} alt="Weekly Progress" className="w-16 h-16 object-contain" />
          <p className="text-white text-sm font-semibold">Ver tu progreso semanal</p>
        </div>

        {/* Edit your profile */}
        <div
          onClick={() => navigate('/editar-perfil')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#2a2a2a' }}>
          <img src={EditProfile} alt="Edit Profile" className="w-16 h-16 object-contain" />
          <p className="text-white text-sm font-semibold">Edita tu perfil</p>
        </div>

        {/* Save your profile */}
        <div
          onClick={() => navigate('/Download')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition transition-transform duration:200 hover:opacity-80 hover:scale-105 hover:shadow-log"
          style={{ backgroundColor: '#2a2a2a' }}>
          <img src={DownloadProfile} alt="Download Profile" className="w-16 h-16 object-contain" />
          <p className="text-white text-sm font-semibold">Descarga tu perfil</p>
        </div>

      </div>
    </div>
  )
}