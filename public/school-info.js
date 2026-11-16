/* Public school facts verified against the school's own contacts, 10 November 2026. */
(function(root){'use strict';
const facts={
 name:'Střední průmyslová škola strojnická, škola hlavního města Prahy',
 shortName:'SPŠS Betlémská',address:'Betlémská 287/4, 110 00 Praha 1 – Staré Město',
 ico:'70872589',redizo:'600004686',izo:'110032641',databox:'bjvybvf',
 phone:'+420 251 092 100',email:'info@betlemska.cz',secretariat:'sekretariat@betlemska.cz',deputies:'zb@betlemska.cz',director:'reditel@betlemska.cz',
 source:'https://www.betlemska.cz/kontakty/kontakty-spss-betlemska',verifiedOn:'10. 11. 2026'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const counselling={
 source:'https://www.betlemska.cz/pro-rodice/vychovne-poradenstvi-a-prevence/vychovny-poradce-a-metodik-prevence',
 verifiedOn:'16. 11. 2026',
 people:[
  {role:'Výchovná poradkyně',name:'Mgr. Jiřina Tellerová',teacherId:'jirina-tellerova',hours:'Pondělí 12:00–14:00',appointment:'nebo po dohodě',phone:'+420 251 092 128',mobile:'+420 737 596 229',email:'jirina.tellerova@betlemska.cz',topics:['Potíže s učením a náročné školní situace.','Volba dalšího studia a povolání, podpora nadaných žáků.','Konzultace pro žáky i rodiče a spolupráce s poradnou.']},
  {role:'Metodička prevence',name:'Mgr. Kateřina Týčová',teacherId:'katerina-tycova',hours:'Pátek 11:30–12:15',appointment:'nebo po dohodě',phone:'+420 251 092 159',email:'katerina.tycova@betlemska.cz',topics:['Vztahy ve třídě a potíže se začleněním do kolektivu.','Prevence rizikového chování a podpora při jeho řešení.','Zprostředkování pomoci odborného pracoviště.']},
  {role:'Psychoterapeutka',name:'JUDr. Ing. Romi Johansson',hours:'Středa od 13:00',appointment:'Termín si předem domluv telefonicky nebo e-mailem.',phone:'+420 602 243 311',email:'johanssonterapie@gmail.com',topics:['Individuální konzultace s psychoterapeutkou.','Pro sjednání setkání zavolej, napiš zprávu nebo e-mail.']}
 ]
};
function counsellingSection(){return `<section class="school-counselling" aria-labelledby="school-counselling-heading"><div class="section-head"><div><div class="eyebrow">PODPORA PRO ŽÁKY A RODIČE</div><h2 id="school-counselling-heading">Poradenství a prevence</h2></div></div><p class="subtle">Kontakty na školní poradenské pracoviště. Vyber, s čím potřebuješ pomoci, a domluv si konzultaci.</p><div class="school-counselling-grid">${counselling.people.map(person=>`<article class="panel counselling-card"><span class="eyebrow">${esc(person.role)}</span><h3>${esc(person.name)}</h3><div class="counselling-hours"><small>KONZULTAČNÍ HODINY</small><strong>${esc(person.hours)}</strong><span>${esc(person.appointment)}</span></div><ul>${person.topics.map(topic=>`<li>${esc(topic)}</li>`).join('')}</ul><div class="counselling-contacts"><a href="tel:${person.phone.replace(/\s/g,'')}">${esc(person.phone)}</a>${person.mobile?`<a href="tel:${person.mobile.replace(/\s/g,'')}">${esc(person.mobile)} <small>mobil</small></a>`:''}<a href="mailto:${esc(person.email)}">${esc(person.email)}</a></div>${person.teacherId?`<button type="button" class="text-link counselling-profile" data-teacher="${person.teacherId}">Profil a rozvrh vyučující ↗</button>`:''}</article>`).join('')}</div><p class="subtle counselling-source">Zdroj: <a class="text-link" href="${counselling.source}" target="_blank" rel="noopener noreferrer">Poradenské pracoviště na webu školy ↗</a> · ověřeno ${counselling.verifiedOn}. Konzultaci lze domluvit i mimo uvedené hodiny.</p></section>`}
function copyValue(key){
 if(key==='registration')return `${facts.name}\n${facts.address}\nIČO: ${facts.ico}\nREDIZO: ${facts.redizo}\nIZO: ${facts.izo}\nDatová schránka: ${facts.databox}\nWeb: https://www.betlemska.cz/`;
 return Object.hasOwn(facts,key)&&!['source','verifiedOn'].includes(key)?facts[key]:'';
}
async function copy(key,clipboard=root.navigator?.clipboard){
 const value=copyValue(key);if(!value||!clipboard?.writeText)return false;
 try{await clipboard.writeText(value);return true;}catch{return false;}
}
const copyButton=(key,label='Zkopírovat')=>`<button type="button" class="school-copy" data-school-copy="${key}" aria-label="${esc(label)}">${esc(label)}</button>`;
function render(){
 const ids=[['ico','IČO'],['redizo','REDIZO'],['izo','IZO'],['databox','Datová schránka']];
 const contacts=[['email','Obecné informace','Informace o škole a obecné dotazy.'],['secretariat','Sekretariát','Školní administrativa a potvrzení.'],['deputies','Zástupci ředitele','Organizace výuky a studijní záležitosti.'],['director','Ředitel školy','Kontakt na vedení školy.']];
 const links=[
  ['Kontakty školy',facts.source,'Úplné a aktuální kontaktní údaje.'],
  ['Vedení školy','https://www.betlemska.cz/kontakty/vedeni-skoly','Vedení, funkce a telefonní kontakty.'],
  ['Formuláře pro žáky','https://www.betlemska.cz/pro-studenty/formulare-pro-studenty','Žádosti a podklady ke studiu.'],
  ['Školní řád','https://www.betlemska.cz/pro-studenty/skolni-rad','Pravidla školy a aktuální dokumenty.'],
  ['Poradenství a prevence',counselling.source,'Kontakty na školní poradenské pracoviště.'],
  ['Odborné soutěže','https://www.betlemska.cz/odborne-souteze','Informace o reprezentaci školy a soutěžích.']
 ];
 return `<section class="panel school-name-panel" aria-labelledby="school-name-heading"><div class="eyebrow">DO PREZENTACÍ A SOUTĚŽNÍCH PŘIHLÁŠEK</div><h2 id="school-name-heading">Plný název školy</h2><p class="school-official-name">${esc(facts.name)}</p><div class="school-copy-actions">${copyButton('name','Zkopírovat název školy')}${copyButton('registration','Zkopírovat údaje do přihlášky')}</div><p class="subtle">Oficiální název podle kontaktů školy. Krátké označení: <strong>${facts.shortName}</strong>.</p></section>
 <div class="school-info-grid"><section class="panel"><h2>Adresa a telefon</h2><address class="school-address">${esc(facts.address)}</address><div class="school-copy-actions">${copyButton('address','Zkopírovat adresu')}</div><p><strong>Ústředna:</strong> <a class="text-link" href="tel:+420251092100">${facts.phone}</a></p><a class="text-link" href="https://www.betlemska.cz/" target="_blank" rel="noopener noreferrer">Oficiální web školy ↗</a></section>
 <section class="panel"><h2>Identifikační údaje</h2><dl class="school-identifiers">${ids.map(([key,label])=>`<div><dt>${label}</dt><dd><span>${facts[key]}</span>${copyButton(key,'Zkopírovat '+label)}</dd></div>`).join('')}</dl></section></div>
 <section class="school-contact-section"><h2>Kam napsat</h2><div class="school-contact-grid">${contacts.map(([key,label,description])=>`<article class="panel"><h3>${label}</h3><p class="subtle">${description}</p><a class="school-email" href="mailto:${facts[key]}">${facts[key]}</a>${copyButton(key,'Zkopírovat e-mail · '+label)}</article>`).join('')}</div></section>
 ${counsellingSection()}
 <section class="school-links-section"><h2>Důležité odkazy</h2><div class="school-useful-grid">${links.map(([label,url,description])=>`<a class="panel school-useful-link" href="${url}" target="_blank" rel="noopener noreferrer"><h3>${label} ↗</h3><p class="subtle">${description}</p></a>`).join('')}</div></section>
 <p class="subtle school-info-source">Zdroj: <a class="text-link" href="${facts.source}" target="_blank" rel="noopener noreferrer">oficiální kontakty SPŠS Betlémská ↗</a> · ověřeno ${facts.verifiedOn}. Aktuální změny vždy potvrzuje škola.</p>`;
}
const api={facts,counselling,copyValue,copy,render};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaSchoolInfo=api;
})(typeof window!=='undefined'?window:globalThis);
