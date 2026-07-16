import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { inicializarBaseDeDatos } from './services/db'

// NUEVO: Importamos el Layout
import Layout from './Components/Layout'

import Mainpage from './Components/Mainpage'
import CreateProfile from './Components/Create_profile'
import EditProfile from './Components/Edit_profile'
import UploadProfile from './Components/Upload_profile'
import Dashboard from './Components/Dashboard'
import ActivitiesMain from './Components/Activities_main'
import ActivitiesAdd from './Components/Activities_add'
import ActivitiesEdit from './Components/Activities_edit'
import ActivitiesHistory from './Components/Activities_history'
import WeeklyProgress from './Components/Weekly_progress'
import Download from './Components/download'
import Perfil from './models/Perfil'
import WeeklySummaries from './Components/Weekly_Summaries'
import WeeklySummaryDetail from './Components/Weekly_Summaries_details'

export default function App() {
  // Estado global para el perfil
  const perfilInicial: Perfil = new Perfil(1, '', '', 0, '', 0)
  const [perfilGlobal, setPerfilGlobal] = useState<Perfil>(perfilInicial);

  // Si el usuario recarga la página, intentamos recuperar el perfil de Express
  useEffect(() => {
    const recuperarPerfil = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/perfil');
        if (res.ok) {
          const datos = await res.json();
          setPerfilGlobal(
            new Perfil(
              1,
              datos.nickname ?? '',
              datos.age_rank ?? '',
              Number(datos.id_focus ?? 0),
              datos.genero ?? '',
              Number(datos.id_icono ?? 0)
            )
          );
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
    // NUEVO: Envolvemos todas las rutas con el Layout y le pasamos el perfilGlobal
    <Layout perfilGlobal={perfilGlobal}>
      <Routes>
        <Route path="/" element={<Mainpage />} />
        <Route 
          path="/crear-perfil" 
          element={<CreateProfile setPerfilGlobal={(perfil) => setPerfilGlobal(new Perfil(1, perfil.nickname, perfil.age_rank, perfil.id_focus, perfil.genero, perfil.id_icono ?? 0))} />} 
        />
        <Route
          path="/editar-perfil"
          element={
            <EditProfile
              perfilGlobal={perfilGlobal}
              setPerfilGlobal={(perfil) =>
                setPerfilGlobal(
                  new Perfil(
                    perfil.id_perfil ?? 1,
                    perfil.nickname,
                    perfil.age_rank,
                    perfil.id_focus,
                    perfil.genero,
                    perfil.id_icono
                  )
                )
              }
            />
          }
        />
        <Route path="/subir-perfil" element={<UploadProfile />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard perfilGlobal={perfilGlobal} />} 
        />
        <Route path="/actividades" element={<ActivitiesMain />} />
        <Route path="/actividades/agregar" element={<ActivitiesAdd />} />
        <Route path="/actividades/editar/:id" element={<ActivitiesEdit />} />
        <Route path="/actividades/historial" element={<ActivitiesHistory />} />
        <Route path="/progreso-semanal" element={<WeeklyProgress />} />
        <Route path="/resumenes-semanales" element={<WeeklySummaries />} />
        <Route path="/resumen-semanal/:id" element={<WeeklySummaryDetail/>} />
        <Route path="/Download" element={<Download />}/>
      </Routes>
    </Layout>
  )
}