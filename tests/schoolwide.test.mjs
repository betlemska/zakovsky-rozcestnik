import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {LessonChanges as L} from '../lib/lesson-changes.mjs';
import {Calendar} from '../lib/calendar.mjs';
import {adminResponse,makeVerifier,readContent,upgradeSchool} from '../lib/portal-admin.mjs';
import {publicCors} from '../lib/public-cors.mjs';
const school=JSON.parse(readFileSync(new URL('../public/assets/data.json',import.meta.url)));
assert.equal(school.classes.length,20);assert.equal(school.teachers.length,56);
assert.equal(new Set(school.teachers.map(t=>t.id)).size,56);
assert.deepEqual(school.classes.map(c=>c.id).sort(),[...L.classNames].sort());
let classRecords=0;
for(const cls of school.classes){
 assert.ok(existsSync(new URL('../public/'+cls.source,import.meta.url)),cls.id+' source');
 for(const l of cls.lessons){classRecords++;const t=school.teachers.find(t=>t.id===l.teacherId);assert.ok(t,cls.id+' teacher');assert.ok(t.schedule.some(v=>L.occursOn(v,'2026-11-09')===L.occursOn(l,'2026-11-09')&&v.day===l.day&&v.hour===l.hour&&v.subject===l.subject&&v.room===l.room&&v.group===l.group&&v.weekPattern===l.weekPattern&&v.classes.includes(cls.id)),cls.id+' linked lesson');}
}
assert.equal(classRecords,1089);
for(const [date,week] of [['2026-01-01',1],['2026-11-09',46],['2026-11-16',47],['2026-12-31',53],['2027-01-01',53],['2027-01-04',1]])assert.equal(L.isoWeek(date),week);
for(const date of ['2026-11-09','2026-11-16'])for(const t of school.teachers){const occupied=new Set();for(const l of t.schedule.filter(l=>L.occursOn(l,date))){const key=l.day+':'+l.hour;assert.ok(!occupied.has(key),t.id+' simultaneous independent classes');occupied.add(key)}}
const date='2026-11-09',teachers=[{id:'teacher',schedule:[{day:0,hour:0,classes:['1.A','2.B'],cls:'1.A, 2.B',subject:'MAT',room:'U1',group:''},{day:0,hour:1,classes:['2.B'],subject:'FYZ',weekPattern:'odd'}]}];
const event={id:'trip',title:'Exkurze 2.B',date,kind:'akce',allDay:true,classes:['2.B']};
assert.deepEqual(L.forDate(teachers,[],[event],date)[0].schedule[0].classes,['1.A']);
assert.equal(L.forDate(teachers,[],[],date)[0].schedule.length,1);
assert.equal(L.forDate(teachers,[],[],'2026-11-16')[0].schedule.length,2);
const change={id:'change',cls:'2.B',date,hour:0,originalTeacherId:'teacher',group:'',kind:'cancel'};
assert.deepEqual(L.forDate(teachers,[change],[],date)[0].schedule[0].classes,['1.A']);
const exams=[{id:'one',cls:'1.A',date,subject:'MAT',title:'1A only'},{id:'two',cls:'2.B',date,subject:'MAT',title:'2B only'}];
for(const cls of ['1.A','2.B']){const items=Calendar.reminderItems([],[],exams,date,[],cls);assert.equal(items.length,1);assert.equal(items[0].cls,cls);assert.ok(Calendar.reminderMessage(items,date,{exams:true},cls).url.endsWith('class='+cls))}
assert.equal(Calendar.reminderItems([],[event],exams,date,[],'1.A').filter(e=>e.kind==='pisemka').length,1);
assert.equal(Calendar.reminderItems([],[event],exams,date,[],'2.B').filter(e=>e.kind==='pisemka').length,0);
const custom={...school.teachers[0],photo:'https://example.test/custom.webp',schedule:[{day:0,hour:9,classes:['1.A'],subject:'MAT',room:'U99'}]};
const migrated=upgradeSchool({teachers:[custom],intro:'Vlastní úvod',settings:{},sections:{}});
assert.equal(migrated.teachers.length,56);assert.deepEqual(migrated.teachers[0].schedule,custom.schedule);assert.equal(migrated.teachers[0].photo,custom.photo);
assert.deepEqual(publicCors(new Request('https://portal.test/api/content',{headers:{origin:'https://betlemska.github.io'}}))['Access-Control-Allow-Origin'],'https://betlemska.github.io');
assert.deepEqual(publicCors(new Request('https://portal.test/api/content',{headers:{origin:'https://evil.test'}})),{});
// Real persisted API: delegated ownership never permits moving content into an unassigned class.
const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const db={prepare(sql){const stmt=sqlite.prepare(sql);let args=[];return{bind(...v){args=v;return this},async first(){return stmt.get(...args)||null},async all(){return{results:stmt.all(...args)}},async run(){return{meta:{changes:Number(stmt.run(...args).changes)}}}}},async batch(qs){const result=[];for(const q of qs)result.push(await q.run());return result}};
const verifier=await makeVerifier('schoolwide-test-owner-password');
async function call(body,cookie=''){return adminResponse(db,new Request('https://portal.test/api/admin',{method:body?'POST':'GET',headers:{origin:'https://portal.test',cookie,'content-type':'application/json','x-portal-action':'1','cf-connecting-ip':body?.username||'authenticated'},...(body?{body:JSON.stringify(body)}:{})}),verifier)}
const login=await call({action:'login',username:'kubicek',password:'schoolwide-test-owner-password'}),owner=login.headers.get('set-cookie').split(';')[0];assert.equal(login.status,200);
assert.equal((await call({action:'user_create',username:'editor2b',password:'schoolwide-test-editor-password',classScopes:['2.B'],editExams:true,editEvents:true},owner)).status,200);
const editorLogin=await call({action:'login',username:'editor2b',password:'schoolwide-test-editor-password'}),editor=editorLogin.headers.get('set-cookie').split(';')[0];assert.deepEqual((await editorLogin.json()).classScopes,['2.B']);
let revision=(await readContent(db)).revision;
async function save(body,cookie=editor,status=200){const response=await call({...body,revision},cookie);assert.equal(response.status,status,JSON.stringify(body));if(status===200){const result=await response.json();if(result.revision)revision=result.revision;return result}}
const exam={id:'2b-exam',date:'2026-11-23',cls:'2.B',subject:'Matematika',title:'Rovnice'};
await save({action:'exam_save',exam});
await save({action:'exam_save',exam:{...exam,cls:'1.A'}},editor,403);
await save({action:'exam_save',exam:{...exam,id:'owner-exam',cls:'1.A'}},owner);
await save({action:'exam_delete',id:'owner-exam'},editor,403);
await save({action:'exam_save',exam:{...exam,id:'owner-exam',cls:'2.B'}},editor,403);
await save({action:'event_save',event:{id:'2b-trip',date:'2026-11-24',title:'Exkurze',kind:'akce',allDay:true,classes:['2.B']}});
await save({action:'event_save',event:{id:'forbidden',date:'2026-11-24',title:'Celá škola',kind:'volno',classes:[]}},editor,403);
await save({action:'event_save',event:{id:'2b-trip',date:'2026-11-24',title:'Pokus přesunu',kind:'akce',classes:['1.A','2.B']}},editor,403);
await save({action:'event_save',event:{id:'2b-trip',date:'2026-11-24',title:'Upraveno správcem',kind:'akce',allDay:true}},owner);
assert.deepEqual((await readContent(db)).content.events.find(e=>e.id==='2b-trip').classes,['2.B']);
await save({action:'exam_save',exam:{...exam,id:'off-2b',date:'2026-11-24'}},editor,400);
await save({action:'exam_save',exam:{...exam,id:'not-off-1a',cls:'1.A',date:'2026-11-24'}},owner);
await save({action:'exam_delete',id:exam.id});
assert.equal((await call({action:'user_update',username:'editor2b',classScopes:['3.I'],active:true},owner)).status,200);
assert.equal((await(await call(undefined,editor)).json()).authenticated,false,'Changing class access invalidates existing sessions');
console.log('Schoolwide: 20 source-linked classes, 56 profiles, 1089 linked records, ISO parity/year boundaries, scoped shared lessons/events/exams/reminders, custom timetable preservation, public CORS and real SQLite editor scope enforcement passed.');
