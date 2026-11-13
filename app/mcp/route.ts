import {env} from 'cloudflare:workers';
import {reminderMcp} from '../../lib/reminder-mcp.mjs';
export const dynamic='force-dynamic';
export function POST(request:Request){return reminderMcp(request,env.DB,env.PORTAL_SCHEDULER_OWNER_EMAIL)}
