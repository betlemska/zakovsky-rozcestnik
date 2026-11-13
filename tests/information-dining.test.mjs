import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {validateContent} from '../lib/cms-content.mjs';
const read=n=>readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
const {document,window}=parseHTML('<html><body><main></main><div id="modal-content"></div></body></html>');
const notices=[],copied=[];let clipboardAllowed=true;
const context={document,Date,console,navigator:{clipboard:{async writeText(value){if(!clipboardAllowed)throw Error('Denied');copied.push(value)}}},head:()=>'<h1>Informace o škole.</h1>',toast:v=>notices.push(v),openModal:html=>{document.querySelector('#modal-content').innerHTML=html},$:s=>document.querySelector(s),esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
context.window=context;vm.createContext(context);
for(const name of ['school-info.js','portal-core.js','presence.js'])vm.runInContext(read(name),context);
const app=read('app.js');vm.runInContext(app.slice(app.indexOf('function information('),app.indexOf('function teacherNow(')),context);
const info=context.BetlemskaSchoolInfo;
document.querySelector('main').innerHTML=context.information();
assert.equal(document.querySelector('.school-official-name').textContent,'Střední průmyslová škola strojnická, škola hlavního města Prahy');
assert.equal(document.querySelector('a[href="tel:+420251092100"]').textContent,'+420 251 092 100');
assert.equal(document.querySelectorAll('.school-contact-grid a[href^="mailto:"]').length,4);
assert.equal(document.querySelectorAll('.school-useful-link[target="_blank"][rel="noopener noreferrer"]').length,6);
const flush=async()=>{for(let i=0;i<4;i++)await new Promise(setImmediate)};
document.querySelector('[data-school-copy="name"]').dispatchEvent(new window.Event('click',{bubbles:true}));await flush();
assert.equal(copied.at(-1),info.facts.name);assert.equal(notices.at(-1),'Zkopírováno do schránky.');
document.querySelector('[data-school-copy="registration"]').dispatchEvent(new window.Event('click',{bubbles:true}));await flush();
assert.match(copied.at(-1),/^Střední průmyslová škola strojnická, škola hlavního města Prahy\nBetlémská 287\/4/);
assert.match(copied.at(-1),/IČO: 70872589\nREDIZO: 600004686\nIZO: 110032641\nDatová schránka: bjvybvf/);
clipboardAllowed=false;document.querySelector('[data-school-copy="name"]').dispatchEvent(new window.Event('click',{bubbles:true}));await flush();
assert.equal(document.querySelector('#school-copy-text[readonly]').value,info.facts.name,'Denied clipboard offers selectable text');
assert.equal(await info.copy('__proto__'),false);assert.equal(await info.copy('name',undefined),false);
assert.equal(validateContent({sections:{information:{title:'Informace školy'}},documents:[{id:'school-doc',title:'Dokument',url:'https://www.betlemska.cz/',section:'information'}]}).documents[0].section,'information');

const P=context.BetlemskaPortal,hours=context.BetlemskaPresence.hours,school=JSON.parse(read('assets/data.json'));
let windows=0;
for(const teacher of school.teachers)for(let day=0;day<5;day++){
 const duties=P.teacherDuties(teacher.duties),free=P.teacherMealWindows(teacher.schedule,day,hours,duties);
 const busy=[...teacher.schedule.filter(l=>l.day===day).map(l=>({start:P.mins(hours[l.hour][0]),end:P.mins(hours[l.hour][1])})),...duties.filter(d=>d.day===day&&d.kind==='standby').map(d=>P.dutyInterval(d,hours)).filter(d=>d.start!==null)];
 if(!teacher.schedule.some(l=>l.day===day))assert.equal(free.length,0,'No attendance invented on a day without lessons');
 assert.ok(free.length<=1,teacher.name+' receives at most one meal per day');
 const taught=teacher.schedule.filter(l=>l.day===day&&!l.cancelled),first=Math.min(...taught.map(l=>P.mins(hours[l.hour][0]))),last=Math.max(...taught.map(l=>P.mins(hours[l.hour][1])));
 if(last<685)assert.equal(free.length,0,teacher.name+' left before the canteen opened');
 for(const meal of free){windows++;assert.equal(meal.end-meal.start,20);assert.ok(meal.start>=first);assert.ok(meal.start<=last);assert.ok(meal.start>=685&&meal.end<=885);assert.ok(meal.end-meal.start>=20);for(const block of busy)assert.ok(meal.end<=block.start||meal.start>=block.end,teacher.name+' meal overlaps duty/teaching');}
}
assert.ok(windows>0);
const afternoon=[{day:0,hour:6,subject:'MAT'},{day:0,hour:8,subject:'MAT'}];
assert.equal(P.daily([{schedule:afternoon.map(l=>({...l,classes:['1.A']}))}],'1.A','2026-11-09',884,[],hours).lunch.end,885);
const afterClose=P.daily([{schedule:afternoon.map(l=>({...l,classes:['1.A']}))}],'1.A','2026-11-09',886,[],hours);
assert.equal(afterClose.lunch,null);assert.equal(afterClose.isBreak,true);assert.equal(afterClose.next[0].hour,8);
assert.equal(P.lunchBreaks([{day:0,hour:0},{day:0,hour:2}],0,hours).length,0,'An early gap is never lunch');
assert.equal(P.lunchBreaks([{day:0,hour:7},{day:0,hour:9}],0,hours).length,0,'A late gap is never lunch');
assert.equal(P.lunchBreaks([{day:0,hour:2},{day:0,hour:5}],0,hours)[0].start,685,'Opening time clips a longer free interval');
assert.equal(P.teacherMealWindows(afternoon.map(l=>({...l,cancelled:true})),0,hours).length,0,'All-day cancellation cannot imply a meal visit');
Object.assign(context,{days:['Pondělí','Úterý','Středa','Čtvrtek','Pátek'],fullSubjects:{MAT:'Matematika'},data:{events:[]},minutes:P.mins,hours,todayISO:()=> '2026-11-09',nowParts:()=>({hour:'14',minute:'19'})});
vm.runInContext(app.slice(app.indexOf('function scheduleDuty('),app.indexOf('setInterval(refreshSchedule,15000);')),context);
document.querySelector('main').innerHTML=context.scheduleTable(afternoon,'teacher');
const lastMeal=document.querySelector('[data-live-slot="0,7"] .lunch-slot');assert.equal(lastMeal.dataset.lunchStart,'840');assert.equal(lastMeal.dataset.lunchEnd,'860');assert.match(lastMeal.textContent,/Možnost oběda.*14:00–14:20/);
context.refreshSchedule();assert.equal(lastMeal.closest('td').getAttribute('aria-current'),'time');
context.nowParts=()=>({hour:'14',minute:'20'});context.refreshSchedule();assert.equal(lastMeal.closest('td').getAttribute('aria-current'),null,'Live lunch stops after one meal, even while the canteen remains open');
document.querySelector('main').innerHTML=context.scheduleTable(afternoon,'teacher','Suplovací pohotovost (SP)\nPo: 8. hod');assert.equal(document.querySelector('[data-live-slot="0,7"] .lunch-slot'),null,'Standby blocks lunch');

const plain=hour=>({day:0,hour,subject:'MAT'}),same=(actual,expected,message)=>assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);
same(P.teacherMealWindows([plain(0),plain(1)],0,hours),[],'Morning-only teacher does not stay until lunch');
same(P.teacherMealWindows([plain(3)],0,hours),[{start:685,end:705}],'Finishing at opening gives one immediate lunch');
same(P.teacherMealWindows([plain(4)],0,hours),[{start:735,end:755}],'Lunch follows the last lesson immediately');
same(P.teacherMealWindows([plain(2),plain(6)],0,hours),[{start:685,end:705}],'A long free interval begins at opening and contains one short meal');
same(P.teacherMealWindows([plain(6),plain(7)],0,hours),[],'No early arrival or meal after closing is invented');
same(P.teacherMealWindows([plain(3),plain(6)],0,hours,[{day:0,hour:4,kind:'standby'}]),[{start:735,end:755}],'First feasible time follows standby instead of an insufficient five-minute gap');
same(P.teacherMealWindows([plain(2),plain(3),plain(4),plain(5),plain(6),plain(7)],0,hours),[],'Short bell breaks do not create a fictitious meal');
const shifted=hours.map(h=>[...h]);shifted[6]=['13:40','14:25'];
same(P.teacherMealWindows([plain(6)],0,shifted),[{start:865,end:885}],'A full meal may finish exactly at closing');
shifted[6]=['13:41','14:26'];same(P.teacherMealWindows([plain(6)],0,shifted),[],'Insufficient time before closing means no meal');
const cancelledGap=[plain(2),{...plain(4),cancelled:true},plain(6)];
document.querySelector('main').innerHTML=context.scheduleTable(cancelledGap,'teacher');
assert.equal(document.querySelectorAll('.lunch-slot').length,1);assert.ok(document.querySelector('[data-live-slot="0,4"] .is-cancelled'));assert.ok(document.querySelector('[data-live-slot="0,4"] .lunch-slot'),'Cancelled teaching remains visible beside the freed meal');
context.nowParts=()=>({hour:'11',minute:'25'});context.refreshSchedule();assert.equal(document.querySelector('[data-live-slot="0,4"]').getAttribute('aria-current'),'time','Lunch begins during the break before the displayed lesson column');
const nextDay=[...cancelledGap,...cancelledGap.map(l=>({...l,day:1}))];document.querySelector('main').innerHTML=context.scheduleTable(nextDay,'teacher');context.refreshSchedule();assert.equal(document.querySelectorAll('.lunch-slot .lesson-live-label:not([hidden])').length,1,'Other weekdays never show a live meal');
for(const teacher of school.teachers){
 document.querySelector('main').innerHTML=context.scheduleTable(teacher.schedule,'teacher',teacher.duties);
 for(let day=0;day<5;day++){
  const expected=P.teacherMealWindows(teacher.schedule,day,hours,P.teacherDuties(teacher.duties));
  const actual=[...document.querySelectorAll(`[data-live-slot^="${day},"] .lunch-slot`)];
  assert.equal(actual.length,expected.length,teacher.name+' renders exactly the single chosen meal');
  if(actual.length){assert.equal(Number(actual[0].dataset.lunchStart),expected[0].start);assert.equal(Number(actual[0].dataset.lunchEnd),expected[0].end);}
 }
}
console.log(`School information: exact clipboard values, registration details, denied-permission fallback and official links passed; ${school.teachers.length*5} teacher-days / ${windows} single meal slots checked against teaching, standby, morning departure, first feasible time and 11:25–14:45.`);
