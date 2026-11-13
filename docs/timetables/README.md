# Podklady pro celou školu · 13. 11. 2026

Dodaný Archiv.zip obsahuje 24 fotografií IMG_4023–IMG_4046. Ruční přepis zahrnuje 20 tříd (1.–4. ročník A, B, C, I, L), 56 vyučujících a 1089 třídních záznamů. Společné semináře jsou v učitelských rozvrzích sloučené do 1033 záznamů se seznamem tříd.

Každá třída má `public/assets/classes/<třída>/schedule.json` . Každý učitel má `public/assets/teachers/<id>/profile.json`; Původní fotografie se nezveřejňují.

## Opakovatelný import

`classes-2026-11-13.txt` je kontrolovaný ruční přepis. Pět řádků každé třídy znamená pondělí až pátek, deset sloupců nejvýše deset hodin. `_` je prázdná hodina, `*` opakování předchozího políčka a `&` souběžná skupina. Záznam má formát `předmět:kód učitele:učebna[:skupina[:even|odd]]`. `PJ+LV` znamená společnou výuku.

```sh
python3 tools/import-school-timetables.py
python3 tools/embed-data.py
npm test
npm run build
```

Třídní fotografie 1.L, 2.B a 3.L jsou novější, s platností od 2. 11. 2026; ostatní od 12. 10. 2026. Novější třídní podklad má přednost před starším učitelským. Střídání týdnů používá číslo ISO týdne. Kontakty pocházejí z přiloženého školního telefonního seznamu 2026/2027; u nových učitelů nejsou zveřejněny odhadnuté e-mailové adresy ani vymyšlené portréty.

## Ověřená společná výuka

Správce upřesnil, že páteční 1. a 2. hodina tělocviku spojuje polovinu 1.A (skupina 2/2) a polovinu 1.C (skupina 1/2). Obě poloviny společně vedou Jakub Petrák a Vladislav Liszok. Každá třída zachovává své označení skupiny a původní údaj o tělocvičně, oba učitelé jsou uvedeni u obou polovin. Jde o společnou výuku, nikoli konflikt.

Ve veřejném vydání nejsou původní fotografie rozvrhů, staré rozvrhové PDF ani podkladové fotografie učitelů. Zachovány jsou profilové portréty a strukturovaná data interaktivních rozvrhů. Každá třída má také označení předsedy a zástupce.
