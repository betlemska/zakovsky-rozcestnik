import {env} from 'cloudflare:workers';
import {mediaFile} from '../../../../lib/portal-media.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{id:string}>}){const {id}=await context.params;return mediaFile(env.BUCKET,id)}
