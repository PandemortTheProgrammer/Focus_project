import { useState } from 'react';
import { XMarkIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export interface Cosmetico {
    id: number;
    nombre: string;
    url?: string;
    fallbackText?: string;
    desbloqueado: boolean;
}

interface ModalSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (idSeleccionado: number) => void | Promise<void>;
    tipo: 'icono' | 'tarjeta';
    items: Cosmetico[];
    idActual: number;
}

export default function ModalSelectorCosmetico({ isOpen, onClose, onSave, tipo, items, idActual }: ModalSelectorProps) {
    const [seleccionTemporal, setSeleccionTemporal] = useState<number>(idActual);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const guardarSeleccion = async () => {
        setGuardando(true);
        setError(null);
        try {
            await onSave(seleccionTemporal);
            onClose();
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'No se pudo guardar el cosmético.');
        } finally {
            setGuardando(false);
        }
    };

    const desbloqueados = items.filter(item => item.desbloqueado);
    const bloqueados = items.filter(item => !item.desbloqueado);

    const isIcono = tipo === 'icono';
    const shapeClasses = isIcono ? 'w-24 h-24 sm:w-32 sm:h-32 rounded-full' : 'w-48 h-28 sm:w-64 sm:h-36 rounded-2xl';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 bg-[#1a1a1a]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
                        Selecciona tu {isIcono ? 'Icono' : 'Tarjeta'}
                    </h2>
                    <button onClick={onClose} disabled={guardando} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white disabled:opacity-50">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Cuerpo con Carruseles */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Carrusel: Desbloqueados */}
                    <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 pl-2">Desbloqueados</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x [&::-webkit-scrollbar]:hidden">
                            {desbloqueados.map((item) => {
                                const isSelected = seleccionTemporal === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSeleccionTemporal(item.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setSeleccionTemporal(item.id);
                                            }
                                        }}
                                        aria-pressed={isSelected}
                                        className={`relative flex-shrink-0 cursor-pointer snap-center transition-all duration-300 transform hover:scale-105 ${shapeClasses} ${isSelected ? 'ring-4 ring-[#5ecfb8] scale-105' : 'ring-2 ring-transparent hover:ring-zinc-600'
                                            }`}
                                    >
                                        {item.url ? (
                                            <img src={item.url} alt={item.nombre} className={`w-full h-full object-cover ${isIcono ? 'rounded-full' : 'rounded-2xl'}`} />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${isIcono ? 'rounded-full bg-[#1a7a6e] text-5xl font-bold text-white' : 'rounded-2xl bg-zinc-800 text-sm font-semibold text-white'}`}>
                                                {isIcono ? item.fallbackText ?? '👤' : item.nombre}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-[#5ecfb8] rounded-full p-1 shadow-lg">
                                                <CheckCircleIcon className="w-6 h-6 text-[#121212]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Carrusel: Bloqueados (Gamificación) */}
                    {bloqueados.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2 flex items-center gap-2">
                                <LockClosedIcon className="w-4 h-4" /> Aún bloqueados
                            </h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x [&::-webkit-scrollbar]:hidden opacity-60">
                                {bloqueados.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`relative flex-shrink-0 snap-center grayscale ${shapeClasses} bg-zinc-900 border border-zinc-800`}
                                    >
                                        {item.url ? (
                                            <img src={item.url} alt={item.nombre} className={`w-full h-full object-cover opacity-40 ${isIcono ? 'rounded-full' : 'rounded-2xl'}`} />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 ${isIcono ? 'rounded-full text-3xl' : 'rounded-2xl text-sm font-semibold'}`}>
                                                {isIcono ? '👤' : item.nombre}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                            <LockClosedIcon className="w-8 h-8 text-zinc-300 mb-1" />
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-300 bg-black/60 px-2 py-1 rounded-md">
                                                {item.nombre}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Confirmación */}
                <div className="p-6 border-t border-zinc-800/60 bg-[#1a1a1a] flex justify-end gap-4">
                    {error && <p role="alert" className="mr-auto self-center text-sm text-red-300">{error}</p>}
                    <button onClick={onClose} disabled={guardando} className="px-6 py-3 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button
                        onClick={() => void guardarSeleccion()}
                        disabled={seleccionTemporal === idActual || guardando}
                        className="px-8 py-3 rounded-xl bg-[#5ecfb8] text-[#121212] font-bold hover:bg-[#4db8a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>

            </div>
        </div>
    );
}