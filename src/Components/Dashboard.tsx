import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Activities from '../assets/Images/Activities.png'
import DownloadProfile from '../assets/Images/Download Profile.png'
import EditProfile from '../assets/Images/Edit Profile.png'
import WeeklyProgress from '../assets/Images/Weekly Progress.png'
import type Perfil from '../models/Perfil'

interface DashboardProps {
  perfilGlobal: Perfil;
}

export default function Dashboard({ perfilGlobal }: DashboardProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const cargarEnfoques = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil/enfoques')
        if (res.ok) {
          await res.json()
        }
      } catch (error) {
        console.error('Error al cargar enfoques:', error)
      }
    }
    cargarEnfoques()
  }, [])

  const obtenerSaludo = (generoSeleccionado?: string) => {
  if (generoSeleccionado === 'M') return 'Bienvenido';
  if (generoSeleccionado === 'F') return 'Bienvenida';
  return 'Saludos'; // O tu saludo neutro por defecto
  };
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">


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