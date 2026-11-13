/* Pure schedule helpers shared by the UI and regression tests. */
(function(root){
'use strict';
const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
const dayIndex=date=>new Date(date+'T12:00:00Z').getUTCDay()-1;
const valid=date=>date>='2026-10-12'&&date<='2027-06-30';
// Current school information for 2026/2027; separate from cashier opening hours.
const diningHours={start:685,end:885,label:'11:25–14:45',verifiedOn:'2026-11-10',source:'https://www.betlemska.cz/jidelna/jidelna-spss-betlemska'};
function diningWindow(start,end){const from=Math.max(start,diningHours.start),to=Math.min(end,diningHours.end);return Number.isFinite(from)&&Number.isFinite(to)&&from<to?{start:from,end:to}:null;}
function schoolDay(date,events=[],cls){const d=dayIndex(date);return valid(date)&&d>=0&&d<5&&!events.some(e=>e.date===date&&(!cls||!root.BetlemskaLessonChanges||root.BetlemskaLessonChanges.eventApplies(e,cls))&&(e.kind==='volno'||e.allDay===true))}
function daily(teachers,cls,date,time,events,hours){
 events=root.BetlemskaLessonChanges?.eventsForClass(events,cls)||events;
 const day=dayIndex(date),isSchool=schoolDay(date,events,cls);
 const effective=root.BetlemskaLessonChanges?.forDate?.(teachers,[],events,date,{includeCancelled:true})||teachers;
 const recorded=isSchool?effective.flatMap(t=>t.schedule.filter(l=>l.day===day&&(l.classes||[l.cls]).includes(cls)).map(l=>({...l,teacher:t,teachers:root.BetlemskaLessonChanges?.teachersForLesson?.(teachers,t,l)||[t]}))).sort((a,b)=>a.hour-b.hour):[];
 const lessons=recorded.filter(l=>!l.cancelled);
 const current=lessons.filter(l=>time>=mins(hours[l.hour][0])&&time<mins(hours[l.hour][1]));
 const nextHour=lessons.find(l=>mins(hours[l.hour][0])>time)?.hour;
 const next=nextHour===undefined?[]:lessons.filter(l=>l.hour===nextHour);
 const bells=isSchool?hours.flatMap((h,i)=>[{minute:mins(h[0]),kind:'Začátek',hour:i},{minute:mins(h[1]),kind:'Konec',hour:i}]).sort((a,b)=>a.minute-b.minute):[];
 const bell=bells.find(b=>b.minute>time);
 const lunches=lunchBreaks(recorded,day,hours).filter(l=>!events.some(e=>e.date===date&&(e.cancelledHours||[]).some(h=>h>l.afterHour&&h<l.beforeHour)));
 const lunch=lunches.find(l=>time>=l.start&&time<l.end)||null;
 const nextLunch=next.length?lunches.find(l=>l.start>time&&l.end<=mins(hours[nextHour][0]))||null:null;
 const isBreak=!current.length&&!lunch&&next.length>0 && lessons.some(l=>time>=mins(hours[l.hour][1]));
 const currentHour=hours.findIndex(h=>time>=mins(h[0])&&time<mins(h[1])),event=events.find(e=>e.date===date&&e.kind!=='volno'&&(e.allDay||(e.cancelledHours||[]).includes(currentHour)));
 return {lessons,current,next,bell,isBreak,lunch,nextLunch,isSchool,event,valid:valid(date),holiday:events.find(e=>e.date===date&&(e.kind==='volno'||e.allDay===true))};
}
function lunchBreaks(lessons,day,hours){
 const recorded=lessons.filter(l=>l.day===day&&Number.isInteger(l.hour)&&hours[l.hour]);
 const occupied=[...new Set(recorded.map(l=>l.hour))].sort((a,b)=>a-b),active=recorded.filter(l=>!l.cancelled).map(l=>l.hour),breaks=[];
 for(let i=1;i<occupied.length;i++){
  const before=occupied[i-1],after=occupied[i];
  const window=diningWindow(mins(hours[before][1]),mins(hours[after][0]));
  if(window&&after>before+1&&active.some(h=>h<=before)&&active.some(h=>h>=after))breaks.push({...window,afterHour:before,beforeHour:after});
 }
 return breaks;
}
function roomState(room,date,time,events,hours){
 if(!schoolDay(date,events))return {kind:'unknown',label:'Mimo platnou výuku',lessons:[]};
 const hour=hours.findIndex(h=>time>=mins(h[0])&&time<mins(h[1]));
 if(hour<0)return {kind:'unknown',label:'Právě není vyučovací hodina',lessons:[]};
 const lessons=room.lessons.filter(l=>l.day===dayIndex(date)&&l.hour===hour);
 if(!room.lessons.length)return {kind:'unknown',label:'Bez rozvrhu místnosti',lessons:[]};
 return {kind:lessons.length?'occupied':'unrecorded',label:lessons.length?'Výuka dle rozvrhu':'Bez záznamu výuky · odhad',lessons};
}
function lunchSlot(lessons,day,hour,hours=root.BetlemskaPresence?.hours){const occupied=lessons.filter(l=>l.day===day).map(l=>l.hour);return !!hours?.[hour]&&!!diningWindow(mins(hours[hour][0]),mins(hours[hour][1]))&&!occupied.includes(hour)&&occupied.some(h=>h<hour)&&occupied.some(h=>h>hour)}
function teacherMealWindows(lessons,day,hours,duties=[]){
 const taught=lessons.filter(l=>l.day===day&&!l.cancelled&&hours[l.hour]);
 if(!taught.length)return [];
 const duration=20,first=Math.min(...taught.map(l=>mins(hours[l.hour][0]))),last=Math.max(...taught.map(l=>mins(hours[l.hour][1])));
 // Do not assume an early arrival or a return after a morning-only school day.
 if(last<diningHours.start||first>=diningHours.end)return [];
 const until=Math.min(diningHours.end,last+duration);
 const busy=[...taught.map(l=>({start:mins(hours[l.hour][0]),end:mins(hours[l.hour][1])})),...duties.filter(d=>d.day===day&&d.kind==='standby').map(d=>dutyInterval(d,hours)).filter(d=>d&&d.start!==null)].sort((a,b)=>a.start-b.start);
 let cursor=Math.max(diningHours.start,first);
 for(const interval of busy){
  if(cursor+duration<=Math.min(interval.start,until))return [{start:cursor,end:cursor+duration}];
  cursor=Math.max(cursor,interval.end);
  if(cursor+duration>until)return [];
 }
 return cursor+duration<=until?[{start:cursor,end:cursor+duration}]:[];
}
function teacherDuties(text){
 const duties=[],dayNames=['Po','Út','St','Čt','Pá'];let section;
 for(const line of String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){
  if(/^Suplovací pohotovost(?:\s*\(SP\))?$/i.test(line)){section={kind:'standby',label:'Suplovací pohotovost',code:'SP'};continue}
  const heading=line.match(/^(?:Dohled|Dozor)\s+(.+?)(?:\s+\(([^)]+)\))?$/i);
  if(heading){section={kind:/jídelně/i.test(heading[1])?'dining':'corridor',label:'Dozor '+heading[1],code:heading[2]||''};continue}
  let matched=false;
  for(const match of line.matchAll(/(Po|Út|St|Čt|Pá)\s*:\s*([^;]+)/g)){
   matched=true;if(!section)continue;
   const slot=match[2].match(/(před\s+)?((?:\d{1,2}\.\s*,?\s*)+)hod\b/i);
   if(!slot)continue;
   for(const number of slot[2].matchAll(/(\d+)\./g)){
    const hour=Number(number[1])-1;if(hour<0||hour>9)continue;
    const duty={...section,day:dayNames.indexOf(match[1]),hour,before:!!slot[1]};
    if(!duties.some(d=>d.day===duty.day&&d.hour===hour&&d.kind===duty.kind&&d.label===duty.label&&d.before===duty.before))duties.push(duty);
   }
  }
  // An unknown heading must never inherit the previous section's meaning.
  if(!matched)section=undefined;
 }
 return duties.sort((a,b)=>a.day-b.day||a.hour-b.hour||Number(b.before)-Number(a.before));
}
function dutyInterval(duty,hours){const h=hours[duty.hour];if(!h)return null;return duty.before?{start:duty.hour?mins(hours[duty.hour-1][1]):null,end:mins(h[0])}:{start:mins(h[0]),end:mins(h[1])}}
function menuForDate(menu,date){const day=menu?.days?.[date];return day?.date===date?day:null}
const api={daily,roomState,schoolDay,dayIndex,mins,menuForDate,lunchSlot,lunchBreaks,teacherMealWindows,diningHours,diningWindow,teacherDuties,dutyInterval};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaPortal=api;
})(typeof window!=='undefined'?window:globalThis);
