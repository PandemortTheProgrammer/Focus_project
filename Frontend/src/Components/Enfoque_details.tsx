import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type Perfil from '../models/Perfil';
import { useToast } from './ToastContext';
import {
    LightBulbIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import PageHeader from './Page-head';

interface EnfoqueDetalle {
    Id_enfoque: number;
    nombre_enf: string;
    descripcion_larga: string;
    recomendaciones: string[];
}

interface ConoceTuEnfoqueProps {
    perfilGlobal: Perfil;
}

export default function ConoceTuEnfoque({ perfilGlobal }: ConoceTuEnfoqueProps) {
    const navigate = useNavigate();
    const { mostrarToast } = useToast();

    const [enfoqueInfo, setEnfoqueInfo] = useState<EnfoqueDetalle | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDetallesEnfoque = async () => {
            if (!perfilGlobal?.id_focus) return;

            try {
                // Preparado para el futuro endpoint de la V2
                const res = await fetch(`http://localhost:3000/api/perfil/enfoque-detalles/${perfilGlobal.id_focus}`);

                if (res.ok) {
                    const data = await res.json();
                    setEnfoqueInfo(data);
                } else {
                    // FALLBACK TEMPORAL PARA PRUEBAS (Mientras actualizamos la BD local-first)
                    setEnfoqueInfo({
                        Id_enfoque: perfilGlobal.id_focus,
                        nombre_enf: "Enfoque Actual", // Esto vendrá de la DB real
                        descripcion_larga: "Este enfoque está diseñado para quienes buscan maximizar su rendimiento diario sin sacrificar su bienestar. Exige disciplina para bloquear distracciones, pero recompensa con un progreso constante y medible. Ideal si tienes metas a mediano o largo plazo fuertemente estructuradas.",
                        recomendaciones: [
                            "Prioriza al menos 2 horas diarias de trabajo profundo ininterrumpido.",
                            "Registra una actividad de ocio moderado para evitar el desgaste mental.",
                            "Mantén consistencia en tus horarios de sueño (las desveladas penalizan este enfoque)."
                        ]
                    });
                }
            } catch (error) {
                console.error('Error al cargar el enfoque:', error);
                mostrarToast('error', 'Error de conexión', 'No pudimos cargar los detalles de tu enfoque.');
            } finally {
                setCargando(false);
            }
        };

        cargarDetallesEnfoque();
    }, [perfilGlobal, mostrarToast]);

    if (cargando) {
        return <div className="min-h-screen flex items-center justify-center text-white">Cargando tu manifiesto...</div>;
    }

    return (
        <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center py-10 px-4">

            <PageHeader titulo="Conoce tu enfoque" />

            <p className="text-zinc-400 text-lg mb-10 text-center max-w-xl">
                El camino que has elegido define la estructura de tu día ideal. Conoce qué se espera de ti.
            </p>

            {/* Tarjeta Principal del Enfoque */}
            <div className="relative z-10 flex flex-col gap-8 w-full max-w-3xl">

                <div className="flex flex-col p-8 rounded-3xl shadow-2xl relative overflow-hidden group" style={{ backgroundColor: '#2a2a2a' }}>

                    {/* Adorno visual de fondo */}
                    <SparklesIcon className="absolute -top-10 -right-10 w-48 h-48 text-white opacity-5 group-hover:opacity-10 transition duration-500 transform group-hover:rotate-12" />

                    <div className="flex items-center gap-4 mb-4">
                        <CheckBadgeIcon className="w-10 h-10 text-[#5ecfb8]" />
                        <h2 className="text-3xl font-bold text-white">
                            {enfoqueInfo?.nombre_enf}
                        </h2>
                    </div>

                    <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                        {enfoqueInfo?.descripcion_larga}
                    </p>

                    <hr className="border-zinc-700 mb-6" />

                    {/* Sección de Recomendaciones */}
                    <h3 className="text-xl font-semibold text-[#f5e6c8] mb-4 flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6" />
                        Plan de acción recomendado
                    </h3>

                    <ul className="flex flex-col gap-3">
                        {enfoqueInfo?.recomendaciones.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-[#5ecfb8] shrink-0" />
                                <span className="text-zinc-300 text-md leading-snug">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Zona de Reflexión / Acción */}
                <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border border-zinc-700 bg-zinc-900/50 gap-6">
                    <div className="flex-1">
                        <p className="text-white font-medium text-lg">¿No resuena contigo?</p>
                        <p className="text-zinc-400 text-sm mt-1">
                            Es válido cambiar de estrategia si tus prioridades actuales son diferentes.
                            Actualizar tu enfoque recalibrará tus reportes semanales.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/editar-perfil')}
                        className="flex items-center gap-2 px-8 py-3 rounded-full text-[#1a1a1a] font-bold transition hover:scale-105 shrink-0 shadow-lg"
                        style={{ backgroundColor: '#5ecfb8' }}>
                        <ArrowPathIcon className="w-5 h-5 stroke-[2.5]" />
                        Cambiar enfoque
                    </button>
                </div>

            </div>
        </div>
    );
}