// One recurring school model; dated changes and events always carry a class scope.
const weekday=date=>(new Date(date+'T12:00:00Z').getUTCDay()+6)%7;
const classNames=Array.from({length:4},(_,year)=>['A','B','C','I','L'].map(letter=>(year+1)+'.'+letter)).flat();
const normalizeClass=value=>String(value||'1.A').replace(/\s/g,'').toUpperCase();
const inClass=(l,cls='1.A')=>(l.classes||[l.cls]).includes(cls);
function isoWeek(date){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+3-weekday(date));const first=new Date(Date.UTC(d.getUTCFullYear(),0,4,12));return 1+Math.round(((d-first)/86400000-3+weekday(first.toISOString().slice(0,10)))/7)}
const occursOn=(lesson,date)=>!lesson.weekPattern||lesson.weekPattern===(isoWeek(date)%2?'odd':'even');
function eventApplies(event,cls){return Array.isArray(event.classes)?event.classes.length===0||event.classes.includes(cls):event.kind==='volno'||!event.allDay&&!event.cancelledHours?.length||cls==='1.A'}
const eventsForClass=(events,cls)=>events.filter(e=>eventApplies(e,cls));
function teachersForLesson(teachers,primary,lesson){return [primary,...(lesson.coTeacherIds||[]).map(id=>teachers.find(t=>t.id===id))].filter((t,i,all)=>t&&all.findIndex(v=>v?.id===t.id)===i)}
function teacherSchedule(teachers,teacher){return [...(teacher.schedule||[]),...teachers.filter(t=>t.id!==teacher.id).flatMap(t=>(t.schedule||[]).filter(l=>(l.coTeacherIds||[]).includes(teacher.id)).map(l=>({...l,primaryTeacherId:t.id,coTaught:true})))]}
function eventHours(event){return event.kind==='volno'?[]:event.allDay?Array.from({length:10},(_,i)=>i):[...new Set((event.cancelledHours||[]).filter(h=>Number.isInteger(h)&&h>=0&&h<10))]}
function eventsForLesson(events,lesson,date){return lesson.day===weekday(date)?events.filter(e=>e.date===date&&eventHours(e).includes(lesson.hour)&&(lesson.classes||[lesson.cls]).some(cls=>eventApplies(e,cls))):[]}
function forDate(teachers=[],changes=[],events=[],date,options={}){
 return apply(teachers,changes,date,options).map(t=>({...t,schedule:(t.schedule||[]).filter(l=>occursOn(l,date)).flatMap(l=>{
  if(l.cancelled||l.day!==weekday(date))return [l];
  const groups=new Map();
  for(const cls of l.classes||[l.cls]){
   const blocking=events.filter(e=>e.date===date&&eventApplies(e,cls)&&(e.kind==='volno'||eventHours(e).includes(l.hour)));
   const key=blocking.map(e=>e.id||e.title).join('|');if(!groups.has(key))groups.set(key,{classes:[],blocking});groups.get(key).classes.push(cls);
  }
  return [...groups.values()].flatMap(({classes,blocking})=>!blocking.length?[{...l,classes,cls:classes.join(', ')}]:options.includeCancelled?[{...l,classes,cls:classes.join(', '),cancelled:true,eventCancellation:true,eventIds:blocking.map(e=>e.id),originalTeacherId:l.originalTeacherId||t.id,originalSubject:l.originalSubject||l.subject,change:{...(l.change||{}),kind:'cancel',note:blocking.map(e=>e.title).join(' · ')}}]:[]);
 })}));
}
const sameSlot=(c,l,t,date)=>c.date===date&&c.hour===l.hour&&c.originalTeacherId===t.id&&(c.group||'')===(l.group||'')&&l.day===weekday(date)&&inClass(l,c.cls||'1.A')&&occursOn(l,date);
function original(teachers,change){const t=teachers.find(t=>t.id===change.originalTeacherId),l=t?.schedule?.find(l=>sameSlot(change,l,t,change.date));return l?{teacher:t,lesson:l}:null}
function apply(teachers=[],changes=[],date,{includeCancelled=false}={}){
 if(!changes.some(c=>c.date===date))return teachers;
 const result=teachers.map(t=>({...t,schedule:[...(t.schedule||[])]}));
 for(const c of changes.filter(c=>c.date===date)){
  const o=original(teachers,c);if(!o)continue;
  const source=result.find(t=>t.id===c.originalTeacherId),target=result.find(t=>t.id===c.teacherId),cls=c.cls||'1.A';
  if(c.kind!=='cancel'&&!target)continue;
  const index=source.schedule.findIndex(l=>sameSlot(c,l,source,date));if(index<0)continue;
  const l=source.schedule[index],others=(l.classes||[l.cls]).filter(name=>name!==cls);
  if(others.length)source.schedule[index]={...l,classes:others,cls:others.join(', ')};else source.schedule.splice(index,1);
  const changed={...o.lesson,classes:[cls],cls,change:c,originalTeacherId:o.teacher.id,originalSubject:o.lesson.subject};
  if(c.kind==='cancel'){if(includeCancelled)source.schedule.push({...changed,cancelled:true})}
  else target.schedule.push({...changed,coTeacherIds:[],subject:c.subject,room:c.room||o.lesson.room,cancelled:false});
 }
 return result;
}
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const subjectNames={MAT:'Matematika',CJL:'Český jazyk a literatura',ANJ:'Anglický jazyk',FYZ:'Fyzika',CHE:'Chemie',BIO:'Biologie',MEC:'Mechanika',STT:'Strojírenská technologie',TEK:'Technické kreslení',TEV:'Tělesná výchova',DEJ:'Dějepis',EKO:'Ekonomika',ICT:'Informační a komunikační technologie',HRW:'Hardware',SPS:'Stavba a provoz strojů',CAD:'CAD',CAM:'CAM'};
function suppressesExam(exam,teachers,changes,events=[]){
 const cls=exam.cls||'1.A',off=events.filter(e=>e.date===exam.date&&eventApplies(e,cls)&&eventHours(e).length);
 if(off.some(e=>e.allDay))return true;
 if(off.length){
  const blocked=hour=>off.some(e=>eventHours(e).includes(hour));
  if(Number.isInteger(exam.hour)&&blocked(exam.hour))return true;
  const range=String(exam.time||'').match(/^(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?(?:\.?\s*(?:hod|$))/);
  if(!Number.isInteger(exam.hour)&&range&&Number(range[1])>=1&&Number(range[2]||range[1])>=Number(range[1])&&Number(range[2]||range[1])<=10&&Array.from({length:Number(range[2]||range[1])-Number(range[1])+1},(_,i)=>Number(range[1])-1+i).every(blocked))return true;
  if(!Number.isInteger(exam.hour)&&!range){
   const matching=teachers.flatMap(t=>(t.schedule||[]).filter(l=>l.day===weekday(exam.date)&&inClass(l,cls)&&occursOn(l,exam.date)&&(!exam.teacherId||teachersForLesson(teachers,t,l).some(t=>t.id===exam.teacherId))&&(!exam.group||exam.group===l.group)&&[norm(l.subject),norm(subjectNames[l.subject]||l.subject)].includes(norm(exam.subject))));
   if(matching.length&&matching.every(l=>blocked(l.hour)))return true;
  }
 }
 return changes.some(c=>{if(c.date!==exam.date||(c.cls||'1.A')!==cls)return false;const o=original(teachers,c);if(!o)return false;const l=o.lesson;
  if(c.kind!=='cancel'&&c.subject===l.subject&&(!exam.teacherId||exam.teacherId===c.teacherId))return false;
  if(Number.isInteger(exam.hour)&&exam.hour!==c.hour)return false;
  if(!Number.isInteger(exam.hour)){const range=String(exam.time||'').match(/^(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?(?:\.?\s*(?:hod|$))/);if(!range||c.hour+1<Number(range[1])||c.hour+1>Number(range[2]||range[1]))return false}
  if(exam.teacherId&&exam.teacherId!==c.originalTeacherId&&!(l.coTeacherIds||[]).includes(exam.teacherId))return false;
  if(exam.group&&(exam.group||'')!==(c.group||''))return false;
  return [norm(l.subject),norm(subjectNames[l.subject]||l.subject)].includes(norm(exam.subject));
 });
}
const api={apply,forDate,eventHours,eventsForLesson,original,sameSlot,suppressesExam,subjectNames,teachersForLesson,teacherSchedule,classNames,normalizeClass,isoWeek,occursOn,eventApplies,eventsForClass};
export const LessonChanges=api;
