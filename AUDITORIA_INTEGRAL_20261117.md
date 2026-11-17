# Auditoría de integración · Zen Hogar Gestión

**Fecha:** 17 de noviembre de 2026  
**Alcance:** cambios de Reportes 2.0, Stock 2.0, Ventas y Compras, Panel inteligente y estabilidad.  
**Revisión:** estática y pruebas con datos artificiales. No se realizó una venta o compra real ni se modificó el esquema de Supabase.

## Cambios correctivos implementados
- **Caché local:** captura errores de lectura/escritura (JSON inválido, almacenamiento lleno o bloqueado), evita que una copia local dañada detenga la app. La nube sigue siendo la fuente de verdad.
- **PDF mensual:** paginación segura por secciones y filas; las listas largas continúan en nuevas páginas y conservan pie de página.
- **Regresión automática:** `tests/regresion.cjs` compila todos los scripts, verifica referencias CSS/JS, integridad de tablas y rutas de negocio, cálculos de mes, filtros de stock y métricas de Inicio.
- **CI:** `.github/workflows/integridad.yml` ejecuta las pruebas en PR y al subir cambios a `main`.

## Comprobaciones realizadas
- Scripts incrustados de `index.html` y nuevos módulos JS: sintaxis válida.
- CSS sin llaves desbalanceadas.
- Ejemplos sintéticos de facturación, costos, ganancia, gastos y calendario.
- Cantidades de venta y compra: pasos enteros y fraccionados, stock restante.
- PDF: simulación con 17 productos, múltiples categorías y medios de pago; se verificó que el texto no se escriba fuera de página. El documento pasó a tres páginas.
- Caché: una entrada JSON inválida y un error de cuota no provocan excepción no controlada.
- Comparación de ramas: ningún cambio de SQL ni de funciones de cobro/registro existentes.

## Supabase · estado comprobado
Se consultaron los avisos de **seguridad y rendimiento** de la base conectada, en modo lectura.

- **51 advertencias:** funciones `SECURITY DEFINER` que pueden ser ejecutadas por usuarios autenticados. No implica automáticamente una vulnerabilidad: las cuatro funciones revisadas (`archive_product`, `create_purchase`, `update_purchase`, `upsert_product_v4`) realizan verificación de autorización vía `private.is_org_admin`. Hace falta revisar el resto una por una antes de modificar permisos.
  - Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- **29 relaciones sin índice de FK:** advertencias de rendimiento en varias tablas. No se crearon índices sin analizar volumen, carga e impacto.
  - Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- **Una tabla con RLS sin políticas:** `public.price_monitor_cron_keys`; puede ser intencional para denegar acceso desde cliente. No se abrieron políticas.
  - Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- No se encontraron claves de tipo `sb_secret_` en la configuración pública de la interfaz. Se usa una clave publicable (esperada para clientes).
- No se alteró el proyecto de Supabase, su esquema, datos, funciones ni permisos.

## Pendientes por revisar en uso real
1. Inicio y Reportes (periodos, gráficos y popovers) con sesión autenticada, en PC y Samsung.
2. Descargar PDF mensual desde un navegador real y verificar impresión y archivos.
3. Crear y cancelar **operaciones de prueba autorizadas** en la empresa correcta para validar el flujo completo.
4. Comprobar navegador sin conexión, cambio de empresa, rol empleado vs. administrador y modo oscuro.
5. Realizar auditoría especializada de las funciones `SECURITY DEFINER` restantes.
6. Revisar mecanismos de instalación y offline: el HTML actual no registra service worker ni enlaza un manifest PWA. No agregar almacenamiento de datos privados en un caché del service worker sin diseñar su política de seguridad.
7. Revisar dependencias externas: el CDN de Supabase JS usa la etiqueta de versión mayor (`@2`); evaluar fijarla a una versión probada.

**Reversión inicial de toda la etapa:** rama `backup/pre-mejoras-integrales-20261117`.  
**Nota:** el CI comprueba integridad y cálculos, pero no sustituye una prueba funcional con datos reales.
