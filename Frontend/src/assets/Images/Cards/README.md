# Tarjetas de Perfil (Hitos de Nivel)

Coloca aquí las imágenes (`.png`, `.jpg`, `.jpeg`, `.svg` o `.webp`) que se usan como fondo
de las tarjetas de recompensa otorgadas al alcanzar los Hitos de Nivel en la V2.

**Convención de nombres obligatoria:** cada archivo debe llamarse `tarjeta_{id}.ext` o `card_{id}.ext`, donde `{id}` es numérico. Este ID debe coincidir con `Recompensa.Id_desbloqueado`, que referencia `Tarjeta.Id_tarjeta` para cada hito.

Ejemplos válidos:
- `tarjeta_1.png`
- `tarjeta_5.jpg`
- `card_10.webp`

`src/utils/tarjetas.ts` detecta los archivos y resuelve la imagen a partir de `Id_desbloqueado`. La tarjeta se muestra como fondo del hito desbloqueado y como imagen de vista previa en su detalle y notificación; la tarjeta base (ID `1`) conserva el fondo predeterminado.

Las tarjetas aparecen en el catálogo aunque el backend todavía no tenga una condición de nivel configurada; mientras el motor de XP y recompensas no indique que el usuario las desbloqueó, se mostrarán bloqueadas en el frontend. Los archivos que no sigan el formato exacto se ignoran automáticamente (lanzando una advertencia en la consola del navegador).

No se requiere ninguna configuración adicional en el código: arrastra tu imagen con el nombre correcto aquí y Focus V2 se encargará del resto.