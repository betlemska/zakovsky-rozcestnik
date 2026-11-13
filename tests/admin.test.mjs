import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {adminResponse,readContent,makeVerifier} from '../lib/portal-admin.mjs';
const sqlite=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
// Real SQLite behind the same prepared statement interface used by D1.
const db={prepare(sql){const stmt=sqlite.prepare(sql);let args=[];const query={bind(...a){args=a;return query},async first(){return stmt.get(...args)||null},async all(){return{results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return{meta:{changes:Number(r.changes)}}}};return query},async batch(list){sqlite.exec('BEGIN');try{const r=[];for(const q of list)r.push(await q.run());sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const initial='initial-test-password',next='replacement-test-password';const verifier=await makeVerifier(initial);
let ip=1;
function request(body,cookie='',origin='https://portal.test'){return new Request('https://portal.test/api/admin',{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json','x-portal-action':'1',origin}:{}),'cf-connecting-ip':String(ip),cookie},...(body?{body:JSON.stringify(body)}:{})})}
async function run(body,cookie,origin){return adminResponse(db,request(body,cookie,origin),verifier)}
assert.equal((await run()).status,200);assert.equal((await(await run()).json()).authenticated,false);
assert.equal((await run({action:'save',content:{},revision:0})).status,401);
assert.equal((await run({action:'login',username:'kubicek',password:initial},'','https://evil.test')).status,403);
assert.equal((await run({action:'login',username:'kubicek',password:'wrong'})).status,401);
assert.equal(sqlite.prepare('SELECT count(*) as n FROM portal_admins').get().n,0,'Bad login cannot bootstrap account');
const login=await run({action:'login',username:'kubicek',password:initial});assert.equal(login.status,200);
const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/^__Host-/);for(const flag of ['HttpOnly','Secure','SameSite=Strict'])assert.ok(setCookie.includes(flag));const cookie=setCookie.split(';')[0];
assert.equal((await(await run(undefined,cookie)).json()).authenticated,true);
const content={intro:'Pro 1.A',posts:[{id:'post-1',title:'Písemka',body:'<script>alert(1)</script>',date:'2026-11-03'}],links:[{label:'Škola',url:'https://www.betlemska.cz/'}],teacherNotes:{'karel-bernat':'Nezapomenout sešit.'}};
const saved=await run({action:'save',revision:0,content},cookie);assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
assert.equal((await readContent(db)).content.teacherNotes['karel-bernat'],'Nezapomenout sešit.','Shared data survives a new read without cookies');
assert.equal((await run({action:'save',revision:0,content},cookie)).status,409,'Stale editor cannot overwrite newer changes');
assert.equal((await run({action:'save',revision:1,content:{...content,links:[{label:'bad',url:'javascript:alert(1)'}]}},cookie)).status,400);
assert.equal((await run({action:'password',currentPassword:initial,newPassword:'short'},cookie)).status,400);
const second=await run({action:'login',username:'kubicek',password:initial});const secondCookie=second.headers.get('set-cookie').split(';')[0];
assert.equal((await run({action:'password',currentPassword:initial,newPassword:next},cookie)).status,200);
assert.equal((await(await run(undefined,cookie)).json()).authenticated,false);assert.equal((await(await run(undefined,secondCookie)).json()).authenticated,false,'Password change revokes every session');
assert.equal((await run({action:'login',username:'kubicek',password:initial})).status,401,'Bootstrap password cannot return after password change');
ip++;const relogin=await run({action:'login',username:'kubicek',password:next});assert.equal(relogin.status,200);const fresh=relogin.headers.get('set-cookie').split(';')[0];
assert.equal((await run({action:'logout'},fresh)).status,200);assert.equal((await run({action:'save',content,revision:1},fresh)).status,401,'Logout revokes the server session');
ip++;for(let n=0;n<10;n++)assert.equal((await run({action:'login',username:'kubicek',password:'wrong'})).status,401);assert.equal((await run({action:'login',username:'kubicek',password:next})).status,429,'Persistent rate limit rejects brute force');
ip++;const expiring=await run({action:'login',username:'kubicek',password:next});const expired=expiring.headers.get('set-cookie').split(';')[0];sqlite.prepare('UPDATE portal_sessions SET expires=0').run();assert.equal((await(await run(undefined,expired)).json()).authenticated,false);
export {db,sqlite,verifier};
console.log('Admin auth, CSRF, shared persistence, conflict, URL validation, password rotation, logout, expiration and brute-force checks passed.');
