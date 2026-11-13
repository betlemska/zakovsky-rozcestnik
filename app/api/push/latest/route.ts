import {env} from 'cloudflare:workers';
import {latestTestFallback} from '../../../../lib/push-tests.mjs';
import {ensurePush} from '../../../../lib/portal-push.mjs';
import {readContent} from '../../../../lib/portal-admin.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{await ensurePush(env.DB);const row=await env.DB.prepare('SELECT post_id,created_at FROM portal_push_sent ORDER BY created_at DESC LIMIT 1').first();const test=await latestTestFallback(env.DB,row?.created_at||0);if(test)return Response.json({notification:test,post:{id:test.id,title:test.title,excerpt:test.body}},{headers:{'Cache-Control':'no-store'}});const data=await readContent(env.DB);const post=data.content.posts.find((p:{id:string,status:string})=>p.id===row?.post_id&&p.status==='published');return Response.json({post:post?{id:post.id,title:post.title,excerpt:post.excerpt||post.body.slice(0,160)}:null},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({post:null},{status:503,headers:{'Cache-Control':'no-store'}})}}
