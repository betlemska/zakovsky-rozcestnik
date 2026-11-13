/* Weather UI is optional: a network failure never blocks the timetable. */
(function(root){'use strict';
const W=root.BetlemskaWeatherCore,key='betlemska-weather-v1';
if(!W)return;
let snapshot=null,pending=null,retryAt=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(W.isForecast(saved))snapshot=saved;}catch{}
function slot(date,minute,label,compact=false){
 return `<div class="weather-slot${compact?' weather-compact':''}" role="group" data-weather-date="${esc(date)}" data-weather-minute="${minute}" data-weather-label="${esc(label)}"><small class="weather-time">${esc(label)} · ${W.timeLabel(minute)}</small><span class="weather-result">Načítám počasí…</span></div>`;
}
function source(){return '<div class="weather-source"><span data-weather-status>Hodinová předpověď · Praha 1</span><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Počasí: Open-Meteo ↗</a></div>';}
function dayPanel(lessons,date,minute,hours){
 const p=W.plan(lessons,hours);if(!p)return '';
 const after=minute>=p.endMinute;
 return `<section class="day-weather" aria-label="Počasí v Praze 1"><div class="eyebrow">VENKU U ŠKOLY · PRAHA 1</div><div class="day-weather-tiles">${p.lunchMinute===null||p.lunchMinute<685||p.lunchMinute>=885?'':slot(date,p.lunchMinute,'O obědové pauze')}${slot(date,after?minute:p.endMinute,after?'Teď po škole':'Po škole')}</div>${source()}</section>`;
}
function paint(loading=false){
 const usable=W.isForecast(snapshot),stale=usable&&(snapshot.stale||Date.now()-Date.parse(snapshot.fetchedAt)>=900000);
 document.querySelectorAll('[data-weather-date]').forEach(el=>{
  const minute=Number(el.dataset.weatherMinute),weather=usable?W.at(snapshot,el.dataset.weatherDate,minute):null;
  const result=el.querySelector('.weather-result');if(!result)return;
  el.classList.toggle('weather-night',!!weather?.night);
  el.classList.toggle('weather-unavailable',!weather);
  if(!weather){result.textContent=loading?'Načítám počasí…':usable?'Bez předpovědi pro tento den':'Počasí není dostupné';el.title='Pro tento čas nemáme dostupnou předpověď.';el.setAttribute('aria-label',`${el.dataset.weatherLabel} · ${W.timeLabel(minute)} · ${result.textContent}`);return;}
  result.innerHTML=`<span class="weather-emoji" aria-hidden="true">${weather.emoji}</span><b>${weather.temperature} °C</b><span class="weather-description">${esc(weather.label)}</span><small class="weather-sunset">Západ ${W.timeLabel(weather.sunset)}</small>`;
  el.title=`${el.dataset.weatherLabel} · ${el.dataset.weatherDate} ${W.timeLabel(minute)} · Praha 1 · ${weather.label} · ${weather.temperature} °C · západ slunce ${W.timeLabel(weather.sunset)}${stale?' · uložená předpověď':''}`;
  el.setAttribute('aria-label',el.title);
 });
 document.querySelectorAll('[data-weather-status]').forEach(el=>{el.textContent=usable?`${stale?'Uložená předpověď':'Hodinová předpověď'} · Praha 1 · aktualizováno ${new Date(snapshot.fetchedAt).toLocaleTimeString('cs-CZ',{timeZone:W.TIME_ZONE,hour:'2-digit',minute:'2-digit'})}`:loading?'Načítám předpověď pro Prahu 1…':'Předpověď se nepodařilo načíst.';});
}
async function refresh(){
 if(!document.querySelector('[data-weather-date]'))return;
 if(pending){paint(true);return pending;}
 if(W.isForecast(snapshot)&&!snapshot.stale&&Date.now()-Date.parse(snapshot.fetchedAt)<900000){paint();return;}
 if(Date.now()<retryAt||location.protocol==='file:'){paint();return;}
 paint(true);
 pending=(async()=>{
  try{
   let next;
   try{next=await download(new URL('api/weather',document.baseURI));}
   catch{next=await download(W.forecastURL,true);}
   snapshot=next;retryAt=next.stale?Date.now()+60000:0;
   try{localStorage.setItem(key,JSON.stringify(snapshot));}catch{}
  }catch{retryAt=Date.now()+60000;}
  finally{pending=null;paint();}
 })();
 return pending;
}
async function download(url,direct=false){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(url,{signal:controller.signal});
  if(!response.ok)throw Error('Weather unavailable');
  const raw=await response.json(),next=direct?W.normalizeForecast(raw):raw;
  if(!W.isForecast(next))throw Error('Invalid forecast');return next;
 }finally{clearTimeout(timer);}
}
root.BetlemskaWeather={slot,source,dayPanel,refresh};
})(typeof window!=='undefined'?window:globalThis);
