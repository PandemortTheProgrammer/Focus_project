// src/utils/tarjetas.ts
// Carga automáticamente todas las imágenes disponibles en src/assets/images/Cards
// para ofrecerlas como tarjetas de fondo seleccionables para el perfil (Hitos de Nivel).
//
// Convención de nombres: cada archivo debe llamarse "tarjeta_{id}.ext" o "card_{id}.ext"
// (ej. tarjeta_1.png, card_5.webp, etc). Únicamente el "{id}" se guarda en la base de datos;
// a partir de ese id se reconstruye el enlace a la imagen real usando este mismo módulo.

const PREFIJOS = ['tarjeta_', 'card_'];

// Apuntamos a la nueva carpeta dedicada a los fondos/tarjetas
const modulos = import.meta.glob('../assets/Images/Cards/*.{png,jpg,jpeg,svg,webp}', {
    eager: true,
    import: 'default',
}) as Record<string, string>;

export interface TarjetaPerfil {
    id: number;   // identificador único que se guarda en el perfil (la parte "{id}")
    url: string;  // URL resuelta por Vite para mostrar la imagen de fondo
}

export const tarjetasDisponibles: TarjetaPerfil[] = Object.entries(modulos)
    .map(([ruta, url]) => {
        const nombreArchivo = ruta.split('/').pop() ?? ruta;
        const nombreSinExtension = nombreArchivo.replace(/\.[^/.]+$/, '');
        
        // NORMALIZACIÓN: Pasamos a minúsculas para la validación
        const nombreNormalizado = nombreSinExtension.toLowerCase();

        const prefijoAplicable = PREFIJOS.find((prefijo) => nombreNormalizado.startsWith(prefijo));
        if (!prefijoAplicable) {
            console.warn(`Tarjeta ignorada: "${nombreArchivo}" no sigue el formato "tarjeta_{id}.ext" o "card_{id}.ext"`);
            return null;
        }

        // Extraemos el ID usando el nombre normalizado para evitar errores de longitud
        const idTexto = nombreNormalizado.slice(prefijoAplicable.length);
        const id = Number.parseInt(idTexto, 10);

        if (Number.isNaN(id)) {
            console.warn(`Tarjeta ignorada: "${nombreArchivo}" no tiene un id numérico válido`);
            return null;
        }

        return { id, url };
    })
    .filter((tarjeta): tarjeta is TarjetaPerfil => tarjeta !== null)
    .sort((a, b) => a.id - b.id);

export const obtenerUrlTarjeta = (id?: string | number | null): string | undefined => {
    // REGLA DE FALLBACK: 
    // Si no hay ID (error de BD), o es 0, o es exactamente el ID 1 (Tarjeta por defecto),
    // retornamos undefined para que el frontend inyecte el fondo gris autogenerado.
    if (id === null || id === undefined || id === '' || id === 0 || Number(id) === 1) {
        return undefined;
    }

    const idNumerico = Number(id);
    return tarjetasDisponibles.find((tarjeta) => tarjeta.id === idNumerico)?.url;
};