# Zen Hogar Gestión · v13.4.0 — Versión estable

**Fecha de oficialización:** 17 de noviembre de 2026  
**Canal:** Estable  
**Sitio principal:** https://zenhogar.github.io/  
**Repositorio:** https://github.com/zenhogar/zenhogar.github.io  
**Base del lanzamiento:** `0beb94fe0f03042d23eef95fe25fe0d21e5daf78`

## Funcionalidades incluidas

- Gestión de productos, stock y reposición, con búsqueda rápida, filtros y alertas.
- Registro de ventas y compras con cantidades enteras y fraccionadas, proveedores y promociones.
- Resumen comercial en Inicio y panel de indicadores inteligentes.
- Reportes con evolución financiera, medios de pago, categorías, productos y PDF mensual.
- Operaciones de caja y gastos, perfiles y roles existentes.
- Mejoras de sincronización multiempresa, mensajería de conexión y recuperación de caché local.
- Identidad visual Teal Moderna y diseño adaptable a PC y celular.

## Validaciones y despliegue

- **14 pruebas automáticas de regresión**: 10 de integridad general y 4 de optimización. La ejecución del commit base `0beb94fe0f03042d23eef95fe25fe0d21e5daf78` fue satisfactoria.
- **GitHub Pages**: despliegue exitoso de ese mismo commit, ejecución [44152357285](https://github.com/zenhogar/zenhogar.github.io/actions/runs/44152357285).
- La identificación de versión se muestra en **Configuración → Cuenta y negocio**.
- No se modifica el esquema de Supabase ni los registros de clientes, inventario, compras o ventas al etiquetar esta versión.

## Política de mantenimiento

La rama `stable/v13.4.0` conserva una referencia congelada del lanzamiento. Las mejoras futuras se desarrollarán por separado y pasarán comprobaciones antes de integrarse a `main`, que alimenta el sitio público.

## Límites conocidos

Las pruebas automáticas de código y la publicación satisfactoria **no equivalen** a una prueba completa con sesión autenticada en PC y celular. Permanecen por revisar visualmente la descarga de PDF, los flujos reales de operación y los avisos de seguridad pendientes de Supabase. El respaldo congelado **no es** un respaldo independiente de la base de datos.

Esta versión se considera oficialmente seleccionada como **base estable para continuar la carga de productos y la operación diaria**, sin afirmar que esté libre de errores.
