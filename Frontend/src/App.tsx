import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './Components/essentials/ToastContext'

import Layout from './Components/essentials/Layout'
import Mainpage from './Components/profile/Mainpage'
import CreateProfile from './Components/profile/Create_profile'
import EditProfile from './Components/profile/Edit_profile'
import UploadProfile from './Components/profile/Upload_profile'
import Dashboard from './Components/Dashboard'
import ActivitiesMain from './Components/activities/Activities_main'
import ActivitiesAdd from './Components/activities/Activities_add'
import ActivitiesEdit from './Components/activities/Activities_edit'
import ActivitiesHistory from './Components/activities/Activities_history'
import WeeklyProgress from './Components/summaries/Weekly_progress'
import Download from './Components/profile/Download'
import WeeklySummaries from './Components/summaries/Weekly_Summaries'
import WeeklySummaryDetail from './Components/summaries/Weekly_Summaries_details'
import RewardsMain from './Components/gamification/Rewards_main';
import Enfoque_details from './Components/gamification/Enfoque_details'
import Set_pin from './Components/profile/Set_pin'
import SeleccionarEnfoque from './Components/gamification/Focus_select'
import DiaIdeal from './Components/gamification/Ideal_day'

import Perfil from './models/Perfil'


export default function App() {
  // Estado global para el perfil
  const perfilInicial: Perfil = new Perfil(1, '', '', 0, '', 1)
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
              Number(datos.id_icono ?? 1)
            )
          );
        }
      } catch (error) {
        console.log("No se pudo recuperar el perfil al inicio.", error);
      }
    };
    recuperarPerfil();
  }, []);

  return (
    <ToastProvider>
      <Layout perfilGlobal={perfilGlobal}>
        <Routes>
          <Route path="/" element={<Mainpage />} />
          <Route
            path="/crear-perfil"
            element={<CreateProfile setPerfilGlobal={(perfil) => setPerfilGlobal(new Perfil(1, perfil.nickname, perfil.age_rank, perfil.id_focus, perfil.genero, perfil.id_icono ?? 1))} />}
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
          <Route path="/dashboard" element={<Dashboard perfilGlobal={perfilGlobal} />} />
          <Route path="/actividades" element={<ActivitiesMain />} />
          <Route path="/actividades/agregar" element={<ActivitiesAdd />} />
          <Route path="/actividades/editar/:id" element={<ActivitiesEdit />} />
          <Route path="/actividades/historial" element={<ActivitiesHistory />} />
          <Route path="/progreso-semanal" element={<WeeklyProgress />} />
          <Route path="/resumenes-semanales" element={<WeeklySummaries />} />
          <Route path="/resumen-semanal/:id" element={<WeeklySummaryDetail />} />
          <Route path="/descargar" element={<Download />} />
          <Route path="/recompensas" element={<RewardsMain perfilGlobal={perfilGlobal} />} />
          <Route path="/enfoque-detalle" element={<Enfoque_details perfilGlobal={perfilGlobal} />} />
          <Route path="/configurar-pin" element={<Set_pin/>} />
          <Route path="/seleccionar-enfoque" element={<SeleccionarEnfoque />} />
          <Route path="/dia-ideal" element={<DiaIdeal />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}