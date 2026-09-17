import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const COUNTRY_TO_CONTINENT: Record<string,string> = {
  AR:'América del Sur',BO:'América del Sur',BR:'América del Sur',CL:'América del Sur',CO:'América del Sur',EC:'América del Sur',GF:'América del Sur',GY:'América del Sur',PE:'América del Sur',PY:'América del Sur',SR:'América del Sur',UY:'América del Sur',VE:'América del Sur',
  CA:'América del Norte',US:'América del Norte',MX:'América del Norte',
  GB:'Europa',IE:'Europa',ES:'Europa',PT:'Europa',FR:'Europa',DE:'Europa',IT:'Europa',NL:'Europa',BE:'Europa',CH:'Europa',AT:'Europa',PL:'Europa',CZ:'Europa',SK:'Europa',HU:'Europa',RO:'Europa',BG:'Europa',GR:'Europa',SE:'Europa',NO:'Europa',FI:'Europa',DK:'Europa',IS:'Europa',EE:'Europa',LV:'Europa',LT:'Europa',UA:'Europa',HR:'Europa',SI:'Europa',RS:'Europa',BA:'Europa',AL:'Europa',MK:'Europa',ME:'Europa',LU:'Europa',MT:'Europa',CY:'Europa',
  CN:'Asia',JP:'Asia',KR:'Asia',KP:'Asia',IN:'Asia',PK:'Asia',BD:'Asia',LK:'Asia',NP:'Asia',BT:'Asia',PH:'Asia',ID:'Asia',MY:'Asia',SG:'Asia',TH:'Asia',VN:'Asia',KH:'Asia',LA:'Asia',MM:'Asia',MN:'Asia',TW:'Asia',HK:'Asia',MO:'Asia',AE:'Asia',SA:'Asia',QA:'Asia',KW:'Asia',BH:'Asia',OM:'Asia',IL:'Asia',JO:'Asia',LB:'Asia',IQ:'Asia',IR:'Asia',TR:'Asia',KZ:'Asia',UZ:'Asia',KG:'Asia',TJ:'Asia',TM:'Asia',GE:'Asia',AM:'Asia',AZ:'Asia',
  ZA:'África',EG:'África',MA:'África',DZ:'África',TN:'África',LY:'África',NG:'África',GH:'África',KE:'África',ET:'África',TZ:'África',UG:'África',RW:'África',SN:'África',CI:'África',CM:'África',AO:'África',MZ:'África',ZW:'África',ZM:'África',BW:'África',NA:'África',MG:'África',MU:'África',
  AU:'Oceanía',NZ:'Oceanía',FJ:'Oceanía',PG:'Oceanía',WS:'Oceanía',TO:'Oceanía'
}

const ALLOWED_ORIGINS = new Set([
  'https://spenceralejandro10.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
])

function corsHeaders(req: Request){
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://spenceralejandro10.github.io'
  return {
    'content-type':'application/json',
    'access-control-allow-origin':allowOrigin,
    'access-control-allow-headers':'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods':'POST, OPTIONS',
    'vary':'origin'
  }
}

Deno.serve(async(req)=>{
  const headers = corsHeaders(req)
  if(req.method==='OPTIONS') return new Response('ok',{headers})
  if(req.method!=='POST') return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers})
  try{
    const body=await req.json()
    const visitorId=String(body?.visitor_id||'')
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)){
      return new Response(JSON.stringify({error:'invalid_visitor'}),{status:400,headers})
    }
    const country=(req.headers.get('cf-ipcountry')||req.headers.get('x-country')||'').toUpperCase()
    const continent=COUNTRY_TO_CONTINENT[country]||'Desconocido'
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const {error}=await client.from('visitor_sessions').upsert({visitor_id:visitorId,continent,last_seen:new Date().toISOString()},{onConflict:'visitor_id'})
    if(error) throw error
    return new Response(JSON.stringify({ok:true,continent}),{headers})
  }catch(_e){
    return new Response(JSON.stringify({error:'visit_unavailable'}),{status:500,headers})
  }
})
