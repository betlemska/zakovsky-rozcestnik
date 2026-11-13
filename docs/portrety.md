# Úprava portrétů

Režim: vestavěný Imagegen, editace dodaných fotografií se zachováním identity.

Výstupy: osm PNG ve složce assets/portraits, rozměr 1254 × 1254 pixelů, průhledné rohy a kruhový výřez. Web navíc ořezává přesný kruh přes CSS.

Základní zadání: vytvořit ostrý fotografický avatar, těsný kruhový výřez hlavy se zachováním vlasů, uší a brady, bez trupu a dalších osob; zlepšit expozici, kompresní šum a ostrost; zachovat osobu, věk, proporce obličeje, původní pózu, výraz, brýle a zakrytí obličeje; bez zkrášlování, změny úhlu hlavy, nápisů, rámečku a vodoznaku.

Specifická omezení:
- Lubomír Martinec: bílé vlasy, vousy a obdélníkové brýle, zachovat původní výraz.
- Lucie Asali: původní úsměv, zrzavé vlasy a sluneční brýle na hlavě.
- Ladislav Trnka: vybrat vyučujícího u tabule, zachovat zelenou roušku přes nos a ústa; nevytvářet odkrytou spodní polovinu tváře.
- Karel Bernat: původní sklon hlavy dolů a černé obdélníkové brýle.
- Pavel Pokorný: vybrat muže v modré kostkované košili, vynechat sousední osobu.
- Zdeněk Kouřil: zachovat černobílou fotografii a boční profil při pohledu vlevo.
- Jakub Petrák: zachovat směr pohledu, drobný úsměv, krátké vousy.
- Martin Theimer: zachovat brýle, úsměv a úhel obličeje.

## Doplnění 3. listopadu 2026

Pět nových fotografických kruhových avatarů je v `public/assets/portraits/` (v exportu GitHub Pages `assets/portraits/`):

- `vladislav-liszok-20261103.webp`: dospělý muž z fotografie s koblihami, přiřazení podle uživatele.
- `miloslav-balek-20261103.webp`: dospělý muž vlevo v zeleném, dítě i okolí vynechány.
- `martin-vyroubal-20261103.webp`: prostřední muž s brýlemi z dodané skupinové fotografie.
- `ondrej-ruzicka-20261103.webp`: muž v kostkované košili u vody.
- `michal-prutyszyn-20261103.webp`: portrét v obleku.

Režim: editace referenčních fotografií pomocí Imagegen, zachování identity a výrazu, mírná obnova ostrosti, těsný kruhový výřez hlavy. Nejde o ověřenou rekonstrukci ztracených detailů. Webové výstupy mají 512 × 512 px, průhledné rohy a WebP kompresi; původní nové velké PNG nejsou součástí webu. Sada promptů je v `portrait-prompts-20261103.json`.

Dvě nové ilustrace `alien-boy.webp` a `alien-girl.webp` slouží jako náhradní obrázky profilů bez fotografie. Jde o šedomodré mimozemské postavičky, ne fotografie osob. Varianta je nastavitelná v administraci.

Bálek má kontaktní profil podle dodaného telefonního seznamu školy 2026/2027 (Mgr. Miloslav Bálek, BA, kabinet 18, linka 141); rozvrh nebyl dodán. Web tedy obsahuje 20 profilů a 19 dodaných rozvrhů.

Růžičkův medailonek vychází z oficiálních výsledků komunálních voleb 2026 na webu Praha 4: https://tucnak.praha4.cz/11-2026/vysledky-komunalnich-voleb-2026 . Odkaz na kontaktní profil je dodaný uživatelem. Facebook odkaz je označen jako dodaná fotografie, jeho obsah ani vlastnictví nebylo ověřeno.

Video Martina Theimera bylo 10. 11. 2026 na žádost správce odstraněno z profilu i dodávaných souborů. Jednorázová migrace odstraní i dříve uložený odkaz v CMS; fotografie, rozvrh a další údaje zůstávají zachované.

## Doplnění rozvrhu a portrétu Červinky · 3. 11. 2026

`public/assets/portraits/ondrej-cervinka-20261103.webp` je kruhový portrét upravený z dodaného `IMG_3874.jpeg` pomocí Imagegen se zachováním identity, sklonu hlavy, brýlí, vousů a výrazu. WebP má 512 × 512 px a průhledné rohy; prompt je doplněný do JSON manifestu. Web nyní obsahuje 14 fotografických portrétů.

Bálkův rozvrh je nově přepsaný z `IMG_3872.jpeg` (platnost od 12. 10. 2026) a originál je na webu jako `assets/miloslav-balek-rozvrh.jpeg`: 18 hodin TEV, Po/Út/Čt 1.–6. hodina, včetně skupin a sportovišť TEV1/TEV2. Dohled ve 2. patře: Po před 1. hodinou, Út a Čt před 3. hodinou. Všech 20 profilů nyní má dodaný rozvrh.

Aktuální chování Theimerova videa nahrazuje předchozí popis: žádné přehrávání při najetí; po otevření profilu tři přehrání se zvukem a hlasitostí přehrávače 100 %. Přehrávač neovládá systémovou hlasitost. Po třetím přehrání se zastaví; zavření profilu zastaví i rozehranou sérii. V případě blokování automatického přehrání jsou dostupná běžná ovládací tlačítka.

## Miriam Humeová a Hynek Petroš · 3. 11. 2026

Dva nové kruhové portréty jsou v `public/assets/portraits/miriam-humeova-20261103.webp` a `public/assets/portraits/hynek-petros-20261103.webp`, v exportu bez prefixu public/. Režim: vestavěný Imagegen, editace dodaných fotografií se zachováním identity, pohledu a výrazu. Výstupy mají 1024 × 1024 px, WebP kvalitu 95 a průhledné rohy. Šedé pozadí sjednocuje školní adresář. Zlepšení ostrosti neznamená ověřenou rekonstrukci původních ztracených detailů. Manifest promptů je v portraits-humeova-petros-20261103.json.

Facebook https://www.facebook.com/hynek.petros.5 byl přidán podle zadání uživatele; jeho vlastnictví nebylo nezávisle ověřováno. Celkem je na webu 16 fotografických portrétů.

## Jiří Götz a Andrea Pavlová · 3. 11. 2026

Dva další kruhové portréty jsou v `public/assets/portraits/jiri-gotz-20261103.webp` a `public/assets/portraits/andrea-pavlova-20261103.webp`. Editace dodaných fotografií pomocí vestavěného Imagegen zachovává identitu, původní úsměv a účes Jiřího Götze, u Andrey Pavlové také sluneční brýle, náušnice a úhel hlavy. Výstupy mají 1024 × 1024 px, WebP kvalitu 95, šedé pozadí uvnitř kruhu a průhledné rohy. Jde o jemné vyčištění a obnovení ostrosti, nikoli o ověřenou rekonstrukci ztracených detailů. Přesné prompty jsou v portraits-gotz-pavlova-20261103.json.

Facebook https://www.facebook.com/jiri.gotz je přidaný podle zadání uživatele; vlastnictví profilu nebylo nezávisle ověřováno. Web nyní obsahuje 18 fotografických portrétů z 20 vyučujících. Nová jednorázová aktualizace zachovává předchozí změny administrátora u ostatních profilů; po uplatnění zůstávají i nové profily dále upravitelné ve správě.

## Radka Štefaňáková · 4. 11. 2026

Portrét `public/assets/portraits/radka-stefanakova-20261104.webp` je upravený z dodané fotografie pomocí Imagegen se zachováním výrazu, věku a původního pohledu. Plyšové hračky a okolí jsou nahrazeny šedým pozadím. Kruhový WebP má 1024 × 1024 px, kvalitu 95 a průhledné rohy. Jde o zlepšení čitelnosti fotografie, nikoli ověřenou rekonstrukci ztracených detailů. Přesný prompt je v portrait-radka-20261104.json. Celkem 19 fotografických portrétů; Barbora Pivoňková má nadále náhradní ilustraci.

## Nová fotografie Karla Bernata – 4. listopadu 2026

`assets/portraits/karel-bernat-20261104.png` je kruhový portrét s průhlednými rohy, upravený vestavěným Imagegen z nové fotografie IMG_3891.jpeg. Zadání je v `portrait-bernat-20261104.json`: zesvětlit protisvětlo, neutralizovat barvy, jemně obnovit detail a zachovat věk, výraz, brýle i předklon hlavy. Portrét používá seznam, detail, oblíbení, sváteční přání a správa. Verze média `2026-11-04b` jednorázově aktualizuje pouze Karla a přidá dodaný Instagram; poznámky, ostatní profily a následné úpravy správce zůstávají zachované.

Veřejné odkazy používají tři SVG ikony podle skutečné HTTPS adresy: Facebook, Instagram a web (zeměkoule). Ikony se zobrazují v seznamu a detailu; ve správě je živý náhled při úpravě adresy. Chybějící účty se nevymýšlejí.
