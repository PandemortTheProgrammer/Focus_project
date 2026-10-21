import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '../../utils/preferencesContext';

const configuracionInicial = [
    { prefKey: 'btn_actividades', categoria: 'dashboard', titulo: 'Gestiona tus actividades', descripcion: 'Acceso directo a tu panel principal de tareas y registros diarios.' },
    { prefKey: 'btn_progreso_semanal', categoria: 'dashboard', titulo: 'Ver tu progreso semanal', descripcion: 'Gráficas y estadísticas de tu rendimiento en la semana en curso.' },
    { prefKey: 'btn_reportes', categoria: 'dashboard', titulo: 'Ver tus reportes semanales', descripcion: 'Histórico y resúmenes detallados de semanas anteriores.' },
    { prefKey: 'btn_dia_ideal', categoria: 'dashboard', titulo: 'Mi día ideal', descripcion: 'Herramienta de planificación y estructuración de rutinas.' },
    { prefKey: 'btn_progreso_general', categoria: 'dashboard', titulo: 'Progreso General', descripcion: 'Métricas globales y rendimiento histórico en la plataforma.' },
    { prefKey: 'btn_novedades', categoria: 'dashboard', titulo: 'Novedades', descripcion: 'Registro de actualizaciones y notas del parche (Changelog).' },
    { prefKey: 'btn_enfoque', categoria: 'dashboard', titulo: 'Conoce tu enfoque', descripcion: 'Análisis detallado de tus picos de concentración y tiempos.' },
    { prefKey: 'btn_recompensas', categoria: 'dashboard', titulo: 'Recompensas', descripcion: 'Acceso a la vitrina de recompensas y tarjetas de perfil desbloqueadas.' },
    { prefKey: 'btn_editar_perfil', categoria: 'dashboard', titulo: 'Editar Perfil', descripcion: 'Acceso a la configuración y edición de tu perfil de usuario.' },
    { prefKey: 'btn_descargar_perfil', categoria: 'dashboard', titulo: 'Descargar Perfil', descripcion: 'Opción para exportar y mover tu información de perfil.' },
    { prefKey: 'btn_configurar_pin', categoria: 'dashboard', titulo: 'Configurar PIN', descripcion: 'Configuración de acceso seguro mediante un código PIN.' },
    { prefKey: 'btn_nivel_perfil', categoria: 'dashboard', titulo: 'Nivel de Perfil', descripcion: 'Consultar XP acumulada y progreso de niveles.' },
    { prefKey: 'btn_preferencias', categoria: 'dashboard', titulo: 'Preferencias', descripcion: 'Acceso a la configuración de visibilidad del dashboard.' },
    { prefKey: 'widget_nivel', categoria: 'interfaz', titulo: 'Indicador de Nivel', descripcion: 'Muestra el recuadro flotante con tu nivel actual en el panel principal.' },
    { prefKey: 'toast_xp', categoria: 'notificaciones', titulo: 'Experiencia (XP)', descripcion: 'Avisos al ganar puntos por registrar tus actividades.' },
    { prefKey: 'toast_logro', categoria: 'notificaciones', titulo: 'Logros Desbloqueados', descripcion: 'Avisos al cumplir las condiciones de un nuevo objetivo.' },
    { prefKey: 'toast_subida_nivel', categoria: 'notificaciones', titulo: 'Subida de Nivel', descripcion: 'Alertas de celebración al alcanzar un nivel superior.' },
    { prefKey: 'toast_hito', categoria: 'notificaciones', titulo: 'Hitos Alcanzados', descripcion: 'Avisos al obtener nuevas tarjetas de perfil por nivel.' },
    { prefKey: 'toast_sys_resumen', categoria: 'notificaciones', titulo: 'Nuevos Reportes Semanales', descripcion: 'Alertas cuando tu resumen de la semana está listo para revisarse.' },
    { prefKey: 'toast_sys_general', categoria: 'notificaciones', titulo: 'Verificaciones del Sistema', descripcion: 'Resto de alertas de guardado, sincronización y advertencias.' },
];

export default function Preferencias() {
    const navigate = useNavigate();
    const { valores, cargando, error, actualizar } = usePreferences();
    const [guardando, setGuardando] = useState<string | null>(null);
    const [errorActualizacion, setErrorActualizacion] = useState<string | null>(null);

    const togglePreferencia = async (keyToToggle: string) => {
        const valorActual = valores[keyToToggle] ?? true;
        setGuardando(keyToToggle);
        setErrorActualizacion(null);
        try {
            await actualizar(keyToToggle, !valorActual);
        } catch (error: unknown) {
            setErrorActualizacion(error instanceof Error ? error.message : 'No se pudo guardar el cambio.');
        } finally {
            setGuardando(null);
        }
    };

    const renderizarGrupo = (categoria: string, tituloGrupo: string) => {
        const items = configuracionInicial.filter(p => p.categoria === categoria);
        if (items.length === 0) return null;

        return (
            <div className="mb-10 w-full max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-[#5ecfb8] mb-4 pl-2 uppercase tracking-wider text-sm opacity-90">
                    {tituloGrupo}
                </h2>
                <div className="flex flex-col gap-4">
                    {items.map((pref) => (
                        <div
                            key={pref.prefKey}
                            className="flex items-center justify-between p-5 rounded-2xl bg-[#2a2a2a] shadow-lg transition-colors hover:bg-[#333333]"
                        >
                            <div className="pr-6">
                                <h3 className="text-lg font-bold text-white mb-1">{pref.titulo}</h3>
                                <p className="text-sm text-zinc-400 leading-snug">{pref.descripcion}</p>
                                <code className="text-[10px] text-[#5ecfb8] mt-2 block font-mono">
                                    KEY: {pref.prefKey}
                                </code>
                            </div>

                            <label className="flex items-center cursor-pointer flex-shrink-0">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={valores[pref.prefKey] ?? true}
                                        disabled={cargando || guardando !== null}
                                        onChange={() => void togglePreferencia(pref.prefKey)}
                                        aria-label={`Mostrar ${pref.titulo} en modo simplificado`}
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${(valores[pref.prefKey] ?? true) ? 'bg-[#5ecfb8]' : 'bg-zinc-700'
                                        }`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-md ${(valores[pref.prefKey] ?? true) ? 'translate-x-6' : 'translate-x-0'
                                        }`}></div>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full min-h-screen overflow-auto flex flex-col pt-10 px-4 pb-12">

            <div className="w-full max-w-4xl mx-auto flex justify-start mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-md"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Ir a Dashboard
                </button>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
                Configuración de Interfaz
            </h1>
            <p className="text-zinc-300 text-center mb-10 max-w-xl mx-auto">
                Personaliza tu experiencia. Apaga los módulos y notificaciones que no necesites cuando el Modo Simplificado esté activo.
            </p>

            {cargando && <p className="text-center text-zinc-300 mb-6">Cargando preferencias...</p>}
            {error && <p role="alert" className="text-center text-red-300 mb-6">{error}</p>}
            {errorActualizacion && <p role="alert" className="text-center text-red-300 mb-6">{errorActualizacion}</p>}

            {renderizarGrupo('dashboard', 'Módulos del Dashboard')}
            {renderizarGrupo('interfaz', 'Elementos de la Interfaz')}
            {renderizarGrupo('notificaciones', 'Centro de Notificaciones (Toasts)')}

        </div>
    );
}