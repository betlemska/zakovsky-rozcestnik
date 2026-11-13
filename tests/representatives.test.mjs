import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {LessonChanges as L} from '../lib/lesson-changes.mjs';
import {Calendar} from '../lib/calendar.mjs';
import {makeVerifier,adminResponse,readContent} from '../lib/portal-admin.mjs';
import {provisionClassRepresentatives} from '../lib/class-representatives.mjs';
const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const adapter=()=>({prepare(sql){const stmt=sqlite.prepare(sql);let args=[];return{bind(...v){args=v;return this},async first(){return stmt.get(...args)||null},async all(){return{results:stmt.all(...args)}},async run(){return{meta:{changes:Number(stmt.run(...args).changes)}}}}},async batch(qs){sqlite.exec('BEGIN');try{const result=[];for(const q of qs)result.push(await q.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}});
const db=adapter(),password='representative-fixture-password',verifier=await makeVerifier(password);
const records=L.classNames.flatMap(cls=>['predseda','zastupce'].map(role=>({username:role+'-'+cls.replace('.','').toLowerCase(),displayName:(role==='predseda'?'Předseda ':'Zástupce ')+cls,cls,verifier}))),batches=[JSON.stringify(records.slice(0,20)),JSON.stringify(records.slice(20))];
assert.deepEqual(await provisionClassRepresentatives(db,[]),{created:0});
await assert.rejects(()=>provisionClassRepresentatives(adapter(),[JSON.stringify(records.slice(0,39))]));
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM portal_admins').get().n,0,'Invalid seed batches make no changes');
assert.equal((await provisionClassRepresentatives(db,batches)).created,40);
assert.equal((await provisionClassRepresentatives(adapter(),batches)).created,0,'Provisioning never resets existing credentials');
const rows=sqlite.prepare('SELECT username,role,display_name,active,class_scopes,school_events,edit_exams,edit_events,edit_others FROM portal_admins').all();assert.equal(rows.length,40);
for(const row of rows){assert.equal(row.role,'editor');assert.equal(row.active,1);assert.equal(row.school_events,1);assert.equal(JSON.parse(row.class_scopes).length,1);assert.equal(row.edit_events,0);assert.equal(row.edit_others,0)}
const bad=structuredClone(records);bad[0].verifier=await makeVerifier('different-fixture-password');await assert.rejects(()=>provisionClassRepresentatives(adapter(),[JSON.stringify(bad)]));
const origin='https://portal.test';async function call(input,cookie=''){return adminResponse(db,new Request(origin+'/api/admin',{method:input?'POST':'GET',headers:{origin,cookie,'content-type':'application/json','x-portal-action':'1','cf-connecting-ip':input?.username||'editor'},...(input?{body:JSON.stringify(input)}:{})}),null)}
const signed=await call({action:'login',username:'predseda-1b',password});assert.equal(signed.status,200);const cookie=signed.headers.get('set-cookie').split(';')[0],session=await signed.json();assert.deepEqual(session.classScopes,['1.B']);assert.equal(session.schoolEvents,true);
let revision=(await readContent(db)).revision;
async function save(input,expected=200){const response=await call({...input,revision},cookie);assert.equal(response.status,expected,JSON.stringify(input));if(expected===200){const result=await response.json();revision=result.revision;return result}}
const event={id:'own-class',date:'2026-11-24',title:'Výlet 1.B',kind:'akce',classes:['1.B']};await save({action:'event_save',event});
await save({action:'event_save',event:{...event,id:'other-class',classes:['1.C']}},403);
await save({action:'event_save',event:{...event,id:'whole-school',title:'Společná akce',classes:[]}});
const content=(await readContent(db)).content;
for(const cls of L.classNames){const items=Calendar.calendarItems([],content.events,[],'2026-11-24','2026-11-24',[],cls);assert.ok(items.some(e=>e.id==='whole-school'));assert.equal(items.some(e=>e.id==='own-class'),cls==='1.B')}
await save({action:'event_delete',id:'whole-school'});
await save({action:'exam_save',exam:{id:'exam-1b',date:'2026-11-24',title:'Rovnice',subject:'MAT',cls:'1.B'}});
await save({action:'exam_save',exam:{id:'exam-1c',date:'2026-11-24',title:'Rovnice',subject:'MAT',cls:'1.C'}},403);
for(const action of ['news_save','news_delete','news_publish'])await save({action,post:{id:'no-post',title:'Not available'}},410);
await save({action:'users'},403);
const school=JSON.parse(readFileSync(new URL('../public/assets/data.json',import.meta.url)));
for(const cls of ['1.A','1.C'])for(const hour of [0,1]){const source=school.teachers.find(t=>t.id===(cls==='1.A'?'jakub-petrak':'vladislav-liszok')),lesson=source.schedule.find(l=>l.day===4&&l.hour===hour&&l.classes.includes(cls));assert.equal(lesson.group,cls==='1.A'?'2/2':'1/2');assert.deepEqual(L.teachersForLesson(school.teachers,source,lesson).map(t=>t.id).sort(),['jakub-petrak','vladislav-liszok']);assert.ok(lesson.jointTeaching.includes('1.C'))}
for(const cls of school.classes){assert.deepEqual(cls.representatives.map(r=>r.name),['Předseda '+cls.id,'Zástupce '+cls.id]);assert.equal(cls.source,'')}
console.log('Representatives: complete validated 40-account provisioning, idempotency and collision rejection, own-class exams, authorized whole-school events, other-class/cross-owner isolation, retired news API and joint PE for both halves passed.');
