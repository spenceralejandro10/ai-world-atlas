import fs from 'node:fs/promises';

const OUT='data/news.json';
const queries=[
  'OpenAI OR Anthropic OR "Google DeepMind" artificial intelligence model',
  'DeepSeek OR Qwen OR Alibaba OR Zhipu OR GLM artificial intelligence model',
  'MiniMax OR Mistral OR xAI OR Grok artificial intelligence model',
  'AI agents coding multimodal voice robotics foundation model'
];
const prioritySources=['OpenAI','Anthropic','Google','DeepSeek','Alibaba Cloud','SpaceXAI','xAI','MiniMax','Mistral AI','Reuters','TechCrunch','The Verge','MIT Technology Review','Nature'];
const labs=['OpenAI','Anthropic','Google DeepMind','Gemini','DeepSeek','Qwen','Alibaba','Z.ai','Zhipu','GLM','MiniMax','Mistral','xAI','Grok','Meta','NVIDIA','Cohere','ByteDance','Seedance','Kimi','Moonshot'];
const categories=[
  ['Robótica',/robot|robotics|humanoid/i],['Voz',/voice|speech|audio|realtime/i],['Video',/video|seedance|wan|minimax h3/i],['Imagen',/image|vision|diffusion|firefly/i],['Programación y agentes',/agent|coding|code|software|computer use/i],['Modelos fundacionales',/model|llm|foundation|reasoning|multimodal/i],['Infraestructura',/chip|gpu|datacenter|data center|inference|training/i]
];
function decode(s=''){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function tag(block,name){const m=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'));return m?decode(m[1]):''}
function sourceFrom(block){const m=block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);return m?decode(m[1]):''}
function normalizeTitle(s){return s.toLowerCase().replace(/\s[-–—|].*$/,'').replace(/[^a-z0-9áéíóúüñ ]/gi,' ').replace(/\s+/g,' ').trim()}
function inferCompany(text){const t=text.toLowerCase();for(const lab of labs){if(t.includes(lab.toLowerCase()))return lab==='Gemini'?'Google DeepMind':lab==='Qwen'?'Alibaba':lab==='Grok'?'SpaceXAI / xAI':lab==='GLM'||lab==='Zhipu'?'Z.ai / Zhipu AI':lab}return ''}
function inferCategory(text){for(const [name,re] of categories)if(re.test(text))return name;return 'IA'}
function inferRegion(company){if(['DeepSeek','Alibaba','Z.ai / Zhipu AI','MiniMax','ByteDance','Kimi','Moonshot'].includes(company))return 'China / Asia';if(company==='Mistral')return 'Europa';return company?'Estados Unidos / Global':'Global'}
function score(item){let s=0;const ageDays=(Date.now()-new Date(item.date).getTime())/86400000;if(Number.isFinite(ageDays))s+=Math.max(0,30-ageDays);if(prioritySources.some(x=>item.source.toLowerCase().includes(x.toLowerCase())))s+=18;if(item.company)s+=12;if(/launch|introduc|release|model|agent|multimodal|reasoning|robot|voice|video|open source|open-weight/i.test(item.title))s+=12;if(/opinion|rumor|leak/i.test(item.title))s-=20;return s}
async function fetchQuery(q){const u=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;const r=await fetch(u,{headers:{'user-agent':'AI-World-Atlas-Radar/1.0'}});if(!r.ok)throw new Error(`RSS ${r.status}`);const xml=await r.text();return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>m[1])}
async function readPrevious(){try{return JSON.parse(await fs.readFile(OUT,'utf8'))}catch{return {items:[]}}}
const previous=await readPrevious();
let blocks=[];
for(const q of queries){try{blocks.push(...await fetchQuery(q))}catch(e){console.warn('Radar query failed:',q,e.message)}}
const items=blocks.map(block=>{
 const title=tag(block,'title');const url=tag(block,'link');const rawDate=tag(block,'pubDate');const source=sourceFrom(block)||'Fuente pública';const description=tag(block,'description');const company=inferCompany(`${title} ${description}`);const date=rawDate?new Date(rawDate).toISOString().slice(0,10):new Date().toISOString().slice(0,10);return {title,summary:description.slice(0,260),date,company,related:company,region:inferRegion(company),category:inferCategory(`${title} ${description}`),source,official:prioritySources.slice(0,8).some(x=>source.toLowerCase().includes(x.toLowerCase())),url};
}).filter(x=>x.title&&x.url);
const dedup=new Map();
for(const item of items){const k=normalizeTitle(item.title);if(!dedup.has(k)||score(item)>score(dedup.get(k)))dedup.set(k,item)}
let selected=[...dedup.values()].sort((a,b)=>score(b)-score(a)).slice(0,10);
if(selected.length<6){console.warn('Insufficient fresh items; preserving previous Radar data.');selected=previous.items||[]}
if(selected.length){await fs.mkdir('data',{recursive:true});await fs.writeFile(OUT,JSON.stringify({generatedAt:new Date().toISOString(),items:selected},null,2)+'\n')}
console.log(`Radar items: ${selected.length}`);
