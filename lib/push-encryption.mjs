// RFC 8291 + RFC 8188, a single aes128gcm record using Web Crypto only.
const enc=new TextEncoder();
const join=(...arrays)=>{const out=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let i=0;for(const a of arrays){out.set(a,i);i+=a.length}return out};
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function hkdf(ikm,salt,info,length){const key=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8))}
export async function encryptPush(message,p256dh,auth){
 const plain=enc.encode(JSON.stringify(message));if(plain.length>3000)throw new Error('Push payload too large');
 const ua=decode(p256dh),secret=decode(auth);if(ua.length!==65||ua[0]!==4||secret.length!==16)throw new Error('Invalid push encryption keys');
 const keys=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']),as=new Uint8Array(await crypto.subtle.exportKey('raw',keys.publicKey));
 const peer=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]),shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:peer},keys.privateKey,256));
 const ikm=await hkdf(shared,secret,join(enc.encode('WebPush: info\0'),ua,as),32),salt=crypto.getRandomValues(new Uint8Array(16));
 const cek=await hkdf(ikm,salt,enc.encode('Content-Encoding: aes128gcm\0'),16),nonce=await hkdf(ikm,salt,enc.encode('Content-Encoding: nonce\0'),12);
 const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']),encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,tagLength:128},key,join(plain,new Uint8Array([2]))));
 const header=new Uint8Array(21);header.set(salt);new DataView(header.buffer).setUint32(16,4096);header[20]=65;return join(header,as,encrypted);
}
