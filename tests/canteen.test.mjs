import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {refreshTeacherAssets,teacherMediaRevision,teacherLinksRevision} from '../lib/teacher-assets.mjs';
import {validateContent,emptyContent,sectionKeys} from '../lib/cms-content.mjs';
const source=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const school=JSON.parse(source('public/assets/data.json')),menu=JSON.parse(source('public/assets/lunch.json'));
const links=JSON.parse(source('lib/approved-teacher-links.json'));
for(const [id,link]of Object.entries(links))assert.ok(school.teachers.find(t=>t.id===id).externalLinks.some(l=>l.url===link.url),id);
assert.ok(!JSON.stringify(links).includes('gpjp.cz'),'Unconfirmed Götz identity is excluded');
const custom={...school.teachers.find(t=>t.id==='hynek-petros'),photo:'assets/my-portrait.webp',bio:'Vlastní text',schedule:[{day:1,hour:0,classes:['1.A'],subject:'MAT',room:'U99'}],externalLinks:[{label:'Vlastní web',url:'https://example.com/'}]};
const before={...emptyContent(),teacherMediaRevision,teacherDatesRevision:'2026-11-09',teachers:[custom]};
const migrated=refreshTeacherAssets(before);assert.equal(migrated.teacherLinksRevision,teacherLinksRevision);assert.equal(migrated.teachers[0].externalLinks.length,2);assert.equal(migrated.teachers[0].photo,custom.photo);assert.equal(migrated.teachers[0].bio,custom.bio);assert.deepEqual(migrated.teachers[0].schedule,custom.schedule);
assert.equal(refreshTeacherAssets(migrated).teachers[0].externalLinks.length,2,'Refresh does not duplicate links');
const edited=validateContent({...migrated,teachers:[{...migrated.teachers[0],externalLinks:[]}]});assert.equal(refreshTeacherAssets(edited).teachers[0].externalLinks.length,0,'Later admin removal survives');assert.ok(sectionKeys.includes('canteen'));assert.equal(validateContent({...emptyContent(),sections:{canteen:{title:'Naše jídelna'}}}).sections.canteen.title,'Naše jídelna');
async function boot(offline=false){
 const {document,window}=parseHTML(source('public/index.html'));
 Object.defineProperty(document,'baseURI',{value:'https://school.test/index.html'});
 window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};
 const callbacks={},errors=[],storage=new Map([['betlemska-preview-clock-v1',JSON.stringify({date:'2026-11-09',time:'10:00'})]]),calls=[];
 const live=structuredClone(menu);live.fetchedAt=new Date().toISOString();live.days['2026-11-10'].drink='Čaj z živé nabídky';live.days['2026-11-10'].extra='<script>bad</script>';
 const ctx={document,console:{...console,error:e=>errors.push(e)},location:{hash:'#canteen',protocol:'https:'},navigator:{onLine:!offline},Date,Intl,URL,URLSearchParams,AbortController,CustomEvent:window.CustomEvent,Event:window.Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},scrollTo(){},addEventListener:(t,f)=>(callbacks[t]??=[]).push(f),dispatchEvent:e=>(callbacks[e.type]||[]).forEach(f=>f(e)),fetch:async url=>{calls.push(url.href);if(offline)throw Error('offline');if(url.pathname.endsWith('assets/data.json'))return Response.json(school);if(url.pathname.endsWith('api/menu'))return Response.json(live);return Response.json({content:{posts:[],links:[],teachers:school.teachers,events:school.events}})}};ctx.window=ctx;vm.createContext(ctx);
 for(const f of ['teacher-links.js','presence.js','portal-core.js','calendar-core.js','preview-clock.js','class-week.js','app.js'])vm.runInContext(source('public/'+f),ctx);
 await new Promise(setImmediate);await new Promise(setImmediate);
 const $=s=>document.querySelector(s),click=s=>{assert.ok($(s),s);$(s).dispatchEvent(new window.Event('click',{bubbles:true}))};
 assert.equal(errors.length,0);assert.ok($('#main h1').textContent.includes('Co bude dobrého'));assert.ok($('#nav a[href="#canteen"]'));assert.equal($('#canteen-date').value,'2026-11-09');assert.ok($('.canteen-selected').textContent.includes('Vepřová panenka'));
 click('[data-canteen-shift="1"]');assert.equal($('#canteen-date').value,'2026-11-10');assert.ok($('.canteen-selected').textContent.includes('Losos'));assert.ok($('.canteen-selected').textContent.includes('obsahuje alergeny:4'));if(!offline){assert.ok($('.canteen-extras').textContent.includes('Čaj z živé nabídky'));assert.equal($('.canteen-extras script'),null,'Upstream text is escaped')}
 click('[data-canteen-date="2026-11-17"]');assert.ok($('.canteen-selected').textContent.includes('Státní svátek'));assert.equal($('.canteen-selected .meal'),null);
 const input=$('#canteen-date');input.value='2026-11-14';input.dispatchEvent(new window.Event('change',{bubbles:true}));assert.ok($('.canteen-selected').textContent.includes('nemáme zveřejněnou nabídku'));assert.equal($('.canteen-selected .meal'),null,'Missing dates never reuse another day');
 click('[data-canteen-date="2026-11-09"]');assert.equal($('#canteen-date').value,'2026-11-09');assert.ok($('a[href="https://www.instagram.com/jidelnabetlemska/"]'));assert.ok($('a[href="https://jidelna.betlemska.cz/"]'));assert.equal($('#nav').querySelectorAll('.mobile-tab').length,5,'Mobile navigation stays bounded');
 if(!offline)assert.ok(calls.some(u=>u.endsWith('/api/menu')));
}
await boot();await boot(true);
console.log('Canteen: live/fallback exact-date menus, next day/date picker/today/holiday/missing date, allergens/drink/extra, safe upstream text, Instagram/order links, mobile navigation and approved link migration with preserved edits passed.');
