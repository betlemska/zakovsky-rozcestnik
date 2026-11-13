import { fetchLatestArticle } from '../../../lib/school-news.mjs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    return Response.json(await fetchLatestArticle(),{headers:{'Cache-Control':'public, max-age=300, s-maxage=300'}});
  } catch {
    return Response.json({error:'Školní aktuality se nepodařilo načíst.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
