import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { ShieldCheckIcon, KeyIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

export default function ConfigurarPin() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [pinInicial, setPinInicial] = useState('');
  const [pinConfirmacion, setPinConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ''); // Solo números
    
    if (paso === 1) {
      setPinInicial(valor);
      if (valor.length === 4) {
        // Pequeño retraso para que el usuario vea el 4to dígito antes de cambiar de paso
        setTimeout(() => setPaso(2), 200);
      }
    } else {
      setPinConfirmacion(valor);
      if (valor.length === 4) {
        validarYGuardar(pinInicial, valor);
      }
    }
  };

  const validarYGuardar = async (pin1: string, pin2: string) => {
    if (pin1 !== pin2) {
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
        body: JSON.stringify({ pin: pin1 })
      });

      if (res.ok) {
        mostrarToast('exito', 'Privacidad activada', 'Tu perfil ahora está protegido con PIN.');
        navigate('/dashboard'); // Regresamos al dashboard al terminar
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

  // Función para desactivar el PIN (opcional, útil si quieres reciclar esta vista)
  const eliminarPin = async () => {
    // Aquí podrías agregar un modal de confirmación antes
    try {
      await fetch('http://localhost:3000/api/perfil/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: null })
      });
      mostrarToast('advertencia', 'PIN eliminado', 'Tu perfil ya no requiere código de acceso.');
      navigate('/dashboard');
    } catch (error) {
      mostrarToast('error', 'Error', 'No se pudo eliminar el PIN.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
      
      {/* Botón de regreso */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition border border-zinc-700">
        <ArrowUturnLeftIcon className="w-4 h-4" />
        Regresar
      </button>

      <div className="w-full max-w-md flex flex-col items-center bg-[#2a2a2a] p-8 rounded-3xl shadow-2xl border border-zinc-700/50">
        
        <div className="w-16 h-16 rounded-full bg-[#5ecfb8]/20 flex items-center justify-center mb-6">
          {paso === 1 ? (
            <KeyIcon className="w-8 h-8 text-[#5ecfb8]" />
          ) : (
            <ShieldCheckIcon className="w-8 h-8 text-[#5ecfb8]" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center" style={{ fontFamily: 'cursive' }}>
          {paso === 1 ? 'Crea tu código PIN' : 'Confirma tu código'}
        </h1>
        
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

        <button 
          onClick={eliminarPin}
          className="text-zinc-500 hover:text-red-400 text-sm font-medium transition underline underline-offset-4">
          Eliminar protección por PIN
        </button>
      </div>
    </div>
  );
}