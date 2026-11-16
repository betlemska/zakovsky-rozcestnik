import approvedLinks from './approved-teacher-links.json' with {type:'json'};
// One-time presentation refresh; content and administrator edits are otherwise preserved.
const originalMediaRevision='2026-11-03';
const previousPortraitRevision='2026-11-03c';
const gotzPavlovaRevision='2026-11-03d';
const radkaPortraitRevision='2026-11-04';
export const teacherMediaRevision='2026-11-04b';
const patches={"vladislav-liszok": {"photo": "assets/portraits/vladislav-liszok-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03"}, "martin-vyroubal": {"photo": "assets/portraits/martin-vyroubal-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03"}, "ondrej-ruzicka": {"photo": "assets/portraits/ondrej-ruzicka-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03", "bio": "V komunálních volbách v roce 2026 byl zvolen do Zastupitelstva městské části Praha 4. Další veřejné informace jsou dostupné na webu městské části.", "externalLinks": [{"label": "Veřejný profil · Praha 4", "url": "https://praha4.cz/kontakty-p4/ruzicka-ondrej/"}, {"label": "Výsledky voleb 2026 · Praha 4", "url": "https://tucnak.praha4.cz/11-2026/vysledky-komunalnich-voleb-2026"}, {"label": "Facebook · dodaná fotografie", "url": "https://www.facebook.com/photo?fbid=1157584033134822&set=pb.100066497079135.-2207520000."}]}, "michal-prutyszyn": {"photo": "assets/portraits/michal-prutyszyn-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03"}, "martin-theimer": {"video": "", "videoEnabled": false}};
const addedTeacher={"id": "miloslav-balek", "name": "Miloslav Bálek", "first": "Miloslav", "last": "Bálek", "title": "Mgr.", "suffix": "", "code": "BA", "role": "učitel", "room": "kab. 18", "phone": "251092141", "classroom": "", "email": "miloslav.balek@betlemska.cz", "emailSource": "Adresa odvozena z formátu ve školním telefonním seznamu 2026/2027.", "schedule": [], "subjects": [], "duties": "", "photo": "assets/portraits/miloslav-balek-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03", "fallbackAvatar": "male", "bio": "Kontaktní profil podle telefonního seznamu školy 2026/2027. Rozvrh zatím nebyl dodán."};
const timetableRevision='2026-11-03b';
const timetablePatches={"miloslav-balek": {"schedule": [{"day": 0, "hour": 0, "cls": "1.A", "classes": ["1.A"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 1.A TEV(TEV1)"}, {"day": 0, "hour": 1, "cls": "1.A", "classes": ["1.A"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 1.A TEV(TEV1)"}, {"day": 0, "hour": 2, "cls": "1.B", "classes": ["1.B"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 1.B TEV(TEV1)"}, {"day": 0, "hour": 3, "cls": "1.B", "classes": ["1.B"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 1.B TEV(TEV1)"}, {"day": 0, "hour": 4, "cls": "1.L", "classes": ["1.L"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 1.L TEV(TEV2)"}, {"day": 0, "hour": 5, "cls": "1.L", "classes": ["1.L"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 1.L TEV(TEV2)"}, {"day": 1, "hour": 0, "cls": "2.L", "classes": ["2.L"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 2.L TEV(TEV1)"}, {"day": 1, "hour": 1, "cls": "2.L", "classes": ["2.L"], "group": "1/2", "subject": "TEV", "room": "TEV1", "raw": "1/2 2.L TEV(TEV1)"}, {"day": 1, "hour": 2, "cls": "3.A", "classes": ["3.A"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 3.A TEV(TEV2)"}, {"day": 1, "hour": 3, "cls": "3.A", "classes": ["3.A"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 3.A TEV(TEV2)"}, {"day": 1, "hour": 4, "cls": "1.I", "classes": ["1.I"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 1.I TEV(TEV2)"}, {"day": 1, "hour": 5, "cls": "1.I", "classes": ["1.I"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 1.I TEV(TEV2)"}, {"day": 3, "hour": 0, "cls": "2.C", "classes": ["2.C"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 2.C TEV(TEV2)"}, {"day": 3, "hour": 1, "cls": "2.C", "classes": ["2.C"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 2.C TEV(TEV2)"}, {"day": 3, "hour": 2, "cls": "2.I", "classes": ["2.I"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 2.I TEV(TEV2)"}, {"day": 3, "hour": 3, "cls": "2.I", "classes": ["2.I"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 2.I TEV(TEV2)"}, {"day": 3, "hour": 4, "cls": "4.B", "classes": ["4.B"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 4.B TEV(TEV2)"}, {"day": 3, "hour": 5, "cls": "4.B", "classes": ["4.B"], "group": "2/2", "subject": "TEV", "room": "TEV2", "raw": "2/2 4.B TEV(TEV2)"}], "subjects": ["TEV"], "duties": "Dohled ve 2. patře (2.P)\nPo: před 1. hod;\nÚt: před 3. hod;\nČt: před 3. hod", "scheduleSource": "assets/miloslav-balek-rozvrh.jpeg", "scheduleValidFrom": "2026-10-12", "bio": "Učitel tělesné výchovy. Kontakty podle telefonního seznamu školy 2026/2027, rozvrh platný od 12. 10. 2026 podle dodané fotografie."}, "ondrej-cervinka": {"photo": "assets/portraits/ondrej-cervinka-20261103.webp", "photoKind": "circular-restored", "photoUpdated": "2026-11-03"}};
function refreshEarlierAssets(content){
 if(content.teacherMediaRevision===timetableRevision)return content;
 const previousRefresh=content.teacherMediaRevision===originalMediaRevision;
 if(Array.isArray(content.teachers)){
  content={...content,teachers:content.teachers.map(t=>({...t,...(!previousRefresh?(patches[t.id]||{}):{}),...(timetablePatches[t.id]||{}),fallbackAvatar:t.fallbackAvatar||(t.role==='učitelka'?'female':'male')}))};
  if(!content.teachers.some(t=>t.id===addedTeacher.id))content.teachers.push({...addedTeacher,...timetablePatches[addedTeacher.id]});
 }
 return {...content,teacherMediaRevision:timetableRevision};
}

function refreshPreviousPortraits(content){
 if(content.teacherMediaRevision===previousPortraitRevision)return content;
 const refreshed=refreshEarlierAssets(content);
 const teachers=Array.isArray(refreshed.teachers)?refreshed.teachers.map(t=>{
  if(!['hynek-petros','miriam-humeova'].includes(t.id))return t;
  const updated={...t,photo:'assets/portraits/'+t.id+'-20261103.webp',photoKind:'circular-restored',photoUpdated:'2026-11-03'};
  if(t.id==='hynek-petros'){const url='https://www.facebook.com/hynek.petros.5';updated.externalLinks=[...(t.externalLinks||[])];if(!updated.externalLinks.some(l=>l.url===url))updated.externalLinks.push({label:'Facebook',url})}
  return updated;
 }):refreshed.teachers;
 return {...refreshed,teachers,teacherMediaRevision:previousPortraitRevision};
}

function refreshGotzPavlova(content){
 if(content.teacherMediaRevision===gotzPavlovaRevision)return content;
 const refreshed=refreshPreviousPortraits(content);
 const teachers=Array.isArray(refreshed.teachers)?refreshed.teachers.map(t=>{
  if(!['jiri-gotz','andrea-pavlova'].includes(t.id))return t;
  const updated={...t,photo:'assets/portraits/'+t.id+'-20261103.webp',photoKind:'circular-restored',photoUpdated:'2026-11-03'};
  if(t.id==='jiri-gotz'){const url='https://www.facebook.com/jiri.gotz';updated.externalLinks=[...(t.externalLinks||[])];if(!updated.externalLinks.some(l=>l.url===url))updated.externalLinks.push({label:'Facebook',url})}
  return updated;
 }):refreshed.teachers;
 return {...refreshed,teachers,teacherMediaRevision:gotzPavlovaRevision};
}

function refreshRadkaPortrait(content){
 if(content.teacherMediaRevision===radkaPortraitRevision)return content;
 const refreshed=refreshGotzPavlova(content);
 return {...refreshed,teachers:refreshed.teachers?.map(t=>t.id==='radka-stefanakova'?{...t,photo:'assets/portraits/radka-stefanakova-20261104.webp',photoKind:'circular-restored',photoUpdated:'2026-11-04'}:t)??refreshed.teachers,teacherMediaRevision:radkaPortraitRevision};
}
function refreshCurrentAssets(content){
 if(content.teacherMediaRevision===teacherMediaRevision)return content;
 const refreshed=refreshRadkaPortrait(content);
 const teachers=refreshed.teachers?.map(t=>{
  if(t.id!=='karel-bernat')return t;
  const url='https://www.instagram.com/bernat_karel/',externalLinks=[...(t.externalLinks||[])];
  if(!externalLinks.some(l=>l.url===url))externalLinks.push({label:'Instagram',url});
  return {...t,photo:'assets/portraits/karel-bernat-20261104.png',photoKind:'circular-restored',photoUpdated:'2026-11-04',externalLinks};
 })??refreshed.teachers;
 return {...refreshed,teachers,teacherMediaRevision};
}

// A separate fact migration must not reapply old portraits or timetable patches.
function refreshTeacherDates(content){const c=refreshCurrentAssets(content);if(c.teacherDatesRevision==='2026-11-09')return c;return{...c,teacherDatesRevision:'2026-11-09',teachers:c.teachers?.map(t=>t.id==='hynek-petros'&&!t.birthDate?{...t,birthDate:'2002-02-21'}:t)??c.teachers}}

// Add approved public links once, preserving custom fields and later admin removals.
export const teacherLinksRevision='2026-11-09';
function refreshApprovedTeacherLinks(content){
 const c=refreshTeacherDates(content);if(c.teacherLinksRevision===teacherLinksRevision)return c;
 return {...c,teacherLinksRevision,teachers:c.teachers?.map(t=>{
  const link=approvedLinks[t.id];if(!link)return t;
  const externalLinks=[...(t.externalLinks||[])];
  if(externalLinks.length<8&&!externalLinks.some(l=>l.url.replace(/\/$/,'')===link.url.replace(/\/$/,'')))externalLinks.push({...link});
  return {...t,externalLinks};
 })??c.teachers};
}


// A fact supplied by the class administrator, without altering the source PDF.
export const teacherScheduleRevision='2026-11-13-shared-pe';
function refreshTeacherSchedules(content){
 const c=refreshApprovedTeacherLinks(content);if(c.teacherScheduleRevision===teacherScheduleRevision)return c;
 const ids=['jakub-petrak','vladislav-liszok'];
 return {...c,teacherScheduleRevision,teachers:c.teachers?.map(t=>!ids.includes(t.id)?t:{...t,schedule:(t.schedule||[]).map(l=>l.day===4&&[0,1].includes(l.hour)&&l.subject==='TEV'&&(l.classes||[l.cls]).includes(t.id==='jakub-petrak'?'1.A':'1.C')?{...l,coTeacherIds:[...new Set([...(l.coTeacherIds||[]),ids.find(id=>id!==t.id)])],jointTeaching:'Společný tělocvik: 1.A (2/2) a 1.C (1/2), Jakub Petrák a Vladislav Liszok.'}:l)})??c.teachers};
}

export const teacherVideoRevision='2026-11-10-theimer-video-removed';
function refreshTeacherVideo(content){
 const c=refreshTeacherSchedules(content);
 if(c.teacherVideoRevision===teacherVideoRevision)return c;
 return {...c,teacherVideoRevision,teachers:c.teachers?.map(t=>t.id==='martin-theimer'?{...t,video:'',videoEnabled:false}:t)??c.teachers};
}

// Move council membership into the biography and remove the unrelated book link.
export const teacherProfileRevision='2026-11-16-vyroubal';
export function refreshTeacherAssets(content){
 const c=refreshTeacherVideo(content);
 if(c.teacherProfileRevision===teacherProfileRevision)return c;
 return {...c,teacherProfileRevision,teachers:c.teachers?.map(t=>{
  if(t.id!=='martin-vyroubal')return t;
  const bio=(t.bio||'').trim();
  return {...t,bio:/člen[^\n.]*školské rady/i.test(bio)?bio:[bio,'Člen školské rady.'].filter(Boolean).join('\n\n'),externalLinks:(t.externalLinks||[]).filter(link=>{
   let url;try{url=new URL(link.url)}catch{return true}
   const host=url.hostname.replace(/^www\./,'');
   return !(host==='knihydobrovsky.cz'&&url.pathname.replace(/\/$/,'')==='/kniha/ceskoslovenska-letadla-ve-sluzbach-luftwaffe-635187')&&!(host==='betlemska.cz'&&url.pathname.replace(/\/$/,'')==='/o-skole/skolska-rada');
  })};
 })??c.teachers};
}
