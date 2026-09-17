/* Ajustes finales no invasivos del Atlas. */
(function(){
function ensureHead(){
 if(!document.querySelector('link[rel="manifest"]')){const m=document.createElement('link');m.rel='manifest';m.href='manifest.webmanifest?v=20260917-1';document.head.appendChild(m)}
 if(!document.querySelector('meta[name="theme-color"]')){const t=document.createElement('meta');t.name='theme-color';t.content='#0f70d8';document.head.appendChild(t)}
}
function polishFooter(){const f=document.querySelector('footer .wrap');if(!f)return;f.innerHTML='<strong>DS · AI WORLD ATLAS</strong><br>Investigación, análisis y desarrollo por David Spencer<br><span class="footerStudies">Ingeniero de Sistemas · Universidad Nacional Abierta y a Distancia (UNAD) &nbsp;|&nbsp; Desarrollador de Software · SENA &nbsp;|&nbsp; <a href="https://zajuna.sena.edu.co/zajuna/course/view.php?id=77571" target="_blank" rel="noopener noreferrer">Tecnólogo en Gestión de Redes de Datos · SENA</a></span><br><span style="display:inline-block;margin-top:7px">Edición 2026 · Catálogo tecnológico independiente y ampliable.</span>';}
function a11y(){document.querySelectorAll('button:not([type])').forEach(b=>b.type='button');document.querySelectorAll('a[target="_blank"]').forEach(a=>{const rel=new Set((a.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');a.rel=[...rel].join(' ')})}
ensureHead();polishFooter();a11y();
})();