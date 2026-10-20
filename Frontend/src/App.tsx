import { useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import Layout from './Components/essentials/Layout'
import ToastNotification from './Components/essentials/ToastNotification'
import { ToastProvider, useToast } from './Components/essentials/ToastContext'
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
import Enfoque_details from './Components/functionalities/Enfoque_details'
import Set_pin from './Components/profile/Set_pin'
import SeleccionarEnfoque from './Components/functionalities/Focus_select'
import DiaIdeal from './Components/functionalities/Ideal_day'

import Perfil from './models/Perfil'
import ActivitiesTemplates from './Components/activities/Activities_templates'
import MiProgreso from './Components/functionalities/Your_progress'
import ProfileLevel from './Components/gamification/Profile_level'
import ChangeLog from './Components/viewables/ChangeLog'


export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}

function AppRoutes() {
  // Estado global para el perfil
  const perfilInicial: Perfil = new Perfil(1, '', '', 0, '', 1)
  const [perfilGlobal, setPerfilGlobal] = useState<Perfil>(perfilInicial);
  const { toasts, notificarGamificacion, siguienteToast } = useToast();
  const sincronizacionIniciada = useRef(false);

  // Si el usuario recarga la página, intentamos recuperar el perfil de Express
  useEffect(() => {
    if (sincronizacionIniciada.current) return;
    sincronizacionIniciada.current = true;

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

          if (datos.nickname) {
            const resXP = await fetch('http://localhost:3000/api/xp/sincronizar-logros', {
              method: 'POST'
            });
            if (!resXP.ok) {
              throw new Error('No se pudo sincronizar la XP de logros previos.');
            }

            const sincronizacion = await resXP.json();
            if (sincronizacion.resultadoXP || sincronizacion.logrosDesbloqueados?.length) {
              notificarGamificacion(
                sincronizacion.logrosDesbloqueados ?? [],
                sincronizacion.resultadoXP
              );
            }
          }
        }
      } catch (error) {
        console.log("No se pudo recuperar el perfil al inicio.", error);
      }
    };
    recuperarPerfil();
  }, [notificarGamificacion]);

  const toastActual = toasts[0];
  return (
    <>
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
          <Route path="/actividades/plantillas" element={<ActivitiesTemplates />} />
          <Route path="/progreso-semanal" element={<WeeklyProgress />} />
          <Route path="/resumenes-semanales" element={<WeeklySummaries />} />
          <Route path="/resumen-semanal/:id" element={<WeeklySummaryDetail />} />
          <Route path="/descargar" element={<Download />} />
          <Route path="/recompensas" element={<RewardsMain perfilGlobal={perfilGlobal} />} />
          <Route path="/enfoque-detalle" element={<Enfoque_details perfilGlobal={perfilGlobal} />} />
          <Route path="/configurar-pin" element={<Set_pin/>} />
          <Route path="/seleccionar-enfoque" element={<SeleccionarEnfoque />} />
          <Route path="/dia-ideal" element={<DiaIdeal />} />
          <Route path="/mi-progreso" element={<MiProgreso />} />
          <Route path="/nivel-perfil" element={<ProfileLevel />} />
          <Route path="/novedades" element={<ChangeLog />} />
        </Routes>
      </Layout>
      {toastActual && (
        <ToastNotification
          key={toastActual.id}
          tipo={toastActual.tipo}
          titulo={toastActual.titulo}
          mensaje={toastActual.mensaje}
          urlIcono={toastActual.urlIcono}
          datosLogro={toastActual.datosLogro}
          posicion={toastActual.posicion}
          toastsPendientes={toasts.length - 1}
          onClose={siguienteToast}
        />
      )}
    </>
  )
}