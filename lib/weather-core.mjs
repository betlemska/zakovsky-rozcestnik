/* Hourly forecasts and local daylight times for the school, never device location. */
const TIME_ZONE='Europe/Prague';
const MAX_AGE=6*60*60*1000;
const forecastURL='https://api.open-meteo.com/v1/forecast?latitude=50.084&longitude=14.417&hourly=temperature_2m,weather_code,is_day&daily=sunrise,sunset&timezone=Europe%2FPrague&timeformat=unixtime&forecast_days=16&past_days=7';
const codes=new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function localTime(seconds){
 if(!Number.isFinite(seconds))throw Error('Missing weather timestamp');
 const p=Object.fromEntries(formatter.formatToParts(new Date(seconds*1000)).map(p=>[p.type,p.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,minute:Number(p.hour)*60+Number(p.minute)};
}
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const validMinute=n=>Number.isInteger(n)&&n>=0&&n<1440;
function isForecast(v,now=Date.now()){
 if(v?.schemaVersion!==1||v.timeZone!==TIME_ZONE||!v.days||Array.isArray(v.days))return false;
 const age=now-Date.parse(v.fetchedAt);
 if(!Number.isFinite(age)||age< -300000||age>MAX_AGE)return false;
 const entries=Object.entries(v.days);
 return entries.length>0&&entries.length<=24&&entries.every(([date,d])=>validDate(date)&&validMinute(d?.sunrise)&&validMinute(d.sunset)&&d.sunrise<d.sunset&&Array.isArray(d.hours)&&d.hours.length>0&&d.hours.length<=25&&d.hours.every(h=>validMinute(h?.minute)&&Number.isFinite(h.temperature)&&h.temperature>=-100&&h.temperature<=70&&codes.has(h.code)&&typeof h.isDay==='boolean'));
}
function normalizeForecast(raw,now=Date.now()){
 if(raw?.timezone!==TIME_ZONE)throw Error('Wrong forecast timezone');
 const days={},daily=raw.daily,hourly=raw.hourly;
 if(!Array.isArray(daily?.time)||!Array.isArray(hourly?.time)||hourly.time.length>600)throw Error('Invalid forecast');
 for(let i=0;i<daily.time.length;i++){
  const date=localTime(daily.time[i]).date,rise=localTime(daily.sunrise?.[i]),set=localTime(daily.sunset?.[i]);
  if(rise.date!==date||set.date!==date)throw Error('Daylight date mismatch');
  days[date]={sunrise:rise.minute,sunset:set.minute,hours:[]};
 }
 for(let i=0;i<hourly.time.length;i++){
  const {date,minute}=localTime(hourly.time[i]);
  if(!days[date])throw Error('Weather date mismatch');
  const isDay=hourly.is_day?.[i];
  if(isDay!==0&&isDay!==1)throw Error('Missing day/night flag');
  days[date].hours.push({minute,temperature:hourly.temperature_2m?.[i],code:hourly.weather_code?.[i],isDay:isDay===1});
 }
 const snapshot={schemaVersion:1,location:'Praha 1 · Betlémská',timeZone:TIME_ZONE,fetchedAt:new Date(now).toISOString(),days};
 if(!isForecast(snapshot,now))throw Error('Incomplete weather data');
 return snapshot;
}
function condition(code){
 if(code===0)return {emoji:'☀️',label:'jasno'};
 if(code===1||code===2)return {emoji:'🌤️',label:code===1?'skoro jasno':'polojasno'};
 if(code===3)return {emoji:'☁️',label:'zataženo'};
 if(code===45||code===48)return {emoji:'🌫️',label:'mlha'};
 if([51,53,55,56,57].includes(code))return {emoji:'🌧️',label:[56,57].includes(code)?'mrznoucí mrholení':'mrholení'};
 if([61,63,65,66,67,80,81,82].includes(code))return {emoji:'🌧️',label:[66,67].includes(code)?'mrznoucí déšť':[80,81,82].includes(code)?'přeháňky':'déšť'};
 if([71,73,75,77,85,86].includes(code))return {emoji:'🌨️',label:'sněžení'};
 if([95,96,99].includes(code))return {emoji:'⛈️',label:[96,99].includes(code)?'bouřka s kroupami':'bouřka'};
 return {emoji:'',label:'počasí není dostupné'};
}
function at(snapshot,date,minute){
 const day=snapshot?.days?.[date];
 if(!day?.hours?.length||!validMinute(minute))return null;
 const hour=day.hours.reduce((a,b)=>Math.abs(b.minute-minute)<Math.abs(a.minute-minute)?b:a),weather=condition(hour.code);
 const night=minute<day.sunrise||minute>=day.sunset,nightLabel=minute<day.sunrise?'Před východem slunce':'Po západu slunce';
 return {...weather,emoji:night?(hour.code<=2?'🌙':'🌙 '+weather.emoji):weather.emoji,label:night?nightLabel+' · '+weather.label:weather.label,temperature:Math.round(hour.temperature),night,sunset:day.sunset};
}
const minutes=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
const timeLabel=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
function plan(lessons,hours){
 const occupied=[...new Set(lessons.filter(l=>!l.cancelled&&Number.isInteger(l.hour)&&hours[l.hour]).map(l=>l.hour))].sort((a,b)=>a-b);
 if(!occupied.length)return null;
 const first=occupied[0],last=occupied[occupied.length-1],gap=hours.findIndex((h,i)=>i>first&&i<last&&!occupied.includes(i)&&minutes(h[0])>=660&&minutes(h[0])<=840);
 return {endMinute:minutes(hours[last][1]),lunchMinute:gap<0?null:minutes(hours[gap][0])};
}
const api={TIME_ZONE,MAX_AGE,forecastURL,localTime,validDate,validMinute,isForecast,normalizeForecast,condition,at,timeLabel,plan};
export const Weather=api;
