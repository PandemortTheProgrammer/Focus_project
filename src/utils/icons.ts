// src/utils/icons.ts
// Carga automáticamente todas las imágenes disponibles en src/assets/Images/Icons
// para ofrecerlas como íconos seleccionables de perfil (ver IconPicker.tsx).
//
// Convención de nombres: cada archivo debe llamarse "icon_{id}.ext" (ej. icon_1.png,
// icon_gato.svg, etc). Únicamente el "{id}" se guarda en la base de datos; a partir de
// ese id se reconstruye el enlace a la imagen real usando este mismo módulo.
// Basta con agregar un nuevo archivo con ese formato para que aparezca disponible.

const PREFIJO = 'icon_';

const modulos = import.meta.glob('../assets/Images/Icons/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export interface IconoPerfil {
  id: string;   // identificador único que se guarda en el perfil (la parte "{id}" de icon_{id}.ext)
  url: string;  // URL resuelta por Vite para mostrar la imagen
}

export const iconosDisponibles: IconoPerfil[] = Object.entries(modulos)
  .map(([ruta, url]) => {
    const nombreArchivo = ruta.split('/').pop() ?? ruta;
    const nombreSinExtension = nombreArchivo.replace(/\.[^/.]+$/, '');

    if (!nombreSinExtension.startsWith(PREFIJO)) {
      console.warn(`Ícono ignorado: "${nombreArchivo}" no sigue el formato "icon_{id}.ext"`);
      return null;
    }

    const id = nombreSinExtension.slice(PREFIJO.length);
    return { id, url };
  })
  .filter((icono): icono is IconoPerfil => icono !== null)
  .sort((a, b) => a.id.localeCompare(b.id));

export const obtenerUrlIcono = (id?: string | null): string | undefined => {
  if (!id) return undefined;
  return iconosDisponibles.find((icono) => icono.id === id)?.url;
};
