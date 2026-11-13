import {PortalError} from './cms-content.mjs';
import {ensurePush,pushRecipients,pushCategories,signingKeys,sendPush,pushDiagnostics} from './portal-push.mjs';
const initialized=new WeakMap();
export async function ensurePushTests(db){await ensurePush(db);if(!initialized.has(db))initialized.set(db,db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS portal_push_tests (id TEXT PRIMARY KEY, actor TEXT NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL, total INTEGER NOT NULL, accepted INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, legacy INTEGER NOT NULL DEFAULT 0)')
]).then(()=>db.prepare('CREATE INDEX IF NOT EXISTS portal_push_tests_created ON portal_push_tests(created_at)').run()).catch(e=>{initialized.delete(db);throw e}));await initialized.get(db)}
const active=row=>!row.categories||Object.values(pushCategories(JSON.parse(row.categories))).some(Boolean);
export function pushTestMessage(id){return{id:'test-'+id,title:'Betlémská · test upozornění',body:'Testovací oznámení od správce. Pokud ho vidíš na telefonu, upozornění fungují.',url:'index.html#home',kind:'test'}}
function publicTest(row){return{id:row.id,status:row.status,total:row.total,accepted:row.accepted,failed:row.failed,legacy:row.legacy,createdAt:row.created_at}}
export async function managePushTests(db,input,actor){
 await ensurePushTests(db);
 if(input.action==='push_test_info'){const rows=await pushRecipients(db),recipients=rows.filter(active),latest=await db.prepare('SELECT * FROM portal_push_tests ORDER BY created_at DESC LIMIT 1').first();return{body:{total:recipients.length,paused:rows.length-recipients.length,legacy:recipients.filter(r=>!r.p256dh||!r.auth).length,lastTest:latest?publicTest(latest):null,diagnostics:await pushDiagnostics(db)}}}
 if(typeof input.id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.id))throw new PortalError('Neplatné ID testu.');
 const existing=await db.prepare('SELECT * FROM portal_push_tests WHERE id=?').bind(input.id).first();
 if(input.action==='push_test_status'){if(!existing)throw new PortalError('Test nebyl nalezen.',404);return{body:{test:publicTest(existing)}}}
 if(input.action!=='push_test_send')throw new PortalError('Neznámá akce.');
 if(input.confirm!==true)throw new PortalError('Potvrď odeslání testu všem aktivním odběratelům.');
 if(existing)return{body:{test:publicTest(existing),duplicate:true}};
 const recipients=(await pushRecipients(db)).filter(active);if(!recipients.length)throw new PortalError('Zatím tu není žádné aktivní zařízení. Zapni na telefonu zvonek Upozornění a potom test zopakuj.');
 const now=Date.now(),legacy=recipients.filter(r=>!r.p256dh||!r.auth).length;
 const claim=await db.prepare("INSERT OR IGNORE INTO portal_push_tests (id,actor,created_at,status,total,legacy) SELECT ?,?,?,'queued',?,? WHERE NOT EXISTS (SELECT 1 FROM portal_push_tests WHERE created_at>?)").bind(input.id,actor,now,recipients.length,legacy,now-60000).run();
 if(!claim.meta.changes){const repeated=await db.prepare('SELECT * FROM portal_push_tests WHERE id=?').bind(input.id).first();if(repeated)return{body:{test:publicTest(repeated),duplicate:true}};throw new PortalError('Test můžeš poslat nejvýše jednou za minutu. Chvilku počkej.',429)}
 return{body:{test:publicTest(await db.prepare('SELECT * FROM portal_push_tests WHERE id=?').bind(input.id).first())},pushTestEvent:{id:input.id}};
}
export async function runPushTest(db,id,origin,send=fetch){
 await ensurePushTests(db);const claim=await db.prepare("UPDATE portal_push_tests SET status='sending' WHERE id=? AND status='queued'").bind(id).run();if(!claim.meta.changes)return{duplicate:true};
 let accepted=0,failed=0;
 try{const rows=(await pushRecipients(db)).filter(active),keys=await signingKeys(db);await db.prepare('UPDATE portal_push_tests SET total=?,legacy=? WHERE id=?').bind(rows.length,rows.filter(r=>!r.p256dh||!r.auth).length,id).run();let at=0;await Promise.all(Array.from({length:Math.min(40,rows.length)},async()=>{while(at<rows.length){const row=rows[at++];try{if(await sendPush(db,row,pushTestMessage(id),origin,send,true,keys))accepted++;else failed++}catch{failed++}}}));await db.prepare("UPDATE portal_push_tests SET status='complete',accepted=?,failed=? WHERE id=?").bind(accepted,failed,id).run();return{accepted,failed};
 }catch(e){await db.prepare("UPDATE portal_push_tests SET status='failed',accepted=?,failed=? WHERE id=?").bind(accepted,failed,id).run();throw e}
}
// Legacy subscriptions can receive only an empty wakeup. Keep their short-lived
// public fallback useful until a normal visit refreshes their encryption keys.
export async function latestTestFallback(db,newsCreated=0){await ensurePushTests(db);const row=await db.prepare("SELECT id,created_at FROM portal_push_tests WHERE status IN ('sending','complete') AND created_at>? ORDER BY created_at DESC LIMIT 1").bind(Math.max(Number(newsCreated)||0,Date.now()-300000)).first();return row?pushTestMessage(row.id):null}
