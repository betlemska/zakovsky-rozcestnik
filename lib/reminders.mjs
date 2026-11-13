import {LessonChanges} from './lesson-changes.mjs';
import {Calendar} from './calendar.mjs';
import school from './school-defaults.json' with {type:'json'};
import {readContent} from './portal-admin.mjs';
import {ensurePush,pushRecipients,pushCategories,sendPush,signingKeys} from './portal-push.mjs';
const initialized=new WeakMap();
export async function ensureReminders(db){await ensurePush(db);if(!initialized.has(db))initialized.set(db,db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS portal_reminder_runs (day TEXT PRIMARY KEY, target_date TEXT NOT NULL, status TEXT NOT NULL, accepted INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, skipped INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)'),
 db.prepare('CREATE TABLE IF NOT EXISTS portal_reminder_checks (id INTEGER PRIMARY KEY CHECK(id=1), checked_at TEXT NOT NULL)')
]).catch(e=>{initialized.delete(db);throw e}));await initialized.get(db)}
export async function tomorrowPreview(db,now=new Date()){
 const date=Calendar.nextDay(Calendar.pragueDay(now)),{content}=await readContent(db);
 const items=Calendar.reminderItems(content.teachers??school.teachers,content.events??school.events,content.exams||[],date,content.lessonChanges||[]);
 const itemsByClass=Object.fromEntries(LessonChanges.classNames.map(cls=>[cls,Calendar.reminderItems(content.teachers??school.teachers,content.events??school.events,content.exams||[],date,content.lessonChanges||[],cls)]));
 return{date,items,itemsByClass,example:Calendar.reminderMessage(items,date,{namedays:true,events:true,exams:true})};
}
export async function reminderStatus(db){await ensureReminders(db);return{lastCheck:await db.prepare('SELECT checked_at FROM portal_reminder_checks WHERE id=1').first(),lastRun:await db.prepare('SELECT day,target_date,status,accepted,failed,skipped,created_at FROM portal_reminder_runs ORDER BY day DESC LIMIT 1').first()}}
export async function runTomorrowReminders(db,origin,now=new Date(),send=fetch){
 await ensureReminders(db);await db.prepare('INSERT INTO portal_reminder_checks (id,checked_at) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET checked_at=excluded.checked_at').bind(now.toISOString()).run();
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',hour:'2-digit',hourCycle:'h23'}).format(now));
 if(hour<18)return{status:'not_due',next:'18:00 Europe/Prague',...(await reminderStatus(db))};
 const preview=await tomorrowPreview(db,now),day=Calendar.pragueDay(now);
 const claim=await db.prepare("INSERT OR IGNORE INTO portal_reminder_runs (day,target_date,status,created_at) VALUES (?,?,'running',?)").bind(day,preview.date,now.toISOString()).run();
 if(!claim.meta.changes)return{status:'already_processed',...(await reminderStatus(db))};
 let accepted=0,failed=0,skipped=0;
 try{const recipients=await pushRecipients(db),keys=await signingKeys(db);let at=0;await Promise.all(Array.from({length:Math.min(40,recipients.length)},async()=>{while(at<recipients.length){const row=recipients[at++];const preferences=row.categories?JSON.parse(row.categories):{},categories=pushCategories(preferences),cls=preferences.schoolClass||'1.A',message=Calendar.reminderMessage(preview.itemsByClass[cls]||[],preview.date,categories,cls);if(!message){skipped++;continue}try{if(await sendPush(db,row,message,origin,send,false,keys))accepted++;else failed++}catch{failed++}}}));
 await db.prepare("UPDATE portal_reminder_runs SET status='complete',accepted=?,failed=?,skipped=? WHERE day=?").bind(accepted,failed,skipped,day).run();
 }catch(e){await db.prepare("UPDATE portal_reminder_runs SET status='failed',accepted=?,failed=?,skipped=? WHERE day=?").bind(accepted,failed,skipped,day).run();throw e}
 return{status:'complete',date:preview.date,events:preview.items.length,accepted,failed,skipped};
}
