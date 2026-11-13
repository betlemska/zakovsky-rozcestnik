import {PortalError} from './cms-content.mjs';
import {tomorrowPreview,runTomorrowReminders,reminderStatus} from './reminders.mjs';
import {pushDiagnostics} from './portal-push.mjs';
export const reminderTools=[
 {name:'preview_tomorrow_reminders',description:'Náhled zítřejších svátků učitelů, školních událostí a písemek 1.A. Neodesílá upozornění.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'send_tomorrow_reminders',description:'Večer od 18:00 pražského času jednou za den odešle na přihlášená zařízení připomínky na zítřek podle jejich nastavení. Před 18:00 jen ověří připravenost.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'calendar_reminder_status',description:'Soukromý stav poslední kontroly a odeslání kalendářních připomínek.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
export function schedulerAuthorized(request,ownerEmail){const user=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return !!user&&!!ownerEmail&&email?.trim().toLowerCase()===ownerEmail.trim().toLowerCase()}
export async function reminderMcp(request,db,ownerEmail){
 let input;try{if(Number(request.headers.get('content-length'))>16000)throw 0;const reader=request.body?.getReader();if(!reader)throw 0;const chunks=[];let size=0;while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>16000){await reader.cancel();throw 0}chunks.push(p.value)}const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}input=JSON.parse(new TextDecoder().decode(bytes))}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid request'}},{status:400})}
 const id=input.id??null,reply=result=>Response.json({jsonrpc:'2.0',id,result},{headers:{'Cache-Control':'no-store'}});
 if(input.method==='server/discover')return reply({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(input.method==='initialize')return reply({protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'Betlemska Calendar',version:'1.0.0'}});
 if(input.method==='notifications/initialized')return new Response(null,{status:204});
 if(input.method==='ping')return reply({});
 if(input.method==='tools/list')return reply({tools:reminderTools});
 if(input.method!=='tools/call')return Response.json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 if(!schedulerAuthorized(request,ownerEmail))return Response.json({jsonrpc:'2.0',id,error:{code:-32001,message:'Pouze ověřený vlastník webu může ovládat připomínky.'}},{status:403});
 try{const name=input.params?.name,args=input.params?.arguments;if(args&&(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length))throw new PortalError('Nástroj nepřijímá parametry.');let result;
 if(name==='preview_tomorrow_reminders')result=await tomorrowPreview(db);else if(name==='send_tomorrow_reminders')result={...(await runTomorrowReminders(db,new URL(request.url).origin)),push:await pushDiagnostics(db)};else if(name==='calendar_reminder_status')result={...(await reminderStatus(db)),push:await pushDiagnostics(db)};else throw new PortalError('Neznámý nástroj.');
 return reply({content:[{type:'text',text:JSON.stringify(result)}],isError:false});
 }catch(e){return reply({content:[{type:'text',text:e instanceof PortalError?e.message:'Připomínky se nepodařilo zpracovat. Zkontroluj stav před dalším pokusem.'}],isError:true})}
}
