import {readSession,assertOrigin} from './portal-admin.mjs';
import {PortalError} from './cms-content.mjs';
const MAX=8*1024*1024;
export function detectMime(bytes){const b=new Uint8Array(bytes);if(b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg';if(b.length>24&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return'image/png';const s=new TextDecoder('latin1').decode(b.slice(0,16));if(s.startsWith('RIFF')&&s.slice(8,12)==='WEBP')return'image/webp';if(s.slice(4,8)==='ftyp'&&['isom','mp41','mp42','avc1','M4V '].includes(s.slice(8,12)))return'video/mp4';if(s.startsWith('%PDF-'))return'application/pdf';throw new PortalError('Nahraj fotografii JPG, PNG, WebP nebo dokument PDF nebo video MP4. SVG a další typy nejsou podporované.')}
export async function mediaRequest(db,bucket,request){
 const session=await readSession(db,request);if(!session)throw new PortalError('Pro práci se soubory se přihlas.',401);
 if(request.method==='GET'){const r=await db.prepare('SELECT id,name,mime,size,created_by,created_at FROM portal_media ORDER BY created_at DESC LIMIT 200').all();return Response.json({media:r.results},{headers:{'Cache-Control':'no-store'}})}
 if(request.method!=='POST')throw new PortalError('Nepodporovaná metoda.',405);assertOrigin(request);
 if(!bucket)throw new PortalError('Úložiště souborů není dostupné.',503);
 if(Number(request.headers.get('content-length'))>MAX)throw new PortalError('Soubor může mít nejvýše 8 MB.',413);
 const reader=request.body?.getReader();if(!reader)throw new PortalError('Chybí soubor.');let size=0,chunks=[];
 while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>MAX){await reader.cancel();throw new PortalError('Soubor může mít nejvýše 8 MB.',413)}chunks.push(p.value)}
 const bytes=new Uint8Array(size);let off=0;for(const chunk of chunks){bytes.set(chunk,off);off+=chunk.length}const mime=detectMime(bytes);
 const id=crypto.randomUUID();let name;try{name=decodeURIComponent(request.headers.get('x-file-name')||'soubor')}catch{name='soubor'}name=name.replace(/[\x00-\x1f<>"\\/]/g,'').slice(0,160)||'soubor';
 await bucket.put(id,bytes,{httpMetadata:{contentType:mime,cacheControl:'public,max-age=31536000,immutable'}});
 try{await db.prepare('INSERT INTO portal_media (id,name,mime,size,created_by,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,mime,size,session.username,new Date().toISOString()).run()}catch(error){await bucket.delete(id);throw error}
 return Response.json({id,url:'/api/media/'+id,name,mime,size},{status:201,headers:{'Cache-Control':'no-store'}});
}
export async function mediaResponse(db,bucket,request){try{return await mediaRequest(db,bucket,request)}catch(e){return Response.json({error:e instanceof PortalError?e.message:'Soubor se nepodařilo uložit.'},{status:e instanceof PortalError?e.status:503,headers:{'Cache-Control':'no-store'}})}}
export async function mediaFile(bucket,id){
 if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Nenalezeno',{status:404});const object=await bucket.get(id);if(!object)return new Response('Nenalezeno',{status:404});
 const headers=new Headers({'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'self'",'Content-Disposition':'inline'});if(object.httpEtag)headers.set('ETag',object.httpEtag);return new Response(object.body,{headers});
}
