import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const COUNTRY_TO_CONTINENT: Record<string,string> = {
  AR:'América del Sur',BO:'América del Sur',BR:'América del Sur',CL:'América del Sur',CO:'América del Sur',EC:'América del Sur',GF:'América del Sur',GY:'América del Sur',PE:'América del Sur',PY:'América del Sur',SR:'América del Sur',UY:'América del Sur',VE:'América del Sur',CA:'América del Norte',US:'América del Norte',MX:'América del Norte',
  GB:'Europa',IE:'Europa',ES:'Europa',PT:'Europa',FR:'Europa',DE:'Europa',IT:'Europa',NL:'Europa',BE:'Europa',CH:'Europa',AT:'Europa',PL:'Europa',CZ:'Europa',SK:'Europa',HU:'Europa',RO:'Europa',BG:'Europa',GR:'Europa',SE:'Europa',NO:'Europa',FI:'Europa',DK:'Europa',IS:'Europa',EE:'Europa',LV:'Europa',LT:'Europa',UA:'Europa',HR:'Europa',SI:'Europa',RS:'Europa',BA:'Europa',AL:'Europa',MK:'Europa',ME:'Europa',LU:'Europa',MT:'Europa',CY:'Europa',
  CN:'Asia',JP:'Asia',KR:'Asia',KP:'Asia',IN:'Asia',PK:'Asia',BD:'Asia',LK:'Asia',NP:'Asia',BT:'Asia',PH:'Asia',ID:'Asia',MY:'Asia',SG:'Asia',TH:'Asia',VN:'Asia',KH:'Asia',LA:'Asia',MM:'Asia',MN:'Asia',TW:'Asia',HK:'Asia',MO:'Asia',AE:'Asia',SA:'Asia',QA:'Asia',KW:'Asia',BH:'Asia',OM:'Asia',IL:'Asia',JO:'Asia',LB:'Asia',IQ:'Asia',IR:'Asia',TR:'Asia',KZ:'Asia',UZ:'Asia',KG:'Asia',TJ:'Asia',TM:'Asia',GE:'Asia',AM:'Asia',AZ:'Asia',
  ZA:'África',EG:'África',MA:'África',DZ:'África',TN:'África',LY:'África',NG:'África',GH:'África',KE:'África',ET:'África',TZ:'África',UG:'África',RW:'África',SN:'África',CI:'África',CM:'África',AO:'África',MZ:'África',ZW:'África',ZM:'África',BW:'África',NA:'África',MG:'África',MU:'África',AU:'Oceanía',NZ:'Oceanía',FJ:'Oceanía',PG:'Oceanía',WS:'Oceanía',TO:'Oceanía'
}
const ALLOWED_ORIGINS=new Set(['https://spenceralejandro10.github.io','http://localhost:5500','http://127.0.0.1:5500','http://localhost:8000','http://127.0.0.1:8000'])
function headers(req:Request){const origin=req.headers.get('origin')||'';return {'content-type':'application/json; charset=utf-8',...(ALLOWED_ORIGINS.has(origin)?{'access-control-allow-origin':origin}:{}),'access-control-allow-headers':'authorization, x-client-info, apikey, content-type','access-control-allow-methods':'POST, OPTIONS','cache-control':'no-store','x-content-type-options':'nosniff','vary':'origin'}}
function json(req:Request,payload:unknown,status=200){return new Response(JSON.stringify(payload),{status,headers:headers(req)})}
Deno.serve(async(req)=>{
  const origin=req.headers.get('origin')||''
  if(req.method==='OPTIONS'){if(origin&&!ALLOWED_ORIGINS.has(origin))return json(req,{error:'origin_not_allowed'},403);return new Response('ok',{headers:headers(req)})}
  if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405)
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json(req,{error:'origin_not_allowed'},403)
  if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return json(req,{error:'json_required'},415)
  if(Number(req.headers.get('content-length')||0)>2048)return json(req,{error:'payload_too_large'},413)
  try{
    const raw=await req.text();if(new TextEncoder().encode(raw).length>2048)return json(req,{error:'payload_too_large'},413)
    let body:any;try{body=JSON.parse(raw||'{}')}catch{return json(req,{error:'invalid_json'},400)}
    const visitorId=String(body?.visitor_id||'')
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId))return json(req,{error:'invalid_visitor'},400)
    const country=(req.headers.get('cf-ipcountry')||req.headers.get('x-country')||'').toUpperCase()
    const continent=COUNTRY_TO_CONTINENT[country]||'Desconocido'
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const {error}=await client.from('visitor_sessions').upsert({visitor_id:visitorId,continent,last_seen:new Date().toISOString()},{onConflict:'visitor_id'})
    if(error)throw error
    return json(req,{ok:true,continent})
  }catch(_e){return json(req,{error:'visit_unavailable'},500)}
})
