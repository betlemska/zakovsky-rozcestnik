import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {refreshTeacherAssets,teacherScheduleRevision} from '../lib/teacher-assets.mjs';
import {validateContent,emptyContent} from '../lib/cms-content.mjs';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const school=JSON.parse(read('assets/data.json'));
const {document}=parseHTML('<html><body><main></main></body></html>');
let date='2026-11-10';
const trip={date:'2026-11-12',allDay:true,kind:'akce',title:'NTM – Exkurze 1.A'};
const ctx={document,Date,Intl,console,data:{...school,events:[trip]},todayISO:()=>date,nowParts:()=>({hour:'08',minute:'10'}),lessonChanges:()=>[],esc:v=>String(v??''),fullSubjects:{TEV:'Tělesná výchova'},avatar:t=>`<img alt="${t.name}">`};
ctx.myClass='1.A';ctx.inClass=(l,cls)=>(l.classes||[l.cls]).includes(cls);ctx.window=ctx;vm.createContext(ctx);
for(const file of ['lesson-changes.js','presence.js','portal-core.js','class-week.js'])vm.runInContext(read(file),ctx);
const app=read('app.js');
vm.runInContext(app.slice(app.indexOf('function datedTeachers('),app.indexOf('function presenceBadge(')),ctx);
vm.runInContext(app.slice(app.indexOf('function lessonSummary('),app.indexOf('\nfunction ',app.indexOf('function lessonSummary(')+1)),ctx);
ctx.hours=ctx.BetlemskaPresence.hours;
const balek=school.teachers.find(t=>t.id==='miloslav-balek');
const thursday=ctx.teacherWeekLessons(balek).filter(l=>l.day===3);
assert.deepEqual(Array.from(thursday,l=>[l.hour,l.cls,l.room]),[[0,'2.C','TEV2'],[1,'2.C','TEV2'],[2,'2.I','TEV2'],[3,'2.I','TEV2'],[4,'4.B','TEV2'],[5,'4.B','TEV2']],"Bálek's six Thursday lessons from the original photograph remain visible");
for(const teacher of school.teachers){
 const actual=ctx.teacherWeekLessons(teacher);
 for(const lesson of teacher.schedule.filter(l=>l.day===3&&ctx.BetlemskaLessonChanges.occursOn(l,trip.date)&&!(l.classes||[l.cls]).includes('1.A'))){
  assert.ok(actual.some(l=>l.day===3&&l.hour===lesson.hour&&l.subject===lesson.subject&&l.cls===lesson.cls&&!l.cancelled),teacher.name+' retains lessons for other classes during the 1.A trip');
 }
}
assert.equal(ctx.BetlemskaPresence.estimate(balek,trip.date,490,[trip]).label,'Ve škole');
assert.equal(ctx.BetlemskaPresence.estimate(balek,trip.date,800,[trip]).label,'Mimo školu');
assert.equal(ctx.BetlemskaPresence.estimate({...balek,schedule:[{day:3,hour:0,classes:['1.A'],cls:'1.A',subject:'TEV'}]},trip.date,490,[trip]).label,'Školní akce');
assert.equal(ctx.BetlemskaPresence.lessonsForDate(balek,trip.date,[{...trip,kind:'volno'}]).length,0,'School holidays still affect every class');
const mixed={schedule:[{day:3,hour:0,classes:['1.A','1.B'],cls:'1.A, 1.B',subject:'TEV'}]};
assert.deepEqual(Array.from(ctx.BetlemskaPresence.lessonsForDate(mixed,trip.date,[trip])[0].classes),['1.B']);

const petrak=school.teachers.find(t=>t.id==='jakub-petrak'),liszok=school.teachers.find(t=>t.id==='vladislav-liszok');
for(const hour of [0,1]){
 const pe=petrak.schedule.find(l=>l.day===4&&l.hour===hour&&l.group==='2/2');
 assert.deepEqual(pe.coTeacherIds,['vladislav-liszok']);
 assert.deepEqual(Array.from(ctx.BetlemskaLessonChanges.teachersForLesson(school.teachers,petrak,pe),t=>t.id),[petrak.id,liszok.id]);
}
const friday=ctx.BetlemskaPortal.daily(school.teachers,'1.A','2026-11-20',490,[],ctx.hours);
assert.equal(friday.current.length,2,'There are two groups, not a duplicated PE lesson');
const pe=friday.current.find(l=>l.subject==='TEV');
assert.deepEqual(Array.from(pe.teachers,t=>t.id),[petrak.id,liszok.id]);
document.querySelector('main').innerHTML=ctx.lessonSummary([pe]);
assert.equal(document.querySelectorAll('.day-teacher-portraits img').length,2);
assert.ok(document.querySelector('.day-lesson').textContent.includes('Jakub Petrák a Vladislav Liszok'));
assert.equal(document.querySelector('.day-lesson').dataset.peTeachers,'jakub-petrak|vladislav-liszok');
const weekly=ctx.BetlemskaClassWeek.render({teachers:school.teachers,date:'2026-11-20'});
document.querySelector('main').innerHTML=weekly;
assert.equal(document.querySelectorAll('[data-week-day="2026-11-20"] [data-pe-teachers="jakub-petrak|vladislav-liszok"]').length,2);
assert.equal(ctx.teachesMyClass(liszok),true,'The secondary PE teacher belongs in the class teacher list and My teachers filter');
assert.equal(ctx.BetlemskaClassWeek.matches({date:'2026-11-20',subject:'TEV',teacherId:liszok.id,hour:0},pe,'2026-11-20'),true);
const coSchedule=ctx.BetlemskaLessonChanges.teacherSchedule(school.teachers,liszok);
assert.equal(coSchedule.filter(l=>l.coTaught&&l.day===4&&l.group==='2/2'&&l.classes.includes('1.A')).length,2);
assert.equal(liszok.schedule.some(l=>l.classes.includes('1.A')),false,'The original Liszok PDF transcription is preserved');

const before=structuredClone({...emptyContent(),teachers:school.teachers});
delete before.teacherScheduleRevision;
for(const l of before.teachers.find(t=>t.id===petrak.id).schedule)delete l.coTeacherIds;
const migrated=refreshTeacherAssets(before);
assert.equal(migrated.teacherScheduleRevision,teacherScheduleRevision);
const validated=validateContent(migrated);
assert.equal(validated.teachers.find(t=>t.id===petrak.id).schedule.filter(l=>l.coTeacherIds.includes(liszok.id)).length,2);
validated.teachers.find(t=>t.id===petrak.id).schedule.forEach(l=>{l.coTeacherIds=[]});
assert.equal(refreshTeacherAssets(validated).teachers.find(t=>t.id===petrak.id).schedule.some(l=>l.coTeacherIds.length),false,'Later administrator changes remain editable');
console.log('All 20 teacher schedules: class-trip isolation, photo-verified Thursday, scoped presence, co-taught Friday PE, both profiles/portraits and editable CMS migration passed.');
