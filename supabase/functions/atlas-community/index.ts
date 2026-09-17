import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://spenceralejandro10.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
])

function corsHeaders(req:Request){
  const origin=req.headers.get('origin')||''
  const allowOrigin=ALLOWED_ORIGINS.has(origin)?origin:'https://spenceralejandro10.github.io'
  return {
    'content-type':'application/json',
    'access-control-allow-origin':allowOrigin,
    'access-control-allow-headers':'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods':'POST, OPTIONS',
    'vary':'origin'
  }
}
function validUuid(v:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function cleanText(v:unknown,max:number){return String(v??'').replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,max)}

Deno.serve(async(req)=>{
  const headers=corsHeaders(req)
  if(req.method==='OPTIONS')return new Response('ok',{headers})
  if(req.method!=='POST')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers})
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try{
    const body=await req.json();const action=String(body?.action||'stats')
    if(action==='stats'){
      const onlineSince=new Date(Date.now()-120000).toISOString()
      const [visitors,online,likes,continents]=await Promise.all([
        client.from('visitor_sessions').select('*',{count:'exact',head:true}),
        client.from('visitor_sessions').select('*',{count:'exact',head:true}).gt('last_seen',onlineSince),
        client.from('site_likes').select('*',{count:'exact',head:true}),
        client.from('visitor_sessions').select('continent').range(0,9999)
      ])
      if(visitors.error||online.error||likes.error||continents.error)throw new Error('stats_failed')
      const counts:Record<string,number>={};for(const row of continents.data||[]){const c=String(row.continent||'Desconocido');counts[c]=(counts[c]||0)+1}
      const totalGeo=Math.max(1,Object.values(counts).reduce((a,b)=>a+b,0))
      const geo=Object.entries(counts).map(([continent,n])=>({continent,percentage:Math.round((n/totalGeo)*1000)/10})).sort((a,b)=>b.percentage-a.percentage)
      return new Response(JSON.stringify({visitors_total:visitors.count||0,visitors_online:online.count||0,likes_total:likes.count||0,geo}),{headers})
    }
    if(action==='like'){
      const visitorId=String(body?.visitor_id||'');if(!validUuid(visitorId))return new Response(JSON.stringify({error:'invalid_visitor'}),{status:400,headers})
      const {error}=await client.from('site_likes').insert({visitor_id:visitorId});if(error&&error.code!=='23505')throw error
      return new Response(JSON.stringify({ok:true}),{headers})
    }
    if(action==='messages'){
      const since=new Date(Date.now()-7*86400000).toISOString();const {data,error}=await client.from('chat_messages').select('alias,message,created_at').gt('created_at',since).order('created_at',{ascending:false}).limit(40);if(error)throw error
      return new Response(JSON.stringify({messages:data||[]}),{headers})
    }
    if(action==='send'){
      const visitorId=String(body?.visitor_id||'');if(!validUuid(visitorId))return new Response(JSON.stringify({error:'invalid_visitor'}),{status:400,headers})
      const alias=cleanText(body?.alias,24)||'Visitante',message=cleanText(body?.message,500);if(!message)return new Response(JSON.stringify({error:'empty_message'}),{status:400,headers})
      const {error}=await client.from('chat_messages').insert({visitor_id:visitorId,alias,message});if(error){const rate=String(error.message||'').includes('rate_limited');return new Response(JSON.stringify({error:rate?'rate_limited':'send_failed'}),{status:rate?429:400,headers})}
      return new Response(JSON.stringify({ok:true}),{headers})
    }
    return new Response(JSON.stringify({error:'unknown_action'}),{status:400,headers})
  }catch(_e){return new Response(JSON.stringify({error:'community_unavailable'}),{status:500,headers})}
})
