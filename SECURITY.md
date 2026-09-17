# Seguridad — AI World Atlas

La comunidad pública del Atlas trata todo contenido enviado por usuarios como **datos**, nunca como código.

## Controles implementados

- El navegador no concatena mensajes de usuarios en scripts ni ejecuta HTML aportado por visitantes.
- La interfaz escapa caracteres HTML antes de renderizar alias, mensajes, temas y respuestas.
- Las escrituras públicas pasan por Edge Functions de Supabase; las tablas no se exponen directamente a `anon` ni `authenticated`.
- La Edge Function usa el cliente de Supabase con parámetros estructurados; no construye SQL dinámico con texto del usuario.
- Se normaliza Unicode, se eliminan caracteres de control y se aplican límites estrictos de longitud.
- Se rechazan patrones asociados a XSS, JavaScript ejecutable, HTML activo e inyección SQL común.
- Hay rate limiting en base de datos para chat, temas y respuestas.
- RLS permanece habilitado en todas las tablas comunitarias.
- Los mensajes no publican `visitor_id`, IP ni ubicación precisa.
- Existe reporte de contenido para chat, temas y respuestas.
- CORS limita los orígenes aceptados por las funciones públicas.

## Límites de contenido

- Chat: 500 caracteres.
- Título de debate: 100 caracteres.
- Cuerpo de debate: 600 caracteres.
- Respuesta: 400 caracteres.
- Apodo: 24 caracteres.

## Principio de diseño

Los filtros por expresiones regulares son una capa adicional, no la defensa principal contra SQL injection. La defensa principal es **no ejecutar SQL construido con entrada del usuario** y mantener las tablas fuera del acceso directo del cliente público.
