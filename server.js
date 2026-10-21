// Referee Translator backend. Swap translator by setting TRANSLATOR=llm and implementing llmTranslate.
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||8080;
const ES=/[ñáéíóúü¿¡]|\b(el|la|los|las|que|de|es|y|por|para|como|estoy|está|hola|gracias|qué|tengo|quiero|usted|bueno|sí|una?|mi|tu|con|pero|muy)\b/gi;
const EN=/\b(the|is|are|and|you|what|how|i|it|to|of|my|your|hello|thanks|want|have|do|this|that|with|but|very|yes)\b/gi;
function detect(t){const e=(t.match(ES)||[]).length,n=(t.match(EN)||[]).length;return e>n?'es':n>e?'en':null}
async function myMemory(text,from,to){const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);const j=await r.json();if(j.responseStatus!=200)throw new Error(j.responseDetails);return j.responseData.translatedText}
async function llmTranslate(text,from,to){throw new Error('LLM translator not configured')}
const translators={mymemory:myMemory,llm:llmTranslate};
const translate=translators[process.env.TRANSLATOR||'mymemory'];
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x');
 if(u.pathname==='/api/translate'&&req.method==='POST'){
  let b='';req.on('data',c=>b+=c);req.on('end',async()=>{try{
   let {text,hint,from:f0}=JSON.parse(b);const from=(f0==='en'||f0==='es')?f0:(detect(text)||hint||'en');const to=from==='en'?'es':'en';
   const out=await translate(text,from,to);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({from,to,text:out}));
  }catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e.message)}))}});return}
 const f=path.join(__dirname,'public',u.pathname==='/'?'index.html':path.normalize(u.pathname));
 fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':f.endsWith('.html')?'text/html; charset=utf-8':'text/plain'});res.end(d)});
}).listen(PORT,()=>console.log('listening',PORT));
