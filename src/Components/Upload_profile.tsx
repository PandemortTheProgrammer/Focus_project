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
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ backgroundColor: '#4a5e5e' }}>

      {/* Círculos decorativos */}
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#b8f0a0', top: '-2rem', left: '2rem' }} />
      <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: '#5ecfb8', top: '-1rem', right: '3rem' }} />
      <div className="absolute w-52 h-52 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#f97316', top: '30%', left: '38%', transform: 'translateX(-50%)' }} />
      <div className="absolute w-60 h-60 rounded-full blur-3xl opacity-80"
        style={{ backgroundColor: '#d946ef', bottom: '0rem', left: '1rem' }} />
      <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-70"
        style={{ backgroundColor: '#86efac', bottom: '2rem', right: '8rem' }} />

      {/* Título */}
      <h1 className="relative z-10 text-5xl font-bold text-center mb-10"
        style={{ fontFamily: 'cursive', color: '#f5e6c8' }}>
        Upload a Profile
      </h1>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-4">

        {/* Botón Upload que abre el selector de archivo */}
        <label
          className="px-10 py-3 rounded-full text-white text-lg font-semibold cursor-pointer transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          Upload
          <input
            type="file"
            accept=".db"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {/* Descripción */}
        <p className="text-white text-sm text-center px-8">
          Sube tu archivo *.db que guardaste previamente
        </p>

        {/* Botón Back */}
        <button
          onClick={() => navigate('/')}
          className="px-10 py-3 rounded-full text-white text-lg font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#1a1a1a' }}>
          Back
        </button>

      </div>
    </div>
  )
}