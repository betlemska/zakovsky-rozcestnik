import {env} from 'cloudflare:workers';
import {pushResponse} from '../../../lib/portal-push.mjs';
export const dynamic='force-dynamic';
export function GET(request:Request){return pushResponse(env.DB,request)}
export function POST(request:Request){return pushResponse(env.DB,request)}

export function OPTIONS(request:Request){return pushResponse(env.DB,request)}
