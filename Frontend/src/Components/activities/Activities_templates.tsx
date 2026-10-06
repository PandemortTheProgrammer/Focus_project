import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../essentials/ToastContext';
import PageHeader from '../essentials/Page-head';
// Importamos los iconos de HeroIcons
import { TrashIcon, BoltIcon } from '@heroicons/react/24/outline';

// Interfaz adaptada a lo que devuelve nuestro manager con el JOIN
export interface Plantilla {
    id_plantilla: number;
    id_tipo: number;
    titulo_plantilla: string;
    desc_activ_default: string | null;
    durac_min_default: number | null;
    nombre_categoria: string;
    color_categoria: string;
}

export default function ActivitiesTemplates() {
    const navigate = useNavigate();
    const { mostrarToast } = useToast();

    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [cargando, setCargando] = useState(true);

    // ESTADO PARA EL MODAL DE CONFIRMACIÓN
    const [modalEliminar, setModalEliminar] = useState<{ visible: boolean; id_plantilla: number | null }>({
        visible: false,
        id_plantilla: null
    });

    // Traer el catálogo de plantillas al cargar la pantalla
    useEffect(() => {
        const cargarPlantillas = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/plantillas');
                if (res.ok) {
                    setPlantillas(await res.json());
                } else {
                    mostrarToast('error', 'Error', 'No se pudieron cargar las plantillas.');
                }
            } catch (error) {
                console.error("Error al conectar con Express:", error);
                mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
            } finally {
                setCargando(false);
            }
        };
        cargarPlantillas();
    }, [mostrarToast]);

    const solicitarEliminacion = (id_plantilla: number) => {
        setModalEliminar({ visible: true, id_plantilla });
    };

    const cancelarEliminacion = () => {
        setModalEliminar({ visible: false, id_plantilla: null });
    };

    const confirmarEliminacion = async () => {
        const id_plantilla = modalEliminar.id_plantilla;
        if (id_plantilla === null) return;

        setModalEliminar({ visible: false, id_plantilla: null });

        try {
            const res = await fetch(`http://localhost:3000/api/plantillas/${id_plantilla}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setPlantillas(plantillas.filter(p => p.id_plantilla !== id_plantilla));
                mostrarToast('exito', 'Plantilla eliminada', 'El molde fue borrado exitosamente.');
            } else {
                const data = await res.json().catch(() => ({}));
                mostrarToast('error', 'No se pudo eliminar', data.error || "Hubo un problema al intentar borrar la plantilla.");
            }
        } catch (error) {
            console.error(error);
            mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
        }
    };

    // Función clave: Redirige al formulario de agregar, enviando la plantilla en el estado
    const usarPlantilla = (plantilla: Plantilla) => {
        navigate('/actividades/agregar', { state: { plantillaAutofill: plantilla } });
    };

    return (
        <div className="relative w-full flex flex-col min-h-screen">

            {/* --- INICIO DEL MODAL PERSONALIZADO --- */}
            {modalEliminar.visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center transform transition-all">

                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20">
                            {/* Reemplazo del emoji de basura */}
                            <TrashIcon className="w-8 h-8 text-red-500" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
                            ¿Eliminar plantilla?
                        </h3>

                        <p className="text-white opacity-70 text-sm mb-8 leading-relaxed">
                            Esta acción es irreversible, pero no afectará a las actividades que ya hayas registrado usando este molde.
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={cancelarEliminacion}
                                className="px-6 py-2.5 rounded-full text-white text-sm font-semibold border border-zinc-600 transition hover:bg-zinc-800">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminacion}
                                className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg transition hover:scale-105"
                                style={{ backgroundColor: '#7a1a1a' }}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- FIN DEL MODAL --- */}

            <PageHeader titulo="Mis Plantillas" />

            <div className="flex justify-end items-center gap-3 px-8 mb-4">
                <button
                    onClick={() => navigate('/actividades')}
                    className="px-6 py-2 rounded-full bg-zinc-900 text-white transition hover:opacity-80 border border-zinc-700">
                    ← Volver a Actividades
                </button>
            </div>

            {/* Lista de plantillas */}
            <div className="relative z-10 flex flex-col gap-4 px-8 py-4">
                {cargando ? (
                    <p className="text-white text-center opacity-60 mt-10 animate-pulse">Cargando plantillas...</p>
                ) : plantillas.length === 0 ? (
                    <p className="text-white text-center opacity-60 mt-10">
                        No tienes plantillas rápidas. Puedes crear una al registrar una nueva actividad.
                    </p>
                ) : (
                    plantillas.map((plantilla) => {
                        return (
                            <div
                                key={plantilla.id_plantilla}
                                className="flex items-center justify-between px-6 py-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

                                {/* Tag con color e info */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        {/* Reemplazo del emoji del rayo */}
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-800">
                                            <BoltIcon className="w-6 h-6 text-zinc-400" />
                                        </div>
                                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: plantilla.color_categoria }} />
                                    </div>

                                    <div>
                                        {/* Título de la plantilla arriba, categoría abajo */}
                                        <p className="text-white font-bold text-lg">{plantilla.titulo_plantilla}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                {plantilla.nombre_categoria}
                                            </span>
                                            {plantilla.desc_activ_default && (
                                                <span className="text-white opacity-50 text-sm italic limit-text max-w-[200px] truncate">
                                                    "{plantilla.desc_activ_default}"
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info derecha */}
                                <div className="flex items-center gap-8 text-white text-sm">
                                    <div className="text-center">
                                        <p className="opacity-50">Duración</p>
                                        <p className="font-semibold">
                                            {plantilla.durac_min_default ? `${plantilla.durac_min_default} min` : 'Sin definir'}
                                        </p>
                                    </div>

                                    {/* Botones Usar / Eliminar */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => usarPlantilla(plantilla)}
                                            title="Registrar una actividad con estos datos"
                                            className="px-4 py-2 rounded-full text-white text-xs font-semibold transition-all hover:opacity-80 hover:scale-105 shadow-lg"
                                            style={{ backgroundColor: '#1a7a6e' }}>
                                            Usar
                                        </button>
                                        <button
                                            onClick={() => solicitarEliminacion(plantilla.id_plantilla)}
                                            title="Eliminar plantilla"
                                            className="px-4 py-2 rounded-full text-white text-xs font-semibold transition-all hover:opacity-80 border border-zinc-700/50 hover:bg-zinc-800"
                                            style={{ backgroundColor: 'transparent' }}>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}