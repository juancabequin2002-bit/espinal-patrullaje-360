import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes,scryptSync} from 'node:crypto';
import {once} from 'node:events';

test('authentication guards map and downloads, validates CSRF, and revokes logout sessions',async()=>{
 const port=42000+Math.floor(Math.random()*10000),base=`http://127.0.0.1:${port}`,salt=randomBytes(16).toString('hex'),password='test-only-password';
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),NODE_ENV:'test',AUTH_USERNAME:'TESTUSER',AUTH_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`},stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw new Error('Server exited before ready')}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timeout')),10000).unref())]);
  const request=(url,opts={})=>fetch(base+url,{redirect:'manual',...opts});
  for(const url of['/','/index.html','/PATRULLAJE_CORREGIDO_CON_ICONOS.kmz','/KML_CORREGIDO/PATRULLAJE_CORREGIDO.kml','/protected/index.html']){const res=await request(url);assert.equal(res.status,303);assert.equal(res.headers.get('location'),'/login')}
  assert.equal((await request('/healthz')).status,200);
  let page=await request('/login'),text=await page.text();assert(text.includes('Iniciar sesión'));assert(!text.includes('const D='));assert(!text.includes(password));
  let csrfCookie=page.headers.getSetCookie()[0].split(';')[0],csrf=text.match(/name="csrf" value="(.*?)"/)[1];
  const favicon=await request('/favicon.ico');assert.equal(favicon.status,204);assert.equal(favicon.headers.get('set-cookie'),null);
  const post=(body,extra={})=>request('/login',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:base,cookie:csrfCookie,...extra},body:new URLSearchParams(body)});
  assert.equal((await post({username:'TESTUSER',password,csrf},{origin:'https://invalid.example'})).status,403);
  assert.equal((await post({username:'TESTUSER',password,csrf:'invalid'})).status,403);
  const wrong=await post({username:'TESTUSER',password:'wrong',csrf});assert.equal(wrong.status,401);assert((await wrong.text()).includes('Usuario o contraseña incorrectos'));
  const login=await post({username:'TESTUSER',password,csrf});assert.equal(login.status,303);
  const set=login.headers.getSetCookie().find(c=>c.startsWith('patrullaje='));assert(set.includes('HttpOnly'));assert(set.includes('SameSite=Strict'));const session=set.split(';')[0];
  const map=await request('/',{headers:{cookie:session}}),mapText=await map.text();assert.equal(map.status,200);assert.equal(map.headers.get('cache-control'),'no-store');assert(mapText.includes('const D='));assert(mapText.includes('Cerrar sesión'));
  assert.equal((await request('/PATRULLAJE_CORREGIDO_CON_ICONOS.kmz',{headers:{cookie:session}})).status,200);
  assert.equal((await request('/.env',{headers:{cookie:session}})).status,404);
  assert.equal((await request('/',{headers:{cookie:'patrullaje=forged'}})).status,303);
  const logoutToken=mapText.match(/action="\/logout"[\s\S]*?name="csrf" value="(.*?)"/)[1];
  const logout=await request('/logout',{method:'POST',headers:{origin:base,cookie:session,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf:logoutToken})});assert.equal(logout.status,303);
  assert.equal((await request('/',{headers:{cookie:session}})).status,303);
 }finally{child.kill()}
});
