import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {Weather as W} from '../lib/weather-core.mjs';
import {createWeatherService,weatherURL} from '../lib/weather.mjs';
const source=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const fixed=Date.parse('2026-11-10T11:00:00Z'),epoch=s=>Date.parse(s)/1000;
function rawForecast(){return {
 timezone:'Europe/Prague',
 daily:{time:[epoch('2026-11-09T23:00:00Z'),epoch('2026-11-10T23:00:00Z')],sunrise:[epoch('2026-11-10T06:10:00Z'),epoch('2026-11-11T06:12:00Z')],sunset:[epoch('2026-11-10T15:26:00Z'),epoch('2026-11-11T15:24:00Z')]},
 hourly:{time:[epoch('2026-11-10T07:00:00Z'),epoch('2026-11-10T12:00:00Z'),epoch('2026-11-10T16:00:00Z'),epoch('2026-11-11T12:00:00Z')],temperature_2m:[2,7.4,4.1,8.2],weather_code:[3,0,61,71],is_day:[1,1,0,1]}
};}
test('Hourly weather, exact sunset boundary and simultaneous darkness/rain are date-specific',()=>{
 const snapshot=W.normalizeForecast(rawForecast(),fixed);
 assert.equal(W.isForecast(snapshot,fixed),true);
 assert.equal(snapshot.days['2026-11-10'].sunset,986);
 assert.equal(W.at(snapshot,'2026-11-10',780).emoji,'☀️');
 assert.equal(W.at(snapshot,'2026-11-10',780).temperature,7);
 assert.equal(W.at(snapshot,'2026-11-10',985).night,false);
 assert.equal(W.at(snapshot,'2026-11-10',986).night,true);
 assert.equal(W.at(snapshot,'2026-11-10',1020).emoji,'🌙 🌧️');
 assert.match(W.at(snapshot,'2026-11-10',1020).label,/Po západu slunce.*déšť/);
 assert.equal(W.at(snapshot,'2026-11-11',780).emoji,'🌨️');
 assert.equal(W.at(snapshot,'2026-11-12',780),null,'Another date never borrows today’s weather');
 assert.equal(W.at(snapshot,'2026-11-10',-1),null);
 assert.match(W.at(snapshot,'2026-11-10',360).label,/Před východem slunce/);
 for(const [code,emoji] of [[3,'☁️'],[45,'🌫️'],[55,'🌧️'],[67,'🌧️'],[85,'🌨️'],[99,'⛈️']])assert.equal(W.condition(code).emoji,emoji);
});
test('Prague timezone is independent of browser timezone and follows the DST boundary',()=>{
 assert.deepEqual(W.localTime(epoch('2026-10-25T00:30:00Z')),{date:'2026-10-25',minute:150});
 assert.deepEqual(W.localTime(epoch('2026-10-25T01:30:00Z')),{date:'2026-10-25',minute:150});
 assert.deepEqual(W.localTime(epoch('2026-06-10T23:30:00Z')),{date:'2026-06-11',minute:90});
 assert.deepEqual(W.localTime(epoch('2026-11-10T23:30:00Z')),{date:'2026-11-11',minute:30});
});
test('Missing, malformed, future-dated and expired forecast snapshots are rejected',()=>{
 const snapshot=W.normalizeForecast(rawForecast(),fixed);
 assert.equal(W.isForecast(snapshot,fixed+W.MAX_AGE+1),false);
 assert.equal(W.isForecast({...snapshot,fetchedAt:new Date(fixed+3600000).toISOString()},fixed),false);
 assert.equal(W.isForecast({...snapshot,days:{'2026-02-31':snapshot.days['2026-11-10']}},fixed),false);
 for(const mutate of [raw=>raw.hourly.temperature_2m[1]=null,raw=>raw.hourly.weather_code[1]=999,raw=>raw.hourly.is_day[1]=null,raw=>raw.daily.sunset[0]=null,raw=>raw.timezone='UTC']){
  const raw=rawForecast();mutate(raw);assert.throws(()=>W.normalizeForecast(raw,fixed));
 }
});
test('Departure/lunch use effective lessons, preserve groups and respect cancellations',()=>{
 const hours=[['8:00','8:45'],['8:50','9:35'],['9:50','10:35'],['10:40','11:25'],['11:30','12:15'],['12:25','13:10'],['13:15','14:00'],['14:05','14:50']];
 const lessons=[{hour:0},{hour:4,group:'1/2'},{hour:4,group:'2/2'},{hour:6},{hour:7,cancelled:true}];
 assert.deepEqual(W.plan(lessons,hours),{endMinute:840,lunchMinute:745});
 assert.equal(W.plan(lessons.map(l=>({...l,cancelled:true})),hours),null);
 assert.equal(W.plan([{hour:0},{hour:1}],hours).lunchMinute,null);
});
test('Server shares one request/cache and only returns bounded, explicitly stale fallback',async()=>{
 let clock=fixed,calls=0,fail=false;
 const get=createWeatherService({now:()=>clock,fetchImpl:async(url,options)=>{
  calls++;assert.equal(url,weatherURL);assert.equal(new URL(url).searchParams.get('timezone'),'Europe/Prague');assert.ok(options.signal);
  if(fail)throw Error('offline');return Response.json(rawForecast());
 }});
 const [a,b]=await Promise.all([get(),get()]);assert.deepEqual(a,b);assert.equal(calls,1);
 await get();assert.equal(calls,1);
 clock+=900001;fail=true;assert.equal((await get()).stale,true);assert.equal(calls,2);
 await get();assert.equal(calls,2,'Backoff prevents a request per student during an outage');
 clock=fixed+W.MAX_AGE+1;await assert.rejects(get());
});
test('Real weekly and daily DOM shows forecast at lunch/after school, darkness, failure and refresh',async()=>{
 let clock=fixed,calls=0,offline=false;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const {document}=parseHTML('<html><body></body></html>'),storage=new Map();
 Object.defineProperty(document,'baseURI',{value:'https://school.test/'});
 const context={Date:Clock,Intl,document,console,URL,AbortController,setTimeout,clearTimeout,location:{protocol:'https:'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async url=>{calls++;assert.equal(url.href,'https://school.test/api/weather');if(offline)throw Error('offline');return Response.json(W.normalizeForecast(rawForecast(),clock));}};
 context.window=context;vm.createContext(context);
 for(const f of ['weather-core.js','weather.js','lesson-changes.js','portal-core.js','class-week.js'])vm.runInContext(source('public/'+f),context);
 const school=JSON.parse(source('public/assets/data.json')),forecast=context.BetlemskaWeather,week=context.BetlemskaClassWeek;
 document.body.innerHTML=week.render({teachers:school.teachers,events:[],date:'2026-11-10',withWeather:true});
 assert.ok(document.querySelector('th.weather-column'));
 assert.equal(document.querySelectorAll('.weather-after-school').length,5);
 assert.ok(document.querySelector('.lunch-slot [data-weather-date]'));
 await forecast.refresh();assert.equal(calls,1);await forecast.refresh();assert.equal(calls,1);
 const tuesday=document.querySelector('[data-week-day="2026-11-10"]');
 assert.ok(tuesday.querySelector('.weather-after-school .weather-result b'));
 assert.match(document.querySelector('[data-week-day="2026-11-09"] .weather-result').textContent,/Bez předpovědi/);
 const lessons=[{hour:0},{hour:4},{hour:6}];
 document.body.innerHTML=forecast.dayPanel(lessons,'2026-11-10',1020,week.hours);await forecast.refresh();
 const after=document.querySelector('[data-weather-label="Teď po škole"]');
 assert.equal(after.dataset.weatherMinute,'1020');assert.match(after.textContent,/🌙 🌧️.*4 °C.*Po západu slunce/);
 assert.match(document.querySelector('a').href,/open-meteo.com/);
 clock+=900001;offline=true;await forecast.refresh();assert.match(document.querySelector('[data-weather-status]').textContent,/Uložená/);
 clock=fixed+W.MAX_AGE+1;await forecast.refresh();assert.equal(document.querySelector('.weather-emoji'),null);assert.match(after.textContent,/není dostupné/);
 const noLessons=week.render({teachers:school.teachers,events:[{date:'2026-11-10',kind:'akce',allDay:true,title:'Výlet'}],date:'2026-11-10',withWeather:true});
 document.body.innerHTML=noLessons;assert.match(document.querySelector('[data-week-day="2026-11-10"] .weather-after-school').textContent,/Bez výuky/);
 document.body.innerHTML=week.render({teachers:school.teachers,events:[{date:'2026-11-10',kind:'volno',title:'Volno'}],date:'2026-11-10',withWeather:true});
 assert.equal(document.querySelector('.week-off-day td[colspan]').getAttribute('colspan'),'11');
 document.body.innerHTML=forecast.slot('2026-11-10',780,'<img src=x>');assert.equal(document.querySelector('img'),null);
});
test('The browser can obtain the same validated forecast directly when the shared server is unavailable',async()=>{
 class Clock extends Date{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}}
 const {document}=parseHTML('<html><body></body></html>'),calls=[];
 Object.defineProperty(document,'baseURI',{value:'https://school.test/'});
 const context={Date:Clock,Intl,document,console,URL,AbortController,setTimeout,clearTimeout,location:{protocol:'https:'},localStorage:{getItem:()=>null,setItem(){}},fetch:async url=>{calls.push(String(url));return String(url).includes('/api/weather')?Response.json({error:'unavailable'},{status:503}):Response.json(rawForecast());}};
 context.window=context;vm.createContext(context);
 for(const file of ['weather-core.js','weather.js'])vm.runInContext(source('public/'+file),context);
 document.body.innerHTML=context.BetlemskaWeather.slot('2026-11-10',1020,'Po škole');
 await context.BetlemskaWeather.refresh();
 assert.deepEqual(calls,['https://school.test/api/weather',weatherURL]);
 assert.match(document.querySelector('.weather-slot').textContent,/🌙 🌧️.*4 °C.*Po západu slunce/);
});
