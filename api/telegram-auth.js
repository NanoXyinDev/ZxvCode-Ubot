export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method tidak diizinkan'});
  const base=(process.env.BOT_BRIDGE_URL||'').replace(/\/$/,'');
  if(!base)return res.status(500).json({ok:false,error:'BOT_BRIDGE_URL belum diset di Vercel.'});
  const action=String(req.query?.action||'');
  const allowed=new Set(['request-code','verify-code','verify-2fa']);
  if(!allowed.has(action))return res.status(400).json({ok:false,error:'Action tidak dikenal.'});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
    const r=await fetch(base+'/telegram/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Bridge-Key':process.env.BOT_BRIDGE_SECRET||''},body:JSON.stringify(req.body||{}),signal:controller.signal});
    const text=await r.text();res.status(r.status).setHeader('Content-Type','application/json');return res.send(text||JSON.stringify({ok:r.ok}));
  }catch(e){return res.status(e.name==='AbortError'?504:502).json({ok:false,error:e.name==='AbortError'?'Bridge timeout. Periksa server userbot.':'Bridge Telegram tidak dapat dihubungi.'})}finally{clearTimeout(timer)}
}
