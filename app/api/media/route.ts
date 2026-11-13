import {env} from 'cloudflare:workers';
import {mediaResponse} from '../../../lib/portal-media.mjs';
export const dynamic='force-dynamic';
function handle(request:Request){return mediaResponse(env.DB,env.BUCKET,request)}
export const GET=handle;export const POST=handle;
