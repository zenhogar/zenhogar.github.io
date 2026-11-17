# Modelo 13 · Evolución visual de Zen Hogar Gestión

## Alcance
- Nuevo archivo `modelo13-visual.css` cargado al final del `<head>` de `index.html`.
- Cambios exclusivamente visuales: estética verde oscuro / blanco, jerarquía tipográfica más clara, tarjetas compactas, tablas y filtros legibles, botones sobrios, menú lateral refinado, navegación móvil y tema oscuro.
- La paleta Zen incorpora los nuevos colores, pero la elección de paleta, el modo oscuro y los cuatro accesos inferiores configurables siguen funcionando con la lógica existente.
- El diseño se aplica a Inicio, Productos/Stock, Ventas, Compras y Reportes usando estilos comunes.

## Salvaguardas
- Sin cambios al JavaScript de negocio, SQL, Supabase, RLS, inventario, caja, ventas o compras.
- El enlace se agregó después del CSS anterior para que los overrides sean predecibles.
- Para revertir el cambio, eliminar únicamente la línea `<link rel="stylesheet" href="./modelo13-visual.css?v=20261116" />` del `<head>`.
- La rama no modifica la publicación `main`.

## Lista de revisión manual antes de publicar
1. Iniciar sesión desde PC y móvil y seleccionar la empresa correcta.
2. Abrir Inicio: revisar indicadores, acceso a nueva venta y tarjetas.
3. Abrir Productos: buscar, filtrar, editar y verificar los valores de stock.
4. Abrir Ventas: probar teclado móvil, búsqueda, cantidades, promociones y confirmación en entorno seguro.
5. Abrir Compras: verificar proveedores, borradores y edición de compras.
6. Abrir Reportes: revisar tablas, gráficas y filtros.
7. Cambiar entre claro y oscuro; probar otras paletas.
8. Probar menú lateral, accesos inferiores configurables y diálogos abiertos.
9. Comprobar a 360 px, 390 px, 768 px, 1024 px y escritorio ancho.

## Nota
Es la primera versión de implementación visual y requiere revisión manual de pantallas autenticadas; esta rama no se publicó automáticamente.
