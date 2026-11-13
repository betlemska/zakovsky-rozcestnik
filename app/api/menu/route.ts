import { getPublicMenu } from "../../../lib/menu-parser.mjs";
export async function GET(){
 try{return Response.json(await getPublicMenu(),{headers:{"Cache-Control":"public, max-age=60, s-maxage=600"}})}
 catch(error){console.warn("Public school menu:",error instanceof Error?error.message:"fetch failed");return Response.json({error:"Dnešní nabídku nelze načíst."},{status:503,headers:{"Cache-Control":"no-store"}})}
}
