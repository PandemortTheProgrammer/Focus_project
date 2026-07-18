import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UploadProfile() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<{ loading: boolean; message: string; error: boolean }>({
    loading: false,
    message: '',
    error: false
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setStatus({ loading: false, message: '', error: false }) // Limpiamos mensajes anteriores
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setStatus({ loading: true, message: 'Subiendo y procesando perfil...', error: false });

    // Preparamos el archivo para enviarlo como formulario "multipart/form-data"
    const formData = new FormData();
    formData.append('database', selectedFile);

    try {
      // Esta es la ruta que construiremos mañana en Express
      const res = await fetch('http://localhost:3000/api/database/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir el archivo');
      }

      setStatus({ loading: false, message: '¡Perfil cargado con éxito!', error: false });
      
      // Tras un par de segundos, lo mandamos al dashboard para que vea su perfil cargado
      setTimeout(() => {
        // Forzamos la recarga de la página para que el App.tsx vuelva a hacer el fetch del perfil
        window.location.href = '/dashboard'; 
      }, 2000);

    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setStatus({ loading: false, message: mensaje, error: true });
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-auto flex flex-col items-center justify-start py-8">
      
      {/* Título */}
      <h1 className="relative z-10 text-5xl font-bold text-center mb-10"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Subir un perfil
      </h1>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-5 bg-zinc-900/50 p-10 rounded-3xl shadow-xl border border-zinc-700/50">

        <p className="text-white text-sm text-center max-w-sm opacity-80 mb-2">
          Selecciona el archivo <b>.sqlite</b> que descargaste previamente para restaurar tu progreso y configuración.
        </p>

        {/* Botón Upload que abre el selector de archivo */}
        <label
          className="px-8 py-3 rounded-xl text-white font-semibold cursor-pointer transition hover:scale-105 border-2 border-dashed border-zinc-500 hover:border-[#5ecfb8] hover:text-[#5ecfb8]"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo .sqlite'}
          <input
            type="file"
            accept=".sqlite"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Estado del archivo seleccionado */}
        <div className="h-6">
          <p className="text-[#f5e6c8] text-sm text-center font-medium">
            {selectedFile ? `📁 ${selectedFile.name}` : ''}
          </p>
        </div>

        {/* Botón de Confirmación (Solo aparece si hay un archivo seleccionado) */}
        {selectedFile && (
          <button
            onClick={handleUploadSubmit}
            disabled={status.loading}
            className={`px-10 py-3 rounded-full text-white text-lg font-bold transition shadow-lg mt-2 ${
              status.loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:bg-[#4ab9a3]'
            }`}
            style={{ backgroundColor: '#5ecfb8', color: '#1a1a1a' }}>
            {status.loading ? 'Cargando...' : 'Confirmar y Cargar Perfil'}
          </button>
        )}

        {/* Mensajes de Feedback (Éxito o Error) */}
        {status.message && (
          <p className={`mt-2 font-semibold text-center ${status.error ? 'text-red-400' : 'text-green-400'}`}>
            {status.message}
          </p>
        )}

        {/* Línea divisoria */}
        <div className="w-full h-px bg-zinc-700 my-2"></div>

        {/* Botón Back */}
        <button
          onClick={() => navigate('/')}
          className="px-8 py-2 rounded-full text-white text-sm font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          Cancelar y regresar
        </button>

      </div>
    </div>
  )
}