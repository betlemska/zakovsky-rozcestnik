import {broadcastAnnouncement} from '../../../lib/announcements.mjs';
import { env, waitUntil } from 'cloudflare:workers';
import {runPushTest} from '../../../lib/push-tests.mjs';
import {broadcastNews} from '../../../lib/portal-push.mjs';
import {readContent} from '../../../lib/portal-admin.mjs';
import { adminResponse } from '../../../lib/portal-admin.mjs';
import {provisionClassRepresentatives} from '../../../lib/class-representatives.mjs';
export const dynamic='force-dynamic';
async function handle(request:Request){try{await provisionClassRepresentatives(env.DB,[env.CLASS_REP_SEED_1,env.CLASS_REP_SEED_2]);}catch{console.error('Class representative provisioning failed');return Response.json({error:'Přístupy nyní nelze připravit.'},{status:503})}const origin=new URL(request.url).origin;return adminResponse(env.DB,request,env.ADMIN_BOOTSTRAP_VERIFIER,(post:{id:string})=>waitUntil(readContent(env.DB).then(data=>broadcastNews(env.DB,data.content.posts.find((p:{id:string})=>p.id===post.id)||post,origin)).catch(()=>console.warn('News push delivery failed'))),(test:{id:string})=>waitUntil(runPushTest(env.DB,test.id,origin).catch(()=>console.warn('Test push delivery failed'))),(notice:{id:string})=>waitUntil(broadcastAnnouncement(env.DB,notice.id,origin).catch(()=>console.warn('Announcement push failed'))))}
export const GET=handle;
export const POST=handle;
