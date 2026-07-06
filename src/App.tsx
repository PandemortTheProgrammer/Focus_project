import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { inicializarBaseDeDatos } from './services/db'

import Mainpage from './Components/Mainpage'
import CreateProfile from './Components/Create_profile'
import EditProfile from './Components/Edit_profile'
import UploadProfile from './Components/Upload_profile'
import Dashboard from './Components/Dashboard'
import ActivitiesMain from './Components/Activities_main'
import ActivitiesAdd from './Components/Activities_add'
import ActivitiesEdit from './Components/Activities_edit'
import WeeklyProgress from './Components/Weekly_progress'
import WeeklySummaries from './Components/Weekly_Summaries'
import Download from './Components/download'
import Perfil from './models/Perfil'
import WeeklySummary from './Components/Weekly_summary_details'
export default function App() {
    // Estado global para el perfil
  const perfilInicial: Perfil = new Perfil(1, '', '', 0)
  const [perfilGlobal, setPerfilGlobal] = useState<Perfil>(perfilInicial);

  // Opcional: Si el usuario recarga la página, intentamos recuperar el perfil de Express
  useEffect(() => {
    const recuperarPerfil = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil');
        if (res.ok) {
          const datos = await res.json();
          setPerfilGlobal(datos);
        }
      } catch (error) {
        console.log("No se pudo recuperar el perfil al inicio.", error);
      }
    };
    recuperarPerfil();
    }, []);
    useEffect(() => {
        inicializarBaseDeDatos()
    }, [])

    return (
        <Routes>
            <Route path="/" element={<Mainpage />} />
            <Route 
                path="/crear-perfil" 
                element={<CreateProfile setPerfilGlobal={setPerfilGlobal} />} 
            />
            <Route path="/editar-perfil" element={<EditProfile />} />
            <Route path="/subir-perfil" element={<UploadProfile />} />
            <Route 
                path="/dashboard" 
                element={<Dashboard perfilGlobal={perfilGlobal} />} 
            />
            <Route path="/actividades" element={<ActivitiesMain perfilGlobal={perfilGlobal}/>} />
            <Route path="/actividades/agregar" element={<ActivitiesAdd perfilGlobal={perfilGlobal} />} />
            <Route path="/actividades/editar/:id" element={<ActivitiesEdit perfilGlobal={perfilGlobal}/>} />
            <Route path="/progreso-semanal" element={<WeeklyProgress perfilGlobal={perfilGlobal} />} />
            <Route path="/resumenes-semanales" element={<WeeklySummaries />} />
            <Route path="/resumen-semanal/:id" element={<WeeklySummary />} />
            <Route path="/Download" element={<Download />}/>
        </Routes>
    )
}