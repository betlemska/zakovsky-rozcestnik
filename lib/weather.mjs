import {Weather} from './weather-core.mjs';
// One fixed place and one shared forecast; no visitor geolocation or API secret.
export const weatherURL=Weather.forecastURL;
export function createWeatherService({fetchImpl=fetch,now=Date.now}={}){
 let cached=null,pending=null,retryAt=0;
 return async function getForecast(){
  const time=now();
  if(cached&&time-Date.parse(cached.fetchedAt)<900000)return cached;
  if(pending)return pending;
  if(time<retryAt){if(Weather.isForecast(cached,time))return {...cached,stale:true};throw Error('Weather temporarily unavailable');}
  pending=(async()=>{
   try{
    const response=await fetchImpl(weatherURL,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Weather provider HTTP '+response.status);
    cached=Weather.normalizeForecast(await response.json(),now());retryAt=0;return cached;
   }catch(error){retryAt=now()+60000;if(Weather.isForecast(cached,now()))return {...cached,stale:true};throw error;}
   finally{pending=null;}
  })();
  return pending;
 };
}
export const getForecast=createWeatherService();
