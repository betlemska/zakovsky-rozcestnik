import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {pushResponse,signingKeys,broadcastNews,vapidAuthorization,validatePushEndpoint,sendPushDetailed,pushDiagnostics} from '../lib/portal-push.mjs';
const sql=new DatabaseSync(':memory:');
const db={prepare(s){let args=[],stmt=sql.prepare(s);return{bind(...v){args=v;return this},async first(){return stmt.get(...args)||null},async all(){return{results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return{meta:{changes:r.changes}}}}},async batch(q){return Promise.all(q.map(x=>x.run()))}};
// D1 prepares CREATE lazily; SQLite prepares table-dependent queries after schema setup.
const origin='https://portal.test',b64=b=>Buffer.from(b).toString('base64url'),from=s=>Buffer.from(s,'base64url');
const keyPair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/test-case',keys:{p256dh:b64(await crypto.subtle.exportKey('raw',keyPair.publicKey)),auth:b64(crypto.getRandomValues(new Uint8Array(16)))}};
const token=b64(crypto.getRandomValues(new Uint8Array(32)));
function request(body,source=origin,ip='test'){return new Request(origin+'/api/push',{method:body?'POST':'GET',headers:{'cf-connecting-ip':ip,...(body?{'content-type':'application/json',origin:source,'x-portal-action':'1'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
let r=await pushResponse(db,request());assert.equal(r.status,200);const config=await r.json();assert.equal(from(config.publicKey).length,65);assert.equal(Object.keys(config).length,2);
const keys=await signingKeys(db);assert.equal(keys.public_key,config.publicKey);assert.equal((await signingKeys(db)).private_jwk,keys.private_jwk);
const auth=await vapidAuthorization(keys,subscription.endpoint,origin),jwt=auth.match(/t=([^,]+)/)[1].split('.'),claims=JSON.parse(from(jwt[1]));assert.equal(claims.aud,'https://fcm.googleapis.com');assert.equal(claims.sub,origin);assert.ok(claims.exp>Date.now()/1000&&claims.exp<Date.now()/1000+86400);
const publicKey=await crypto.subtle.importKey('raw',from(config.publicKey),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);assert.ok(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,from(jwt[2]),new TextEncoder().encode(jwt[0]+'.'+jwt[1])));
for(const bad of ['https://localhost/push','http://fcm.googleapis.com/x','https://fcm.googleapis.com.evil.test/x','https://user:secret@fcm.googleapis.com/x','https://fcm.googleapis.com:9443/x','https://127.0.0.1/x'])assert.throws(()=>validatePushEndpoint(bad));
assert.equal((await pushResponse(db,request({action:'subscribe',subscription,token},'https://evil.test'))).status,403);
assert.equal((await pushResponse(db,request({action:'subscribe',subscription,token}))).status,200);
assert.equal((await pushResponse(db,request({action:'unsubscribe',endpoint:subscription.endpoint,token:b64(new Uint8Array(32))}))).status,409);
let sent=0;const send=async(endpoint,options)=>{sent++;assert.equal(endpoint,subscription.endpoint);assert.equal(options.redirect,'manual');assert.ok(options.headers.Authorization.startsWith('vapid t='));assert.ok(options.body.length>100);assert.equal(options.headers['Content-Encoding'],'aes128gcm');return new Response('',{status:201})};
assert.equal((await broadcastNews(db,{id:'published-test'},origin,send)).accepted,1);assert.equal(sent,1);assert.equal((await broadcastNews(db,{id:'published-test'},origin,send)).duplicate,true);assert.equal(sent,1);
await broadcastNews(db,{id:'expired-test'},origin,async()=>new Response('',{status:410}));assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM portal_push_subscriptions').get().n,0);
await pushResponse(db,request({action:'subscribe',subscription,token}));assert.equal((await pushResponse(db,request({action:'unsubscribe',endpoint:subscription.endpoint,token}))).status,200);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM portal_push_subscriptions').get().n,0);
for(let i=0;i<121;i++)r=await pushResponse(db,request({action:'unsubscribe',endpoint:subscription.endpoint,token},origin,'rate-test'));assert.equal(r.status,429);
console.log('Web Push: private persistent keys, verified ES256 JWT, SSRF/CSRF validation, token-bound subscription deletion, provider delivery, duplicate suppression, expired cleanup and rate limit passed.');
// Safari/APNs: token-bound device test sends to exactly one Apple endpoint.
const apple={...subscription,endpoint:'https://web.push.apple.com/QDeviceOnlyTest'},other={...subscription,endpoint:'https://fcm.googleapis.com/fcm/send/other-device'};
assert.equal((await pushResponse(db,request({action:'subscribe',subscription:apple,token},origin,'apple'))).status,200);
assert.equal((await pushResponse(db,request({action:'subscribe',subscription:other,token},origin,'other'))).status,200);
let appleSent=0;const appleSend=async(endpoint,options)=>{appleSent++;assert.equal(endpoint,apple.endpoint);assert.equal(options.headers.Urgency,'high');assert.equal(options.headers.TTL,'120');assert.equal(options.headers['Content-Encoding'],'aes128gcm');assert.ok(!('Content-Length' in options.headers),'Transport controls byte length');const claims=JSON.parse(from(options.headers.Authorization.match(/t=([^,]+)/)[1].split('.')[1]));assert.equal(claims.aud,'https://web.push.apple.com');assert.equal(claims.sub,origin);assert.ok(options.body.length>100);return new Response(null,{status:201})};
assert.equal((await pushResponse(db,request({action:'test',endpoint:apple.endpoint,token},'https://evil.test','apple'),appleSend)).status,403);
assert.equal((await pushResponse(db,request({action:'test',endpoint:apple.endpoint,token:b64(new Uint8Array(32))},origin,'apple'),appleSend)).status,409);
const deviceTest=await(await pushResponse(db,request({action:'test',endpoint:apple.endpoint,token},origin,'apple'),appleSend)).json();assert.deepEqual(deviceTest,{accepted:true,provider:'Apple',status:201,reason:''});assert.equal(appleSent,1);
assert.equal((await pushResponse(db,request({action:'test',endpoint:apple.endpoint,token},origin,'apple'),appleSend)).status,429);assert.equal(appleSent,1);
const appleRow=sql.prepare('SELECT s.*,p.p256dh,p.auth FROM portal_push_subscriptions s JOIN portal_push_preferences p ON s.id=p.id WHERE endpoint=?').get(apple.endpoint);
const rejected=await sendPushDetailed(db,appleRow,{kind:'test'},origin,async()=>Response.json({reason:'BadJwtToken',privateEndpoint:apple.endpoint},{status:403}));assert.equal(rejected.reason,'BadJwtToken');assert.equal(rejected.accepted,false);
const deviceStatus=await(await pushResponse(db,request({action:'status',endpoint:apple.endpoint,token},origin,'apple'))).json();assert.equal(deviceStatus.lastDelivery.reason,'BadJwtToken');assert.ok(!JSON.stringify(deviceStatus).includes(apple.endpoint));assert.ok(!JSON.stringify(deviceStatus).includes(token));
const diagnostics=await pushDiagnostics(db);assert.equal(diagnostics.providers.Apple.total,1);assert.ok(!JSON.stringify(diagnostics).includes(apple.endpoint));
assert.equal((await sendPushDetailed(db,appleRow,{kind:'test'},origin,async()=>{const e=Error('secret endpoint');e.name='TimeoutError';throw e})).reason,'ProviderTimeout');
await pushResponse(db,request({action:'unsubscribe',endpoint:apple.endpoint,token},origin,'apple'));await pushResponse(db,request({action:'unsubscribe',endpoint:other.endpoint,token},origin,'other'));
console.log('Apple contract: direct encrypted one-device test, VAPID audience/subject, short urgent test TTL, CSRF/token isolation, cooldown and safe provider failure diagnostics passed.');
// Only a real draft -> publication transition schedules a notification.
const {readFileSync,readdirSync}=await import('node:fs');
const {adminResponse,makeVerifier}=await import('../lib/portal-admin.mjs');
for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
const password='push-test-only-password',verifier=await makeVerifier(password);let cookie='',published=[];
async function admin(input){const req=new Request(origin+'/api/admin',{method:'POST',headers:{origin,'content-type':'application/json','x-portal-action':'1',cookie,'cf-connecting-ip':'hook-test'},body:JSON.stringify(input)});return adminResponse(db,req,verifier,p=>published.push(p))}
let login=await admin({action:'login',username:'kubicek',password});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];let revision=(await login.json()).revision;
const post={id:'real-draft',title:'Test publikace',body:'Text',category:'Ze školy',date:'2026-11-03',status:'draft'};
for(const status of ['draft','published'])assert.equal((await admin({action:'news_save',revision,post:{...post,status}})).status,410);assert.equal(published.length,0,'Retired article publishing never schedules a push');
