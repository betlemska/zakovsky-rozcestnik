// Regression cases for local ZIP use, GitHub project paths and startup errors.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=fs.existsSync(path.join(__dirname,'../public/index.html'))?path.join(__dirname,'../public'):path.join(__dirname,'..');
const schoolData=JSON.parse(fs.readFileSync(path.join(base,'assets/data.json'),'utf8'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const embedded=html.match(/<script type="application\/json" id="school-data">([\s\S]*?)<\/script>/)[1];
assert.deepEqual(JSON.parse(embedded),schoolData,'HTML fallback must match source JSON');
async function boot(route,mode='http',hasEmbedded=true,savedFavorites=[],legacyClass='4.I',shared=null,previewClock=null){
 const elements=new Map();const listeners={};const errors=[];let fetchCalls=0,requestedURL;
 const makeNode=()=>({innerHTML:'',textContent:'',dataset:{},value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},close(){},focus(){},showModal(){}});
 const find=selector=>{if(selector==='#school-data'&&!hasEmbedded)return null;if(!elements.has(selector))elements.set(selector,makeNode());return elements.get(selector)};
 if(hasEmbedded)find('#school-data').textContent=embedded;
 const context={Date,Intl,URL,URLSearchParams,AbortController,navigator:{onLine:true},console:{warn(){},error(...args){errors.push(args)}},setTimeout:fn=>{if(mode==='timeout')queueMicrotask(fn);return 0},clearTimeout(){},setInterval:()=>0,location:{hash:'#'+route,protocol:mode==='file'?'file:':'https:'},localStorage:{getItem:key=>key==='betlemska-preview-clock-v1'?JSON.stringify(previewClock):key==='betlemska-favorites'?JSON.stringify(savedFavorites):key==='betlemska-class'?legacyClass:null,setItem(){}},document:{baseURI:'https://example.github.io/school/',querySelector:find,querySelectorAll:()=>[],addEventListener(type,fn){(listeners[type]||=([])).push(fn)}},fetch:async url=>{if(url.href.endsWith('assets/data.json')){fetchCalls++;requestedURL=url.href;}if(mode==='file')throw Error('File fetch is blocked');if(mode==='blocked')throw Error('Network blocked');if(mode==='timeout')return new Promise(()=>{});return{ok:true,json:async()=>{if(mode==='bad-json')throw SyntaxError('Invalid JSON');return structuredClone(url.href.endsWith('api/content')&&shared?shared:schoolData)}}}};
 context.window=context;context.addEventListener=()=>{};context.scrollTo=(x,y)=>{assert.equal(typeof x,'number','Use browser-compatible numeric scrollTo');assert.equal(typeof y,'number')};
 // A browser's legacy status property must remain untouched by application code.
 Object.defineProperty(context,'status',{get:()=>'',set:()=>{throw Error('Window.status collision')},configurable:false});
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(base,'lesson-changes.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'teacher-links.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'presence.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'portal-core.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'calendar-core.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'preview-clock.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'class-week.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'school-info.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),context);
 await new Promise(setImmediate);await new Promise(setImmediate);
 return {elements,errors,fetchCalls,requestedURL,listeners};
}
(async()=>{
 let cases=0;
 for(const mode of ['http','file','blocked','bad-json','timeout'])for(const route of ['home','news','teachers','schedule','rooms','events','plans','sources','canteen','information']){
  const result=await boot(route,mode);const main=result.elements.get('#main').innerHTML;
  assert.ok(main.includes('<h1>'),`${mode}/${route}: heading rendered`);
  assert.ok(!/<h1>(Podklady se nepodařilo načíst\.|Stránku se nepodařilo zobrazit\.)<\/h1>/.test(main),`${mode}/${route}: no startup error`);
  assert.equal(result.errors.length,0,`${mode}/${route}: no runtime errors`);
  if(route==='teachers')assert.equal((result.elements.get('#teacher-results').innerHTML.match(/class="teacher-card /g)||[]).length,schoolData.teachers.length);
  if(mode==='file')assert.equal(result.fetchCalls,0,'File opening must never fetch JSON');
  else assert.equal(result.requestedURL,'https://example.github.io/school/assets/data.json');
  cases++;
 }
 // The overview must render real lessons, including simultaneous groups, on school days.
 for(const clock of [
  {date:'2026-11-09',time:'07:30'},
  {date:'2026-11-09',time:'08:00'},
  {date:'2026-11-09',time:'08:45'},
  {date:'2026-11-09',time:'09:00'},
  {date:'2026-11-10',time:'10:50'},
  {date:'2026-11-12',time:'08:00'},
  {date:'2026-11-13',time:'08:00'},
  {date:'2026-11-09',time:'17:00'},
  {date:'2026-11-14',time:'09:00'},
  {date:'2026-11-17',time:'09:00'}
 ])for(const route of ['home','news','teachers','schedule','rooms','events','plans','sources','canteen','information']){
  const result=await boot(route,'file',true,[],'1.A',null,clock),main=result.elements.get('#main').innerHTML;
  assert.ok(!main.includes('Stránku se nepodařilo zobrazit.'),`${clock.date} ${clock.time}/${route}: no render error`);
  assert.equal(result.errors.length,0,`${clock.date} ${clock.time}/${route}: no runtime errors`);
  if(route==='home'&&clock.date==='2026-11-09'&&clock.time==='09:00'){
   assert.ok(main.includes('sk. 1/2'),'Current lesson summary preserves first group');
   assert.ok(main.includes('sk. 2/2'),'Current lesson summary preserves second group');
   assert.ok(main.includes('Informační a komunikační technologie'));
   assert.ok(main.includes('Tělesná výchova'));
  }
  cases++;
 }
 const favorites=await boot('home','file',true,['class:4.I','teacher:lubomir-martinec','teacher:miriam-humeova']);const favoritesHTML=favorites.elements.get('#main').innerHTML;assert.ok(favoritesHTML.includes('favorite-teacher'));assert.ok(favoritesHTML.includes('data-presence-id="lubomir-martinec"'));assert.ok(!favoritesHTML.includes('data-openclass="4.I"'),'Obsolete class favorite is not rendered');
 for(const route of ['home','schedule']){const oldPreference=await boot(route,'file',true,[],'4.I');const page=oldPreference.elements.get('#main').innerHTML;assert.ok(page.includes('1.A')||page.includes('1. A'),'Public class remains 1.A despite saved old class');assert.ok(!page.includes('id="class-select"'),'No selection of incomplete other classes');}
 const cms={content:{intro:'Vítej <1.A>',posts:[{id:'p-1',title:'<img src=x>',body:'<script>alert(1)</script>',date:''}],links:[{label:'Materiály',url:'https://www.betlemska.cz/'}],teacherNotes:{'karel-bernat':'Sdílená <poznámka>'}}};
 const shared=await boot('home','http',true,[],'1.A',cms);assert.ok(!shared.elements.get('#main').innerHTML.includes('&lt;img src=x&gt;'),'Retired CMS posts are not rendered');assert.ok(!shared.elements.get('#main').innerHTML.includes('<script>'));assert.ok(shared.elements.get('#main').innerHTML.includes('Vítej &lt;1.A&gt;'));
 for(const listener of shared.listeners.click)await listener({target:{closest:selector=>selector.includes('[data-teacher]')?({dataset:{teacher:'karel-bernat'}}):null},preventDefault(){}});const profile=shared.elements.get('#modal-content').innerHTML;assert.ok(profile.includes('Sdílená &lt;poznámka&gt;'));assert.ok(profile.includes('Moje hodnocení a poznámka'));assert.ok(!profile.includes('· odhad'));
 const customCMS={content:{...cms.content,pages:[{id:'page-projekty',label:'Projekty',title:'Naše projekty',body:'Zážitky z výuky.',published:true}],teachers:[{...schoolData.teachers[0],id:'nova-ucitelka',name:'Nová Učitelka',first:'Nová',last:'Učitelka'}],sections:{plans:{title:'Nový půdorys',body:'Vlastní text pod plánem.',showNative:false}},settings:{homeTitle:'Školní portál'}}};
 const customPage=await boot('page-projekty','http',true,[],'1.A',customCMS);assert.ok(customPage.elements.get('#main').innerHTML.includes('Naše projekty'));assert.ok(customPage.elements.get('#main').innerHTML.includes('Zážitky z výuky.'));
 const newTeacher=await boot('teachers','http',true,[],'1.A',customCMS);assert.ok(newTeacher.elements.get('#teacher-results').innerHTML.includes('Nová Učitelka'));assert.equal((newTeacher.elements.get('#teacher-results').innerHTML.match(/class="teacher-card /g)||[]).length,1);
 const customPlans=await boot('plans','http',true,[],'1.A',customCMS);assert.ok(customPlans.elements.get('#main').innerHTML.includes('Vlastní text pod plánem.'));assert.ok(!customPlans.elements.get('#main').innerHTML.includes('floor-stage'));
 const noData=await boot('home','blocked',false);assert.ok(noData.elements.get('#main').innerHTML.includes('Podklady se nepodařilo načíst.'));
 console.log(`${cases} startup cases passed; source/embedded data match; missing-data error checked.`);
})().catch(e=>{console.error(e);process.exitCode=1});
