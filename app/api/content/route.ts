import { env } from 'cloudflare:workers';
import { readContent } from '../../../lib/portal-admin.mjs';
import { publicContent } from '../../../lib/cms-content.mjs';
import { publicCors } from '../../../lib/public-cors.mjs';
export const dynamic='force-dynamic';
export async function GET(request: Request){
 try{return Response.json(await readContent(env.DB).then(data=>({...data,content:publicContent(data.content)})),{headers:{...publicCors(request),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
 catch{return Response.json({error:'Sdílený obsah se nyní nepodařilo načíst.'},{status:503,headers:{...publicCors(request),'Cache-Control':'no-store'}})}
}
