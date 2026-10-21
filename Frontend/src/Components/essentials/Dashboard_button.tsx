import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardButtonProps {
    titulo: string;
    Icono: React.ElementType;
    ruta: string;
    colorHex: string;
}

export default function DashboardButton({ titulo, Icono, ruta, colorHex }: DashboardButtonProps) {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            type="button"
            onClick={() => navigate(ruta)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex flex-col items-center justify-center gap-3 w-48 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:scale-105 group"
            style={{ backgroundColor: isHovered ? colorHex : '#2a2a2a' }}
        >
            <Icono
                className="w-12 h-12 transition-colors duration-300"
                style={{ color: isHovered ? '#ffffff' : colorHex }}
            />
            <p
                className="text-sm font-semibold text-center transition-colors duration-300"
                style={{ color: isHovered ? '#ffffff' : '#ffffff' }}
            >
                {titulo}
            </p>
        </button>
    );
}