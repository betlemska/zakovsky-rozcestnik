import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createECDH,hkdfSync,createDecipheriv} from 'node:crypto';
import {Calendar} from '../lib/calendar.mjs';
import {encryptPush} from '../lib/push-encryption.mjs';
import {adminResponse,makeVerifier,readContent} from '../lib/portal-admin.mjs';
import {pushResponse,broadcastNews} from '../lib/portal-push.mjs';
import {runTomorrowReminders,tomorrowPreview,reminderStatus} from '../lib/reminders.mjs';
import {reminderMcp} from '../lib/reminder-mcp.mjs';
const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const db={prepare(sql){let args=[];const stmt=sqlite.prepare(sql);return{bind(...v){args=v;return this},async first(){return stmt.get(...args)||null},async all(){return{results:stmt.all(...args)}},async run(){return{meta:{changes:Number(stmt.run(...args).changes)}}}}},async batch(qs){const result=[];for(const q of qs)result.push(await q.run());return result}};
const school=JSON.parse(readFileSync(new URL('../public/assets/data.json',import.meta.url),'utf8')),origin='https://portal.test';
assert.equal(Calendar.pragueDay(new Date('2026-12-31T23:30:00Z')),'2027-01-01');assert.equal(Calendar.nextDay('2026-12-31'),'2027-01-01');assert.equal(Calendar.nextDay('2028-02-28'),'2028-02-29');
const namedays=Calendar.calendarItems(school.teachers,[],[],'2026-01-01','2026-12-31').filter(e=>e.kind==='jmeniny');assert.equal(namedays.reduce((n,e)=>n+e.teacherIds.length,0),school.teachers.length);assert.equal(namedays.find(e=>e.date==='2026-11-11').teacherIds.length,4);assert.equal(namedays.find(e=>e.date==='2026-11-05').teacherIds[0],'miriam-humeova');assert.equal(Calendar.calendarItems(school.teachers,[],[],'2027-11-05','2027-11-05').length,1);
const verifier=await makeVerifier('calendar-owner-test-password');
async function admin(body,cookie=''){return adminResponse(db,new Request(origin+'/api/admin',{method:body?'POST':'GET',headers:{cookie,origin,'content-type':'application/json','x-portal-action':'1','cf-connecting-ip':cookie?'signed':'login'},...(body?{body:JSON.stringify(body)}:{})}),verifier)}
const login=await admin({action:'login',username:'kubicek',password:'calendar-owner-test-password'}),ownerCookie=login.headers.get('set-cookie').split(';')[0];let revision=(await login.json()).revision;
await admin({action:'user_create',username:'editor',displayName:'Redakce',password:'calendar-editor-test-password'},ownerCookie);const editorLogin=await admin({action:'login',username:'editor',password:'calendar-editor-test-password'}),editorCookie=editorLogin.headers.get('set-cookie').split(';')[0];
const exam={id:'exam-owner',date:'2026-11-05',subject:'Matematika',title:'Lineární rovnice',notes:'Kalkulačka',teacherId:'miriam-humeova'};
assert.equal((await admin({action:'exam_save',revision,exam})).status,401);
let r=await admin({action:'exam_save',revision,exam},ownerCookie);assert.equal(r.status,200);revision=(await r.json()).revision;
assert.equal((await admin({action:'exam_save',revision,exam:{...exam,title:'Přepsání cizí'}} ,editorCookie)).status,403);assert.equal((await admin({action:'exam_delete',revision,id:exam.id},editorCookie)).status,403);
r=await admin({action:'exam_save',revision,exam:{...exam,id:'exam-editor',author:'kubicek',subject:'Fyzika',title:'Síly',date:'2026-11-05'}},editorCookie);assert.equal(r.status,200);let saved=await r.json();revision=saved.revision;assert.equal(saved.content.exams.find(e=>e.id==='exam-editor').author,'editor');assert.equal(saved.content.exams.length,2);assert.deepEqual(Object.keys(saved.content),['posts','exams','events','teachers','lessonChanges']);
for(const [username,kind,grant,otherKind] of [['examhelper','exam','editExams','event'],['eventhelper','event','editEvents','exam']]){
 const pass='calendar-delegation-test';
 assert.equal((await admin({action:'user_create',username,password:pass,[grant]:true},ownerCookie)).status,200);
 const signIn=await admin({action:'login',username,password:pass});
 const token=signIn.headers.get('set-cookie').split(';')[0];
 const records={exam,event:{...school.events[0],id:school.events[0].id||'event-0'}};
 assert.equal((await admin({action:otherKind+'_save',revision,[otherKind]:records[otherKind]},token)).status,403);
 const edit=await admin({action:kind+'_save',revision,[kind]:records[kind]},token);
 assert.equal(edit.status,200);const changed=await edit.json();revision=changed.revision;
 const item=changed.content[kind+'s'].find(e=>e.id===records[kind].id);
 assert.equal(item.editedBy,username);assert.ok(Date.parse(item.editedAt));assert.equal(item.author,'kubicek');
 assert.equal((await admin({action:kind+'_delete',revision,id:item.id},token)).status,403);
}
assert.equal((await admin({action:'exam_save',revision:revision-1,exam:{...exam,id:'stale'}},editorCookie)).status,409);assert.equal((await admin({action:'exam_save',revision,exam:{...exam,id:'bad',date:'2026-02-31'}},editorCookie)).status,400);
r=await admin({action:'exam_delete',revision,id:'exam-editor'},ownerCookie);assert.equal(r.status,200);revision=(await r.json()).revision;assert.equal((await readContent(db)).content.exams.length,1);
// Calendar writes are scoped to the signed-in editor and retain default school events.
const event={id:'editor-day-off',date:'2026-11-09',title:'Ředitelské volno',kind:'volno',author:'kubicek'};
assert.equal((await admin({action:'event_save',revision,event})).status,401);
r=await admin({action:'event_save',revision,event},editorCookie);assert.equal(r.status,200);saved=await r.json();revision=saved.revision;assert.equal(saved.content.events.length,school.events.length+1);assert.equal(saved.content.events.find(e=>e.id===event.id).author,'editor');
assert.equal((await admin({action:'event_save',revision,event:{...school.events[0],id:'event-0',title:'Přepsat školní akci'}},editorCookie)).status,403);
assert.equal((await admin({action:'event_delete',revision,id:'event-0'},editorCookie)).status,403);
assert.equal((await admin({action:'event_save',revision:revision-1,event},editorCookie)).status,409);
assert.equal((await admin({action:'event_save',revision,event:{...event,date:'2026-02-31'}},editorCookie)).status,400);
assert.equal((await admin({action:'exam_save',revision,exam:{...exam,id:'holiday-exam',date:event.date,hour:0}},editorCookie)).status,400);
assert.equal((await admin({action:'exam_save',revision,exam:{...exam,id:'bad-hour',hour:10}},editorCookie)).status,400);
assert.equal(Calendar.calendarItems([],saved.content.events,[{...exam,date:event.date}],event.date,event.date).filter(e=>e.kind==='pisemka').length,0,'Cancelled tests are excluded from calendar and reminder messages');
r=await admin({action:'event_save',revision,event:{...event,title:'Ředitelské volno – upraveno'}},ownerCookie);assert.equal(r.status,200);saved=await r.json();revision=saved.revision;assert.equal(saved.content.events.find(e=>e.id===event.id).author,'editor','An administrator editing an event preserves its original owner');
r=await admin({action:'event_delete',revision,id:event.id},editorCookie);assert.equal(r.status,200);revision=(await r.json()).revision;assert.equal((await readContent(db)).content.events.length,school.events.length);
const fullDay={id:'editor-full-day',date:'2026-11-10',title:'Celodenní školní exkurze',kind:'akce',allDay:true};r=await admin({action:'event_save',revision,event:fullDay},editorCookie);assert.equal(r.status,200);saved=await r.json();revision=saved.revision;assert.equal(saved.content.events.find(e=>e.id===fullDay.id).allDay,true);
assert.equal((await admin({action:'exam_save',revision,exam:{...exam,id:'trip-exam',date:fullDay.date}},editorCookie)).status,400);
const tripItems=Calendar.calendarItems([],saved.content.events,[{...exam,date:fullDay.date}],fullDay.date,fullDay.date);assert.equal(tripItems.filter(e=>e.kind==='pisemka').length,0);assert.ok(Calendar.reminderMessage(tripItems,fullDay.date,{events:true,exams:true}).body.includes('celodenní akce, výuka se nekoná'));
r=await admin({action:'event_delete',revision,id:fullDay.id},editorCookie);assert.equal(r.status,200);revision=(await r.json()).revision;
// Decrypt our Web Crypto output with the independent Node crypto APIs (RFC 8291).
const receiver=createECDH('prime256v1');receiver.generateKeys();const ua=receiver.getPublicKey(),auth=crypto.getRandomValues(new Uint8Array(16));
function decrypt(body){const b=Buffer.from(body),salt=b.subarray(0,16),as=b.subarray(21,86);assert.equal(b.readUInt32BE(16),4096);assert.equal(b[20],65);const shared=receiver.computeSecret(as),ikm=hkdfSync('sha256',shared,auth,Buffer.concat([Buffer.from('WebPush: info\0'),ua,as]),32),cek=hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16),nonce=hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12),cipher=b.subarray(86),decipher=createDecipheriv('aes-128-gcm',cek,nonce);decipher.setAuthTag(cipher.subarray(-16));const plain=Buffer.concat([decipher.update(cipher.subarray(0,-16)),decipher.final()]);assert.equal(plain.at(-1),2);return JSON.parse(plain.subarray(0,-1).toString())}
const message={id:'test',title:'České upozornění',body:'Zítra má svátek Miriam.',url:'index.html#events'};assert.deepEqual(decrypt(await encryptPush(message,ua.toString('base64url'),Buffer.from(auth).toString('base64url'))),message);
const token=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url'),subscription={endpoint:'https://fcm.googleapis.com/fcm/send/calendar-test',keys:{p256dh:ua.toString('base64url'),auth:Buffer.from(auth).toString('base64url')}};
async function push(body){return pushResponse(db,new Request(origin+'/api/push',{method:'POST',headers:{origin,'content-type':'application/json','x-portal-action':'1'},body:JSON.stringify({...body,token})}))}
r=await push({action:'subscribe',subscription,categories:{namedays:true,exams:true,news:false,events:false}});assert.equal(r.status,200);assert.equal((await(await push({action:'status',endpoint:subscription.endpoint})).json()).categories.namedays,true);
let deliveries=[];const send=async(url,options)=>{assert.equal(options.headers['Content-Encoding'],'aes128gcm');deliveries.push(decrypt(options.body));return new Response(null,{status:201})};
assert.equal((await broadcastNews(db,{id:'no-news',title:'Not selected'},origin,send)).accepted,0);
let run=await runTomorrowReminders(db,origin,new Date('2026-11-04T16:00:00Z'),send);assert.equal(run.status,'not_due');assert.equal(deliveries.length,0);assert.ok((await reminderStatus(db)).lastCheck);
const preview=await tomorrowPreview(db,new Date('2026-11-04T18:00:00Z'));assert.ok(preview.items.some(e=>e.kind==='jmeniny'));assert.ok(preview.items.some(e=>e.kind==='pisemka'));
const runs=await Promise.all([runTomorrowReminders(db,origin,new Date('2026-11-04T17:00:00Z'),send),runTomorrowReminders(db,origin,new Date('2026-11-04T17:00:00Z'),send)]);assert.equal(runs.filter(r=>r.status==='complete').length,1);assert.equal(deliveries.length,1);assert.ok(deliveries[0].body.includes('Miriam Humeová'));assert.ok(deliveries[0].body.includes('Matematika'));assert.equal(deliveries[0].url,'index.html#events?date=2026-11-05&class=1.A');
await runTomorrowReminders(db,origin,new Date('2026-11-04T21:00:00Z'),send);assert.equal(deliveries.length,1);
const mcp=identity=>new Request(origin+'/mcp',{method:'POST',headers:{'content-type':'application/json',...identity},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'calendar_reminder_status',arguments:{}}})});
assert.equal((await reminderMcp(mcp({}),db,'owner@example.test')).status,403);assert.equal((await reminderMcp(mcp({'oai-authenticated-user-email':'other@example.test','oai-authenticated-user-id':'other'}),db,'owner@example.test')).status,403);assert.equal((await reminderMcp(mcp({'oai-authenticated-user-email':'owner@example.test','oai-authenticated-user-id':'owner'}),db,'owner@example.test')).status,200);
console.log('Calendar: 20 recurring teacher name days, Prague/DST/year dates, editor exam ownership/conflicts/validation, independent RFC8291 decryption, selected categories, encrypted tomorrow digest, daily concurrency dedupe and owner-only scheduler passed.');
