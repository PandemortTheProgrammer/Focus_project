import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Opcional, pero se ve mejor que "<-"

interface PageHeaderProps {
    titulo: string;
    rutaVolver?: string;
    textoVolver?: string;
    ocultarBoton?: boolean;
}

export default function PageHeader({
    titulo,
    rutaVolver = '/dashboard',
    textoVolver = 'Ir a Dashboard',
    ocultarBoton = false
}: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="w-full flex flex-col px-4 sm:px-6 lg:px-8 pt-6 pb-4">

            {/* Contenedor del Botón de Navegación */}
            <div className="flex justify-start mb-2 sm:mb-4 h-10">
                {!ocultarBoton && (
                    <button
                        onClick={() => navigate(rutaVolver)}
                        className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold transition duration-200 hover:bg-zinc-700 hover:scale-105 border border-zinc-700/50 shadow-md"
                        style={{ backgroundColor: '#1a1a1a' }}
                    >
                        <ArrowLeftIcon className="w-4 h-4 text-zinc-400" />
                        {textoVolver}
                    </button>
                )}
            </div>

            {/* Título Principal Estandarizado */}
            <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center tracking-wide"
                style={{ fontFamily: 'cursive', color: '#f5e6c8' }}
            >
                {titulo}
            </h1>

        </div>
    );
}