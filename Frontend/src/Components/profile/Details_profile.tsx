import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectorIcono from '../essentials/Selector_icono';
import SelectorTarjeta from '../essentials/Selector_tarjeta';
import type { Cosmetico } from '../essentials/Selector_cosmetico';
import {
    PencilIcon,
    UserIcon,
    ArrowDownTrayIcon,
    LockClosedIcon,
    ArrowRightOnRectangleIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

import { iconosDisponibles, obtenerUrlIcono } from '../../utils/icons';
import { obtenerUrlTarjeta, tarjetasDisponibles } from '../../utils/tarjetas';
import PageHeader from '../essentials/Page-head';

interface PerfilDetalles {
    nickname: string;
    id_icono: number | null;
    id_tarjeta: number | null;
}

interface RecompensaCosmetica {
    tipo_recompensa: string;
    Id_desbloqueado?: number | null;
    Id_icono?: number | null;
    nombre_icono?: string;
    nombre_desbloqueado?: string | null;
    nombre_recompensa: string;
    estaDesbloqueado: boolean;
}

export default function DetallesPerfil() {
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState<PerfilDetalles | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemsIconos, setItemsIconos] = useState<Cosmetico[]>([]);
    const [itemsTarjetas, setItemsTarjetas] = useState<Cosmetico[]>([]);
    const [selectorIconosAbierto, setSelectorIconosAbierto] = useState(false);
    const [selectorTarjetasAbierto, setSelectorTarjetasAbierto] = useState(false);

    useEffect(() => {
        let cancelado = false;

        const cargarPerfil = async () => {
            try {
                const respuesta = await fetch('http://localhost:3000/api/perfil', { cache: 'no-store' });
                if (!respuesta.ok) {
                    throw new Error(respuesta.status === 404
                        ? 'No se encontró un perfil activo.'
                        : 'No se pudieron cargar los detalles del perfil.');
                }
                const datos = await respuesta.json() as PerfilDetalles;
                const respuestaRecompensas = await fetch('http://localhost:3000/api/recompensas/catalogo/1');
                if (!respuestaRecompensas.ok) {
                    throw new Error('No se pudo cargar el catálogo de cosméticos.');
                }
                const recompensas = await respuestaRecompensas.json() as RecompensaCosmetica[];

                if (!cancelado) {
                    setPerfil(datos);
                    const recompensasIconos = new Map(
                        recompensas
                            .filter((recompensa) => recompensa.tipo_recompensa === 'ICONO')
                            .map((recompensa) => [
                                Number(recompensa.Id_desbloqueado ?? recompensa.Id_icono ?? 0),
                                recompensa
                            ])
                    );
                    const recompensasTarjetas = new Map(
                        recompensas
                            .filter((recompensa) => recompensa.tipo_recompensa === 'CARD')
                            .map((recompensa) => [Number(recompensa.Id_desbloqueado ?? 0), recompensa])
                    );

                    setItemsIconos([
                        {
                            id: 1,
                            nombre: 'Ícono predeterminado',
                            url: obtenerUrlIcono(1),
                            fallbackText: (datos.nickname || 'Usuario').charAt(0).toLocaleUpperCase(),
                            desbloqueado: true
                        },
                        ...iconosDisponibles
                            .filter((icono) => icono.id !== 1)
                            .map((icono) => {
                                const recompensa = recompensasIconos.get(icono.id);
                                return {
                                    id: icono.id,
                                    nombre: recompensa?.nombre_desbloqueado
                                        ?? recompensa?.nombre_icono
                                        ?? `Ícono ${icono.id}`,
                                    url: icono.url,
                                    desbloqueado: Boolean(recompensa?.estaDesbloqueado)
                                };
                            })
                    ]);
                    setItemsTarjetas([
                        {
                            id: 1,
                            nombre: 'Tarjeta predeterminada',
                            url: obtenerUrlTarjeta(1),
                            desbloqueado: true
                        },
                        ...tarjetasDisponibles
                            .filter((tarjeta) => tarjeta.id !== 1)
                            .map((tarjeta) => {
                                const recompensa = recompensasTarjetas.get(tarjeta.id);
                                return {
                                    id: tarjeta.id,
                                    nombre: recompensa?.nombre_desbloqueado
                                        ?? recompensa?.nombre_recompensa
                                        ?? `Tarjeta ${tarjeta.id}`,
                                    url: tarjeta.url,
                                    desbloqueado: Boolean(recompensa?.estaDesbloqueado)
                                };
                            })
                    ]);
                }
            } catch (error: unknown) {
                if (!cancelado) {
                    setError(error instanceof Error ? error.message : 'Error desconocido al cargar el perfil.');
                }
            } finally {
                if (!cancelado) setCargando(false);
            }
        };

        void cargarPerfil();
        return () => {
            cancelado = true;
        };
    }, []);

    const urlFondo = obtenerUrlTarjeta(perfil?.id_tarjeta);
    const urlIcono = obtenerUrlIcono(perfil?.id_icono);

    const guardarCosmetico = async (tipo: 'icono' | 'tarjeta', idSeleccionado: number) => {
        const respuesta = await fetch('http://localhost:3000/api/perfil/cosmetico', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, id: idSeleccionado })
        });
        const body: unknown = await respuesta.json();
        if (!respuesta.ok) {
            const mensaje = typeof body === 'object' && body !== null && 'error' in body
                ? String(body.error)
                : 'No se pudo equipar el cosmético.';
            throw new Error(mensaje);
        }

        setPerfil((perfilActual) => perfilActual
            ? {
                ...perfilActual,
                [tipo === 'icono' ? 'id_icono' : 'id_tarjeta']: idSeleccionado
            }
            : perfilActual);
        window.dispatchEvent(new CustomEvent('focus-profile-cosmetic-updated'));
    };

    const guardarIcono = (idSeleccionado: number) =>
        guardarCosmetico('icono', idSeleccionado);
    const guardarTarjeta = (idSeleccionado: number) =>
        guardarCosmetico('tarjeta', idSeleccionado);
    const inicialNickname = (perfil?.nickname || 'Usuario').charAt(0).toLocaleUpperCase();

    return (
        <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center pt-16 px-4 pb-12 animate-fade-in">

            <PageHeader titulo="Detalles de tu perfil" />
            <div className="w-full max-w-3xl flex flex-col items-center">
                {cargando && <p role="status" className="text-zinc-300">Cargando detalles del perfil...</p>}
                {error && <p role="alert" className="text-red-300">{error}</p>}

                {/* === CONTENEDOR DE TARJETA E ÍCONO === */}
                <div
                    className="relative w-full h-48 sm:h-64 rounded-3xl shadow-2xl border border-zinc-800/50 bg-[#1a1a1a] flex items-center gap-6 px-6 sm:px-12 overflow-hidden group/card cursor-pointer"
                    onClick={() => setSelectorTarjetasAbierto(true)}
                >
                    {/* Imagen de fondo de la tarjeta */}
                    <div
                        className="absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover/card:scale-105"
                        style={urlFondo ? {
                            backgroundImage: `linear-gradient(to right, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.4) 100%), url("${urlFondo}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } : {}}
                    />

                    {/* Capa Hover para Editar Fondo */}
                    <div className="absolute inset-0 z-10 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-end backdrop-blur-sm">
                        <div className="flex items-center gap-2 bg-black/60 text-white px-5 py-2.5 rounded-full shadow-lg border border-white/10">
                            <PencilIcon className="w-5 h-5 text-[#5ecfb8]" />
                        </div>
                    </div>

                    {/* Avatar (Ícono) dentro de la tarjeta */}
                    <div
                        className="relative z-20 w-28 h-28 sm:w-40 sm:h-40 rounded-full border-4 sm:border-[6px] border-[#24343b] shadow-2xl overflow-hidden group/avatar cursor-pointer bg-[#1a7a6e] flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectorIconosAbierto(true);
                        }}
                    >
                        {urlIcono ? (
                            <img src={urlIcono} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl sm:text-5xl">
                                {inicialNickname}
                            </div>
                        )}

                        {/* Capa Hover para Editar Ícono */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                            <PencilIcon className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                    </div>

                    <h2
                        className="relative z-20 min-w-0 text-3xl sm:text-5xl font-bold tracking-wide drop-shadow-md break-words"
                        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}
                    >
                        {perfil?.nickname || 'Usuario'}
                    </h2>
                </div>

                {/* === MENÚ DE OPCIONES === */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 w-full max-w-2xl">

                    <button
                        onClick={() => navigate('/editar-perfil')}
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-md border border-white/5 hover:-translate-y-0.5 flex-1 min-w-[160px]"
                    >
                        <UserIcon className="w-5 h-5 text-[#5ecfb8]" /> Editar perfil
                    </button>

                    <button
                        onClick={() => navigate('/descargar')}
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-md border border-white/5 hover:-translate-y-0.5 flex-1 min-w-[160px]"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5 text-blue-400" /> Descargar perfil
                    </button>

                    <button
                        onClick={() => navigate('/configurar-pin')}
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-md border border-white/5 hover:-translate-y-0.5 flex-1 min-w-[160px]"
                    >
                        <LockClosedIcon className="w-5 h-5 text-amber-400" /> Establecer PIN
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-md border border-white/5 hover:-translate-y-0.5 flex-1 min-w-[160px]"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 text-orange-400" /> Salir del perfil
                    </button>

                    <button
                        disabled
                        className="flex items-center justify-center gap-2 bg-zinc-900 text-zinc-500 px-6 py-3.5 rounded-2xl font-semibold shadow-inner border border-zinc-800/50 cursor-not-allowed flex-1 min-w-[160px] opacity-70"
                        title="Función no disponible en esta versión"
                    >
                        <TrashIcon className="w-5 h-5 text-zinc-600" /> Eliminar perfil
                    </button>

                </div>
            </div>
            {perfil && (
                <>
                    <SelectorIcono
                        key={`${selectorIconosAbierto}-${perfil.id_icono ?? 1}`}
                        isOpen={selectorIconosAbierto}
                        onClose={() => setSelectorIconosAbierto(false)}
                        onSave={guardarIcono}
                        items={itemsIconos}
                        idActual={perfil.id_icono ?? 1}
                    />
                    <SelectorTarjeta
                        key={`${selectorTarjetasAbierto}-${perfil.id_tarjeta ?? 1}`}
                        isOpen={selectorTarjetasAbierto}
                        onClose={() => setSelectorTarjetasAbierto(false)}
                        onSave={guardarTarjeta}
                        items={itemsTarjetas}
                        idActual={perfil.id_tarjeta ?? 1}
                    />
                </>
            )}
        </div>
    );
}