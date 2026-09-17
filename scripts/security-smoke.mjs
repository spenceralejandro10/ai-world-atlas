import fs from 'node:fs';

function must(condition,message){if(!condition){console.error('SECURITY CHECK FAILED:',message);process.exit(1)}}
const index=fs.readFileSync('index.html','utf8');
const community=fs.readFileSync('community.js','utf8');
const edge=fs.readFileSync('supabase/functions/atlas-community/index.ts','utf8');
const schema=fs.readFileSync('supabase/schema.sql','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));

must(index.includes('Content-Security-Policy'),'Falta Content-Security-Policy');
must(index.includes("object-src 'none'"),'CSP debe bloquear object/embed');
must(index.includes('community-v2.css'),'Falta stylesheet de comunidad');
must(community.includes('function esc('),'El cliente debe escapar contenido antes de insertarlo en HTML');
must(!community.includes('eval('),'No se permite eval() en el cliente comunitario');
must(edge.includes('unsafeContent'),'La Edge Function debe validar payloads peligrosos');
must(edge.includes('MAX_BODY_BYTES'),'La Edge Function debe limitar tamaño de payload');
must(edge.includes("'origin_not_allowed'"),'La Edge Function debe limitar orígenes web');
must(edge.includes('union\\s+'),'La protección debe contemplar UNION SELECT');
must(schema.includes('alter table public.forum_topics enable row level security'),'forum_topics debe tener RLS');
must(schema.includes('revoke all on public.forum_topics from anon, authenticated'),'forum_topics no debe exponerse directamente');
must(manifest.display==='standalone','El manifiesto PWA debe ser standalone');

console.log('Security smoke checks: OK');