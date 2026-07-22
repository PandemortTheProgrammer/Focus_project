import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

export default function Download() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const handleDescargar = async () => {
    try {
      // 1. Hacemos la petición para obtener el archivo
      const respuesta = await fetch('http://localhost:3000/api/perfil/descargar');
      
      if (!respuesta.ok) {
        mostrarToast('error', 'Error de descarga', 'No se pudo generar el archivo de respaldo.');
        return;
      }

      // 2. Convertimos y descargamos el archivo
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const enlaceInvisible = document.createElement('a');
      enlaceInvisible.href = url;
      enlaceInvisible.download = 'mi_respaldo_focus.sqlite';
      document.body.appendChild(enlaceInvisible);
      enlaceInvisible.click();

      enlaceInvisible.remove();
      window.URL.revokeObjectURL(url);

      // 3. Notificamos el éxito de la descarga
      mostrarToast('exito', '¡Descarga completada!', 'Tu base de datos local ha sido respaldada con éxito.');

      // =========================================================
      // 4. NUEVO: Evaluamos el logro "Salvado" de forma silenciosa
      // =========================================================
      try {
        const resLogro = await fetch('http://localhost:3000/api/recompensas/evaluar-evento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventoEspecial: 'DESCARGA_PERFIL' })
        });

        if (resLogro.ok) {
          const dataLogro = await resLogro.json();
          
          // Si el backend nos confirma que ganó recompensas, disparamos el Toast
          if (dataLogro.logrosDesbloqueados && dataLogro.logrosDesbloqueados.length > 0) {
            dataLogro.logrosDesbloqueados.forEach((logroNuevo: any, index: number) => {
              // Le damos 1.5 segundos de margen para que el usuario termine de leer 
              // el mensaje de "Descarga completada" antes de mostrar el trofeo
              setTimeout(() => {
                mostrarToast('logro', '', '', '', logroNuevo);
              }, 1500 + (index * 1500));
            });
          }
        }
      } catch (errorLogro) {
        // Fallo silencioso: Si falla la validación del logro, no arruinamos la experiencia
        // porque el archivo ya se descargó exitosamente.
        console.error("No se pudo evaluar el logro:", errorLogro);
      }

    } catch (error) {
      console.error("Error:", error);
      mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-start py-8">

      <h1 className="relative z-10 text-5xl font-bold text-center mb-6"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Respaldar tu Perfil
      </h1>

      <p className="relative z-10 text-white text-center opacity-80 mb-10 max-w-md">
        Descarga una copia exacta de tu perfil, historial de actividades, progreso y recompensas obtenidas. 
        Este archivo te pertenece y podrás cargarlo después en cualquier otro dispositivo.
      </p>

      <div className="relative z-10 flex flex-col gap-6 w-72">
        <button
          onClick={handleDescargar}
          className="w-full px-8 py-4 rounded-full text-[#1a1a1a] text-xl font-bold transition hover:opacity-90 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          style={{ backgroundColor: '#5ecfb8' }}>
          ⬇️ Descargar Respaldo
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-8 py-4 rounded-full text-white text-lg font-semibold transition hover:opacity-80 border border-zinc-600"
          style={{ backgroundColor: '#1a1a1a' }}>
          ← Volver al Dashboard
        </button>
      </div>

    </div>
  );
}