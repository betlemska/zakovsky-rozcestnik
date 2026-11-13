import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const {document}=parseHTML('<html><body><main></main></body></html>');
const context={document,Date,console};context.window=context;vm.createContext(context);
for(const script of ['presence.js','lesson-changes.js','portal-core.js'])vm.runInContext(read(script),context);
const P=context.BetlemskaPortal,hours=context.BetlemskaPresence.hours,date='2026-11-10';
const teachers=[{id:'math',name:'Učitel matematiky',code:'MA',schedule:[0,1,2,3,4,6,7].map(hour=>({day:1,hour,subject:hour<5?'MAT':'TEK',classes:['1.A'],room:'U7'}))},{id:'split',name:'Učitel druhé skupiny',code:'SP',schedule:[0,1].map(hour=>({day:1,hour,subject:'ANJ',classes:['1.A'],group:'2/2',room:'U8'}))}];
let clock=710,events=[],currentTeachers=teachers;
const daily=minute=>P.daily(currentTeachers,'1.A',date,minute,events,hours);
assert.equal(daily(479).lunch,null);assert.equal(daily(479).nextLunch,null);
assert.equal(daily(525).isBreak,true,'Normal short breaks remain normal breaks');
assert.equal(daily(525).lunch,null);
for(const minute of [690,710,734]){
 const d=daily(minute);assert.equal(d.current[0].hour,4);assert.equal(d.nextLunch.start,735);assert.equal(d.nextLunch.end,795);assert.equal(d.next[0].hour,6);
}
for(const minute of [735,744,745,790,794]){
 const d=daily(minute);assert.equal(d.lunch.start,735);assert.equal(d.lunch.end,795);assert.equal(d.current.length,0);assert.equal(d.isBreak,false);assert.equal(d.nextLunch,null);
}
assert.equal(daily(795).current[0].hour,6);assert.equal(daily(795).lunch,null);assert.equal(daily(890).lunch,null);
const twoSlots=teachers.map(t=>({...t,schedule:t.schedule.filter(l=>l.hour!==6)}));
const longer=P.daily(twoSlots,'1.A',date,780,[],hours);assert.equal(longer.lunch.start,735);assert.equal(longer.lunch.end,845,'Consecutive empty periods form one meal break');
currentTeachers=context.BetlemskaLessonChanges.apply(teachers,[{id:'cancel',date,hour:3,originalTeacherId:'math',group:'',kind:'cancel'}],date,{includeCancelled:true});
assert.equal(daily(650).lunch,null,'A cancelled lesson does not turn into an invented lunch');
assert.equal(daily(745).lunch.start,735,'The actual lunch gap remains');currentTeachers=teachers;
events=[{date,kind:'volno'}];assert.equal(daily(745).lunch,null);assert.equal(daily(745).nextLunch,null);
events=[{date,kind:'akce',allDay:true}];assert.equal(daily(745).lunch,null);
events=[{date,kind:'akce',cancelledHours:[5],title:'Program místo výuky'}];assert.equal(daily(745).lunch,null);assert.equal(daily(745).event.title,'Program místo výuky');events=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Object.assign(context,{hours,minutes:P.mins,esc,fullSubjects:{MAT:'Matematika',TEK:'Technické kreslení'},avatar:()=>'',icon:()=>'',myClass:'1.A',data:{events},todayISO:()=>date,timeNow:()=>clock,datedTeachers:(date,includeCancelled)=>{assert.equal(includeCancelled,true);return currentTeachers;}});
const app=read('app.js');vm.runInContext(app.slice(app.indexOf('function lessonSummary('),app.indexOf('function teacherNow(')),context);
function panel(minute){clock=minute;document.querySelector('main').innerHTML=context.schoolDayPanel();return document.querySelector('main');}
let el=panel(710),next=el.querySelector('.day-columns>div:last-child');
assert.equal(next.querySelector('.day-lunch').getAttribute('href'),'#canteen');
assert.match(next.textContent,/Obědová pauza.*12:15–13:15.*Po obědě.*Technické kreslení/s);
assert.equal(next.querySelector('.day-lunch').nextElementSibling.className,'day-after-lunch');
el=panel(740);assert.match(el.querySelector('.day-columns>div:first-child').textContent,/PRÁVĚ TEĎ.*Obědová pauza/s);
assert.match(el.querySelector('.day-columns>div:last-child').textContent,/PO OBĚDĚ.*Technické kreslení/s);
assert.match(el.querySelector('.lunch-bell').textContent,/Další výuka za 55 min.*13:15/);
assert.ok(!el.textContent.includes('Začátek 6. hodiny'),'No lesson-start countdown during lunch');
el=panel(795);assert.equal(el.querySelector('.day-lunch'),null);assert.match(el.querySelector('.day-columns>div:first-child').textContent,/Technické kreslení/);
el=panel(525);assert.match(el.querySelector('.day-columns>div:first-child').textContent,/Přestávka/);
console.log('Daily lunch: next-step order, active lunch including adjacent breaks, real return-to-class countdown, split groups, merged gaps, cancellation/event exclusions and exact boundaries passed.');
