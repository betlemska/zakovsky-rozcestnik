import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import vm from 'node:vm';
const root=new URL('../public/',import.meta.url),school=JSON.parse(readFileSync(new URL('assets/data.json',root),'utf8'));
const {document,window}=parseHTML(readFileSync(new URL('index.html',root),'utf8'));Object.defineProperty(document,'baseURI',{value:'https://portal.test/index.html'});
window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};window.HTMLElement.prototype.scrollIntoView=function(){};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??''},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v))}});
const events={},errors=[],context={document,Date,Intl,URL,URLSearchParams,AbortController,navigator:{onLine:true},location:{hash:'#home',protocol:'https:'},localStorage:{getItem(){return null},setItem(){}},setTimeout,clearTimeout,setInterval(){},scrollTo(){},addEventListener(t,f){(events[t]||=[]).push(f)},console:{...console,warn(){},error(...v){errors.push(v)}},fetch:async(url)=>new URL(url).pathname.endsWith('assets/data.json')?Response.json(school):Response.json({content:{posts:[{id:'retired',title:'RETIRED ARTICLE MUST NOT APPEAR',body:'Old content',status:'published'}],links:[],teacherNotes:{}}})};context.window=context;vm.createContext(context);
for(const file of ['teacher-links.js','lesson-changes.js','presence.js','portal-core.js','calendar-core.js','preview-clock.js','class-week.js','app.js'])vm.runInContext(readFileSync(new URL(file,root),'utf8'),context);
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(setImmediate)};await flush();
assert.equal(errors.length,0);assert.ok(document.querySelector('[data-school-news]'));assert.ok(!document.querySelector('#main').textContent.includes('RETIRED ARTICLE'));
assert.equal(document.querySelector('#nav a[href="#news"]'),null);assert.ok(document.querySelector('#nav a[href="#plans"]').textContent.includes('360°'));
async function route(hash){context.location.hash=hash;for(const fn of events.hashchange||[])fn();await flush()}
await route('#plans');assert.ok(document.querySelector('#main a[href="https://my.matterport.com/show/?m=46boANgBwEt"]'));assert.equal(document.querySelector('#floor-stage,#floor-viewport,#plan-form,#saved-plans'),null);
await route('#schedule?class=1.C');assert.ok(document.querySelector('#main h1').textContent.includes('1.C'));assert.equal(document.querySelectorAll('.class-representatives article').length,2);assert.ok(document.querySelector('.class-representatives').textContent.includes('Předseda 1.C'));assert.ok(document.querySelector('.class-representatives').textContent.includes('Zástupce 1.C'));
assert.equal(document.querySelector('.notice a[href*="/source.jpg"]'),null);
for(const teacher of school.teachers){if(teacher.photo)assert.ok(existsSync(new URL(teacher.photo,root)));assert.equal(teacher.pdf||'','');assert.equal(teacher.scheduleSource||'','')}
assert.ok(existsSync(new URL('assets/portraits/alien-boy.webp',root)));assert.ok(existsSync(new URL('assets/portraits/alien-girl.webp',root)));assert.equal(existsSync(new URL('floorplan.js',root)),false);
await route('#news');assert.ok(document.querySelector('#main h1').textContent.includes('Celá škola'));assert.equal(document.querySelector('[data-news]'),null);assert.equal(errors.length,0);
console.log('Public cleanup: real DOM keeps official home feed, removes custom news/floorplan/upload, preserves 360 tour, all portraits, class representatives, interactive schedules and safe old-route fallback.');
