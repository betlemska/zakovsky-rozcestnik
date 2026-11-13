import {getForecast} from '../../../lib/weather.mjs';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const forecast=await getForecast();
  return Response.json(forecast,{headers:{'Cache-Control':forecast.stale?'public, max-age=30, s-maxage=60':'public, max-age=300, s-maxage=900'}});
 }catch(error){
  console.warn('Public Prague weather:',error instanceof Error?error.message:'fetch failed');
  return Response.json({error:'Počasí pro Prahu 1 se nepodařilo načíst.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
