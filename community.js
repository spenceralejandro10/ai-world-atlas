/* Chat en vivo de AI World Atlas. Flotante, anónimo y separado del diseño principal. */
(function(){
const mount=document.getElementById('communityMount');
const cfg=window.ATLAS_BACKEND;
if(mount)mount.style.display='none';
if(!cfg||!cfg.url||!cfg.key||!window.supabase)return;

const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const VISITOR_KEY='aiWorldAtlasVisitorIdV1';
const LIKED_KEY='aiWorldAtlasLikedV1';
const PROFILE_KEY='aiWorldAtlasChatProfileV1';
let visitorId=localStorage.getItem(VISITOR_KEY);if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem(VISITOR_KEY,visitorId)}
let profile=readProfile();
let pendingGender=profile?.gender||'';
let messages=[];
let hasMore=false;
let oldestCursor=null;
let chatPoll=null;
let chatChannel=null;

const COPY={
 es:{space:'ESPACIO PERSONAL',title:'Chat en vivo',community:'Comunidad AI World Atlas',visitors:'Visitantes',online:'Conectados',likes:'Me gusta',welcome:'Chat anónimo y divertido',welcomeText:'Mira la conversación libremente. Para escribir solo elige si eres chico o chica y usa un apodo.',boy:'Chico',girl:'Chica',nickname:'Apodo (opcional)',random:'🎲 Nombre al azar',enter:'Entrar anónimo',choose:'Elige Chico o Chica para entrar.',change:'Cambiar',anonymous:'Anónimo',older:'Cargar mensajes anteriores',empty:'Todavía no hay mensajes. Puedes ser la primera persona en escribir.',placeholder:'Escribe un mensaje…',send:'Enviar',sending:'Enviando…',sent:'Enviado ✓',error:'No se pudo enviar. Inténtalo otra vez.',rate:'Espera unos segundos antes de enviar otro mensaje.',history:'El historial se conserva.',like:'♥',close:'Cerrar chat'},
 en:{space:'PERSONAL SPACE',title:'Live chat',community:'AI World Atlas Community',visitors:'Visitors',online:'Online',likes:'Likes',welcome:'Anonymous and fun chat',welcomeText:'Browse the conversation freely. To write, simply choose boy or girl and use a nickname.',boy:'Boy',girl:'Girl',nickname:'Nickname (optional)',random:'🎲 Random name',enter:'Enter anonymously',choose:'Choose Boy or Girl to enter.',change:'Change',anonymous:'Anonymous',older:'Load earlier messages',empty:'There are no messages yet. You can be the first to write.',placeholder:'Write a message…',send:'Send',sending:'Sending…',sent:'Sent ✓',error:'Could not send. Try again.',rate:'Wait a few seconds before sending another message.',history:'Chat history is kept.',like:'♥',close:'Close chat'},
 fil:{space:'PERSONAL NA ESPASYO',title:'Live chat',community:'Komunidad ng AI World Atlas',visitors:'Mga bisita',online:'Online',likes:'Mga like',welcome:'Anonymous at masayang chat',welcomeText:'Maaari mong basahin ang usapan. Para magsulat, piliin lang kung lalaki o babae at gumamit ng palayaw.',boy:'Lalaki',girl:'Babae',nickname:'Palayaw (opsyonal)',random:'🎲 Random na pangalan',enter:'Pumasok nang anonymous',choose:'Piliin ang Lalaki o Babae.',change:'Palitan',anonymous:'Anonymous',older:'I-load ang mas lumang mensahe',empty:'Wala pang mensahe. Maaari kang mauna.',placeholder:'Sumulat ng mensahe…',send:'Ipadala',sending:'Ipinapadala…',sent:'Naipadala ✓',error:'Hindi naipadala. Subukan muli.',rate:'Maghintay ng ilang segundo bago muling magpadala.',history:'Nananatili ang chat history.',like:'♥',close:'Isara ang chat'}
};
const RANDOM_NAMES=['PixelNómada','AstroLince','ByteAzul','NeónCoder','LunaDigital','CiberPanda','NubeCuriosa','QuantumFox','DataGato','RobotCafé','NovaPixel','EcoByte','MenteNube','AtlasNauta','CódigoLunar','VectorZen','AIExplorer','BitViajero'];
const EMOJIS=['😀','😂','😍','🤩','😎','🤖','👋','🔥','✨','💙','❤️','👍','👏','🚀','🌎','💡','🧠','🎉','😅','🤔','👀','🙌','💻','🎨'];

function lang(){return localStorage.getItem('aiWorldAtlasLanguageV1')||'es'}
function t(k){return (COPY[lang()]||COPY.es)[k]||k}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function readProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return p&&['boy','girl'].includes(p.gender)&&p.alias?{gender:p.gender,alias:String(p.alias).slice(0,24)}:null}catch(_e){return null}}
function saveProfile(p){profile=p;pendingGender=p.gender;localStorage.setItem(PROFILE_KEY,JSON.stringify(p))}
function randomName(){return RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)]}
function avatar(g){return g==='girl'?'👩':g==='boy'?'👨':'🙂'}
function formatTime(value){try{const d=new Date(value);const sameDay=d.toDateString()===new Date().toDateString();return new Intl.DateTimeFormat(lang()==='en'?'en-US':lang()==='fil'?'fil-PH':'es-CO',sameDay?{hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d)}catch(_e){return ''}}
async function invoke(action,extra={}){const {data,error}=await client.functions.invoke('atlas-community',{body:{action,...extra}});if(error)throw error;return data||{}}
async function ping(){try{await client.functions.invoke('atlas-visit',{body:{visitor_id:visitorId}})}catch(_e){}}

function createUI(){
 document.body.insertAdjacentHTML('beforeend',`
 <button class="chatLiveFloating" id="chatLiveFloating" aria-label="${esc(t('title'))}"><span class="chatLiveDot"></span><b>💬 ${esc(t('title'))}</b><em id="chatLiveOnline">…</em></button>
 <div class="chatLiveBackdrop" id="chatLiveBackdrop"></div>
 <aside class="chatLivePanel" id="chatLivePanel" aria-hidden="true">
  <div class="chatLiveHeader">
   <div class="chatLiveHeaderIcon">👥</div>
   <div><span>${esc(t('space'))}</span><h2>${esc(t('title'))}</h2><small><i></i>${esc(t('community'))}</small></div>
   <button class="chatLiveClose" id="chatLiveClose" aria-label="${esc(t('close'))}">×</button>
  </div>
  <div class="chatLiveStats">
   <button class="chatStat"><b id="chatVisitors">—</b><span>👁 ${esc(t('visitors'))}</span></button>
   <button class="chatStat"><b id="chatOnline">—</b><span>🟢 ${esc(t('online'))}</span></button>
   <button class="chatStat" id="chatLikeBtn"><b id="chatLikes">—</b><span>♥ ${esc(t('likes'))}</span></button>
  </div>
  <div id="chatProfileArea"></div>
  <div class="chatRoomBar"><div><span class="chatRoomIcon">💬</span><strong>Sala general</strong></div><span><i></i><b id="chatRoomOnline">0</b></span></div>
  <div class="chatMessages" id="chatMessages"><div class="chatLoading">Cargando conversación…</div></div>
  <div class="chatComposerArea" id="chatComposerArea"></div>
  <div class="chatLiveFoot"><span>💾 ${esc(t('history'))}</span><span>😊 Emojis · 🔒 Sin cuenta</span></div>
 </aside>`);
 document.getElementById('chatLiveFloating').addEventListener('click',openPanel);
 document.getElementById('chatLiveClose').addEventListener('click',closePanel);
 document.getElementById('chatLiveBackdrop').addEventListener('click',closePanel);
 document.getElementById('chatLikeBtn').addEventListener('click',likeSite);
 renderProfile();renderComposer();loadStats();loadMessages(true);
}
function openPanel(){const panel=document.getElementById('chatLivePanel');panel.classList.add('show');panel.setAttribute('aria-hidden','false');document.getElementById('chatLiveBackdrop').classList.add('show');loadMessages(true);if(!chatPoll)chatPoll=setInterval(()=>loadMessages(true,true),5000);if(!chatChannel){chatChannel=client.channel('atlas-chat-live').on('broadcast',{event:'message'},()=>loadMessages(true,true)).subscribe()}}
function closePanel(){document.getElementById('chatLivePanel')?.classList.remove('show');document.getElementById('chatLivePanel')?.setAttribute('aria-hidden','true');document.getElementById('chatLiveBackdrop')?.classList.remove('show')}

function renderProfile(){
 const box=document.getElementById('chatProfileArea');if(!box)return;
 if(profile){box.innerHTML=`<div class="chatIdentity"><div class="chatIdentityAvatar ${profile.gender}">${avatar(profile.gender)}</div><div><span>${esc(t('anonymous'))}</span><strong>${esc(profile.alias)}</strong></div><button id="chatChangeProfile">${esc(t('change'))}</button></div>`;document.getElementById('chatChangeProfile').onclick=()=>{profile=null;localStorage.removeItem(PROFILE_KEY);pendingGender='';renderProfile();renderComposer()};return}
 box.innerHTML=`<div class="chatJoin"><div class="chatJoinIntro"><span>✨</span><div><strong>${esc(t('welcome'))}</strong><p>${esc(t('welcomeText'))}</p></div></div><div class="chatGender"><button class="chatGenderBtn ${pendingGender==='boy'?'active boy':''}" data-gender="boy">👨 ${esc(t('boy'))}</button><button class="chatGenderBtn ${pendingGender==='girl'?'active girl':''}" data-gender="girl">👩 ${esc(t('girl'))}</button></div><div class="chatAliasRow"><input id="chatAliasInput" maxlength="24" autocomplete="off" placeholder="${esc(t('nickname'))}"><button id="chatRandomName">${esc(t('random'))}</button></div><button class="chatEnterBtn" id="chatEnterBtn">${esc(t('enter'))} →</button><div class="chatJoinStatus" id="chatJoinStatus"></div></div>`;
 box.querySelectorAll('.chatGenderBtn').forEach(btn=>btn.addEventListener('click',()=>{pendingGender=btn.dataset.gender;renderProfile()}));
 document.getElementById('chatRandomName').onclick=()=>{document.getElementById('chatAliasInput').value=randomName()};
 document.getElementById('chatEnterBtn').onclick=()=>{const status=document.getElementById('chatJoinStatus');if(!pendingGender){status.textContent=t('choose');return}const input=document.getElementById('chatAliasInput'),alias=(input?.value||'').trim().slice(0,24)||randomName();saveProfile({gender:pendingGender,alias});renderProfile();renderComposer();setTimeout(()=>document.getElementById('chatText')?.focus(),0)};
}
function renderComposer(){
 const box=document.getElementById('chatComposerArea');if(!box)return;
 if(!profile){box.innerHTML=`<button class="chatLockedComposer" id="chatLockedComposer">🔒 ${esc(t('enter'))}</button>`;document.getElementById('chatLockedComposer').onclick=()=>document.getElementById('chatProfileArea')?.scrollIntoView({behavior:'smooth',block:'nearest'});return}
 box.innerHTML=`<div class="emojiTray" id="emojiTray">${EMOJIS.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div><form class="chatComposer" id="chatForm"><button type="button" class="emojiToggle" id="emojiToggle">😊</button><input id="chatText" maxlength="500" autocomplete="off" placeholder="${esc(t('placeholder'))}"><button class="chatSendBtn" id="chatSendBtn">➤ <span>${esc(t('send'))}</span></button></form><div class="chatSendStatus" id="chatSendStatus"></div>`;
 document.getElementById('chatForm').onsubmit=sendMessage;
 document.getElementById('emojiToggle').onclick=()=>document.getElementById('emojiTray').classList.toggle('show');
 document.querySelectorAll('#emojiTray [data-emoji]').forEach(btn=>btn.onclick=()=>{const input=document.getElementById('chatText');const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.value=input.value.slice(0,start)+btn.dataset.emoji+input.value.slice(end);input.focus();input.selectionStart=input.selectionEnd=start+btn.dataset.emoji.length});
}

async function loadStats(){try{const data=await invoke('stats');const visitors=Number(data.visitors_total||0),online=Number(data.visitors_online||0),likes=Number(data.likes_total||0);document.getElementById('chatVisitors').textContent=visitors.toLocaleString();document.getElementById('chatOnline').textContent=online.toLocaleString();document.getElementById('chatLikes').textContent=likes.toLocaleString();document.getElementById('chatRoomOnline').textContent=online.toLocaleString();document.getElementById('chatLiveOnline').textContent=`${online} en vivo`;document.getElementById('chatLikeBtn')?.classList.toggle('liked',localStorage.getItem(LIKED_KEY)==='1')}catch(_e){document.getElementById('chatLiveOnline').textContent='en vivo'}}
async function likeSite(){if(localStorage.getItem(LIKED_KEY)==='1')return;try{await invoke('like',{visitor_id:visitorId});localStorage.setItem(LIKED_KEY,'1');await loadStats()}catch(_e){}}

async function loadMessages(reset=true,silent=false){
 const box=document.getElementById('chatMessages');if(!box)return;
 try{
  if(reset){const data=await invoke('messages');const rows=data.messages||[];messages=rows.slice().reverse();hasMore=Boolean(data.has_more);oldestCursor=messages[0]?.created_at||null;renderMessages(!silent)}
  else if(oldestCursor){const beforeHeight=box.scrollHeight;const data=await invoke('messages',{before:oldestCursor});const older=(data.messages||[]).slice().reverse();messages=[...older,...messages];hasMore=Boolean(data.has_more);oldestCursor=messages[0]?.created_at||oldestCursor;renderMessages(false);box.scrollTop=box.scrollHeight-beforeHeight}
 }catch(_e){if(!silent&&messages.length===0)box.innerHTML=`<div class="chatEmpty">⚠️ ${esc(t('error'))}</div>`}
}
function renderMessages(scrollToBottom=true){
 const box=document.getElementById('chatMessages');if(!box)return;
 const oldTop=box.scrollTop;
 let html=hasMore?`<button class="chatLoadOlder" id="chatLoadOlder">↑ ${esc(t('older'))}</button>`:'';
 if(!messages.length)html+=`<div class="chatEmpty">💬 ${esc(t('empty'))}</div>`;
 else html+=messages.map(m=>`<div class="chatMessage"><div class="chatAvatar ${esc(m.gender||'anon')}">${avatar(m.gender)}</div><div class="chatBubble"><div class="chatMessageMeta"><strong>${esc(m.alias)}</strong><time>${esc(formatTime(m.created_at))}</time></div><p>${esc(m.message)}</p></div></div>`).join('');
 box.innerHTML=html;document.getElementById('chatLoadOlder')?.addEventListener('click',()=>loadMessages(false));if(scrollToBottom)box.scrollTop=box.scrollHeight;else box.scrollTop=oldTop;
}
async function sendMessage(e){
 e.preventDefault();if(!profile){renderProfile();return}
 const input=document.getElementById('chatText'),button=document.getElementById('chatSendBtn'),status=document.getElementById('chatSendStatus'),message=(input?.value||'').trim().slice(0,500);if(!message)return;
 button.disabled=true;status.textContent=t('sending');status.className='chatSendStatus sending';
 try{await invoke('send',{visitor_id:visitorId,alias:profile.alias,gender:profile.gender,message});input.value='';status.textContent=t('sent');status.className='chatSendStatus sent';await loadMessages(true);try{await chatChannel?.send({type:'broadcast',event:'message',payload:{updated:true}})}catch(_e){}setTimeout(()=>{if(status.textContent===t('sent'))status.textContent=''},1800)}catch(err){status.textContent=String(err?.message||'').includes('429')?t('rate'):t('error');status.className='chatSendStatus error'}finally{button.disabled=false;input?.focus()}
}

document.addEventListener('click',e=>{if(e.target?.matches?.('.langBtn'))setTimeout(()=>location.reload(),80)});
createUI();ping();setInterval(ping,60000);setInterval(loadStats,30000);
})();
