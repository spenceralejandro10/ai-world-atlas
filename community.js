/* Comunidad de AI World Atlas: métricas agregadas, like persistente y chat sin exponer visitor_id. */
(function(){
const mount=document.getElementById('communityMount');
const cfg=window.ATLAS_BACKEND;
if(!mount||!cfg||!cfg.url||!cfg.key||!window.supabase)return;
const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const VISITOR_KEY='aiWorldAtlasVisitorIdV1',LIKED_KEY='aiWorldAtlasLikedV1';
let visitorId=localStorage.getItem(VISITOR_KEY);if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem(VISITOR_KEY,visitorId)}
let chatChannel=null,chatPoll=null;
const COPY={
 es:{title:'Comunidad global',sub:'Estadísticas agregadas y respetuosas con la privacidad.',visitors:'Visitantes',online:'Conectados ahora',likes:'Me gusta',like:'♥ Me gusta el Atlas',liked:'♥ Ya te gusta',chat:'Abrir chat global',world:'Visitantes del mundo',chatTitle:'Chat global',alias:'Alias temporal',message:'Escribe un mensaje',send:'Enviar',guest:'Visitante',empty:'Aún no hay mensajes.',error:'No se pudo conectar con la comunidad.',rate:'Espera unos segundos antes de enviar otro mensaje.'},
 en:{title:'Global community',sub:'Aggregated statistics designed to preserve privacy.',visitors:'Visitors',online:'Online now',likes:'Likes',like:'♥ Like the Atlas',liked:'♥ Liked',chat:'Open global chat',world:'Visitors around the world',chatTitle:'Global chat',alias:'Temporary alias',message:'Write a message',send:'Send',guest:'Visitor',empty:'No messages yet.',error:'Community services are unavailable.',rate:'Wait a few seconds before sending another message.'},
 fil:{title:'Pandaigdigang komunidad',sub:'Pinagsama-samang statistics na idinisenyo para sa privacy.',visitors:'Mga bisita',online:'Online ngayon',likes:'Mga like',like:'♥ Gusto ko ang Atlas',liked:'♥ Nagustuhan mo na',chat:'Buksan ang global chat',world:'Mga bisita mula sa mundo',chatTitle:'Global chat',alias:'Pansamantalang alias',message:'Sumulat ng mensahe',send:'Ipadala',guest:'Bisita',empty:'Wala pang mensahe.',error:'Hindi available ang community service.',rate:'Maghintay ng ilang segundo bago muling magpadala.'}
};
function lang(){return localStorage.getItem('aiWorldAtlasLanguageV1')||'es'}
function t(k){return (COPY[lang()]||COPY.es)[k]||k}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function invoke(action,extra={}){const {data,error}=await client.functions.invoke('atlas-community',{body:{action,...extra}});if(error)throw error;return data||{}}
async function ping(){try{await client.functions.invoke('atlas-visit',{body:{visitor_id:visitorId}})}catch(_e){console.warn('Atlas visit unavailable')}}

async function loadStats(){
 try{
  const data=await invoke('stats');const total=Number(data.visitors_total||0),online=Number(data.visitors_online||0),likes=Number(data.likes_total||0),liked=localStorage.getItem(LIKED_KEY)==='1';
  mount.innerHTML=`<div class="communityPanel"><h3>${t('title')}</h3><p class="sub">${t('sub')}</p><div class="communityGrid"><div class="communityMetric"><b>${total}</b><span>${t('visitors')}</span></div><div class="communityMetric"><b>${online}</b><span>${t('online')}</span></div><div class="communityMetric"><b>${likes}</b><span>♥ ${t('likes')}</span></div></div><div class="cardActionRow"><button class="secondaryBtn" id="atlasLikeBtn" ${liked?'disabled':''}>${liked?t('liked'):t('like')}</button><button class="secondaryBtn" id="atlasChatBtn">${t('chat')}</button></div><div id="atlasGeo"></div><div id="atlasChat" style="display:none"></div></div>`;
  document.getElementById('atlasLikeBtn')?.addEventListener('click',likeSite);document.getElementById('atlasChatBtn')?.addEventListener('click',openChat);renderGeo(data.geo||[]);
 }catch(e){console.warn('Community stats unavailable',e);mount.innerHTML=`<div class="communityPanel"><p class="sub">${t('error')}</p></div>`}
}
function renderGeo(data){const box=document.getElementById('atlasGeo');if(!box||!data.length)return;box.innerHTML=`<div class="detailBlock"><h4>${t('world')}</h4>${data.map(x=>`<div class="weight"><div><strong>${esc(x.continent)}</strong><div class="bar"><span style="width:${Math.max(0,Math.min(100,Number(x.percentage)||0))}%"></span></div></div><b>${Number(x.percentage||0).toFixed(0)}%</b></div>`).join('')}</div>`}
async function likeSite(){if(localStorage.getItem(LIKED_KEY)==='1')return;try{await invoke('like',{visitor_id:visitorId});localStorage.setItem(LIKED_KEY,'1');await loadStats()}catch(e){console.warn('Like unavailable',e)}}

async function openChat(){
 const box=document.getElementById('atlasChat');if(!box)return;box.style.display='block';
 box.innerHTML=`<div class="detailBlock"><h4>${t('chatTitle')}</h4><input id="chatAlias" maxlength="24" placeholder="${t('alias')}" class="chatInput"><div id="chatMessages" class="chatMessages"></div><div id="chatStatus" class="sub"></div><form id="chatForm"><input id="chatText" maxlength="500" autocomplete="off" placeholder="${t('message')}" class="chatInput"><button class="secondaryBtn">${t('send')}</button></form></div>`;
 document.getElementById('chatForm').onsubmit=sendMessage;await loadMessages();
 if(!chatChannel){chatChannel=client.channel('atlas-chat-live').on('broadcast',{event:'message'},()=>loadMessages()).subscribe()}
 if(!chatPoll)chatPoll=setInterval(loadMessages,5000);
}
async function loadMessages(){
 try{const data=await invoke('messages'),rows=data.messages||[],box=document.getElementById('chatMessages');if(!box)return;box.innerHTML=rows.length?rows.slice().reverse().map(m=>`<p><b>${esc(m.alias)}</b> <span>${esc(m.message)}</span></p>`).join(''):`<p class="sub">${t('empty')}</p>`;box.scrollTop=box.scrollHeight}catch(_e){}
}
async function sendMessage(e){
 e.preventDefault();const alias=(document.getElementById('chatAlias')?.value||t('guest')).trim().slice(0,24)||t('guest'),input=document.getElementById('chatText'),status=document.getElementById('chatStatus'),message=(input?.value||'').trim().slice(0,500);if(!message)return;const button=e.currentTarget.querySelector('button');if(button)button.disabled=true;if(status)status.textContent='';
 try{await invoke('send',{visitor_id:visitorId,alias,message});if(input)input.value='';await loadMessages();try{await chatChannel?.send({type:'broadcast',event:'message',payload:{updated:true}})}catch(_e){}}catch(err){if(status)status.textContent=String(err?.message||'').includes('429')?t('rate'):t('error')}finally{if(button)setTimeout(()=>{button.disabled=false},3200)}
}
document.addEventListener('click',e=>{if(e.target?.matches?.('.langBtn'))setTimeout(loadStats,0)});
ping();loadStats();setInterval(ping,60000);setInterval(loadStats,60000);
})();
