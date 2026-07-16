
import { useNavigate } from 'react-router-dom';

export default function Download() {
  const navigate = useNavigate();

  const handleDescargar = async () => {
    try {
      // 1. Hacemos la petición al endpoint que acabamos de crear
      const respuesta = await fetch('http://localhost:3000/api/sistema/descargar-bd');
      
      if (!respuesta.ok) {
        alert("Error al intentar descargar el respaldo.");
        return;
      }

      // 2. Convertimos la respuesta binaria de Express a un Blob
      const blob = await respuesta.blob();

      // 3. Creamos una URL temporal en la memoria del navegador
      const url = window.URL.createObjectURL(blob);

      // 4. Creamos un elemento <a> invisible, le asignamos la URL y forzamos el clic
      const enlaceInvisible = document.createElement('a');
      enlaceInvisible.href = url;
      enlaceInvisible.download = 'mi_respaldo_focus.sqlite'; // El nombre que verá el usuario
      document.body.appendChild(enlaceInvisible);
      enlaceInvisible.click();

      // 5. Limpiamos la memoria destruyendo el enlace y la URL temporal
      enlaceInvisible.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-start py-8">

      <h1 className="relative z-10 text-5xl font-bold text-center mb-6"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Respaldar tu Perfil
      </h1>

      <p className="relative z-10 text-white text-center opacity-80 mb-10 max-w-md">
        Descarga una copia exacta de tu perfil, historial de actividades y progreso. 
        Este archivo te pertenece y podrás cargarlo después en cualquier otro dispositivo.
      </p>

      <div className="relative z-10 flex flex-col gap-6 w-72">
        <button
          onClick={handleDescargar}
          className="w-full px-8 py-4 rounded-full text-white text-xl font-bold transition hover:opacity-90 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          style={{ backgroundColor: '#1a7a6e' }}>
          ⬇️ Descargar Respaldo
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-8 py-4 rounded-full text-white text-lg font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          ← Volver al Dashboard
        </button>
      </div>

    </div>
  );
}