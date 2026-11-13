import {PortalError} from './cms-content.mjs';
import {assertOrigin} from './portal-admin.mjs';
const initialized=new WeakMap(),encoder=new TextEncoder();
export const REPORT_CATEGORIES={schedule:'Rozvrh',teacher:'Vyučující a kontakty',lunch:'Jídelníček',technical:'Technická chyba',other:'Jiný podnět'};
export const REPORT_SCHEMA=[
 'CREATE TABLE IF NOT EXISTS portal_reports (id TEXT PRIMARY KEY,category TEXT NOT NULL,message TEXT NOT NULL,page TEXT NOT NULL,status TEXT NOT NULL DEFAULT \'new\',note TEXT NOT NULL DEFAULT \'\',revision INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS portal_report_attempts (id TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS portal_report_dedupe (id TEXT PRIMARY KEY,report_id TEXT NOT NULL,expires INTEGER NOT NULL)'
];
export async function ensureReports(db){if(!db)throw new PortalError('Hlášení chyb potřebuje hostovanou verzi webu.',503);if(!initialized.has(db))initialized.set(db,db.batch(REPORT_SCHEMA.map(s=>db.prepare(s))).then(()=>db.prepare('CREATE INDEX IF NOT EXISTS portal_reports_status_created ON portal_reports(status,created_at)').run()).catch(e=>{initialized.delete(db);throw e}));await initialized.get(db)}
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
function text(v,min,max,label){if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw new PortalError(`Zkontroluj ${label} (${min}–${max} znaků).`);return v.trim()}
export function reportPage(value){const page=text(value||'#home',1,400,'sekci');if(!/^#[a-z][a-z0-9-]*(?:\?[a-zA-Z0-9%_=&.-]*)?$/.test(page))throw new PortalError('Neplatná sekce hlášení.');return page}
async function readBody(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new PortalError('Požadován JSON.',415);const reader=request.body?.getReader();if(!reader)throw new PortalError('Chybí data.');let size=0,chunks=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>16000){await reader.cancel();throw new PortalError('Hlášení je příliš velké.',413)}chunks.push(r.value)}const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length}try{const v=JSON.parse(new TextDecoder().decode(bytes));if(!v||typeof v!=='object'||Array.isArray(v))throw 0;return v}catch{throw new PortalError('Neplatný JSON.')}}
export async function submitReport(db,request){
 if(request.method!=='POST')throw new PortalError('Nepodporovaná metoda.',405);assertOrigin(request);const input=await readBody(request);
 if(input.website)return {received:true,id:null};
 if(!Object.hasOwn(REPORT_CATEGORIES,input.category))throw new PortalError('Vyber oblast problému.');
 const message=text(input.message,15,3000,'popis problému'),page=reportPage(input.page),now=Date.now();await ensureReports(db);
 const ip=request.headers.get('cf-connecting-ip')||'unknown',bucket=await digest(ip+':'+Math.floor(now/600000));
 await db.prepare('DELETE FROM portal_report_attempts WHERE expires<?').bind(now).run();await db.prepare('DELETE FROM portal_report_dedupe WHERE expires<?').bind(now).run();
 const tries=await db.prepare('INSERT INTO portal_report_attempts (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+600000).first();if(tries.count>20)throw new PortalError('Příliš mnoho hlášení. Zkus to za 10 minut.',429);
 const dedupe=await digest(ip+'\n'+input.category+'\n'+page+'\n'+message),previous=await db.prepare('SELECT report_id FROM portal_report_dedupe WHERE id=?').bind(dedupe).first();if(previous)return{received:true,id:previous.report_id};
 const count=await db.prepare('SELECT COUNT(*) AS n FROM portal_reports').first();if(count.n>=5000)throw new PortalError('Schránka podnětů je nyní plná. Zkus to později.',503);
 const id=crypto.randomUUID(),stamp=new Date(now).toISOString();await db.batch([
 db.prepare('INSERT INTO portal_reports (id,category,message,page,status,note,revision,created_at,updated_at) VALUES (?,?,?,?,\'new\',\'\',1,?,?)').bind(id,input.category,message,page,stamp,stamp),
 db.prepare('INSERT OR REPLACE INTO portal_report_dedupe (id,report_id,expires) VALUES (?,?,?)').bind(dedupe,id,now+600000)
 ]);return{received:true,id};
}
export async function reportsResponse(db,request){try{return Response.json(await submitReport(db,request),{status:201,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch(e){return Response.json({error:e instanceof PortalError?e.message:'Podnět se nepodařilo odeslat. Zkus to později.'},{status:e instanceof PortalError?e.status:503,headers:{'Cache-Control':'no-store'}})}}
function assertOwner(session){if(session?.role!=='admin'||session.username!=='kubicek')throw new PortalError('Podněty může číst a řešit pouze hlavní administrátor.',403)}
export async function manageReports(db,session,input){assertOwner(session);await ensureReports(db);
 if(input.action==='reports_list'){
  const status=input.status||'all';if(!['all','new','working','resolved'].includes(status))throw new PortalError('Neplatný stav.');const offset=Number(input.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000)throw new PortalError('Neplatná stránka.');
  const where=status==='all'?'':' WHERE status=?',args=status==='all'?[]:[status];const reports=await db.prepare('SELECT * FROM portal_reports'+where+' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(...args,offset).all();const total=await db.prepare('SELECT COUNT(*) AS n FROM portal_reports'+where).bind(...args).first();const counts=await db.prepare('SELECT status,COUNT(*) AS n FROM portal_reports GROUP BY status').all();return{reports:reports.results,total:total.n,offset,counts:Object.fromEntries(counts.results.map(r=>[r.status,r.n]))};
 }
 if(input.action==='report_update'){
  const id=text(input.id,36,36,'ID podnětu');if(!/^[a-f0-9-]{36}$/.test(id)||!['new','working','resolved'].includes(input.status)||!Number.isSafeInteger(input.revision))throw new PortalError('Neplatný podnět nebo stav.');const note=text(input.note||'',0,2000,'interní poznámku');
  const stamp=new Date().toISOString(),r=await db.prepare('UPDATE portal_reports SET status=?,note=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=?').bind(input.status,note,stamp,id,input.revision).run();if(r.meta.changes!==1)throw new PortalError('Podnět mezitím někdo změnil. Obnov přehled.',409);return{updated:true};
 }
 throw new PortalError('Neznámá akce podnětů.');
}
