const formatearFecha = (fecha: Date): string => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
};

export const obtenerInicioSemanaLocal = (fecha: Date): string => {
    const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    return formatearFecha(lunes);
};

export const obtenerSemanaLocalDeTimestamp = (timestamp: string): string | undefined => {
    const normalizado = timestamp.trim().replace(' ', 'T');
    const tieneZonaHoraria = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalizado);
    const fecha = new Date(normalizado.includes('T') && !tieneZonaHoraria
        ? `${normalizado}Z`
        : normalizado);

    return Number.isNaN(fecha.getTime())
        ? undefined
        : obtenerInicioSemanaLocal(fecha);
};
