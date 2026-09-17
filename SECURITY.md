# Seguridad de AI World Atlas

AI World Atlas expone una comunidad anónima con chat y debates. El diseño de seguridad parte de una regla: **el navegador no tiene acceso directo de lectura o escritura a las tablas comunitarias**.

## Controles implementados

- Las tablas públicas tienen **Row Level Security (RLS)** activado y los roles `anon` y `authenticated` no reciben permisos directos.
- Las escrituras pasan por Edge Functions; la `service_role` permanece exclusivamente en el servidor.
- Los mensajes, temas y respuestas se normalizan, limitan por longitud y se validan en el servidor.
- Se rechazan patrones de HTML/JavaScript ejecutable, esquemas `javascript:` / `data:text/html`, eventos HTML y patrones típicos de inyección SQL destructiva.
- La interfaz vuelve a escapar todo contenido generado por usuarios antes de insertarlo en HTML.
- No se usa `eval()` en el cliente comunitario.
- Hay límites de frecuencia independientes para mensajes, nuevos debates y respuestas.
- Los visitantes pueden reportar mensajes, temas y respuestas.
- La API restringe métodos, tamaño máximo del cuerpo y orígenes web conocidos.
- La página añade una Content Security Policy que bloquea plugins/objetos y limita scripts y conexiones.
- GitHub Actions ejecuta un smoke test de seguridad en cada pull request y en cada cambio de `main`.

## Privacidad

La comunidad usa un `visitor_id` aleatorio guardado en el navegador. No se publica ese identificador. El contador geográfico conserva únicamente continente aproximado; no se diseñó para almacenar o mostrar direcciones IP ni ubicación precisa.

## Moderación

La comunidad es anónima, no una zona sin reglas. Los reportes se guardan para permitir revisión y futura moderación. Los límites de frecuencia reducen spam, pero ningún filtro automático sustituye la moderación humana cuando una comunidad crece.

## Reportar un problema de seguridad

No publiques credenciales, tokens, claves privadas ni datos personales en issues públicos. Si se habilita un canal privado de seguridad para el proyecto, úsalo para vulnerabilidades que puedan afectar a visitantes o datos del Atlas.
