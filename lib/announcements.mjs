import {PortalError} from './cms-content.mjs';
import {LessonChanges} from './lesson-changes.mjs';
import {pushRecipients,pushCategories,signingKeys,sendPush} from './portal-push.mjs';
const ready=new WeakMap();
export async function ensureAnnouncements(db){if(!ready.has(db))ready.set(db,db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS portal_announcement_roles (username TEXT PRIMARY KEY, school_wide INTEGER NOT NULL DEFAULT 0)'),
 db.prepare("CREATE TABLE IF NOT EXISTS portal_announcements (id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,school_class TEXT NOT NULL,author TEXT NOT NULL,author_name TEXT NOT NULL,created_at INTEGER NOT NULL,push_status TEXT NOT NULL DEFAULT 'queued',accepted INTEGER NOT NULL DEFAULT 0,failed INTEGER NOT NULL DEFAULT 0)")
]).then(()=>db.prepare('CREATE INDEX IF NOT EXISTS portal_announcements_date ON portal_announcements(created_at)').run()).catch(e=>{ready.delete(db);throw e}));await ready.get(db)}
export async function announcementRights(db,s){await ensureAnnouncements(db);const parliament=await db.prepare('SELECT school_wide FROM portal_announcement_roles WHERE username=?').bind(s.username).first();const all=s.role==='admin'||parliament?.school_wide===1;let scopes=[];try{scopes=JSON.parse(s.class_scopes||'[]')}catch{}const classes=LessonChanges.classNames.filter(c=>scopes.includes(c)&&['predseda-','zastupce-'].some(p=>s.username===p+c.replace('.','').toLowerCase()));return{all,classes:all?LessonChanges.classNames:classes}}
function publicRow(r){return{id:r.id,title:r.title,body:r.body,schoolClass:r.school_class,authorName:r.author_name,createdAt:r.created_at}}
export async function listAnnouncements(db,cls){await ensureAnnouncements(db);if(!LessonChanges.classNames.includes(cls))throw new PortalError('Vyber platnou třídu.');return(await db.prepare("SELECT * FROM portal_announcements WHERE school_class='' OR school_class=? ORDER BY created_at DESC LIMIT 100").bind(cls).all()).results.map(publicRow)}
export async function manageAnnouncements(db,s,input){await ensureAnnouncements(db);const rights=await announcementRights(db,s);
 if(input.action==='announcement_roles'){
  if(s.role!=='admin'||s.username!=='kubicek')throw new PortalError('Role spravuje hlavní administrátor.',403);
  return{body:{users:(await db.prepare('SELECT a.username,a.display_name,COALESCE(r.school_wide,0) AS school_wide FROM portal_admins a LEFT JOIN portal_announcement_roles r ON a.username=r.username WHERE a.active=1 ORDER BY a.username').all()).results}};
 }
 if(input.action==='announcement_role_save'){
  if(s.role!=='admin'||s.username!=='kubicek')throw new PortalError('Role spravuje hlavní administrátor.',403);
  const username=String(input.username||'');if(username&&!await db.prepare('SELECT username FROM portal_admins WHERE username=? AND active=1').bind(username).first())throw new PortalError('Vyber aktivní účet.');
  await db.batch([db.prepare('UPDATE portal_announcement_roles SET school_wide=0'),...(username?[db.prepare('INSERT INTO portal_announcement_roles (username,school_wide) VALUES (?,1) ON CONFLICT(username) DO UPDATE SET school_wide=1').bind(username)]:[]),db.prepare('INSERT INTO portal_audit (actor,action,detail,created_at) VALUES (?,?,?,?)').bind(s.username,'parliament_chair',username||'neobsazeno',new Date().toISOString())]);return{body:{saved:true}};
 }
 if(!rights.all&&!rights.classes.length)throw new PortalError('Oznámení mohou publikovat předsedové, zástupci, předseda parlamentu a administrátoři.',403);
 if(input.action==='announcement_list'){const rows=(await db.prepare('SELECT * FROM portal_announcements ORDER BY created_at DESC LIMIT 300').all()).results;return{body:{rights,items:rows.filter(r=>rights.all||rights.classes.includes(r.school_class)).map(r=>({...publicRow(r),pushStatus:r.push_status,accepted:r.accepted,failed:r.failed}))}}}
 if(input.action!=='announcement_publish')throw new PortalError('Neznámá akce.');
 const cls=typeof input.schoolClass==='string'?input.schoolClass:null;if(cls===null||cls!==''&&!LessonChanges.classNames.includes(cls))throw new PortalError('Vyber příjemce.');if(!rights.all&&!rights.classes.includes(cls))throw new PortalError('Můžeš posílat pouze své třídě.',403);
 const id=input.id;if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw new PortalError('Neplatné ID oznámení.');
 const title=typeof input.title==='string'?input.title.trim():'',body=typeof input.body==='string'?input.body.trim():'';if(!title||title.length>140||!body||body.length>5000)throw new PortalError('Vyplň nadpis (do 140 znaků) a zprávu (do 5 000 znaků).');
 const old=await db.prepare('SELECT * FROM portal_announcements WHERE id=?').bind(id).first();if(old){if(old.author!==s.username||old.school_class!==cls||old.title!==title||old.body!==body)throw new PortalError('Toto ID už patří jinému oznámení.',409);return{body:{published:true,duplicate:true,item:publicRow(old)}}}
 if(input.confirm!==true)throw new PortalError('Potvrď zveřejnění a odeslání oznámení.');
 const now=Date.now();const result=await db.prepare("INSERT OR IGNORE INTO portal_announcements (id,title,body,school_class,author,author_name,created_at) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM portal_announcements WHERE author=? AND created_at>?)").bind(id,title,body,cls,s.username,s.display_name||s.username,now,s.username,now-60000).run();if(!result.meta.changes)throw new PortalError('Oznámení posílej nejvýše jednou za minutu.',429);
 return{body:{published:true},announcementEvent:{id}};
}
export async function broadcastAnnouncement(db,id,origin,send=fetch){await ensureAnnouncements(db);const claim=await db.prepare("UPDATE portal_announcements SET push_status='sending' WHERE id=? AND push_status='queued'").bind(id).run();if(!claim.meta.changes)return{duplicate:true};let accepted=0,failed=0;
 try{const item=await db.prepare('SELECT * FROM portal_announcements WHERE id=?').bind(id).first(),rows=(await pushRecipients(db)).filter(r=>{let p;try{p=JSON.parse(r.categories||'{}')}catch{return false}return pushCategories(p).announcements&&(!item.school_class||p.schoolClass===item.school_class)}),keys=await signingKeys(db);const message={id:'announcement-'+id,kind:'announcement',title:item.title,body:item.body.slice(0,200),url:'index.html#home?announcement='+encodeURIComponent(id)+(item.school_class?'&announcementClass='+encodeURIComponent(item.school_class):'')};let at=0;await Promise.all(Array.from({length:Math.min(20,rows.length)},async()=>{while(at<rows.length){const row=rows[at++];try{if(await sendPush(db,row,message,origin,send,true,keys))accepted++;else failed++}catch{failed++}}}));await db.prepare("UPDATE portal_announcements SET push_status='complete',accepted=?,failed=? WHERE id=?").bind(accepted,failed,id).run();return{accepted,failed};
 }catch(error){await db.prepare("UPDATE portal_announcements SET push_status='failed',accepted=?,failed=? WHERE id=?").bind(accepted,failed,id).run();throw error}
}
