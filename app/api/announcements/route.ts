import {env} from 'cloudflare:workers';
import {listAnnouncements} from '../../../lib/announcements.mjs';
import {publicCors} from '../../../lib/public-cors.mjs';
import {PortalError} from '../../../lib/cms-content.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){const headers={...publicCors(request),'Cache-Control':'no-store'};try{return Response.json({items:await listAnnouncements(env.DB,new URL(request.url).searchParams.get('class')||'1.A')},{headers})}catch(e){return Response.json({error:e instanceof PortalError?e.message:'Oznámení se nepodařilo načíst.'},{status:e instanceof PortalError?e.status:503,headers})}}
