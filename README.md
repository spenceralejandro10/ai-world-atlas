# AI World Atlas

**AI World Atlas** es un proyecto personal de David Spencer para estudiar, comparar y comprender el ecosistema mundial de inteligencia artificial sin mezclar categorías técnicamente distintas.

La idea central es ayudar a una persona que empieza en IA a recorrer este camino:

**DESCUBRIR → ENTENDER → COMPARAR → ELEGIR → APRENDER → MANTENERSE ACTUALIZADO**

La plataforma distingue entre quienes desarrollan la tecnología base y quienes construyen productos sobre ella.

## Jerarquía editorial

El Atlas organiza el ecosistema en tres niveles principales:

1. **Laboratorios y ecosistemas de IA**: organizaciones con investigación, modelos, infraestructura, APIs o ecosistemas propios relevantes.
2. **Modelos y productos oficiales**: modelos fundacionales, asistentes y productos creados por esas organizaciones.
3. **Aplicaciones con inteligencia artificial**: productos especializados que pueden utilizar modelos propios o de terceros.

Una interfaz de chat atractiva no se trata automáticamente como un laboratorio líder. Cuando una aplicación depende principalmente de modelos externos, el Atlas intenta indicarlo de forma explícita.

## Funciones actuales

- Cobertura mundial por organizaciones, países y regiones.
- Sección prioritaria de laboratorios y ecosistemas.
- Comparación orientativa de asistentes de propósito general.
- Comparativas por especialidad.
- Directorio con búsqueda por nombre, empresa, país, capacidad y necesidades expresadas en lenguaje natural.
- Sección separada para aplicaciones con IA.
- Enlaces directos a sitios oficiales.
- Favoritos y descartados persistentes en el navegador.
- Panel lateral **Mis IA de trabajo**.
- **Radar IA · Actualidad** con noticias estructuradas y enlaces a las fuentes.
- Actualización automática diaria del Radar mediante GitHub Actions.
- Relación entre noticias y fichas del directorio.
- Selector de idioma **ES / EN / FIL** en una sola aplicación.
- Explicaciones sencillas de laboratorio, modelo, producto y aplicación con IA.
- Validaciones automáticas de sintaxis y datos mediante GitHub Actions.

## Radar IA · Actualidad

`data/news.json` contiene la edición visible del Radar.

El workflow `.github/workflows/radar.yml` ejecuta diariamente `scripts/update-radar.mjs`, que intenta:

**buscar → recopilar → eliminar duplicados → clasificar → seleccionar → publicar**

La selección utiliza señales de actualidad, relevancia temática, laboratorio relacionado y prioridad de fuente. El script conserva la edición anterior si no consigue suficientes resultados nuevos, evitando reemplazar el Radar con información insuficiente.

El Atlas resume y enlaza; no copia artículos completos.

## Arquitectura

La aplicación sigue siendo ligera y compatible con GitHub Pages:

- `index.html` — estructura principal.
- `styles.css` — diseño base.
- `hero-fix.css` — encuadre responsive de la portada.
- `atlas-v2.css` — mejoras incrementales del Atlas.
- `ranking.js` — comparación general.
- `specialties.js` — especialidades.
- `directory.js` — catálogo principal.
- `ui.js` — comportamiento original de interfaz.
- `atlas-v2.js` — jerarquía, búsqueda por necesidades, fichas enriquecidas, noticias e i18n dinámico.
- `atlas-copy.js` — traducción de copia estática.
- `community.js` — cliente opcional para comunidad y estadísticas reales.
- `data/news.json` — Radar IA.
- `scripts/` — automatizaciones y validaciones.
- `supabase/` — esquema y función preparados para backend comunitario.

## Estadísticas, chat y “Me gusta” global

El repositorio incluye una arquitectura preparada para activar:

- visitantes totales reales;
- visitantes conectados;
- distribución agregada por continente;
- contador persistente de “Me gusta”;
- chat global con alias temporal;
- mensajes en tiempo real;
- controles básicos de privacidad y límites de longitud.

Estos datos **no se simulan**. Mientras no exista un proyecto backend dedicado, `backend.config.js` mantiene la integración desactivada y la interfaz pública no muestra cifras ficticias.

El esquema propuesto está en `supabase/schema.sql` y la función de registro agregado de visitas en `supabase/functions/atlas-visit/index.ts`. La función está diseñada para guardar únicamente continente aproximado y un identificador aleatorio del navegador; no guarda ni expone direcciones IP individuales ni ubicación precisa.

## Idiomas

La aplicación mantiene una sola base de código e incluye selector:

- Español
- English
- Filipino / Tagalog

La preferencia se recuerda mediante almacenamiento local del navegador.

## Favoritos

Las selecciones de **Mis IA de trabajo** se guardan localmente en el navegador con `localStorage`. No requieren cuenta y no se envían a un servidor.

## Criterio editorial

El proyecto evita presentar marketing como evidencia técnica. Cuando sea posible se priorizan:

1. documentación oficial;
2. publicaciones de laboratorios;
3. documentación técnica y científica;
4. benchmarks independientes;
5. medios tecnológicos reconocidos y agencias de noticias.

No considero que exista una única IA que sea la mejor para absolutamente todo. El Atlas intenta mostrar capacidad general y, por separado, fortalezas concretas como programación, investigación, razonamiento, imágenes, video, voz, agentes, modelos abiertos y ecosistema.

## Ejecutar localmente

No requiere instalación de dependencias para la interfaz principal.

1. Clona o descarga el repositorio.
2. Sirve la carpeta con un servidor HTTP local para que `fetch()` pueda leer `data/news.json`.

Por ejemplo:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000`.

## Validación

El workflow `.github/workflows/quality.yml` comprueba:

- sintaxis JavaScript;
- presencia de archivos esenciales;
- estructura de `data/news.json`;
- URLs HTTPS;
- noticias duplicadas.

También puedes ejecutar localmente:

```bash
node scripts/validate-data.mjs
```

## Uso de inteligencia artificial durante el desarrollo

Utilicé herramientas de inteligencia artificial como apoyo para investigación, estructuración de información, diseño, revisión y desarrollo. La dirección del proyecto, objetivos, criterios de organización y decisiones finales forman parte de mi trabajo sobre el Atlas.

---

**DS · AI WORLD ATLAS**  
Investigación, análisis y desarrollo por David Spencer.  
Ingeniero de Sistemas · Universidad Nacional Abierta y a Distancia (UNAD) · Desarrollador de Software · SENA.
