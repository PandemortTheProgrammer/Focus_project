import { useNavigate } from 'react-router-dom'

export default function UploadProfile() {
  const navigate = useNavigate()

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Archivo seleccionado:', file.name)
      // aquí después se procesará el archivo .db
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">

      {/* Título */}
      <h1 className="relative z-10 text-5xl font-bold text-center mb-10"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Subir un perfil
      </h1>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-4">

        {/* Botón Upload que abre el selector de archivo */}
        <label
          className="px-10 py-3 rounded-full text-white text-lg font-semibold cursor-pointer transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          Subir
          <input
            type="file"
            accept=".sqlite"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {/* Descripción */}
        <p className="text-white text-sm text-center px-8">
          Sube el archivo *.sqlite que guardaste previamente
        </p>

        {/* Botón Back */}
        <button
          onClick={() => navigate('/')}
          className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          Regresar
        </button>

      </div>
    </div>
  )
}