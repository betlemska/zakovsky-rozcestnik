import {env} from 'cloudflare:workers';
import {reportsResponse} from '../../../lib/portal-reports.mjs';
export const dynamic='force-dynamic';
export function POST(request:Request){return reportsResponse(env.DB,request)}
