n # Íconos de perfil

Coloca aquí las imágenes (`.png`, `.jpg`, `.jpeg`, `.svg` o `.webp`) que quieras ofrecer como
íconos seleccionables en "Crear perfil" y "Editar perfil".

**Convención de nombres obligatoria:** cada archivo debe llamarse `icon_{id}.ext` o `icono_{id}.ext`, donde `{id}` es numérico, por ejemplo:

- `icon_1.png`
- `icon_20.png`
- `icono_42.svg`

Solo el `{id}` se guarda en la base de datos. `src/utils/icons.ts` detecta los archivos de esta carpeta
y los usa para construir el selector. Los íconos aparecen aunque el backend todavía no tenga una
condición de desbloqueo configurada; mientras el backend no indique que el usuario los desbloqueó,
se mostrarán bloqueados. Los archivos que no sigan el formato se ignoran (y se muestra una advertencia
en consola).

No se requiere ninguna configuración adicional: cualquier imagen agregada con este formato a esta
carpeta aparecerá automáticamente en el selector de íconos (ver `src/Components/IconPicker.tsx`).
