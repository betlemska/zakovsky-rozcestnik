// Explicit deployment-time provisioning. Only salted verifiers enter runtime secrets.
// No passwords, account lists or secrets are committed with the application.
import {LessonChanges} from './lesson-changes.mjs';
const initialized=new WeakMap();
function parseBatches(batches){
 const records=batches.filter(Boolean).flatMap(value=>JSON.parse(value));
 const expected=new Set(LessonChanges.classNames.flatMap(cls=>['predseda','zastupce'].map(role=>role+'-'+cls.replace('.','').toLowerCase())));
 if(records.length!==40)throw Error('Expected the complete representative batch');
 for(const r of records){if(!r||!expected.delete(r.username)||!LessonChanges.classNames.includes(r.cls)||!['predseda-'+r.cls.replace('.','').toLowerCase(),'zastupce-'+r.cls.replace('.','').toLowerCase()].includes(r.username)||r.displayName!==(r.username.startsWith('predseda-')?'Předseda ':'Zástupce ')+r.cls||!/^scrypt\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(r.verifier))throw Error('Invalid representative provisioning batch')}
 if(expected.size)throw Error('Incomplete representative batch');return records;
}
export async function provisionClassRepresentatives(db,batches=[]){
 if(!batches.some(Boolean))return{created:0};
 if(!initialized.has(db))initialized.set(db,(async()=>{
  const records=parseBatches(batches),existing=(await db.prepare('SELECT username,verifier,role,class_scopes,school_events FROM portal_admins WHERE username IN ('+records.map(()=>'?').join(',')+')').bind(...records.map(r=>r.username)).all()).results;
  for(const row of existing){const wanted=records.find(r=>r.username===row.username);if(row.role!=='editor'||row.verifier!==wanted.verifier||row.class_scopes!==JSON.stringify([wanted.cls])||row.school_events!==1)throw Error('An existing account conflicts with the requested batch')}
  const missing=records.filter(r=>!existing.some(e=>e.username===r.username));if(!missing.length)return{created:0,existing:40};
  const results=await db.batch([...missing.map(r=>db.prepare("INSERT OR IGNORE INTO portal_admins (username,verifier,version,role,display_name,active,edit_exams,edit_events,edit_others,class_scopes,school_events) VALUES (?,?,1,'editor',?,1,0,0,0,?,1)").bind(r.username,r.verifier,r.displayName,JSON.stringify([r.cls]))),db.prepare('INSERT INTO portal_audit (actor,action,detail,created_at) VALUES (?,?,?,?)').bind('kubicek','representatives_provisioned',missing.map(r=>r.username).join(', '),new Date().toISOString())]);
  return{created:results.slice(0,-1).reduce((sum,r)=>sum+r.meta.changes,0),existing:existing.length};
 })().catch(error=>{initialized.delete(db);throw error}));return initialized.get(db);
}
