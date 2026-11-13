// Server-only authentication and shared content. No secrets are bundled in public/.
import {refreshTeacherAssets} from './teacher-assets.mjs';
import school from './school-defaults.json' with {type:'json'};
import legacySchedules from './legacy-schedule-baseline.json' with {type:'json'};
const encoder=new TextEncoder();
const COOKIE='__Host-betlemska-admin';
const SESSION_SECONDS=12*60*60;
export {emptyContent,PortalError,validateContent} from './cms-content.mjs';
import {LessonChanges} from './lesson-changes.mjs';
import {validateLessonChange,emptyContent,PortalError,validateContent,normalizeContent,validatePost,validateExam,validateEvent} from './cms-content.mjs';
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const unhex=s=>Uint8Array.from(s.match(/../g)||[],v=>parseInt(v,16));
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));
// OWASP scrypt option for a 16 MiB working set; do not accept attacker-controlled cost values.
async function deriveScrypt(password,salt){const {scrypt}=await import('node:crypto');return new Promise((resolve,reject)=>scrypt(password,unhex(salt),32,{N:16384,r:8,p:5,maxmem:32*1024*1024},(error,key)=>error?reject(error):resolve(hex(key))))}
export async function makeVerifier(password,salt=hex(crypto.getRandomValues(new Uint8Array(16)))){
 return `scrypt$16384$8$5$${salt}$${await deriveScrypt(password,salt)}`;
}
export async function verifyPassword(password,verifier){
 if(typeof password!=='string'||password.length>256||typeof verifier!=='string')return false;
 let actual;
 if(/^scrypt\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(verifier))actual=await makeVerifier(password,verifier.split('$')[4]);
 else if(/^pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(verifier)){
  // Read-only compatibility. Successful sign-in upgrades old records without changing the password.
  const salt=verifier.split('$')[2],key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  actual=`pbkdf2$100000$${salt}$${hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:100000,hash:'SHA-256'},key,256))}`;
 }else return false;
 const {timingSafeEqual}=await import('node:crypto');return timingSafeEqual(encoder.encode(actual),encoder.encode(verifier));
}

function cookie(request){const pair=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));return pair?.slice(COOKIE.length+1)||''}
export const sessionCookie=(token,maxAge=SESSION_SECONDS)=>`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
export async function readSession(db,request){
 const token=cookie(request);if(!/^[a-f0-9]{64}$/.test(token))return null;
 return db.prepare('SELECT s.token_hash, a.username, a.version, a.role, a.edit_exams, a.edit_events, a.edit_others, a.class_scopes, a.school_events, a.display_name FROM portal_sessions s JOIN portal_admins a ON a.username=s.username AND a.version=s.version WHERE s.token_hash=? AND s.expires>? AND a.active=1').bind(await digest(token),Date.now()).first();
}
async function rateLimit(db,request){
 const now=Date.now(),bucket=Math.floor(now/600000);
 const key=await digest((request.headers.get('cf-connecting-ip')||'unknown')+':'+bucket);
 await db.prepare('DELETE FROM portal_attempts WHERE expires<?').bind(now).run();
 const row=await db.prepare('INSERT INTO portal_attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+600000).first();
 if(row.count>10)throw new PortalError('Příliš mnoho pokusů. Zkus to znovu za 10 minut.',429);
}
export function scheduleSignature(schedule){return JSON.stringify(schedule.map(l=>[l.day,l.hour,l.subject||'',l.room||'',l.group||'',[...(l.classes||[l.cls])].sort(),[...(l.coTeacherIds||[])].sort(),l.weekPattern||'']).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0))}
export function upgradeSchool(content){
 if(content.schoolwideRevision==='2026-11-13-schoolwide-v2')return content;
 const teachers=content.teachers?content.teachers.map(t=>{const defaults=school.teachers.find(v=>v.id===t.id),merged={...defaults,...t};if(defaults&&legacySchedules[t.id]&&scheduleSignature(t.schedule||[])===JSON.stringify(legacySchedules[t.id]))for(const key of ['schedule','subjects','scheduleValidFrom','scheduleValidTo','scheduleUpdated','scheduleProvenance','schedulePhotoSource','scheduleSource'])merged[key]=defaults[key];return merged}):null;
 if(teachers)for(const t of school.teachers)if(!teachers.some(v=>v.id===t.id))teachers.push(t);
 const settings={...content.settings},sections={...content.sections};
 for(const key of ['homeTitle','heroTitle','heroText','subtitle','siteTitle'])if(/1\s*\.?\s*A/i.test(settings[key]||''))settings[key]='';
 for(const key of ['home','schedule'])if(sections[key]){sections[key]={...sections[key]};for(const prop of ['title','description','label'])if(/1\s*\.?\s*A/i.test(sections[key][prop]||''))sections[key][prop]=''}
 return {...content,teachers,settings,sections,intro:/1\s*\.?\s*A/i.test(content.intro||'')?'':content.intro,schoolwideRevision:'2026-11-13-schoolwide-v2'};
}
export function cleanPresentation(content){return {...content,teachers:content.teachers?.map(t=>{const next={...t};for(const key of ['pdf','scheduleSource','schedulePhotoSource'])if(/^\/?assets\//.test(next[key]||''))next[key]='';return next})??content.teachers,sections:{...content.sections,news:{enabled:false}},documents:(content.documents||[]).filter(d=>d.section!=='news'&&d.section!=='plans')}}
export async function readContent(db){
 const row=await db.prepare('SELECT body,revision,updated_at FROM portal_content WHERE id=1').first();
 return row?{content:cleanPresentation(upgradeSchool(refreshTeacherAssets(normalizeContent(JSON.parse(row.body))))),revision:row.revision,updatedAt:row.updated_at}:{content:cleanPresentation(upgradeSchool(refreshTeacherAssets(emptyContent()))),revision:0,updatedAt:null};
}
async function bodyJSON(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new PortalError('Požadován JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw new PortalError('Chybí data.');let size=0,chunks=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1800000){await reader.cancel();throw new PortalError('Obsah je příliš velký.',413)}chunks.push(part.value)}
 try{const buffer=new Uint8Array(size);let at=0;for(const c of chunks){buffer.set(c,at);at+=c.length}const parsed=JSON.parse(new TextDecoder().decode(buffer));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('object required');return parsed}catch{throw new PortalError('Neplatný JSON.')}
}
export function editorClasses(session){if(session.role==='admin')return LessonChanges.classNames;try{const value=JSON.parse(session.class_scopes||'["1.A"]');return Array.isArray(value)?value.filter(c=>LessonChanges.classNames.includes(c)):[]}catch{return []}}
function validScopes(value){if(!Array.isArray(value)||value.length>20||value.some(c=>!LessonChanges.classNames.includes(c)))throw new PortalError('Vyber platné třídy redaktora.');return [...new Set(value)]}
function assertClassAccess(session,cls){if(!editorClasses(session).includes(cls))throw new PortalError('Pro tuto třídu nemáš oprávnění.',403)}
function assertEventAccess(session,event){if(session.role==='admin')return;const scopes=Array.isArray(event.classes)?event.classes:event.kind==='volno'?[]:['1.A'];if(!scopes.length){if(session.school_events===1)return;throw new PortalError('Nemáš oprávnění přidávat události pro celou školu.',403)}for(const cls of scopes)assertClassAccess(session,cls)}
const editorContent=(c,s)=>({posts:s.edit_others===1?c.posts:c.posts.filter(p=>p.author===s.username),exams:c.exams||[],events:c.events,teachers:c.teachers,lessonChanges:c.lessonChanges||[]});
async function payload(db,session){const data=await readContent(db);return{authenticated:true,schoolEvents:session.role==='admin'||session.school_events===1,classScopes:editorClasses(session),editExams:session.edit_exams===1,editEvents:session.edit_events===1,editOthers:session.edit_others===1,username:session.username,role:session.role||'admin',displayName:session.display_name||session.username,...data,content:session.role==='editor'?editorContent(data.content,session):data.content}}
function owner(session){if(session.role!=='admin'||session.username!=='kubicek')throw new PortalError('Tato operace je dostupná jen hlavnímu administrátorovi.',403)}
export function assertOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('x-portal-action')!=='1')throw new PortalError('Požadavek musí přijít z tohoto webu.',403)}
export async function commitContent(db,content,revision,actor){
 if(!Number.isSafeInteger(revision)||revision<0)throw new PortalError('Neplatná verze obsahu.');
 const stamp=new Date().toISOString(),body=JSON.stringify(content);
 const write=revision===0?db.prepare('INSERT OR IGNORE INTO portal_content (id,body,revision,updated_at) VALUES (1,?,1,?)').bind(body,stamp):db.prepare('UPDATE portal_content SET body=?,revision=revision+1,updated_at=? WHERE id=1 AND revision=?').bind(body,stamp,revision);
 const results=await db.batch([db.prepare("INSERT OR IGNORE INTO portal_versions (revision,body,actor,created_at) SELECT revision,body,'předchozí verze',updated_at FROM portal_content WHERE id=1 AND revision=?").bind(revision),write,db.prepare('INSERT OR IGNORE INTO portal_versions (revision,body,actor,created_at) SELECT revision,body,?,updated_at FROM portal_content WHERE id=1 AND revision=? AND body=?').bind(actor,revision+1,body)]);
 if(results[1].meta.changes!==1)throw new PortalError('Obsah mezitím změnil jiný uživatel. Zkopíruj rozepsané změny a znovu načti tuto sekci.',409);
 return{content,revision:revision+1,updatedAt:stamp};
}
async function audit(db,actor,action,detail){await db.prepare('INSERT INTO portal_audit (actor,action,detail,created_at) VALUES (?,?,?,?)').bind(actor,action,detail,new Date().toISOString()).run()}
async function users(db){const r=await db.prepare('SELECT username,role,edit_exams,edit_events,edit_others,class_scopes,school_events,display_name,active FROM portal_admins ORDER BY username').all();return r.results}
export async function adminRequest(db,request,bootstrapVerifier){
 if(request.method==='GET'){const s=await readSession(db,request);return{body:s?await payload(db,s):{authenticated:false,username:null}}}
 if(request.method!=='POST')throw new PortalError('Nepodporovaná metoda.',405);
 assertOrigin(request);const input=await bodyJSON(request);
 if(input.action==='login'){
  await rateLimit(db,request);const username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
  let admin=await db.prepare('SELECT username,verifier,version,role,edit_exams,edit_events,edit_others,class_scopes,school_events,display_name,active FROM portal_admins WHERE username=?').bind(username).first();
  const ok=await verifyPassword(input.password,admin?.verifier||bootstrapVerifier);
  if(!ok||(!admin&&username!=='kubicek')||(admin&&admin.active!==1))throw new PortalError('Nesprávné uživatelské jméno nebo heslo.',401);
  if(!admin){await db.prepare("INSERT OR IGNORE INTO portal_admins (username,verifier,version,role,display_name,active) VALUES (?,?,1,'admin','Kubíček',1)").bind('kubicek',bootstrapVerifier).run();admin=await db.prepare('SELECT username,verifier,version,role,edit_exams,edit_events,edit_others,class_scopes,school_events,display_name,active FROM portal_admins WHERE username=?').bind(username).first();if(!await verifyPassword(input.password,admin.verifier))throw new PortalError('Přihlášení se nezdařilo.',401)}
  if(!admin.verifier.startsWith('scrypt$')){
   const upgraded=await makeVerifier(input.password);
   await db.prepare('UPDATE portal_admins SET verifier=? WHERE username=? AND verifier=? AND version=? AND active=1').bind(upgraded,admin.username,admin.verifier,admin.version).run();
   const current=await db.prepare('SELECT username,verifier,version,role,edit_exams,edit_events,edit_others,class_scopes,school_events,display_name,active FROM portal_admins WHERE username=?').bind(admin.username).first();
   if(!current||current.active!==1||!await verifyPassword(input.password,current.verifier))throw new PortalError('Přihlášení se nezdařilo.',401);
   admin=current;
  }
  const token=random();await db.batch([db.prepare('DELETE FROM portal_sessions WHERE expires<?').bind(Date.now()),db.prepare('INSERT INTO portal_sessions (token_hash,username,version,expires) VALUES (?,?,?,?)').bind(await digest(token),admin.username,admin.version,Date.now()+SESSION_SECONDS*1000)]);
  return{body:await payload(db,admin),cookie:sessionCookie(token)};
 }
 const session=await readSession(db,request);if(!session)throw new PortalError('Přihlas se do správy webu.',401);
 if(input.action==='logout'){await db.prepare('DELETE FROM portal_sessions WHERE token_hash=?').bind(session.token_hash).run();return{body:{authenticated:false},cookie:sessionCookie('',0)}}
 if(input.action==='password'){
  await rateLimit(db,request);const admin=await db.prepare('SELECT verifier FROM portal_admins WHERE username=?').bind(session.username).first();
  if(!await verifyPassword(input.currentPassword,admin.verifier))throw new PortalError('Současné heslo není správné.',400);
  if(typeof input.newPassword!=='string'||input.newPassword.length<12||input.newPassword.length>256)throw new PortalError('Nové heslo musí mít 12 až 256 znaků.');
  if(input.newPassword===input.currentPassword)throw new PortalError('Zvol jiné heslo než současné.');
  await db.batch([db.prepare('UPDATE portal_admins SET verifier=?,version=version+1 WHERE username=?').bind(await makeVerifier(input.newPassword),session.username),db.prepare('DELETE FROM portal_sessions WHERE username=?').bind(session.username)]);
  return{body:{authenticated:false,passwordChanged:true},cookie:sessionCookie('',0)};
 }
 if(['news_save','news_delete','news_publish'].includes(input.action))throw new PortalError('Redakční aktuality jsou zrušené. Na hlavní stránce se načítá oficiální web školy.',410);
 if(input.action==='exam_save'||input.action==='exam_delete'){
  const current=await readContent(db),content=current.content;
  if(input.revision!==current.revision)throw new PortalError('Kalendář mezitím někdo změnil. Obnov seznam a zopakuj úpravu.',409);
  const examId=input.action==='exam_save'?input.exam?.id:input.id,previous=content.exams.find(e=>e.id===examId);
  if(previous)assertClassAccess(session,previous.cls||'1.A');
  if(input.action==='exam_save')assertClassAccess(session,LessonChanges.normalizeClass(input.exam?.cls));
  if(previous&&previous.author!==session.username&&session.role!=='admin'&&!(input.action==='exam_save'&&session.edit_exams===1))throw new PortalError('Můžeš upravovat pouze své písemky.',403);
  if(input.action==='exam_delete'){if(!previous)throw new PortalError('Písemka nebyla nalezena.',404);content.exams=content.exams.filter(e=>e.id!==examId)}
  else{const exam=validateExam({...input.exam,editedBy:previous?session.username:undefined,editedAt:previous?new Date().toISOString():undefined,author:previous?.author||session.username,authorName:previous?.authorName||session.display_name||session.username});if((content.events??school.events).some(e=>e.date===exam.date&&(e.kind==='volno'||e.allDay===true)&&LessonChanges.eventApplies(e,exam.cls)))throw new PortalError('Na tento den je volno nebo celodenní školní akce bez výuky. Vyber pro písemku jiný den.');if(!previous&&content.exams.length>=300)throw new PortalError('Nejvýše 300 písemek.');const i=content.exams.findIndex(e=>e.id===exam.id);if(i>=0)content.exams[i]=exam;else content.exams.push(exam)}
  const saved=await commitContent(db,validateContent(content),current.revision,session.username);return{body:{...saved,content:session.role==='editor'?editorContent(saved.content,session):saved.content}};
 }
 if(input.action==='event_save'||input.action==='event_delete'){
  const current=await readContent(db),content=current.content;
  if(input.revision!==current.revision)throw new PortalError('Kalendář mezitím někdo změnil. Obnov seznam a zopakuj úpravu.',409);
  const events=content.events??school.events.map((e,i)=>({...e,id:e.id||'event-'+i,author:'kubicek'}));
  const eventId=input.action==='event_save'?input.event?.id:input.id,previous=events.find(e=>e.id===eventId);
  if(input.action==='event_save'&&!Array.isArray(input.event?.classes)){const classes=previous?.classes??(session.role!=='admin'?['1.A']:undefined);if(classes)input.event={...input.event,classes}}
  if(previous)assertEventAccess(session,previous);if(input.action==='event_save')assertEventAccess(session,input.event);
  if(previous&&(previous.author||'kubicek')!==session.username&&session.role!=='admin'&&!(input.action==='event_save'&&session.edit_events===1))throw new PortalError('Můžeš upravovat pouze své školní akce a volné dny.',403);
  if(input.action==='event_delete'){if(!previous)throw new PortalError('Událost nebyla nalezena.',404);content.events=events.filter(e=>e.id!==eventId)}
  else{const event=validateEvent({...input.event,editedBy:previous?session.username:undefined,editedAt:previous?new Date().toISOString():undefined,author:previous?.author||session.username,authorName:previous?.authorName||session.display_name||session.username});if(!previous&&events.length>=600)throw new PortalError('Nejvýše 600 událostí.');const i=events.findIndex(e=>e.id===event.id);content.events=[...events];if(i>=0)content.events[i]=event;else content.events.push(event)}
  const saved=await commitContent(db,validateContent(content),current.revision,session.username);return{body:{...saved,content:session.role==='editor'?editorContent(saved.content,session):saved.content}};
 }
 owner(session);
 if(input.action==='lesson_change_save'||input.action==='lesson_change_delete'){
  const current=await readContent(db),content=current.content;if(input.revision!==current.revision)throw new PortalError('Rozvrh mezitím někdo změnil. Obnov kalendář a zopakuj úpravu.',409);
  const changes=content.lessonChanges||[];
  if(input.action==='lesson_change_delete'){if(!changes.some(c=>c.id===input.id))throw new PortalError('Změna hodiny nebyla nalezena.',404);content.lessonChanges=changes.filter(c=>c.id!==input.id)}
  else{const c=validateLessonChange(input.change),teachers=content.teachers??school.teachers;
   if(c.date<'2026-10-12'||c.date>'2027-06-30'||new Date(c.date+'T12:00:00Z').getUTCDay()%6===0||(content.events??school.events).some(e=>e.date===c.date&&(e.kind==='volno'||e.allDay===true)&&LessonChanges.eventApplies(e,c.cls)))throw new PortalError('Na tento den není naplánovaná běžná výuka.');
   if(!LessonChanges.original(teachers,c))throw new PortalError('Původní hodina už není v rozvrhu. Obnov kalendář.');
   if(c.kind==='replace'&&!teachers.some(t=>t.id===c.teacherId))throw new PortalError('Vyber existujícího vyučujícího.');
   const existing=changes.find(x=>x.date===c.date&&x.hour===c.hour&&x.originalTeacherId===c.originalTeacherId&&x.group===c.group&&(x.cls||'1.A')===c.cls);
   if(existing&&existing.id!==c.id)throw new PortalError('Tato hodina už má změnu. Otevři ji znovu a uprav ji.',409);
   content.lessonChanges=[...changes.filter(x=>x.id!==c.id),c];
  }
  const saved=await commitContent(db,validateContent(content),current.revision,session.username);return{body:saved};
 }
 if(['push_test_info','push_test_send','push_test_status'].includes(input.action)){const {managePushTests}=await import('./push-tests.mjs');return managePushTests(db,input,session.username)}
 if(['reports_list','report_update'].includes(input.action)){const {manageReports}=await import('./portal-reports.mjs');return{body:await manageReports(db,session,input)}}
 if(input.action==='save'){const saved=await commitContent(db,validateContent(input.content),input.revision,session.username);return{body:saved}}
 if(input.action==='users')return{body:{users:await users(db)}};
 if(input.action==='user_create'){
  const username=typeof input.username==='string'?input.username.trim().toLowerCase():'';if(!/^[a-z][a-z0-9_-]{2,39}$/.test(username)||username==='kubicek')throw new PortalError('Jméno účtu: 3–40 znaků, začíná písmenem, bez mezer a diakritiky.');
  if(typeof input.password!=='string'||input.password.length<12||input.password.length>256)throw new PortalError('Počáteční heslo musí mít 12 až 256 znaků.');
  const scopes=validScopes(input.classScopes??['1.A']);
  const displayName=typeof input.displayName==='string'?input.displayName.trim().slice(0,100):username;
  if(await db.prepare('SELECT username FROM portal_admins WHERE username=?').bind(username).first())throw new PortalError('Toto uživatelské jméno už existuje.',409);
  if((await users(db)).length>=50)throw new PortalError('Nejvýše 50 účtů.');
  await db.prepare("INSERT INTO portal_admins (username,verifier,version,role,display_name,active,edit_exams,edit_events,edit_others,class_scopes,school_events) VALUES (?,?,1,'editor',?,1,?,?,?,?,?)").bind(username,await makeVerifier(input.password),displayName||username,input.editExams===true?1:0,input.editEvents===true?1:0,input.editOthers===true?1:0,JSON.stringify(scopes),input.schoolEvents===true?1:0).run();await audit(db,session.username,'user_create',username);return{body:{users:await users(db)}};
 }
 if(input.action==='user_update'){
  if(input.username==='kubicek')throw new PortalError('Hlavní administrátorský účet nelze deaktivovat ani změnit tímto formulářem.');
  const u=await db.prepare('SELECT username FROM portal_admins WHERE username=?').bind(String(input.username||'')).first();if(!u)throw new PortalError('Účet neexistuje.',404);
  const scopes=input.classScopes===undefined?null:validScopes(input.classScopes);
  const name=typeof input.displayName==='string'?input.displayName.trim().slice(0,100):u.username;
  if(input.password){if(typeof input.password!=='string'||input.password.length<12||input.password.length>256)throw new PortalError('Heslo musí mít 12 až 256 znaků.');await db.prepare('UPDATE portal_admins SET edit_exams=COALESCE(?,edit_exams),edit_events=COALESCE(?,edit_events),edit_others=COALESCE(?,edit_others),display_name=?,active=?,verifier=?,version=version+1 WHERE username=?').bind(typeof input.editExams==='boolean'?Number(input.editExams):null,typeof input.editEvents==='boolean'?Number(input.editEvents):null,typeof input.editOthers==='boolean'?Number(input.editOthers):null,name,input.active===false?0:1,await makeVerifier(input.password),u.username).run()}
  else await db.prepare('UPDATE portal_admins SET edit_exams=COALESCE(?,edit_exams),edit_events=COALESCE(?,edit_events),edit_others=COALESCE(?,edit_others),display_name=?,active=?,version=version+1 WHERE username=?').bind(typeof input.editExams==='boolean'?Number(input.editExams):null,typeof input.editEvents==='boolean'?Number(input.editEvents):null,typeof input.editOthers==='boolean'?Number(input.editOthers):null,name,input.active===false?0:1,u.username).run();
  if(scopes!==null)await db.prepare('UPDATE portal_admins SET class_scopes=? WHERE username=?').bind(JSON.stringify(scopes),u.username).run();
  if(typeof input.schoolEvents==='boolean')await db.prepare('UPDATE portal_admins SET school_events=? WHERE username=?').bind(Number(input.schoolEvents),u.username).run();
  await db.prepare('DELETE FROM portal_sessions WHERE username=?').bind(u.username).run();await audit(db,session.username,'user_update',u.username);return{body:{users:await users(db)}};
 }
 if(input.action==='history'){const v=await db.prepare('SELECT revision,actor,created_at FROM portal_versions ORDER BY revision DESC LIMIT 30').all();const a=await db.prepare('SELECT actor,action,detail,created_at FROM portal_audit ORDER BY id DESC LIMIT 30').all();return{body:{versions:v.results,audit:a.results}}}
 if(input.action==='restore'){const v=await db.prepare('SELECT body FROM portal_versions WHERE revision=?').bind(input.targetRevision).first();if(!v)throw new PortalError('Verze nebyla nalezena.',404);const saved=await commitContent(db,validateContent(JSON.parse(v.body)),input.revision,session.username);await audit(db,session.username,'restore',String(input.targetRevision));return{body:saved}}
 throw new PortalError('Neznámá akce.');
}
export async function adminResponse(db,request,bootstrap,onPublished,onPushTest){
 try{const result=await adminRequest(db,request,bootstrap);if(result.pushTestEvent&&onPushTest){try{onPushTest(result.pushTestEvent)}catch{console.warn('Test push could not start')}}if(result.pushEvent&&onPublished){try{onPublished(result.pushEvent)}catch{console.warn('News push could not start')}}return Response.json(result.body,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(result.cookie?{'Set-Cookie':result.cookie}:{})}})}
 catch(error){if(!(error instanceof PortalError))console.error('Portal admin request failed');return Response.json({error:error instanceof PortalError?error.message:'Správa webu je dočasně nedostupná. Zkus to znovu.'},{status:error instanceof PortalError?error.status:503,headers:{'Cache-Control':'no-store'}})}
}
