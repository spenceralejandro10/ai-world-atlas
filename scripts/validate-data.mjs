import fs from 'node:fs';
const required=['ranking.js','specialties.js','directory.js','ui.js','atlas-v2.js','app.js','index.html','styles.css','atlas-v2.css','data/news.json'];
let ok=true;
for(const f of required){if(!fs.existsSync(f)){console.error('Falta archivo:',f);ok=false}}
try{
  const news=JSON.parse(fs.readFileSync('data/news.json','utf8'));
  if(!Array.isArray(news.items))throw new Error('items no es array');
  const seen=new Set();
  for(const [i,n] of news.items.entries()){
    for(const k of ['title','summary','date','source','url'])if(!n[k]){console.error(`Noticia ${i} sin ${k}`);ok=false}
    if(n.url&&!/^https:\/\//.test(n.url)){console.error('URL no segura:',n.url);ok=false}
    const key=(n.title||'').toLowerCase().trim();if(seen.has(key)){console.error('Noticia duplicada:',n.title);ok=false}seen.add(key);
  }
}catch(e){console.error('news.json inválido:',e.message);ok=false}
if(!ok)process.exit(1);
console.log('Validación correcta');
