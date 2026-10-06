import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../essentials/ToastContext';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import PageHeader from '../essentials/Page-head';

export default function ConfigurarPin() {
    const navigate = useNavigate();
    const { mostrarToast } = useToast();

    const [paso, setPaso] = useState<1 | 2>(1);
    const [pinInicial, setPinInicial] = useState('');
    const [pinConfirmacion, setPinConfirmacion] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [pista, setPista] = useState('');

    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value.replace(/\D/g, ''); // Solo números

        if (paso === 1) {
            setPinInicial(valor);
            if (valor.length === 4) {
                // Transición automática al paso 2, esto se mantiene para buena UX
                setTimeout(() => setPaso(2), 200);
            }
        } else {
            setPinConfirmacion(valor);
            // ELIMINADO: El autoguardado. Ahora el usuario debe presionar el botón.
        }
    };

    // Modificado para no recibir parámetros y leer directamente del estado
    const validarYGuardar = async () => {
        if (pinInicial !== pinConfirmacion) {
            mostrarToast('error', 'Los PINs no coinciden', 'Inténtalo de nuevo.');
            setPaso(1);
            setPinInicial('');
            setPinConfirmacion('');
            return;
        }

        setGuardando(true);
        try {
            const res = await fetch('http://localhost:3000/api/perfil/pin', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Enviamos tanto el pin como la pista al backend
                body: JSON.stringify({ 
                    pin: pinInicial, 
                    pista_pin: pista.trim() || null 
                })
            });

            if (res.ok) {
                mostrarToast('exito', 'Privacidad activada', 'Tu perfil ahora está protegido.');
                navigate('/dashboard');
            } else {
                const errorData = await res.json();
                mostrarToast('error', 'Error al guardar', errorData.error);
            }
        } catch (error) {
            console.error(error);
            mostrarToast('error', 'Error de conexión', 'No pudimos comunicarnos con la base de datos local.');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarPin = async () => {
        try {
            await fetch('http://localhost:3000/api/perfil/pin', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: null, pista_pin: null }) // Limpiamos ambos campos
            });
            mostrarToast('advertencia', 'PIN eliminado', 'Tu perfil ya no requiere código de acceso.');
            navigate('/dashboard');
        } catch (error) {
            mostrarToast('error', 'Error', 'No se pudo eliminar el PIN.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-2 relative">
            <PageHeader titulo={paso === 1 ? 'Crea tu código PIN' : 'Confirma tu código'} />

            <div className="w-full max-w-md flex flex-col items-center bg-[#2a2a2a] p-8 rounded-3xl shadow-2xl border border-zinc-700/50 mt-4">

                <div className="w-16 h-16 rounded-full bg-[#5ecfb8]/20 flex items-center justify-center mb-6">
                    {paso === 1 ? (
                        <KeyIcon className="w-8 h-8 text-[#5ecfb8]" />
                    ) : (
                        <ShieldCheckIcon className="w-8 h-8 text-[#5ecfb8]" />
                    )}
                </div>

                <p className="text-zinc-400 text-sm text-center mb-8 px-4">
                    {paso === 1
                        ? 'Protege tu perfil y tus reportes semanales de miradas indiscretas.'
                        : 'Vuelve a escribir los 4 dígitos para asegurarnos de que no haya errores.'}
                </p>

                <div className="relative w-full max-w-xs mb-8">
                    <input
                        type="password"
                        autoFocus
                        maxLength={4}
                        disabled={guardando}
                        value={paso === 1 ? pinInicial : pinConfirmacion}
                        onChange={manejarCambio}
                        className="w-full py-4 text-center text-3xl tracking-[1em] rounded-xl bg-zinc-900 text-white border-2 border-zinc-700 focus:outline-none focus:border-[#5ecfb8] transition shadow-inner"
                    />
                </div>
                
                {/* Indicador de pasos visual */}
                <div className="flex gap-3 mb-8">
                    <div className={`h-2 rounded-full transition-all duration-300 ${paso >= 1 ? 'w-8 bg-[#5ecfb8]' : 'w-4 bg-zinc-700'}`}></div>
                    <div className={`h-2 rounded-full transition-all duration-300 ${paso === 2 ? 'w-8 bg-[#5ecfb8]' : 'w-4 bg-zinc-700'}`}></div>
                </div>

                {/* Mostrar la pista y el botón solo en el paso 2 para no saturar la vista inicial */}
                {paso === 2 && (
                    <div className="w-full flex flex-col gap-4 animate-fade-in">
                        <div className="flex flex-col gap-2">
                            <label className="text-zinc-400 text-sm font-medium px-1">
                                Pista para recordar tu PIN (Opcional)
                            </label>
                            <input
                                type="text"
                                maxLength={60}
                                placeholder="Ej: Cumpleaños de mascota, fecha importante..."
                                value={pista}
                                onChange={(e) => setPista(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-zinc-700/50 text-white focus:border-[#5ecfb8] outline-none transition-colors placeholder:text-zinc-600"
                            />
                            <p className="text-xs text-zinc-500 px-1">
                                Esta frase aparecerá si fallas el PIN 3 veces seguidas.
                            </p>
                        </div>

                        <button
                            onClick={validarYGuardar}
                            disabled={pinConfirmacion.length < 4 || guardando}
                            className="w-full mt-4 py-3 rounded-xl font-bold text-zinc-900 bg-[#5ecfb8] hover:bg-[#4eb39f] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shadow-lg shadow-[#5ecfb8]/20"
                        >
                            {guardando ? 'Guardando...' : 'Confirmar y Guardar'}
                        </button>
                    </div>
                )}

                {paso === 1 && (
                    <button
                        onClick={eliminarPin}
                        className="mt-6 text-zinc-500 hover:text-red-400 text-sm font-medium transition underline underline-offset-4"
                    >
                        Eliminar protección por PIN
                    </button>
                )}
            </div>
        </div>
    );
}