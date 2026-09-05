const express=require('express');
const cors=require('cors');
const crypto=require('crypto');
const path=require('path');
require('dotenv').config?.();
const {TelegramClient,Api}=require('gramjs');
const {StringSession}=require('gramjs/sessions');
const {computeCheck}=require('gramjs/Password');

const app=express();
app.use(express.json({limit:'32kb'}));
app.use(cors({origin:process.env.FRONTEND_ORIGIN||true,credentials:true}));
app.use(express.static(__dirname));

const API_ID=Number(process.env.TELEGRAM_API_ID||0);
const API_HASH=process.env.TELEGRAM_API_HASH||'';
const sessions=new Map();
const TTL=10*60*1000;
function id(){return crypto.randomBytes(18).toString('hex')}
function clean(){for(const [k,v] of sessions){if(Date.now()-v.created>TTL){try{v.client.disconnect()}catch{} sessions.delete(k)}}}
setInterval(clean,60_000).unref();
function ok(res,data){res.json({ok:true,...data})}
function fail(res,status,error){res.status(status).json({ok:false,error})}
function cfg(){return API_ID>0&&API_HASH.length>10}

app.post('/api/telegram/send-code',async(req,res)=>{
  if(!cfg()) return fail(res,500,'TELEGRAM_API_ID / TELEGRAM_API_HASH belum dikonfigurasi.');
  const phone=String(req.body?.phone||'').trim();
  if(!/^\+[1-9]\d{7,14}$/.test(phone)) return fail(res,400,'Nomor harus format internasional, contoh +628xxxxxxxxxx.');
  const client=new TelegramClient(new StringSession(''),API_ID,API_HASH,{connectionRetries:5});
  try{
    await client.connect();
    const sent=await client.invoke(new Api.auth.SendCode({phoneNumber:phone,apiId:API_ID,apiHash:API_HASH,settings:new Api.auth.CodeSettings({allowFlashcall:false,allowAppHash:true,allowMissedCall:false})}));
    const sid=id();
    sessions.set(sid,{client,phone,phoneCodeHash:sent.phoneCodeHash,created:Date.now()});
    ok(res,{sessionId:sid,needs2fa:false,message:'Kode OTP dikirim oleh Telegram.'});
  }catch(e){try{await client.disconnect()}catch{} fail(res,400,e.errorMessage||e.message||'Gagal mengirim OTP.');}
});

app.post('/api/telegram/verify-code',async(req,res)=>{
  const sid=String(req.body?.sessionId||''); const code=String(req.body?.code||'').trim();
  const s=sessions.get(sid); if(!s) return fail(res,400,'Sesi OTP tidak ditemukan atau sudah kedaluwarsa.');
  if(!/^\d{5,6}$/.test(code)) return fail(res,400,'Kode OTP tidak valid.');
  try{
    await s.client.invoke(new Api.auth.SignIn({phoneNumber:s.phone,phoneCodeHash:s.phoneCodeHash,phoneCode:code}));
    const session=s.client.session.save(); sessions.delete(sid);
    ok(res,{connected:true,session});
  }catch(e){
    if((e.errorMessage||'').includes('SESSION_PASSWORD_NEEDED')){
      try{
        const password=await s.client.invoke(new Api.account.GetPassword());
        s.passwordInfo=password; ok(res,{needs2fa:true,sessionId:sid,message:'Akun memakai 2FA.'});
      }catch(pe){fail(res,400,pe.errorMessage||pe.message||'Gagal membaca status 2FA.');}
    }else fail(res,400,e.errorMessage||e.message||'OTP salah atau sudah kedaluwarsa.');
  }
});

app.post('/api/telegram/verify-2fa',async(req,res)=>{
  const sid=String(req.body?.sessionId||''); const password=String(req.body?.password||'');
  const s=sessions.get(sid); if(!s) return fail(res,400,'Sesi 2FA tidak ditemukan atau sudah kedaluwarsa.');
  if(!password) return fail(res,400,'Password 2FA wajib diisi.');
  try{
    const check=await computeCheck(s.passwordInfo,password);
    await s.client.invoke(new Api.auth.CheckPassword({password:check}));
    const session=s.client.session.save(); sessions.delete(sid);
    ok(res,{connected:true,session});
  }catch(e){fail(res,400,e.errorMessage||e.message||'Password 2FA salah.');}
});

app.post('/api/telegram/disconnect',async(req,res)=>{const sid=String(req.body?.sessionId||'');const s=sessions.get(sid);if(s){try{await s.client.disconnect()}catch{}sessions.delete(sid)}ok(res,{disconnected:true})});
app.get('/api/health',(req,res)=>ok(res,{service:'telegram-otp',configured:cfg()}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(Number(process.env.PORT||3000),()=>console.log('UBOT OTP backend listening'));
