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
import WeeklySummary from './Components/Weekly_Summary'
import Download from './Components/download'
import type Perfil from './models/Perfil'
export default function App() {
    // Estado global para el perfil
  const [perfilGlobal, setPerfilGlobal] = useState<Perfil | null>(null);

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
        console.log("No se pudo recuperar el perfil al inicio.");
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
            <Route path="/actividades" element={<ActivitiesMain />} />
            <Route path="/actividades/agregar" element={<ActivitiesAdd />} />
            <Route path="/actividades/editar/:id" element={<ActivitiesEdit />} />
            <Route path="/progreso-semanal" element={<WeeklyProgress />} />
            <Route path="/resumen-semanal" element={<WeeklySummary />} />
            <Route path="/Download" element={<Download />}/>
        </Routes>
    )
}