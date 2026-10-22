import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const derive=promisify(scrypt),root=path.dirname(fileURLToPath(import.meta.url));
const username=process.env.AUTH_USERNAME,hash=process.env.AUTH_PASSWORD_HASH;
if(!username||!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash||''))throw new Error('Configure AUTH_USERNAME and AUTH_PASSWORD_HASH before starting.');
const [,salt,expected]=hash.split(':'),secure=process.env.NODE_ENV==='production',ttl=8*60*60*1000;
const sessions=new Map(),attempts=new Map();
const sessionCookie=secure?'__Host-patrullaje':'patrullaje',csrfCookie=secure?'__Host-login_csrf':'login_csrf';
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(c=>c.trim().split('=')));
const same=(a,b)=>{const aa=Buffer.from(a||''),bb=Buffer.from(b||'');return aa.length===bb.length&&timingSafeEqual(aa,bb)};
const html=await readFile(path.join(root,'auth-assets/login.html'),'utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function send(res,status,body='',type='text/html; charset=utf-8',extra={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',...extra});res.end(body)}
function redirect(res,url,extra={}){send(res,303,'','text/plain',{Location:url,...extra})}
function loginPage(res,message='',status=200){const csrf=randomBytes(32).toString('hex');send(res,status,html.replaceAll('{{CSRF}}',csrf).replace('{{ERROR}}',escape(message)),undefined,{'Set-Cookie':cookie(csrfCookie,csrf,900),'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"})}
async function formBody(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096){const e=new Error('Body too large');e.status=413;throw e}}return new URLSearchParams(body)}
function session(req){const id=cookies(req)[sessionCookie],s=sessions.get(id);if(!s||s.expires<Date.now()){if(id)sessions.delete(id);return null}return{id,...s}}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return false;try{return new URL(origin).host===req.headers.host}catch{return false}}
setInterval(()=>{const now=Date.now();for(const[k,v]of sessions)if(v.expires<now)sessions.delete(k);for(const[k,v]of attempts)if(v.until<now)attempts.delete(k)},60000).unref();
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
 if(pathname==='/healthz')return send(res,200,'ok','text/plain');
 if(pathname==='/favicon.ico')return send(res,204,'','image/x-icon');
 if(pathname==='/auth-assets/policia-nacional.png'||pathname==='/auth-assets/login.js'){
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'','text/plain');
  const data=await readFile(path.join(root,pathname.slice(1)));return send(res,200,req.method==='HEAD'?'':data,pathname.endsWith('.png')?'image/png':'text/javascript; charset=utf-8',{'Cache-Control':'public, max-age=86400'});
 }
 if(pathname==='/login'&&req.method==='GET'){if(session(req))return redirect(res,'/');return loginPage(res)}
 if(pathname==='/login'&&req.method==='POST'){
  if(!sameOrigin(req))return send(res,403,'Solicitud no válida.','text/plain');
  if(!(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded'))return send(res,415,'','text/plain');
  const form=await formBody(req),csrf=cookies(req)[csrfCookie];
  if(!csrf||!/^[a-f0-9]{64}$/.test(csrf)||!same(csrf,form.get('csrf')))return loginPage(res,'La sesión del formulario venció. Intenta nuevamente.',403);
  // Render forwards the connecting address last; do not trust a client-supplied first value.
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',').at(-1).trim();
  const now=Date.now(),limit=attempts.get(ip)||{count:0,until:now+15*60000};if(limit.until<now){limit.count=0;limit.until=now+15*60000}
  if(limit.count>=10)return loginPage(res,'Demasiados intentos. Intenta de nuevo en 15 minutos.',429);
  limit.count++;attempts.set(ip,limit);if(attempts.size>10000)attempts.delete(attempts.keys().next().value);
  const password=form.get('password')||'',candidate=await derive(password,salt,64);
  if(!same(form.get('username'),username)||!timingSafeEqual(candidate,Buffer.from(expected,'hex')))return loginPage(res,'Usuario o contraseña incorrectos.',401);
  attempts.delete(ip);const id=randomBytes(32).toString('hex'),logoutCsrf=randomBytes(32).toString('hex');
  sessions.set(id,{expires:now+ttl,logoutCsrf});
  return redirect(res,'/',{'Set-Cookie':[cookie(sessionCookie,id,ttl/1000),cookie(csrfCookie,'',0)]});
 }
 if(pathname==='/logout'&&req.method==='POST'){
  if(!sameOrigin(req))return send(res,403,'Solicitud no válida.','text/plain');
  const s=session(req),form=await formBody(req);if(s&&!same(s.logoutCsrf,form.get('csrf')))return send(res,403,'Solicitud no válida.','text/plain');
  if(s)sessions.delete(s.id);return redirect(res,'/login',{'Set-Cookie':cookie(sessionCookie,'',0)});
 }
 const s=session(req);if(!s)return redirect(res,'/login');
 if(!['GET','HEAD'].includes(req.method))return send(res,405,'','text/plain');
 const relative=pathname==='/'?'index.html':pathname.slice(1);
 if(relative.split('/').some(x=>x.startsWith('.'))||relative.includes('\\'))return send(res,404,'No encontrado','text/plain');
 const protectedRoot=path.join(root,'protected'),file=path.resolve(protectedRoot,relative);
 if(!file.startsWith(protectedRoot+path.sep))return send(res,404,'No encontrado','text/plain');
 let info;try{info=await stat(file)}catch{return send(res,404,'No encontrado','text/plain')}if(!info.isFile())return send(res,404,'No encontrado','text/plain');
 let data=await readFile(file);
 const type={'.html':'text/html; charset=utf-8','.kml':'application/vnd.google-earth.kml+xml','.kmz':'application/vnd.google-earth.kmz','.png':'image/png','.gif':'image/gif','.jpg':'image/jpeg','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
 if(relative==='index.html'){
  const logout=`<form action="/logout" method="post" style="display:inline-flex;margin:0"><input type="hidden" name="csrf" value="${s.logoutCsrf}"><button type="submit" title="Cerrar la sesión de CIEPSESPINAL">Cerrar sesión</button></form>`;
  data=Buffer.from(data.toString().replace('<button id="hideToolbar"',logout+'<button id="hideToolbar"'));
 }
 return send(res,200,req.method==='HEAD'?'':data,type);
 }catch(error){send(res,error.status||500,'No se pudo completar la solicitud.','text/plain')}});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Patrullaje: servidor con autenticación iniciado.'));
