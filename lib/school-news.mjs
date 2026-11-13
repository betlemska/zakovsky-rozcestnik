const feed = 'https://www.betlemska.cz/aktuality?format=feed&type=rss';
const entities = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' '};
function plain(value) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/<[^>]*>/g,' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, key) => {
      if (key[0] !== '#') return entities[key.toLowerCase()] || '';
      const n = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2),16) : Number(key.slice(1));
      return n <= 0x10ffff ? String.fromCodePoint(n) : '';
    }).replace(/\s+/g,' ').trim();
}
export function latestArticle(xml) {
  const items = [];
  for (const [,item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const field = name => plain(item.match(new RegExp('<'+name+'>([\\s\\S]*?)</'+name+'>','i'))?.[1] || '');
    let url;
    try { url = new URL(field('link'),feed); } catch { continue; }
    if (!['https://www.betlemska.cz','https://betlemska.cz'].includes(url.origin) || !url.pathname.startsWith('/aktuality/')) continue;
    const title=field('title'), timestamp=Date.parse(field('pubDate'));
    if (!title || !Number.isFinite(timestamp)) continue;
    const description=field('description');
    const excerpt=description.length>175 ? description.slice(0,175).replace(/\s+\S*$/,'')+'…' : description;
    items.push({title,excerpt,url:url.href,date:new Date(timestamp).toISOString()});
  }
  if (!items.length) throw Error('No school news items');
  return items.sort((a,b)=>b.date.localeCompare(a.date))[0];
}
export async function fetchLatestArticle() {
  const response=await fetch(feed,{headers:{Accept:'application/rss+xml, application/xml'},signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw Error('School feed unavailable');
  return latestArticle(await response.text());
}
