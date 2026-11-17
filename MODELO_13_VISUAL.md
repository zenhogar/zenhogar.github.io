# Zen Hogar Gestión · Modelo 13C / Teal moderno

## Identidad visual aprobada
- Principal: `#2F6F6D`. Hover: `#255A58`.
- Acento suave: `#7FC7C2`. Fondo/acento tenue: `#E8F4F3`.
- Modo claro: blanco y gris neutro; modo oscuro: fondo negro `#08090b` y tarjetas gris carbón.
- Naranja para stock bajo y rojo para falta de stock.
- La opción anterior `zen` se presenta como **Teal moderno**. Se mantienen las opciones Océano, Lavanda y Arena.
- El usuario conserva el tema y la paleta que ya hubiera seleccionado en su dispositivo.

## Funciones y distribución
- **Inicio:** conserva los indicadores reales, el acceso a ventas y el gráfico conectado a las ventas de la empresa activa.
- **Gráfico semanal:** siete barras de ventas reales, ahora seleccionables con mouse, teclado o toque; el importe y la fecha se anuncian debajo.
- **Inventario:** presentación más compacta en móvil y escritorio, buscador y filtros preexistentes intactos.
- **Ajustes rápidos + / −:** aparecen únicamente para usuarios administradores y productos vendidos por **unidad**. Abren el formulario de edición con la cantidad propuesta. El producto solo se actualiza cuando el usuario pulsa **Guardar producto**; nunca se modifica automáticamente.
- **Navegación:** Inicio sigue como primer acceso móvil predeterminado; se respetan los accesos que el usuario haya personalizado y el botón "Más".
- **Compras, caja, promociones, proveedores, roles, Supabase y reportes:** lógica original sin cambios.
- **Escáner:** no se agregaron controles nuevos (los ya existentes se conservan).
- Archivos modificados: `index.html` y `modelo13-visual.css`. No hay cambios de SQL ni de estructura de datos.

## Controles estáticos realizados
- Los scripts embebidos de `index.html` pasaron una comprobación sintáctica (sin ejecutarse).
- Se revisaron las rutas de guardado, la navegación predeterminada, los selectores de tema, el código del gráfico real y los estilos responsivos.
- No hay comprobaciones de CI publicadas para esta revisión.

## Revisión manual tras la integración
1. Entrar desde móvil y PC con la empresa correcta y comprobar que no haya errores visuales.
2. Probar Inicio, gráfico semanal y cambio de día (importe mostrado = ventas reales).
3. En Stock, buscar, ordenar, editar, filtrar y probar `+`/`−` en un producto de prueba de tipo unidad; cancelar para comprobar que el stock no cambie y luego guardar un ajuste autorizado.
4. Confirmar que no haya `+`/`−` para litros o kilogramos, ni para usuarios sin permiso.
5. Verificar ventas, promociones, caja, compras, borradores, reportes y navegación móvil personalizada.
6. Cambiar el tema claro/oscuro y las paletas, probar teclados y cuadros modales en celular.
7. Comprobar tamaños 360, 390, 768 y escritorio.

**Importante:** esta actualización se revisó estáticamente, pero no se pudo ejecutar una sesión autenticada contra una base de pruebas. No afirmar que la revisión funcional de punta a punta esté completa.

## Reversión
El cambio se integra mediante un pull request separado. Si aparece un problema, revertir el commit de merge desde GitHub.
En la parte puramente visual, retirar el enlace a `modelo13-visual.css` vuelve a los estilos originales; para revertir también la interactividad del gráfico y el ajuste rápido hay que revertir el cambio de `index.html`.
