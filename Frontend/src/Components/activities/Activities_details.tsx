import { useState } from 'react';
import type Actividad from '../../models/Actividad';
import type Tipo_actividad from '../../models/Tipo_actividad';
import { useToast } from '../essentials/ToastContext';

interface ActivitiesDetailsProps {
    actividad: Actividad | null;
    tipo: Tipo_actividad | undefined;
    bloqueada: boolean; // Si es true, oculta/deshabilita Editar y Eliminar
    onClose: () => void;
    onEdit: (id_actividad: number) => void;
    onDelete: (id_actividad: number) => void;
}

export default function ActivitiesDetails({
    actividad,
    tipo,
    bloqueada,
    onClose,
    onEdit,
    onDelete
}: ActivitiesDetailsProps) {
    const { mostrarToast } = useToast();

    // Estado para manejar el micro-formulario de "Clonar Plantilla"
    const [mostrandoClonacion, setMostrandoClonacion] = useState(false);
    const [tituloPlantilla, setTituloPlantilla] = useState('');
    const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);

    // Si no hay actividad seleccionada, no renderizamos nada
    if (!actividad) return null;

    const nombreTipo = tipo?.nombre_tipo ?? 'Actividad';
    const colorTipo = tipo?.codigo_color ?? '#888';

    const manejarClonacion = async () => {
        if (!tituloPlantilla.trim()) {
            mostrarToast('error', 'Título requerido', 'Dale un nombre corto a tu plantilla.');
            return;
        }

        setGuardandoPlantilla(true);
        try {
            const res = await fetch('http://localhost:3000/api/plantillas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_tipo: actividad.id_tipo,
                    titulo_plantilla: tituloPlantilla,
                    desc_activ_default: actividad.descripcion_actividad,
                    durac_min_default: actividad.duracion_minutos
                })
            });

            if (res.ok) {
                mostrarToast('exito', 'Plantilla guardada', 'Ya puedes usarla para registros rápidos.');
                setMostrandoClonacion(false);
                setTituloPlantilla('');
                // Opcional: onClose() si quieres que el modal se cierre tras clonar
            } else {
                const data = await res.json();
                mostrarToast('error', 'Error al clonar', data.error || 'No se pudo guardar la plantilla.');
            }
        } catch (error) {
            console.error(error);
            mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
        } finally {
            setGuardandoPlantilla(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            {/* Contenedor del Modal */}
            <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">

                {/* Cabecera visual dinámica */}
                <div
                    className="h-20 w-full relative flex items-end px-6 pb-4"
                    style={{ backgroundColor: `${colorTipo}20` }} // 20 es transparencia en hex
                >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: colorTipo }}></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">
                        {nombreTipo}
                    </h2>
                </div>

                {/* Cuerpo de detalles */}
                <div className="p-6 flex flex-col gap-6">

                    <div className="flex flex-col gap-1">
                        <h3 className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Descripción</h3>
                        <p className="text-white text-lg leading-relaxed">
                            {actividad.descripcion_actividad || <span className="italic opacity-50">Sin descripción</span>}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-black/30 p-4 rounded-2xl border border-zinc-800">
                            <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Hora de inicio</p>
                            <p className="text-white font-mono text-xl">{actividad.hora_inicio}</p>
                        </div>
                        <div className="flex-1 bg-black/30 p-4 rounded-2xl border border-zinc-800">
                            <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Duración</p>
                            <p className="text-[#5ecfb8] font-bold text-xl">{actividad.duracion_minutos} <span className="text-sm font-normal text-zinc-400">min</span></p>
                        </div>
                    </div>

                    <hr className="border-zinc-800" />

                    {/* Sección de Clonación */}
                    {!mostrandoClonacion ? (
                        <button
                            onClick={() => setMostrandoClonacion(true)}
                            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[#5ecfb8] bg-[#5ecfb8]/10 hover:bg-[#5ecfb8]/20 border border-[#5ecfb8]/30 font-semibold transition"
                        >
                            <span>⚡</span> Clonar como plantilla rápida
                        </button>
                    ) : (
                        <div className="bg-black/40 p-4 rounded-2xl border border-[#5ecfb8]/30 flex flex-col gap-3 animate-fade-in-down">
                            <label className="text-sm text-[#5ecfb8] font-semibold">Guardar nueva plantilla</label>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Nombre (ej: Tarde de gaming)"
                                value={tituloPlantilla}
                                onChange={(e) => setTituloPlantilla(e.target.value)}
                                maxLength={50}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:outline-none focus:border-[#5ecfb8]"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMostrandoClonacion(false)}
                                    className="flex-1 py-2 rounded-lg text-zinc-400 hover:text-white transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={manejarClonacion}
                                    disabled={guardandoPlantilla || !tituloPlantilla.trim()}
                                    className="flex-1 py-2 rounded-lg bg-[#5ecfb8] text-zinc-900 font-bold hover:opacity-90 disabled:opacity-50 transition"
                                >
                                    {guardandoPlantilla ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer con botones destructivos/edición */}
                <div className="p-4 bg-black/40 flex justify-end gap-3">
                    {bloqueada ? (
                        <p className="text-xs text-zinc-500 italic w-full text-center my-auto">
                            Esta actividad superó las 24 horas y fue archivada. Solo puede ser clonada.
                        </p>
                    ) : (
                        <>
                            <button
                                onClick={() => { onClose(); onDelete(actividad.id_actividad); }}
                                className="px-5 py-2 rounded-full text-red-400 font-semibold hover:bg-red-500/10 transition"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={() => { onClose(); onEdit(actividad.id_actividad); }}
                                className="px-5 py-2 rounded-full text-zinc-900 font-bold shadow-lg hover:scale-105 transition"
                                style={{ backgroundColor: '#1a7a6e' }}
                            >
                                Editar actividad
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}