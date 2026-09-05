import crypto from 'node:crypto';

const owner='NanoXyinDev';
const repo='ZxvCode-Ubot';
const branch='main';
const files={users:'database.json',sessions:'sessions.json'};

function token(){return process.env.GITHUB_TOKEN||''}
function ghHeaders(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}}
function fail(res,status,error){return res.status(status).json({ok:false,error})}
function parseCookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
function b64(s){return Buffer.from(s).toString('base64url')}
function unb64(s){return Buffer.from(s,'base64url').toString()}
function sign(payload){const secret=process.env.AUTH_SECRET||'';return b64(JSON.stringify(payload))+'.'+b64(crypto.createHmac('sha256',secret).update(JSON.stringify(payload)).digest())}
function verify(raw){try{const [a,b]=raw.split('.');const payload=JSON.parse(unb64(a));const secret=process.env.AUTH_SECRET||'';const sig=b64(crypto.createHmac('sha256',secret).update(JSON.stringify(payload)).digest());if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(b)))return null;if(payload.exp<Date.now())return null;return payload}catch{return null}}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){const hash=crypto.scryptSync(password,salt,64).toString('hex');return {salt,hash}}
function validUsername(v){return /^[a-zA-Z0-9_.-]{3,32}$/.test(v)}
async function githubGet(path){const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,{headers:ghHeaders()});if(!r.ok)throw new Error(`GitHub GET ${path}: ${r.status}`);return r.json()}
async function readJson(name){const data=await githubGet(files[name]);const raw=Buffer.from(data.content.replace(/\n/g,''),'base64').toString('utf8');let value=[];try{value=JSON.parse(raw||'[]')}catch{};return {value,sha:data.sha}}
async function writeJson(name,value,sha,message){const content=Buffer.from(JSON.stringify(value,null,2)+'\n').toString('base64');const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${files[name]}`,{method:'PUT',headers:ghHeaders(),body:JSON.stringify({message,content,sha,branch})});if(!r.ok){const t=await r.text();throw new Error(`GitHub PUT ${files[name]}: ${r.status} ${t.slice(0,160)}`)}return r.json()}
function setCookie(res,name,value,maxAge){res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Secure`)}
function publicUser(u){return {id:u.id,username:u.username,email:u.email||'',createdAt:u.createdAt,role:u.role||'user'}}

export default async function handler(req,res){
  if(!token()||!process.env.AUTH_SECRET)return fail(res,500,'Auth belum dikonfigurasi di Vercel. Set GITHUB_TOKEN dan AUTH_SECRET.');
  const action=(req.query?.action||'').toString();
  try{
    if(req.method==='GET'&&action==='me'){
      const p=verify(parseCookies(req).ubot_session||'');
      return p?res.json({ok:true,user:p.user}):res.status(401).json({ok:false,error:'Belum login'});
    }
    if(req.method==='POST'&&action==='logout'){setCookie(res,'ubot_session','',0);return res.json({ok:true})}
    if(req.method!=='POST')return fail(res,405,'Method tidak diizinkan');
    const body=req.body||{}; const username=String(body.username||'').trim().toLowerCase(); const password=String(body.password||'');
    if(!validUsername(username))return fail(res,400,'Username 3-32 karakter: huruf, angka, titik, garis bawah, atau strip.');
    if(password.length<8)return fail(res,400,'Password minimal 8 karakter.');
    const db=await readJson('users'); const users=Array.isArray(db.value)?db.value:[];
    if(action==='register'){
      if(users.some(u=>String(u.username).toLowerCase()===username))return fail(res,409,'Username sudah terdaftar.');
      const hp=hashPassword(password); const user={id:crypto.randomUUID(),username,email:String(body.email||'').trim().slice(0,120),passwordHash:hp.hash,passwordSalt:hp.salt,role:'user',createdAt:new Date().toISOString()};
      users.push(user);await writeJson('users',users,db.sha,`auth: register ${username}`);
      const payload={user:publicUser(user),exp:Date.now()+7*24*60*60*1000};setCookie(res,'ubot_session',sign(payload),7*24*60*60);return res.json({ok:true,user:publicUser(user)});
    }
    if(action==='login'){
      const user=users.find(u=>String(u.username).toLowerCase()===username);if(!user)return fail(res,401,'Username atau password salah.');
      const hash=crypto.scryptSync(password,user.passwordSalt,64).toString('hex');const a=Buffer.from(hash),b=Buffer.from(user.passwordHash||'');if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return fail(res,401,'Username atau password salah.');
      const payload={user:publicUser(user),exp:Date.now()+7*24*60*60*1000};setCookie(res,'ubot_session',sign(payload),7*24*60*60);return res.json({ok:true,user:publicUser(user)});
    }
    return fail(res,400,'Action auth tidak dikenal.');
  }catch(e){return fail(res,500,e.message||'Auth error')}
}
