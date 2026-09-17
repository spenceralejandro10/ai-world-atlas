# AI World Atlas

**AI World Atlas** es un proyecto personal de David Spencer para estudiar, comparar y comprender el ecosistema mundial de inteligencia artificial sin mezclar categorías técnicamente distintas.

El recorrido editorial del proyecto es:

**DESCUBRIR → ENTENDER → COMPARAR → ELEGIR → APRENDER → MANTENERSE ACTUALIZADO → CONVERSAR**

## Qué contiene

- Laboratorios y ecosistemas de IA con infraestructura, investigación, modelos o plataformas propias.
- Modelos y productos oficiales separados de aplicaciones construidas sobre tecnología de terceros.
- Comparación orientativa de asistentes de propósito general.
- Comparativas por especialidad: razonamiento, programación, investigación, imagen, video, voz y más.
- Directorio mundial con búsqueda por nombre, empresa, país, capacidad o necesidad.
- Favoritos locales mediante **Mis IA de trabajo**.
- **Radar IA · Actualidad** con fuentes enlazadas y actualización automática diaria.
- Interfaz en español, inglés y filipino/tagalo.
- Contadores reales de visitantes, personas en vivo y “Me gusta”.
- **Comunidad AI World Atlas** con chat anónimo y debates con respuestas.
- Identidad comunitaria simple: Chico/Chica + apodo manual o divertido generado al azar.
- Reporte de mensajes, temas y respuestas.
- Recordatorio de opinión / “Me gusta” como máximo una vez cada 24 horas por navegador.
- Aplicación web instalable mediante manifest + service worker.

## Jerarquía editorial

El Atlas organiza el ecosistema en tres niveles principales:

1. **Laboratorios y ecosistemas de IA**: organizaciones que investigan, entrenan modelos o mantienen infraestructura y plataformas relevantes.
2. **Modelos y productos oficiales**: modelos fundacionales, asistentes y productos de esas organizaciones.
3. **Aplicaciones con inteligencia artificial**: productos especializados que pueden utilizar modelos propios o de terceros.

Una interfaz atractiva o popular no se considera automáticamente un laboratorio de IA. El objetivo es distinguir quién desarrolla la tecnología base y quién construye sobre ella.

## Comunidad y backend

El backend comunitario está activo sobre Supabase. El navegador utiliza únicamente una clave pública y **no accede directamente a las tablas**. Chat, debates, respuestas, likes, reportes y estadísticas pasan por Edge Functions.

Controles principales:

- RLS habilitado en las tablas comunitarias;
- permisos directos revocados para `anon` y `authenticated`;
- `service_role` únicamente en Edge Functions;
- límites de longitud y de frecuencia;
- contenido de usuario escapado en el cliente;
- validación del servidor contra HTML/JavaScript ejecutable y patrones de inyección;
- tamaño máximo de payload y lista de acciones permitidas;
- reportes comunitarios;
- CI con pruebas básicas de seguridad.

Consulta [`SECURITY.md`](SECURITY.md) para el modelo de seguridad completo.

## Arquitectura

La interfaz principal continúa siendo ligera y compatible con GitHub Pages:

- `index.html` — estructura principal.
- `styles.css` — diseño base.
- `hero-fix.css` — encuadre responsive de la portada.
- `atlas-v2.css` — mejoras editoriales del Atlas.
- `community-v2.css` — estilos del hub comunitario.
- `ranking.js` — comparación general.
- `specialties.js` — especialidades.
- `directory.js` — catálogo mundial.
- `ui.js` — interacción principal.
- `atlas-v2.js` — jerarquía, búsqueda enriquecida, noticias e i18n dinámico.
- `atlas-copy.js` — traducción de copia estática.
- `community.js` — chat, debates, likes, identidad, reportes y recordatorio 24 h.
- `data/news.json` — edición visible del Radar IA.
- `scripts/` — automatizaciones y validaciones.
- `supabase/schema.sql` — esquema comunitario de referencia.
- `supabase/functions/` — Edge Functions del backend.
- `manifest.webmanifest` + `sw.js` — instalación como PWA.

## Radar IA · Actualidad

El workflow `.github/workflows/radar.yml` ejecuta diariamente `scripts/update-radar.mjs` y aplica este flujo:

**buscar → recopilar → eliminar duplicados → clasificar → seleccionar → publicar**

El Atlas resume y enlaza las fuentes; no copia artículos completos.

## Seguridad y calidad

`.github/workflows/quality.yml` comprueba:

- sintaxis JavaScript;
- estructura de datos;
- manifiesto PWA;
- smoke tests de seguridad comunitaria.

La comunidad trata los mensajes como texto. Incluso si alguien intenta introducir etiquetas o código, la interfaz escapa la salida y el servidor bloquea patrones ejecutables o de inyección considerados de alto riesgo.

## Ejecutar localmente

No requiere instalación de dependencias para la interfaz principal.

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000`.

## Uso de inteligencia artificial durante el desarrollo

Utilicé herramientas de inteligencia artificial como apoyo para investigación, estructuración de información, diseño, revisión, seguridad y desarrollo. La dirección del proyecto, objetivos, criterios de organización y decisiones finales forman parte de mi trabajo sobre el Atlas.

---

**DS · AI WORLD ATLAS**  
Investigación, análisis y desarrollo por David Spencer.  
Ingeniero de Sistemas · Universidad Nacional Abierta y a Distancia (UNAD)  
Desarrollador de Software · SENA  
[Tecnólogo en Gestión de Redes de Datos · SENA](https://zajuna.sena.edu.co/zajuna/course/view.php?id=77571)
