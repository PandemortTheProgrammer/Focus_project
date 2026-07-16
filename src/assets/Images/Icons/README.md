# Íconos de perfil

Coloca aquí las imágenes (`.png`, `.jpg`, `.jpeg`, `.svg` o `.webp`) que quieras ofrecer como
íconos seleccionables en "Crear perfil" y "Editar perfil".

**Convención de nombres obligatoria:** cada archivo debe llamarse `icon_{id}.ext`, por ejemplo:

- `icon_1.png`
- `icon_gato.svg`
- `icon_estrella.webp`

Solo el `{id}` (la parte después de `icon_`) se guarda en la base de datos. A partir de ese id,
`src/utils/icons.ts` reconstruye automáticamente el enlace a la imagen real. Los archivos que no
sigan este formato se ignoran (y se muestra una advertencia en consola).

No se requiere ninguna configuración adicional: cualquier imagen agregada con este formato a esta
carpeta aparecerá automáticamente en el selector de íconos (ver `src/Components/IconPicker.tsx`).
