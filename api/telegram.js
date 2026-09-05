function json(res,status,body){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(body));}
module.exports=async function(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  json(res,501,{error:'Telegram backend adapter belum dikonfigurasi. Hubungkan endpoint ini ke backend Telegram yang kamu kontrol sendiri.'});
};
